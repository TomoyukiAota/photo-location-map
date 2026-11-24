# The size of the thumbnails, chosen by the user: status

Investigated and proposed on 2026-11-23; the owner chose the design on 2026-11-24, and it was implemented then ("What
the owner chose" and "What was built", at the end).

## What was asked

The user can change the size of the thumbnails: a smaller one where they want the application faster, a larger one
where they accept that it is slower.

## Where thumbnails are shown, and from what

Every place is the same component, `PhotoInfoViewerComponent`, with a box of its own size
(`photo-info-viewer.component.scss`). The image fits within the box (`max-width` and `max-height` of 100%) and is not
enlarged beyond its own size.

| Place | Box (CSS pixels) | Notes |
| --- | --- | --- |
| A row of the folder tree | 200 x 200 | a row 237 pixels high: 3 rows in a sidebar of 669 pixels |
| A marker's popup | 200 x 200 | |
| A cluster's popup: its tiles | 100 x 100 | three in a row |
| A cluster's popup: the chosen photo | 200 x 200 | the layout of a marker's popup |
| Photo Data Viewer | – | not a thumbnail: a window of its own, whose page is a project of its own and shows the photo itself |

What is behind the image, by the kind of photo:

| Photo | Image | Shown in a box of 200 | Made |
| --- | --- | --- | --- |
| A photo with a thumbnail in its EXIF data: a JPEG as cameras and iPhones write it, or a TIFF | 160 x 120 (every JPEG among the fixtures) | 160 x 120: its own size, smaller than the others, and stretched to twice on a screen of 2 device pixels per CSS pixel | not made: read with the EXIF data, kept as a Blob with an orientation tag (`oriented-jpeg.ts`) |
| JPEG or PNG without one | 400 on the longer side | 200 x 150 | by the page (`ImageDecoder`), kept in the cache (`JpegPngThumbnailService`) |
| HEIF, High quality (the default) | 400 on the longer side | 200 x 150 | by the page where it decodes HEVC, kept for the folder; else by the main process, which keeps it in the cache (`HeifThumbnailService`) |
| HEIF, Fast | the thumbnail item that the file holds: 320 x 240 for an iPhone's photo of 12 megapixels, 416 x 312 for 24, 576 x 432 for 48 | 200 x 150 | decoded by the page, or by libheif in the main process |
| JPEG or PNG that the page cannot make a thumbnail of, or whose EXIF thumbnail does not decode | the photo itself | 200 x 150 | – |
| TIFF without an EXIF thumbnail | the image that says that there is none | | |

The size of a made thumbnail is written in four places: `thumbnailLongerSide` (400,
`src/app/jpeg-png-thumbnail/jpeg-png-image-decoding.ts`), `wholeImageThumbnailLongerSide` (400,
`src/app/heif-thumbnail/heif-image-decoding.ts`), `resize-and-encode.ts` (200 x 2, the main process), and the choice of
the HEIF thumbnail item (at least 320, `src-main/heif/heif-file.ts`). The search for faces reads a HEIF photo through its
thumbnail, so the size of that one changes what the search finds in HEIF photos.

## What a size costs to make

macOS 27 on an Apple M5 (10 cores, 32 GB), Electron 45.3.2 (Chromium 156), a hidden window. **The computer was busy
with other sessions' work throughout this investigation (load average 11–32 on 10 cores; 21–28 for this section)**,
so the times below are about twice what a quiet computer takes (25 ms for a JPEG of 12 megapixels at 400 pixels in
`docs/tasks/20261121_full-file-thumbnails/STATUS.md`); the shortest of each case is given too, which is closer to a
quiet computer's. Photos: the public
fixtures (`IMG_4676.JPG`, 12 megapixels; `IMG_1579.JPG`, 8), a 48-megapixel JPEG and a PNG made from the first with
`sips`, `test/e2e/fixtures/demo.heic` (12 megapixels) and a 48-megapixel HEIC made with `sips`.

One thumbnail with the steps that the app takes, the longer side as a parameter (median of 7, after 2 warm-ups;
shortest in brackets; the JPEG's size):

| Longer side | JPEG 8 MP | JPEG 12 MP | JPEG 48 MP | PNG 12 MP | HEIF 12 MP, in the page | HEIF 48 MP, in the page |
| --- | --- | --- | --- | --- | --- | --- |
| 160 | 39 ms (25), 9 KB | 55 ms (28), 10 KB | 179 ms (82), 10 KB | 244 ms (127), 10 KB | 45 ms (30), 8 KB | 58 ms (32), 12 KB |
| 200 | 40 ms (32), 13 KB | 54 ms (30), 15 KB | 175 ms (83), 15 KB | 242 ms (120), 15 KB | 43 ms (21), 12 KB | 62 ms (29), 18 KB |
| 300 | 40 ms (24), 28 KB | 52 ms (29), 32 KB | 180 ms (83), 32 KB | 242 ms (117), 32 KB | 45 ms (28), 23 KB | 61 ms (32), 36 KB |
| **400 (today)** | 46 ms (26), 43 KB | 57 ms (30), 52 KB | 187 ms (84), 52 KB | 243 ms (116), 52 KB | 45 ms (20), 36 KB | 63 ms (35), 61 KB |
| 600 | 55 ms (31), 88 KB | 69 ms (35), 117 KB | 193 ms (86), 116 KB | 251 ms (122), 116 KB | 47 ms (22), 73 KB | 61 ms (34), 127 KB |
| 800 | 59 ms (33), 144 KB | 84 ms (43), 204 KB | 185 ms (87), 186 KB | 243 ms (126), 186 KB | 50 ms (24), 119 KB | 64 ms (36), 210 KB |
| 1200 | 109 ms (51), 301 KB | 117 ms (62), 383 KB | 228 ms (106), 413 KB | 272 ms (138), 417 KB | 54 ms (26), 248 KB | 69 ms (37), 429 KB |

- JPEG/PNG: `ImageDecoder` at twice the size, an `OffscreenCanvas`, a JPEG of quality 0.92
  (`jpeg-png-image-decoding.ts`). HEIF: the tiles read by the app's own `readWholeImage()`, decoded with `VideoDecoder`
  and drawn small as `decodeWholeImage()` does.
- **The time hardly depends on the size up to 800 pixels**: decoding the photo takes most of it, and is the same
  whatever the thumbnail's size. A JPEG is decoded at an eighth of its size at the smallest (504 x 378 for 12
  megapixels, from 160 to 400 pixels; 1,008 x 756 at 600; 1,512 x 1,134 at 800), a PNG and a HEIF image whole.
- **The bytes grow with the area**: from 400 to 600 pixels 2.2 times, to 800 about 4 times; to 200, 0.3 times.

The main process, which makes a HEIF thumbnail where the page cannot decode HEVC (heic-decode, Jimp, jpeg-js; 12
megapixels, median of 5, load average 28): decoding 917 ms whatever the size, then resizing and encoding 308 ms at 200
pixels (10 KB), 346 ms at 400 (31 KB), 521 ms at 800 (111 KB). A larger size adds about 14% at 800.

## What a size costs in the app: a folder of 2,000 photos

The production build of main at 932279b5, with one local change that was reverted afterwards: the longer side of the
thumbnails that `JpegPngThumbnailService` makes read from a global variable that the harness set (400 when unset). The
box of the tree's thumbnail was set with a style sheet that the harness added to the page, the image filling the box
(`object-fit: contain`), and "today" is the app's own styles. 2,000 APFS clones of `IMG_4676.JPG` (12 megapixels) with
its EXIF thumbnail, or of the same photo without it (`exiftool -IFD1:all=`), so that the app makes its thumbnails. One
trial of each, in this order, the load average at its start in brackets; a launch for the photos with EXIF
thumbnails, and for the others a launch that makes the thumbnails (cold) and a second one on the same profile, with
them in the cache (warm). The harness is based on `test/performance/tree-rows.mjs`, with Electron's `--no-sandbox`
for this Mac's stuck `backupd` (see the local e2e notes of 2026-11-23), and scrolls through all the rows at 150 pixels
a frame:

| Box, image | Rows in view (row height) | Open, warm | All 2,000 made, cold | Cache | Scroll through 2,000 rows | Frames over 50 ms | The page's memory, open → scrolled through | All processes, scrolled through |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Today, EXIF 160 x 120 at its own size (14) | 3 (237 px) | 1.9 s | – | – | 58 s | 9 | 372 → 545 MB | 829 MB |
| 100, EXIF 160 x 120 (14) | 5 (142 px) | 2.3 s | – | – | 44 s | 49 | 299 → 506 MB | 787 MB |
| 300, EXIF 160 x 120 stretched (22) | 2 (342 px) | 1.7 s | – | – | 97 s | 71 | 278 → 493 MB | 739 MB |
| Today, made 400 (26) | 3 (237 px) | 1.6 s | 138 s | 102 MB, 52 KB each | 61 s | 24 | 256 → 560 MB | 842 MB |
| 100, made 200 (15) | 5 (142 px) | 1.4 s | 140 s | 29 MB, 15 KB each | 38 s | 11 | 297 → 533 MB | 853 MB |
| 300, made 600 (11) | 2 (342 px) | 2.0 s | 151 s | 228 MB, 117 KB each | 90 s | 28 | 265 → 553 MB | 809 MB |
| 400, made 800 (14) | 2 (442 px) | 1.7 s | 172 s | 397 MB, 204 KB each | 106 s | 3 | 282 → 627 MB | 875 MB |

- **Opening** takes as long at every size: reading the photos' EXIF data is most of it.
- **Making the folder's thumbnails** takes as long at 200 as at 400 pixels, 9% longer at 600 and 24% at 800 (with
  the load lower in the larger cases, so not the load's doing). The rows in view had theirs within 1.1–1.9 s of the
  click in every case.
- **The cache** grows with the area: 15, 52, 117 and 204 KB a photo. For 10,000 photos: 0.15, 0.5, 1.1 and 2.0 GB.
- **Memory** hardly changes: the page holds 500–630 MB after scrolling through every row at any size, as most of it
  is the rows themselves. Chromium keeps the data of the images that it does not draw in a temporary file of its own
  rather than in the page (`docs/tasks/20261121_full-file-thumbnails/STATUS.md`: about 130 MB for 2,000 thumbnails of
  400 pixels), which grows with their bytes as the cache does. It was not measured here.
- **Scrolling**: the frames over 50 ms follow the load of the computer rather than the size. At the same speed in
  pixels, a smaller box brings more rows in a second (at 60 frames a second, 63 against 38 today and 20 at 400
  pixels). In these scrolls, with the thumbnails in the cache or in the EXIF data, every row scrolled into view had
  its thumbnail.
- **Rows in view**: 5 at a box of 100, 3 today, 2 at 300 and 400, in a sidebar of 669 pixels.
- **The sidebar's width**: at its first width (25% of a window of 1,280 pixels, 316 pixels), today's rows are 380
  pixels wide, and a box of 100 gives 358, as the shooting time under the thumbnail is wider than the box: the sidebar
  scrolls sideways in both. A box of 300 needs a sidebar of about 480.

A JPEG whose EXIF thumbnail is smaller than the box looks soft at any size above it: at today's box, the camera's
160 x 120 is shown at its own size, smaller than the made thumbnails beside it and stretched twice on a screen of 2
device pixels per CSS pixel; at 300, it is stretched almost four times, and looks blurred. A thumbnail made from the
photo at twice the box looks sharp. The pictures of the four cases, which are of the public fixture, are kept with
the session's notes, not in the repository.

To show it larger and sharp, the app makes a thumbnail of every such JPEG, as it does of the JPEGs without one: it
reads each photo whole (4.5 MB for 12 megapixels, so 45 GB for 10,000) and decodes it, 151 s for 2,000 photos at 600
pixels on this busy computer (about half of that on a quiet one, from the 31 a second recorded for 400 pixels), and
keeps 117 KB a photo. A HEIF photo whose item is smaller than the box needs its whole image too, as at High quality
today.

## Options given to the owner

### A. A display size only

- **What**: Small, Medium and Large set the box of the tree's rows and of the popups: 100, 200 (today) and 300 CSS
  pixels. The tiles of a cluster's popup keep theirs. The images stay as they are made today, fitted to the box.
- **Gives**: 5 rows in view at Small rather than 3; larger images at Large.
- **Costs**: at Large, the camera's thumbnail of most JPEGs is stretched almost four times and looks blurred, and a
  made one of 400 pixels 1.5 times. Small is not faster.
- **Work**: the setting with its texts in every language, a CSS custom property on the page, the height of a photo's
  row that the sticky folder rows keep (`DirTreeViewStickyRowsComponent.photoRowHeightIn()`), unit and e2e tests, and
  the layout in every language. The least of the three.

### B. A display size, with the resolution that it needs (recommended)

- **What**: A, and every thumbnail at twice its box (200, 400 and 600 pixels), which a screen of 2 device pixels per
  CSS pixel shows sharp:
  - The thumbnails that the app makes, of JPEG and PNG photos without an EXIF thumbnail and of HEIF photos (in the
    page or in the main process), at that size.
  - At Large, a JPEG whose EXIF thumbnail is smaller than that gets one made from the photo, as a JPEG without one
    does; its EXIF thumbnail is shown, stretched, until then, as a HEIF photo's item is shown until its whole image
    is made.
  - At Small, a HEIF photo shows the thumbnail item that it holds (320 x 240 or more), which is enough for the box,
    and not its whole image, whatever the HEIF quality setting is; one that holds none gets its whole image at 200.
  - At Large, a HEIF photo at Fast still shows its item, stretched: the user chose the speed.
- **Gives**: sharp thumbnails at every size. Small is faster for HEIF photos: the item takes 4 ms against 21–34 ms
  for the whole image in the page, or 0.6–2 s in the main process where the page cannot decode HEVC
  (`docs/tasks/20261121_heif-thumbnails/STATUS.md`, a quiet computer). Large is larger, at the cost that was asked
  about.
- **Costs**: at Large, the first open of a folder reads and decodes every JPEG once (151 s for 2,000 photos here, 45
  GB read for 10,000 photos of 12 megapixels), and the cache keeps 117 KB for every JPEG (1.1 GB for 10,000), which
  Chromium's temporary file follows. A change of size makes the thumbnails again, unless the cache keeps one for
  each size.
- **Work**: about as much as PR #795: A, the size in the four places above, `needsMadeThumbnail()` by the size, the
  HEIF service's choice by the size, a cache of each size (its file names, `removeInvalidThumbnailCache()`, the
  Delete button), the setting applied without a restart as `HeifThumbnailService.applyThumbnailQuality()` does, an e2e
  case for each size, and the search for faces, which reads HEIF photos through their thumbnails.

