# Decision log: east (bg, ru, uk, el, tr, ro, he, ar)

One line for each term or text that is settled by evidence: the key or the term, the wording, the source, the round.
Append only. A line that overturns an earlier one says so and why. "Knowledge" means that no page was found and the
wording is from knowledge of the product named: weaker than a source, and open to a page that shows otherwise.
"Changed" or "confirmed" says what the round did.

## Every language of the group

- The texts about what is collected (`welcome.usageInfoCollection`, `landing.analyticsNotice`, Photo Data Viewer `about.keptInBrowser`, `about.usageData`, `settings.usageData.*`): faithful in all eight, checked by translating back. Round 3, confirmed.
- Texts with a number or `{{appName}}`: right for any value in all eight (a label and a number, a fixed number, or a number with no noun after it; no name declined). Round 3, confirmed.
- The separator ` - ` in `directoryTree.openedFolder` and Photo Data Viewer `pageTitle.*`: kept as in all 42 languages; whether `ru`, `uk` (` — `), `bg`, `he` (` – `) take their own dash is the owner's decision, asked in round 3. Do not change it in a round.
- "Shooting time" (the sort) and "date taken" (Photo Data Viewer): one term in `bg`, `ro`, `el`; two in `ru`, `uk`, `tr`, `he`, `ar`, following the English. Whether all take one term is the owner's decision, asked in round 3. Do not change it in a round.
- A file's modification date is named as Explorer and Finder name it, a date, in all eight (`дата на промяна`, `дата изменения`, `дата змінення`, `ημερομηνία τροποποίησης`, `değiştirilme tarihi`, `data modificării`, `תאריך השינוי`, `تاريخ التعديل`). Round 3 (`he`, `ar` changed; the others confirmed from knowledge of Windows).

## Bulgarian (`bg`)

- `sidebar.sort.byShootingTime` and the three texts that quote it: `По дата на заснемане`; `по време на` reads "during". First pass, changed; round 3, confirmed.
- `settings.os.*`: Explorer is `Файловия мениджър`. Knowledge of Windows 11. Round 3, confirmed.
- SmartScreen's buttons `Повече информация`, `Изпълни въпреки това`: NOT confirmed; no page found in round 3. Needs a Windows in Bulgarian.
- `menu.app.*`: not confirmed; Apple's Bulgarian page about quitting an application is in English (round 3).

## Russian (`ru`)

- SmartScreen's buttons: `Подробнее`, `Выполнить в любом случае` (title «Система Windows защитила ваш компьютер»). Source: https://www.securitylab.ru/blog/personal/SimlpeHacker/362413.php. Round 3, confirmed.
- Photo Data Viewer `photoData.notAvailable`: `Нет данных`, with `map.locationNotAvailable` and `unsupportedFileDialog.message` (`отсутствуют`, first pass): data that is not there is never `недоступно`. Round 3, changed.
- `menu.app.quit` `Завершить {{appName}}`, `hideOthers` `Скрыть остальные`, `services` `Службы`, `view.actualSize` `Реальный размер`: knowledge of macOS. Round 3, confirmed.
- `settings.os.*`: Explorer is `Проводник`. Knowledge of Windows. Round 3, confirmed.

## Ukrainian (`uk`)

- `menu.app.quit`: `Завершити {{appName}}`. Source: https://support.apple.com/uk-ua/guide/mac-help/mchl834d18c2/mac («Оглядач > Завершити Оглядач»). Round 3, confirmed.
- Photo Data Viewer `photoData.notAvailable`: `Немає даних`, as Russian. Round 3, changed.
- `sortByShootingTimeInfo.*`: `дата змінення`. Knowledge of Windows (`Дата змінення`). Round 3, confirmed.
- SmartScreen's buttons `Докладніше`, `Усе одно запустити`: NOT confirmed. A third party has «Виконати в будь-якому випадку» (https://expertka.com.ua/didzhytal/yak-vimknuti-windows-smartscreen.html), which reads as a translation from Russian. Needs a Windows in Ukrainian. Round 3.

## Greek (`el`)

