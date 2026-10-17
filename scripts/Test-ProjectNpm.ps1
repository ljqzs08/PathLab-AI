# Process-scoped regression checks only. The deliberately missing npm script is a negative test, not a product bug.
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$wrapper = Join-Path $PSScriptRoot 'Invoke-ProjectNpm.ps1'
$names = @('NPM_CONFIG_CACHE', 'TEMP', 'TMP', 'NPM_CONFIG_UPDATE_NOTIFIER', 'NPM_CONFIG_AUDIT', 'NPM_CONFIG_FUND', 'NPM_CONFIG_IGNORE_SCRIPTS', 'NEXT_TELEMETRY_DISABLED', 'PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD', 'PLAYWRIGHT_BROWSERS_PATH', 'XDG_CACHE_HOME')
$original = @{}
foreach ($name in $names) { $original[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
$originalLocation = Get-Location
$checks = 0
$cases = 0
function Restore-ProcessValue([string]$Name, $Value) {
    if ($null -eq $Value) { Remove-Item -LiteralPath ('Env:\' + $Name) -ErrorAction SilentlyContinue }
    else { [Environment]::SetEnvironmentVariable($Name, [string]$Value, 'Process') }
}
try {
    Set-Location -LiteralPath $root
    $modes = @('absent', 'populated')
    if ($PSVersionTable.PSVersion -ge [version]'7.5') { $modes += 'empty' }
    foreach ($mode in $modes) {
        foreach ($name in $names) {
            $value = if ($mode -eq 'absent') { $null } elseif ($mode -eq 'empty') { '' } else { Join-Path $root ('.cache\original-' + $name) }
            Restore-ProcessValue $name $value
        }
        $expected = @{}
        foreach ($name in $names) { $expected[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
        & $wrapper -NpmArguments @('--version') | Out-Null
        foreach ($name in $names) {
            if ($expected[$name] -cne [Environment]::GetEnvironmentVariable($name, 'Process')) { throw ('FAIL: ' + $mode + ' environment not restored: ' + $name) }
            $checks++
        }
        if ((Get-Location).Path -ne $root) { throw 'FAIL: working directory not restored after success' }
        $checks++
        $cases++
    }
    $failedAsExpected = $false
    try { & $wrapper -NpmArguments @('run', '__pathlab_negative_environment_test__') *> $null } catch { $failedAsExpected = $true }
    if (-not $failedAsExpected) { throw 'FAIL: missing npm script must fail' }
    $checks++
    foreach ($name in $names) {
        if ($expected[$name] -cne [Environment]::GetEnvironmentVariable($name, 'Process')) { throw ('FAIL: environment not restored after failure: ' + $name) }
        $checks++
    }
    if ((Get-Location).Path -ne $root) { throw 'FAIL: working directory not restored after failure' }
    $checks++
    [pscustomobject]@{ shell = $PSVersionTable.PSVersion.ToString(); casesPassed = $cases; checksPassed = $checks; failurePathChecked = $true; emptyStringSupported = ($PSVersionTable.PSVersion -ge [version]'7.5') }
} finally {
    foreach ($name in $names) { Restore-ProcessValue $name $original[$name] }
    Set-Location -LiteralPath $originalLocation.Path
}
