# Xiaozhi Journal

> 别的日记应用关注记录，我们关注你的感受。

Xiaozhi Journal 是一个提供情感陪伴的 AI 日记应用。通过有温度的 AI 回应和情绪可视化，让用户在记录的同时"被看见"。

## 核心特性

- **3 秒心情打卡** — 选表情、写几句、保存，零门槛开始记录
- **"小知"AI 人格** — 温暖、有态度、不评判，回应像朋友不像客服
- **今日金句** — 把碎碎念提炼成一句诗一样的话，天然可传播
- **情绪波形图** — 7 天趋势一目了然，让用户"看见"自己
- **时间胶囊** — 在最恰当的时机弹出历史共鸣："一年前的今天，你也这样想过"
- **隐私优先** — 数据完全本地存储（IndexedDB），不上传任何服务器
- **离线可用** — 网络断开时日记仍保存，AI 在网络恢复后异步回调

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 16 (App Router) + TypeScript |
| 样式 | TailwindCSS + 「暖日」色板 |
| 组件 | shadcn/ui + Aceternity UI |
| 动画 | Framer Motion |
| 状态管理 | Zustand |
| 数据持久化 | IndexedDB (idb) |
| AI | 阿里云百炼 API (OpenAI 兼容接口) |

## 快速开始

### 前置条件

- Node.js 18+
- npm / pnpm / yarn / bun
- 阿里云百炼 API Key（[获取](https://bailian.console.aliyun.com/)）

### 安装

```bash
cd xiaozhi-journal
npm install
```

### 配置环境变量

```bash
cp .env.example .env.local
```

在 `.env.local` 中填入你的 API Key：

```env
DASHSCOPE_API_KEY=sk-your-api-key-here
```

### 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
xiaozhi-journal/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 根布局 + Google Fonts
│   │   ├── page.tsx            # 首页（波形图 + 心情 + 输入 + AI 回应）
│   │   ├── globals.css         # Tailwind + CSS 变量
│   │   └── api/
│   │       └── journal/
│   │           └── route.ts    # AI 代理 Route Handler
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 基础组件
│   │   ├── mood-selector.tsx   # 5 表情选择器（定制 SVG）
│   │   ├── journal-input.tsx   # 日记输入框（聊天气泡风格）
│   │   ├── emotion-chart.tsx   # 7 天情绪波形图（自绘 SVG）
│   │   ├── golden-quote.tsx    # 金句卡片（3D 翻转）
│   │   ├── typewriter.tsx      # 打字机效果
│   │   ├── xiaozhi-bubble.tsx  # 小知回应气泡
│   │   ├── typing-indicator.tsx# "小知正在想..."
│   │   ├── empty-state.tsx     # 空状态引导
│   │   └── capsule-popup.tsx   # 时间胶囊弹窗
│   ├── lib/
│   │   ├── db.ts               # IndexedDB 初始化 + CRUD
│   │   ├── ai.ts               # AI 调用 + system prompt + fallback
│   │   ├── seed-data.ts        # 演示数据（3 条预设日记）
│   │   └── utils.ts            # 工具函数
│   ├── store/
│   │   └── journal.ts          # Zustand store
│   └── types/
│       └── index.ts            # TypeScript 类型定义
```

## 设计系统

### 「暖日」色板

| Token | 色值 | 用途 |
|---|---|---|
| `bg-primary` | `#FDF8F5` | 页面背景（极浅暖米白） |
| `bg-secondary` | `#F5EDE4` | 卡片/区块背景 |
| `primary` | `#E8C4A0` | 主色（柔棕） |
| `accent` | `#D4856A` | 强调色（暖珊瑚） |
| `text-primary` | `#3D3D3D` | 主文字（深暖灰） |
| `text-secondary` | `#8A817C` | 次要文字（中暖灰） |

### 字体

- 标题/金句：Noto Serif SC
- 正文：Noto Sans SC

## AI 人格：小知

"小知"是一个温暖、有个性、永远不评判的 AI 朋友。它的回应风格：

| 用户输入 | 差的回应 | 好的回应 |
|---|---|---|
| "今天又被老板骂了" | "加油，下次会更好！" | "改了 5 遍还在改，说明你没放弃自己。" |
| "感觉自己很没用" | "不要这样想，你很棒！" | "今天很难吧。但你能把这种感受说出来，本身就说明你在面对。" |
| "今天天气很好，开心！" | "开心是最好的情绪！" | "阳光好的时候心情也好，这种日子适合什么都不做，就发呆。" |

## 数据流

```
用户 → MoodSelector → JournalInput → lib/db.ts (IndexedDB)
                                            ↓
                                    store/journal.ts
                                            ↓
                                app/api/journal/route.ts → 阿里云百炼
                                            ↓
                                    lib/ai.ts (fallback)
                                            ↓
                                EmotionChart (渲染更新)
```

## 离线与降级策略

| 场景 | 处理方式 |
|---|---|
| 网络断开 | 日记先保存到 IndexedDB，标记为 pending，网络恢复后异步调用 AI |
| API 超时 (15s) | 返回本地 fallback 金句，不走 HTTP error |
| JSON 解析失败 | 重试一次，仍失败则使用 fallback |
| 首次访问 | 自动写入 3 条预设演示数据，确保页面不空白 |

## License

MIT
