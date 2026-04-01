# Postmaster: Responsive SMTP Studio 🚀

**The premium, local-first SMTP catch-all server for modern developer workflows.**

Postmaster is a high-performance developer utility built with Tauri and Rust. It intercepts all outgoing emails from your local environment (Laravel, Flutter, Node.js, etc.) and presents them in a beautiful, responsive dashboard—eliminating the risk of sending test emails to real customers.

![Postmaster Dashboard](https://raw.githubusercontent.com/khayson/SMTP/main/public/screenshot.png) *(Placeholder for when you add one)*

## ✨ Key Features

- **🎯 Universal Catch-all**: Intercepts every email sent to port 1025. No configuration required beyond pointing your app to `localhost`.
- **📱 Responsive Master-Detail UI**: Fluid layout that adapts from large monitors to mobile windows.
- **🔔 Native OS Notifications**: Get real-time desktop alerts (with sound) the second an email is intercepted.
- **🔗 Intelligent Link Handling**: One-click redirection of verification and password reset links to your system browser.
- **🔄 Auto-Update Ready**: Built-in GitHub-driven update engine for a seamless studio upgrade experience.
- **🛠️ Webhook Support**: Forward intercepted signals to external services for automated testing.

## 🚀 Quick Start for Developers

### Laravel Integration
Update your `.env` file to point to the Postmaster studio:

```env
MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
```

### Flutter (Dart) Integration
Use the `mailer` package and point to the local SMTP engine:

```dart
final smtpServer = SmtpServer('127.0.0.1', port: 1025);
```

## 🛠️ Tech Stack

- **Backend**: Rust (Multi-threaded SMTP engine)
- **Frontend**: React + Tailwind CSS (Glassmorphic Dark Theme)
- **Framework**: Tauri v2
- **Persistence**: Isolated SQLite layer

## 📦 Installation

1.  Download the latest release for Windows (NSIS/MSI) from the [Releases](https://github.com/khayson/SMTP/releases) page.
2.  Install and launch `Postmaster.exe`.
3.  The SMTP server starts automatically on port `1025`.

## 🤝 Contributing
Postmaster is built by developers, for developers. If you have any suggestions or find a bug, feel free to open an issue!

---
*Created by [I. K. AGYEI COMPANY LTD](https://github.com/khayson)*
