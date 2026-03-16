# CRDT-Based Agent Coordination

> Goal: Replace fire-and-forget agent launching with a shared-state coordination layer using CRDTs, enabling agents to coordinate without an orchestrator and the UI to reactively display progress.

## Problem

Currently agents (Claude Code, Codex) are launched as independent OS processes with no shared state. The desktop app polls PIDs every 10 seconds to check liveness. Agents can't see what other agents have done, leading to duplicate work and no coordination.

## Architecture

```
┌──────────┐     ┌──────────────────────┐     ┌──────────┐
│ Agent A   │────▶│  Automerge Doc       │◀────│ Agent B   │
│ (Claude)  │◀────│  (Rust sidecar)      │────▶│ (Codex)   │
└──────────┘     └──────────────────────┘     └──────────┘
   stdout/file        ▲          ▲          stdout/file
                      │          │
                ┌─────┘          └─────┐
                │ Tauri events         │ Disk persistence
                │ (reactive UI)        │ (.automerge file)
                ▼                      ▼
          ┌───────────┐         ┌───────────┐
          │ Desktop UI │         │ Recovery   │
          │ (live view)│         │ on restart │
          └───────────┘         └───────────┘
```

## Shared State Schema

```rust
// Automerge document structure
{
  // Each agent appends findings — Set semantics, no conflicts
  findings: [
    { id, file, line_start, line_end, severity, message, agent_id, timestamp }
  ],

  // Map of file path → agent_id — first writer wins, others skip
  files_claimed: {
    "src/foo.ts": "agent-a",
    "src/bar.ts": "agent-b"
  },

  // Each agent owns its own key — no conflicts
  agent_status: {
    "agent-a": { status: "reviewing", current_file: "src/foo.ts", progress: 0.6 },
    "agent-b": { status: "done", current_file: null, progress: 1.0 }
  },

  // Orchestrator-owned, agents read-only
  plan: [
    { step: "review src/", owner: "agent-a", status: "in_progress" },
    { step: "review tests/", owner: "agent-b", status: "complete" }
  ],

  // Metadata
  meta: {
    repo_path: "/path/to/repo",
    branch: "main",
    created_at: "2026-03-17T...",
    review_id: "uuid"
  }
}
```

Key design choices:
- **findings** is append-only (CRDT Set) — agents never edit each other's findings
- **files_claimed** is a Map where each key is written once — prevents duplicate reviews
- **agent_status** is partitioned by agent_id — each agent owns its own key, zero conflicts
- **plan** is owned by the orchestrator/UI — agents read but don't write

## Phases

### Phase 1: Automerge in the Rust Sidecar (2 days)

Add `automerge` crate to `src-tauri`. Create a coordination module that manages the shared document.

**Files to create/modify:**
| File | What |
|------|------|
| `Cargo.toml` | Add `automerge = "0.5"` dependency |
| `src/coordination.rs` | New module — create/load/save Automerge docs, apply changes |
| `src/coordination/schema.rs` | Typed helpers for reading/writing the schema above |
| `src/commands/coordination.rs` | Tauri commands: `create_review_doc`, `get_review_state`, `claim_file`, `add_finding` |

Core API:
```rust
pub fn create_review_doc(repo_path: &str, branch: &str) -> AutomergeDoc;
pub fn apply_agent_output(doc: &mut AutomergeDoc, agent_id: &str, output: AgentOutput);
pub fn claim_file(doc: &mut AutomergeDoc, agent_id: &str, file: &str) -> bool; // false if already claimed
pub fn add_finding(doc: &mut AutomergeDoc, finding: Finding);
pub fn get_state(doc: &AutomergeDoc) -> ReviewState; // serializable snapshot for UI
pub fn save_to_disk(doc: &AutomergeDoc, path: &Path);
pub fn load_from_disk(path: &Path) -> AutomergeDoc;
```

Persistence: save `.automerge` file in the project's `.codevetter/` directory. Reload on app restart.

### Phase 2: Agent Output Parser (1 day)

