# Decision log: `central` (cs, sk, pl, hr, sl, sr-Latn, lt, lv)

One line for each term or text that is settled by evidence: the key or the term, the wording, the source, the
round. Append only. A line overturns an earlier one only by saying so and why.

Sources named in short:

- **MS Explorer page**: Microsoft's page "File Explorer in Windows" in the language,
  `support.microsoft.com/<locale>/windows/experience/fileexplorer/file-explorer-in-windows` (read 2026-11-12).
- **Firefox**: `<code>/browser/browser/menubar.ftl` in `mozilla-l10n/firefox-l10n` on GitHub (read 2026-11-12).

## All eight

- `appInfo.developedBy` (application): the present tense or a label with a noun, never a past participle. The
  website's `landing.developedBy`, Photo Data Viewer's `about.developedBy` and the Japanese text of all three
  (`開発しています`) have the present. Round 3 (changed in cs, sk, hr, sl, sr-Latn; pl, lt, lv had a label).
- The order of a format's name and its noun follows the language's files: noun first in cs, sk, pl, hr, sl,
  sr-Latn (`soubory HEIF`, `datoteke HEIF`, `datoteku exe`), name first in lt and lv (`HEIF failai`,
  `exe failą`). Round 3 (hr and sr-Latn `downloading.step1` brought into line).
- No text needs plural forms; checked again for any number and for both names. First pass, round 3.

## Czech (`cs`)

- Explorer: `Průzkumník souborů`, declined as an animate noun (`otevřete Průzkumníka souborů`). MS Explorer page;
  first pass. Round 3 confirmed.
- Context menu: `místní nabídka`. MS Explorer page ("zjednodušenou místní nabídku"; the page also has
  `kontextová nabídka`). Round 3 confirmed.
- `menu.app.*`: `O aplikaci …`, `Skrýt …`, `Skrýt ostatní`, `Zobrazit vše`, `Služby`, `Ukončit …`;
  `menu.view.actualSize` `Skutečná velikost`; `menu.help.title` `Nápověda`. Firefox. Round 3 confirmed.
- SmartScreen: `Další informace` / `Přesto spustit`. A software vendor's Czech support article (first pass).
  Note of round 3: another vendor's Czech help has `Více informací` for the link, so vendors' pages disagree;
  the first pass's source is a Czech company's own article and stays.

## Slovak (`sk`)

- A file's date modified: `dátum úpravy` (not `dátum zmeny`). Microsoft's Slovak article on Work Folders:
  "podľa názvu, typu, veľkosti alebo dátumu úpravy"
  (`support.microsoft.com/sk-sk/windows/experience/connectivity-networking/work-folders-faq`). Round 3 (changed in
  three texts of `sortByShootingTimeInfo`).
- Explorer: `Prieskumník`; context menu: `kontextová ponuka`. MS Explorer page. Round 3 confirmed.
- `Windowsu`, `vo Windowse`: Microsoft declines the name in Slovak (the title of the MS Explorer page is
  "Prieskumník vo Windowse"). Round 3 confirmed.
- `menu.app.*`: `O aplikácii …`, `Skryť …`, `Skryť ostatné`, `Zobraziť všetko`, `Služby`, `Ukončiť …`;
  `menu.view.title` `Zobraziť`; `Priblížiť`; `Skutočná veľkosť`; `Pomocník`. Firefox. Round 3 confirmed.
- Latitude and longitude of a photo: `zemepisná šírka a dĺžka`. Microsoft's Slovak help of the Photos
  application. Round 3 confirmed.
- SmartScreen `Spustiť aj tak`: also in a security vendor's Slovak help. The link (`Ďalšie informácie` here,
  `Viac informácií` there) is NOT settled. Round 3.

## Polish (`pl`)

- Explorer: `Eksplorator plików`; context menu: `menu kontekstowe`. MS Explorer page. Round 3 confirmed.
- Location data: `dane o położeniu` stays. Apple's Polish has `położenie` ("Zarządzanie informacjami o
  położeniu", support.apple.com); Microsoft and Google have `lokalizacja`; both established. Round 3.
