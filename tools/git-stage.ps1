Set-Location 'C:\Users\DELL\Projects\gta hub'
git add -A
Write-Output "=== staged count ==="
$staged = git diff --cached --name-only
Write-Output $staged.Count

Write-Output "=== any file > 5 MB staged? ==="
$big = git diff --cached --name-only --diff-filter=AM | ForEach-Object {
    if (Test-Path $_) {
        $fi = Get-Item $_ -Force
        if ($fi.Length -gt 5MB) { Write-Output ("{0,8} MB  {1}" -f [math]::Round($fi.Length/1MB,2), $_) }
    }
}
if (-not $big) { Write-Output "none" }

Write-Output "=== staged total size (MB) ==="
$sum = 0
git diff --cached --name-only --diff-filter=AM | ForEach-Object { if (Test-Path $_) { $sum += (Get-Item $_ -Force).Length } }
Write-Output ([math]::Round($sum / 1MB, 2))

Write-Output "=== ignored check: are these untracked still? ==="
git status --porcelain=v1 | Where-Object { $_ -match '^\?\?' }
