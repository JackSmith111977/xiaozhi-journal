---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories"]
inputDocuments: ["prd.md", "architecture.md", "ux-design-specification.md"]
---

# AI Smart Journal - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for AI Smart Journal, decomposing the requirements from the PRD, UX Design, and Architecture documents into implementable stories.

## Requirements Inventory

### Functional Requirements

- **FR1**: 用户可以选择心情表情（😊 😐 😔 😡 😴）记录当天情绪
- **FR2**: 用户可以输入自由文本来记录日记内容
- **FR3**: 用户可以保存日记条目
- **FR4**: 用户可以查看自己的历史日记列表
- **FR5**: 用户可以查看单条日记的详情（内容 + AI 回应 + 金句）
- **FR6**: 用户保存日记后可获得 AI 回应
- **FR7**: 用户可以收到 AI 提炼的"今日金句"
- **FR8**: 用户可以获得 AI 发现的情绪模式提示
- **FR9**: 用户可以在 AI 回应失败时看到友好的降级提示
- **FR10**: 用户可以查看最近 7 天的情绪趋势波形图
- **FR11**: 用户可以在波形图上看到每条记录对应的心情表情
- **FR12**: 用户在没有数据时可以看到引导性空状态
- **FR13**: 用户可以收到系统推送的历史同日或相似情绪日记提醒
- **FR14**: 用户可以点击查看被推送的历史日记
- **FR15**: 日记数据在本地持久化存储，刷新页面不丢失
- **FR16**: 网络断开时日记仍可保存，AI 调用在网络恢复后异步执行
- **FR17**: 系统可预设示例数据确保首次打开时有展示内容
- **FR18**: 用户可以将金句生成为可分享的卡片图片

### NonFunctional Requirements

- **NFR1**: 首屏加载时间 ≤ 2 秒
- **NFR2**: AI 响应 5-8 秒，超时阈值 15 秒
- **NFR3**: 打字机动画掩盖等待时间，感知延迟 ≤ 3 秒
- **NFR4**: 情绪波形图渲染 ≤ 500ms
- **NFR5**: API Key 不暴露客户端，通过 Route Handler 代理
- **NFR6**: 所有数据存储在本地 IndexedDB，不上传服务器
- **NFR7**: 环境变量通过 .env.local 管理，不提交到版本控制
- **NFR8**: 阿里云百炼 API 失败时系统优雅降级
- **NFR9**: 网络断开时日记数据不丢失，标记 pending 等待重试

### Additional Requirements

- Next.js App Router + TypeScript + TailwindCSS
- shadcn/ui 基础组件 + Aceternity UI 动效组件
- Framer Motion 弹簧动画
- IndexedDB 多表设计（journals + appMeta）
- Zustand 单一 store
- 暖日色板 + 圆角系统 + 阴影系统
- Noto Serif SC + Noto Sans SC 字体
- 自绘 SVG 波形图（非 recharts）
- 响应式 3 断点策略
- WCAG AA 无障碍
- .env.local + .env.example 环境变量

### UX Design Requirements

- **UX-DR1**: 实现「暖日」色板（12 个颜色 Token，Tailwind 配置）
- **UX-DR2**: 实现间距系统（8px 基础，xs-3xl 共 7 级）
- **UX-DR3**: 实现圆角系统（sm=8px ~ full=9999px）
- **UX-DR4**: 实现阴影系统（sm/md/lg 三级暖灰阴影）
- **UX-DR5**: 实现字体系统（Noto Serif SC + Noto Sans SC，7 级字阶）
- **UX-DR6**: 实现 MoodSelector 组件（5 个定制 SVG 表情）
- **UX-DR7**: 实现 WaveChart 组件（自绘 SVG + Framer Motion）
- **UX-DR8**: 实现 QuoteCard 组件（杂志引用样式，3D 翻转）
- **UX-DR9**: 实现 XiaozhiBubble 组件（左侧聊天气泡）
- **UX-DR10**: 实现 TypingIndicator 组件（"小知正在想..."）
- **UX-DR11**: 实现 EmptyState 组件（插画 + 温柔文案）
- **UX-DR12**: 实现响应式布局（375/768/1024 断点）
- **UX-DR13**: 实现按钮层级（Primary/Secondary/Tertiary/Icon）
- **UX-DR14**: 实现反馈模式（成功/错误/等待/提示）
- **UX-DR15**: 实现表单模式（无外框输入框，自适应高度）
- **UX-DR16**: 实现弹窗模式（毛玻璃遮罩，弹性缩放）
- **UX-DR17**: 实现空状态/加载状态处理
- **UX-DR18**: 实现文案规范（朋友语气）
- **UX-DR19**: 实现无障碍（对比度、键盘导航、焦点指示器）

