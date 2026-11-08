# Dependency lifecycle audit

Continuation: [staged remote-removal execution plan](../20261106_remove-electron-remote/PLAN.md).
The audit is complete. The owner selected final option C with measured 0/A/B/C
checkpoints; the current request records that plan and does not start implementation.

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
on codex/dependency-lifecycle-audit, based on that merged main and brought up to
main 4ade1268 on 2026-11-08. The initial audit added PLAN.md and REPORT.md;
later design/execution documents extend that work.
No dependency migration or manual CI dispatch was
performed for this audit, and no long-running audit process remains.

Continue from REPORT.md when implementation is requested, writing a scoped
plan and preserving feature/UI behavior before changing dependencies. Refresh
the upstream evidence rather than assuming these statuses persist.

## Follow-up scope

The purpose of this work is to assess substantial dependency migrations that
could affect production code, so they can be completed before feature work
builds on the affected areas. Removing every archived utility is not a goal.
Lifecycle status informs that decision; it does not by itself justify a rewrite.

Keep cross-env. It is used only by development/test commands, no relevant defect
has been established, and no clearly better replacement has been identified.
Neither env-cmd nor a new Node bootstrap is selected. The earlier replacement
recommendation is withdrawn; do not implement or schedule it solely because
cross-env is archived or because an alternative exists. Release age alone does
not establish that env-cmd is better maintained.

The owner deferred Moment and moment-timezone migration until evaluating Temporal
with the required stable specification/runtime support. Zone.js belonged to a
separate zoneless Angular task, completed on main on 2026-11-08 and outside this
follow-up.

The owner wants to remove @electron/remote and selected option C as the final
goal, with measured options A and B as intermediate stages. It touches production
module access, dialogs, paths, storage and EXIF. The package is maintained but
discouraged, not formally retired. The executable plan is linked above;
implementation has not started or been authorized by the planning request. Preserve features/UI; consult the owner
about any unavoidable behavior or appearance change.

## Remote removal design checkpoint

Read REMOTE_OPTIONS.md. Inventory direct imports, indirect storage
and startup dependencies, current Electron privileges, and the separate photo
viewer contract. Compare focused IPC removal, main-owned domain services and a
full preload/contextBridge/isolation migration. Explicitly account for import-time
settings/version reads, main-owned EXIF reader cleanup, persistence-before-restart,
structured-clone boundaries and existing Node-enabled workers. Do not assume
removing the package also removes all renderer Node privileges. The proposal and
independent review are complete; the separate viewer was checked statically and
implementation still requires runtime regression tests. Follow the new execution
plan after an explicit instruction to start, rather than restarting the audit.