- `sidebar.sort.byShootingTime` and the three texts that quote it: `Κατά ημερομηνία λήψης`; `ώρα` is the time of day. `Ημερομηνία λήψης` is Explorer's "Date taken" (knowledge of Windows) and Photo Data Viewer's `dateTaken`. Round 3, changed.
- `chart.*`: the chart's zoom is `ζουμ` in all three texts; `μεγέθυνση` is the map's. Round 3, changed (`selectPhotosWithinZoom`).
- `menu.app.quit`: `Τερματισμός του {{appName}}`. Source: https://support.apple.com/el-gr/guide/mac-help/mchl834d18c2/mac («Τερματισμός εφαρμογής»). Round 3, confirmed.
- `settings.os.*`: Explorer is `Εξερεύνηση αρχείων`. Knowledge of Windows. Round 3, confirmed.
- SmartScreen's buttons `Περισσότερες πληροφορίες`, `Εκτέλεση οπωσδήποτε`: NOT confirmed. A third party has «Εκτέλεση ούτως ή άλλως» (https://directvortex.gr/pos-na-apenergopoiisete-to-windows-defender-smartscreen-sta-windows-11-2/). Needs a Windows in Greek. Round 3.

## Turkish (`tr`)

- Capitals: the first word alone, except the main button of a page (Photo Data Viewer's `TERMS.md`). `menu.app.about` is `{{appName}} hakkında` (Firefox: `Firefox hakkında`, knowledge). Round 3, changed.
- SmartScreen's buttons: `Ek bilgi`, `Yine de çalıştır`. Source: one user's instruction, https://itch.io/post/14854650. Round 3, confirmed (weakly).
- `menu.view.title` `Görüntü`, `menu.app.services` `Servisler`, `common.cancel` `Vazgeç`: macOS's words (knowledge); `Görünüm` stays the Appearance tab. Round 3, confirmed.
- `photoInfo.menu.openGoogleMaps`, `openGoogleStreetView`: "Open in …" (`Google Haritalar’da aç`), first pass. Round 3, confirmed.

## Romanian (`ro`)

- `menu.app.quit`: `Închide {{appName}}`; macOS has «Închideți aplicația Previzualizare», the verb `a închide`, not `a termina`. Source: https://support.apple.com/ro-ro/guide/mac-help/mchl834d18c2/mac. The singular imperative is the recorded form of a command (Photo Data Viewer's `TERMS.md`). Round 3, confirmed.
- `language.systemLanguage.mac`: `configurarea din macOS` (macOS: `Configurări sistem`, same page) beside `setarea din Windows`. Round 3, confirmed.
- `dosar` for a folder: macOS and Google (knowledge); Windows has `folder`. Stays. Round 3, confirmed.
- Website `landing.showsLocationsOnMap`: says which places (`locurile unde au fost făcute`), as `ru`, `uk`, `bg`, `ar` since the first pass. Round 3, changed.
- SmartScreen's buttons `Mai multe informații`, `Executare oricum`: NOT confirmed. Two developers' notes have „Rulează oricum” (https://github.com/raull292/raxen-agent-releases, https://github.com/23botnari/screen-releases). Needs a Windows in Romanian. Round 3.

## Hebrew (`he`)

- `sortByShootingTimeInfo.step2`, `details.modifiedTime`, `details.otherFiles`: `תאריך השינוי`. Source: Finder's ״תאריך שינוי אחרון״, https://support.apple.com/he-il/guide/mac-help/mchlp1745/mac; Explorer's `תאריך שינוי` (knowledge). Round 3, changed.
- Website `landing.showsLocationsOnMap`: says which places (`המקומות שבהם צולמו`). Round 3, changed.
- `יישום` for the application: Apple's word; Windows 10 and 11 and Google say `אפליקציה` (knowledge; the first pass had the platforms the wrong way round). Stays, consistent. Round 3, confirmed.
- `settings.os.*`: Explorer is `סייר הקבצים` (Microsoft's Hebrew support page «סייר הקבצים ב- Windows»). Round 3, confirmed.
- SmartScreen's buttons `מידע נוסף`, `הפעל בכל זאת`: NOT confirmed; no page found. Needs a Windows in Hebrew. Round 3.

## Arabic (`ar`)

- `sortByShootingTimeInfo.step2`, `details.modifiedTime`, `details.otherFiles`: `تاريخ تعديل`. Source: Finder's `تاريخ التعديل`, https://support.apple.com/ar-ae/guide/mac-help/mchlp1745/mac; Explorer's column of the same name (knowledge). Round 3, changed.
- `Twitter` in Latin letters in both applications (first pass). Round 3, confirmed.
- Photo Data Viewer `photoData.tabs.rawData` `البيانات الخام`; `welcome.usageInfoCollection` `مجهولة الهوية` (first pass). Round 3, confirmed.
- `menu.app.*`: `حول`, `إنهاء`, `إخفاء الآخرين`, `إظهار الكل` (knowledge of macOS). Round 3, confirmed.
- `settings.os.*`: Explorer is `مستكشف الملفات` (the name used on Microsoft's Arabic Q&A site; knowledge of Windows). Round 3, confirmed.
- SmartScreen's buttons `معلومات إضافية`, `تشغيل على أي حال`: NOT confirmed; no page found. Needs a Windows in Arabic. Round 3.

## Round 4

Sources read in round 4, named below by a short word. "macOS": the `.loctable` files of macOS 27.0.1 (TextEdit's `Edit.loctable`, Preview's `MainMenu.loctable`, AppKit's `Common.loctable` and `MenuCommands.loctable`, Photos, Finder's `ListView.loctable`, the Date & Time settings); macOS has `ru`, `uk`, `el`, `tr`, `ro`, `he`, `ar` and no `bg`. "Firefox": `browser/browser/menubar.ftl` of the language in github.com/mozilla-l10n/firefox-l10n. "Chromium": `chrome/app/resources/generated_resources_<code>.xtb`. "Android": `packages/apps/Settings/res/values-<code>/strings.xml`. "Microsoft's page": the title of support.microsoft.com/<locale>/windows/file-explorer-in-windows-ef370130-1cca-9dc5-e0df-2f7416fe1cb1.

### Every language of the group

- The clock setting is now confirmed with a source in all eight: `bg` `24-часов формат` (Android); `ru` `24-часовой формат` (macOS, Android); `uk` `24-годинний формат` (macOS, Android); `el` `24ωρη μορφή` (macOS `24ωρη μορφή ώρας`); `tr` `24 saat biçimi` (macOS, Android); `ro` `format de 24 de ore` (Android `formatul de 24 de ore`); `he` `שעון 24 שעות` (macOS); `ar` `نظام 24 ساعة` (the title of Wikipedia's article; macOS and Android have `تنسيق ٢٤ ساعة`, left as equally good). Round 4, confirmed.
- A file's modification date: Finder's column is `Дата изменения`, `Дата змінення`, `Ημερομηνία τροποποίησης`, `Değişiklik Tarihi`, `Data modificării`, `תאריך שינוי אחרון`, `تاريخ التعديل` (macOS). The texts agree; Turkish `değiştirilme tarihi` is another form in use and stays. Round 4, confirmed.
- The date a photo was taken: Apple Photos' "Capture Date" is `Дата съемки`, `Дата зйомки`, `Ημερομηνία λήψης`, `Çekme Tarihi`, `Data capturării`, `תאריך צילום`, `تاريخ الالتقاط` (macOS). The texts agree in `ru`, `uk`, `el`, `he`, `ar`; `tr` `Çekim tarihi` and `ro` `Data fotografierii` are other forms in use and stay. Round 4, confirmed.
- Explorer's name in `settings.os.*` is Windows' own in `bg` (`Файлов мениджър`), `ru` (`Проводник`), `el` (`Εξερεύνηση αρχείων`), `tr` (`Dosya Gezgini`), `ro` (`Explorer`), `he` (`סייר הקבצים`), `ar` (`مستكشف الملفات`): Microsoft's page. Round 4, confirmed (round 3 had them from knowledge).
- The items of the application menu that only macOS shows (`menu.app.services`, `hide`, `hideOthers`, `showAll`, `quit`): compared with macOS word by word in round 4. What differs and stays is listed per language below; do not compare them again without a new source.
- Typography: no straight quotation mark or apostrophe, no `…`, no double space, no character that is not drawn in the 24 files. Round 4, confirmed by a scan.

### Bulgarian (`bg`)

- `menu.app.*`, `menu.view.title`, `actualSize`, `zoomIn`: `Относно …`, `Услуги`, `Скриване на …`, `Скриване на другите`, `Показване на всички`, `Изход от …`, `Изглед`, `Действителен размер`, `Увеличаване`: Firefox has each letter for letter. macOS is not translated into Bulgarian, so there is nothing of Apple's to compare with. Round 4, confirmed; this closes round 3's "not confirmed".
- `sortByShootingTimeInfo.details.sometimesMissing`: `… но понякога тази стойност липсва.`; `details.modifiedTime`: `… затова се използва като алтернатива, когато DateTimeOriginal липсва.` A pronoun (`тя`, `нея`) had no feminine noun in its sentence to refer to. Round 4, changed.
- SmartScreen's buttons `Повече информация`, `Изпълни въпреки това`: still NOT confirmed; no page found in round 4 either.

### Russian (`ru`)

- `menu.app.*`, `menu.view.title`, `actualSize`, `zoomIn`, `zoomOut`, `menu.selection.undo`, `redo`, `menu.help.title`: `О приложении …`, `Службы`, `Скрыть …`, `Скрыть остальные`, `Показать все`, `Завершить …`, `Вид`, `Реальный размер`, `Увеличить`, `Уменьшить`, `Отменить`, `Повторить`, `Справка`: macOS (TextEdit) has every one. Round 4, confirmed with a source (round 3: knowledge).

### Ukrainian (`uk`)

- `menu.view.actualSize`: `Фактичний розмір`. macOS (TextEdit and Preview). Firefox and Chromium have `Дійсний розмір`; the old `Справжній розмір` was in none. Round 4, changed.
- `menu.app.services`, `hide`, `hideOthers`, `showAll`, `quit`, `menu.view.title`, `toggleFullScreen`, `redo`, `menu.help.title`: `Служби`, `Сховати …`, `Сховати решту`, `Показати всі`, `Завершити …`, `Перегляд`, `Повноекранний режим`, `Повторити`, `Довідка`: macOS (TextEdit). Round 4, confirmed.
- Stays, though macOS differs, because Windows, Firefox or Chromium has the text's word: `menu.selection.undo` `Скасувати` (macOS `Відмінити`); `menu.view.zoomIn`, `zoomOut` `Збільшити`, `Зменшити` (macOS `Наблизити`, `Віддалити`; Firefox `Збільшити`); `menu.app.about` `Про програму …` (macOS declines the name). Round 4.
- `settings.os.*`: `Провідник`. Microsoft's page names it `Файловий провідник`; the text has the short name, as the English has "Explorer" for "File Explorer". Whether the full name is wanted is the owner's decision, asked in round 4. Do not change it in a round.
- SmartScreen: the link `Докладніше` is confirmed (four pages). The button `Усе одно запустити` has two developers' notes for it (https://github.com/Pixtane/transcribe-local-apk/releases/tag/windows-v1.0.5; `Все одно запустити` in https://github.com/alexandrkotov/tapalog-reader/releases/tag/v0.4.0) and two other wordings against it (`Виконати в будь-якому разі`, `Виконати в будь-якому випадку`): NOT settled. Round 4.

### Greek (`el`)

- `menu.app.hide`, `menu.app.quit` keep the article: `Απόκρυψη του …`, `Τερματισμός του …`, as Firefox has them; macOS has none (`Τερματισμός TextEdit`). Both in use. Round 4, confirmed.
- `menu.app.about`, `services`, `hideOthers`, `showAll`, `menu.view.*`, `menu.selection.*`: `Πληροφορίες για το …`, `Υπηρεσίες`, `Απόκρυψη άλλων`, `Εμφάνιση όλων`, `Προβολή`, `Πραγματικό μέγεθος`, `Μεγέθυνση`, `Σμίκρυνση`, `Αναίρεση`, `Επανάληψη`: macOS (TextEdit). Round 4, confirmed.
- `sidebar.sort.byShootingTime` and Photo Data Viewer `dateTaken`: `ημερομηνία λήψης` is Apple Photos' "Capture Date" (macOS). Round 4, confirmed with a source (round 3: knowledge).
- SmartScreen's buttons `Περισσότερες πληροφορίες`, `Εκτέλεση οπωσδήποτε`: one developer's note has exactly these (https://github.com/Geochanel1/silent-client), against round 3's article with «Εκτέλεση ούτως ή άλλως». Round 4, confirmed weakly.

### Turkish (`tr`)

- `menu.app.*`: `{{appName}} hakkında`, `Servisler`, `{{appName}} uygulamasını gizle`, `Diğerlerini gizle`, `Tümünü göster`, `{{appName}} uygulamasından çık`: Firefox has each letter for letter, in sentence case. `Gerçek boyut`: Firefox and macOS. `Yakınlaştır`: Firefox (macOS has `Büyüt`). `Geri al`, `Yinele`, `Görüntü`, `Vazgeç`: macOS. Round 4, confirmed with a source (round 3: knowledge).

### Romanian (`ro`)

- `menu.app.about`, `services`, `hide`, `hideOthers`, `showAll`, `menu.view.title`: `Despre …`, `Servicii`, `Ascunde …`, `Ascunde restul`, `Afișează tot`, `Vizualizare`: macOS's words (`Ascundeți restul`, `Afișați tot`), in the recorded singular. Round 4, confirmed.
- `menu.view.actualSize` `Dimensiune reală`: Chromium's; macOS has `Dimensiune efectivă`, Firefox `Mărime reală`. Stays. Round 4.
- SmartScreen: the link `Mai multe informații` is confirmed. The button `Executare oricum` is on one page (https://lulatranslate.com/); `Rulează oricum` and `rulați oricum` are on three (round 3's two, https://www.digitalcitizen.ro/ce-este-filtrul-smart-screen-cum-functioneaza/). NOT settled. Round 4.

### Hebrew (`he`)

- SmartScreen's buttons: `מידע נוסף`, `הפעל בכל זאת` (title «Windows הגן על המחשב שלך»). Four developers' notes, all the same: https://github.com/rpg05832/tzevet-releases, https://github.com/agmonp/shema/releases/tag/v1.0.15, https://github.com/ARIKBAR/gridcraft/releases/tag/he-v0.8.0-1, https://github.com/ygilbi/pdf-viewer/releases/tag/desktop-v0.2.0. Round 4, confirmed; this overturns round 3's "NOT confirmed".
- `menu.app.quit` `יציאה מ-{{appName}}`: Firefox's (`יציאה מ־Firefox`); macOS has `סיום …`. `menu.app.hideOthers` `הסתרת האחרים`: Firefox and Chromium have `הסתרת אחרים`, macOS `הסתרת יישומים אחרים`. `menu.app.about` `אודות …`: Windows' and Google's; macOS has `מידע על …`. All stay: both forms in use. Whether macOS's own words are wanted is the owner's decision, asked in round 4.
- `menu.app.services`, `hide`, `showAll`, `menu.view.title`, `actualSize`, `zoomIn`, `zoomOut`: `שירותים`, `הסתרת …`, `הצגת הכול`, `תצוגה`, `גודל אמיתי`, `הגדלה`, `הקטנה`: macOS. `טוען...`: macOS (`טוען…`). Round 4, confirmed.

### Arabic (`ar`)

- `menu.app.hideOthers`: `إخفاء الأخرى`. macOS (TextEdit and Preview); Chromium has `إخفاء النوافذ الأخرى`. `الآخرين` is the plural for people. This overturns round 3's line, which had `إخفاء الآخرين` from knowledge of macOS: macOS has the other. Round 4, changed.
- `menu.app.about`, `hide`, `showAll`, `quit`, `menu.view.*`, `menu.selection.undo`, `redo`, `menu.help.title`: `حول …`, `إخفاء …`, `إظهار الكل`, `إنهاء …`, `عرض`, `الحجم الفعلي`, `تكبير`, `تصغير`, `تراجع`, `إعادة`, `مساعدة`: macOS (TextEdit). `menu.app.services` `الخدمات`: Firefox's; macOS has `خدمات`. `chart.zoom` `تكبير/تصغير`: macOS (Preview's "Zoom"). Round 4, confirmed with a source.
- SmartScreen's buttons `معلومات إضافية`, `تشغيل على أي حال`: still NOT confirmed; no page found in round 4 either.

## Round 5

A source read in round 5, named below as "Microsoft's page": `https://learn.microsoft.com/<locale>/power-automate/desktop-flows/dynamics365-cs-rpa`, whose step "Install and configure Contoso CRM app" says "Select More info > Run anyway on the Windows protected you PC screen". It is machine-translated in `bg`, `ru`, `uk`, `tr`, `ro`, a human translation in `el`, and in English under `he-il` and `ar-sa`. Its wording of the button "Run anyway" agrees with a real screen wherever one was found (`ru`, `tr`); its wording of the link "More info" does not in Russian (`Дополнительная информация` where Windows has `Подробнее`). So it is weak evidence for the button and none for the link.

### Every language of the group

- A credit line ("Developed by …", "… is developed by …") is worded the same way in the application, on the website and in Photo Data Viewer, in all eight. Round 5 (`ar` changed; the others confirmed).
- The texts about what is collected, and the texts with a number or `{{appName}}`: read back and checked again, no finding. Round 5, confirmed.
- "Often" in `sortByShootingTimeInfo.details.modifiedTime` is `בדרך כלל`, `في الغالب`, `çoğunlukla` ("usually", "mostly") in `he`, `ar`, `tr`: within the meaning of the Japanese であることが多い. Left; do not change it in a round without a new reason.

### Bulgarian (`bg`)

- `chart.showDateUnknownPhotos`: `Показване на снимките с неизвестна дата върху картата`. After a verbal noun, the first `на` phrase is the object (`Показване на лентата на състоянието`; Chromium's `Редактиране на картата`, `Изтриване на картата`), so `Показване на картата на снимките …` said "show the map of the photos". The object comes first; the place has `върху`. Round 5, changed.
- "On a map" after a verb stays `на карта` (`landing.summary`, `landing.showsLocationsOnMap`): Android's Gallery has `Показване на карта` (`Gallery2/res/values-bg/strings.xml`, `show_on_map`). Round 5, confirmed.
- `menu.selection.undo`, `redo`: `Отмяна`, `Възстановяване`. Chromium (`ui_strings_bg.xtb`, `generated_resources_bg.xtb`: `&Възстановяване` for "&Redo"). Firefox has `Повторение` for Redo: both in use. Round 5, confirmed.
- `map.zoomIn`, `zoomOut`, `menu.view.toggleFullScreen`: `Увеличаване`, `Намаляване`, `Цял екран`: Firefox `menubar.ftl`. Round 5, confirmed.
- SmartScreen's buttons `Повече информация`, `Изпълни въпреки това`: Microsoft's page has both letter for letter («Изберете Повече информация > Изпълни въпреки това на екрана Windows защити вашия компютър»). Machine-translated, so confirmed weakly; this is the first page found for Bulgarian, and it replaces "NOT confirmed" of rounds 3 and 4 with "weakly".

### Russian (`ru`)

- SmartScreen's button `Выполнить в любом случае`: Microsoft's page agrees. The link stays `Подробнее` (round 3's article, which quotes the dialog). Round 5, confirmed.
- Photo Data Viewer's tab `Подробности`: Windows' Properties has `Подробно` (knowledge); the noun is the application's (`Показать подробности`). Both in use. Round 5, left.

### Ukrainian (`uk`)

- Photo Data Viewer's tabs `Загальні`, `Докладно`: the tabs of a file's Properties in Windows (knowledge). Round 5, confirmed.
- SmartScreen's button `Усе одно запустити`: still NOT settled. Microsoft's page has «Додаткові відомості > Запуск у будь-якому випадку», the translation engine's wording, which no page that quotes a screen has. Round 5.

### Greek (`el`)

- SmartScreen's button `Εκτέλεση οπωσδήποτε`: Microsoft's page, a human translation, has «Εκτελέστε οπωσδήποτε» and the title «Τα Windows προστάτεψαν τον υπολογιστή σας». `οπωσδήποτε`, not `ούτως ή άλλως`. Round 5, confirmed (two witnesses with round 4's).

### Turkish (`tr`)

- SmartScreen's button `Yine de çalıştır`: Microsoft's page agrees. The link stays `Ek bilgi` (round 3's user report of a screen; the page's `Daha fazla bilgi` is the engine's). Round 5, confirmed.

### Romanian (`ro`)

- SmartScreen's button `Executare oricum`: Microsoft's page has «Mai multe informații > Executare oricum». Two pages for it now (with round 4's), three for `Rulează oricum` / `rulați oricum`. Not settled; stays. Round 5.
- `menu.view.zoomIn`, `zoomOut`, `menu.selection.undo`, `redo`: `Mărește`, `Micșorează`, `Anulează acțiunea`, `Refă acțiunea`: Firefox's verbs (`Mărește`, `Micșorează`, `Anulează`, `Refă`); macOS has `Zoom înainte`, `Zoom înapoi`, `Infirmați`, `Refaceți`. `acțiunea` tells Undo from Cancel. Stay. Round 5, confirmed.

### Hebrew (`he`)

- `map.zoomIn`, `zoomOut` `התקרבות`, `התרחקות` beside `menu.view.zoomIn`, `zoomOut` `הגדלה`, `הקטנה`: two pairs for two things, both sourced (Firefox's View menu has the first, macOS the second). Do not make them one. Round 5, confirmed.

### Arabic (`ar`)

- Photo Data Viewer `about.developedBy`: `هذا التطبيق من تطوير Tomoyuki Aota.`, as `appInfo.developedBy` (`من تطوير …`) and the website's `landing.developedBy` (`… من تطوير …`). It was a verb in the past (`طوّر هذا التطبيق …`). Round 5, changed.
- `مستضافة على GitHub` (website) and `متاحة على GitHub` (Photo Data Viewer): left as in round 3; not the same case.
- SmartScreen's buttons `معلومات إضافية`, `تشغيل على أي حال`: still NOT confirmed; Microsoft's page is in English under `ar-sa`, and no other page was found in round 5.

## Round 6

### Every language of the group

- `settings.cache.usedNextTime`, "from the next time": all eight have "from" (`От следващия път`, `Со следующего раза`, `З наступного разу`, `Από την επόμενη φορά`, `Bir sonraki seferden itibaren`, `Începând de data viitoare`, `מהפעם הבאה`, `ابتداءً من المرة القادمة`), as the English and the Japanese (次回からは). Round 6 (`uk` changed; the others confirmed).
- The texts about what is collected, and the texts with a number or `{{appName}}`: read back and checked again, no finding. Round 6, confirmed.
- `sortByShootingTimeInfo.details.otherFiles` has neither "Also," nor "in the first place" in any of the eight; the sentence is a paragraph of its own, and seven languages of other groups leave "Also" out too. Left; do not change it in a round without a new reason.

### Ukrainian (`uk`)

- `settings.cache.usedNextTime`: `З наступного разу використовуватиметься кеш, і мініатюри не доведеться створювати знову.` It was `Наступного разу буде використано кеш …`, "next time", one occasion, where the English has "from the next time". Round 6, changed.
- SmartScreen's button `Усе одно запустити`: still NOT settled; nothing new found in round 6.

### Hebrew (`he`), Arabic (`ar`)

- `sortByShootingTimeInfo.details.modifiedTime` has no word for "as an alternative" (`ולכן נעשה בו שימוש כאשר DateTimeOriginal חסר`, `ولذلك يُستخدم عند غياب DateTimeOriginal`): what is used when the other is missing is the alternative. Left as equally good; do not change it in a round without a new reason.
- `ar`: SmartScreen's names `معلومات إضافية`, `تشغيل على أي حال`: still NOT confirmed. One page found, a README that says it is translated from English: «مزيد من المعلومات › التشغيل على أي حال» (https://github.com/jub0t/Concat/blob/HEAD/docs/README.ar.md). A translation, not a screen; it does not weigh against the text. Round 6.

### Bulgarian, Russian, Greek, Turkish, Romanian

- No change and no new term in round 6; every line above stands.

## Round 7

A source used in round 7, named below as "notes": installation notes that a speaker wrote about the SmartScreen warning ("click X, then Y"), found with GitHub's code search (`gh search code SmartScreen '"<the button's name>"'`). A file named `README.<code>.md` is usually a translation of an English README and weighs little; a note that also quotes the dialog's title weighs more.

### Every language of the group

- No text changed in round 7; the 24 files are as they were after round 6. Every line above stands.
- The texts about what is collected, and the texts with a number or `{{appName}}`: read back and checked again, no finding. Round 7, confirmed.
- The single words of the source that rounds 5 and 6 found missing in one language ("from the next time") were looked for on purpose in every long sentence ("always", "now", "shortly", "also", "all at once", "some", "most", "often", "approximate", "any", "anonymous"): each is there in all eight, except those that the lines above already record as left (`he`, `ar` "as an alternative"; "Also" and "in the first place"). Round 7, confirmed.
- `chart.showDateUnknownPhotos` in `el` (`Εμφάνιση στον χάρτη των φωτογραφιών …`) and `he` (`הצגה על המפה של תמונות …`): the place before the object, left as in round 5; the place has its own preposition and cannot be read as the object. Do not change it in a round without a new reason.

### Turkish (`tr`)

- SmartScreen's link and button: `Ek bilgi`, `Yine de çalıştır`. SETTLED: more than a dozen notes written in Turkish have exactly this pair, e.g. https://github.com/YusufX-sys/turkod-ide/blob/HEAD/README.md, https://github.com/agobrik/steam-lokalizasyon/blob/HEAD/KURULUM.md, https://github.com/orkono/orag/blob/HEAD/packaging/windows/README-Windows.txt (title «Windows bilgisayarınızı korudu»), https://github.com/akinalpfdn/Mqvi/blob/HEAD/client/src/components/help/content/tr/download-app.md (describes its picture of the dialog). This replaces "confirmed (weakly)" of round 3. Round 7, confirmed.

### Romanian (`ro`)

- SmartScreen's link `Mai multe informații`: read from a picture of a Romanian Windows (https://www.digitalcitizen.ro/wp-content/uploads/smartscreen-11.png). Round 7, confirmed.
- SmartScreen's button `Executare oricum`: stays. digitalcitizen.ro's «rulați oricum», which round 4 counted against it, is not a button: the article's pictures are of the red warning for a malicious file, where it is the end of a sentence («Ignorați avertismentul de malware Windows și rulați oricum») and the only button is `Nu se execută` (https://www.digitalcitizen.ro/wp-content/uploads/smartscreen-12.png). That button has Microsoft's verb `a executa`, which goes with `Executare oricum`. `Rulează oricum` is left with developers' notes only (round 3's two, and https://github.com/Silentnvm/Fisherman, https://github.com/GreenYRO/game-launcher-source). This overturns the count of round 4's line ("three pages for `Rulează oricum` / `rulați oricum`"): one of the three was not about this button. The blue warning itself is still not read from a screen. Round 7.

### Arabic (`ar`)

- SmartScreen's names `معلومات إضافية`, `تشغيل على أي حال`: confirmed weakly; this replaces "NOT confirmed" of rounds 3 to 6. Three notes have the text's link: https://github.com/TheSolar1/vex/blob/HEAD/src/login/notice_cloudsync.rs (title «قام Windows بحماية جهاز الكمبيوتر», both names letter for letter; its French and German are Windows' own names), https://github.com/ahmet3ddd/ArchivistPro/blob/HEAD/docs/INSTALL_BEGINNER_AR.md (`التشغيل على أي حال` for the button), https://github.com/abueid201224/thanawaya/blob/HEAD/README_WINDOWS.md (`تشغيل على أية حال`). The button is in about ten notes, with or without the article: settled. Against the link: five notes have `مزيد من المعلومات` and one `معلومات أكثر`, most of them translated READMEs, with three different titles of the dialog. Reopen the link only with a page or a picture that quotes an Arabic Windows. Round 7.

### Ukrainian (`uk`)

- SmartScreen's button `Усе одно запустити`: a third note with the text's pair, «"Докладніше" ("More info") … "Усе одно запустити" ("Run anyway")» (https://github.com/sanctum-sec/wic-krakow-2026/blob/HEAD/setup/ua/03-windows-admin.md); code search finds no note about SmartScreen with another wording. Three notes for it; still not read from a screen. Round 7.

### Bulgarian, Russian, Greek, Hebrew

- No change and no new term in round 7. `bg`, `el`: SmartScreen's names as round 5 left them (code search finds them only in one project's website translation, `DevTheDev189/Zircon`, which agrees with the texts).
