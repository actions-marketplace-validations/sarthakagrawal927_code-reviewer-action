# AI Code Review Competitive Landscape
**Date**: 2026-03-22
**Purpose**: Understand the competitive landscape for CodeVetter

---

## Table of Contents
1. [Greptile](#1-greptile)
2. [CodeRabbit](#2-coderabbit)
3. [Superset](#3-superset)
4. [Conductor](#4-conductor)
5. [Ellipsis](#5-ellipsis)
6. [Qodo (formerly CodiumAI)](#6-qodo-formerly-codiumai)
7. [Sourcery](#7-sourcery)
8. [Bito](#8-bito)
9. [What The Diff](#9-what-the-diff)
10. [Other Notable Players](#10-other-notable-players)
11. [Anthropic Claude Code /review](#11-anthropic-claude-code-review)
12. [Competitive Summary Matrix](#12-competitive-summary-matrix)
13. [Key Takeaways for CodeVetter](#13-key-takeaways-for-codevetter)

---

## 1. Greptile

**Website**: https://www.greptile.com
**Category**: AI Code Review (codebase-aware)
**Funding**: Eyeing $180M valuation

### What They Do
Greptile indexes your entire repository to build a semantic code graph -- mapping structure, relationships, dependencies, and patterns. When a PR is opened, it performs multi-hop investigation: tracing dependencies, checking git history, and following leads across files. Built on Anthropic Claude Agent SDK (v3+).

### How It Works
- GitHub App (also GitLab)
- Installs as a bot that comments on PRs
- Also has Slack, Jira, Notion, Google Drive, Sentry, VS Code integrations
- Separate "Chat" product for codebase Q&A

### Pricing
| Tier | Price | Details |
|------|-------|---------|
| Cloud | $30/seat/month | 50 reviews included, $1/additional review |
| Enterprise | Custom | Self-hosted, SSO/SAML, GitHub Enterprise |
| Chat (separate) | $20/user/month | Unlimited codebase queries |
| API | $0.45/request | For custom integrations |
| Open Source | Free | 100% off |
| Startups | 50% off | |

14-day free trial, no credit card required. Up to 20% off on annual prepaid.

### Custom Rules / Learning
- Write rules in plain English or point to a markdown file
- Automatically absorbs .cursorrules, claude.md, agents.md
- Rules can target specific repos, file paths, or code patterns
- Learns from PR comments -- reads every engineer's PR comments to learn standards
- Tracks thumbs-up/thumbs-down reactions to adapt over time
- Infers new rules from team behavior

### Unique Differentiators
- Highest benchmark score: 82% bug catch rate (vs CodeRabbit 44%, Copilot 54%)
- Deep codebase graph -- understands cross-file impact
- Multi-hop agent investigation on every PR
- Actively ingests team context files (claude.md, cursorrules)

### Agent-Generated Code Review
Not specifically marketed for this, but the codebase-aware approach applies equally to agent-written and human-written code.

---

## 2. CodeRabbit

**Website**: https://www.coderabbit.ai
**Category**: AI Code Review (broadest platform support)

### What They Do
The most widely installed AI code review app on GitHub/GitLab. Provides line-by-line code suggestions, PR summaries, and real-time chat within PRs. Can generate unit tests, draft documentation, or open issues in Jira/Linear directly from PR context. 2M+ repos connected, 13M+ PRs processed.

### How It Works
- GitHub App, GitLab, Bitbucket, Azure DevOps
- Bot comments on PRs with inline suggestions
- Interactive: you can chat with @coderabbitai in PR comments
- IDE reviews (VS Code)

### Pricing
| Tier | Price | Details |
|------|-------|---------|
| Free | $0 | PR summarization, IDE reviews, unlimited repos (public + private) |
| Pro | $24/mo (annual) or $30/mo | Unlimited PR reviews, Jira/Linear, SAST, analytics, docstrings |
| Enterprise | Custom | Self-hosted, multi-org, SLA, RBAC |

14-day free trial of Pro. Only charged for developers who create PRs (seats are reassignable).

### Custom Rules / Learning
- `.coderabbit.yaml` config file for project-specific rules
- Path-based instructions: custom guidelines per file glob pattern
- AST-grep rules: precise code structure matching via abstract syntax tree
- Learns from chat: tell @coderabbitai what you do/don't want and it remembers
- Automatically closes conversations when suggested fixes are applied

### Unique Differentiators
- Broadest platform support (GitHub, GitLab, Bitbucket, Azure DevOps)
- Free tier that actually works (unlimited repos, PR summarization)
- Interactive chat within PRs -- can ask it to generate tests, docs, issues
- Code graph analysis + real-time web query for documentation context
- Massive scale (2M+ repos) -- the "default choice" for many teams

### Agent-Generated Code Review
Not specifically positioned for agent code, but interactive chat model works well for iterating on agent output.

---

## 3. Superset

**Website**: https://superset.sh
**Category**: Agent Orchestration / Parallel Development
**Note**: This is NOT a code review tool -- it's an agent orchestrator similar to Conductor.

### What They Do
Desktop app for running 10+ CLI-based coding agents in parallel (Claude Code, Codex, OpenCode, Aider), each in its own Git worktree with its own branch. Built-in diff viewer for reviewing agent changes before merging.

### How It Works
- Desktop app (Mac, with other platforms planned)
- Each agent gets an isolated Git worktree
- Unified dashboard to monitor all agents
- Built-in diff viewer with syntax highlighting
- Agent-agnostic (works with any terminal-based coding tool)

### Pricing
| Tier | Price | Details |
|------|-------|---------|
| Free | $0 | Open source (Apache 2.0) |
| Pro | $20/seat/month | Advanced features |

You still pay your agent provider (API keys, Claude Max, etc.) separately.

### Unique Differentiators
- Open source (Apache 2.0) -- Conductor is NOT open source
- Agent-agnostic (any CLI tool, not just Claude Code + Codex)
- Built by 3 ex-YC CTOs
- 512 upvotes on Product Hunt launch (Mar 2026)

### Relevance to CodeVetter
Superset is what CodeVetter's "Workspaces + Agents" direction could look like if taken further. The built-in diff viewer is a code review surface for agent output, which is directly comparable to what CodeVetter does.

---

## 4. Conductor

**Website**: https://www.conductor.build
**Category**: Agent Orchestration / Parallel Development
**YC Company**

### What They Do
Mac app for orchestrating teams of coding agents (Claude Code and Codex) working simultaneously in isolated Git worktrees. Dashboard view of all agents, review + merge interface.

### How It Works
- Native Mac app (Apple Silicon required; Intel planned, no Windows/Linux)
- Creates parallel agents in isolated Git worktrees
- Real-time visibility into what each agent is doing
- Code review and merge built in
- Uses your existing Claude Code / Codex auth (API key, Pro, or Max plan)

### Pricing
| Tier | Price | Details |
|------|-------|---------|
| Free | $0 | The app itself is free |

You pay for your Claude Code / Codex usage separately. Conductor adds no marginal cost.

### Unique Differentiators
- Completely free
- Trusted by builders at Linear, Vercel, Notion, Stripe
- Zero-friction setup -- uses your existing Claude login
- Purpose-built for Claude Code + Codex (not agent-agnostic like Superset)

### Relevance to CodeVetter
Conductor is the most direct comparison to CodeVetter's original vision. The key question: what does CodeVetter offer that Conductor doesn't? Conductor is free, polished, and YC-backed. CodeVetter needs to differentiate on review depth, rules, or targeting a different workflow.

---

## 5. Ellipsis

**Website**: https://www.ellipsis.dev
**Category**: AI Code Review + Code Generation
**YC Company**

### What They Do
AI code reviewer that also generates code fixes. Reviews every PR for bugs, anti-patterns, security vulnerabilities, and style guide violations. Can read a reviewer's comment and auto-generate a commit with the fix. Actually executes generated code to verify it works.

### How It Works
- GitHub App (also GitLab)
- Reviews every commit automatically
- Auto-generates fixes from reviewer comments
- PR summaries and weekly codebase change summaries

### Pricing
| Tier | Price | Details |
|------|-------|---------|
| Single tier | $20/user/month | Unlimited usage, reviews on every commit, PR summaries, code gen, Q&A |

7-day free trial. SOC 2 Type 1 certified. Does not persist source code.

### Custom Rules / Learning
- Write style guides in natural language
- Learns which comment types your team values over time
- Customizes reviews based on team feedback patterns

### Unique Differentiators
- Actually executes generated code before suggesting fixes
- Generates commits directly from reviewer comments (not just suggestions)
- Weekly codebase change summaries
- SOC 2 Type 1 certified
- Simple single-tier pricing

### Agent-Generated Code Review
Not specifically marketed, but the auto-fix capability is especially useful for iterating on agent output -- reviewer says "fix this," Ellipsis generates the commit.

---

## 6. Qodo (formerly CodiumAI)

**Website**: https://www.qodo.ai
**Category**: AI Code Integrity Platform (review + testing + code gen)
**Recognition**: Named Visionary in 2026 Gartner Magic Quadrant for AI Code Assistants

### What They Do
"Review-first" platform with 15+ specialized agentic workflows. Goes beyond PR review into test generation, security scanning, and documentation. Multi-repo context engine that indexes across repositories. Context Engine claims 80% accuracy in understanding codebases (vs competitors at 45-74%).

### How It Works
- GitHub App for PR reviews
- IDE plugin (VS Code, JetBrains) -- the core product
- 15+ agentic workflows (review, test gen, docstrings, etc.)
- CLI available

### Pricing
| Tier | Price | Details |
|------|-------|---------|
| Developer (Free) | $0 | 75 PRs/month, 250 LLM credits |
| Teams | $19-30/user/month | 2,500 credits, PR automation |
| Enterprise | $45+/user/month | SSO, on-prem, priority support |

### Custom Rules / Learning
- Customizable review rules per project
- 15+ specialized workflow templates
- Context Engine learns codebase patterns across repos

### Unique Differentiators
- Strongest test generation capability in the market
- 15+ specialized agentic workflows (not just review)
- Multi-repo context engine (80% accuracy claim)
- Gartner Magic Quadrant Visionary recognition
- IDE-first approach -- not just a GitHub bot

### Agent-Generated Code Review
Qodo's test generation is arguably more useful for agent code than pure review -- it can generate tests to verify agent output is correct.

---

## 7. Sourcery

**Website**: https://www.sourcery.ai
**Category**: AI Code Review (multi-reviewer approach)

### What They Do
Uses a series of specialized AI reviewers each with different focuses (complexity, security, style, etc.) to review code from multiple angles. Combines AI review with its own static analysis engine. Supports 30+ programming languages.

### How It Works
- GitHub App / GitLab integration
- IDE plugin (VS Code, PyCharm)
- Multiple specialized AI "reviewers" run in parallel
- Static analysis engine on top of AI
- Validation process to reduce false positives before presenting results

### Pricing
| Tier | Price | Details |
|------|-------|---------|
| Free | $0 | Public repos only |
| Pro | $12/user/month | Full reviews, private repos, limited security |
| Team | Custom | Full security reviews, repo analytics |

20% discount on annual billing.

### Custom Rules / Learning
- Define custom "Review Rules" -- what to look for in specific areas
- Add existing coding standards, style guides, contributing guidelines as rules
- Learns from developer feedback -- dismissing noise trains future reviews
- Custom rules via sourcery-rules repository/config

### Unique Differentiators
- Multiple specialized reviewers (not one monolithic pass)
- Hybrid approach: AI + static analysis engine
- Most affordable paid tier ($12/user/month)
- Open-source rules repository
- Validation step specifically to cut false positives

### Agent-Generated Code Review
No specific agent-code features.

---

## 8. Bito

**Website**: https://bito.ai
**Category**: AI Code Review + Codebase Intelligence
**Key Feature**: AI Architect (live knowledge graph)

### What They Do
AI code review with a unique "AI Architect" -- a live knowledge graph that maps APIs, modules, and dependencies across your codebase. Reviews are context-aware at the architectural level. Validates PRs against Jira tickets and Confluence docs.

### How It Works
- GitHub App, GitLab, Bitbucket
- IDE plugin (VS Code)
- AI Architect maintains live knowledge graph of your system
- Reviews validate against Jira tickets and Confluence docs
- CI/CD pipeline integration

### Pricing
| Tier | Price | Details |
|------|-------|---------|
| Team | $15/user/month | Custom guidelines, Jira integration, CI/CD reviews |
| Professional | $25/user/month | + self-hosted option, learning system |
| Enterprise | Custom | + Confluence, on-prem, multi-org, SLA |

14-day free trial, no credit card. Supports 50+ languages.

### Custom Rules / Learning
- Custom review guidelines you define
- **Learned Rules**: Auto-creates rules from negative feedback
  - 3 negative signals on a pattern -> rule auto-enables
  - GitHub: checkbox feedback; GitLab: emoji reactions; Bitbucket: comments
  - Dashboard to manage learned rules
  - Only negative feedback triggers learning (positive feedback does nothing)
- Validates PRs against Jira tickets to ensure alignment

### Unique Differentiators
- AI Architect: live knowledge graph of your entire system
- Jira + Confluence validation (ensures code matches requirements)
- Auto-learning from negative feedback (3-strike rule creation)
- CI/CD pipeline review integration
- Self-hosted option on Professional tier (unusual at that price point)

### Agent-Generated Code Review
The Jira validation feature is uniquely useful for agent code -- ensuring agent output actually matches the ticket requirements, not just generating plausible code.

---

## 9. What The Diff

**Website**: https://whatthediff.ai
**Category**: PR Description Generator (lightweight)

### What They Do
Primarily an automated PR description generator, not a full code reviewer. Reads the diff and writes a plain-English summary of what changed. Also generates changelogs and weekly progress reports.

### How It Works
- GitHub App / GitLab
- Reads PR diffs via API
- Generates plain-English descriptions
- No source code storage

### Pricing
| Tier | Price | Details |
|------|-------|---------|
| Free | $0 | 25K tokens |
| Starter | $19/month | 200K tokens |
| Unlimited | $199/month | Unlimited tokens |

Token-based pricing. Average PR uses ~2,300 tokens. No per-seat pricing.

### Features
- Automated PR descriptions
- Rich summary notifications for non-technical stakeholders
- Public changelogs (shareable) or JSON API
- Weekly progress reports
- Inline AI refactoring suggestions
- Multi-language support (translates summaries)
- Fine-grained settings: skip CI PRs, delay drafts, limit token consumption

### Custom Rules / Learning
None documented.

### Unique Differentiators
- Simplest tool in the space -- does one thing well (PR descriptions)
- Token-based pricing (not per-seat) -- good for small teams with many PRs
- Non-technical stakeholder features (translated summaries, changelogs)
- Privacy-focused: no code storage, no training on user code

### Agent-Generated Code Review
Not applicable. This is a description/summary tool, not a bug-finding reviewer.

---

## 10. Other Notable Players

### Graphite Agent
- Full code review platform built around stacked PRs
- Acquired in Dec 2025; unified Diamond (AI reviewer) + Chat into "Graphite Agent"
- Built on Claude; focuses on logic errors and edge cases
- Team plan: $40/month (includes AI reviews, stacking, merge queue)
- Unhelpful comment rate under 3%; developers change code 55% of the time it flags an issue
- Best for teams willing to adopt stacked PR workflow

### BugBot (Cursor)
- Built into Cursor IDE and GitHub workflow
- Launched July 2025; reviews 2M+ PRs monthly
- Runs 8 parallel review passes with randomized diff order per PR
- ~$40/user/month as add-on to Cursor plans
- Best for teams already using Cursor IDE

### Panto AI
- Unified AI code review + AppSec platform
- Combines static analysis, secrets detection, dependency scanning, IaC security
- Claims 14x more refactoring opportunities than Greptile, 5x more performance optimizations
- Newer entrant, less established

### CodeAnt AI
- Bundles PR reviews, SAST, secrets detection, IaC scanning, SCA, DORA metrics
- Supports all 4 major git platforms
- Zero false positives but fewer total comments
- More security-focused than review-focused

### Traycer AI
- Good categorization of issues (bug, performance, security, clarity)
- Simple setup, solid second-tier tool
- Less thorough than Qodo or Greptile

### Google Conductor (Gemini CLI extension)
- Different product from Conductor.build
- Gemini CLI extension for structured planning
- Added "Automated Reviews" -- checks AI-generated code against project standards
- Static + logic analysis, checks against specs/plans, style guides, security

---

## 11. Anthropic Claude Code /review

**The built-in competitor that all these tools must justify their existence against.**

### What It Does
Multi-agent code review system built into Claude Code. Multiple agents analyze the diff in parallel, each looking for a different class of issue. Verification step checks candidates against actual code behavior. Results are deduplicated, ranked by severity, posted as inline GitHub comments.

### How It Works
- Available for Claude Teams and Enterprise users
- Runs in the cloud on Anthropic infrastructure
- `/code-review` command in Claude Code CLI
- Also available as a plugin for CI/CD
- Reviews take ~20 minutes on average

### Pricing
- Included with Claude Teams/Enterprise subscription
- Individual review cost: $15-$25 per review (based on PR size/complexity)
- No separate subscription -- uses your Claude Code quota

### Performance
- PRs >1,000 lines: findings in 84% of cases, avg 7.5 issues per review
- PRs <50 lines: findings in 31% of cases, avg 0.5 issues per review

### Limitations
- Expensive per review ($15-$25) vs $1 incremental on Greptile
- No persistent learning or custom rules (yet)
- No team-level analytics or dashboards
- Requires Claude Teams/Enterprise (not available on Pro/free)
- 20-minute review time is slow vs competitors (seconds to minutes)

---

## 12. Competitive Summary Matrix

| Tool | Price (per user/mo) | Free Tier | Platform | Custom Rules | Learning | Unique Angle |
|------|---------------------|-----------|----------|--------------|----------|-------------|
| **Greptile** | $30 | Trial only | GitHub, GitLab | Yes (English/MD) | Yes (from PRs + reactions) | Deepest codebase graph, 82% catch rate |
| **CodeRabbit** | $24 | Yes (basic) | GH, GL, BB, Azure | Yes (YAML + AST) | Yes (from chat) | Broadest platform, interactive chat |
| **Superset** | $0-20 | Yes (OSS) | Desktop (agent orchestrator) | N/A | N/A | Open-source agent orchestrator |
| **Conductor** | Free | Yes | Desktop (Mac only) | N/A | N/A | Free agent orchestrator, YC-backed |
| **Ellipsis** | $20 | Trial only | GitHub, GitLab | Yes (natural language) | Yes (implicit) | Auto-generates fix commits |
| **Qodo** | $0-45 | Yes (250 credits) | GH + IDE | Yes | Yes (context engine) | Test gen + 15 workflows, Gartner Visionary |
| **Sourcery** | $12 | Yes (public) | GH, GL + IDE | Yes (rules) | Yes (from feedback) | Cheapest paid, multi-reviewer + static |
| **Bito** | $15-25 | Trial only | GH, GL, BB | Yes (guidelines) | Yes (3-strike auto-rules) | AI Architect knowledge graph, Jira validation |
| **What The Diff** | $19-199 (token) | Yes (25K) | GH, GL | No | No | PR descriptions, not review. Cheapest entry. |
| **Claude /review** | $15-25/review | No | CLI + GitHub | No (yet) | No | Multi-agent, deepest analysis per PR |
| **Graphite Agent** | $40 | No | GitHub | Unknown | Unknown | Stacked PRs + review + merge queue |
| **BugBot (Cursor)** | ~$40 | No | Cursor + GitHub | Unknown | Unknown | 8 parallel passes, 2M+ PRs/month |

---

## 13. Key Takeaways for CodeVetter

### The Market Has Split Into Two Categories

**Category A: PR Review Bots** (Greptile, CodeRabbit, Ellipsis, Qodo, Sourcery, Bito)
- Install as GitHub App, review every PR automatically
- Compete on: accuracy, false positive rate, learning, rules, platform breadth
- Pricing: $12-30/user/month
- **Greptile leads on accuracy (82%), CodeRabbit leads on adoption (2M repos)**

**Category B: Agent Orchestrators** (Conductor, Superset, Claude Squad)
- Desktop apps for running multiple AI agents in parallel
- Built-in diff viewers to review agent output
- Pricing: Free to $20/month
- **Conductor is free and YC-backed; Superset is open source**

### Where CodeVetter Sits
CodeVetter straddles both categories -- it's a desktop app (like Category B) that does code review (like Category A). This is both an opportunity and a risk:

**Opportunity**: No one tool does both well. Conductor/Superset have basic diff views but no deep AI review. Greptile/CodeRabbit have deep review but no agent orchestration.

**Risk**: CodeVetter could be seen as "worse than Conductor at orchestration AND worse than Greptile at review."

### Critical Questions
1. **Should CodeVetter be a review bot (GitHub App) instead of / in addition to a desktop app?** Every successful review tool is a GitHub App. Desktop-only limits adoption.
2. **What does CodeVetter's review catch that Claude Code /review doesn't?** The /review command costs $15-25 per review and takes 20 min. If CodeVetter can deliver 80% of that quality at $0 incremental cost, that's compelling.
3. **Does CodeVetter have a learning/rules feature?** Every serious competitor does. This is table stakes.
4. **Is the agent-code angle real?** 41% of commits are now AI-assisted. Reviewing agent output is a genuine pain point. But no tool has truly specialized in this -- it's an opportunity.

### Pricing Benchmarks
- Budget option: Sourcery at $12/user/month
- Mid-range: Bito $15, Qodo $19, Ellipsis $20, CodeRabbit $24
- Premium: Greptile $30, Graphite $40, BugBot ~$40
- Free: Conductor (orchestrator), CodeRabbit (basic), Qodo (250 credits)

### Features That Are Now Table Stakes
1. GitHub/GitLab integration (as a bot, not just CLI)
2. Custom review rules (in English or YAML)
3. Learning from feedback (thumbs up/down, chat corrections)
4. PR summaries and descriptions
5. Inline suggestions with one-click apply

### Features That Differentiate
1. Codebase-wide context graph (Greptile, Bito AI Architect)
2. Test generation alongside review (Qodo)
3. Auto-fix commits from reviewer comments (Ellipsis)
4. Jira/ticket validation (Bito)
5. Agent orchestration + review in one tool (nobody does this well yet)
6. Stacked PR workflow (Graphite)