### C. One setting for both the size and the speed

- **What**: B, with the HEIF quality setting folded into the size: Small shows the thumbnails that the photos hold
  (fast), Medium is today's default (High quality), Large makes every thumbnail from its photo.
- **Gives**: one choice, smaller and faster or larger and slower.
- **Costs**: a HEIF photo can no longer be fast at Medium: a computer that cannot decode HEVC with its graphics
  hardware gets the speed with the Small size only. A saved Fast needs a size to go to, and the texts of the HEIF
  choices are written again.
- **Work**: B, with the saved setting moved and the status bar's link, which opens the Thumbnails tab, pointed at the
  size.

### Not proposed: a resolution only

At today's box of 200, a thumbnail of 400 pixels is what a screen of 2 device pixels per CSS pixel shows. A smaller
one looks softer and is made no faster (above); a larger one is not seen.

## Where, and the default

- On the Thumbnails tab, first: "Thumbnail Size", with a line under each choice of what it costs, as the HEIF choices
  have. The tab scrolls with PR #803 (in the merge queue on 2026-11-23), which puts the cache on it.
- Default: Medium, which is today's.
- Optional: View > Thumbnail Size > Small, Medium, Large in the application's menu, applied at once, as file managers
  have it.

## What the design keeps to (AGENTS.md)

