# Prints the recent events of the Windows application log which are recorded when a process crashes.
#
# This is used to investigate the intermittent failure of the silent installation in the package test.
# The installer exits with 3221225477 (0xC0000005, STATUS_ACCESS_VIOLATION), which means that it crashes
# instead of returning an error, and it prints nothing about the reason. The events below are expected to
# contain the name of the faulting module, which is the clue to find out what makes the installer crash.

$providerNames = @('Application Error', 'Windows Error Reporting', 'Application Hang')

# "SilentlyContinue" is necessary because Get-WinEvent reports an error when no event matches the filter.
$events = Get-WinEvent -FilterHashtable @{LogName = 'Application'; ProviderName = $providerNames} -MaxEvents 10 -ErrorAction SilentlyContinue

if ($null -eq $events) {
  Write-Output "No event of the providers ($($providerNames -join ', ')) is found in the Windows application log."
  exit 0
}

$events | Format-List TimeCreated, Id, ProviderName, LevelDisplayName, Message
