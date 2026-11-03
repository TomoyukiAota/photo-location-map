# Version inventory and candidate decisions

Research date: 2026-11-01 (Asia/Tokyo). Baseline: `911dd91bf8de231a40be55f80e0255f053bbc4e3`.

**Dated research inventory.** Implementation has since started; see
[STATUS.md](./STATUS.md) and
[evidence/IMPLEMENTED_VERSIONS.json](./evidence/IMPLEMENTED_VERSIONS.json) for
actual verified checkpoints. This table retains the original candidate decisions.
On 2026-11-01 the user selected Angular 22 and accepted macOS 13+ as the minimum.
The selected targets below match Photo Data Viewer's Node/npm (the original
Path M). Angular 21 is an intermediate migration checkpoint only. The registry
snapshot preserves the original Path L/M comparison as historical evidence;
it does not represent an unresolved choice. See [PLAN.md](./PLAN.md).

Registry `latest` is not always the highest stable version. Builder/updater have
newer non-prerelease versions on the `v26` channel. Conversely, electron-reload's
`latest` is an alpha and is excluded. Exact metadata and peer constraints are in
[registry-snapshot.json](./evidence/registry-snapshot.json).

## Runtimes

| Item | Current | Selected target |
| --- | --- | --- |
| Development/CI Node.js | 20.16.0 (EOL) | 26.13.0 LTS |
| Bundled npm | 10.8.1 | 11.20.0 |
| Temporary bridge | Not applicable | Node 22.23.4 / npm 10.9.9 |
| App Electron | 32.0.2 | 45.2.1, with accepted macOS 13+ minimum |
| App embedded Node | 20.16.0 in Electron 32 | 24.22.1 in Electron 45 |
| App Chromium | 128.0.6613.84 in Electron 32.0.2 | 156.0.8078.75 |

Development Node, Electron's Node, and GitHub Actions' internal Node are separate.
Do not try to install npm inside Electron or force their versions to match.

## Direct dependencies (all 102)

A target equal to the current version usually means no newer stable version exists.
It does not mean actively maintained or guaranteed compatible. Lower versions or
removal require evidence and a recorded reason; do not silently skip a difficult package.

### Runtime dependencies (24)

Renderer libraries in devDependencies are bundled into the shipped app.

| Package | Current | Selected candidate | Reason / gate |
| --- | --- | --- | --- |
| `@electron/remote` | 2.1.2 | 2.1.3 | Candidate; verify relevant usage. |
| `async` | 3.2.6 | 3.2.6 | Already latest stable; retain unless a demonstrated blocker requires replacement. |
| `commander` | 12.1.0 | 15.0.0 | Candidate; verify relevant usage. |
| `delete-empty` | 3.0.0 | 3.0.0 | Already latest stable; retain unless a demonstrated blocker requires replacement. |
| `directory-tree` | 2.3.1 | 3.6.0 | Check returned object shape, ordering, recursion, permissions and large trees. |
| `electron-unhandled` | 4.0.1 | 6.0.0 | ESM/initialization and process-specific loading must be verified. |
| `electron-updater` | 6.3.4 | 6.8.12 | Stable v26 channel is ahead of latest dist-tag; use exact version, verify distribution. |
| `electron-window-state` | 5.0.3 | 5.0.3 | Already latest stable; retain unless a demonstrated blocker requires replacement. |
| `exifr` | 7.1.3 | 7.1.3 | Already latest stable; retain unless a demonstrated blocker requires replacement. |
| `fs-extra` | 11.1.0 | 11.4.1 | Candidate; verify relevant usage. |
| `heic-decode` | 2.0.0 | 2.1.0 | Resolve libheif-js 1.23.5 through compatible ^1.19.8 range; HEIC regression gate. |
| `is-natural-number` | 4.0.1 | 4.0.1 | Already latest stable; retain unless a demonstrated blocker requires replacement. |
| `is-number` | 7.0.0 | 7.0.0 | Already latest stable; retain unless a demonstrated blocker requires replacement. |
| `jimp` | 0.16.2 | 1.6.1 | New export/constructor/resize API; preserve thumbnail pixels and quality. |
| `jpeg-js` | 0.4.4 | 0.4.4 | Already latest stable; retain unless a demonstrated blocker requires replacement. |
| `lodash` | 4.17.21 | 4.18.1 | Candidate; verify relevant usage. |
| `moment-duration-format` | 2.3.2 | 2.3.2 | Already latest stable; retain unless a demonstrated blocker requires replacement. |
| `moment-timezone` | 0.5.40 | 0.6.6 | Timezone data changes can change historical timestamps; compare outputs. |
| `physical-cpu-count` | 2.0.0 | 2.0.0 | Already latest stable; retain unless a demonstrated blocker requires replacement. |
| `promise.allsettled` | 1.0.6 | 1.0.7 | No obvious active reference initially; check reachability before optional removal. |
| `rage-edit` | 1.2.0 | 1.2.0 | Already latest stable; retain unless a demonstrated blocker requires replacement. |
| `tiny-worker` | 2.3.0 | 2.3.0 | No obvious active reference initially; check reachability before optional removal. |
| `uuid` | 9.0.0 | 14.0.3 | ESM/initialization and process-specific loading must be verified. |
| `workerpool` | 6.3.1 | 10.0.3 | Worker mode, paths, concurrency, failures and shutdown must stay equivalent. |

