use crate::db::{self, Email};
use std::path::PathBuf;
use reqwest::Client;
use regex::Regex;

pub async fn broadcast_to_webhooks(db_path: PathBuf, client: Client, email: Email) {
    // 1. Get active webhooks
    let hooks = match db::get_webhooks(&db_path) {
        Ok(h) => h.into_iter().filter(|h| h.is_active).collect::<Vec<_>>(),
        Err(e) => {
            eprintln!("Failed to fetch webhooks for dispatch: {}", e);
            return;
        }
    };

    if hooks.is_empty() {
        return;
    }

    // 2. Dispatch to each
    for hook in hooks {
        let is_match = if hook.use_regex {
            let subj_match = match &hook.filter_subject {
                Some(p) => match Regex::new(p) {
                    Ok(re) => re.is_match(&email.subject),
                    Err(_) => false,
                },
                None => true,
            };
            let sender_match = match &hook.filter_sender {
                Some(p) => match Regex::new(p) {
                    Ok(re) => re.is_match(&email.sender),
                    Err(_) => false,
                },
                None => true,
            };
            subj_match && sender_match
        } else {
            let subject_match = match &hook.filter_subject {
                Some(pattern) => email.subject.to_lowercase().contains(&pattern.to_lowercase()),
                None => true,
            };
            let sender_match = match &hook.filter_sender {
                Some(pattern) => email.sender.to_lowercase().contains(&pattern.to_lowercase()),
                None => true,
            };
            subject_match && sender_match
        };

        if !is_match {
            continue;
        }

        // Increment hit count (V1.5 Analytics)
        let _ = db::increment_webhook_hit(&db_path, hook.id);

        let client_clone = client.clone();
        let email_clone = email.clone();
        let url = hook.url.clone();
        let db_path_clone = db_path.clone();
        let hook_id = hook.id;
        let subject = email.subject.clone();
        let hook_blueprint = hook.blueprint.clone();
        
        // V1.9: Blueprint Transformation
        let payload = match hook_blueprint.as_str() {
            "slack" => {
                let text = format!("*📬 Postmaster Intercept: {}*\n*From:* {}\n*To:* {}", email_clone.subject, email_clone.sender, email_clone.recipients);
                serde_json::json!({ "text": text }).to_string()
            },
            "discord" => {
                let text = format!("**📬 Postmaster Intercept: {}**\n**From:** {}\n**To:** {}", email_clone.subject, email_clone.sender, email_clone.recipients);
                serde_json::json!({ "content": text }).to_string()
            },
            "telegram" => {
                let text = format!("📬 Postmaster Intercept: {}\nFrom: {}\nTo: {}", email_clone.subject, email_clone.sender, email_clone.recipients);
                serde_json::json!({ "text": text }).to_string()
            },
            _ => serde_json::to_string(&email_clone).unwrap_or_default(),
        };

        tokio::spawn(async move {
            let result = client_clone.post(&url)
                .header("Content-Type", "application/json")
                .body(payload.clone())
                .send()
                .await;

            match result {
                Ok(resp) => {
                    let is_success = resp.status().is_success();
                    let error_msg = if !is_success {
                        Some(format!("Status: {}", resp.status()))
                    } else {
                        None
                    };
                    
                    let status_str = if is_success { "SUCCESS" } else { "FAILURE" };
                    let _ = db::add_webhook_log(&db_path_clone, hook_id, &subject, status_str, error_msg.clone(), Some(payload));
                    let _ = db::update_webhook_status(&db_path_clone, hook_id, is_success, error_msg);
                    
                    if !is_success {
                        eprintln!("Webhook dispatch to {} failed with status: {}", url, resp.status());
                    }
                }
                Err(e) => {
                    let error_msg = Some(e.to_string());
                    let _ = db::add_webhook_log(&db_path_clone, hook_id, &subject, "FAILURE", error_msg.clone(), Some(payload));
                    let _ = db::update_webhook_status(&db_path_clone, hook_id, false, error_msg);
                    eprintln!("Webhook dispatch to {} errored: {}", url, e);
                }
            }
        });
    }
}
