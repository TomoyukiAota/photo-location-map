# Electron-Mocha executable spawning

## Evidence and scope

The complete Windows push and PR job logs for source `e10e1b9` each contain
four DEP0190 warnings: the Node launcher and Electron cleanup process for each
of the main/renderer suites. Both suites pass, so green checks alone do not
establish warning removal. The installed Electron-Mocha 13.1.0 CLI and quit
hook use `spawn(executable, argv, { shell: process.platform === 'win32' })`.
The registry's latest release remains 13.1.0 when checked on 2026-11-05.

[Node's DEP0190 documentation](https://nodejs.org/api/deprecations.html#dep0190-passing-args-to-nodechild_process-execfile-and-nodechild_process-spawn-with-shell-option-true)
identifies passing separate arguments with `shell: true` as deprecated. Both
inspected calls already target actual executable files: the installed Electron
binary and `process.execPath`. Neither needs a command interpreter.

## Narrow workaround

`script/patch-electron-mocha.js` runs in the root postinstall before the existing
electron-builder native-dependency installation. It changes only those two
`shell` options to `false`, preserving CLI argument arrays, stdio pipes, exit and
signal forwarding, and the cleanup hook's detached/env/cwd/unref behavior.
It checks version 13.1.0 and complete before/after SHA-256 hashes of both files
before writing either. An unchanged reinstall is idempotent; unknown package
versions or source changes fail visibly for review. No warning filters,
registry-metadata edits, global spawn patches, or release-tool upgrades are used.

This is a development dependency and the script is outside packaged app files.
`ELECTRON_PATH`, if used, must name an executable rather than a `.cmd`/`.bat`
wrapper. The repository uses the installed Electron executable. The upstream
cleanup implementation itself is unchanged; this workaround does not promise
any new cleanup guarantees. Remove it when a supported upstream release fixes
both spawn sites, after repeating Windows main/renderer validation.

## Verification and resume

- Fresh `mise exec -- npm ci`: passes and applies the patch without deprecated
  package or API messages.
- `mise exec -- npm run test:dependency-compat`: 25 pass, including four new
  checks of idempotence, source/version drift before writes, actual installed
  CLI argument/stdio/exit/signal behavior under simulated Windows, and actual
  installed quit-hook spawn options/profile preservation.
- `mise exec -- npm run lint:script`: passes.
- Local first Electron suite attempt failed because two independent checks
  concurrently triggered the freshly installed Electron package's lazy binary
  extraction. dyld observed a framework growing during extraction. This is a
  local orchestration error, not evidence against the spawn change. Serialize
  `npm run verify:electron` after a fresh install before parallel Electron users.
  Its completed check reports Electron 45.2.1 / embedded Node 24.22.1.
- Serially re-extracted the generated Electron binary and repeated the actual
  main/renderer suites: 117/55 pass with zero deprecation messages. No application
  code or persistent system settings were changed for the local recovery.
- Final Windows push and PR CI both pass main117/renderer55, compatibility25,
  package/smoke/E2E and expected publishing behavior. Both full logs have zero
  deprecation warnings, including DEP0190, and empty check annotations. Other
  platforms including native Intel pass too. See `CI_STATUS.md` for accepted
  source, exact runs and the complete log/annotation audit.