### Build, renderer and test dependencies (78)

Renderer libraries in devDependencies are bundled into the shipped app.

| Package | Current | Selected candidate | Reason / gate |
| --- | --- | --- | --- |
| `@amplitude/analytics-browser` | 1.6.7 | 2.49.0 | Preserve events, batching, disabled state; reject new default autocapture/session behavior. |
| `@angular-builders/custom-webpack` | 18.0.0 | 22.0.1 | Coupled framework/build/lint group; see staged matrix. |
| `@angular-devkit/build-angular` | 18.2.4 | 22.2.5 | Coupled framework/build/lint group; see staged matrix. |
| `@angular-eslint/builder` | 18.3.1 | 22.6.0 | Coupled framework/build/lint group; see staged matrix. |
| `@angular-eslint/eslint-plugin` | 18.3.1 | 22.6.0 | Coupled framework/build/lint group; see staged matrix. |
| `@angular-eslint/eslint-plugin-template` | 18.3.1 | 22.6.0 | Coupled framework/build/lint group; see staged matrix. |
| `@angular-eslint/schematics` | 18.3.1 | 22.6.0 | Coupled framework/build/lint group; see staged matrix. |
| `@angular-eslint/template-parser` | 18.3.1 | 22.6.0 | Coupled framework/build/lint group; see staged matrix. |
| `@angular/animations` | 18.2.4 | 22.2.4 | Coupled framework/build/lint group; see staged matrix. |
| `@angular/cdk` | 18.2.4 | 22.2.5 | Coupled framework/build/lint group; see staged matrix. |
| `@angular/cli` | 18.2.4 | 22.2.5 | Coupled framework/build/lint group; see staged matrix. |
| `@angular/common` | 18.2.4 | 22.2.4 | Coupled framework/build/lint group; see staged matrix. |
| `@angular/compiler` | 18.2.4 | 22.2.4 | Coupled framework/build/lint group; see staged matrix. |
| `@angular/compiler-cli` | 18.2.4 | 22.2.4 | Coupled framework/build/lint group; see staged matrix. |
| `@angular/core` | 18.2.4 | 22.2.4 | Coupled framework/build/lint group; see staged matrix. |
| `@angular/forms` | 18.2.4 | 22.2.4 | Coupled framework/build/lint group; see staged matrix. |
| `@angular/language-service` | 18.2.4 | 22.2.4 | Coupled framework/build/lint group; see staged matrix. |
| `@angular/material` | 18.2.4 | 22.2.5 | Coupled framework/build/lint group; see staged matrix. |
| `@angular/platform-browser` | 18.2.4 | 22.2.4 | Coupled framework/build/lint group; see staged matrix. |
| `@angular/platform-browser-dynamic` | 18.2.4 | 22.2.4 | Coupled framework/build/lint group; see staged matrix. |
| `@angular/router` | 18.2.4 | 22.2.4 | Coupled framework/build/lint group; see staged matrix. |
| `@electron/notarize` | 2.4.0 | 3.1.2 | Candidate; verify relevant usage. |
| `@ngx-translate/core` | 14.0.0 | 18.1.0 | Update together; loader/provider API and text/fallback timing checks. |
| `@ngx-translate/http-loader` | 7.0.0 | 18.1.0 | Update together; loader/provider API and text/fallback timing checks. |
| `@stylistic/eslint-plugin` | 2.8.0 | 5.10.0 | Migrate both lint configs; preserve rules. Plugin peers admit ESLint 10 here. |
| `@turf/turf` | 6.5.0 | 7.4.0 | Candidate; verify relevant usage. |
| `@types/async` | 3.2.24 | 3.2.26 | Candidate; verify relevant usage. |
| `@types/delete-empty` | 3.0.2 | 3.0.5 | Candidate; verify relevant usage. |
| `@types/fs-extra` | 9.0.13 | 11.0.4 | Candidate; verify relevant usage. |
| `@types/is-natural-number` | 4.0.1 | 4.0.4 | Candidate; verify relevant usage. |
| `@types/is-number` | 7.0.3 | 7.0.5 | Candidate; verify relevant usage. |
| `@types/jasmine` | 5.1.4 | 7.0.0 | Test runner group; verify assertions/adapters before selecting final maximum. |
| `@types/leaflet` | 1.9.0 | 1.9.22 | Candidate; verify relevant usage. |
| `@types/leaflet.markercluster` | 1.5.1 | 1.5.6 | Candidate; verify relevant usage. |
| `@types/lodash` | 4.14.191 | 4.17.27 | Candidate; verify relevant usage. |
| `@types/mixpanel-browser` | 2.38.0 | Remove after verification | Latest package is a stub; updated library supplies types. |
| `@types/moment-duration-format` | 2.2.3 | 2.2.7 | Candidate; verify relevant usage. |
| `@types/node` | 22.5.5 | 24.19.2 | Match target Electron Node 24 APIs; 26.6.6 is not the app-runtime target. |
| `@types/promise.allsettled` | 1.0.3 | 1.0.6 | No obvious active reference initially; check reachability before optional removal. |
| `@types/uuid` | 9.0.0 | Remove after verification | Latest package is a stub; updated library supplies types. |
| `@types/webpack` | 5.28.0 | 5.28.5 | 5.28.5 if retained; remove if webpack bundled types fully replace it. |
| `@types/workerpool` | 6.1.1 | Remove after verification | Latest package is a stub; updated library supplies types. |
| `@typescript-eslint/eslint-plugin` | 8.6.0 | 8.72.1 | Candidate; verify relevant usage. |
| `@typescript-eslint/parser` | 8.6.0 | 8.72.1 | Candidate; verify relevant usage. |
| `chai` | 4.3.7 | 6.3.0 | ESM/initialization and process-specific loading must be verified. No active reference found initially; removal may be preferable after reachability check. |
| `comlink` | 4.3.1 | 4.4.2 | Candidate; verify relevant usage. |
| `cross-env` | 7.0.3 | 10.1.0 | Candidate; verify relevant usage. |
| `echarts` | 5.4.3 | 6.1.0 | v6 changes appearance; v5 theme + explicit compatibility settings + visual comparison. |
| `electron` | 32.0.2 | 45.2.1 | macOS 13+ accepted; verify embedded Node 24.22.1 / Chromium 156. |
| `electron-builder` | 24.13.3 | 26.18.1 | Stable v26 channel is ahead of latest dist-tag; use exact version, verify distribution. |
| `electron-mocha` | 12.3.1 | 13.1.0 | Test runner group; verify assertions/adapters before selecting final maximum. |
| `electron-reload` | 1.5.0 | 1.5.0 | Latest dist-tag is 2.0.0-alpha.1; stable policy excludes it. |
| `eslint` | 8.57.0 | 10.14.0 | Migrate both lint configs; preserve rules. Plugin peers admit ESLint 10 here. |
| `espower-typescript` | 10.0.1 | 10.0.1 | No newer stable release; test compatibility and assess maintenance/transitive issues. |
| `exif-parser` | 0.1.12 | 0.1.12 | Already latest stable; retain unless a demonstrated blocker requires replacement. |
| `jasmine-core` | 5.2.0 | 7.0.2 | Test runner group; verify assertions/adapters before selecting final maximum. |
| `jsonc-parser` | 3.3.1 | 3.3.1 | Already latest stable; retain unless a demonstrated blocker requires replacement. |
| `karma` | 6.4.4 | 6.4.4 | No newer stable release; test compatibility and assess maintenance/transitive issues. |
| `karma-coverage-istanbul-reporter` | 3.0.3 | 3.0.3 | No newer stable release; test compatibility and assess maintenance/transitive issues. |
| `karma-electron` | 7.3.0 | 7.3.0 | No newer stable release; test compatibility and assess maintenance/transitive issues. |
| `karma-jasmine` | 5.1.0 | 5.1.0 | No newer stable release; test compatibility and assess maintenance/transitive issues. |
| `karma-jasmine-html-reporter` | 2.1.0 | 2.3.0 | Candidate; verify relevant usage. |
| `karma-mocha-reporter` | 2.2.5 | 2.2.5 | No newer stable release; test compatibility and assess maintenance/transitive issues. |
| `mixpanel-browser` | 2.45.0 | 2.84.0 | Preserve events, batching, disabled state; reject new default autocapture/session behavior. |
| `ng-mocks` | 14.13.1 | 14.18.4 | Candidate; verify relevant usage. |
| `ng-table-virtual-scroll` | 1.6.1 | 1.6.1 | No newer published version; open peers do not prove 21/22 behavior. Test actual table. |
| `ngx-echarts` | 15.0.3 | 22.0.0 | Match Angular major; chart behavior and rendering gate. |
| `npm-check` | 6.0.1 | 6.0.1 | No newer stable release; test compatibility and assess maintenance/transitive issues. |
| `npm-run-all` | 4.1.5 | 4.1.5 | No newer stable release; test compatibility and assess maintenance/transitive issues. |
| `p-queue` | 6.6.2 | 10.0.0 | ESM/initialization and process-specific loading must be verified. |
| `power-assert` | 1.6.1 | 1.6.1 | No newer stable release; test compatibility and assess maintenance/transitive issues. |
| `rxjs` | 7.8.1 | 7.8.2 | Candidate; verify relevant usage. |
| `split.js` | 1.6.5 | 1.6.5 | Already latest stable; retain unless a demonstrated blocker requires replacement. |
| `tree-kill` | 1.2.2 | 1.2.2 | Already latest stable; retain unless a demonstrated blocker requires replacement. |
| `tslib` | 2.7.0 | 2.9.1 | Candidate; verify relevant usage. |
| `typescript` | 5.5.4 | 6.0.3 | Registry latest 7.0.2 is outside Angular and typescript-eslint peer ranges. |
| `wait-on` | 7.0.1 | 9.5.1 | Candidate; verify relevant usage. |
| `zone.js` | 0.14.10 | 0.16.3 | Candidate; verify relevant usage. |

