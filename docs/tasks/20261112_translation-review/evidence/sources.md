# Where the review read what similar software says

A reviewer changed a text only with a reason, and the usual reason was a source
that shows what widely used software says in the language. This page lists the
sources that the reviewers found, how each is read from a terminal, without a
browser window, and how much each turned out to be worth. It is for whoever
reviews a language next, by machine or as a speaker. The decision logs
(`decisions-<group>.md`) name these sources in short.

The codes of a language differ between the sources: Norwegian Bokmål is `no`
at Apple and in Chromium, Hebrew is `iw` in Chromium, Serbian in Latin letters
is `sr-Latn` in Chromium and `sr@latin` in `.po` files, and Apple writes
`zh_CN`, `zh_TW`, `pt_BR`, `pt_PT`.

## Apple: the texts of macOS, on a Mac

macOS keeps Apple's texts of all its languages in `.loctable` files: binary
property lists with one dictionary per language. They need no network.

- `/System/Applications/TextEdit.app/Contents/Resources/Edit.loctable`: the
  application menu (About, Services, Hide, Hide Others, Show All, Quit) and
  the Edit menu.
- `/System/Library/Frameworks/AppKit.framework/Resources/MenuCommands.loctable`,
  `Common.loctable` and `Menus.loctable`.
- The `MainMenu.loctable` and `Localizable.loctable` of Preview, Photos, Notes,
  Mail and Finder, and the Date & Time and Language & Region settings under
  `/System/Library/ExtensionKit/Extensions/`.

```python
import plistlib
d = plistlib.load(open('/System/Applications/TextEdit.app/Contents/Resources/Edit.loctable', 'rb'))
en = d.get('en') or d.get('en_GB')          # a menu's file has no 'en': match the key through 'en_GB'
key = next(k for k, v in en.items() if v == 'Hide Others')
print(d['th'][key], d['vi'][key])           # ซ่อนอื่นๆ  Ẩn các mục khác
```

- macOS 27 has 35 of the application's 42 languages. It has no Basque,
  Bulgarian, Estonian, Galician, Latvian, Lithuanian or Serbian: for those,
  the application menu of Firefox and of Chrome on macOS are the sources (see
  below).
- It has two regions of some languages (`es` and `es_419`, `pt_BR` and `pt_PT`,
  `fr` and `fr_CA`, `zh_CN`, `zh_HK` and `zh_TW`), which shows whether a wording
  belongs to one region.
- `menu.app.services`, `hide`, `hideOthers`, `showAll` and `quit` are shown on
  macOS only (`src-main/menu/`), so macOS's wording is the one to have.
  `menu.app.about` is also shown under Help on Windows and Linux, and the rest
  of `menu.*` on all three.
- It says nothing about Windows: the names in the SmartScreen warning and
  Explorer's name need other sources.

Apple's guides are whole when fetched with a browser's user agent
(`curl -A "Mozilla/5.0"`), with the same page id under each locale:
`https://support.apple.com/<locale>/guide/iphone/iph65f82af3e/ios` is "Change
the date and time on iPhone", which names the 24-hour setting.

## Google: Android and Chromium

**Android's own translations** are plain files, for every language that
Android has (base64: add `?format=TEXT` and decode):

- `https://android.googlesource.com/platform/packages/apps/<App>/+/refs/heads/main/res/values-<code>/strings.xml`.
  `Settings` has the 24-hour setting (`date_time_24hour`), location and the
  cache; `Gallery2` has a thumbnail, "show on map", details and rotate;
  `DocumentsUI` has the sort order, "open with" and search.
- `https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/core/res/res/values-<code>/strings.xml`
  has "More options" (`action_menu_overflow_description`), Undo, Redo, Cancel
  and Loading.
- A string has the same `name` in `res/values/strings.xml`, the English, and in
  `res/values-<code>/strings.xml`, so the English text finds the translation in
  every language. A string has `msgid="…"` between its name and its text:
  match `name="…"[^>]*>`.

**Chromium's translations** are in `.xtb` files under
`https://chromium.googlesource.com/chromium/src/+/main/` (base64 with
`?format=TEXT`):

- `chrome/app/resources/generated_resources_<code>.xtb`: Chrome, with its
  application menu on macOS ("Hide Others", "Show All", "Quit …", "Actual Size",
  "Zoom In"), the developer tools, reload and full screen;
- `ui/strings/translations/ui_strings_<code>.xtb`: the names of the keys;
- `components/strings/components_strings_<code>.xtb`;
- `ui/chromeos/translations/ui_chromeos_strings_<code>.xtb`: the file manager of
  ChromeOS ("Date modified", "Name", "Size", "Type", "Open with").

