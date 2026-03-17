use crate::coordination::{self, doc, schema::Finding, DocCache};
use crate::db::queries;
use crate::DbState;
use serde_json::{json, Value};
use std::time::Instant;
use tauri::{Emitter, State};

/// Helper: load a doc from cache or disk, run an operation, save back, emit event.
fn with_doc<F, R>(
    cache: &DocCache,
    review_id: &str,
    repo_path: &str,
    app: Option<&tauri::AppHandle>,
    f: F,
) -> Result<R, String>
where
    F: FnOnce(&mut automerge::AutoCommit) -> Result<R, String>,
{
    let mut docs = cache.lock().map_err(|e| format!("Lock error: {e}"))?;
    coordination::cleanup_cache(&mut docs);
    let path = coordination::doc_path(repo_path, review_id);

    // Load from cache, or from disk, or error
    if !docs.contains_key(review_id) {
        let loaded = doc::load_from_disk(&path)?;
        docs.insert(review_id.to_string(), (loaded, Instant::now()));
    }

    let (am_doc, last_access) = docs
        .get_mut(review_id)
        .ok_or_else(|| "Doc not in cache after load".to_string())?;

    // Update last access time
    *last_access = Instant::now();

    let result = f(am_doc)?;

    // Save to disk
    doc::save_to_disk(am_doc, &path)?;

    // Emit event with full state
    if let Some(app) = app {
        let state = doc::get_state(am_doc);
        let _ = app.emit(
            "review-state-changed",
            serde_json::to_value(&state).unwrap_or(json!({})),
        );
    }

    Ok(result)
}

/// Create a new coordinated review document.
///
/// Initializes the Automerge doc, saves to disk, and returns the review_id.
#[tauri::command]
pub async fn create_review_doc(
    app: tauri::AppHandle,
    cache: State<'_, DocCache>,
    repo_path: String,
    branch: String,
) -> Result<Value, String> {
    let review_id = uuid::Uuid::new_v4().to_string();
    let path = coordination::doc_path(&repo_path, &review_id);

    let mut am_doc = doc::create_review_doc(&repo_path, &branch, &review_id);
    doc::save_to_disk(&mut am_doc, &path)?;

    // Cache it
    {
        let mut docs = cache.lock().map_err(|e| format!("Lock error: {e}"))?;
        coordination::cleanup_cache(&mut docs);
        docs.insert(review_id.clone(), (am_doc, Instant::now()));
    }

    // Read state for the event — need to re-acquire lock
    let state = {
        let mut docs = cache.lock().map_err(|e| format!("Lock error: {e}"))?;
        if let Some((d, last_access)) = docs.get_mut(&review_id) {
            *last_access = Instant::now();
            doc::get_state(d)
        } else {
            return Err("Doc disappeared from cache".to_string());
        }
    };

    let _ = app.emit(
        "review-state-changed",
        serde_json::to_value(&state).unwrap_or(json!({})),
    );

    Ok(json!({ "review_id": review_id }))
}

/// Get the full state of a coordinated review.
#[tauri::command]
pub async fn get_review_state(
    cache: State<'_, DocCache>,
    review_id: String,
    repo_path: String,
) -> Result<Value, String> {
    let result = with_doc(&cache, &review_id, &repo_path, None, |am_doc| {
        let state = doc::get_state(am_doc);
        serde_json::to_value(&state).map_err(|e| format!("Serialize error: {e}"))
    })?;

    Ok(result)
}

/// Claim a file for an agent. Returns `{ "claimed": true/false }`.
#[tauri::command]
pub async fn claim_file(
    app: tauri::AppHandle,
    cache: State<'_, DocCache>,
    review_id: String,
    repo_path: String,
    agent_id: String,
    file: String,
) -> Result<Value, String> {
    let claimed = with_doc(
        &cache,
        &review_id,
        &repo_path,
        Some(&app),
        |am_doc| {
            Ok(doc::claim_file(am_doc, &agent_id, &file))
        },
    )?;

    Ok(json!({ "claimed": claimed }))
}

