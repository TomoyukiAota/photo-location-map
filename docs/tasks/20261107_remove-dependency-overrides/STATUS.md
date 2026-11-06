# Remove the dependency overrides: status

Started on 2026-11-07. See the [plan](./PLAN.md).

## Current state

The five overrides, `script/patch-temp.js` and the tests that guarded them are
removed. Checked on macOS with Node 26.13.0 and npm 11.20.0, against `main` at
`d57cbfd`.

Each consumer now resolves the version it declares, which is also the version
on `main` before the overrides were added:

| Consumer | Dependency | With the override | Now |
| --- | --- | --- | --- |
| `app-builder-lib` 26.18.1, `@electron/universal`, `electron-winstaller` 5.4.0 | `@electron/asar` | 4.3.1 | 3.4.1 |
| `@electron/get` 3.1.0, from `app-builder-lib` | `global-agent` | 4.1.6 | 3.0.0 |
| `electron-updater` 6.8.12 | `lodash.isequal` | `lodash.isequalwith` 4.4.0 | 4.5.0 |
| `temp` 0.9.4, from `electron-winstaller` | `rimraf` | 6.1.4, patched Temp | 2.6.3, unpatched Temp |
| `mocha` 11.8.0, from `electron-mocha` 13.1.0 | `glob` | 13.0.6 | 10.5.0 |

`electron-updater` is the only one of these that ships in the application.

## Deprecation warnings

A clean `npm ci` prints these deprecated versions again: `glob@7.2.3` (two
copies), `inflight@1.0.6`, `rimraf@2.6.3`, `boolean@3.2.0`,
`lodash.isequal@4.5.0` and `glob@10.5.0`. Where each comes from and when to
revisit it is in
[dependencies.md](../../contributing/dependencies.md#known-deprecation-warnings).

## Lockfile

A plain `npm install` after removing the overrides left two of their results in
the lockfile: the `lodash.isequalwith` alias under `electron-updater`, and
rimraf 6.1.4 under Temp. Both are outside the ranges those packages declare,
and Temp would have run unpatched against rimraf 6.

The lockfile was therefore rebuilt from `main`'s lockfile: the entries the
overrides had produced were deleted (`@electron/asar` and its glob,
`global-agent`, the updater's `lodash.isequal`, Temp's rimraf, and Mocha's glob
with its minimatch), then `npm install` resolved them again. The 73 entries that
differ from `main` are all in those subtrees, including the same versions moved
within them. `npm dedupe` was not run: it would also update unrelated packages
such as Babel, undici and postcss.

## Security

`npm audit` reports the same advisories as on `main`, in 54 entries instead of
56, because ASAR 3.4.1 and `electron-winstaller` are no longer flagged. Production
dependencies are unchanged: 29 high entries from the existing `jimp` → `zod`
chain. No override was needed to avoid a vulnerability.

## Verification

On macOS (Apple Silicon), in a linked Git worktree:

- A clean `npm ci` passes and leaves the lockfile unchanged. `npm ls --all`
  reports no problems.
- `npm run test:all`: lint, the Electron-Mocha patch test (4), Vitest (37),
  Electron-Mocha main (117) and renderer (69), live reload (5 modes) and the
  package runner (19) pass.
- The package test first failed after building and signing the universal app,
  because `release/latest-mac.yml` was missing. Without a `publish` setting,
  electron-builder writes update metadata only when `GH_TOKEN` or
  `GITHUB_TOKEN` is set, which CI does for electron-builder and this shell did
  not. It also reads the repository from `.git/config`, which a linked worktree
  does not have. With a placeholder `GH_TOKEN` and
  `TRAVIS_REPO_SLUG=TomoyukiAota/photo-location-map`, the package test passes;
  it builds with `--publish never`, so nothing is uploaded. The signed universal
  bundle keeps both architectures and declares macOS 13.0 in `Info.plist` and
  `latest-mac.yml`, and the 60-second DMG smoke test passes.
- End-to-end with `PLM_VISUAL=1`: the checkout suite passes all 15 cases. On
  the signed packaged app, 13 cases pass and the website-only case is skipped,
  as designed. The folder-picker case failed once because the splitter gutter
  did not match `:hover` after a real pointer hover, which depends on the
  pointer and window focus. Rerun alone, it passed, including its visual
  comparison, and it had passed on the checkout.
- No log of these runs contains a deprecation message, apart from the
  `npm ci` warnings listed above.
- CI and the on-demand Intel macOS job run on the pull request, whose
  description records their results.

## Not changed

`script/patch-electron-mocha.js` remains in `postinstall`, and
`test:dependency-compat` now runs only its test. It changes Electron-Mocha
13.1.0's two Windows spawn calls to avoid DEP0190 warnings, so it also departs
from the documented setup. It is not an override, and the owner has not decided
on it yet.

## Resuming

Nothing is pending in this record except the decision on the Electron-Mocha
patch. When upgrading electron-builder, `electron-updater` or `electron-mocha`,
check the revisit conditions in
[dependencies.md](../../contributing/dependencies.md#known-deprecation-warnings)
and update the list.
