# Improvement loop of 2026-11-27: log

Two rounds over the whole repository, from `main` at 2fd4510b, on 2026-11-27 from 03:30 to 03:52 UTC.

## What the run covers, and when it stops

- The whole repository, from another angle in each round.
- Two rounds, then the run stops. It stopped after round 2.
- A small fix that changes nothing users see goes into a pull request of its own, opened without the label
  `automerge`, which is added once the pull request has been reviewed. What users would see, what needs the owner's
  choice, and anything large are proposed rather than changed.

## Round 1: does every test run?

Angle: the reach of the tests. The hypothesis was that some test files, or some cases in them, are run by no runner,
locally or in CI.

Checked on `main` at 2fd4510b, on macOS on Apple silicon, with Node.js 26.13.0:

| Runner | Expected | Collected |
| --- | --- | --- |
| Vitest (`ng test --list-tests`) | the 104 tracked `*.spec.ts` of `src/` and `src-shared/` | 104 |
| Electron-Mocha | the 79 tracked `test/**/*.spec.em.{main,both,renderer}.ts` | 79, compiled into `out/em` and matched by the globs of the two `.mocharc.jsonc` |
| Playwright | the cases of `test/e2e/regression.spec.mjs` | 91; `PLM_E2E_SHARD` 1/2 and 2/2 list 46 and 45, together the same 91 |
| `node --test` | the 7 files with cases that no other runner takes | each named by `test:package-runner`, `test:dependency-compat` or `test:website` |

The other scripts of `test/` (layout, performance, updater, and the website's layout in every language) are run by
hand, as their READMEs say. In the last runs of `main` (CI on Ubuntu 45919811979, on Windows 45919811903, on macOS
45919812025), every step ran in at least one of the two parts; the two upload steps of macOS run only when needed.

Found: a `.only` left in a test made CI run that test alone, and pass.

| A temporary `.only`, with `CI=true` | Ran | Exit code |
| --- | --- | --- |
| `it.only` in a main-process spec, `npm run test:unit:em:main` | 1 of the 436 tests | 0 |
| `it.only` in a renderer spec, `npm run test:unit:em:renderer` | 1 of the 127 tests | 0 |
| `it.only` in a spec of `src-shared/`, `npm run test:unit:ng` | none: Vitest's "Unexpected .only modifier" | 1 |
| `test.only` in a spec of three cases, the last of which fails, with Playwright 1.64.1 | the focused case | 0 |

Playwright's `forbidOnly` is off by default, and `test/e2e/playwright.config.mjs` did not set it. Its `--list` lists
all 91 cases even with a `test.only`, as only a run applies the filter. No commit in the history added or removed a
`.only` in `test/`, `src/` or `src-shared/` (`git log -S'.only('`).

Pull request #858, "Fail CI on a .only left in an Electron-Mocha or e2e test": `forbidOnly: !!process.env.CI` in
the Playwright configuration, and `MOCHA_OPTIONS: --forbid-only` in the `env` of the three CI workflows, the
variable that Mocha documents for its options. Locally, `.only` works as before.

Also seen, not proposed: no lint script looks at `test/` or `electron-util/` (`lint:ng` takes `src/`, `lint:main`
`src-main/` and `src-shared/`, and `lint:script` `script/`). `eslint.config.mjs` widens its checks in stages, and
`electron-util/` has no call of the logger for the rule on logged lines to check.

## Round 2: do the documents say what the repository does?

Angle: the documents against the repository. The hypothesis was that the documents tell a contributor or an agent
to run commands, or point to files, links, sections or variables, that are gone or that do something else now.

The documents: `AGENTS.md`, `README.md`, `docs/CONTRIBUTING.md`, `docs/TRANSLATING.md`, `docs/contributing/*.md`,
`docs/troubleshooting/troubleshooting.md`, `src/assets/face-search/README.md`, and the READMEs of `test/e2e/` (with
those of its `approved-references/` and `fixtures/`), `test/layout/`, `test/live-reload/`, `test/performance/` and
`test/updater/`: 18 in all. `docs/tasks/` was left out, as its records are dated, and so was the website.

Found nothing to change:

- Every `npm run` name is a script of `package.json`. Every relative link and anchor leads to a file and a heading.
  Every path or file name in backticks is in the repository, or is what a command writes. Every `PLM_` variable is
  read by the code. Every function, class or setting named in backticks is in the code, but for six: `innerHTML`,
  which AGENTS.md says not to use, and names of Windows, macOS, Node.js and electron-builder.
- 17 distinct references to a section of a document, such as (AGENTS.md, "CI tests each commit once, on push"), in
  the code and the documents, each name a heading or a row of a table that is there.
- The size (232,589 bytes) and the SHA-256 that `src/assets/face-search/README.md` gives for the YuNet model are
  those of the file.
- "Known deprecation warnings" in `docs/contributing/dependencies.md` lists the six packages of the
  `npm warn deprecated` lines of `npm ci` in the last CI runs of `main`, on all three systems, and nothing else is
  printed. None of its "Revisit when" conditions has come: electron-builder 27 is at 27.0.0-alpha.15,
  electron-updater 6.8.12 is the latest 6, and electron-mocha 13.1.0, the latest, depends on Mocha ^11, while Mocha
  12.0.3 is out (the npm registry, 2026-11-27).
- The table of languages in `docs/TRANSLATING.md` has the 42 codes, names and English names of
  `src-shared/i18n/languages.ts`, in its order, and `src-shared/i18n/locales/` has a file for each.
- `docs/contributing/ci.md` says what `.mergify.yml` (merge commits, two tests at once) and the branch protection of
  `main` (the four required checks, not strict) do. The list of documents in AGENTS.md is that of
  `.github/ci-filters.yml`. `test (macos-arm64)` took 22.5 minutes in the median of the last 7 runs of `main`, where
  AGENTS.md says about 21.
- The options that the READMEs of `test/layout/`, `test/performance/` and `test/updater/` give are those that their
  scripts read.

Also seen, not proposed: the line of `npm run test:all` in CONTRIBUTING.md leaves out two of its six parts,
`test:dependency-compat` and `test:website`; `test/performance/run.mjs` takes two options that its README does not
give, `--scenarios` and `--settle-ms`, whose defaults are what a series uses.

## Left for later

- On Linux, `npm run test:all` runs `test:package`, which launches the AppImage. An AppImage needs libfuse2, which CI
  installs (`libfuse2t64`, in `.github/workflows/ci-on-ubuntu.yml`), and neither CONTRIBUTING.md nor the package test
  says so. Not checked: it needs a Linux computer without libfuse2, to see what a developer who follows
  CONTRIBUTING.md is told, as the AppImage's own message may be enough.

## Pull requests

| Pull request | At the end of the run |
| --- | --- |
| #858, "Fail CI on a .only left in an Electron-Mocha or e2e test" | Open, labeled `automerge` after its review. Its lints and unit tests had passed on the three systems, with `MOCHA_OPTIONS` set; its e2e jobs were running. |
