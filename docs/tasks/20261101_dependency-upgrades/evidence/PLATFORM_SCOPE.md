# Platform support and verification scope

Observed 2026-11-02. The selected application runtime is Electron 45.2.1.

The [versioned upstream README](https://github.com/electron/electron/blob/v45.2.1/README.md#platform-support)
lists macOS Ventura 13+, Windows 10+, and major Linux distributions still
supported by both Chromium and their distributor without a paid subscription.
Electron supplies x64/arm64 binaries on those systems. It does not promise every
older Linux distribution or desktop environment. The
[breaking-change guide](https://www.electronjs.org/docs/latest/breaking-changes/)
records removal of pre-macOS-13 and 32-bit Windows/Linux ARM binaries at Electron
44. The repository's existing delivered targets are 64-bit; this work does not
introduce a new 32-bit or native Windows/Linux ARM distribution.

The accepted macOS 13 minimum is verified from the actual packaged Info.plist.
Local testing uses macOS arm64. Native macOS Intel verification is explicitly
triggered in CI. Rosetta is not installed locally; its failed launch is an
environmental coverage limit, not an application test pass or a reason to
install OS components without need.

CI verifies Windows Server 2025 (windows-latest), Ubuntu 26.04 LTS, macOS 26 and
macOS 26 Intel. Those runner images do not establish testing on the minimum
supported OS. AppImage FUSE startup, NSIS installation, universal assembly and
actual renderer flows are separate gates. Consult STATUS and the final CI
checkpoint for results at the exact application commit.

No claim is made that the new app was exercised on physical macOS 13, Windows
10, every Linux distribution, or a native ARM Windows/Linux machine. The
existing package targets and upstream OS support policy are retained except for
the explicitly accepted macOS minimum.
