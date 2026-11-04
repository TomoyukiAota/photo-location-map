# Deprecated dependency investigation

Checked the lockfile, published package manifests/source, and primary upstream
documentation on 2026-11-05. This document covers transitive dependencies;
Angular build and application API migrations are tracked separately.

## Baseline ownership

| Deprecated package | Actual dependency path(s) | Disposition |
| --- | --- | --- |
| `glob@7.2.3`, `inflight@1.0.6` | `karma@6.4.4`; `@electron/asar@3.4.1`; old `rimraf` copies | Modern glob is not a drop-in replacement for these callers. See blockers below. |
| `rimraf@3.0.2` | `karma@6.4.4` | Karma expects the old callback API. |
| `rimraf@2.7.1` | `delete-empty@3.0.0` | Replace the application's sole `delete-empty.sync` call, then remove package/types. |
| `rimraf@2.6.3` | `electron-builder-squirrel-windows@26.18.1` → `electron-winstaller@5.4.0` → `temp@0.9.4` | Release dependency; native removal/modern rimraf would need a callback compatibility change upstream. |
| `boolean@3.2.0` | builder's `@electron/get@3.1.0` → `global-agent@3.0.0`, and its `roarr@2.15.4` | Candidate: scope `global-agent@4.1.6` override to `@electron/get`. |
| `lodash.isequal@4.5.0` | `electron-updater@6.8.12` | Candidate: updater-only alias to `lodash.isequalwith@4.4.0`, preserving two-argument comparison. |
| `glob@10.5.0` | `electron-mocha@13.1.0` → `mocha@11.7.5` | Candidate: Mocha-only override to `glob@13.0.6`; do not upgrade Mocha itself to 12. |

`@electron/asar@3.4.1` is used by `app-builder-lib@26.18.1`,
`@electron/universal@2.0.3`, and `electron-winstaller@5.4.0`. The Squirrel builder
is an automatically installed peer of `app-builder-lib`, not an optional package
that can safely be omitted using `--omit=optional`. Its install script is already
disabled by the repository's reviewed install-script policy. Removing Windows
publishing is outside scope and contrary to repository guidance.

## Candidate replacements and evidence

### Mocha's glob dependency

