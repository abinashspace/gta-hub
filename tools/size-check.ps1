$www = 'C:\Users\DELL\Projects\gta hub\gta-hub-cap\www'
$total = (Get-ChildItem $www -Recurse -File | Measure-Object Length -Sum).Sum / 1MB
Write-Output ("www total: " + [math]::Round($total,1) + " MB")
Get-ChildItem $www | ForEach-Object {
  if ($_.PSIsContainer) {
    $sz = (Get-ChildItem $_.FullName -Recurse -File | Measure-Object Length -Sum).Sum / 1MB
    [PSCustomObject]@{ Name = $_.Name; MB = [math]::Round($sz,1) }
  } else {
    [PSCustomObject]@{ Name = $_.Name; MB = [math]::Round($_.Length / 1MB, 2) }
  }
} | Sort-Object MB -Descending | Select-Object -First 12 | Format-Table -AutoSize
