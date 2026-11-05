# Jasmine browser loading and asynchronous setup

## Evidence

The first cross-platform CI runs on source `01c1e7f` all passed, including native
Intel Mac. Their logs still contained Jasmine 6 deprecations concerning patched
environment methods and browser ES-module loading. The same messages were in
earlier local logs. The first warning scan missed the uppercase `DEPRECATION:`
prefix, so a green job and the earlier scan did not establish warning-free tests.

Inspected primary installed source:

- `jasmine-core/lib/jasmine-core/jasmine.js`: `Env.execute` rejects browser-ESM
  loading as an unsupported configuration and reports replaced Env methods.
- `zone.js/fesm2015/zone-testing.js`: its Jasmine patch replaces Env suite/spec/
  hook methods and the clock. The test suite has no fakeAsync/tick/clock use.
- `@angular/build/src/builders/karma/polyfills-plugin.js`: the builder changes
  every included JavaScript framework file to `type=module` to order Zone's
  Jasmine testing patch after Jasmine. This also converts Jasmine's classic core.
- Karma's supported `file_list_modified` event exposes included file metadata
  before the browser loads those files, including subsequent refreshes.

## Narrow replacement

Keep the application's Zone integration unchanged. Keep `zone.js` in the test
polyfills so Angular fixtures still have the same base Zone implementation.
Remove only test-only `zone.js/testing` and replace the five `waitForAsync`
compilation setups with ordinary Jasmine async hooks that await compileComponents.
These setups do not use Zone fake timers or extra async-task tracking.

A small Karma framework plugin restores classic loading only for Jasmine core,
boot, adapter, and HTML runtime files after Angular sets their initial types.
Compiled application/spec chunks and polyfills retain their ES-module types.
No Jasmine internal flags, warning handlers, dependencies, or Node globals are
patched. The hook uses Karma's file-list event instead of a custom Angular builder.

The focused compatibility test uses the installed Karma/Jasmine/HTML plugins and
the actual Angular polyfill plugin, then runs real Karma FileList.refresh twice.
It proves classic Jasmine survives refreshes and compiled modules stay modules.
Its test-only import of the pinned Angular plugin deliberately detects a future
upstream fix, at which point this workaround should be reviewed and removed.

## Validation and remaining CI

- Local Angular suite after replacement: 57 SUCCESS; no deprecation output,
  including uppercase Jasmine messages. Existing Electron process/window.require
  identity tests remain intact.
- Run the focused check through `npm run test:dependency-compat` and keep it in CI.
- Re-run all platform workflows on the follow-up source; the prior successful
  runs validate the previous source and do not prove the warning fix.
- Warning inspection must include case-insensitive `DEPRECATION:` as well as
  npm deprecated packages, Node DeprecationWarning, and Sass warnings. Inspect
  CI annotations too; do not count ordinary test names mentioning deprecation.

Ubuntu also used xvfb-action v1.7, whose action manifest declares Node20. Its
primary `index.js` installs xvfb/x11-xserver-utils and invokes
`xvfb-run --auto-servernum`. The workflow now installs those prerequisites once
and runs that same native command for each test step, removing the obsolete
action runtime without changing display defaults or app/test commands.
