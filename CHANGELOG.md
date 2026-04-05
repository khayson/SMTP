# Changelog

## [1.2.4] - 2026-04-03 — *The Premium Inspector Release*

### Added
- **Premium Device Preview**: Dynamic Mobile/Tablet/Desktop toggle for email inspection.
- **High-Density Metadata**: Professional grid view for From, To, Date, and Size.
- **Extended Inspector Tabs**: Added HTML Source, Raw Headers, and Analysis modes.
- **Precision Modals**: Full mobile responsiveness and "Click Outside to Close" interactivity for all system modals.

---

## [1.2.3] - 2026-04-06 — *The Simplicity & Guidance Release*

### Added
- **Multi-Step Onboarding**: A 4-step interactive wizard that guides new users through SMTP connection, project silos, and auto-forwarding.
- **Professional Update Modal**: A new, user-controlled update experience showing full release notes and a real-time progress bar.
- **Junior-Friendly Snippets**: Step-by-step code examples for Laravel and Flutter included in the first-run experience.

### Changed
- **Terminology Rebrand (Simple English)**: Replaced complex jargon with intuitive terms (e.g., "Signal Feed" → "Inbox", "Infrastructure Hub" → "Getting Started", "Dispatch" → "Forwarding").
- **UI/UX Refinement**: Reduced visual intensity by swapping ultra-bold (900) fonts for semibold (600) to improve readability.
- **Sidebar Clarity**: Simplified project navigation and simplified header terminology.

---

## [1.2.2] - 2026-04-04 — *The Stability Patch*

### Fixed
- **Real-time Signal Sync**: Restored the `new-email` event listener in the frontend. Intercepted signals now appear instantly in the feed without waiting for the 3-second poll.
- **Project Creation Loop**: Resolved a potential infinite recursion bug in the project initialization logic for new users.
- **Project ID Validation**: Added sanitization and non-empty checks for project IDs to prevent infrastructure creation failures.
- **SMTP Protocol Robustness**: Improved the DATA termination logic in the Rust backend to handle multi-chunk transmissions from modern SMTP clients.
- **Terminology Rebrand**: Completed the transition to ForgeMail branding in the SMTP server greeting and System Tray menu items.
- **CSS Order Fix**: Resolved a build warning by correcting the `@import` rule order in `index.css`.

---

## [1.2.1] - 2026-04-02 — *The Identity Release*

### Changed
- **Full Rebrand**: Product renamed from Postmaster Desktop → **ForgeMail**. Touches every layer: metadata, UI strings, localStorage keys, config snippets, and default passwords.
- **Design System Overhaul**: Adopted a strict monochrome Slate-950 palette replacing the previous multi-accent approach. New hierarchy: `#020617` base → `#0f172a` surface → `#f1f5f9` primary text.
- **Typography**: Standardized on **Inter** for UI + **Geist Mono/JetBrains Mono** for data-dense contexts. All weights and tracking updated across components.
- **3-Pane Architecture**: Main dashboard refactored into a high-breathability Global Navigation / Signal Feed / Inspection Workspace layout. Spacious, not dense.
- **WebhooksView Redesign**: Aligned Dispatch Rule registry and delivery telemetry panels with the new monochrome system. Removed stale legacy `Plus` icon import.
- **SettingsModal Redesign**: Removed legacy Relay section. Simplified to core infrastructure config (SMTP Port + License Key). Copy updated from "Save Configuration" → `COMMIT CHANGES`.
- **Onboarding Rebrand**: First-run modal updated to "Initialize Forge" welcome flow. localStorage key migrated to `forgemail_onboarding_complete`.
- **App Icon**: New monochrome envelope+lightning bolt icon aligned with the ForgeMail identity.

### Fixed
- **Syntax Error**: Removed trailing extra closing brace `}` in `WebhooksView.tsx` that would cause a build failure.
- **Import Cleanup**: Replaced unused `Plus` import with `X` in `WebhooksView.tsx`.
- **openUrl Import**: Corrected missing `@tauri-apps/plugin-opener` import in `SettingsModal.tsx`.

---

## [1.2.0] - 2026-04-02

### Added
- **System Tray Persistence**: Minimizes to tray when window is closed. SMTP engine stays alive.
- **Port Conflict Detection**: Real-time alerts and manual config hook for blocked SMTP ports.
- **Dynamic Port Selection**: Customize the listen port from settings.
- **Onboarding Experience**: First-run welcome guide and persistent sidebar integration guide.
- **License Hook Stub**: Architectural foundation for future license verification.

### Fixed
- **Critical Security (Iframe Sandbox)**: Hardened HTML previews with `sandbox` and CSP meta headers.
- **Settings Modal**: Unified global config into a focused overlay.
- **Version Sync**: Aligned version across `package.json`, `tauri.conf.json`, and `Cargo.toml`.

---

## [1.1.0] - 2026-04-01

### Added
- **Single Instance Lock**: Prevents duplicate app instances.
- **Auto-Update Engine**: GitHub Releases integration for background updates.
- **Email Replay**: Re-dispatch captured signals to registered webhooks.
- **Log Hygiene**: Automated 7-day purge of stale webhook delivery logs.

---

## [1.0.0] - 2026-03-29 — *Initial Release*

### Added
- First release. Multi-Inbox support via unique SMTP users.
- Real-time dashboard with glassmorphic UI foundation.
- Slack, Discord, and Telegram webhook integration.
- Attachment inspection (Base64 decode + preview).
