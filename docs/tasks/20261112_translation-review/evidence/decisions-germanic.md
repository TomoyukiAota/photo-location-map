# Decision log: `germanic` (de, nl, da, nb, sv, fi, et, hu)

One line for each term or text that is settled by evidence: the key or the term, the wording, the source, the
round. Append only. A line overturns an earlier one only by saying so and why.

Sources named in short (all read 2026-11-12):

- **Android Settings / Gallery / Files**: Android's own translations,
  `android.googlesource.com/platform/packages/apps/{Settings,Gallery2,DocumentsUI}/+/refs/heads/main/res/values-<code>/strings.xml`
  (add `?format=TEXT` and decode base64). The name in parentheses is the string's name.
- **Apple iPhone guide**: "Change the date and time on iPhone" in the language,
  `support.apple.com/<locale>/guide/iphone/iph65f82af3e/ios`. Apple has no Estonian.
- **Google Maps help (hu)**: `support.google.com/maps/answer/3093484?hl=hu`.
- **Vendor page**: a page written by a vendor in the language that quotes what Windows shows.

Earlier passes recorded these, which stand unless a line below says otherwise:
SmartScreen's two names in `de`, `nl`, `hu` (third-party support pages); `File Explorer` in `et` and `Ctrl+Skift`,
`Ctrl+Vaihto` in `da`, `nb`, `sv`, `fi` (Microsoft's page of Windows' keyboard shortcuts); `Google Utcakép` in `hu`
(google.com/intl/hu/streetview); `Aufnahmedatum`, `opnamedatum` for the shooting time in `de`, `nl`.

## All eight

- `landing.developedBy`, `about.developedBy`: the present ("is being developed by") or a noun ("the developer
  is"), never "has been developed". The Japanese has `開発しています` in all three places. Round 3 (changed in `nl`,
  `da`, `nb`, `fi`, `et`; `de`, `sv`, `hu` already had it).
- `appInfo.developedBy` (application): a label without a tense, as the English "Developed by" is: a participle
  (`Entwickelt von`, `Ontwikkeld door`, `Udviklet af`, `Utviklet av`, `Utvecklad av`) or a noun (`Kehittäjä:`,
  `Arendaja:`, `Fejlesztő:`). Stands; the participle of these languages does not agree with the person and is the
  usual form of a credit. Round 3.
- `sortByShootingTimeInfo.details.modifiedTime`: has "as an alternative" (`ersatzweise`, `als alternatief`,
  `i stedet`, `i stedet`, `i stället`, `vaihtoehtona`, `asendusena`, `helyette`), as the English and the Japanese
  (`代わりに`) do. Round 3 (added in `nl`, `fi`, `et`).
- `sortByShootingTimeInfo.details.otherFiles`: "Also," is left out in all eight. Stands: the four details are
  separate paragraphs, where the connective carries nothing. Judged in round 3, not changed.
- Ascending, Descending: `Aufsteigend`/`Absteigend`, `Oplopend`/`Aflopend`, `Stigende`/`Faldende`,
  `Stigende`/`Synkende`, `Stigande`/`Fallande`, `Nouseva`/`Laskeva`, `Kasvav`/`Kahanev`: Android Files
  (`sort_direction_ascending`, `sort_direction_descending`). `hu` `Növekvő`/`Csökkenő`: from knowledge of Windows.
  Round 3, confirmed.
- cache: `Cache` (`de`), `cache` (`nl`, `da`, `sv`), `buffer` (`nb`), `välimuisti` (`fi`), `vahemälu` (`et`),
  `gyorsítótár` (`hu`): Android Settings (`cache_header_label`, `clear_cache_btn_text`; `sv` there is
  `cacheminne`). Round 3, confirmed.
