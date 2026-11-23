# The size of the thumbnails, chosen by the user: status

Investigated and proposed on 2026-11-23. Nothing is implemented: the owner picks an option first.

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
