//! Multi-review merge logic for Phase 5 of CRDT agent coordination.
//!
//! Deduplicates, sorts, and summarizes findings from multiple agents
//! into a single unified review result.

use super::schema::Finding;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

/// A finding annotated with merge metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergedFinding {
    pub finding: Finding,
    /// Agent IDs that reported this (or a duplicate of this) finding.
    pub sources: Vec<String>,
    /// Whether this finding was identified as a duplicate of an earlier one.
    pub is_duplicate: bool,
}

/// The result of merging all agents' findings into a single review.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergedReview {
    pub findings: Vec<MergedFinding>,
    pub summary: String,
    pub total_files_reviewed: usize,
    pub agents_involved: Vec<String>,
    pub duration_seconds: u64,
    pub unique_count: usize,
    pub duplicate_count: usize,
}

// ─── Deduplication ───────────────────────────────────────────────────────────

/// Line-range overlap tolerance (in lines).
const LINE_TOLERANCE: u32 = 5;

/// Jaccard similarity threshold for message deduplication.
const JACCARD_THRESHOLD: f64 = 0.5;

/// Check whether two line ranges overlap with a tolerance of ±LINE_TOLERANCE.
fn lines_overlap(a_start: u32, a_end: u32, b_start: u32, b_end: u32) -> bool {
    let a_lo = a_start.saturating_sub(LINE_TOLERANCE);
    let a_hi = a_end + LINE_TOLERANCE;
    let b_lo = b_start.saturating_sub(LINE_TOLERANCE);
    let b_hi = b_end + LINE_TOLERANCE;

    a_lo <= b_hi && b_lo <= a_hi
}

/// Compute Jaccard similarity between two strings based on word sets.
fn jaccard_similarity(a: &str, b: &str) -> f64 {
    let words_a: HashSet<&str> = a.split_whitespace().collect();
    let words_b: HashSet<&str> = b.split_whitespace().collect();

    if words_a.is_empty() && words_b.is_empty() {
        return 1.0;
    }

    let intersection = words_a.intersection(&words_b).count();
    let union = words_a.union(&words_b).count();

    if union == 0 {
        return 0.0;
    }

    intersection as f64 / union as f64
}

/// Returns true if two messages are similar enough to be considered duplicates.
/// Uses substring containment as a fast path, then falls back to Jaccard.
fn messages_similar(a: &str, b: &str) -> bool {
    let a_lower = a.to_lowercase();
    let b_lower = b.to_lowercase();

    // Fast path: one contains the other
    if a_lower.contains(&b_lower) || b_lower.contains(&a_lower) {
        return true;
    }

    jaccard_similarity(&a_lower, &b_lower) > JACCARD_THRESHOLD
}

