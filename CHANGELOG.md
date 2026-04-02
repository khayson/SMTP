# CHANGELOG

All notable changes to the **Postmaster SMTP Studio** project will be documented in this file.

## [1.2.0] - 2026-04-02
### Added
- **System Tray Persistence**: The studio now 'minimizes to tray' when the window is closed, ensuring the SMTP interception engine stays alive.
- **Port Conflict Detection**: Real-time studio alerts and manual configuration hook if the SMTP listener (port 1025) is blocked.
- **Dynamic Port Selection**: Customize the SMTP listener port directly from the studio settings.
- **Onboarding Experience**: New "First-Run" welcome guide and a persistent "Studio Guide" sidebar for quick integration help.
- **License Hook Stub**: Architectural foundation for future license verification.

### Fixed
- **Critical Security (Iframe Sandbox)**: Hardened visual previews with `sandbox="allow-same-origin allow-popups"` and specialized CSP meta headers.
- **Precision Settings Modal**: Unified global configuration into a focused overlay for better inbox context.
- **Branding Resync**: Replaced all generic icons with the official transparent 'Postmaster' studio logo.
- **Version Sync**: Synchronized all metadata across package.json, tauri.conf.json, and Cargo.toml.

## [1.1.0] - 2026-04-01
### Added
- **Single Instance Lock**: Prevents multiple studio instances from running simultaneously.
- **Auto-Update Engine**: Integrated with GitHub Releases for seamless background updates.
- **Signal Replay**: Ability to re-dispatch intercepted signals to webhooks.
- **Log Hygiene**: Automated 7-day purging of old webhook logs.

## [1.0.0] - 2026-03-29
### Added
- Initial release of the Postmaster SMTP Studio.
- Multi-Inbox (Project) support via unique SMTP users.
- Real-time Glassmorphic UI dashboard.
- Slack, Discord, and Telegram webhook integration.
- Attachment support (Base64).