## Intermediate Angular checkpoints

Use Node 22.23.4 / npm 10.9.9 for common migration stages, then the destination pair.
The TypeScript values below lie in the relevant compiler peer ranges; validate each
temporary lint/test toolchain as part of its checkpoint.

| Angular core | CLI / build-angular | Material / CDK | custom-webpack | angular-eslint | ngx-echarts | TypeScript |
| --- | --- | --- | --- | --- | --- | --- |
| 18.2.14 | 18.2.21 | 18.2.14 | 18.0.0 | 18.4.3 | 18.0.0 | 5.5.4 |
| 19.2.25 | 19.2.27 | 19.2.19 | 19.0.1 | 19.8.1 | 19.0.0 | 5.8.3 |
| 20.3.34 | 20.3.42 | 20.2.14 | 20.0.0 | 20.7.0 | 20.0.2 | 5.9.3 |
| 21.2.25 | 21.2.29 | 21.2.14 | 21.1.0 | 21.4.0 | 21.0.0 | 5.9.3 |
| 22.2.4 | 22.2.5 | 22.2.5 | 22.0.1 | 22.6.0 | 22.0.0 | 6.0.3 |

Do not apply ESLint 10 while still on an intermediate angular-eslint release that
rejects it. Stage lint upgrades alongside their compatible peers. Preserve Zone.js:
0.14.10 for Angular 18, a compatible 0.15 patch for 19/20, and 0.16.3 for 21/22.

