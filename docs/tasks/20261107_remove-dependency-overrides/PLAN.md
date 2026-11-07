# Remove the dependency overrides: plan

## Goal

Return the dependency tree to the versions each package declares by removing
the npm `overrides` that were added to remove deprecation warnings, and record
the rule behind that decision.

## Rule

Stay on the setup each tool documents. Depart from it only for a specific
reason: a feature that cannot be built otherwise, or avoiding a serious
security vulnerability. Removing a deprecation warning is not such a reason.
The owner set this rule on 2026-11-07; see
[dependencies.md](../../contributing/dependencies.md#stay-on-the-documented-setup).

## Scope

- Remove the five `overrides` in `package.json`, all added by the
  [deprecation warning cleanup](../20261105_deprecation-warnings/PLAN.md):
  - `mocha` → `glob` 13.0.6
  - `electron-updater` → `lodash.isequal` as an alias of `lodash.isequalwith` 4.4.0
  - `@electron/get` → `global-agent` 4.1.6
  - `@electron/asar` 4.3.1
  - `temp` → `rimraf` 6.1.4
- Remove `script/patch-temp.js`. It adapts Temp to the rimraf 6 override, and
  would break Temp with the rimraf 2.6.3 that Temp declares.
- Remove the tests that guard only these overrides and that patch.
- Keep `script/patch-electron-mocha.js`, its test and `test:dependency-compat`.
  It was added for a Windows DEP0190 warning, which is not a reason, but it also
  lets the Electron-Mocha suites start from a Windows checkout path that
  contains a space. The owner decided on 2026-11-07 that this is needed. Remove
  the patch when Electron-Mocha is fixed.

## Checks

- A clean `npm ci` and `npm ls --all`, and the deprecation warnings `npm ci`
  prints.
- Each consumer resolves the version it declares, and lockfile entries differ
  from `main` only in the overridden packages' subtrees.
- `npm audit`, before and after.
- `npm run test:all`, a production build and the checkout end-to-end suite.
- CI on all three operating systems, and the on-demand Intel macOS job, because
  `@electron/universal` merges the x64 and arm64 archives with ASAR.
- On Windows CI, both Electron-Mocha suites start from a checkout whose path
  contains a space, after a clean `npm ci` there.
