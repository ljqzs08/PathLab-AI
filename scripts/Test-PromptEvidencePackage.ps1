# Synthetic corruption checks, never competition conversations or human acceptance.
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd('\')
$exporter = Join-Path $PSScriptRoot 'Export-PromptEvidencePackage.ps1'
$testDir = Join-Path $root ('.cache/prompt-evidence-test-' + [guid]::NewGuid().ToString('N'))
if (-not $testDir.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe fixture path.' }
[void][IO.Directory]::CreateDirectory($testDir)
$created = [Collections.Generic.List[string]]::new()
$checks = [Collections.Generic.List[object]]::new()
$utf8 = [Text.UTF8Encoding]::new($false)
Add-Type -AssemblyName System.IO.Compression
function Assert-True($Value, [string]$Name) {
    if (-not $Value) { throw "FAIL: $Name" }
    $checks.Add([ordered]@{ name=$Name; passed=$true })
}
function Expect-Failure([scriptblock]$Action, [string]$Name) {
    $failed = $false
    try { & $Action | Out-Null } catch { $failed = $true }
    Assert-True $failed $Name
}
function Read-Bytes($Entry) {
    $stream = $Entry.Open(); $memory = [IO.MemoryStream]::new()
    try { $stream.CopyTo($memory); return ,$memory.ToArray() } finally { $stream.Dispose(); $memory.Dispose() }
}
function Write-Entry($Zip, [string]$Name, [byte[]]$Bytes) {
    $old = $Zip.GetEntry($Name)
    if ($old) { $old.Delete() }
    $stream = $Zip.CreateEntry($Name).Open()
    try { $stream.Write($Bytes, 0, $Bytes.Length) } finally { $stream.Dispose() }
}
function New-Variant([string]$Name, [scriptblock]$Change) {
    $path = Join-Path $testDir ($Name + '.zip')
    Copy-Item -LiteralPath $script:baseline -Destination $path
    $created.Add($path)
    $input = [IO.File]::Open($path, [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite)
    $zip = [IO.Compression.ZipArchive]::new($input, [IO.Compression.ZipArchiveMode]::Update, $false)
    try { & $Change $zip } finally { $zip.Dispose(); $input.Dispose() }
    $path
}
try {
    $check = & $exporter -CheckOnly
    Assert-True ($check.checked -and $check.snapshots -eq 9 -and $check.uniqueMessages -eq 38 -and $check.commits -eq 10) 'whitelisted complete rounds and actual commits verified'
    $result = & $exporter -OutputDirectory $testDir
    $script:baseline = $result.archive
    $created.Add($baseline)
    Assert-True ($result.verified -and $result.snapshots -eq 9 -and $result.uniqueMessages -eq 38) 'build and immediate ZIP verification succeed'
    $again = & $exporter -VerifyArchive $baseline
    Assert-True ($again.sha256 -ceq $result.sha256) 'independent reopen matches archive SHA256'
    Expect-Failure { & $exporter -OutputDirectory $root } 'output outside selected workspace child refused'
    $path = New-Variant 'changed-content' { param($zip) Write-Entry $zip 'START-HERE.md' $utf8.GetBytes('SYNTHETIC_CHANGED_CONTENT') }
    Expect-Failure { & $exporter -VerifyArchive $path } 'altered file bytes refused'
    $path = New-Variant 'unexpected-entry' { param($zip) Write-Entry $zip 'synthetic-unlisted.txt' $utf8.GetBytes('SYNTHETIC_UNLISTED_CONTENT') }
    Expect-Failure { & $exporter -VerifyArchive $path } 'unlisted ZIP content refused'
    $path = New-Variant 'unsafe-entry' { param($zip) Write-Entry $zip '../synthetic-outside.txt' $utf8.GetBytes('SYNTHETIC_PATH_ONLY') }
    Expect-Failure { & $exporter -VerifyArchive $path } 'unsafe ZIP entry refused without extraction'
    $path = New-Variant 'duplicate-entry' { param($zip) $stream=$zip.CreateEntry('START-HERE.md').Open(); $stream.Dispose() }
    Expect-Failure { & $exporter -VerifyArchive $path } 'duplicate archive entry refused'
    $path = New-Variant 'hidden-phase' {
        param($zip)
        $name = 'prompts/sessions/2026-10-17-stage-2-bfs.jsonl'
        $text = $utf8.GetString((Read-Bytes ($zip.GetEntry($name))))
        $changed = $text.Replace('"phase":"commentary"','"phase":"analysis"')
        $bytes = $utf8.GetBytes($changed)
        Write-Entry $zip $name $bytes
        $manifest = $utf8.GetString((Read-Bytes ($zip.GetEntry('manifest.json')))) | ConvertFrom-Json
        $file = @($manifest.files | Where-Object path -eq $name)[0]
        $file.bytes = $bytes.Length
        $sha = [Security.Cryptography.SHA256]::Create()
        try { $file.sha256=[BitConverter]::ToString($sha.ComputeHash($bytes)).Replace('-','').ToLowerInvariant() } finally { $sha.Dispose() }
        Write-Entry $zip 'manifest.json' $utf8.GetBytes(($manifest | ConvertTo-Json -Depth 12))
    }
    Expect-Failure { & $exporter -VerifyArchive $path } 'hidden assistant phase refused even after manifest hash is updated'
} finally {
    # Only exact newly created fixtures; no recursive deletion, no historical caches.
    foreach ($path in $created) {
        $full = [IO.Path]::GetFullPath($path)
        if (-not $full.StartsWith($testDir + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe fixture cleanup.' }
        Remove-Item -LiteralPath $full -Force -ErrorAction Stop
    }
    if (@(Get-ChildItem -LiteralPath $testDir -Force).Count -eq 0) { Remove-Item -LiteralPath $testDir -ErrorAction Stop }
}
[ordered]@{ executor='AI synthetic packaging checks; not human Prompt evidence'; checkedAt=[DateTimeOffset]::Now.ToString('o'); shell=$PSVersionTable.PSVersion.ToString(); passed=$checks.Count; checks=$checks; fixturesCleaned=$true; applicationTestsRerun=$false; publicationPerformed=$false } | ConvertTo-Json -Depth 5