## CDN and static website dependencies

These are outside package-lock and npm audit. Check HTTP availability, file contents
and integrity hashes together. Preserve CSS/JS versions as a matched pair.

| Location / item | Current | Candidate | Gate / alternative |
| --- | --- | --- | --- |
| App Leaflet | 1.9.3 | 1.9.4 | Update CSS, JS and both SRI hashes; preserve global `L`. Exclude Leaflet 2 prereleases. |
| App markercluster | 1.5.3 | 1.5.3 | Already latest; verify clustering against updated Leaflet. |
| App Geoman Free | 2.13.1 | 2.20.4 | Free package; same visible controls, translations and selected shapes/photos. |
| Website Bootstrap | 4.3.1 | 5.3.8 | CSS/markup compatibility work + screenshots. 4.6.2 is a last-4.x fallback, not a supported long-term destination. |
| Website jQuery slim | 3.3.1 | Remove if unused after Bootstrap 5, otherwise 4.0.0 only with compatible consumers | Do not put jQuery 4 under Bootstrap 4. If temporarily retaining Bootstrap 4, use compatible 3.7.1. |
| Website Popper | popper.js 1.14.7 | @popperjs/core 2.11.8 if used; otherwise remove unused script | Legacy popper.js latest 1.16.1 is deprecated; package rename/API change, not an interchangeable URL. |
| Google Fonts / Material Icons | Hosted, unversioned URLs | No independently selected package version | Stabilize font responses for comparison; verify live loading. |
| Google Maps / tiles / remote map config | Hosted APIs and resources | No local numeric upgrade | Preserve URLs/API behavior and verify integration. |
| Embedded Photo Data Viewer | Remote production deployment | Retain production URL; validate candidate Electron | No companion deployment or source changes required by this plan. |

