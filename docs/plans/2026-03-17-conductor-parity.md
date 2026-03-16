# Conductor Parity Plan

> Goal: Close the feature gap between CodeVetter Desktop and Conductor, adopt a warm amber/mustard design language.

## Current State

CodeVetter Desktop is ~95% functional with: multi-agent orchestration, chat with streaming, code review, session history with FTS5 search, task management (Kanban), usage/cost tracking, provider accounts, background watchers, git integration, and a Bun sidecar for Claude CLI.

## Phase 0: Design System — Warm Amber Rebrand

**Priority: Do first — everything else builds on this.**

Shift the accent palette from cold indigo to a warm amber/mustard inspired by Conductor's design language.

### Color Tokens

```
--accent:          #d4a039   (warm mustard — primary actions, active states)
--accent-hover:    #e0b350   (lighter hover)
--accent-muted:    #d4a039/15 (backgrounds, badges)
--accent-subtle:   #d4a039/8  (hover tints)

--bg-main:         #0e0f13   (slightly warmer dark base)
--bg-surface:      #141519   (cards, panels)
--bg-raised:       #1b1d24   (elevated surfaces, modals)
--border:          #1f2129   (subtle separation)
--border-hover:    #2e3040   (interactive borders)

--success:         #4ade80
--warning:         #fbbf24
--error:           #f87171
--info:            #60a5fa
```

### Changes

| File | What |
|------|------|
| `globals.css` | Update CSS custom properties to warm palette |
| `tailwind.config.js` | Replace `accent` indigo with amber tokens |
| All components | Replace `bg-indigo-*`, `text-indigo-*`, `border-indigo-*` with `accent` tokens |
| Sidebar | Warm active state (`bg-accent/10 text-accent`) |
| Buttons | Primary buttons use `bg-accent hover:bg-accent-hover` |

**Effort: 1 day**

---

## Phase 1: Workspace Architecture

Conductor's core concept: a **workspace** = a branch + chat + file state. Users create workspaces from branches, PRs, or Linear issues.

### What to Build

1. **Workspace model** — SQLite table: `id, name, repo_path, branch, pr_number, status (backlog|in_progress|in_review|done), created_at, archived_at`
2. **Sidebar workspace list** — replace current flat sidebar with workspace-grouped view
3. **Workspace creation** — from existing branch, new branch, or PR number
4. **Status grouping** — sidebar groups: Backlog, In Progress, In Review, Done
5. **Archive/unarchive** — move completed workspaces out of active view
6. **Each workspace owns its chat** — navigating to a workspace opens its chat with full history

### Architecture

```
Sidebar (workspaces)          Main Panel
┌─────────────────┐    ┌──────────────────────┐
│ ▼ In Progress   │    │  Chat + Streaming     │
│   feature/auth  │───▶│  (workspace context)  │
│   fix/bug-123   │    │                       │
│ ▼ In Review     │    │  [Input bar]          │
│   feat/api-v2   │    └──────────────────────┘
│ ▼ Done          │
│   (archived)    │
└─────────────────┘
```

**Effort: 3 days**

---

## Phase 2: Multi-Tab Chat

Users open multiple chat tabs per workspace (⌘T).

### What to Build

1. **Tab bar** above chat area — shows open tabs with titles
2. **Auto-generated tab titles** from first message
3. **Tab management** — close, reorder, switch with Ctrl+Tab
4. **Tab state persistence** — reopen tabs on restart
5. **⌘T shortcut** — new tab in current workspace

### Implementation

- `chat_tabs` SQLite table: `id, workspace_id, session_id, title, position, created_at`
- Tab bar component between header and messages
- Each tab maps to a Claude session (via `--resume`)

**Effort: 2 days**

---

## Phase 3: Command Palette (⌘K)

Universal search and action launcher.

### What to Build

1. **Modal overlay** triggered by ⌘K
2. **Fuzzy search** across: workspaces, sessions, files, actions
3. **Action items**: New workspace, New chat, Open settings, Switch model, Create PR, Commit & push
4. **Recent actions** shown by default
5. **Keyboard navigation** — arrow keys, Enter to select, Esc to close

### Implementation

- Top-level `CommandPalette` component mounted in App shell
- Global keyboard listener for ⌘K
- Search index built from workspace + session data
- Simple fuzzy match (no external deps needed)

**Effort: 2 days**

---

## Phase 4: Integrated Terminal

### What to Build

