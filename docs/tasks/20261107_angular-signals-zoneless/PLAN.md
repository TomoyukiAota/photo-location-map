# Migrate to signals, OnPush and zoneless Angular

## Start here

This plan moves the renderer from RxJS-subject state, `Eager` change detection
and Zone.js to signals, `OnPush` and zoneless change detection on Angular 22.2,
without changing features or appearance. It is written so that work can stop
after any step and resume later from [STATUS.md](STATUS.md), which is the
execution ledger.

The investigation behind it is complete: [REPORT.md](REPORT.md) has the
findings and the recommendation, [INVENTORY.md](INVENTORY.md) lists every
service, component and outside-Angular change source with its expected
behavior without Zone.js, and [MCP.md](MCP.md) covers the Angular CLI MCP
server. **The owner authorized the whole plan on 2026-11-08, to start once
the four pull requests named under "Boundaries" are merged** (STATUS.md,
"Current checkpoint"). Until then the plan and the ledger are the only
deliverables.

Before any implementation step: read AGENTS.md, this file and STATUS.md; run
`git status`; check that each of #638, #639, #640 and #642 is merged into
main, with the commands in STATUS.md ("Resume first action"), and stop if one
is not; make sure `mise exec -- npm ci` has run in the checkout you work in.
Keep everything in English and public-safe. Do not add a CLAUDE.md or keep
knowledge in agent memory.

## Boundaries and starting snapshot

- Planning date: 2026-11-07 (Asia/Tokyo). Investigated against main at
  45e0415720984d3f72e28f3c140c33a457b8a3f1; the branch is rebased on main at
  ba7b832d552920a1dfcd73c428e88d47343e1368. In between, main gained a headless
  e2e suite and Leaflet bundled from `node_modules`, neither of which changes
  this plan.
- Starting point: main **after all four pull requests open on 2026-11-08 are
  merged, #642 included**: #638 (a photo whose coordinates are not numbers in
  range stays off the map; `addEachMarker`; the Leaflet overlay hidden in a
  `finally`), #639 (photo content made when it is first shown;
  `generateCache` gone from `OpenFolderService.open`), #640 (why HEIF
  thumbnails failed; main process and e2e only) and #642 (e2e windows off the
  screen on Windows too). The owner wants this work to start after them.
  Checked on 2026-11-08 by merging the four into main locally: no conflicts,
  the progress counters in STATUS.md are unchanged, and the slices below name
  the differences where they touch a changed file. #642 was merged on
  2026-11-08 (4f8a496) with its Linux attempt reverted, so on Linux the
  windows are still shown. The other three can still change before they are
  merged, so stage 0.4 recounts the counters on main, and each slice re-reads
  the files it names that they changed. If one of them is closed without
  being merged, ask the owner before stage 0.
- Angular 22.2.4 (CLI 22.2.5), Angular Material/CDK 22.2.5, TypeScript 6.0.3,
  Vitest 5.1.0, Electron 45.2.1, zone.js 0.16.3, angular-eslint 22.6.0. Record
  the actually resolved versions in STATUS.md when implementation starts.
- Preserve features, UI, keyboard and menu behavior, settings paths and
  defaults, analytics events, and the e2e visual references with their
  tolerances. A visual difference is a regression to investigate, never a
  reason to update references.
- No dependency upgrades; no new state library (`@ngrx/signals` was considered
  and declined, see REPORT.md); no standalone conversion before stage 4; no
  change to the Electron main process, the IPC contract or the separate Photo
  Data Viewer.
- The removal of `@electron/remote` (its plan is written separately and is
  not on main or in an open pull request as of 2026-11-08) touches the same
  renderer services. Do not run the two in
  parallel on overlapping files; the owner decides which goes first. Removing
  Zone.js changes timings, so finish this plan before that plan freezes its
  performance baseline, or start after its final stage is accepted.
- Branches: this plan lives on `claude/angular-signals-zoneless` and reaches
  main as a documents-only pull request (CI skips the tests for it). Each
  slice below is its own branch from main and its own pull request, which also
  updates STATUS.md. Do not rewrite or squash accepted slices afterwards.

## Checkpoint discipline

Before the pull request of a slice is opened:

1. `mise exec -- npm run lint:all`, `mise exec -- npm run test:unit:all` and
   `mise exec -- npm run test:live-reload` pass.
2. `mise exec -- npm run build:prod` followed by
   `PLM_VISUAL=1 mise exec -- npm run test:e2e` passes on macOS with the
   committed references unchanged.
3. The manual checks listed with the slice were done and are recorded in
   STATUS.md with date, commit and how. A visible app window is for the owner
   (AGENTS.md, "Keep windows off the owner's screen"), so drive the checks
   with a Playwright script against the app, as the e2e suite does, which
   keeps the windows off the screen on macOS and, with #642, on Windows (see
   `test/e2e/README.md` for Linux). A check that needs a person or another
   platform (the OS tab on Windows, Google Maps with an API key) goes under
   "Questions for the owner" in STATUS.md.
4. STATUS.md is updated: slice state, commit, pull request link, test results,
   progress counters, and the next executable action. When stopping in the
   middle of a slice, record the exact next action and which files are half
   converted.

A slice is accepted when its pull request is merged. Do not branch the next
slice from an unmerged one unless STATUS.md says why.

## Patterns to apply

- State that a template reads lives in a `signal`; derived values in
  `computed`; imperative work driven by state (Leaflet and Google Maps
  rendering, `MatTree` data assignment, persistence) in an `effect`, with
  `untracked` for reads that must not become dependencies. Do not use an
  `effect` to copy one signal into another.
- Subjects are synchronous; signals and effects are not. An `effect` runs
  after the write, during the next change detection. Where today's code depends
  on a subscriber running synchronously inside the emitter's call (the chart's
  orchestration of pinned photos is the main case), keep explicit method calls
  or a `computed` instead of an `effect`, and cover the derivation with a unit
  test before converting it.
- Never mutate an array or object held by a signal; `set` a new one. Keep the
  "same paths, skip" guards in `setSelectedPhotos` and `setPinnedPhotos`; they
  protect the map from re-rendering and the tile quota.
- Keep the public method names of services (`setSelectedPhotos`,
  `getSelectedPhotos`, `select`, `open`, ...). Replace `foo$ | async` in
  templates with `foo()`, and `.value`/`.getValue()` with `()`.
- `Subject`s that carry one-off events (settings changed, close requested,
  force render) may stay; their subscribers write signals.
- A signal notifies only when its value changes (`Object.is`): `set(true)` on
  a signal that is already `true` reaches no one. A write that must reach its
  consumers every time, even with the same value, such as "a folder was
  opened", is an event: keep a `Subject` or an explicit call.
- Delete `changeDetection: ChangeDetectionStrategy.Eager` from a component once
  its template reads only signals, inputs, `computed` values, results of
  template events, or constants. `OnPush` is the default; do not write it
  explicitly. Remove the component's `detectChanges()` calls in the same change.
- `NgZone.run` wrappers stay until stage 4; they are harmless with and without
  Zone.js.
- Tests (Vitest; the TestBed is already zoneless): set signals, then
  `fixture.detectChanges()` or `await fixture.whenStable()`; a plain field
  changed without a notification throws
  `ExpressionChangedAfterItHasBeenCheckedError`. `whenStable()` does not wait
  for timers, and the tests load no `zone.js/testing` (the `testing` build
  configuration in `angular.json` has no polyfills), so `fakeAsync` and
  `tick` throw: use `vi.useFakeTimers()` or poll.
- Use the Angular CLI MCP server (`get_best_practices`, `search_documentation`)
  when in doubt about an API. Its `onpush_zoneless_migration` tool does not
  apply to this repository (MCP.md).

## Stage 0: preparation (one pull request)

Goal: the safety net and the tooling exist before any state changes.

- **0.1 MCP configuration.** Add `.mcp.json` (Claude Code) and
  `.codex/config.toml` (Codex) as given in MCP.md; verify
  `mise exec -- npx ng mcp --help`. Add at most two or three lines to AGENTS.md,
  or nothing.