### FR Coverage Map

| FR | 所属 Epic | 覆盖状态 |
|----|-----------|----------|
| FR1, FR2, FR3 | Epic 2: 3 秒心情打卡 | ✅ |
| FR4, FR5 | Epic 5: 日记历史与详情 | ✅ |
| FR6, FR7, FR8, FR9 | Epic 3: AI 温暖回应 | ✅ |
| FR10, FR11, FR12 | Epic 4: 情绪波形图 | ✅ |
| FR13, FR14 | Epic 6: 时间胶囊（P1） | ✅ |
| FR15, FR17 | Epic 1: 项目基础搭建 | ✅ |
| FR16 | Epic 3（隐含） | ✅ |
| FR18 | Epic 7: 金句分享（P2） | ✅ |

## Epic List

### Epic 1: 项目基础搭建
**目标：** 为后续所有 Epic 提供技术基础和演示数据。包含项目初始化、设计系统配置、IndexedDB 设置、种子数据注入。完成后评委打开 App 即可看到演示内容。
**FR 覆盖：** FR15, FR17
**优先级：** P0

### Epic 2: 3 秒心情打卡
**目标：** 用户可以零门槛开始记录 — 选表情、写几句、保存。这是产品的核心入口，3 步内触达价值。
**FR 覆盖：** FR1, FR2, FR3
**优先级：** P0

### Epic 3: AI 温暖回应
**目标：** 用户写完日记后获得"小知"的共情回应、金句和情绪标签。这是产品的灵魂功能——让用户感觉"被理解"。包含 API 代理、打字机动画、金句卡片、Fallback 机制。
**FR 覆盖：** FR6, FR7, FR8, FR9
**优先级：** P0

### Epic 4: 情绪波形图
**目标：** 用户直观"看见"自己 7 天心情变化，产生自我洞察。自绘 SVG + Framer Motion 弹性生长动画，非冷冰冰的数据面板。
**FR 覆盖：** FR10, FR11, FR12
**优先级：** P0

### Epic 5: 日记历史与详情
**目标：** 用户可以回顾过去的日记和 AI 回应，建立自我认知的连续性。
**FR 覆盖：** FR4, FR5
**优先级：** P1

### Epic 6: 时间胶囊（P1）
**目标：** 用户在最恰当的时机被历史共鸣打动 — "一年前的今天，你也这样想过"。
**FR 覆盖：** FR13, FR14
**优先级：** P1

### Epic 7: 金句分享（P2）
**目标：** 用户把被打动的金句分享给别人，天然传播。
**FR 覆盖：** FR18
**优先级：** P2

---

## Epic 1: 项目基础搭建

**目标：** 为后续所有 Epic 提供技术基础和演示数据

### Story 1.1: Next.js 项目初始化 + 设计系统配置

As a 开发者,
I want 初始化 Next.js 项目并配置设计系统,
So that 后续所有开发都有统一的技术基础和视觉 Token。

**Acceptance Criteria:**

