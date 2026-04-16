Status: review

# Story 7.1: 金句分享卡片

## Story

As a 被打动想分享的用户,
I want 把包含日记、小知回应和金句的完整叙事生成为一张精致的图片,
so that 我可以分享到社交平台并让更多人看到 Xiaozhi Journal。

## Acceptance Criteria

1. **Given** 用户看到金句卡片（仅含金句 + 日期 + 分享按钮，与现有 UI 一致）
   **When** 点击金句卡片右上角的分享图标按钮
   **Then** 金句卡片 3D 翻转到背面，显示完整的分享预览卡片
   **And** 分享卡片包含：品牌头（Xiaozhi Journal + 日期 + 心情）、日记原文、小知回应（对话气泡样式）、金句（高亮 accent 线）、二维码（底部引流）、品牌尾
   **And** 卡片下方提供 3 个操作按钮：复制图片、保存图片、复制文字
   **And** 点击"← 返回日记"可翻回正面，恢复原始金句卡片

2. **Given** 用户在分享预览卡片中选择一个操作
   **When** 点击"复制图片"
   **Then** 将整个分享卡片渲染为 PNG 图片并复制到剪贴板
   **And** 按钮显示 ✓ + "已复制" 反馈，2 秒后恢复
   **And** 该日记的 `shareCount` +1

3. **Given** 用户在分享预览卡片中选择一个操作
   **When** 点击"保存图片"
   **Then** 将整个分享卡片渲染为 PNG 图片并触发下载
   **And** 按钮显示 ✓ + "已保存" 反馈，2 秒后恢复
   **And** 该日记的 `shareCount` +1

4. **Given** 用户在分享预览卡片中选择一个操作
   **When** 点击"复制文字"
   **Then** 将金句文本复制到剪贴板
   **And** 按钮显示 ✓ + "文字已复制" 反馈，2 秒后恢复
   **And** 该日记的 `shareCount` +1

5. **Given** 分享卡片生成
   **When** 图片渲染时
   **Then** 必须等待 Noto Serif SC 字体加载完成后再渲染 Canvas
   **And** 图片样式与预览卡片一致（暖色调、杂志引用风格、二维码）

## Tasks / Subtasks

