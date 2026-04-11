# AI Smart Journal

> 别的日记应用关注记录，我们关注你的感受。

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38BDF8?style=for-the-badge&logo=tailwind-css)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

## 📖 简介

AI Smart Journal 是一个提供**情感陪伴**的 AI 日记应用。大多数日记 App 做的是数据存储，真正稀缺的是情绪价值——用户需要的不是被记录，而是被理解。

用户选一个表情、写几句话，就能收到来自「小知」的共情回应和一句说到心坎里的「今日金句」。7 天情绪波形图让你直观看见自己的心情变化，时间胶囊在最恰当的时机弹出历史共鸣。

> **这不是又一个日记 App，而是一面自我认知的镜子。**

## ✨ 核心特性

| 特性 | 说明 |
|------|------|
| 🎯 **3 秒心情打卡** | 5 种表情一键选择，零门槛开始记录 |
| 🤖 **AI 温暖回应** | 小知人格：共情 + 独特视角，不说鸡汤话 |
| 💬 **今日金句** | AI 为每篇日记提炼一句诗意的总结 |
| 📈 **情绪波形图** | 7 天 SVG 自绘波形，直观看见心情起伏 |
| ⏰ **时间胶囊** | 随机弹出历史共鸣："一年前的今天，你也这样想过" |
| 🔒 **全量本地存储** | IndexedDB 持久化，零上传，隐私安全 |
| 🌐 **离线优先** | 断网可写日记，网络恢复后自动同步 AI |
| 🎨 **暖日设计系统** | 暖色调 + 圆角 + 弹簧动画，视觉温暖 |

## 🏗️ 项目结构

```
.
├── ai-smart-journal/          # 主项目（Next.js 全栈应用）
│   ├── src/
│   │   ├── app/               # App Router 页面
│   │   │   ├── api/journal/   # AI API Route Handler
│   │   │   ├── history/       # 日记历史列表页
│   │   │   └── page.tsx       # 首页
│   │   ├── components/        # React 组件
│   │   ├── lib/               # 工具函数（db, ai, seed-data）
│   │   ├── store/             # Zustand 状态管理
│   │   └── types/             # TypeScript 类型定义
│   └── public/                # 静态资源
├── _bmad/                     # BMad 方法论配置
├── _bmad-output/              # 规划产物
│   ├── planning-artifacts/    # PRD、架构、UX、Epics 等
│   └── implementation-artifacts/  # 14 个 Story 开发卡片
└── .claude/                   # Claude 配置
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm / pnpm / yarn / bun

### 安装

```bash
# 进入项目目录
cd ai-smart-journal

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 API Key
```

### 环境变量

```env
DASHSCOPE_API_KEY=sk-your-api-key-here
```

获取 API Key：[阿里云百炼](https://bailian.console.aliyun.com/)

### 开发

```bash
npm run dev
# 访问 http://localhost:3000
```

### 构建

```bash
npm run build
npm run start
```

## 🛠️ 技术栈

| 分类 | 技术 |
|------|------|
| **框架** | Next.js 16.2 (App Router) |
| **语言** | TypeScript 5 |
| **样式** | TailwindCSS 4 |
| **组件** | shadcn/ui |
| **动画** | Framer Motion |
| **状态管理** | Zustand |
| **数据存储** | IndexedDB (idb) |
| **AI 接口** | 阿里云百炼 DashScope (qwen-turbo) |
| **字体** | Noto Serif SC + Noto Sans SC |
| **设计系统** | 暖日色板（自定义） |

## 📐 架构概览

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  首页/组件   │────▶│ Zustand Store│────▶│ IndexedDB   │
│  (Client)   │     │              │     │ (本地存储)   │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                           ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  心情选择器  │────▶│  API Route   │────▶│  DashScope  │
│  日记输入    │     │  (Server)    │     │  (AI API)   │
└─────────────┘     └──────────────┘     └─────────────┘
```

- **客户端渲染**：首页、组件、状态管理均在浏览器运行
- **服务端代理**：AI API Key 通过 Route Handler 代理，不暴露给客户端
- **本地存储**：所有日记数据存储在 IndexedDB，刷新不丢失
- **离线支持**：断网可写日记，标记 pending，网络恢复后自动补调 AI

## 📋 开发方法论

本项目采用 **BMad 方法论** (Build-Measure-Adapt) 进行规划与开发：

1. **需求分析** → PRD 定义产品愿景与功能范围
2. **架构设计** → 技术选型与系统架构决策
3. **UX 设计** → 设计系统与交互规范
4. **Epic 拆解** → 14 个 User Story，覆盖 7 个 Epic
5. **增量交付** → Sprint 开发 + 浏览器自动化测试

完整规划产物见 `_bmad-output/` 目录。

##  Epic 列表

| Epic | 故事数 | 状态 |
|------|--------|------|
| 1. 项目基础搭建 | 3 | ✅ 完成 |
| 2. 3 秒心情打卡 | 2 | ✅ 完成 |
| 3. AI 温暖回应 | 3 | ✅ 完成 |
| 4. 情绪波形图 | 2 | ✅ 完成 |
| 5. 日记历史与详情 | 2 | ✅ 完成 |
| 6. 时间胶囊 | 2 | ✅ 完成 |
| 7. 金句分享 | 1 | ✅ 完成 |

## 🔮 路线图

- [ ] PWA 离线支持（Service Worker）
- [ ] 金句分享图片生成与下载
- [ ] 更多 AI 模型接入
- [ ] 数据导出/导入（JSON）
- [ ] 深色模式支持

## 📝 许可证

MIT License

## 🙏 致谢

- [BMad Method](https://bmad.org/) — 项目规划方法论
- [阿里云百炼](https://bailian.console.aliyun.com/) — AI 能力支持
- [shadcn/ui](https://ui.shadcn.com/) — 组件库基础
- [Framer Motion](https://www.framer.com/motion/) — 动画引擎
