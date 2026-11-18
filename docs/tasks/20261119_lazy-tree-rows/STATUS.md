# The rows of the folder tree, made lazily: status

Investigated and implemented on 2026-11-19.

## What was asked

Expanding a folder with many photos in the sidebar was sluggish. The owner
asked to try lazy loading for it, and to load the sidebar's images lazily,
perhaps with an IntersectionObserver.

## Where the time went

A folder that has its photos in it has a row for each, and each row had a
checkbox and a viewer of the photo (`src/app/photo-info-viewer/`), with its
thumbnail and three or four buttons, as soon as the folder was expanded.

Expanding a folder of 2,000 photos (copies of one JPEG of the fixtures) was
one task of about a second on the page's thread, during which the window did
nothing else. Of that, a trace gave 0.54 s to scripts, 0.17 s to layout,
0.13 s to style and 0.05 s to the 8,008 requests of the rows' images.

Builds of the tree's template without each part of a row tell what each costs,
with the same folder (8 to 16 expansions of each build, on a computer that
other work shared):

| The rows of 2,000 photos | Expanding, median | Nodes | Listeners |
| --- | --- | --- | --- |
| As they were | 954 ms | 105,228 | 30,896 |
| Without the viewer | 538 ms | 69,200 | 20,908 |
| Without the viewer and the disabled button before the checkbox | 402 ms | 59,199 | 20,908 |
| Without the viewer and the checkbox | 261 ms | 45,200 | 10,908 |
| Without the viewer, the checkbox and the button | 212 ms | 35,200 | 10,908 |

So the viewer took about 40% of the time, the checkbox about 30%, the button
about 10%, and the rest, the tree's node with the name, about 20%.

## The thumbnails were loaded lazily already

A thumbnail's `img` has `loading="lazy"`, since the viewer became a component
(`docs/tasks/20261111_photo-info-viewer-angular/`). Four seconds after the
folder of 2,000 photos opened:

| Thumbnails, by where they were | In the page | Loaded |
| --- | --- | --- |
| In the sidebar's view | 3 | 3 |
| Within 2,500 pixels below it | 10 | 5 |
| Further below | 1,987 | 0 |

Chromium loads an image whose loading is lazy from about 1,250 pixels away, in
the sidebar's pane too, which scrolls inside the window, and for the `blob:`
addresses of the EXIF thumbnails as well. Those addresses are made when the
EXIF data is read, which lazy loading cannot put off, but their images are
loaded into the page only near the view. It decodes only what it paints: an
expansion decoded four images, those in view. So the images cost little; the
rows that held them did.

## What changed

- **A photo's row makes its checkbox, with the disabled button before it, and
  its photo's thumbnail and buttons, once the row comes near the part of the
  tree that is shown**: within 1,250 pixels of the sidebar's view, where
  Chromium starts to load a lazy image. Until then, the row has the photo's
  name and shooting time, with the room of the rest, so that it is as high and
  as wide as it is with them, its name is where and as wide as it is beside the
  checkbox, and nothing moves when they are made. A row that has made them
  keeps them.
- `NearViewDirective` (`src/app/shared/near-view/`) is on every file's row. It
  has `NearViewService` watch the row, with one IntersectionObserver for all
  the rows, whose margin is around the window (its `rootMargin`) and around the
  sidebar's pane, which scrolls inside the window (its `scrollMargin`).
- Two components read it, each in its own template: the row's checkbox and
  name, now a component of their own (`DirTreeViewCheckboxAndNameComponent`,
  `src/app/directory-tree-view/dir-tree-view-checkbox-and-name/`), and the
  photo's viewer, which finds the directive of its row (a viewer of the map's
  popups has none, and shows everything at once). Until the row is near, the
  first shows the room of the button and the checkbox, and the second the
  shooting time with an empty element where the thumbnail goes and the room
  of one button.