/// Add a finding to a coordinated review.
#[tauri::command]
pub async fn add_finding(
    app: tauri::AppHandle,
    cache: State<'_, DocCache>,
    review_id: String,
    repo_path: String,
    finding: Value,
) -> Result<Value, String> {
    let parsed_finding = Finding {
        id: uuid::Uuid::new_v4().to_string(),
        file: finding
            .get("file")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        line_start: finding
            .get("line_start")
            .and_then(|v| v.as_u64())
            .unwrap_or(0) as u32,
        line_end: finding
            .get("line_end")
            .and_then(|v| v.as_u64())
            .unwrap_or(0) as u32,
        severity: finding
            .get("severity")
            .and_then(|v| v.as_str())
            .unwrap_or("info")
            .to_string(),
        message: finding
            .get("message")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        agent_id: finding
            .get("agent_id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    };

    with_doc(
        &cache,
        &review_id,
        &repo_path,
        Some(&app),
        |am_doc| {
            doc::add_finding(am_doc, &parsed_finding);
            Ok(())
        },
    )?;

    Ok(json!({ "ok": true }))
}

/// Update an agent's status within a coordinated review.
#[tauri::command]
pub async fn update_agent_status(
    app: tauri::AppHandle,
    cache: State<'_, DocCache>,
    review_id: String,
    repo_path: String,
    agent_id: String,
    status: Value,
) -> Result<Value, String> {
    let agent_status = crate::coordination::schema::AgentStatus {
        status: status
            .get("status")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
            .to_string(),
        current_file: status
            .get("current_file")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        progress: status
            .get("progress")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0),
    };

    with_doc(
        &cache,
        &review_id,
        &repo_path,
        Some(&app),
        |am_doc| {
            doc::update_agent_status(am_doc, &agent_id, &agent_status);
            Ok(())
        },
    )?;

    Ok(json!({ "ok": true }))
}

/// Finalize a coordinated review — merge, deduplicate, persist to SQLite,
/// archive the Automerge doc, and return the full merged result.
#[tauri::command]
pub async fn finalize_review(
    app: tauri::AppHandle,
    db: State<'_, DbState>,
    cache: State<'_, DocCache>,
    review_id: String,
    repo_path: String,
) -> Result<Value, String> {
    use crate::coordination::merge;

    // 1. Load the CRDT doc and extract state
    let state = with_doc(&cache, &review_id, &repo_path, Some(&app), |am_doc| {
        Ok(doc::get_state(am_doc))
    })?;

    // 2. Collect agent IDs
    let agents: Vec<String> = state.agent_status.keys().cloned().collect();

    // 3. Build the merged review (deduplicate + sort + summarize)
    let merged = merge::build_merged_review(
        &state.findings,
        state.files_claimed.len(),
        agents,
        &state.meta.created_at,
    );

    // 4. Persist to SQLite — create a local_review + local_review_findings
    {
        let conn = db.0.lock().map_err(|e| format!("DB lock error: {e}"))?;

        // Create the review record
        let agents_label = merged.agents_involved.join(", ");
        let source_label = format!("Coordinated review ({})", agents_label);

        let db_review_id = queries::create_local_review(
            &conn,
            &queries::LocalReviewInput {
                review_type: Some("coordinated".to_string()),
                source_label: Some(source_label),
                repo_path: Some(repo_path.clone()),
                repo_full_name: None,
                pr_number: None,
                agent_used: Some(
                    merged
                        .agents_involved
                        .first()
                        .cloned()
                        .unwrap_or_else(|| "multi-agent".to_string()),
                ),
                status: Some("completed".to_string()),
            },
        )
        .map_err(|e| format!("Failed to create review record: {e}"))?;

        // Insert each non-duplicate finding
        let unique_findings: Vec<&merge::MergedFinding> =
            merged.findings.iter().filter(|f| !f.is_duplicate).collect();

        for mf in &unique_findings {
            let title = mf.finding.message.chars().take(120).collect::<String>();
            let sources_note = if mf.sources.len() > 1 {
                format!("\n\nFound by: {}", mf.sources.join(", "))
            } else {
                String::new()
            };

            queries::insert_review_finding(
                &conn,
                &queries::LocalReviewFindingInput {
                    review_id: db_review_id.clone(),
                    severity: mf.finding.severity.clone(),
                    title,
                    summary: format!("{}{sources_note}", mf.finding.message),
                    suggestion: None,
                    file_path: Some(mf.finding.file.clone()),
                    line: if mf.finding.line_start > 0 {
                        Some(mf.finding.line_start as i64)
                    } else {
                        None
                    },
                    confidence: None,
                    fingerprint: Some(mf.finding.id.clone()),
                },
            )
            .map_err(|e| format!("Failed to insert finding: {e}"))?;
        }

        // Update the review with summary and counts
        queries::update_local_review(
            &conn,
            &db_review_id,
            &queries::LocalReviewUpdate {
                status: Some("completed".to_string()),
                findings_count: Some(unique_findings.len() as i64),
                summary_markdown: Some(merged.summary.clone()),
                completed_at: Some(chrono::Utc::now().to_rfc3339()),
                ..Default::default()
            },
        )
        .map_err(|e| format!("Failed to update review: {e}"))?;

        // Log activity
        queries::log_activity(
            &conn,
            &queries::ActivityInput {
                agent_id: None,
                event_type: Some("coordinated_review_finalized".to_string()),
                summary: Some(format!(
                    "Coordinated review finalized: {} unique findings ({} duplicates removed) across {} files by {} agents",
                    merged.unique_count,
                    merged.duplicate_count,
                    merged.total_files_reviewed,
                    merged.agents_involved.len(),
                )),
                metadata: Some(
                    json!({
                        "review_id": db_review_id,
                        "crdt_review_id": review_id,
                        "unique_findings": merged.unique_count,
                        "duplicate_findings": merged.duplicate_count,
                        "agents": merged.agents_involved,
                        "duration_seconds": merged.duration_seconds,
                    })
                    .to_string(),
                ),
            },
        )
        .map_err(|e| format!("Failed to log activity: {e}"))?;
    }

    // 5. Archive the Automerge doc (rename to .automerge.done)
    let doc_file = coordination::doc_path(&repo_path, &review_id);
    let archive_file = doc_file.with_extension("automerge.done");
    if doc_file.exists() {
        std::fs::rename(&doc_file, &archive_file)
            .map_err(|e| format!("Failed to archive doc: {e}"))?;
    }

    // 6. Remove from cache
    {
        let mut docs = cache.lock().map_err(|e| format!("Lock error: {e}"))?;
        docs.remove(&review_id);
    }

    // 7. Serialize the merged result for the frontend
    let merged_findings_json: Vec<Value> = merged
        .findings
        .iter()
        .map(|mf| {
            json!({
                "finding": {
                    "id": mf.finding.id,
                    "file": mf.finding.file,
                    "line_start": mf.finding.line_start,
                    "line_end": mf.finding.line_end,
                    "severity": mf.finding.severity,
                    "message": mf.finding.message,
                    "agent_id": mf.finding.agent_id,
                    "timestamp": mf.finding.timestamp,
                },
                "sources": mf.sources,
                "is_duplicate": mf.is_duplicate,
            })
        })
        .collect();

    Ok(json!({
        "review_id": review_id,
        "findings": merged_findings_json,
        "summary": merged.summary,
        "total_files_reviewed": merged.total_files_reviewed,
        "agents_involved": merged.agents_involved,
        "duration_seconds": merged.duration_seconds,
        "unique_count": merged.unique_count,
        "duplicate_count": merged.duplicate_count,
    }))
}
