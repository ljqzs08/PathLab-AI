[CmdletBinding()]
param(
    [switch]$CheckOnly,
    [string]$VerifyArchive,
    [string]$OutputDirectory
)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd('\')
if ([IO.Path]::GetPathRoot($root) -ne 'D:\') { throw 'Project output must stay on D drive.' }
if ($CheckOnly -and $VerifyArchive) { throw 'Choose CheckOnly or VerifyArchive.' }
$utf8 = [Text.UTF8Encoding]::new($false)
Add-Type -AssemblyName System.IO.Compression

function Get-Sha256([byte[]]$Bytes) {
    $sha = [Security.Cryptography.SHA256]::Create()
    try { [BitConverter]::ToString($sha.ComputeHash($Bytes)).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
}
function Get-WorkspacePath([string]$Path) {
    $full = [IO.Path]::GetFullPath($Path)
    if (-not $full.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Path must stay inside this workspace.' }
    $full
}
function Test-Snapshot([string]$Json, [string]$Markdown, [string]$Label) {
    $records = @($Json -split '\r?\n' | Where-Object { $_.Trim() } | ForEach-Object { $_ | ConvertFrom-Json })
    if (-not $records.Count -or $records[0].role -cne 'user') { throw "Missing real user start: $Label" }
    $session = [regex]::Match($Markdown, 'Session ID: `([a-f0-9-]{36})`').Groups[1].Value
    $source = [regex]::Match($Markdown, 'Source file: `(rollout-[^`\r\n]+\.jsonl)`').Groups[1].Value
    if (-not $session -or -not $source -or $Markdown -notmatch 'Final assistant answer captured: True') { throw "Incomplete source metadata: $Label" }
    $previous = 0
    $finals = 0
    $keys = @()
    for ($i = 0; $i -lt $records.Count; $i++) {
        $record = $records[$i]
        if ($record.sequence -ne $i + 1 -or $record.sourceLine -le $previous) { throw "Invalid original order: $Label" }
        if ($record.role -notin @('user', 'assistant') -or ($i -gt 0 -and $record.role -eq 'user')) { throw "Unexpected role/round boundary: $Label" }
        if ($record.role -eq 'assistant' -and $record.phase -notin @('commentary','final','final_answer')) { throw "Hidden/unsupported phase: $Label" }
        if ($record.role -eq 'user' -and $record.phase) { throw "Unexpected user phase: $Label" }
        if ($record.text.TrimStart() -match '^# (Handoff Summary|Handoff —|交接摘要)') { throw "Internal material excluded: $Label" }
        if ((Get-Sha256 $utf8.GetBytes([string]$record.text)) -cne $record.textSha256) { throw "Original-text hash mismatch: $Label" }
        if (-not $Markdown.Contains([string]$record.text)) { throw "Markdown does not contain unchanged original: $Label" }
        [void][DateTimeOffset]::Parse([string]$record.timestamp)
        if ($record.role -eq 'assistant' -and $record.phase -in @('final','final_answer')) {
            $finals++
            if ($i -ne $records.Count - 1) { throw "Messages after final answer: $Label" }
        }
        $keys += $session + ':' + $record.sourceLine
        $previous = $record.sourceLine
    }
    if ($finals -ne 1) { throw "Exactly one persisted final answer required: $Label" }
    [pscustomobject]@{ stem=$Label; sessionId=$session; sourceFile=$source; messages=$records.Count; finalCaptured=$true; originalKeys=$keys }
}
function Read-ZipBytes($Entry) {
    $stream = $Entry.Open()
    $memory = [IO.MemoryStream]::new()
    try { $stream.CopyTo($memory); return ,$memory.ToArray() }
    finally { $stream.Dispose(); $memory.Dispose() }
}
function Test-Archive([string]$Path) {
    $full = Get-WorkspacePath $Path
    $input = [IO.File]::OpenRead($full)
    $zip = [IO.Compression.ZipArchive]::new($input, [IO.Compression.ZipArchiveMode]::Read, $false)
    try {
        $names = @($zip.Entries | ForEach-Object { $_.FullName })
        if (@($names | Select-Object -Unique).Count -ne $names.Count) { throw 'Duplicate ZIP entry.' }
        foreach ($name in $names) {
            if ($name -match '(^/|\\|(^|/)\.\.?(/|$)|:)') { throw 'Unsafe ZIP entry.' }
        }
        $entry = $zip.GetEntry('manifest.json')
        if (-not $entry) { throw 'Missing manifest.' }
        $manifest = $utf8.GetString((Read-ZipBytes $entry)) | ConvertFrom-Json
        if ($manifest.format -cne 'pathlab-prompt-evidence/v1') { throw 'Unsupported manifest.' }
        $expectedNames = @('manifest.json') + @($manifest.files | ForEach-Object { $_.path })
        if (@($expectedNames | Select-Object -Unique).Count -ne $expectedNames.Count -or (Compare-Object $expectedNames $names)) { throw 'Missing or unexpected ZIP content.' }
        foreach ($file in $manifest.files) {
            $bytes = Read-ZipBytes ($zip.GetEntry($file.path))
            if ($bytes.Length -ne $file.bytes -or (Get-Sha256 $bytes) -cne $file.sha256) { throw "Archive file hash mismatch: $($file.path)" }
        }
        $map = $utf8.GetString((Read-ZipBytes ($zip.GetEntry('prompts/submission/chain-map.json')))) | ConvertFrom-Json
        $snapshots = @()
        foreach ($stem in $map.snapshots) {
            $base = 'prompts/sessions/' + $stem
            $snapshots += Test-Snapshot ($utf8.GetString((Read-ZipBytes ($zip.GetEntry($base + '.jsonl'))))) ($utf8.GetString((Read-ZipBytes ($zip.GetEntry($base + '.md'))))) $stem
        }
        $allKeys = @($snapshots | ForEach-Object { $_.originalKeys })
        if (@($allKeys | Select-Object -Unique).Count -ne $allKeys.Count) { throw 'Same original message counted more than once.' }
        if ($snapshots.Count -ne $manifest.snapshotCount -or $allKeys.Count -ne $manifest.uniqueMessages) { throw 'Snapshot statistics mismatch.' }
        [pscustomobject]@{ archive=$full; sha256=(Get-FileHash -LiteralPath $full -Algorithm SHA256).Hash.ToLowerInvariant(); files=$manifest.files.Count; snapshots=$snapshots.Count; uniqueMessages=$allKeys.Count; commits=$manifest.commitCount; verified=$true; scope='Archive integrity and snapshot structure; original-source coverage audited separately; not native export or human acceptance' }
    } finally { $zip.Dispose(); $input.Dispose() }
}
if ($VerifyArchive) { Test-Archive $VerifyArchive; return }

$map = Get-Content -LiteralPath (Join-Path $root 'prompts/submission/chain-map.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$files = @(
    'prompts/submission/README.md',
    'prompts/submission/C01-algorithms.md',
    'prompts/submission/C02-prediction-replay.md',
    'prompts/submission/C03-reflection.md',
    'prompts/submission/U01-human-html-correction.md',
    'prompts/submission/S02-web-review-iteration.md',
    'prompts/submission/chain-map.json',
    'prompts/submission/attachments/project-brief.txt',
    'scripts/Export-PromptEvidencePackage.ps1',
    'docs/verification-stage-2-bfs.md',
    'docs/verification-stage-3-astar.md',
    'docs/verification-stage-4-learning.md',
    'docs/verification-stage-5-reflection.md',
    'docs/verification-standalone-html.md',
    'docs/verification-deepseek.md',
    'docs/verification-web-review.md',
    'docs/evidence/stage-2-check-ps7.txt',
    'docs/evidence/stage-3-check-ps7.txt',
    'docs/evidence/stage-3-comparison.json',
    'docs/evidence/stage-4-session-red.txt',
    'docs/evidence/stage-4-schema-validator-failure.txt',
    'docs/evidence/stage-4-session-check.txt',
    'docs/evidence/stage-4-ui-browser.json',
    'docs/evidence/stage-5-focus-observation.json',
    'docs/evidence/stage-5-focus-red.txt',
    'docs/evidence/stage-5-focus-red.json',
    'docs/evidence/stage-5-ui-check.txt',
    'docs/evidence/stage-5-ui-browser.json',
    'docs/evidence/standalone-before.json',
    'docs/evidence/standalone-first-build.txt',
    'docs/evidence/standalone-browser-initial.json',
    'docs/evidence/standalone-browser.json',
    'docs/evidence/standalone-next-browser.json',
    'docs/evidence/web-review-before.txt',
    'docs/evidence/web-review-check-pwsh.txt',
    'docs/evidence/web-review-http-full.json',
    'docs/evidence/web-review-offline-full.json'
)
foreach ($stem in $map.snapshots) {
    if ($stem -notmatch '^[A-Za-z0-9_-]+$') { throw 'Unsafe snapshot name.' }
    $files += 'prompts/sessions/' + $stem + '.md'
    $files += 'prompts/sessions/' + $stem + '.jsonl'
}
$files = @($files | Select-Object -Unique)
$payload = [ordered]@{}
foreach ($file in $files) {
    $path = Get-WorkspacePath (Join-Path $root $file)
    $payload[$file] = [IO.File]::ReadAllBytes($path)
}
$snapshots = @()
foreach ($stem in $map.snapshots) {
    $base = 'prompts/sessions/' + $stem
    $snapshots += Test-Snapshot ($utf8.GetString($payload[$base + '.jsonl'])) ($utf8.GetString($payload[$base + '.md'])) $stem
}
$allKeys = @($snapshots | ForEach-Object { $_.originalKeys })
if (@($allKeys | Select-Object -Unique).Count -ne $allKeys.Count) { throw 'Duplicate original message across snapshots.' }
if ((Get-Sha256 $payload[$map.attachment.path]) -cne $map.attachment.sha256) { throw 'Original user attachment hash mismatch.' }
$commits = @()
foreach ($ref in @($map.chains | ForEach-Object { $_.commits } | Select-Object -Unique)) {
    $hash = git -C $root rev-parse --verify "$ref^{commit}"
    if ($LASTEXITCODE -ne 0) { throw "Missing real commit: $ref" }
    git -C $root merge-base --is-ancestor $hash HEAD
    if ($LASTEXITCODE -ne 0) { throw "Commit not in current history: $ref" }
    $detail = @(git -C $root show -s --format='%s%n%aI' $hash)
    $changed = @(git -C $root -c core.quotepath=false diff-tree --no-commit-id --name-only -r $hash)
    $commits += [ordered]@{ short=$ref; hash=$hash; subject=$detail[0]; authoredAt=$detail[1]; changedFiles=$changed; ancestorOfHead=$true }
}
$head = git -C $root rev-parse HEAD
$history = [ordered]@{ capturedAt=[DateTimeOffset]::Now.ToString('o'); sourceHead=$head; commits=$commits; note='Read from real local Git; ZIP contains no .git directory. Not a new commit or publication claim.' }
$payload['git-history.json'] = $utf8.GetBytes(($history | ConvertTo-Json -Depth 7) + "`n")
$start = "# PathLab AI Prompt 证据附件`n`n请先打开 [评审材料入口](prompts/submission/README.md)。`n`n本包为 3 个核心模块与真实交付纠正 / 复盘方案迭代的选编：$($snapshots.Count) 份完成轮，$($allKeys.Count) 条去重真实可见消息，$($commits.Count) 个真实历史提交。不是工具原生全量导出、源码替代品或人工验收。原始聊天内的旧路径/旧进度保持原样；历史外链和未选文档请到完整源码仓库核查。`n`nmanifest.json 记录逐文件 SHA256；git-history.json 记录提交完整哈希与文件。校验命令：在本 D 盘工作区使用 scripts/Export-PromptEvidencePackage.ps1 -VerifyArchive 后接实际 ZIP 绝对路径。`n"
$payload['START-HERE.md'] = $utf8.GetBytes($start)
$checks = @()
foreach ($name in $payload.Keys) { $checks += [ordered]@{ path=$name; bytes=$payload[$name].Length; sha256=(Get-Sha256 $payload[$name]) } }
$manifest = [ordered]@{ format='pathlab-prompt-evidence/v1'; capturedAt=[DateTimeOffset]::Now.ToString('o'); sourceHead=$head; contentScope='Whitelist bytes read from working tree; sourceHead anchors existing Git history, not byte identity of every included file'; snapshotCount=$snapshots.Count; uniqueMessages=$allKeys.Count; commitCount=$commits.Count; snapshots=$snapshots; files=$checks; limits=$map.limits }
if ($CheckOnly) { [pscustomobject]@{ files=$payload.Count; snapshots=$snapshots.Count; uniqueMessages=$allKeys.Count; commits=$commits.Count; originalAttachmentHash=$map.attachment.sha256; checked=$true; publicationPerformed=$false }; return }
if (-not $OutputDirectory) { $OutputDirectory = Join-Path $root 'delivery' }
$out = Get-WorkspacePath $OutputDirectory
[void][IO.Directory]::CreateDirectory($out)
$destination = Join-Path $out ('PathLab-AI-Prompt-evidence-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.zip')
$stream = [IO.File]::Open($destination, [IO.FileMode]::CreateNew, [IO.FileAccess]::ReadWrite)
$zip = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create, $false)
try {
    $payload['manifest.json'] = $utf8.GetBytes(($manifest | ConvertTo-Json -Depth 9) + "`n")
    foreach ($name in $payload.Keys) {
        $entry = $zip.CreateEntry($name, [IO.Compression.CompressionLevel]::Optimal)
        $entryStream = $entry.Open()
        try { $entryStream.Write($payload[$name], 0, $payload[$name].Length) } finally { $entryStream.Dispose() }
    }
} finally { $zip.Dispose(); $stream.Dispose() }
Test-Archive $destination
