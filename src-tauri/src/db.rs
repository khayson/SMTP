use rusqlite::{params, Connection};
use std::path::Path;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Email {
    pub id: i64,
    pub message_id: Option<String>,
    pub sender: String,
    pub recipients: String,
    pub subject: String,
    pub html_body: Option<String>,
    pub text_body: Option<String>,
    pub raw_source: String,
    pub project_id: String,
    pub created_at: String,
    pub is_read: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Webhook {
    pub id: i64,
    pub url: String,
    pub is_active: bool,
    pub filter_subject: Option<String>,
    pub filter_sender: Option<String>,
    pub use_regex: bool,
    pub hits_count: i64,
    pub success_count: i64,
    pub last_error: Option<String>,
    pub blueprint: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WebhookLog {
    pub id: i64,
    pub webhook_id: i64,
    pub email_subject: String,
    pub status: String,
    pub error: Option<String>,
    pub payload: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WebhookStats7d {
    pub date: String,
    pub success: i64,
    pub failure: i64,
}

pub fn init_db(path: &Path) -> Result<(), rusqlite::Error> {
    let conn = Connection::open(path)?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS emails (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id TEXT,
            sender TEXT,
            recipients TEXT,
            subject TEXT,
            html_body TEXT,
            text_body TEXT,
            raw_source TEXT,
            project_id TEXT,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS webhooks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            filter_subject TEXT,
            filter_sender TEXT,
            use_regex INTEGER DEFAULT 0,
            hits_count INTEGER DEFAULT 0,
            success_count INTEGER DEFAULT 0,
            last_error TEXT,
            blueprint TEXT DEFAULT 'default',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS webhook_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            webhook_id INTEGER,
            email_subject TEXT,
            status TEXT,
            error TEXT,
            payload TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Migrations
    let mut stmt = conn.prepare("PRAGMA table_info(webhooks)")?;
    let columns: Vec<String> = stmt.query_map([], |row| row.get(1))?.collect::<Result<Vec<_>, _>>()?;
    
    if !columns.contains(&"filter_subject".to_string()) {
        conn.execute("ALTER TABLE webhooks ADD COLUMN filter_subject TEXT", [])?;
    }
    if !columns.contains(&"filter_sender".to_string()) {
        conn.execute("ALTER TABLE webhooks ADD COLUMN filter_sender TEXT", [])?;
    }
    if !columns.contains(&"use_regex".to_string()) {
        conn.execute("ALTER TABLE webhooks ADD COLUMN use_regex INTEGER DEFAULT 0", [])?;
    }
    if !columns.contains(&"hits_count".to_string()) {
        conn.execute("ALTER TABLE webhooks ADD COLUMN hits_count INTEGER DEFAULT 0", [])?;
    }
    if !columns.contains(&"success_count".to_string()) {
        conn.execute("ALTER TABLE webhooks ADD COLUMN success_count INTEGER DEFAULT 0", [])?;
    }
    if !columns.contains(&"last_error".to_string()) {
        conn.execute("ALTER TABLE webhooks ADD COLUMN last_error TEXT", [])?;
    }
    if !columns.contains(&"blueprint".to_string()) {
        conn.execute("ALTER TABLE webhooks ADD COLUMN blueprint TEXT DEFAULT 'default'", [])?;
    }

    // Webhook Logs Migrations
    let mut stmt_logs = conn.prepare("PRAGMA table_info(webhook_logs)")?;
    let log_columns: Vec<String> = stmt_logs.query_map([], |row| row.get(1))?.collect::<Result<Vec<_>, _>>()?;
    if !log_columns.contains(&"payload".to_string()) {
        conn.execute("ALTER TABLE webhook_logs ADD COLUMN payload TEXT", [])?;
    }

    // Emails Migrations
    let mut stmt_emails = conn.prepare("PRAGMA table_info(emails)")?;
    let email_columns: Vec<String> = stmt_emails.query_map([], |row| row.get(1))?.collect::<Result<Vec<_>, _>>()?;
    if !email_columns.contains(&"is_read".to_string()) {
        conn.execute("ALTER TABLE emails ADD COLUMN is_read INTEGER DEFAULT 0", [])?;
    }

    Ok(())
}

pub fn save_email(path: &Path, email: &Email) -> Result<i64, rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.execute(
        "INSERT INTO emails (message_id, sender, recipients, subject, html_body, text_body, raw_source, project_id, is_read)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            email.message_id,
            email.sender,
            email.recipients,
            email.subject,
            email.html_body,
            email.text_body,
            email.raw_source,
            email.project_id,
            if email.is_read { 1 } else { 0 },
        ],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn get_email_by_id(path: &Path, id: i64) -> Result<Email, rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.query_row(
        "SELECT id, message_id, sender, recipients, subject, html_body, text_body, raw_source, project_id, created_at, is_read FROM emails WHERE id = ?1",
        params![id],
        |row| {
            Ok(Email {
                id: row.get(0)?,
                message_id: row.get(1)?,
                sender: row.get(2)?,
                recipients: row.get(3)?,
                subject: row.get(4)?,
                html_body: row.get(5)?,
                text_body: row.get(6)?,
                raw_source: row.get(7)?,
                project_id: row.get(8)?,
                created_at: row.get(9)?,
                is_read: row.get::<_, i64>(10)? != 0,
            })
        },
    )
}

pub fn mark_as_read(path: &Path, id: i64) -> Result<(), rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.execute("UPDATE emails SET is_read = 1 WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn mark_all_as_read(path: &Path, project_id: &str) -> Result<(), rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.execute("UPDATE emails SET is_read = 1 WHERE project_id = ?1", params![project_id])?;
    Ok(())
}

pub fn delete_email(path: &Path, id: i64) -> Result<(), rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.execute("DELETE FROM emails WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn clear_emails(path: &Path) -> Result<(), rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.execute("DELETE FROM emails", [])?;
    Ok(())
}

pub fn update_settings(path: &Path, key: &str, value: &str) -> Result<(), rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value",
        params![key, value],
    )?;
    Ok(())
}

pub fn get_settings(path: &Path, key: &str) -> Result<Option<String>, rusqlite::Error> {
    let conn = Connection::open(path)?;
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
    let mut rows = stmt.query(params![key])?;
    if let Some(row) = rows.next()? {
        Ok(Some(row.get(0)?))
    } else {
        Ok(None)
    }
}

pub fn get_webhooks(path: &Path) -> Result<Vec<Webhook>, rusqlite::Error> {
    let conn = Connection::open(path)?;
    let mut stmt = conn.prepare("SELECT id, url, is_active, filter_subject, filter_sender, use_regex, hits_count, success_count, last_error, blueprint FROM webhooks ORDER BY id ASC")?;
    let mut rows = stmt.query([])?;
    let mut hooks = Vec::new();
    while let Some(row) = rows.next()? {
        hooks.push(Webhook {
            id: row.get(0)?,
            url: row.get(1)?,
            is_active: row.get::<_, i64>(2)? != 0,
            filter_subject: row.get(3)?,
            filter_sender: row.get(4)?,
            use_regex: row.get::<_, i64>(5)? != 0,
            hits_count: row.get(6)?,
            success_count: row.get(7)?,
            last_error: row.get(8)?,
            blueprint: row.get(9)?,
        });
    }
    Ok(hooks)
}

pub fn add_webhook(path: &Path, url: &str, filter_subject: Option<String>, filter_sender: Option<String>, use_regex: bool, blueprint: &str) -> Result<i64, rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.execute(
        "INSERT INTO webhooks (url, filter_subject, filter_sender, use_regex, blueprint) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![url, filter_subject, filter_sender, if use_regex { 1 } else { 0 }, blueprint],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn delete_webhook(path: &Path, id: i64) -> Result<(), rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.execute("DELETE FROM webhooks WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn reset_webhook_analytics(path: &Path, id: i64) -> Result<(), rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.execute(
        "UPDATE webhooks SET hits_count = 0, success_count = 0, last_error = NULL WHERE id = ?1",
        params![id],
    )?;
    conn.execute("DELETE FROM webhook_logs WHERE webhook_id = ?1", params![id])?;
    Ok(())
}

pub fn get_webhook_logs(path: &Path, webhook_id: i64, limit: i32) -> Result<Vec<WebhookLog>, rusqlite::Error> {
    let conn = Connection::open(path)?;
    let mut stmt = conn.prepare("SELECT id, webhook_id, email_subject, status, error, payload, created_at FROM webhook_logs WHERE webhook_id = ?1 ORDER BY id DESC LIMIT ?2")?;
    let mut rows = stmt.query(params![webhook_id, limit])?;
    let mut logs = Vec::new();
    while let Some(row) = rows.next()? {
        logs.push(WebhookLog {
            id: row.get(0)?,
            webhook_id: row.get(1)?,
            email_subject: row.get(2)?,
            status: row.get(3)?,
            error: row.get(4)?,
            payload: row.get(5)?,
            created_at: row.get(6)?,
        });
    }
    Ok(logs)
}

pub fn add_webhook_log(path: &Path, webhook_id: i64, email_subject: &str, status: &str, error: Option<String>, payload: Option<String>) -> Result<(), rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.execute(
        "INSERT INTO webhook_logs (webhook_id, email_subject, status, error, payload) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![webhook_id, email_subject, status, error, payload],
    )?;
    Ok(())
}

