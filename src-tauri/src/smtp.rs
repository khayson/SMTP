use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use mail_parser::MessageParser;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter};
use reqwest::Client;
use crate::dispatch;
use base64::{Engine as _, engine::general_purpose};

pub struct SmtpServer {
    pub port: u16,
    pub db_path: PathBuf,
    pub app_handle: AppHandle,
    pub http_client: Client,
}

enum SmtpState {
    Command,
    AuthUser,
    AuthPass,
    Data,
}

impl SmtpServer {
    pub fn new(port: u16, db_path: PathBuf, app_handle: AppHandle, http_client: Client) -> Self {
        Self { port, db_path, app_handle, http_client }
    }

    pub async fn run(&self) -> tokio::io::Result<()> {
        let addr = format!("127.0.0.1:{}", self.port);
        let listener = TcpListener::bind(&addr).await?;
        println!("SMTP Listener active on {}", addr);

        loop {
            let (mut socket, _) = listener.accept().await?;
            let db_path = self.db_path.clone();
            let app_handle = self.app_handle.clone();
            let http_client = self.http_client.clone();

            tokio::spawn(async move {
                let mut buffer = vec![0u8; 16384];
                let mut state = SmtpState::Command;
                let mut project_id = "default".to_string();
                let mut data_buffer = Vec::new();
                
                let _ = socket.write_all(b"220 Postmaster Desktop ESMTP\r\n").await;
                
                loop {
                    let n = match socket.read(&mut buffer).await {
                        Ok(0) => break,
                        Ok(n) => n,
                        Err(_) => break,
                    };

                    let raw_msg = String::from_utf8_lossy(&buffer[..n]);
                    
                    if let SmtpState::Data = state {
                        data_buffer.extend_from_slice(&buffer[..n]);
                        if data_buffer.ends_with(b"\r\n.\r\n") || data_buffer.starts_with(b".\r\n") {
                            // Process Email
                            if let Some(message) = MessageParser::default().parse(&data_buffer) {
                                let mut email = crate::db::Email {
                                    id: 0,
                                    message_id: message.message_id().map(|s| s.to_string()),
                                    sender: message.from().and_then(|f| f.as_list()).and_then(|l| l.first()).and_then(|a| a.address()).map(|s| s.to_string()).unwrap_or_else(|| "unknown".to_string()),
                                    recipients: message.to().and_then(|t| t.as_list()).and_then(|l| l.first()).and_then(|a| a.address()).map(|s| s.to_string()).unwrap_or_else(|| "unknown".to_string()),
                                    subject: message.subject().unwrap_or("No Subject").to_string(),
                                    html_body: message.body_html(0).map(|b| b.to_string()),
                                    text_body: message.body_text(0).map(|b| b.to_string()),
                                    raw_source: String::from_utf8_lossy(&data_buffer).to_string(),
                                    project_id: project_id.clone(),
                                    created_at: chrono::Utc::now().to_rfc3339(),
                                    is_read: false,
                                };
                                
                                if let Ok(id) = crate::db::save_email(&db_path, &email) {
                                    // Auto-register project in the projects table if it's the first time we see it
                                    let _ = crate::db::create_project(&db_path, &project_id, &project_id);
                                    
                                    email.id = id;
                                    let _ = app_handle.emit("new-email", email.clone());
                                    
                                    let project_id_copy = project_id.clone();
                                    let subject_copy = email.subject.clone();
                                    
                                    // Use a background task for webhooks to avoid blocking SMTP
                                    let db_path_clone = db_path.clone();
                                    let http_client_clone = http_client.clone();
                                    let app_handle_clone = app_handle.clone();
                                    tokio::spawn(async move {
                                        dispatch::broadcast_to_webhooks(db_path_clone, http_client_clone, email).await;
                                        
                                        // V2.0: Trigger System Notification
                                        use tauri_plugin_notification::NotificationExt;
                                        let _ = app_handle_clone.notification()
                                            .builder()
                                            .title("Postmaster: New Signal")
                                            .body(format!("Project: {}\nSub: {}", project_id_copy, subject_copy))
                                            .show();
                                    });
                                }
                            }
                            let _ = socket.write_all(b"250 OK\r\n").await;
                            data_buffer.clear();
                            state = SmtpState::Command;
                        }
                        continue;
                    }

                    let lines: Vec<&str> = raw_msg.split("\r\n").collect();
                    for line in lines {
                        let cmd = line.trim();
                        if cmd.is_empty() { continue; }

                        let upper_cmd = cmd.to_uppercase();

                        match state {
                            SmtpState::Command => {
                                if upper_cmd.starts_with("EHLO") || upper_cmd.starts_with("HELO") {
                                    let _ = socket.write_all(b"250-Postmaster\r\n250-AUTH LOGIN PLAIN\r\n250-SIZE 15728640\r\n250 OK\r\n").await;
                                } else if upper_cmd.starts_with("AUTH LOGIN") {
                                    let _ = socket.write_all(b"334 VXNlcm5hbWU6\r\n").await; // "Username:"
                                    state = SmtpState::AuthUser;
                                } else if upper_cmd.starts_with("MAIL FROM") || upper_cmd.starts_with("RCPT TO") {
                                    let _ = socket.write_all(b"250 OK\r\n").await;
                                } else if upper_cmd.starts_with("DATA") {
                                    let _ = socket.write_all(b"354 Start mail input; end with <CRLF>.<CRLF>\r\n").await;
                                    state = SmtpState::Data;
                                    data_buffer.clear();
                                } else if upper_cmd.starts_with("QUIT") {
                                    let _ = socket.write_all(b"221 Bye\r\n").await;
                                    return;
                                } else {
                                    let _ = socket.write_all(b"250 OK\r\n").await;
                                }
                            }
                            SmtpState::AuthUser => {
                                if let Ok(decoded) = general_purpose::STANDARD.decode(cmd) {
                                    project_id = String::from_utf8_lossy(&decoded).to_string();
                                }
                                let _ = socket.write_all(b"334 UGFzc3dvcmQ6\r\n").await; // "Password:"
                                state = SmtpState::AuthPass;
                            }
                            SmtpState::AuthPass => {
                                let _ = socket.write_all(b"235 Authentication successful\r\n").await;
                                state = SmtpState::Command;
                            }
                            SmtpState::Data => {}
                        }
                    }
                }
            });
        }
    }
}