- `photoData.notAvailable`: `Nicht verfügbar`, `Niet beschikbaar`, `Ikke tilgængelig`, `Ikke tilgjengelig`,
  `Inte tillgängligt`, `Ei saatavilla`, `Pole saadaval`, `Nem érhető el`: the usual "not available" of a missing
  value in these languages. Judged in round 3 (another group changed the Russian, whose word means "cannot be
  reached"), not changed.

## German (`de`)

- 24-hour: `24-Stunden-Format`, `12- oder 24-Stunden-Format`: Android Settings (`date_time_24hour`:
  `"24-Stunden-Format"`). Apple's iPhone guide now has `„24 Stunden“`. Round 3, confirmed.
- SmartScreen: `Weitere Informationen`, `Trotzdem ausführen`: confirmed in round 1. Stands.
- thumbnail: `Miniatur`. Windows and Android have `Miniaturansicht` (Android Gallery `no_thumbnail`), Apple
  `Miniatur`; the same word, in its short form. Judged in round 3, not changed.
- where a photo was taken: `Aufnahmeort` (`about.photoLocationMap`): Android Gallery (`no_location`: `"Kein
  Aufnahmeort"`). Round 3, confirmed.
- location data: `Standortdaten`: Android Settings (`location_settings_title`: `"Standort"`). Round 3, confirmed.

## Dutch (`nl`)

- 24-hour: `24-uursnotatie`, `12- of 24-uursnotatie`. **Corrects the second pass**, which named macOS and iOS as
  the source: Apple has `24 uursklok` (iPhone guide; Mac guide of macOS 13,
  `support.apple.com/nl-be/guide/mac-help/mchlp1124/13.0/mac/13.0`) and Android `24-uurs klok gebruiken`
  (Settings, `date_time_24hour`). The text stands all the same: correct Dutch, beside `Datumnotatie` and
  `Datum- en tijdnotatie` (Android's heading is `Tijdnotatie`, `time_format_category_title`). Reopen only if the
  owner or a speaker prefers `24-uursklok`. Round 3, not changed.
- `about.developedBy` (Photo Data Viewer): `Deze app wordt ontwikkeld door …`, as the website. Round 3.
- thumbnail: `miniatuur`: Android Gallery (`"Geen miniatuur"`). Round 3, confirmed.
- `release-opmerkingen`: Microsoft writes `releaseopmerkingen`; the hyphen is allowed. Judged in round 3, not
  changed.
- The imperative on buttons (`Annuleer`, `Bewaar`, `Zoek`): macOS's style, recorded in round 1. Stands.
- SmartScreen: `Meer informatie`, `Toch uitvoeren`: confirmed in round 1. Stands.

## Danish (`da`)

- SmartScreen: `Flere oplysninger`, `Kør alligevel`: vendor page (ESET's Danish troubleshooting page,
  `help.eset.com/epi/2/da-DK/troubleshooting.html`: "Hvis du ikke kan se knappen Kør alligevel") and several Danish
  installers' READMEs on GitHub ("Klik Flere oplysninger og derefter Kør alligevel"). Round 3, confirmed; was
  "not confirmed".
- 24-hour: `24-timers ur`, two words: Apple iPhone guide ("Slå 24-timers ur til eller fra"). Android has
  `24-timers format`. Round 3, confirmed.
- `landing.developedBy`, `about.developedBy`: `udvikles af`. Round 3.
- location data: `lokalitetsdata` (Apple's `lokalitet`). Android Gallery and Microsoft have `placering`, Android
  Settings `lokation`: no single established word. Judged in round 3, not changed.
- thumbnail: `miniature`: Android Gallery (`"Ingen miniature"`). Round 3, confirmed.

## Norwegian Bokmål (`nb`)

- 24-hour: `24-timersklokke`, `12-timersklokke`, `12- eller 24-timersklokke`, one word: Apple iPhone guide ("Slå
  24-timersklokke av eller på"); the Norwegian Wikipedia's article `24-timersklokke`. Round 3 (was `24-timers
  klokke`).
- SmartScreen: `Mer informasjon`, `Kjør likevel`: Norwegian installers' READMEs on GitHub
  (`sverrekm/elecpath-releases`, `magnusnilsen/gutsaga`). Round 3, confirmed; was "not confirmed".
- cache: `buffer`: Android Settings (`"Buffer"`, `"Tøm bufferen"`) and Apple. Settles round 1's doubt
  (`hurtigbuffer` is Microsoft's alone). Round 3, confirmed.
- `landing.developedBy`, `about.developedBy`: `utvikles av`. Round 3.
- thumbnail: `miniatyrbilde`: Android Gallery. Round 3, confirmed.

## Swedish (`sv`)

- SmartScreen: `Mer information`, `Kör ändå`: vendor page (`scoreboardlive.se/docs/connect/smart-app-control`:
  "Klicka på Mer information och sedan på Kör ändå", title "Windows skyddade din dator"). Round 3, confirmed; was
  "not confirmed".
- 24-hour: `24-timmarsklocka`: Apple iPhone guide ("Slå på eller stäng av 24-timmarsklocka"); the Swedish
  Wikipedia's article. Android has `24-timmarsformat`. Round 3, confirmed.
- `photoData.general.dateTaken` (Photo Data Viewer): `Fotograferingsdatum`. **Corrects the second pass**, which
  named Windows as the source: Windows has `Fotodatum`
  (`learn.microsoft.com/sv-se/answers/questions/2639056/importera-foton-i-fotodatumordning`: "välj Fotodatum").
  The text stands all the same: the word of camera menus, and of one family with the application's
  `fotograferingstid`. Do not swap it back and forth; reopen only if the owner prefers Windows' word. Round 3,
  not changed.
- thumbnail: `miniatyr` (Windows, Apple); Android has `miniatyrbild`. Judged in round 3, not changed.

## Finnish (`fi`)

- thumbnail: `pikkukuva`, in all 17 texts of the application that name one: Windows (Explorer's "Näytä aina
  kuvakkeet, älä koskaan pikkukuvia", Disk Cleanup's `Pikkukuvat`;
  `learn.microsoft.com/fi-fi/answers/questions/4041212/resurssienhallinnassa-pikkukuvat`) and Android Gallery
  (`no_thumbnail`: `"Ei pikkukuvaa"`). `miniatyyri` is Apple's alone. Round 3 (was `miniatyyri`; both earlier
  passes had left the choice open).
- SmartScreen: `Lisätietoja`, `Suorita joka tapauksessa`: vendor pages
  (`asteri.fi/windows-suojasi-tietokonettasi-smartscreen/`, `atsoft.fi/ei-ole-yleisesti-ladattu.htm`). Round 3,
  confirmed; was "not confirmed".
- 24-hour: `24 tunnin kello`: Apple iPhone guide; the Finnish Wikipedia's article. Android has `24-tuntinen
  kello`. Round 3, confirmed.
- `welcome.usageInfoCollection`: `Sovelluksen parantamiseksi kerätään nimettömiä käyttötietoja.`, without
  `siitä`, as Photo Data Viewer's `about.usageData`. Round 3.
- `about.developedBy` (Photo Data Viewer): `Tämän sovelluksen kehittäjä on …`, as the website. Round 3.
- "Open with": `Avaa sovelluksessa`: Android Files (`menu_open_with`). Round 3, confirmed.
- sorting: `Järjestä` (Apple's); Windows and Android have `Lajittele`, `Lajitteluperuste`. Judged in round 3, not
  changed.

## Estonian (`et`)

- SmartScreen: `Veel teavet`, `Käivita siiski`: vendor page (`jutukuva.ee`: "klõpsa tekstilingil Veel teavet (More
  info)", "uus nupp Käivita siiski (Run anyway)", dialog titled "Windows kaitses teie arvutit"). One source only;
  an Estonian Windows would settle it. Round 3 (was `Lisateave`, `Käivita ikkagi`, from memory).
- 24-hour: `24-tunnine vorming`: Android Settings (`"24-tunnise vormingu kasutamine"`). Round 3, confirmed.
- `sortByShootingTimeInfo.step1`: `kasutab … DateTimeOriginal ja kui see puudub,`: one sentence from `intro`
  through `step2`, small letters at the start of both steps. Round 3.
- `settings.usageData.send` (Photo Data Viewer): `Saada kasutusandmeid rakenduse täiustamiseks`. Round 3.
- `about.developedBy` (Photo Data Viewer): `Seda rakendust arendab …`, the website's verb. Round 3.
- thumbnail: `pisipilt`: Android Gallery; the Estonian Wikipedia's article. Round 3, confirmed.
- "Open with": `Ava rakendusega`: Android Files. Round 3, confirmed.
- context menu: `kontekstimenüü`; Microsoft has `kiirmenüü`. Both in use; judged in rounds 1 to 3, not changed.
- macOS has no Estonian, so the application menu follows Windows' words (`Loobu`, `Võta tagasi`, `Tee uuesti`).

## Hungarian (`hu`)

- Google Maps with a case ending: `a Google Térképen` (`Megnyitás a Google Térképen`, `Megjelenítés a Google
  Térképen`): Google Maps help (hu), 11 times on the page, never `Térképben`; Android Gallery (`show_on_map`:
  `"Megjelenítés a térképen"`). Round 3 (was `Térképben`).
- Google Street View with a case ending: `a Google Utcaképben`. Google's help has both `az Utcaképen` and `az
  Utcaképben`. Judged in round 3, not changed.
- 24-hour: `24 órás formátum`: Android Settings (`"24 órás formátum használata"`). Apple has `24 órás idő`.
  Round 3, confirmed.
- `photoInfo.pathTooLong`, `photoInfo.generatedThumbnailPathTooLong`: `{{length}} karakter`, the unit on both
  numbers. Round 3.
- location data: `helyadat`: Android Gallery (`"Nincs helyadat"`). Round 3, confirmed.
- SmartScreen: `További információ`, `Futtatás mindenképpen`: confirmed in round 1. Stands.

## Round 3, lines added after macOS's own texts were read

Source: **macOS tables**, the localization tables of macOS 27 on the owner's machine (TextEdit's `Edit.loctable`,
AppKit's `MenuCommands.loctable` and `Common.loctable`, Preview's and Photos' tables, the Date & Time settings);
how to read them is in `sources.md`. macOS has no Estonian.

- `menu.app.*` (shown on macOS only), all seven languages that macOS has: About, Services, Hide, Hide Others,
  Show All and Quit are macOS's own items, word for word (`Andere ausblenden`, `Verberg andere`, `Toon alles`,
  `Slut …`, `Göm övriga`, `Kätke muut`, `Tietoja: …`, `A … névjegye`). macOS tables. Round 3, confirmed.
- `hu` `menu.app.hideOthers`, `menu.app.showAll`: `Többi elrejtése`, `Összes megjelenítése`, without the article:
  macOS tables. Round 3 (were `A többi elrejtése`, `Az összes megjelenítése`).
- `nl` `menu.view.actualSize`: `Werkelijke grootte`: macOS tables; Chrome on Windows has the same (from
  knowledge). Round 3 (was `Ware grootte`, an older macOS's word).
- Actual Size in `de`, `da`, `nb`, `sv`, `fi`, `hu`: `Originalgröße`, `Faktisk størrelse`, `Faktisk størrelse`,
  `Verklig storlek`, `Todellinen koko`, `Tényleges méret`: macOS tables. Round 3, confirmed.
- `menu.view.*` and `menu.selection.*` are shown on all three systems. Where the file has Windows' word and macOS
  another (Undo `Rückgängig`, `Kumoa`; Redo `Gjør om`, `Tee uudelleen`, `Mégis`; View `Ansicht`, `Vis`, `Visa`),
  it stands: each is one platform's own word. Judged in round 3, not changed.
- `nb` 24-hour, `24-timersklokke`: macOS tables too (Date & Time settings). Round 3.
- `fi` thumbnail: macOS has `Miniatyyrikuvat` (Preview), so the former `miniatyyri` was not Apple's exact word
  either. `pikkukuva` stands. Round 3.
- `hu` Ascending, Descending: `Növekvő`, `Csökkenő`: macOS tables (Photos). Round 3, confirmed (was "from
  knowledge").
- `da` `menu.selection.title`: `Valg`. macOS's "Selection" is `Det valgte`; `Markering` is the other candidate.
  Still open; not changed in rounds 1 to 3.

## Round 4

Sources added (read 2026-11-12): **Microsoft's shortcuts page**, the page of Windows' keyboard shortcuts in the
language, `support.microsoft.com/<locale>/windows/keyboard-shortcuts-in-windows-dcc61a57-8ff0-cffe-9796-cb9706c75eec`;
**Android framework** and **AppCompat**, `android.googlesource.com/platform/frameworks/base/+/refs/heads/main/core/res/res/values-<code>/strings.xml`
and `…/platform/frameworks/support/+/refs/heads/androidx-main/appcompat/appcompat/src/main/res/values-<code>/strings.xml`.

- `fi` `photoInfo.moreOptions`: `Lisävalinnat`. macOS tables (the label "More Options" in Preview, Home, Freeform, Stocks,
  Journal and AirPort Utility; `Lisää valintoja…` is the command "More Options…" with dots, in Podcasts, Home and
  AirPort Utility). `Lisää valintoja` also read "Add selections" in an application
  where `valinta` is the selection of photos. Round 4 (was `Lisää valintoja`).
- `fi` `thumbnailGeneration.showDetails`: `Näytä lisätiedot`: macOS tables (AppKit's "Show Details"); details are
  `lisätiedot` in every other Finnish text of the three places, and `Näytä tiedot` is "View Data". Round 4 (was
  `Näytä tiedot`).
- `da` `about.usageData` (Photo Data Viewer): `brugsoplysninger`, the word of the application's and the website's
  texts on what is collected. **Overturns round 3's "left"** (it had `oplysninger om brugen`): the three texts say
  the same thing and now use one word, as the other seven languages do. Round 4.
- "More Options" in the other seven: `Weitere Optionen`, `Meer opties`, `Fler alternativ`, `Rohkem valikuid`,
  `További lehetőségek` (Android framework, `action_menu_overflow_description`; macOS tables for `de`, `nl`, `sv`,
  `hu`), `Flere valg` (`nb`, macOS tables), `Flere muligheder` (`da`, macOS tables, in Home; `Flere indstillinger`
  in five other applications, which is this application's word for Settings). Round 4, confirmed.
- Explorer's name, all eight: `Explorer`, `Verkenner`, `Stifinder`, `Filutforsker`, `Utforskaren`,
  `Resurssienhallinta`, `File Explorer`, `Fájlkezelő`: Microsoft's shortcuts page. The German page also writes
  `Datei-Explorer`; `Explorer` stands (Windows' own window; both guides). Round 4, confirmed.
- The menu of a right-click: `genvejsmenu` (`da`), `hurtigmeny` (`nb`), `snabbmeny` (`sv`), `pikavalikko` (`fi`),
  `helyi menü` (`hu`), `Kontextmenü` (`de`): Microsoft's shortcuts page, 6 times each. `nl` `contextmenu`: the
  same page has it 3 times and `snelmenu` 3 times. Round 4, confirmed.
- `et` context menu: `kontekstimenüü`: Microsoft's shortcuts page has it 4 times and `kiirmenüü` twice. Settles
  the doubt of rounds 1 to 3. Round 4, confirmed.
- Undo, Redo as Windows has them: `Ångra`/`Gör om` (`sv`), `Kumoa`/`Tee uudelleen` (`fi`), `Võta tagasi`/`Tee
  uuesti` (`et`), `Angre`/`Gjør om` (`nb`), `Visszavonás` (`hu`): Microsoft's shortcuts page; Android framework
  (`undo`, `redo`) for `sv`, `et`, `hu`'s Undo. Round 4, confirmed (were "from knowledge of Windows").
- Redo where the platforms differ: `nb` `Gjør om` (Windows; macOS and Android `Utfør likevel`), `fi` `Tee
  uudelleen` (Windows; macOS `Tee sittenkin`, Android `Toista`), `hu` `Mégis` (Windows, from knowledge; macOS
  `Ismétlés`, Android `Újra`), `da` `Gentag` (macOS; Windows and Android `Annuller fortryd`). Each is a
  platform's own word. Judged in round 4, not changed.
- `da` `menu.selection.title`: `Valg` **stands**: the noun of the file's verb `Vælg` (macOS's "Select"). macOS's
  "Selection" is `Det valgte` (TextEdit) and `Vælgeværktøj` (Preview's tool); `Markering` is Microsoft's noun, but
  its verb is not the file's. Judged in rounds 1 to 4; reopen only with a Danish speaker's word.
- `nl` `Weergave` for both `settings.tabs.appearance` and `menu.view.title`: macOS tables have the one word for
  both. Judged in round 4, not changed.
- `hu` `Nagyítás` for both `chart.zoom` and "Zoom in"; `fi` `Lisää` for both "Add" and "More" (Android framework,
  `more_item_label`). Judged in round 4, not changed.
- `et` SmartScreen (`Veel teavet`, `Käivita siiski`): still the one source of round 3; three more searches found
  no second page. Round 4, not changed.
- "Unsupported File Format", "Not Available", General, File Name, File Size, "Show Details", Zoom In, Zoom Out
  in the seven languages of macOS: the files' wordings are macOS's own (macOS tables: Photos, AppKit, TextEdit),
  except Danish's `Filnavn` (Windows'; macOS `Arkivnavn`) and Hungarian's `Nagyítás`/`Kicsinyítés` and `Nem érhető
  el` (Windows'; macOS `Felnagyítás`/`Lekicsinyítés`, `Nem áll rendelkezésre`). Round 4, confirmed.

## Round 5

No text was changed. Sources added (read 2026-11-12): **Chrome**, Chromium's own translations,
`chromium.googlesource.com/chromium/src/+/main/chrome/app/resources/generated_resources_<code>.xtb?format=TEXT`
(base64; the messages are keyed by number, so search for the wording); **Firefox (et)**,
`raw.githubusercontent.com/mozilla-l10n/firefox-l10n/main/et/browser/browser/menubar.ftl`; **Microsoft's page on
Undo and Redo (hu)**, `support.microsoft.com/hu-hu/office/undo-redo-or-repeat-an-action-84bdb9bc-4e23-4f06-ba78-f7b893eb2d28`.

- `et` `menu.app.*` (macOS only; macOS has no Estonian): `Peida {{appName}}`, `Peida teised`, `Kuva kõik`,
  `Teenused`, `Välju rakendusest {{appName}}`, `Teave rakenduse {{appName}} kohta`: Chrome (`Peida <name>`,
  `Peida teised`, `Kuva kõik`, `Teenused`, `Välju rakendusest <name>`, `Teave <name> kohta`). Firefox (et) has
  `Varja`, `Varja teised`, `Näita kõiki`; Chrome's stand, with Microsoft's verbs `Peida` and `Kuva` that the
  other Estonian texts have. Round 5, confirmed (no source before).
- `et` View, Zoom In, Zoom Out, Actual Size, Reload, Undo, Redo, Help: `Vaade`, `Suurenda`, `Vähenda`, `Tegelik
  suurus`, `Laadi uuesti`, `Võta tagasi`, `Tee uuesti`, `Abi`: Chrome, word for word. Round 5, confirmed.
- `hu` Redo: `Mégis` is Microsoft's own ("válassza a Mégis gombot", Microsoft's page on Undo and Redo). Chrome
  and Android have `Újra`, macOS `Ismétlés`. Stands, as one platform's own word (round 4's judgement). Round 5,
  confirmed (was "from knowledge").
- `de` Undo, Redo, Actual Size, Zoom In, Zoom Out, Reload: `Rückgängig`, `Wiederholen`, `Originalgröße`,
  `Vergrößern`, `Verkleinern`, `Neu laden`: Chrome. Round 5, confirmed (`Rückgängig` was "from knowledge").
- `de` Appearance: `Darstellung`: Chrome. macOS has `Erscheinungsbild`. Round 5, confirmed.
- `nl` Actual Size: `Werkelijke grootte`: Chrome (`We&rkelijke grootte`), besides macOS. Round 5, confirmed.
- `nl` `about.usageData`, "the approximate location": `de geschatte locatie`: Android framework
  (`permlab_accessCoarseLocation`: "toegang tot geschatte locatie"). Settles round 4's "Equally good, left".
  Round 5, confirmed.
- `fi` Rotate: `Kierrä`: Android Gallery (`rotate_left`, `rotate_right`). macOS has `Pyöritä`. Round 5,
  confirmed.
- `fi` Undo, Redo, Zoom In, Zoom Out, Actual Size, Reload: `Kumoa`, `Tee uudelleen`, `Lähennä`, `Loitonna`,
  `Todellinen koko`, `Lataa uudelleen`: Chrome. Round 5, confirmed.
- `sv` Zoom In, Zoom Out, Reload, Appearance, Downloads: `Zooma in`, `Zooma ut`, `Läs in igen`, `Utseende`,
  `Nedladdningar`: Chrome. macOS has `Hämtningar` for Downloads. Round 5, confirmed.
- `da` Downloads and its verb: `Overførsler`, `Hent`: macOS tables (Maps). Chrome keeps `Downloads`. `Genindlæs`,
  `Udseende`, `Faktisk størrelse`: Chrome. Round 5, confirmed.
- Appearance in `nl`, `da`, `nb`, `sv`, `fi`, `hu`: `Weergave`, `Udseende`, `Utseende`, `Utseende`, `Ulkoasu`,
  `Megjelenés`: macOS tables (System Settings). `et` `Välimus`: Chrome. Round 5, confirmed.
- Add, Remove in the seven languages of macOS: as in the files: macOS tables (Photos). Round 5, confirmed.
- `et` `sortByShootingTimeInfo.moreDetails` and `details.intro`: `Rohkem üksikasju`, then `Allpool on
  lisateave:`, two nouns for the English "details for reference". Chrome has both wordings; near synonyms.
  Judged in round 5, not changed: do not swap either.
- `nb` `lage` for generating thumbnails, `genererte` as the participle before the noun. Judged in round 5, not
  changed.
- `hu` `exe fájlra` (website) and `JPEG/HEIF/TIFF fájl` (application), written apart, beside `HEIF-fájl`:
  Chrome writes `PDF-fájl`, `CSV-fájl`, `HTML-fájl`, and the rule asks for the hyphen after an abbreviation;
  an extension in small letters is very often written apart, and no authority on this case was found. Judged in
  round 5, not changed; reopen only with a Hungarian speaker's word or a page of an authority.
- `et` SmartScreen (`Veel teavet`, `Käivita siiski`): still the one source of round 3; two more extended
  searches found no second page. Round 5, not changed.

## Round 6

Two texts were changed, both Estonian, both on the website. Sources added (read 2026-11-12): **id.ee**, the
Estonian state's page for its ID-card software, `https://www.id.ee/artikkel/windows-id-tarkvara-paigaldus-loppes-torkega/`
(modified 2024-04-22), with a picture of the SmartScreen warning on an Estonian Windows
(`https://www.id.ee/wp-content/uploads/2022/06/w10_skripti_kaivitamisel_teade-windowskaitsesteiearvutit_est-1024x468.png`);
**GitHub's code search** for a button's name in the language (`gh search code '"Käivita siiski"'`), which finds
READMEs by speakers; **Microsoft Learn**, `learn.microsoft.com/<locale>/power-automate/desktop-flows/dynamics365-cs-rpa`
("Select More info > Run anyway"; weak, see below); **Chrome** for Norwegian (`generated_resources_no.xtb`).

- `et` SmartScreen "More info": `Lisateave`. **Overturns round 3's `Veel teavet`**, with stronger evidence: the
  picture on id.ee shows the warning on an Estonian Windows with the title `Windows kaitses teie arvutit`, the
  link `Lisateave` and the buttons `Käivita siiski` and `Ära käivita`, and the article says `vajuta tekstile
  "Lisateave" ning jätkamiseks nupule "Käivita siiski"` for Windows 10 and 11; `mp3o7/Bitman`'s README on GitHub
  says the same. Round 3's source (jutukuva.ee) has no picture and writes its own Estonian for English labels
  (`Süsteemi sätted (System Settings)` for macOS, which has no Estonian). Settled; do not change it back
  without a picture of a newer Estonian Windows that shows another name. Round 6 (`downloading.step2`,
  `downloading.moreInfoImageAlt`).
- `et` SmartScreen "Run anyway": `Käivita siiski`: the same picture and article. Round 3's change stands and is
  now confirmed by a second and a third source. Round 6, confirmed.
- Microsoft Learn's page as a source for the SmartScreen names: not to be relied on by itself. Marked as a
  human translation, the German page has `Mehr Info>Wie auch immer ausführen` and the Swedish `Kör i alla fall`,
  which no page that quotes a Windows has; the Estonian page (machine translation) has `Lisateave>Käivita
  ikkagi`, half right. It agrees with the files in `nl`, `da`, `nb`, `fi`. Round 6.
- `nb` SmartScreen: `Mer informasjon`, `Kjør likevel`: Microsoft Learn's Norwegian page (human translation:
  `Velg Mer informasjon>Kjør likevel på skjermen Windows beskyttet PC-en`), besides round 3's READMEs. Round 6,
  confirmed.
- `sv`, `da`, `fi` SmartScreen: more pages that quote the files' names (`JesperE98/Codestead`,
  `GuilhermeFelix95/lunaCode`; `mortensp/DBF`, `Distribuerede-Systemer-2018/restfull-dis`;
  `PlanB-Network/bitcoin-educational-content`, all on GitHub). Round 6, confirmed; still not read off a picture.
- `nb` Reload, Actual Size, Zoom In, Zoom Out, Undo, Redo, Downloads, Appearance, Save, Cancel, Close, Delete,
  Remove, Add, Search, Help, Settings: as in the files: Chrome (`no`), word for word. `Gjør om` is Chrome's Redo
  as well as Windows'. Round 6, confirmed (Chrome's Norwegian had not been read).
- `nb` cache `buffer`, thumbnails `miniatyrbilder`: Chrome (`bufferen` in 17 texts, `hurtigbuffer` in none).
  Round 6, confirmed.
- `hu` `Nagyítás` for both `chart.zoom` and "Zoom in": Chrome has `Nagyítás` for "Zoom" and for "Zoom In".
  Settles round 4's "left". Round 6, confirmed.
- Developer Tools, all eight: `Entwicklertools`, `ontwikkelaarstools`, `udviklerværktøjer`, `utviklerverktøy`,
  `utvecklarverktyg`, `kehittäjän työkalut`, `arendaja tööriistad`, `Fejlesztői eszközök`: Chrome. Its menu
  item is `Kehittäjätyökalut` in Finnish and `Verktyg för utvecklare` in Swedish, and it has the files' forms
  too (`Kehittäjän työkalut`; `utvecklarverktyg` in a sentence). Round 6, confirmed; do not swap `fi` or `sv`.
- "Open with" in `fi`, `et`, `hu` (`Avaa sovelluksessa`, `Ava rakendusega`, `Megnyitás ezzel:`): Chrome, word
  for word. Round 6, confirmed.
- `nl` `language.loadFailed` (Photo Data Viewer), `De taal kan niet worden geladen.`, in the present; `fi`
  `nimettömiä käyttötietoja` for "anonymous usage information"; `fi` `Lisävalikko` for "Advanced Menu"; `fi`,
  `hu` "files with errors" as "faulty files". Judged in round 6, not changed.
- `hu` `exe fájlra`: one more extended search, no page of an authority. Round 6, not changed.

## Round 7

Two texts were changed, both Estonian, both on the website. Sources added (read 2026-11-12): **Microsoft's style
guide**, the localization style guide of the language, a PDF linked from
`learn.microsoft.com/en-us/globalization/reference/microsoft-style-guides` (`aka.ms/german-styleguide`,
`dutch-`, `danish-`, `Norwegian-bokmal-`, `swedish-`, `finnish-`, `estonian-`, `hungarian-styleguide`); how to
read it is in `sources.md`.

- `et`, a name of the interface after `klõpsake`: a noun before the quoted name, declined (`Klõpsake linki
  „Lisateave“`, `Klõpsake nuppu „Käivita siiski“`, as Photo Data Viewer's `Kui klõpsate nuppu „Käivita demo“`).
  Microsoft's style guide (et): "the use of modifiers is required with the verb „click“ (klõpsake) and optional
  with the verb „select“ (valige)", `+ Klõpsake nuppu Salvesta.`; id.ee and `mp3o7/Bitman` have a noun too
  (`tekstile "Lisateave"`, `nupule "Käivita siiski"`). Round 7 (`downloading.step2`, `downloading.step3`; were
  without the noun).
- Quotation marks, all eight: `„ “` (`de`, `et`), `‘ ’` (`nl`), `« »` (`nb`), `” ”` (`sv`, `fi`), `„ ”` (`hu`):
  Microsoft's style guide of each language. `da` `“ ”`: CLDR's; Microsoft's Danish guide has the straight marks,
  which the application's guide rules out. Round 7, confirmed.
- The names of keys in `Ctrl+Shift+I`: `Skift` (`da`, `nb`, `sv`), `Vaihto` (`fi`), `Shift` kept (`nl`, `et`,
  `hu`), `Umschalt` (`de`): Microsoft's style guide of each language (the table of keys and of Windows'
  shortcuts). Round 7, confirmed (the shortcuts page of round 1 agrees).
- Cancel: `Abbrechen`, `Annuller`, `Avbryt` (`sv`), `Peruuta`, `Loobu`: Microsoft's style guide (`Cancel Esc …`).
  `et` `Loobu` is therefore Windows' own (Chrome: `Tühista`); `fi` `Peruuta` is Windows' (macOS has `Kumoa` for
  Cancel, which is the file's Undo, as Windows has it). `nl` `Annuleer` and `hu` `Mégsem` are macOS's (macOS
  tables); Microsoft has `Annuleren`, `Mégse`. Each is a platform's own word. Round 7, confirmed; `hu` and `nl`
  judged, not changed.
- Undo, Redo: `Rückgängig`, `Angre`, `Ångra`, `Kumoa`/`Tee uudelleen`, `Võta tagasi`, `Visszavonás`, `nl`
  `Opnieuw` (Redo): Microsoft's style guide (`Edit Undo`, `Edit Repeat`). Round 7, confirmed.
- The menu of a right-click: `Kontextmenü`, `genvejsmenu`, `snabbmeny`, `helyi menü`: Microsoft's style guide
  ("Display pop-up menu"). Round 7, confirmed (besides round 4's shortcuts page).
- The form of address: formal in `de` (`Sie`; `du` only for children) and `hu` (`önözés`), the plural `teie` in `et`, the singular in `fi`
  (`sinuttelu`): Microsoft's style guide of each language. Round 7, confirmed.
- `hu`, a hyphen after an abbreviation or a name in a compound (`HEIF-fájl`, `EXIF-adatok`, `GitHub-profil`):
  Microsoft's style guide (hu): "When forming compounds with acronyms, they should always be hyphenated",
  `Excel-fájl`, `Windows-verzió`; `TCP/IP protokoll` and `Word szövegszerkesztő` are written apart. It has
  nothing on `exe fájl` or `JPEG/HEIF/TIFF fájl`, which stay as they are. Round 7.
- `da`, the accent on an imperative in `-er`: `Sorter` (application; macOS tables, Photos) and `Kontrollér`
  (Photo Data Viewer; Microsoft's style guide: "sortér, markér, kontrollér, kopiér", where macOS has `Sorter`,
  `Kontroller`, `Kopier`). The accent is optional; each word is as one platform writes it. Judged in round 7,
  not changed; reopen only with a Danish speaker's word.
- `de` `z. B.` with an ordinary space (Photo Data Viewer's `iosNote`): Microsoft's style guide asks for a
  no-break space in the abbreviation and, elsewhere, for none that the source does not have. Judged in round 7,
  not changed.
- `fi` `Klikkaa ”Lisätietoja”`, the name without a noun: Microsoft's style guide (fi) leaves it to the
  translator; macOS has the bare name (macOS tables, AppKit: `klikkaa Muokkaa`). Judged in round 7, not changed. `fi` `esim.`: stands, as the
  English "e.g.".
