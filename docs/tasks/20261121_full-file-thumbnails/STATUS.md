# Thumbnails of JPEG and PNG photos without one in their EXIF data: status

Investigated from 2026-11-21, chosen and implemented on 2026-11-23.

## What was asked

The owner asked where the main window loads a photo's whole file where a thumbnail would do, and for thumbnails to
be made in those cases, so that the window has less to load and does not crash: its page goes white while the window
stays. In 2022, the window went white once a large folder had been loaded, when the generated thumbnails were 0.5 to
2 MB each, 7 GB in the cache; pull request #475 made them smaller, to about 330 MB, and the conclusion then was that a
window can load only so much in images, so that even a JPEG or a PNG photo should show a generated thumbnail.

## Where the whole file was loaded

A row of the folder tree, a marker's popup and a tile of a cluster's popup are the same component,
`PhotoInfoViewerComponent`, and show the same image:

| Photo | Shown | From |
| --- | --- | --- |
| JPEG with a thumbnail in its EXIF data | the thumbnail, 160x120 | exifr in the main process; the page turns it on a canvas and keeps it as a Blob, a PNG of 46 KB against 10 KB in the file, until another folder opens |
| JPEG without one | the whole file | `plm-file:` |
| PNG | the whole file | `plm-file:` |
| HEIF | a thumbnail that the app makes | `src/app/heif-thumbnail/` (`docs/tasks/20261121_heif-thumbnails/STATUS.md`) |
| TIFF | the image that says that there is none | Chromium cannot show TIFF |

- A row makes its thumbnail only near the view (`NearViewDirective`), but stays made: a scroll through the tree loads
  every file. A cluster's popup loads about 40 tiles at once when it opens.
- Nothing that the page loaded was let go for the rest of the session: not when a folder of the tree was collapsed,
  a popup was closed, or another folder was opened.
- Chromium keeps the data of the images that it does not draw in a hidden file of its own, in the system's temporary
  folder, which it deletes when the app quits. The page's memory then does not grow with the files, but that file
  does.

## What was measured

macOS 27 on an Apple M5 (10 cores, 32 GB), Electron 45.3.2, a production build, the window hidden at 1000x768. The
photos were copies of `test/test-resources/actual-photos/Kobe/IMG_4676.JPG` (12 megapixels, 4.5 MB), without their
EXIF thumbnail where it says so. 2,000 rows of the tree scrolled from top to bottom:

| Case | The page's memory at most | After the folder was collapsed | Images kept by the page | Chromium's file |
| --- | --- | --- | --- | --- |
| Photos with EXIF thumbnails | 0.66 GB | 0.39 GB | 93 MB | 88 MB |
| JPEGs of 400 pixels, as a made thumbnail is | 1.05 GB | 0.79 GB | 140 MB | 130 MB |
| The whole photos, as shown before | 1.25–1.5 GB | 0.8 GB | 8.7 GB | 9.1 GB |
| The same, without a temporary folder to write to, as on a full disk | 5.4 GB at 1,024 rows, about 5 MB more for each | 5.3 GB | in memory | none |
| A cluster's popup of 1,000 whole photos | 1.06 GB | 0.64 GB, closed | 4.35 GB | 4.5 GB |

The window did not go white in any run, but the page would hold every photo shown in memory where Chromium cannot
write its file, and that file grows with the photos shown: 2,000 photos of 4.5 MB made it 9.1 GB. The main process went
up to 1.6 GB meanwhile, as every file passed through the handler of `plm-file:`.

One thumbnail of 400 pixels, median of 5:

| Photo | The generation of HEIF thumbnails (a utility process, Jimp, jpeg-js) | Chromium in the page (`createImageBitmap`) | Chromium in the page (`ImageDecoder`, scaled while decoded) |
| --- | --- | --- | --- |
| JPEG of 12 megapixels | 512 ms, 422 MB in its process | 81 ms | 25 ms |
| JPEG of 48 megapixels | 1,484 ms, 1.2 GB | 263 ms | 75 ms |
| PNG of 12 megapixels | 548 ms | 229 ms | 108 ms |

## What was chosen

Shown three options (A: thumbnails made and kept in the cache; B: made in the page for each session, without a
cache; C: nothing), the owner asked whether B would always have a thumbnail ready as a row comes into view. With a
prototype of B that made the rows nearest the view first, it did not: with 12-megapixel photos, 34% of the rows
scrolled past at 10 rows a second showed no thumbnail yet, against none before (on a very busy machine), as
`createImageBitmap` decodes the whole photo where an img element decodes it smaller. The owner chose A: a thumbnail
of the cache shows as fast as an EXIF thumbnail, and is made only once.

## What was built

- `src/app/jpeg-png-thumbnail/`: `JpegPngThumbnailService` makes the thumbnail of a JPEG or PNG photo without one in
  its EXIF data: those that a place shows first, as the row or the tile comes near the view (its NearViewDirective)
  or the popup opens, those of the last turn first, and in a turn the rows nearest the window's middle first, which
  the NearViewDirective tells from what the IntersectionObserver measured; then, a second after the tree is shown,
  the folder's others, one at a time, so that every thumbnail is in the cache the next time. It knows which are in the
  cache before the tree shows them, as the HEIF thumbnails do.
