$ErrorActionPreference = "Continue"
Set-Location "C:\Users\0\.buzz\listeningkit-object-videos"
$log = "renders\render-all.log"
"=== render all started $(Get-Date -Format o) ===" | Out-File $log -Encoding utf8
$slugs = @(
  "agency-calls","agency-campaigns","agency-career-applications","agency-careers",
  "agency-competitors","agency-contents","agency-conversations","agency-leads",
  "agency-listings","agency-messages","agency-offers","agency-opportunities",
  "agency-phones","agency-prospects","agency-scripts","agency-tasks"
)
foreach ($s in $slugs) {
  $out = "renders/$s.mp4"
  if ((Test-Path $out) -and ((Get-Item $out).Length -gt 1000000)) {
    "$s SKIP (exists)" | Tee-Object -Append $log
    continue
  }
  "--- $s render start $(Get-Date -Format HH:mm:ss)" | Tee-Object -Append $log
  & npx --yes hyperframes@0.8.112 render -c "compositions/$s.html" --output $out 2>&1 |
    Select-String -Pattern "Render complete|error|Error|failed|MB ·" |
    ForEach-Object { "$s $_" } | Tee-Object -Append $log
  "--- $s render end $(Get-Date -Format HH:mm:ss)" | Tee-Object -Append $log
}
"=== render all finished $(Get-Date -Format o) ===" | Tee-Object -Append $log