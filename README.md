# PRINCIPIA • PHYSICS OLYMPIAD

PRINCIPIA is being rebuilt in this repository as one application using Preact, TypeScript, Vite, Tauri 2, Rust, and Firebase.

## Development

```bash
npm install
npm run dev
```

## Web production build

```bash
npm run build
npm run preview
```

## Desktop application

Install the platform prerequisites for Tauri 2, then run:

```bash
npm run tauri dev
npm run tauri:build
```

## Android and iOS

Initialize the platform project and build with:

```bash
npm run tauri:android:init
npm run tauri:android:build
npm run tauri:ios:init
npm run tauri:ios:build
```

The former Electron runtime and legacy V1 JavaScript/CSS application are being retired as their functionality is reimplemented in the new application. The original PRINCIPIA logo and character assets are retained.
