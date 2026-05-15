# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.6] - 2026-05-14

### Added

- **Portable Windows mode:** if an empty file named `forgemail.portable` sits next to `forgemail-desktop.exe`, the app stores its database and settings in a `data` folder beside the executable instead of under the OS app data directory.
- **`src-tauri/tauri.windows.conf.json`:** Windows release bundles use the NSIS target only (no MSI), simplifying artifacts.
- **GitHub Actions:** after each tagged release build, the workflow packs `ForgeMail_x64_portable_<tag>.zip` (exe, DLLs, `resources` when present, plus `forgemail.portable`) and uploads it to the GitHub release alongside the NSIS installer.

### Changed

- **`nodemailer`** moved to `devDependencies` (used only by `send_test.js`, not the desktop UI).

### Removed

- **`validate_license` Tauri command:** unused placeholder that always returned success; removed from the invoke handler.

### Studio

- Layout and styling updates across the studio shell (header, sidebar, message list, inspector, compose/create flows, drawer, settings, and global CSS).
