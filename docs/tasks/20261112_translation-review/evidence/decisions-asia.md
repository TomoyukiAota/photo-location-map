# Decision log: asia (`zh-Hans`, `zh-Hant`, `ko`, `th`, `vi`, `id`, `ms`, `hi`)

One line for each term or text that is settled by evidence. Append only; to overturn a line, add a line saying so and
why.

"macOS" is Apple's own text in the `.loctable` files of macOS 27.0.1, read on the owner's machine: TextEdit's
`Edit.loctable` (the application menu), the menus of Preview, Notes and Calculator, `AppKit.framework`'s
`MenuCommands.loctable` and `Common.loctable`, Preview's and Photos' `Localizable.loctable` and `IPXMain.loctable`,
and the Date & Time and Language & Region settings. To look a term up again:
`plistlib.load()` of a `.loctable` gives one dictionary per language (`zh_CN`, `zh_TW`, `ko`, `th`, `vi`, `id`, `ms`,
`hi`); a menu's file has no `en`, so match the key through `en_GB`.

Where the menu's items are shown (`src-main/menu/`): `menu.app.services`, `hide`, `hideOthers`, `showAll`, `quit` on
macOS only; `menu.app.about` on macOS and, under Help, on Windows and Linux; the rest of `menu.*` on all.

## All eight languages

| Key or term | Decision | Source | Round |
| --- | --- | --- | --- |
| `menu.app.services`, `hide`, `hideOthers`, `showAll`, `quit` | macOS's wording, as these items are shown on macOS only | macOS, TextEdit `Edit.loctable` | 3 |
| `welcome.usageInfoCollection`, Photo Data Viewer `about.usageData`: who collects | The subjectless forms (`ko`, `th`, `id`, `ms`, `hi`) and the Chinese `我们会收集` stand; `vi` has "the application collects" since the first pass | The owner's Japanese has no subject (`収集しています`); nothing untrue is said | 3 |
| `sortByShootingTimeInfo.details.otherFiles`: "Also," left out | Stands | The four details are separate `<p>` paragraphs (`dir-tree-view-sort-shooting-time-info.component.html`) | 3 |
| `autoUpdate.yes`, `autoUpdate.no` | Confirmed as they are | macOS, Preview `Localizable.loctable` ("Yes", "No") | 3 |
| Website `downloading.*`: SmartScreen's two buttons in `th`, `vi`, `id`, `ms`, `hi` | Not confirmed and not confirmable from the web (two rounds of searches found only pages with the English names); leave until read off a Windows in the language | — | 3 |

## Simplified Chinese (`zh-Hans`)

| Key or term | Decision | Source | Round |
| --- | --- | --- | --- |
| `language.restartToApply` | Changed to `为使所选语言生效，此应用将重新启动。` | 应用 stood as verb and noun in one sentence | 3 |
| `menu.app.*` | 关于 …, 服务, 隐藏 …, 隐藏其他, 全部显示, 退出 … confirmed | macOS, TextEdit `Edit.loctable` | 3 |
| `menu.selection.undo`, `redo` | 撤销, 重做 confirmed | macOS, TextEdit `Edit.loctable` | 3 |
| `menu.view.title` | `视图` stands (macOS `显示`; Chrome and Office `视图`): equally good | macOS `MenuCommands.loctable`; knowledge of Chrome | 3 |
| Thumbnail, Zoom, Actual Size, Filter, Show Details | 缩略图, 缩放, 实际大小, 筛选, 显示详细信息 confirmed | macOS, Preview and Photos | 3 |
| `…不可用。` in `photoInfo.unavailable`, Photo Data Viewer `map.locationNotAvailable`, `unsupportedFileDialog.message` | Stands | Stock wording of Windows for "unavailable"; only the table cell is `无` (first pass) | 3 |
| `12/24 小时制`, `24 小时制` | Confirmed | macOS, Date & Time (`24小时制`) | 3 |

## Traditional Chinese (`zh-Hant`)

| Key or term | Decision | Source | Round |
| --- | --- | --- | --- |
| `menu.app.*` | 關於 …, 服務, 隱藏 …, 隱藏其他, 顯示全部, 結束 … confirmed | macOS, TextEdit `Edit.loctable` | 3 |
| `menu.view.title`, `menu.help.title`, `menu.selection.undo` | `檢視`, `說明`, `復原` stand: Windows' words (macOS `顯示方式`, `輔助說明`, `還原`); the menu is shown on both | macOS; knowledge of Windows | 3 |
| Thumbnail | `縮圖` stands (Windows, Google; macOS `縮覽圖`) | macOS, Preview; knowledge of Windows | 3 |
| `sidebar.sort.ascending`, `descending` | `遞增`, `遞減` stand (Explorer; macOS `升冪排序`, `降冪排序`) | macOS, Photos; knowledge of Windows | 3 |
| `12/24 小時制`, `24 小時制` | Confirmed | macOS, Date & Time (`24小時制`) | 3 |

## Korean (`ko`)

