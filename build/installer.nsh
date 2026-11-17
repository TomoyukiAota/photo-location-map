# The steps that this application adds to the installer and the uninstaller for Windows, which electron-builder makes
# with NSIS (https://www.electron.build/nsis#custom-nsis-script).
# electron-builder includes this file by its name, build/installer.nsh being the default of nsis.include, as it uses
# other files in build/ by their names, such as installer.nsi or license.txt, without any setting.
# electron-builder.json names it in nsis.include all the same, so that a package build fails, rather than leaves these
# steps out, when the file is moved. A build without them needs nsis.include set to null, not left out.

# TL;DR: Uninstalling deletes "Open with Photo Location Map" from the context menu of Explorer, which the OS tab of
# the settings adds. An update keeps it. A key that cannot be deleted stays, and the uninstallation goes on.
# Details:
# - The OS tab's Add writes these keys (src-main/explorer-context-menu/explorer-context-menu.ts), and nothing deleted
#   them with the application, so the menu stayed and ran an exe that was gone. Left there, they could be removed
#   only with the registry editor, as the OS tab goes with the application.
# - They are the keys of explorerContextMenuKeys there, in its order, as a unit test checks
#   (test/src-main/explorer-context-menu/explorer-context-menu.spec.em.main.ts). DeleteRegKey deletes a key with its
#   subkeys, such as "command".
# - A key that DeleteRegKey cannot delete does not stop the uninstallation: one that is not there, as for a user who
#   never added the menu, or one whose deletion an administrator denies to the user. DeleteRegKey only sets the error
#   flag then, which ClearErrors clears for the steps of electron-builder that follow. An NSIS script stops only at
#   Abort, Quit or a few fatal errors, and the exit code, which an installer checks when it runs the uninstaller for
#   an update, does not depend on the error flag: it is 0 unless the user cancels (1), Abort stops the script (2) or
#   SetErrorLevel sets it (appendix D.1 of NSIS's documentation).
# - An installer that installs over the installed version, on an update by electron-updater or when the user runs it,
#   runs that version's uninstaller with --updated (uninstallOldVersion in electron-builder's
#   templates/nsis/include/installUtil.nsh), so the keys stay. The installer usually installs the application in the
#   same folder, where the keys point. When it does not, as for an installation for all users over one for the current
#   user, the menu runs an exe that is gone until the user clicks Add again. An installer started with
#   --delete-app-data passes that instead of --updated, and the keys go.
# - Only the keys under HKCU of the account that the uninstaller runs as, where Add writes them for the user who
#   clicks it. Elevated with another account, as to uninstall an installation for all users, the uninstaller does not
#   delete the user's.
# - The uninstaller that runs is the one installed with the version, so a version installed from an installer without
#   this file still leaves the keys when it is uninstalled.
# - script/package-test/uninstaller-test.js checks the update, and the uninstallation with a key that is not there and
#   one whose deletion is denied, in CI on Windows.
!macro customUnInstall
  ${ifNot} ${isUpdated}
    DeleteRegKey HKCU "Software\Classes\*\shell\OpenWithPhotoLocationMap"
    DeleteRegKey HKCU "Software\Classes\Directory\shell\OpenWithPhotoLocationMap"
    DeleteRegKey HKCU "Software\Classes\Directory\Background\shell\OpenWithPhotoLocationMap"
    ClearErrors
  ${endIf}
!macroend
