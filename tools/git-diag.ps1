Set-Location 'C:\Users\DELL\Projects\gta hub'
Write-Output "=== HEAD ==="
git rev-parse HEAD
Write-Output "=== REFLOG ==="
git reflog -8
Write-Output "=== status breakdown ==="
git status --porcelain=v1 | ForEach-Object { $_.Substring(0,2) } | Group-Object | Select-Object Count, Name | Format-Table -AutoSize
Write-Output "=== staged sample (first 12) ==="
git diff --cached --name-only | Select-Object -First 12
Write-Output "=== staged total size MB ==="
$sum = 0
git diff --cached --name-only --diff-filter=AM | ForEach-Object { if (Test-Path $_) { $sum += (Get-Item $_ -Force).Length } }
Write-Output ([math]::Round($sum/1MB,2))
Write-Output "=== does HEAD already contain the mobile dir? ==="
git ls-tree --name-only HEAD
