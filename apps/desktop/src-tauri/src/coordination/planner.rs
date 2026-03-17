//! File partitioner and prompt builder for coordinated multi-agent reviews.
//!
//! Given a list of repository files and N agents, this module:
//! 1. Groups files by top-level directory
//! 2. Distributes directory groups across agents (round-robin)
//! 3. Builds context-aware prompts that include existing findings and claimed files

use super::schema::Finding;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Hardcoded focus areas assigned round-robin to agents.
const FOCUS_AREAS: &[&str] = &["security", "correctness", "performance", "style"];

/// A single agent's assignment within a coordinated review.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentAssignment {
    pub agent_id: String,
    pub files: Vec<String>,
    pub focus_area: String,
}

/// The full review plan — a set of agent assignments.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewPlan {
    pub assignments: Vec<AgentAssignment>,
}

/// Partition files across `agent_count` agents.
///
/// Strategy:
/// 1. Group files by their top-level directory (e.g. `src/`, `tests/`, `lib/`).
///    Files without a directory separator go into a "(root)" group.
/// 2. Distribute directory groups across agents via round-robin,
///    keeping all files in the same directory together for context.
/// 3. If a file appears in `already_claimed`, it is excluded.
pub fn partition_files(
    files: Vec<String>,
    agent_count: usize,
    already_claimed: &HashMap<String, String>,
) -> Vec<Vec<String>> {
    if agent_count == 0 {
        return Vec::new();
    }

    // Filter out already-claimed files
    let unclaimed: Vec<String> = files
        .into_iter()
        .filter(|f| !already_claimed.contains_key(f))
        .collect();

    // Group by top-level directory
    let mut dir_groups: HashMap<String, Vec<String>> = HashMap::new();
    for file in unclaimed {
        let top_dir = file
            .split('/')
            .next()
            .filter(|_| file.contains('/'))
            .unwrap_or("(root)")
            .to_string();
        dir_groups.entry(top_dir).or_default().push(file);
    }

    // Sort directory names for deterministic ordering
    let mut dir_names: Vec<String> = dir_groups.keys().cloned().collect();
    dir_names.sort();

    // Round-robin distribute directory groups across agents
    let mut partitions: Vec<Vec<String>> = (0..agent_count).map(|_| Vec::new()).collect();
    for (i, dir_name) in dir_names.iter().enumerate() {
        let bucket = i % agent_count;
        if let Some(files) = dir_groups.remove(dir_name) {
            partitions[bucket].extend(files);
        }
    }

    partitions
}

/// Build a context-aware prompt for an agent.
///
/// The prompt tells the agent:
/// - Which files to review
/// - Its focus area (e.g. security, performance)
/// - Which files have already been reviewed by other agents
/// - Existing findings from other agents for cross-referencing
pub fn build_agent_prompt(
    assignment: &AgentAssignment,
    already_reviewed: &[String],
    existing_findings: &[Finding],
) -> String {
    let mut prompt = String::with_capacity(2048);

    // Header
    prompt.push_str("You are a code review agent performing a coordinated review.\n\n");

    // Focus area
    prompt.push_str(&format!(
        "## Focus Area: {}\n",
        focus_area_description(&assignment.focus_area)
    ));
    prompt.push('\n');

    // Files to review
    prompt.push_str("## Files to Review\n");
    prompt.push_str("Review ONLY the following files:\n");
    for file in &assignment.files {
        prompt.push_str(&format!("- {file}\n"));
    }
    prompt.push('\n');

    // Files already reviewed by other agents
    if !already_reviewed.is_empty() {
        prompt.push_str("## Already Reviewed (skip these)\n");
        prompt.push_str("The following files have already been reviewed by other agents. Do NOT review them:\n");
        for file in already_reviewed {
            prompt.push_str(&format!("- {file}\n"));
        }
        prompt.push('\n');
    }

    // Existing findings from other agents
    if !existing_findings.is_empty() {
        prompt.push_str("## Existing Findings from Other Agents\n");
        prompt.push_str(
            "Other agents have already reported these findings. \
             Cross-reference them if relevant, but do not duplicate:\n",
        );
        for f in existing_findings {
            prompt.push_str(&format!(
                "- [{severity}] {file}:{start}-{end}: {msg}\n",
                severity = f.severity,
                file = f.file,
                start = f.line_start,
                end = f.line_end,
                msg = truncate(&f.message, 120),
            ));
        }
        prompt.push('\n');
    }

    // Output format instructions
    prompt.push_str("## Output Format\n");
    prompt.push_str("For each issue found, report it clearly with:\n");
    prompt.push_str("- The file path and line number(s)\n");
    prompt.push_str("- Severity (error, warning, info)\n");
    prompt.push_str("- A clear description of the issue\n");
    prompt.push_str("- A suggested fix if applicable\n\n");
    prompt.push_str("When you start reviewing a file, say \"Reviewing <filepath>\".\n");
    prompt.push_str("When you finish all files, say \"Done with review\".\n");

    prompt
}

