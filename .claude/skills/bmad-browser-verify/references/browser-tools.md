# MCP 浏览器工具参考

## Playwright MCP 工具 (`mcp__playwright__*`)

### 导航

```
mcp__playwright__browser_navigate(url: string)
```

导航到指定 URL。使用开发服务器的基础 URL（通常为 `http://localhost:3000`）。

### 快照（无障碍树）

```
mcp__playwright__browser_snapshot()
mcp__playwright__browser_snapshot(filename: string)
```

捕获无障碍快照 — 比截图更适合验证元素是否存在、role 和 label。将其作为主要验证工具使用。

### 截图（视觉）

```
mcp__playwright__browser_take_screenshot(
  type: "png" | "jpeg" = "png",
  filename?: string,
  fullPage?: boolean,
  element?: string,
  ref?: string
)
```

截取视觉截图用于报告附件。使用 `fullPage: true` 进行全页截图。

### 交互

```
mcp__playwright__browser_click(ref: string, button?: "left"|"right"|"middle", modifiers?: string[])
mcp__playwright__browser_type(ref: string, text: string, slowly?: boolean, submit?: boolean)
mcp__playwright__browser_press_key(key: string)
mcp__playwright__browser_hover(ref: string)
mcp__playwright__browser_select_option(ref: string, values: string[])
```

使用快照输出中的 `ref` 来定位目标元素。

### 等待

```
mcp__playwright__browser_wait_for(time: number)        — 等待 N 秒
mcp__playwright__browser_wait_for(text: string)         — 等待文本出现
mcp__playwright__browser_wait_for(textGone: string)     — 等待文本消失
```

用于等待动画、异步加载或状态变化。

### 控制台与网络

```
mcp__playwright__browser_console_messages(level: "error"|"warning"|"info"|"debug")
mcp__playwright__browser_network_requests(static: false, requestBody: false, requestHeaders: false)
```

获取 JS 控制台错误和网络请求。页面加载后始终检查 `level: "error"`。

### 执行 JavaScript

```
mcp__playwright__browser_evaluate(function: string)
mcp__playwright__browser_evaluate(function: string, ref: string)  — 元素上下文
```

执行 JavaScript 用于属性检查（例如 `getComputedStyle`、`element.getAttribute`）。

---

## Next.js DevTools (`mcp__next-devtools__*`)

### 发现服务器

```
mcp__next-devtools__nextjs_index()
```

列出所有运行中的 Next.js 开发服务器及其可用的 MCP 工具。

### 获取错误

```
mcp__next-devtools__nextjs_call(port: string, toolName: "get_errors")
```

获取 Next.js 开发服务器的编译和运行时错误。

### 列出路由

```
mcp__next-devtools__nextjs_call(port: string, toolName: "get_routes")
```

获取 Next.js 应用中所有可用的路由。

### 构建状态

```
mcp__next-devtools__nextjs_call(port: string, toolName: "get_build_status")
```

检查 Next.js 应用是否已编译并准备就绪。

### 浏览器 Eval（替代方案）

```
mcp__next-devtools__browser_eval(
  action: "start" | "navigate" | "click" | "type" | "fill_form" |
          "evaluate" | "screenshot" | "console_messages" | "close",
  url?: string,
  text?: string,
  element?: string,
  ref?: string,
  script?: string
)
```

Next.js 优化的浏览器自动化。优先使用 Playwright MCP 以获得更广泛的兼容性，但在需要 Next.js 特定功能时使用此工具。

---

## 工具选择指南

| 任务 | 首选工具 |
|------|---------|
| 导航到页面 | `browser_navigate` |
| 检查错误 | `browser_console_messages(level: error)` + `nextjs_call(get_errors)` |
| 验证元素存在 | `browser_snapshot` |
| 点击 / 输入 / 交互 | `browser_click` / `browser_type` / `browser_press_key` |
| 视觉证明 | `browser_take_screenshot` |
| CSS 属性检查 | `browser_evaluate` |
| 等待动画 | `browser_wait_for(time: 2)` 或 `browser_wait_for(text: "...")` |
| Next.js 错误 | `nextjs_call(get_errors)` |
| 检查路由 | `nextjs_call(get_routes)` |
