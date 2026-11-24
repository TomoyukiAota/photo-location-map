# CI

Read this before renaming a CI check, changing branch protection or Mergify, or
merging a change related to Intel Mac support.


## Check names

Ubuntu CI uses Ubuntu 26.04 LTS and reports `test (ubuntu)`, and
`e2e against the development build (ubuntu)` from a job of its own that runs
beside it. The regular macOS check is `test (macos-arm64)`; the manual Intel
check is `test (macos-x64)`.

Each of `test (ubuntu)` and `test (windows-latest)` comes from a job that only
reads the results of two jobs, `test (<os>), part 1 of 2` and `part 2 of 2`,
which run the tests on that OS at once: each makes the package and runs half of
the e2e suite (`PLM_E2E_SHARD`, in
[`test/e2e/playwright.config.mjs`](../../test/e2e/playwright.config.mjs)), and
part 1 also runs the checks and the unit tests. On Windows, part 1 runs the
uninstaller test and part 2 publishes. `test (macos-arm64)` runs all of it in
one job, as the manual Intel check does: GitHub was short of macOS runners, and
a part that got none failed the check
([`ci-on-mac.yml`](../../.github/workflows/ci-on-mac.yml)).

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

Mergify's merge queue merges a pull request of the owner that has the label
`automerge` ([`.mergify.yml`](../../.mergify.yml)):

1. The pull request enters the queue once its own required checks have passed
   or been skipped. Mergify takes them from branch protection.
2. The queue tests it on top of `main` and of the pull requests ahead of it. It
   pushes a branch `mergify/merge-queue/…` with them merged together, and opens
   a draft pull request of it, `merge queue: …`. Up to two such tests run at
   once (`max_parallel_checks`), as each takes a macOS runner, of which GitHub
   gives the repository five at once.
3. The branch's push run of the three CI workflows reports the required checks.
   The draft pull request runs only `ci-on-fork-pull-request.yml`, whose jobs it
   skips. Once the checks have passed or been skipped, Mergify merges the pull
   request with a merge commit, and deletes the branch.

A pull request that already contains the latest commit of `main`, and is alone
at the front of the queue, is merged at once on its own checks, which tested
that very result (Mergify's "Direct Merge").

A pull request whose test fails leaves the queue, with the label `dequeued` and
a comment of Mergify, and the tests of those behind it start again without it.
Taking the label off, or a new commit, also takes a pull request out of the
queue. When `main` moves on outside the queue, the queue tests its pull requests
again on top of it.

Branch protection does not require a pull request to be up to date with `main`:
the queue's test of the result replaces that, and Mergify pushes nothing to the
pull request. While it did, Mergify queued nothing, and said so in a comment,
"Configuration not compatible with a branch protection setting". A new commit on a branch cancels the CI runs of the commit before
it (`concurrency` in each workflow); a run on `main`, or one started by hand, is
never canceled. The push run of a queue branch also runs the Windows
`[Publish to GitHub Releases]` steps, whose draft release is an expected
byproduct (AGENTS.md, "The Windows CI publishes on purpose"). A run of the
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
`docs/sitemap.xml`. CI checks its texts in every language
(`npm run test:website`), and its layout in the e2e suite's cases of the
website, which look at a few of its languages. After a change to its layout,
run `node test/website/layout-in-every-language.mjs`, which looks at every
language (`docs/TRANSLATING.md`).
