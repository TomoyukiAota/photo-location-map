# Official Angular Vitest configuration

Use @angular/build:unit-test, Vitest5.1.0, jsdom30.1.3 and matching coverage-v8.
These are stable versions within the installed Angular CLI22.2.5 defaults and
peer ranges. No standalone conversion, UI change or test-only schema suppression
is needed. Production renderer/worker bridges and build settings remain intact.

The test target derives from a dedicated application build configuration:
polyfills=[], optimization=false, aot=false. JIT retains the existing NgModule
TestBed/dynamic-child construction strategy. The first default-AOT attempt could
not resolve template declarations outside those test modules; use the supported
JIT test configuration rather than suppressing template errors or rewriting the
application. The official CLI initializes/tears down TestBed and runs Vitest.

The spec tsconfig extends the base config, not the production renderer bridge
config. It includes node/electron/vitest globals with both package type roots.
The first attempt inherited only @types and could not resolve Vitest/Electron's
bundled declarations; the test-specific typeRoots fixes that resolution.

## Unit boundaries

Testing-only application file replacements isolate the legacy static require
boundaries, persistent settings, EXIF decoding and import-time directory worker.
Minimal external electron/remote module doubles are installed through supported
Vitest setupFiles package mocks. The setup clears IPC listeners and in-memory
settings; filesystem paths are unique temporary directories with cleanup.
It does not set process.type, window.process or window.require to impersonate an
Electron renderer. A real Node/jsdom invariant test guards that distinction.

EXIF and directory-operation doubles throw if actually used: these construction
checks must not be mistaken for file-decoding/worker integration tests. The
existing Electron-Mocha and Playwright suites retain that genuine coverage.
The map construction test uses two explicit child component doubles; the only
ng-mocks usage is gone and that dependency is removed.

EnvironmentDetector recognizes Vitest's actual VITEST=true variable, replacing
the retired Karma runner check. Ordinary application execution remains outside
unit-test mode; real Electron-Mocha runner checks remain distinct. The old
commented Karma-specific ProcessAccessor implementation is removed.

## Coverage preservation

See TEST_ENVIRONMENTS.md for per-file mapping. Current intended result is Vitest37
in25 files, Electron main117 and renderer69. Seven duplicate genuine-renderer
assertions are consolidated, four obsolete Karma checks become four real Vitest
runner checks, and one native-Node/non-Electron invariant is added. No unique
Electron requirement is implemented by a fake in jsdom.

Initial integrated migration passed Vitest36 and main117/renderer69 before the
additional native-process invariant. Repeat clean-install acceptance, watch and
coverage behavior, full lint/types, application E2E and platform packaging after
all manifest/lock/source changes. Exact results belong in PLAN.md.


## Integrated verification checkpoint

Clean npm ci and full dependency validation pass without deprecated packages or
messages. Dependency18, Vitest37 with v8 coverage, Electron117/69, live reload,
package-runner19, lint and types pass. The retired --code-coverage CLI flag was
corrected to --coverage. Native cache paths are redirected by setting PLM_TEST_ROOT
in setup before application imports, independently of the remote-path double;
the cache component asserts containment. This closes an existing test isolation
gap rather than changing the application's cache policy.

Actual watch validation passed37 initially, then rebuilt/retested the changed
cache component, then its restored source; both reruns pass. The watch process
was stopped intentionally. A read-only independent re-review found no further
coverage/isolation or Temp API defect. Packaging/E2E/CI evidence is still pending.
