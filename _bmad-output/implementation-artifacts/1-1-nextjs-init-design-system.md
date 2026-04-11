Status: review

# Story 1.1: Next.js 项目初始化 + 设计系统配置

## Story

As a 开发者,
I want 初始化 Next.js 项目并配置设计系统,
so that 后续所有开发都有统一的技术基础和视觉 Token。

## Acceptance Criteria

1. **Given** 空的工作目录
   **When** 执行 `npx create-next-app@latest ai-smart-journal --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
   **Then** 项目可启动，`npm run dev` 后访问 `localhost:3000` 可见默认页面

2. **Given** 项目已初始化
   **When** 安装依赖
   **Then** 包含 `zustand`, `idb`, `framer-motion` 依赖

3. **Given** 项目已初始化
   **When** 执行 `npx shadcn@latest init`
   **Then** 添加 button, card, textarea, dialog, skeleton 组件

4. **Given** Tailwind 配置文件
   **When** 查看 `tailwind.config.ts`
   **Then** 包含「暖日」色板（bg-primary `#FDF8F5`, primary `#E8C4A0`, accent `#D4856A` 等 12 个 Token）
   **And** 包含圆角系统（sm=8px ~ full=9999px）和阴影系统（sm/md/lg 三级）

5. **Given** 根布局文件
   **When** 查看 `layout.tsx`
   **Then** 使用 `@next/font/google` 加载 Noto Serif SC 和 Noto Sans SC

6. **Given** 全局样式文件
   **When** 查看 `globals.css`
   **Then** 包含 Tailwind 指令和 CSS 自定义属性（色板变量）

7. **Given** 环境变量文件
   **When** 查看项目根目录
   **Then** 存在 `.env.example` 文件，包含 `DASHSCOPE_API_KEY=sk-xxx`
   **And** `.gitignore` 包含 `.env.local`

## Tasks / Subtasks

- [x] Task 1: 初始化 Next.js 项目 (AC: #1, #2)
  - [x] 运行 create-next-app 命令初始化项目
  - [x] 安装 zustand, idb, framer-motion 依赖
- [x] Task 2: 配置设计系统 (AC: #3, #4, #5, #6)
  - [x] 初始化 shadcn/ui 并添加基础组件
  - [x] 配置 Tailwind 暖日色板、圆角系统、阴影系统
  - [x] 配置 Google Fonts（Noto Serif SC + Noto Sans SC）
  - [x] 更新 globals.css 包含 CSS 自定义属性
- [x] Task 3: 配置环境变量 (AC: #7)
  - [x] 创建 .env.example 文件
  - [x] 确认 .gitignore 包含 .env.local

## Dev Notes

### 架构约束
- 使用 `create-next-app@latest` 官方脚手架，启用 TypeScript + Tailwind + App Router + src 目录
- 所有依赖通过 npm 安装，不使用 pnpm/yarn
- Aceternity UI 组件需要手动复制源码到项目（非 npm 包）

### 设计 Token
- **色板**：bg-primary `#FDF8F5`, bg-secondary `#F5EDE4`, primary `#E8C4A0`, accent `#D4856A`, accent-hover `#C47459`, text-primary `#3D3D3D`, text-secondary `#8A817C`, text-muted `#B5ADA9`, success `#A8C5A0`, warning `#E8C4A0`, error `#D4856A`, border `#E8E0D8`
- **圆角**：sm=8px, md=12px, lg=16px, xl=24px, full=9999px
- **阴影**：sm `0 1px 3px rgba(61,61,61,0.06)`, md `0 4px 12px rgba(61,61,61,0.08)`, lg `0 8px 24px rgba(61,61,61,0.12)`

### 项目结构
```
src/
├── app/
│   ├── layout.tsx          # 根布局 + Google Fonts
│   ├── page.tsx            # 首页（占位）
│   └── globals.css         # Tailwind 指令 + CSS 变量
```

### 测试标准
- 本项目不写单元测试，手动验证
- 验证点：`npm run dev` 启动无报错，访问 localhost:3000 可见页面

### References
- [Source: architecture.md#Starter Template Evaluation]
- [Source: architecture.md#Frontend Architecture]
- [Source: ux-design-specification.md#Design System Foundation]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
