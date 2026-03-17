use crate::db::queries::{self, ActivityInput};
use crate::DbState;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

/// Background thread that monitors tracked agent processes.
///
/// Every 10 seconds, checks if PIDs marked as "running" are still alive.
/// If a process has exited, updates the database, logs activity, emits
/// a Tauri event, and sends a system notification.
pub fn start_agent_monitor(db: DbState, app_handle: AppHandle) {
    std::thread::Builder::new()
        .name("agent-monitor".into())
        .spawn(move || {
            loop {
                std::thread::sleep(Duration::from_secs(10));

                let agents = match db.0.lock() {
                    Ok(conn) => queries::list_agent_processes(&conn)
                        .unwrap_or_default()
                        .into_iter()
                        .filter(|a| a.status == "running" && a.pid.is_some())
                        .collect::<Vec<_>>(),
                    Err(_) => continue,
                };

                for agent in &agents {
                    let pid = match agent.pid {
                        Some(p) => p as i32,
                        None => continue,
                    };

                    // Check for session_id marker file (written by agent stdout reader)
                    if agent.session_id.is_none() {
                        let marker_path = std::env::temp_dir()
                            .join(format!("codevetter-agent-{}.session", agent.id));
                        if let Ok(sid) = std::fs::read_to_string(&marker_path) {
                            let sid = sid.trim().to_string();
                            if !sid.is_empty() {
                                if let Ok(conn) = db.0.lock() {
                                    let _ = conn.execute(
                                        "UPDATE agent_processes SET session_id = ?1 WHERE id = ?2",
                                        rusqlite::params![sid, agent.id],
                                    );
                                }
                                let _ = std::fs::remove_file(&marker_path);
                                let _ = app_handle.emit("agent-status-changed", serde_json::json!({
                                    "agent_id": agent.id,
                                    "session_id": sid,
                                }));
                            }
                        }
                    }

                    if is_process_alive(pid) {
                        continue;
                    }

                    // Process has exited — update status
                    let now = chrono::Utc::now().to_rfc3339();
                    let display = agent
                        .display_name
                        .as_deref()
                        .unwrap_or("Agent");

                    if let Ok(conn) = db.0.lock() {
                        let _ = queries::update_agent_process_status(
                            &conn,
                            &agent.id,
                            "completed",
                            Some(&now),
                        );

                        let _ = queries::log_activity(
                            &conn,
                            &ActivityInput {
                                agent_id: Some(agent.id.clone()),
                                event_type: Some("agent_completed".to_string()),
                                summary: Some(format!(
                                    "{} finished (process exited)",
                                    display
                                )),
                                metadata: Some(
                                    serde_json::json!({ "pid": pid }).to_string(),
                                ),
                            },
                        );
                    }

                    // Emit Tauri event
                    let _ = app_handle.emit(
                        "agent-status-changed",
                        serde_json::json!({
                            "agent_id": agent.id,
                            "status": "completed",
                        }),
                    );

                    let _ = app_handle.emit(
                        "activity-update",
                        serde_json::json!({
                            "event_type": "agent_completed",
                            "agent_id": agent.id,
                            "summary": format!("{} finished", display),
                        }),
                    );

                    // System notification
                    use tauri_plugin_notification::NotificationExt;
                    let _ = app_handle
                        .notification()
                        .builder()
                        .title("Agent completed")
                        .body(&format!("{} has finished its work", display))
                        .show();
                }
            }
        })
        .expect("failed to spawn agent-monitor thread");
}

/// Check if a process is still running (Unix).
fn is_process_alive(pid: i32) -> bool {
    #[cfg(unix)]
    {
        // kill(pid, 0) checks if process exists without sending a signal
        unsafe { libc::kill(pid, 0) == 0 }
    }
    #[cfg(not(unix))]
    {
        let _ = pid;
        true // Assume alive on non-unix (can't check)
    }
}