/// Deduplicate findings from multiple agents.
///
/// Two findings are duplicates if they reference the same file AND their
/// line ranges overlap (within ±5 lines tolerance) AND their messages
/// are similar (Jaccard > 0.5 on words or substring match).
///
/// The finding with the earlier timestamp (or first encountered) is kept
/// as the primary. The duplicate is marked `is_duplicate = true` and its
/// agent ID is added to the primary's `sources` list.
pub fn deduplicate_findings(findings: &[Finding]) -> Vec<MergedFinding> {
    if findings.is_empty() {
        return Vec::new();
    }

    // Group findings by file path for efficient comparison.
    let mut by_file: HashMap<&str, Vec<usize>> = HashMap::new();
    for (i, f) in findings.iter().enumerate() {
        by_file.entry(f.file.as_str()).or_default().push(i);
    }

    // Track which finding index is a duplicate of which primary index.
    // duplicate_of[i] = Some(primary_index) means finding i duplicates primary.
    let mut duplicate_of: Vec<Option<usize>> = vec![None; findings.len()];

    for indices in by_file.values() {
        for (pos, &i) in indices.iter().enumerate() {
            if duplicate_of[i].is_some() {
                continue; // already marked as duplicate
            }
            for &j in &indices[pos + 1..] {
                if duplicate_of[j].is_some() {
                    continue; // already marked as duplicate
                }
                // Different agents?
                if findings[i].agent_id == findings[j].agent_id {
                    continue; // same agent, not a cross-agent duplicate
                }

                if lines_overlap(
                    findings[i].line_start,
                    findings[i].line_end,
                    findings[j].line_start,
                    findings[j].line_end,
                ) && messages_similar(&findings[i].message, &findings[j].message)
                {
                    // j is a duplicate of i (i is the primary because it appears earlier)
                    duplicate_of[j] = Some(i);
                }
            }
        }
    }

    // Build merged findings.
    // First pass: create primaries and collect sources.
    let mut primary_sources: HashMap<usize, Vec<String>> = HashMap::new();
    for (i, f) in findings.iter().enumerate() {
        if duplicate_of[i].is_none() {
            primary_sources
                .entry(i)
                .or_default()
                .push(f.agent_id.clone());
        }
    }
    // Add duplicate agents to their primary's sources.
    for (i, f) in findings.iter().enumerate() {
        if let Some(primary) = duplicate_of[i] {
            primary_sources
                .entry(primary)
                .or_default()
                .push(f.agent_id.clone());
        }
    }
    // Deduplicate source lists
    for sources in primary_sources.values_mut() {
        sources.sort();
        sources.dedup();
    }

    // Build result
    let mut results: Vec<MergedFinding> = Vec::with_capacity(findings.len());

    for (i, f) in findings.iter().enumerate() {
        let is_dup = duplicate_of[i].is_some();
        let sources = if is_dup {
            // For duplicates, just list this agent
            vec![f.agent_id.clone()]
        } else {
            primary_sources.remove(&i).unwrap_or_else(|| vec![f.agent_id.clone()])
        };

        results.push(MergedFinding {
            finding: f.clone(),
            sources,
            is_duplicate: is_dup,
        });
    }

    results
}

// ─── Sorting ─────────────────────────────────────────────────────────────────

/// Map a severity string to a sort rank (lower = more severe = sorts first).
fn severity_rank(s: &str) -> u8 {
    match s.to_lowercase().as_str() {
        "critical" => 0,
        "high" => 1,
        "medium" => 2,
        "warning" => 2,
        "low" => 3,
        "suggestion" => 3,
        "nitpick" => 4,
        "info" => 5,
        _ => 6,
    }
}

/// Sort findings by severity (critical first), then file path, then line number.
/// Duplicates are always sorted after non-duplicates within the same severity.
pub fn sort_findings(findings: &mut [MergedFinding]) {
    findings.sort_by(|a, b| {
        // Non-duplicates before duplicates
        a.is_duplicate
            .cmp(&b.is_duplicate)
            .then_with(|| {
                severity_rank(&a.finding.severity)
                    .cmp(&severity_rank(&b.finding.severity))
            })
            .then_with(|| a.finding.file.cmp(&b.finding.file))
            .then_with(|| a.finding.line_start.cmp(&b.finding.line_start))
    });
}

// ─── Summary Generation ──────────────────────────────────────────────────────