A message has the same number in every language, so a wording found in one
language finds the same message in the others. The number comes from the
English text, for a message without a `meaning` attribute, which most are (a
placeholder is written as its name, as in `Quit PRODUCT_NAME`):

```python
import hashlib
def message_id(english):
    d = hashlib.md5(english.encode()).hexdigest()
    return ((int(d[:8], 16) << 32) | int(d[8:16], 16)) & 0x7fffffffffffffff
# message_id('Hide Others') == 881799181680267069
```

- The English texts are in `chrome/app/generated_resources.grd`.
- Chromium has files for languages that Chrome on a desktop does not ship, such
  as Basque and Galician, and two regions of some (`es` and `es-419`, `pt-BR`
  and `pt-PT`, `zh-CN` and `zh-TW`).
- One English word can be two messages: "View" is one message for the menu bar
  of macOS, with Apple's word, and another elsewhere.
- Search a decoded file with a script rather than with a long pattern of
  `grep -o`, which fails on these files.

## Mozilla: Firefox

Firefox's application menu on macOS, as plain text for each language:
`https://raw.githubusercontent.com/mozilla-l10n/firefox-l10n/main/<code>/browser/browser/menubar.ftl`
(`menu-about`, `menu-application-services`, `menu-application-hide-this`,
`menu-application-hide-other`, `menu-application-show-all`, `menu-quit-mac`,
`menu-view`, `menu-view-full-zoom-enlarge`, `menu-view-full-zoom-actual-size`).
With Chrome's, it is the source for a language that macOS is not translated
into, and a second witness where macOS differs from a text: when Firefox has
the text's wording, both are in use and the text can stay.

## Microsoft

- **Explorer's name in the language** is the title of
  `https://support.microsoft.com/<locale>/windows/file-explorer-in-windows-ef370130-1cca-9dc5-e0df-2f7416fe1cb1`
  (`curl -s -L -A "Mozilla/5.0" … | grep -o '<title>[^<]*'`).
- **Windows' keyboard shortcuts**, with the names of the keys and of Explorer,
  the menu of a right-click, Undo, Redo, Refresh and full screen:
  `https://support.microsoft.com/<locale>/windows/keyboard-shortcuts-in-windows-dcc61a57-8ff0-cffe-9796-cb9706c75eec`.
  The English address works under each locale.
- The support site has no pages in Hindi or Malay: it answers in English.
- **A page is a machine translation in the smaller languages.** The page's head
  says so: `ms.translationtype` is `MT`, or `HT` for a translation by people.
  Such a page still shows a term, not how people write it in a sentence.
- **The localization style guides** are written by people, one for each of the
  40 languages: `https://learn.microsoft.com/en-us/globalization/reference/microsoft-style-guides`
  lists them as `https://aka.ms/<language>-styleguide`, each a PDF of 50 to 80
  pages. A guide settles the language's quotation marks and whether names of
  the interface are quoted, the names of the keys, the form of address and of
  a command, abbreviations and no-break spaces, and rules of grammar that a
  reader who does not speak the language cannot see: Estonian requires a noun
  before a name of the interface after `klõpsake`, Danish writes the accent
  on an imperative that can be read as a noun (`sortér`). A guide is
  Microsoft's own voice: where it differs from a text that has macOS's word,
  that is not a reason to change; a rule of grammar or of typography is.
  The text of a PDF comes out on macOS without a window, with PDFKit:

  ```
  osascript -l JavaScript -e 'ObjC.import("PDFKit"); ObjC.import("Foundation"); function run(argv){ const d=$.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath(argv[0])); d.string.writeToFileAtomicallyEncodingError(argv[1], true, $.NSUTF8StringEncoding, null); return d.pageCount; }' <the PDF> <a text file>
  ```

- **Microsoft's forum in a language** (`learn.microsoft.com/<locale>/answers/`)
  has answers by speakers that name Explorer's columns as their Windows shows
  them. Some threads are machine translations of English ones: read who wrote
  it.
- `www.microsoft.com/<locale>/windows/windows-11` shows how the name Windows is
  used in a sentence. It needs a browser's user agent.

## Applications that people translated

Translations by volunteers who speak the language, as plain `.po` files. They
are the witnesses that neither Apple nor Google wrote.

- The two choices of the clock, "12-Hour" and "24-Hour", in KDE:
  `https://invent.kde.org/plasma/plasma-workspace/-/raw/master/po/<lang>/plasma_applet_org.kde.plasma.digitalclock.po`;
  "24-hour" under "Time Format" in GNOME:
  `https://gitlab.gnome.org/GNOME/gnome-control-center/-/raw/main/po/<lang>.po`.
