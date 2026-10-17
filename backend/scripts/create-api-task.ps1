#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'

$taskName = "Dokan Saleem API"
$taskDescription = "Runs the Dokan Saleem local API on port 4176 (LAN-only)."
$serviceAccount = "PG\DokanApiService"
$backendPath = "C:\Users\Owner\Desktop\Dokan\backend"
$nodeExe = "C:\Program Files\nodejs\node.exe"

Write-Host ""
Write-Host "=== Dokan Saleem API - Scheduled Task Setup ===" -ForegroundColor Cyan
Write-Host ""

# Verify prerequisites
if (-not (Test-Path $nodeExe)) { throw "Node.js not found at $nodeExe" }
if (-not (Test-Path "$backendPath\src\server.js")) { throw "server.js not found" }
Write-Host "✅ Node.js found: $nodeExe" -ForegroundColor Green
Write-Host "✅ Backend found: $backendPath" -ForegroundColor Green

# Prompt for password
$svcPwd = Read-Host "Enter password for $serviceAccount" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($svcPwd)
$plainPwd = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

try {
    # Delete existing task if present
    if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
        Write-Host "Removing existing task..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    }

    # Action: run node.exe src\server.js in the backend folder
    $action = New-ScheduledTaskAction `
        -Execute $nodeExe `
        -Argument "src\server.js" `
        -WorkingDirectory $backendPath

    # Trigger: 30 seconds after system boot (gives SQL Server time to start)
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $trigger.Delay = "PT30S"

    # Settings: restart on failure, no time limit, allow on battery
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RestartCount 10 `
        -RestartInterval (New-TimeSpan -Minutes 1) `
        -ExecutionTimeLimit ([TimeSpan]::Zero) `
        -MultipleInstances IgnoreNew

    # Register as DokanApiService with stored password
    Register-ScheduledTask `
        -TaskName $taskName `
        -Description $taskDescription `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -User $serviceAccount `
        -Password $plainPwd `
        -RunLevel Limited | Out-Null

    Write-Host ""
    Write-Host "✅ Task created successfully!" -ForegroundColor Green
    Write-Host ""
    Get-ScheduledTask -TaskName $taskName | Format-List TaskName, State, Author
    Write-Host ""
    Write-Host "Next: run this to test it now:" -ForegroundColor Cyan
    Write-Host "  Start-ScheduledTask -TaskName `"$taskName`"" -ForegroundColor White
}
finally {
    if ($BSTR) { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR) }
    $plainPwd = $null
    $svcPwd = $null
}