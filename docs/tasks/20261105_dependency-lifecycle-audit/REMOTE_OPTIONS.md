# Options for removing @electron/remote

The owner selected final option C with measured A/B intermediate checkpoints.
Use the [execution plan](../20261106_remove-electron-remote/PLAN.md) and its STATUS
and PERFORMANCE documents to implement after explicit kickoff. This file retains
the design reasoning and alternatives; implementation and measurements have not
started. It describes the code of 2026-11-05. The execution plan's "Changes on
main since the plan was written" lists what has moved since, notably that the
Google Maps view is gone and that the application is zoneless and standalone,
and the plan governs where the two differ.

Design investigation against 46d854e, 2026-11-05. The owner wants to remove the
dependency and requested alternative rewrites with pros/cons before selecting
implementation. No application/dependency changes, installs or tests are part
of this proposal. Preserve features, UI, persisted data and release behavior.
Cross-env stays; Moment/Temporal remain separate work; the zoneless Angular
migration, separate work at the time, has since landed on main.

## Actual responsibilities

| Current dependency | Suggested explicit boundary |
| --- | --- |
| About/welcome version and import-time prerelease classification | Immutable startup metadata from main, available before application imports. |
| app.getPath(userData), synchronous UserDataStorage | Option A retains local synchronous file access using startup paths; B/C move ownership into main with an initialized renderer cache and acknowledged writes. Preserve the current files/keys and failure fallbacks. |
| Google Maps key lookup | Read fresh on demand, preserving a key file created/edited after startup, its path guidance and missing/invalid fallbacks. Do not put this externally edited file in a stale startup cache. **Moot since 2026-11-08:** the Google Maps view and its key file were [removed](../20261108_remove-google-maps/REPORT.md). |
| Folder dialog, current BrowserWindow and directory-history stat | Main opens the native dialog for the requesting window; return selection/cancellation data. Preserve confirmed history, the one-second directory-check timeout and pending-check deduplication. |
| app.getPath(exe) for Windows Explorer menu registration | A fixed main operation registers the same three targets and command arguments; no arbitrary registry/path API. **Done on main 2026-11-08 (PR 673):** main runs reg.exe over invoke/handle; the renderer's remote and rage-edit use for this are gone. |
| restartApp() | A main operation waits for required persistence/cache work, then calls app.relaunch() and app.quit(), retaining quit hooks. |
| remote.require('exifr') | A main-side EXIF operation uses the existing managed reader, returns metadata/thumbnail bytes, and leaves DOM-based image rotation/model construction in renderer. |
| RequireFromMainProcess fs-extra/os used by main log writer | Direct local imports in main. Renderer log append already uses IPC; preserve that ownership. |

The indirection is not just a few component imports. Relevant sources include
src-shared/require/require-from-main-process.ts, user-data-storage/user-data-storage.ts,
user-settings/user-settings.ts, version/is-prerelease-version.ts,
process/restart-app.ts and the renderer EXIF, dialog and OS settings helpers.

## Common design rules

Use Electron's existing [invoke/handle IPC](https://www.electronjs.org/docs/latest/tutorial/ipc)
for operations requiring responses. Define capabilities such as chooseFolder,
readExif, saveSettingsAndRestart and addExplorerContextMenu. Do not implement
another generic remote.require, arbitrary object proxy or unrestricted method/
filesystem endpoint. No substitute RPC package is necessary for these options.