pub fn purge_old_logs(path: &Path, days: i32) -> Result<usize, rusqlite::Error> {
    let conn = Connection::open(path)?;
    let deleted = conn.execute(
        "DELETE FROM webhook_logs WHERE created_at < datetime('now', '-' || ?1 || ' days')",
        params![days],
    )?;
    Ok(deleted)
}

pub fn get_webhook_stats_7d(path: &Path, webhook_id: i64) -> Result<Vec<WebhookStats7d>, rusqlite::Error> {
    let conn = Connection::open(path)?;
    let mut stmt = conn.prepare(
        "SELECT 
            date(created_at) as day, 
            SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as success, 
            SUM(CASE WHEN status = 'FAILURE' THEN 1 ELSE 0 END) as failure 
         FROM webhook_logs 
         WHERE webhook_id = ?1 AND created_at >= date('now', '-7 days') 
         GROUP BY day 
         ORDER BY day ASC"
    )?;
    let mut rows = stmt.query(params![webhook_id])?;
    let mut stats = Vec::new();
    while let Some(row) = rows.next()? {
        stats.push(WebhookStats7d {
            date: row.get(0)?,
            success: row.get(1)?,
            failure: row.get(2)?,
        });
    }
    Ok(stats)
}

pub fn get_webhook_log_by_id(path: &Path, id: i64) -> Result<WebhookLog, rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.query_row(
        "SELECT id, webhook_id, email_subject, status, error, payload, created_at FROM webhook_logs WHERE id = ?1",
        params![id],
        |row| {
            Ok(WebhookLog {
                id: row.get(0)?,
                webhook_id: row.get(1)?,
                email_subject: row.get(2)?,
                status: row.get(3)?,
                error: row.get(4)?,
                payload: row.get(5)?,
                created_at: row.get(6)?,
            })
        },
    )
}

