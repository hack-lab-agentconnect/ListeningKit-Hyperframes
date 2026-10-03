# Batch-render every composition.
#
# Paths are resolved from THIS file, not from the CWD. The previous version
# hard-coded `C:\Users\0\.buzz\listeningkit-object-videos` — a directory that no
# longer exists — so running it from the current repo would have rendered into
# nothing and the log would have looked like it worked.
#
# Renders land in renders/ at the repo root, which is gitignored: this repo ships
# the compositions, not the video.

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Resolve-Path (Join-Path $Root ".."))

# Read the pinned CLI version from package.json rather than repeating it here. Two
# copies of a pin is two things to forget at upgrade time.
$pkg = Get-Content package.json -Raw | ConvertFrom-Json
$cli = [regex]::Match($pkg.scripts.render, 'hyperframes@([\d.]+)').Groups[1].Value
if (-not $cli) { throw "could not find the pinned hyperframes version in package.json scripts.render" }

$log = "renders\render-all.log"
New-Item -ItemType Directory -Force -Path "renders" | Out-Null
"=== render all started $(Get-Date -Format o)  cli=$cli ===" | Out-File $log -Encoding utf8

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
  & npx --yes "hyperframes@$cli" render -c "compositions/$s.html" --output $out 2>&1 |
    Select-String -Pattern "Render complete|error|Error|failed|MB " |
    ForEach-Object { "$s $_" } | Tee-Object -Append $log
  "--- $s render end $(Get-Date -Format HH:mm:ss)" | Tee-Object -Append $log
}
"=== render all finished $(Get-Date -Format o) ===" | Tee-Object -Append $log