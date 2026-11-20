# Narrow the selection down to photos with faces: status

Proposed, chosen and implemented on 2026-11-21.

## What was asked

The owner asked for a way to narrow the selection down to the photos in which faces are found, with no further
description, and for a proposal to choose from before any implementation. Faces are personal data, so whatever looks
for them has to stay on the computer.

## How the selection worked

- Only photos with a location can be selected. Every change of the selection goes through
  `SelectedPhotoService.setSelectedPhotos()` and `PhotoSelectionHistoryService`, which the Selection menu's Undo and
  Redo step through. Select Only This, Photo Taken Before and After, and Select Photos within Zoom select through
  `DirectoryTreeViewSelectionService.select()`.
- The chart's zoom does not change the selection: it pins the selected photos within it on the map.
- exifr 7.1.3 reads 9 tags of each photo in the main process, without XMP or maker notes, and the EXIF thumbnail,
  160 by 120 pixels in the iPhone JPEGs of the repository. HEIF photos have no EXIF thumbnail; the app makes one of
  400 pixels, cached in `~/.PlmCache`.

## Where faces can come from, measured

On an Apple M5, with Electron 45.3.2 (Chromium 156, Node.js 24.22). The photos: 70 freely licensed photos of
Wikimedia Commons (CC0, CC BY, CC BY-SA) and the 4 of `test/test-resources/actual-photos/`, sorted by eye into 32
with faces (12 large, 8 medium, 12 small, as on a stage or in a march), 39 without (among them 12 dogs and cats, an
eye's close-up, tattoos and a person seen from behind) and 3 with only tiny or hidden faces, left out of the counts.
They are listed in `evidence/labeled-photos.json`. No photo of the owner's was used.

### Metadata

- exifr reads the face regions of the Metadata Working Group (`mwg-rs:Regions` with `Type` Face, as Lightroom,
  digiKam, Picasa and ExifTool write them, as elements or as attributes) and Microsoft's People tags
  (`MP:RegionInfo`) from a JPEG file's XMP: 0.01 to 0.04 ms more per photo. It does not read a HEIF file's XMP, which
  is an item of its own (`mime`, `application/rdf+xml`); it reads its Exif item only.
- Cameras record the faces that their focus found in their maker notes (FacesDetected of Canon, Nikon, Sony,
  Fujifilm, Olympus, Panasonic, Pentax and others, by ExifTool's tables). exifr does not parse maker notes: each
  maker would need a parser of its own. Not used.
- ExifTool's documentation says that iPhones write face regions with Apple's extensions. This could not be checked
  on freely licensed files: Wikimedia Commons limited the downloads of original files (HTTP 429, a wait of 122 s),
  and its metadata API leaves XMP regions out. No evidence was found that Android phones write any.
- Few photos carry regions, so metadata alone would take most photos for photos without faces. It is used as a face
  found without looking.

### Detectors in the app

Photos with faces found, of 32, and photos without faces in which one was found, of 39, by the size of the image
looked at: 160 pixels is the EXIF thumbnail, 400 the HEIF thumbnail, 800 a photo decoded for the search.

| Detector | 160 px | 400 px | 800 px | One image |
| --- | --- | --- | --- | --- |
| Chromium's FaceDetector, macOS's Vision | 19, 0 | 25, 0 | 30, 0 | 3 to 5 ms |
| Chromium's FaceDetector, fast mode (Core Image) | 4, 0 | 13, 2 | 13, 2 | 3 to 7 ms |
| YuNet, score 0.8 and above | 26, 3 | 31, 2 | 31, 2 | 20 to 23 ms |
| MediaPipe's BlazeFace, short range, 0.5 and above | 15, 6 | 14, 5 | 15, 5 | 3 to 28 ms |

- YuNet's 2 were a dog's face and a chest tattoo of a statue's face. The face that both YuNet and Vision missed was
  behind a mask and sunglasses, under a rainbow umbrella. At 0.9, OpenCV's threshold in its samples, YuNet found 18
  of the 32: the faces of people farther away scored from 0.8 to 0.9.
- MediaPipe's BlazeFace is made for faces close to the camera and missed most faces of groups.
- Chromium's FaceDetector is not in Electron 45 by default: `webPreferences.enableBlinkFeatures: 'FaceDetector'`
  gives it, which item 10 of Electron's security checklist says not to do. Chromium runs macOS's Vision with it,
  Windows' `Windows.Media.FaceAnalysis.FaceDetector`, which could not be measured here, and nothing on Linux, whose
  provider is a stub ("Platform not supported for Face Detection Service").
- A native module of each OS's detector would be the same detectors, built for each OS and architecture. Not used.

### Speed and memory

- Decoding the repository's photos of 8 to 12 megapixels took 20 to 40 ms each, as long to any size: Chromium
  decodes a JPEG whole, then scales it.
- Reading, decoding at 800 pixels and looking at a photo took 42 ms with Vision (7 minutes for 10,000 photos), 18 ms
  with 4 photos at a time (3 minutes); with YuNet, 60 ms (10 minutes) and 39 ms (6.4 minutes).
- With 4 photos at a time, the page's process grew to 286 MB with Vision and 487 MB with YuNet, from 81 MB. Looking
  at photos did not grow the main process; Vision ran in it, which Electron does without a process of its own, with
  its event loop late by 6 ms at most.
- Blobs from `fetch()` stayed in the main process until the page collected its garbage: 2.2 GB after decoding 900
  photos. Decoded through img elements, the main process stayed at 161 MB.
- YuNet on the page's thread made one task of a second of 50 photos; in a worker, none.

## What was chosen

Of the options proposed (metadata only; Chromium's FaceDetector; YuNet on ONNX Runtime Web; a menu item, a filter of
the map, or marks in the tree), the owner chose the recommended one: the Selection menu's **Narrow Down to Photos with
Faces**, with YuNet, and the face regions of JPEG files' metadata, the results kept in memory only. YuNet finds faces
in the same photos on every OS, Linux too, and the tests check that on the three OSes of CI.

## What was built

- **The item** (`src-main/menu/selection-menu.ts`): after Photo Taken Before and After, enabled while a photo is
  selected. A click is tracked as the other items' are, and nothing else: nothing about the faces or how many photos
  have them is sent anywhere, the analytics included.
- **The search** (`src/app/face-search/face-search.service.ts`): it looks at the selected photos that it has not
  seen in the opened folder, then selects those with faces through `DirectoryTreeViewSelectionService.select()`, one
  step of the history. When none has a face, the selection stays and a dialog says so; a photo that cannot be looked
  at is deselected and counted. What it found is kept in memory until another folder opens, so a second time is at
  once. Cancel leaves the selection as it was.
- **The images** (`face-search-image.ts`): a JPEG or PNG file itself, decoded through an img element to 640 pixels at
  most; a HEIF file's thumbnail that the app makes, which the search waits for; a TIFF file's EXIF thumbnail.
- **The detector** (`face-detector.service.ts`, `face-detection.worker.ts`, `yunet.ts`): YuNet in a worker of the
  page, with ONNX Runtime Web 1.31.1 (`onnxruntime-web`, MIT) and its WebAssembly, which `angular.json` copies to
  `assets/face-search/`, next to the model (`src/assets/face-search/README.md`, MIT). A face is a score of 0.8 or
  more.
- **The metadata** (`src-main/face-search/face-regions.ts`): the face regions of JPEG files' XMP, read by exifr in the
  main process when the item is chosen, 100 photos a request, for the folders that the user opened.
- **What the page may do**: its Content Security Policy now lets it compile WebAssembly (`'wasm-unsafe-eval'`), start
  the workers of its build (`worker-src 'self'`) and fetch its own files (`connect-src 'self'`). `plm-file:` allows CORS
  for the page's origin, `plm-app://app`, or ng serve's in live reload, so that the page may read the pixels of the
  photos that it shows.
- **The dialog** (`face-search-dialog/`): the progress, that the faces are looked for on this computer only, and
  Cancel; then what came of the search. Its texts are in the 42 languages.

## Checked

- Unit tests of the search, the dialog and YuNet's scores; Electron-Mocha tests of the metadata's regions, the
  policy and `plm-file:`'s CORS.
- The e2e case "Narrow Down to Photos with Faces keeps selected the photos in which faces are found, as a step that
  Undo takes back", with two photos of NASA (`test/e2e/fixtures/faces/`), a JPEG with a face region in its XMP, and a
  HEIF photo.
- `test/layout/app-in-every-language.mjs` goes through the dialog while it looks and when it found none.

## Left for later

- Keeping the results on disk, only whether each photo has a face, deletable from the Settings' Cache tab, so that a
  folder opened again is not looked at again; and the item in the tree's menu of a folder.
- Looking at the photos of a folder once it opens, for those who turn it on in the settings.
- The face regions of HEIF files, which exifr does not read.
- OpenCV Zoo has published `face_detection_yunet_2026may.onnx`, the same model with an input of any size, which was
  not measured.
