#Requires -RunAsAdministrator

$ErrorActionPreference = 'Stop'

$accountName = 'DokanApiService'
$sqlInstance = '.\SQLEXPRESS'
$databaseName = 'DokanSaleem'
$backendDirectory = Split-Path $PSScriptRoot -Parent
$imageDirectory = Join-Path $backendDirectory 'data\images'

Import-Module Microsoft.PowerShell.LocalAccounts

$connectionString = "Driver={ODBC Driver 17 for SQL Server};Server=localhost\SQLEXPRESS;Database=$databaseName;Trusted_Connection=yes;TrustServerCertificate=yes;"
$connection = New-Object System.Data.Odbc.OdbcConnection($connectionString)
try {
    $connection.Open()
} catch {
    $connection.Dispose()
    throw "Could not connect to SQL Server using ODBC Driver 17 and Windows authentication. Confirm SQL Server (SQLEXPRESS) is running and retry from an elevated Windows account with database access. Details: $($_.Exception.Message)"
}

$existingAccount = Get-LocalUser -Name $accountName -ErrorAction SilentlyContinue
if ($null -ne $existingAccount) {
    $confirmation = Read-Host "Local account $accountName already exists. Type RESET to set a new password and continue"
    if ($confirmation -cne 'RESET') {
        throw 'Setup cancelled; the existing account was not changed.'
    }
}

$password = Read-Host "Enter a strong password for $accountName (it is not saved by this script)" -AsSecureString
if ($null -eq $existingAccount) {
    $newUserParameters = @{
        Name = $accountName
        Password = $password
        Description = 'Least-privilege Dokan Saleem API account'
    }
    New-LocalUser @newUserParameters | Out-Null
} else {
    $resetUserParameters = @{
        Name = $accountName
        Password = $password
    }
    Set-LocalUser @resetUserParameters
}

$sqlPrincipal = "$env:COMPUTERNAME\$accountName"
$sqlLiteral = $sqlPrincipal.Replace("'", "''")
$sqlIdentifier = '[' + $sqlPrincipal.Replace(']', ']]') + ']'
$createLoginCommand = $connection.CreateCommand()
$createLoginCommand.CommandText = @"
IF SUSER_ID(N'$sqlLiteral') IS NULL
    CREATE LOGIN $sqlIdentifier FROM WINDOWS
"@
$null = $createLoginCommand.ExecuteNonQuery()
$createLoginCommand.Dispose()

$configureDatabaseCommand = $connection.CreateCommand()
$configureDatabaseCommand.CommandText = @"
IF DATABASE_PRINCIPAL_ID(N'$sqlLiteral') IS NULL
    CREATE USER $sqlIdentifier FOR LOGIN $sqlIdentifier
IF NOT EXISTS (
    SELECT 1 FROM sys.database_role_members AS drm
    JOIN sys.database_principals AS role_principal ON role_principal.principal_id = drm.role_principal_id
    JOIN sys.database_principals AS member_principal ON member_principal.principal_id = drm.member_principal_id
    WHERE role_principal.name = N'db_datareader' AND member_principal.name = N'$sqlLiteral'
)
    ALTER ROLE [db_datareader] ADD MEMBER $sqlIdentifier;
IF NOT EXISTS (
    SELECT 1 FROM sys.database_role_members AS drm
    JOIN sys.database_principals AS role_principal ON role_principal.principal_id = drm.role_principal_id
    JOIN sys.database_principals AS member_principal ON member_principal.principal_id = drm.member_principal_id
    WHERE role_principal.name = N'db_datawriter' AND member_principal.name = N'$sqlLiteral'
)
    ALTER ROLE [db_datawriter] ADD MEMBER $sqlIdentifier
"@
$null = $configureDatabaseCommand.ExecuteNonQuery()
$configureDatabaseCommand.Dispose()
$connection.Close()
$connection.Dispose()

$projectDirectory = Split-Path $backendDirectory -Parent
$desktopDirectory = Split-Path $projectDirectory -Parent
$userProfileDirectory = Split-Path $desktopDirectory -Parent
foreach ($directory in @($userProfileDirectory, $desktopDirectory)) {
    & icacls.exe $directory /grant "${sqlPrincipal}:(RX)"
    if ($LASTEXITCODE -ne 0) {
        throw "Could not grant directory read/execute access on $directory (icacls exit code $LASTEXITCODE)."
    }
}

New-Item -ItemType Directory -Path $imageDirectory -Force | Out-Null
& icacls.exe $backendDirectory /grant "${sqlPrincipal}:(OI)(CI)(RX)" /T /C
if ($LASTEXITCODE -ne 0) {
    throw "Could not grant read/execute access to the backend files (icacls exit code $LASTEXITCODE)."
}

& icacls.exe $imageDirectory /grant "${sqlPrincipal}:(OI)(CI)(M)" /T /C
if ($LASTEXITCODE -ne 0) {
    throw "Could not grant image-directory access (icacls exit code $LASTEXITCODE)."
}

Write-Host "Configured $sqlPrincipal with database read/write access and backend read/execute access."
Write-Host 'The API is not started and no firewall rules or network bindings were changed.'
