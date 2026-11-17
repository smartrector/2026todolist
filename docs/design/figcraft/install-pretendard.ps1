$ErrorActionPreference = 'Stop'
$assetRoot = Join-Path $PSScriptRoot 'hifi/fonts'
New-Item -ItemType Directory -Path $assetRoot -Force | Out-Null
$userFontRoot = Join-Path $env:LOCALAPPDATA 'Microsoft/Windows/Fonts'
New-Item -ItemType Directory -Path $userFontRoot -Force | Out-Null
$fontRegistry = 'HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Fonts'
New-Item -Path $fontRegistry -Force | Out-Null
foreach ($weight in @('Regular','Medium','SemiBold','Bold')) {
  $fontName = "Pretendard-$weight.otf"
  $downloadPath = Join-Path $assetRoot $fontName
  Invoke-WebRequest -Uri "https://raw.githubusercontent.com/orioncactus/pretendard/main/packages/pretendard/dist/public/static/$fontName" -OutFile $downloadPath -UseBasicParsing
  if ((Get-Item -LiteralPath $downloadPath).Length -lt 100000) { throw "Invalid font file: $fontName" }
  $installedPath = Join-Path $userFontRoot $fontName
  if (-not (Test-Path -LiteralPath $installedPath)) { Copy-Item -LiteralPath $downloadPath -Destination $installedPath }
  New-ItemProperty -Path $fontRegistry -Name "Pretendard $weight (OpenType)" -Value $installedPath -PropertyType String -Force | Out-Null
}
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/orioncactus/pretendard/main/LICENSE' -OutFile (Join-Path $assetRoot 'LICENSE.txt') -UseBasicParsing
Get-ChildItem -LiteralPath $assetRoot -Filter '*.otf' | Get-FileHash -Algorithm SHA256 | Select-Object Hash,Path
