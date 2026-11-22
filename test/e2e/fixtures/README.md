# HEIC regression fixture

`demo.heic` is the public regression fixture from
[Photo Data Viewer](https://github.com/TomoyukiAota/photo-data-viewer/tree/3facd83ffbf2ae8c110d461481ff9223d3f8f47c/tests/e2e/fixtures).
It was generated with macOS `sips -s format heic` from the repository author's
existing public demo JPEG, sourced from revision
`2ba9ef57fd580cdabc4b26102098064e0b3c8505` of
[photo-data-viewer-resources](https://github.com/TomoyukiAota/photo-data-viewer-resources).
No private photos are used. The zero-byte HEIF files in the older directory-tree
fixtures test extension detection only; they are not decoder inputs.

`demo-with-thumbnail.heic` is the same photo, as macOS's ImageIO writes it with
the thumbnail item that an iPhone writes (`kCGImageDestinationEmbedThumbnail`):
`demo.heic` decoded and written again at half its size, 2016x1512 in a grid of
12 tiles of 512x512, quality 0.6, with its metadata and orientation, and a
thumbnail item of 320x240 turned as the photo is. `sips` writes no thumbnail
item, so `demo.heic` stands for a HEIF photo without one
(`src/app/heif-thumbnail/`). The Swift program that wrote it is
`docs/tasks/20261121_heif-thumbnails/make-heic.swift`.

`uniform-tiles.heic` is an image of one grey, 200 of 255, 1100x700, as ImageIO
writes it: in a grid of 3x2 tiles of 512x512, quality 0.6, without a thumbnail
item. Its tiles go on past the image, and at 400 pixels their edges fall
within pixels of a thumbnail, so a line between them, or what they hold past
the image, shows as pixels of another grey
(`test/src/app/heif-thumbnail/heif-image-decoding.spec.em.renderer.ts`). The
same Swift program wrote it from a PNG of that grey:
`swift make-heic.swift uniform.png uniform-tiles.heic 1 0.6 0`.

# Face fixtures

`faces/` holds two photos with faces, for the search for faces of the
Selection menu's Narrow Down to Photos with Faces (`src/app/face-search/`).
Both are photographs of NASA, in the public domain as works of the United
States government, as Wikimedia Commons hosts them:

| File | Source |
| --- | --- |
| `faces/astronaut-portrait.jpg` | [Commander Eileen Collins - GPN-2000-001177.jpg](https://commons.wikimedia.org/wiki/File:Commander_Eileen_Collins_-_GPN-2000-001177.jpg), NASA, public domain. One large face. |
| `faces/astronaut-crew.jpg` | [STS-114 crew.jpg](https://commons.wikimedia.org/wiki/File:STS-114_crew.jpg), NASA, public domain. Seven faces, smaller. |

Each was scaled from the Commons rendering of 960 pixels to 640 at its longer
side, and its metadata replaced with ExifTool: a location at the Johnson Space
Center and a date taken, made up for the tests, so that the application can
select them (only photos with a location can be). YuNet, the detector, scores
their faces 0.93 and 0.94, and the repository's own photos in
`test/test-resources/actual-photos/` at most 0.38, against the threshold of 0.8.
