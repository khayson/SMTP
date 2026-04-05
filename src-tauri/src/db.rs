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
    pub is_starred: bool,
    pub folder: String, // 'inbox', 'trash', 'spam', 'archive', etc.
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
            is_starred INTEGER DEFAULT 0,
            folder TEXT DEFAULT 'inbox',
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
    if !email_columns.contains(&"is_starred".to_string()) {
        conn.execute("ALTER TABLE emails ADD COLUMN is_starred INTEGER DEFAULT 0", [])?;
    }
    if !email_columns.contains(&"folder".to_string()) {
        conn.execute("ALTER TABLE emails ADD COLUMN folder TEXT DEFAULT 'inbox'", [])?;
    }

    // Projects Migrations
    let mut stmt_projects = conn.prepare("PRAGMA table_info(projects)")?;
    let proj_columns: Vec<String> = stmt_projects.query_map([], |row| row.get(1))?.collect::<Result<Vec<_>, _>>()?;
    if !proj_columns.contains(&"webhook_url".to_string()) {
        conn.execute("ALTER TABLE projects ADD COLUMN webhook_url TEXT", [])?;
    }
    if !proj_columns.contains(&"description".to_string()) {
        conn.execute("ALTER TABLE projects ADD COLUMN description TEXT", [])?;
    }

    // V1.3.0 Stability Patch: Force 'inbox' for any orphaned NULL folders
    conn.execute("UPDATE emails SET folder = 'inbox' WHERE folder IS NULL", [])?;

    Ok(())
}

pub fn save_email(path: &Path, email: &Email) -> Result<i64, rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.execute(
        "INSERT INTO emails (message_id, sender, recipients, subject, html_body, text_body, raw_source, project_id, is_read, is_starred, folder)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
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
            if email.is_starred { 1 } else { 0 },
            email.folder,
        ],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn get_email_by_id(path: &Path, id: i64) -> Result<Email, rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.query_row(
        "SELECT id, message_id, sender, recipients, subject, html_body, text_body, raw_source, project_id, created_at, is_read, is_starred, folder FROM emails WHERE id = ?1",
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
                is_starred: row.get::<_, i64>(11)? != 0,
                folder: row.get(12)?,
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
    if project_id.is_empty() {
        conn.execute("UPDATE emails SET is_read = 1", [])?;
    } else {
        conn.execute("UPDATE emails SET is_read = 1 WHERE project_id = ?1", params![project_id])?;
    }
    Ok(())
}

pub fn create_project(path: &Path, name: &str, id: &str, webhook: Option<&str>, desc: Option<&str>) -> Result<(), rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.execute(
        "INSERT OR REPLACE INTO projects (name, id, webhook_url, description) VALUES (?1, ?2, ?3, ?4)",
        params![name, id, webhook, desc],
    )?;
    Ok(())
}

pub fn delete_email(path: &Path, id: i64) -> Result<(), rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.execute("DELETE FROM emails WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn toggle_star(path: &Path, id: i64) -> Result<(), rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.execute("UPDATE emails SET is_starred = 1 - is_starred WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn move_to_trash(path: &Path, id: i64) -> Result<(), rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.execute("UPDATE emails SET folder = 'trash' WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn restore_email(path: &Path, id: i64) -> Result<(), rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.execute("UPDATE emails SET folder = 'inbox' WHERE id = ?1", params![id])?;
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

pub fn get_emails(path: &Path, project_id: Option<String>, folder: Option<String>) -> Result<Vec<Email>, rusqlite::Error> {
    let conn = Connection::open(path)?;
    let mut query = "SELECT id, message_id, sender, recipients, subject, html_body, text_body, raw_source, project_id, created_at, is_read, is_starred, folder FROM emails".to_string();
    
    let mut conditions = Vec::new();
    let mut params_vals = Vec::new();

    if let Some(pid) = project_id {
        conditions.push("project_id = ?");
        params_vals.push(pid);
    }

    if let Some(f) = folder {
        if f == "starred" {
            conditions.push("is_starred = 1");
        } else {
            conditions.push("folder = ?");
            params_vals.push(f);
        }
    }

    if !conditions.is_empty() {
        query.push_str(" WHERE ");
        query.push_str(&conditions.join(" AND "));
    }
    
    query.push_str(" ORDER BY id DESC");
    
    let mut stmt = conn.prepare(&query)?;
    
    // We need to convert params_vals to a slice of trait objects. This is a bit tricky with rusqlite.
    // For now, let's use a simpler approach if params are few.
    let mut emails = Vec::new();

    let mut rows = if params_vals.is_empty() {
        stmt.query([])?
    } else if params_vals.len() == 1 {
        stmt.query(params![params_vals[0]])?
    } else {
        stmt.query(params![params_vals[0], params_vals[1]])?
    };

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
            is_starred: row.get::<_, i64>(11)? != 0,
            folder: row.get(12)?,
        });
    }
    Ok(emails)
}

pub fn get_favorite_senders(path: &Path) -> Result<Vec<(String, String)>, rusqlite::Error> {
    let conn = Connection::open(path)?;
    let mut stmt = conn.prepare("
        SELECT sender, COUNT(*) as count 
        FROM emails 
        GROUP BY sender 
        ORDER BY count DESC 
        LIMIT 5
    ")?;
    let mut rows = stmt.query([])?;
    let mut senders = Vec::new();
    while let Some(row) = rows.next()? {
        senders.push((row.get(0)?, "Frequent Contact".to_string()));
    }
    Ok(senders)
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
