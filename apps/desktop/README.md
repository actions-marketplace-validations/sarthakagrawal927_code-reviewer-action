# CodeVetter Desktop

AI-powered code review and agent orchestration for your Mac.

## Features

- **Workspaces** — Branch-based coding environments with chat, terminal, file explorer, and PR management
- **Agent Squad** — Persona-based AI agents (from ~/.claude/agents/) that work on tasks autonomously
- **Code Review** — Severity-ranked findings, code suggestions, accept/dismiss, post to GitHub
- **Task Board** — Kanban with Linear integration (To Do, In Progress, Review, Test)
- **Session History** — Browse and search past Claude Code and Codex sessions
- **Multi-Agent Coordination** — CRDT-based, agents coordinate without duplicating work

## Prerequisites

- macOS 12+
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed
- [GitHub CLI](https://cli.github.com/) (optional, for PR management)

## Development

```bash
# Install dependencies
npm install

# Run in dev mode (hot reload)
npm run tauri:dev

# Build for release
npm run tauri:build

# Run tests
npm test

# Run e2e tests
npm run test:e2e
```

## Architecture

```
src/                  React frontend (Vite + Tailwind + shadcn/ui)
├── pages/            Home, Workspaces, Board (Agents), History, Settings
├── components/       Shared components (workspace-chat, kanban-board, etc.)
├── components/ui/    shadcn/ui primitives (Button, Card, Dialog, etc.)
├── hooks/            Custom hooks (use-chat-stream)
└── lib/              Utilities (tauri-ipc, utils)

src-tauri/            Rust backend (Tauri 2)
├── src/commands/     IPC command handlers
├── src/coordination/ CRDT agent coordination (Automerge)
├── src/db/           SQLite schema + queries
├── src/adapters/     Claude Code + Codex CLI adapters
└── sidecar/          Bun-compiled review sidecar
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘K | Command palette |
| ⌘/ | Keyboard shortcuts |
| g h | Go to Home |
| g w | Go to Workspaces |
| g b | Go to Board |
| g y | Go to History |
