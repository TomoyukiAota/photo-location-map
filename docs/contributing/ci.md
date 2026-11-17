# CI

Read this before renaming a CI check, changing branch protection or Mergify, or
merging a change related to Intel Mac support.


## Check names

Ubuntu CI uses Ubuntu 26.04 LTS and reports `test (ubuntu)`. The regular macOS
check is `test (macos-arm64)`; the manual Intel check is `test (macos-x64)`.
These check names stay stable when runner versions change. Branch protection
requires the regular ones, and Mergify takes them from it (see "Merging" below),
so they are listed there only. When renaming a required check, first change the
workflow and confirm that the new check passes, then replace the old context in
branch protection.


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
website, `docs/index.html` and `docs/github-pages/`, is not a document: CI
checks its texts and its layout.
