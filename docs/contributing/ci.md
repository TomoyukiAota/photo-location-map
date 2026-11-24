# CI

Read this before renaming a CI check, changing branch protection or Mergify, or
merging a change related to Intel Mac support.


## Check names

Ubuntu CI uses Ubuntu 26.04 LTS and reports `test (ubuntu)`, and
`e2e against the development build (ubuntu)` from a job of its own that runs
beside it. The regular macOS check is `test (macos-arm64)`; the manual Intel
check is `test (macos-x64)`.

Each of `test (ubuntu)`, `test (macos-arm64)` and `test (windows-latest)` comes
from a job that only reads the results of two jobs, `test (<os>), part 1 of 2`
and `part 2 of 2`, which run the tests on that OS at once: each makes the
package and runs half of the e2e suite (`PLM_E2E_SHARD`, in
[`test/e2e/playwright.config.mjs`](../../test/e2e/playwright.config.mjs)), and
part 1 also runs the checks and the unit tests. On Windows, part 1 runs the
uninstaller test and part 2 publishes. The manual Intel check runs all of it in
one job.

These check names stay stable when runner versions change. Branch protection
requires the regular ones, and Mergify takes them from it (see "Merging" below),
so they are listed there only. When renaming a required check, first change the
workflow and confirm that the new check passes, then replace the old context in
branch protection.


## One run of the tests per commit

The tests run on push, for every branch: the three CI workflows have no
`pull_request` trigger, so the required checks of a pull request from a branch
of this repository come from its push run alone. A pull request from a fork is
tested by
[`ci-on-fork-pull-request.yml`](../../.github/workflows/ci-on-fork-pull-request.yml),
which calls the three workflows, and whose checks, such as
`CI on Ubuntu / test (ubuntu)`, are not required: the owner merges it by hand,
bypassing branch protection. Do not add a `pull_request` trigger to the three
workflows (AGENTS.md, "CI tests each commit once, on push").


## Merging

Mergify merges a pull request of the owner that has the label `automerge` once
it meets branch protection: the required checks have passed or been skipped,
and the pull request is up to date with `main`
([`.mergify.yml`](../../.mergify.yml)).

When `main` moves on, Mergify merges it into each such pull request, unless they
conflict, which is left to whoever made the pull request. The new commit cancels
the CI runs of the commit before it (`concurrency` in each workflow), so the
tests run again on `main` as it is now, and nobody has to notice that it moved.
A run on `main`, or one started by hand, is never canceled. A push's run of the
Windows CI that is canceled while it publishes leaves some files of its package
in the draft release; the next run that publishes replaces them.


## Running the macOS CI on Intel

The macOS CI runs on Apple Silicon (`macos-26`). To run it on Intel
(`macos-26-intel`), run the "CI on macOS" workflow manually: **Run workflow** in
the Actions tab, or `gh workflow run ci-on-mac.yml --ref <branch>`. Do this
before merging changes related to Intel Mac support, such as updating Electron
and electron-builder. The manual `test (macos-x64)` check is not a required
branch-protection check.


## Changes that skip the tests

A push or pull request that changes only documents (the Markdown files and the
document folders of `docs/`, `README.md`, `AGENTS.md`, `LICENSE` and
`.github/ISSUE_TEMPLATE/`, as listed in
[`.github/ci-filters.yml`](../../.github/ci-filters.yml)) skips the tests. The
website is not a document: `docs/index.html`, the landing page in each language
(`docs/<code>/index.html`), `docs/github-pages/`, `docs/docs-resources/` and
`docs/sitemap.xml`. CI checks its texts and its layout.
