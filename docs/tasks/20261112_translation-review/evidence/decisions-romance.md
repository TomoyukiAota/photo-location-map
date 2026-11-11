# Decision log: `romance` (es, ca, gl, eu, fr, it, pt-BR, pt-PT)

One line for each term or text that is settled by evidence: the key or the term, the wording, the source, the
round. Append only. A line overturns an earlier one only by saying so and why.

Sources named in short (all read 2026-11-12):

- **Firefox**: `<locale>/browser/browser/menubar.ftl` in `mozilla-l10n/firefox-l10n` on GitHub (the macOS
  application menu, the View and Edit menus); `aboutDialog.ftl` beside it where named.
- **GNOME**: `po/<lang>.po` of gThumb, Shotwell, Files (nautilus) and Maps at `gitlab.gnome.org/GNOME`.
- **Spectacle**, **GIMP**: `po/eu/spectacle.po` at `invent.kde.org/plasma/spectacle`; `po/eu.po` at
  `gitlab.gnome.org/GNOME/gimp`.
- **MS shortcuts page**: `support.microsoft.com/es-es/windows/keyboard-shortcuts-in-windows-dcc61a57-8ff0-cffe-9796-cb9706c75eec`.
- **MS Explorer page**: `support.microsoft.com/<locale>/windows/experience/fileexplorer/file-explorer-in-windows`.

## All eight

- Microsoft's support site has no pages in Catalan, Galician or Basque: its `ca-es`, `gl-es` and `eu-es` addresses
  show the Spanish page. Do not look there again for these three. Round 3.
- `sortByShootingTimeInfo.details.modifiedTime` says "as an alternative" and `details.otherFiles` starts with
  "Also," in all eight, as the English and the Japanese do. Round 3 (added in ca, gl, eu). What all eight leave out
  with the Japanese ("tries to" in `step1`, "Note that" in `foldersNote`, "in the first place" in `otherFiles`)
  stays out.
- `appInfo.developedBy`: the participle (`Desarrollado por`, `Développé par`, `Sviluppato da`, `Desenvolvido por`)
  is the English "Developed by" and the usual credit in these languages; it does not read as the past. Unchanged.
  Round 3.
- `map.layers`: `Capas` (es, gl), `Capes` (ca), `Geruzak` (eu), `Livelli` (it), `Camadas` (pt-BR, pt-PT): GNOME Maps
  in each language has the same word. Round 3.
- Typography: no straight quotation mark or apostrophe, no ellipsis character, no doubled space and no unescaped
  invisible character in any of the 24 files (scanned by script). Round 3.
- No text needs plural forms. First pass, round 3.

## Spanish (`es`)

- `Ctrl+Mayús+I`: `Mayús`. MS shortcuts page ("Ctrl+Mayús+Esc", "Mayús+F10"). Round 3 (confirmed; changed in the
  second pass from memory).
- Explorer is `Explorador de archivos`; context menu `menú contextual`; thumbnail `miniatura`; folder `carpeta`. MS
  shortcuts page. Round 3 (confirmed).
- `menu.app.*`: `Acerca de`, `Servicios`, `Ocultar`, `Ocultar otros`, `Mostrar todo`, `Salir de`; `menu.view.title`
  `Ver`; `actualSize` `Tamaño real`. Firefox `es-ES`. Round 3 (confirmed).
- `Ascendente`, `Descendente`, `Girar`, `Acerca de` (About as a page's name): Shotwell `es`. Round 3 (confirmed).
- Date taken: `Fecha de captura`, Explorer's column in Spanish (quoted so in XnView's forum; from knowledge of
  Windows). Round 3 (confirmed).
- Zoom in and out: `Acercar`, `Alejar` (Chrome, Google Maps) stays; `Ampliar`, `Reducir` (GNOME) is of equal
  standing. Round 3 (left).

## Catalan (`ca`)

- `menu.app.hide` `Amaga`, `showAll` `Mostra-ho tot`, `quit` `Surt de`, `about` `Quant a`: Firefox `ca` (`Amaga el
  Firefox`, `Mostra-ho tot`, `Surt del Firefox`, `Quant al Firefox`). Round 3 (confirmed; the first pass doubted
  `Amaga` against `Oculta`).
- Commands are imperatives (`Obre`, `Tanca`, `Desa`): Apple's Catalan has them too ("Finestra > Fusiona totes les
  finestres", support.apple.com/ca-es/guide/mac-help/mchlp2469/mac), as have Firefox and GNOME. Round 3 (confirmed;
  the first pass supposed that Apple used infinitives).
- `Amplia`, `Redueix`, `Mida real` (Firefox `ca`, GNOME Maps); `Ascendent`, `Descendent`, `Gira`, `Quant a`
  (Shotwell); `Miniatures`, `Barra d’estat`, `Obre la carpeta`, `Ubicació`, `Filtra` (gThumb, Files). Round 3
  (confirmed).