| Key or term | Decision | Source | Round |
| --- | --- | --- | --- |
| "developed by" (`appInfo.developedBy`, website `landing.developedBy`, Photo Data Viewer `about.developedBy`) | `…가 개발했습니다` in all three; the website changed from `개발합니다` | Consistency of the three places | 3 |
| `menu.app.*` | …에 관하여, 서비스, … 가리기, 기타 가리기, 모두 보기, … 종료 confirmed | macOS, TextEdit `Edit.loctable` | 3 |
| `menu.selection.undo`, `redo` | `실행 취소` confirmed; `다시 실행` stands (Windows; macOS `실행 복귀`) | macOS; knowledge of Windows | 3 |
| Thumbnail, Zoom, Actual Size, sort order | 썸네일, 확대/축소, 실제 크기, 오름차순 / 내림차순 confirmed | macOS, Preview and Photos | 3 |
| `12/24시간제`, `24시간제` | Confirmed | macOS, Date & Time (`24시간제`) | 3 |

## Thai (`th`)

| Key or term | Decision | Source | Round |
| --- | --- | --- | --- |
| `menu.app.hideOthers` | Changed to `ซ่อนอื่นๆ` | macOS, TextEdit `Edit.loctable` ("Hide Others") | 3 |
| `menu.help.title` | Changed to `วิธีใช้` | macOS `MenuCommands.loctable` ("Help"); knowledge of Windows (Notepad, Office) | 3 |
| `menu.app.about`, `services`, `hide`, `showAll`, `quit` | เกี่ยวกับ …, บริการ, ซ่อน …, แสดงทั้งหมด, ออกจาก … confirmed | macOS, TextEdit `Edit.loctable` | 3 |
| `menu.view.title`, `menu.selection.title`, `menu.selection.undo`, `menu.view.actualSize` | มุมมอง, การเลือก, เลิกทำ, ขนาดจริง confirmed | macOS | 3 |
| `menu.selection.redo`, zoom in and out | `ทำซ้ำ`, `ขยาย`, `ย่อ` stand (Windows and Chrome; macOS `ทำกลับมาใหม่`, `ซูมเข้า`, `ซูมออก`) | macOS; knowledge of Windows and Chrome | 3 |
| Thumbnail | `ภาพขนาดย่อ` stands (Windows, Google; macOS `รูปย่อ`) | macOS, Preview; knowledge of Windows | 3 |
| `sidebar.openFolderToSeePhotos` | Changed to `เปิดโฟลเดอร์เพื่อดูตำแหน่งที่ถ่ายรูปภาพ` | รูปภาพถ่าย was misread as รูป + ภาพถ่าย; the website's summary has ตำแหน่งที่ถ่ายรูปภาพ | 3 |
| Photo Data Viewer `about.photoLocationMap` | Changed to `คุณสามารถใช้ <plmLink>Photo Location Map</plmLink> ได้` | สำหรับการนี้ is the register of official letters | 3 |
| `รูปแบบ 12 หรือ 24 ชั่วโมง` | Stands (second pass) | macOS names a format too: `เวลาแบบ 24 ชั่วโมง` | 3 |

## Vietnamese (`vi`)

| Key or term | Decision | Source | Round |
| --- | --- | --- | --- |
| `menu.app.hideOthers` | Changed to `Ẩn các mục khác` | macOS, TextEdit `Edit.loctable` ("Hide Others") | 3 |
| `menu.app.about`, `services`, `hide`, `showAll`, `quit` | Giới thiệu về …, Dịch vụ, Ẩn …, Hiển thị tất cả, Thoát … confirmed | macOS, TextEdit `Edit.loctable` | 3 |
| `menu.view.title`, `menu.help.title`, `menu.selection.*` | Xem, Trợ giúp, Lựa chọn, Hoàn tác, Làm lại confirmed | macOS | 3 |
| Thumbnail, Zoom, zoom in and out, sort order, Open With | hình thu nhỏ, Thu phóng, Phóng to / Thu nhỏ, Tăng dần / Giảm dần, Mở bằng confirmed | macOS, Preview and Photos | 3 |
| `menu.view.actualSize` | `Kích thước thực` stands (Chrome; macOS `Kích cỡ thực`) | macOS; knowledge of Chrome | 3 |
| `sortByShootingTimeInfo.moreDetails` | `Thêm chi tiết` stands (first pass); `Chi tiết thêm` is equally good | — | 3 |

## Indonesian (`id`)

