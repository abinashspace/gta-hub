$assets = 'C:\Users\DELL\Projects\gta hub\gta-hub-cap\www\assets'
Get-ChildItem $assets | ForEach-Object {
  $sz = (Get-ChildItem $_.FullName -Recurse -File | Measure-Object Length -Sum).Sum / 1MB
  [PSCustomObject]@{ Name = $_.Name; MB = [math]::Round($sz,1) }
} | Sort-Object MB -Descending | Format-Table -AutoSize

Write-Output "--- largest individual files ---"
Get-ChildItem $assets -Recurse -File | Sort-Object Length -Descending | Select-Object -First 15 |
  ForEach-Object { [PSCustomObject]@{ MB = [math]::Round($_.Length/1MB,2); Path = $_.FullName.Replace($assets,'') } } |
  Format-Table -AutoSize

Write-Output "--- file type totals ---"
Get-ChildItem $assets -Recurse -File | Group-Object Extension | ForEach-Object {
  [PSCustomObject]@{ Ext = $_.Name; Count = $_.Count; MB = [math]::Round((($_.Group | Measure-Object Length -Sum).Sum)/1MB,1) }
} | Sort-Object MB -Descending | Format-Table -AutoSize
