Place your app icon source (1024x1024 PNG, RGBA, no rounded corners — Tauri adds them) at:

  hrms-react/src-tauri/icons/app-icon.png

Then from hrms-react/ run:

  npx @tauri-apps/cli icon src-tauri/icons/app-icon.png

This generates all required sizes automatically:
  32x32.png, 128x128.png, 128x128@2x.png, icon.icns, icon.ico
