# Inventory: how state reaches the screen today

Baseline: commit 45e0415720984d3f72e28f3c140c33a457b8a3f1 (main, 2026-11-07),
checked again on 2026-11-08 with the open pull requests #638, #639, #640 and
#642 merged into main locally: the rows hold, with the differences noted in
them.
Paths are under `src/`. The "Without Zone.js" column is the expected behavior
if only `provideZonelessChangeDetection()` replaced
`provideZoneChangeDetection()` and nothing else changed. It comes from reading
the code and must be confirmed at runtime in the zoneless stage.

Legend for "Without Zone.js":

- **by design**: a signal read by the template, a template or host listener,
  `markForCheck()` (which the `async` pipe calls and which marks every
  ancestor), or a view attachment notifies Angular.
- **manual**: an explicit `detectChanges()` refreshes that one view.
- **incidental**: the screen updates only because another component's
  notification happens to run a tick at about the same time.
- **breaks**: nothing notifies Angular; the screen stays stale.
- **unaffected**: no bound state changes.

## Counts

| Construct | Count | Where |
| --- | ---: | --- |
| Components | 27 | all `standalone: false`; 26 `ChangeDetectionStrategy.Eager`, 1 `OnPush` (`app/home`) |
| Injectables | 20 | 19 `providedIn: 'root'`, 1 plain `@Injectable()` (`AnalyticsErrorHandler`) |
| `BehaviorSubject` fields holding state | 11 | 8 services |
| `Subject` fields carrying events | 10 | 6 services |
| `.subscribe(` calls | 26 | 12 files, 3 of them inside services |
| `detectChanges()` calls | 10 | 7 components |
| `markForCheck()` calls | 0 | |
| `NgZone.run(` calls | 8 | `global-variables/plm-internal-renderer.service.ts` (7), `app/map/map/map.component.ts` (1) |
| `\| async` in templates | 9 | 4 templates |
| `signal(` | 1 | `dir-tree-view-sort-shooting-time-info.component.ts` |
| `@ViewChild` / `@Input` | 10 / 1 | |
| `[ngClass]` / `[ngStyle]` | 7 | |
| `*ngIf` / `*ngFor` / `*ngSwitch` | 0 | templates already use `@if`, `@for`, `@switch` |

## Services with shared state

| Service (`src/app/...`) | Field | Kind | Written by | Read by | Proposed |
| --- | --- | --- | --- | --- | --- |
| `shared/service/selected-photo.service.ts` | `selectedPhotos` | `BehaviorSubject<Photo[]>`, state | tree view through `setSelectedPhotos` (equality guard, selection history) | chart (subscribe), chart config (`\| async` through `map`), chart zoom/restore (`getSelectedPhotos`) | `signal<Photo[]>`; keep the guard, the history call and `getSelectedPhotos()` returning a copy |
| `shared/service/pinned-photo.service.ts` | `pinnedPhotos` | state | chart | Leaflet map and Google Maps (subscribe, then imperative rendering) | signal; the map components render inside an `effect` |
| `shared/service/open-folder.service.ts` | `isFolderOpened$` | state | `open()` | lower pane (`\| async`), home (subscribe) | signal |
| `directory-tree-view/directory-tree-view-selection.service.ts` | `selectionRequested` | command; initial `null` is skipped by the consumer | region button, popup menu, undo/redo, open-after-launch, select-within-zoom | tree view | keep as an event (`Subject<string[]>`) or a method; the state it changes becomes signals |
| `directory-tree-view/directory-tree-view-data.service.ts` | `dataReplaced` | state (tree data) | `OpenFolderService` | tree view | signal; the tree view assigns `dataSource.data` inside an `effect` |
| `directory-tree-view/dir-tree-view-sort/dir-tree-view-sort.service.ts` | `sortKey$`, `sortDirection$`, `sortConfig$` | state, persisted to user data | sort menu | sort menu (`\| async`), tree view (subscribe), data service (`.value`) | two signals and one `computed`; persist in setter methods instead of the service subscribing to itself |
| `date-time-taken-chart/config/date-time-taken-chart-config.service.ts` | `showDateUnknownPhotos`, `xAxisUnitMomentJsStr` | state | config component, chart | chart (subscribe), config template (`.value`) | signals |
| `thumbnail-generation/service/thumbnail-generation.service.ts` | `isGenerating` | state derived from the events below | itself | sidebar (`\| async`) | `computed` from one status signal |
| same | `generationStarted`, `generationProgress`, `generationDone` | events, fed by a 5 s `setInterval` | itself | status bar, home | one `signal` with phase, totals, processed count and result; keep an event only where a consumer needs the edge |
| same | `thumbnailGenerationResult` | plain field | itself | error dialog, error table | part of the status signal |
| `thumbnail-generation/status-bar/service/thumbnail-generation-status-bar.service.ts` | `closeRequested` | event | status bar close button | home | keep, or a `visible` signal owned by this service |
| `loaded-files-status-bar/service/loaded-files-status-bar.service.ts` | `visible` | state (visibility) | settings, restore, initial read | home | `signal<boolean>` initialized from the setting |
| same | `statusUpdateRequested` | event | `OpenFolderService` | status bar | `computed` counts from a photos signal in `PhotoDataService`, or keep the event and let the subscriber write signals |
| `loading-folder/progress-reporter/loading-folder-progress-reporter.service.ts` | `progressStatus` | event, fed by a 100 ms `setInterval` | itself | loading dialog | `signal<LoadingFolderProgressStatus>` set by the interval |
| `settings-dialog/service/settings-changed.service.ts` | `appearanceSettingsChanged`, `dateTimeSettingsChanged` | events raised by template listeners | settings tabs | settings dialog | keep |
| `map/leaflet-map/leaflet-map-force-render/leaflet-map-force-render.service.ts` | `forceRenderWithoutPhotoHappened` | event | home (`ngAfterViewInit`) | Leaflet map | keep |
| `shared/service/photo-data.service.ts` | `pathPhotoMap` | plain `Map`, no notification | `OpenFolderService` | many getters | optional `photos` signal so consumers can use `computed` |

