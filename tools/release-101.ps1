$apk = 'C:\Users\DELL\Projects\gta hub\dist\gta-hub-v1.0.1.apk'
$notes = 'C:\Users\DELL\Projects\gta hub\dist\RELEASE_NOTES_v1.0.1.md'
gh release create v1.0.1 $apk --title "GTA Hub v1.0.1 - Lightweight APK (3 MB, loads from live site)" --notes-file $notes --target main