/// Build a full `ReviewPlan` from a file list and agent count.
///
/// Assigns focus areas round-robin and partitions files.
pub fn build_review_plan(
    files: Vec<String>,
    agent_count: usize,
    already_claimed: &HashMap<String, String>,
) -> ReviewPlan {
    let partitions = partition_files(files, agent_count, already_claimed);

    let assignments = partitions
        .into_iter()
        .enumerate()
        .map(|(i, files)| AgentAssignment {
            agent_id: String::new(), // Filled in by the caller after agent launch
            files,
            focus_area: FOCUS_AREAS[i % FOCUS_AREAS.len()].to_string(),
        })
        .collect();

    ReviewPlan { assignments }
}

/// Human-readable description for each focus area.
fn focus_area_description(area: &str) -> String {
    match area {
        "security" => {
            "Security\nFocus on security vulnerabilities: injection flaws, auth issues, \
             data exposure, unsafe operations, missing input validation."
                .to_string()
        }
        "correctness" => {
            "Correctness\nFocus on logic errors, edge cases, null/undefined handling, \
             off-by-one errors, race conditions, and incorrect API usage."
                .to_string()
        }
        "performance" => {
            "Performance\nFocus on performance issues: unnecessary allocations, N+1 queries, \
             missing caching, blocking calls, memory leaks, inefficient algorithms."
                .to_string()
        }
        "style" => {
            "Code Quality & Style\nFocus on code clarity, naming, dead code, \
             missing error handling, documentation gaps, and maintainability."
                .to_string()
        }
        other => other.to_string(),
    }
}

/// Truncate a string to `max_len` characters, appending "..." if truncated.
fn truncate(s: &str, max_len: usize) -> String {
    if s.len() <= max_len {
        s.to_string()
    } else {
        format!("{}...", &s[..max_len])
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_partition_files_basic() {
        let files = vec![
            "src/main.rs".to_string(),
            "src/lib.rs".to_string(),
            "tests/test_main.rs".to_string(),
            "tests/test_lib.rs".to_string(),
            "Cargo.toml".to_string(),
        ];
        let claimed = HashMap::new();

        let parts = partition_files(files, 2, &claimed);
        assert_eq!(parts.len(), 2);

        // (root) group goes to bucket 0, src/ to bucket 1, tests/ to bucket 0
        // (sorted: "(root)", "src", "tests")
        let all: Vec<String> = parts.into_iter().flatten().collect();
        assert_eq!(all.len(), 5);
    }

    #[test]
    fn test_partition_files_excludes_claimed() {
        let files = vec![
            "src/main.rs".to_string(),
            "src/lib.rs".to_string(),
        ];
        let mut claimed = HashMap::new();
        claimed.insert("src/main.rs".to_string(), "agent-a".to_string());

        let parts = partition_files(files, 1, &claimed);
        assert_eq!(parts.len(), 1);
        assert_eq!(parts[0], vec!["src/lib.rs".to_string()]);
    }

    #[test]
    fn test_partition_files_zero_agents() {
        let files = vec!["src/main.rs".to_string()];
        let parts = partition_files(files, 0, &HashMap::new());
        assert!(parts.is_empty());
    }

    #[test]
    fn test_build_agent_prompt_includes_focus_area() {
        let assignment = AgentAssignment {
            agent_id: "agent-1".to_string(),
            files: vec!["src/main.rs".to_string()],
            focus_area: "security".to_string(),
        };

        let prompt = build_agent_prompt(&assignment, &[], &[]);
        assert!(prompt.contains("Security"));
        assert!(prompt.contains("src/main.rs"));
    }

    #[test]
    fn test_build_agent_prompt_includes_existing_findings() {
        let assignment = AgentAssignment {
            agent_id: "agent-1".to_string(),
            files: vec!["src/main.rs".to_string()],
            focus_area: "correctness".to_string(),
        };

        let findings = vec![Finding {
            id: "f1".to_string(),
            file: "src/other.rs".to_string(),
            line_start: 10,
            line_end: 15,
            severity: "error".to_string(),
            message: "Null pointer dereference".to_string(),
            agent_id: "agent-0".to_string(),
            timestamp: "2026-01-01T00:00:00Z".to_string(),
        }];

        let prompt = build_agent_prompt(&assignment, &["src/other.rs".to_string()], &findings);
        assert!(prompt.contains("Already Reviewed"));
        assert!(prompt.contains("src/other.rs"));
        assert!(prompt.contains("Null pointer dereference"));
    }

    #[test]
    fn test_build_review_plan() {
        let files = vec![
            "src/a.rs".to_string(),
            "tests/b.rs".to_string(),
            "lib/c.rs".to_string(),
        ];

        let plan = build_review_plan(files, 2, &HashMap::new());
        assert_eq!(plan.assignments.len(), 2);

        // Each assignment should have a focus area
        assert!(!plan.assignments[0].focus_area.is_empty());
        assert!(!plan.assignments[1].focus_area.is_empty());
    }
}