1. **Terminal panel** below chat (toggle with Ctrl+`)
2. **xterm.js** for terminal rendering
3. **PTY backend** in Rust (via `portable-pty` crate)
4. **Resize support** — drag handle between chat and terminal
5. **Working directory** synced with workspace repo path

### Implementation

- Add `@xterm/xterm` + `@xterm/addon-fit` to frontend deps
- Rust command: `spawn_pty(cwd)` → returns PTY handle
- Bidirectional IPC: stdin from frontend → PTY, stdout from PTY → frontend events
- Terminal component with fit-to-container and theme matching

**Effort: 3 days**

---

## Phase 5: File Explorer + Diff Viewer

### What to Build

1. **File tree sidebar** (right panel, toggle with ⌥⌘B)
   - Reads workspace directory recursively (with gitignore filtering)
   - Collapsible directories
   - File icons by extension
   - Click to open in editor or diff view

2. **Diff viewer**
   - Shows git diff for workspace changes
   - Side-by-side or unified view
   - Syntax highlighting via highlight.js
   - Line numbers, change markers (+/-)
   - "Mark as viewed" per file

3. **File search** (⌘P)
   - Fuzzy file name search across workspace
   - Quick open → view file content

### Implementation

- Rust command: `list_directory_tree(path, respect_gitignore)` → returns tree JSON
- Rust command: `get_git_diff(repo_path)` → returns parsed diff
- Rust command: `read_file(path)` → returns file content
- React components: `FileTree`, `DiffViewer`, `FileSearch`

**Effort: 4 days**

---

## Phase 6: PR Management + CI Status

### What to Build

1. **Create PR** from workspace (⌘⇧P)
   - Title, description editor
   - Target branch selector
   - Creates via GitHub API

2. **PR status panel** in right sidebar
   - Title, description, reviewers
   - Edit title/description inline
   - Merge button (squash/merge/rebase)

3. **CI/CD status**
   - GitHub Actions job list with status indicators
   - Re-run failed jobs
   - Vercel deployment status
   - Job duration display

4. **Checks tab**
   - Pre-merge checklist: git status, CI, comments, TODOs
   - Block merge until checks pass

### Implementation

- Extend existing `list_pull_requests` + `check_github_auth` commands
- New commands: `create_pull_request`, `merge_pull_request`, `list_ci_checks`, `rerun_ci_job`
- GitHub REST API calls from Rust (or shell out to `gh` CLI)

**Effort: 3 days**

---

## Phase 7: Diff Commenting

### What to Build

1. **Inline comments on diff lines** — click line number to add comment
2. **Multi-line selection** — drag to comment on a range
3. **Markdown rendering** in comments
4. **GitHub sync** — post comments to PR, fetch existing comments
5. **Draft comments** — persist locally before submitting

### Implementation

- SQLite table: `diff_comments (id, workspace_id, file_path, start_line, end_line, content, status, github_comment_id)`
- DiffViewer enhancement: click gutter → inline comment form
- GitHub API integration: `POST /repos/{owner}/{repo}/pulls/{pr}/comments`

**Effort: 2 days**

---

## Phase 8: Planning Mode

### What to Build

1. **Plan creation** — Claude generates a step-by-step plan
2. **Approval flow** — user approves, rejects, or modifies plan steps
3. **Hand-off** — approved plan → launch agent to execute
4. **Plan display** in right sidebar

### Implementation

- Extend chat to detect `plan` message types from Claude
- Plan viewer component with approve/reject buttons per step
- Connect to existing agent launch flow

**Effort: 2 days**

---

## Phase 9: Keyboard Shortcuts

### What to Build

| Shortcut | Action |
|----------|--------|
| ⌘K | Command palette |
| ⌘T | New chat tab |
| ⌘N | New workspace |
| ⌘P | File picker |
| ⌘B | Toggle left sidebar |
| ⌥⌘B | Toggle right sidebar |
| ⌘. | Zen mode (hide both sidebars) |
| ⌘⇧P | Create PR |
| ⌘⇧Y | Commit and push |
| ⌘⇧R | Review code |
| ⌘⇧M | Merge |
| ⌘⇧G | Open in GitHub |
| ⌘⇧L | Pull latest |
| ⌘F | Search in chat/files/terminal |
| ⌘, | Settings |
| ⌘/ | Keyboard shortcuts cheatsheet |
| Ctrl+` | Toggle terminal |
| Ctrl+Tab | Next chat tab |
| 1-9 | Quick model switch |

### Implementation

- Global `useHotkeys` hook registered in App shell
- Shortcut cheatsheet modal (⌘/)
- Each shortcut dispatches to existing functionality

**Effort: 1 day**

---

## Phase 10: Polish + Notifications

### What to Build

1. **Notification sounds** — agent done, review complete, errors
2. **Context meter** — shows how much of Claude's context window is used
3. **Workspace badges** — unread count, status indicators
4. **Running animations** — pulse/spinner on active agents in sidebar
5. **Auto-archive on merge** setting

**Effort: 1 day**

---

## Summary

| Phase | What | Effort | Cumulative |
|-------|------|--------|------------|
| 0 | Warm amber design system | 1 day | 1 day |
| 1 | Workspace architecture | 3 days | 4 days |
| 2 | Multi-tab chat | 2 days | 6 days |
| 3 | Command palette | 2 days | 8 days |
| 4 | Integrated terminal | 3 days | 11 days |
| 5 | File explorer + diff viewer | 4 days | 15 days |
| 6 | PR management + CI status | 3 days | 18 days |
| 7 | Diff commenting | 2 days | 20 days |
| 8 | Planning mode | 2 days | 22 days |
| 9 | Keyboard shortcuts | 1 day | 23 days |
| 10 | Polish + notifications | 1 day | 24 days |

**Total: ~24 working days to full Conductor parity.**

Phases 0-3 (design + workspace + tabs + palette) deliver the highest user-facing impact and should ship first.
