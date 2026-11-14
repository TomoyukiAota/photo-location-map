# CI

Read this before renaming a CI check, changing branch protection or Mergify, or
merging a change related to Intel Mac support.


## Check names

Ubuntu CI uses Ubuntu 26.04 LTS and reports `test (ubuntu)`. The regular macOS
check is `test (macos-arm64)`; the manual Intel check is `test (macos-x64)`.
These check names stay stable when runner versions change. Keep branch protection
and Mergify aligned with the regular check names. When renaming a required check,
first make the workflow and Mergify changes and confirm the new check passes,
then replace the old context in branch protection.


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
