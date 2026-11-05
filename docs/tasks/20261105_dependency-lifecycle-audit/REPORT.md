# Dependency lifecycle audit results

Checked on 2026-11-05 against commit
28f3b9aac550823b63706ef4ce47bbd9e1ee24b5. No application, dependency, lockfile,
test or release configuration was changed for this investigation.

## Result

There are remaining lifecycle concerns even though npm currently reports no
deprecated installed-version metadata. Two indirect packages have explicit
upstream deprecation notices, one indirect release line is explicitly
unmaintained, one direct tool is archived, and several other indirect projects
are archived or unmaintained. These categories are distinct from the legacy or
limited-maintenance projects still supporting existing users.

### Explicit deprecation or discontinued maintenance

| Package | Official evidence | Actual dependency path and exposure | Follow-up assessment |
| --- | --- | --- | --- |
| `reduce-flatten@2.0.0` | [README](https://github.com/75lb/reduce-flatten#readme) explicitly deprecates it in favor of native `Array.prototype.flat()`. The repository is archived. | `directory-tree@3.6.0 > command-line-usage@6.1.3 > table-layout@1.0.2 > wordwrapjs@4.0.1 > reduce-flatten`. This is a production dependency and is present in the previously validated signed app's copied modules. | Concrete cleanup candidate. The chain is used by `directory-tree/bin/index.js`, while this application calls its library entrypoint in `src-shared/dir-tree/dir-tree-util.ts`. Prefer an upstream CLI-dependency cleanup or a carefully scoped replacement of the consumer; do not patch an unused CLI merely to hide metadata. |
| `d3-voronoi@1.1.2` | [README](https://github.com/d3/d3-voronoi#readme) explicitly recommends `d3-delaunay` under a deprecation notice; repository archived. | `@turf/turf@7.4.0 > @turf/voronoi@7.4.0 > d3-voronoi`. The renderer imports Turf but only calls `booleanWithin` and `point` in `src/app/map/leaflet-map/leaflet-map.component.ts`. | Good narrow dependency-reduction candidate: assess importing the actual scoped Turf modules. The replacement is not a drop-in alias. No claim is made that unused Voronoi code is included in the renderer bundle. |
| `got@11.8.6` | Current [README](https://github.com/sindresorhus/got#readme) explicitly ends maintenance and backports for v11. Got as a whole continues development. | `electron-builder@26.18.1 > app-builder-lib@26.18.1 > @electron/get@3.1.0 > got@11.8.6`. Build/download tooling, not a copied module in the signed application. | Track a stable upstream consumer migration. Do not override Got to a new major blindly: current Got is ESM and consumer APIs differ. |
| `node-int64@0.4.0` | [README](https://github.com/broofa/node-int64#readme) explicitly says active maintenance has stopped and discusses native BigInt; repository archived. | `electron-builder > app-builder-lib > unzipper@0.12.5 > node-int64`. Build/extraction tooling; not copied into the signed app. | Follow the consumer's supported cleanup. BigInt cannot be aliased into this module's existing object API. |

All four exact installed versions have an empty npm `deprecated` field at the
time checked. Thus the earlier zero-install-warning result remains correct,
but does not establish that every upstream package or release line is supported.

### Direct dependencies with restricted development or discouraged use

| Dependency | Accurate classification and primary source | Repository exposure and implications |
| --- | --- | --- |
| `cross-env@10.1.0` | [Repository](https://github.com/kentcdodds/cross-env) archived on 2025-11-19; [README](https://github.com/kentcdodds/cross-env#readme) calls the tool complete, with no new features needed. No npm deprecation notice. | Three npm scripts: Electron main tests, renderer tests and package tests. Not shipped. Retain it: no relevant defect or clearly better alternative has been established. Its archive status alone does not justify migration; see the follow-up scope below. |
| `moment@2.31.0` | Legacy, maintenance mode. The [2026-08-17 policy update](https://momentjs.com/news/) keeps established behavior and avoids new user features, while permitting maintainer-led technical modernization. It does not promise permanent technical freeze or abandonment. | Production dependency across photo timestamps, sorting, charts and logging. A broad migration needs a separate behavioral plan for timezone, parsing, formatting and mutability. |
| `moment-timezone@0.6.6` | Legacy, maintenance mode; [contribution policy](https://github.com/moment/moment-timezone/blob/develop/contributing.md) and [changelog](https://github.com/moment/moment-timezone/blob/develop/changelog.md) retain fixes and IANA data updates. | Active imports in `src-shared/date-time/now.ts`, `src-main/launch-info.ts`, date/time settings and the alternative EXIF parser. The only `.tz(...)` call is UTC conversion in that unselected parser. Core Moment UTC handling may remove this add-on after checking all imports and exact behavior. It is not simply unused. |
| `zone.js@0.16.3` | [Current Angular monorepo policy](https://github.com/angular/angular/blob/main/packages/zone.js/README.md): no new features or low-priority fixes; Angular-critical fixes still accepted. Supported for Angular. | Bundled at runtime despite its devDependency classification: `angular.json` polyfills and `provideZoneChangeDetection()` in `src/main.ts`. [Zoneless Angular](https://angular.dev/guide/zoneless) is now the default for Angular 21+. Removing Zone requires a separate change-detection migration and real callback/UI verification. The old standalone archive is a repository move, not package retirement. |
| `@electron/remote@2.1.3` | Maintained, but its [README](https://github.com/electron/remote#readme) strongly discourages the architecture and recommends explicit IPC. [Release 2.1.4](https://github.com/electron/remote/releases/tag/v2.1.4) is current maintenance evidence. | Production dependency for main-process modules, dialogs, application paths/version and EXIF. Assess whether explicit IPC offers concrete benefits before selecting a migration. The removed built-in `electron.remote` and the maintained `@electron/remote` package are different; do not call the whole package deprecated or assert an unproven vulnerability. |

`moment-duration-format@2.3.2` is an additional stale but not formally deprecated
or archived dependency ([upstream](https://github.com/jsmreese/moment-duration-format)).
Its single application use is elapsed-time formatting in
`src/app/sidebar/upper-pane/open-folder-recorder.ts:39`. It is a relatively narrow
cleanup candidate, including its corresponding type package, provided the exact
format and long-duration behavior are retained.

### CDN dependencies and external APIs

These are outside package-lock.json and must not be omitted from the audit.

| Dependency/API | Official status | Actual use and follow-up |
| --- | --- | --- |
| Leaflet `1.9.4` | The [1.9.0 announcement](https://github.com/Leaflet/Leaflet/releases/tag/v1.9.0) puts the 1.x branch into critical-fix maintenance. [Current releases](https://github.com/Leaflet/Leaflet/releases) still show 1.9.4 as stable and 2.0 as prerelease. | CDN scripts/styles in `src/index.html`; primary map implementation. Track stable 2.x plus markercluster/Geoman compatibility; do not introduce an alpha release solely for lifecycle cleanup. |
| `google.maps.Marker` | [Official deprecation](https://developers.google.com/maps/deprecations#googlemapsmarker_in_the_maps_javascript_api_deprecated_as_of_february_2024) since JS API v3.56 / February 2024; AdvancedMarkerElement recommended. No discontinuation date is currently scheduled; major regressions are still fixed. | Constructed in `src/app/map/google-maps/google-maps.component.ts:101` when Google Maps is selected. [Migration](https://developers.google.com/maps/documentation/javascript/advanced-markers/migration) needs the marker library and map ID, and may change marker appearance. Consult the owner before an unavoidable UI change. This is API deprecation, not retirement of all Google Maps. |

Leaflet.markercluster `1.5.3` and Leaflet-Geoman `2.20.4` are also CDN-loaded.
Their current [markercluster](https://github.com/Leaflet/Leaflet.markercluster)
and [Geoman](https://github.com/geoman-io/leaflet-geoman) repositories are not
archived; no official whole-project retirement notice was found. The landing
page uses Bootstrap `5.3.8`; no matching retirement finding was identified.

No SearchBox, PlacesService, Autocomplete, DrawingManager or HeatmapLayer use was
found; their separate Google lifecycle notices are not repository findings.
The current Maps script uses an old HTTP host without an explicit version
channel. [Direct script loading](https://developers.google.com/maps/documentation/javascript/load-maps-js-api)
is still supported; no official retirement of this specific endpoint was found.
Do not equate a modernization opportunity with a declared deprecation.

### Other archived indirect repositories

The following archive findings have no verified mandatory replacement notice.
They are upstream-maintenance exposure, not proven breakage or a security audit.

| Package | Primary repository | Consumer/exposure |
| --- | --- | --- |
| `chromium-pickle-js@0.2.0` | [Archived repository](https://github.com/electron/node-chromium-pickle-js) | `electron-builder > app-builder-lib`, packaging only. |
| `json-buffer@3.0.1` | [Archived repository](https://github.com/dominictarr/json-buffer) | `@electron/get > got > cacheable-request > keyv`, build/download tooling. |
| `require-from-string@2.0.2` | [Archived repository](https://github.com/floatdrop/require-from-string) | Angular/Ajv tooling; `electron-builder > app-builder-lib > ajv@8.20.0`; `jsdom > @asamuzakjp/dom-selector > bidi-js@1.1.0`. Build/schema validation and unit-test DOM execution. |
| `saxes@6.0.0` | [Archived repository](https://github.com/lddubeau/saxes) | `jsdom@30.1.3 > saxes`, unit-test environment. |
| `xmlchars@2.2.0` | [Archived repository](https://github.com/lddubeau/xmlchars) | `jsdom > saxes > xmlchars`, unit-test environment. |

None of these five is copied as a node module into the previously validated
signed application. Their presence in maintained consumer tooling does not
justify a speculative override or replacing the new Angular default runner.
Track the consumer's supported dependency updates and any concrete defects.

### Archives caused by moves

These were explicitly checked and must not be counted as abandoned projects:

| Installed package/old repository | Current official destination |
| --- | --- |
| `@ampproject/remapping@2.3.0`, [ampproject/remapping](https://github.com/ampproject/remapping) | [jridgewell/sourcemaps remapping](https://github.com/jridgewell/sourcemaps/tree/main/packages/remapping); npm namespace is now `@jridgewell/remapping`. Old namespace remains an upstream consumer follow-up. |
| `@jridgewell/trace-mapping@0.3.9`, [old repository](https://github.com/jridgewell/trace-mapping) | [sourcemaps trace-mapping](https://github.com/jridgewell/sourcemaps/tree/main/packages/trace-mapping), same package name. |
| `agent-base@6.0.2`, [old repository](https://github.com/TooTallNate/node-agent-base) | [proxy-agents agent-base](https://github.com/TooTallNate/proxy-agents/tree/main/packages/agent-base), same package name. |
| `eslint-visitor-keys@3.4.3`, [old repository](https://github.com/eslint/eslint-visitor-keys) | [eslint/js](https://github.com/eslint/js), same package name. |

All four destinations currently report not archived. Continued project activity
does not guarantee support for every installed historical release. Likewise,
newer major versions are not automatically safe substitutes for indirect APIs.

## Follow-up scope and priorities

The owner clarified that the purpose is to assess substantial library changes
that affect production code, and complete necessary migrations before developing
features on top of the affected areas. Exhaustively removing archived packages
or rewriting development-only utilities is not the objective. Priorities here
supersede the initial audit's dependency-reduction recommendations.

- **Retain cross-env.** It is used only for development/test commands, with no
  relevant defect or clearly superior alternative established. The earlier
  env-cmd/Node-bootstrap replacement recommendation is withdrawn. A release date
  or the existence of another package does not establish a maintenance advantage
  or a reason to change. Do not create replacement work for cross-env now.
- **Retain Moment and moment-timezone for now.** Evaluate Temporal later, when
  the required stable specification/runtime support is established and the owner
  chooses to revisit date/time handling.
- **Keep Zone.js work separate.** Zoneless Angular already has a dedicated task;
  it is outside this dependency follow-up.
- **Assess @electron/remote's production impact.** It is the remaining direct
  dependency candidate in this discussion, used for main-process module access,
  dialogs, application paths/version and EXIF. It is maintained but discouraged,
  not retired. Establish the benefit and scope of explicit IPC, and how the work
  interacts with planned features, before proposing implementation.

The audit's indirect-dependency, CDN and API findings remain recorded above.
They are not a commitment to migrate all of them. Consider actual execution,
production behavior, supported upstream paths and the feature-development
sequence when selecting further work. Preserve features/UI, and consult the
owner about any unavoidable behavior or appearance change. No dependency,
launcher, production or release configuration was changed in this discussion.

## Method, coverage and limits

- Manifest: 87 direct entries (22 dependencies and 65 devDependencies).
- Lock: 1,245 package locations, 1,108 unique canonical package/version pairs,
  including platform-optional entries. Exact-version live npm registry metadata
  was checked for every pair, with zero missing/error responses and zero
  nonempty `deprecated` fields. Stored lock metadata also has zero such fields.
  The scan completed at 2026-11-05T09:33:18Z (18:33 JST).
- Supplemented that lock scan with exact-version registry checks for all four
  CDN packages listed above (Leaflet, markercluster, Geoman and Bootstrap);
  all four also have empty npm deprecation fields and no lookup errors.
- Repository flags: queried all 562 unique GitHub repository URLs extracted from
  the version metadata. Thirteen were archived; four have explicit monorepo
  moves, leaving nine archived origins described above. Five URLs returned 404.
  Current published metadata resolves three of those to maintained projects:
  cacheable-request, mkdirp and concat-map. The original compare-version and
  point-in-polygon links remain unresolved; a missing URL is not proof of EOL.
- Shorthand repository metadata and old missing fields were additionally checked
  against the current official projects for Moment, magicast, std-env,
  tinybench, quickselect and robust-predicates. `physical-cpu-count@2.0.0` and
  `@isaacs/nonrecursive-glob-match@1.0.3` have no published repository field;
  no authoritative retirement notice was established for either.
- Reviewed official lifecycle statements and current READMEs for the highlighted
  projects and older direct dependencies. Searched 1,111 installed README files
  for lifecycle language; this is triage, not a semantic proof about every API.
  Also inspected CDN scripts and actual application imports. `npm explain`
  verifies the indirect paths above; a dependency's devDependency placement
  alone does not establish whether its code is bundled into the renderer.
- Read the existing signed universal Mac artifact without rebuilding or running
  it. Its release/runtime inputs match the audit baseline. Verified copied
  module presence for the findings. This check does not prove that unused Turf
  exports are absent from compiled renderer bundles.
- No official retirement statement was found for ts-node, electron-mocha, Temp,
  exifr, jpeg-js, heic-decode, directory-tree, electron-unhandled,
  electron-window-state, rage-edit, the numeric validators, ng-table-virtual-scroll
  or split.js. Old activity alone was not treated as formal deprecation.
  [reflect-metadata](https://github.com/microsoft/reflect-metadata#metadata-reflection-api)
  retains legacy-decorator support; its original standardization proposal ended.
  [npm-run-all2](https://github.com/bcomnes/npm-run-all2#npm-run-all2-why) is an
  active maintenance fork, not a retired project.
- Angular 22 remains [actively supported](https://angular.dev/reference/releases).
  Electron 45 is in the [supported stable schedule](https://releases.electronjs.org/schedule).
  No lifecycle-based major upgrade of either was established as necessary.
- This is a point-in-time dependency lifecycle review, not a vulnerability audit,
  exhaustive deprecated-API audit, or guarantee of future maintenance. No tests,
  installs, dependency upgrades or packaging runs were needed for this read-only
  investigation. Final documentary review is recorded in PLAN.md.

Optional raw snapshots are ignored under
`.upgrade-artifacts/dependency-lifecycle-audit/`: `registry.json`,
`repo-inventory.json`, `repositories.json`, `paths.json`, `readme-scan.json` and
`packaged-presence.json`, and `cdn-registry.json`. The conclusions and primary
links above are sufficient to resume without those machine-local artifacts.

Lockfile SHA-256 at audit:
`b2beec5ad26c51b18daf7f27e4b821e66449cce02fecf164481c1a2d7bc830e1`.