- **0.2 Playwright coverage** for the flows INVENTORY.md marks as incidental
  or breaking, in `test/e2e/regression.spec.mjs`, following its helpers and
  style, non-visual, with platform limits marked the way the file already does
  (#638, #640 and #642 add three cases; the two that open a folder of their
  own through `PLM_E2E_OPEN` and `launch()` are the pattern for a and b):
  - a. loading-folder dialog: its text changes after "Collecting files..." and
    reaches "Completed loading all files" before the dialog closes (use a
    temporary folder with enough copies of the fixtures if the real one loads
    too fast to observe);
  - b. thumbnail generation status bar: appears when a folder containing
    `test/e2e/fixtures/demo.heic` opens on an empty cache, shows progress, and
    ends with "Completed generating thumbnails" (the service polls every 5 s,
    so allow about 20 s); the close button hides it;
  - c. undo/redo through `window.plmInternalRenderer.photoSelection.undo()`
    and `.redo()` after two different tree selections: checkbox states and the
    marker count follow;
  - d. thumbnail error table dialog: with a file that is not a HEIF named
    `.HEIC` (a copy of `test/test-resources/unsupported-files/Invalid Photo.JPG`,
    as the thumbnail-failure case from #640 builds its folder), the status bar
    shows "Click here to see the files with errors.", the dialog opens, and
    sorting and filtering work;
  - e. `--open` given a photo file: its parent folder opens, and the tree and
    the map have only that photo selected (the order that 1E has to keep; the
    existing `--open` case opens a folder only).
- **0.3 Lint policy** as comments in `eslint.config.mjs`, no rule changes yet:
  `prefer-signals` and `no-uncalled-signals` turn on at the end of stage 1,
  `prefer-on-push-component-change-detection` at the end of stage 2,
  `prefer-inject` and `prefer-standalone` in stage 4.
- **0.4 Baseline.** Record in STATUS.md the results of the checkpoint commands
  on the unchanged application: date, commit, counts, durations, and the
  progress counters.

Acceptance: the pull request contains 0.1 to 0.4, changes nothing under `src/`,
and CI is green on the three OSes.

## Stage 1: state to signals, in vertical slices (one pull request each)

Each slice converts a group of services together with every consumer, so the
application is consistent after each merge. The order is by risk, lowest first.
Each slice ends with unit tests for new pure derivations, the checkpoint
commands, the manual checks listed, and the STATUS.md update.

### 1A: sort settings

Files: `src/app/directory-tree-view/dir-tree-view-sort/dir-tree-view-sort.service.ts`,
`src/app/sidebar/upper-pane/more-options/sidebar-upper-pane-more-options.component.{ts,html}`,
`src/app/directory-tree-view/directory-tree-view.component.ts`.

- `sortKey$` and `sortDirection$` become signals initialized from user data;
  `sortConfig` becomes a `computed`; `setSortKey` and `setSortDirection` write
  the signal and persist it. (Today the service subscribes to itself to
  persist, which also writes the loaded value back at startup; the setters
  must leave the stored value untouched at startup.)
- Menu: `.next(...)` becomes the setter call; `| async` becomes a signal read.
- Tree view: the `sortConfig$` subscription becomes an `effect` that re-sorts
  and reassigns `dataSource.data`; the `.value` read becomes `sortConfig()`.

Manual checks: sort by name and by shooting time, ascending and descending;
the checkmarks in the menu; the order survives a restart; the "Sort By
Shooting Time" dialog and its details toggle.

### 1B: folder-open state, loaded-files status bar, home visibility

Files: `src/app/shared/service/open-folder.service.ts`,
`src/app/sidebar/lower-pane/sidebar-lower-pane.component.html`,
`src/app/home/home.component.{ts,html}`,
`src/app/loaded-files-status-bar/service/loaded-files-status-bar.service.ts`,
`src/app/loaded-files-status-bar/component/loaded-files-status-bar.component.{ts,html}`,
`src/app/shared/service/photo-data.service.ts`.

- `isFolderOpened$` becomes `isFolderOpened = signal(false)`, which the lower
  pane reads. Home also hides the thumbnail status bar on every open, the
  second one included, and `set(true)` again notifies no one (see "Patterns
  to apply"): `open()` raises a `folderOpened` event (`Subject<void>`) where
  it sets the signal, and Home subscribes to that.
- `LoadedFilesStatusBarService.visible` becomes a `signal<boolean>` initialized
  from the setting; keep `setVisibility` and `restoreVisibilityToSettingValue`;
  `setInitialVisibility` goes away if the initial value comes from the signal.
- `PhotoDataService` exposes `photos = signal<Photo[]>([])`, set inside
  `update()`; the status bar's seven fields become one `computed` of it;
  `statusUpdateRequested` and `updateStatus()` go away. (The counts then
  appear slightly earlier, while the modal loading dialog is still open, which
  is not visible.)
- With #639 merged, `open()` no longer calls
  `PhotoInfoViewerContent.generateCache`; the `sleep(100)` that lets the modal
  dialog repaint stays.
- Home: `loadedFilesStatusBarVisible` reads the service signal in the template;
  `thumbnailGenerationStatusBarVisible` becomes a signal written by the same
  three handlers (the folder-open one now from `folderOpened`) until 1D moves
  it to a service.
- Remove `detectChanges()` in `HomeComponent` and `LoadedFilesStatusBarComponent`.

Manual checks: status bar text after opening a folder; "Show Status Bar" in
Settings toggles it live, Cancel restores it, Save keeps it, and it survives a
restart; opening a second folder hides the thumbnail status bar left from the
first.

### 1C: loading-folder progress

Files: `src/app/loading-folder/progress-reporter/loading-folder-progress-reporter.service.ts`,
`src/app/loading-folder/dialog/loading-folder-dialog.component.{ts,html}`.

- `progressStatus` becomes `status = signal<LoadingFolderProgressStatus>(initial)`
  updated by the 100 ms interval (a signal write every 100 ms costs what the
  Zone.js tick costs today); the dialog reads `status()` and derives the
  progress-bar mode with a `computed`.

Manual checks: the three phases of the dialog while a large folder loads.

### 1D: thumbnail generation

Files: `src/app/thumbnail-generation/service/thumbnail-generation.service.ts`,
`src/app/thumbnail-generation/status-bar/service/thumbnail-generation-status-bar.service.ts`,
`src/app/thumbnail-generation/status-bar/component/thumbnail-generation-status-bar.component.{ts,html}`,
`src/app/thumbnail-generation/error-dialog/thumbnail-generation-error-dialog.component.ts`,
`src/app/thumbnail-generation/error-dialog/table/thumbnail-generation-error-table.component.ts`,
`src/app/sidebar/upper-pane/sidebar-upper-pane.component.html`,
`src/app/home/home.component.{ts,html}`.

- One `status` signal in the service: phase (`idle`, `generating`, `done`),
  totals, processed count, percent and result; `isGenerating` becomes a
  `computed`; `generationStarted`, `generationProgress` and `generationDone`
  go away unless a consumer needs the edge.
- The status bar reads the signal; `detailsVisible` becomes a signal; remove
  its two `detectChanges()` calls.
- Visibility: a `visible` signal in `ThumbnailGenerationStatusBarService`, set
  true when generation starts and false on close and on every folder open, by
  explicit calls or the `folderOpened` event from 1B rather than derived from
  `isFolderOpened`; Home reads it (replacing the interim signal from 1B), and
  `closeRequested` goes away, as does `folderOpened` if nothing else uses it.
- Sidebar: `isGenerating | async` becomes `isGenerating()`.

Manual checks: open a folder with HEIC files on an empty cache; progress,
completion, the details toggle, the close button, "Open Folder" disabled while
generating; a corrupt HEIC leads to the error dialog.

### 1E: photo selection, pinned photos, chart, maps

The largest slice. Split it into 1E-1 (services, tree, maps) and 1E-2 (chart,
chart config) if the first part is stable on its own.

Files: `src/app/shared/service/selected-photo.service.ts`,
`src/app/shared/service/pinned-photo.service.ts`,
`src/app/directory-tree-view/directory-tree-view-selection.service.ts`,
`src/app/directory-tree-view/directory-tree-view-data.service.ts`,
`src/app/directory-tree-view/directory-tree-view.component.{ts,html}`,
`src/app/map/leaflet-map/leaflet-map.component.ts`,
`src/app/map/google-maps/google-maps.component.ts`,
`src/app/date-time-taken-chart/date-time-taken-chart.component.{ts,html}`,
`src/app/date-time-taken-chart/config/date-time-taken-chart-config.service.ts`,
`src/app/date-time-taken-chart/config/date-time-taken-chart-config.component.{ts,html}`.

- `selectedPhotos` and `pinnedPhotos` become `signal<Photo[]>([])`; the
  setters keep the path-equality guards and the history call; the getters keep
  returning a copy.
- `selectionRequested` becomes a `Subject<string[]>` (drop the `null` initial
  value and the consumer's null check); no late subscriber needs the last value.
- `dataReplaced` stays a synchronous event, as a `Subject<NestedNode[]>` (the
  tree view is rendered from the start, so it needs no initial value), and the
  tree view keeps handling it in its subscription. When `open()` resolves, the
  tree must be built and all photos selected: `OpenAfterLaunchService` then
  resets the history and selects the file given with `--open` (stage 0.2 e).
  An `effect` would build the tree only after that, so the file would be
  looked up in the previous tree, and the effect would then select all photos.
- Tree selection: keep the `SelectionModel` but expose a signal the template
  depends on (a `Set` of selected paths, or a version counter bumped after
  every model change) so that `isSelected`, `allDescendantsSelected` and
  `partOfDescendantsSelected` re-evaluate; remove the two `detectChanges()`
  calls. If that is awkward, `markForCheck()` after each model change is the
  fallback.
- Maps: the `pinnedPhotos` subscriptions become `effect`s created in
  `ngAfterViewInit` with `{injector}` (the overlay element and the map
  container must exist); remove the four `detectChanges()` calls;
  `forceRenderWithoutPhotoHappened` stays a `Subject`. With #638,
  `renderMapWithDebouncing` hides the overlay in a `finally` and
  `addEachMarker` keeps one bad photo from emptying the map: keep both. With
  #639, Leaflet makes a popup's content when the popup opens, outside Angular:
  nothing to convert.
- Chart: extract the x/y binning into a pure function with unit tests;
  `eChartsOption` and `isSupportedDuration` become `computed` from
  `selectedPhotos()` and the x-axis unit; `isSelectPhotosWithinZoomButtonVisible`
  becomes a signal. The orchestration of pinned photos (selected photos, "show
  date-unknown photos", the zoom window) stays explicit method calls in the
  order it has today; deriving it with a `computed` is a stage 4 option.
- Chart config: `showDateUnknownPhotos` and the axis unit become signals;
  `dateUnknownPhotosCount` becomes a `computed`; `.value` and `| async` go away.

Manual checks: the selection matrix in STATUS.md (tree checkboxes including
folders and the indeterminate state, context menu, popup "Select only this",
region "Select Photos", cluster popups, chart zoom and "Select Photos within
Zoom", reset, x-axis unit, date-unknown checkbox, undo/redo, `--open`).

### 1F: settings dialog, OS settings, map switch

Files: `src/app/settings-dialog/settings-dialog.component.{ts,html}`,
`src/app/settings-dialog/os-settings/os-settings.component.{ts,html}`,
`src/app/map/map/map.component.{ts,html}`.

- `OsSettingsComponent.messageLinesAfterButtonClicked` becomes a signal.
- `MapComponent.selectedMap` becomes a signal; remove `detectChanges()`; keep
  `NgZone.run` until stage 4.
- Settings dialog: `userSettingsToBeSaved` becomes a signal holding a new
  object per change, `isAppRestartRequired` and `isSaveButtonEnabled` become
  `computed`, `selectedTab` a signal. Optional here, required before stage 2.

Manual checks: Save enabled only after a change; the restart notice; Cancel
restores the status bar; the OS tab on Windows; the map switch from the menu.

Stage 1 exit: `grep -rnF "new BehaviorSubject" src --include='*.ts'` and
`grep -rnF "| async" src --include='*.html'` return nothing; the event
`Subject`s that remain are the ones this plan keeps; `prefer-signals` and
`no-uncalled-signals` are enabled in `eslint.config.mjs` and pass.

## Stage 2: OnPush everywhere (one or two pull requests)

- **2.1** Run `ng generate @angular/core:signals` (signal inputs, queries and
  outputs) and review: `DirTreeViewPhotoInfoComponent.photoPath` becomes
  `input()`; the ten `@ViewChild` fields become `viewChild()` or
  `viewChild.required()`; the `{static: true}` queries read in `ngOnInit` work
  as required signal queries.
- **2.2** Add `provideCheckNoChangesConfig({exhaustive: true, interval: 1000})`
  to the bootstrap for development builds only (`AppConfig.production` is
  false), so that a binding that changes without a notification throws
  `ExpressionChangedAfterItHasBeenCheckedError` during the manual checks.
- **2.3** Delete `changeDetection: ChangeDetectionStrategy.Eager` and the then
  unused import in groups: dialogs and static components first, then sidebar
  and status bars, then tree, maps and chart; run the checkpoint and the manual
  checks after each group. Update the two test doubles in
  `src/app/map/map/map.component.spec.ts` the same way.
- **2.4** Optional: `ng generate @angular/core:ngclass-to-class` for the seven
  `[ngClass]`/`[ngStyle]` bindings.
- **2.5** Enable `@angular-eslint/prefer-on-push-component-change-detection`
  (its default `allowExplicitOnPush` is fine) and remove the comment-only
  policy from 0.3.

Stage 2 exit: `grep -rn "ChangeDetectionStrategy" src --include='*.ts'` finds
nothing outside spec doubles that need a host; the `detectChanges()` count is
0; the exhaustive check raised nothing during the manual list.

## Stage 3: remove Zone.js (one pull request)

- **3.1** `src/main.ts`: `provideZonelessChangeDetection()` replaces
  `provideZoneChangeDetection()`. Keep the readiness initializer for the raster
  tile configuration; the top-level `await` restriction it worked around no
  longer applies, but reverting it is not needed.
- **3.2** `angular.json`: remove `zone.js` from the `build` target's
  `polyfills` (the `testing` configuration already has `[]`).
- **3.3** `package.json`: remove `zone.js` from devDependencies;
  `mise exec -- npm install` updates the lockfile; `mise exec -- npm ls zone.js`
  must be empty.
- **3.4** Verify: the checkpoint commands; `grep -rl "zone.js" dist/*.js`
  lists nothing after `npm run build:prod`; the complete manual list in
  STATUS.md on macOS, and on Windows for the OS tab; Google Maps with an API
  key; `mise exec -- npm run test:package`; the Playwright run against the
  signed macOS bundle (`PLM_PACKAGED_EXECUTABLE`, see `test/e2e/README.md`).
  The on-demand Intel macOS CI job is not required by the AGENTS.md rule (no
  native code or Electron change) but is cheap insurance before merging.
- **3.4b Error recording.** With Zone.js, an unhandled promise rejection in
  the renderer reaches `AnalyticsErrorHandler` wrapped as "Uncaught (in
  promise)" and the window's `unhandledrejection` listener
  (`recordErrorsOutsideAngular`), and `recordUnhandledError` records it once.
  Without Zone.js only the listener sees it, unwrapped, and
  `unwrapPromiseRejection` in `src-shared/analytics/record-error.ts` passes it
  through. Verify that such an error is still recorded once with the same
  label, and update the comments in those two files that describe Zone.js.
- **3.5** Keep `provideCheckNoChangesConfig` in development builds; decide in
  stage 4 whether it stays permanently.

Stage 3 exit: `zone.js` is absent from `package.json`, `angular.json`, the
lockfile and the bundle; CI is green on the three OSes; STATUS.md records the
manual checks with dates.

## Stage 4: cleanup (optional, one pull request each)

- Remove `NgZone` from `PlmInternalRendererService` and `MapComponent`; the
  `NgZone.run` wrappers are no-ops by then.
- `ng generate @angular/core:inject`, then enable `prefer-inject`.
- `ng generate @angular/core:service` (`@Injectable({providedIn: 'root'})` to
  `@Service`).
- `ng generate @angular/core:router-testing-module-migration`.
- Material tree: `childrenAccessor`/`levelAccessor` instead of the deprecated
  `FlatTreeControl`, `MatTreeFlattener` and `MatTreeFlatDataSource`.
- Derive pinned photos with a `computed` (see 1E) if the explicit orchestration
  proves hard to follow.
- Standalone migration (`ng generate @angular/core:standalone`, then
  `cleanup-unused-imports`) and `prefer-standalone`; this changes the Vitest
  TestBed setup described under `docs/tasks/20261105_vitest-without-compat/`.
- Try `strictTemplates: true` in `src/tsconfig.app.json` and
  `src/tsconfig.spec.json`.
