# CodeVetter

AI code review for agent-generated code. Desktop app built with Tauri + React + Rust.

## What it does

- **Reviews agent code** — catches bloat, hallucinated APIs, copy-paste, hardcoded secrets
- **Feedback loop** — sends findings back to the agent, re-reviews until code passes
- **PR review** — reviews GitHub PRs via PAT, posts findings as inline comments
- **Agent orchestration** — kanban board, agent personas, plan/code/review pipeline
- **Duplicate detection** — finds similar functions across the codebase

## Download

macOS desktop app: [Releases](https://github.com/sarthakagrawal927/CodeVetter/releases)

Requires macOS 12+ and an AI provider API key (Anthropic, OpenAI, or OpenRouter).

## Monorepo Layout

```
apps/
  desktop/          Tauri + React + Vite (the product)
  landing-page/     Next.js marketing site (Vercel)
  dashboard/        Next.js web dashboard (on hold)
packages/
  review-core/      Review engine (prompt, scoring, semantic indexing)
  ai-gateway-client/  OpenAI-compatible API client
  shared-types/     Shared TypeScript types
  db/               Database adapters
workers/
  api/              Cloudflare Worker API (on hold)
  review/           Cloudflare Worker for GitHub App webhooks
```

## Development

```bash
# Install dependencies
npm install

# Run desktop app
cd apps/desktop && npm run dev

# Run tests
npm test

# Build desktop app
cd apps/desktop && npx @tauri-apps/cli build
```

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Rust (Tauri), SQLite
- **Review engine**: TypeScript (runs in webview, no server needed)
- **Deployment**: Vercel (landing page), GitHub Actions (DMG release)

## License

MIT