[IPC serialization](https://www.electronjs.org/docs/latest/api/ipc-renderer)
does not preserve custom prototypes, and errors lose information. Exchange
plain data, explicit error fields and byte arrays; reconstruct application
models in renderer. Derive a dialog parent from the sender and validate intended
windows/frames and operation inputs. Limit capability exposure per window.
These are the API design requirements, not claims of an established exploit.

### Startup and persistence

UserDataStorage captures paths/modules at class initialization;
currentUserSettings loads from disk at module evaluation; prerelease detection
captures app.getVersion() at module evaluation. src/main.ts statically imports
the application (AppModule then; AppComponent and appConfig since the standalone
migration) and Logger before its bootstrap function runs. Awaiting an IPC request
inside the current bootstrap body is too late.

Options are a bounded synchronous startup metadata snapshot before those imports,
or a thin entry that awaits initialization before dynamically importing the
application graph. For B/C, a settings cache preserves synchronous rendering reads
while main owns persistence. Write only intended keys, preserve main-owned UUID,
launch/history and viewer state, propagate errors, and finish acknowledged saves
before close/relaunch. Preserve which settings take effect only after restart.
Do not overwrite a whole store from a stale renderer snapshot.

### EXIF placement

The source explicitly records prior slowdown and failures when many files were
parsed in renderer. Moving exifr into renderer merely to delete remote is not
recommended. Keep electron-util/managed-exifr.cjs and its finally/close ownership
in main initially, preserve chunked reading and queue/backpressure behavior, and
return only the selected metadata and embedded thumbnail. A combined per-file
request can avoid repeated object/property IPC, but performance is unmeasured.

Parsing in a [utility process](https://www.electronjs.org/docs/latest/api/utility-process)
or worker is an independent later decision if measurement shows main contention.
It adds process startup, crash/exit handling, transfer and shutdown costs; it is
not required to remove remote. Do not claim an automatic speedup or make every
photo a new process. Keep thumbnail rotation requiring DOM/canvas in renderer.

## Option A: Focused replacement, existing renderer privileges

Replace remote app/dialog/EXIF calls with fixed IPC operations. Fetch immutable
main metadata before imports; use local renderer fs-extra/path/os for the current
synchronous storage interface. Remove the generic RequireFromMainProcess branch,
remote module bridges and main registration once all consumers are migrated.
Keep the present Node-enabled renderers/workers and other IPC architecture.

**Pros:** smallest scope; most storage callers keep their signatures and timing;
fewer startup/UI regressions to isolate; the package can be removed without a
whole renderer-platform rewrite. No new runtime dependency.

**Cons:** renderer filesystem access remains; file I/O changes process ownership
and needs validation; storage still has multiple-process ownership; a bounded
sync initialization path may remain. Future isolation requires more work. Package
removal is not equivalent to a Node-free renderer or complete security hardening.

**Fit:** choose when immediate remote removal with limited structural change is
the priority. It is a deliberate intermediate architecture, not a fake replacement
of remote's complete API.

## Option B: Main-owned domain services and an asynchronous application API

Define a typed application-facing interface around app metadata, settings,
folder selection, EXIF, restart and Windows integration. Implement operations
in main and an IPC client in a single renderer transport module. Move the
remote-dependent persistence into main. Initialize metadata/settings before
imports, read cached state synchronously for rendering, and await durable writes
before requesting restart. Keep unrelated Node integrations/window settings initially.
This option does not require contextBridge or claim context isolation yet.

Restart acknowledgement needs its own contract: main completes durable writes
before relaunch/quit, while renderer destruction may end IPC before an ordinary
invoke response arrives. Acknowledge persistence before shutdown or define an
explicit one-way restart request; do not require a successful reply after quit.

**Pros:** removes remote and clarifies production ownership; eliminates repeated
remote filesystem/object calls; concentrates asynchronous error handling and
tests; new features use an application API rather than main-process objects.
The interface can be retained if its transport later moves into preload.

**Cons:** larger change than A; synchronous storage callers and boot order need
careful adaptation; cache state, save failures and persistence-before-restart
need explicit contracts. Unrelated renderer Node privileges remain. Async IPC
does not make synchronous computation in main nonblocking or guarantee a speedup.

**Fit/recommendation:** the strongest balance for the stated goal of completing
production-impacting dependency work before feature development. It provides a
durable boundary while keeping full renderer isolation as an explicit separate
scope choice. Recommendation is based on source review, not a measured prototype.

## Option C: Full preload/contextBridge and renderer isolation

Use main-owned services as in B, expose only specific capabilities from a preload
through [contextBridge](https://www.electronjs.org/docs/latest/api/context-bridge),
enable contextIsolation and remove renderer Node integration. Replace every
direct Node/Electron import, window.require/process assumption and filesystem
operation in renderer with browser code or explicit services. Assess sandboxing
as a further acceptance target once Node-dependent workers are moved.

**Pros:** completes the modern Electron boundary in one planned migration;
renderer feature code becomes browser-oriented; privileges and test seams are
explicit; avoids carrying a later renderer-Node removal migration into feature
development. No general remote-object or alternative RPC dependency is needed.

**Cons:** substantially wider than removing remote. The application has ten
typed CommonJS bridges, a Node-enabled directory worker, cache/filesystem and
registry code, process detection and browser IPC subscriptions. The separately
loaded photo viewer needs its own integration strategy. Packaging/preload paths,
development reload, local files and HEIC workers all need retesting. More
production changes must be reviewed before relying on this as a feature base.

**Fit:** choose if completing renderer isolation before new features is itself
a requirement. contextIsolation, nodeIntegration and sandbox are distinct
settings; changing one is not proof that the complete boundary is finished.
[Electron sandbox guidance](https://www.electronjs.org/docs/latest/tutorial/sandbox)
requires privileged filesystem/process work to move out of sandboxed renderer
code. Do not merely expose raw ipcRenderer/fs through contextBridge.

## Separate photo viewer contract

The main app creates another BrowserWindow in
src-main/photo-data-viewer/launch-photo-data-viewer.ts. It loads separately
served content and currently has Node integration and no context isolation.
Global browser-window-created registration also enables remote there.
The viewer must be checked independently before removing that global setup or
toggling shared privileges. Its local JPEG/HEIC loading, paths, title, analytics
IPC and saved bounds are acceptance requirements. Static inspection of the
currently configured viewer's eleven initial/lazy JavaScript bundles found no
@electron/remote/electron.remote references, but did find direct buffer/fs/path
imports, synchronous local-file reading, process.type detection and existing
analytics IPC. No photo data was sent or application execution tested during
that inspection.

Therefore A/B appear compatible without a viewer deployment if its Node settings
and existing IPC stay intact. This is an inference from current served code,
not runtime proof or a guarantee about future deployments. C needs coordinated
viewer adaptation for file delivery, environment detection and analytics; the
host cannot merely disable Node and expect current served code to keep working.

### Option C and the View Data feature

Clarified on 2026-11-06: View Data remains a required feature with its existing
UI. Its separate BrowserWindow has its own inline webPreferences; changing only
the main Angular window's preferences does not change that viewer window.
Opening View Data already uses renderer-to-main IPC and main creates the window.
The Angular caller's direct ipcRenderer import becomes an application bridge
method; the feature does not need to be removed or replaced with another viewer.

Two migration scopes are possible:

| Scope | View Data behavior and remaining work |
| --- | --- |
| Isolate the main Angular window first, retain viewer settings | Keep the existing served viewer and Node/analytics contract. This is a viable first stage, subject to real JPEG/HEIC tests, but is not whole-application renderer isolation. |
| Isolate both main and viewer windows | Add a viewer-specific preload bridge and adapt the served viewer before disabling its Node integration. Preserve the current photo/metadata UI, window state and display settings. |

For the second scope, main binds the selected photo to that viewer window.
The initial byte-returning readCurrentPhoto proposal is one possible transport,
but it adds whole-image allocation/copy costs and is not a requirement of Node
isolation. Prefer evaluating an authorized resource URL plus small metadata
rather than making full-image invoke/contextBridge results the default. The
viewer can fetch that resource and construct its browser File, preserving the
photo display/decoding flow. The resource transport is detailed below.

Replace Node buffer/path helpers as needed, process.type mode detection with
bridge capability detection, and raw analytics IPC with a dedicated bridge
method. Do not expose fs, arbitrary filesystem URLs or unrestricted ipcRenderer
access to the page. These are unimplemented design candidates, not a measured
transport selection.

The served viewer and desktop app have independent deployments. Publish a
bridge-capable viewer that also supports the legacy entry path for released app
versions, then ship the desktop preload/window-setting changes. Do not remove
the legacy viewer path merely because the new desktop build supports the bridge.
The new isolated window must receive its bridge reliably; a legacy fallback
cannot restore missing Node privileges there.

Fresh GET-only inspection on 2026-11-06 confirmed the same viewer application
build/hash as the previous source review. No photo path/query/data was sent.
The runtime migration is still unimplemented. Acceptance must cover local JPEG
and HEIC, orientation, Unicode/spaces/#/% paths, date/time settings, titles,
window bounds, external links and analytics, plus compatibility with a released
desktop version using the legacy viewer entry path.

## Performance expectations and measurement

Added 2026-11-06. No option has been implemented or benchmarked. There is no
measured overall speed/memory ranking. Option B is recommended for the ownership
boundary and feature-development foundation, not because it is proven fastest.
[Electron's performance guidance](https://www.electronjs.org/docs/latest/tutorial/performance)
likewise calls for profiling the actual application.

| Area | A: focused replacement | B: main-owned services | C: isolated renderer |
| --- | --- | --- | --- |
| Startup | Fewer remote initialization calls may help, but synchronous local storage reads remain. | A consolidated snapshot may reduce round trips; explicit initialization/import ordering also adds work. Net change is unknown. | B's tradeoffs plus preload/bridge setup and changed module loading. Node removal does not establish an overall startup improvement. |
| Settings/UI responsiveness | Local synchronous filesystem work still pauses the renderer. Removing IPC does not remove disk latency. | Cached reads and asynchronous persistence can avoid UI blocking, provided handlers do not perform heavy synchronous work in main. Existing currentUserSettings is already loaded once at startup; do not imply all current renders reread disk. | Can retain B's responsiveness. The extra bridge boundary is not automatically a visible slowdown, but must be measured. |
| Bulk EXIF/thumbnail loading | Shared opportunity to remove remote proxy calls while retaining current parsing/rotation placement. | Same opportunity, with explicit batching/backpressure. Async invoke does not parallelize parsing CPU work. | Same opportunity plus bridge serialization/copying and worker relocation considerations. No automatic throughput advantage over B. |
| Directory traversal | Existing Node-enabled Web Worker stays off the UI thread. | That worker can remain under B's stated scope. | Replace it with an off-thread/main-owned worker design, preserving concurrency/progress. Do not move synchronous traversal onto the main event loop. |
| View Data | Current separate viewer file-loading path remains. | Same if viewer privileges/settings remain. | Whole-image invoke/bridge results add transfer/allocation costs. An authorized resource URL is another transport; full-image JavaScript IPC is not mandatory. Measure first-image latency and process memory. |
| Memory | Fewer proxy objects may help; local fs execution changes ownership. Net reduction is unmeasured. | Bounded queues/caches can control memory; new caches and pending requests can also increase it. | Node removal may remove some allocations, while bridges, byte copies and replacement workers add others. Net process memory is unknown. |

The most concrete shared optimization opportunity is EXIF transport. The
[remote object model](https://github.com/electron/remote#remote-objects) and the
installed implementation use synchronous method/property IPC, including the
ordinary fields of the parse result. A per-file operation returning selected
metadata plus embedded thumbnail bytes can avoid repeated proxy traffic.
However, Buffer is already special-cased as a binary payload; it is not sent
through per-byte property IPC. Plain data is not automatically smaller or
zero-copy. [IPC](https://www.electronjs.org/docs/latest/api/ipc-renderer) and
[contextBridge](https://www.electronjs.org/docs/latest/api/context-bridge) have
serialization/copying behavior that must be included in the comparison.

Keep these existing constraints when assessing all options:

- EXIF's PQueue concurrency of ten currently covers parse, thumbnail extraction,
  renderer rotation and model construction. Keep an equivalent end-to-end
  bound, not just ten simultaneous main parse requests. Releasing slots before
  renderer work finishes can accumulate byte arrays/canvases and increase memory.
- Keep managed-exifr's chunked reads and handle cleanup. Send a file identity to
  the service and return selected metadata/embedded thumbnail, rather than
  copying every original photo into main through renderer IPC.
- Async IPC changes waiting behavior, not the CPU cost or execution thread of
  a handler. Heavy parsing/scanning needs appropriate off-thread work if
  measurements show main contention. Do not create a new process per photo.
- Existing HEIC thumbnail workers and deliberate pool recycling are separate
  memory/performance decisions; removal of remote does not require changing them.
- View Data opening already sends only name/path, not the whole Photo/EXIF
  object. When isolating the viewer, choose its file-delivery transport explicitly;
  Node removal does not mandate a full-image invoke/bridge result. Compare an
  authorized resource URL against byte delivery before selecting it. Do not
  promise zero-copy, zero main memory growth or an automatic improvement.

### Node isolation does not require whole-file JavaScript IPC

The owner's memory/copy concern applies directly to the initial proposal:
main readFile -> complete Buffer -> invoke/bridge -> renderer File. That design
adds full-image allocation and transfer costs. It cannot be recommended as
performance-equivalent to the current local read without measurements.

Node integration controls the page's use of Node APIs; Chromium can still load
permitted resource URLs for images or fetch. The current host's original and
generated-thumbnail images already use file URLs in thumbnail-element.ts; EXIF
already executes in main and returns data through remote. Do not model C as
introducing a new whole-file copy for every existing image operation.

A stable alternative in the installed Electron 45.2.1 is an authorized custom
resource scheme handled by protocol.handle, returning the original
net.fetch(pathToFileURL(selectedPath)) Response. The [versioned documentation](https://github.com/electron/electron/blob/v45.2.1/docs/api/protocol.md)
shows this pattern. Application code need not read the complete image into a
Buffer or call Response.arrayBuffer in main before returning it.

The [versioned implementation](https://github.com/electron/electron/blob/v45.2.1/lib/browser/api/protocol.ts)
can relay an untouched fetch Response through its native loader; otherwise it
uses the Response body stream. It may collect already-buffered chunks, even the
complete body if fetching finished early. Thus this is not proof of zero-copy,
zero main-process RSS or a guaranteed bounded peak-memory value. The handler
still runs in main, and Chromium/decoder buffering remains. Avoid consuming,
locking, cloning or replacing the response body merely to forward the file.
Do not adopt experimental registerSource or deprecated register*Protocol APIs
as a shortcut for this proposal.

For the remotely served viewer, scheme registration, the window's actual session,
fetch/CORS/CSP behavior and a selected-photo-only authorization/lifetime must be
implemented and tested. The viewer may still require the complete image in its
own memory for HEIC decoding. Compare total main/renderer/network/worker memory
and first-image latency against the current direct Node file-read path. The URL
route avoids mandating an application-level whole-file JS IPC payload; it does
not prove identical performance to direct fs access.

Before implementation, record a baseline and compare the chosen design using
the same representative JPEG/HEIC/mixed-folder inputs, machine and versions.
Separate cold/warm caches and repeat enough to assess variance. Measure:

1. Startup to usable UI, first photo ready and folder fully loaded.
2. Main/renderer event-loop stalls and input responsiveness during loading,
   separately from total folder processing time.
3. EXIF/parsing, rotation and UI/DOM construction time; sync IPC count/time and
   bytes transferred across each boundary.
4. Total process peak memory and outstanding file handles, including worker and
   preload changes, not only renderer heap.
5. View Data first JPEG/HEIC display and peak memory for large files, plus
   settings-save acknowledgement and actual restart behavior.

Preserve the existing visual/metadata results while measuring. Performance
claims remain hypotheses until the selected implementation passes these checks;
no artificial percentage improvement or ranking is asserted here.

## Implementation sequence after selection

1. Freeze the chosen scope and inventory main-only operations, startup values,
   allowed settings keys and per-window capabilities. Do not mix in cross-env,
   Temporal or release-tool upgrades.
2. Establish initialization and IPC contracts, then migrate one responsibility
   at a time while retaining the current on-disk state and UI behavior.
3. Preserve the EXIF managed-reader regressions and add genuine IPC round trips
   for metadata, bytes and failures. Do not prove main behavior with renderer
   stubs alone.
4. Test startup/prerelease values, settings save/failure/restart, folder history
   and cancellation, Windows menu registration, logging and real viewer JPEG/HEIC.
   Include actual renderer-triggered date/time/cache relaunch; current E2E often
   closes/relaunches manually and is insufficient for that flow alone.
5. Remove package/lock entries, initialization, per-window enable hooks, bridges
   and remote-specific tests only after their behavior has equivalent coverage.
   Check production code and packaged modules, not just direct imports.
6. Validate unit/real Electron suites, worker/build typing, live reload, unchanged
   visual references and packaging on Windows/Linux/Mac. Run actual signed/
   notarized universal packaging and the appropriate native Intel evidence if
   relevant release/runtime inputs change. Do not disable deliberate Windows
   publishing. Consult the owner if any feature/UI change is unavoidable.

## Resume checkpoint

Design and independent review complete. Options A/B retain current renderer
privileges; C changes those as part of a larger migration. Review clarified lazy
Maps-key freshness and acknowledgement before restart/shutdown. The separate
viewer contract was statically checked, with runtime acceptance still required
during implementation. The owner subsequently selected final C with measured
A/B stages; the linked execution plan records that sequence. Await an explicit
implementation kickoff. No test/build/packaging process was started.