- One layout for every language: the choices' texts take the lines that they need, as the HEIF choices do; the boxes
  are the same in every language; at Small, the column of the thumbnail is as wide as the shooting time under it in
  the language, not as the box.
- Every text in `en.json`, with its translations: the section's title and three choices with a line each, about seven
  texts in 42 languages.
- `PhotoInfoViewerComponent` stays light: the box comes from a CSS custom property set once on the page, with no
  binding in each row; the services choose the image by the size, which the row's component reads in `thumbnail()`.
- What the app shows is an Angular component: the section is part of `ThumbnailSettingsComponent`, and the popups'
  content comes from `LeafletContentService`, as today.

## Not checked

- Windows and Linux, and a screen of 1 device pixel per CSS pixel, where half of each size would be enough.
- A quiet computer: every time here was taken with a load average of 11 to 32 on 10 cores.
- Chromium's temporary file at each size.
- What the search for faces finds in HEIF thumbnails of 200 and 600 pixels.

## What the owner chose (2026-11-24)

- A slider chooses the longer side of the thumbnails, from 400 to 1,000 pixels in steps of 100, shown in a box of
  half that, 200 to 500 CSS pixels, in the tree's rows and the popups; the tiles of a cluster's popup keep theirs.
  Nothing below 400: a smaller thumbnail is not faster (above), and Fast stays the choice for speed.