**Given** 空的工作目录
**When** 执行 `npx create-next-app@latest ai-smart-journal --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
**Then** 项目可启动，`npm run dev` 后访问 `localhost:3000` 可见默认页面
**And** 安装 `zustand`, `idb`, `framer-motion` 依赖
**And** 初始化 shadcn/ui（`npx shadcn@latest init`），添加 button, card, textarea, dialog, skeleton 组件
**And** Tailwind 配置中包含「暖日」色板（bg-primary `#FDF8F5`, primary `#E8C4A0`, accent `#D4856A` 等 12 个 Token）
**And** Tailwind 配置包含圆角系统（sm=8px ~ full=9999px）和阴影系统（sm/md/lg 三级）
**And** `layout.tsx` 使用 `@next/font/google` 加载 Noto Serif SC 和 Noto Sans SC
**And** `globals.css` 包含 Tailwind 指令和 CSS 自定义属性（色板变量）
**And** 创建 `.env.example` 文件，包含 `DASHSCOPE_API_KEY=sk-xxx`

**Given** `.env.example` 存在
**When** 开发者复制为 `.env.local` 并填入真实 API Key
**Then** 应用启动时无报错
**And** `.gitignore` 包含 `.env.local`

### Story 1.2: IndexedDB 数据层 + Zustand Store

As a 开发者,
I want 创建 IndexedDB 数据层和状态管理 Store,
So that 日记的读写有可靠的本地数据源。

**Acceptance Criteria:**

**Given** 项目已初始化
**When** 在 `lib/db.ts` 中创建 IndexedDB 数据库 `ai-smart-journal`
**Then** 包含 `journals` store（字段：id, content, mood, moodEmoji, aiResponse, goldenQuote, moodLabel, timestamp, status, shareCount）
**And** 包含 `appMeta` store（字段：key, value）
**And** 提供 CRUD 函数：`addJournal()`, `getJournals()`, `getJournalById()`, `updateJournal()`, `setMeta()`, `getMeta()`

**Given** IndexedDB 已初始化
**When** 在 `store/journal.ts` 创建 Zustand store
**Then** 包含 state：`journals: Journal[]`, `loading: boolean`, `error: string | null`
**And** 包含 actions：`fetchJournals()`（从 IndexedDB 读取）, `addJournal()`（写入 DB + 更新 state）, `updateAIResponse()`（更新 AI 回应）
**And** 所有更新使用不可变模式（`set(state => ({ ...state, journals: [...state.journals, new] }))`）

**Given** store 创建完毕
**When** 在页面中使用 `useJournalStore()` 读取数据
**Then** 页面刷新后数据可从 IndexedDB 恢复

### Story 1.3: 种子数据注入 + 空状态引导

As a 首次打开的用户,
I want 看到预设的演示内容和友好的引导,
So that 我不是面对空白页面，能立即理解这个 App 是做什么的。

**Acceptance Criteria:**

**Given** IndexedDB 为空（首次访问）
**When** 应用启动时检查 `appMeta.seedDataLoaded`
**Then** 如果未设置，自动写入 3 条预设日记数据（焦虑/开心/平静，含 AI 回应和金句）
**And** 设置 `appMeta.seedDataLoaded = true`
**And** 3 条数据的 timestamp 分别为 3 天前、昨天、今天

**Given** 无历史数据（非种子场景）
**When** 用户看到首页
**Then** 显示空状态引导（`empty-state.tsx`）：插画 + "你的第一条日记从这里开始 ✨"
**And** 插画有 2s 循环微浮动动画
**And** 引导文案使用朋友语气（UX-DR18）

---

## Epic 2: 3 秒心情打卡

**目标：** 用户可以零门槛开始记录 — 选表情、写几句、保存

### Story 2.1: 心情表情选择器

As a 想要快速记录心情的用户,
I want 看到 5 个清晰的表情按钮,
So that 我可以在 3 秒内选择当天的心情。

**Acceptance Criteria:**

