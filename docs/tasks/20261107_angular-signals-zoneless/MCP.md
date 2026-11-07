# Angular CLI MCP server: evaluation on this workspace

Checked on 2026-11-07 with the workspace-local `@angular/cli` 22.2.5 (`ng mcp`;
server name `angular-cli-server`, protocol 2025-06-18). Registry `latest` was
22.2.6 and `next` 22.3.0-next.5 at the time. Command-line options: `--root`
(allowed directories), `--read-only` (register only read-only tools),
`--local-only` (register only tools that need no internet).

## Tools

Listed by the server itself (`tools/list`):

| Tool | Purpose | Read-only | Needs internet | Input |
| --- | --- | :-: | :-: | --- |
| `list_projects` | Workspaces and projects from `angular.json`; mandatory first call | yes | no | none |
| `get_best_practices` | The bundled best-practices guide, version-specific with `workspacePath` | yes | no | `workspacePath` |
| `search_documentation` | Search angular.dev | yes | yes | `query`, `includeTopContent`, `version` |
| `onpush_zoneless_migration` | One migration step at a time toward OnPush/zoneless | yes | no | `fileOrDirPath` |
| `run_target` | Run `build`, `test`, `lint`, `e2e`, ... | no | no | `workspace`, `project`, `target`, `configuration`, `options` |
| `devserver_start` / `devserver_stop` / `devserver_wait_for_build` | `ng serve` lifecycle and build logs | no / no / yes | no | `workspace`, `project`, `port` / `timeout` |
| `ai_tutor` | Interactive tutorial prompt | yes | no | none |

The server's instructions tell an agent to call `list_projects` first, to call
`get_best_practices` before writing code, to use `search_documentation` for
conceptual questions, and to discover schematics with
`ng generate <package>: --help` in a shell.

## Setup for the coding agents used here

Run the workspace-local CLI (`npx ng mcp`) rather than the documented
`npx -y @angular/cli mcp`: the local one matches the project's CLI version and
needs no download. `mise exec --` selects the Node.js from `mise.toml`. Neither
file below contains a secret, so both can be committed.

Claude Code, project scope (`.mcp.json` in the repository root; Claude Code
asks for approval before first use):

```json
{
  "mcpServers": {
    "angular-cli": {
      "type": "stdio",
      "command": "mise",
      "args": ["exec", "--", "npx", "ng", "mcp"]
    }
  }
}
```

Codex, project scope (`.codex/config.toml`; applied only in a trusted project,
and shared by the CLI, the desktop app and the IDE extension). Raise
`tool_timeout_sec` (default 60) if `run_target` is used for production builds:

```toml
[mcp_servers.angular-cli]
command = "mise"
args = ["exec", "--", "npx", "ng", "mcp"]
tool_timeout_sec = 300
```

From the command line instead: `claude mcp add --transport stdio --scope project angular-cli -- mise exec -- npx ng mcp`
writes the same `.mcp.json`; with `--scope user` instead, the server is
registered for every project of that user and nothing is written to the
repository, but it starts only in projects where `npx ng` finds an Angular
CLI, since it runs the CLI of the project that is open. `codex mcp add angular-cli -- mise exec -- npx ng mcp` has no
scope option and writes to Codex's default configuration,
`~/.codex/config.toml`, for every project; the project file above is edited
by hand. Add `--read-only` or `--local-only` after `mcp` to restrict the tool
set. The
Claude Code reference is [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp);
the Codex reference is [developers.openai.com/codex/mcp](https://developers.openai.com/codex/mcp).

## What the server says about this application

Driven over stdio with a small script (initialize, `tools/list`, `tools/call`).

- `list_projects`: one workspace, project `photo-location-map`, builder
  `@angular/build:application`, `frameworkVersion` 22, unit test framework
  Vitest, targets build/serve/extract-i18n/test/lint.
- `get_best_practices`: the 59-line guide at
  `node_modules/@angular/cli/src/commands/mcp/resources/best-practices.md`.
  It conflicts with the repository's current, deliberate choices (NgModules,
  constructor injection, explicit `Eager`), which the lint configuration
  documents. Decide the lint policy in stage 0 so agents following the guide
  and the lint do not fight.
