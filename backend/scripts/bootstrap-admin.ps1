$ErrorActionPreference = 'Stop'

$backendDirectory = Split-Path $PSScriptRoot -Parent
$environmentFile = Join-Path $backendDirectory '.env'
$apiBaseUrl = 'http://127.0.0.1:4176'

if (-not (Test-Path $environmentFile)) {
    throw 'backend/.env was not found.'
}

$tokenLine = Get-Content $environmentFile | Where-Object { $_ -match '^ADMIN_BOOTSTRAP_TOKEN=(.+)$' } | Select-Object -First 1
if (-not $tokenLine -or $tokenLine -notmatch '^ADMIN_BOOTSTRAP_TOKEN=(.+)$') {
    throw 'No bootstrap token is configured. If an administrator already exists, no bootstrap is needed.'
}
$bootstrapToken = $matches[1]

$email = (Read-Host 'Administrator email').Trim().ToLowerInvariant()
if ($email -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') {
    throw 'Enter a valid administrator email address.'
}

$securePassword = Read-Host 'New administrator password (12 characters minimum; input is hidden)' -AsSecureString
try {
    $credential = New-Object System.Net.NetworkCredential('', $securePassword)
    $password = $credential.Password
    if ($password.Length -lt 12 -or $password.Length -gt 256) {
        throw 'The administrator password must be between 12 and 256 characters.'
    }

    $payload = @{
        email = $email
        password = $password
        bootstrapToken = $bootstrapToken
    } | ConvertTo-Json
    $result = Invoke-RestMethod -Method Post -Uri "$apiBaseUrl/api/admin/bootstrap" -ContentType 'application/json' -Body $payload
    if ($result.status -ne 'created') {
        throw 'The server did not confirm administrator creation.'
    }

    $remainingSettings = @(Get-Content $environmentFile | Where-Object { $_ -notmatch '^ADMIN_BOOTSTRAP_TOKEN=' })
    [IO.File]::WriteAllLines($environmentFile, $remainingSettings, [Text.Encoding]::ASCII)
    Write-Host "Administrator $email was created. The bootstrap token has been removed from backend/.env."
    Write-Host 'Stop the API with Ctrl+C, then restart it under DokanApiService before allowing LAN access.'
} finally {
    $password = $null
    $payload = $null
    $bootstrapToken = $null
    $credential = $null
    if ($null -ne $securePassword) {
        $securePassword.Dispose()
    }
}
