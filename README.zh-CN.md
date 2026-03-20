# Skill Marketplace

[English](./README.md) | 简体中文

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-brightgreen)](https://nodejs.org)

**Skill Marketplace** 是一个 Web 应用，让你可以直接在浏览器里浏览、预览和运行 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) Skills。无需安装 Claude Code，无需使用 CLI，打开页面就能开始使用任意 Skill。

---

## 功能特性

- ⚡ **在线对话预览** — 多轮对话界面，流式响应
- 📦 **一键从 GitHub 导入** — 粘贴仓库地址，自动查找 `SKILL.md`
- ✍️ **可视化 Skill 编辑器** — 无需手写 markdown，直接创建 Skill

---

## 快速开始

### 环境要求

- Node.js 20+ · pnpm · MySQL 8+
- 一个 [GitHub OAuth App](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)

### 1. 克隆并安装依赖

```bash
git clone https://github.com/<your-username>/skill-marketplace.git
cd skill-marketplace
pnpm install
```

### 2. 创建 GitHub OAuth App

在 **GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App** 中注册：

| 字段 | 值 |
|------|-----|
| Homepage URL | `http://localhost:3000` |
| Authorization callback URL | `http://localhost:3000/api/oauth/github/callback` |

创建后复制 **Client ID** 和 **Client Secret**。

### 3. 配置并启动

```bash
cp .env .env.local
# 编辑 .env.local，填入 DATABASE_URL、JWT_SECRET、GitHub OAuth 密钥和 AI 代理地址

mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS skill_marketplace;"

pnpm db:push
node scripts/seed-skills.mjs
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)，点击「Sign in with GitHub」登录即可。

---

## 配置说明

### GitHub OAuth App

每个部署实例都需要独立的 OAuth App。进入 **GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App** 创建。

### AI 后端（Claude 代理）

Skill Marketplace **不直接调用** Claude API，而是通过一个 Claude 兼容代理转发请求。在 `BUILT_IN_FORGE_API_URL` 和 `CUSTOM_LLM_API_URL` 中配置代理地址。代理需要满足：
- 支持 POST 请求到 `/v1/messages`
- 支持 SSE 流式响应（`stream: true`）
- 返回 Anthropic SSE 格式（`event: content_block_delta` 等）

---

## 常见问题

### 启动时报「Cannot connect to database」

1. 确认 MySQL 正在运行：`mysql -u root -p -e "SELECT 1"`
2. 检查 `.env.local` 中的 `DATABASE_URL` 是否正确
3. 手动创建数据库：`mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS skill_marketplace;"`

### GitHub 登录报「OAuth callback redirect mismatch」

GitHub 上填写的回调地址必须与实际完全一致，常见错误：
- 端口不一致 — 本地开发必须用 `3000` 端口
- 缺少回调路径 — 必须包含 `/api/oauth/github/callback`
- 协议不匹配 — 生产环境用 `https://`，开发环境用 `http://`

### Skill 执行报「Skill execution failed」

1. 确认 `BUILT_IN_FORGE_API_URL` / `CUSTOM_LLM_API_URL` 指向可用的 Claude 代理
2. 确认 API Key 有效且代理服务正常
3. 查看服务端日志获取具体错误信息

---

## License

MIT
