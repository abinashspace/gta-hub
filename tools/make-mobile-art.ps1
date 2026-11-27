# Generates optimized cover + hero art for the Expo mobile app from the site's images.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$srcRoot = Join-Path $root 'assets\img'
$outRoot = Join-Path $root 'gta-hub-mobile\assets\art'
New-Item -ItemType Directory -Force (Join-Path $outRoot 'cover') | Out-Null
New-Item -ItemType Directory -Force (Join-Path $outRoot 'hero') | Out-Null

$games = Get-ChildItem (Join-Path $root 'docs\data\games') -Filter *.json

function Save-Crop {
  param($sourcePath, $destPath, [int]$w, [int]$h, [int]$quality)
  $img = [System.Drawing.Image]::FromFile($sourcePath)
  try {
    $scale = [Math]::Max($w / $img.Width, $h / $img.Height)
    $sw = [int]($w / $scale)
    $sh = [int]($h / $scale)
    $sx = [int](($img.Width - $sw) / 2)
    $sy = [int](($img.Height - $sh) * 0.25)   # bias toward the top for cover art
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $w, $h), (New-Object System.Drawing.Rectangle $sx, $sy, $sw, $sh), [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $ep = New-Object System.Drawing.Imaging.EncoderParameters 1
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]$quality)
    $bmp.Save($destPath, $enc, $ep)
    $bmp.Dispose()
  } finally { $img.Dispose() }
}

foreach ($file in $games) {
  $j = Get-Content $file.FullName -Raw | ConvertFrom-Json
  $slug = $j.meta.slug
  $cover = Join-Path $srcRoot ($j.meta.images.cover -replace '^assets/img/', '')
  $banner = Join-Path $srcRoot ($j.meta.images.banner -replace '^assets/img/', '')
  if ((Test-Path $cover) -and $cover -notmatch '\.svg$') {
    Save-Crop $cover (Join-Path $outRoot "cover\$slug.jpg") 480 640 82
  }
  if ((Test-Path $banner) -and $banner -notmatch '\.svg$') {
    Save-Crop $banner (Join-Path $outRoot "hero\$slug.jpg") 1100 680 76
  } else {
    Save-Crop $cover (Join-Path $outRoot "hero\$slug.jpg") 1100 680 76
  }
  Write-Host "art: $slug"
}
Write-Host "done"
