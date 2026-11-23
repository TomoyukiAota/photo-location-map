# The thumbnails of EXIF data, turned by a tag rather than on a canvas: status

Investigated and proposed on 2026-11-22, chosen and implemented on 2026-11-23.

## What was asked

Opening a folder of N JPEGs spent, from the mark `plm:open-folder:tree-created` to
`plm:open-folder:photo-data-loaded`, exactly N / 10 frames of 16.7 ms: 16.70–16.74 s for 10,000 photos and
3.34–3.39 s for 2,000, measured on a quiet computer on 2026-11-21. So the open was paced by the page's frames, not by
its work. The owner asked which step waited for a frame, and for ways to shorten the open that leave what is shown as
it is: more photos at once, no canvas for a photo that needs no turn, `toBlob()` as JPEG, `createImageBitmap()`, or an
OffscreenCanvas in a worker.

## The step that waited for a frame: canvas.toBlob()

For each photo, 10 at a time (`ExifFetcher`), the main process read the EXIF data and the thumbnail in it with exifr,
and the page turned the thumbnail on a canvas, as the photo's orientation said, and made a PNG of it with
`canvas.toBlob()` (`rotateImage()` in `src/app/shared/image-rotation.ts`), whose object URL every place showed.

A trace of the open of 2,000 photos (Electron's `contentTracing`) shows that `toBlob()` does two things on the page's
thread:

- In the call, it reads the canvas back from the GPU and waits for it: `Canvas2DResourceProvider::Snapshot`, then
  `RasterImplementation::ReadbackImagePixels`, 0.84 ms a photo at the median.
- It encodes the PNG in an idle task (`CanvasAsyncBlobCreator::ScheduleInitiateEncoding`), which Blink's scheduler
  runs only in the idle period after a frame (`ShortIdlePeriod`), 0.83 ms a photo at the median. A task posted during
  an idle period waits for the next one.

The page draws a frame every 16.7 ms while a folder opens, as each frame asks for the next: 329 frames in the trace's
5.2 s, 16.68 ms apart at the median. So a photo's PNG came only after the next frame, however idle the thread was in
between, and with 10 photos at a time, at most 10 came in a frame. The page's own timestamps showed it: three photos
passed to `toBlob()` at 912.7–914.5 ms, with the thread free from about 916 ms, got their PNGs at 927.2–929.2 ms, right
after the frame at 925.5 ms. For 9 in 10 of the 2,000 photos, `toBlob()` spanned the start of a frame. Each other step
took less than a millisecond in the page.

Lifting Chromium's limit of the frame rate (`--disable-frame-rate-limit`) made the open slower, 72–73 s for 10,000
photos against 25 s in one trial of each build, as the page then drew frames all the time.

## The ways measured

Builds with a switch for the way the thumbnail is made, each opening flat folders of 2,000 and 10,000 copies of the
fixtures' five JPEGs (orientations 1, 6, 6, 1, 1; thumbnails of 160x120). The time from the mark of the tree to that
of the photos' data, the median of 5 trials of each way [and their range], the ways in turn. Other builds and tests
kept the computer busy throughout (a load average of 12 to 75 at the trials' start), so the times are longer than on
a quiet one, where the canvas took 16.7 s for 10,000 photos.

| Way | 10,000 photos | 2,000 photos | Shown, against the canvas's PNG | CPU, 10,000 photos |
| --- | --- | --- | --- | --- |
| The canvas and a PNG, as it was | 25.5 s [18.1–31.3] | 3.59 s [3.45–5.84] | – | 35.0 s |
| **The thumbnail's own JPEG, with the orientation as an EXIF tag** | **2.2 s [2.1–3.4]** | **0.46 s [0.42–0.47]** | 0.3 of 255 in the mean, at most 16–24, at edges between colours | 12.4 s |
| `toBlob(callback, 'image/webp', 1)`: lossless WebP | 10.7 s [9.9–13.2] | 2.02 s [1.78–2.74] | the same | 37.2 s |
| No canvas for orientation 1 only | 10.0 s [7.7–17.5] | 1.73 s [1.53–11.0] | as the tag, for those photos | 23.2 s |
| Four workers: `createImageBitmap()`, an OffscreenCanvas and a PNG | 11.3 s [7.5–18.1] | 1.22 s [1.12–1.33] | at most 1 of 255 | 43.3 s |
| 20 photos at a time | 21.6 s [13.4–25.6] | 3.19 s [2.73–3.64] | the same | 35.2 s |
| Lossless WebP, 20 photos at a time | 16.5 s [8.1–24.5] | 1.88 s [1.73–5.64] | the same | 39.4 s |

The CPU time is the sum of the main process's, the page's, the GPU's and the other processes', while the folder opened.
In single trials of
2,000 photos, none of these was faster than the canvas: `toBlob()` as JPEG, which also changed what is shown the most
(0.8–1.1 of 255 in the mean, at most 25), `toDataURL()`, an OffscreenCanvas on the page's thread, whose
`convertToBlob()` waits for idle time too, `createImageBitmap()` on the page's thread, and 50 photos at a time.
Chromium encodes WebP on a thread of its pool rather than in idle time, but the readback stays.

## What was chosen and built

The owner chose the thumbnail's own JPEG, with the orientation as an EXIF tag.

- `orientedJpeg()` (`src/app/shared/oriented-jpeg.ts`) reads the thumbnail's segments up to its scan, for the size in
  its frame header, and gives the thumbnail with an APP1 segment of EXIF right after its SOI that holds only the
  photo's orientation, and without any EXIF segment of its own. An img element turns a JPEG as its EXIF says
  (`image-orientation: from-image`, Chromium's default, which the application's styles leave), as do a canvas's
  `drawImage()` and `createImageBitmap()`, with which the search for faces decodes a TIFF file's thumbnail.
- `createThumbnail()` (`src/app/shared/exif-fetcher/using-exifr/fetch-exif-using-exifr.ts`) makes the object URL of
  that JPEG. A thumbnail that is not a JPEG with a frame that the page decodes (8 bits a sample; baseline, extended or
  progressive) is turned on the canvas as before.
- For each of the eight orientations, the JPEG so tagged, as an img element turns it, is the canvas's PNG to the
  pixel, for the fixtures' thumbnails (`test/src/app/shared/oriented-jpeg.spec.em.renderer.ts`).
- What the window shows differs a little, as it decodes and draws the JPEG itself, as it does any JPEG, where it drew
  the canvas's PNG of it: captured from the window at twice the size, 0.25–0.34 of 255 in the mean, at most 16–24, at
  edges between colours. No screenshot of the end-to-end tests shows a thumbnail; their cases check that the
  thumbnails load, and how they are turned.
- The thumbnails take 76 MB for 10,000 photos instead of 430 MB of PNG: 5–11 KB each instead of 35–50 KB.

### A thumbnail that the page cannot decode

The canvas found, while the folder opened, a thumbnail that the page could not decode (`rotate-failed` in the event
"Opened Folder: EXIF Read Failed"), and the photo then had no thumbnail of its EXIF data: its places showed the photo
itself, for a JPEG or a PNG, or the image that says that there is none. Nothing decodes the thumbnails while the folder
opens now, so a viewer finds such a thumbnail by its img element's error, once it shows it. It logs a warning, and
from then on every viewer of the photo shows what it showed before (`UndecodableThumbnailService` in
`src/app/photo-info-viewer/`).

### The loading dialog of a small folder

The end-to-end case "the loading-folder dialog follows the loading of the files to the end" then failed: the dialog
of the fixtures' folder closed while it still said that it collected the files. The dialog reported the progress
every 100 ms from when it was made, and the open closed it 100 ms after the photos were read (`OpenFolderService`).
With the canvas, the five photos were read 41 ms after the open started, and the dialog's first report, about 110 ms
after it, came well within those 100 ms. They are read in 14 ms now, so the first report came a few milliseconds before
their end, or after it. The open now reports the progress itself once the photos are read, and the dialog, which
first says that it collects the files, reports the progress right after that rather than 100 ms after, and then every
100 ms (`LoadingFolderProgressReporterService`). The end-to-end case checks both texts: that the dialog changes from
the first is what it is for.

## Measured after the change

`test/performance/tree-rows.mjs`, `main` at 29e965e4 (whose application is that of 25060a20, from which this change
starts) against this change, each built with `npm run build:prod`, the builds in turn, with a load average of 2.3 to
4.5. The median [and range] of 5 trials of each build for 2,000 photos and of 3 for 10,000:

| | 2,000 photos: `main` | This change | 10,000 photos: `main` | This change |
| --- | --- | --- | --- | --- |
| Opening, to the rows shown (`openMs`) | 3,796 ms [3,793–4,562] | **763 ms** [738–782] | 18,612 ms [18,460–18,627] | **3,176 ms** [3,045–3,606] |
| The rows made again (`rowsAgainMs`) | 197 ms | 205 ms | 720 ms | 717 ms |
| A checkbox (`checkboxMs`) | 29 ms | 32 ms | 89 ms | 87 ms |
| Undo (`undoMs`) | 36 ms | 33 ms | 98 ms | 103 ms |
| Scrolling: mean and longest frame | 16.7 and 19 ms | 16.7 and 19 ms | 27.3 and 67 ms | 27.4 and 52 ms |
| The page's heap (`heapMb`) | 45.1 MB | 45.3 MB | 154.2 MB | 156.7 MB |
| Listeners | 8,474 | 8,482 | 40,474 | 40,482 |
| The working set of the page's process (`processMb`) | 413 MB [327–417] | 506 MB [491–512] | 850 MB [760–859] | 1,056 MB [765–1,060] |

The eight listeners more are the img elements' error listeners of the rows that show their thumbnails.

The page's working set is larger, but not the memory that the application uses. macOS's physical footprint of each
process (its dirty memory, compressed or swapped too), once the folder was open, in two launches of each build for
2,000 photos (of the page alone) and in one or two for 10,000:

| | 2,000 photos: `main` | This change | 10,000 photos: `main` | This change |
| --- | --- | --- | --- | --- |
| The page's process | 185 and 187 MB | 195 and 205 MB | 586 and 590 MB | 573 and 586 MB |
| The main process | – | – | 642 MB | 321 MB |
| The GPU's process | – | – | 66 MB | 61 MB |

The main process keeps the thumbnails' bytes, JPEGs of 5–11 KB now rather than PNGs of 35–50 KB, so for 10,000 photos
the application took about 340 MB less. The rest of the page's working set is memory that it had freed, which macOS
takes back when it needs it: in `vmmap`, one of the regions that Chromium tags for its allocators held 100 MB (2,000
photos) to 290 MB (10,000) more resident memory than in `main`, of which 0 to 16 MB more was dirty. The open, now
quicker, leaves more garbage between its collections: the page's peak footprint was 749 MB against 691 MB for 10,000
photos.

The application was launched with `--no-sandbox` for these measurements and for the end-to-end tests run locally, in an
edit that was not committed: on the Mac used, a macOS service that had hung kept Chromium's sandboxed network service,
and so the page, from starting.

## What limits the open now

A trace of the open of 2,000 photos with the tag: the page's thread was busy for the whole photo phase, 632 ms, with
0.26 ms a photo in the tasks of the main process's replies (the chain of promises, the Blob and its URL, and the two
lines of the log of each photo, which the log no longer has), and the main process's thread for 74% of it (exifr for
206 ms; 12,064 messages of IPC, 6 a photo). 20 photos at a time did not help (3.4–4.7 s against 3.2–3.8 s for 10,000
photos, in single trials).

## Not checked

- Windows and Linux were not measured. CI runs the unit tests and the end-to-end tests there.
- The ways on a quiet computer: other builds and tests ran throughout their trials. When the load fell, the display had
  been asleep, and a hidden window then gets no frames. The measurements after the change had a load average of 2.3 to
  4.5.
- A camera's thumbnail that the page cannot decode: none of the fixtures has one. The viewer's fallback is tested with
  the img element's error.

## How it was measured

- Builds of `npm run build:prod`, with a switch at run time for the way the thumbnail is made, and the time of each
  photo's steps recorded with `performance.now()` (thrown away, not merged). Driven from the application's main
  process as Electron's entry, with `executeJavaScript`; windows hidden (`PLM_TEST_HEADLESS=1`), offline
  (`PLM_TEST_OFFLINE=1`), a new profile for each trial.
- The folders were made of APFS clones of the fixtures. The trials of the ways were taken in turn, in the opposite
  order in each round, after a round that was not counted, each once the computer was less than 45% busy for 3 s.
- The traces were read with a small decoder of Perfetto's protobuf.
- What is shown: `webContents.capturePage()` of the first thumbnails of the tree, compared channel by channel.
