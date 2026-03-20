# Design System — Skill Marketplace

> 本文档是所有 UI 修改的**唯一标准**。后续 Phase 2-8 的所有改动必须严格遵循本规范。
> 项目基于 **shadcn/ui New York 风格 + Tailwind CSS v4**。

---

## 目录

1. [颜色 Token](#1-颜色-token)
2. [字体规范](#2-字体规范)
3. [间距系统](#3-间距系统)
4. [尺寸规范](#4-尺寸规范)
5. [响应式断点](#5-响应式断点)
6. [组件规范](#6-组件规范)
7. [文字截断规则](#7-文字截断规则)
8. [动画规范](#8-动画规范)

---

## 1. 颜色 Token

### 1.1 Primary（品牌主色）

```css
--primary:          oklch(0.52 0.2 265);   /* 主色 — 蓝紫 */
--primary-hover:    oklch(0.45 0.2 265);   /* hover 态加深 */
--primary-light:    oklch(0.93 0.05 265);  /* 浅色背景 */
--primary-foreground: oklch(1 0 0);        /* 白色前景 */
```

> **使用场景**：主要按钮、活跃 Tab、高亮标签、链接

### 1.2 Secondary（辅助色）

```css
--secondary:         oklch(0.98 0.001 286.375); /* 浅灰背景 */
--secondary-hover:  oklch(0.92 0.002 286.375); /* hover 态 */
--secondary-foreground: oklch(0.4 0.015 65);   /* 深色文字 */
```

> **使用场景**：次要按钮、输入框背景、卡片背景

### 1.3 Neutral（灰度系列，至少 6 级）

```css
--gray-50:  oklch(0.99 0 0);
--gray-100: oklch(0.96 0.001 286.375);
--gray-200: oklch(0.92 0.004 286.32);
--gray-300: oklch(0.87 0.006 286.34);
--gray-400: oklch(0.70 0.01 286.36);
--gray-500: oklch(0.55 0.016 285.938);
--gray-600: oklch(0.40 0.015 285.885);
--gray-700: oklch(0.28 0.01 285.83);
--gray-800: oklch(0.18 0.006 285.885);
--gray-900: oklch(0.11 0.005 285.823);
```

> **使用场景**：
> - `--gray-100`：页面背景（light mode）
> - `--gray-200`：边框 `border`
> - `--gray-300`：占位符文字 `placeholder`
> - `--gray-500`：次要文字 `muted-foreground`
> - `--gray-900`：主文字 `foreground`

### 1.4 Semantic（语义色）

```css
--color-success:  oklch(0.65 0.2 145);   /* 成功 */
--color-warning:  oklch(0.75 0.18 85);    /* 警告 */
--color-error:    oklch(0.58 0.24 27);   /* 错误 / destructive */
--color-info:     oklch(0.55 0.18 265);   /* 信息 — 与 primary 相同 */
```

| 语义 | 使用场景 |
|------|----------|
| success | 操作成功提示、确认按钮、点赞活跃态 |
| warning | 警告提示、API Key 未配置提示 |
| error | 删除操作、表单错误、失败提示 |
| info | 信息提示（与 primary 共用） |

### 1.5 Background / Surface / Border

```css
/* Light Mode */
--background:      oklch(1 0 0);         /* 页面背景 — 白色 */
--surface:          oklch(1 0 0);         /* 卡片/面板背景 */
--surface-elevated: oklch(0.99 0 0);     /* 浮层背景（dropdown/tooltip） */
--border:           oklch(0.92 0.004 286.32); /* 默认边框 */
--border-strong:    oklch(0.85 0.006 286.34); /* 强调边框（聚焦/分割线） */

/* Dark Mode */
--background-dark:      oklch(0.141 0.005 285.823);
--surface-dark:        oklch(0.21 0.006 285.885);
--surface-elevated-dark: oklch(0.27 0.006 286.033);
--border-dark:         oklch(1 0 0 / 10%);
--border-strong-dark:  oklch(1 0 0 / 20%);
```

> **重要**：dark mode 色值必须通过 CSS 自定义属性引用，**禁止使用 `slate-*`、`blue-*` 等 Tailwind 内置色**。已有违规（`NotFound.tsx` 使用 `from-slate-50`）需在 Phase 6 修正。

---

## 2. 字体规范

### 2.1 字体族

```css
--font-sans: "Inter", "Noto Sans SC", ui-sans, system-ui, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", ui-monospace, monospace;
```

| 字体 | 用途 |
|------|------|
| Inter | 英文界面文字 |
| Noto Sans SC | 中文字符 |
| JetBrains Mono | 代码、Markdown 渲染 |

### 2.2 字号比例（基于 4px 网格）

```css
--text-xs:   12px;  /* 12/16=0.75rem — 辅助说明、次要标签 */
--text-sm:   14px;  /* 14/16=0.875rem — 正文小号、按钮文字 */
--text-base: 16px;  /* 16/16=1rem — 正文主体 */
--text-lg:   18px;  /* 18/16=1.125rem — 卡片标题、突出正文 */
--text-xl:   20px;  /* 20/16=1.25rem — 页面子标题 */
--text-2xl:  24px;  /* 24/16=1.5rem — 页面标题 */
--text-3xl:  28px;  /* 28/16=1.75rem — Hero 标题 */
--text-4xl:  32px;  /* 32/16=2rem — 大型展示标题 */
--text-5xl:  40px;  /* 40/16=2.5rem — 404 页面标题 */
```

| 场景 | 字号 | 字重 | 行高 |
|------|-------|------|------|
| 正文内容 | `--text-sm` (14px) | 400 | 1.6 |
| 卡片标题 | `--text-sm` (14px) | 600 | — |
| 页面标题 (h1) | `--text-2xl` (24px) | 700 | 1.2 |
| 页面子标题 (h2) | `--text-xl` (20px) | 600 | 1.3 |
| 辅助说明 | `--text-xs` (12px) | 400 | 1.5 |
| Hero 大标题 | `--text-3xl` (28px) | 700 | 1.2 |

### 2.3 字重

| 字重 | 值 | 使用场景 |
|------|---|----------|
| regular | 400 | 正文内容、说明文字 |
| medium | 500 | 次要标题、标签 |
| semibold | 600 | 卡片标题、菜单项 |
| bold | 700 | 页面大标题、重要强调 |

### 2.4 行高规范

```css
--leading-tight:   1.2;  /* 标题 */
--leading-normal:  1.4;  /* 子标题、副标题 */
--leading-relaxed: 1.6;  /* 正文内容（默认） */
--leading-loose:   1.8;  /* 长文本阅读 */
```

---

## 3. 间距系统

基于 **4px 网格**。所有间距必须是 4 的倍数。

```css
--space-1:   4px;   /* 紧凑元素内间距 */
--space-2:   8px;   /* 组件内元素间距（按钮内图标与文字） */
--space-3:   12px;  /* 表单元素内间距 */
--space-4:   16px;  /* 组件内主要间距、卡片内边距 */
--space-5:   20px;  /* 组件间小间距 */
--space-6:   24px;  /* 组件间标准间距 */
--space-8:   32px;  /* 区块间间距 */
--space-10:  40px;  /* 大区块间距 */
--space-12:  48px;  /* 页面内大区块 */
--space-16:  64px;  /* 页面级大区块 */
--space-20:  80px;  /* Hero 区域 */
--space-24:  96px;  /* 超大间距 */
```

### 间距使用场景对照表

| 间距 | 使用场景 |
|------|----------|
| `space-1` (4px) | 按钮内 icon 与文字间距（gap-1） |
| `space-2` (8px) | 标签内多元素、列表项内图标与文字 |
| `space-3` (12px) | 表单标签与输入框间距、表单项之间 |
| `space-4` (16px) | **卡片内边距**（p-4）、按钮间距 |
| `space-5` (20px) | Flex gap-5 — 紧凑列表项之间 |
| `space-6` (24px) | **区块间标准间距**（py-6） |
| `space-8` (32px) | Section 之间的分隔 |
| `space-10` (40px) | 大区块之间 |
| `space-12` (48px) | 页面 main content 上 padding |
| `space-16` (64px) | 大页面 Hero 与内容之间 |

> **禁止在组件内使用 `gap-1` 以外的奇数值**。Tailwind `gap-{n}` 基于 4px 网格，`gap-1`=4px, `gap-2`=8px, `gap-3`=12px, `gap-4`=16px。

---

## 4. 尺寸规范

### 4.1 圆角

| 名称 | 值 | 使用场景 |
|------|----|----------|
| `none` | 0 | 无圆角（分割线、plain 按钮） |
| `sm` | 4px | 小元素：checkbox、badge、small chips |
| `md` | 8px | 输入框、select、下拉项 |
| `lg` | 12px | **按钮默认圆角**、小卡片 |
| `xl` | 16px | **大卡片默认圆角**、模态框 |
| `full` | 9999px | Avatar、pill 标签 |

> **统一规则**：
> - 业务卡片（SkillCard）：统一 `rounded-xl` (12px)
> - 页面大容器：`rounded-2xl` (16px)
> - 按钮、input：`rounded-lg` (8px)
> - 分类 pill：`rounded-full` (9999px)

### 4.2 阴影

```css
/* 阴影层级（对应 Tailwind shadow-*） */
--shadow-sm:  0 1px 2px 0 oklch(0 0 0 / 0.05);       /* 卡片默认、input */
--shadow-md:  0 4px 6px -1px oklch(0 0 0 / 0.1),      /* 悬停卡片 */
             0 2px 4px -2px oklch(0 0 0 / 0.1);
--shadow-lg:  0 10px 15px -3px oklch(0 0 0 / 0.1),     /* 弹窗、浮层 */
             0 4px 6px -4px oklch(0 0 0 / 0.1);
--shadow-xl:  0 20px 25px -5px oklch(0 0 0 / 0.1),    /* 强调弹窗 */
             0 8px 10px -6px oklch(0 0 0 / 0.1);
```

| 层级 | 使用场景 |
|------|----------|
| `--shadow-sm` | 卡片默认、`Card` 组件、`input` 聚焦 |
| `--shadow-md` | `SkillCard` hover、`Button` hover shadow |
| `--shadow-lg` | `Dialog`、`Sheet`、`DropdownMenu` |
| `--shadow-xl` | 强调性弹窗（如确认删除） |

### 4.3 最大内容宽度

```css
--max-width-page:    1280px;   /* 页面最大宽度 */
--max-width-content: 1024px;   /* 主要内容区（不含侧边栏） */
--max-width-text:    720px;    /* 文字内容最大宽度（可读性） */
--max-width-dialog:  480px;   /* Dialog 最大宽度 */
--max-width-sheet:   420px;   /* Sheet 最大宽度 */
```

---

## 5. 响应式断点

> **必须在 CSS 变量或 Tailwind 断点中使用，禁止硬编码数字。**

```css
/* 断点定义 */
--breakpoint-sm: 640px;   /* @media (min-width: 640px)  — Large Phone / Tablet Portrait */
--breakpoint-md: 768px;   /* @media (min-width: 768px)  — Tablet */
--breakpoint-lg: 1024px;  /* @media (min-width: 1024px) — Desktop */
--breakpoint-xl: 1280px;  /* @media (min-width: 1280px) — Large Desktop */
```

### 断点使用场景

| 断点 | 移动端 | 平板 | 桌面 |
|------|--------|------|------|
| `sm:` | — | 部分布局 | 主要布局 |
| `md:` | — | 核心响应点 | 完整布局 |
| `lg:` | — | — | 侧边栏展示 |

| 场景 | Mobile (< 768px) | Tablet (768px~1024px) | Desktop (> 1024px) |
|------|-------------------|----------------------|-------------------|
| 网格列数 | `grid-cols-2` 或 `grid-cols-1` | `md:grid-cols-3` | `lg:grid-cols-4` |
| 侧边导航 | 隐藏（Drawer/Sheet） | 折叠（icon only） | 展开 |
| 搜索框 | 隐藏 | 缩小 | 完整 |
| SkillCard 网格 | 2 列（可能改 1） | 3 列 | 4 列 |
| 内容最大宽度 | 100% | 100% | `max-w-page` |

---

## 6. 组件规范

### 6.1 按钮（Button）

| 属性 | 值 | 说明 |
|------|----|------|
| **高度 sm** | `h-9` (36px) | 紧凑按钮 |
| **高度 md（默认）** | `h-10` (40px) | **标准按钮 — 触摸目标 40px ✅** |
| **高度 lg** | `h-11` (44px) | 主要操作按钮 |
| **变体 primary** | `bg-primary text-primary-foreground hover:bg-primary/90` | 主要操作 |
| **变体 secondary** | `bg-secondary text-secondary-foreground` | 次要操作 |
| **变体 ghost** | `hover:bg-accent` | 轻微操作 |
| **变体 danger** | `bg-destructive text-white` | 破坏性操作（删除） |
| **变体 outline** | `border bg-transparent` | 中性操作 |
| **Icon 按钮** | `size-10` (40px) 或 `size-11` (44px) | 触摸目标 ≥ 40px |

> **触摸目标规范**：所有可点击元素高度 ≥ 40px（Apple HIG / WCAG 2.2），现有 `h-8` (32px) 按钮需在 Phase 5 修正。

### 6.2 输入框（Input / Textarea）

| 属性 | Input | Textarea |
|------|-------|----------|
| **高度** | `h-10` (40px) | `min-h-10`（自适应） |
| **内边距** | `px-3 py-2` | `px-3 py-2` |
| **圆角** | `rounded-lg` (8px) | `rounded-lg` (8px) |
| **边框颜色** | `border-input`（聚焦时 `border-ring`） | 同左 |
| **字号** | `text-sm` (14px) | `text-sm` (14px) |

### 6.3 弹窗（Dialog）

| 属性 | 值 |
|------|----|
| **最大宽度** | `max-w-lg` (480px) |
| **内边距** | `p-6` (24px) |
| **圆角** | `rounded-xl` (12px) |
| **阴影** | `shadow-lg` |
| **Overlay** | `bg-black/50` |
| **标题字号** | `text-lg` (18px) semibold |
| **描述字号** | `text-sm` (14px) `text-muted-foreground` |

### 6.4 抽屉（Sheet）

| 属性 | 值 |
|------|----|
| **最大宽度** | `sm:max-w-sm` (384px) |
| **移动端宽度** | `w-5/6` (83.33%) |
| **内边距** | `p-6` (24px) |
| **圆角** | 继承父级（0，左侧直角） |
| **阴影** | `shadow-lg` |
| **方向** | right（默认）、left、top、bottom |

### 6.5 下拉菜单（DropdownMenu）

| 属性 | 值 |
|------|----|
| **最小宽度** | `min-w-[8rem]` (128px) |
| **内边距** | `p-1` (4px) |
| **项内边距** | `px-2 py-1.5` |
| **圆角** | `rounded-md` (6px) |
| **阴影** | `shadow-md` |

### 6.6 卡片（Card）

| 属性 | 值 |
|------|----|
| **圆角** | `rounded-xl` (12px) |
| **内边距** | `p-6` (24px)（CardContent） |
| **边框** | `border border-border` |
| **阴影** | `shadow-sm`（默认） |
| **hover 阴影** | `hover:shadow-md` |

---

## 7. 文字截断规则

### 7.1 单行截断

```css
/* 强制单行截断 — 必须配合 flex + min-w-0 */
.truncate-single {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

| 场景 | 规则 | 示例 |
|------|------|------|
| 卡片标题 | 最大宽度 `100%`，单行截断 | SkillCard 标题 |
| 导航菜单项 | 最大宽度 `100%`，单行截断 | Sidebar 导航 |
| DropdownMenu 标签 | `truncate` + `min-w-0` | Navbar 用户名/邮箱 |
| 文件名 | 单行截断，hover 显示完整 | — |

> **关键规则**：flex 子元素（尤其是 `flex-1` 的元素）**必须**同时设置 `min-w-0` 才能正常截断，否则 flex 项目会撑开父容器导致截断失效。

### 7.2 多行截断

```css
/* 两行截断 — 默认用于卡片描述 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 三行截断 — 用于摘要、详细描述 */
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

| 场景 | 截断行数 | 说明 |
|------|----------|------|
| 技能卡片描述 | 2 行 | `line-clamp-2` |
| Featured 卡片描述 | 2 行 | `line-clamp-2` |
| 技能详情摘要 | 3 行 | `line-clamp-3` |
| Chat 消息 | 不截断（滚动） | — |
| 代码块 | 不截断（横向滚动） | — |

### 7.3 字符数限制（参考）

| 场景 | 最大字符数（中文） | 最大字符数（英文） |
|------|-------------------|------------------|
| 技能名称 | 30 | 60 |
| 分类标签 | 6 | 12 |
| 按钮文字 | 8 | 16 |
| 卡片描述 | 80 | 160 |

---

## 8. 动画规范

### 8.1 时长层级

```css
--duration-instant: 100ms;   /* 极快 — 仅用于颜色/透明度即时响应 */
--duration-fast:     150ms;   /* 快速交互 — hover 颜色、按钮状态 */
--duration-normal:   250ms;   /* 标准 — 弹窗、面板展开 */
--duration-slow:     350ms;   /* 慢速 — 页面过渡、大型面板 */
--duration-slower:   500ms;  /* 最慢 — Sheet 滑入 */
```

### 8.2 缓动函数

```css
--ease-out:     cubic-bezier(0.16, 1, 0.3, 1);   /* 标准出场动画 */
--ease-in:      cubic-bezier(0.7, 0, 0.84, 0);   /* 标准进场动画 */
--ease-in-out:  cubic-bezier(0.65, 0, 0.35, 1); /* 往复动画 */
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1); /* 弹性动画（可选） */
```

### 8.3 使用场景对照表

| 时长 | 缓动 | 使用场景 |
|------|------|----------|
| 100ms | `ease-out` | `opacity` 即时变化（loading spinner） |
| 150ms | `ease-out` | **按钮 hover 颜色**、`bg` 变化、`shadow` 变化 |
| 150ms | `ease-out` | **SkillCard hover** (`translateY(-2px)` + shadow) |
| 250ms | `ease-out` | **Dialog 显现**、`DropdownMenu` 展开 |
| 250ms | `ease-in-out` | **Tabs 切换内容** |
| 350ms | `ease-in-out` | 面板展开、侧边栏折叠 |
| 500ms | `ease-out` | **Sheet 滑入滑出**（`data-[state=closed]:duration-300`） |

> **注意**：Radix UI 动画使用 `data-[state=open/closed]:animate-in/out` + `duration-*` 类控制。
> Dialog/Select 等组件使用 Framer Motion 时，优先使用 CSS `transition` 而非 JS 动画。

### 8.4 禁止事项

- **禁止**在 `transition` 中使用 `all` 属性，会导致性能问题
- **禁止**为 `transform` 以外的属性添加 `transition`（如 `width`、`height`）
- **禁止**在移动端使用 `prefers-reduced-motion` 未适配的动画

---

## 附录：现有规范与本设计系统的差异清单

以下问题需在后续 Phase 中修正：

| 问题 | 当前状态 | 目标状态 | 修正阶段 |
|------|----------|----------|----------|
| `.flex { min-height:0; min-width:0 }` | 全局污染 | 删除，使用 flex 组件级 | Phase 3 |
| `.container` padding 魔法数字 | `1rem/1.5rem/2rem` | 统一使用 spacing token | Phase 3 |
| Chat panel 高度硬编码 | `560px` | `max-h-[560px]` 允许收缩 | Phase 3 |
| Navbar DropdownMenu 用户名无 truncate | 无截断 | `truncate` + `min-w-0` | Phase 4 |
| Dark mode `--color-blue-*` 未定义 | 引用无效 token | 改用 `oklch()` 值 | Phase 3 |
| Home 2列网格 mobile 太窄 | `grid-cols-2` | `grid-cols-1 sm:grid-cols-2` | Phase 7 |
| 按钮触摸目标 < 40px | `h-8` (32px) | `h-9` (36px) 最小 | Phase 5 |
| SkillCard hover 阴影魔法数字 | `box-shadow: 0 8px 24px` | 使用 `--shadow-md` token | Phase 3 |
| `rounded-xl` vs `rounded-2xl` 混用 | 不一致 | 统一为本规范 | Phase 6 |
| `NotFound.tsx` 使用 `slate-*` | 违反 token 规范 | 改用 design token | Phase 6 |
| 分类 Tab `overflow-x-auto` 顺序 | `scrollbar-hide` 先于 `overflow` | 调换顺序 | Phase 4 |
| Dashboard sidebar 宽度魔法数字 | `280/200-480` | 使用 CSS 变量 | Phase 3 |

---

*最后更新：2026-03-19 | Phase 1 诊断后建立*