- [x] Task 1: 重构 GoldenQuote 组件为翻转卡片 (AC: #1)
  - [x] 将现有 `golden-quote.tsx` 改为 3D 翻转卡片结构
  - [x] 正面：保持现有金句卡片样式（金句 + 日期 + 分享按钮），不改变现有 UI
  - [x] 背面：分享预览卡片，包含品牌头、日记、小知回应、金句、二维码、品牌尾
  - [x] 使用 Framer Motion 实现 3D 翻转动画（复用现有 `rotateY` 能力）
  - [x] 添加 `← 返回日记` 按钮翻回正面

- [x] Task 2: 新增 ShareCard 子组件 (AC: #1)
  - [x] 创建 `ShareCard` 组件，渲染完整分享卡片 DOM 结构
  - [x] 包含：品牌头（品牌名 + 日期 + 心情）、日记区域、小知回应对话气泡、金句高亮区、二维码占位、品牌尾
  - [x] 二维码使用 `qrcode` 库生成，链接到应用首页
  - [x] 分享卡片需在 `page.tsx` 和 `history/[id]/page.tsx` 中传入 `journal` 对象（content + aiResponse）

- [x] Task 3: 实现分享操作按钮 (AC: #2, #3, #4)
  - [x] 翻转后在卡片下方显示 3 个操作按钮（复制/保存/文字）
  - [x] `handleCopy`：Canvas 渲染分享卡片 DOM 为图片，写入剪贴板
  - [x] `handleDownload`：Canvas 渲染图片，创建 `<a>` 标签（需 `appendChild → click → remove`）下载
  - [x] `handleCopyText`：使用 `navigator.clipboard.writeText` 复制金句纯文本
  - [x] 每个操作后显示 ✓ + 反馈文字，2 秒后恢复
  - [x] 操作成功后更新 `shareCount` +1

- [x] Task 4: 修复已知 Bug (AC: #5)
  - [x] BUG-1：Canvas 渲染前等待字体加载（`await document.fonts.load(...)`）
  - [x] BUG-2：`catch` 块添加 `console.error` 日志
  - [x] BUG-3：`shareCount` 使用 `(journal.shareCount ?? 0) + 1` null 安全
  - [x] BUG-4：`a.click()` 下载修复为 `appendChild → click → removeChild`

## Dev Notes

### 已知 Bug 清单（本次一并修复）

| # | 严重程度 | 描述 | 位置 | 复现条件 |
|---|---------|------|------|---------|
| BUG-1 | **高** | Canvas 渲染不等待字体加载，中文字体 fallback 到默认 serif | `generateQuoteImage` 第 35 行 | 首次点击分享 |
| BUG-2 | **中** | `catch` 块空操作吞掉所有错误 | `handleShare` 第 120-122 行 | 任何异常路径 |
| BUG-3 | **低** | `shareCount` 读-改-写非原子操作 | `handleShare` 第 115-117 行 | 快速连点 |
| BUG-4 | **中** | `a.click()` 未加入 DOM 树，部分浏览器阻止下载 | `handleShare` fallback 第 109 行 | Safari/iOS |

### 技术方案
- 3D 翻转使用 Framer Motion `rotateY`（现有组件已有此动画）
- 图片生成使用 Canvas 渲染分享卡片 DOM 节点
- 必须等待 `document.fonts.ready` 后再渲染 Canvas
- 二维码使用 `qrcode` 库生成 SVG，链接指向应用首页
- 下载操作需将 `<a>` 元素加入 DOM 后点击再移除

### 需要修改的文件

| 文件 | 改动 |
|------|------|
| `src/components/golden-quote.tsx` | 重构为翻转卡片结构，正面保持原样，背面新增 ShareCard |
| `src/components/share-card.tsx` | **新建**：分享卡片 DOM 组件（含日记、小知、金句、二维码） |
| `src/app/page.tsx` | 传入 `journal` 对象（content + aiResponse）给 GoldenQuote |
| `src/app/history/[id]/page.tsx` | 同上，传入完整 journal 对象 |
| `package.json` | 新增 `qrcode` 依赖 |

### 分享卡片 DOM 结构（用于 Canvas 渲染）

```
ShareCard
├── accent-top (渐变条)
├── header (品牌名 + 日期 + 心情)
├── journal-section (日记原文)
├── divider (渐变分隔线)
├── response-section (小知回应，对话气泡)
├── divider-accent (❝ 装饰)
├── quote-section (金句，accent 左边线)
└── footer (二维码 + 品牌引流文字)
```

### 原型参考
- `public/ux-prototype-share-v2.html` — 3 个内容变体的可交互原型
- 已确认 UX 方案：翻转前 = 原金句卡片，翻转后 = 完整分享预览

### References
- [Source: epics.md#Story 7.1]
- [Source: prd.md#FR18]
- [UX Prototype: ux-prototype-share-v2.html]

## Dev Agent Record

### Agent Model Used

qwen3.6-plus

### Debug Log References

无

### Completion Notes List

- 将 `golden-quote.tsx` 重构为 3D 翻转卡片：正面保持原金句卡片（金句 + 日期 + 分享按钮），背面显示 `ShareCard` 预览 + 三个操作按钮（复制/保存/文字）
- 新建 `share-card.tsx`：完整分享卡片 DOM 组件，包含品牌头、日记区域、小知回应气泡、金句高亮区、二维码（Next.js Image + api.qrserver.com）、品牌尾
- 新建 `share-card-renderer.ts`：Canvas 渲染器，用于将分享卡片导出为 PNG，包含字体加载等待、中文字体 wrapText、QRCode 库生成二维码
- 修复 BUG-1：Canvas 渲染前等待 `document.fonts.load('Noto Serif SC')`
- 修复 BUG-2：所有 `catch` 块添加 `console.error` 日志
- 修复 BUG-3：`shareCount` 使用 `(journalEntry.shareCount ?? 0) + 1` null 安全
- 修复 BUG-4：下载操作改为 `appendChild → click → removeChild` 兼容 Safari
- 修复 ESLint 问题：未转义 HTML 实体、useCallback 依赖项、未使用变量、Next.js Image 替代 `<img>`
- 修复 `share-card.tsx` 重复 `/>` 闭合标签
- `next.config.ts` 添加 QR 图片远程域名白名单
- Build 编译通过，ESLint + TypeScript 检查零错误

### File List

| 文件 | 改动 |
|------|------|
| `src/components/golden-quote.tsx` | 重构为翻转卡片，正面保持原样，背面新增 ShareCard + 操作按钮 |
| `src/components/share-card.tsx` | **新建**：分享卡片 DOM 组件 |
| `src/lib/share-card-renderer.ts` | **新建**：Canvas 渲染器 |
| `src/app/page.tsx` | 传入 `journal={latestJournal}` prop |
| `src/app/history/[id]/page.tsx` | 传入 `journal={journal}` prop |
| `next.config.ts` | 添加 `api.qrserver.com` 远程域名 |
| `package.json` | 新增 `qrcode` 依赖 |
| `public/ux-prototype-share-v2.html` | **新建**：UX 原型验证 |