## Important indirect dependencies and undeclared imports

[baseline-lock-inventory.json](./evidence/baseline-lock-inventory.json) inventories
all 2,130 current package entries, including duplicates. Final exact nested versions
must come from solving the target parents' graph and passing clean installation;
preselecting the maximum of every nested dependency would violate parent constraints.

| Item | Current locked version(s) | Candidate / handling |
| --- | --- | --- |
| libheif-js | 1.18.2 | 1.23.5 via heic-decode 2.1.0; validate decoder/WASM loading in packaged workers. |
| moment | 2.29.4 | 2.31.0; directly imported, so explicitly declare if retained. |
| reflect-metadata | 0.2.2 | 0.2.2; explicitly declare direct import or demonstrate safe removal. |
| webpack | 5.94.0 | 5.112.2 is registry latest; use the version allowed by the selected Angular builder, not an override by default. |
| Sass | 1.71.1 / 1.77.6 | 1.107.1 is registry latest; parent-compatible resolution, CSS equivalence and import migration if required. |
| ts-node | 10.9.1 | 10.9.2; verify espower-typescript under TS 5.9/6.0. |
| app-builder-lib / dmg-builder | 24.13.3 | 26.18.1 as pinned by builder 26.18.1. |
| builder-util | 24.13.1 | 26.18.1 as pinned by builder 26.18.1. |
| @electron/universal | 1.5.1 | Parent-selected version; registry latest 3.0.6 must not be forced over builder's pin. |
| @electron/rebuild | Not at this exact package path | Parent-compatible version; registry latest 4.2.1. |
| Internal notarize/osx-sign/asar/binary toolsets | Transitive / downloaded by builder | Record resolved versions separately from the app's direct notarize dependency. |
| NSIS / NSIS resources | Builder-controlled | Inspected builder 26.18.1 tarball still uses 3.0.4.1 / 3.4.1. Retain supported toolset and existing scoped retry. |
| Copied heic-convert logic | Based on 1.2.4, locally modified | Not an installed dependency. Preserve local resize/encoding semantics; do not blindly replace with upstream. |