Agents (Claude Code, Codex) communicate via stdout. Build a parser that translates their output into CRDT operations.

**Files to create/modify:**
| File | What |
|------|------|
| `src/coordination/parser.rs` | Parse agent stdout into structured `AgentOutput` events |
| `src/adapters/claude_code.rs` | Pipe stdout through parser → CRDT updates |
| `src/adapters/codex.rs` | Same |

The parser watches for patterns in agent output:
- File being reviewed → `claim_file`
- Finding/issue reported → `add_finding`
- Status changes → update `agent_status`

This is the shim layer — agents don't know about Automerge. The Rust sidecar translates.

### Phase 3: Reactive UI (2 days)

Replace PID polling with Tauri events driven by Automerge document changes.

**Files to create/modify:**
| File | What |
|------|------|
| `src/coordination.rs` | Emit `review-state-changed` Tauri event on every doc mutation |
| `src/components/review-live.tsx` | New component — live review progress view |
| `src/components/agent-card.tsx` | Update to show current file, progress from shared state |

UI gets:
- Real-time progress per agent (which file, % done)
- Live findings list as they come in
- File claim visualization (which agent is reviewing what)
- No more 10-second polling — events fire on every CRDT mutation

### Phase 4: Agent Coordination Logic (2 days)

Use the shared state to make agents smarter — skip files already claimed, prioritize uncovered areas.

**How it works:**
1. Before an agent starts reviewing a file, the sidecar checks `files_claimed`
2. If claimed → skip, pick next uncovered file
3. Agent's task prompt includes: "These files have already been reviewed: [list]. Focus on: [unclaimed files]"
4. On agent launch, sidecar reads current doc state and injects context into the agent's initial prompt

**Files to create/modify:**
| File | What |
|------|------|
| `src/commands/agents.rs` | On launch, read doc state → build context-aware prompt |
| `src/coordination/planner.rs` | Simple file partitioning: given N agents and M files, assign work |

This is where the "orchestrator intelligence" lives — not in a separate agent, but in the launch logic that reads shared state and assigns work.

### Phase 5: Multi-Review Merge (1 day)

When all agents complete, merge findings into a final review.

**What to build:**
- Deduplicate findings that overlap (same file + line range)
- Sort by severity
- Generate a unified review summary
- Persist final review to the existing review storage (SQLite)

**Files to create/modify:**
| File | What |
|------|------|
| `src/coordination/merge.rs` | Dedupe + sort + summarize findings from completed doc |
| `src/commands/coordination.rs` | `finalize_review` command — merge → persist → archive doc |

---

## Summary

| Phase | What | Effort |
|-------|------|--------|
| 1 | Automerge in Rust sidecar | 2 days |
| 2 | Agent output parser (stdout → CRDT) | 1 day |
| 3 | Reactive UI | 2 days |
| 4 | Coordination logic (file claiming, smart prompts) | 2 days |
| 5 | Multi-review merge | 1 day |
| **Total** | | **8 days** |

## Dependencies

- `automerge = "0.5"` (Rust crate, pure Rust, no native deps)
- No changes to Claude Code or Codex themselves — coordination is entirely in the sidecar

## Risks

- **Agent output parsing is fragile** — Claude Code and Codex don't have structured output modes. Parser will need heuristics and may miss events. Mitigation: start with conservative parsing, log unparsed output for iteration.
- **File granularity may be too coarse** — two agents could review different functions in the same file. Mitigation: start with file-level claiming, move to function-level if needed.
- **Automerge doc size** — for large repos with many findings, the doc could grow. Mitigation: archive completed reviews, keep active doc small.

## Future Extensions

- **Lateral agent communication** — agent A finds a security issue, agent B gets notified to check related files
- **Function-level claiming** — use tree-sitter to partition files into reviewable units
- **Cross-repo coordination** — shared state across multiple repos in a workspace
- **Pluggable CRDT backends** — swap Automerge for Yjs if frontend-heavy use cases emerge