`PhotoSelectionHistoryService`, `OpenAfterLaunchService`, `RestoreSettingsService`,
`WelcomeDialogAtAppLaunchService` and `AnalyticsErrorHandler` hold no
template-bound state. `PlmInternalRendererService` is in the last table.

## Components

| Component (strategy) | Template-read state and how it changes | Today | Without Zone.js | Proposed |
| --- | --- | --- | --- | --- |
| `AppComponent` (Eager) | `<router-outlet>` only | | unaffected | drop `Eager` |
| `HomeComponent` (OnPush) | `thumbnailGenerationStatusBarVisible` written in three subscriptions without notification; `loadedFilesStatusBarVisible` written in a subscription followed by `detectChanges()` | the first works because the sidebar's `isGenerating \| async` and the lower pane's `isFolderOpened$ \| async` mark the ancestors dirty at the same moments | incidental / manual | both become signals; remove `detectChanges()` |
| `SidebarUpperPaneComponent` (Eager) | `isGenerating \| async` twice | `async` pipe | by design | read the signal |
| `SidebarUpperPaneMoreOptionsComponent` (Eager) | `sortKey$ \| async`, `sortDirection$ \| async` | `async` pipe | by design | read the signals |
| `SidebarLowerPaneComponent` (Eager) | `isFolderOpened$ \| async` | `async` pipe | by design | read the signal |
| `DirectoryTreeViewComponent` (Eager) | checkbox states computed from a `SelectionModel`; `dataSource.data` set from `dataReplaced` and `sortConfig$` subscriptions; context menu position set in a template event | two `detectChanges()` calls after every programmatic or user selection change; `MatTree` renders from its data source | manual | keep the selection in a signal (for example a `Set` of selected paths) or call `markForCheck()` after model changes; assign `dataSource.data` inside an `effect` |
| `DirTreeViewPhotoInfoComponent` (Eager) | `@Input() photoPath`, read once in `ngAfterViewInit`; content is vanilla DOM | | unaffected | `input()` through the schematic |
| `DirTreeViewSortShootingTimeInfoComponent` (Eager) | `detailsOpenState` signal | signal | by design | drop `Eager` |
| `LoadingFolderDialogComponent` (Eager) | seven fields written from `progressStatus`, which a 100 ms `setInterval` feeds | Zone.js ticks after every interval callback | **breaks**: the text and progress bar would stay at "Collecting files..." | signals (or `toSignal`) |
| `MapComponent` (Eager) | `selectedMap` written from an IPC callback inside `NgZone.run`, then `detectChanges()` | manual | manual | signal; drop `NgZone` |
| `GoogleMapsComponent` (Eager) | template is static; `detectChanges()` after each render has no bound state to refresh | | unaffected | remove `detectChanges()`; render in an `effect` |
| `LeafletMapComponent` (Eager) | template is static; the overlay is toggled by direct style writes; two `detectChanges()` calls refresh nothing bound (with #638, one of them in a `finally` that hides the overlay even when rendering throws; with #639, Leaflet makes a popup's content when the popup opens) | | unaffected | remove `detectChanges()`; render in an `effect` |
| `DateTimeTakenChartComponent` (Eager) | `eChartsOption`, `isSupportedDuration`, `isSelectPhotosWithinZoomButtonVisible` written in three subscriptions and in the chart's output handlers | output handlers are template listeners; after a programmatic selection (region button, popup menu, undo/redo, `--open`) the view refreshes only because the child config's `dateUnknownPhotosCount \| async` marks the ancestors | by design for user zoom/restore; incidental otherwise | signals; `eChartsOption` as a `computed` of selected photos and the axis unit |
| `DateTimeTakenChartConfigComponent` (Eager) | `dateUnknownPhotosCount \| async`; `showDateUnknownPhotos.value` read directly by `[checked]` | the checkbox is refreshed by the next tick, not when the chart's debounced zoom handler changes the value | by design / stale until the next event (minor: the menu is closed at that time) | read the signal |
| `SelectPhotosWithinZoomComponent` (Eager) | static | | unaffected | drop `Eager` |
| `ThumbnailGenerationStatusBarComponent` (Eager) | eight fields; `generationStarted` subscription writes without notification, `generationProgress`/`generationDone` subscriptions call `detectChanges()`; `detailsVisible` toggled by a click | the start update is refreshed because the sidebar's `isGenerating \| async` marks the ancestors | incidental / manual | signals; remove `detectChanges()` |
| `ThumbnailGenerationErrorDialogComponent` (Eager) | one field set in `ngOnInit` | | unaffected | drop `Eager` |
| `ThumbnailGenerationErrorTableComponent` (Eager) | `TableVirtualScrollDataSource` with `MatSort`; filter from a `(keyup)` listener | library streams feed `CdkTable`, which calls `markForCheck()` | expected to work; verify | keep; see the library note in REPORT.md |
| `LoadedFilesStatusBarComponent` (Eager) | seven fields written in the `statusUpdateRequested` subscription, then `detectChanges()` | manual | manual | signals or `computed`; remove `detectChanges()` |
| `SettingsDialogComponent` (Eager) | `userSettingsToBeSaved` mutated in subscriptions to events that child template listeners raise; getters evaluated during change detection; `selectedTab` set by a click | the child listeners mark the dialog dirty | by design | optional: signals plus `computed` getters |
| `AppearanceSettingsComponent` (Eager) | `[(ngModel)]` and `(change)` | template events | by design | optional |
| `DateTimeSettingsComponent` (Eager) | `[(value)]` and `(selectionChange)`; `getDateTimeNow()` getter | template events | by design | optional |
| `OsSettingsComponent` (Eager) | `messageLinesAfterButtonClicked` written after an `await` inside a click handler (Windows only) | Zone.js ticks after the awaited promise | **breaks**: the confirmation lines would not appear | signal |
| `CacheSettingsComponent` (Eager) | static | | unaffected | drop `Eager` |
| `WelcomeDialogComponent` (Eager) | static `appVersion` | | unaffected | drop `Eager` |
| `AboutBoxComponent` (Eager) | static | | unaffected | drop `Eager` |
| `NoPhotosWithLocationDataDialogComponent` (Eager) | static | | unaffected | drop `Eager` |

## Changes that start outside Angular

| Source | Entry point | What it changes | Without Zone.js |
| --- | --- | --- | --- |
| Electron IPC from the main process (menus, launch record) | `ipc-renderer-setup/*.ts` → `window.plmInternalRenderer` → `PlmInternalRendererService` and `MapComponent`, each wrapped in `NgZone.run` | opens About, Settings and Welcome dialogs; undo/redo; map switch; open-after-launch | `NgZone.run` becomes a no-op. Dialogs still render: attaching a view and the dialog container's own notifications reach Angular. Undo/redo and open-after-launch end in the tree selection flow, so they inherit that flow's status. The map switch has its own `detectChanges()`. |
| Vanilla-DOM popups and controls | photo-info-viewer "Select only this" (`selectOnlyThis`), region info "Select Photos" button (`DirectoryTreeViewSelectionService.select`) | photo selection | same as the tree selection flow: tree refreshes manually, chart refreshes incidentally |
| Leaflet, Geoman, markercluster, Google Maps events | `LeafletMapComponent`, `GoogleMapsComponent` | map state and the vanilla-DOM region info only | unaffected |
| Timers | 100 ms loading progress interval; 5 s thumbnail progress interval; 1 ms Google Maps API poll; lodash `debounce`/`throttle` in map rendering, chart zoom and region changes | progress fields, pinned photos after zoom, region info | the loading dialog breaks; the thumbnail progress has `detectChanges()`; the chart config checkbox goes stale until the next event |
| Workers and awaited promises | directory tree worker, EXIF reading inside `OpenFolderService.open`, the HEIF thumbnail workers of the main process (with #640, a worker that fails still gets its log file written, so the 5 s poll ends) | photo data, tree data, status bar, thumbnail generation start | consumers are the flows above |
| `window.onresize`, Split.js | `HomeComponent` | DOM only | unaffected |
