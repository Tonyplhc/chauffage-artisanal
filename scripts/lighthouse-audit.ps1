# Lance Lighthouse en local sur les 3 pages clés.
# Pré-requis : Chrome installé, npm.
# Usage : .\scripts\lighthouse-audit.ps1

$urls = @(
  "https://chauffage-artisanal.vercel.app/",
  "https://chauffage-artisanal.vercel.app/outils/economies-energie",
  "https://chauffage-artisanal.vercel.app/marques/vaillant"
)

$outDir = ".\lighthouse-reports"
if (-not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

foreach ($url in $urls) {
  $name = ($url -replace "https://chauffage-artisanal.vercel.app/", "" -replace "/", "-").TrimEnd("-")
  if (-not $name) { $name = "home" }

  Write-Host "Auditing $url ..." -ForegroundColor Cyan
  npx lighthouse $url `
    --preset=mobile `
    --output=json,html `
    --output-path="$outDir\$name" `
    --chrome-flags="--headless --no-sandbox" `
    --quiet
}

Write-Host ""
Write-Host "Rapports HTML et JSON dans $outDir" -ForegroundColor Green
Write-Host "Ouvre les .html dans Chrome pour voir les scores et opportunites." -ForegroundColor Green