- The article before a product's name: both ways are in use (Firefox `Quant al Firefox`; the Catalan Wikipedia
  `d'iOS`, `amb iOS`). The files keep what they have (with it for Windows and macOS, without it elsewhere). Round 3
  (left).

## Galician (`gl`)

- `Ampliar`, `Reducir`, `Tamaño real`, `Ver` (Firefox `gl`); `Capas` (GNOME Maps); `Ascendente`, `Descendente`
  (Shotwell); `Miniaturas`, `Barra de estado` (gThumb); `Abrir cartafol` (Files). Round 3 (confirmed).
- `Ocultar`, `Mostrar`, `Acerca de` (Windows in Galician, from knowledge of it) stay; Firefox and GNOME have
  `Agochar`, `Amosar`, `Sobre`. Both are correct Galician. Round 3 (left).
- `Ctrl+Maiús+I`: second pass (GNOME's and Collabora's Galician help). Not looked up again.

## Basque (`eu`)

- `sidebar.sort.ascending`, `descending`: `Gorantz`, `Beherantz`. gThumb and Shotwell `eu`. Round 3 (confirmed; the
  first pass asked for a speaker's view against `Goranzkoa`, `Beheranzkoa`).
- About, as a page's name: `Honi buruz`. Shotwell `eu` (`Honi _buruz`). Round 3 (confirmed).
- Region (`map.*`): `eskualdea`. Spectacle `eu` ("Rectangular Region" is `Eskualde laukizuzena`) and GIMP `eu`
  (`hautatu eskualde laukizuzena`). Round 3 (confirmed).
- `Ezkutatu`, `Ezkutatu besteak`, `Erakutsi denak`, `Ikusi`, `Benetako tamaina`: Firefox `eu`. Round 3 (confirmed).
- `Geruzak`, `Biratu`, `Iragazi`, `Ezarpenak`, `Ireki karpeta`, `Ordenatu`, `Orokorra`, `Xehetasunak`: GNOME Maps,
  gThumb, Shotwell, Files `eu`. Round 3 (confirmed).
- Thumbnail: `miniatura` stays; GNOME's Basque has both it (Shotwell, Files) and `koadro txiki` (gThumb, Files).
  Round 3 (left).
- Zoom in and out: `Handitu`, `Txikitu` stay; GNOME has `Handiagotu`, `Txikiagotu`, Firefox `Gerturatu`, `Urrundu`.
  Round 3 (left).
- "As an alternative" is `ordezko gisa`. Round 3 (changed).

## French (`fr`)

- `menu.app.*` and `menu.view.*`: `À propos de`, `Services`, `Masquer`, `Masquer les autres`, `Tout afficher`,
  `Quitter`, `Affichage`, `Zoom avant`, `Zoom arrière`, `Taille réelle`. Firefox `fr`: all the same. Round 3
  (confirmed).
- `Ordre croissant`, `Ordre décroissant` (Shotwell `fr`); `vignettes` (gThumb `fr`); `Zoom avant`, `Zoom arrière`
  for the map too (GNOME Maps `fr`). Round 3 (confirmed).
- Explorer is `Explorateur de fichiers`; context menu `menu contextuel`. MS Explorer page (`fr-fr`). Round 3
  (confirmed).
- SmartScreen's buttons: `Informations complémentaires`, `Exécuter quand même`. justgeek.fr's guide and ASUS's
  French page (asus.com/fr/support/faq/1053651). Round 3 (confirmed; from memory before).
- `map.layers`: `Calques` (Google Maps) stays; GNOME Maps and OpenStreetMap have `Couches`. Round 3 (left).

## Italian (`it`)

- Date taken and the shooting time: `Data di scatto`. gThumb `it` (`Data di scatto della foto`), Shotwell `it`
  (`Per data di scatto`). Round 3 (confirmed).
- `menu.app.*`: `Informazioni su`, `Servizi`, `Nascondi`, `Nascondi altre`, `Mostra tutte`, `Esci da`. Firefox
  `it`: all the same. Round 3 (confirmed).
- Explorer is `Esplora file`. MS Explorer page (`it-it`). Round 3 (confirmed). The same page has `menu di scelta
  rapida` for the context menu; `menu contestuale` (macOS, and the usual word) stays. Round 3 (left).
- SmartScreen's buttons: `Ulteriori informazioni`, `Esegui comunque`.
  navigaweb.net/2014/02/disabilitare-blocco-file-exe-pc.html. Round 3 (confirmed; from memory before).
- The View menu has macOS's words (`Vista`, `Ingrandisci`, `Riduci`, `Dimensioni reali`); Firefox has others
  (`Visualizza`, `Aumenta zoom`, `Riduci zoom`, `Dimensioni effettive`). Round 3 (left).

## Portuguese of Brazil (`pt-BR`)

- `menu.app.*` and `menu.view.*`: `Sobre o`, `Serviços`, `Ocultar`, `Ocultar outros`, `Mostrar tudo`, `Encerrar`,
  `Exibir`, `Ampliar`, `Reduzir`, `Tamanho real`. Firefox `pt-BR`: all the same. Round 3 (confirmed).
- Explorer is `Explorador de Arquivos`; context menu `menu de contexto`. MS Explorer page (`pt-br`). Round 3
  (confirmed).
- `Girar`, `Crescente`, `Decrescente`, `Configurações`: Shotwell and gThumb `pt_BR`. Round 3 (confirmed).

## Portuguese of Portugal (`pt-PT`)

- About, as a page's name (Photo Data Viewer `menu.about`, `pageTitle.about`, `settings.usageData.note`): `Acerca
  de`, not `Acerca`. Windows' page is `Acerca de` ("Abrir Definições de Acerca de" on
  support.microsoft.com/pt-pt/windows/…-a66d52c8-3323-44fd-8f34-a9497bb935e1); Firefox `pt-PT` has `Acerca do
  Firefox` (`aboutDialog.ftl`). Round 3 (changed).
- `menu.app.about` `Acerca do`, `quit` `Sair do`, `showAll` `Mostrar tudo`, `menu.view.title` `Ver`, `Ampliar`,
  `Reduzir`: Firefox `pt-PT`. Round 3 (confirmed).
- Explorer is `Explorador de Ficheiros`; context menu `menu de contexto`. MS Explorer page (`pt-pt`). Round 3
  (confirmed).
- `Rodar`, `Ascendente`, `Descendente`, `Definições`: Shotwell and gThumb `pt`. Round 3 (confirmed).

## Open after round 3 (no source found; do not count as settled)

- SmartScreen's buttons in `ca`, `gl`, `eu` (eight searches, nothing), and in `es`, `pt-BR`, `pt-PT` (third-party
  guides only). They need a Windows in the language.
- Explorer's label for "Date taken" in `pt-BR`, `pt-PT`, `gl`, `ca`, `eu` (five searches, nothing).
- macOS in Catalan for "Hide Others"; a Basque name for the Shift key; the wording of the 12- or 24-hour switch on
  a phone in each language (from knowledge of Android).

## Round 4

Sources added in round 4 (read 2026-11-12):

- **macOS**: Apple's own texts in the `.loctable` files of macOS 27.0.1 on the owner's machine (how to read them:
  `sources.md`). TextEdit's `Edit.loctable` (the application menu,
  Edit, View); the `MainMenu.loctable` of Preview, Photos, Mail, Notes and Terminal; AppKit's `Common.loctable`
  and `MenuCommands.loctable`; Photos' `IPXMain.loctable` and `PhotosUICore.framework`'s tables; the Date & Time
  settings. They have `ca`, `es` (Spain), `es_419` (Latin America), `fr`, `it`, `pt_BR` (`pt` in Photos' tables)
  and `pt_PT`; not Galician, not Basque.
- **Firefox**, `menubar.ftl`, read again for Hide, Hide Others, Show All, Quit, About, View and the zoom items.

### All eight (round 4)

- `menu.app.services`, `hide`, `hideOthers`, `showAll` and `quit` are shown on macOS only
  (`src-main/menu/menu-template-on-mac.ts`), so macOS's own wording is the one to have, as the other groups settled
  in round 3; `menu.app.about` is also shown under Help on Windows and Linux, and the rest of `menu.*` on all three
  systems, so there Windows' and Firefox's words stand beside macOS's. Round 4.
- `menu.view.title` stays in every language: macOS's View menu has other words (`Visualización`, `Mostra`,
  `Présentation`, `Visualizar`, `Visualização`; Italian `Vista` is the file's), Windows and Firefox have the
  files'. Round 4 (left).

### Spanish (`es`), round 4

- `menu.app.hideOthers`: `Ocultar otros` stays. macOS `es_419` and Firefox `es-ES` have it; macOS `es` (Spain) has
  `Ocultar otras apps`. The one `es` file is for both regions. Round 4 (confirmed; do not change to macOS Spain's).
- `menu.app.about`, `services`, `hide`, `showAll`, `quit`: macOS `es`, word for word. Round 4 (confirmed).
- Date taken: `Fecha de captura`. macOS Photos ("Date Captured", "Capture Date", "Captured"). Round 4 (confirmed
  with a first-hand source; round 3 had a forum).
- `welcome.message`: `Te damos la bienvenida a`. macOS Photos (the form without gender of "Welcome to Photos").
  Round 4 (confirmed).
- Zoom in the View menu: macOS has `Aumentar zoom`, `Reducir zoom`. `Acercar`, `Alejar` stay, as in round 3.
  Round 4 (left).

### Catalan (`ca`), round 4

- `menu.app.hide`: `Oculta {{appName}}`; `menu.app.hideOthers`: `Oculta la resta`. macOS (`Oculta el TextEdit`,
  `Oculta el Mail`, `Oculta la resta` in TextEdit, Preview, Photos, Mail, Notes, Terminal). Round 4 (changed).
  **This overturns round 3's line** that confirmed `Amaga` from Firefox: the two items are shown on macOS only,
  where the system's own item is the stronger source than one application's, and `Amaga la resta` was neither
  macOS's nor Firefox's (`Amaga altres`).
- `menu.help.toggleDeveloperTools` keeps `Mostra o amaga …`: the item is shown on every system, and `amaga` is
  Windows' and Firefox's Catalan. Round 4 (left; do not make it `oculta` for the sake of one word, nor the
  application menu `Amaga` again).
- `menu.app.showAll` `Mostra-ho tot`, `quit` `Surt de`, `services` `Serveis`, `Desfés`, `Refés`, `Amplia`,
  `Redueix`, `Mida real`: macOS. Round 4 (confirmed).
- `menu.app.about`: `Quant a` stays (Firefox, Windows, Photo Data Viewer); macOS 27 has `Sobre el TextEdit`. The
  item is shown on Windows and Linux too. Round 4 (left).
- Date taken: `Data de captura`. macOS Photos. Round 4 (confirmed; open after round 3).
- SmartScreen's buttons: `Més informació`, `Executa igualment`. Two Catalan applications' pages quote the dialog
  («Windows ha protegit el teu PC»): github.com/nilis24/CameraFotosCarnet, github.com/acoll90/ubidiscover.
  Round 4 (confirmed by third parties; not read off a Windows).
- Delete: `Suprimeix` (Windows) stays beside macOS's `Elimina`. Round 4 (left).

### Galician (`gl`), round 4

- SmartScreen's buttons: `Máis información`, `Executar de todos os xeitos`. A Galician application's release page
  quotes the dialog («Windows protexeu o teu PC» → Máis información → Executar de todos os xeitos):
  github.com/callejodev-dotcom/barullo-xuno/releases/tag/v0.1.1. Round 4 (the second changed from `Executar de
  todas as formas`, which had no source; one page by a third party, not read off a Windows).
- The menu: Firefox `gl` read again (`Agochar`, `Amosar todo`, `Sobre o`, `Saír do`); the files' `Ocultar`,
  `Mostrar todo`, `Acerca de`, `Saír de` stay, as in round 3. macOS has no Galician. Round 4 (left).

### Basque (`eu`), round 4

- Nothing new. macOS has no Basque; Firefox `eu` read again and the same as in round 3. SmartScreen's buttons: two
  more searches, nothing. Round 4.

### French (`fr`), round 4

- `menu.app.*`, `Annuler`, `Rétablir`, `Zoom avant`, `Zoom arrière`, `Taille réelle`, `Faire pivoter`, `Vignettes`,
  `Afficher les détails`, `Plus d’options`, `Bienvenue dans`: macOS, all the same. Round 4 (confirmed).
- `Paramètres` (the application's own settings, Windows' word) stays beside macOS's `Réglages…`; the file already
  has `réglage` for macOS's own setting. Round 4 (left, as in round 3).

### Italian (`it`), round 4

- `menu.app.*`, `Vista`, `Ingrandisci`, `Riduci`, `Dimensioni reali`, `Annulla`, `Ruota`, `Mostra dettagli`,
  `Benvenuto in`: macOS, all the same. Round 4 (confirmed).
- `menu.selection.redo`: `Ripristina` stays. macOS has it in Preview's and Photos' Edit menus, and `Ripeti` in
  TextEdit's (Firefox too). Round 4 (left).
- Sort order: `Crescente`, `Decrescente` (Windows) stay beside macOS Photos' `Ascendente`, `Discendente`. Round 4
  (left).

### Portuguese of Brazil (`pt-BR`), round 4

- `menu.app.hide` `Ocultar {{appName}}` and `quit` `Encerrar {{appName}}` have no article, `about` `Sobre o
  {{appName}}` has it: macOS (`Ocultar Mail`, `Encerrar Mail`, `Sobre o Mail`). Firefox has `Ocultar o Firefox`;
  macOS's own item stands. Round 4 (confirmed).
- Date taken: `Data da captura`. macOS Photos (`Data da Captura` for "Capture Date"). Round 4 (confirmed; open
  after round 3).
- `Crescente`, `Decrescente`, `Girar`, `Apagar`, `Buscar`, `Mostrar tudo`, `Ocultar outros`: macOS. Round 4
  (confirmed).

### Portuguese of Portugal (`pt-PT`), round 4

- `menu.app.hide`: `Ocultar o {{appName}}`, with the article. macOS (`Ocultar o Mail`, `Ocultar o Terminal`) and
  Firefox `pt-PT` (`Ocultar o Firefox`); `Acerca do` and `Sair do` beside it already had it. Round 4 (changed).
- `menu.app.hideOthers`: `Ocultar outras aplicações`. macOS and Firefox `pt-PT`, the same words. Round 4 (changed).
- `Acerca do`, `Sair do`, `Mostrar tudo`, `Serviços`, `Ascendente`, `Descendente`, `Rodar`, `Pesquisar`, `Guardar`,
  `Apagar`, `Definições`, `A carregar`, `Formato de ficheiro não suportado`: macOS. Round 4 (confirmed).
- Date taken: `Data da captura` stays; macOS Photos has `Data de captura` in Portugal (and `Data da Captura` in
  Brazil). Both are correct and differ by the article alone; Explorer's label in Portugal was not found. Round 4
  (left: change it only if Windows in Portugal turns out to have `Data de captura` too, or another label).

## Open after round 4 (no source found; do not count as settled)

- SmartScreen's buttons in `eu` (ten searches over two rounds, nothing). In `ca`, `gl`, `es`, `pt-BR` and `pt-PT`
  they are quoted by third parties only. A Windows in the language would settle them.
- Explorer's label for "Date taken" in `pt-PT`, `gl` and `eu`.
- A Basque name for the Shift key; the wording of the 12- or 24-hour switch on a phone in each language. macOS's
  switch is for the 24-hour clock alone (`Reloj de 24 horas`, `Rellotge de 24 hores`, `Affichage 24 h`, `24 ore`,
  `Relógio de 24 horas`), so it does not give the label of both.

## Round 5

No text changed in round 5. The lines below are confirmations, and wordings left with evidence for both sides.

Sources added in round 5 (read 2026-11-12, with `curl`):

- **Android Settings**: `packages/apps/Settings/+/refs/heads/main/res/values-<code>/strings.xml?format=TEXT` at
  android.googlesource.com (base64; `pt-rBR`, `pt-rPT`): `date_time_24hour`, `time_format_category_title`.
- **KDE**: `po/<lang>/plasma_applet_org.kde.plasma.digitalclock.po` at `invent.kde.org/plasma/plasma-workspace`
  ("12-Hour", "24-Hour"); `po/<lang>/dolphin.po` at `invent.kde.org/system/dolphin` (Portugal is `pt`).
- **GNOME Settings**, **GTK**: `po/<lang>.po` at `gitlab.gnome.org/GNOME/gnome-control-center` ("_24-hour", "Time
  _Format") and at `gitlab.gnome.org/GNOME/gtk` (the key labels: `msgctxt "keyboard label"`).
- **Chromium**: `chrome/app/resources/generated_resources_<code>.xtb` and
  `ui/strings/translations/ui_strings_<code>.xtb` at chromium.googlesource.com (base64). It has `eu` and `gl` too.

### All eight (round 5)

- `settings.dateTime.clock12`, `clock24`: `12 horas`, `24 horas` (`es`, `gl`, `pt-BR`, `pt-PT`), `12 hores`, `24
  hores`, `12 ordu`, `24 ordu`, `12 heures`, `24 heures`, `12 ore`, `24 ore`. KDE's clock settings have exactly these
  two choices in all eight languages, and GNOME's Settings the same for "24-hour". They are what the guide asks for
  ("as the settings of phones and computers do"); do not add "format" to them. Round 5 (confirmed; from knowledge
  before).
- `settings.dateTime.clockSystem`: the label with "format" (`Formato de 12 o 24 horas`, `Format de 12 o 24 hores`,
  `Formato de 12 ou 24 horas`, `12 edo 24 orduko formatua`, `Format 12 ou 24 heures`, `Formato 12 o 24 ore`). Android's
  Settings: `Usar formato de 24 horas`, `Utilitza el format de 24 hores`, `Erabili 24 orduko formatua`, `Utiliser le
  format 24h`, `Usa il formato 24 ore`. Round 5 (confirmed; closes "the wording of the 12- or 24-hour switch on a
  phone" under "Open after round 4").
- The texts that the checks compare by script are clean: typography (French no-break spaces, Spanish `¿` `¡`, one
  kind of quotation mark per language, end punctuation), and the same English with two translations (all intended).
  Round 5.

### Spanish (`es`), round 5

- `menu.help.toggleDeveloperTools`: `herramientas de desarrollo` stays; Chromium has `Herramientas para
  desarrolladores`, Firefox `Herramientas del navegador`. `menu.view.reload`: `Recargar` (Firefox) stays beside
  Chromium's `Volver a cargar`. Round 5 (left).
- `Tamaño real`, `Acercar`, `Alejar`, `pantalla completa`: Chromium `es`, the same. Round 5 (confirmed).
- Date taken: Dolphin has `Fecha de la fotografía`; `Fecha de captura` (macOS Photos, round 4) stands. Round 5
  (left).

### Catalan (`ca`), round 5

- `Ctrl+Maj+I`: `Maj`. GTK `ca`, key label. Round 5 (confirmed with a second source).
- `Ascendent`, `Descendent`, `Menú contextual`: Dolphin `ca`. Round 5 (confirmed).

### Galician (`gl`), round 5

- `Ctrl+Maiús+I`: `Maiús`. GTK `gl`, key label. Round 5 (confirmed with a second source).
- `menu.help.toggleDeveloperTools`: `ferramentas de desenvolvemento` stays; Chromium `gl` has `Ferramentas para
  programadores`, Firefox `Ferramentas do navegador`. `Recargar` stays beside Chromium's `Volver cargar`. Round 5
  (left).
- Date taken: `Data de captura` has no source as a label in Galician (Dolphin `Data da fotografía`, Shotwell `Data
  da exposición`). It is the label of Spanish and Portuguese Windows and Photos. Round 5 (left; still open).

### Basque (`eu`), round 5

- `Ctrl+Shift+I` stays: GTK `eu` labels the keys `Shift` and `Ctrl`; LibreOffice `eu` keeps `Ctrl` (and writes
  Shift as `⇧`). Chromium `eu` has `Maius` and `Ktrl` (`ui_strings_eu.xtb`). Both usages exist. Round 5 (left, with
  evidence for both; this closes "a Basque name for the Shift key": do not look it up again, and do not change one
  key without the other).
- `settings.os.*`: `laster-menua` for the context menu and `Fitxategi-arakatzailea` for Explorer. Chromium `eu`
  (`laster-menua`, `fitxategi-arakatzailetik`) and LibreOffice `eu` (`laster-menua`); KDE and GTK have
  `testuinguru-menua`. The text is about Windows, whose Basque has `laster-menu` (from knowledge of Microsoft's
  terms). Round 5 (confirmed; first source for these two words).
- `Gorantz`, `Beherantz`: Dolphin `eu` too (beside `Goranzkoa`, `Beheranzkoa`). Round 5 (confirmed).
- Date taken: `Ateratze-data` has no source (Dolphin `Argazkiratze data`, Shotwell `Esposizio-data`; gThumb, GNOME
  Photos, digiKam and Gwenview have no such label). Round 5 (left; still open).
- SmartScreen's buttons: one more search, nothing (eleven over three rounds). Chromium `eu` has `Jarraitu, hala
  ere` for "Continue anyway". Round 5 (still open).

### French (`fr`), round 5

- Date taken: `Date de prise de vue`. Dolphin `fr` ("Date Photographed"). Round 5 (confirmed; first source in
  this log).
- `Menu contextuel`: Dolphin `fr`. Round 5 (confirmed).

### Italian (`it`), round 5

- Sort order: `Crescente`, `Decrescente`. Dolphin `it`. Round 5 (confirmed with a source; round 4 had Windows from
  knowledge and left macOS Photos' `Ascendente`, `Discendente` beside it).
- `Menu contestuale`: Dolphin `it`. Round 5 (confirmed).

### Portuguese of Brazil (`pt-BR`), round 5

- `Ctrl+Shift+I`: the key is `Shift`. GTK `pt_BR`, key label. Round 5 (confirmed; from knowledge before).
- `ferramentas do desenvolvedor`, `Tamanho real`, `Recarregar`, `tela cheia`: Chromium `pt-BR`. `Crescente`,
  `Decrescente`, `Menu de contexto`: Dolphin `pt_BR`. Round 5 (confirmed).

### Portuguese of Portugal (`pt-PT`), round 5

- `Ctrl+Shift+I`: the key is `Shift`. GTK `pt`, key label. Round 5 (confirmed; from knowledge before).
- SmartScreen's buttons: `Mais informações`, `Executar mesmo assim`, quoted with «O Windows protegeu o seu PC» by
  four pages from Portugal (three on GitHub, one school's: aepacosbrandao.pt/moodle30/course/view.php?id=191).
  Round 5 (confirmed by third parties; not read off a Windows).
- `ecrã completo` (Firefox `pt-PT`, macOS) stays beside Chromium's `Ecrã inteiro`; `ferramentas de programador`
  stays beside Chromium's `Ferramentas para programadores`. Round 5 (left).
- `Ascendente`, `Descendente`, `Menu de Contexto`, `Tamanho real`, `Recarregar`, `Ampliar`, `Reduzir`: Dolphin `pt`,
  Chromium `pt-PT`. Round 5 (confirmed).
- Date taken: `Data da captura` stays, as in round 4; Explorer's column in Portugal was not found (one more
  search). Round 5 (left; still open).

## Open after round 5 (no source found; do not count as settled)

- SmartScreen's buttons in `eu` (nothing found); in `es`, `ca`, `gl`, `pt-BR`, `pt-PT` they are quoted by third
  parties only.
- Explorer's label for "Date taken" in `pt-PT`, `gl` and `eu`.
- Both need a Windows in the language. Everything else that the earlier rounds listed as open is closed above.

## Round 6

One text changed in round 6, in Spanish, in each of the three places (3 texts). The other lines are confirmations
and wordings left with evidence for both sides.

Sources added in round 6 (read 2026-11-12):

- **Chromium by the English text**: `generated_resources`, `components_strings` and `ui_strings` for `es`,
  `es-419`, `ca`, `gl`, `eu`, `fr`, `it`, `pt-BR`, `pt-PT` (the way that `sources.md` describes).
- **macOS, counted**: the `.loctable` files of AppKit, Finder, Photos, Preview and Mail, `es` against `es_419`.

### Spanish (`es`), round 6

- `language.noLanguagesFound` (the application, the website, Photo Data Viewer): `No se han encontrado idiomas`.
  Round 6 (changed from `No se encontraron idiomas`). The perfect is the tense of the Spanish of Spain for what
  has just happened, and of every other such text of the files (`Se han cargado`, `No se ha podido`, `Se ha
  añadido`); the simple past is Latin America's. Chromium: "No results found" is `No se han encontrado resultados`
  in `es` and `No se encontraron resultados` in `es-419` (36 against 0 uses of the perfect with `encontrado` in
  `es`; 2 against 34 in `es-419`). macOS: 143 against 1 in `es`, 0 against 147 in `es_419`.
- **The `es` files are in the Spanish of Spain**: `Ajustes` (macOS `es`; `es_419` has `Configuración`), `Añadir`
  (Chromium `es`; `es-419` has `Agregar`), `pulsa`, the perfect for what has just happened. A new or changed text
  follows that. This narrows round 4's "the one `es` file is for both regions", which stands for `Ocultar otros`
  (the word that both regions have) and is not a reason to mix the two regions' grammar. Round 6.
- The simple past stays in `se tomaron las fotos`, `se tomó la foto` (when a photo was taken): both regions have
  it for a time long past. Round 6 (confirmed).
- `settings.tabs.appearance`: `Apariencia` stays; Chromium `es` and macOS in Spain have `Aspecto`, GNOME, Firefox
  and Visual Studio Code `Apariencia` (from knowledge of them). Round 6 (left).

### Catalan (`ca`), round 6

- `No s’ha trobat cap idioma` (Chromium: `No s'ha trobat cap resultat`), `Afegeix`, `Desa`, `Mostra els detalls`,
  `Mida real`, `Obre la carpeta`, `Obre amb`, `Aparença`: Chromium `ca`, the same. Round 6 (confirmed).

### Galician (`gl`), round 6

- `language.noLanguagesFound`: `Non se atopou ningún idioma` keeps the simple past: Galician has no compound
  perfect (Chromium `gl`: `Non se encontraron resultados`). Do not carry the Spanish change over. Round 6
  (confirmed).
- `Engadir`, `Gardar`, `Tamaño real`, `Aparencia`, `Acerca de`, `Abrir cartafol`, `Abrir con`: Chromium `gl`.
  Round 6 (confirmed).

### Basque (`eu`), round 6

- `Ez da hizkuntzarik aurkitu` (Chromium: `Ez da aurkitu emaitzarik`), `Gehitu`, `Gorde`, `Erakutsi xehetasunak`,
  `Benetako tamaina`, `Guztira`, `Itxura`, `Honi buruz`, `Ireki karpeta`: Chromium `eu`. Round 6 (confirmed).

### French (`fr`), round 6

- `Aucune langue trouvée` (Chromium: `Aucun résultat trouvé`), `Ajouter`, `Enregistrer`, `Afficher les détails`,
  `Apparence`, `À propos`, `Ouvrir le dossier`, `Ouvrir avec`: Chromium `fr`. Round 6 (confirmed).
- `menu.view.reload`, Photo Data Viewer's `pageNotShown.reload`: `Recharger` stays beside Chromium's
  `Actualiser`. Round 6 (left).

### Italian (`it`), round 6

- `Nessuna lingua trovata` (Chromium: `Nessun risultato trovato`), `Aggiungi`, `Salva`, `Mostra dettagli`,
  `Aspetto`, `Informazioni`, `Apri cartella`, `Apri con`: Chromium `it`. Round 6 (confirmed).
- `menu.help.title`: `Aiuto` (macOS) stays beside Chromium's `Guida` (Windows' word). Round 6 (left).

