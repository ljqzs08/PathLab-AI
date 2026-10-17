[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][ValidateNotNullOrEmpty()][string]$PromptPrefix,
    [string]$SessionId = $env:CODEX_THREAD_ID,
    [string]$SourceFile,
    [Parameter(Mandatory = $true)][ValidatePattern('^[A-Za-z0-9][A-Za-z0-9_-]{0,100}$')][string]$OutputStem,
    [switch]$Refresh
)
$ErrorActionPreference = 'Stop'
$workspace = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd('\')
if ([IO.Path]::GetPathRoot($workspace) -ne 'D:\') { throw 'Workspace must stay on D drive.' }
[guid]$parsedSessionId = [guid]::Empty
if (-not $SessionId -or -not [guid]::TryParse($SessionId, [ref]$parsedSessionId)) { throw 'A real session UUID is required.' }
if (-not $SourceFile) {
    $homeRoot = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE '.codex' }
    $sessionRoot = Join-Path $homeRoot 'sessions'
    $files = @(Get-ChildItem -LiteralPath $sessionRoot -File -Recurse -Filter "rollout-*-$SessionId.jsonl")
    if ($files.Count -ne 1) { throw 'Expected exactly one source file for this session. Pass -SourceFile explicitly.' }
    $SourceFile = $files[0].FullName
}
$source = (Get-Item -LiteralPath $SourceFile).FullName
$share = [IO.FileShare]::ReadWrite -bor [IO.FileShare]::Delete
$stream = [IO.File]::Open($source, [IO.FileMode]::Open, [IO.FileAccess]::Read, $share)
$reader = [IO.StreamReader]::new($stream, [Text.Encoding]::UTF8)
try { $raw = $reader.ReadToEnd() } finally { $reader.Dispose() }
$lines = $raw -split '\r?\n'
$entries = [Collections.Generic.List[object]]::new()
$meta = $null
$partialTail = $false
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ([string]::IsNullOrWhiteSpace($lines[$i])) { continue }
    try { $record = $lines[$i] | ConvertFrom-Json -ErrorAction Stop }
    catch {
        if ($i -eq $lines.Count - 1) { $partialTail = $true; break }
        throw "Invalid JSON record at source line $($i + 1)."
    }
    if ($record.type -eq 'session_meta') { $meta = $record.payload }
    if ($record.type -ne 'response_item' -or $record.payload.type -ne 'message') { continue }
    $message = $record.payload
    if ($message.role -notin @('user', 'assistant')) { continue }
    if ($message.role -eq 'assistant' -and $message.phase -notin @('commentary', 'final_answer', 'final')) { continue }
    $text = @($message.content | Where-Object { $_.type -in @('input_text', 'output_text', 'text') } | ForEach-Object { $_.text }) -join "`n"
    if (-not $text) { continue }
    $timestampMatch = [regex]::Match($lines[$i], '"timestamp"\s*:\s*"([^"]+)"')
    $entries.Add([pscustomobject]@{ role = $message.role; phase = [string]$message.phase; text = $text; sourceLine = $i + 1; timestamp = $timestampMatch.Groups[1].Value })
}
if (-not $meta -or $meta.id -ne $SessionId) { throw 'Source session ID does not match the requested session.' }
$sourceCwd = [IO.Path]::GetFullPath([string]$meta.cwd).TrimEnd('\')
if ($sourceCwd -ne $workspace -and -not $sourceCwd.StartsWith($workspace + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Source session does not belong to this workspace.' }
$matches = @($entries | Where-Object { $_.role -eq 'user' -and $_.text.StartsWith($PromptPrefix, [StringComparison]::Ordinal) })
if ($matches.Count -ne 1) { throw "Prompt prefix must match exactly one real user message; found $($matches.Count)." }
$start = $matches[0].sourceLine
$selected = [Collections.Generic.List[object]]::new()
foreach ($entry in $entries) {
    if ($entry.sourceLine -lt $start) { continue }
    if ($selected.Count -gt 0 -and $entry.role -eq 'user') { break }
    # Some logs contain internal handoff material as assistant messages; never export it.
    if ($entry.role -eq 'assistant' -and ($entry.text.TrimStart().StartsWith('# Handoff Summary', [StringComparison]::Ordinal) -or $entry.text.TrimStart().StartsWith('# Handoff —', [StringComparison]::Ordinal))) { continue }
    $selected.Add($entry)
    if ($entry.role -eq 'assistant' -and $entry.phase -in @('final_answer', 'final')) { break }
}
$capturedAt = [DateTimeOffset]::Now.ToString('o')
$finalCaptured = @($selected | Where-Object { $_.role -eq 'assistant' -and $_.phase -in @('final_answer', 'final') }).Count -gt 0
$outDir = [IO.Path]::GetFullPath((Join-Path $workspace 'prompts\sessions'))
if (-not $outDir.StartsWith($workspace + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Output outside workspace.' }
$mdPath = Join-Path $outDir ($OutputStem + '.md')
$jsonPath = Join-Path $outDir ($OutputStem + '.jsonl')
if (-not $Refresh -and ((Test-Path -LiteralPath $mdPath) -or (Test-Path -LiteralPath $jsonPath))) { throw 'Snapshot already exists. Use -Refresh only to append original messages.' }
$records = [Collections.Generic.List[object]]::new()
$sha = [Security.Cryptography.SHA256]::Create()
try {
    foreach ($entry in $selected) {
        $hash = [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($entry.text))).Replace('-', '').ToLowerInvariant()
        $records.Add([ordered]@{ sequence = $records.Count + 1; timestamp = $entry.timestamp; role = $entry.role; phase = $entry.phase; sourceLine = $entry.sourceLine; textSha256 = $hash; text = $entry.text })
    }
} finally { $sha.Dispose() }
if ($Refresh -and (Test-Path -LiteralPath $jsonPath)) {
    $previous = @(Get-Content -LiteralPath $jsonPath -Encoding UTF8 | Where-Object { $_.Trim() } | ForEach-Object { $_ | ConvertFrom-Json })
    if ($previous.Count -gt $records.Count) { throw 'Refresh would remove existing messages.' }
    for ($i = 0; $i -lt $previous.Count; $i++) {
        if ($previous[$i].text -cne $records[$i].text -or $previous[$i].role -cne $records[$i].role -or $previous[$i].sourceLine -ne $records[$i].sourceLine) { throw 'Refresh would alter previously captured original messages.' }
    }
}
$md = [Text.StringBuilder]::new()
[void]$md.AppendLine('# 本轮真实可见消息快照')
[void]$md.AppendLine('')
[void]$md.AppendLine("- Session ID: ``$SessionId``")
[void]$md.AppendLine("- Source file: ``$([IO.Path]::GetFileName($source))`` (read-only)")
[void]$md.AppendLine("- Captured at: $capturedAt")
[void]$md.AppendLine("- Visible messages captured: $($records.Count)")
[void]$md.AppendLine("- Final assistant answer captured: $finalCaptured")
[void]$md.AppendLine("- Incomplete source tail skipped: $partialTail")
[void]$md.AppendLine('- Scope: one actual user prompt and following persisted visible assistant messages, stopping at the next user message. No hidden reasoning, system/developer prompts, tool payloads or compacted history are exported.')
[void]$md.AppendLine('- 这是从真实本地记录提取的可见文字，不是工具原生全量导出，也不是截图或录屏。最终答复未写入时，该轮证据仍待补齐；缺失附件不视为已导出。本快照是否属于核心功能链以演进索引为准，策略讨论不能计作核心功能迭代。')
foreach ($record in $records) {
    [void]$md.AppendLine('')
    $phaseSuffix = if ($record.phase) { ' / ' + $record.phase } else { '' }
    [void]$md.AppendLine("## $($record.sequence). $($record.role)$phaseSuffix")
    [void]$md.AppendLine('')
    [void]$md.AppendLine("Source line: $($record.sourceLine); Timestamp: $($record.timestamp); Text SHA256: ``$($record.textSha256)``")
    [void]$md.AppendLine('')
    [void]$md.AppendLine($record.text)
}
[void][IO.Directory]::CreateDirectory($outDir)
$utf8 = [Text.UTF8Encoding]::new($false)
[IO.File]::WriteAllText($jsonPath, (($records | ForEach-Object { $_ | ConvertTo-Json -Compress -Depth 6 }) -join "`n") + "`n", $utf8)
[IO.File]::WriteAllText($mdPath, $md.ToString(), $utf8)
[pscustomobject]@{ markdown = $mdPath; jsonl = $jsonPath; messages = $records.Count; finalCaptured = $finalCaptured; sourceTailIncomplete = $partialTail }