**Given** 用户打开首页
**When** 页面渲染
**Then** 显示 "今天心情怎么样？" 标题（Noto Serif SC, 26px+）
**And** 水平排列 5 个表情按钮：😡 😔 😐 😊 😴
**And** 每个按钮为 56x56px 圆角方形（rounded-full），间距 16px
**And** 按钮使用定制 SVG 图标（非标准 emoji）
**And** hover 时按钮 scale(1.15) 并上浮 2px（Framer Motion spring）

**Given** 用户点击一个表情
**When** 点击事件触发
**Then** 被点击的表情放大至 scale(1.3) 后回弹，背景变为暖珊瑚色
**And** 未选中的表情透明度降至 50%
**And** 日记输入框从下方弹性滑入（Framer Motion spring 动画）

**Given** 用户使用键盘导航
**When** 按 Tab 键聚焦到表情按钮
**Then** 焦点指示器为暖珊瑚色 `outline: 2px solid #D4856A`
**And** 每个表情按钮有 `aria-label`（如"烦躁"、"难过"、"平静"、"开心"、"疲惫"）
**And** 容器使用 `role="radiogroup"`，按钮使用 `role="radio"`

### Story 2.2: 日记输入框 + 保存

As a 选择了心情的用户,
I want 一个温和无压力的输入框写日记,
So that 我可以自由表达今天的感受。

**Acceptance Criteria:**

**Given** 用户已选择心情表情
**When** 输入框出现
**Then** 输入框为聊天气泡风格：无外框，底部 2px 暖灰线，圆角底部（UX-DR15）
**And** placeholder 为 "随便写点什么吧，哪怕只有一句话"
**And** 高度自动增长，最多 200px，超出可滚动
**And** 不显示字数提示
**And** 输入框有温暖的光标闪烁

**Given** 用户在输入框中输入内容
**When** 点击 Primary 按钮（暖珊瑚实心，白字，圆角 12px）或按 Ctrl/Cmd + Enter
**Then** 日记内容 + 心情被保存到 IndexedDB（调用 `addJournal()`）
**And** 输入框淡出
**And** 状态更新为 `pending`
**And** 显示 "记下了 ✨" 成功提示（柔绿背景，3 秒后淡出）

**Given** 用户输入了内容但刷新页面
**When** 页面重新加载
**Then** 输入框中的草稿不丢失（自动保存到 IndexedDB，刷新后可恢复）

---

## Epic 3: AI 温暖回应

**目标：** 用户获得"小知"的共情回应、金句和情绪标签

### Story 3.1: AI 代理 API Route Handler

As a 保存了日记的用户,
I want 系统自动调用 AI 获取回应,
So that 我能收到温暖的回应和金句。

**Acceptance Criteria:**

**Given** 用户提交了一篇日记（status 为 `pending`）
**When** 前端调用 `POST /api/journal`，请求体 `{ content, mood }`
**Then** Route Handler 从 `process.env.DASHSCOPE_API_KEY` 读取 API Key
**And** 以 OpenAI 兼容格式调用阿里云百炼 API
**And** System Prompt 为 PRD 定义的内容（"你是一个温暖、有个性的朋友..."）
**And** 请求 AI 返回 JSON：`{ response: string, goldenQuote: string, moodLabel: string }`
**And** 设置 15 秒超时

**Given** AI 调用成功
**When** 收到响应
**Then** 返回 200：`{ response, goldenQuote, moodLabel, fromFallback: false }`
**And** 更新 IndexedDB 中该日记的 `aiResponse`, `goldenQuote`, `moodLabel`, `status='ai_done'`

**Given** AI 调用超时（>15s）或网络错误
**When** 发生超时或异常
**Then** 返回 200 + `fromFallback: true`
**And** 使用本地 fallback 金句库（`lib/ai.ts` 中预设 5-10 条通用金句）
**And** 更新 IndexedDB 中该日记的 `status='ai_done'`