### Portuguese of Brazil (`pt-BR`), round 6

- `Nenhum idioma encontrado` (Chromium: `Nenhum resultado encontrado`), `Adicionar`, `Salvar`, `Mostrar detalhes`,
  `Aparência`, `Sobre`, `Abrir pasta`, `Abrir com`: Chromium `pt-BR`. Round 6 (confirmed).
- No word or form of Portugal in the three files (by script). Round 6.

### Portuguese of Portugal (`pt-PT`), round 6

- `language.noLanguagesFound`: `Nenhum idioma encontrado` stays (macOS `pt_PT`: `Nenhum resultado`); Chromium
  `pt-PT` has the full sentence `Não foram encontrados resultados`. Round 6 (left).
- "Shown": `mostrar` in the application and `apresentar` on the website and in Photo Data Viewer are both
  Portugal's wording for "display", in sentences, not names; not made the same. Round 6 (left).
- `Adicionar`, `Guardar`, `Mostrar detalhes`, `Aspeto`, `Acerca de`, `Abrir pasta`, `Abrir com`: Chromium `pt-PT`.
  Round 6 (confirmed).
- No word or form of Brazil in the three files (by script). Round 6.

## Open after round 6 (no source found; do not count as settled)

- The same as after round 5: SmartScreen's buttons in `eu` (nothing found; third parties only in `es`, `ca`,
  `gl`, `pt-BR`, `pt-PT`), and Explorer's label for "Date taken" in `pt-PT`, `gl` and `eu`. Both need a Windows in
  the language.