pub fn get_emails(path: &Path, project_id: Option<String>) -> Result<Vec<Email>, rusqlite::Error> {
    let conn = Connection::open(path)?;
    let mut query = "SELECT id, message_id, sender, recipients, subject, html_body, text_body, raw_source, project_id, created_at, is_read FROM emails".to_string();
    
    let mut params_vec: Vec<String> = Vec::new();
    if let Some(pid) = project_id {
        query.push_str(" WHERE project_id = ?1");
        params_vec.push(pid);
    }
    
    query.push_str(" ORDER BY id DESC");
    
    let mut stmt = conn.prepare(&query)?;
    let mut rows = if params_vec.is_empty() {
        stmt.query([])?
    } else {
        stmt.query(params![params_vec[0]])?
    };

    let mut emails = Vec::new();
    while let Some(row) = rows.next()? {
        emails.push(Email {
            id: row.get(0)?,
            message_id: row.get(1)?,
            sender: row.get(2)?,
            recipients: row.get(3)?,
            subject: row.get(4)?,
            html_body: row.get(5)?,
            text_body: row.get(6)?,
            raw_source: row.get(7)?,
            project_id: row.get(8)?,
            created_at: row.get(9)?,
            is_read: row.get::<_, i64>(10)? != 0,
        });
    }
    Ok(emails)
}

pub fn get_projects(path: &Path) -> Result<Vec<String>, rusqlite::Error> {
    let conn = Connection::open(path)?;
    // Combine projects table and any project_id found in emails to ensure no orphans
    let mut stmt = conn.prepare("
        SELECT id FROM projects 
        UNION 
        SELECT DISTINCT project_id FROM emails WHERE project_id IS NOT NULL AND project_id != ''
        ORDER BY id ASC
    ")?;
    let mut rows = stmt.query([])?;
    let mut projects = Vec::new();
    while let Some(row) = rows.next()? {
        projects.push(row.get(0)?);
    }
    Ok(projects)
}

pub fn create_project(path: &Path, id: &str, name: &str) -> Result<(), rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.execute(
        "INSERT INTO projects (id, name) VALUES (?1, ?2) ON CONFLICT(id) DO UPDATE SET name = EXCLUDED.name",
        params![id, name],
    )?;
    Ok(())
}

pub fn increment_webhook_hit(path: &Path, id: i64) -> Result<(), rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.execute("UPDATE webhooks SET hits_count = hits_count + 1 WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn update_webhook_status(path: &Path, id: i64, success: bool, error_msg: Option<String>) -> Result<(), rusqlite::Error> {
    let conn = Connection::open(path)?;
    if success {
        conn.execute("UPDATE webhooks SET success_count = success_count + 1, last_error = NULL WHERE id = ?1", params![id])?;
    } else {
        conn.execute("UPDATE webhooks SET last_error = ?2 WHERE id = ?1", params![id, error_msg])?;
    }
    Ok(())
}