- The slider sits under High quality, in the choice that is of HEIF thumbnails today and becomes one of every
  thumbnail: Fast shows the thumbnails that the photos hold, in today's box; High quality makes them from the photos,
  at the slider's size. The slider is disabled while Fast is chosen.
- At High quality, a thumbnail that the photo holds is not stretched to fill the box: where it is smaller than the
  chosen size, one is made from the photo, at 400 too. A JPEG with a camera's EXIF thumbnail of 160 x 120 then gets
  one made at the default setting, as it does not today: the first open of a folder reads every JPEG once (2,000
  photos in 1 to 2.5 minutes, the rows in view first), and the cache keeps 52 KB more for each JPEG.
- No item in the View menu.
- While the larger one is made, the photo's own small thumbnail is shown, stretched to fill the box, as a HEIF
  photo's is.

## What was built (2026-11-24)

- **The setting**: `thumbnailSize` (`src-shared/user-settings/thumbnail-size.ts`), 400 to 1,000 in steps of 100, 400
  by default, saved beside the quality (`UserSettings/ThumbnailSize`, which a renderer may write,
  `renderer-storage-access.ts`). At Fast, the thumbnails that the app makes are of 400 pixels, as before.
- **The Thumbnails tab**: the choice of quality is of every thumbnail now ("Thumbnails" rather than "HEIF
  Thumbnails"), with a slider of Angular Material right under High quality, disabled while Fast is chosen, the size
  beside it and what it costs under it, in the type of the choices' texts. The radio group follows its choice with
  `ngModelChange`: a `(change)` binding on the group's element also heard the slider's own change event, which
  bubbles, and took the quality as undefined (a unit test fires that event). The texts of the tab and the cache's
  first sentence are new in every language.
- **The box**: a CSS custom property, `--plm-thumbnail-box`, on the application's root element (`AppComponent`, from
  `ThumbnailSizeService`), which the viewer's styles read for the tree and the popups: nothing of the size is bound in
  each viewer. The box sits at the top of its line now (`vertical-align: top`): on the baseline, an image as high as the
  box, as the small thumbnail that fills it or a portrait thumbnail, made the row 242 pixels high against 237.
