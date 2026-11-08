# Execution status and handoff

Updated 2026-11-09 (Asia/Tokyo). This file is the execution ledger; keep it current
after every meaningful result and before stopping. Do not infer completion from
the existence of a plan or from an agent's previous messages.

## Current checkpoint

- State: PLANNING COMPLETE; IMPLEMENTATION NOT STARTED.
- Authorized action now: documentation only. Await an explicit instruction to
  start implementation. No harness, baseline or migration was executed.
- Final target: C, via measured 0 -> A -> B -> C1 -> C2. C1 alone is incomplete C.
- Documentation branch: codex/dependency-lifecycle-audit, with main merged in at
  4ade12687fd7f365d14ab65538d4aacdd2906c6a (2026-11-08) and at
  b7c9bfe641d35330c5324dd49c464c8589ab2ff6 (2026-11-09). Its difference
  from main is task documents only.
- Source snapshot before these documents:
  cf4fa9b796e3789654cd34c408c7a980967877d5, based on main d57cbfdf. On
  2026-11-08 the plan was revised for the changes on main since then: the
  Google Maps view removed, the signals/zoneless/standalone migration complete,
  headless e2e window options, bundled Leaflet, removed npm overrides and the
  new AGENTS.md sections (PLAN.md, "Changes on main since the plan was
  written"). The remote usage sites were unchanged then. On 2026-11-09, PR 673
  (merged 2026-11-08) was recorded: the Explorer context-menu registration now
  runs in main over IPC, so one of stage A's five operations is done ahead of
  the plan, and rage-edit is gone.
- Last accepted IMPLEMENTATION stage: none. Baseline 0 is NOT RUN.
- Runtime/dependency/test/build/deployment changes in this planning task: none.
- Task-owned running processes/CI/benchmark sessions: none started by this task.
- External viewer changes/deployments: none. Earlier source inspection is
  historical evidence; refresh/pin its build at execution kickoff.
- Blocking owner decisions now: none for writing the plan. Implementation and
  any separately required production rollout authorization remain future work.

## Resume first action

When implementation is explicitly started, read AGENTS.md, PLAN.md and
PERFORMANCE.md, inspect git status/log and live processes/CI, and begin stage 0
step 1. Refresh the actual code base before selecting its baseline. Do not run a
nonexistent performance command: implement/document the reusable harness first.

Keep cross-env and Moment/timezone out of this work; the zoneless Angular migration
is already on main and this removal follows it (owner, 2026-11-08). Preserve
features/UI and original visual references. No instruction here authorizes
merging a future PR or publishing the separate viewer without applicable approval.

## Stage ledger

| Stage | State | Accepted source/build | Tests/CI | Performance series/result | Exact next action |
| --- | --- | --- | --- | --- | --- |
| 0 | NOT STARTED | None | NOT RUN | No harness or baseline | Inspect base/inventory, build common harness after authorization |
| A / 1 | NOT STARTED | None | NOT RUN | NOT RUN | Wait for accepted 0 |
| B / 2 | NOT STARTED | None | NOT RUN | NOT RUN | Wait for accepted A |
| C1 / 3 main window | NOT STARTED | None | NOT RUN | NOT RUN | Wait for accepted B |
| C2 / 3 viewer | NOT STARTED | None | NOT RUN | NOT RUN | Compatible viewer preview may be prepared during C1; no host release before rollout gate |

## Required update fields while executing

For the active stage, record:

```text
Date/time and stage:
Source branch/HEAD and working-tree files:
Last accepted source/artifact (hash + location):
Harness/protocol/input/viewer IDs:
Commands and outcomes (pass/fail/incomplete, log paths):
Current tests/CI runs and failure classification:
Performance summary and comparison decision:
Pending writes/owned profile or temporary-data cleanup:
Owned PID/session + command/start time + log/status:
External viewer/deployment/compatibility state:
Unresolved issue and concrete owner decision, if needed:
Next executable action, including command when it exists:
```

Keep failed attempts and their disposition. For a new protocol series, identify
which original 0/predecessor/candidate measurements must be repeated. Do not
overwrite an accepted row with unverified WIP. Raw artifacts may be ignored,
but accepted public-safe summaries and decisions must be committed here.

## Planning verification

This delivery must have checked Markdown links, whitespace and cross-document
stage/scope consistency, plus a git diff proving only task documents changed.
It must not claim functional tests, performance measurements or independent
viewer deployment. Record any subsequent planning edits in git history; actual
execution replaces this paragraph with dated checkpoint results as it proceeds.

2026-11-08: the plan was revised for the changes on main (PLAN.md, "Changes on
main since the plan was written"). Links, whitespace and cross-document
consistency were checked again, and the diff against main 4ade1268 is task
documents only. Still no functional test, measurement or viewer change.

2026-11-09: main b7c9bfe6 (PR 673) merged into the branch and recorded in
PLAN.md; the same checks were repeated, and the diff against main is task
documents only. Review of the pull request then had the baseline require
b7c9bfe6, the window mode per platform (hidden windows are throttled on
Windows and Linux), a viewer milestone that exists headless, and the Linux e2e
caveat written in. The owner then limited performance measurement to macOS and
Windows: PLM does not support Linux officially, and Linux CI stays functional.
Still no functional test, measurement or viewer change.
