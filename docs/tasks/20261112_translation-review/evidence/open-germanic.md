# Left open after the review: German, Dutch, Danish, Norwegian Bokmål, Swedish, Finnish, Estonian, Hungarian

From the report of round 7, the last one, for these eight languages: what the reviewers could not
confirm, what they left because two wordings are equally good, and what is the owner's to decide. A speaker
of one of these languages can settle most of it at a glance. The decisions that were made, with their
sources, are in `decisions-germanic.md`.

## Equally good, left

Carried over from rounds 3 to 6 with nothing new found, and still left: Dutch's `24-uursnotatie`, Swedish's
`Fotograferingsdatum`, German's `Miniatur` and its link text in `about.translations`, Dutch's `release-opmerkingen`
and its imperative on buttons, Danish's `lokalitetsdata`, `Flere muligheder` and `Valg`, "Also," left out of
`details.otherFiles`, `die Orte`, `stederne`, `paikat` in `landing.showsLocationsOnMap`, the file's "modified
time" as a time in `fi`, `et`, `hu`, Norwegian's `opptakstidspunkt` and `lage` beside `genererte`, Finnish's
`Järjestä`, `klikkaa`, `nimettömiä`, `Lisävalikko` and `kehittäjän työkalut`, Estonian's `Üldine` and its two
nouns for "details", Hungarian's `a Google Utcaképben`, `gyűjtünk` and `Mégis`, Dutch's `Weergave` and Finnish's
`Lisää` for two things, German's `Explorer`, Swedish's `Zooma` and `utvecklarverktyg`, Dutch's present in
`language.loadFailed`, "faulty files" in `fi` and `hu`, Estonian's two lengths without a unit.

New in this round (each was weighed for a change and has none):

- **`da`, the accent on an imperative in `-er`**: the application has `Sorter` (macOS's spelling) and Photo
  Data Viewer `Kontrollér din forbindelse` (Microsoft's: its guide writes the accent where the form "can be
  misread as a noun or a verb in the present tense — for example, sortér, markér, kontrollér, kopiér"; macOS has
  `Sorter`, `Kontroller`, `Kopier`). The accent is optional in Danish and both are two different words, each as
  one platform writes it. A Danish speaker may want one way for both.
- **`hu`, Cancel**: `Mégsem` (macOS's); Windows and Chrome have `Mégse`. Both are the same word; the rest of the
  Hungarian menu has Windows' words where the two differ (`Mégis`, `Nagyítás`), so a speaker may prefer `Mégse`.
- **`de`**, `z. B.` in Photo Data Viewer's `photoData.general.iosNote` has an ordinary space. Microsoft's guide
  asks for a no-break space there ("Use a non-breaking space … in abbreviations such as z. B. or d. h."), and
  says elsewhere that no-break spaces "should only be used whenever they are present also in the" source. Only
  French has no-break spaces in the three places. Left.
- **`fi`**, `Klikkaa ”Lisätietoja”` and `Klikkaa ”Suorita joka tapauksessa”` on the website, the name without a
  noun, beside Photo Data Viewer's `Suorita demo -painiketta`: Microsoft's guide leaves the choice open and
  macOS's Finnish has the bare name after `klikkaa` (macOS tables: `klikkaa Muokkaa`).
- **`fi`**, `esim.` in `photoData.general.iosNote`: Microsoft's guide prefers the word written out in its own
  voice; the English has "e.g." in parentheses, and the other seven abbreviate too.
- **`nb`, `sv`**, quotation marks around a name of the interface (`«Etter opptakstidspunkt»`, `”Efter
  fotograferingstid”`): Microsoft's guides for these two prefer no quotation marks around such names; the names
  here are whole phrases inside a sentence, where the marks show where the name ends.
- **`nl`**, Cancel and Undo: `Annuleer`, `Herstel` (macOS's); Microsoft has `Annuleren`, `Ongedaan maken`.
  Recorded since round 1 as macOS's style in the whole file.

## Still not confirmed

- **`hu`**, `exe fájlra` (website) and `JPEG/HEIF/TIFF fájl` (application), written apart beside `HEIF-fájl`:
  Microsoft's Hungarian guide requires the hyphen after an acronym (`XML-deklaráció`) and writes `TCP/IP
  protokoll` apart, as a name of a protocol; it says nothing of an extension in small letters or of names joined
  by a slash. Left for a speaker.
- **The SmartScreen names of `da`, `sv`, `fi`**: as in round 6, confirmed by several pages that quote them,
  still not read off a picture of a Windows in the language.
- **What Windows calls the date a photo was taken** in `da` and `nb`: not in the files.

## For the owner

1. **Convergence for these eight languages**: 78, 88, 47, 3, 0, 2, 2. The two texts of this round are one
   decision in one language, from a rule in a source that had not been read before; reading found no
   inaccuracy and no inconsistency of terms.
2. **A source that may serve the other groups**: Microsoft's localization style guides exist for all 40
   languages. They settle the quotation marks, the names of keys, the form of address and the standard commands,
   and some have rules that a reader who does not speak the language cannot see otherwise (Estonian's noun after
   `klõpsake`, Danish's accent on `sortér`). It is in `sources.md`.
3. Still open from the earlier rounds, and not among the 24 files: the English of Photo Data Viewer's
   `about.usageData` ("what kind of photo was loaded"); Photo Data Viewer's `TERMS.md` lists `a Google
   Térképben`; both `TRANSLATING.md` say that the names of Windows' two buttons "were written from memory"; the
   English `photoInfo.pathTooLong` gives the two lengths without a unit.
