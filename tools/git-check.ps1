Set-Location 'C:\Users\DELL\Projects\gta hub'
$dirs = @('dist', 'gta-hub-cap', 'gta-hub-cap\www-offline', 'gta-hub-cap\node_modules', 'gta-hub-cap\android',
          'gta-hub-mobile', 'gta-hub-mobile\node_modules', 'gta-hub-mobile\android',
          'gta-hub-app', 'gta-hub-mobile@latest', 'tools', '.agents', '.git')
foreach ($d in $dirs) {
    if (Test-Path $d) {
        $s = (Get-ChildItem $d -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
        Write-Output ("{0,-34} {1,8} MB" -f $d, [math]::Round($s / 1MB, 1))
    }
}
Write-Output ""
Write-Output "=== untracked entries (collapsed) ==="
git status --porcelain=v1 | Where-Object { $_ -match '^\?\?' }