## Round 7

No text changed in round 7: the 24 files are as they were after round 6. The lines below are one
confirmation and the wordings left with both sides weighed.

### All eight (round 7)

- A scan by script of the 24 files (placeholders, tags, line breaks, quotation marks, apostrophes, spaces, the
  French no-break spaces, Spanish `¿` `¡`, end punctuation, invisible characters, one English text with two
  translations) reports only what is intended: `(Language)`, `(antes Twitter)`, the abbreviations of "No.", the
  colon of `sortByShootingTimeInfo.intro` in `ca`, `gl`, `eu`, "Select Only This" for a file and a folder, "Open
  Folder" as the sidebar's button beside the menus' item in `ca`, `gl`, `fr`. Round 7.

### Galician (`gl`), round 7

- `sortByShootingTimeInfo.details.modifiedTime`: `e por iso se usa`, with the pronoun before the verb, is right
  after the fronted `por iso`; the other texts have it after the verb (`Engadiuse`, `gárdanse`), as a main clause
  does. Do not "correct" either. Round 7 (confirmed, from knowledge of Galician grammar).
- Photo Data Viewer's `demo.description`: `Ao premer o botón` stays beside `Fai clic` elsewhere (the page is used
  on phones; Basque has `sakatzean`). Round 7 (left).

