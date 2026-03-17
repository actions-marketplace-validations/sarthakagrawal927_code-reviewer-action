use crate::db::queries::{self, DiffCommentRow};
use crate::DbState;
use serde_json::{json, Value};
use std::process::Command as StdCommand;
use tauri::State;

/// Run `git diff <file>` in the given repo and return the raw diff text.
#[tauri::command]
pub async fn get_file_diff(repo_path: String, file_path: String) -> Result<Value, String> {
    let output = StdCommand::new("git")
        .args(["diff", &file_path])
        .current_dir(&repo_path)
        .output()
        .map_err(|e| format!("Failed to run git diff: {e}"))?;

    if !output.status.success() {
        // git diff can return non-zero for some edge cases; also try staged diff
        let staged = StdCommand::new("git")
            .args(["diff", "--cached", &file_path])
            .current_dir(&repo_path)
            .output()
            .map_err(|e| format!("Failed to run git diff --cached: {e}"))?;

        let diff_text = String::from_utf8_lossy(&staged.stdout).to_string();
        return Ok(json!({ "diff": diff_text }));
    }

    let diff_text = String::from_utf8_lossy(&output.stdout).to_string();

    // If working-tree diff is empty, try staged diff
    if diff_text.trim().is_empty() {
        let staged = StdCommand::new("git")
            .args(["diff", "--cached", &file_path])
            .current_dir(&repo_path)
            .output()
            .map_err(|e| format!("Failed to run git diff --cached: {e}"))?;

        let staged_text = String::from_utf8_lossy(&staged.stdout).to_string();
        return Ok(json!({ "diff": staged_text }));
    }

    Ok(json!({ "diff": diff_text }))
}

/// List all diff comments for a workspace.
#[tauri::command]
pub async fn list_diff_comments(
    db: State<'_, DbState>,
    workspace_id: String,
) -> Result<Value, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let comments =
        queries::list_diff_comments(&conn, &workspace_id).map_err(|e| e.to_string())?;
    Ok(json!({ "comments": comments }))
}

/// Create a new draft diff comment.
#[tauri::command]
pub async fn create_diff_comment(
    db: State<'_, DbState>,
    workspace_id: String,
    file_path: String,
    start_line: i64,
    end_line: i64,
    content: String,
) -> Result<Value, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let comment = DiffCommentRow {
        id: id.clone(),
        workspace_id,
        file_path,
        start_line,
        end_line,
        content,
        status: "draft".to_string(),
        github_comment_id: None,
        author: "local".to_string(),
        created_at: now.clone(),
        updated_at: now,
    };

    let conn = db.0.lock().map_err(|e| e.to_string())?;
    queries::create_diff_comment(&conn, &comment).map_err(|e| e.to_string())?;

    Ok(json!(comment))
}

/// Update a diff comment's content and/or status.
#[tauri::command]
pub async fn update_diff_comment(
    db: State<'_, DbState>,
    id: String,
    content: Option<String>,
    status: Option<String>,
) -> Result<Value, String> {
    let now = chrono::Utc::now().to_rfc3339();
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    queries::update_diff_comment(&conn, &id, content.as_deref(), status.as_deref(), &now)
        .map_err(|e| e.to_string())?;
    Ok(json!({ "updated": true }))
}

/// Delete a diff comment.
#[tauri::command]
pub async fn delete_diff_comment(
    db: State<'_, DbState>,
    id: String,
) -> Result<Value, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    queries::delete_diff_comment(&conn, &id).map_err(|e| e.to_string())?;
    Ok(json!({ "deleted": true }))
}