| Key or term | Decision | Source | Round |
| --- | --- | --- | --- |
| `menu.app.quit` | Changed to `Tutup {{appName}}` | macOS: `Tutup TextEdit`, `Tutup Pratinjau`, `Tutup Catatan` | 3 |
| `menu.app.about` | `Tentang {{appName}}` stands: also shown on Windows and Linux, where `Tentang` is the word (macOS `Mengenai …`) | macOS; knowledge of Windows and Chrome | 3 |
| `menu.app.services`, `hide`, `hideOthers`, `showAll` | Layanan, Sembunyikan …, Sembunyikan lainnya, Tampilkan semua confirmed (macOS writes them in title case; the capital on the first word alone is a recorded choice) | macOS, TextEdit `Edit.loctable`; Photo Data Viewer `TERMS.md` | 3 |
| `menu.view.title`, `menu.help.title`, `menu.selection.title` | Lihat, Bantuan, Pilihan confirmed | macOS | 3 |
| `menu.selection.undo`, `redo`, `menu.view.actualSize`, sort order | `Urungkan`, `Ulangi`, `Ukuran sebenarnya`, `Menaik` / `Menurun` stand (Windows and Chrome; macOS `Urung`, `Ulang`, `Ukuran Asli`, `Ke Atas` / `Ke Bawah`) | macOS; knowledge of Windows and Chrome | 3 |
| Thumbnail, zoom in and out, Zoom, Filter, Open With | gambar mini, Perbesar / Perkecil, Zoom, Filter, Buka dengan confirmed | macOS, Preview and Photos | 3 |
| `Cara memasang`, `program pemasang` | Stand: `memasang` (Mozilla, Linux) and `menginstal` (Microsoft, Apple) are equally good | Knowledge of those products | 3 |

## Malay (`ms`)

| Key or term | Decision | Source | Round |
| --- | --- | --- | --- |
| "hosted on GitHub" (website `landing.sourceCode`, Photo Data Viewer `about.sourceCode`) | `dihoskan di GitHub` in both; the website changed from `tersedia di GitHub` | Consistency; `dihoskan` is "hosted" | 3 |
| `menu.app.*` | Perihal …, Perkhidmatan, Sembunyikan …, Sembunyikan lain, Tunjukkan semua, Keluar daripada … confirmed | macOS, TextEdit `Edit.loctable` | 3 |
| `menu.view.title`, `menu.help.title`, `menu.selection.*`, `menu.view.actualSize` | Paparan, Bantuan, Pilihan, Buat asal, Buat semula, Saiz sebenar confirmed | macOS | 3 |
| Zoom in and out, Zoom, sort order, Filter, Open With | Zum masuk / Zum keluar, Zum, Menaik / Menurun, Tapis, Buka dengan confirmed | macOS, Preview and Photos | 3 |
| Thumbnail | `lakaran kecil` stands (Windows, Google; macOS `imej kecil`) | macOS, Preview; knowledge of Windows | 3 |
| Settings | `Tetapan` stands (Windows, Android; macOS `Seting`) | macOS `MenuCommands.loctable`; knowledge of Windows | 3 |
| `Penjelajah Fail` (`settings.os.*`) | Not confirmed; found only on machine-translated pages | — | 3 |

## Hindi (`hi`)

| Key or term | Decision | Source | Round |
| --- | --- | --- | --- |
| Details | `विवरण` in both applications; the application's `ब्योरा दिखाएँ` and `ब्योरे के लिए` (two texts) changed | macOS: `विवरण दिखाएँ` (`AppKit` `Common.loctable`), `विवरण` (Photos); Photo Data Viewer already had it | 3 |
| `settings.cache.usedNextTime` | Changed to the future (`किया जाएगा`, `बनाए जाएँगे`) | अगली बार से needs the future; as the first pass's two corrections | 3 |
| "developed by" (website `landing.developedBy`) | Changed to `… ने विकसित किया है।`, the word of the application and Photo Data Viewer (`विकसित`) | Consistency; बनाया is "made" | 3 |
| `menu.app.about` | `{{appName}} के बारे में` stands: also shown on Windows and Linux (macOS `… परिचय`) | macOS; knowledge of Windows and Chrome | 3 |
| `menu.app.services`, `hide`, `hideOthers`, `showAll`, `quit` | सेवाएँ, … छिपाएँ, अन्य छिपाएँ, सभी दिखाएँ, … बंद करें confirmed | macOS, TextEdit `Edit.loctable` | 3 |
| `menu.view.title`, `menu.help.title`, `menu.selection.title`, `undo`, `menu.view.actualSize`, zoom in and out | दृश्य, सहायता, चयन, पहले जैसा करें, वास्तविक आकार, ज़ूम इन करें / ज़ूम आउट करें confirmed | macOS | 3 |
| Thumbnail, sort order | थंबनेल, आरोही / अवरोही confirmed | macOS, Preview and Photos | 3 |
| `12 या 24 घंटे का फ़ॉर्मैट` | Stands (second pass) | macOS names a format too: `24 घंटों वाला समय फ़ॉर्मैट` | 3 |

## Round 4 (appended; the lines above stand)

Sources added in this round: Android's own translations of its Settings application
(`android.googlesource.com/platform/packages/apps/Settings`, `res/values-<code>/strings.xml`; Indonesian is `in`);
macOS Calendar's `Localizable.loctable` (Day, Week, Month, Year); installation notes of small projects in the
language, which quote the SmartScreen buttons as their Windows shows them (found by a web search in "extended" mode).

