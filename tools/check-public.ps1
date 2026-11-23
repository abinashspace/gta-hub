$p = 'C:\Users\DELL\Projects\gta hub\gta-hub-cap\android\app\src\main\assets\public'
Get-ChildItem $p | Select-Object Name
$sum = (Get-ChildItem $p -Recurse -File | Measure-Object Length -Sum).Sum
Write-Output ("public total MB: " + [math]::Round($sum / 1MB, 2))
Write-Output "--- capacitor config in assets ---"
Get-Content 'C:\Users\DELL\Projects\gta hub\gta-hub-cap\android\app\src\main\assets\capacitor.config.json'