- **What is made**: `needsMadeThumbnail(photo, quality, longerSide)` takes a JPEG whose EXIF thumbnail is smaller
  than the size at High quality too. `JpegPngThumbnailService` makes them at the size, from the folder's opening or
  from new settings (`applySettings()`), and a place reads a photo's new state through an epoch signal, as each photo's
  signal is a new one then. HEIF photos' whole images, in the page and in the main process (`resizeAndEncode`), are
  made at the size; a new size drops the thumbnails that wait to be made in the main process and asks for the
  folder's again.
- **The cache**: one file per photo, as before, whose log holds the size (`LongerSide`, 400 when a log has none); a
  thumbnail of another size counts as not attempted, and is made again in the same file. The page asks for a made
  thumbnail at an address with its size in its query (`madeThumbnailUrl`), the size that it was made at, which the
  services keep with each file: the page keeps the images that it loaded by their addresses, and the settings choose
  a new size a moment before the services forget the files of the previous one. The proposal had a file for each
  size; one file keeps the cache as large as one size's thumbnails, and a change of size, which is rare, makes them
  again.
- **From the review of #812**: a photo's previous log goes before a thumbnail of a new size is written in its file,
  and a thumbnail is logged as made only when its worker says so (`saveJpegPngThumbnail`, `generateThumbnailAndLog`).
  The writes of one thumbnail and its log run one after another (`oneWriteAtATime`), as those of two sizes may
  overlap once the settings changed. New settings look the HEIF photos up in the cache again at the new size: at
  Fast, those that were cached when the folder was opened keep their thumbnails only if they are of 400. An e2e case
  opens a folder whose HEIF photo has its thumbnail of 800 in the cache, then chooses Fast: with the fix undone, the
  photo kept the generating image, and the case failed.
- **The provisional thumbnail**: the viewer shows a JPEG's EXIF thumbnail while its larger one is made, as a HEIF
  photo's small thumbnail, filling the box with `object-fit: contain`, without a shadow, as its element is as large as
  the box then.

## Checked (2026-11-24)

On macOS 27, Apple M5, headless, with Electron's `--no-sandbox` added locally for the runs and not committed (this
Mac's stuck `backupd`), on a computer busy with other sessions' work (load average 15 to 40):

- `npm run test:unit:all` (96 Angular test files; Electron-Mocha 409 in the main process, 114 in the renderer),
  `lint:ng`, `lint:main`.
- The e2e cases of thumbnails and of the Settings dialog, against the production build and the development build:
  the new case of the size, the cases of HEIF and JPEG/PNG thumbnails, of the rows made near the view, of a photo's
  information in the tree and the popup, of the cache, and the dialogs' appearance, whose `settings-thumbnails` and
  `settings-thumbnails-cache` were written anew.
