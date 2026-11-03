# Owner-approved HEIC decoder update

Decision date: 2026-11-02. Primary-source research checked at
2026-11-02T12:32Z. **Independent local, distribution and platform verification passed.**

The owner approved adopting the newer HEIC pixel output, updating the decoder,
and repeating verification. This approval supersedes the pixel-preservation
decision in the historical `HEIC_DECODER_COMPARISON.json` checkpoint. That
historical evidence and the original reference remain intact. The approval
does not authorize release publication.

## Implemented dependency selection

The manifest selects `heic-decode` **2.1.0**. Its supported child range
is `libheif-js ^1.19.8`; the lockfile selects **1.23.5**. The former
`heic-decode@2.0.0` child override to `libheif-js 1.18.2` has been removed.
No replacement HEIC override is needed. These are manifest/lockfile observations,
not proof that an installed or packaged runtime contains the selected versions.

At the research checkpoint, npm's latest versions were still 2.1.0 and 1.23.5,
published on 2025-07-04 and 2026-10-04 respectively. Primary metadata:
[heic-decode 2.1.0](https://registry.npmjs.org/heic-decode/2.1.0),
[libheif-js 1.23.5](https://registry.npmjs.org/libheif-js/1.23.5), and the
current [heic-decode](https://registry.npmjs.org/heic-decode) and
[libheif-js](https://registry.npmjs.org/libheif-js) dist-tag records.

The exact published source chain is:

1. `heic-decode@2.1.0`, npm gitHead
   `47773f7b17acc22bfb8bb7869b6ef087d24c0ca9`, imports
   `libheif-js/wasm-bundle` through its
   [versioned entry point](https://github.com/catdad-experiments/heic-decode/blob/47773f7b17acc22bfb8bb7869b6ef087d24c0ca9/index.js).
2. `libheif-js@1.23.5`, npm gitHead
   `d8ec4bc3bc5bf8055975577bccbbc7e1d7313c2d`, has a
   [versioned fetch script](https://github.com/catdad-experiments/libheif-js/blob/d8ec4bc3bc5bf8055975577bccbbc7e1d7313c2d/scripts/install.js)
   selecting the `libheif-emscripten` v1.23.5 release archive.
3. The [Emscripten v1.23.5 release](https://github.com/catdad-experiments/libheif-emscripten/releases/tag/v1.23.5)
   identifies native libheif commit
   [`413e2a87e6a70b3eccc3a3adc5801179dd2d9e00`](https://github.com/strukturag/libheif/commit/413e2a87e6a70b3eccc3a3adc5801179dd2d9e00),
   tagged native v1.23.5. Its
   [versioned build workflow](https://github.com/catdad-experiments/libheif-emscripten/blob/5c8968a44e9c68ae677e24790d77d001ed7fe7cc/.github/workflows/emscripten.yml)
   uses that native source as a submodule.

Neither package declares an install/postinstall lifecycle hook in its published
manifest. `libheif-js`'s `fetch` command is maintainer tooling; normal dependency
installation uses the prebuilt JavaScript/WASM already present in its npm tarball.
Updating an operating-system libheif library therefore does not patch this
bundled decoder. This review inspected metadata, source and archive contents;
it did not install or execute them.

## Strict sample references

The sample is `test/e2e/fixtures/demo.heic`. The comparison hashes the pixel
buffer obtained by decoding the generated JPEG thumbnail with `jpeg-js`; it is
not a hash of the HEIC input, raw HEIC decoder output, or JPEG file bytes.
Both references have width 300 and height 400.

| Reference | SHA-256 of decoded thumbnail pixel buffer | Treatment |
| --- | --- | --- |
| Original libheif-js 1.18.2 output | `4a50fa9dd154fcb8358ed56c09478c792f0fe148f57d445211920db8fd545351` | Preserve unchanged in `test/e2e/snapshots/heic-thumbnail.json` and historical evidence. |
| Owner-approved libheif-js 1.23.5 output | `6b17ef757e234a67822cd264da6dd68f9694666f4d0f811599f734197ff328dc` | Use a separate version-labelled expectation in `test/e2e/approved-references/heic-thumbnail-libheif-1.23.5.json`. |

The new hash is an approved expectation from the earlier candidate comparison.
It is not a post-update test result. Reverification must assert the actual
shipped decoder versions and compare dimensions/hash exactly. The approval
does not permit broader screenshot tolerances or changes to unrelated references.

## Remaining upstream security gap

Native libheif's latest release is
[v1.23.7, released 2026-10-26](https://github.com/strukturag/libheif/releases/tag/v1.23.7).
The latest npm/Emscripten distribution still embeds native 1.23.5, so this
dependency update does not include all current native security fixes.

In particular, [GHSA-2g6j-vhr6-6wrj](https://github.com/strukturag/libheif/security/advisories/GHSA-2g6j-vhr6-6wrj)
affects native versions `>=1.0.0,<1.23.7`: a crafted HEIC item can force decoding
of many extra HEVC pictures while returning one ordinary image. The documented
impact is CPU exhaustion, with no known memory-corruption or confidentiality
impact. Other native 1.23.7 fixes relevant to file opening or image decoding
include [derived-image CPU amplification](https://github.com/strukturag/libheif/security/advisories/GHSA-48p4-gj45-w9v6),
[repeated-transform CPU amplification](https://github.com/strukturag/libheif/security/advisories/GHSA-7qm8-hj35-269r),
and [colour-profile association CPU amplification](https://github.com/strukturag/libheif/security/advisories/GHSA-hhg3-fxg7-3gxw).
No attack reproducer was executed against the shipped WASM in this review.

The update includes fixes absent from native 1.18.2, including the
[failed-grid heap disclosure](https://github.com/strukturag/libheif/security/advisories/GHSA-4m8r-34pg-rvwc)
and [derived-item/pixel-plane memory-safety issues](https://github.com/strukturag/libheif/security/advisories/GHSA-2jg2-4ch7-h545).
The latter advisory reports native code execution; host code execution through
this particular WASM build has not been demonstrated by this project.

Advisory applicability must account for build options. The
[exact native Emscripten build recipe](https://github.com/strukturag/libheif/blob/413e2a87e6a70b3eccc3a3adc5801179dd2d9e00/build-emscripten.sh)
disables multithreading and defaults optional codecs such as AOM and OpenJPEG
off. Parallel-decoding and optional-codec advisories must not automatically be
reported as reachable in this distribution. The recipe identifies source/build
configuration; this review did not independently rebuild the published binary.

The appropriate claim is **latest published npm decoder, with known upstream
fixes still unavailable in this distribution**. Complete coverage of the
1.23.7 fixes requires an updated distributor release or a separately validated
WASM rebuild. Upstream's [security policy](https://github.com/strukturag/libheif/blob/v1.23.7/SECURITY.md)
provides no maintained LTS security branch.

## Post-update verification record

All affected gates pass at application source
`79d547fa884658be9266f03ae3d20ea05899b34a`. Earlier artifact checks used the
former decoder and remain historical. Fresh exact evidence is in
[HEIC_MAC_CHECKPOINT.json](./HEIC_MAC_CHECKPOINT.json),
[HEIC_CI_CHECKPOINT.json](./HEIC_CI_CHECKPOINT.json) and
[HEIC_WINDOWS_DRAFT_BYTES.json](./HEIC_WINDOWS_DRAFT_BYTES.json).

| Check | Status |
| --- | --- |
| Clean installation; host/Electron runtime checks; exact dependency graph and absence of the former HEIC override | PASS: clean npm ci; npm ls --all; Node 26.13.0/bundled npm 11.20.0; Electron 45.2.1/embedded Node 24.22.1; exact decoder 2.1.0/1.23.5. |
| Lint, unit suites and production build after the decoder update | PASS: production build and lint; 57 Angular + 87 main + 50 renderer assertions. Fresh audit retains 75 entries: 30 high, 44 moderate, one low. |
| Strict sample dimensions/new hash and actual decoder versions through the real worker; malformed-image failure behavior | PASS in the real checkout application: exact 300x400 approved hash and 2.1.0/1.23.5 resolution; corrupt input returns failed-in-heic-convert. |
| Original HEIC reference and unrelated screenshot references remain unchanged | PASS: snapshot tree byte-unchanged from f1f0ee5; original tolerances retained. |
| Functional and visual app regression checks after the update | PASS: all 15 cases, including embedded JPEG/HEIC viewer and special-character paths. |
| Rebuilt final signed/notarized universal macOS artifacts, artifact integrity, launch and packaged-app regression checks | PASS: real signing/notarization/staple/Gatekeeper; 14 packaged visual/functional cases; both archives match all 4,754 files and link/directory entries; full metadata/blockmaps; mounted-DMG launch/log/quit/detach. The smoke uses a 60-second launch observation window, not 60 seconds after readiness. |
| Windows installed NSIS app and Linux packaged AppImage CI on the updated code | PASS: both triggers on each OS, 194 units and 14 packaged E2E cases per job. Actual Windows draft bytes, decoder metadata and selected WASM payload bytes verified independently. |
| Required Intel macOS CI on the updated code | PASS: native Intel manual job 125280892676 at the same 79d547f source; 194 units and 14 actual packaged E2E cases. All eight test jobs in seven workflow runs across three workflows pass without failures/reruns. |
| Final-artifact updater transport verification and any additional packaging/update checks required by the task plan | PASS: final ZIP transport/cache/corruption checks plus separate signed native fixture install/relaunch/explicit downgrade rollback and settings through four starts; exact cleanup and unchanged production source signature/fingerprint. Fixture/public-feed coverage limits remain explicit. |

Release publication remains outside this approval and outside the verification
results recorded here.
