// Sends what visitors do on this website to the analytics backend, as Photo Location Map sends
// what is done in the app. Loaded by the landing page and the Windows download page after
// download.js, each saying which page it is in data-page. Google Analytics is loaded separately.
//
// Every event goes with the browser's ID (kept in localStorage, so it counts browsers, not
// people), the tab's session (kept in sessionStorage, so a visit that goes on to the Windows
// page is one session), and the page load it belongs to. The version this website offers for
// download is sent as the app version.
//
// Events are sent 1 second after the first one queued, together with those queued by then, with
// fetch's keepalive, so that a request made as the page goes away still arrives. What is not
// sent when the page is hidden is kept in localStorage and sent from the next page load; an
// event sent twice that way is told apart by its ID.
(() => {
  // prod for the published website only. Served from this repository on a local server (for
  // example `python3 -m http.server 8080 --directory docs`), it sends to dev.
  const endpoint = location.hostname === 'tomoyukiaota.github.io'
    ? 'https://collect-prod.analytics.photo-location-map.tomoyukiaota.com/landing-page/v1/events'
    : 'https://collect-dev.analytics.photo-location-map.tomoyukiaota.com/landing-page/v1/events';

  // The analytics backend needs the SHA-256 of each request's body, which needs a secure context.
  if (!window.fetch || !window.crypto || !window.crypto.subtle || !window.TextEncoder) return;

  const category = 'Landing Page';
  const page = (document.currentScript && document.currentScript.dataset.page) || 'landing';

  const storageKeys = {
    userId: 'PhotoLocationMapAnalyticsUserId',
    session: 'PhotoLocationMapAnalyticsSession',
    unsentEvents: 'PhotoLocationMapAnalyticsUnsentEvents',
  };

  const sendDelayMs = 1_000;
  const maxBatchEvents = 500; // The most the analytics backend takes in one request.
  const maxBatchBytes = 60 * 1024; // keepalive allows 64 KiB, counted over all such requests in flight.
  const maxQueuedEvents = 1_000;
  const maxKeptEvents = 200;
  const initialRetryDelayMs = 5_000;
  const maxRetryDelayMs = 300_000;

  const randomUuid = () => {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    // Older browsers: version 4 from random bytes.
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  };

  // Reading window.localStorage throws where the browser blocks storage.
  const storageOf = (name) => {
    try {
      return window[name] || undefined;
    } catch {
      return undefined;
    }
  };

  const userId = (() => {
    const storage = storageOf('localStorage');
    try {
      const saved = storage && storage.getItem(storageKeys.userId);
      if (saved) return saved;
      const id = randomUuid();
      if (storage) storage.setItem(storageKeys.userId, id);
      return id;
    } catch {
      return randomUuid(); // Storage that cannot be used: an ID for this page load only.
    }
  })();

  // The tab's session and the number of its next event, which go on across both pages.
  const session = (() => {
    const storage = storageOf('sessionStorage');
    let state = null;
    try {
      state = JSON.parse((storage && storage.getItem(storageKeys.session)) || 'null');
    } catch {
      state = null;
    }
    if (!state || typeof state.id !== 'string' || !Number.isSafeInteger(state.seq) || state.seq < 0)
      state = { id: randomUuid(), seq: 0 };
    return {
      id: state.id,
      nextSeq: () => {
        const seq = state.seq++;
        try {
          if (storage) storage.setItem(storageKeys.session, JSON.stringify(state));
        } catch {
          // This page load goes on counting.
        }
        return seq;
      },
    };
  })();

  const pageLoadId = randomUuid();

  // The OS and its version, guessed from the User-Agent, which is all a web page can tell. iPhones
  // and iPads say "like Mac OS X", and Android says "Linux", so those are looked for first.
  // macOS's version is frozen at 10.15.7 by Safari and Chrome.
  const { os, osRelease } = ((userAgent) => {
    const versionOf = (match) => (match && match[1] && match[1].replace(/_/g, '.')) || 'unknown';
    if (/iPhone|iPad|iPod/.test(userAgent)) return { os: 'ios', osRelease: versionOf(userAgent.match(/OS (\d+[_\d]*)/)) };
    if (/Android/.test(userAgent)) return { os: 'android', osRelease: versionOf(userAgent.match(/Android (\d+(?:\.\d+)*)/)) };
    if (/Windows NT/.test(userAgent)) return { os: 'windows', osRelease: versionOf(userAgent.match(/Windows NT (\d+\.\d+)/)) };
    if (/CrOS/.test(userAgent)) return { os: 'chromeos', osRelease: 'unknown' };
    if (/Mac OS X/.test(userAgent)) return { os: 'macos', osRelease: versionOf(userAgent.match(/Mac OS X (\d+[_.\d]*)/)) };
    if (/Linux/.test(userAgent)) return { os: 'linux', osRelease: 'unknown' };
    return { os: 'unknown', osRelease: 'unknown' };
  })(navigator.userAgent);

  // The version download.js offers, as it is loaded before this script.
  const appVersion = () => (typeof version === 'string' ? version : 'unknown');

  // Sending. A batch failing with a network error, 429 or 5xx is retried with exponential backoff;
  // one failing with any other status would fail again, so it is dropped.
  let queue = [];
  let inFlight = [];
  let timer;
  let retryDelayMs = 0;

  const utf8Bytes = (text) => new TextEncoder().encode(text).length;

  const sha256Hex = async (text) => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  };

  const post = async (events) => {
    const body = JSON.stringify({ schema_version: 1, events });
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // This header is why navigator.sendBeacon, which cannot set one, is not used.
        'x-amz-content-sha256': await sha256Hex(body),
      },
      body,
      keepalive: utf8Bytes(body) <= 64 * 1024,
    });
    return response.status;
  };

  const takeBatch = () => {
    let count = 0;
    let bytes = 0;
    for (const event of queue) {
      const eventBytes = utf8Bytes(JSON.stringify(event)) + 1;
      if (count === maxBatchEvents || (count > 0 && bytes + eventBytes > maxBatchBytes)) break;
      count++;
      bytes += eventBytes;
    }
    return queue.splice(0, count);
  };

  const cancelTimer = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  const startTimer = (delayMs) => {
    timer = setTimeout(() => {
      timer = undefined;
      send();
    }, delayMs);
  };

  const scheduleSend = () => {
    // While a request is in flight, send() schedules the next one when it ends; while backing off,
    // the retry timer sends.
    if (inFlight.length > 0 || retryDelayMs > 0 || queue.length === 0) return;
    if (timer === undefined) startTimer(sendDelayMs);
  };

  const send = async () => {
    if (inFlight.length > 0 || queue.length === 0) return;
    const batch = takeBatch();
    const isCutShort = queue.length > 0;
    inFlight = batch;
    let retry;
    try {
      const status = await post(batch);
      retry = status === 429 || status >= 500;
    } catch {
      retry = true;
    }
    inFlight = [];
    if (retry) {
      queue.unshift(...batch);
      retryDelayMs = retryDelayMs === 0 ? initialRetryDelayMs : Math.min(retryDelayMs * 2, maxRetryDelayMs);
      cancelTimer();
      startTimer(retryDelayMs);
      return;
    }
    retryDelayMs = 0;
    if (isCutShort) send();
    else scheduleSend(); // Events queued while the request was in flight.
  };

  // Sends what is queued without waiting for the timer, as the page may be about to close.
  const sendNow = () => {
    if (inFlight.length > 0 || retryDelayMs > 0 || queue.length === 0) return;
    cancelTimer();
    send();
  };

  const add = (...events) => {
    queue.push(...events);
    if (queue.length > maxQueuedEvents) queue = queue.slice(-maxQueuedEvents);
    scheduleSend();
  };

  // What is not sent when the page is hidden, kept for the next page load, as the page may be
  // closed while it is hidden and a request it starts then may not finish.
  const keepUnsent = () => {
    const storage = storageOf('localStorage');
    const events = [...inFlight, ...queue].slice(-maxKeptEvents);
    try {
      if (!storage) return;
      if (events.length === 0) storage.removeItem(storageKeys.unsentEvents);
      else storage.setItem(storageKeys.unsentEvents, JSON.stringify(events));
    } catch {
      // Storage that is full or cannot be used: the events are sent if the page stays.
    }
  };

  const removeKept = () => {
    try {
      const storage = storageOf('localStorage');
      if (storage) storage.removeItem(storageKeys.unsentEvents);
    } catch {
      // Nothing to do.
    }
  };

  const takeKept = () => {
    try {
      const storage = storageOf('localStorage');
      const saved = storage && storage.getItem(storageKeys.unsentEvents);
      if (storage) storage.removeItem(storageKeys.unsentEvents);
      const events = saved ? JSON.parse(saved) : [];
      return Array.isArray(events) ? events : [];
    } catch {
      return [];
    }
  };

  const track = (action, fields) => {
    add({
      event_id: randomUuid(),
      user_id: userId,
      session_id: session.id,
      seq: session.nextSeq(),
      client_ts: new Date().toISOString(),
      app_version: appVersion(),
      os,
      os_release: osRelease,
      category,
      action,
      // Every event says which page and which load of it; JSON leaves out fields that are undefined.
      label: JSON.stringify({ page, pageLoadId, ...fields }),
      value: null,
    });
    // An event of a hidden page is kept and sent at once.
    if (document.visibilityState === 'hidden') {
      keepUnsent();
      sendNow();
    }
  };

  // How long the page has been visible, and how far down it has been seen.
  let visibleMs = 0;
  let visibleSince = document.visibilityState === 'visible' ? 0 : null;
  let maxScrollPercent = 0;
  const updateScroll = () => {
    const height = document.documentElement.scrollHeight;
    if (height > 0)
      maxScrollPercent = Math.max(maxScrollPercent, Math.min(100, Math.round(((window.scrollY + window.innerHeight) / height) * 100)));
  };

  // Sent each time the page is hidden: switched away from, left or closed. The last one of a page
  // load is how long it was used. Safari before 14.1 fires only pagehide when the page is left.
  let isHiddenTracked = false;
  const handleHidden = () => {
    if (isHiddenTracked) return;
    isHiddenTracked = true;
    const now = performance.now();
    if (visibleSince !== null) {
      visibleMs += now - visibleSince;
      visibleSince = null;
    }
    track('Page Hidden', {
      secondsSinceLoad: Math.round(now / 1000),
      visibleSeconds: Math.round(visibleMs / 1000),
      maxScrollPercent,
    });
    keepUnsent();
    sendNow();
  };
  const handleShown = () => {
    isHiddenTracked = false;
    if (visibleSince === null) visibleSince = performance.now();
    removeKept(); // The queue sends them while the page stays.
  };

  // The buttons and links this script records say so in data-analytics-download (the OS) and
  // data-analytics-link (what the link is). A middle click opens a link too.
  const handleClick = (event) => {
    if (event.type === 'auxclick' && event.button !== 1) return;
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('[data-analytics-download]');
    if (button) track('Clicked Download Button', { os: button.getAttribute('data-analytics-download') });
    const link = event.target.closest('a[data-analytics-link]');
    if (link) track('Opened Link', { url: link.href, what: link.getAttribute('data-analytics-link') });
  };

  const timeZone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return undefined;
    }
  };

  window.PhotoLocationMapAnalytics = {
    // Called by download.js as a download starts. trigger is what started it: 'button' (the
    // macOS button), 'page' (the Windows page as it loads) or 'link' (its link to start again).
    trackStartedDownload: (downloadOs, trigger) => track('Started Download', { os: downloadOs, version: appVersion(), trigger }),
  };

  add(...takeKept());
  updateScroll();
  window.addEventListener('scroll', updateScroll, { passive: true });
  document.addEventListener('visibilitychange', () => (document.visibilityState === 'hidden' ? handleHidden() : handleShown()));
  window.addEventListener('pagehide', handleHidden);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('auxclick', handleClick, true);

  const connection = navigator.connection;
  track('Page Loaded', {
    // The address's query string, without "?": where a campaign link says where it was posted.
    query: location.search.slice(1, 513) || undefined,
    // Browsers send only the origin of another site by default, so this is rarely more than that.
    referrer: document.referrer.slice(0, 512) || undefined,
    language: navigator.language,
    languages: navigator.languages ? [...navigator.languages] : undefined,
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    devicePixelRatio: window.devicePixelRatio,
    timeZone: timeZone(),
    colorScheme: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    maxTouchPoints: navigator.maxTouchPoints,
    // Not in every browser.
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
    connection: connection
      ? { effectiveType: connection.effectiveType, downlink: connection.downlink, rtt: connection.rtt, saveData: connection.saveData }
      : undefined,
  });
})();