| Language | Key or term | Decision | Source | Round |
| --- | --- | --- | --- | --- |
| `ko` | "hosted on GitHub" (website `landing.sourceCode`, Photo Data Viewer `about.sourceCode`) | `GitHub에 공개되어 있습니다` in both; Photo Data Viewer changed from `GitHub에 있습니다` | Consistency; the owner's Japanese has `公開しています` in both | 4 |
| `id` | `settings.tabs.os` | Changed to `Sistem Operasi`: a capital on each word of a tab | `Tanggal & Waktu` in the same row, Photo Data Viewer's `Data Mentah`, the recorded choice of Photo Data Viewer's `TERMS.md` for the tabs | 4 |
| `ms` | `settings.tabs.os` | Changed to `Sistem Pengendalian`: a capital on each word of a tab | `Tarikh & Masa` in the same row, Photo Data Viewer's `Data Mentah`, the recorded choice of Photo Data Viewer's `TERMS.md` for the tabs | 4 |
| `vi` | Website `downloading.*`: SmartScreen's two buttons | `Thông tin thêm`, `Vẫn chạy` confirmed (this overturns "not confirmable from the web" of round 3 for `vi`) | Three unrelated projects' notes quote them, one with the title `Windows đã bảo vệ PC của bạn`: `github.com/quangtu07/innote`, `github.com/dangdvd/DVDDocs/releases/tag/v0.2.0`, `github.com/ngovietdinh/trolyvanban/releases/tag/v2.50.3` | 4 |
| `id` | Website `downloading.*`: SmartScreen's two buttons | `Info selengkapnya`, `Tetap jalankan` confirmed (this overturns "not confirmable from the web" of round 3 for `id`) | Two unrelated projects' notes quote them with the title `Windows melindungi PC Anda`: `github.com/taufansuryac-bit/REKAPIN-RELEASES`, `github.com/bapelindo/ai-interview-helper/releases/tag/2.1.0` | 4 |
| `th`, `ms`, `hi` | Website `downloading.*`: SmartScreen's two buttons | Still not confirmed; seven more searches found no page that quotes them (Thai: a machine-translated article only) | — | 4 |
| `ms` | `Penjelajah Fail` (`settings.os.*`) | Still not confirmed; Microsoft's support site answers in English under `ms-my` | — | 4 |
| `th`, `vi`, `id`, `ms`, `hi` | `settings.dateTime.clockSystem`: a label that names a format | Confirmed | Android Settings: `ใช้รูปแบบ 24 ชั่วโมง`, `Sử dụng định dạng 24 giờ`, `Gunakan format 24 jam` (`id`, `ms`), `24 घंटे वाले फ़ॉर्मैट का इस्तेमाल करें`; with macOS (round 3) | 4 |
| `th`, `vi`, `id`, `ms`, `hi` | `settings.dateTime.clock12`, `clock24` (`12 ชั่วโมง`, `12 giờ`, `12 jam`, `12 घंटे`) | Stand: the languages have no form apart for "12-hour"; clear under a label that names the format | As French `12 heures`, Spanish `12 horas`, Italian `12 ore` of the other groups | 4 |
| All eight | `chart.units.year`, `month`, `day` | Confirmed, Korean `년` (not `연`) among them | macOS Calendar's buttons Day, Week, Month, Year | 4 |
| `hi` | `explorerContextMenu.openWith` | `{{appName}} से खोलें` confirmed | macOS `MenuCommands.loctable`: `इससे खोलें` | 4 |
| `ms` | Remove (`Buang` in `settings.os.*`, `map.removeRegion`; Photo Data Viewer `iosNote` has `mengalih keluar`) | Stands: macOS `Keluarkan`, Windows and Google `Alih keluar`, Firefox `Buang` are all in use, and the two places do not speak of the same action | macOS; knowledge of Windows, Google and Firefox | 4 |
| `th` | Remove | `นำออก` stands (Windows, Google; macOS `เอาออก`) | macOS; knowledge of Windows and Google | 4 |
| `zh-Hans`, `id`, `ms` | "often" in `sortByShootingTimeInfo.details.modifiedTime` (`通常`, `biasanya`; also `zh-Hant` `通常`) | Stands: "usually" for "often", a difference of degree; the Japanese has `ことが多い` | — | 4 |
| `vi` | `settings.cache.usedNextTime` (`không được tạo lại`) | Stands: read as a passive beside `sẽ được dùng`; `không cần tạo lại` is equally good | — | 4 |
| `zh-Hant` | "hosted on GitHub" (`託管在 GitHub 上` on the website, `託管於 GitHub` in Photo Data Viewer) | Stands: one word, two prepositions of the same meaning | — | 4 |

## Round 5 (appended; the lines above stand, except where a line here says that it overturns one)