- Every row is in the page, as before, so that what goes by the rows works as
  it did: the tree's keyboard, which focuses a row and so scrolls it into view,
  its typeahead, which reads a row's text (the name and the shooting time are
  there), the right-click menu, the selection, and a row scrolled into view.
- `test/performance/tree-rows.mjs` counts the rows rather than the viewers,
  waits for the thumbnails of the rows in view, and measures the frames while
  the sidebar scrolls.

## Why the components read whether the row is near

A row of the tree is an embedded view, which Angular gives no reactive consumer
of its own: a signal read in it has Angular check the component that the view
is in. For a row, that is the tree's own component (Angular Material's
`MatTree`), which Angular checks eagerly, and every row with it. The first
version read the row's signal in the tree's template; scrolling past the rows
of 10,000 photos then ran about 6 s of scripts in 60 frames, as every row was
checked again whenever rows came near, and the frames took 112 ms where they
took 71 before. Read in the components' own templates, the same scrolling ran
65 ms of scripts.

Angular Material's `MatCheckbox` was suspected at first, as it marks the views
above it for check whenever its `checked` changes, as when it is made checked.
A build that made a checked checkbox in the viewer, as a row came near, ran
60 ms of scripts in the same 60 frames: while Angular checks the views, it
marks them only as dirty, which, in an application without Zone.js, has no
check of the tree follow.

## What was tried and not kept

- **Angular's `@defer (on viewport)` around the viewer**, which was the first
  thing tried. With the viewer alone put off, it expanded the folder in 704 ms,
  and the viewer's own room in 680 ms. But the viewer, used in the tree only
  within `@defer`, became a chunk of its own, loaded lazily: the build's third
  lazy chunk, and from three on, Angular's builder runs a pass of Rollup over
  the chunks (`NG_BUILD_OPTIMIZE_CHUNKS`), which bundles the whole application
  differently. Its placeholder would also have had to repeat the viewer's
  layout, as a row's height depends on the font of the shooting time, which
  the viewer's own room gets by showing it.