- Where a photo was taken: `miejsce wykonania zdjęcia`. Apple's Polish guide of Preview ("Sprawdzanie miejsca
  wykonania zdjęcia"). Round 3 confirmed.
- `menu.app.*`: `Ukryj …`, `Ukryj pozostałe`, `Pokaż wszystkie`, `Usługi`, `Zakończ …`; `Widok`, `Powiększ`,
  `Pomniejsz`, `Pomoc`. Firefox. Round 3 confirmed.
- SmartScreen: `Więcej informacji` / `Uruchom mimo to`. Two software vendors' Polish pages agree (first pass,
  round 3). Settled.

## Croatian (`hr`)

- Explorer: `Eksplorer za datoteke`; context menu: `kontekstni izbornik`; folder: `mapa`; View: `Prikaz`.
  MS Explorer page. Round 3 confirmed.
- `menu.app.quit`: `Zatvori {{appName}}`. Firefox has `Zatvori …` for Quit on macOS. Round 3 confirmed (the
  first pass's doubt).
- `menu.app.*`: `Sakrij …`, `Sakrij ostale`, `Prikaži sve`, `Usluge`; `Stvarna veličina`; `Pomoć`. Firefox.
  Round 3 confirmed.
- SmartScreen: `Više informacija` / `Svejedno pokreni`: a security vendor's Croatian help agrees; NOT read off
  Windows, not settled. Round 3.

## Slovenian (`sl`)

- Explorer: `Raziskovalec`; context menu: `priročni meni`; folder: `mapa`; View: `Pogled`. MS Explorer page.
  Round 3 confirmed.
- `menu.app.*`: `Skrij …`, `Prikaži vse`, `Storitve`; `Povečaj`, `Pomanjšaj`, `Dejanska velikost`, `Pomoč`.
  Firefox. Round 3 confirmed.
- SmartScreen: `Več informacij` / `Vseeno zaženi`: a Slovenian university press's download guide is reported by
  a search to name both so; I could not read the PDF. Supported, not settled. Round 3.

## Serbian, Latin (`sr-Latn`)

- Explorer: `Istraživač datoteka`; context menu: `kontekstualni meni`; folder: `fascikla`; View: `Prikaz`.
  MS Explorer page. Round 3 confirmed.
- Settings: `Podešavanja` stays, though Windows has `Postavke` (Microsoft's Serbian pages); both established,
  no swap. Round 3.

## Lithuanian (`lt`)

- `menu.app.quit`: `Baigti „{{appName}}“ darbą`. Firefox (`menu-quit-mac`). Round 3 (changed from
  `Išjungti „{{appName}}“`).
- `išjungti` is "turn off" (Photo Data Viewer's `about.usageData`), not "quit". Round 3.
- Explorer: `Failų naršyklė`; context menu: `kontekstinis meniu`; folder: `aplankas`. MS Explorer page.
  Round 3 confirmed.
- `menu.app.about` `Apie „…“`, `menu.app.services` `Paslaugos`, `menu.view.title` `Rodymas`, `menu.help.title`
  `Žinynas`. Firefox. Round 3 confirmed.

## Latvian (`lv`)

- Context menu of Explorer: `kontekstizvēlne` (not `konteksta izvēlne`). MS Explorer page ("jaunajai
  kontekstizvēlnei"). Round 3 (changed in six texts of `settings.os`).
- Explorer: `Failu pārlūks`; folder: `mape`; View: `Skats`. MS Explorer page. Round 3 confirmed.
- "collects": `apkopo` / `tiek apkopota` stays. Microsoft's Latvian privacy statement ("Personas dati, ko
  apkopojam", "Microsoft apkopo datus") and Google's Latvian privacy policy ("Google apkopotā informācija").
  Round 3 confirmed (the first pass's doubt).
- `menu.app.about` `Par …`, `menu.app.hide` `Paslēpt …`, `menu.app.quit` `Iziet no …`, `Skats`, `Palīdzība`.
  Firefox. Round 3 confirmed.

## Round 4 (2026-11-12)

Sources named in short:

- **macOS**: Apple's texts in the `.loctable` files of macOS 27.0.1 on the owner's machine (TextEdit's
  `Edit.loctable`; the `MainMenu.loctable` of Preview, Photos, Notes, Mail, Calendar; AppKit's
  `MenuCommands.loctable`, `Common.loctable`; the Date & Time settings' `Localizable.loctable`). It has `cs`,
  `sk`, `pl`, `hr`, `sl`; no Serbian, Lithuanian or Latvian. How to read them:
  `sources.md`.
- **Android**: `res/values-<code>/strings.xml` of `Settings`, `Gallery2`, `DocumentsUI` on
  `android.googlesource.com`.
- **Google's help**: `support.google.com/maps/answer/144349?hl=<code>` and `…/answer/3093484?hl=<code>`.

### All eight, round 4

- `menu.app.services`, `hide`, `hideOthers`, `showAll`, `quit` are shown on macOS only
  (`src-main/menu/menu-template-on-mac.ts`): where macOS has the language, macOS's own wording is the one, and
  it outranks Firefox's. `menu.app.about` (also under Help on Windows and Linux), `menu.view.*` and
  `menu.selection.*` are shown on all three systems: where macOS and Windows differ there, both are established
  and the text stays. Round 4.
- The clock setting (`clockSystem`, `clock12`, `clock24`) is confirmed in all eight: macOS "24-hour time"
  (`24hodinový čas`, `24-hodinový čas`, `Czas 24‑godzinny`, `24-satno vrijeme`, `24-urna oblika zapisa časa`)
  and Android "Use 24-hour format" (`24hodinový formát`, `24-hodinový formát`, `Format 24-godzinny`,
  `24-satni format`, `24-urni zapis časa`, `24-časovni format`, `24 val. formatą`, `24 stundu formātu`).
  Round 4 confirmed (the second pass's wording, not looked up before).
- Google's products: Maps has Google's name in the language; Street View stays `Google Street View` (Google
  keeps `Street View` in `cs`, `sk`, `pl`, `hr`, `sl`, `sr`, `lt`; in Latvian its interface says
  `Ielas attēls`, left to the owner because the application's guide lists Google Street View as a name that
  stays). Google's help. Round 4.
- Ascending/descending, thumbnails, details, "open with", a photo's location, file name and size: confirmed
  as they are against macOS and Android. Round 4.
- "Date taken" and "date modified" as Explorer names its columns are NOT settled in any language but Slovak's
  `dátum úpravy`: no page in the languages found. Round 4.

### Czech (`cs`), round 4

- `menu.app.*` and `Zobrazení`, `Skutečná velikost`, `Nápověda`: as macOS has them. Round 4 confirmed.
- `menu.view.zoomIn`/`zoomOut` `Přiblížit`/`Oddálit` and `menu.selection.undo`/`redo` `Zpět`/`Znovu` stay
  (Windows' words; macOS has `Zvětšit`/`Zmenšit`, `Odvolat akci`/`Opakovat akci`; shown on all three). Round 4.
- `photoInfo.moreOptions` `Další volby`: macOS's wording ("More Options"). Round 4 confirmed.

### Slovak (`sk`), round 4

- `menu.app.showAll`: `Zobraziť všetky`. macOS (every application read). Round 4 (changed from
  `Zobraziť všetko`; overturns round 3's line, which had it from Firefox: the item is shown on macOS only).
- SmartScreen: `Ďalšie informácie` / `Spustiť aj tak`. Three software makers' Slovak instructions agree
  (release notes of `JurajCyprich/apex-telemetria` v1.3.0; READMEs of `xddvorak/deckstand` and
  `Dionissro/mojazalozna-releases`, on GitHub). Settled, the link too. Round 4.
- Zoom out: `Vzdialiť` stays; macOS has `Oddialiť` as Firefox and Google Maps do, Microsoft `Vzdialiť`; both
  established, shown on Windows too. Round 4.

### Polish (`pl`), round 4

- `menu.app.hide`, `hideOthers`, `showAll`, `quit`, `services`, `Widok`, `Powiększ`, `Pomniejsz`, `Cofnij`,
  `Pomoc`, `Miniaturki`: as macOS has them. Round 4 confirmed.
- `menu.app.about` `{{appName}} – informacje` stays (macOS 27 has `TextEdit…`; the item is also shown on
  Windows). `Rzeczywisty rozmiar` and `Ponów` stay (Windows' words; macOS `Wielkość rzeczywista`,
  `Przywróć`). Round 4.
- `dane o położeniu`: macOS's Photos has `Położenie` for a photo's location (beside `Miejsce`,
  `Lokalizacja`). Round 4 confirmed.

### Croatian (`hr`), round 4

- `menu.app.hideOthers`: `Sakrij ostalo`. macOS (every application read). Round 4 (changed from
  `Sakrij ostale`; overturns round 3's line, which had it from Firefox: the item is shown on macOS only).
- "in Google Maps": `na Google kartama` (Google's help: 15 times, `u` once). Round 4 (changed in Photo Data
  Viewer).
- A foreign name is declined after a preposition: `na Google Street Viewu`, as `na GitHubu`, `na X-u`
  (Google's help: `na Street Viewu`, `u Street Viewu`, `Street Viewa`). Round 4 (changed in Photo Data Viewer).
- SmartScreen: `Više informacija` / `Svejedno pokreni`. Release notes of
  `dblazevic21/VFA_knjigovodstvo-izdanja` v0.5.0 on GitHub, beside round 3's security vendor. Settled. Round 4.
- `menu.app.about` `O aplikaciji …` stays (macOS `Više o aplikaciji …`; also shown on Windows);
  `Povećaj`/`Smanji` stay (macOS `Uvećaj`/`Umanji`; shown on all three). Round 4.

### Slovenian (`sl`), round 4

- `menu.app.hide`: `Skrij aplikacijo {{appName}}`; `menu.app.quit`: `Zapri aplikacijo {{appName}}`. macOS
  (every application read). Round 4 (changed from `Skrij {{appName}}`, `Končaj {{appName}}`; settles round 3's
  "equally good" of `Končaj` against Firefox's `Izhod iz …`).
- `Skrij druge`, `Prikaži vse`, `Storitve`, `O aplikaciji …`, `Pogled`, `Povečaj`, `Pomanjšaj`,
  `Dejanska velikost`, `Razveljavi`, `Uveljavi`, `Pomoč`, `Sličice`: as macOS has them. Round 4 confirmed
  (`Skrij druge` was "equally good" against Firefox's `Skrij ostale` in round 3: macOS has `Skrij druge`).
- `12-urna ali 24-urna oblika`: macOS has `24-urna oblika zapisa časa`. Round 4 confirmed.
- SmartScreen: `Več informacij` / `Vseeno zaženi`. `www.sl-king.si/preizkusi`, read. Settled. Round 4.

### Serbian, Latin (`sr-Latn`), round 4

- SmartScreen: `Više informacija` / `Ipak pokreni`. Release notes of `alertpay91/MarkSync` v1.1.0 on GitHub
  („Windows je zaštitio vaš računar“). Settled. Round 4.
- `Rastuće`/`Opadajuće`, `Sortiraj`, `Podešavanja`, `24-časovni format`: Android. Round 4 confirmed.
- `u Google mapama`: Google's Serbian help. `Prikaži u Google Street View` stays (Google has the bare name
  and `Street View-у` equally). Round 4.

### Lithuanian (`lt`), round 4

- Source code: `pirminis programos tekstas`, and `pirminis tekstas` after `šios programos`. The
  English–Lithuanian dictionary of computing (`www.ims.mii.lt/ALKŽ/S.html`), the Lithuanian Wikipedia's
  title, Firefox (`Pirminis tekstas`). Round 4 (changed from `išeitinis kodas` in the three places).
- Google Maps: `„Google“ žemėlapiai` (`Atidaryti „Google“ žemėlapius`, `Rodyti „Google“ žemėlapiuose`).
  Google's help. Round 4 (changed from `„Google Maps“` in the application and Photo Data Viewer).
- `„Google Street View“` stays: Google's Lithuanian keeps `„Street View“`. Round 4 confirmed.
- SmartScreen: `Daugiau informacijos` / `Vis tiek vykdyti`. Release notes of `RobertasTa/skaitykle` v0.2.0
  on GitHub. Settled. Round 4.
- `Didėjimo tvarka`/`Mažėjimo tvarka`, `Išsami informacija`, `Atidaryti naudojant`, `Vieta`: Android.
  `Rikiuoti` stays (Windows; Android has `Rūšiuoti`). Round 4 confirmed.

### Latvian (`lv`), round 4

- `pakalpojumā Google Maps`: Google's Latvian help, word for word. Round 4 confirmed.
- `Augošā secībā`/`Dilstošā secībā`, `Detalizēta informācija`, `Atvērt lietotnē`, `Atrašanās vieta`,
  `24 stundu formāts`: Android. Round 4 confirmed.
- SmartScreen `Papildinformācija` / `Tomēr palaist`: NOT settled; three searches found no Latvian page that
  quotes the buttons. Round 4.

## Round 5 (2026-11-12)

Sources named in short:

- **Chromium**: Google's translations of Chrome,
  `chromium.googlesource.com/chromium/src/+/main/chrome/app/resources/generated_resources_<code>.xtb` (and
  `ui/strings/translations/ui_strings_<code>.xtb`, `ui/chromeos/translations/ui_chromeos_strings_<code>.xtb`,
  `components/strings/components_strings_<code>.xtb`), all eight languages (`sr-Latn` for Serbian). They hold
  Chrome's application menu on macOS and ChromeOS's file manager. How to look a text up by its English:
  `sources.md`.
- **MediaWiki**: Wikipedia's interface messages in the language (`vector-main-menu-label`,
  `mobile-frontend-main-menu-button-tooltip`, through `api.php?action=query&meta=allmessages`).

### All eight, round 5

- For the items of the application menu that only macOS shows, in a language that macOS is not translated
  into (`sr-Latn`, `lt`, `lv`): Firefox and Chrome on macOS are the two witnesses. Where both have the same
  wording and it is not ours, theirs is taken; where they differ from each other, ours stays if it is what one
  of them has, or differs from one only in an ending. Round 5.
- The English texts that have two translations, over the three places, are now only `Language` (with and
  without `(Language)`) and "Select Only This" (a file, a folder) in all eight languages. Round 5.
- "Date taken" and "date modified" have a second file manager for them, ChromeOS's: it has ours for the date
  taken in `cs`, `hr`, `sr-Latn`, `lt`, `lv` and for the date modified in `sk`, `pl`, `hr`, `sl`, `sr-Latn`,
  `lv`. Where it differs (`cs` `Datum úpravy`, `sk` `Dátum vytvorenia`, `pl` `Data zrobienia`, `sl`
  `Datum posnetka`, `lt` `Pakeitimo data`), ours is Windows' name from the earlier rounds and stays. Explorer
  itself is still not read. Round 5.
- No text needs plural forms; checked again for any number and both names. Round 5.

### Czech (`cs`), round 5

- Photo Data Viewer's menu button: `menu` (`menu.buttonLabel`) and `MENU` (`menu.label`), one word for the
  spoken and the written name. A website's menu button is `menu` in Czech: MediaWiki ("Hlavní menu",
  "Otevřít hlavní menu"), ceskatelevize.cz ("Otevřít globální menu"), idnes.cz ("Menu"). Round 5 (changed
  `menu.buttonLabel` from `nabídka`).
- `nabídka` stays the word of the desktop application's menus (`Rozšířená nabídka`, `místní nabídka`):
  Chromium ("Nabídka", "Hlavní nabídka"), beside Microsoft's and Apple's. The difference between the two
  applications is meant. Round 5.

### Slovak (`sk`), round 5

- Photo Data Viewer's menu button: `menu` and `MENU`. MediaWiki ("Hlavné menu", "Otvoriť hlavné menu").
  Round 5 (changed `menu.buttonLabel` from `ponuka`).
- `ponuka` stays the word of the desktop application's menus: Chromium ("Ponuka", "Hlavná ponuka"). Round 5.
- `vybratý` (application) and `vybraný` (Photo Data Viewer) are both standard; each place keeps one. Round 5.

### Polish (`pl`), round 5

- `Data modyfikacji`, `Więcej opcji`, `Rzeczywisty rozmiar`, `Cofnij`, `Ponów`, `Powiększ`, `Pomniejsz`,
  `Szczegóły`, `Pokaż szczegóły`, `Sortuj`, `Nazwa pliku`: Chromium. Round 5 confirmed.

### Croatian (`hr`), round 5

- `Datum snimanja`, `Datum izmjene`, `Više opcija`, `Pojedinosti`, `Stvarna veličina`, `Povećaj`, `Smanji`,
  `Poništi`, `Ponovi`, `Ponovno učitaj`, `Zumiranje`, `Naziv datoteke`: Chromium. Round 5 confirmed
  (`Povećaj`/`Smanji` now have Chrome beside Windows, against macOS's `Uvećaj`/`Umanji`).
- `language.loadFailed` `Jezik nije moguće učitati.` (the present) stays: the usual form of the message.
  Round 5.

### Slovenian (`sl`), round 5

- `Datum spremembe`, `Več možnosti`, `Podrobnosti`, `Dejanska velikost`, `Povečaj`, `Pomanjšaj`, `Razveljavi`,
  `Uveljavi`, `Znova naloži`, `Skrij druge`, `Razvrsti`, `Ime datoteke`: Chromium. Round 5 confirmed.

### Serbian, Latin (`sr-Latn`), round 5

- `menu.app.*`: `Usluge`, `Sakrij …`, `Prikaži sve`, `Zatvori …` (Quit): Chrome on macOS; `Sakrij ostale`:
  Firefox (Chrome: `Sakrij druge`). Round 5 confirmed (the first pass's doubt about `Zatvori` for Quit is
  settled; Firefox has `Изађи из програма …`).
- `Prikaz`, `Uvećaj`, `Umanji`, `Stvarna veličina`, `Opozovi`, `Ponovi`, `Učitaj ponovo`, `Podešavanja`,
  `Pomoć`, `Još opcija`, `Zumiranje`, `Sličice`, `Detalji`, `Alatke za programere`, `Datum snimanja`,
  `Datum izmene`: Chromium. Round 5 confirmed.

### Lithuanian (`lt`), round 5

- `menu.app.hide` `Slėpti „…“` and `menu.app.showAll` `Rodyti visas`: Chrome on macOS. Round 5 confirmed.
- `menu.app.hideOthers` `Slėpti kitas` stays: Firefox `Nerodyti kitų`, Chrome `Slėpti kitus`; the two differ,
  ours has Chrome's verb and the gender of `Rodyti visas`. Not settled. Round 5.
- `Artinti`, `Tolinti`, `Anuliuoti`, `Įkelti iš naujo`, `Daugiau parinkčių`, `Išsami informacija`,
  `Rodyti išsamią informaciją`, `Fotografavimo data`, `Miniatiūros`: Chromium. Round 5 confirmed.

### Latvian (`lv`), round 5

- `menu.app.hideOthers`: `Paslēpt citus`; `menu.app.showAll`: `Rādīt visus`. Firefox and Chrome on macOS,
  word for word the same. Round 5 (changed from `Paslēpt pārējās`, `Rādīt visas`; overturns round 3's
  "equally good", which had Firefox alone).
- `Pakalpojumi` (Services): Chrome (Firefox has `Servisi`). `Paslēpt …`, `Iziet no …`, `Par …`: Firefox.
  Round 5 confirmed.
- `Tuvināt`, `Tālināt`, `Atsaukt`, `Atcelt atsaukšanu`, `Pārlādēt`, `Citas opcijas`, `Tālummaiņa`,
  `Uzņemšanas datums`, `Sīktēli`: Chromium. Round 5 confirmed.
- SmartScreen: `Tomēr palaist` is in the README of `purladeadmin-collab/Purlade` on GitHub („Windows
  aizsargāja jūsu datoru”). The link is NOT settled: that page has `Vairāk informācijas`, ours is
  `Papildinformācija` (Microsoft's usual Latvian for "More information"). Round 5.

## Round 6 (2026-11-12)

No text changed in any of the eight languages (the 24 files are as they were after round 5).

Sources named in short:

- **Poedit**: `locales/<code>.po` in `vslavik/poedit` on GitHub
  (`raw.githubusercontent.com/vslavik/poedit/master/locales/<code>.po`; Serbian in Latin letters is
  `sr@latin`), a desktop application on Windows and macOS translated by people. Its text "Show in Explorer"
  has the note "should match standard translation of "Explorer"".
- **MS pages are machine translations** in Lithuanian and Latvian: `ms.translationtype` is `MT` in the head of
  "File Explorer in Windows", "Find your files in Windows", "Zip and unzip files"
  (`support.microsoft.com/lt-lt/…`, `…/lv-lv/…`) and of
  `learn.microsoft.com/<locale>/power-automate/desktop-flows/dynamics365-cs-rpa`. They are evidence of a
  term, weak evidence of how a sentence is written.

### All eight, round 6

- A choice's name quoted in a sentence is the choice's label, letter for letter (`sortByShootingTimeInfo.intro`,
  `chart.unsupportedDuration`, `chart.changeUnitOrSelection`; Photo Data Viewer's `demo.description`,
  `settings.usageData.note`): checked mechanically, clean. Round 6.
- No text needs plural forms; checked again for any number and both names. Round 6.

### Lithuanian (`lt`), round 6

- Explorer's name inside a sentence stays in small letters (`failų naršyklės`, `failų naršyklę`), as a common
  noun: Poedit has `Atverti failų naršyklėje` for "Show in Explorer", and PCSX2's Lithuanian the same for
  "Open in Explorer". Microsoft's pages have `Failų naršyklė` with a capital (36 of 39 on the Explorer page),
  but they are machine translations. Both in use; no swap. Round 6.
- `menu.selection.undo` / `redo` `Anuliuoti` / `Perdaryti` stay (Microsoft's pair); Poedit has
  `Atšaukti` / `Pakartoti`. Both established. Round 6.
- `Rikiuoti` (sort), `Apie …`: Poedit. Round 6 confirmed (`Rikiuoti` was "equally good" against Android's
  `Rūšiuoti` in round 4).
- SmartScreen `Daugiau informacijos` / `Vis tiek vykdyti`: Microsoft's Learn page has the same pair. Round 6
  confirmed.

### Latvian (`lv`), round 6

- Explorer's name inside a sentence stays in small letters (`failu pārlūka`, `failu pārlūku`): Seafile's
  Latvian help has `Windows failu pārlūkā` (`seahub/help/locale/lv_LV` in `haiwen/seahub`); Microsoft's pages
  have `Failu pārlūks` with a capital (36 of 39), machine translations. Both in use; no swap. Round 6.
- SmartScreen is still NOT settled, and the pages contradict each other: `Vairāk informācijas` /
  `Tomēr palaist` (Purlade's README), `Papildu informācija` / `Palaist tomēr` (`www.lks2020.lv`),
  `Papildinformācija` / `Palaist jebkurā gadījumā` (Microsoft's Learn page, a machine translation). Ours
  (`Papildinformācija` / `Tomēr palaist`) has two of the three for each name. Do not search again: only a
  Windows in Latvian settles it. Round 6.
- `Par …`, `Kārtot pēc …`: Poedit. Round 6 confirmed.

### Croatian (`hr`), Slovenian (`sl`), Serbian, Latin (`sr-Latn`), round 6

- `hr` `Razvrstaj` (sort; Poedit `Razvrstaj po …`), `Poništi` / `Ponovi`, `O aplikaciji …`: Poedit. Round 6
  confirmed (`Razvrstaj` was "equally good" against `Sortiraj` in round 3).
- `sl` `Razveljavi`, `Razvrsti po …`, `Raziskovalcu`: Poedit. `sl` `chart.unsupportedDuration`
  `več kot 1 ure`: the genitive of the negated verb. Round 6 confirmed.
- `sr-Latn` `Opozovi` / `Ponovi`, `Sortiraj`: Poedit. Round 6 confirmed.

### Czech (`cs`), Slovak (`sk`), Polish (`pl`), round 6

- Explorer's name with a capital inside a sentence (`Průzkumníka souborů`, `Prieskumníka`,
  `Eksploratora plików`): Poedit has `Průzkumníkovi`, `Prieskumníkovi`, `Eksploratorze`. Round 6 confirmed.

## Round 7 (2026-11-12)

No text changed in any of the eight languages (the 24 files are as they were after round 6).

Sources named in short:

- **MS style guide (lv)**: Microsoft's Latvian Localization Style Guide,
  `download.microsoft.com/download/c/9/c/c9c901d9-8d73-4a07-bda2-e9177cc0e965/lav-lva-StyleGuide.pdf`, written
  by people (the support and Learn pages in Latvian are machine translations, round 6).
- **MS Windows 11 page**: `www.microsoft.com/<locale>/windows/windows-11` (`cs-cz`, `sl-si`, `hr-hr`,
  `sr-latn-rs`), Microsoft's own marketing page in the language.

### All eight, round 7

- The pair of quotation marks of each language, one pair in all three places, is what Chrome's translation
  has: `„…“` in `cs`, `sk`, `sr-Latn`, `lt`; `„…”` in `pl`, `hr`; `»…«` in `sl`. Chromium (counted). Round 7
  confirmed. Latvian is the exception: see below.
- Mechanical checks that are clean and need no repeating unless the files change: spaces, straight quotes,
  undrawn characters, placeholders and tags against the English, the mark at the end of a text, one
  translation per English text (only `Language` and "Select Only This" have two). Round 7.
- No text needs plural forms; checked again for any number and both names. Round 7.

### Czech (`cs`), Slovenian (`sl`), Croatian (`hr`), Serbian, Latin (`sr-Latn`), round 7

- `Windows` as a subject takes a verb in the singular (`Windows omezuje`, `Windows omejuje`,
  `Windows ograničava` in `photoInfo.pathTooLong` and `generatedThumbnailPathTooLong`). MS Windows 11 page:
  "Windows shromažďuje", "Windows 11 nabízí"; "Windows 11 zagotavlja"; "Windows nudi"; "Windows stavlja".
  Round 7 confirmed. (`Systém Windows omezuje` would be equally good in Czech; no swap.)

### Lithuanian (`lt`), round 7

- `chart.zoom` `Mastelis`: Firefox (`menu-view-full-zoom`); Chrome has `Keisti mastelį`, `Puslapio mastelis`.
  Round 7 confirmed.
- `menu.view.actualSize` `Tikrasis dydis` stays: Firefox `Tikras dydis` (another ending of the same
  adjective), Chrome `Faktinis dydis`; the two differ. Round 7.

### Latvian (`lv`), round 7

- Quotation marks `„…”` stay, and this is NOT settled by evidence but by having an authority on each side:
  `„…”` is the pair that the Latvian Language Agency recommends ("Interpunkcija", 2013, as cited by
  `lv.wikipedia.org/wiki/Pēdiņas`) and Microsoft Word's default for Latvian; `“…”` is what software has (MS
  style guide (lv), "Quotation marks": "use double upper curly quotation marks (“xxx”) for software texts";
  Chrome 252 pairs, Firefox 59, GIMP 322, GNOME Files 262, Google's privacy policy 30, each with no `„…”`).
  Put to the owner in round 7's report. Do not look it up again; change it only if the owner decides for
  `“…”` (13 texts, 15 pairs: 9 texts in the application, 2 on the website, 2 in Photo Data Viewer).
- `menu.view.actualSize` `Faktiskais lielums`: Microsoft's Latvian help of Lync names the view choice so
  (`support.microsoft.com/lv-lv/office/satura-skatīšana-un-prezentēšana-lync-sapulcē-a61fb5ca-e18d-40d7-9e9a-cd76b6eea514`).
  Chrome has `Faktiskais izmērs`, Firefox `Patiesais izmērs`. Round 7 confirmed.
- "Size" is `lielums` in both places (`Faktiskais lielums`, `Faila lielums`): Microsoft's word. Chrome,
  Firefox, GIMP, GNOME Files and VLC have `izmērs`. Both established; no swap. Round 7.
- `chart.zoom` `Tālummaiņa`: Firefox and Chrome. Round 7 confirmed.