Sources added in this round, all readable with `curl`: Chromium's translations
(`chromium.googlesource.com/chromium/src/+/main/chrome/app/resources/generated_resources_<code>.xtb?format=TEXT`,
base64; a message has the same number in every language: "View" is `3825512074963838982` in the menu bar of macOS and
`4850886885716139402` elsewhere); Firefox's menu (`raw.githubusercontent.com/mozilla-l10n/firefox-l10n/main/<code>/browser/browser/menubar.ftl`);
Microsoft's support pages in the language (`support.microsoft.com/<locale>/windows/file-explorer-in-windows-ef370130-1cca-9dc5-e0df-2f7416fe1cb1`
and `…/keyboard-shortcuts-in-windows-dcc61a57-8ff0-cffe-9796-cb9706c75eec`), which exist in `zh-cn`, `zh-tw`,
`ko-kr`, `th-th`, `vi-vn`, `id-id` and not in `hi-in` or `ms-my`; Android's `DocumentsUI` and framework strings.

| Language | Key or term | Decision | Source | Round |
| --- | --- | --- | --- | --- |
| `zh-Hans` | `menu.view.title` | Changed to `查看`. **This overturns the line of round 3** (`视图` stands, "Chrome and Office `视图`"): Chrome does not have `视图` | Microsoft's page on Explorer (`请选择功能区上的“查看”`); Firefox `menu-view`: `查看`; Chromium: `查看` (outside macOS), `显示` (macOS), no message `视图`; the file's own verb (`查看数据`); `zh-Hant` has the same three products' `檢視` | 5 |
| `th` | The repetition mark `ๆ` | Written without a space before it, in all three places; Photo Data Viewer `about.keptInBrowser` changed from `ใด ๆ` to `ใดๆ` | Android Settings: 197 without, 1 with (`ใดๆ` 17, `ใด ๆ` 0); Microsoft's page of keyboard shortcuts: 24 without, 2 with; macOS `ซ่อนอื่นๆ` (the application's `menu.app.hideOthers`). Firefox and the Royal Society's rule have the space | 5 |
| `th`, `vi`, `ko`, `zh-Hans`, `zh-Hant` | Explorer's name (`settings.os.*`) | `File Explorer` (`th`, `vi`), `파일 탐색기`, `文件资源管理器`, `檔案總管` confirmed (`id` since the first pass) | The titles of Microsoft's page "File Explorer in Windows" in each language | 5 |
| `hi` | Explorer's name, `फ़ाइल एक्सप्लोरर` (`settings.os.*`) | Not confirmed and not confirmable from Microsoft's site, which has no Hindi pages; as Malay `Penjelajah Fail` | — | 5 |
| `ms` | `Penjelajah Fail` | Still not confirmed; Microsoft's site has no Malay pages (three tried), and one more search found nothing | — | 5 |
| `th`, `ms`, `hi` | Website `downloading.*`: SmartScreen's two buttons | Still not confirmed; four more searches (Thai: the machine-translated article of round 4 only) | — | 5 |
| `th`, `id`, `ko` | The menu of a right-click (`settings.os.*`) | `เมนูบริบท`, `menu konteks`, `컨텍스트 메뉴` confirmed (Korean beside the more frequent `상황에 맞는 메뉴`) | Microsoft's pages on Explorer and on keyboard shortcuts | 5 |
| `zh-Hans`, `zh-Hant` | The menu of a right-click (`右键菜单`, `右鍵選單`) | Stand: the plain word, fit for an application for non-experts; Microsoft's pages have `上下文菜单` and `操作功能表` | Microsoft's pages; knowledge of utilities that add to that menu | 5 |
| `id`, `th`, `vi`, `hi`, `ms`, `ko`, `zh-Hans`, `zh-Hant` | The menu words that round 3 gave "from knowledge of Chrome" (`Ukuran sebenarnya`, `Urungkan`, `ขยาย`, `ย่อ`, `ทำซ้ำ`, `วิธีใช้`, `Kích thước thực`, `वास्तविक आकार`, `फिर से करें`, `Saiz sebenar`, `실제 크기`, `撤销`, `重做`, `復原`, `說明`, `檢視`, Reload in all but Korean and Hindi) | Confirmed | Chromium's `.xtb` files | 5 |
| `th`, `id`, `zh-Hant`, `ko` | Undo, Redo, full screen "from knowledge of Windows" (`เลิกทำ`, `ทำซ้ำ`, `เต็มหน้าจอ`; `Ulangi`, `layar penuh`; `復原`, `重做`, `全螢幕`; `실행 취소`, `다시 실행`, `전체 화면`) | Confirmed | Microsoft's page of keyboard shortcuts | 5 |
| `zh-Hant`, `ko`, `th`, `vi`, `id`, `ms`, `hi` | `menu.view.title` | `檢視` (Windows, Firefox, Chromium), `보기`, `มุมมอง`, `Xem`, `Lihat`, `Paparan`, `दृश्य` stand: each is macOS's or Chromium's word (Chromium outside macOS has `ดู`, `Lihat` for Malay, `देखें`) | Chromium; macOS (round 3) | 5 |
| All eight | `photoInfo.moreOptions`, `chart.moreAlt` | Confirmed (`更多选项`, `更多選項`, `추가 옵션`, `ตัวเลือกเพิ่มเติม`, `Tùy chọn khác`, `Opsi lainnya`, `Lagi pilihan`, `ज़्यादा विकल्प`; `เพิ่มเติม`, `Lainnya`, `Lagi`) | macOS, Photos `Localizable.loctable` ("More Options"); Android's framework (`action_menu_overflow_description`, `more_item_label`) | 5 |
| `id` | `sidebar.sort.ascending`, `descending` | `Menaik`, `Menurun` stand; Android's file manager has `Naik`, `Turun`, macOS `Ke Atas`, `Ke Bawah`: all in use, and Explorer's words are not on Microsoft's pages | Android `DocumentsUI`; macOS; knowledge of Windows | 5 |
| `th` | `sidebar.sort.ascending`, `descending` | `น้อยไปมาก`, `มากไปน้อย` stand: Android has the same with `จาก` before them | Android `DocumentsUI` | 5 |
| `hi` | `sidebar.sort.ascending`, `descending` | `आरोही`, `अवरोही` stand (macOS, round 3); Android has `बढ़ते क्रम में`, `घटते क्रम में` | Android `DocumentsUI` | 5 |
| `ko` | Reload (`새로 고침`) | Stands: Chromium writes `새로고침`, Windows and Edge the spaced form | Chromium; knowledge of Windows | 5 |
| `vi` | Website `downloading.step2`: `Cửa sổ … sẽ xuất hiện` for "popup will appear" | Stands: says the same; `cửa sổ bật lên` is the word for a popup | — | 5 |
| `th`, `vi`, `id`, `ms`, `hi` | `settings.dateTime.clock12`, `clock24` | Stand, as in round 4: the form of `fr`, `es`, `it`, `pt-BR`, `tr`, `ar` in the other groups' files | The other groups' files | 5 |