- **Virtual scrolling** (the CDK's `cdk-virtual-scroll-viewport`), which would
  make only the rows in view. It is a bigger change: the rows are not of one
  height (a folder's row is 48 pixels high, and a photo's over 200, by the
  font of its shooting time, or 210 without one), and the tree's expansion,
  keyboard and selection go by the rows that are in the page. What is left of
  an expansion is mostly the tree's nodes themselves, about 0.1 ms each.

## Measurements

`test/performance/tree-rows.mjs`, the build of `main` before this change
(3d57628d) and the build with it, each with `npm run build:prod`, in turns,
on macOS (Apple Silicon). Other sessions built and tested on the same computer
meanwhile, more so during the trials with 10,000 photos, which took both
builds longer than an earlier series did; the medians are of interleaved
trials, with the range of the trials in parentheses.

| 2,000 photos, medians of 7 trials | Before | Now |
| --- | --- | --- |
| From the click on Open Folder to the last row, with the thumbnails in view | 5.08 s | 4.40 s |
| The rows made again: from the click that expands the folder to the thumbnails in view | 840 ms (771–885) | 344 ms (319–382) |
| A click on a checkbox, to the frame that shows it | 91 ms | 64 ms |
| Scrolling down past a hundred rows: the mean time between frames | 31.2 ms (27.2–36.2) | 16.9 ms (16.7–18.1) |
| Scrolling: the longest time between frames | 51 ms | 34 ms |
| JavaScript heap | 59.7 MB | 47.3 MB |
| Elements and other nodes of the page | 104,843 | 57,061 |
| Event listeners | 30,513 | 12,593 |
| Memory of the page's process (working set) | 477 MB | 384 MB |
| JavaScript heap after the rows were made again three times | 59.3 MB | 48.1 MB |

| 10,000 photos, medians of 3 trials | Before | Now |
| --- | --- | --- |
| From the click on Open Folder to the last row, with the thumbnails in view | 27.1 s | 23.2 s |
| The rows made again | 4.44 s (4.40–5.19) | 2.12 s (1.81–2.12) |
| A click on a checkbox, to the frame that shows it | 726 ms | 585 ms |
| Scrolling: the mean time between frames | 194 ms (144–198) | 99 ms (89–107) |
| Scrolling: the longest time between frames | 482 ms | 250 ms |
| JavaScript heap | 224 MB | 169 MB |
| Elements and other nodes of the page | 520,843 | 281,061 |
| Event listeners | 150,513 | 60,593 |
| Memory of the page's process (working set) | 1,294 MB | 737 MB |

- **The rows are made in less than half the time**, with the thumbnails of
  the rows in view. In the measurement's window, the eight rows nearest the
  top make their checkboxes, thumbnails and buttons a frame after the
  folder's rows, when the observer tells them.
- **Scrolling is smoother, not slower**, although the rows now make what they
  show as they come near: with 2,000 photos, the sidebar scrolls at the
  display's rate, a frame every 16.7 ms. What is left of the frames with
  10,000 photos is Chromium's own work for a page of so many rows, its
  compositing and painting, and its observers: on `main`, the one of the
  10,000 lazy images; now, this change's.
- **The page holds less**: a row that is far from the view has 24 nodes fewer
  and 9 listeners fewer than one that is near, and the page's process takes
  about 40% less memory with 10,000 photos. A row that has come near keeps
  what it made, so after scrolling through every row, the page holds about
  what it held before this change.

## Found on the way

- **A click on a checkbox has every row checked again**, as before this
  change: the tree's template gives each row whether it is selected, which it
  reads from a signal, in the rows' embedded views (above). With 10,000
  photos, a click took 0.64 to 0.85 s to show before this change and 0.47 to
  0.59 s with it, the map's markers included. A component of the row that read
  the selection itself would make a click check only the rows that change.
- **A row that nothing can select puts the room before its name on the wrong
  side in a language written from right to left.** The name's `bdi` element
  has `padding-inline-start`, and a `bdi` takes its direction from its text:
  for a name in Latin letters, the padding is at the left of the name in
  Arabic too, 4 pixels from where the name is in a row with a checkbox. The
  room of a checkbox in this change has those 4 pixels in itself for that
  reason. Not changed here.

## Checks

On macOS (Apple Silicon), 2026-11-19.

| Check | Result |
| --- | --- |
| `npm run lint:all` | passed |
| `npm run test:unit:ng` | 456 tests passed |
| `npm run test:unit:em:both` | 320 passed and 2 pending in the main process, 96 passed in the renderer |
| `npm run build:prod` | built, with the same lazy chunks as before |
| `npm run test:e2e` on the production build | 56 passed, 1 skipped (Windows only) |
| `npm run test:e2e` on the development build, which fails a case with a binding that changed without telling Angular: the 14 cases that look into the tree | 14 passed |

A script opened a folder of 40 photos in English, Japanese, Arabic and German,
and compared the last row, far below the view, with the first, then with
itself once scrolled into view. In each language, the row was as high (237
pixels, 237.5 in Arabic), its name was in the same place and as wide, and its
photo's viewer was as wide, before and after it made its checkbox, thumbnail
and buttons. In Arabic, this found the name 4 pixels off at first, as a `bdi`
takes its direction from its text, and the room of the checkbox has those 4
pixels in itself since.

New tests: the service and the directive of `src/app/shared/near-view/`; the
row's checkbox and name, until the row is near and once it is; the viewer of a
row that is not near; a photo's row of the tree, which makes its checkbox once
it is near. The end-to-end suite has a new case: in a folder of 40 photos, the
last row has no checkbox, thumbnail or buttons, and no thumbnail far below the
view is loaded; once scrolled into view, the row makes them, with the same
height, its name in the same place and as wide, and its viewer as big. The
case of the Sort menu reads the rows' names from their `bdi`, which a row has
whether or not it has made its checkbox.
