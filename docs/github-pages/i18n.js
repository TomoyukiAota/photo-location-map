// Shows this website in the visitor's language. Loaded in the head of the landing page and of the Windows download
// page, before their content, so that a page in another language than English is not seen in English first.
//
// The texts of a language are in locales/<code>.json, with the keys of locales/en.json. An element gets its text by
// the key in its data-i18n attribute, and an attribute by the key in data-i18n-alt, data-i18n-content,
// data-i18n-aria-label or data-i18n-placeholder. In a text, <link>…</link> is around the words of the element's link.
// The pages themselves hold the English texts, which stay when a language's file cannot be fetched, as when a page is
// opened from a disk; a test checks that they are those of en.json (test/website/website-texts.cjs).
//
// The language is, in this order: `lang` in the address (?lang=ja), which the links for search engines have; the one
// chosen in the page's language picker before, which localStorage keeps; the first of the browser's languages that
// this website has; English.
(() => {
  // The languages of this website, in the order of its list, each under its own name, with its English name, which the
  // search of the list finds it by too, and its flag, the file flags/<flag>.svg. To add one, add its file to locales/,
  // its flag to flags/ and its line here (docs/TRANSLATING.md).
  const languages = [
    { code: 'en', name: 'English', englishName: 'English', flag: 'us' },
    { code: 'ja', name: '日本語', englishName: 'Japanese', flag: 'jp' },
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

  /** A text as the search compares it: in lower case and without diacritics, so that "cestina" finds "Čeština". */
  const foldForSearch = (text) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  /**
   * Whether a language is listed for what is typed in the search field: any part of its own name, its English name,
   * its name in the page's language or its code, as the search of the application's list of languages finds it.
   */
  const matchesSearch = (language, search, nameInPageLanguage = '') => {
    const sought = foldForSearch(search.trim());
    if (!sought) return true;
    return [language.name, language.englishName, nameInPageLanguage, language.code].some((text) => foldForSearch(text).includes(sought));
  };

  // In Node, where the test reads these functions, there is no page to show.
  if (typeof module === 'object' && module.exports) {
    module.exports = { languages, defaultLanguage, matchLanguage, resolveLanguage, linkParts, textOf, foldForSearch, matchesSearch };
    return;
  }

  const root = document.documentElement;
  const localesUrl = new URL('locales/', document.currentScript.src);
  const flagsUrl = new URL('flags/', document.currentScript.src);

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
  const translatedAttributes = ['alt', 'content', 'aria-label', 'placeholder'];

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

  /**
   * Shows the page in a language that the visitor chose: `showChosen` shows it in the picker at once, and the page's
   * own again when its texts cannot be fetched. Choosing the language that the page is in counts as well: texts of the
   * page's load that come later do not replace it.
   */
  const choose = async (chosen, showChosen) => {
    const choice = ++choices;
    showChosen(chosen);
    let textsOfChosen;
    try {
      textsOfChosen = await fetchTexts(chosen);
    } catch {
      // The page stays as it is when the language's texts cannot be fetched.
      if (choice === choices) showChosen(root.lang);
      return;
    }
    if (choice !== choices) return;
    apply(chosen, textsOfChosen);
    saveLanguage(chosen);
    // The address says the language, so that the page is in it again when it is loaded anew or sent to someone.
    const url = new URL(window.location.href);
    url.searchParams.set('lang', chosen);
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
   * to choose. A button that shows the page's language opens a box under it, with a search field above the list of
   * languages, as the list of the application has, each language under its own name with its flag. Returns how to
   * show a language as the chosen one, or null for a page without a picker.
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
    const languageOf = (code) => languages.find((each) => each.code === code);
    const flagOf = (code) => new URL(`${languageOf(code).flag}.svg`, flagsUrl).href;

    // The flag, before the name, is not read aloud. The name is on its own, so that one written in the other direction
    // than the page keeps its order.
    const options = languages.map(({ code, name }) => {
      const option = document.createElement('li');
      option.className = 'language-option';
      option.id = `language-option-${code}`;
      option.setAttribute('role', 'option');
      option.dataset.code = code;
      option.lang = code;
      option.tabIndex = -1;
      const flag = document.createElement('img');
      flag.className = 'language-flag';
      flag.alt = '';
      flag.src = flagOf(code);
      const label = document.createElement('bdi');
      label.textContent = name;
      option.append(flag, label);
      return option;
    });
    list.append(...options);

    let shown = root.lang;
    const showChosen = (code) => {
      shown = code;
      button.querySelector('.language-flag').src = flagOf(code);
      const name = button.querySelector('.language-button-name');
      name.textContent = languageOf(code).name;
      name.lang = code;
      for (const option of options) option.setAttribute('aria-selected', String(option.dataset.code === code));
    };
    showChosen(root.lang);

    const listed = () => options.filter((option) => !option.hidden);
    /** The entry that the Tab key reaches in the list, the chosen one or else the first listed, which it returns. */
    const setTabStop = () => {
      const stop = listed().find((option) => option.dataset.code === shown) ?? listed()[0];
      for (const option of options) option.tabIndex = option === stop ? 0 : -1;
      return stop;
    };
    /** Lists the languages that the search finds, or says that it finds none. */
    const filter = () => {
      let namesInPageLanguage = null;
      try {
        namesInPageLanguage = new Intl.DisplayNames([root.lang], { type: 'language' });
      } catch {
        // The search then finds a language by its other names.
      }
      for (const option of options) {
        const code = option.dataset.code;
        option.hidden = !matchesSearch(languageOf(code), search.value, namesInPageLanguage?.of(code) ?? '');
      }
      const none = listed().length === 0;
      list.hidden = none;
      status.textContent = none ? noLanguagesFound.textContent : '';
      setTabStop();
    };
    const focusOption = (option) => {
      for (const each of options) each.tabIndex = each === option ? 0 : -1;
      option.focus();
      showInList(list, option);
    };
    const isOpen = () => !popup.hidden;
    const open = () => {
      search.value = '';
      filter();
      popup.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      showInList(list, options.find((option) => option.dataset.code === shown));
      // The search field, so that the visitor can type a language at once, as in the application's dialog.
      search.focus();
    };
    const close = (focusButton) => {
      if (!isOpen()) return;
      popup.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      if (focusButton) button.focus();
    };
    const pick = (option) => {
      close(true);
      choose(option.dataset.code, showChosen);
    };

    button.addEventListener('click', () => (isOpen() ? close(false) : open()));
    search.addEventListener('input', () => {
      filter();
      list.scrollTop = 0;
    });
    search.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' && listed().length > 0) {
        event.preventDefault();
        focusOption(setTabStop());
      } else if (event.key === 'Enter' && search.value.trim() !== '' && listed().length > 0) {
        // The first language that the search finds, for a visitor who types its name and presses Enter.
        event.preventDefault();
        pick(listed()[0]);
      }
    });
    list.addEventListener('click', (event) => {
      const option = event.target.closest('.language-option');
      if (option) pick(option);
    });
    // The arrow keys, Home and End move between the entries, and Enter or Space chooses one. Up from the first entry
    // goes back to the search field.
    list.addEventListener('keydown', (event) => {
      const entries = listed();
      const at = entries.indexOf(document.activeElement);
      if (at === -1) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        pick(entries[at]);
        return;
      }
      const moves = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: entries.length - 1 };
      if (!(event.key in moves)) return;
      event.preventDefault();
      if (moves[event.key] < 0) search.focus();
      else focusOption(entries[Math.min(moves[event.key], entries.length - 1)]);
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

  Promise.all([texts, pickerShown]).then(([textsOfLanguage, showChosen]) => {
    // A visitor who has chosen a language by now keeps it: the texts that the page was loaded with came too late.
    if (textsOfLanguage && choices === 0) {
      apply(language, textsOfLanguage);
      if (showChosen) showChosen(language);
    }
    show();
  });
})();
