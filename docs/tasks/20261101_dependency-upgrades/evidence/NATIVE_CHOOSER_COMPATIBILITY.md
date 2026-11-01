# Native folder chooser compatibility

Observed: 2026-11-02. Selected runtime: Electron 45.2.1.

Electron 43 changed empty `defaultPath` to Downloads (or Home), overriding the
native dialog's remembered directory. Electron 45 retains that behavior.
The [official breaking-change guide](https://www.electronjs.org/docs/latest/breaking-changes#behavior-changed-dialog-methods-default-to-downloads-directory)
recommends application-managed history. The
[upstream report](https://github.com/electron/electron/issues/52454) was closed
as intentional. On Windows, the
[implementation](https://github.com/electron/electron/blob/v45.2.1/shell/browser/ui/file_dialog_win.cc)
uses `IFileDialog::SetFolder`, overriding native MRU.

The compatibility adapter remembers the last **confirmed folder itself** in
the existing application settings. It passes that directory only if it remains
an absolute, existing directory. Cancellation retains confirmed history; a
failed history read/stat/write must not stop opening the picker or chosen
folder. Failed writes retain the latest choice for the current session.
The existing `openDirectory` selection mode, controls, labels and initial photo
loading are preserved.

Two limits require final owner review before publication:

- On first upgrade, no application-managed history exists. The old native MRU
  cannot be reconstructed through the supported cross-platform dialog API.
- Navigating elsewhere and then canceling exposes no directory in Electron's
  result. The next picker restores the last confirmed folder, which can differ
  from the previous OS-managed cancellation history.

No private OS preferences are read or modified. Electron documents the
`NSNavRecentPlaces` preference, but provides no ordering guarantee; an
undocumented preference heuristic would not prove exact history migration.

Nine pure helper cases cover fresh/invalid/missing history, new selections,
cancellation, restart and I/O failures. Real Electron option capture and restart
verification are part of the E2E gate; consult STATUS.md for their actual result.