/// Generate a plain-text summary of the merged review.
pub fn generate_summary(merged: &MergedReview) -> String {
    let unique = merged.unique_count;
    let dupes = merged.duplicate_count;

    // Duration formatting
    let duration = if merged.duration_seconds >= 60 {
        let mins = merged.duration_seconds / 60;
        let secs = merged.duration_seconds % 60;
        format!("{mins}m {secs}s")
    } else {
        format!("{}s", merged.duration_seconds)
    };

    let mut lines: Vec<String> = Vec::new();

    lines.push(format!(
        "Coordinated review by {} agent{} reviewed {} file{} in {}.",
        merged.agents_involved.len(),
        if merged.agents_involved.len() == 1 { "" } else { "s" },
        merged.total_files_reviewed,
        if merged.total_files_reviewed == 1 { "" } else { "s" },
        duration,
    ));

    lines.push(format!(
        "Found {} unique finding{} ({} duplicate{} removed).",
        unique,
        if unique == 1 { "" } else { "s" },
        dupes,
        if dupes == 1 { "" } else { "s" },
    ));

    // Severity breakdown
    let mut severity_counts: HashMap<String, usize> = HashMap::new();
    for mf in &merged.findings {
        if !mf.is_duplicate {
            *severity_counts
                .entry(mf.finding.severity.to_lowercase())
                .or_insert(0) += 1;
        }
    }

    let mut breakdown_parts: Vec<String> = Vec::new();
    for sev in &["critical", "high", "medium", "warning", "low", "suggestion", "nitpick", "info"] {
        if let Some(&count) = severity_counts.get(*sev) {
            breakdown_parts.push(format!("{count} {sev}"));
        }
    }
    if !breakdown_parts.is_empty() {
        lines.push(format!("Severity: {}.", breakdown_parts.join(", ")));
    }

    // Top 3 most critical findings
    let top_findings: Vec<&MergedFinding> = merged
        .findings
        .iter()
        .filter(|f| !f.is_duplicate)
        .take(3)
        .collect();

    if !top_findings.is_empty() {
        lines.push(String::new());
        lines.push("Top findings:".to_string());
        for (i, mf) in top_findings.iter().enumerate() {
            let loc = if mf.finding.line_start > 0 {
                format!("{}:{}", mf.finding.file, mf.finding.line_start)
            } else {
                mf.finding.file.clone()
            };
            // Truncate message for summary
            let msg: String = mf.finding.message.chars().take(80).collect();
            let ellipsis = if mf.finding.message.len() > 80 { "..." } else { "" };
            lines.push(format!(
                "  {}. [{}] {} - {}{ellipsis}",
                i + 1,
                mf.finding.severity.to_uppercase(),
                loc,
                msg,
            ));
        }
    }

    lines.join("\n")
}

