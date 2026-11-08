# AGENTS.md

What this app does and how to contribute is in [`README.md`](README.md) and
[`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md). This file holds only what is
needed at the start of a session.

## This is the only instruction file for agents

Claude Code, Codex and other coding agents all read this file. There is no
`CLAUDE.md` on purpose: Claude Code reads `AGENTS.md`, but skips it when a
`CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` exists in the working
directory or above it. Do not add one; put instructions here instead.

## Write in English

This repository is written in English — code, comments, `README.md`, docs, commit
messages, branch names, pull request titles and descriptions, and this file.
Keep it that way.

## This repository is public

`TomoyukiAota/photo-location-map` is a **public** repository. Everything that
lands here is readable by anyone: pull request titles and descriptions, issues,
**commit messages**, branch names, and comments in the code.

**Do not put private things here** — names of private repositories, third-party
services used privately, photos which reveal personal information. When such a source is needed, carry over
**the content only**, without naming where it came from. When in doubt, leave it
out and ask.

## Knowledge about this repo lives in this repo

Do not use an agent's own memory, such as Claude Code's
(`~/.claude/projects/…/memory/`), as the place to keep knowledge about this
repository. Memory is **per clone and per machine**, so it does not travel: work
on another computer and it is simply not there.

Put it in the repository instead. Git carries it to every clone and every machine,
and a pull request makes it reviewable.

For Claude Code, this is not a promise to remember:
[`.claude/settings.json`](.claude/settings.json) sets `"autoMemoryEnabled": false`,
which turns its memory off entirely (both reading and writing). That file is
tracked, so the switch travels with the repository.

## Keep CONTRIBUTING.md short

[`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) is the introduction that a human
developer new to this repository reads first. Before adding to it, decide where
the text belongs:

- **Needed in most development work**: a short section in CONTRIBUTING.md that
  links to a page in `docs/contributing/`, like "Dependencies".
- **Needed only in a particular situation**: a page in `docs/contributing/`,
  linked from where that situation shows up (a test's failure message, a
  comment in the code) rather than from CONTRIBUTING.md, like
  `minimum-os-versions.md`.
- **About a single setting**: a comment next to that setting, like the one in
  `.vscode/settings.json`.

**Why:** agents added details to CONTRIBUTING.md as they worked, until it was
too long to read as an introduction.

## Keep windows off the owner's screen

Run anything that opens a browser or an app window **headless**, unless you are
asking the owner to check the UI. The owner keeps working on the same machine
while you run things.

- `npm run test:e2e` keeps the app's windows off the screen on macOS and Windows.
  Add `-- --headed` only when the owner is to watch. On Linux it still shows them
  (see `test/e2e/README.md`), so ask before running it there.
- `npm run test:package` launches the packaged app hidden and in the background.
- Anything else that starts a browser, such as a Playwright script, has a
  headless mode: use it.

If something cannot run headless, say so and ask before starting it.

**Why:** the e2e tests used to bring a window to the front at every launch of
the app, in the way of the owner's own work.

## In a git worktree

Two things work differently in a git worktree, such as one that Claude Code
makes under `.claude/worktrees/`:

- **mise does not trust the worktree's `mise.toml`**, as mise keeps its trust
  per path, so `mise exec` fails there. Pass the file to each command rather
  than running `mise trust`, which would change mise's own settings:
  `MISE_TRUSTED_CONFIG_PATHS="$PWD/mise.toml" mise exec -- npm ci`.
- **`npm run test:package` cannot pass its last check**, which reads
  `release/latest-mac.yml`. electron-builder writes that file only for a
  publisher, which it detects from `GH_TOKEN` and the repository in
  `.git/config`, a file rather than a folder in a worktree: without `GH_TOKEN`
  there is no file, and with one the build fails with "Cannot detect
  repository by .git/config". The package itself is built and signed, and the
  macOS CI job, which works in a clone, runs the whole test.

## You can run the signed mac build yourself

Run `npm run package:mac` (and the other packaging scripts) directly. The macOS
signing and notarization credentials are expected to be already set up on the machine and need
no interaction:

- The Developer ID Application certificate is in the login keychain, so `CSC_LINK`
  and `CSC_KEY_PASSWORD` are not needed.
- `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` and `APPLE_TEAM_ID` are exported from
  the shell profile, which is what the `afterSign` hook
  `script/notarize/notarize.js` reads.

Budget about five minutes end to end: roughly a minute for the Angular production
build, a couple more for universal packaging, and about two waiting on Apple's
notarization service. **Run it in the background and read the log** rather than
blocking on it.

Note that `PLM_PACKAGE_TEST=true` (set by `npm run test:package`) skips
notarization, so the package test is **not** a substitute when a notarized
artifact is actually needed.

Publishing the result to GitHub is a separate, outward-facing step — confirm
before uploading.

## Stay on the documented setup

