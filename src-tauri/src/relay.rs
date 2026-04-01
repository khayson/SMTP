use lettre::transport::smtp::authentication::Credentials;
use lettre::{AsyncSmtpTransport, AsyncTransport, Tokio1Executor};
use lettre::address::Envelope;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RelaySettings {
    pub host: String,
    pub port: u16,
    pub username: Option<String>,
    pub password: Option<String>,
    pub encryption: String, // "none", "starttls", "tls"
}

pub async fn send_relay(
    settings: RelaySettings, 
    sender: String, 
    recipients: String, 
    raw_email: String
) -> Result<(), String> {
    let mut builder = if settings.encryption == "tls" {
        AsyncSmtpTransport::<Tokio1Executor>::relay(&settings.host)
            .map_err(|e| e.to_string())?
    } else {
        AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous(&settings.host)
    };

    builder = builder.port(settings.port);

    if let (Some(user), Some(pass)) = (settings.username, settings.password) {
        let creds = Credentials::new(user, pass);
        builder = builder.credentials(creds);
    }

    let transport = builder.build();

    let from_addr = sender.parse().map_err(|e| format!("Invalid sender address: {}", e))?;
    let to_addrs = recipients
        .split(',')
        .map(|s| s.trim().parse())
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Invalid recipient address: {}", e))?;

    let envelope = Envelope::new(Some(from_addr), to_addrs).map_err(|e| e.to_string())?;

    transport
        .send_raw(&envelope, raw_email.as_bytes())
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(())
}
