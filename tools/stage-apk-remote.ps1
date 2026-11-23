$apk = 'C:\Users\DELL\Projects\gta hub\gta-hub-cap\android\app\build\outputs\apk\release\app-release.apk'
$dst = 'C:\Users\DELL\Projects\gta hub\dist\gta-hub-v1.0.1.apk'
Copy-Item $apk $dst -Force
$f = Get-Item $dst
Write-Output ("APK: " + $f.FullName)
Write-Output ("Size MB: " + [math]::Round($f.Length / 1MB, 2))
Write-Output ("Size bytes: " + $f.Length)
Write-Output ("SHA256: " + (Get-FileHash $dst -Algorithm SHA256).Hash)

Write-Output "--- signature ---"
& 'C:\Users\DELL\AppData\Local\Android\sdk\build-tools\36.0.0\apksigner.bat' verify --print-certs $dst 2>&1 | Select-Object -First 4

Write-Output "--- bundled shell present? ---"
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($dst)
$entries = $zip.Entries | Where-Object { $_.FullName -like 'assets/public/*' -or $_.FullName -like 'assets/capacitor.config.json' }
$entries | ForEach-Object { Write-Output ($_.FullName + "  " + $_.Length) }
$zip.Dispose()