- `test/layout/app-in-every-language.mjs`, the Settings dialog in all 42 languages: no text cut or outside its box.
  The only findings are High quality's description on 4 lines, against 3 in English, in Bulgarian, Greek, French,
  Indonesian, Malay, Dutch and Russian: a description takes the lines that it needs. Arabic and Hebrew lay the
  slider out from right to left.
- `test/performance/tree-rows.mjs`, the base of this change (PR #803's branch at 1e14082f) against this change, 2,000
  photos, 3 trials each, medians:

  | | open | rows again | checkbox | Undo | scroll, mean / longest frame | heap | nodes | listeners | page's process | heap after rows again |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | before | 1,499 ms | 223 ms | 26 ms | 28 ms | 16.7 / 34 ms | 45.3 MB | 57,025 | 8,482 | 315 MB | 45.4 MB |
  | now | 989 ms | 220 ms | 35 ms | 32 ms | 16.7 / 18 ms | 46.0 MB | 57,025 | 8,482 | 375 MB | 46.5 MB |

  The rows and their viewers cost what they did: the same nodes and listeners, 0.7 MB more heap, none more after
  the rows were made again. The photos are copies of a JPEG with a camera's thumbnail, of which the app now makes
  thumbnails of 400 pixels, in the background while the trial goes on: the page's process holds 60 MB more, and the
  clicks took a few milliseconds more, within the trials' spread on this busy computer (23 to 36 ms).

## The owner's changes to the tab (2026-11-24)

Once the slider was merged, the owner asked for these, from screenshots of the tab in Japanese, in a few rounds:

- **The texts** are the owner's, in Japanese:

  | | Before | Now |
  | --- | --- | --- |
  | The part's title | サムネイル | サムネイルの画質とアプリのパフォーマンス |
  | The sentence above the choices | サムネイルの画質と速さのどちらを優先するかを選んでください。 | (none) |
  | High quality | 高画質 | サムネイルの画質を優先 |
  | What it does | 写真全体から、下で選んだ大きさで生成します。… | 常に写真ファイルからサムネイルを生成します。 |
  | Fast | 速さ優先 | アプリのパフォーマンスを優先 |
  | What it does | 写真に保存されている小さいサムネイルを、すぐに表示します。… | JPEG や PNG が元々サムネイルを持っている場合はそのまま表示します。それ以外の場合のみ長辺 400 ピクセルのサムネイルを生成します。 |
  | The slider's label | 大きさ | サムネイルの大きさ |

  English has them as "Thumbnail Quality and App Performance", "Prefer thumbnail quality" and "Prefer app
  performance", and the other languages as machine translations. The status bar of the thumbnails, which names the
  choice for performance as the way to show them sooner, names it in quotation marks: it named "Fast" ("速さ優先"),
  or "fast thumbnails". The size that Fast makes thumbnails at is 400, whatever the slider says
  (`madeThumbnailLongerSide`), which its text says, as the owner asked once they had checked it.
- **The size beside the slider is gone** ("400 pixels on the longer side"): the slider says it to a screen reader on
  its thumb (`displayWith`), and the sizes under the marks show it.
- **What a larger size costs** is in a note that an info button right after the slider opens and closes, rather than
  a paragraph under the slider. The owner had the button after the size beside the slider, which went. The note opens
  over the tab, under the button and ending where it ends (from where the button started, it reached past the
  dialog's edge), and a click elsewhere, Escape, or a scroll of the tab closes it; the dialog's content is a
  `cdkScrollable` for that. The button is named "About the thumbnail size", a new text in every language, and stays
  enabled while the choice for performance is chosen. Its icon is the outlined one: the filled one was a black disc
  among the texts. It stands 20 pixels from the slider, clear of the last size under it, which reaches up to 24 pixels
  past the slider's end in Arabic.
- **The slider's marks have sizes under them**, with "px" as the owner asked: 400 px and 1000 px at its ends, and
  600 px and 800 px between them. The marks are 39 pixels apart, about as wide as "1000 px", so every other mark has
  its size. Each size is centered under its mark in either direction, and an e2e case checks it within a pixel. The
  size is a text of its own, "{{size}} px", in every language but Arabic, which writes the word that its size on the
  slider has (بكسل).
- **The choices' texts are as dark as the tab's others**: Angular Material's theme gives a radio button's label 87%
  black and letters 0.25 pixels apart (0.0178571429em), with which the choices looked paler, in Japanese the most.