/// Build a complete `MergedReview` from raw findings and metadata.
pub fn build_merged_review(
    findings: &[Finding],
    files_claimed_count: usize,
    agents: Vec<String>,
    created_at: &str,
) -> MergedReview {
    let mut merged = deduplicate_findings(findings);
    sort_findings(&mut merged);

    let unique_count = merged.iter().filter(|f| !f.is_duplicate).count();
    let duplicate_count = merged.iter().filter(|f| f.is_duplicate).count();

    // Calculate duration from created_at to now
    let duration_seconds = chrono::DateTime::parse_from_rfc3339(created_at)
        .ok()
        .map(|start| {
            let now = chrono::Utc::now();
            (now - start.with_timezone(&chrono::Utc))
                .num_seconds()
                .max(0) as u64
        })
        .unwrap_or(0);

    let mut review = MergedReview {
        findings: merged,
        summary: String::new(),
        total_files_reviewed: files_claimed_count,
        agents_involved: agents,
        duration_seconds,
        unique_count,
        duplicate_count,
    };

    review.summary = generate_summary(&review);
    review
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn make_finding(
        file: &str,
        line_start: u32,
        line_end: u32,
        severity: &str,
        message: &str,
        agent_id: &str,
    ) -> Finding {
        Finding {
            id: uuid::Uuid::new_v4().to_string(),
            file: file.to_string(),
            line_start,
            line_end,
            severity: severity.to_string(),
            message: message.to_string(),
            agent_id: agent_id.to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }

    #[test]
    fn test_no_duplicates_different_files() {
        let findings = vec![
            make_finding("src/a.ts", 10, 20, "high", "Missing null check", "agent-a"),
            make_finding("src/b.ts", 10, 20, "high", "Missing null check", "agent-b"),
        ];

        let merged = deduplicate_findings(&findings);
        assert_eq!(merged.len(), 2);
        assert!(!merged[0].is_duplicate);
        assert!(!merged[1].is_duplicate);
    }

    #[test]
    fn test_duplicate_same_file_overlapping_lines_similar_message() {
        let findings = vec![
            make_finding("src/a.ts", 10, 15, "high", "SQL injection vulnerability in user input", "agent-a"),
            make_finding("src/a.ts", 12, 18, "high", "SQL injection vulnerability from user input", "agent-b"),
        ];

        let merged = deduplicate_findings(&findings);
        assert_eq!(merged.len(), 2);
        assert!(!merged[0].is_duplicate);
        assert!(merged[1].is_duplicate);
        // Primary should list both agents
        assert_eq!(merged[0].sources.len(), 2);
    }

    #[test]
    fn test_no_duplicate_same_file_different_lines() {
        let findings = vec![
            make_finding("src/a.ts", 10, 12, "high", "Missing null check", "agent-a"),
            make_finding("src/a.ts", 100, 105, "high", "Missing null check", "agent-b"),
        ];

        let merged = deduplicate_findings(&findings);
        assert!(!merged[0].is_duplicate);
        assert!(!merged[1].is_duplicate);
    }

    #[test]
    fn test_no_duplicate_same_agent() {
        let findings = vec![
            make_finding("src/a.ts", 10, 15, "high", "Missing null check", "agent-a"),
            make_finding("src/a.ts", 12, 18, "high", "Missing null check", "agent-a"),
        ];

        let merged = deduplicate_findings(&findings);
        assert!(!merged[0].is_duplicate);
        assert!(!merged[1].is_duplicate);
    }

    #[test]
    fn test_sort_by_severity() {
        let findings = vec![
            make_finding("src/a.ts", 1, 5, "low", "Minor style issue", "agent-a"),
            make_finding("src/b.ts", 1, 5, "critical", "SQL injection", "agent-a"),
            make_finding("src/c.ts", 1, 5, "high", "Missing auth", "agent-a"),
        ];

        let mut merged = deduplicate_findings(&findings);
        sort_findings(&mut merged);

        assert_eq!(merged[0].finding.severity, "critical");
        assert_eq!(merged[1].finding.severity, "high");
        assert_eq!(merged[2].finding.severity, "low");
    }

    #[test]
    fn test_lines_overlap_with_tolerance() {
        // Exact overlap
        assert!(lines_overlap(10, 20, 10, 20));
        // Adjacent within tolerance
        assert!(lines_overlap(10, 15, 20, 25)); // 15+5=20 >= 20
        // Too far apart
        assert!(!lines_overlap(10, 15, 30, 35));
    }

    #[test]
    fn test_jaccard_similarity() {
        let sim = jaccard_similarity(
            "missing null check on user input",
            "null check missing for user input",
        );
        assert!(sim > JACCARD_THRESHOLD);

        let sim_diff = jaccard_similarity(
            "SQL injection vulnerability",
            "unused variable warning",
        );
        assert!(sim_diff < JACCARD_THRESHOLD);
    }

    #[test]
    fn test_generate_summary() {
        let review = MergedReview {
            findings: vec![
                MergedFinding {
                    finding: make_finding("src/auth.ts", 45, 50, "critical", "SQL injection in login handler", "a"),
                    sources: vec!["a".to_string(), "b".to_string()],
                    is_duplicate: false,
                },
                MergedFinding {
                    finding: make_finding("src/auth.ts", 46, 52, "critical", "SQL injection from login", "b"),
                    sources: vec!["b".to_string()],
                    is_duplicate: true,
                },
            ],
            summary: String::new(),
            total_files_reviewed: 10,
            agents_involved: vec!["a".to_string(), "b".to_string()],
            duration_seconds: 154,
            unique_count: 1,
            duplicate_count: 1,
        };

        let summary = generate_summary(&review);
        assert!(summary.contains("2 agents"));
        assert!(summary.contains("10 files"));
        assert!(summary.contains("1 unique finding"));
        assert!(summary.contains("1 duplicate removed"));
    }
}
