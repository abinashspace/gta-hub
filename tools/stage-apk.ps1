New-Item -ItemType Directory -Path 'C:\Users\DELL\Projects\gta hub\dist' -Force | Out-Null
$src = 'C:\Users\DELL\Projects\gta hub\gta-hub-cap\android\app\build\outputs\apk\release\app-release.apk'
$dst = 'C:\Users\DELL\Projects\gta hub\dist\gta-hub-v1.0.0.apk'
Copy-Item $src $dst -Force
$f = Get-Item $dst
Write-Output ("File: " + $f.FullName)
Write-Output ("Size MB: " + [math]::Round($f.Length/1MB,1))
$h = (Get-FileHash $dst -Algorithm SHA256).Hash
Write-Output ("SHA256: " + $h)
