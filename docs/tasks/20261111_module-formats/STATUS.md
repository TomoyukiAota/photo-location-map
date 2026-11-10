# Module formats: status

Investigated and done on 2026-11-11.

## The question

Does the code mix CommonJS and ES modules, and if it does, should it follow the
best practices for them, or keep to one of the two? The owner's aim is to
follow JavaScript's best practices rather than to have one format at any cost.

## What was found

It does mix them, by what loads each file, and mostly as the practices have
it. The application's own code is written with `import` everywhere; the
renderer runs as ES modules and the main process as CommonJS, which `tsc`
writes. The table is in
[`docs/contributing/module-formats.md`](../../contributing/module-formats.md).

Four things were not as the practices have them:

- `package.json` had no `"type"`, which Node's documentation asks for even
  where CommonJS is meant.
- Three modules were loaded with `require()` in TypeScript for no reason
  (`is-natural-number`, `is-number`, `heic-decode`), without their types.
- Nothing checked the form of an import in `src-main/` and `src-shared/`:
  ESLint ran on the renderer and the scripts only.
- The renderer's build printed 14 warnings about CommonJS dependencies at
  every build, which nobody could act on, and among which a new one would not
  have been seen.

## What changed

- `package.json` says `"type": "commonjs"`. Nothing runs differently.
- The three modules are imported. The `require()` calls that stay, which load
  a module late on purpose, say why in the comment that switches the rule off.
- `npm run lint:main`, in `lint:all` and in CI, fails a `require()` in
  `src-main/` and `src-shared/`. A comment of `src-shared/decorator/catch.ts`
  named a rule that typescript-eslint 8 no longer has, which is an error once
  the file is linted: it names the rule's successor.
- `angular.json` lists the 14 CommonJS dependencies of the renderer
  (`allowedCommonJsDependencies`), and
  [`dependencies.md`](../../contributing/dependencies.md#commonjs-modules-in-the-renderer)
  says what each is there for. The build prints no warning now.
- `AGENTS.md` and `docs/contributing/module-formats.md` have the rules.

## What was not done, and why

The main process was not turned into ES modules. It would change about 145
files of the part that ships, for nothing that a user sees, and Electron's
preload scripts would stay CommonJS anyway. The page above lists what it would
take and when to take the step.

No dependency was replaced by one that is an ES module. moment has no such
build; `lodash-es` would have to be loaded by the main process, which is
CommonJS, through `require()` of an ES module.

## Checks

On macOS (Apple Silicon), 2026-11-11: `npm run lint:all`, 166 Vitest tests,
199 and 62 Electron-Mocha tests, and the e2e suite with `PLM_VISUAL=1` against
a production build: 47 passed, 1 skipped (Windows only), with every screenshot
as it was. The case of the HEIC worker, which imports `heic-decode` now, is
among them.

The package test was not run here: it stops before its smoke test in a
worktree (`AGENTS.md`). CI runs it on the three operating systems.
