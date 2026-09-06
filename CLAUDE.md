# CLAUDE.md

What this app does and how to contribute is in [`README.md`](README.md) and
[`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md). This file holds only what is
needed at the start of a session.

## Write in English

This repository is written in English — code, comments, `README.md`, docs, commit
messages, branch names, pull request titles and descriptions, and this file.
Keep it that way.

## Knowledge about this repo lives in this repo

Do not use Claude's memory (`~/.claude/projects/…/memory/`) as the place to keep
knowledge about this repository. Memory is **per clone and per machine**, so it
does not travel: work on another computer and it is simply not there.

Put it in the repository instead. Git carries it to every clone and every machine,
and a pull request makes it reviewable.

This is not a promise to remember: [`.claude/settings.json`](.claude/settings.json)
sets `"autoMemoryEnabled": false`, which turns memory off entirely (both reading
and writing). That file is tracked, so the switch travels with the repository.

Working in a directory that is **not** under git is the exception — there, memory
is the only place available, so use it.

## You can run the signed mac build yourself

Run `npm run package:mac` (and the other packaging scripts) directly. The macOS
signing and notarization credentials are already set up on this machine and need
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

Only rerun automatically for causes identified as infrastructure — GitHub Releases
download failures appear as `socket hang up`, `Get "https://github.com/...": EOF`,
or `status code 5xx`. Stop and report anything else.

**Handle each failed check as soon as it fails.** Do not wait for all checks to
finish: the `macos-26-intel` job takes 15–28 minutes, and a failed Windows job
would sit unattended that long.

## The Windows CI publishes on purpose

`.github/workflows/ci-on-windows.yml` runs the `[Publish to GitHub Releases]`
steps (`npm run publish:windows`) on every push to every branch. This is
deliberate: it verifies that publishing still works, rather than finding out on
release day. The draft GitHub release that appears as a result (`1.12.1-alpha`,
for example) is an **expected byproduct, not leftover junk**.

**Do not propose removing or gating these steps, and do not treat the draft
releases as cleanup work.**

Only the Windows publish path is exercised this way. The equivalent steps in
`ci-on-ubuntu.yml` are commented out, and macOS publishing is not in CI at all
because it needs the signing and notarization credentials described above.

## This repository is public

`TomoyukiAota/photo-location-map` is a **public** repository. Everything that
lands here is readable by anyone: pull request titles and descriptions, issues,
**commit messages**, branch names, and comments in the code.

**Do not write private things here** — names of private repositories, third-party
services used privately, personal photos. When such a source is needed, carry over
**the content only**, without naming where it came from. When in doubt, leave it
out and ask.