Use a scoped override, `"mocha": { "glob": "13.0.6" }`. The published v13.0.6
manifest is not deprecated and supports the repository's Node 26 and Electron's
Node 24. Mocha 11's `lib/cli/lookup-files.js` uses only `glob.hasMagic()` and
`glob.sync()` with `nodir` and `windowsPathsNoEscape`. Upstream made the same
dependency-only migration in [Mocha PR 5546](https://github.com/mochajs/mocha/pull/5546).
The [glob changelog](https://github.com/isaacs/node-glob/blob/main/changelog.md)
describes the Node support and CLI changes through v13. Pin v13, rather than
introducing the additional matching changes in v14.

Do not override `electron-mocha` to use `mocha@12`: that release is ESM, while
Electron Mocha 13 requires the Mocha constructor and several private CLI modules
using CommonJS. Keeping Mocha 11 and changing only its compatible glob dependency
is the narrower change.

### Updater comparison

Use an updater-scoped npm alias:

```json
"electron-updater": {
  "lodash.isequal": "npm:lodash.isequalwith@4.4.0"
}
```

The only runtime import in updater 6.8.12 is
`out/DownloadedUpdateHelper.js`; it compares cached update metadata and file
metadata using two arguments. Lodash documents that
[`isEqualWith`](https://lodash.com/docs/#isEqualWith) performs the ordinary
equality comparison when no customizer is supplied. Published source for the
alias calls `baseIsEqual(value, other, undefined)` in that case. This retains
Lodash comparison semantics rather than introducing Node's stricter prototype
semantics. The alias package is not deprecated in the registry.

A direct experiment comparing the old and candidate functions passed all 625
pairs from 25 representative values: cloned/changed update metadata, arrays,
optional properties, dates, buffers, maps, sets, `null`, `undefined`, and `NaN`.
The durable test below exercises the updater itself rather than depending on a
copy of the old comparator. Do not alias `lodash.isequal` to the entire `lodash`
package: its default function creates a wrapper and is not an equality function.

### Download proxy

Use `"@electron/get": { "global-agent": "4.1.6" }`. Builder's get 3 calls only
`require('global-agent').bootstrap()` after setting the `GLOBAL_AGENT_` proxy
variables. Version 4 retains that CommonJS export and environment interface;
its dependencies remove both `boolean` and `roarr`. Its documented major change
is Flow to TypeScript; runtime fixes include TLS verification and socket handling.
See [global-agent's API](https://github.com/gajus/global-agent#setup-proxy-using-bootstrap-routine)
and [v4 release notes](https://github.com/gajus/global-agent/releases/tag/v4.0.0).
The override is scoped to the downloader and does not update Electron or the
release toolchain as a whole.

### Application empty-directory removal

`delete-empty` is used only by
`src-shared/thumbnail/cache/remove-invalid-thumbnail-cache.ts`. Its default
behavior treats files ending in `.DS_Store` or `Thumbs.db`, case insensitive,
as garbage; a directory containing only those files can be removed. Removal can
include the cache root itself. Preserve these details when replacing it with
native filesystem operations. A simplistic zero-entry-only `rmdir` traversal
would change behavior. Avoid following directory symlinks outside the cache.

## Remaining upstream constraints

- **Karma:** published latest is still 6.4.4. `lib/file-list.js` constructs
  `new Glob(pattern, { sync: true, follow: true, nodir: true })`, then reads
  `.found` and `.statCache[path].mtime`. Modern glob removed that interface.
  Other Karma files use callback glob and rimraf. A blanket glob/rimraf override
  would break test discovery/cleanup. A migration to another runner or a small
  maintained compatibility patch must preserve Electron fixtures and watch mode.
- **ASAR:** asar 3 promisifies callback `glob.glob`, so overriding its glob to
  modern Promise-only glob will hang or fail. Stable asar 4.3.1 removes glob 7,
  but changing the archive library underneath builder 26's pinned requirement is
  a release-sensitive major override. Assess archive APIs and perform universal
  packaging, extraction, smoke tests, and cross-platform CI before accepting it.
  An isolated probe of stable asar 4.3.1 passed common API cross-reading of two
  archives with both asar 3 and 4, including hidden files, a symlink, and an
  unpacked native-file fixture. Builder 26 already uses native dynamic imports
  for asar; universal 2's CommonJS default-import helper also needs checking.
  The override was rejected for this change: it would leave the same unique
  glob/inflight warnings through Karma and temp while increasing release risk.
- **Temporary directories:** `temp@0.9.4` calls rimraf as a callback function and
  uses `rimraf.sync(path, { maxBusyTries: 6 })`. Current rimraf exports named
  Promise functions; overriding versions without adapting callers breaks cleanup.
- **Release toolchain:** current supported branch remains builder 26.18.1 and
  updater 6.8.12. Builder 27/updater 7 are alpha tags. Do not upgrade to prerelease
  tooling merely to remove install messages. Registry version endpoints are
  primary evidence: [builder](https://registry.npmjs.org/electron-builder/26.18.1),
  [updater](https://registry.npmjs.org/electron-updater/6.8.12),
  [Karma](https://registry.npmjs.org/karma/6.4.4), and
  [Electron Mocha](https://registry.npmjs.org/electron-mocha/13.1.0).

## Durable compatibility checks

Run after any scoped overrides are installed:

```sh
mise exec -- node --test test/deprecation-warnings/dependency-compat.cjs
```

The tests check actual updater cache reuse/rejection when metadata or artifacts
change, discovery of main/renderer/shared Electron test patterns, and downloader
proxy bootstrap with a real local HTTP proxy and `NO_PROXY` bypass. Proxy patches
run in a separate process. These are required in addition to existing full unit,
packaging, and application regressions.

Baseline on the original dependency tree: all three passed on 2026-11-05.
After installing the three scoped replacements, the coordinating agent reran
the same command: all three passed. They are included in `test:all`.
An initial proxy fixture using `agent: false` recursively reused the globally
replaced agent; the fixture now creates a separate ordinary upstream Agent before
bootstrap. This was a test-fixture defect, not a product failure.
