# Render the two latest editable Word files with installed Microsoft Word. No cloud upload.
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$temp=Join-Path $root '.cache\submission-latest-20261115'
$env:TEMP=$temp;$env:TMP=$temp
$base=Join-Path $root 'delivery\PathLab-AI-参赛文件-最新版-20261115\04-完整材料解压版'
$word=$null;$records=@()
try {
 $word=New-Object -ComObject Word.Application
 $word.Visible=$false;$word.DisplayAlerts=0;$word.AutomationSecurity=3
 foreach($file in @('01-作品介绍\PathLab-AI-作品介绍文档-最新版-20261115.docx','02-技术文档\PathLab-AI-技术文档-最新版-20261115.docx')) {
  $path=Join-Path $base $file;$doc=$null
  try {
   $doc=$word.Documents.Open($path,$false,$true)
   $doc.Repaginate();$pages=$doc.ComputeStatistics(2)
   $pdf=[IO.Path]::ChangeExtension($path,'.pdf')
   $doc.ExportAsFixedFormat($pdf,17)
   $records+=@{docx=$path;pdf=$pdf;pages=$pages;renderer='Microsoft Word 16 COM';readOnlySource=$true}
   Write-Output "$file : $pages pages"
  } finally {if($null -ne $doc){$doc.Close(0);[void][Runtime.InteropServices.Marshal]::ReleaseComObject($doc)}}
 }
} finally {
 if($null -ne $word){$word.NormalTemplate.Saved=$true;$word.Quit();[void][Runtime.InteropServices.Marshal]::ReleaseComObject($word)}
}
$records | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $temp 'word-render.json') -Encoding utf8