## Round 6 (appended; the lines above stand, except where a line here says that it overturns one)

Sources added in this round: Chromium's `.xtb` files looked up by the English text (the method in `sources.md`), with counts of two competing wordings over `generated_resources`, `components_strings`, `ui_strings` and
`ui_chromeos_strings`; an index of 77,841 of Apple's texts on the owner's machine (the `.loctable` files of AppKit,
Finder, Photos, Preview, TextEdit, Notes, System Settings and its extensions), looked up by the English text and
counted the same way; Android's Settings and framework strings and Firefox's `.ftl` files for Malay and Thai. A
count is written "for : against".

| Language | Key or term | Decision | Source | Round |
| --- | --- | --- | --- | --- |
| `th` | A file's path (`photoInfo.pathTooLong`, `generatedThumbnailPathTooLong`) | Changed from `พาธ` to `เส้นทาง`, three times in each text. This settles what round 4's report left as "both are in use" | macOS 44 : 0 (`เส้นทาง`, `คัดลอกเป็นชื่อเส้นทาง`); Chromium 32 : 0 (`เส้นทางยาวเกินไป` for "Path too long"); Firefox 11 : 0; Android Settings 3 : 0; Microsoft's Thai page on File Explorer (`เส้นทางโฟลเดอร์`) | 6 |
| `zh-Hans`, `zh-Hant`, `ko`, `vi`, `id`, `ms`, `hi` | A file's path | `路径`, `路徑`, `경로`, `đường dẫn`, `jalur`, `laluan`, `पाथ` confirmed | Chromium ("Path", "Path too long"); macOS ("Path") | 6 |
| All eight | Photo Data Viewer `photoData.general.dateTaken` | Confirmed to the letter (`拍摄日期`, `拍攝日期`, `촬영 날짜`, `วันที่ถ่าย`, `Ngày chụp`, `Tanggal diambil`, `Tarikh diambil`, `फ़ोटो लेने की तारीख`) | Chromium ("Date taken") | 6 |
| `zh-Hans`, `zh-Hant`, `th`, `vi`, `id`, `ms`, `hi`, `ko` | `thumbnailGeneration.showDetails` | Confirmed | Chromium ("Show details"); with macOS (round 3) | 6 |
| `zh-Hans`, `th`, `id`, `hi` | `sortByShootingTimeInfo.moreDetails` (`更多详情`, `รายละเอียดเพิ่มเติม`, `Detail selengkapnya`, `ज़्यादा जानकारी`) | Confirmed to the letter | Chromium ("More details") | 6 |
| `vi` | `chart.moreAlt` (`Xem thêm`) | Confirmed | Chromium ("More") | 6 |
| `ms` | `language.systemLanguage.*`, Photo Data Viewer `language.useBrowserSetting` (`Guna tetapan …`) | Stands: both forms of the command are in the software; `Gunakan` is the more frequent and the more formal | `Gunakan` : `Guna` is 170 : 2 in Android, 85 : 0 in Chromium, 317 : 38 in macOS (`Gunakan Bahasa Sistem`; `Guna Suara Sistem` and `Gunakan Suara Sistem` for one English text), 4 : 10 in Firefox (`Guna aplikasi lalai macOS`) | 6 |
| `ms` | `chart.resetZoom` (`Set semula` / `zum`) | Stands | Firefox: `Set semula paras zum`; Android and Chromium have `Tetapkan semula`, macOS `Reset` | 6 |
| `ms` | Thumbnail (`lakaran kecil`) | Stands, as in round 3 | Chromium: `lakaran kecil` 3, `lakaran kenit` 2; macOS `imej kecil` | 6 |
| `ms` | `menu.view.toggleFullScreen` (`Togol skrin penuh`) | Confirmed | Chromium: `togol` in four texts | 6 |
| `ms`, `ko`, `th`, `vi`, `id`, `zh-Hans`, `zh-Hant` | Appearance (`Penampilan`, `모양`, `ลักษณะที่ปรากฏ`, `Giao diện`, `Tampilan`, `外观`, `外觀`) | Confirmed | macOS (`Penampilan`, `모양` beside `화면 모드`, `Giao diện`, `Tampilan`, `外观`, `外觀`); Chromium (`ลักษณะที่ปรากฏ`) | 6 |
| `hi` | Appearance (`दिखावट`) | Stands: no word is the established one | macOS `प्रकटन` 85, `दिखावट` 3; Chromium `दिखने का तरीका` | 6 |
| `hi` | Version (`संस्करण`) | Stands: macOS's word; Google has `वर्शन` | macOS ("Version"); Chromium 63 : 0 for `वर्शन` | 6 |
| `hi` | "menu" (`मेन्यू`) | Confirmed | macOS and Chromium ("Menu") | 6 |
| `zh-Hant` | A photo (`照片`, 23 texts) | Stands: Apple's word; Google and Windows have `相片`; both are everyday words in Taiwan | macOS 3,487 : 12 for `照片`; Chromium 26 : 0 for `相片`; knowledge of Windows' Photos | 6 |
| `zh-Hant` | `menu.help.showWelcomeDialog` (`對話框`) | Stands: Apple's word; Google and Microsoft have `對話方塊`; the menu is shown on both systems | macOS; Chromium 20 : 0 for `對話方塊` | 6 |
| `zh-Hant` | Details: `詳細資料` (Photo Data Viewer's tab) beside `詳細資訊` (the application's "Show Details", "For details") | Stands: not an inconsistency | Chromium has the same pair: `詳細資料` ("Details"), `顯示詳細資訊` ("Show details") | 6 |
| `th` | Developer Tools (`เครื่องมือสำหรับนักพัฒนา`) | Stands: between Chromium's `เครื่องมือสำหรับนักพัฒนาซอฟต์แวร์` and macOS's `เครื่องมือนักพัฒนา` | Chromium; macOS | 6 |
| `th`, `ms`, `hi` | Website `downloading.*`: SmartScreen's two buttons | Still not confirmed. The page of Microsoft Learn that names them (`…/power-automate/desktop-flows/dynamics365-cs-rpa`) is machine-translated in these languages and wrong where the names are known (`vi`, `id`): no evidence | Four more searches; the page's `ms.translationtype` | 6 |
| `ms`, `hi` | Explorer's name (`Penjelajah Fail`, `फ़ाइल एक्सप्लोरर`) | Still not confirmed; Chromium leaves `File Explorer` in English in both, and Windows Terminal's repository has neither language | Two more searches | 6 |

