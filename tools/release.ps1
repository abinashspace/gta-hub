$apk = 'C:\Users\DELL\Projects\gta hub\dist\gta-hub-v1.0.0.apk'
$notes = 'C:\Users\DELL\Projects\gta hub\dist\RELEASE_NOTES.md'
gh release create v1.0.0 $apk --title "GTA Hub v1.0.0 - Android APK" --notes-file $notes --target main
