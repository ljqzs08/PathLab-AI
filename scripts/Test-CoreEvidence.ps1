# Read-only comparison of selected visible snapshots against their actual source lines.
# Reads existing session logs; never copies system/developer messages or hidden reasoning.
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd('\')
$homeRoot = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE '.codex' }
$stems = @('stage-2-bfs','autonomous-iterations','evidence-correction-storage','local-html-entry','standalone-html-correction','motion-interaction','free-playground','remote-ai-advice','remote-ai-interrupted','review-readiness','review-rules-continuation')
$sourceCache = @{}
$results = @()
$sha = [Security.Cryptography.SHA256]::Create()
try {
    foreach ($stem in $stems) {
        $relative = 'prompts/sessions/2026-10-17-' + $stem
        $md = Get-Content -LiteralPath (Join-Path $root ($relative + '.md')) -Raw -Encoding UTF8
        $sourceName = [regex]::Match($md, 'rollout-[^`\r\n]+\.jsonl').Value
        $sessionId = [regex]::Match($md, 'Session ID: `([^`]+)`').Groups[1].Value
        if (-not $sourceName -or -not $sessionId) { throw "Missing source metadata: $stem" }
        if (-not $sourceCache.ContainsKey($sourceName)) {
            $files = @(Get-ChildItem -LiteralPath (Join-Path $homeRoot 'sessions') -File -Recurse -Filter $sourceName)
            if ($files.Count -ne 1) { throw "Missing or ambiguous source: $sourceName" }
            $stream = [IO.File]::Open($files[0].FullName, [IO.FileMode]::Open, [IO.FileAccess]::Read, ([IO.FileShare]::ReadWrite -bor [IO.FileShare]::Delete))
            $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::UTF8)
            try { $sourceCache[$sourceName] = $reader.ReadToEnd() -split '\r?\n' } finally { $reader.Dispose() }
        }
        $lines = $sourceCache[$sourceName]
        $meta = $lines[0] | ConvertFrom-Json
        if ($meta.type -ne 'session_meta' -or $meta.payload.id -ne $sessionId) { throw 'Source session mismatch.' }
        $records = @(Get-Content -LiteralPath (Join-Path $root ($relative + '.jsonl')) -Encoding UTF8 | ForEach-Object { $_ | ConvertFrom-Json })
        if (-not $records.Count -or $records[0].role -ne 'user') { throw "Missing user prompt: $stem" }
        $previous = 0
        foreach ($record in $records) {
            if ($record.sourceLine -le $previous -or $record.sourceLine -gt $lines.Count) { throw 'Invalid source line order.' }
            $original = $lines[$record.sourceLine - 1] | ConvertFrom-Json
            $message = $original.payload
            if ($original.type -ne 'response_item' -or $message.type -ne 'message' -or $message.role -notin @('user','assistant')) { throw 'Not a visible user/assistant message.' }
            if ($message.role -eq 'assistant' -and $message.phase -notin @('commentary','final','final_answer')) { throw 'Non-visible assistant phase.' }
            $text = @($message.content | Where-Object { $_.type -in @('input_text','output_text','text') } | ForEach-Object { $_.text }) -join "`n"
            if ($text.TrimStart() -match '^# (Handoff Summary|Handoff —|交接摘要)') { throw 'Internal summary excluded.' }
            $hash = [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($text))).Replace('-','').ToLowerInvariant()
            if ($record.text -cne $text -or $record.role -cne $message.role -or [string]$record.phase -cne [string]$message.phase -or $record.textSha256 -cne $hash) { throw "Source/hash mismatch: $stem line $($record.sourceLine)" }
            $previous = $record.sourceLine
        }
        $final = @($records | Where-Object { $_.role -eq 'assistant' -and $_.phase -in @('final','final_answer') }).Count -gt 0
        if ($stem -notin @('remote-ai-interrupted','review-readiness','review-rules-continuation') -and -not $final) { throw "Expected completed snapshot: $stem" }
        $results += [ordered]@{ path = $relative + '.jsonl'; source = $sourceName; messages = $records.Count; finalCaptured = $final; originalsAndHashesMatch = $true }
    }
} finally { $sha.Dispose() }
$commits = @()
foreach ($ref in @('5c3eec6','5ade0e8','572e15d','fd82d8f','3b2e9f3','f4a43ca','5e369b5','4b11729','c51334d')) {
    $hash = git -C $root rev-parse --verify "$ref^{commit}"
    if ($LASTEXITCODE -ne 0) { throw "Missing commit: $ref" }
    git -C $root merge-base --is-ancestor $hash HEAD
    if ($LASTEXITCODE -ne 0) { throw "Commit not in current history: $ref" }
    $commits += [ordered]@{ short = $ref; hash = $hash; ancestorOfHead = $true }
}
$stats = @()
foreach ($name in @('standalone-browser-initial','standalone-browser','standalone-next-browser','playground-offline-final','playground-http-final')) {
    $data = Get-Content -LiteralPath (Join-Path $root ('docs/evidence/' + $name + '.json')) -Raw -Encoding UTF8 | ConvertFrom-Json
    $stats += [ordered]@{ file = $name + '.json'; historicalStats = $data.stats }
}
[ordered]@{
    executor = 'AI evidence audit; not human acceptance'
    checkedAt = [DateTimeOffset]::Now.ToString('o')
    snapshots = $results
    commits = $commits
    historicalBrowserResults = $stats
    remoteCount = @(git -C $root remote).Count
    htmlSha256 = (Get-FileHash -LiteralPath (Join-Path $root 'PathLab-AI/PathLab AI.html')).Hash.ToLowerInvariant()
    limits = @('Selected source lines verified; not native full conversation export', 'Interrupted rounds have no invented final answer', 'No claim of three independent human bug reports', 'No publication or physical-device acceptance')
} | ConvertTo-Json -Depth 8