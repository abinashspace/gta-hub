$img = 'C:\Users\DELL\Projects\gta hub\gta-hub-cap\www\assets\img'
Write-Output "=== assets/img subfolders ==="
Get-ChildItem $img | ForEach-Object {
  if ($_.PSIsContainer) {
    $files = Get-ChildItem $_.FullName -Recurse -File
    $sz = ($files | Measure-Object Length -Sum).Sum / 1MB
    [PSCustomObject]@{ Folder = $_.Name; Files = $files.Count; MB = [math]::Round($sz,1) }
  }
} | Sort-Object MB -Descending | Format-Table -AutoSize

Write-Output "=== biggest PNG files ==="
Get-ChildItem $img -Recurse -File -Filter *.png |
  Sort-Object Length -Descending | Select-Object -First 12 |
  ForEach-Object { [PSCustomObject]@{ MB=[math]::Round($_.Length/1MB,2); Path=$_.FullName.Replace($img,'') } } |
  Format-Table -AutoSize

Write-Output "=== count of huge PNGs by size bucket ==="
$pngs = Get-ChildItem $img -Recurse -File -Filter *.png
[PSCustomObject]@{ Bucket='>1MB';      Count=($pngs | Where-Object {$_.Length -gt 1MB}).Count } | Format-Table -AutoSize
[PSCustomObject]@{ Bucket='0.5-1MB';   Count=($pngs | Where-Object {$_.Length -gt 0.5MB -and $_.Length -le 1MB}).Count } | Format-Table -AutoSize
[PSCustomObject]@{ Bucket='<0.5MB';    Count=($pngs | Where-Object {$_.Length -le 0.5MB}).Count } | Format-Table -AutoSize
