[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Path,
    [ValidatePattern('^[a-fA-F0-9]{64}$')][string]$ExpectedHtmlSha256
)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd('\')
$resolved = (Resolve-Path -LiteralPath $Path).ProviderPath
if (-not $resolved.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Packet must be in this workspace.' }
if ((Get-Item -LiteralPath $resolved).Length -gt 10MB) { throw 'Packet too large.' }
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::OpenRead($resolved)
$sha = [Security.Cryptography.SHA256]::Create()
try {
    $names = @('PathLab AI.html', 'START-HERE.md', 'manual-acceptance.md', 'manifest.json')
    if ($zip.Entries.Count -ne $names.Count) { throw 'Unexpected archive entry count.' }
    foreach ($name in $names) {
        $entries = @($zip.Entries | Where-Object { $_.FullName -ceq $name })
        if ($entries.Count -ne 1 -or $entries[0].Length -gt 5MB) { throw "Invalid entry: $name" }
    }
    $entry = $zip.GetEntry('manifest.json')
    if ($entry.Length -gt 16KB) { throw 'Manifest too large.' }
    $reader = [IO.StreamReader]::new($entry.Open(), [Text.Encoding]::UTF8)
    try { $manifest = $reader.ReadToEnd() | ConvertFrom-Json } finally { $reader.Dispose() }
    if ($manifest.schemaVersion -ne 1 -or @($manifest.files).Count -ne 3) { throw 'Invalid manifest.' }
    foreach ($name in $names[0..2]) {
        $listed = @($manifest.files | Where-Object { $_.name -ceq $name })
        if ($listed.Count -ne 1) { throw "Invalid manifest entry: $name" }
        $entry = $zip.GetEntry($name)
        $entryStream = $entry.Open()
        try { $hash = [BitConverter]::ToString($sha.ComputeHash($entryStream)).Replace('-', '').ToLowerInvariant() }
        finally { $entryStream.Dispose() }
        if ($hash -cne $listed[0].sha256 -or $entry.Length -ne $listed[0].bytes) { throw "Integrity mismatch: $name" }
        if ($name -eq 'PathLab AI.html') { $htmlHash = $hash }
    }
    if ($ExpectedHtmlSha256 -and $htmlHash -ne $ExpectedHtmlSha256.ToLowerInvariant()) { throw 'HTML differs from expected source.' }
} finally { $sha.Dispose(); $zip.Dispose() }
[pscustomobject]@{
    path = $resolved
    files = 4
    bytes = (Get-Item -LiteralPath $resolved).Length
    zipSha256 = (Get-FileHash -LiteralPath $resolved -Algorithm SHA256).Hash.ToLowerInvariant()
    htmlSha256 = $htmlHash
    integrityPassed = $true
    published = $false
    humanAccepted = $false
}