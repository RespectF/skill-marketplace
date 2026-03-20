/**
 * 预置 17 个 Anthropic 官方 Skills 数据
 * 运行: node scripts/seed-skills.mjs
 */
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { config } from "dotenv";

config({ path: ".env" });

const OFFICIAL_SKILLS = [
  {
    slug: "algorithmic-art",
    title: "算法艺术生成",
    description: "使用算法和数学公式生成独特的视觉艺术作品，包括分形、几何图案、数据可视化艺术等。",
    category: "创意设计",
    isOfficial: true,
    isFeatured: true,
    isEditorsPick: true,
    githubUrl: "https://github.com/anthropics/skills/tree/main/skills/algorithmic-art",
    authorName: "Anthropic",
    uiConfig: JSON.stringify({
      theme: "purple",
      icon: "🎨",
      heroTitle: "算法艺术生成器",
      heroSubtitle: "用数学之美创造视觉艺术，生成独特的分形、几何图案和数据可视化作品",
      features: [
        { icon: "🌀", title: "分形艺术", desc: "生成曼德布罗特集、朱利亚集等经典分形图案" },
        { icon: "📐", title: "几何图案", desc: "创建精确的几何艺术，支持自定义参数" },
        { icon: "🎭", title: "风格迁移", desc: "将数学公式转化为艺术风格" },
      ],
      useCases: ["创意设计项目", "数学可视化教学", "艺术装置创作", "个性化壁纸生成"],
      inputFields: [
        { id: "artType", label: "艺术类型", type: "select", placeholder: "选择艺术类型", options: ["分形艺术", "几何图案", "数据可视化", "抽象艺术"] },
        { id: "description", label: "创意描述", type: "textarea", placeholder: "描述你想要的艺术效果，如颜色、风格、主题...", options: [] },
        { id: "complexity", label: "复杂度", type: "select", placeholder: "选择复杂度", options: ["简单", "中等", "复杂", "极复杂"] },
      ],
      outputType: "image",
      steps: ["描述你想要的艺术风格", "选择算法类型和复杂度", "生成并预览作品", "导出高清图片"],
      tags: ["算法艺术", "分形", "生成艺术", "可视化"],
    }),
    skillMd: `---
name: algorithmic-art
description: Generate unique visual artwork using algorithms and mathematical formulas, including fractals, geometric patterns, and data visualization art.
---

# Algorithmic Art Generator

This skill helps you create stunning algorithmic artwork using mathematical formulas and code.

## Capabilities
- Generate fractal art (Mandelbrot set, Julia sets, etc.)
- Create geometric patterns and tessellations
- Build data visualization art
- Abstract generative art

## Examples
- "Create a colorful Mandelbrot set fractal"
- "Generate a geometric pattern with hexagons"
- "Make abstract art from sine waves"

## Guidelines
- Specify color preferences when possible
- Describe the mood or aesthetic you're going for
- Mention any mathematical concepts you want to incorporate`,
  },
  {
    slug: "brand-guidelines",
    title: "品牌指南助手",
    description: "帮助企业创建和维护一致的品牌形象，包括色彩规范、字体选择、Logo 使用指南等。",
    category: "企业通信",
    isOfficial: true,
    isEditorsPick: true,
    githubUrl: "https://github.com/anthropics/skills/tree/main/skills/brand-guidelines",
    authorName: "Anthropic",
    uiConfig: JSON.stringify({
      theme: "orange",
      icon: "🏷️",
      heroTitle: "品牌指南助手",
      heroSubtitle: "打造一致、专业的品牌形象，从色彩到字体全方位规范品牌视觉体系",
      features: [
        { icon: "🎨", title: "色彩规范", desc: "定义品牌主色、辅助色和使用规范" },
        { icon: "✍️", title: "字体系统", desc: "选择和规范品牌字体组合" },
        { icon: "📋", title: "使用指南", desc: "生成详细的品牌使用规范文档" },
      ],
      useCases: ["新品牌建立", "品牌升级改版", "设计团队协作规范", "对外合作品牌授权"],
      inputFields: [
        { id: "brandName", label: "品牌名称", type: "text", placeholder: "输入你的品牌名称", options: [] },
        { id: "industry", label: "所属行业", type: "select", placeholder: "选择行业", options: ["科技", "金融", "教育", "医疗", "零售", "餐饮", "其他"] },
        { id: "brandValues", label: "品牌价值观", type: "textarea", placeholder: "描述品牌的核心价值观和调性...", options: [] },
      ],
      outputType: "document",
      steps: ["填写品牌基本信息", "描述品牌调性和价值观", "生成品牌规范文档", "导出并分享"],
      tags: ["品牌设计", "视觉规范", "企业形象"],
    }),
    skillMd: `---
name: brand-guidelines
description: Help companies create and maintain consistent brand identity, including color specifications, typography choices, and logo usage guidelines.
---

# Brand Guidelines Assistant

This skill helps you create comprehensive brand guidelines for your organization.

## Capabilities
- Define brand color palettes with hex codes
- Establish typography hierarchies
- Create logo usage rules
- Generate brand voice guidelines

## Examples
- "Create brand guidelines for a tech startup called TechFlow"
- "Define color palette for a healthcare company"
- "Write brand voice guidelines for a luxury brand"`,
  },
  {
    slug: "canvas-design",
    title: "画布设计工具",
    description: "在画布上创建精美的视觉设计，支持图形、文字、图层等元素的组合与排版。",
    category: "创意设计",
    isOfficial: true,
    githubUrl: "https://github.com/anthropics/skills/tree/main/skills/canvas-design",
    authorName: "Anthropic",
    uiConfig: JSON.stringify({
      theme: "pink",
      icon: "🖼️",
      heroTitle: "画布设计工具",
      heroSubtitle: "在数字画布上自由创作，轻松实现专业级视觉设计效果",
      features: [
        { icon: "🎭", title: "元素组合", desc: "图形、文字、图片自由组合" },
        { icon: "📐", title: "精准排版", desc: "像素级精准的布局控制" },
        { icon: "🌈", title: "丰富样式", desc: "渐变、阴影、滤镜效果" },
      ],
      useCases: ["社交媒体配图", "海报设计", "演示文稿封面", "产品展示图"],
      inputFields: [
        { id: "designType", label: "设计类型", type: "select", placeholder: "选择设计类型", options: ["社交媒体图", "海报", "Banner", "名片", "封面"] },
        { id: "description", label: "设计需求", type: "textarea", placeholder: "描述你的设计需求...", options: [] },
        { id: "size", label: "尺寸规格", type: "select", placeholder: "选择尺寸", options: ["1080x1080", "1920x1080", "800x600", "自定义"] },
      ],
      outputType: "image",
      steps: ["选择设计类型和尺寸", "描述设计需求和风格", "生成设计方案", "调整并导出"],
      tags: ["设计", "画布", "视觉创作"],
    }),
    skillMd: `---
name: canvas-design
description: Create beautiful visual designs on canvas with support for graphics, text, layers, and layout combinations.
---

# Canvas Design Tool

Create professional visual designs with this comprehensive canvas design skill.

## Capabilities
- Design social media graphics
- Create posters and banners
- Layout presentations
- Generate product mockups`,
  },
  {
    slug: "claude-api",
    title: "Claude API 文档助手",
    description: "提供 Claude API 的完整文档和使用指南，帮助开发者快速集成和使用 Anthropic 的 AI 能力。",
    category: "开发技术",
    isOfficial: true,
    isFeatured: true,
    githubUrl: "https://github.com/anthropics/skills/tree/main/skills/claude-api",
    authorName: "Anthropic",
    uiConfig: JSON.stringify({
      theme: "blue",
      icon: "🤖",
      heroTitle: "Claude API 文档助手",
      heroSubtitle: "快速掌握 Claude API，从入门到精通，构建强大的 AI 应用",
      features: [
        { icon: "📚", title: "完整文档", desc: "涵盖所有 API 端点和参数说明" },
        { icon: "💻", title: "代码示例", desc: "多语言代码示例，开箱即用" },
        { icon: "🔧", title: "调试助手", desc: "帮助排查 API 调用问题" },
      ],
      useCases: ["API 集成开发", "代码调试", "功能探索", "最佳实践学习"],
      inputFields: [
        { id: "question", label: "你的问题", type: "textarea", placeholder: "例如：如何使用 Claude API 进行流式输出？", options: [] },
        { id: "language", label: "编程语言", type: "select", placeholder: "选择语言", options: ["Python", "JavaScript", "TypeScript", "Go", "Java", "其他"] },
        { id: "useCase", label: "使用场景", type: "text", placeholder: "描述你的使用场景", options: [] },
      ],
      outputType: "code",
      steps: ["描述你的 API 使用需求", "选择编程语言", "获取代码示例和说明", "复制并集成到项目"],
      tags: ["API", "开发文档", "Claude", "集成"],
    }),
    skillMd: `---
name: claude-api
description: Provides complete documentation and usage guides for the Claude API, helping developers quickly integrate and use Anthropic's AI capabilities.
---

# Claude API Documentation Assistant

This skill provides comprehensive guidance for using the Claude API.

## Capabilities
- API endpoint documentation
- Code examples in multiple languages
- Authentication and rate limiting guidance
- Best practices and patterns

## Examples
- "Show me how to make a basic API call"
- "How do I implement streaming responses?"
- "What are the token limits for Claude?"`,
  },
  {
    slug: "doc-coauthoring",
    title: "文档协作编写",
    description: "智能文档协作助手，帮助团队共同创建、编辑和完善各类文档，提升写作效率和质量。",
    category: "企业通信",
    isOfficial: true,
    isEditorsPick: true,
    githubUrl: "https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring",
    authorName: "Anthropic",
    uiConfig: JSON.stringify({
      theme: "teal",
      icon: "✍️",
      heroTitle: "智能文档协作助手",
      heroSubtitle: "AI 驱动的文档协作，让团队写作更高效、更专业",
      features: [
        { icon: "📝", title: "智能续写", desc: "根据上下文智能补全文档内容" },
        { icon: "🔍", title: "内容优化", desc: "提升文档逻辑性和可读性" },
        { icon: "🌐", title: "多语言", desc: "支持中英文文档互译和润色" },
      ],
      useCases: ["技术文档编写", "产品需求文档", "商业计划书", "报告撰写"],
      inputFields: [
        { id: "docType", label: "文档类型", type: "select", placeholder: "选择文档类型", options: ["技术文档", "产品需求", "商业报告", "会议纪要", "其他"] },
        { id: "content", label: "现有内容", type: "textarea", placeholder: "粘贴你已有的文档内容，或描述文档主题...", options: [] },
        { id: "requirement", label: "改进需求", type: "text", placeholder: "例如：使内容更简洁、添加案例、优化结构", options: [] },
      ],
      outputType: "document",
      steps: ["选择文档类型", "输入现有内容或主题", "描述改进需求", "获取优化后的文档"],
      tags: ["文档", "协作", "写作助手"],
    }),
    skillMd: `---
name: doc-coauthoring
description: Intelligent document collaboration assistant that helps teams create, edit, and improve various documents to enhance writing efficiency and quality.
---

# Document Co-authoring Assistant

Collaborate with AI to create better documents faster.

## Capabilities
- Intelligent content completion
- Document structure optimization
- Style and tone consistency
- Multi-language support`,
  },
  {
    slug: "docx",
    title: "Word 文档处理",
    description: "专业的 Word 文档创建和编辑工具，支持格式化、样式设置、表格、图表等丰富功能。",
    category: "文档处理",
    isOfficial: true,
    githubUrl: "https://github.com/anthropics/skills/tree/main/skills/docx",
    authorName: "Anthropic",
    uiConfig: JSON.stringify({
      theme: "blue",
      icon: "📝",
      heroTitle: "Word 文档处理",
      heroSubtitle: "专业级 Word 文档创建与编辑，格式完美，一键生成",
      features: [
        { icon: "📋", title: "模板支持", desc: "丰富的文档模板，快速开始" },
        { icon: "📊", title: "表格图表", desc: "自动生成格式化表格和图表" },
        { icon: "🎨", title: "样式设置", desc: "专业的文档排版和样式" },
      ],
      useCases: ["报告生成", "合同文档", "简历制作", "学术论文"],
      inputFields: [
        { id: "docTitle", label: "文档标题", type: "text", placeholder: "输入文档标题", options: [] },
        { id: "content", label: "文档内容", type: "textarea", placeholder: "描述文档内容或粘贴原始文本...", options: [] },
        { id: "style", label: "文档风格", type: "select", placeholder: "选择风格", options: ["商务正式", "学术规范", "简洁现代", "创意活泼"] },
      ],
      outputType: "document",
      steps: ["输入文档标题和内容", "选择文档风格", "生成格式化文档", "下载 .docx 文件"],
      tags: ["Word", "文档", "办公"],
    }),
    skillMd: `---
name: docx
description: Professional Word document creation and editing tool with support for formatting, styles, tables, charts, and rich features.
---

# Word Document Processor

Create and edit professional Word documents with ease.

## Capabilities
- Create formatted .docx files
- Apply professional styles and themes
- Generate tables and charts
- Support for headers, footers, and page numbering`,
  },
  {
    slug: "frontend-design",
    title: "前端界面设计",
    description: "AI 驱动的前端 UI 设计助手，帮助开发者快速设计和实现美观、响应式的用户界面。",
    category: "开发技术",
    isOfficial: true,
    isFeatured: true,
    isEditorsPick: true,
    githubUrl: "https://github.com/anthropics/skills/tree/main/skills/frontend-design",
    authorName: "Anthropic",
    uiConfig: JSON.stringify({
      theme: "purple",
      icon: "💻",
      heroTitle: "前端界面设计助手",
      heroSubtitle: "AI 驱动的 UI 设计，从原型到代码，一站式前端开发体验",
      features: [
        { icon: "🎨", title: "UI 组件", desc: "生成可复用的 React/Vue 组件" },
        { icon: "📱", title: "响应式设计", desc: "自动适配各种屏幕尺寸" },
        { icon: "⚡", title: "代码生成", desc: "直接输出可用的前端代码" },
      ],
      useCases: ["快速原型设计", "组件库开发", "页面重构", "设计稿转代码"],
      inputFields: [
        { id: "component", label: "组件描述", type: "textarea", placeholder: "描述你想要的 UI 组件，例如：一个带搜索功能的下拉菜单...", options: [] },
        { id: "framework", label: "前端框架", type: "select", placeholder: "选择框架", options: ["React", "Vue", "HTML/CSS", "Tailwind CSS", "其他"] },
        { id: "style", label: "设计风格", type: "select", placeholder: "选择风格", options: ["现代简约", "Material Design", "Glassmorphism", "Neumorphism", "暗色主题"] },
      ],
      outputType: "code",
      steps: ["描述 UI 组件需求", "选择技术栈和风格", "生成组件代码", "复制到项目中使用"],
      tags: ["前端", "UI设计", "React", "组件"],
    }),
    skillMd: `---
name: frontend-design
description: AI-powered frontend UI design assistant that helps developers quickly design and implement beautiful, responsive user interfaces.
---

# Frontend Design Assistant

Design and build beautiful user interfaces with AI assistance.

## Capabilities
- Generate React/Vue components
- Create responsive layouts
- Apply design systems (Material, Tailwind, etc.)
- Convert designs to code`,
  },
  {
    slug: "internal-comms",
    title: "内部通信助手",
    description: "帮助企业撰写高质量的内部通信内容，包括公告、邮件、会议纪要、周报等。",
    category: "企业通信",
    isOfficial: true,
    githubUrl: "https://github.com/anthropics/skills/tree/main/skills/internal-comms",
    authorName: "Anthropic",
    uiConfig: JSON.stringify({
      theme: "green",
      icon: "📢",
      heroTitle: "企业内部通信助手",
      heroSubtitle: "专业的企业内部通信写作，让每一条信息都清晰、有力、专业",
      features: [
        { icon: "📧", title: "邮件撰写", desc: "各类商务邮件的专业写作" },
        { icon: "📋", title: "会议纪要", desc: "结构化的会议记录和行动项" },
        { icon: "📊", title: "工作报告", desc: "周报、月报、项目报告生成" },
      ],
      useCases: ["全员公告", "项目进展汇报", "跨部门协作沟通", "绩效反馈"],
      inputFields: [
        { id: "commType", label: "通信类型", type: "select", placeholder: "选择类型", options: ["全员公告", "部门邮件", "会议纪要", "工作报告", "绩效反馈"] },
        { id: "topic", label: "主题内容", type: "textarea", placeholder: "描述通信的主要内容和要点...", options: [] },
        { id: "tone", label: "语气风格", type: "select", placeholder: "选择语气", options: ["正式严肃", "友好专业", "简洁直接", "鼓励激励"] },
      ],
      outputType: "document",
      steps: ["选择通信类型", "描述主要内容", "选择语气风格", "生成专业文本"],
      tags: ["企业通信", "邮件", "报告"],
    }),
    skillMd: `---
name: internal-comms
description: Help companies write high-quality internal communications including announcements, emails, meeting minutes, and weekly reports.
---

# Internal Communications Assistant

Create professional internal communications that engage and inform your team.

## Capabilities
- Write company-wide announcements
- Draft professional emails
- Create meeting minutes
- Generate progress reports`,
  },
  {
    slug: "mcp-builder",
    title: "MCP 服务器生成器",
    description: "快速构建 Model Context Protocol (MCP) 服务器，扩展 Claude 的工具调用能力。",
    category: "开发技术",
    isOfficial: true,
    isFeatured: true,
    isEditorsPick: true,
    githubUrl: "https://github.com/anthropics/skills/tree/main/skills/mcp-builder",
    authorName: "Anthropic",
    uiConfig: JSON.stringify({
      theme: "blue",
      icon: "🔌",
      heroTitle: "MCP 服务器生成器",
      heroSubtitle: "快速构建 MCP 服务器，让 Claude 拥有无限扩展能力",
      features: [
        { icon: "⚡", title: "快速生成", desc: "几分钟内生成完整的 MCP 服务器代码" },
        { icon: "🔧", title: "工具定义", desc: "自动生成工具定义和参数验证" },
        { icon: "📦", title: "开箱即用", desc: "包含完整的项目结构和依赖" },
      ],
      useCases: ["API 集成", "数据库连接", "文件系统操作", "外部服务集成"],
      inputFields: [
        { id: "serverName", label: "服务器名称", type: "text", placeholder: "例如：my-database-mcp", options: [] },
        { id: "tools", label: "工具描述", type: "textarea", placeholder: "描述你需要的工具，例如：查询数据库、发送邮件、读取文件...", options: [] },
        { id: "language", label: "开发语言", type: "select", placeholder: "选择语言", options: ["TypeScript", "Python", "Go"] },
      ],
      outputType: "code",
      steps: ["定义服务器名称", "描述需要的工具", "选择开发语言", "生成完整项目代码"],
      tags: ["MCP", "工具开发", "API集成"],
    }),
    skillMd: `---
name: mcp-builder
description: Quickly build Model Context Protocol (MCP) servers to extend Claude's tool-calling capabilities.
---

# MCP Server Builder

Build custom MCP servers to give Claude access to any tool or service.

## Capabilities
- Generate complete MCP server projects
- Define custom tools with proper schemas
- Create authentication handlers
- Build resource providers`,
  },
  {
    slug: "pdf",
    title: "PDF 文档处理",
    description: "强大的 PDF 文档处理工具，支持 PDF 创建、解析、提取、合并等全面操作。",
    category: "文档处理",
    isOfficial: true,
    githubUrl: "https://github.com/anthropics/skills/tree/main/skills/pdf",
    authorName: "Anthropic",
    uiConfig: JSON.stringify({
      theme: "red",
      icon: "📄",
      heroTitle: "PDF 文档处理器",
      heroSubtitle: "全面的 PDF 处理能力，创建、解析、提取，一切尽在掌握",
      features: [
        { icon: "📑", title: "内容提取", desc: "从 PDF 中提取文字、表格、图片" },
        { icon: "✏️", title: "PDF 创建", desc: "从内容生成格式精美的 PDF" },
        { icon: "🔍", title: "智能解析", desc: "理解 PDF 结构和内容语义" },
      ],
      useCases: ["合同文档处理", "报告生成", "表单数据提取", "文档转换"],
      inputFields: [
        { id: "operation", label: "操作类型", type: "select", placeholder: "选择操作", options: ["创建 PDF", "提取内容", "分析结构", "生成摘要"] },
        { id: "content", label: "内容/需求", type: "textarea", placeholder: "描述 PDF 内容或粘贴要处理的文本...", options: [] },
        { id: "format", label: "输出格式", type: "select", placeholder: "选择格式", options: ["PDF", "Markdown", "纯文本", "JSON"] },
      ],
      outputType: "document",
      steps: ["选择操作类型", "输入内容或需求", "处理文档", "下载结果"],
      tags: ["PDF", "文档处理", "内容提取"],
    }),
    skillMd: `---
name: pdf
description: Powerful PDF document processing tool supporting PDF creation, parsing, extraction, and merging operations.
---

# PDF Document Processor

Handle all your PDF needs with this comprehensive processing skill.

## Capabilities
- Extract text, tables, and images from PDFs
- Create formatted PDF documents
- Analyze document structure
- Generate document summaries`,
  },
  {
    slug: "pptx",
    title: "PowerPoint 演示文稿",
    description: "智能 PPT 生成工具，根据内容自动创建专业、美观的演示文稿，支持多种主题和布局。",
    category: "文档处理",
    isOfficial: true,
    isEditorsPick: true,
    githubUrl: "https://github.com/anthropics/skills/tree/main/skills/pptx",
    authorName: "Anthropic",
    uiConfig: JSON.stringify({
      theme: "orange",
      icon: "📊",
      heroTitle: "智能 PPT 生成器",
      heroSubtitle: "输入主题，自动生成专业演示文稿，告别 PPT 制作烦恼",
      features: [
        { icon: "🎨", title: "主题设计", desc: "多种专业主题，一键应用" },
        { icon: "📊", title: "图表生成", desc: "数据自动转化为可视化图表" },
        { icon: "🖼️", title: "布局优化", desc: "智能排版，视觉效果出色" },
      ],
      useCases: ["商业提案", "项目汇报", "培训课件", "学术演讲"],
      inputFields: [
        { id: "topic", label: "演示主题", type: "text", placeholder: "例如：2024年Q3产品战略规划", options: [] },
        { id: "outline", label: "内容大纲", type: "textarea", placeholder: "描述演示文稿的主要内容和结构...", options: [] },
        { id: "style", label: "设计风格", type: "select", placeholder: "选择风格", options: ["商务专业", "科技感", "简约清新", "创意活泼", "学术严谨"] },
      ],
      outputType: "document",
      steps: ["输入演示主题", "描述内容大纲", "选择设计风格", "生成并下载 PPT"],
      tags: ["PPT", "演示文稿", "办公"],
    }),
    skillMd: `---
name: pptx
description: Intelligent PPT generation tool that automatically creates professional, beautiful presentations based on content, supporting multiple themes and layouts.
---

# PowerPoint Presentation Generator

Create stunning presentations automatically with AI assistance.

## Capabilities
- Generate complete slide decks from outlines
- Apply professional themes and layouts
- Create data visualizations and charts
- Support multiple design styles`,
  },
  {
    slug: "skill-creator",
    title: "Skill 创建器",
    description: "帮助你快速创建高质量的 Claude Code Skills，包括 SKILL.md 编写、功能设计和最佳实践指导。",
    category: "工具",
    isOfficial: true,
    isFeatured: true,
    githubUrl: "https://github.com/anthropics/skills/tree/main/skills/skill-creator",
    authorName: "Anthropic",
    uiConfig: JSON.stringify({
      theme: "purple",
      icon: "✨",
      heroTitle: "Skill 创建器",
      heroSubtitle: "快速创建专业的 Claude Code Skills，让 AI 更好地服务你的需求",
      features: [
        { icon: "📝", title: "SKILL.md 生成", desc: "自动生成规范的 SKILL.md 文件" },
        { icon: "🎯", title: "功能设计", desc: "帮助规划 Skill 的核心功能" },
        { icon: "✅", title: "最佳实践", desc: "遵循 Anthropic 官方最佳实践" },
      ],
      useCases: ["创建自定义工作流", "封装专业知识", "自动化重复任务", "团队技能共享"],
      inputFields: [
        { id: "skillName", label: "Skill 名称", type: "text", placeholder: "例如：代码审查助手", options: [] },
        { id: "purpose", label: "功能目的", type: "textarea", placeholder: "描述这个 Skill 要解决什么问题，实现什么功能...", options: [] },
        { id: "examples", label: "使用示例", type: "textarea", placeholder: "列举 2-3 个典型使用场景...", options: [] },
      ],
      outputType: "code",
      steps: ["定义 Skill 名称和目的", "描述核心功能", "提供使用示例", "生成 SKILL.md 文件"],
      tags: ["Skill开发", "工具创建", "自动化"],
    }),
    skillMd: `---
name: skill-creator
description: Help you quickly create high-quality Claude Code Skills, including SKILL.md writing, feature design, and best practice guidance.
---

# Skill Creator

Build better Claude Code Skills faster with AI assistance.

## Capabilities
- Generate well-structured SKILL.md files
- Design skill capabilities and interfaces
- Apply Anthropic's best practices
- Create example prompts and guidelines`,
  },
  {
    slug: "slack-gif-creator",
    title: "Slack GIF 创建器",
    description: "为 Slack 工作区创建有趣的自定义 GIF 表情，活跃团队氛围，提升沟通趣味性。",
    category: "创意设计",
    isOfficial: true,
    githubUrl: "https://github.com/anthropics/skills/tree/main/skills/slack-gif-creator",
    authorName: "Anthropic",
    uiConfig: JSON.stringify({
      theme: "pink",
      icon: "🎬",
      heroTitle: "Slack GIF 创建器",
      heroSubtitle: "为团队创建专属 GIF 表情，让工作沟通更有趣",
      features: [
        { icon: "🎭", title: "自定义表情", desc: "创建团队专属的 GIF 表情包" },
        { icon: "⚡", title: "快速生成", desc: "描述即可生成，无需设计技能" },
        { icon: "🎨", title: "风格多样", desc: "卡通、像素、写实多种风格" },
      ],
      useCases: ["团队庆祝表情", "项目里程碑纪念", "节日祝福", "幽默日常沟通"],
      inputFields: [
        { id: "description", label: "GIF 描述", type: "textarea", placeholder: "描述你想要的 GIF 内容，例如：一只跳舞的猫...", options: [] },
        { id: "style", label: "动画风格", type: "select", placeholder: "选择风格", options: ["卡通可爱", "像素艺术", "简约线条", "搞笑夸张"] },
        { id: "emotion", label: "情感主题", type: "select", placeholder: "选择情感", options: ["庆祝", "加油", "感谢", "搞笑", "惊喜"] },
      ],
      outputType: "image",
      steps: ["描述 GIF 内容", "选择动画风格", "生成 GIF 预览", "下载并上传到 Slack"],
      tags: ["GIF", "Slack", "表情包", "团队文化"],
    }),
    skillMd: `---
name: slack-gif-creator
description: Create fun custom GIF emojis for Slack workspaces to liven up team atmosphere and enhance communication.
---

# Slack GIF Creator

Create custom animated GIFs for your Slack workspace.

## Capabilities
- Generate custom emoji GIFs
- Create animated stickers
- Design team celebration animations
- Build reaction GIFs`,
  },
  {
    slug: "theme-factory",
    title: "主题工厂",
    description: "快速生成完整的 UI 主题系统，包括颜色方案、字体配对、间距规范，适用于各类设计项目。",
    category: "创意设计",
    isOfficial: true,
    githubUrl: "https://github.com/anthropics/skills/tree/main/skills/theme-factory",
    authorName: "Anthropic",
    uiConfig: JSON.stringify({
      theme: "orange",
      icon: "🎭",
      heroTitle: "UI 主题工厂",
      heroSubtitle: "一键生成完整的 UI 主题系统，从颜色到字体，设计规范全搞定",
      features: [
        { icon: "🎨", title: "色彩系统", desc: "生成协调的主色、辅助色、语义色" },
        { icon: "✍️", title: "字体配对", desc: "推荐最佳字体组合方案" },
        { icon: "📐", title: "设计规范", desc: "间距、圆角、阴影完整规范" },
      ],
      useCases: ["新项目主题设计", "品牌视觉升级", "设计系统建立", "暗色模式适配"],
      inputFields: [
        { id: "mood", label: "设计调性", type: "select", placeholder: "选择调性", options: ["专业商务", "活泼年轻", "科技感", "自然清新", "奢华高端"] },
        { id: "primaryColor", label: "主色调", type: "text", placeholder: "输入颜色名称或 HEX 值，例如：#3B82F6 或 蓝色", options: [] },
        { id: "platform", label: "应用平台", type: "select", placeholder: "选择平台", options: ["Web 应用", "移动端", "桌面应用", "通用"] },
      ],
      outputType: "code",
      steps: ["选择设计调性", "指定主色调", "选择应用平台", "生成完整主题配置"],
      tags: ["UI主题", "设计系统", "色彩"],
    }),
    skillMd: `---
name: theme-factory
description: Quickly generate complete UI theme systems including color schemes, font pairings, and spacing specifications for various design projects.
---

# Theme Factory

Generate complete, cohesive UI themes for your projects.

## Capabilities
- Create color palettes with semantic tokens
- Recommend font pairings
- Define spacing and sizing systems
- Generate dark/light mode variants`,
  },
  {
    slug: "web-artifacts-builder",
    title: "Web 工件构建器",
    description: "快速构建可交互的 Web 工件，包括数据可视化、交互式图表、小型 Web 应用等。",
    category: "开发技术",
    isOfficial: true,
    isEditorsPick: true,
    githubUrl: "https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder",
    authorName: "Anthropic",
    uiConfig: JSON.stringify({
      theme: "teal",
      icon: "🌐",
      heroTitle: "Web 工件构建器",
      heroSubtitle: "快速构建可交互的 Web 组件，数据可视化、小工具一键生成",
      features: [
        { icon: "📊", title: "数据可视化", desc: "图表、仪表盘、数据展示" },
        { icon: "🎮", title: "交互组件", desc: "可操作的 UI 组件和小工具" },
        { icon: "⚡", title: "即时预览", desc: "实时预览生成的 Web 工件" },
      ],
      useCases: ["数据展示看板", "交互式演示", "小工具开发", "原型快速验证"],
      inputFields: [
        { id: "artifactType", label: "工件类型", type: "select", placeholder: "选择类型", options: ["数据图表", "交互表单", "计算器", "游戏", "可视化工具"] },
        { id: "description", label: "功能描述", type: "textarea", placeholder: "详细描述你想要构建的 Web 工件...", options: [] },
        { id: "data", label: "示例数据", type: "textarea", placeholder: "如有数据，请粘贴在此（可选）", options: [] },
      ],
      outputType: "code",
      steps: ["选择工件类型", "描述功能需求", "提供示例数据", "生成可运行代码"],
      tags: ["Web开发", "可视化", "交互组件"],
    }),
    skillMd: `---
name: web-artifacts-builder
description: Quickly build interactive web artifacts including data visualizations, interactive charts, and small web applications.
---

# Web Artifacts Builder

Create interactive web components and applications instantly.

## Capabilities
- Build data visualizations and charts
- Create interactive UI components
- Develop small web applications
- Generate embeddable widgets`,
  },
  {
    slug: "webapp-testing",
    title: "Web 应用测试",
    description: "自动化 Web 应用测试助手，帮助生成测试用例、执行功能测试、发现潜在问题。",
    category: "开发技术",
    isOfficial: true,
    githubUrl: "https://github.com/anthropics/skills/tree/main/skills/webapp-testing",
    authorName: "Anthropic",
    uiConfig: JSON.stringify({
      theme: "green",
      icon: "🧪",
      heroTitle: "Web 应用测试助手",
      heroSubtitle: "自动化测试用例生成，让 Web 应用质量更有保障",
      features: [
        { icon: "📋", title: "测试用例", desc: "自动生成全面的测试用例" },
        { icon: "🔍", title: "问题发现", desc: "识别潜在的 Bug 和边界情况" },
        { icon: "📊", title: "测试报告", desc: "生成详细的测试覆盖报告" },
      ],
      useCases: ["功能测试", "回归测试", "API 测试", "UI 自动化测试"],
      inputFields: [
        { id: "appUrl", label: "应用 URL", type: "text", placeholder: "输入要测试的应用地址", options: [] },
        { id: "feature", label: "测试功能", type: "textarea", placeholder: "描述需要测试的功能或页面...", options: [] },
        { id: "testType", label: "测试类型", type: "select", placeholder: "选择测试类型", options: ["功能测试", "UI测试", "API测试", "性能测试", "安全测试"] },
      ],
      outputType: "code",
      steps: ["输入应用地址", "描述测试目标", "选择测试类型", "生成测试脚本"],
      tags: ["测试", "自动化", "质量保证"],
    }),
    skillMd: `---
name: webapp-testing
description: Automated web application testing assistant that helps generate test cases, execute functional tests, and discover potential issues.
---

# Web Application Testing Assistant

Automate your web application testing with AI assistance.

## Capabilities
- Generate comprehensive test cases
- Create Playwright/Cypress test scripts
- Identify edge cases and potential bugs
- Generate test coverage reports`,
  },
  {
    slug: "xlsx",
    title: "Excel 电子表格",
    description: "智能 Excel 文件处理工具，支持数据分析、图表生成、公式计算、报表制作等功能。",
    category: "文档处理",
    isOfficial: true,
    githubUrl: "https://github.com/anthropics/skills/tree/main/skills/xlsx",
    authorName: "Anthropic",
    uiConfig: JSON.stringify({
      theme: "green",
      icon: "📈",
      heroTitle: "Excel 智能处理器",
      heroSubtitle: "数据分析、图表生成、报表制作，Excel 操作全自动化",
      features: [
        { icon: "📊", title: "数据分析", desc: "自动分析数据，发现规律和趋势" },
        { icon: "📈", title: "图表生成", desc: "数据自动转化为专业图表" },
        { icon: "🔢", title: "公式计算", desc: "复杂公式自动生成和计算" },
      ],
      useCases: ["财务报表", "数据分析报告", "销售统计", "项目进度跟踪"],
      inputFields: [
        { id: "task", label: "处理任务", type: "select", placeholder: "选择任务", options: ["创建表格", "数据分析", "生成图表", "制作报表", "数据清洗"] },
        { id: "data", label: "数据内容", type: "textarea", placeholder: "粘贴数据或描述表格结构...", options: [] },
        { id: "output", label: "输出要求", type: "text", placeholder: "描述期望的输出格式和内容", options: [] },
      ],
      outputType: "document",
      steps: ["选择处理任务", "输入数据内容", "描述输出要求", "生成 Excel 文件"],
      tags: ["Excel", "数据分析", "报表"],
    }),
    skillMd: `---
name: xlsx
description: Intelligent Excel file processing tool supporting data analysis, chart generation, formula calculation, and report creation.
---

# Excel Spreadsheet Processor

Handle all your Excel needs with intelligent automation.

## Capabilities
- Create formatted spreadsheets
- Analyze data and generate insights
- Build charts and visualizations
- Apply complex formulas and functions`,
  },
];

