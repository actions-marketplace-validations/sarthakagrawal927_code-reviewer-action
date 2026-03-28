# CodeVetter Roadmap

> Desktop-first. Web later. Core thesis: force agents to write less code.
> Previous roadmap archived at `plans/2026-03-21-roadmap-pre-consolidation.md`.

## Completed

### Phase 1: Cleanup
- [x] Sidecar eliminated — review-core runs directly in webview
- [x] Dead code removed (8 components, 2 pages, -2700 lines)
- [x] shadcn/ui migration (Sessions, Workspaces, command-palette)
- [x] History page made read-only (no merge, no delete)
- [x] Board page restructured (Linear-style: sidebar squad + full kanban)
- [x] Agent launches linked to kanban tasks (in_progress + assigned agent)
- [x] Workspace status grouping removed (flat list)
- [x] Git history cleaned (removed 2GB+ build artifacts)

### Phase 2: Local Code Review
- [x] Review pipeline in webview (review-service.ts → review-core → ai-gateway-client)
- [x] AI Provider config in Settings (Anthropic/OpenAI/OpenRouter/Custom)
- [x] Review prompt tuned for agent bloat detection
- [x] review-dashboard rewired (no sidecar, no polling, direct pipeline)

### Foundation (prior work)
- [x] Desktop app (Tauri + React + Vite)
- [x] Conductor parity (workspaces, chat, terminal, file explorer, diff viewer)
- [x] Agent Squad + Kanban board
- [x] Session history + usage tracking
- [x] Cloud platform built (workers, CockroachDB, GitHub OAuth) — on hold

---

### Phase 3: Review Feedback Loop
- [x] Custom review rules per repo (RulesEditor in workspace settings, global fallback)
- [x] Rules injected into buildPrompt alongside agent rules
- [x] Auto-send findings back to agent (review-loop.ts: threshold 80, max 3 attempts)
- [x] Re-launch agent with fix instructions → re-review on completion
- [x] Review results UI (severity-ranked findings, file/line links, confidence, suggestions)
- [x] Review History page (/reviews) with repo filter, score trend, severity breakdown
- [x] 36 Playwright e2e tests for desktop app

### Phase 4: PR Review via GitHub PAT
- [x] GitHub PAT config in Settings (manual input, gh CLI sync, env var detection)
- [x] PR picker UI (list open PRs from PAT, manual fallback)
- [x] Review flow: fetch PR diff → review-core → display findings
- [x] Post review back to GitHub as PR comment with inline findings
- [x] Review-loop auto-detects workspace PR and uses PR review instead of local diff
- [x] Review quality tracked via /reviews page (score trends per repo)

---

### Phase 5: Conductor Polish
- [x] Concurrency limits enforced (max_concurrent_agents preference checked before launch)
- [x] Live agent detection on kanban board (running agents show pulsing green "Live" badge)
- [x] Per-issue workspace isolation (workspace_id FK on agent_tasks, passed through create_task)
- [x] Multi-turn agent sessions (--resume session_id support in Claude Code adapter)
- [x] Symphony-style orchestrator (orchestrator.ts: plan→code→review pipeline, retry, auto-advance)

---

### Phase 6: Semantic Indexing
- [x] Symbol extraction from diffs (regex-based, supports TS/JS/Python/Rust/Go)
- [x] Token-level Jaccard similarity for fuzzy duplicate detection
- [x] "You added X but Y already exists" findings (analyzeDiffForDuplicates)
- [x] review-core semantic module (extractSymbols, findDuplicates, extractAddedCode)

---

### Phase 7: Web App
- [x] DataProvider abstraction (TauriProvider + HttpProvider, auto-detect environment)
- [x] GitHub App webhook handler (workers/review: PR opened/synchronize → enqueue review job)
- [x] Webhook signature verification (HMAC SHA-256)
- [x] Dashboard web app exists (apps/dashboard on Vercel, Next.js + Radix UI)
- [x] Landing page with features, hero graphics, CTA (apps/landing-page)

---

## Not Doing

- ~~Sidecar binary~~ — eliminated
- ~~RAG for reviews~~ — diff + good prompt is enough
- ~~Full file indexing for review context~~ — overkill, build catches import errors
- ~~Separate web dashboard~~ — same codebase as desktop
- ~~Supabase~~ — using CockroachDB/D1