**Given** AI 返回的 JSON 解析失败
**When** 解析失败
**Then** 重试一次
**And** 如果仍然失败，返回 fallback 数据 + `fromFallback: true`

### Story 3.2: 打字机动画 + 金句卡片

As a 等待 AI 回应的用户,
I want 看到文字逐字出现，然后金句翻转揭示,
So that 等待本身成为情感体验的一部分。

**Acceptance Criteria:**

**Given** 用户提交了日记，AI 调用开始
**When** 等待 AI 响应
**Then** 显示 TypingIndicator 组件："小知正在想..." + 3 个跳动圆点（暖灰色 `#8A817C`）

**Given** AI 响应到达
**When** 响应数据可用
**Then** 先显示 XiaozhiBubble 气泡，使用打字机动画（Aceternity Text Generate Effect，~50ms/字）
**And** 打字机完成后 0.3s，QuoteCard 金句卡片 3D 翻转揭示（0.6s CSS 3D transform）
**And** 金句卡片样式：左侧 3px 暖珊瑚装饰线，Noto Serif SC italic 20px，背景 `#F5EDE4`，圆角 24px
**And** 波形图自动更新新增的心情数据点（弹性弹跳动画）

**Given** 用户开启了 `prefers-reduced-motion`
**When** AI 响应到达
**Then** 打字机动画和翻转动画被跳过，直接显示完整内容

### Story 3.3: 离线处理 + 异步 AI 回调

As a 网络断开时的用户,
I want 日记仍然能保存,
So that 我不会丢失任何记录。

**Acceptance Criteria:**

**Given** 用户网络断开
**When** 用户提交日记
**Then** 日记成功写入 IndexedDB，status 标记为 `pending`
**And** 显示 "日记已保存，小知在路上~"（暖灰提示条，非红色报错）
**And** 不出现任何错误弹窗

**Given** 网络恢复
**When** 浏览器检测到在线
**Then** 自动调用 `POST /api/journal` 处理 pending 状态的日记
**And** AI 回应到达后更新该日记的 `aiResponse`, `goldenQuote`, `status='ai_done'`

---

## Epic 4: 情绪波形图

**目标：** 用户直观"看见"自己 7 天心情变化

### Story 4.1: 自绘 SVG 波形图 + 7 天趋势

As a 想看自己心情变化的用户,
I want 看到过去 7 天的情绪波形图,
So that 我一眼就能了解自己的心情趋势。

**Acceptance Criteria:**

**Given** 用户打开首页
**When** 页面渲染
**Then** 显示 7 天情绪波形图（自绘 SVG `<polyline>`）
**And** 图表尺寸：宽 100%（max 640px），高 120px
**And** 波形线使用渐变色 `#A8C5A0` → `#D4856A`，`stroke-width: 1.5`
**And** Y 轴映射 5 个心情等级（1=😡 到 5=😊）
**And** 入场时有 0.8s 生长动画（Framer Motion `animate`）
**And** 渲染时间 ≤ 500ms（NFR4）

**Given** 波形图有数据
**When** 新的日记数据点出现
**Then** 新数据点以弹性弹跳动画"生长"到波形图上
**And** 每个数据点上方显示对应的心情表情图标

### Story 4.2: Hover 数据点 + 无数据引导

As a 查看波形图的用户,
I want 悬停时看到具体信息,
So that 我能了解某一天的详细心情。

**Acceptance Criteria:**

**Given** 波形图已渲染
**When** 鼠标悬停在数据点上
**Then** 显示 tooltip：日期 + 心情表情 + 日记摘要（前 20 字）
**And** 数据点高亮放大（scale 1.5）

**Given** 波形图无数据（首次使用且种子未加载）
**When** 页面渲染
**Then** 显示一条浅灰色装饰线 + 引导文案："你的第一条日记从这里开始 ✨"
**And** 引导文字使用暖灰色 `#8A817C`，Noto Sans SC 14px

