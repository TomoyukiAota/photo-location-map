# The photo info viewer as Angular components: status

Done on 2026-11-11.

## The question

The content that shows a photo — its thumbnail, name and shooting time, with
its buttons and their menu — was built with DOM calls (`document.createElement`,
`appendChild`, `element.style`), apart from Angular, in the folder tree and in
the map's popups. Can it be Angular components, as the rest of the application
is?

It can, and is now. The marker labels of the map are the exception, on
purpose ([below](#what-is-still-built-with-dom-calls)).

## What changed

| Before | Now |
| --- | --- |
| `PhotoInfoViewerContent`, `ThumbnailElement` and the four button classes, which built the content and kept an element per place and photo | `PhotoInfoViewerComponent` (`src/app/photo-info-viewer/`), one component for the three places that show a photo: a row of the tree, a popup of the map, a tile of a cluster's popup |
| `MoreOptionsMenuElement` and `more-options-menu-items.ts` | `MoreOptionsMenuComponent`, with where it opens in `more-options-menu-placement.ts` |
| `PhotoClusterViewer` | `PhotoClusterViewerComponent` (`src/app/photo-cluster-viewer/`) |
| The info of the regions, built in the map component | `RegionInfoComponent` (`src/app/map/leaflet-map/region-info/`) |
| `DirTreeViewPhotoInfoComponent`, which put the built content into a row and changed its styles one by one | The tree's template has `<app-photo-info-viewer>` itself |
| The elements' rotation and thumbnails, kept in the elements | `ThumbnailRotationService` and `GeneratedThumbnailService` |
| Styles in `src/styles/photo-info-viewer/` and `photo-cluster-viewer/`, for the whole page | Each component's own styles, with the layout of each place in the viewer's |

Leaflet makes a popup's and a control's element itself, and takes an element
as its content. `LeafletContentService` (`src/app/map/leaflet-map/`) makes the
component for it, outside any template, renders it at once, as Leaflet
measures the content to size the popup, and attaches it to the application so
that it follows what it shows. The map component destroys these components
when it renders the map again, which makes a new Leaflet map, and when it is
destroyed itself.

The elements have the classes that they had, so the end-to-end tests find them
as before.

## What works differently

Nothing looks different: see [Checks](#checks). These work differently.

- **A component is there only while its place shows the photo.** The built
  elements were kept until another folder was opened. A row's viewer is now
  destroyed when its folder is collapsed, and a popup's when the map is
  rendered again. What has to last is in the two services: a thumbnail stays
  turned, and a thumbnail that was made stays known.
- **A HEIF photo's thumbnail is asked about once for all the photos shown.**
  Each element asked the main process for itself, every second from a second
  after it was made. One request now asks about all the awaited thumbnails,
  at once and then every second. A thumbnail that is in the cache already is
  shown at once rather than a second late, and a folder of HEIF photos no
  longer sends a request per photo every second.
- **The buttons have no listener for a double click.** Each stopped a double
  click from reaching what is around it. Nothing around them handles one: the
  tree has no such handler, and Leaflet stops the double clicks of a popup
  itself.
- **The icons of the buttons have their tooltips as alternative texts too**, so
  that a button has a name for a screen reader.
- **"Select Only This" asks the tree's selection service itself**, not through
  the function that the page keeps for code outside Angular
  (`window.plmInternalRenderer`).
- **What was kept of the previous folder is dropped once the next folder's
  photos are read**, not when the opening starts: the previous folder is still
  shown until then, behind the loading dialog.

## What is still built with DOM calls

- **The label of a photo's marker** (`src/app/map/leaflet-map/div-icon.ts`):
  its shooting time, or its name. There is a label for every photo on the
  map, made whenever the map is rendered, tens of thousands for a large
  folder. It is a few elements of text without a listener or a state of its
  own: Leaflet handles the click on a marker, and the map component colors
  the label of the marker whose popup is open. A component would add its cost
  to each label without giving anything. Its file says so.
- **What Leaflet and Leaflet-Geoman draw themselves**: the map, its controls
  and their tooltips.

## Checks

On macOS (Apple Silicon), 2026-11-11.

### The look, before and after

A script opened a folder of nine files (JPEG with and without a location, one
with a Live Photos movie, three taken at one place, a HEIC, a PNG and a TIFF)
in the build before this change and in the build with it, and took 32
screenshots of each: every photo's row of the tree as it is and under the
pointer, a row's thumbnail turned, the menu of a photo with a location, of one
without and of the last row, a marker's popup as it opens, turned, with its
menu, opened again and in a short window, the HEIC photo's popup, and a
cluster's popup with another tile chosen, a tile under the pointer, a tile
turned and the menu open. It also recorded where each element is, and its
size, font and transform.

- In English and in Arabic, which is laid out from right to left, the
  viewer's pixels are the same in every screenshot. The screenshots that
  differ do so in the map's tiles only, which the tile server draws.
- Every element is where it was, at the size it had. Three elements that
  were made and hidden are no longer made: the name in a row of the tree, and
  a tile's small button with its icon in the rows and popups. The page has as
  many nodes as before all the same, as Angular marks the places of the parts
  that a template shows on a condition.

### Time and memory

A folder with all its photos in it has a row for each photo as soon as it is
opened, so the viewer's cost counts there. `test/performance/tree-rows.mjs`,
which is new, opens such a folder of copies of one JPEG, with the network cut,
and reads the page's memory after a garbage collection.

| 10,000 photos (two runs before, three now) | Before | Now |
| --- | --- | --- |
| From the click on Open Folder to the last row | 20.6 s | 20.4–20.5 s |
| A click on a checkbox, to the frame that shows it | 0.24–0.34 s | 0.25–0.33 s |
| The rows made again (the folder collapsed, then expanded) | 1.7–1.8 s | 1.9–2.1 s |
| Elements and other nodes of the page | 520,858 | 520,860 |
| Event listeners | 210,524 | 150,524 |
| JavaScript heap | 203 MB | 226–227 MB |
| Memory of the page's process after the open (working set) | 1,591–1,600 MB | 1,566–1,581 MB |

With 2,000 photos (three runs before, four now): 4.0 s and 4.0 s to open,
0.33–0.41 s and 0.36–0.41 s for the rows made again, 42,524 and 30,524
listeners, 56 MB and 61 MB of heap, 554–566 MB and 557–573 MB for the
process.

- A viewer costs about 2 kB more of JavaScript heap than the built content
  did, 11% of the page's heap with every row shown, and six listeners fewer.
  The memory of the whole process is the same: most of it is the thumbnails.
- The rows take about a tenth longer to be made again, as their viewers are
  made again rather than kept. In return, a collapsed folder's viewers are
  freed, where the contents built for its rows stayed in memory before.
- The heap is the same after the rows were made again three times: nothing
  leaks.

The viewer was made lighter on the way to these figures, which its comment
explains: at first it cost 4 kB more than the built content.

### Tests

| Check | Result |
| --- | --- |
| `npm run lint:all` | passed |
| `npm run test:unit:ng` | 436 tests passed |
| `npm run test:unit:em:both` | 199 passed and 2 pending in the main process, 62 passed in the renderer |
| `npm run test:e2e` on the production build, with `PLM_VISUAL=1` | 49 passed, 1 skipped (Windows only); no screenshot changed |
| `npm run test:e2e` on the development build, which fails a case with a binding that changed without telling Angular | 49 passed, 1 skipped |

New tests: the viewer in each place, its thumbnails of each kind, its
buttons and its menu; where the menu opens; the two services; the cluster's
viewer; the info of the regions; the service that makes components for
Leaflet. The end-to-end suite has a new case of the viewer in the tree and in
a popup (the buttons open the photo, its folder and its Live Photos movie; a
thumbnail stays turned while its row and its popup's content are made again;
another folder turns it back), and checks a cluster's tiles and a HEIF photo's
thumbnail in the cases that it had.

## Found on the way

- **The button of a photo's Live Photos did nothing on a file system with
  regard to case**, as those of Linux: the movie's path was given in lower
  case, where there is no file. Fixed in a pull request of its own, #684, which
  the new end-to-end case relies on: it clicks the button on Linux too.

## Questions for the owner

- **The marker labels**: left as DOM calls, for the reason above. Say so if
  they are to be a component all the same.
- **The menu's place in the page**: the menu is inside its button, as it was,
  and closes when the button loses the focus. The keyboard cannot reach its
  items, as before. A menu of Angular Material, as the tree's context menu
  is, would give that, and look a little different. Not changed here, as it is
  a change of what the user sees.
