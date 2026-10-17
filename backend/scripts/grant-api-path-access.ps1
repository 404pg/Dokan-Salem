#Requires -RunAsAdministrator

$ErrorActionPreference = 'Stop'

$account = "$env:COMPUTERNAME\DokanApiService"
$directories = @(
    'C:\Users\Owner',
    'C:\Users\Owner\Desktop'
)

if (-not (Get-LocalUser -Name 'DokanApiService' -ErrorAction SilentlyContinue)) {
    throw 'The local DokanApiService account does not exist.'
}

foreach ($directory in $directories) {
    if (-not (Test-Path -LiteralPath $directory -PathType Container)) {
        throw "Required directory does not exist: $directory"
    }
    & icacls.exe $directory /grant "${account}:(RX)"
    if ($LASTEXITCODE -ne 0) {
        throw "Could not grant read/execute access on $directory (icacls exit code $LASTEXITCODE)."
    }
}

Write-Host 'Granted read/execute access on the profile and Desktop directories only.'
Write-Host 'The service account still needs its existing backend and image-directory permissions.'
