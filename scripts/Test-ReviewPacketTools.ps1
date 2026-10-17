# Synthetic archive checks only; not human acceptance or competition dialogue.
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd('\')
$dir = Join-Path $root ('.evidence-checks\review-' + [guid]::NewGuid().ToString('N'))
[void][IO.Directory]::CreateDirectory($dir)
$passed = [Collections.Generic.List[string]]::new()
function Assert([bool]$Condition, [string]$Name) {
    if (-not $Condition) { throw "FAIL: $Name" }
    $passed.Add($Name)
}
function Reject([scriptblock]$Action, [string]$Name) {
    $failed = $false
    try { & $Action | Out-Null } catch { $failed = $true }
    Assert $failed $Name
}
function Mutate([string]$Name, [scriptblock]$Action) {
    $copy = Join-Path $dir ($Name + '.zip')
    Copy-Item -LiteralPath $packet.path -Destination $copy
    $zip = [IO.Compression.ZipFile]::Open($copy, [IO.Compression.ZipArchiveMode]::Update)
    try { & $Action $zip } finally { $zip.Dispose() }
    return $copy
}
$packet = $null
try {
    $packet = & (Join-Path $PSScriptRoot 'Build-ReviewPacket.ps1')
    Assert $packet.integrityPassed 'build and verify allowlisted packet'
    Assert ($packet.path.StartsWith($root + '\delivery\')) 'output stays in workspace delivery'
    Assert (-not $packet.published -and -not $packet.humanAccepted) 'does not claim publishing or human acceptance'
    $verified = & (Join-Path $PSScriptRoot 'Test-ReviewPacket.ps1') -Path $packet.path -ExpectedHtmlSha256 $packet.htmlSha256
    Assert ($verified.zipSha256 -eq $packet.zipSha256) 'read-only verification preserves packet bytes'
    Reject { & (Join-Path $PSScriptRoot 'Test-ReviewPacket.ps1') -Path $packet.path -ExpectedHtmlSha256 ('0' * 64) } 'reject wrong expected HTML hash'
    $tampered = Mutate 'tampered' {
        param($zip)
        $entry = $zip.GetEntry('PathLab AI.html'); $entry.Delete()
        $writer = [IO.StreamWriter]::new($zip.CreateEntry('PathLab AI.html').Open())
        try { $writer.Write('SYNTHETIC tampered HTML') } finally { $writer.Dispose() }
    }
    Reject { & (Join-Path $PSScriptRoot 'Test-ReviewPacket.ps1') -Path $tampered } 'reject tampered bytes'
    $extra = Mutate 'extra' { param($zip) [void]$zip.CreateEntry('unexpected.txt') }
    Reject { & (Join-Path $PSScriptRoot 'Test-ReviewPacket.ps1') -Path $extra } 'reject non-allowlisted entry'
    $missing = Mutate 'missing' { param($zip) $zip.GetEntry('START-HERE.md').Delete() }
    Reject { & (Join-Path $PSScriptRoot 'Test-ReviewPacket.ps1') -Path $missing } 'reject missing entry'
    $duplicate = Mutate 'duplicate' { param($zip) $zip.GetEntry('START-HERE.md').Delete(); [void]$zip.CreateEntry('manual-acceptance.md') }
    Reject { & (Join-Path $PSScriptRoot 'Test-ReviewPacket.ps1') -Path $duplicate } 'reject duplicate archive names'
    $traversal = Mutate 'traversal' { param($zip) $zip.GetEntry('START-HERE.md').Delete(); [void]$zip.CreateEntry('../START-HERE.md') }
    Reject { & (Join-Path $PSScriptRoot 'Test-ReviewPacket.ps1') -Path $traversal } 'reject path traversal entry without extraction'
    $invalid = Mutate 'invalid-manifest' {
        param($zip)
        $zip.GetEntry('manifest.json').Delete()
        $writer = [IO.StreamWriter]::new($zip.CreateEntry('manifest.json').Open())
        try { $writer.Write('{not-json') } finally { $writer.Dispose() }
    }
    Reject { & (Join-Path $PSScriptRoot 'Test-ReviewPacket.ps1') -Path $invalid } 'reject invalid manifest JSON'
    [pscustomobject]@{ executor = 'AI synthetic tool checks'; shell = $PSVersionTable.PSVersion.ToString(); passed = $passed.Count; checks = @($passed) } | ConvertTo-Json -Depth 4
} finally {
    # Only files created by this test, resolved and checked within the workspace.
    $resolved = [IO.Path]::GetFullPath($dir)
    if (-not $resolved.StartsWith($root + '\.evidence-checks\review-', [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe cleanup path.' }
    if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force }
    if ($packet) {
        $packetPath = [IO.Path]::GetFullPath($packet.path)
        if (-not $packetPath.StartsWith($root + '\delivery\PathLab-review-', [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe test packet cleanup.' }
        Remove-Item -LiteralPath $packetPath -Force
    }
}