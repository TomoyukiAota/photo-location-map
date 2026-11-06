# Packaging without repository-owned compatibility packages

> **Update, 2026-11-07:** the ASAR and Temp overrides and `script/patch-temp.js`
> described here have been removed, and their deprecation warnings are accepted
> until upstream releases remove them. See the
> [override removal record](../20261107_remove-dependency-overrides/STATUS.md).

## Decision

Keep stable electron-builder26.18.1 and existing NSIS/DMG/ZIP/AppImage settings.
Override ASAR to stable4.3.1, which uses maintained glob13, and Temp's rimraf to
stable6.1.4. Remove both local packages and compat/ entirely. The explicit
install-links setting is no longer needed. No deprecation metadata is changed.

There is still a small upstream-source workaround: script/patch-temp.js updates
Temp0.9.4's four removal call sites to the current rimraf API in postinstall.
This is not an assertion that all local upstream workarounds are gone. The
existing Electron-Mocha spawn workaround also remains. Unlike the deleted
adapters, these patches do not implement general legacy glob/removal APIs.
Their exact version/source guards require deliberate review on dependency drift.

## Upstream and API evidence

The stable builder still pins ASAR3 and installs electron-winstaller through its
Squirrel peer, including for this project's NSIS target. Registry dist-tags when
checked: v26=26.18.1, next=27.0.0-alpha.14; the latest tag still points at26.18.0.
The stable installer5.4.4 also retains Temp0.9.4. Temp has no newer published
version. A temp-fs fork still depends on rimraf2 and is not a solution.

Primary upstream context:

- https://github.com/electron-userland/electron-builder/issues/10016
- https://github.com/electron/windows-installer/pull/618
- https://github.com/electron/asar
- https://github.com/isaacs/rimraf

The upstream rewrite is on the builder27 prerelease line. Do not adopt an alpha
release toolchain just to eliminate local code. The relevant ASAR4 changes are
its ESM packaging and Node>=22.12 requirement; this repository uses Node26 and
Electron's embedded Node24. CommonJS require of this synchronous ESM module is
supported on those runtimes. Actual builder/universal/installer consumers resolve
the same4.3.1 module; test the real APIs rather than only the dependency graph.

The Windows-installer's real temp-utils module calls temp.track() and promisifies
temp.mkdir(). Automatic process-exit cleanup is synchronous. Temp also exposes
callback cleanup, which must remain valid. A plain rimraf6 override was probed:
tracked synchronous cleanup succeeds but callback cleanup throws
`rimraf is not a function`. It was not accepted in that unpatched form.

## Narrow Temp call-site migration

The postinstall patch changes only:

- Two asynchronous `rimraf(path, options, callback)` calls to the maintained
  `rimraf.rimraf(path, options).then(successCallback, errorCallback)` API.
- Two synchronous `.sync` calls remain `.sync`.
- All four `maxBusyTries: 6` options become supported `maxRetries: 6`.

Version0.9.4 and complete before/after SHA-256 hashes protect the source. Unknown
versions/source fail before writing; repeated installs accept the exact reviewed
result. Root install-script review remains strict. Remove the patch and scoped
overrides when a stable supported upstream dependency path makes them obsolete.

## Probes and regressions

An isolated installation of stable builder26.18.1 with ASAR4.3.1, rimraf6.1.4 and
the existing downloader override resolved267 packages with zero deprecated
entries/messages. This was feasibility evidence only; integrated acceptance still
requires root npm ci/npm ls, full tests and real platform packaging.

New actual-consumer regressions cover:

- ASAR creation/extraction, hidden/literal filenames, spaces in source paths,
  unpacked content, and POSIX links. Windows junction safety is covered by Temp;
  the older ASAR absolute-junction limitation is not silently redefined here.
- app-builder-lib's actual archive entrypoint validation, including missing-file
  errors; universal's actual integrity and archive-merge APIs.
- Temp's real async and sync cleanup, tracked files and populated directories,
  literal bracket paths, readonly files, absent entries, outside symlink/junction
  targets, six retries, one error callback, and the actual installer helper's
  automatic process-exit cleanup.
- Patch idempotence and source/version drift before writes; the installed tree
  must have no deprecated packages, Karma or local compatibility packages.

The first ASAR regression fixture put brackets in the source directory itself
and produced empty archives. Isolated comparisons against genuine ASAR3/glob7
and ASAR4 both reproduce that existing limitation. The fixture now uses spaces
in the source directory and still asserts literal bracket filenames inside it.
Do not treat that adjustment as a fix to the upstream directory-pattern issue.
A later missing-entry assertion expected different error wording; it now checks
the actual builder failure without weakening the rejection requirement.

Raw optional probes/logs live under .upgrade-artifacts/vitest-migration/.
Integrated validation and remaining steps are recorded in PLAN.md.
