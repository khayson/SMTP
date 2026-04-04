mod db;
mod dispatch;
mod relay;
mod smtp;

use reqwest::Client;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIcon, TrayIconBuilder, TrayIconEvent};

pub struct AppState {
    pub db_path: PathBuf,
    pub http_client: Client,
}

#[tauri::command]
async fn get_emails(
    state: tauri::State<'_, AppState>,
    project_id: Option<String>,
) -> Result<Vec<db::Email>, String> {
    db::get_emails(&state.db_path, project_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_projects(state: tauri::State<'_, AppState>) -> Result<Vec<String>, String> {
    db::get_projects(&state.db_path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_project(
    state: tauri::State<'_, AppState>,
    id: String,
    name: String,
) -> Result<(), String> {
    db::create_project(&state.db_path, &id, &name).map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_email(state: tauri::State<'_, AppState>, id: i64) -> Result<(), String> {
    db::delete_email(&state.db_path, id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn clear_emails(state: tauri::State<'_, AppState>) -> Result<(), String> {
    db::clear_emails(&state.db_path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn mark_as_read(state: tauri::State<'_, AppState>, id: i64) -> Result<(), String> {
    db::mark_as_read(&state.db_path, id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn mark_all_as_read(state: tauri::State<'_, AppState>, project_id: String) -> Result<(), String> {
    db::mark_all_as_read(&state.db_path, &project_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_relay_settings(
    state: tauri::State<'_, AppState>,
) -> Result<Option<relay::RelaySettings>, String> {
    let settings_json =
        db::get_settings(&state.db_path, "relay_settings").map_err(|e| e.to_string())?;
    match settings_json {
        Some(json) => serde_json::from_str(&json).map_err(|e| e.to_string()),
        None => Ok(None),
    }
}

#[tauri::command]
async fn get_settings(state: tauri::State<'_, AppState>, key: String) -> Result<Option<String>, String> {
    db::get_settings(&state.db_path, &key).map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_settings(state: tauri::State<'_, AppState>, key: String, value: String) -> Result<(), String> {
    db::update_settings(&state.db_path, &key, &value).map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_relay_settings(
    state: tauri::State<'_, AppState>,
    settings: relay::RelaySettings,
) -> Result<(), String> {
    let json = serde_json::to_string(&settings).map_err(|e| e.to_string())?;
    db::update_settings(&state.db_path, "relay_settings", &json).map_err(|e| e.to_string())
}

#[tauri::command]
async fn replay_email(state: tauri::State<'_, AppState>, id: i64) -> Result<(), String> {
    let email = db::get_email_by_id(&state.db_path, id).map_err(|e| e.to_string())?;
    let settings_json =
        db::get_settings(&state.db_path, "relay_settings").map_err(|e| e.to_string())?;
    let settings: relay::RelaySettings = match settings_json {
        Some(json) => serde_json::from_str(&json).map_err(|e| e.to_string())?,
        None => return Err("Relay settings not configured".to_string()),
    };
    relay::send_relay(settings, email.sender, email.recipients, email.raw_source)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_webhooks(state: tauri::State<'_, AppState>) -> Result<Vec<db::Webhook>, String> {
    db::get_webhooks(&state.db_path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_webhook(
    state: tauri::State<'_, AppState>,
    url: String,
    filter_subject: Option<String>,
    filter_sender: Option<String>,
    use_regex: bool,
    blueprint: String,
) -> Result<i64, String> {
    if !url.starts_with("http") {
        return Err("URL must start with http:// or https://".to_string());
    }
    db::add_webhook(
        &state.db_path,
        &url,
        filter_subject,
        filter_sender,
        use_regex,
        &blueprint,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_webhook(state: tauri::State<'_, AppState>, id: i64) -> Result<(), String> {
    db::delete_webhook(&state.db_path, id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn test_webhook(
    state: tauri::State<'_, AppState>,
    url: String,
    blueprint: String,
) -> Result<String, String> {
    if !url.starts_with("http") {
        return Err("URL must start with http:// or https://".to_string());
    }

    let payload_body = match blueprint.as_str() {
        "slack" => serde_json::json!({ "text": "🔔 *Postmaster Test Signal*\nThis is a verification dispatch from the Postmaster SMTP Studio." }).to_string(),
        "discord" => serde_json::json!({ "content": "**🔔 Postmaster Test Signal**\nThis is a verification dispatch from the Postmaster SMTP Studio." }).to_string(),
        "telegram" => serde_json::json!({ "text": "🔔 Postmaster Test Signal\nThis is a verification dispatch from the Postmaster SMTP Studio." }).to_string(),
        _ => "{\"test\": true, \"app\": \"Postmaster\"}".to_string(),
    };

    let resp = state
        .http_client
        .post(&url)
        .body(payload_body)
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    Ok(format!("Webhook sent! Status: {}", resp.status()))
}

#[tauri::command]
async fn reset_webhook_analytics(state: tauri::State<'_, AppState>, id: i64) -> Result<(), String> {
    db::reset_webhook_analytics(&state.db_path, id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_webhook_logs(
    state: tauri::State<'_, AppState>,
    webhook_id: i64,
) -> Result<Vec<db::WebhookLog>, String> {
    db::get_webhook_logs(&state.db_path, webhook_id, 50).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_webhook_stats_7d(
    state: tauri::State<'_, AppState>,
    webhook_id: i64,
) -> Result<Vec<db::WebhookStats7d>, String> {
    db::get_webhook_stats_7d(&state.db_path, webhook_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn replay_webhook_dispatch(
    state: tauri::State<'_, AppState>,
    log_id: i64,
) -> Result<String, String> {
    let log = db::get_webhook_log_by_id(&state.db_path, log_id).map_err(|e| e.to_string())?;
    let hooks = db::get_webhooks(&state.db_path).map_err(|e| e.to_string())?;
    let hook = hooks
        .iter()
        .find(|h| h.id == log.webhook_id)
        .ok_or("Original webhook not found")?;

    let payload = log.payload.ok_or("No payload available for replay")?;

    let resp = state
        .http_client
        .post(&hook.url)
        .header("Content-Type", "application/json")
        .body(payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let is_success = resp.status().is_success();
    let status_str = if is_success { "SUCCESS" } else { "FAILURE" };
    let error_msg = if !is_success {
        Some(format!("Status: {}", resp.status()))
    } else {
        None
    };

    // Log the replay attempt
    let _ = db::add_webhook_log(
        &state.db_path,
        hook.id,
        &log.email_subject,
        status_str,
        error_msg,
        Some(resp.status().to_string()),
    );
    // Actually, payload should be the original payload.
    // Let's stick to the log signature: add_webhook_log(path, id, subject, status, error, payload)
    // log.payload is the original JSON.
    let original_payload = db::get_webhook_log_by_id(&state.db_path, log_id)
        .map_err(|e| e.to_string())?
        .payload;
    let _ = db::add_webhook_log(
        &state.db_path,
        hook.id,
        &format!("[REPLAY] {}", log.email_subject),
        status_str,
        if !is_success {
            Some(format!("Status: {}", resp.status()))
        } else {
            None
        },
        original_payload,
    );

    if is_success {
        Ok("Replay successful!".to_string())
    } else {
        Err(format!("Replay failed with status: {}", resp.status()))
    }
}

#[tauri::command]
async fn validate_license(license_key: String) -> Result<bool, String> {
    // V1.2 Placeholder: Always returns true for current release
    println!("Validating commercial license: {}", license_key);
    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
        .setup(|app| {
            // V1.2: System Tray Initialization
            let show_item = MenuItem::with_id(app, "show", "Show Forge Studio", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit ForgeMail", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .on_menu_event(|app: &AppHandle, event| {
                    match event.id.as_ref() {
                        "show" => {
                            let window = app.get_webview_window("main").unwrap();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray: &TrayIcon, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        let window = app.get_webview_window("main").unwrap();
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                })
                .build(app)?;

            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            if !app_data_dir.exists() {
                std::fs::create_dir_all(&app_data_dir).expect("Failed to create app data dir");
            }
            let db_path = app_data_dir.join("postmaster.db");
            db::init_db(&db_path).expect("Failed to initialize database");

            // V1.7: Post-startup log hygiene
            match db::purge_old_logs(&db_path, 7) {
                Ok(count) => println!("Log hygiene complete: purged {} old webhook logs.", count),
                Err(e) => eprintln!("Log hygiene failed: {}", e),
            }

            // Spawn SMTP Server with AppHandle for events
            let app_handle = app.handle().clone();
            let http_client = Client::new();

            app.manage(AppState {
                db_path: db_path.clone(),
                http_client: http_client.clone(),
            });

            let port = match db::get_settings(&db_path, "smtp_port") {
                Ok(Some(p)) => p.parse::<u16>().unwrap_or(1025),
                _ => 1025,
            };

            let smtp_server = smtp::SmtpServer::new(port, db_path, app_handle.clone(), http_client);
            tauri::async_runtime::spawn(async move {
                if let Err(e) = smtp_server.run().await {
                    eprintln!("SMTP Server Error: {}", e);
                    let _ = app_handle.emit("smtp-error", format!("Failed to start SMTP server on port {}: {}. This port might be in use by another application.", port, e));
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_emails,
            get_projects,
            create_project,
            delete_email,
            clear_emails,
            get_relay_settings,
            update_relay_settings,
            replay_email,
            get_webhooks,
            add_webhook,
            delete_webhook,
            test_webhook,
            reset_webhook_analytics,
            get_webhook_logs,
            get_webhook_stats_7d,
            replay_webhook_dispatch,
            mark_as_read,
            mark_all_as_read,
            validate_license,
            get_settings,
            update_settings
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