Use each tool the way its documentation sets it up. Do not depart from that with
npm `overrides`, patches to installed packages or custom environments unless a
needed feature or a serious security vulnerability requires it. A deprecation
warning is not such a reason, and it is not the kind of failure the narrow
workaround below is for: record it in
[`docs/contributing/dependencies.md`](docs/contributing/dependencies.md#known-deprecation-warnings)
instead. Departures kept for such a reason are listed on the same page, each
with its reason and when to remove it.

**Why:** upstream updates to the standard setup remove these warnings over
time, and they are not urgent. An earlier pull request removed every warning by
adding five overrides and two install-time source patches, each pinned to exact
versions that every later upgrade had to review again.

## Prefer a narrow workaround over a risky upgrade

When an intermittent failure turns out to be a known upstream bug, propose a
**narrow workaround** (a retry, a guard) rather than pinning unusual binaries or
bumping a major dependency version.

**Why:** the build and release pipeline here — electron-builder, NSIS,
notarization, auto-update — is the part that ships to users. A beta toolset or a
two-major-version jump risks breaking releases for a benefit that only shows up
in CI.

Scope the workaround as tightly as the evidence allows. The Windows installer
retry, for example, keys on exit code 3221225477 on win32 only, so a real
installer failure is still surfaced. Record the investigation — the evidence, the
hypotheses ruled out, why other fixes were rejected — in a comment next to the
workaround rather than in an issue, using a `TL;DR:` / `Details:` structure.

## Classify a CI failure before rerunning it

When asked to keep a pull request green, **read the failed job's log and classify
the cause before rerunning**. The push and pull_request triggers build the same
commit, so compare the two runs: if one passed on the same commit, the failure is
environmental.

**Why:** blind reruns hide real defects. An intermittent Windows failure here
looked like a flake for weeks; reading it properly showed the installer was
crashing with `0xC0000005` and not installing at all.

**Rerun without asking when the cause is in the CI environment, not in this
repository's code**, and a rerun is likely to pass. The owner prefers a rerun
whenever one can be expected to pass. Examples:

- GitHub Releases download failures: `socket hang up`,
  `Get "https://github.com/...": EOF`, `status code 5xx`, or
  `getaddrinfo ENOTFOUND github.com` while `npm ci` downloads Electron.
- The runner's disk images: `hdiutil: couldn't eject "diskN" - Resource busy`
  while electron-builder makes the macOS DMG, before any test runs.
- Any other failure whose log points at the runner rather than the code, when
  the other trigger passed on the same commit.

Tell the owner what was rerun and why. Stop and report anything that may be a
real defect: a failure both triggers share, or one in the app's own tests or
behavior. If the same environmental cause keeps coming back, propose a narrow
workaround (see above) instead of rerunning indefinitely.

**Handle each failed check as soon as it fails.** Do not wait for all checks to
finish: the slowest job takes about 10 minutes (15–28 for `macos-26-intel` when
it is run on demand), and a failed job would sit unattended that long.

## CI skips pushes that change only documents

Each CI workflow first runs a `changes` job, which finds the files the push or
pull request changes with [dorny/paths-filter](https://github.com/dorny/paths-filter)
and `.github/ci-filters.yml`. When every one of them is a document — `docs/`
(including the landing page), `README.md`, `AGENTS.md`, `LICENSE` or
`.github/ISSUE_TEMPLATE/` — the `test` job is skipped. A skipped job passes
GitHub's required checks, and `.mergify.yml` accepts `check-skipped`, so such a
pull request does not wait for the tests.

**Why:** nothing in CI checks these files (`lint:script` covers `script/`,
`ng lint` covers `src/`, and the app's package does not contain `docs/`), yet
every push ran the tests on three OSes for about 10 minutes.

Keep anything that the app or CI uses out of `.github/ci-filters.yml`. Write
out the `test` jobs' names rather than giving them by a matrix or an
expression: a skipped job neither expands its matrix nor evaluates its name, so
it would report no `test (<os>)` check and leave the required check pending.
If the `changes` job fails, the tests run.

## The Windows CI publishes on purpose

`.github/workflows/ci-on-windows.yml` runs the `[Publish to GitHub Releases]`
steps (`npm run publish:windows`) on every push to every branch, unless the
push changes only documents (see above). This is deliberate: it verifies that
publishing still works, rather than finding out on release day. The draft
GitHub release that appears as a result (`1.12.1-alpha`, for example) is an
**expected byproduct, not leftover junk**.

**Do not propose removing or gating these steps any further, and do not treat
the draft releases as cleanup work.**

Only the Windows publish path is exercised this way. The equivalent steps in
`ci-on-ubuntu.yml` are commented out, and macOS publishing is not in CI at all
because it needs the signing and notarization credentials described above.

## The Intel macOS CI runs only on demand

`.github/workflows/ci-on-mac.yml` runs on `macos-26` (Apple Silicon) for every
push and pull request. The `macos-26-intel` (x64) job runs only when the
workflow is run manually, together with `macos-26`: **Run workflow** on the
"CI on macOS" page of the Actions tab, or
`gh workflow run ci-on-mac.yml --ref <branch>`.

**Run it before merging a pull request that can break the x64 half of the
universal app** — a new Electron or electron-builder version, a change to the
macOS settings in `electron-builder.json`, or a dependency with native code —
and report the result to the owner. If it fails, classify the failure as above
before rerunning.

**Why:** run on every push, the Intel job took about twice as long as
`macos-26` (19–25 minutes against about 10) and accounted for every macOS
failure in the 100 runs from August to October 2026: 12, none of them caused by
the app. The app's own code is the same on x64 and arm64, so the job is worth
its cost only when something that differs between them changes.

Remove the manual trigger when GitHub retires the Intel runner (expected around
2028).