Potential new testing dependencies: Playwright 1.64.1 for actual Electron UI tests;
karma-coverage 2.2.1 only if replacing the legacy coverage adapter is necessary.
These are candidates, not newly installed packages.

## CI actions and runner images

Release URLs are in [github-releases.json](./evidence/github-releases.json).

| Item | Current reference | Candidate | Notes |
| --- | --- | --- | --- |
| actions/checkout | @v7 | v7.0.1 (same major) | Already tracks current major; optionally pin exact release SHA with version comment. |
| dorny/paths-filter | @v4 | v4.0.3 (same major) | Preserve filters, predicate and required-check behavior. |
| jdx/mise-action | @v4 | v5.2.5 | Action uses Node 24 internally; independent of selected project Node. Check caching/install defaults. |
| GabrielBB/xvfb-action | @v1.4 | v1.7 | Verify existing run inputs, Linux display launch and failures; do not hide failed tests. |
| nick-invision/retry | @v2.2.0 | nick-fields/retry@v4.0.0 | Repository redirects to new owner; Node 24 action. Preserve timeout/retry semantics and Windows shell. |
| mise binary used by CI | Floating action-managed | 2026.10.25 observed latest | Keep supported action defaults or pin after validating release age; do not globally upgrade the user's mise. |
| Ubuntu runner | ubuntu-24.04 | ubuntu-26.04 LTS | Official image exists. Validate AppImage/FUSE/Xvfb and update required-check names in coordination. Retain 24.04 checkpoint. |
| macOS runners | macos-26 / macos-26-intel | Retain | Current named images; Intel stays an explicit pre-merge manual check. |
| Windows runner | windows-latest | Retain, currently Server 2025 / VS 2026 | Floating current image; record actual image in CI evidence. |
| Hosted Mergify / Pages / remote services | Hosted | No repository-controlled software version | Preserve rules and check publication configuration. |

Runner availability: [official image inventory](https://github.com/actions/runner-images/blob/main/README.md).
Changing Ubuntu's visible required-check name may need repository settings access.
Use a stable explicit check name during the transition or prepare the precise owner
action at the final gate; never leave required checks permanently pending.

## Acceptance of exceptions

Implemented exceptions and actual runtime evidence are maintained in
[EXCEPTIONS.md](./EXCEPTIONS.md).

Maintain an implemented-version snapshot during execution, separate from this dated
research. For each package below its candidate, record the attempted version, exact
failure/peer constraint, last verified fallback, risk and revisit condition. Preserve
intermediate checkpoints for recovery; Angular 22 is the selected destination.
The highest published
version is a ceiling for investigation, not permission to change UI or platform support.
