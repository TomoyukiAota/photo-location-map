param([string]$InstallerPath)

# Prints the information to investigate the intermittent crash of the silent installation in the package test.
#
# The installer exits with 3221225477 (0xC0000005, STATUS_ACCESS_VIOLATION), and the Windows application log
# shows that the faulting module is System.dll in the temporary directory into which the installer extracts
# its own NSIS plugins (e.g. C:\Users\RUNNER~1\AppData\Local\Temp\nsd7974.tmp\System.dll).
#
# The information below is to tell whether the extracted System.dll is broken, or whether something in the
# environment makes it crash. The hash of the extracted System.dll is compared with the one in the cache of
# electron-builder, which is the origin of the extracted file.

function Write-Section($title) {
  Write-Output ''
  Write-Output "===== $title ====="
}

function Write-FileInfo($path) {
  if (-not (Test-Path -LiteralPath $path)) {
    Write-Output "$path does not exist."
    return
  }
  $item = Get-Item -LiteralPath $path
  $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
  Write-Output ("length={0}  sha256={1}  {2}" -f $item.Length, $hash, $item.FullName)
}

function Write-Events($providerName, $maxEvents) {
  Write-Section "Events of ""$providerName"" in the Windows application log"
  # "SilentlyContinue" is necessary because Get-WinEvent reports an error when no event matches the filter.
  $events = Get-WinEvent -FilterHashtable @{LogName = 'Application'; ProviderName = $providerName} -MaxEvents $maxEvents -ErrorAction SilentlyContinue
  if ($null -eq $events) {
    Write-Output "No event of ""$providerName"" is found."
    return
  }
  $events | Format-List TimeCreated, Id, LevelDisplayName, Message
}

# Each provider is queried separately so that the events of one provider do not crowd out the others.
Write-Events 'Application Error' 5
Write-Events 'Windows Error Reporting' 5
Write-Events 'Application Hang' 3

Write-Section 'Directories which NSIS extracts its plugins into'
# More than one directory means that a directory is left by a previous run, which can be a cause of the crash.
$nsisTempDirectories = Get-ChildItem -Path $env:TEMP -Filter 'ns*.tmp' -Directory -ErrorAction SilentlyContinue
if ($null -eq $nsisTempDirectories) {
  Write-Output "No directory matching ""ns*.tmp"" is found in ""$env:TEMP""."
} else {
  foreach ($directory in $nsisTempDirectories) {
    Write-Output "--- $($directory.FullName) (created $($directory.CreationTimeUtc.ToString('u')))"
    foreach ($file in (Get-ChildItem -Path $directory.FullName -File -ErrorAction SilentlyContinue)) {
      Write-FileInfo $file.FullName
    }
  }
}

Write-Section 'System.dll in the cache of electron-builder'
# This is the origin of the extracted System.dll, so a different hash means that the extraction is broken.
$cacheDirectory = Join-Path $env:LOCALAPPDATA 'electron-builder\Cache\nsis'
$cachedSystemDlls = Get-ChildItem -Path $cacheDirectory -Filter 'System.dll' -Recurse -File -ErrorAction SilentlyContinue
if ($null -eq $cachedSystemDlls) {
  Write-Output "No System.dll is found under ""$cacheDirectory""."
} else {
  foreach ($file in $cachedSystemDlls) {
    Write-FileInfo $file.FullName
  }
}

Write-Section 'Installer'
# A broken installer would mean that the package creation, rather than the installation, is the problem.
if ([string]::IsNullOrEmpty($InstallerPath)) {
  Write-Output 'The path of the installer is not given.'
} else {
  Write-FileInfo $InstallerPath
}

Write-Section 'Environment'
# The version of the runner image is recorded to see whether the crash is tied to a certain image.
$operatingSystem = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue
Write-Output "OS: $($operatingSystem.Caption), version $($operatingSystem.Version)"
Write-Output "Windows Defender real-time monitoring disabled: $((Get-MpPreference -ErrorAction SilentlyContinue).DisableRealtimeMonitoring)"
Write-Output "TEMP: $env:TEMP"
