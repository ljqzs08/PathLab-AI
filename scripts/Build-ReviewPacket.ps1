[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd('\')
if ([IO.Path]::GetPathRoot($root) -ne 'D:\') { throw 'Workspace must stay on D drive.' }
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$files = @(
    @{ source = 'PathLab-AI\PathLab AI.html'; name = 'PathLab AI.html' },
    @{ source = 'docs\review\START-HERE.md'; name = 'START-HERE.md' },
    @{ source = 'docs\review\manual-acceptance.md'; name = 'manual-acceptance.md' }
)
$items = @()
foreach ($file in $files) {
    $path = Join-Path $root $file.source
    $info = Get-Item -LiteralPath $path
    if ($info.Length -gt 5MB -or $info.Length -eq 0) { throw "Unexpected file size: $($file.name)" }
    $items += [ordered]@{ name = $file.name; bytes = $info.Length; sha256 = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() }
}
$manifest = [ordered]@{
    schemaVersion = 1
    purpose = 'Local review packet, not publication or human acceptance'
    generatedAt = [DateTimeOffset]::Now.ToString('o')
    files = $items
}
$outDir = Join-Path $root 'delivery'
[void][IO.Directory]::CreateDirectory($outDir)
if ((Get-Item -LiteralPath $outDir).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Delivery directory must not be a link.' }
$path = Join-Path $outDir ('PathLab-review-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N').Substring(0,6) + '.zip')
$stream = [IO.File]::Open($path, [IO.FileMode]::CreateNew)
$zip = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($file in $files) {
        [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, (Join-Path $root $file.source), $file.name)
    }
    $entry = $zip.CreateEntry('manifest.json')
    $writer = [IO.StreamWriter]::new($entry.Open(), [Text.UTF8Encoding]::new($false))
    try { $writer.Write(($manifest | ConvertTo-Json -Depth 6)) } finally { $writer.Dispose() }
} finally { $zip.Dispose(); $stream.Dispose() }
& (Join-Path $PSScriptRoot 'Test-ReviewPacket.ps1') -Path $path -ExpectedHtmlSha256 $items[0].sha256