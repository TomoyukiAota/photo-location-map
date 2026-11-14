// Shows this website in the visitor's language. Loaded in the head of the landing page and of the Windows download
// page, before their content, so that a page in another language than English is not seen in English first.
//
// The texts of a language are in locales/<code>.json, with the keys of locales/en.json. An element gets its text by
// the key in its data-i18n attribute, and an attribute by the key in data-i18n-alt, data-i18n-content,
// data-i18n-aria-label or data-i18n-placeholder. In a text, <link>…</link> is around the words of the element's link.
// The pages themselves hold the English texts, which stay when a language's file cannot be fetched, as when a page is
// opened from a disk; a test checks that they are those of en.json (test/website/website-texts.mjs).
//
// The language is, in this order: `lang` in the address (?lang=ja), which the links for search engines have; the one
// chosen in the page's language picker before, which localStorage keeps; the first of the browser's languages that
// this website has; English. The picker's first entry, "Use browser setting", forgets the first two, so that the page
// follows the browser again.
(() => {
  // The languages of this website, which are the application's (src-shared/i18n/languages.ts), in its order: the names
  // in Latin letters by the alphabet, then those in other scripts. Each is under its own name, with its English name,
  // which the search of the list finds it by too. `rtl` is for a language written from right to left, which the page
  // is then laid out in. To add one, add its file to locales/ and its line here (docs/TRANSLATING.md). A test checks
  // that these are languages of the application, in its order and under its names (test/website/website-texts.mjs).
  const languages = [
    { code: 'id', name: 'Bahasa Indonesia', englishName: 'Indonesian' },
    { code: 'ms', name: 'Bahasa Melayu', englishName: 'Malay' },
    { code: 'ca', name: 'Català', englishName: 'Catalan' },
    { code: 'cs', name: 'Čeština', englishName: 'Czech' },
    { code: 'da', name: 'Dansk', englishName: 'Danish' },
    { code: 'de', name: 'Deutsch', englishName: 'German' },
    { code: 'et', name: 'Eesti', englishName: 'Estonian' },
    { code: 'en', name: 'English', englishName: 'English' },
    { code: 'es', name: 'Español', englishName: 'Spanish' },
    { code: 'eu', name: 'Euskara', englishName: 'Basque' },
    { code: 'fr', name: 'Français', englishName: 'French' },
    { code: 'gl', name: 'Galego', englishName: 'Galician' },
    { code: 'hr', name: 'Hrvatski', englishName: 'Croatian' },
    { code: 'it', name: 'Italiano', englishName: 'Italian' },
    { code: 'lv', name: 'Latviešu', englishName: 'Latvian' },
    { code: 'lt', name: 'Lietuvių', englishName: 'Lithuanian' },
    { code: 'hu', name: 'Magyar', englishName: 'Hungarian' },
    { code: 'nl', name: 'Nederlands', englishName: 'Dutch' },
    { code: 'nb', name: 'Norsk bokmål', englishName: 'Norwegian Bokmål' },
    { code: 'pl', name: 'Polski', englishName: 'Polish' },
    { code: 'pt-BR', name: 'Português (Brasil)', englishName: 'Portuguese (Brazil)' },
    { code: 'pt-PT', name: 'Português (Portugal)', englishName: 'Portuguese (Portugal)' },
    { code: 'ro', name: 'Română', englishName: 'Romanian' },
    { code: 'sk', name: 'Slovenčina', englishName: 'Slovak' },
    { code: 'sl', name: 'Slovenščina', englishName: 'Slovenian' },
    { code: 'sr-Latn', name: 'Srpski (latinica)', englishName: 'Serbian (Latin)' },
    { code: 'fi', name: 'Suomi', englishName: 'Finnish' },
    { code: 'sv', name: 'Svenska', englishName: 'Swedish' },
    { code: 'vi', name: 'Tiếng Việt', englishName: 'Vietnamese' },
    { code: 'tr', name: 'Türkçe', englishName: 'Turkish' },
    { code: 'el', name: 'Ελληνικά', englishName: 'Greek' },
    { code: 'bg', name: 'Български', englishName: 'Bulgarian' },
    { code: 'ru', name: 'Русский', englishName: 'Russian' },
    { code: 'uk', name: 'Українська', englishName: 'Ukrainian' },
    { code: 'he', name: 'עברית', englishName: 'Hebrew', rtl: true },
    { code: 'ar', name: 'العربية', englishName: 'Arabic', rtl: true },
    { code: 'hi', name: 'हिन्दी', englishName: 'Hindi' },
    { code: 'th', name: 'ไทย', englishName: 'Thai' },
    { code: 'ko', name: '한국어', englishName: 'Korean' },
    { code: 'ja', name: '日本語', englishName: 'Japanese' },
    { code: 'zh-Hans', name: '简体中文', englishName: 'Chinese (Simplified)' },
    { code: 'zh-Hant', name: '繁體中文', englishName: 'Chinese (Traditional)' },
  ];
  const defaultLanguage = 'en';
  const storageKey = 'PhotoLocationMapWebsiteLanguage';

  /** The code of the list for a code however its case is written, or null. */
  const listed = (code) => languages.find((language) => language.code.toLowerCase() === code.toLowerCase())?.code ?? null;

  /**
   * The code of the list for a language that the list has under another code than its own, from the subtags of a tag
   * in lower case, or null, as the application has it (src-shared/i18n/resolve-language.ts): Chinese is listed by its
   * script, Portuguese by its region, Norwegian as Bokmål and Serbian in Latin letters.
   */
  const listedUnderAnotherCode = ([language, ...rest]) => {
    switch (language) {
      case 'zh':
        return rest.some((subtag) => ['tw', 'hk', 'mo'].includes(subtag)) ? 'zh-Hant' : 'zh-Hans';
      case 'pt':
        return rest.length === 0 || rest.includes('br') ? 'pt-BR' : 'pt-PT';
      case 'no':
      case 'nn':
        return 'nb';
      case 'sr':
        return 'sr-Latn';
      default:
        return null;
    }
  };

  /**
   * The language of this website that a list of language tags asks for, the first that it has, or null. A tag is
   * matched as it is (pt-BR, zh-Hant), then without its last part, again and again (ja-JP is ja), then as a language
   * that the list has under another code (zh-TW, no), without regard to case.
   */
  const matchLanguage = (tags) => {
    for (const tag of tags) {
      if (typeof tag !== 'string') continue;
      const subtags = tag.toLowerCase().split('-');
      for (let length = subtags.length; length > 0; length--) {
        const code = listed(subtags.slice(0, length).join('-'));
        if (code) return code;
      }
      const otherCode = listedUnderAnotherCode(subtags);
      if (otherCode && listed(otherCode)) return listed(otherCode);
    }
    return null;
  };

  /** The language to show a page in, from the address, the choice kept from before, and the browser's languages. */
  const resolveLanguage = ({ param, saved, browserLanguages }) =>
    matchLanguage([param]) ?? matchLanguage([saved]) ?? matchLanguage(browserLanguages ?? []) ?? defaultLanguage;

  /**
   * Whether the page follows the browser's language, which the picker's first entry, "Use browser setting", stands
   * for: neither the address nor a choice kept from before asks for a language that this website has.
   */
  const followsBrowser = ({ param, saved }) => !matchLanguage([param]) && !matchLanguage([saved]);

  /** The parts of a text around {{language}}, where the name of a language goes, or the text alone without one. */
  const languageParts = (text) => {
    const at = text.indexOf('{{language}}');
    return at === -1 ? { before: text, after: '' } : { before: text.slice(0, at), after: text.slice(at + '{{language}}'.length) };
  };

  /** The parts of a text around and inside <link>…</link>, or the text alone when it has no such tag. */
  const linkParts = (text) => {
    const match = /^([\s\S]*?)<link>([\s\S]*?)<\/link>([\s\S]*)$/.exec(text);
    return match ? { before: match[1], inside: match[2], after: match[3] } : { before: text, inside: null, after: '' };
  };

  /** The text of a key such as `landing.summary` in the texts of a language. */
  const textOf = (texts, key) => key.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), texts);

  /** A text as the search compares it: in lower case and without diacritics, so that "cestina" finds "Čeština". */
  const foldForSearch = (text) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  /** Whether what is typed in the search field is in any part of one of these texts, or nothing is typed. */
  const searchFinds = (texts, search) => {
    const sought = foldForSearch(search.trim());
    return !sought || texts.some((text) => foldForSearch(text).includes(sought));
  };

  /**
   * Whether a language is listed for what is typed in the search field: any part of its own name, its English name,
   * its name in the page's language or its code, as the search of the application's list of languages finds it.
   */
  const matchesSearch = (language, search, nameInPageLanguage = '') =>
    searchFinds([language.name, language.englishName, nameInPageLanguage, language.code], search);

  // In Node, where the test reads these functions, there is no page to show.
  if (typeof module === 'object' && module.exports) {
    module.exports = { languages, defaultLanguage, matchLanguage, resolveLanguage, followsBrowser, languageParts, linkParts, textOf,
      foldForSearch, searchFinds, matchesSearch };
    return;
  }

  const root = document.documentElement;
  const localesUrl = new URL('locales/', document.currentScript.src);

  // Reading window.localStorage throws where the browser blocks storage.
  const savedLanguage = () => {
    try {
      return window.localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  };
  const saveLanguage = (code) => {
    try {
      window.localStorage.setItem(storageKey, code);
    } catch {
      // The choice then lasts as long as the address has it.
    }
  };
  const forgetLanguage = () => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Where storage is blocked, nothing was kept.
    }
  };

  const param = new URLSearchParams(window.location.search).get('lang');
  const saved = savedLanguage();
  const browserLanguages = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
  const language = resolveLanguage({ param, saved, browserLanguages });
  // The language that the browser asks for, which the picker's first entry names: "Use browser setting (日本語)".
  const browserLanguage = matchLanguage(browserLanguages) ?? defaultLanguage;
  // Whether the page follows the browser: until a language is asked for in the address or chosen in the picker, and
  // again once that entry is chosen.
  let following = followsBrowser({ param, saved });
  // A language asked for in the address is a choice: the page that a link of this one leads to is in it as well.
  if (param && matchLanguage([param]) === language) saveLanguage(language);

  const fetchTexts = async (code) => {
    const response = await fetch(new URL(`${code}.json`, localesUrl));
    if (!response.ok) throw new Error(`${code}.json: ${response.status}`);
    return response.json();
  };

  // The attributes that get a text, each by the key in the attribute of the same name after "data-i18n-".
  const translatedAttributes = ['alt', 'content', 'aria-label', 'placeholder'];

  // TL;DR: Marks the landing page's two download buttons as stacked when they do not fit side by side in the
  // window, so that the styles lay them out one above the other, both as wide as the wider.
  // Details: How wide the two are depends on the page's language, so the window's width from which they fit side by
  // side does too: 459px in English and 578px in Latvian, with a Mac's fonts. The styles let the row wrap
  // (github-page-style.css), which shows whether the two fit: the second button is then under the first. Wrapped,
  // each has its own width, though, and the two are not wrapped any more once they are laid out as a column, so
  // this looks at the row without the mark each time: when the page gets its texts, and when the window's width
  // changes.
  const stackedClass = 'stacked';
  const layDownloadButtonsOut = () => {
    const row = document.querySelector('.download-buttons');
    if (!row) return;
    row.classList.remove(stackedClass);
    const tops = Array.from(row.children, (button) => button.offsetTop);
    row.classList.toggle(stackedClass, tops.some((top) => top !== tops[0]));
  };

  // TL;DR: A name of several words stays on one line.
  // Details: The landing page's centered sentences are broken into lines of about the same length
  // (github-page-style.css), which puts the end of a line inside the application's name in most languages, on a
  // phone ("... Photo Location / Map ..."). The steps of the download page have the English names of Windows' two
  // buttons in parentheses, which were divided as well ("(More / info)"). The spaces of these names are therefore
  // no-break spaces in what a page shows. The pages' own texts and the languages' files keep ordinary spaces, so
  // that they are written, searched and checked as they read.
  const namesOnOneLine = /Photo Location Map|Photo Data Viewer|Tomoyuki Aota|More info|Run anyway/g;
  const keepNamesWhole = () => {
    for (const element of document.body.querySelectorAll('[data-i18n]')) {
      const texts = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      for (let text = texts.nextNode(); text; text = texts.nextNode()) {
        const whole = text.data.replace(namesOnOneLine, (name) => name.replace(/ /g, '\u00a0'));
        if (whole !== text.data) text.data = whole;
      }
    }
  };

  // What the picker does when the page gets the texts of another language: it words its first entry in it.
  let relabelPicker = () => {};

  /**
   * Puts the texts of a language into the page, which is laid out from right to left for a language written so. A key
   * that the language does not have keeps what the page shows.
   */
  const apply = (code, texts) => {
    root.lang = code;
    root.dir = languages.find((each) => each.code === code)?.rtl ? 'rtl' : 'ltr';
    for (const element of document.querySelectorAll('[data-i18n]')) {
      const text = textOf(texts, element.dataset.i18n);
      if (typeof text !== 'string') continue;
      const { before, inside, after } = linkParts(text);
      const link = element.querySelector('a');
      if (link && inside !== null) {
        link.textContent = inside;
        element.replaceChildren(before, link, after);
      } else {
        element.textContent = text;
      }
    }
    for (const attribute of translatedAttributes) {
      for (const element of document.querySelectorAll(`[data-i18n-${attribute}]`)) {
        const text = textOf(texts, element.getAttribute(`data-i18n-${attribute}`));
        if (typeof text === 'string') element.setAttribute(attribute, text);
      }
    }
    keepNamesWhole();
    layDownloadButtonsOut();
    relabelPicker();
  };

  // TL;DR: A page in another language is not shown until its texts are in it, or a second and a half have passed.
  // Details: The page holds the English texts, so a visitor whose language is Japanese would see them for a moment
  // before the Japanese ones replace them. When the texts do not come in time, the page is shown in English.
  const pendingClass = 'i18n-pending';
  const show = () => root.classList.remove(pendingClass);
  if (language !== defaultLanguage) {
    root.classList.add(pendingClass);
    window.setTimeout(show, 1500);
  }

  const texts = language === defaultLanguage ? Promise.resolve(null) : fetchTexts(language).catch(() => null);
  const pageParsed = new Promise((resolve) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', resolve, { once: true });
    else resolve();
  });

  // TL;DR: Only the last choice changes the page.
  // Details: A visitor who chooses Japanese and then English at once has two requests under way. Were the Japanese
  // texts to arrive last, they would replace the English page, its address and the choice that is kept. The texts
  // that the page is loaded with can arrive after a choice in the same way.
  let choices = 0;

  /**
   * Shows the page in a language that the visitor chose: `showChosen` shows it in the picker at once, and the page's
   * own again when its texts cannot be fetched. `follow` is for the entry "Use browser setting", with the browser's
   * language. Choosing the language that the page is in counts as well: texts of the page's load that come later do
   * not replace it.
   */
  const choose = async (chosen, showChosen, follow = false) => {
    const choice = ++choices;
    showChosen(chosen, follow);
    let textsOfChosen;
    try {
      textsOfChosen = await fetchTexts(chosen);
    } catch {
      // The page stays as it is when the language's texts cannot be fetched.
      if (choice === choices) showChosen(root.lang, following);
      return;
    }
    if (choice !== choices) return;
    apply(chosen, textsOfChosen);
    following = follow;
    // The address says the language, so that the page is in it again when it is loaded anew or sent to someone. A page
    // that follows the browser says none, and keeps no choice: it is in the language of each browser that opens it.
    const url = new URL(window.location.href);
    if (follow) {
      forgetLanguage();
      url.searchParams.delete('lang');
    } else {
      saveLanguage(chosen);
      url.searchParams.set('lang', chosen);
    }
    window.history.replaceState(null, '', url);
  };

  /** Scrolls the list, and nothing around it, by as little as shows the entry. */
  const showInList = (list, entry) => {
    const top = entry.offsetTop;
    const bottom = top + entry.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  };

  /**
   * Makes the language picker of the page, which each page has empty and hidden: without this script there is nothing
   * to choose. A button that shows the page's language opens a box under it, with a search field above the list, as
   * the list of the application has: "Use browser setting", with the language that it stands for in this browser,
   * then each language under its own name. Returns how to show a language as the chosen one, or null for a page
   * without a picker.
   */
  const makePicker = () => {
    const picker = document.querySelector('.language-picker');
    if (!picker) return null;
    const button = picker.querySelector('.language-button');
    const popup = picker.querySelector('.language-popup');
    const search = picker.querySelector('.language-search');
    const list = picker.querySelector('.language-options');
    const status = picker.querySelector('.language-none');
    const noLanguagesFound = picker.querySelector('.language-none-text');
    const useBrowserSetting = picker.querySelector('.language-browser-text');
    const languageOf = (code) => languages.find((each) => each.code === code);

    // TL;DR: The first entry follows the browser's language, as the application's list has one that follows the
    // operating system's, and Photo Data Viewer's one that follows the browser's.
    // Details: A visitor who has chosen a language, or followed a link that says one, keeps it on every visit. This
    // entry forgets that choice. It says which language the browser stands for, in the page's language, with the name
    // of that language in an element of its own, so that one written in the other direction keeps its order.
    const browserEntry = document.createElement('li');
    browserEntry.className = 'language-option';
    browserEntry.id = 'language-option-browser';
    browserEntry.setAttribute('role', 'option');
    browserEntry.tabIndex = -1;
    const labelBrowserEntry = () => {
      const { before, after } = languageParts(useBrowserSetting.textContent);
      const name = document.createElement('bdi');
      name.lang = browserLanguage;
      name.textContent = languageOf(browserLanguage).name;
      const label = document.createElement('bdi');
      label.append(before, name, after);
      browserEntry.lang = root.lang;
      browserEntry.replaceChildren(label);
    };
    labelBrowserEntry();
    relabelPicker = labelBrowserEntry;

    // The name is on its own, so that one written in the other direction than the page keeps its order.
    const options = languages.map(({ code, name }) => {
      const option = document.createElement('li');
      option.className = 'language-option';
      option.id = `language-option-${code}`;
      option.setAttribute('role', 'option');
      option.dataset.code = code;
      option.lang = code;
      option.tabIndex = -1;
      const label = document.createElement('bdi');
      label.textContent = name;
      option.append(label);
      return option;
    });
    const allEntries = [browserEntry, ...options];
    list.append(...allEntries);

    let shown = root.lang;
    let shownFollowing = following;
    const showChosen = (code, follow) => {
      shown = code;
      shownFollowing = follow;
      const name = button.querySelector('.language-button-name');
      name.textContent = languageOf(code).name;
      name.lang = code;
      browserEntry.setAttribute('aria-selected', String(follow));
      for (const option of options) option.setAttribute('aria-selected', String(!follow && option.dataset.code === code));
    };
    showChosen(root.lang, following);
    const chosenEntry = () => (shownFollowing ? browserEntry : options.find((option) => option.dataset.code === shown));

    const listedEntries = () => allEntries.filter((entry) => !entry.hidden);
    /** The entry that the Tab key reaches in the list, the chosen one or else the first listed, which it returns. */
    const setTabStop = () => {
      const stop = listedEntries().find((entry) => entry === chosenEntry()) ?? listedEntries()[0];
      for (const entry of allEntries) entry.tabIndex = entry === stop ? 0 : -1;
      return stop;
    };
    /** Lists the entries that the search finds, or says that it finds none. */
    const filter = () => {
      let namesInPageLanguage = null;
      try {
        namesInPageLanguage = new Intl.DisplayNames([root.lang], { type: 'language' });
      } catch {
        // The search then finds a language by its other names.
      }
      // The first entry is found by its words, the name of the browser's language among them, as in the application.
      browserEntry.hidden = !searchFinds([browserEntry.textContent], search.value);
      for (const option of options) {
        const code = option.dataset.code;
        option.hidden = !matchesSearch(languageOf(code), search.value, namesInPageLanguage?.of(code) ?? '');
      }
      const none = listedEntries().length === 0;
      list.hidden = none;
      status.textContent = none ? noLanguagesFound.textContent : '';
      setTabStop();
    };
    const focusEntry = (entry) => {
      for (const each of allEntries) each.tabIndex = each === entry ? 0 : -1;
      entry.focus();
      showInList(list, entry);
    };
    const isOpen = () => !popup.hidden;
    const open = () => {
      search.value = '';
      filter();
      popup.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      showInList(list, chosenEntry());
      // The search field, so that the visitor can type a language at once, as in the application's dialog.
      search.focus();
    };
    const close = (focusButton) => {
      if (!isOpen()) return;
      popup.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      if (focusButton) button.focus();
    };
    const pick = (entry) => {
      close(true);
      if (entry === browserEntry) choose(browserLanguage, showChosen, true);
      else choose(entry.dataset.code, showChosen);
    };

    button.addEventListener('click', () => (isOpen() ? close(false) : open()));
    search.addEventListener('input', () => {
      filter();
      list.scrollTop = 0;
    });
    search.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' && listedEntries().length > 0) {
        event.preventDefault();
        focusEntry(setTabStop());
      } else if (event.key === 'Enter' && search.value.trim() !== '' && listedEntries().length > 0) {
        // The first language that the search finds, for a visitor who types its name and presses Enter. The first
        // entry has a language's name in it too, and is chosen so only when the search finds no language.
        event.preventDefault();
        pick(listedEntries().find((entry) => entry !== browserEntry) ?? listedEntries()[0]);
      }
    });
    list.addEventListener('click', (event) => {
      const entry = event.target.closest('.language-option');
      if (entry) pick(entry);
    });
    // TL;DR: A letter typed on the list moves the focus to the next entry whose words start with it. Letters typed
    // within half a second of each other are taken together, "de" for Deutsch, and the same letter again goes on to
    // the next entry that starts with it.
    // Details: The application's list and Photo Data Viewer's do this. The words are compared as the search compares
    // them, without regard to case or diacritics.
    let typed = '';
    let typedAt = 0;
    const entryTypedFor = (entries, at, letter) => {
      const now = Date.now();
      typed = now - typedAt < 500 ? typed + letter : letter;
      typedAt = now;
      const sameLetter = [...typed].every((each) => each === typed[0]);
      const sought = foldForSearch(sameLetter ? typed[0] : typed);
      // From the entry after the focused one for a letter on its own, and from the focused one while a name is typed.
      const from = sameLetter ? at + 1 : at;
      return [...entries.slice(from), ...entries.slice(0, from)].find((entry) => foldForSearch(entry.textContent).startsWith(sought));
    };
    // The arrow keys, Home and End move between the entries, and Enter or Space chooses one. Up from the first entry
    // goes back to the search field.
    list.addEventListener('keydown', (event) => {
      const entries = listedEntries();
      const at = entries.indexOf(document.activeElement);
      if (at === -1) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        pick(entries[at]);
        return;
      }
      const moves = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: entries.length - 1 };
      if (event.key in moves) {
        event.preventDefault();
        if (moves[event.key] < 0) search.focus();
        else focusEntry(entries[Math.min(moves[event.key], entries.length - 1)]);
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const entry = entryTypedFor(entries, at, event.key);
        if (entry) focusEntry(entry);
      }
    });
    // Escape, a click outside the picker, or the keyboard's focus leaving it closes the box without a choice.
    popup.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      close(true);
    });
    document.addEventListener('pointerdown', (event) => {
      if (isOpen() && !picker.contains(event.target)) close(false);
    });
    picker.addEventListener('focusout', (event) => {
      if (isOpen() && event.relatedTarget && !picker.contains(event.relatedTarget)) close(false);
    });

    picker.hidden = false;
    return showChosen;
  };

  // TL;DR: The picker is there once the page is parsed, whether the page's texts have arrived or not.
  // Details: When those texts do not come in time, the page is shown in English. Were the picker to wait for them, a
  // visitor would have none for as long as the request is under way, on every page, and could not choose English.
  const pickerShown = pageParsed.then(makePicker);
  // The names and the download buttons, for the texts that the page holds; the buttons from then on for each width
  // of the window.
  pageParsed.then(() => {
    keepNamesWhole();
    layDownloadButtonsOut();
    window.addEventListener('resize', layDownloadButtonsOut);
  });

  Promise.all([texts, pickerShown]).then(([textsOfLanguage, showChosen]) => {
    // A visitor who has chosen a language by now keeps it: the texts that the page was loaded with came too late.
    if (textsOfLanguage && choices === 0) {
      apply(language, textsOfLanguage);
      if (showChosen) showChosen(language, following);
    }
    show();
  });
})();
