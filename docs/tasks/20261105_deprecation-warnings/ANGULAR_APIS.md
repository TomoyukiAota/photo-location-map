# Angular bootstrap and animation APIs

## Findings

- `src/main.ts` is the only application import of
  `@angular/platform-browser-dynamic`. Angular's
  [replacement guidance](https://angular.dev/api/platform-browser-dynamic/platformBrowserDynamic)
  specifies `platformBrowser` from `@angular/platform-browser`. Keep the existing
  `bootstrapModule(AppModule, ...)` options, zone change detection, production
  mode, error reporting, and logging unchanged.
- The CLI handles compiler loading for JIT builds; non-CLI JIT bootstrapping
  needs `@angular/compiler` imported separately. The existing development build
  has `aot: false`, so verify development startup after changing the builder.
  Production already uses AOT.
- `BrowserAnimationsModule` occurs only in `AppModule` and the
  `DateTimeSettingsComponent` unit test. There are no application/test legacy
  `animations` definitions, `[@trigger]`/`(@trigger)` template bindings,
  `AnimationBuilder` usages, or direct `@angular/animations` imports.
  [Angular marks this module deprecated](https://angular.dev/api/platform-browser/animations/BrowserAnimationsModule).
- Installed Angular Material 22.2.5 contains no legacy animation imports or
  triggers. Its `fesm2022/_animation-chunk.mjs` checks an optional
  `ANIMATION_MODULE_TYPE` only to honor `NoopAnimations`; without this provider,
  animations remain enabled and reduced-motion preferences are still honored.
  Its package dependencies/peers do not require `@angular/animations`.
  `ng-table-virtual-scroll` and `ngx-echarts` likewise contain no legacy
  animation imports. Removal of the unused animation engine therefore preserves
  the installed components' CSS animation behavior.
- `ng-mocks` does not require either deprecated package. The existing Angular
  Karma builder's generated test entry already uses `BrowserTestingModule` and
  `platformBrowserTesting` from `@angular/platform-browser/testing`.

## Change group

1. Replace `platformBrowserDynamic()` and its import with `platformBrowser()`.
2. Remove the unused `BrowserAnimationsModule` imports/registrations in the
   application module and date/time settings test.
3. Remove direct `@angular/platform-browser-dynamic` and `@angular/animations`
   dependencies; regenerate the lockfile through npm (manifest owned by the
   coordinating agent).

No templates, styles, component behavior, or feature settings need to change.
Do not replace `BrowserAnimationsModule` with another deprecated provider.

## Build compatibility adjustment

Angular's application builder rejects top-level await when Zone.js is enabled.
The only such await loaded the remote raster-tile configuration before module
evaluation and Angular bootstrap. Replace it with the same eagerly started fetch
and an explicit readiness initializer awaited in `src/main.ts` before Angular
bootstraps. The existing exported config binding, retries, timeouts, fallback,
logging, and map choices remain intact. The only consumer reads this binding in
the map component after bootstrap. This preserves the startup dependency without
top-level await or a switch away from zone change detection.

## Status and validation

Investigation and source edits complete. No shared builds or tests have been run
by this investigation. After applying package removals, verify production build,
development startup, all Angular unit tests, and existing dialog/settings E2E
coverage. Record integrated results in `PLAN.md`.
