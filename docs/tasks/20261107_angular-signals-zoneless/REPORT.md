# Angular signals, OnPush and zoneless: investigation results

Checked on 2026-11-07 against commit 45e0415720984d3f72e28f3c140c33a457b8a3f1
(main), and again on 2026-11-08 with the pull requests then open (#638, #639,
#640 and #642) merged into main locally: the findings hold. No application,
dependency, test or release configuration was changed.
Facts about Angular were verified in the installed packages (`@angular/core`
22.2.4, `@angular/cli` 22.2.5) and the official release notes; the articles
that prompted the investigation are listed under Sources.

## Result

The application runs on Angular 22.2 but keeps the state style it started
with: 27 NgModule-declared components, shared state in RxJS `BehaviorSubject`s,
plain fields in components, 10 manual `detectChanges()` calls, 8 `NgZone.run`
wrappers around Electron IPC callbacks, and Zone.js loaded as a polyfill. One
component uses a signal. Angular 22 made `OnPush` the default strategy for
components, renamed the old default to `Eager`, stabilized `resource`,
`httpResource` and Signal Forms, added `@Service`, and has had zoneless change
detection as the default for new applications since v21. The v22 update kept
this application's behavior unchanged by stamping `Eager` on 26 components and
keeping `provideZoneChangeDetection()`.

The migration is feasible and worth doing, in this order: shared state to
signals, every component OnPush-compatible, then remove Zone.js. The main risk
is UI that silently stops updating in flows that start outside Angular
(Electron IPC, map callbacks, timers); [INVENTORY.md](INVENTORY.md) names
them, and two flows are expected to break the moment Zone.js is removed
without other changes (the loading-folder dialog and the Windows OS settings
tab). The Angular unit tests already run without Zone.js and pass. The Angular
CLI's MCP server is usable for documentation, best practices and running
targets, but its migration planner has nothing to say about this code (see
[MCP.md](MCP.md)), so the inventory is the migration plan.

## What "the latest style" means on Angular 22.2

Verified in `node_modules` unless noted.

| Item | Status | Evidence |
| --- | --- | --- |
| Default change detection | A component without `changeDetection` is `OnPush`. `ChangeDetectionStrategy.Default` is deprecated and "due to be removed"; `Eager` is its replacement. | `ChangeDetectionStrategy` in `@angular/core` types; [22.0.0 release notes](https://github.com/angular/angular/releases/tag/v22.0.0) (breaking change "Component with undefined `changeDetection` property are now `OnPush` by default"); the `Eager` alias arrived in [21.2.0](https://github.com/angular/angular/releases/tag/v21.2.0). |
| `ng update` behavior | The v22 migration `change-detection-eager` "Adds `ChangeDetectionStrategy.Eager` to all components" so existing apps keep their behavior. It ran here in commit 19ffc6f ("Migrate Angular 22 and TypeScript 6 with preserved behavior"). | `@angular/core/schematics/migrations.json`; `git log -S ChangeDetectionStrategy.Eager`. |
| Generated components | `ng generate component` defaults `changeDetection` to `OnPush`; the only other value is `Eager`. New components in this repository are therefore OnPush while the existing 26 are Eager. | `@schematics/angular/component/schema.json`; [CLI 22.0.0 release notes](https://github.com/angular/angular-cli/releases/tag/v22.0.0). |
| Zoneless | `provideZonelessChangeDetection()` is public API since 20.2. The [zoneless guide](https://angular.dev/guide/zoneless) makes zoneless the default from v21 and tells existing apps to check that `provideZoneChangeDetection` is not used. `provideZoneChangeDetection` is not deprecated. | `@angular/core` types; `src/main.ts` passes `provideZoneChangeDetection()`; `angular.json` lists `zone.js` under the build polyfills. |
| Signals | `signal`, `computed`, `effect`, `untracked`, `linkedSignal` (public since 20.0); `resource`, `rxResource`, `httpResource` (public since 22.0); `toSignal`/`toObservable` stable; `debounced` experimental (22.0); `pendingUntilEvent` developer preview; `provideCheckNoChangesConfig` public since 21.1, with its exhaustive check labelled developer preview in the guide. | `@angular/core` and `@angular/common` types. |
| `@Service` | Stable in 22.0 as the replacement for `@Injectable({providedIn: 'root'})`, with the `injectable-to-service` schematic (alias `service`). | 22.0.0 release notes; `@angular/core/schematics/collection.json`. |
| Signal Forms | Stable in 22.0. Not relevant here: the only form binding is one `ngModel` checkbox. | 22.0.0 release notes. |
| Schematics available locally | `signals` (combines `signal-input-migration`, `signal-queries-migration`, `output-migration`), `inject-migration`, `standalone-migration`, `control-flow-migration`, `ngclass-to-class-migration`, `ngstyle-to-style-migration`, `self-closing-tags-migration`, `cleanup-unused-imports`, `router-testing-module-migration`, `injectable-to-service`, `common-to-standalone-migration`, `route-lazy-loading-migration`. | `@angular/core/schematics/collection.json`; [migrations reference](https://angular.dev/reference/migrations). |
| Official best practices | The guide bundled with the CLI (what the MCP `get_best_practices` tool returns) asks for standalone components, no explicit `OnPush`, signals for state, `input()`/`output()`/`model()`, `computed`/`linkedSignal`, `inject()`, `@Service`, class/style bindings instead of `ngClass`/`ngStyle`, and native control flow. | `@angular/cli/src/commands/mcp/resources/best-practices.md`. |

Zoneless does not require `OnPush`, but without Zone.js an `Eager` component
is not checked on every tick either. With zoneless change detection,
`ApplicationRef` always traverses in targeted mode: a tick refreshes the views
that a notification marked (`markForCheck()` marks the view and its
ancestors), and below each refreshed view its `Eager` descendants, down to the
first `OnPush` view that nothing marked; below that, only marked views are
refreshed. An `Eager` view in another root, such as an open dialog, that
nothing marked is not checked, so state changed without a notification is
never safe.

`OnPush` alone does not make a component independent of other views either.
`HomeComponent` is already `OnPush`, yet its thumbnail status bar appears only
because the `async` pipes of views below it mark it at the same moments. What
makes rendering independent of who triggers the tick is that every state
change notifies Angular, with a signal or a `markForCheck()` right after the
write. That is what the plan converts, and it is checked component by
component by reading the code: a component loses `Eager` only once its
template reads nothing but signals, inputs, `computed` values, template events
and constants (PLAN.md, "Patterns to apply"). The exhaustive no-changes check
of stage 2 is a safety net, not a proof: it misses a change that another
notification rendered before the check ran. While `Eager` components remain,
a refreshed ancestor also refreshes its `Eager` descendants, such as the lower
sidebar under `HomeComponent` when the upper sidebar marks it; once all are
`OnPush`, the default in Angular 22, an incidental refresh reaches only the
notifying view's ancestors. Converting the component's state
to signals first is what makes the switch to `OnPush` safe, because a plain
field mutated outside a template event silently stops rendering under
`OnPush`. This repository already has that trap:
every newly generated component is `OnPush` while the existing code style
writes plain fields.

## Where this application stands

- Bootstrap: `platformBrowser().bootstrapModule(AppModule, { applicationProviders: [provideZoneChangeDetection()] })`
  in `src/main.ts`; `zone.js` is the only build polyfill. The earlier note in
  [ANGULAR_APIS.md](../20261105_deprecation-warnings/ANGULAR_APIS.md) that the
  application builder rejects top-level `await` while Zone.js is enabled
  explains the readiness initializer in `main.ts`; it can stay after the
  migration.
- Components: 27, all `standalone: false`; 26 `Eager`, 1 `OnPush` (`HomeComponent`).
- Shared state: 11 `BehaviorSubject` fields in 8 services and 10 `Subject`
  fields in 6 services; 26 `.subscribe(` calls; 9 `| async` reads; 0
  `markForCheck()`; 10 `detectChanges()`; 8 `NgZone.run`.
- Templates already use `@if`/`@for`/`@switch`; 7 `[ngClass]`/`[ngStyle]`
  bindings remain; 10 `@ViewChild` and 1 `@Input` decorators.
- Lint: `eslint.config.mjs` turns off `@angular-eslint/prefer-standalone`,
  `prefer-on-push-component-change-detection` and `prefer-inject` on purpose
  ("Preserve the existing rules and NgModule/constructor-injection
  architecture"). angular-eslint 22.6 also ships `prefer-signals`,
  `no-uncalled-signals`, `prefer-signal-model` and
  `reactive-context-must-read-signal`, none enabled.
- Unit tests: the `testing` build configuration has `polyfills: []`, and
  Angular's TestBed defaults to zoneless with automatic change detection
  (`@angular/core/fesm2022/testing.mjs`: `autoDetectDefault = zonelessEnabled`;
  the root providers include `provideZonelessChangeDetectionInternal()`). The
  suite therefore already is a zoneless suite: `npm run test:unit:ng` on
  2026-11-07 passed 25 files and 37 tests in 1.3 s.

## How a change reaches the screen today, and without Zone.js

With Zone.js, every patched callback (timer, promise, DOM event, IPC event
arriving through `NgZone.run`) ends with a global application tick, which
checks every `Eager` component that is not below an unmarked `OnPush` view.
`HomeComponent`, which holds most of the application, is `OnPush`, so even
today such a tick refreshes an `Eager` component under it only when a
notification marked `HomeComponent` or that component. Without Zone.js,
Angular ticks only after one of these
notifications: a signal read by a template changed; a template or host listener
ran; `markForCheck()` was called (the `async` pipe does this, and it marks all
ancestors); `ComponentRef.setInput` ran; a view was attached. `detectChanges()`
still works: it refreshes that view and the views below it that are eligible
(its `Eager` descendants and marked `OnPush` ones, down to the first `OnPush`
view that nothing marked), not the rest of the application, so removing a
parent's call can leave its children stale too. Each such tick is targeted (see
above), so it does not check every `Eager` view. `NgZone.run` and `runOutsideAngular`
become no-ops that the guide says may stay.

Read against this application's code (details per component in INVENTORY.md):

- **By design already**: everything driven by template events (tree checkboxes,
  buttons, selects, chart zoom/restore outputs), the 9 `| async` reads, the one
  signal, the static dialogs.
- **Manual** (works, but only because of an explicit `detectChanges()`): tree
  selection, map switch from the menu, loaded-files status bar, thumbnail
  progress and completion.
- **Incidental** (works only because a sibling's `async` pipe marks the
  ancestors at the same moment): the thumbnail status bar's visibility in
  `HomeComponent`, the chart after a programmatic selection (region button,
  popup menu, undo/redo, `--open`), the status bar's "generation started" update,
  the chart config checkbox after a zoom.
- **Breaks**: the loading-folder dialog (a 100 ms interval feeds plain fields)
  and the OS settings confirmation text on Windows (written after an `await`).
- **Unaffected**: Leaflet, Geoman, markercluster, Google Maps, Split.js and
  the vanilla-DOM popups, which manipulate the DOM themselves.

The "incidental" group is the real argument for finishing the signals work
before removing Zone.js: those flows pass today's tests and would mostly pass
tomorrow's, yet one refactor of an unrelated `async` pipe would break them.

## Third-party renderer libraries

| Library | Installed | Zoneless status | Action |
| --- | --- | --- | --- |
| `@angular/material`, `@angular/cdk` | 22.2.5 | First-party. Zoneless fixes have landed across releases (dialog focus and bottom-sheet in 18.x, listbox in 19.x, virtual-scroll flicker in 20.1.3, per the [components changelog](https://github.com/angular/components/blob/main/CHANGELOG.md)); the framework's TestBed runs their tests zoneless by default. | Keep. Verify `MatTree`, `MatDialog`, `MatMenu`, `MatSort` at runtime. Adjacent cleanup: `FlatTreeControl`, `MatTreeFlattener` and `MatTreeFlatDataSource` used by the tree view are deprecated in favor of `childrenAccessor`/`levelAccessor`. |
| `ngx-echarts` | 22.0.0 | "zoneless compatibility" is listed in its 20.0.0 [changelog](https://github.com/xieziyu/ngx-echarts/blob/master/CHANGELOG.md); chart events reach the component as outputs bound in the template. | Keep. |
| `@ngx-translate/core` | 18.1.0 | Rebuilt on signals in v18 per its [migration guide](https://ngx-translate.org/getting-started/migration-guide/); the pipe and directive call `markForCheck()`. | Keep. |
| `ng-table-virtual-scroll` | 1.6.1 | Last published 2024-03-31, compiled against Angular 15.1.4 (partial compilation), peer `>=15`. It feeds `CdkTable` from CDK viewport streams, and `CdkTable` marks for check. No zoneless statement upstream. | Expected to work; verify the thumbnail error table dialog (scroll, sort, filter). Fallback: CDK virtual scroll directly, or a plain table, since this dialog is the only use. |
| Leaflet 1.9.4, markercluster, Geoman, Split.js, ECharts 6, Google Maps JS | Bundled from `node_modules` (Leaflet and its plugins through `scripts` and `styles` in `angular.json` since main ba7b832); Google Maps JS loads at runtime | Not Angular code. | Unaffected; their callbacks must write signals instead of plain fields. |
| `zone.js` | 0.16.3 (devDependency, bundled through polyfills) | Maintenance mode upstream (recorded by the dependency lifecycle audit on the branch `codex/dependency-lifecycle-audit`, which is not on main). | Removed in the zoneless stage. |

## Tests and verification

- **Unit (Vitest)**: already zoneless. After the component changes, a spec
  that mutates a plain field and then calls `fixture.detectChanges()` gets
  `ExpressionChangedAfterItHasBeenCheckedError` for an `Eager` component, but
  for an `OnPush` one the call can return with no error and a stale DOM, so
  specs assert on the DOM (PLAN.md, "Patterns to apply"); `fixture.whenStable()`
  does not wait for timers. The 21 specs under `src/` are construction checks, so
  the exposure is small.
- **Playwright (`npm run test:e2e`)**: the main regression net. It already
  asserts the welcome, about and settings dialogs, the loaded-files status bar
  text, tree selection, the region-info "Select Photos" button (a genuine
  outside-Angular flow), chart grouping/zoom/reset, the Leaflet overlay being
  hidden, and restart behavior. It does not cover the loading-dialog progress
  text, the thumbnail status bar, undo/redo, the map switch to Google Maps (needs
  an API key), the OS tab (Windows) or the error table dialog. Add the first
  three and the error table before the zoneless stage; keep the last two as
  manual checks.
- **Development builds**: enable `provideCheckNoChangesConfig({exhaustive: true, interval: 1000})`
  while rolling out; it throws for bindings that changed without a
  notification.
- **Packaging**: `npm run test:package` and the Playwright run against the
  signed macOS bundle (`PLM_PACKAGED_EXECUTABLE`) stay as they are. Removing
  Zone.js should not change pixels; a visual difference is a regression.

## Options

| Option | Summary | Assessment |
| --- | --- | --- |
| A. Keep RxJS, `Eager` and Zone.js | No work. | Diverges further from the framework default every release; new components are OnPush while existing code writes plain fields; Zone.js stays bundled. |
| B. Signals, then OnPush, then zoneless (recommended) | Convert state to signals service by service and component by component, drop `Eager`, then switch the bootstrap and remove `zone.js`. | Matches the official migration order and the bundled best practices; each step is small and testable; the unit suite is already zoneless. |
| C. Zoneless first with `markForCheck()` patches | Keep plain fields, add `markForCheck()` after each write (the MCP tool's "alternative" strategy), remove Zone.js, convert to signals later. | Fastest path to zoneless, but leaves manual change-detection calls everywhere and the same trap for new OnPush components. |
| D. Adopt `@ngrx/signals` SignalStore | NgRx 22 targets Angular 22 and TypeScript 6. | Adds a dependency for 11 pieces of state across 8 services. Plain signals in the existing services are enough; revisit if state grows. |

## Recommendation

Option B, staged as in [PLAN.md](PLAN.md). Design notes:

- **Services**: `selectedPhotos` and `pinnedPhotos` become `signal<Photo[]>`
  with the existing equality guards, history call and copy-returning getters;
  `isFolderOpened`, `isGenerating`, `showDateUnknownPhotos`, the axis unit and
  the sort key/direction become signals (a signal set to the value it already
  has notifies no one, so "a folder was opened" also stays an event);
  `sortConfig` becomes a `computed`;
  persistence of the sort settings moves into setter methods instead of the
  service subscribing to itself. One-off events (settings changed, close
  requested, force render, status update requested, generation started/done)
  may stay `Subject`s; their subscribers write signals.
- **Components**: state that the template reads and that is written anywhere
  other than a template event becomes a signal; derived values become
  `computed`; imperative rendering (Leaflet, Google Maps) moves into
  `effect`s. The `MatTree` data stays assigned synchronously when a folder
  opens: `--open` with a file selects that file right after `open()` resolves,
  which an `effect` would undo. Remove the 10 `detectChanges()`
  calls as each component converts. Then delete the `changeDetection` property
  (OnPush by default; the bundled guide says not to write `OnPush` explicitly)
  and enable `prefer-on-push-component-change-detection`, which flags any
  remaining `Eager`.
- **Zoneless switch**: `provideZonelessChangeDetection()` in `main.ts`, delete
  `zone.js` from the polyfills and from `package.json`. The `NgZone.run`
  wrappers in `PlmInternalRendererService` and `MapComponent` become no-ops and
  can be removed in the cleanup stage, which also removes the `NgZone`
  injections.
- **Keep RxJS** as a dependency; Material needs it, and the remaining
  `Subject`s are a reasonable fit for events.
- **Do not add `@ngrx/signals`** now.
- **Lint**: after the signals work, enable `no-uncalled-signals`, with typed
  linting; enable `prefer-signals` after the signal inputs and queries of
  stage 2; leave `prefer-inject` and `prefer-standalone` for the cleanup
  stage.
- **Sequencing with the remote-removal plan**: the owner decided on
  2026-11-08 that this migration goes first and the removal of
  `@electron/remote` comes after it. Both touch `PlmInternalRendererService`,
  `OpenFolderService`, the sidebar and the settings dialog, and Zone.js
  removal changes the timings that plan measures.

## Risks and limits

- The per-flow classification comes from reading the code; the zoneless stage
  must confirm it at runtime with the exhaustive no-changes check and the
  manual list above.
- Windows-only (OS settings) and Google Maps paths need manual checks on their
  platforms; the Google Maps path also needs an API key.
- `ng-table-virtual-scroll` is old and unmaintained-looking; have the fallback
  ready.
- The MCP migration planner will not guide this repository component by
  component (MCP.md), so progress tracking is the inventory table.
- `strictTemplates` is `false` (set by the v22 update). Signal reads in
  templates work either way; turning it on is a separate, optional step.
- `standalone` conversion is not needed for signals or zoneless. If it is done
  later, the Vitest configuration's JIT/NgModule TestBed setup recorded in
  [VITEST_DESIGN.md](../20261105_vitest-without-compat/VITEST_DESIGN.md)
  changes with it.

## Sources

- [Angular v22 OnPush by default](https://zenn.dev/lacolaco/articles/angular-v22-onpush-by-default)
  (Japanese; [English version](https://dev.to/lacolaco/angular-v22-introducing-changedetectionstrategyeager-and-onpush-by-default-4mof)):
  what `Eager` is, what `ng update` does, and the recommended order "signals,
  then OnPush, then zoneless".
- [Angular Signals API cheat sheet for v22](https://www.r-jc.jp/news-blog/1194/angular-signals%E4%BD%BF%E3%81%84%E6%96%B9v22%E5%AF%BE%E5%BF%9C%E3%81%AE%E5%85%A8api%E6%97%A9%E8%A6%8B%E8%A1%A8%E3%81%A8%E5%AE%9F%E8%A1%8C%E7%B5%90%E6%9E%9C%E3%81%A4%E3%81%8D%E3%82%B3%E3%83%BC%E3%83%89/)
  (Japanese, verified against 22.2.0): API list with stability, "signals for
  state, `computed` for derivation, `effect` only for outside-world work".
- [Zoneless guide](https://angular.dev/guide/zoneless), [Signals guide](https://angular.dev/guide/signals),
  [`ChangeDetectionStrategy`](https://angular.dev/api/core/ChangeDetectionStrategy),
  [Migrations](https://angular.dev/reference/migrations),
  [Angular CLI MCP server](https://angular.dev/ai/mcp).
- Release notes: [angular 22.0.0](https://github.com/angular/angular/releases/tag/v22.0.0),
  [angular 21.2.0](https://github.com/angular/angular/releases/tag/v21.2.0),
  [angular-cli 22.0.0](https://github.com/angular/angular-cli/releases/tag/v22.0.0).
- NgRx 22 for Angular 22: [InfoQ](https://www.infoq.com/news/2026/10/ngrx-22-angular/).
