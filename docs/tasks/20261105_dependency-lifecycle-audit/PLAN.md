# Dependency lifecycle audit

## Scope

Audit the current dependency graph for npm deprecation notices and official
upstream retirement, archive, maintenance-only or migration notices, including
packages that emit no install warning. This is an investigation, not permission
to change application behavior, UI, dependencies or release tooling.

Baseline: commit 28f3b9aac550823b63706ef4ce47bbd9e1ee24b5 on
codex/remove-deprecation-warnings, 2026-11-05. Read AGENTS.md and the dependency
guide; keep all evidence in English and public-safe.

## Steps and resume instructions

1. Enumerate direct dependencies and all unique package/version pairs in the
   lockfile. Check both stored lock metadata and live exact-version npm registry
   metadata; record failures instead of treating them as negative findings.
2. Review official project documentation/repositories for lifecycle statements,
   prioritizing older packages and known ecosystem transitions. An old release
   or an npm warning-free install is not proof of either retirement or support.
3. Trace findings to actual imports, dependency paths and production/test/build
   exposure. Separate package retirement from a deprecated API or release line.
4. Record confirmed findings, primary sources, review priorities and limitations
   in REPORT.md. Cross-review classifications. Do not implement migrations.

If interrupted, inspect git status first, preserve unrelated changes, read this
plan and REPORT.md if present, and inspect optional artifacts under
.upgrade-artifacts/dependency-lifecycle-audit/ before repeating network scans.
Do not reinstall dependencies or run packaging just for this read-only audit.

## Status

- [x] Scope and durable investigation plan recorded.
- [x] Live registry scan complete, including all failures classified.
- [x] Official lifecycle evidence and actual usage reviewed.
- [x] Final report and cross-review complete.

The earlier warning-removal and Vitest migration results remain in the sibling
task directories. This audit deliberately also checks upstream notices absent
from npm's deprecated field; it does not assume those earlier zero-warning
results mean every upstream project is actively developed.

## Final checkpoint

REPORT.md contains the findings, exact dependency paths, primary sources,
priority suggestions and limits. Live exact-version metadata for all 1,108
lockfile pairs and four additional CDN packages has no npm deprecation notices
or lookup errors. Upstream README/repository checks nevertheless found explicit
deprecations, an unsupported release line, archived origins and limited
maintenance policies. Thirteen extracted origins are archived, four of which
explicitly moved development to maintained monorepos; do not conflate them.

Independent review checked lifecycle classifications and production/test/build
exposure. Corrected an initially misattributed require-from-string parent to the
verified Ajv and jsdom dependency paths. The report distinguishes installed,
copied-to-app and actually invoked code, and does not equate npm warning-free
installation with active maintenance. Git comparisons confirm package.json,
package-lock.json and all application/test/release files remain unchanged.

This investigation is complete and implementation is deferred. PR634 was merged
separately as d57cbfdff69daa5b81635547d2eec585aa3cd277. The audit documents live
on codex/dependency-lifecycle-audit, based on that merged main; only PLAN.md and
REPORT.md differ from main. No dependency migration or manual CI dispatch was
performed for this audit, and no long-running audit process remains.

Continue from REPORT.md when implementation is requested, writing a scoped
plan and preserving feature/UI behavior before changing dependencies. Refresh
the upstream evidence rather than assuming these statuses persist.

## Follow-up scope

The owner deferred Moment and moment-timezone migration until evaluating Temporal
with the required stable specification/runtime support. Keep both in maintenance
use for now. Zone.js belongs to a separate zoneless Angular migration and is
outside this follow-up. Current direct-dependency discussion concerns cross-env
and @electron/remote; no implementation has been requested yet.

For cross-env, prefer assessing a small Node-only test bootstrap before adding a
replacement package. The three uses set fixed variables before Electron-Mocha
main/renderer tests and package tests. Set them before launching Electron, and
preserve assignment precedence, arguments, child inheritance, exit status and
Windows/Linux signal behavior. Do not move them only into .mocharc files loaded
inside Electron. A separate package-test bootstrap preserves the distinction
between the npm test command and direct runner invocation/notarization.

Node's stable --env-file is another option, but existing environment values win;
cross-env currently overwrites the named values. env-cmd is a file-based package
alternative with default overwrite behavior. REPORT.md records the primary
references and tradeoffs. These are recommendations to evaluate, not a tested
migration or permission to change the runtime/release pipeline.