## Round 7 (appended; the lines above stand)

No text was changed in this round. Sources added: Android's Settings application in all eight languages, looked up
by a regular expression on the English text (it has "location data" and "location information" in two texts); and,
as a check on a count that is all on one side in Apple's and Google's texts, applications that neither translated:
VLC (`videolan/vlc`, `po/<code>.po`), GIMP and GNOME Files (`gitlab.gnome.org/GNOME/…`, `po/<code>.po`), LibreOffice
Calc (`LibreOffice/translations`, `source/<code>/sc/messages.po`) and Firefox's `.ftl` files. Before a wording is
changed on a count, look at the English of the texts counted, and at one such application. A count is written "the
file's wording : the other".

| Language | Key or term | Decision | Source | Round |
| --- | --- | --- | --- | --- |
| `zh-Hans`, `zh-Hant`, `vi`, `id`, `ms`, `th` | "Location data" (`位置数据`, `位置資料`, `dữ liệu vị trí`, `data lokasi`, `ข้อมูลตำแหน่ง`; five texts per language) | Confirmed to the letter as the wording of "location data" | Android Settings, `app_data_sharing_updates_summary` ("your location data"), beside `restriction_location_enable_summary` ("your location information": `位置信息`, `位置資訊`, `thông tin vị trí`, `informasi lokasi`, `maklumat lokasi`) | 7 |
| `zh-Hans`, `zh-Hant` | `位置数据` / `位置資料` beside `位置信息` / `位置資訊` | Stand: Apple and Chromium have only the second (0 : 12 and 0 : 39; 0 : 11 and 0 : 33), but their English is "location" or "location info" in each of those texts; the files translate "location data", beside `EXIF 数据` | macOS; Chromium; Android Settings | 7 |
| `ko`, `hi` | "Location data" (`위치 정보`, `जगह की जानकारी`) | Stand: the wording of "location information", the everyday term in both, as the owner's Japanese has `位置情報` | Apple 12 and Chromium 8 for `위치 정보`, none for `위치 데이터`; Chromium 39 for `जगह की जानकारी`; Android Settings | 7 |
| `zh-Hant` | `sidebar.sort.ascending`, `descending` (`遞增`, `遞減`) | Confirmed. This settles what rounds 3 to 6 left as "from knowledge of Windows" | Chromium 5 texts (ChromeOS's file manager: `檔案清單已依{COLUMN_NAME}遞增排序。`); Android Settings 2; VLC ("Ascending": `遞增`); GNOME Files (`原始名稱（遞增）`); `升冪` in one text of macOS only | 7 |
| `id` | `sidebar.sort.ascending`, `descending` (`Menaik`, `Menurun`) | Stand, now with a source: one of three wordings in use (Android and GNOME Files `Naik` / `Turun`, macOS `Ke Atas` / `Ke Bawah`) | LibreOffice Calc: `Urutan Menaik` ("Ascending Order"), `Urutan Menurun` ("Descending Order") | 7 |
| `ko` | Loading (`불러오는 중...` and the forms of `불러오다`, twelve texts) | Stands: the systems and browsers have `로드` (`불러오` : `로드` is 3 : 630 in macOS, 0 : 374 in Chromium, 0 : 21 in Android Settings, 0 : 86 in Firefox), but the file's is the Korean verb, in use in applications of the same kind | GIMP 12 : 0 (`미리 보기 불러오는 중...`); VLC 10 : 26 (`Flowplayer 불러오는 중...`); macOS `이미지 불러오기` ("Load image") | 7 |
| `zh-Hans` | `loadedFiles.total` (`合计`) | Stands: the word for the sum of the items listed before it (`JPEG: 3 / HEIF: 1 / 合计: 4`); the bare "Total" is `总计` in the software (0 : 2 macOS, 0 : 1 Chromium, 0 : 2 Android Settings, 0 : 5 VLC). A speaker may prefer `总计` | macOS; Chromium; Android Settings; VLC | 7 |
| `zh-Hant`, `ko`, `th`, `vi`, `id`, `ms`, `hi` | `loadedFiles.total` (`總計`, `합계`, `รวม`, `Tổng`, `Total`, `Jumlah`, `कुल`) | Confirmed | macOS and Chromium ("Total") | 7 |
| `hi` | `menu.help.advancedMenu` (`उन्नत मेन्यू`) | Stands: four words in use and none established (Apple `एडवांस` 107, Google `ऐडवांस`, VLC `उन्नत` 13 beside `विस्तृत`, GIMP `विस्तृत`) | macOS; Chromium; Android Settings; VLC; GIMP | 7 |
| `zh-Hans`, `zh-Hant`, `ko`, `th`, `vi`, `id` | Home page (`主页`, `首頁`, `홈페이지`, `หน้าแรก`, `Trang chủ`, `Beranda`) | Confirmed | Chromium ("Homepage") | 7 |
| `ms` | Home page (`laman utama`) | Confirmed, beside Chromium's `halaman utama` (9) | Apple 3, Chromium 11, Android Settings 2 | 7 |
| All eight | Source code (`源代码`, `原始碼`, `소스 코드`, `ซอร์สโค้ด`, `Mã nguồn`, `Kode sumber`, `Kod sumber`, `सोर्स कोड`) | Confirmed | macOS ("Source code") | 7 |
| `zh-Hant` | Loading (`正在載入`) | Confirmed: the more frequent of two forms | Apple 47 : 34, Chromium 9 : 4 against `載入中` | 7 |
| `ko` | Format (`날짜 형식`, `파일 형식`) | Stands: Google's word (Chromium `파일 형식` 9, `형식` 39); Apple has `포맷` (281) | Chromium; macOS | 7 |
| `vi` | Tone marks | The older placement throughout (`Xóa`, `Hủy`, `Tùy`), Apple's and Microsoft's; none of the newer (`Xoá`) | The three files; macOS | 7 |
| `ko` | "latitude and longitude" (`위도와 경도` on the website, `위도 및 경도` in Photo Data Viewer) | Stands: two conjunctions of the same meaning, as `zh-Hant` `託管在` / `託管於` (round 4) | — | 7 |
| `vi`, `id`, `ms` | "fetches" (`đọc`, `membaca` on the website; `lấy`, `mengambil` in Photo Data Viewer `about.keptInBrowser`) | Stand: both say what happens; not the same sentence | — | 7 |
| `th`, `ms`, `hi` | Website `downloading.*`: SmartScreen's two buttons | Still not confirmed; three more searches by the pair of buttons and the warning's title | — | 7 |