---

## Epic 5: 日记历史与详情

**目标：** 用户可以回顾过去的日记和 AI 回应

### Story 5.1: 历史日记列表

As a 想回顾过去的用户,
I want 按时间顺序查看我的所有日记,
So that 我能回顾自己的心路历程。

**Acceptance Criteria:**

**Given** 用户在首页
**When** 点击底部 Tertiary 文字按钮 "查看过往记录"
**Then** 页面淡入淡出切换到历史列表（0.3s Framer Motion）
**And** 按时间倒序显示所有日记条目
**And** 每条显示：日期、心情表情、日记摘要（前 50 字）、AI 金句（如果有）

**Given** 日记数量较多（>10 条）
**When** 查看列表
**Then** 列表可滚动，每条之间有 16px 间距

### Story 5.2: 单条日记详情

As a 想深入了解某篇日记的用户,
I want 点击查看完整内容,
So that 我能重新阅读日记和 AI 回应。

**Acceptance Criteria:**

**Given** 用户在历史列表中
**When** 点击某条日记
**Then** 展示完整日记：日期、心情表情、正文、小知回应气泡、金句卡片
**And** 布局与首页相同，但内容完整显示

**Given** 用户查看完详情
**When** 点击返回或按 Esc
**Then** 返回历史列表，保持滚动位置

---

## Epic 6: 时间胶囊（P1）

**目标：** 用户被历史共鸣打动

### Story 6.1: 历史匹配逻辑 + 弹窗触发

As a 打开 App 的用户,
I want 在合适的时机被提醒旧日记,
So that 我能感受到"一年前的今天，我也这样想过"的共鸣。

**Acceptance Criteria:**

**Given** 用户有至少 1 条历史日记
**When** 用户完成一次新的日记记录后
**Then** 系统检查是否有历史同日（±3 天）或相似情绪的日记
**And** 如果匹配成功（随机 30% 概率触发，避免过于频繁）
**Then** 准备展示 TimeCapsuleModal

**Given** 时间胶囊触发
**When** 弹窗出现
**Then** 使用 shadcn Dialog + Framer Motion 弹性缩放（scale 0.9 → 1.0, 0.3s）
**And** 背景遮罩为 `rgba(61,61,61,0.4)` + `backdrop-filter: blur(4px)`
**And** 弹窗内显示：匹配的旧日记日期 + 心情 + 金句
**And** 标题为 "一年前的今天，你也这样想过"
**And** 包含 "去看看" 按钮（Secondary）和 "稍后再说" 按钮（Tertiary）

### Story 6.2: 点击查看历史日记

As a 被时间胶囊触动的用户,
I want 点击查看那条旧日记,
So that 我能重温当时的感受。

**Acceptance Criteria:**

**Given** 时间胶囊弹窗已展示
**When** 用户点击"去看看"
**Then** 弹窗关闭
**And** 展示匹配的旧日记详情（复用 Story 5.2 的详情组件）

**Given** 用户点击"稍后再说"或点击遮罩或按 Esc
**When** 关闭弹窗
**Then** 返回首页，不影响当前操作

---

## Epic 7: 金句分享（P2）

**目标：** 用户把被打动的金句分享给别人

### Story 7.1: 金句生成图片

As a 被打动想分享的用户,
I want 把金句生成为一张精致的图片,
So that 我可以截图发到朋友圈或发给朋友。

**Acceptance Criteria:**

**Given** 用户看到金句卡片
**When** 点击金句卡片右上角的分享图标按钮
**Then** 将金句渲染为一张图片（使用 `html-to-image` 或 Canvas）
**And** 图片包含：金句文字、"AI Smart Journal" 水印、日期
**And** 图片样式与金句卡片一致（杂志引用风格）
**And** 图片下载或复制到剪贴板

**Given** 用户已生成分享图片
**When** 图片已保存
**Then** 该日记的 `shareCount` +1
