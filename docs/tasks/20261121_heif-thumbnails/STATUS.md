# Thumbnails of HEIF photos without converting the whole file: status

Investigated, proposed, chosen and implemented on 2026-11-21.

## What was asked

The owner asked for a HEIF photo's thumbnail to come from the thumbnail that the file holds, rather than from
converting the whole file to a JPEG, which takes time, and was open to another way of reading the files. Shown the
measurements, the owner chose the page's decoding with WebCodecs, then libheif, then the generation as it was
(option 3 below). Then, as the thumbnail that an iPhone's photo of 12 megapixels holds is 320x240 against the 400x300
that the app made, the owner asked for the choice between quality and speed to be the user's: a setting, high quality
by default, which the status bar of the generation offers to change where the wait is seen, on a tab of its own.

## How thumbnails were made

At the open of a folder, every HEIF file without a thumbnail in the cache was made in Electron's utility processes,
one per photo, (physical cores − 1) at a time (`src-main/thumbnail-generation/`): the whole file read, its primary
image decoded by heic-decode 2.1.0 (libheif-js 1.23.5, WebAssembly), scaled to 400 pixels by Jimp, encoded by jpeg-js
at quality 92, and kept in `~/.PlmCache`. exifr 7.1.3 reads the EXIF in 0.2 ms per HEIC, and does not see a HEIF
file's thumbnail item; it does not return the EXIF thumbnail of a HEIC either, which a Xiaomi photo has.

## What a HEIF file holds

A HEIF file keeps a small image of its primary image as an item with a `thmb` reference to it.

| Maker | The thumbnail |
| --- | --- |
| iPhone | HEVC Main Still Picture, 8-bit 4:2:0: 320x240 for 12 megapixels, 416x312 for 24, 576x432 for 48, 1280 wide for a panorama; written right after `meta` (brand `MiPr`), within the first 64 KB in 93% of the photos looked at; turned as the photo is (`irot`) |
| Samsung (Galaxy S24 Ultra, A40) | HEVC 512x384, 384x384; `meta` after `mdat`, at the end of the file |
| Canon EOS R5 | HEVC 4:2:2 10-bit 320x214, coded as 320x320 without a conformance window |
| Sony α1, α7S III, α7 IV | HEVC 1616x1080 (4:2:2 10-bit), HEVC Main 10 320x212 coded as 320x256, and a JPEG of 160x120 |
| Xiaomi | none; an EXIF thumbnail of 320x240 |
| DJI drone, macOS's `sips`, Apple Vision Pro | none |

Of the iPhone HEIC photos looked at, from iOS 11 to 27, 99.5% held one; the others seemed to have been edited. None
held an EXIF thumbnail. The public samples are the test data of exifr (MIT), exiv2 (GPL-2.0), libheif's examples
(MIT) and pillow_heif (BSD-3-Clause), used here and not added to the repository.

## The ways measured

Per photo, median, one at a time, on an Apple M5 with Electron 45.3.2 (Chromium 156), with about 1,400 iPhone photos
of 12, 24 and 48 megapixels:

| Way | 12 MP | 24 MP | 48 MP |
| --- | --- | --- | --- |
| The generation, as it was | 630 ms, 341 MB | 1,052 ms, 540 MB | 1,943 ms, 936 MB |
| The generation, 9 processes at once (per photo) | 246 ms | – | 698 ms |
| WebCodecs in the page, the whole image at 400 px | 21 ms | 23 ms | 34 ms |
| WebCodecs in the page, the thumbnail item | 4.0 ms | 4.3 ms | 5.6 ms |
| libheif-js, the thumbnail item, in a utility process | 8.8 ms | 12.0 ms | 17.6 ms |
| Quick Look (`nativeImage.createThumbnailFromPath`), a padded square | 46 ms | – | 55 ms |
| ImageIO through a native module (estimated with Swift), its thumbnail item | 3.0 ms | – | 8.2 ms |

- Locating the thumbnail item and reading it: 0.2 ms in the main process, one read of 64 KB for most iPhone photos.
- WebCodecs on macOS decodes the profiles of all the samples, Canon's 4:2:2 10-bit among them; Chromium has no
  software decoder of HEVC (`prefer-software` is unsupported). Turned and cropped as ImageIO renders the photos in 306
  of 306 photos checked. The colours of the whole image at 400 px are as close to ImageIO's rendering as the
  generation's (mean difference 6.0 and 6.1 of 255): iPhone thumbnails signal Display P3, which Chromium converts.
- libheif refuses Canon's and Sony's thumbnails ("Decoded image does not have the size signaled in the file"), as
  their coded pictures are larger than they declare: the HEIF file made for it declares the size of the picture,
  read from the sequence parameter set, and the worker crops it.
- A native module would need Objective-C++ for ImageIO and C++ for Windows's WIC, which decodes HEIC only with
  Microsoft's HEIF and HEVC extensions, built for each platform: not chosen.

## What was built

- `src-main/heif/`: reads a HEIF file's `meta` box and the thumbnail item or the tiles of the primary image, with as
  little of the file as they need, and the size of a picture from its sequence parameter set; a utility process that
  decodes thumbnail items with libheif, kept while it is used; IPC for the page.
- `src/app/heif-thumbnail/`: `HeifThumbnailService` makes the thumbnail of a photo when a place shows it: the small
  thumbnail first (WebCodecs, else libheif in the main process), then, for the high quality, the whole image at 400 px
  with WebCodecs, or the generation where the page cannot decode HEVC. The fast quality keeps the small thumbnail, and
  makes one of the whole image for a photo that holds none.
- `ThumbnailGenerationService` makes the whole folder only for the high quality where the page decodes no HEVC, as
  before, and otherwise the photos that the page could not make, one by one; a new setting drops the thumbnails that
  wait to be made.
- The Settings dialog's Thumbnails tab chooses between high quality (the default) and fast; the status bar of the
  generation links to it while it makes thumbnails of high quality.

## Lines between the tiles

Once it was merged, the owner saw a grid of thin lines over the thumbnails of high quality that the page made. Each
tile was drawn scaled by the same factor, so its edges fell within pixels of the thumbnail (a tile of an iPhone's
photo of 12 megapixels is 50.8 pixels wide at 400), which it covered in part and left transparent in part, and a JPEG
shows a transparent pixel black: lines 15 to 25% darker. Where the thumbnail's last row or column took in the image's
edge, it also took in what the tiles hold past the image. Each tile now fills whole pixels of the thumbnail, from the
part of it that the image shows only (`src/app/heif-thumbnail/tile-placement.ts`).

The tests had checked the thumbnails' sizes, and their colours as a mean over the whole image, which lines of a pixel
hardly move. Now an image of one grey in tiles (`test/e2e/fixtures/uniform-tiles.heic`) shows such a line as pixels of
another grey where the platform decodes HEVC in the page, and a unit test checks on every platform that the tiles draw
each pixel of the thumbnail once.

## Not checked

- Windows and Linux were not measured. Chromium decodes HEVC on Windows 8 and later with a graphics adapter that does
  (D3D11VA, no extension needed), and on Linux only with VA-API; elsewhere the page uses libheif and the generation.
  The CI runners of Linux and Windows have no such adapter, so their e2e runs take those ways.
- Whether the macOS runners of CI, virtual machines, decode HEVC in the page.
- The faces that the search finds in the thumbnails of the fast quality, 320 px for 12 megapixels: YuNet found 26
  of 32 at 160 px and 31 at 400 px (`docs/tasks/20261121_face-search/STATUS.md`).
- An HDR thumbnail (Canon's HDR PQ): the sample was black.