- `onpush_zoneless_migration`:

  | Input | Result |
  | --- | --- |
  | `src/app` (directory) | `ENOTDIR: not a directory, lstat '.../src/app/app.component.spec.ts/angular.json'` |
  | `src/app/thumbnail-generation/status-bar/component/thumbnail-generation-status-bar.component.ts` (Eager component with a spec) | same error, on its spec file |
  | `src/app/loading-folder/dialog/loading-folder-dialog.component.spec.ts` | same error |
  | `src/app/sidebar` (directory without specs), `src/app/home/home.component.ts`, `src/global-variables` | "No actionable migration steps were found", followed by the generic test-debugging guide |

  Two things in the tool's source explain this (same in upstream `main` on
  2026-11-07):

  1. `migrate-single-file.js` skips any component whose `changeDetection` is
     `OnPush`, `Default` or `Eager`, and only guides components with no
     strategy. Since the v22 update stamped `Eager` on every component here,
     the tool has nothing to say about any of them.
  2. For a spec file (found directly, inside a directory, or as the sibling of
     a component), `migrate-test-file.js` calls `searchForGlobalZoneless` with
     the file path, and `workspace-utils.js` then checks
     `<spec file>/angular.json` as if the file were a directory. The resulting
     `ENOTDIR` aborts the whole call.

  Consequence: for this repository the planner provides no per-component
  steps. Reporting the second point upstream is worthwhile; it is an
  outward-facing step for the owner to decide. Its embedded instructions are
  still a good checklist, summarized below.
- `run_target` and the dev-server tools were not exercised; they wrap
  `ng build`, `ng test`, `ng lint` and `ng serve`, which the npm scripts
  already run.
- The tool's `NgZone` analyzer flags only `onMicrotaskEmpty`, `onStable`,
  `isStable` and the `assert*`/`isInAngularZone` helpers. This application uses
  only `NgZone.run`, which the tool explicitly permits.

## The tool's own migration checklist

Transcribed from `prompts.js` so it is usable without the tool:

- For each component, find every property the template reads and either
  convert it to a signal (preferred) or call `ChangeDetectorRef.markForCheck()`
  right after each write. Properties that are already signals or are read
  through the `async` pipe need nothing.
- Keep `NgZone.run` and `NgZone.runOutsideAngular`; replace `onMicrotaskEmpty`
  and `onStable` subscriptions with `afterNextRender` (one-off) or
  `afterEveryRender` (continuous); drop `isStable` checks and the `assert*`
  helpers.
- First keep `ChangeDetectionStrategy.Eager` with a TODO, test, then move to
  `OnPush` as a separate step.
- In tests, add `provideZonelessChangeDetection()` once in the top-level
  `beforeEach`, remove every `provideZoneChangeDetection()`, convert test host
  properties to signals, and expect `ExpressionChangedAfterItHasBeenCheckedError`
  from `fixture.detectChanges()` where a template value changed without a
  notification. Only its no-changes pass raises it, and that pass checks
  `Eager` views but skips unmarked `OnPush` ones unless the exhaustive check is
  on; a view refreshed for another reason renders the change silently. A test
  that only awaits `fixture.whenStable()` is not told about an unnotified
  change (it rejects only when an application error happens while it waits),
  and the view after it can be stale. So assert on the DOM. `fixture.whenStable()` no longer waits for timers: poll,
  use `fakeAsync`/`tick`, or a mock clock.
  (This repository's TestBed is already zoneless; see REPORT.md. Its tests
  load no `zone.js/testing`, so `fakeAsync` and `tick` throw here: poll, or
  use Vitest's fake timers, `vi.useFakeTimers()`.)