### Catalan (`ca`), round 7

- `Elimina la regió` (`map.removeRegion`) beside `Suprimeix` (`settings.os.remove`, `settings.cache.delete`):
  both verbs are Catalan software's for "Remove" and "Delete"; each of the three things has one verb wherever it
  comes up. Round 7 (left).

### French (`fr`), round 7

- `welcome.usageInfoCollection`: `Pour être améliorée, cette application collecte …` (active, strictly
  grammatical, a little stiff) stays beside Photo Data Viewer's `about.usageData` `Pour améliorer cette
  application, des données d’utilisation sont collectées` (the usual wording of such a notice, with an infinitive
  that has no subject). Each gives something up and no source prefers one; they are sentences, not names. Round 7
  (left; change only on a French speaker's word).

### Portuguese of Brazil (`pt-BR`), round 7

- Date taken: `Data da captura`. Explorer's column is named `Data da Captura` in a Portuguese answer on
  Microsoft's forum (learn.microsoft.com/pt-br/answers/questions/5920292/fotos-antigas; a community member). With
  round 4's macOS Photos, two sources. Round 7 (confirmed).
- `settings.cache.thereforeCached`: `ficam guardadas no cache` stays beside Chrome's `armazenadas em cache`
  (from knowledge). Round 7 (left).

## Open after round 7 (no source found; do not count as settled)

- The same as after rounds 5 and 6: SmartScreen's buttons in `eu` (twelve searches over four rounds, nothing;
  third parties only in `es`, `ca`, `gl`, `pt-BR`, `pt-PT`), and Explorer's label for "Date taken" in `pt-PT`,
  `gl` and `eu` (four more searches and two pages in round 7, nothing). Both need a Windows in the language;
  further searches of the same kind are not worth a round's time.