- The names of the keys, the entries with `msgctxt "keyboard label"` of
  `https://gitlab.gnome.org/GNOME/gtk/-/raw/main/po/<lang>.po`. GTK and
  Chromium can differ (Basque: `Shift` and `Maius`).
- A file manager's words, the column of the date a photo was taken, the sort
  order and "Date modified":
  `https://invent.kde.org/system/dolphin/-/raw/master/po/<lang>/dolphin.po` and
  `https://gitlab.gnome.org/GNOME/nautilus/-/raw/main/po/<code>.po`.
- `https://gitlab.gnome.org/GNOME/gimp/-/raw/master/po/<code>.po`,
  `https://raw.githubusercontent.com/videolan/vlc/master/po/<code>.po` and
  `https://raw.githubusercontent.com/LibreOffice/translations/master/source/<code>/sc/messages.po`.
- Poedit names Windows' Explorer, in a text whose note asks for the standard
  translation of "Explorer":
  `https://raw.githubusercontent.com/vslavik/poedit/master/locales/<code>.po`
  ("Show in Explorer").

## Wikipedia

- A term's title in every language at once:
  `https://en.wikipedia.org/w/api.php?action=query&titles=<Title>&prop=langlinks&lllimit=500&format=json`.
- A website's own interface in the language, through MediaWiki's messages:
  `https://<code>.wikipedia.org/w/api.php?action=query&meta=allmessages&ammessages=<name>|<name>&amlang=<code>&format=json`.
  Useful for Photo Data Viewer, which is a website, where a system's word and
  the web's word differ.

## The names in Windows' SmartScreen warning

The website's page for the Windows download names the link "More info" and the
button "Run anyway" as a Windows in the language shows them. Microsoft's pages
do not list them, so they were the hardest names to confirm.

1. **Installation notes that a speaker wrote** ("click X, then Y") quote them.
   GitHub's code search finds such notes:
   `gh search code SmartScreen '"<the button's name>"'`, with the words as
   separate arguments, or a search for the warning's title in the language.
   The search allows about ten queries a minute for an account.
2. **A picture of the warning** on a Windows in the language settles it. A note
   may link one; the Estonian names were settled by a page of the Estonian
   state about installing its ID-card software, which shows the warning.
3. **What weighs little**: a file named `README.<code>.md` is usually a
   translation of an English README, with the translator's own wording of the
   two names; a vendor's guide without a picture may do the same (a sign: it
   also "translates" labels of a system that does not have the language).
4. **Another warning has the same words.** SmartScreen's red warning, for a
   known malicious file, has "run anyway" as the end of a sentence, in another
   grammatical form, and "Don't run" as its only button. Look at the picture
   before counting a page.
5. `learn.microsoft.com/<locale>/power-automate/desktop-flows/dynamics365-cs-rpa`
   has "Select More info > Run anyway" under every locale, but it is not
   evidence on its own: it differed from a real Windows in several languages,
   whether its page is marked as translated by people or by machine.

What is still not confirmed is in each group's `open-<group>.md`. It needs a
Windows in the language.

## Checks that found what reading did not

- **One text, two translations.** List, for a language over the three places,
  the translations that stand for two different English texts and the English
  texts that have two translations. Most of the list is right (a file and a
  folder); the rest is worth a look.
- **One key, eight languages side by side.** A label whose word order gave it
  another object, and a line worded differently in one of the three places,
  were found this way.
- **Which region a file is written in.** A file that serves two regions, or one
  of two files for two countries, should have one region's grammar and words
  in every text. The Spanish file had the perfect of Spain in eight texts and
  the simple past of Latin America in one. Count a form in the sources that
  have both regions: 143 against 1 in macOS's `es`, and 0 against 147 in its
  `es_419`.
- **Two words that are "both in use" can be counted** over Chromium's four
  files, Apple's texts, Android's and Firefox's. It settled some (Thai `พาธ`
  for a path: in no text of any source) and showed that others are truly pairs
  (Traditional Chinese `照片` and `相片`).
- **A count that is all on one side is not yet a reason to change.** Look at
  the English of the texts that were counted, which may be another term, and
  at an application that neither Apple nor Google translated.
- **The pair of quotation marks** that a language's software has can be
  counted in the same files.
- **A claim "from knowledge" can be checked** in Chromium's files by the
  message's number: one such claim of an early round was wrong, and correcting
  it was one of a later round's changes.
