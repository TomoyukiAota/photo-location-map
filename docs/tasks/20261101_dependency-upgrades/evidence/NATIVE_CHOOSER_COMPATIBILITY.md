# Native folder chooser compatibility

Observed: 2026-11-02. Selected runtime: Electron 45.2.1.

**Owner acceptance is pending.** The owner's follow-up requested clarification;
it did not approve the policy described below. Publication is not authorized.

The original application, using Electron 32, omitted `defaultPath` and stored
no application-managed folder-picker history. The OS chose the starting
location, typically its last viewed or navigated directory. That behavior was
OS-managed, not a promise to restore the exact folder selected by the user.

Electron 43 changed an omitted or empty `defaultPath` to Downloads, or Home if
Downloads does not exist. Electron 45 retains this behavior. The
[versioned breaking-change guide](https://github.com/electron/electron/blob/v45.2.1/docs/breaking-changes.md#behavior-changed-dialog-methods-default-to-downloads-directory)
recommends tracking a path in the application. The
[upstream report](https://github.com/electron/electron/issues/52454) was closed
as intentional. Windows uses
[`IFileDialog::SetFolder`](https://github.com/electron/electron/blob/v45.2.1/shell/browser/ui/file_dialog_win.cc),
which overrides native MRU. On macOS, compare the conditional directory setting
in [Electron 32](https://github.com/electron/electron/blob/v32.0.2/shell/browser/ui/file_dialog_mac.mm)
with the explicit fallback in [Electron 45](https://github.com/electron/electron/blob/v45.2.1/shell/browser/ui/file_dialog_mac.mm).
The [versioned dialog documentation](https://github.com/electron/electron/blob/v45.2.1/docs/api/dialog.md)
also notes that Linux portal backends below version 4 can ignore `defaultPath`;
the starting-location outcome is not universal across Linux backends.

The compatibility adapter adds `FolderDialog/LastConfirmedDirectory` to the
existing application storage. It remembers the last **folder itself confirmed
in this picker**, rather than the OS's last viewed or navigated location.
Opening a folder through the CLI or drag-and-drop does not update this value.
It passes the saved path only if it remains an absolute, existing directory.
Cancellation retains confirmed history; a
failed history read/stat/write must not stop opening the picker or chosen
folder. Failed writes retain the latest choice for the current session.
The dialog request retains `openDirectory`; confirming still opens the chosen
folder. Remembering a picker location does not automatically reopen its photos
at application startup.

These examples illustrate the policy difference; they are not an exhaustive
list of native-UI behavior differences:

- On the first upgrade from the original application, the new history value
  does not exist. A backend honoring `defaultPath` therefore normally starts in
  Downloads/Home. Selecting a folder once in the ordinary picker establishes
  the application's history for subsequent picker calls and app restarts.
- After confirming A, navigating to B and canceling exposes no B path in
  Electron's result. The adapter continues to request A on the next call.
- Selecting child folder A while viewing parent P can also distinguish the
  selected folder from the viewed location. The adapter records A. The old
  native panel's exact remembered location depends on the OS/backend; it has
  not been established to equal A in every such interaction.

This change does not delete OS picker history, move/delete photo files, or
reset existing application settings. It changes which starting directory
the application requests. OS recent-place menus or other native state may
still exist; the adapter does not read, clear or migrate them.

There is no reliable supported cross-platform API for reproducing the exact
old native starting location, including navigation followed by cancellation.
It would be too broad to say no API can read any history: on macOS,
[`systemPreferences.getUserDefault`](https://github.com/electron/electron/blob/v45.2.1/docs/api/system-preferences.md)
documents `NSNavRecentPlaces` as an array. It does not guarantee an ordering
that identifies the last folder viewed by this picker, its confirmed selection,
or its location on cancellation. Using it would be a macOS-only best-effort
policy, not exact migration. No such heuristic, private-preference access,
custom native dialog or Electron fork is included in this implementation.

Nine pure helper cases cover fresh/invalid/missing history, new selections,
cancellation, restart and I/O failures. The application E2E replaces
`showOpenDialog` with a stub to capture the options and supply results, then
checks real application storage and restart behavior. This verifies the
adapter's requested path and persistence. It does **not** open the actual native
panel or prove that every OS/backend restores native MRU in the same way.
Consult STATUS.md for the checkpoint's actual results.
