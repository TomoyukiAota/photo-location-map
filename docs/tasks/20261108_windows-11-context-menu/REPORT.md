# Windows 11's new context menu: report

2026-11-08 (Asia/Tokyo); written down on 2026-11-17. The task was for the Add
and Remove buttons of Settings > OS to put "Open with Photo Location Map" in
both of Explorer's context menus on Windows 11: the new one, which a
right-click opens, and the classic one under "Show more options", where Add
puts it today. The investigation found that the new menu takes an app's own
item only from a package signed with a certificate that Windows trusts. The
owner decided to wait until the redesign of the menu that Windows 11 started
in October 2026 has settled, and had only the classic item fixed
([#673](https://github.com/TomoyukiAota/photo-location-map/pull/673)). This
records what the investigation found, so that the work can resume from here
rather than from the start. The conditions for resuming were checked again on
2026-11-17, and neither holds yet ("Check of 2026-11-17").

## Result

- **Only a signed package puts the app's own item in the new menu.** Windows
  11's new menu lists commands that implement `IExplorerCommand` and are
  registered with package identity. An app installed by NSIS, as this one is,
  gets that identity from a sparse package (a "package with external
  location"), which declares a small native DLL. Windows installs the package
  on a user's PC only when a certificate trusted there signs it. The Windows
  build is not signed today.
- **Add's item stays in the classic menu.** Add writes static verbs under
  `HKCU\Software\Classes`
  ([`explorer-context-menu.ts`](../../../src-main/explorer-context-menu/explorer-context-menu.ts)).
  Windows 11 shows them under "Show more options" and with Shift+right-click.
  Whether the redesign of October 2026 lets the user move them into the new
  menu is not known (item 10 of "What to find out on Windows 11"). Windows 10
  has only the classic menu.
- **Without signing, the app is reached from the new menu only in part**:
  through "Open with", for files only, and through "Send to", which the
  redesigned menu shows only when the user turns it on.
- **The redesign leaves the placement open.** Since the update of October
  2026, the user chooses which app extensions appear in the main menu and
  which in a submenu. Microsoft has not documented where a signed item starts;
  news sites say in the submenu.

## Why it waits

On 2026-11-08 the owner decided to wait until the information about the
redesign has settled, rather than start now. The reasons:

1. **The change is still under way.** It came in a preview update, which
   Windows rolls out gradually. Microsoft has not told developers where a
   signed package's item appears: at the top of the menu, or in its "App
   extensions" submenu. News sites are the only sources for the default.
2. **The placement decides whether signing is worth it.** If the item starts
   in the submenu, a signed package puts it one level down, which is not much
   better than "Send to", which needs no signing.
3. **Signing costs work or money.** The free route needs a privacy policy that
   the installer shows, and an option in the installer to turn the sending of
   usage data off; the others need a paid certificate (see "Signing"). Either
   is better decided once the menu has settled.

Resume when both of these hold, which was expected to take months:

- The redesign reaches users widely in regular updates, not only as a preview
  or a gradual rollout. Windows Latest said that the mandatory update of
  November 2026 would also bring it.
- Microsoft's developer documentation, the page on
  [integrating with File Explorer](https://learn.microsoft.com/en-us/windows/apps/desktop/modernize/integrate-packaged-app-with-file-explorer)
  (dated 2026-07-16 when it was read), describes it.

## Check of 2026-11-17

Neither condition holds yet, so the work still waits. As read on 2026-11-17:

- **The redesign reaches users only in part.** The security update of
  2026-11-10, [KB5132061](https://support.microsoft.com/help/5132061)
  (builds 26300.9974, 26200.9974 and 26100.9974), says that it includes the
  improvements of KB5127936, but its page says nothing of File Explorer or
  the context menu. Microsoft still calls the menu's rollout gradual:
  - KB5127936 lists the menu under "Gradual rollout".
  - The
    [Windows IT Pro Blog](https://techcommunity.microsoft.com/blog/windows-itpro-blog/windows-news-you-can-use-october-2026/4552396)
    of 2026-11-03 names it among the features of the November security
    update, and says that the optional update of October brings their
    gradual rollout.
  - The Release Preview notes of 26H1's
    [build 28000.3612](https://learn.microsoft.com/en-us/windows-insider/release-notes/release-preview-26h1/build-28000-3612)
    (2026-11-13) list it under "Gradual rollout" again. Those of
    [builds 26200.10066 and 26300.10066](https://learn.microsoft.com/en-us/windows-insider/release-notes/release-preview-24h2-25h2/build-26200-10066-26300-10066)
    for 25H2 and 26H2 (KB5132057, 2026-11-13) do not mention it.
  - No Microsoft page says that the rollout has ended or stopped, and
    release health lists no issue with the menu.

  Windows Latest and two other news sites (2026-11-10 to 2026-11-16) report
  that the menu still arrives in phases.
- **Microsoft's developer page has not changed.** It is still dated
  2026-07-16, and still says only that an `IExplorerCommand` item appears in
  Windows 11's context menu, not where. No Microsoft page says where a
  packaged app's item starts, in the main menu or in the "App extensions"
  submenu, or whether classic verbs count as app extensions. The page of
  [best practices](https://learn.microsoft.com/en-us/windows/apps/get-started/best-practices)
  (2026-10-07) still describes the menu of 2021, and
  [`desktop10:Verb`](https://learn.microsoft.com/en-us/uwp/schemas/appxpackage/uapmanifestschema/element-desktop10-verb)
  has only `Id` and `Clsid`: nothing in it chooses the placement.
- **News sites add two things that Microsoft has not said.**
  - [XDA](https://www.xda-developers.com/microsoft-is-copying-the-best-context-menu-app/)
    (2026-09-29) found on an Insider build that the items of other apps
    start in the "App extensions" submenu, none in the main menu, and that
    older shell extensions, such as 7-Zip's, get no place in the new menu:
    they stay under "Show more options". It does not say whether static
    verbs, which Add writes, are among them.
  - [Pureinfotech](https://pureinfotech.com/windows-11-classic-context-menu-registry-tweak-broken/)
    (2026-11-12) and
    [WinCentral](https://thewincentral.com/windows-11-kb5132061-classic-context-menu-registry-tweak-broken/)
    (2026-11-13) say that, after KB5132061, the key that brought the
    classic menu back (`{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}`, see "Where
    to check") no longer does. Both say that Shift+right-click on a file or
    a folder still opens the classic menu.

Microsoft said on 2026-11-10 that there will be no non-security preview
update in December 2026, and that they resume in January 2027
([Windows message center](https://learn.microsoft.com/en-us/windows/release-health/windows-message-center)).
New features come first in these previews, as the menu did in KB5127936.

## How the new menu takes an item

From Microsoft's documentation as read on 2026-11-08, and, for
electron-builder, from the code of its version 26.18.1:

- **A COM class in a native DLL.** The item is a class that implements
  `IExplorerCommand`. Every documented sample declares it as a
  `com:SurrogateServer`, which runs it in `dllhost.exe`. None uses
  `com:ExeServer`, and whether that works for this extension is undocumented,
  so the plan has a native DLL as the handler rather than the Electron
  executable. The DLL must match Explorer's architecture. Microsoft's sample
  and Windows Terminal also implement `IObjectWithSite`; Windows Terminal uses
  it to find the folder when Explorer passes no items for a background.
- **Package identity from a sparse package.** Its manifest has
  `uap10:AllowExternalContent`, declares the class, and gives it the item
  types `*`, `Directory` and `Directory\Background` for
  `windows.fileExplorerContextMenus` (`desktop5:ItemType`;
  `desktop10:ItemType`, from Windows 11 22H2, adds `Drive` and
  `DesktopBackground`). The package holds the manifest only and points at a
  folder outside it, its external location.
- **Registered per user, without administrator rights**, with
  `Add-AppxPackage -Path <msix> -ExternalLocation <folder>`. A policy can
  block that (0x80073CFF, 0x80073D01), so the classic verbs stay as the
  fallback. Explorer may need a restart, or the user a sign-out, before a new
  command appears.
- **Windows versions.** The new menu exists from Windows 11 (10.0.22000).
  Sparse packages need 10.0.19041. Windows 10 keeps the classic verbs.
- **electron-builder does not build it.** Version 26.18.1 has no option for a
  package with external location; its AppX target builds full packages only.
  A script would pack the package with `MakeAppx pack /nv` and sign it with
  `SignTool sign /fd SHA256` and a timestamp. Microsoft's
  [winapp CLI](https://github.com/microsoft/WinAppCli/blob/5f379fb55517/docs/guides/sparse.md)
  (0.8.0 on 2026-11-07) also builds such packages.

## Signing

Windows installs the package only when a certificate that the PC trusts signs
it, and the manifest's `Publisher` must equal the certificate's subject
exactly (0x8007000B, or 0x80073CF0, otherwise). An unsigned package fails
with 0x800B0100, and an untrusted certificate with 0x800B0109. The signature
needs a timestamp: users click Add long after a build, and a package without
one cannot be installed once its certificate has expired. A new subject makes
a new package family, so the package of the old subject has to be removed.

Not for distribution, as Microsoft limits each to development and testing:

- **A self-signed certificate.** Every PC would have to be made to trust it,
  which changes its trust store: anyone with the key could then make packages
  that the PC accepts.
- **An unsigned package** (`Add-AppxPackage -AllowUnsigned`). Microsoft says
  that it needs an administrator when it contains executable content. It
  documents neither whether that includes a sparse package, whose DLL lies
  outside it, nor whether `-AllowUnsigned` works with `-ExternalLocation` at
  all.
- **Developer Mode**, which needs an administrator to turn on.

The routes that were looked at, with their terms on 2026-11-08:

| Route | Cost | Publisher in the package | Terms |
| --- | --- | --- | --- |
| [SignPath Foundation](https://signpath.org/terms) | Free, for the open-source projects that it accepts | SignPath Foundation | Signs MSIX. A signing is requested from a CI build: on GitHub, by [SignPath's action](https://docs.signpath.io/trusted-build-systems/github), after jobs that all ran on GitHub-hosted runners, which SignPath requires of open-source projects. Each signing is approved by hand, in SignPath, by the project's approver. The project publishes a code signing policy and a list of its roles, and uses multi-factor authentication. The Foundation can pause or end the service without notice, and revoke the certificate with immediate or retroactive effect. Software that sends user data to places that the user did not choose needs a privacy policy, shown during installation, and a way to turn the sending off at installation. |
| [Certum Open Source](https://shop.certum.eu/open-source-code-signing-on-simplysign.html) | From EUR 49 (in the cloud; out of stock on 2026-11-08) or from EUR 69 (on a hardware token with a reader) | "Open Source Developer" with the developer's legal name | For individuals. MSIX is not listed. Unattended signing in CI only through community scripts. |
| A commercial OV or IV certificate | From about USD 129 a year ([SSL.com IV](https://ssl.com/products/software-integrity/code-signing/iv/)), plus its cloud signing | The legal name | The key must be on an HSM or in a cloud service, and a certificate lasts at most 460 days ([CA/B Forum](https://cabforum.org/working-groups/code-signing/requirements/)). |
| [Azure Artifact Signing](https://azure.microsoft.com/en-us/products/artifact-signing) | USD 9.99 a month | The validated legal name, with city, region and country | Open to individuals only in the US and Canada, and to organizations in more countries, Japan among them ([quickstart](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart)). Older Microsoft pages list fewer countries and ask an organization for a tax history of three years or more. A certificate lasts 72 hours, so the timestamp is essential. |

The app sends usage data to Amplitude, to Mixpanel and to its own analytics
backend, and, since 2026-11-14, crash dumps to that backend
(`src-shared/analytics/`, `src-main/crash-reporter-setup.ts`). It has no
privacy policy and no way to turn the sending off. So the SignPath route needs
both first: a privacy policy that the installer shows, and an option of the
installer that turns the sending off, which is a change to the NSIS installer.

On 2026-11-08 the project looked eligible for SignPath Foundation: MIT, public
on GitHub since 2019, maintained, and built with GitHub Actions. The
Foundation decides at its discretion, and the owner applies in their own
name. Not confirmed: whether it takes a project of one person, who would hold
every role, and whether a DLL and a package that no release has had yet meet
its condition that the software be "already released in the form that should
be signed". The code signing policy goes on the home page and the download
page, with SignPath's attribution. The software may change the system's
configuration only with proper warnings, and needs an uninstaller. The exact
subject of the Foundation's certificate, which `Publisher` must equal, was not
found.

Whatever the route, the publisher's name goes into a manifest in this public
repository and into every release.

A Microsoft Store edition would be signed by the Store for free
([code signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)),
but only as a full package in a second release channel, which users of the
NSIS build would not get.

Sign only the DLL and the package. Turning on electron-builder's Windows
signing would sign every `.exe` as well, and write `publisherName`, after which
electron-updater accepts only updates signed by that publisher.

## Without signing

- **"Open with".** The app can register itself for the photo file types
  under `HKCU`, without signing or administrator rights. "Open with" is in the
  new menu already; whether the app then shows in its list on build 26300 was
  not checked. Files only: a folder and the background of a folder have no
  "Open with".
- **"Send to".** "Send to" lists the shortcuts in the user's
  `%APPDATA%\Microsoft\Windows\SendTo` folder (`shell:sendto`). Add could put
  a shortcut to the app there, with `--open` in its arguments, and Remove
  delete it. It works for files and folders, but not for the background of a
  folder, and it is one level down. Several selected items arrive in one
  command line, after `--open`; today `parse-command-line-options.ts` takes one
  path for `--open` and ignores the rest, so only the first item would open.
  The new menu shows "Send to" only from the update of October 2026, and only
  when the user turns it on (off by default, according to Windows Latest).
- **The classic verbs**, as today: under "Show more options", which the
  redesigned menu reportedly hides by default, and with Shift+right-click.

## The redesign of October 2026

- [KB5127936](https://support.microsoft.com/help/5127936), a preview update
  of 2026-10-28 (builds 26300.9818 and 26200.9818) that Windows rolls out
  gradually, makes the menu customizable: "Choose which app extensions appear
  in the main menu or a submenu or hide the app extensions submenu". It also
  says: "To see more options, hold down Shift and right-click on your
  desktop." It says nothing of files or folders.
- The
  [Windows Insider blog](https://blogs.windows.com/windows-insider/2026/08/17/improving-file-explorer-context-menu-faster-simpler-and-more-customizable/)
  described the same options on 2026-08-17. It does not say whether classic
  verbs count as app extensions.
- [Windows Latest](https://windowslatest.com/2026/10/29/windows-11s-faster-customizable-right-click-menu-released-enable-it-right-now-using-these-steps/),
  a news site, says that app extensions start in an "App extensions" submenu
  (on its author's PC, seven did, while Ask Copilot started above it), from
  which the user can move them to the top. It says that "Show more options"
  is off by default, and is turned on in Settings > Personalization > Context
  menu, under "Additional options". Older apps such as 7-Zip, whose items are
  only in the classic menu, need "Show more options" turned on; it does not
  say where static verbs appear. To see more options, it says, hold Shift and
  right-click the desktop or a file.

## Other apps

- **The same design.** VS Code (an Electron app), PowerToys, Notepad++
  (NppShell), Zed, WinMerge, TortoiseGit and dnGrep each register a native DLL
  through a sparse package. Windows Terminal, a full MSIX package, has the
  same kind of DLL. VS Code registers its package from its installer;
  WinMerge, PowerToys, TortoiseGit and dnGrep register at run time.
- **VSCodium**, a build of VS Code without Microsoft's certificate, leaves out
  the DLL and the package
  ([`71-build-disable-appx.patch`](https://github.com/VSCodium/vscodium/blob/ca7f7b44b5e5/patches/windows/71-build-disable-appx.patch)),
  so it has no item in the new menu. Since 1.109 its users have reported the
  item missing from both menus after a fresh install
  ([#2712](https://github.com/VSCodium/vscodium/issues/2712),
  [#2951](https://github.com/VSCodium/vscodium/issues/2951)).
- **What went wrong for VS Code:**
  - `dllhost.exe` kept the DLL loaded and stalled updates
    ([#294546](https://github.com/microsoft/vscode/issues/294546),
    [#318029](https://github.com/microsoft/vscode/issues/318029)).
  - Users lost the item when the registration failed, as the classic verbs
    were gone ([#303103](https://github.com/microsoft/vscode/issues/303103)).
  - Security tools flagged its hidden PowerShell, and removing the package
    took about 36 seconds
    ([#316356](https://github.com/microsoft/vscode/issues/316356),
    [#318029](https://github.com/microsoft/vscode/issues/318029)).
  - Whether the app launched from the item takes the package's identity is
    disputed ([#334716](https://github.com/microsoft/vscode/issues/334716)).
    An Electron app with that identity can crash at start or render nothing
    ([winapp CLI's Electron guide](https://github.com/microsoft/WinAppCli/blob/5f379fb55517/docs/guides/electron/setup.md#L230-L251)).
  - Its DLL was named x64 but built as x86
    ([vscode-explorer-command#26](https://github.com/microsoft/vscode-explorer-command/issues/26))
    and linked to the Visual C++ runtime, so it failed on PCs without the x86
    runtime ([#307534](https://github.com/microsoft/vscode/issues/307534),
    [#331686](https://github.com/microsoft/vscode/issues/331686)).
  - Its DLL started the exe with `CreateProcessW` until January 2026, which
    cannot show the UAC prompt for an exe set to run as administrator, and
    then moved to `ShellExecuteW`
    ([b1de228310](https://github.com/microsoft/vscode-explorer-command/commit/b1de228310)).
- **The item may show twice.** PowerToys says that registering both kinds
  "results in duplicate entries" in Windows 11's expanded menu, its name for
  the one under "Show more options"
  ([context menus](https://microsoft.github.io/PowerToys/common/context-menus/)),
  and NppShell hides its classic handler for that reason.

## Options

| Option | What | Effort and risk | Verdict |
| --- | --- | --- | --- |
| A. Classic menu only, fixed | Keep the verbs. Write them from the main process with `reg.exe` hidden, quote the exe's path, handle a drive root's background, and tell Windows 11 users where the item is. | 1-2 days. Low risk: no native code, no signing, no change to the installer or CI. | Done in #673, except the text for Windows 11 users. |
| B. Signed sparse package, registered per user from the OS tab | A native DLL and a sparse package, signed and shipped with the app. Add registers the package and Remove removes it; the classic verbs stay for Windows 10 and as the fallback. | 1-2 weeks, plus days to weeks for the certificate's validation. A certificate (paid, or SignPath's free one with its conditions), native code to maintain, and a DLL that `dllhost.exe` can hold during a silent update. | Recommended once a certificate is chosen and a prototype passes. |
| C. The same package, registered by the NSIS installer (VS Code's model) | The installer registers the package at every install and update; Add and Remove only show or hide the item. | More NSIS work, and the highest release risk: PowerShell and package servicing in every install and silent update, an uninstaller whose fix lands a version late, and a per-machine install, which runs elevated and can register the package for an administrator rather than the user. | Rejected. |
| D. A self-signed or unsigned package | The same as B, signed with a self-signed certificate that each PC is made to trust, or not signed. | The same work as B, and a change to the trust of the user's PC, or an administrator for the unsigned package. | Rejected: Microsoft limits it to testing. |

## Recommendation of 2026-11-08

Do A now, and B as a separate project, only after both of these:

- The owner chooses a publicly trusted certificate, with its cost and the
  publisher name that it puts into this public repository.
- A prototype passes the checks on Windows 11 in a VM. It passes when the app
  launched from the item has no package identity, or can be started without
  it, and an update works while `dllhost.exe` holds the DLL, if need be with a
  fix from step 9 of the outline. Whether the item shows twice is checked too,
  but decides only decision 6. The prototype can perhaps be registered without
  a certificate in Developer Mode, as
  [electron/fiddle-core](https://github.com/electron/fiddle-core/blob/769e0b57eb15/src/windows-identity.ts#L98-L141)
  does for development; that this works for a context menu is unverified.

Build B narrowly: one small C++ DLL with WRL. Borrow only from MIT-licensed
sources (vscode-explorer-command, Windows Terminal, Microsoft's
AppModelSamples, PowerToys), as this repository is MIT, and keep their
notices. Take nothing from the GPL projects (Zed, NppShell, WinMerge, dnGrep),
and check TortoiseGit's license before taking anything from it.

Do not build C or D. Without a certificate, stop at A: on Windows 11 the item
stays under "Show more options" and Shift+right-click.

## What has been done

- [#673](https://github.com/TomoyukiAota/photo-location-map/pull/673), merged
  on 2026-11-08, is Option A: Add and Remove run `reg.exe` from the main
  process, by its full path and without a console window; the command quotes
  the exe's path; the background of a drive root opens the drive; rage-edit is
  gone. It left out the text for Windows 11 users: the OS tab still says
  "Please open Explorer and right-click on a file/folder to confirm."
- [#729](https://github.com/TomoyukiAota/photo-location-map/pull/729), merged
  on 2026-11-17, has the uninstaller delete the classic keys on a real
  uninstall, not on an update (`customUnInstall` in `build/installer.nsh`),
  and checks an update and a real uninstall in the Windows CI
  (`npm run test:uninstaller`). A package would have to be removed there as
  well.

## When the work resumes

### First

Check the two conditions under "Why it waits". Then read KB5127936,
Microsoft's page on File Explorer and the terms of the signing routes again:
what this report says of them is as of 2026-11-08, except for what "Check of
2026-11-17" read again.

### Decisions for the owner

1. Whether to go beyond Option A at all: a certificate, paid or SignPath's
   free one with its conditions, and a native DLL to maintain.
2. The signing route and its budget.
3. The publisher name, which goes into this public repository and every
   release.
4. Where signing runs: in the Windows CI job, which publishes on every push
   and gives pull requests from forks no secrets, or on the owner's PC; and
   whether a release fails when the signed package is missing.
   - Releases have been published both ways: the Windows files of 1.12.1
     came from CI, and those of 1.11.0, 1.12.0 and 1.13.0 were uploaded with
     the owner's account. Releases have to be published from where signing
     runs.
   - With SignPath, a CI job on GitHub-hosted runners uploads the DLL and the
     package, and SignPath's action submits them with an API token from the
     secrets; the project's approver approves each request by hand. So not on
     the owner's PC. As the Windows job publishes on every push, the DLL and
     the package would be signed only when they change, and then kept, rather
     than in every build as steps 3 and 7 of the outline assume.
5. Whether to sign the exe and the installer as well. The menu does not need
   it, and it would make electron-updater refuse updates from any other
   signer. Recommended: not with this change. Where Smart App Control is on,
   it blocks unsigned files that have no good reputation, which can include
   the app's exe today
   ([SmartScreen reputation](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation));
   the menu work does not change that.
6. After a registration that worked: delete the classic verbs, if the item
   shows twice, or keep both. VS Code deletes them.
7. Several selected items: one window for each, up to 15, as the classic
   verbs do (the app has no single-instance lock), or the first item only.
8. Windows on ARM: an ARM64 DLL, or the classic verbs there. The Windows
   build is x64.
9. Uninstalling: remove the package with the classic keys, from the release
   that first ships the package, as the uninstaller that runs is the installed
   version's.
10. Where to check: a VM (recommended), another PC, or the owner's PC with
    its setting for the classic menu removed for the check (see "Where to
    check").
11. Optional: register "Open with" for the photo file types, which needs no
    signing.
12. Optional: a "Send to" shortcut that Add creates and Remove deletes, which
    needs no signing. The app would then have to decide what to do with
    several paths in one command line, as `--open` takes one.
13. Optional: a Microsoft Store edition.

### Outline of Option B

1. **The DLL**, in a new `native/windows-explorer-command/`: x64, with the
   static C runtime (`/MT`), as Windows ships the UCRT but not `vcruntime`.
   One fixed CLSID.
   - `GetTitle` returns the item's text (see "Not covered"), and `GetIcon`
     the exe.
   - `GetState` hides the item for anything outside the file system, zip
     folders, more than 15 items, or a missing exe.
   - `Invoke` starts the exe once for each item, with the quoting that
     `CommandLineToArgvW` reads back, through `ShellExecuteW` rather than
     `CreateProcessW`, so that an exe set to run as administrator gets its UAC
     prompt (see "Other apps"). When Explorer passes no items for a
     background, it falls back to the folder of `IObjectWithSite`, as Windows
     Terminal does.
   - No slow work in these methods.
2. **The manifest**, from Microsoft's template for a package with external
   location: `AppListEntry` none, `ProcessorArchitecture` neutral,
   `MinVersion` 10.0.19041.0, the app's exe as `Executable`, and one verb and
   CLSID for the three item types. Its `Publisher` is filled in with the
   certificate's exact subject. Its version changes only when the manifest
   does, so that an update of the app needs no new registration. The exe lies
   outside the external location (step 4), as `Code.exe` does for VS Code;
   that registration works so is inferred from VS Code, not documented. An exe
   outside the external location gets no identity, which is what is wanted
   here.
3. **A script** under `script/` (linted by `lint:script`), run by
   `electron-builder:windows` before electron-builder, so that
   `package:windows`, `publish:windows` and `test:package` get it. It builds
   the DLL with Visual Studio's tools (found with `vswhere`), packs the
   package with `MakeAppx pack /nv`, and, when the credentials are there,
   signs the DLL and the package with `SignTool sign /fd SHA256` and a
   timestamp (with SignPath, see decision 4). It fails when the signer's
   subject differs from `Publisher`. Without credentials it ships no package,
   so the app uses the classic verbs; only a release fails then.
4. **`win.extraResources`** ships the DLL and the package to
   `resources\windows-explorer-command`, which is the external location: a
   folder of its own, as NppShell moved to one after the registration changed
   the permissions of its folder.
5. **The main process**, beside the classic verbs in
   `src-main/explorer-context-menu/`:
   - The package is used on Windows 11 (`isVersionAtLeast` of
     `src-main/auto-update/minimum-system-version.ts` with 10.0.22000), when
     the app is packaged, the package is there, the PC does not force the
     classic menu (see "Where to check"), and not on ARM64 unless that is
     verified.
   - PowerShell runs by its full path, hidden, with `-NoProfile
     -NonInteractive`, and gets the paths in environment variables, never in
     the command.
   - Add: if `Get-AppxPackage` already shows this version at this location,
     stop. Otherwise remove every package of that name, which also clears the
     package of an earlier publisher, and run `Add-AppxPackage -Path ...
     -ExternalLocation ... -ErrorAction Stop`.
   - Each error becomes a line in the OS tab, a text of `en.json` translated
     in every file of `locales/`: 0x800B0109 and 0x800B0100 for a signature
     that is missing or not trusted, 0x80073CFF and 0x80073D01 for a policy
     that blocks the package, and 0x80073CFB for a package that is already
     registered. 0x80073CF9, which the identity page gives for that case too,
     is otherwise the generic ERROR_INSTALL_FAILED, so it counts as registered
     only when `Get-AppxPackage` then shows the package. On any error, listed
     or not, Add writes the classic verbs.
   - Remove: remove the package, then the verbs.
   - Analytics events for success and for the error's code, without paths.
6. **The uninstaller**, in the `customUnInstall` of #729
   (`build/installer.nsh`), for a real uninstall only:
   `Get-AppxPackage -Name <name> | Remove-AppxPackage` for a per-user install,
   and `Get-AppxPackage -AllUsers -Name <name> | Remove-AppxPackage -AllUsers`
   for a per-machine install, as the administrator who uninstalls it may not
   be the user who registered the package. It goes after the `DeleteRegKey`
   lines, which #729's unit test wants first inside `${ifNot} ${isUpdated}`. It
   reaches the 64-bit PowerShell through `$WINDIR\Sysnative`, as the
   uninstaller is 32-bit, ignores the exit code, and never aborts.
7. **CI** (`.github/workflows/ci-on-windows.yml`): the test steps sign with a
   throwaway self-signed certificate that the job makes and trusts, as the
   runners are administrators. The publish steps build again and sign with the
   real credentials from the secrets, so a package signed for a test can never
   be published (with SignPath, see decision 4). A step checks that MakeAppx,
   SignTool and the C++ tools are there. The publishing itself stays as it is.
8. **Documents**: a page in `docs/contributing/` on building, signing and
   testing the DLL, linked from the script's failure message and the DLL's
   source; a line in `docs/contributing/minimum-os-versions.md`; and the OS
   tab's text for Windows 11, in every language.
9. **Only if an update fails while the DLL is loaded**, one of these: before
   `quitAndInstall`, stop the `dllhost.exe` whose command line has the CLSID,
   as VS Code does; give the DLL a hidden window that lets it be serviced, as
   PowerToys does; or put the DLL in a folder for each version, as VS Code
   does.

### Tests

- **Unit tests of the main process** (Electron-Mocha): the arguments of
  `reg.exe` and PowerShell, `windowsHide` on every process, the conditions
  (10.0.19045 gives the classic verbs, 10.0.22000 the package; the setting
  for the classic menu, an unpackaged app or a missing package give the
  classic verbs), paths only in environment variables (one with an
  apostrophe), and each error code to its message and the fallback.
- **The command line**: the exact strings that Explorer and the DLL make
  (a path with spaces; a drive root's background; a folder with Unicode,
  spaces, `#` and `%`; a path ending in a backslash), read by
  `parse-command-line-options.ts`.
- **The OS tab's unit test**: the lines shown for the classic verbs, the
  package and the fallback.
- **The DLL, on Windows in CI**: its quoting; `GetTitle` and `GetState` for a
  file, a folder, 16 items and an item outside the file system, through
  `DllGetClassObject`; `Invoke` on a temporary folder with `PLM_TEST_ROOT`
  and `PLM_TEST_HEADLESS`, which the launched app inherits, so that it stays
  off the screen.
- **The build**: valid, timestamped signatures; `Publisher` equal to the
  signer's subject; no new files in the macOS and Linux packages.
- **The package test, in CI only**: after the silent install, register,
  query and remove the package through the app's code; install an update
  while a test holds the DLL loaded; a real uninstall removes the package and
  the verbs. These last two extend #729's `npm run test:uninstaller`
  (`script/package-test/uninstaller-test.js`), which CI runs after the e2e
  suite: it already reinstalls over the installed app, as an update does,
  then uninstalls it, and checks the classic keys after each. Not on the
  owner's PC: `test:package` installs over the real installation there.
- **e2e, headless**: the OS tab records the processes it would start and
  changes no registry. In CI only, a case against the copy of the installed
  app that CI's e2e suite runs (`script/package-test/inspectable-package.js`,
  as the installed app's fuses keep Playwright out) checks the real keys and
  `Get-AppxPackage`, and restores them. The package that it registers points
  at the copy's `resources\windows-explorer-command`, not the installation's.
- **The owner's check of Explorer**, which cannot run headless: see "Where
  to check".

### What to find out on Windows 11

1. Does the item also show in the classic menu? Then keeping the classic
   verbs shows it twice. Likely, from PowerToys and NppShell; Microsoft's
   page does not say.
2. Does the app launched from the item take the package's identity
   (`process.windowsStore` tells)? Does its window render? With the identity,
   the app's AUMID comes from the package, which changes how the taskbar
   groups its windows and where its notifications go; AppData is not
   redirected, as `win32App` apps are not virtualized. A comment of 2026-10-08
   on VS Code's #334716 found only `dllhost.exe` in the package's container,
   never `Code.exe`. If the app does take the identity, try starting it
   through Explorer (`IShellDispatch2::ShellExecute`), as PowerToys' File
   Locksmith does; whether that drops the identity is undocumented.
3. Can a prototype be registered in Developer Mode without a certificate
   (`Add-AppxPackage -Register <manifest> -ExternalLocation <folder>`)?
   Otherwise, sign it with a certificate trusted only in the VM.
4. What does Explorer pass for the background of a folder? Check drive roots;
   This PC, Quick Access, the Recycle Bin and zip folders, which should not
   show the item; network and OneDrive paths; names with Unicode, spaces, `#`
   and `%`; 1 and 16 selected items.
5. Does the item appear after Add without restarting Explorer, and go after
   Remove? How long does Remove take while `dllhost.exe` holds the DLL?
6. Can a standard account on Windows 11 Home and Pro register the package?
   What does the app show when a policy blocks it?
7. Does a silent update of the app work while `dllhost.exe` holds the DLL?
   electron-builder's update moves every installed file into
   `$PLUGINSDIR\old-install`, under `%TEMP%`, and stops when one move fails.
   A loaded DLL can be moved within a volume (NppShell), so also try an
   installation on a different drive from `%TEMP%`, where the move may fail
   (an inference). When copying keeps failing, a silent install falls back to
   an extraction that ignores errors, so check that the DLL was replaced, not
   only that the update ended. The installer's check for running processes
   does not see `dllhost.exe`.
8. Do the package commands work from the 32-bit uninstaller, through
   `$WINDIR\Sysnative`, per user and with `-AllUsers`?
9. What does `Get-AppxPackage` show as the external location, so that a moved
   installation can be noticed? Which code does adding the same version again
   return: 0x80073CFB or 0x80073CF9? Microsoft's pages differ.
10. After KB5127936: where does the item start, can the user move it to the
    top, can classic verbs be moved there too (then the package matters
    less), and does Shift+right-click on a file or a folder still open the
    classic menu? A news site found on an Insider build, before KB5127936,
    that older shell extensions, such as 7-Zip's, get no place in the new
    menu, but it does not mention static verbs. Two others say that, after
    KB5132061, Shift+right-click on a file or a folder still opens the
    classic menu ("Check of 2026-11-17").
11. Can CI's Windows runner, Windows Server 2025, which runs as an
    administrator with UAC off, register the package and start its COM
    class? Microsoft's list of the systems that MSIX supports does not
    include it, and community sites say that packaged Store apps cannot be
    activated with UAC off; nothing was found on sparse packages. The answer
    decides which of the tests can run in CI.
12. Only if ARM64 matters: does an x64 DLL load on Windows on ARM?
13. Only for a self-signed test: is `Cert:\CurrentUser\TrustedPeople` enough,
    or only the machine's store? Microsoft's pages differ.
14. Only if "Open with" or "Send to" is wanted: once the app has registered
    itself for the photo file types, does it show in the new menu's "Open
    with"? What command line does "Send to" give for several items?

### Where to check

- On 2026-11-08, the owner's PC forced the classic menu: it had
  `HKCU\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\InprocServer32`,
  which VS Code's installer also takes as the user's choice of the classic
  menu. That was read from a shell inside the Claude desktop app, which can
  see its own copy of that part of the registry
  ([AGENTS.md](../../../AGENTS.md), "In the Claude desktop app on Windows"),
  so read it again from outside before relying on it. News sites say that
  the key no longer brings the classic menu back after KB5132061 ("Check of
  2026-11-17"), which the owner's PC has had since 2026-11-13: see which
  menu a right-click opens there.
- Check in a Windows 11 VM, or remove that key only with the owner's
  agreement, and put it back afterwards. Change it outside the Claude desktop
  app, with the steps of that section of AGENTS.md: export the key first, and
  restore it with `reg delete /f` and `reg import`. Restart Explorer after
  each change, which closes its windows.
- Check again once the redesigned menu shows on the PC: KB5132061 includes
  the improvements of KB5127936, but the menu reaches PCs gradually ("Check
  of 2026-11-17"). Check the classic verbs on Windows 10 22H2 too.
- Explorer's menu is UI, so the owner checks it.

## Not covered

- **The item's text.** The classic item is written in the app's language
  when Add runs (`explorerContextMenu.openWithAccessKey`). The DLL would need
  the same text, for example from a value that Add writes: VS Code's DLL reads
  its title from the `Title` value of `Software\Classes\VSCodeContextMenu`,
  and Zed's from `HKCU\Software\Classes\ZedContextMenu`. VS Code's keeps the
  title for as long as the DLL stays loaded, so a DLL that did the same would
  show a new language only after `dllhost.exe` unloads it. The investigation,
  made before the app had other languages, gave the DLL a fixed English
  title.

## Sources

Read on 2026-11-08.

- Microsoft's documentation:
  - [Integrate a packaged desktop app with File Explorer](https://learn.microsoft.com/en-us/windows/apps/desktop/modernize/integrate-packaged-app-with-file-explorer)
  - [Grant package identity by packaging with external location](https://learn.microsoft.com/en-us/windows/apps/desktop/modernize/grant-identity-to-nonpackaged-apps)
  - [Extending the context menu and share dialog in Windows 11](https://blogs.windows.com/windowsdeveloper/2021/07/19/extending-the-context-menu-and-share-dialog-in-windows-11/)
  - [`IExplorerCommand`](https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nn-shobjidl_core-iexplorercommand),
    [`desktop5:ItemType`](https://learn.microsoft.com/en-us/uwp/schemas/appxpackage/uapmanifestschema/element-desktop5-itemtype),
    [`desktop10:ItemType`](https://learn.microsoft.com/en-us/uwp/schemas/appxpackage/uapmanifestschema/element-desktop10-itemtype)
  - [MSIX per user and for all users](https://devblogs.microsoft.com/insidemsix/msix-per-user-vs-all-users/)
  - [Troubleshooting packaging, deployment and query](https://learn.microsoft.com/en-us/windows/win32/appxpkg/troubleshooting),
    [MSIX troubleshooting](https://learn.microsoft.com/en-us/windows/msix/msix-troubleshooting-guide)
  - [Unsigned packages](https://learn.microsoft.com/en-us/windows/msix/package/unsigned-package),
    [signing a package](https://learn.microsoft.com/en-us/windows/msix/package/sign-msix-package-guide),
    [signing overview](https://learn.microsoft.com/en-us/windows/msix/package/signing-package-overview),
    [Developer Mode](https://learn.microsoft.com/en-us/windows/advanced-settings/developer-mode)
  - [Code signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options),
    [SmartScreen reputation and Smart App Control](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)
  - ["Open with"](https://learn.microsoft.com/en-us/windows/win32/shell/how-to-include-an-application-on-the-open-with-dialog-box)
  - [Supported platforms of MSIX](https://learn.microsoft.com/en-us/windows/msix/supported-platforms)
- The redesign: [KB5127936](https://support.microsoft.com/help/5127936),
  [Windows Insider blog, 2026-08-17](https://blogs.windows.com/windows-insider/2026/08/17/improving-file-explorer-context-menu-faster-simpler-and-more-customizable/),
  [Windows Latest, 2026-10-29](https://windowslatest.com/2026/10/29/windows-11s-faster-customizable-right-click-menu-released-enable-it-right-now-using-these-steps/).
- Signing: [SignPath Foundation's terms](https://signpath.org/terms),
  [SignPath's GitHub integration](https://docs.signpath.io/trusted-build-systems/github),
  [SignPath's artifact formats](https://docs.signpath.io/artifact-configuration/reference),
  [Certum Open Source](https://shop.certum.eu/open-source-code-signing-on-simplysign.html),
  [CA/B Forum code signing requirements](https://cabforum.org/working-groups/code-signing/requirements/),
  [SSL.com IV](https://ssl.com/products/software-integrity/code-signing/iv/),
  [Azure Artifact Signing](https://azure.microsoft.com/en-us/products/artifact-signing)
  and its [quickstart](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart).
- Other apps:
  - VS Code: [`AppxManifest.xml`](https://github.com/microsoft/vscode/blob/425edb2f1285509174564beba978bf18069ecaa8/resources/win32/appx/AppxManifest.xml),
    [`code.iss`](https://github.com/microsoft/vscode/blob/425edb2f1285509174564beba978bf18069ecaa8/build/win32/code.iss),
    [`explorer_command.cc`](https://github.com/microsoft/vscode-explorer-command/blob/676a2a43194e5821af2642926bc0eef9f6edd13f/src/explorer_command.cc)
  - [Windows Terminal's `OpenTerminalHere.cpp`](https://github.com/microsoft/terminal/blob/cbc857bdf774/src/cascadia/ShellExtension/OpenTerminalHere.cpp)
  - [Microsoft's sample of a package with external location](https://github.com/microsoft/AppModelSamples/blob/fcf664970968/Samples/PackageWithExternalLocation/cs/README.md)
  - PowerToys: [context menus](https://microsoft.github.io/PowerToys/common/context-menus/),
    [`package.h`](https://github.com/microsoft/PowerToys/blob/ba946c9885d1/src/common/utils/package.h)
  - NppShell: [`Installer.cpp`](https://github.com/notepad-plus-plus/nppShell/blob/9a8aeb62fc85/Installer.cpp),
    [#6](https://github.com/notepad-plus-plus/nppShell/pull/6),
    [#79](https://github.com/notepad-plus-plus/nppShell/issues/79)
  - [WinMerge's `PropShell.cpp`](https://github.com/WinMerge/winmerge/blob/393c6e2e0aa3/Src/PropShell.cpp)
  - [electron/fiddle-core's `windows-identity.ts`](https://github.com/electron/fiddle-core/blob/769e0b57eb15/src/windows-identity.ts)
  - winapp CLI: [sparse packages](https://github.com/microsoft/WinAppCli/blob/5f379fb55517/docs/guides/sparse.md),
    [Electron](https://github.com/microsoft/WinAppCli/blob/5f379fb55517/docs/guides/electron/setup.md)

Read on 2026-11-17, for "Check of 2026-11-17":

- Microsoft's pages on updates:
  [KB5132061](https://support.microsoft.com/help/5132061),
  [KB5127936](https://support.microsoft.com/help/5127936),
  the Release Preview notes of
  [build 28000.3612](https://learn.microsoft.com/en-us/windows-insider/release-notes/release-preview-26h1/build-28000-3612)
  and of
  [builds 26200.10066 and 26300.10066](https://learn.microsoft.com/en-us/windows-insider/release-notes/release-preview-24h2-25h2/build-26200-10066-26300-10066),
  the [Windows message center](https://learn.microsoft.com/en-us/windows/release-health/windows-message-center),
  release health for
  [25H2](https://learn.microsoft.com/en-us/windows/release-health/status-windows-11-25h2)
  and [26H2](https://learn.microsoft.com/en-us/windows/release-health/status-windows-11-26h2),
  and the
  [Windows IT Pro Blog of 2026-11-03](https://techcommunity.microsoft.com/blog/windows-itpro-blog/windows-news-you-can-use-october-2026/4552396).
- Microsoft's pages for developers: the page on
  [integrating with File Explorer](https://learn.microsoft.com/en-us/windows/apps/desktop/modernize/integrate-packaged-app-with-file-explorer),
  [best practices](https://learn.microsoft.com/en-us/windows/apps/get-started/best-practices)
  and
  [`desktop10:Verb`](https://learn.microsoft.com/en-us/uwp/schemas/appxpackage/uapmanifestschema/element-desktop10-verb).
- News sites:
  [Windows Latest, 2026-11-10](https://www.windowslatest.com/2026/11/10/windows-11-kb5132061-is-out-with-new-features-direct-download-links-for-offline-installer-msu/),
  [MIXED News, 2026-11-12](https://mixed-news.com/en/windows-11-file-explorer-right-click-menu-customise-november-update/),
  [The Gadgeteer, 2026-11-16](https://the-gadgeteer.com/2026/11/16/windows-11-november-update-file-explorer-cloud-rebuild/),
  [XDA, 2026-09-29](https://www.xda-developers.com/microsoft-is-copying-the-best-context-menu-app/),
  [Pureinfotech, 2026-11-12](https://pureinfotech.com/windows-11-classic-context-menu-registry-tweak-broken/)
  and
  [WinCentral, 2026-11-13](https://thewincentral.com/windows-11-kb5132061-classic-context-menu-registry-tweak-broken/).
