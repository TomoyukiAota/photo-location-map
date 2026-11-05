# Narrow legacy removal adapter proof

This records the initial isolated proof. The adapter and durable tests have since
been integrated into `compat/rimraf` and
`test/deprecation-warnings/legacy-rimraf.cjs`; consult `DEPENDENCIES.md` and
`PLAN.md` for current installation/validation status. Resume from tracked files,
not the temporary prototype paths below.

This is an isolated feasibility result, not an installed production change.
The prototype and executable probe live only in `/tmp/plm-rimraf-probe/`.
No repository runtime code, package manifest, lockfile, or installed dependency
was changed for this proof.

## Actual supported consumer contract

The current lockfile has exactly two runtime dependents on legacy rimraf:

- Karma 6.4.4, `lib/temp_dir.js`: `rimraf(path, done)`.
- Temp 0.9.4, `lib/temp.js`: `rimraf(path, { maxBusyTries: 6 }, callback)`
  and `rimraf.sync(path, { maxBusyTries: 6 })`.

Both consumers pass generated temporary paths. Temp's cleanup paths can be files
or directories; Karma's paths are directories. Electron-winstaller uses Temp's
tracked directory helper and therefore also needs synchronous process-exit
cleanup to work. Neither consumer injects filesystem functions, supplies
`emfileWait`, uses a rimraf CLI, expects a returned Promise, or passes a custom
glob configuration.

Legacy rimraf treats an existing path literally even when it contains glob
characters. It expands a missing glob-like path and treats already absent paths
as successful deletion. Preserve that literal-first rule: a temporary directory
can contain brackets in a parent path or caller-supplied prefix.

## Prototype

The 51-line CommonJS prototype provides the old callback function and `.sync`
entry point using Node's maintained `fs.rm` implementation with recursive and
force enabled. It maps the caller's `maxBusyTries` to `maxRetries`, preserving
the default value of three and Temp's explicit six; retry delay is 100 ms.
The underlying Node implementation handles platform-specific removal behavior
and removes links without following their targets. Supported glob 13 handles
the missing-pattern fallback, and `glob: false` / `disableGlob: true` retain
literal behavior.

It rejects unsupported option keys rather than silently ignoring future caller
changes. This is a deliberately bounded adapter for the inspected consumers,
not a promise to emulate the complete rimraf 2/3 API.

Primary references: the installed source of Karma 6.4.4 and Temp 0.9.4, the
published rimraf 2.6.3/3.0.2 source, and
[Node 26's removal API](https://nodejs.org/api/fs.html#fsrmpath-options-callback).
The Node documentation describes recursive removal retries with linear backoff
for busy, descriptor-exhaustion, nonempty-directory, and permission errors.

## Evidence

On 2026-11-05, `mise exec -- node --test
/tmp/plm-rimraf-probe/probe.test.cjs` passed all six tests. The probe injects the
prototype only when the actual Karma or Temp module requires rimraf; it does not
replace those consumers with copies or modify their files.

1. Actual Karma `temp_dir.remove`: recursively delete a populated directory and
   accept a second deletion of the absent path.
2. Actual Temp callback cleanup: remove a tracked file and populated directory,
   including a read-only file, and preserve the reported cleanup counts.
3. Actual Temp synchronous cleanup: remove the tracked directory while retaining
   the contents of an external directory reached by a symlink.
4. Literal-first paths: delete an existing `[ab]` directory without deleting its
   sibling `a`, through both callback and synchronous APIs.
5. Missing patterns: expand a missing `*.tmp` pattern, while `glob: false` leaves
   its matches intact; callback and synchronous paths both pass.
6. Completion/error behavior: deliver success and `ENOTDIR` errors exactly once;
   reject unsupported custom filesystem-option drift visibly.

## Acceptance limits and risks

- macOS proof does not establish Windows behavior. The integrated adapter must
  pass the same tests on Windows, plus the existing Windows installer/package
  workflow. Existing native Node removal behavior is preferable to another
  unmaintained manual platform-specific implementation.
- Node's descriptor-exhaustion retry timing differs from old rimraf's global
  `emfileWait` policy. Neither installed consumer supplies that option; this is
  an explicit implementation difference under severe descriptor exhaustion.
  Likewise, old synchronous Windows removal contained an internal tight retry
  loop; the supported replacement uses Node's documented linear backoff.
- This proof does not claim compatibility with custom filesystem hooks,
  preservation-root flags, arbitrary user-facing rimraf CLI invocations, or all
  historical glob options. Scope the dependency replacement to Karma and Temp,
  document the contract beside it, and recheck the consumers on upgrades.
- A repository-owned adapter adds a maintenance obligation. It is small and
  bounded for these consumers, but should be removed when compatible upstream
  packages eliminate their legacy dependencies.
- Integration must use actual code replacement, include durable behavior tests,
  and verify fresh installation and packaging. Do not remove warnings by
  changing package deprecation metadata or filtering console output.
