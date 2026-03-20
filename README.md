# Skill Marketplace

English | [简体中文](./README.zh-CN.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-brightgreen)](https://nodejs.org)

**Skill Marketplace** is a web application that lets you browse, preview, and run [Claude Code](https://docs.anthropic.com/en/docs/claude-code) Skills directly in your browser. No Claude Code install, no CLI — just open the page and use any Skill.

---

## Features

- ⚡ **Live Chat Preview** — Multi-turn conversations with streaming responses
- 📦 **One-Click GitHub Import** — Paste a repo URL; `SKILL.md` is found automatically
- ✍️ **Visual Skill Editor** — Create Skills without writing any markdown

---

## Quick Start

### Prerequisites

- Node.js 20+ · pnpm · MySQL 8+
- A [GitHub OAuth App](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)

### 1. Clone & Install

```bash
git clone https://github.com/<your-username>/skill-marketplace.git
cd skill-marketplace
pnpm install
```

### 2. Create GitHub OAuth App

Register at **GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App**:

| Field | Value |
|-------|-------|
| Homepage URL | `http://localhost:3000` |
| Authorization callback URL | `http://localhost:3000/api/oauth/github/callback` |

Copy the **Client ID** and **Client Secret**.

### 3. Configure & Run

```bash
cp .env .env.local
# Edit .env.local — fill in DATABASE_URL, JWT_SECRET, GitHub OAuth keys, and AI proxy URL

mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS skill_marketplace;"

pnpm db:push
node scripts/seed-skills.mjs
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and click "Sign in with GitHub" to get started.

---

## Configuration

### GitHub OAuth App

Each deployment needs its own OAuth App. Create one at **GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App**.

### AI Backend (Claude Proxy)

Skill Marketplace does **not** call the Claude API directly. Configure a Claude-compatible proxy via `BUILT_IN_FORGE_API_URL` and `CUSTOM_LLM_API_URL`. The proxy must:
- Accept POST requests to `/v1/messages`
- Support SSE streaming (`stream: true`)
- Return Anthropic SSE format (`event: content_block_delta`)

---

## Troubleshooting

### "Cannot connect to database"

1. Verify MySQL is running: `mysql -u root -p -e "SELECT 1"`
2. Check `DATABASE_URL` in `.env.local`
3. Create the database: `mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS skill_marketplace;"`

### "OAuth callback redirect mismatch"

The GitHub callback URL must match exactly:
- Port must be `3000` in local dev
- Must include full path: `/api/oauth/github/callback`
- Use `https://` in production, `http://` in dev

### "Skill execution failed"

1. Confirm `BUILT_IN_FORGE_API_URL` / `CUSTOM_LLM_API_URL` point to a working Claude proxy
2. Verify your API key is valid and the proxy is reachable
3. Check server logs for details

---

## License

MIT
