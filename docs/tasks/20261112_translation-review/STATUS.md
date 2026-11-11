# The review of the machine translations, and a layout that follows the texts

Written by Claude (Fable 5.2) on 2026-11-12, after the work.

## What was asked

The 40 translations other than English and Japanese were written by machine
translation on 2026-11-10 and 11. The owner asked, step by step:

1. Improve each of them wherever a better translation exists: in the
   application, on the website and in Photo Data Viewer.
2. A natural and accurate translation comes before the layout, by far: change
   the layout for the texts, not the texts for the layout.
3. The layout is one layout for all languages, with no size or rule for a
   single language, and it is not made for the longest text among them, which
   would leave empty room in the others: it stretches and shrinks with a
   language's words and sentences, and never breaks.
4. Review the translations in rounds until they stop changing. A translation
   is natural when it is both what is used in similar cases in the world and
   in line with the purpose and background of the application. Each round
   should change less than the one before; if the rounds do not converge, say
   why.
5. Then look at the layout in every language, and fix what does not hold.

## Current state

- The translations were reviewed in seven rounds. The number of texts that a
  round changed went from 454 to 2 of 11,400: see
  [How the review went](#how-the-review-went). In all, 876 texts differ from
  before the review: 546 of the application's 7,240, 69 of the website's 1,040
  and 261 of Photo Data Viewer's 3,120.
- The application's layout follows its texts in the places where it was made
  for the English ones: see [The layout](#the-layout).
- This pull request has the application's part. The website's texts and
  layout are in pull request #680, and Photo Data Viewer's in its repository's
  pull request #73.
- No speaker of any of the 40 languages has read the result. What the review
  could not settle is listed for each language in `evidence/open-<group>.md`.

## How the review went

The 40 languages were divided into five groups of eight, by kinship:
`germanic` (de, nl, da, nb, sv, fi, et, hu), `romance` (es, ca, gl, eu, fr,
it, pt-BR, pt-PT), `central` (cs, sk, pl, hr, sl, sr-Latn, lt, lv), `east`
(bg, ru, uk, el, tr, ro, he, ar) and `asia` (zh-Hans, zh-Hant, ko, th, vi, id,
ms, hi). In each round, one session of Claude per group read every text of its
eight languages against the English one, and against the Japanese one where
the English is ambiguous, in all three places at once: the application's 181
texts, the website's 26 and Photo Data Viewer's 78. One reviewer for a
language in the three places keeps the words the same in them.

- **Each round had new reviewers**, who read every text as if nobody had
  reviewed it. A reviewer who reads its own work again finds little, which
  would have looked like convergence without being it.
- **A change needed a reason that the next reviewer would accept**: an
  inaccuracy, evidence that another wording is the established one in similar
  software (Windows, macOS, Android, photo applications, file managers, maps)
  or fits the application clearly better, or an inconsistency. Replacing one
  acceptable wording with another was ruled out, as that is what would keep
  the rounds from converging.
- **What a round settled with a source went into a log** that the next round
  read first (`evidence/decisions-<group>.md`), so that a term was looked up
  once. The sources that settled most were macOS's own translation tables on
  the machine, the translations of Android, Chromium and Firefox, Microsoft's
  support pages in the language, and the translations of GNOME's and KDE's
  applications. `evidence/sources.md` says where each is read, from a terminal,
  and how much each turned out to be worth.
- **The changed texts were counted from the files**, by comparing the files
  before and after each round, from the third round on. The first two counts
  are the reviewers' own.

| Round | Changed texts | Of all 11,400 | What it was |
| --- | --- | --- | --- |
| 1 | 454 | 4.0% | The first review. |
| 2 | 316 | 2.8% | The wording freed from the layout: what had been shortened or abbreviated for its room. |
| 3 | 103 | 0.90% | New reviewers, with sources. |
| 4 | 27 | 0.24% | |
| 5 | 8 | 0.07% | |
| 6 | 8 | 0.07% | Four decisions: one name in two texts, one text in three places, and two single texts. |
| 7 | 2 | 0.02% | One decision: two texts of one language, on the website. Four of the five groups changed nothing. |

The rounds converge. Each changed about a third to a quarter of what the round
before it changed, except the sixth, which changed as many texts as the fifth
did, for four reasons where the fifth had seven. In the seventh round, four of
the five groups changed nothing, and the fifth changed two texts for one
reason: the review was ended there.

- No text was changed in two rounds in a row.
- One name went back to what it had been. The third round took the name of
  the link in the Estonian SmartScreen warning from a page that quotes it, and
  the sixth took it back from a picture of the warning on an Estonian Windows,
  on a page of the Estonian state.
- **What more rounds would not settle** is what the last rounds list as open
  (`evidence/open-<group>.md`): names that only a Windows in the language
  shows, such as the two buttons of its SmartScreen warning in about half of
  the languages, Explorer's name in some, and its column for the date a photo
  was taken; and choices between two words that are both in use, such as
  `照片` (Apple) and `相片` (Microsoft, Google) for a photo in Traditional
  Chinese. The reviewers searched for the former in every round, and say that
  further searches of that kind will find nothing.

### What was decided for all languages

- **The setting of the 12- or 24-hour clock** is named as phones and computers
  name it in the language, with "format" or "clock" where a bare number of
  hours reads as a length of time: `12- oder 24-Stunden-Format` with
  `12-Stunden-Format` and `24-Stunden-Format` in German. The labels had been
  kept to about 16 letters for the width of the field.
- **The keys of a shortcut** are written as the language's keyboards and
  Windows name them: `Strg+Umschalt+I` in German, `Ctrl+Maj+I` in French,
  `Ctrl+Mayús+I` in Spanish. Most languages keep `Ctrl+Shift+I`.
- **A count in parentheses** that was worded as "(number: 12)" to avoid a
  plural form is "(12 in total)" in the language's own order, which avoids it
  as well.
- **What a translation had left out of the English text** was added, where the
  Japanese text has it too.
- **The names of Windows' two buttons** on the website's page for the Windows
  download are the ones that a Windows in the language shows, where a page
  with a picture of the warning or a quotation of it was found. The others
  are listed as not confirmed.

## The layout

One layout for every language, which follows the texts. English, Japanese and
Arabic look as they did: the screenshots of the e2e suite did not change.

- **The fields of the Date & Time settings** are as wide as their label and
  their widest choice need, and at least as wide as they were. A label of more
  than about 16 letters was cut, and a choice of two words was on two lines in
  the list of the choices. The row of the fields goes on to a second row when
  it does not fit.
- **The tabs of the Settings dialog** are as wide as the longest of their
  names.
- **The button that selects the photos within the chart's zoom** keeps its
  width in English, and is as wide as its text needs for three lines when the
  text would take more, up to 160px. With one width for all, the text took
  four lines in 24 languages, and a word of 15 letters was broken.
- **The summary of the thumbnail status bar** takes a second line when it
  would take more than half of the bar, rather than pushing the progress bar
  out of a narrow window.
- **The loading dialog** is as tall as its two texts need. It had a fixed
  height, in which a text of two lines pushed the second text out.
- **The table of the files without a thumbnail** has a column of numbers that
  is as wide as its header.
- **The count of the photos without a date**, in the chart's menu, is as tall
  as its lines.
- **The heading of the Welcome dialog, the text of the Open Folder button and
  the text of the chart's button** are broken into lines of about the same
  length where they take more than one, by one rule
  (`src/styles/_balanced-lines.scss`): the "Map" of the application's name was
  alone on a line in a dozen languages, and a single letter in Chinese. The
  application's name stays on one line in the heading. The rule also breaks
  Japanese between its phrases and Korean between its words, as lines of the
  same length otherwise break them after any letter (フォルダ / ーを開く).

`test/layout/` has the tool that goes through the application's screens in
every language and reports the texts that are cut, out of their box or on more
lines than in English, and the tool that puts the pictures of a screen in
every language side by side.

## Checks

On macOS (Apple Silicon), 2026-11-12.

- `npm run test:unit:ng` (437 tests) and `npm run lint:all` pass.
- The e2e suite passes with `PLM_VISUAL=1`: 49 cases, and one skipped as before.
  No screenshot changed: English, Japanese and Arabic look as they did. Two
  expectations of the Arabic case follow the texts: "Hide Others" of the
  application menu, which the review changed to macOS's word, and the Welcome
  dialog's heading, in which the application's name is now a value and so
  between U+2068 and U+2069. A new check, where the screenshots are compared,
  as a text's lines depend on the machine's font: the zoom button is 106px
  wide, on two lines, in English.
- `node test/layout/app-in-every-language.mjs --pictures`, with the final
  texts: 25 screens in each of the 42 languages. Every step ran, and the tool
  reports nothing that English does not have: no text that is cut or out of
  its box, to a side or in height, and none on more lines than in English.
  The zoom button, which is made for up to three lines, is on two in 9
  languages and on three in 33. By amount rather than by kind, one thing
  differs: the date under a thumbnail in the tree is cut by 3px in English at
  the sidebar's first width, and by up to 8px in other languages, whose short
  names of the days are longer. The tree is wider than the sidebar by design,
  and the sidebar can be made wider.
- The pictures were looked at as sheets of all languages side by side: the
  Date & Time settings, the status bars in windows of 1200px and of 800px, the
  question before a restart, the Welcome dialog's heading, the Open Folder
  button, the chart's button and the Language dialog in all 42 languages; the
  whole Welcome dialog, the Sort menu, a photo's popup with its menu and the
  chart's message in 12 to 27 languages each, with Arabic or Hebrew, Japanese,
  Korean and Chinese among them.

## Not done

- **No speaker has read the translations.** `docs/TRANSLATING.md` still says
  so of each language.
- **The OS tab of the Settings dialog** exists on Windows only, and was not
  looked at: its texts are in a dialog that grows with them. The application
  menu is drawn by the operating system.
- **The loading dialog** is on the screen for a moment only, and the tool
  catches it in some languages and not in others.
- **Chinese is broken after any letter**, as a browser has no rule for where
  its words end: on the Open Folder button in the narrowest sidebar, 打开文 /
  件夹 divides the word for a folder. The lines are of the same length there,
  where one letter was alone on the second line.

## Questions for the owner

None of these stops the pull request. The translations follow what each
answer is now.

- **English texts that the review found unclear**, which are the owner's:
  - `chart.changeUnitOrSelection`, "Please change
    Year/Month/Day/Hour/Minute/Second", does not say what is changed, the unit
    of a bar. Several translations now say "Choose another unit (Year/...)".
  - `photoInfo.pathTooLong` and `generatedThumbnailPathTooLong` give the two
    lengths without a unit. Most translations say "characters".
  - `chart.selectPhotosWithinZoom`, "Select Photos within Zoom", was translated
    word for word in many languages at first; "within the Zoomed Range" is
    what the Japanese says.
  - "the modified time of the file" is "Date modified" in Explorer and in
    Finder; the translations use the platform's name.
  - Two slips were corrected in `en.json`: "sometime it is missing"
    (sometimes), and "use the modified time" (uses) after "this application".
- **The separator ` - `** in `directoryTree.openedFolder` is a hyphen between
  spaces in every language. Russian and Ukrainian typography has ` — ` there,
  Bulgarian and Hebrew ` – `. It was left as one separator for all languages.
- **One word or two for when a photo was taken.** Japanese has 撮影日時 for
  both the sort ("Shooting Time") and Photo Data Viewer's row ("Date Taken").
  Some languages now have one word for both, others follow the English with
  two.
- **The Latvian quotation marks.** The texts have `„…”`, which the Latvian
  Language Agency recommends and Word writes. Latvian software has `“…”`:
  Microsoft's style guide for the texts of software, Chrome, Firefox, GNOME.
  They were left as they are, as each side has an authority: the other way is
  a change of the opening mark in 13 texts of the three places, with no word
  touched.
- **Choices that a speaker may want to make differently**, each recorded with
  its sources: Finnish `pikkukuva` (Windows, Android) for a thumbnail, where
  the first translation had Apple's `miniatyyri`; the Spanish of Spain, with
  no file for Latin America; a noun for "Developed by" in Polish, Lithuanian
  and Latvian, which is grammatically masculine.
