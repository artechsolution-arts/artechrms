# Cross-Platform Implementation Guide
## AR Peopliz HRMS → Android · iOS · Windows · macOS

> **Strategy:** Keep the existing React/Vite/Tailwind app 100% as-is.
> - **Capacitor** wraps it into native Android & iOS apps
> - **Tauri** wraps it into native Windows & macOS apps
> - **Backend:** FastAPI (Python) stays the same — all platforms call the same API

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Project Structure](#3-project-structure)
4. [Capacitor Setup (Android + iOS)](#4-capacitor-setup-android--ios)
5. [Android Setup & Build](#5-android-setup--build)
6. [iOS Setup & Build](#6-ios-setup--build)
7. [Tauri Setup (Windows + macOS)](#7-tauri-setup-windows--macos)
8. [Windows Build](#8-windows-build)
9. [macOS Build](#9-macos-build)
10. [Vite Config for All Platforms](#10-vite-config-for-all-platforms)
11. [Mobile CSS — Safe Areas & Native Feel](#11-mobile-css--safe-areas--native-feel)
12. [Platform Detection in React](#12-platform-detection-in-react)
13. [Native Plugins (Camera, Notifications, Storage)](#13-native-plugins-camera-notifications-storage)
14. [API / Network Configuration per Platform](#14-api--network-configuration-per-platform)
15. [Desktop Enhancements (Tauri)](#15-desktop-enhancements-tauri)
16. [Build Commands Reference](#16-build-commands-reference)
17. [Environment Variables](#17-environment-variables)
18. [Signing & Distribution](#18-signing--distribution)
19. [Common Issues & Fixes](#19-common-issues--fixes)
20. [CI/CD Pipeline](#20-cicd-pipeline)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    React + Vite + Tailwind                       │
│                    (hrms-react/src/**)                           │
│                 Same codebase for ALL platforms                  │
└──────────────┬──────────────────────────┬───────────────────────┘
               │                          │
    ┌──────────▼──────────┐   ┌───────────▼──────────┐
    │     CAPACITOR        │   │        TAURI          │
    │  (mobile wrapper)    │   │  (desktop wrapper)    │
    └────────┬─────────────┘   └────────┬──────────────┘
             │                          │
    ┌────────▼────────┐       ┌─────────▼──────────┐
    │  Android  │ iOS │       │  Windows │  macOS   │
    │  (Java/  │(Swift│       │  (.exe)  │  (.app)  │
    │  Kotlin) │  )   │       │          │          │
    └──────────┴──────┘       └──────────┴──────────┘
                    ↕  (HTTP/HTTPS)  ↕
             ┌──────────────────────────┐
             │   FastAPI Backend (Python) │
             │   (Same for all clients)  │
             └──────────────────────────┘
```

---

## 2. Prerequisites

### 2.1 All Platforms (Required)

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ LTS | https://nodejs.org |
| npm | 10+ | Comes with Node |
| Git | Latest | https://git-scm.com |

```bash
node --version   # must be 20+
npm --version    # must be 10+
```

### 2.2 For Android (Capacitor)

| Tool | Notes |
|------|-------|
| Android Studio | Latest — includes JDK 17 |
| Android SDK | API level 23 (Android 6.0) minimum, 34 (Android 14) target |
| JAVA_HOME | Set to JDK 17 from Android Studio |

**Set env vars (Windows):**
```
JAVA_HOME = C:\Program Files\Android\Android Studio\jbr
ANDROID_HOME = C:\Users\<you>\AppData\Local\Android\Sdk
```
Add to PATH: `%ANDROID_HOME%\tools`, `%ANDROID_HOME%\platform-tools`

**Set env vars (macOS/Linux):**
```bash
export JAVA_HOME=/Applications/Android\ Studio.app/Contents/jbr/Contents/Home
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### 2.3 For iOS (Capacitor) — macOS Only

| Tool | Notes |
|------|-------|
| macOS 13+ | Required for latest Xcode |
| Xcode 15+ | From App Store |
| CocoaPods | `sudo gem install cocoapods` |
| Apple Developer account | For device testing & App Store |

```bash
xcode-select --install
sudo gem install cocoapods
pod --version  # should print 1.14+
```

### 2.4 For Desktop (Tauri)

| Tool | Notes |
|------|-------|
| Rust | https://rustup.rs |
| Cargo | Comes with Rust |

**Install Rust:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# or on Windows: download rustup-init.exe from rustup.rs
rustup update
rustup target add x86_64-pc-windows-msvc   # Windows
rustup target add x86_64-apple-darwin       # macOS Intel
rustup target add aarch64-apple-darwin      # macOS Apple Silicon
```

**Windows additional:** Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) with "Desktop development with C++" workload + Windows 10/11 SDK.

**Linux additional (for CI):**
```bash
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

---

## 3. Project Structure

After setup, your repo will look like this:

```
hrms-react/
├── src/                    ← unchanged React source
├── public/                 ← static assets
├── dist/                   ← built web output (don't edit)
├── index.html
├── vite.config.js          ← modified (see Section 10)
├── package.json
│
├── android/                ← generated by Capacitor (don't edit manually)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   └── assets/public/  ← your built web app lives here
│   │   └── build.gradle
│   └── capacitor.settings.gradle
│
├── ios/                    ← generated by Capacitor (macOS only)
│   └── App/
│       ├── App/
│       │   ├── Info.plist
│       │   └── public/         ← your built web app lives here
│       └── Podfile
│
└── src-tauri/              ← Tauri desktop shell
    ├── src/
    │   ├── main.rs         ← entry point (boilerplate)
    │   └── lib.rs          ← your custom Tauri commands (if any)
    ├── icons/              ← app icons for Windows/macOS
    ├── Cargo.toml
    └── tauri.conf.json     ← Tauri configuration
```

---

## 4. Capacitor Setup (Android + iOS)

### 4.1 Install Capacitor

```bash
cd hrms-react

# Install Capacitor core + CLI
npm install @capacitor/core
npm install -D @capacitor/cli

# Initialize Capacitor
npx cap init "AR Peopliz" "com.artech.hrms" --web-dir dist
```

> **App ID** `com.artech.hrms` — change to match your company domain.
> Must be unique on both Play Store and App Store.

### 4.2 Install Platform Packages

```bash
npm install @capacitor/android
npm install @capacitor/ios        # only if building on macOS
```

### 4.3 capacitor.config.ts (project root)

Create `hrms-react/capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.artech.hrms',
  appName: 'AR Peopliz',
  webDir: 'dist',

  server: {
    // DEVELOPMENT: point to your local dev server (hot reload)
    // Comment out for production builds
    // url: 'http://192.168.1.100:5173',
    // cleartext: true,

    // PRODUCTION: app loads from bundled files
    androidScheme: 'https',
  },

  android: {
    backgroundColor: '#EEF3FC',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,  // set true for dev
    loggingBehavior: 'none',
  },

  ios: {
    backgroundColor: '#EEF3FC',
    contentInset: 'automatic',
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#EEF3FC',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#1A6AB4',
    },
    StatusBar: {
      style: 'Default',
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
```

### 4.4 Add Platforms

```bash
# Build web app first
cd hrms-react
npm run build

# Add platforms
npx cap add android
npx cap add ios          # macOS only
```

### 4.5 Sync After Every Build

**Every time you change React code, run:**

```bash
npm run build && npx cap sync
```

This copies your `dist/` into the native project and updates plugins.

---

## 5. Android Setup & Build

### 5.1 Install Useful Capacitor Plugins

```bash
npm install @capacitor/splash-screen @capacitor/status-bar
npm install @capacitor/keyboard @capacitor/app
npm install @capacitor/push-notifications
npm install @capacitor/camera @capacitor/filesystem
npm install @capacitor/preferences          # replaces localStorage for native
npm install @capacitor/network              # detect online/offline
npm install @capacitor/haptics             # vibration feedback
```

Then sync:
```bash
npm run build && npx cap sync android
```

### 5.2 Open in Android Studio

```bash
npx cap open android
```

This opens Android Studio. First time takes 5–10 min to download Gradle.

### 5.3 Android Manifest Permissions

Edit `android/app/src/main/AndroidManifest.xml` — add these inside `<manifest>`:

```xml
<!-- Internet (required) -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Camera (for profile photo) -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />

<!-- Storage (for file downloads) -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

<!-- Push Notifications -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Biometric (optional) -->
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
```

### 5.4 Android Styles (Status Bar)

Edit `android/app/src/main/res/values/styles.xml`:

```xml
<resources>
  <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
    <item name="colorPrimary">#1A6AB4</item>
    <item name="colorPrimaryDark">#0D1F4E</item>
    <item name="colorAccent">#3DC7B3</item>
    <item name="android:statusBarColor">#ffffff</item>
    <item name="android:windowLightStatusBar">true</item>
    <item name="android:navigationBarColor">#ffffff</item>
    <item name="android:windowLightNavigationBar">true</item>
  </style>

  <!-- Splash screen theme -->
  <style name="AppTheme.Launcher" parent="AppTheme">
    <item name="android:windowBackground">@drawable/splash</item>
  </style>
</resources>
```

### 5.5 Splash Screen (Android)

Create `android/app/src/main/res/drawable/splash.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splash_background" />
  <item android:gravity="center">
    <bitmap android:src="@drawable/ic_launcher_foreground" android:gravity="center" />
  </item>
</layer-list>
```

Create `android/app/src/main/res/values/colors.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
  <color name="splash_background">#EEF3FC</color>
  <color name="ic_launcher_background">#1A6AB4</color>
</resources>
```

### 5.6 App Icon (Android)

Place your icon files in:
```
android/app/src/main/res/
  mipmap-mdpi/     ic_launcher.png      (48×48)
  mipmap-hdpi/     ic_launcher.png      (72×72)
  mipmap-xhdpi/    ic_launcher.png      (96×96)
  mipmap-xxhdpi/   ic_launcher.png      (144×144)
  mipmap-xxxhdpi/  ic_launcher.png      (192×192)
```

Use [Android Asset Studio](https://romannurik.github.io/AndroidAssets/) to generate.

### 5.7 Build APK / AAB

**Debug APK (for testing):**

```bash
cd android
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

**Release AAB (for Play Store):**

```bash
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

**Sign the release build** (see Section 18.1).

### 5.8 Run on Device / Emulator

```bash
# From project root
npx cap run android                    # picks connected device or emulator
npx cap run android --target <device>  # specific device
```

Or press ▶ Run in Android Studio.

---

## 6. iOS Setup & Build

> **Requires macOS + Xcode 15+**

### 6.1 After `npx cap add ios`

```bash
cd hrms-react
npx cap open ios    # opens Xcode
```

### 6.2 Install CocoaPods Dependencies

```bash
cd ios/App
pod install
cd ../..
```

Re-run after every `npx cap sync`:
```bash
npx cap sync ios
cd ios/App && pod install && cd ../..
```

### 6.3 Info.plist Permissions

Edit `ios/App/App/Info.plist` — add inside `<dict>`:

```xml
<!-- Camera -->
<key>NSCameraUsageDescription</key>
<string>AR Peopliz needs camera access to upload your profile photo.</string>

<!-- Photo library -->
<key>NSPhotoLibraryUsageDescription</key>
<string>AR Peopliz needs photo library access to select your profile photo.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>AR Peopliz needs to save files to your photo library.</string>

<!-- Face ID (biometric auth) -->
<key>NSFaceIDUsageDescription</key>
<string>AR Peopliz uses Face ID to securely authenticate you.</string>

<!-- Push Notifications — handled automatically by Capacitor -->

<!-- Network access -->
<key>NSAppTransportSecurity</key>
<dict>
  <!-- Remove this in production — only for dev over HTTP -->
  <!-- <key>NSAllowsArbitraryLoads</key><true/> -->
  <key>NSAllowsLocalNetworking</key>
  <true/>
</dict>

<!-- Background modes -->
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
  <string>fetch</string>
</array>

<!-- Status bar -->
<key>UIStatusBarStyle</key>
<string>UIStatusBarStyleDarkContent</string>
<key>UIViewControllerBasedStatusBarAppearance</key>
<false/>

<!-- Orientation (portrait + landscape) -->
<key>UISupportedInterfaceOrientations</key>
<array>
  <string>UIInterfaceOrientationPortrait</string>
  <string>UIInterfaceOrientationLandscapeLeft</string>
  <string>UIInterfaceOrientationLandscapeRight</string>
</array>
```

### 6.4 App Icon (iOS)

Generate all icon sizes using [makeappicon.com](https://makeappicon.com) or Xcode:
- Place in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Required sizes: 20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024 px

### 6.5 Launch Screen (Splash)

Edit `ios/App/App/Assets.xcassets/Splash.imageset/` or use `LaunchScreen.storyboard` in Xcode:

```xml
<!-- ios/App/App/Base.lproj/LaunchScreen.storyboard -->
<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="21701" targetRuntime="AppleCocoa" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="01J-lp-oVM">
  <scenes>
    <scene sceneID="EHf-IW-A2E">
      <objects>
        <viewController id="01J-lp-oVM" sceneMemberID="viewController">
          <view key="view" contentMode="scaleToFill" id="Ze5-6b-2t3">
            <rect key="frame" x="0.0" y="0.0" width="393" height="852" />
            <subviews>
              <!-- Background color -->
              <view contentMode="scaleToFill" translatesAutoresizingMaskIntoConstraints="NO" id="bg">
                <rect key="frame" x="0.0" y="0.0" width="393" height="852" />
                <color key="backgroundColor" red="0.933" green="0.953" blue="0.988" alpha="1"/>
              </view>
              <!-- Logo image -->
              <imageView image="Splash" contentMode="scaleAspectFit" translatesAutoresizingMaskIntoConstraints="NO" id="logo">
                <rect key="frame" x="146.5" y="376" width="100" height="100"/>
              </imageView>
            </subviews>
            <color key="backgroundColor" red="0.933" green="0.953" blue="0.988" alpha="1"/>
          </view>
        </viewController>
      </objects>
    </scene>
  </scenes>
</document>
```

### 6.6 Build & Run (iOS)

```bash
# Run on simulator
npx cap run ios

# Run on connected iPhone/iPad
npx cap run ios --target <device-udid>
```

Or in Xcode: Select target device → Product → Run (⌘R)

**Archive for App Store (Xcode):**
Product → Archive → Distribute App → App Store Connect

---

## 7. Tauri Setup (Windows + macOS)

### 7.1 Install Tauri CLI

```bash
cd hrms-react
npm install -D @tauri-apps/cli@^2
npm install @tauri-apps/api@^2
```

### 7.2 Initialize Tauri

```bash
npx tauri init
```

Answer the prompts:
```
App name: AR Peopliz
Window title: AR Peopliz HRMS
Web assets (dist dir): ../dist
Dev server URL: http://localhost:5173
Frontend dev command: npm run dev
Frontend build command: npm run build
```

This creates `src-tauri/` directory.

### 7.3 tauri.conf.json

Edit `src-tauri/tauri.conf.json`:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "AR Peopliz",
  "version": "1.0.0",
  "identifier": "com.artech.hrms",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      {
        "title": "AR Peopliz HRMS",
        "width": 1280,
        "height": 800,
        "minWidth": 900,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false,
        "center": true,
        "decorations": true,
        "transparent": false,
        "backgroundColor": "#EEF3FC"
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

### 7.4 Tauri Capabilities (permissions)

Create `src-tauri/capabilities/default.json`:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capabilities for AR Peopliz",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-start-dragging",
    "core:window:allow-set-title",
    "core:window:allow-set-focus",
    "shell:allow-open",
    "dialog:allow-open",
    "dialog:allow-save",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    "fs:allow-app-write-recursive",
    "fs:allow-app-read-recursive",
    "notification:default",
    "notification:allow-request-permission"
  ]
}
```

### 7.5 App Icons (Tauri)

Place icon files in `src-tauri/icons/`:

```
icons/
  32x32.png       (32×32)
  128x128.png     (128×128)
  128x128@2x.png  (256×256)
  icon.icns       (macOS — multi-resolution .icns)
  icon.ico        (Windows — multi-resolution .ico)
  icon.png        (512×512 — source)
```

Generate from a single 1024×1024 PNG:
```bash
npx tauri icon path/to/logo-1024.png
```
This auto-generates all required sizes.

### 7.6 src-tauri/src/lib.rs

```rust
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running AR Peopliz");
}
```

### 7.7 Cargo.toml

```toml
[package]
name = "ar-peopliz"
version = "1.0.0"
description = "AR Peopliz HRMS"
authors = ["AR Tech Solutions"]
edition = "2021"

[lib]
name = "ar_peopliz_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-shell = "2"
tauri-plugin-dialog = "2"
tauri-plugin-notification = "2"
tauri-plugin-fs = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"

[profile.release]
panic = "abort"
codegen-units = 1
lto = true
opt-level = "s"
strip = true
```

Install Tauri Rust plugins:
```bash
cargo add tauri-plugin-shell tauri-plugin-dialog tauri-plugin-notification tauri-plugin-fs
```

---

## 8. Windows Build

### 8.1 Dev Mode (Windows)

```bash
cd hrms-react
npx tauri dev
```

Opens a native window with your React app + hot reload.

### 8.2 Build Installer (Windows)

```bash
npx tauri build
```

Output:
```
src-tauri/target/release/bundle/
  msi/    AR Peopliz_1.0.0_x64_en-US.msi     ← Windows installer
  nsis/   AR Peopliz_1.0.0_x64-setup.exe     ← NSIS installer
```

Both installers work. The `.exe` NSIS installer is smaller and more user-friendly.

### 8.3 Windows Installer Customization

In `tauri.conf.json`, add under `bundle`:

```json
"windows": {
  "wix": {
    "language": "en-US",
    "template": null
  },
  "nsis": {
    "languages": ["English"],
    "displayLanguageSelector": false,
    "installMode": "currentUser"
  }
}
```

---

## 9. macOS Build

### 9.1 Dev Mode (macOS)

```bash
cd hrms-react
npx tauri dev
```

### 9.2 Build .app / .dmg (macOS)

```bash
npx tauri build
```

Output:
```
src-tauri/target/release/bundle/
  dmg/    AR Peopliz_1.0.0_x64.dmg          ← macOS disk image
  macos/  AR Peopliz.app                     ← macOS app bundle
```

### 9.3 macOS Entitlements

Create `src-tauri/entitlements.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.network.client</key>
  <true/>
  <key>com.apple.security.network.server</key>
  <false/>
  <key>com.apple.security.files.user-selected.read-write</key>
  <true/>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
</dict>
</plist>
```

Reference in `tauri.conf.json`:
```json
"macOS": {
  "entitlements": "./entitlements.plist",
  "exceptionDomain": "",
  "signingIdentity": null,
  "providerShortName": null
}
```

### 9.4 Universal Binary (Intel + Apple Silicon)

```bash
# Install both targets
rustup target add x86_64-apple-darwin aarch64-apple-darwin

# Build universal binary
npx tauri build --target universal-apple-darwin
```

---

## 10. Vite Config for All Platforms

Update `hrms-react/vite.config.js`:

```javascript
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  // Detect if building for Tauri desktop
  const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined

  return {
    plugins: [react()],

    // Tauri requires relative paths; Capacitor needs '/'
    base: isTauri ? './' : '/',

    build: {
      // Smaller chunks for faster mobile load
      target: isTauri ? ['es2021', 'chrome100', 'safari15'] : ['es2020'],
      minify: 'esbuild',
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor:   ['react', 'react-dom'],
            charts:   ['chart.js', 'react-chartjs-2'],
            lucide:   ['lucide-react'],
          },
        },
      },
    },

    server: {
      port: 5173,
      strictPort: true,
      host: '0.0.0.0',      // needed for Capacitor live reload on device
      // Proxy API calls to FastAPI in dev
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },

    // Required for Tauri IPC (inter-process communication)
    clearScreen: false,
    envPrefix: ['VITE_', 'TAURI_'],
  }
})
```

---

## 11. Mobile CSS — Safe Areas & Native Feel

Add these to `hrms-react/src/index.css`:

```css
/* ── Safe area insets (iPhone notch + home bar, Android gesture nav) ── */
:root {
  --safe-top:    env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left:   env(safe-area-inset-left, 0px);
  --safe-right:  env(safe-area-inset-right, 0px);
}

/* Bottom nav must clear the home bar */
.mobile-bottom-nav {
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}

/* Page content must clear top (status bar) + bottom nav */
.page-content-mobile {
  padding-top: calc(56px + env(safe-area-inset-top, 0px));
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
}

/* Remove iOS tap highlight */
* {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;   /* disable iOS long-press context menu on images */
}

/* Smooth scrolling, no rubber-band outside scroll containers */
html, body {
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
}

/* Disable text selection on UI (not form inputs) */
button, nav, aside, header {
  user-select: none;
  -webkit-user-select: none;
}

/* Scrollable areas: smooth momentum scroll */
.scroll-container {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}

/* Input font-size 16px minimum — prevents iOS auto-zoom on focus */
input, select, textarea {
  font-size: max(16px, 1rem);
}

/* Disable pull-to-refresh if not needed */
body {
  overscroll-behavior-y: none;
}

/* ── Capacitor keyboard avoidance ── */
/* When keyboard is open on iOS/Android, scroll content up */
.keyboard-open .page-content {
  padding-bottom: var(--keyboard-height, 0px);
}

/* ── Platform-specific visual tweaks ── */
@media (display-mode: standalone) {
  /* PWA / Capacitor native mode */
  .topbar { padding-top: env(safe-area-inset-top); }
}
```

### 11.1 Apply Safe Area in JSX

```jsx
// Bottom nav — always clears home bar
<nav style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
  className="fixed bottom-0 left-0 right-0 z-40 glass-mobile-nav">
  {/* ... */}
</nav>

// Page content
<main className="px-4"
  style={{
    paddingTop:    'calc(56px + env(safe-area-inset-top, 0px))',
    paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
  }}>
  {/* ... */}
</main>

// Slide-up panels — add safe area at the bottom
<div className="fixed bottom-0 ...">
  {/* content */}
  <div style={{ height: 'env(safe-area-inset-bottom, 16px)' }} />
</div>
```

---

## 12. Platform Detection in React

### 12.1 usePlatform hook

Create `hrms-react/src/hooks/usePlatform.js`:

```javascript
import { useState, useEffect } from 'react';

// Detect if running inside Capacitor (native app)
const isCapacitor = () =>
  typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();

// Detect if running inside Tauri (desktop app)
const isTauri = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export function usePlatform() {
  const [platform, setPlatform] = useState('web');
  const [os, setOs] = useState('unknown');

  useEffect(() => {
    if (isTauri()) {
      setPlatform('desktop');
      // Tauri: detect Windows vs macOS from user agent
      const ua = navigator.userAgent;
      if (ua.includes('Windows')) setOs('windows');
      else if (ua.includes('Mac'))  setOs('macos');
      else setOs('linux');
    } else if (isCapacitor()) {
      setPlatform('native');
      // Capacitor: use Capacitor.getPlatform()
      import('@capacitor/core').then(({ Capacitor }) => {
        setOs(Capacitor.getPlatform()); // 'android' or 'ios'
      });
    } else {
      setPlatform('web');
      const ua = navigator.userAgent;
      if (/Android/i.test(ua))          setOs('android');
      else if (/iPhone|iPad/i.test(ua)) setOs('ios');
      else                               setOs('desktop-browser');
    }
  }, []);

  return {
    platform,
    os,
    isNative:  platform === 'native',
    isDesktop: platform === 'desktop',
    isWeb:     platform === 'web',
    isIOS:     os === 'ios',
    isAndroid: os === 'android',
    isWindows: os === 'windows',
    isMacOS:   os === 'macos',
    isMobile:  os === 'android' || os === 'ios',
  };
}
```

### 12.2 Usage in Components

```jsx
import { usePlatform } from '../hooks/usePlatform';

function MyComponent() {
  const { isNative, isDesktop, isIOS, isAndroid, isMobile } = usePlatform();

  return (
    <div>
      {/* Show bottom nav only on native mobile */}
      {isNative && <MobileBottomNav />}

      {/* Show desktop sidebar only on desktop */}
      {(isDesktop || !isMobile) && <Sidebar />}

      {/* iOS-specific: no back button (they use swipe) */}
      {!isIOS && <BackButton />}

      {/* Android-specific: handle hardware back button */}
      {isAndroid && <AndroidBackHandler />}
    </div>
  );
}
```

### 12.3 Android Hardware Back Button

```jsx
import { useEffect } from 'react';
import { usePlatform } from '../hooks/usePlatform';

export function useAndroidBackButton(onBack) {
  const { isAndroid } = usePlatform();

  useEffect(() => {
    if (!isAndroid) return;

    let App;
    import('@capacitor/app').then(({ App: CapApp }) => {
      App = CapApp;
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp();
        } else {
          onBack?.() || window.history.back();
        }
      });
    });

    return () => { App?.removeAllListeners(); };
  }, [isAndroid, onBack]);
}
```

---

## 13. Native Plugins (Camera, Notifications, Storage)

### 13.1 Camera — Profile Photo Upload

```jsx
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { usePlatform } from '../hooks/usePlatform';

export function useCamera() {
  const { isNative } = usePlatform();

  const takePhoto = async () => {
    if (!isNative) {
      // Fallback: regular file input for web
      return null;
    }

    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,   // returns base64 data URL
      source: CameraSource.Prompt,            // ask user: Camera or Gallery
      quality: 80,
      width: 400,
      height: 400,
      correctOrientation: true,
    });

    return photo.dataUrl; // base64 image
  };

  return { takePhoto };
}

// In component:
function ProfilePhotoButton({ onPhoto }) {
  const { takePhoto } = useCamera();
  const { isNative } = usePlatform();

  if (isNative) {
    return (
      <button onClick={async () => {
        const dataUrl = await takePhoto();
        if (dataUrl) onPhoto(dataUrl);
      }}>
        Change Photo
      </button>
    );
  }

  // Web fallback
  return (
    <input type="file" accept="image/*"
      onChange={e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => onPhoto(reader.result);
        reader.readAsDataURL(file);
      }} />
  );
}
```

### 13.2 Push Notifications

```javascript
import { PushNotifications } from '@capacitor/push-notifications';

export async function registerPushNotifications(onNotification) {
  // Check permission
  let permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== 'granted') {
    console.warn('Push notification permission denied');
    return null;
  }

  // Register with Apple/Google
  await PushNotifications.register();

  // Get the device token (send this to your FastAPI backend)
  PushNotifications.addListener('registration', ({ value: token }) => {
    console.log('Push token:', token);
    // POST to your API: /api/push-tokens  { token, platform }
    sendTokenToBackend(token);
  });

  // Handle incoming notification
  PushNotifications.addListener('pushNotificationReceived', notification => {
    console.log('Notification received:', notification);
    onNotification?.(notification);
  });

  // Handle tap on notification
  PushNotifications.addListener('pushNotificationActionPerformed', action => {
    console.log('Notification tapped:', action);
    const route = action.notification.data?.route;
    if (route) window.location.hash = `#${route}`;
  });
}
```

**FastAPI endpoint to save push token:**

```python
# backend/routers/push.py
@router.post("/api/push-tokens")
async def save_push_token(data: dict, user=Depends(get_current_user), db=Depends(get_db)):
    token = data.get("token")
    platform = data.get("platform")  # 'android' or 'ios'
    # Save token linked to user in DB
    # Use Firebase Admin SDK to send pushes
    return {"status": "ok"}
```

### 13.3 Secure Storage (Preferences)

Replace `localStorage` with Capacitor Preferences on native (more secure):

```javascript
import { Preferences } from '@capacitor/preferences';
import { usePlatform } from '../hooks/usePlatform';

// Drop-in replacement for localStorage
export const storage = {
  async get(key) {
    if (isCapacitorNative()) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  },

  async set(key, value) {
    if (isCapacitorNative()) {
      await Preferences.set({ key, value: String(value) });
      return;
    }
    localStorage.setItem(key, value);
  },

  async remove(key) {
    if (isCapacitorNative()) {
      await Preferences.remove({ key });
      return;
    }
    localStorage.removeItem(key);
  },
};

function isCapacitorNative() {
  return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
}
```

### 13.4 Haptic Feedback

Add tactile feedback to buttons on mobile:

```javascript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export async function hapticLight() {
  try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
}
export async function hapticMedium() {
  try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
}
export async function hapticSuccess() {
  try { await Haptics.notification({ type: 'SUCCESS' }); } catch {}
}
export async function hapticError() {
  try { await Haptics.notification({ type: 'ERROR' }); } catch {}
}

// Usage:
<button onClick={async () => { await hapticLight(); doAction(); }}>
  Approve
</button>
```

### 13.5 Network Status

```javascript
import { Network } from '@capacitor/network';

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    Network.getStatus().then(s => setIsOnline(s.connected));

    const listener = Network.addListener('networkStatusChange', s => {
      setIsOnline(s.connected);
    });

    return () => { listener.then(l => l.remove()); };
  }, []);

  return { isOnline };
}

// In app root:
function OfflineBanner() {
  const { isOnline } = useNetwork();
  if (isOnline) return null;
  return (
    <div className="fixed top-14 left-0 right-0 z-50 bg-red-500 text-white
      text-xs text-center py-1.5 font-medium">
      No internet connection
    </div>
  );
}
```

### 13.6 Status Bar Control

```javascript
import { StatusBar, Style } from '@capacitor/status-bar';

// Call this in your app root
export async function configureStatusBar(isDark = false) {
  try {
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: isDark ? '#0f172a' : '#ffffff' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch {}
}
```

---

## 14. API / Network Configuration per Platform

### 14.1 API Base URL per Platform

Create `hrms-react/src/config.js`:

```javascript
import { usePlatform } from './hooks/usePlatform';

// Detect platform and return the right API base URL
export function getApiBaseUrl() {
  // Tauri desktop — communicates with local or remote FastAPI
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    return import.meta.env.VITE_API_URL || 'http://localhost:8000';
  }

  // Capacitor native — MUST use real IP/domain, not localhost
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
    // In production: your real API domain
    return import.meta.env.VITE_API_URL || 'https://api.arpeopliz.com';
    // In development: your machine's local IP (NOT localhost/127.0.0.1)
    // return 'http://192.168.1.100:8000';
  }

  // Web browser
  return import.meta.env.VITE_API_URL || '';  // empty = same origin
}
```

Update your `api.js` to use this:

```javascript
import { getApiBaseUrl } from './config';

const BASE = getApiBaseUrl();

export async function api(method, path, body) {
  const token = localStorage.getItem('artech_hrms_token');
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}
```

### 14.2 Environment Files

```bash
hrms-react/
  .env                    # shared defaults (committed)
  .env.development        # dev overrides (committed)
  .env.production         # production (committed, no secrets)
  .env.local              # local secrets (git-ignored)
```

`.env.development`:
```
VITE_API_URL=http://localhost:8000
VITE_APP_ENV=development
```

`.env.production`:
```
VITE_API_URL=https://api.arpeopliz.com
VITE_APP_ENV=production
```

`.env.local` (git-ignored — machine-specific):
```
VITE_API_URL=http://192.168.1.100:8000
```

### 14.3 FastAPI CORS for Native Apps

Update `backend/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

ALLOWED_ORIGINS = [
    "http://localhost:5173",     # Vite dev
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "capacitor://localhost",     # Capacitor iOS/Android
    "https://localhost",         # Capacitor androidScheme: 'https'
    "ionic://localhost",         # Ionic (if used)
    "tauri://localhost",         # Tauri desktop
    "https://tauri.localhost",
    "https://arpeopliz.com",     # production domain
    "https://api.arpeopliz.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 15. Desktop Enhancements (Tauri)

### 15.1 Custom Title Bar (Windows)

Remove native title bar and use your own:

In `tauri.conf.json`:
```json
"windows": [{
  "decorations": false,
  "transparent": false
}]
```

In React:
```jsx
import { getCurrentWindow } from '@tauri-apps/api/window';

function TitleBar() {
  const win = getCurrentWindow();

  return (
    <div className="h-8 flex items-center justify-between px-3 select-none"
      data-tauri-drag-region   /* makes the bar draggable */
      style={{ background: 'var(--accent)' }}>

      {/* App name */}
      <span className="text-xs font-semibold text-white">AR Peopliz HRMS</span>

      {/* Window controls */}
      <div className="flex items-center gap-1">
        <button onClick={() => win.minimize()}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/20 text-white text-xs">
          ─
        </button>
        <button onClick={() => win.toggleMaximize()}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/20 text-white text-xs">
          □
        </button>
        <button onClick={() => win.close()}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500 text-white text-xs">
          ×
        </button>
      </div>
    </div>
  );
}
```

### 15.2 Desktop-Only Features

```jsx
import { open } from '@tauri-apps/plugin-shell';
import { save, open as openDialog } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';

// Open external link
async function openLink(url) {
  if (isTauri()) {
    await open(url);
  } else {
    window.open(url, '_blank');
  }
}

// Save file dialog
async function saveReport(content, filename) {
  if (isTauri()) {
    const path = await save({
      defaultPath: filename,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    });
    if (path) await writeTextFile(path, content);
  } else {
    // Web: use download link
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content]));
    a.download = filename;
    a.click();
  }
}
```

### 15.3 System Tray (Windows/macOS)

In `src-tauri/src/lib.rs`:

```rust
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime,
};

fn setup_tray<R: Runtime>(app: &tauri::App<R>) -> tauri::Result<()> {
    let quit = MenuItem::with_id(app, "quit", "Quit AR Peopliz", true, None::<&str>)?;
    let show = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;

    TrayIconBuilder::new()
        .menu(&menu)
        .icon(app.default_window_icon().unwrap().clone())
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => app.exit(0),
            "show" => {
                if let Some(w) = app.get_webview_window("main") {
                    w.show().unwrap();
                    w.set_focus().unwrap();
                }
            }
            _ => {}
        })
        .build(app)?;
    Ok(())
}
```

---

## 16. Build Commands Reference

### 16.1 Development

```bash
# Web browser dev
npm run dev

# Android dev (live reload to device)
npm run build && npx cap sync android && npx cap run android

# iOS dev (live reload to simulator) — macOS only
npm run build && npx cap sync ios && npx cap run ios

# Desktop dev (Windows/macOS)
npx tauri dev
```

### 16.2 Production Builds

```bash
# ── Android (APK for direct install) ──
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release-unsigned.apk

# ── Android (AAB for Play Store) ──
cd android && ./gradlew bundleRelease
# → android/app/build/outputs/bundle/release/app-release.aab

# ── iOS (Archive for App Store) — macOS only ──
npm run build
npx cap sync ios
cd ios/App && pod install && cd ../..
npx cap open ios   # then Archive from Xcode

# ── Windows / macOS Desktop ──
npx tauri build
# → src-tauri/target/release/bundle/
```

### 16.3 package.json Scripts

Add to `hrms-react/package.json`:

```json
{
  "scripts": {
    "dev":             "vite",
    "build":           "vite build",
    "preview":         "vite preview",
    "tauri":           "tauri",
    "tauri:dev":       "tauri dev",
    "tauri:build":     "tauri build",
    "cap:sync":        "npm run build && npx cap sync",
    "cap:android":     "npm run cap:sync && npx cap run android",
    "cap:ios":         "npm run cap:sync && npx cap run ios",
    "build:android":   "npm run build && npx cap sync android && cd android && ./gradlew bundleRelease",
    "build:windows":   "npx tauri build --target x86_64-pc-windows-msvc",
    "build:macos":     "npx tauri build --target universal-apple-darwin",
    "build:all":       "npm run build:android && npm run build:windows"
  }
}
```

---

## 17. Environment Variables

### 17.1 All .env files needed

```
hrms-react/.env
hrms-react/.env.development
hrms-react/.env.production
hrms-react/.env.local          ← git-ignored
```

### 17.2 Required variables

```bash
# .env
VITE_APP_NAME=AR Peopliz
VITE_APP_VERSION=1.0.0

# .env.development
VITE_API_URL=http://localhost:8000
VITE_APP_ENV=development
VITE_DEBUG=true

# .env.production
VITE_API_URL=https://api.arpeopliz.com
VITE_APP_ENV=production
VITE_DEBUG=false
VITE_FIREBASE_PROJECT_ID=artech-hrms
VITE_FIREBASE_APP_ID=1:xxx:android:xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx

# .env.local (machine-specific, git-ignored)
VITE_API_URL=http://192.168.1.100:8000   # your machine's LAN IP for device testing
```

---

## 18. Signing & Distribution

### 18.1 Android Signing

**Generate keystore (one time):**
```bash
keytool -genkey -v \
  -keystore arpeopliz-release.jks \
  -alias arpeopliz \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

Store `arpeopliz-release.jks` securely (never commit to git).

**Configure signing in `android/app/build.gradle`:**

```gradle
android {
  ...
  signingConfigs {
    release {
      storeFile file(System.getenv('KEYSTORE_PATH') ?: '../arpeopliz-release.jks')
      storePassword System.getenv('KEYSTORE_PASSWORD') ?: ''
      keyAlias System.getenv('KEY_ALIAS') ?: 'arpeopliz'
      keyPassword System.getenv('KEY_PASSWORD') ?: ''
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
      minifyEnabled true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
  }
}
```

**Set env vars before building:**
```bash
set KEYSTORE_PATH=C:\path\to\arpeopliz-release.jks
set KEYSTORE_PASSWORD=your_password
set KEY_ALIAS=arpeopliz
set KEY_PASSWORD=your_key_password
cd android && gradlew bundleRelease
```

### 18.2 iOS Signing (Xcode)

1. Open Xcode → Project → Signing & Capabilities
2. Set Team to your Apple Developer account
3. Set Bundle Identifier to `com.artech.hrms`
4. Xcode handles provisioning profiles automatically (automatic signing)

For CI: use `fastlane match` or App Store Connect API key.

### 18.3 Windows Code Signing

For production Windows installers, you need a **Code Signing Certificate** (EV or OV) from DigiCert/Sectigo/etc.

In `tauri.conf.json`:
```json
"windows": {
  "certificateThumbprint": null,
  "digestAlgorithm": "sha256",
  "timestampUrl": "http://timestamp.digicert.com"
}
```

Unsigned installers work but show SmartScreen warning on first install.

### 18.4 macOS Notarization

For distribution outside App Store:
```bash
# Build
npx tauri build --target universal-apple-darwin

# Notarize
xcrun notarytool submit \
  "src-tauri/target/universal-apple-darwin/release/bundle/dmg/ARPeopliz.dmg" \
  --apple-id "your@email.com" \
  --team-id "XXXXXXXXXX" \
  --password "app-specific-password" \
  --wait
```

---

## 19. Common Issues & Fixes

### Android

| Issue | Fix |
|-------|-----|
| `localhost` not reachable from device | Use your machine's LAN IP in `VITE_API_URL` |
| API calls blocked (cleartext) | Set `androidScheme: 'https'` in capacitor.config OR add `android:usesCleartextTraffic="true"` in Manifest (dev only) |
| Keyboard pushes layout up oddly | Add `Keyboard: { resize: 'body' }` in capacitor.config |
| Black screen on launch | Run `npx cap sync android` after every `npm run build` |
| Gradle sync fails | Update Gradle wrapper: `cd android && ./gradlew wrapper --gradle-version 8.4` |
| Font not loading | Fonts must be bundled (no `@import url(https://fonts.googleapis...)` in CSS) — embed fonts locally or use `npm install @fontsource/inter` |

### iOS

| Issue | Fix |
|-------|-----|
| `pod install` fails | `sudo gem install cocoapods` then `pod repo update` |
| Build fails after Capacitor update | `cd ios/App && pod deintegrate && pod install` |
| Camera permission crash | Add `NSCameraUsageDescription` to Info.plist |
| `localhost` not working | Use real IP or configure server url in capacitor.config.ts |
| White screen on launch | Check console in Xcode for JS errors |
| Status bar overlaps content | Add `contentInset: 'automatic'` in capacitor.config iOS section |

### Tauri (Desktop)

| Issue | Fix |
|-------|-----|
| `tauri dev` fails to start | Run `npm run build` once first, then `npx tauri dev` |
| Rust compile errors | Run `rustup update` to update toolchain |
| `__TAURI_INTERNALS__` not defined | Make sure `@tauri-apps/api` is installed |
| White window on Windows | Add `backgroundColor` to window config |
| CORS errors on API calls | Add `tauri://localhost` and `https://tauri.localhost` to FastAPI allowed origins |
| Dialog/File picker not working | Add `dialog` permissions to `capabilities/default.json` |

### Fonts

Never load fonts from Google Fonts CDN in native apps (no internet on first load).
Install locally:

```bash
npm install @fontsource/inter
```

In `index.css`, replace `@import url('https://fonts.googleapis.com...')` with:

```css
@import '@fontsource/inter/300.css';
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/600.css';
@import '@fontsource/inter/700.css';
```

---

## 20. CI/CD Pipeline

### 20.1 GitHub Actions — Android Build

Create `.github/workflows/android.yml`:

```yaml
name: Android Build

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with: { node-version: '20' }

      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Install dependencies
        working-directory: hrms-react
        run: npm ci

      - name: Build web
        working-directory: hrms-react
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.PROD_API_URL }}

      - name: Sync Capacitor
        working-directory: hrms-react
        run: npx cap sync android

      - name: Build Release AAB
        working-directory: hrms-react/android
        run: ./gradlew bundleRelease
        env:
          KEYSTORE_PATH: ${{ github.workspace }}/keystore.jks
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}

      - name: Upload AAB
        uses: actions/upload-artifact@v4
        with:
          name: android-release
          path: hrms-react/android/app/build/outputs/bundle/release/app-release.aab
```

### 20.2 GitHub Actions — Windows Build

Create `.github/workflows/windows.yml`:

```yaml
name: Windows Build

on:
  push:
    tags: ['v*']

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with: { node-version: '20' }

      - uses: dtolnay/rust-toolchain@stable

      - name: Install dependencies
        working-directory: hrms-react
        run: npm ci

      - name: Build Tauri
        working-directory: hrms-react
        run: npx tauri build
        env:
          VITE_API_URL: ${{ secrets.PROD_API_URL }}

      - name: Upload installer
        uses: actions/upload-artifact@v4
        with:
          name: windows-installer
          path: hrms-react/src-tauri/target/release/bundle/nsis/*.exe
```

### 20.3 GitHub Secrets to Configure

In your GitHub repo → Settings → Secrets → Actions:

| Secret | Value |
|--------|-------|
| `PROD_API_URL` | `https://api.arpeopliz.com` |
| `KEYSTORE_PASSWORD` | Your keystore password |
| `KEY_ALIAS` | `arpeopliz` |
| `KEY_PASSWORD` | Your key password |
| `APPLE_DEVELOPER_TEAM_ID` | Your Apple team ID |

---

## Quick Start Summary

```bash
# 1. Install everything
cd hrms-react
npm install @capacitor/core @capacitor/android @capacitor/ios
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard
npm install @capacitor/push-notifications @capacitor/camera
npm install @capacitor/preferences @capacitor/network @capacitor/haptics @capacitor/app
npm install -D @capacitor/cli
npm install -D @tauri-apps/cli@^2
npm install @tauri-apps/api@^2
npm install @fontsource/inter

# 2. Initialize
npx cap init "AR Peopliz" "com.artech.hrms" --web-dir dist
npx tauri init     # follow prompts

# 3. Add platforms
npm run build
npx cap add android
npx cap add ios       # macOS only
npx tauri icon path/to/logo-1024.png   # generate all icons

# 4. Dev workflow
npm run dev              # web browser
npx tauri dev            # desktop app
npx cap run android      # Android device/emulator
npx cap run ios          # iOS simulator (macOS only)

# 5. Production builds
npm run build:android    # → .aab for Play Store
npx tauri build          # → .exe (Windows) or .dmg (macOS)
```

---

*AR Peopliz HRMS — Cross-Platform Build Guide v1.0*
*Stack: React 19 + Vite + Tailwind + Capacitor 6 + Tauri 2 + FastAPI*