- The page decodes the photo with WebCodecs' `ImageDecoder`, from the bytes that the main process reads, and encodes a
  JPEG of 400 pixels at quality 0.92 (`jpeg-png-image-decoding.ts`). From the bytes, not through an img element or a
  Blob, which the page or the main process would keep; the decoder takes their buffer rather than a copy, which the
  page would keep until it collected its garbage. A JPEG is decoded at an eighth of its size or more, which the
  decoder chooses from a size twice the thumbnail's; it is turned by its EXIF orientation; what a PNG leaves
  transparent is white.
- The main process reads the photo and keeps the thumbnail in `.PlmCache`, beside those of HEIF photos, with the log
  of its generation, which holds the time that the photo had when it was read
  (`src-main/thumbnail-generation/jpeg-png-thumbnail-files.ts`). A file that the decoder refuses, as one cut short,
  shows itself, as every such photo did, and the cache says so, so that it is not tried again until it changes.
- The cleanup of the cache, which removes the thumbnails of photos no longer there, read the whole cache synchronously
  in the main process whenever HEIF thumbnails were made there. It is asynchronous now, once a launch, from the first
  thumbnail kept, and removes the logs of failed attempts too.
- The Cache tab of the Settings dialog says which photos have their thumbnails made, in every language.
- The fade-in of a thumbnail that has been made is 0.3 s rather than 2 s, as a JPEG's comes in tens of milliseconds.
- A thumbnail of the EXIF data is kept as a JPEG rather than a PNG: 46 KB each was 0.9 GB for 20,000 photos.

## Measured after the change

The same Mac and photos, now quiet (load average 2 to 5), a production build of this change against one of main
(25060a20), each run on a new profile, in rounds of alternating order. A row counts as seen once half of it is in the
sidebar's view; a wait is from then until its thumbnail has loaded. On its first view, the change makes the
thumbnails as the rows come near, and the folder's others behind them, about 31 a second (2,000 in 64 s); with the
cache, it makes none.

2,000 rows of 12-megapixel photos (2 rounds each; jumps: median, the slowest of the 3 rows in view):

| | main | This change, first view | This change, with the cache |
| --- | --- | --- | --- |
| Rows that passed without their thumbnail, scrolling at 5, 10, 20 and 40 rows a second | none of 1,200 | none of 1,200 | none of 1,200 |
| Each scroll's own time, at 40 rows a second (3,750 ms asked) | 3,761 ms | 3,764 ms | 3,761 ms |
| A jump to row 100, 4 s after the folder opened | 59, 89 ms | 214, 230 ms, before the rows nearest the view came first (below) | 39 ms |
| Jumps far down the tree, after the scrolls | 45 ms | 30 ms | 45 ms |
| The popup of the cluster of all 2,000, its 12 tiles in view | 591, 600 ms | 565, 565 ms | 578 ms |

Right after the folder opened, a jump to row 1,850, which the folder's background generation had not reached, then a
scroll from there (3 rounds each). The rows that came near in one turn were made in their order at first, those that the
jump brought near above the view first; then nearest the window's middle first, which is how the change makes them:

| | main | First view, in their order | First view, nearest first |
| --- | --- | --- | --- |
| The rows in view after the jump, the slowest | 45–73 ms | 179–214 ms | 95–98 ms |
| Rows that passed without their thumbnail, at 20 rows a second | none of 420 | none of 420 | none of 420 |
| The same at 40 rows a second | 51 of 413, in one round | 7 of 420 | 2 of 420 |

300 rows of 48-megapixel photos (11 MB, 1 round; the first view before the rows nearest the view came first):

| | main | This change, first view | This change, with the cache |
| --- | --- | --- | --- |
| Rows that passed without their thumbnail, at 5 and 10 rows a second | none of 160 | none of 160 | none of 160 |
| The rows in view after the folder opened | 0 ms | 303 ms | 0 ms |
| A jump to row 30, 4 s after the folder opened | 61 ms | 480 ms | 32 ms |
| A jump to row 260, after the scrolls | 112 ms | 26 ms | 45 ms |

On this quiet machine, main showed every thumbnail in time but in one round of the fastest scroll, as Chromium decodes
a JPEG of an img element at the size that it is shown, and many at once; the waits measured for option B before were on
a machine whose load average was 28 to 54. The change shows the thumbnails as fast once they are in the cache, and a
little later only where a folder is shown for the first time, before its thumbnails are made.

2,000 rows of 12-megapixel photos scrolled from top to bottom, measured as before the change. The first view's is
with the decoder taking the photos' bytes; while it copied them, the page went up to 1.39 GB:

| Case | The page's memory at most | After the folder was collapsed | The main process at most | Images kept by the page | Chromium's file |
| --- | --- | --- | --- | --- | --- |
| main | 903 MB | 350 MB | 1.50 GB | 8.50 GB | 8.49 GB |
| This change, first view | 981 MB | 320 MB | 152 MB | 113 MB | 80 MB |
| This change, with the cache | 498 MB | 279 MB | 135 MB | 113 MB | 102 MB |

The cache took 117 MB for the 2,000 photos, the logs of their generation included.

## Not checked

- Windows and Linux: the measurements need macOS's `footprint`, `memory_pressure` and `lsof`.
- The search for faces still decodes a JPEG or PNG photo itself, through an img element, for the detail that it
  needs (`src/app/face-search/face-search-image.ts`): the photos searched stay in the page for the session.
- A PNG is decoded whole, as its format has no smaller decoding: one of 100 megapixels takes 400 MB while it is.
