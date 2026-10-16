# Synthetic fixtures only. No test dialogue is competition evidence.
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd('\')
$exporter = Join-Path $PSScriptRoot 'Export-PromptSnapshot.ps1'
$id = [guid]::NewGuid().ToString()
$stem = 'test-' + $id
$scratch = [IO.Path]::GetFullPath((Join-Path $root ('.evidence-checks\' + $id)))
if (-not $scratch.StartsWith($root + '\.evidence-checks\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe scratch path.' }
[void][IO.Directory]::CreateDirectory($scratch)
$fixture = Join-Path $scratch 'fixture.jsonl'
$utf8 = [Text.UTF8Encoding]::new($false)
$passed = [Collections.Generic.List[string]]::new()
function Assert-True([bool]$Condition, [string]$Name) {
    if (-not $Condition) { throw "FAIL: $Name" }
    $passed.Add($Name)
}
function Expect-Failure([scriptblock]$Action, [string]$Name) {
    $failed = $false
    try { & $Action | Out-Null } catch { $failed = $true }
    Assert-True $failed $Name
}
function Message([string]$Role, [string]$Phase, [string]$Text) {
    return @{ timestamp = '2026-10-17T00:00:00Z'; type = 'response_item'; payload = @{ type = 'message'; role = $Role; phase = $Phase; content = @(@{ type = 'input_text'; text = $Text }) } }
}
function Save-Fixture([object[]]$Items, [string]$Tail = '') {
    $json = ($Items | ForEach-Object { $_ | ConvertTo-Json -Depth 10 -Compress }) -join "`n"
    [IO.File]::WriteAllText($fixture, $json + "`n" + $Tail, $utf8)
}
$meta = @{ type = 'session_meta'; payload = @{ id = $id; cwd = $root } }
$base = @($meta, (Message 'system' '' 'PRIVATE_SYSTEM'), (Message 'user' '' ('TEST-PROMPT-' + $id)), (Message 'assistant' 'analysis' 'PRIVATE_ANALYSIS'), (Message 'assistant' 'commentary' '真实建议：先验证'))
$args = @{ PromptPrefix = 'TEST-PROMPT-' + $id; SessionId = $id; SourceFile = $fixture; OutputStem = $stem }
try {
    Save-Fixture $base
    $result = & $exporter @args
    Assert-True ($result.messages -eq 2 -and -not $result.finalCaptured) 'open turn exported without claiming final answer'
    $records = @(Get-Content -LiteralPath $result.jsonl -Encoding UTF8 | ForEach-Object { $_ | ConvertFrom-Json })
    Assert-True ($records[1].text -ceq '真实建议：先验证') 'Chinese original text preserved'
    $payload = [IO.File]::ReadAllText($result.jsonl, [Text.Encoding]::UTF8)
    Assert-True (-not $payload.Contains('PRIVATE_SYSTEM') -and -not $payload.Contains('PRIVATE_ANALYSIS')) 'hidden/system messages excluded'
    Expect-Failure { & $exporter @args } 'existing snapshot not overwritten implicitly'
    $full = $base + @((Message 'assistant' 'final_answer' '# Handoff Summary internal'), (Message 'assistant' 'final_answer' '已验证，最终说明'), (Message 'user' '' 'NEXT-USER'), (Message 'assistant' 'final_answer' 'NEXT-ANSWER'))
    Save-Fixture $full
    $result = & $exporter @args -Refresh
    Assert-True ($result.messages -eq 3 -and $result.finalCaptured) 'refresh appends real final answer'
    $payload = [IO.File]::ReadAllText($result.jsonl, [Text.Encoding]::UTF8)
    Assert-True (-not $payload.Contains('Handoff Summary') -and -not $payload.Contains('NEXT-USER') -and -not $payload.Contains('NEXT-ANSWER')) 'internal summary and later turns excluded'
    $hash = [Security.Cryptography.SHA256]::Create()
    try {
        $records = @(Get-Content -LiteralPath $result.jsonl -Encoding UTF8 | ForEach-Object { $_ | ConvertFrom-Json })
        $matches = @($records | Where-Object { $_.textSha256 -cne ([BitConverter]::ToString($hash.ComputeHash([Text.Encoding]::UTF8.GetBytes($_.text))).Replace('-', '').ToLowerInvariant()) })
        Assert-True ($matches.Count -eq 0) 'all original-text hashes verified'
    } finally { $hash.Dispose() }
    $base[4].payload.content[0].text = 'CHANGED-OLD-MESSAGE'
    Save-Fixture ($base + @((Message 'assistant' 'final_answer' '已验证，最终说明')))
    Expect-Failure { & $exporter @args -Refresh } 'refresh refuses rewriting archived originals'
    $base[4].payload.content[0].text = '真实建议：先验证'
    Save-Fixture ($base + @((Message 'user' '' ('TEST-PROMPT-' + $id))))
    Expect-Failure { & $exporter @args -Refresh } 'ambiguous prompt prefix refused'
    Save-Fixture $base
    $missing = $args.Clone(); $missing.PromptPrefix = 'NOT-PRESENT'
    Expect-Failure { & $exporter @missing -Refresh } 'missing original prompt not fabricated'
    $wrong = $args.Clone(); $wrong.SessionId = [guid]::NewGuid().ToString()
    Expect-Failure { & $exporter @wrong -Refresh } 'wrong session identity refused'
    $meta.payload.cwd = 'D:\not-this-workspace'
    Save-Fixture $base
    Expect-Failure { & $exporter @args -Refresh } 'unrelated workspace refused'
    $meta.payload.cwd = $root
    Save-Fixture $full '{'
    $result = & $exporter @args -Refresh
    Assert-True $result.sourceTailIncomplete 'in-progress truncated tail explicitly marked'
    $outside = $args.Clone(); $outside.OutputStem = '..\escape'
    Expect-Failure { & $exporter @outside -Refresh } 'output traversal refused'
    [pscustomobject]@{ testsPassed = $passed.Count; checks = $passed.ToArray() }
} finally {
    foreach ($extension in @('.md', '.jsonl')) {
        $generated = [IO.Path]::GetFullPath((Join-Path $root ('prompts\sessions\' + $stem + $extension)))
        if (-not $generated.StartsWith($root + '\prompts\sessions\test-', [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe cleanup target.' }
        if (Test-Path -LiteralPath $generated) { Remove-Item -LiteralPath $generated -Force }
    }
    if (Test-Path -LiteralPath $fixture) { Remove-Item -LiteralPath $fixture -Force }
    if (Test-Path -LiteralPath $scratch) { Remove-Item -LiteralPath $scratch }
    $parent = Join-Path $root '.evidence-checks'
    if ((Test-Path -LiteralPath $parent) -and @(Get-ChildItem -LiteralPath $parent -Force).Count -eq 0) { Remove-Item -LiteralPath $parent }
}