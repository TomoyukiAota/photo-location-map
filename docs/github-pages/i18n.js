// Shows this website in the visitor's language. Loaded in the head of the landing page and of the Windows download
// page, before their content, so that a page in another language than English is not seen in English first.
//
// The texts of a language are in locales/<code>.json, with the keys of locales/en.json. An element gets its text by
// the key in its data-i18n attribute, and an attribute by the key in data-i18n-alt, data-i18n-content or
// data-i18n-aria-label. In a text, <link>…</link> is around the words of the element's link. The pages themselves
// hold the English texts, which stay when a language's file cannot be fetched, as when a page is opened from a disk;
// a test checks that they are those of en.json (test/website/website-texts.cjs).
//
// The language is, in this order: `lang` in the address (?lang=ja), which the links for search engines have; the one
// chosen in the page's list before, which localStorage keeps; the first of the browser's languages that this website
// has; English.
(() => {
  // The languages of this website, in the order of its list, each under its own name. To add one, add its file to
  // locales/ and its line here (docs/TRANSLATING.md).
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
  ];
  const defaultLanguage = 'en';
  const storageKey = 'PhotoLocationMapWebsiteLanguage';

  /** The language of this website that a list of language tags asks for, the first that it has, or null. */
  const matchLanguage = (tags) => {
    for (const tag of tags) {
      if (typeof tag !== 'string') continue;
      // A tag is matched as it is, then without its last parts: ja-JP is ja.
      const subtags = tag.toLowerCase().split('-');
      for (let length = subtags.length; length > 0; length--) {
        const candidate = subtags.slice(0, length).join('-');
        const language = languages.find(({ code }) => code.toLowerCase() === candidate);
        if (language) return language.code;
      }
    }
    return null;
  };

  /** The language to show a page in, from the address, the choice kept from before, and the browser's languages. */
  const resolveLanguage = ({ param, saved, browserLanguages }) =>
    matchLanguage([param]) ?? matchLanguage([saved]) ?? matchLanguage(browserLanguages ?? []) ?? defaultLanguage;

  /** The parts of a text around and inside <link>…</link>, or the text alone when it has no such tag. */
  const linkParts = (text) => {
    const match = /^([\s\S]*?)<link>([\s\S]*?)<\/link>([\s\S]*)$/.exec(text);
    return match ? { before: match[1], inside: match[2], after: match[3] } : { before: text, inside: null, after: '' };
  };

  /** The text of a key such as `landing.summary` in the texts of a language. */
  const textOf = (texts, key) => key.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), texts);

  // In Node, where the test reads these functions, there is no page to show.
  if (typeof module === 'object' && module.exports) {
    module.exports = { languages, defaultLanguage, matchLanguage, resolveLanguage, linkParts, textOf };
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

  const param = new URLSearchParams(window.location.search).get('lang');
  const language = resolveLanguage({
    param,
    saved: savedLanguage(),
    browserLanguages: navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language],
  });
  // A language asked for in the address is a choice: the page that a link of this one leads to is in it as well.
  if (param && matchLanguage([param]) === language) saveLanguage(language);

  const fetchTexts = async (code) => {
    const response = await fetch(new URL(`${code}.json`, localesUrl));
    if (!response.ok) throw new Error(`${code}.json: ${response.status}`);
    return response.json();
  };

  // The attributes that get a text, each by the key in the attribute of the same name after "data-i18n-".
  const translatedAttributes = ['alt', 'content', 'aria-label'];

  /** Puts the texts of a language into the page. A key that the language does not have keeps what the page shows. */
  const apply = (code, texts) => {
    root.lang = code;
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

  // The list of languages, which each page has empty and hidden: without this script there is nothing to choose.
  // TL;DR: The list is there once the page is parsed, whether the page's texts have arrived or not.
  // Details: When those texts do not come in time, the page is shown in English. Were the list to wait for them, a
  // visitor would have none for as long as the request is under way, on every page, and could not choose English.
  const listShown = pageParsed.then(() => {
    const list = document.getElementById('language-select');
    if (!list) return null;
    for (const { code, name } of languages) {
      const option = new Option(name, code);
      option.lang = code;
      list.add(option);
    }
    list.value = root.lang;
    list.hidden = false;
    list.addEventListener('change', async () => {
      const chosen = list.value;
      const choice = ++choices;
      let textsOfChosen;
      try {
        textsOfChosen = await fetchTexts(chosen);
      } catch {
        // The page stays as it is when the language's texts cannot be fetched.
        if (choice === choices) list.value = root.lang;
        return;
      }
      if (choice !== choices) return;
      apply(chosen, textsOfChosen);
      saveLanguage(chosen);
      // The address says the language, so that the page is in it again when it is loaded anew or sent to someone.
      const url = new URL(window.location.href);
      url.searchParams.set('lang', chosen);
      window.history.replaceState(null, '', url);
    });
    return list;
  });

  Promise.all([texts, listShown]).then(([textsOfLanguage, list]) => {
    // A visitor who has chosen a language by now keeps it: the texts that the page was loaded with came too late.
    if (textsOfLanguage && choices === 0) {
      apply(language, textsOfLanguage);
      if (list) list.value = language;
    }
    show();
  });
})();
