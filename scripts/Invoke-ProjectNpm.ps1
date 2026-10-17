[CmdletBinding()]
param([Parameter(Mandatory = $true, Position = 0, ValueFromRemainingArguments = $true)][string[]]$NpmArguments)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$app = Join-Path $root 'PathLab-AI'
$cache = Join-Path $root '.cache\npm'
$temp = Join-Path $root '.cache\tmp'
foreach ($path in @($cache, $temp)) {
    $resolved = [IO.Path]::GetFullPath($path)
    if (-not $resolved.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Path must remain inside the repository.' }
    [void][IO.Directory]::CreateDirectory($resolved)
}
$variables = @{
    NPM_CONFIG_CACHE = $cache
    TEMP = $temp
    TMP = $temp
    NPM_CONFIG_UPDATE_NOTIFIER = 'false'
    NPM_CONFIG_AUDIT = 'false'
    NPM_CONFIG_FUND = 'false'
    NPM_CONFIG_IGNORE_SCRIPTS = 'true'
    NEXT_TELEMETRY_DISABLED = '1'
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1'
    PLAYWRIGHT_BROWSERS_PATH = (Join-Path $root '.cache\browsers')
    XDG_CACHE_HOME = (Join-Path $root '.cache\runtime')
}
$saved = @{}
foreach ($name in $variables.Keys) { $saved[$name] = [Environment]::GetEnvironmentVariable($name, 'Process'); [Environment]::SetEnvironmentVariable($name, $variables[$name], 'Process') }
$exitCode = 1
Push-Location -LiteralPath $app
try {
    & npm.cmd @NpmArguments
    $exitCode = $LASTEXITCODE
} finally {
    Pop-Location
    foreach ($name in $variables.Keys) {
        # PowerShell 7.5+ distinguishes an absent variable from an empty string.
        if ($null -eq $saved[$name]) { Remove-Item -LiteralPath ('Env:\' + $name) -ErrorAction SilentlyContinue }
        else { [Environment]::SetEnvironmentVariable($name, $saved[$name], 'Process') }
    }
}
if ($exitCode -ne 0) { throw "npm failed with exit code $exitCode" }
