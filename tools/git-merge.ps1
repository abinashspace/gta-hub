Set-Location 'C:\Users\DELL\Projects\gta hub'
$env:GIT_EDITOR = 'true'

Write-Output "=== aborting rebase ==="
git rebase --abort 2>&1 | Select-Object -Last 5
Write-Output ("HEAD: " + (git rev-parse --short HEAD))
Write-Output ("subject: " + (git log --oneline -1))

Write-Output "=== tree restored? (expect our placeholder svg) ==="
Get-Content 'docs/assets/img/cheat/gta-2/10x-multiplier.svg' -TotalCount 3

Write-Output "=== dirty entries before merge ==="
(git status --porcelain=v1 | Measure-Object).Count

Write-Output "=== merge origin/main, preferring upstream on conflicting art ==="
git merge -X theirs origin/main -m "Merge remote-tracking branch 'origin/main' into main" 2>&1 | Select-Object -Last 12

Write-Output ("HEAD: " + (git rev-parse --short HEAD))
git log --oneline -3
Write-Output "=== cheat svg after merge (expect SEGARULZ from upstream) ==="
Get-Content 'docs/assets/img/cheat/gta-2/10x-multiplier.svg' -TotalCount 3

Write-Output "=== dirty entries after merge ==="
(git status --porcelain=v1 | Measure-Object).Count
