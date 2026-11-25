# JPEG and PNG photos whose EXIF thumbnail the page cannot decode: status

Investigated and changed on 2026-11-25.

## What was asked

Pull request #795 made a thumbnail of each JPEG or PNG photo without one in its EXIF data, which had shown its whole
file, and kept it in the cache (`docs/tasks/20261121_full-file-thumbnails/STATUS.md`). Pull request #796 stopped
decoding the EXIF thumbnails while a folder opens, so that the page finds one that it cannot decode only once a place
shows it, by the img element's error (`docs/tasks/20261122_exif-thumbnail-orientation-tag/STATUS.md`). Such a photo
then showed what a photo without an EXIF thumbnail had shown before #795: its whole file. The owner asked where that
still happens, at which quality and in which places, how rare such photos are and what one costs, and for a fix if it
is narrow.

## Where the whole file was loaded

A row of the folder tree, a marker's popup and a tile of a cluster's popup are the same component,
`PhotoInfoViewerComponent`, so each case is the same in every place, and once one place has found the thumbnail
undecodable, every place shows the photo as one without it (`UndecodableThumbnailService`).

| Quality, and the photo's EXIF thumbnail | Shown once it failed, in `main` at 19d97763 | Shown now |
| --- | --- | --- |
| Fast, any | **the whole file** | the "being made" image, then the thumbnail of 400 pixels that the app makes |
| High, smaller than the size (a camera's 160 x 120, at any size) | the "being made" image, then the made thumbnail: the EXIF thumbnail was only shown until then | the same |
| High, as large as the size or larger (512 x 384 at 400 or 500, say) | **the whole file** | the "being made" image, then the made thumbnail |
| Either, where no thumbnail can be made (the page has no `ImageDecoder`, the decoder refuses the file, the cache's path is too long for Windows) | the whole file | the same, as for a photo without an EXIF thumbnail |

Fast makes no thumbnail of a photo that has an EXIF thumbnail, and nor does High of one whose EXIF thumbnail is as
large as the size, so `JpegPngThumbnailService.prepare()` did not take such a photo when the folder opened, and
`watch()` ignored any photo that `prepare()` had not taken.

## Which EXIF thumbnails the page cannot decode

18 copies of the EXIF thumbnail of `test/test-resources/actual-photos/Kobe/IMG_4676.JPG` (a baseline JPEG of
160 x 120, 10,294 bytes), each damaged in one way, were loaded into an img element as a viewer loads one (an object URL
of what `orientedJpeg()` gives, or of the bytes where it gives nothing), in a hidden window of Electron 45.3.2
(Chromium 156):

| The damage | `orientedJpeg()` | The img element | `decode()` | Drawn (40 x 30 samples) |
| --- | --- | --- | --- | --- |
| None | takes it | load | resolves | all of it |
| A Huffman table of the number 5 (DHT) | takes it | **error** | rejects | – |
| A Huffman table of more than 256 codes | takes it | **error** | rejects | – |
| A quantization table of the number 5 (DQT) | takes it | **error** | rejects | – |
| A frame of 2 components (SOF, with the scan to match) | takes it | **error** | rejects | – |
| A sampling factor of 0 (SOF) | takes it | **error** | rejects | – |
| A scan of a component that the frame does not have (SOS) | takes it | **error** | rejects | – |
| A restart interval of the wrong length (DRI) | does not take it: turned on a canvas, which fails (`rotate-failed`) | error | rejects | – |
| Random bytes after the SOI | does not take it, as above | error | rejects | – |
| No Huffman tables | takes it | load | resolves | all of it: libjpeg-turbo takes JPEG's standard tables |
| No quantization tables | takes it | load | resolves | nothing |
| No scan data | takes it | load | resolves | nothing |
| The data cut at 10% or 60% | takes it | load | resolves | the rows decoded: 13% or 53% |
| No EOI | takes it | load | resolves | 93% |
| 64 bytes of the data overwritten | takes it | load | resolves | all of it, damaged |
| The data overwritten with random bytes | takes it | load | resolves | all of it, garbled |
| A frame of 4032 x 3024, larger than the data | takes it | load | resolves | one grey |

So the error, and the fallback, come only for a thumbnail whose tables or headers Chromium rejects while
`orientedJpeg()`, which reads no more than the frame's size, takes them: an encoder that writes them wrong, or damage
that falls on those 600 bytes rather than on the 9,700 of the image data. Damage to the image data, as a file cut short
or overwritten has, loads, and shows part of the thumbnail or nothing, which nothing in the app found: a thumbnail cut
short is now left out while the folder opens ("Thumbnails cut short", below), and the others are left as they are.

How rare such photos are is not known. None of the fixtures has one, and no camera or app that writes such
thumbnails is known. Since #796, the viewer only logs a warning for one (`onThumbnailError()`). Before it, from #697
(2026-11-14) to #796 (2026-11-23), the canvas counted the same failures as `rotate-failed` in the analytics event
"Opened Folder: EXIF Read Failed", as it loaded each thumbnail into an image whose error it took: those counts are
the measure there is.

## What one costs

A whole photo of 12 megapixels (4.5 MB) in a box of 200 pixels took 31 ms from its address to `decode()` (median of
5, the same window, `file:`), against a thumbnail made in 25 ms once and read from the cache since. The page then
keeps the whole file for the rest of the session: 4.35 MB a photo in Chromium's images, which it writes to a file of
its own in the system's temporary folder (`docs/tasks/20261121_full-file-thumbnails/STATUS.md`). A few such photos
cost little. A folder of them, as one camera or app would leave, cost at Fast what #795 removed: 8.7 GB of images for
2,000 photos.

## What was changed

- `needsMadeThumbnail()` (`src/app/jpeg-png-thumbnail/jpeg-png-thumbnail.service.ts`) takes
  `UndecodableThumbnailService`: a JPEG or PNG photo whose EXIF thumbnail the page could not decode needs a made
  thumbnail at either quality, as one without an EXIF thumbnail does. Fast so shows a thumbnail of 400 pixels, as its
  description in the settings says for a file that holds none (`settings.thumbnails.fastDescription` in
  `src-shared/i18n/locales/en.json`). The owner chose that on 2026-11-25, over the photo itself, as Fast showed
  before, and over the image that says that there is no thumbnail.
- `JpegPngThumbnailService.watch()` takes a photo of the folder that `prepare()` did not take, where its thumbnail is
  to be made now (`takeLate()`): it asks the cache about it, and makes it, before the folder's others, where the cache
  has none. Once only; not for a photo of another folder; the cache's answer is dropped if another folder opens
  meanwhile; and the log's line of the folder's thumbnails made does not count it. `applySettings()` takes the photos
  that it knows to have such a thumbnail with the folder's others.
- `PhotoInfoViewerComponent.thumbnail()` shows the photo itself only where no thumbnail can be made.

The page also fires the error for an object URL that was revoked. An open revokes the previous folder's thumbnails at
its start (`ThumbnailObjectUrlStorage`), while that folder's rows are still shown behind the loading dialog until the
next tree is, so a row that came near meanwhile, as when the window is made larger, would take its thumbnail for one
that the page cannot decode. It then showed its photo's whole file at Fast; it now shows the "being made" image until
the tree is replaced, as the service does not take a photo of another folder, nor one of the same path whose new EXIF
thumbnail decodes. This was read from the code, not reproduced.

## Thumbnails cut short

Changed on 2026-11-25 too, after #836, as the owner asked about the thumbnails whose image data are damaged.

A thumbnail whose image data are damaged was shown as Chromium drew it, with part of it or nothing: as it is at Fast,
and at High quality where it was as large as the size; stretched at High quality otherwise, until the thumbnail that
the app makes came; and as it is for a photo of another format, as a TIFF file. Of the damage in the table above, one
kind can be found without decoding the thumbnail: a JPEG without its EOI, the marker with which every JPEG ends,
which a thumbnail cut short lacks. The others, data overwritten, no quantization tables and a frame larger than its
data, are left as they are: only decoding finds them, which #796 stopped doing while a folder opens.

- How one is cut short: exifr gives as many bytes of the thumbnail as the EXIF data say that it has
  (JPEGInterchangeFormatLength), so an app that rewrites them with the length too short leaves the thumbnail without
  its end. With Kobe's photo whose length was so set to 60% (`test/test-util/jpeg-with-cut-short-exif-thumbnail.mjs`),
  exifr gave the first 6,176 of the thumbnail's 10,294 bytes, and the location and the shooting time as they were.
- `isCutShort()` (`src/app/shared/cut-short-jpeg.ts`) reads the segments before the first scan by their lengths, and
  looks for EOI in the scans' data, from the end: a whole thumbnail ends with it, so that each costs its few segments
  and a comparison or two. The content of a segment, as a comment or a table, can hold 0xFF 0xD9, which is not EOI, as
  the review of #849 pointed out. Bytes after EOI, which some writers add as padding, are allowed. The 5 EXIF
  thumbnails of the fixtures end with EOI, with nothing after it.
- `createThumbnail()` (`src/app/shared/exif-fetcher/using-exifr/fetch-exif-using-exifr.ts`) leaves such a thumbnail
  out, with a line in the log, so that the photo has no thumbnail of its EXIF data from the start: a JPEG or PNG photo
  gets the thumbnail that the app makes, at Fast too, a HEIF photo the one that HeifThumbnailService makes, and a
  photo of another format, as a TIFF file, the image that says that there is none, rather than part of a thumbnail.
- Each is counted as `thumbnail-cut-short` in the analytics event "Opened Folder: EXIF Read Failed"
  (`src/app/shared/exif-fetcher/exif-read-failures.ts`), so that how often it happens will be known.

## Checked

- Unit tests: `needsMadeThumbnail()` at both qualities, and the photo taken late in `jpeg-png-thumbnail.service.spec.ts`
  (made and kept, at High quality too, the cache's thumbnail or the photo itself, asked once, before the folder's
  others, taken again with new settings, not for another folder, dropped for a folder opened meanwhile); in
  `photo-info-viewer.component.spec.ts`, #796's case at Fast, which now gives way to the made thumbnail in every
  place, and High with an EXIF thumbnail as large as the size. The tests that expect a thumbnail to be made fail
  without the change.
- The end-to-end case "Fast shows a thumbnail of 400 pixels that the app makes of a JPEG whose EXIF thumbnail the page
  cannot decode or is cut short, never the photo itself", with Kobe's photo whose EXIF thumbnail has a quantization
  table of the number 5 (`test/test-util/jpeg-with-undecodable-exif-thumbnail.mjs`, the one byte changed): the row and
  the popup show the thumbnail of the cache, the page never asks for the photo's file, and the log says that the EXIF
  thumbnail could not be decoded. Against a build of `main` at 19d97763, the row showed the photo itself,
  4032 x 3024, and the case failed.
- The 15 end-to-end cases whose names speak of thumbnails, against a development build and against the production
  build of the change, on macOS, with the windows hidden.
- For the thumbnails cut short: `isCutShort()` in `src/app/shared/cut-short-jpeg.spec.ts`; Kobe's photo with its
  thumbnail cut short in `test/src/app/shared/exif-fetcher.spec.em.renderer.ts`, which reads it with exifr as the app
  does (no thumbnail, the rest of the EXIF data, the reason counted), and fails without the change; and the
  end-to-end case of Fast, now with Unga's photo, which has no location, cut short too: its row shows the thumbnail of
  300 x 400 that the app made, the page never asks for its file, the log says why, and the event counts it.
- What the rows of the tree cost, as `test/performance/tree-rows.mjs` measures it (2,000 photos, 3 trials of each
  build, production builds of `main` at 19d97763 and of the change, a load average under 2): the medians were the same
  within the trials' spread. `openMs` 1,127 and 1,046 ms, `rowsAgainMs` 225 and 210 ms, `checkboxMs` 29 and 28 ms,
  `undoMs` 27 and 27 ms, frames of 16.7 ms while scrolling, at most 19 ms, in both, `heapMb` 45.9 and 46.0, and the
  same 57,027 nodes and 8,492 listeners. At High quality, the default, every photo of the folder has a thumbnail made,
  so each of its viewers asks the service for it, through the new look-up of `takeLate()` once it is made.

## Not checked

- Windows and Linux, which CI runs the tests on.
- A thumbnail that a camera or an app wrote undecodable: none is known.
