# Compatibility exceptions

Observed 2026-11-01. Recheck these when upgrading their parent or upstream fixes.
These are specific compatibility decisions, not permission for blanket overrides.

| Package | Highest investigated | Selected | Evidence and revisit condition |
| --- | --- | --- | --- |
| electron-unhandled | 6.0.0 | 4.0.1 | An actual Electron 45 main-process probe fails with ERR_REQUIRE_ASYNC_MODULE: 5/6 have top-level asynchronous initialization. Version 6 additionally installs renderer-crash/unresponsive dialogs with no opt-out switch. Keep synchronous startup and the original error UI; revisit when the public API supports that policy without a listener/source patch or broader startup change. |
| p-queue | 10.0.0 | 9.3.5 | Both bundled Karma and native Electron Mocha renderers reject the queue's DOM EventTarget in Node setMaxListeners before assertions start. The 9 line uses a compatible emitter. Revisit a release fixing the hybrid renderer check; do not mutate global process/EventTarget or patch dependency sources. |
| heic-decode / libheif-js | 2.1.0 / 1.23.5 | 2.1.0 / 1.23.5 | The owner approved the newer pixel output on 2026-11-02. The old pixel-preserving child override is removed. A separate strict approved reference retains the original baseline. Fresh verification is in progress; latest npm WASM still lacks upstream native 1.23.7's CPU fixes. See the approved-update evidence. |
| TypeScript | 7.0.2 | 6.0.3 | Angular 22 and typescript-eslint peers exclude 7. Use their supported compiler range. |
| @types/node | 26.6.6 | 24.19.2 | Application code runs on Electron's embedded Node 24.22.1, independently of host Node 26. Keep the latest 24 declarations so compilation does not authorize unavailable application APIs. |
| Webpack | 5.112.2 | 5.112.0 | build-angular 22.2.5 selects exact 5.112.0. Declare that existing runtime directly for native config types, replacing the deprecated types stub. This keeps the builder/plugins on one implementation; revisit with the parent rather than forcing its dependency. |
| Jasmine / types | 7.0.2 / 7.0.0 | 6.3.0 / 6.0.0 | The official [7 guide](https://jasmine.github.io/upgrade-guides/7.0) removes Karma and Zone monkey-patching compatibility. The [6 guide](https://jasmine.github.io/upgrade-guides/6.0) supports this stack with a scoped karma-jasmine core override. Actual core resolution, 194 assertions, coverage and intentional failure exit are verified. |
| @electron/universal | 3.0.6 | 2.0.3 | Exact app-builder-lib 26.18.1 pin. Universal assembly and both architecture checks pass; do not override the parent's major. |
| @electron/osx-sign | 2.7.2 | 1.3.3 | Exact builder pin. Actual Developer ID signing and strict/deep verification pass. Revisit with a builder release selecting the newer API. |

Local failure logs are ignored because they contain absolute filesystem paths.
`unhandled6-probe.log` and `runtime-core-native-pqueue.log` retain the actual
runtime failures. The final version snapshot and status record state which
selected versions have completed their gates.

Time-zone data corrections are recorded separately in
[evidence/TIMEZONE_CHANGES.json](./evidence/TIMEZONE_CHANGES.json). They update
historical/political rules while keeping application formatting and selection
logic. See STATUS for the still-open native file-chooser default-directory item.

## Decoder security review (2026-11-02)

The historical pixel-preserving libheif 1.18.2 pin was **not approved for
publication** by this investigation and has now been removed following the
owner's newer-output approval. Its native source falls within the affected range of
[CVE-2026-32814](https://github.com/strukturag/libheif/security/advisories/GHSA-4m8r-34pg-rvwc),
where failed grid tiles can expose decoder heap contents as pixels; the fix is
1.22.0. That decoding path is relevant to thumbnails. A separate
[critical native memory-corruption advisory](https://github.com/strukturag/libheif/security/advisories/GHSA-2jg2-4ch7-h545)
affects versions through 1.23.1 and is fixed in 1.23.2. A working host escape
against this particular WASM build was not established or tested.

Latest npm libheif-js 1.23.5 includes those fixes but still predates native
1.23.7's [HEVC CPU-exhaustion fix](https://github.com/strukturag/libheif/security/advisories/GHSA-2g6j-vhr6-6wrj).
Neither available codec candidate can be described as security-clean. Per-file
worker restarts do not fix decoder defects or impose a decoding timeout.

The owner approved the measured newer pixel output and authorized the update
and revalidation on 2026-11-02; publication remains unauthorized. Complete the
fresh checks and artifacts before updating the final packet. Do not describe
the new codec as security-clean or introduce an unsupported fork or new timeout
policy. Source provenance and remaining advisories are in
[HEIC_APPROVED_UPDATE.md](./evidence/HEIC_APPROVED_UPDATE.md).
