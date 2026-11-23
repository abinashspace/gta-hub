Set-Location 'C:\Users\DELL\Projects\gta hub'
Write-Output "=== .agents top level ==="
Get-ChildItem '.agents' -Force | Select-Object Name, Length | Format-Table -AutoSize
Write-Output "=== .agents biggest files ==="
Get-ChildItem '.agents' -Recurse -File -Force | Sort-Object Length -Descending | Select-Object -First 8 |
  ForEach-Object { Write-Output ("{0,8} KB  {1}" -f [math]::Round($_.Length/1KB,0), $_.FullName.Replace((Get-Location).Path,'')) }

Write-Output "=== capacitor android excluding build dirs ==="
$files = Get-ChildItem 'gta-hub-cap\android' -Recurse -File -Force | Where-Object { $_.FullName -notmatch '\\build\\' }
$s = ($files | Measure-Object Length -Sum).Sum
Write-Output ("files: " + $files.Count + "  size MB: " + [math]::Round($s/1MB,2))

Write-Output "=== gta-hub-cap top-level (excluding node_modules/www-offline/android) ==="
Get-ChildItem 'gta-hub-cap' -Force | Where-Object { $_.Name -notin @('node_modules','www-offline','android') } | Select-Object Name, Length | Format-Table -AutoSize

Write-Output "=== gta-hub-mobile tracked-worthy size ==="
$m = Get-ChildItem 'gta-hub-mobile' -Recurse -File -Force | Where-Object { $_.FullName -notmatch '\\node_modules\\|\\.expo\\|\\android\\build\\' }
Write-Output ("files: " + $m.Count + "  size MB: " + [math]::Round((($m | Measure-Object Length -Sum).Sum)/1MB,2))

Write-Output "=== gta-hub-app / gta-hub-mobile@latest contents ==="
Get-ChildItem 'gta-hub-app' -Force -ErrorAction SilentlyContinue | Select-Object Name | Format-Table -AutoSize
Get-ChildItem 'gta-hub-mobile@latest' -Force -ErrorAction SilentlyContinue | Select-Object Name | Format-Table -AutoSize