async function seed() {
  const dbUrl = new URL(process.env.DATABASE_URL);
  const connection = await mysql.createConnection({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || '3306'),
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.replace(/^\//, ''),
    ssl: { rejectUnauthorized: false }
  });
  const db = drizzle(connection);

  console.log("🌱 开始预置官方 Skills 数据...");

  for (const skill of OFFICIAL_SKILLS) {
    try {
      await connection.execute(
        `INSERT INTO skills (slug, title, description, category, skillMd, coverUrl, githubUrl, isOfficial, isFeatured, isEditorsPick, viewCount, authorName, uiConfig)
         VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           description = VALUES(description),
           category = VALUES(category),
           skillMd = VALUES(skillMd),
           githubUrl = VALUES(githubUrl),
           isOfficial = VALUES(isOfficial),
           isFeatured = VALUES(isFeatured),
           isEditorsPick = VALUES(isEditorsPick),
           authorName = VALUES(authorName),
           uiConfig = VALUES(uiConfig)`,
        [
          skill.slug,
          skill.title,
          skill.description,
          skill.category,
          skill.skillMd,
          skill.githubUrl || null,
          skill.isOfficial ? 1 : 0,
          skill.isFeatured ? 1 : 0,
          skill.isEditorsPick ? 1 : 0,
          Math.floor(Math.random() * 500) + 50,
          skill.authorName,
          skill.uiConfig,
        ]
      );
      console.log(`  ✅ ${skill.title}`);
    } catch (err) {
      console.error(`  ❌ ${skill.title}:`, err.message);
    }
  }

  console.log("\n✨ 数据预置完成！");
  await connection.end();
}

seed().catch(console.error);
