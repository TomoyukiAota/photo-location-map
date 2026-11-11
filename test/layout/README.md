# The layout in every language

The application has one layout for every language, which has to hold whatever
the length of a language's words and sentences is (`AGENTS.md`, "One layout
for every language, which gives the texts room"). The e2e suite looks at
English, Japanese and Arabic only, so that it does not get slower with every
language. The tools here look at all of them, when a layout or a text that is
shown where room is short has changed. They are run by hand, not in CI.

## Find what does not fit

Build the application, then let it go through its screens in every language:

```sh
mise exec -- npm run build:dev
mise exec -- node test/layout/app-in-every-language.mjs
```

It takes about half a minute per language, and keeps the application's windows
off the screen as the e2e suite does (`test/e2e/README.md`). `--languages=de,fi`
goes through those languages only, and English, which the others are compared
with.

In each screen it looks for:

- **cut**: a text that an element around it cuts, with "..." or at its edge;
- **outside**: a text that reaches outside its dialog, the map or the window;
- **lines**: the text of a button, a tab, a menu item, a label or a heading
  that is on more than one line;
- **scrolls**: a box that scrolls because its content does not fit.

It prints what a language has and English does not have in the same screen,
then what English itself has, which is the application's design (the name of a
file in the narrow tree, the details of the Sort dialog, which scroll). A
finding is a place to look at, not always a fault: the text of a long button
may well take two lines. `measurements.json` in the output folder (the system's
temporary folder, or `--output=<folder>`) has everything.

The screens are listed at the top of `app-in-every-language.mjs`. The OS tab of
the Settings dialog exists on Windows only, and the application menu is drawn
by the operating system: neither is looked at on macOS.

## Look at every language

Numbers do not show a text that is merely ugly where it is. With `--pictures`,
the tool also writes a picture of each screen in each language, and
`contact-sheets.mjs` puts the pictures of one screen side by side, 20 languages
on a sheet:

```sh
mise exec -- node test/layout/app-in-every-language.mjs --pictures --output=/tmp/layout
mise exec -- node test/layout/contact-sheets.mjs /tmp/layout settings-datetime-changed
mise exec -- node test/layout/contact-sheets.mjs /tmp/layout home-loaded --width=600 --columns=2 --rows=2
```

Look at the sheets of the screens that the change touches, in all languages:
German has long words; Finnish, Greek and the Slavic languages have long
sentences; Arabic and Hebrew are laid out from right to left.

## When a text does not fit

Change the layout, not the text, and for every language alike: an element as
wide as its text needs, a sentence that takes another line, two things side by
side that go one above the other when they do not fit. Do not size the layout
for the longest text among the languages, which leaves empty room in the
others: what fits in English keeps its size in English. A translation is not
shortened or abbreviated for its room (`docs/TRANSLATING.md`, "Writing the
texts").
