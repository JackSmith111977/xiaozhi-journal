# Playwright MCP 操作指南

> 来源：[github.com/microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) + MCP 实测
> 安装：`npx @playwright/mcp@latest`

## 配置

在 `.mcp.json` 中添加：

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

## 核心 Actions（无需额外参数）

| Action | 参数 | 用途 |
|--------|------|------|
| `browser_navigate` | `url` | 导航到指定 URL |
| `browser_snapshot` | `depth`?, `filename`? | 捕获页面可访问性快照（核心定位方式） |
| `browser_click` | `ref`（必填）, `element`, `button`?, `doubleClick`? | 点击元素 |
| `browser_type` | `ref`（必填）, `text`（必填）, `element`, `slowly`?, `submit`? | 在输入框输入文本 |
| `browser_press_key` | `key`（必填） | 按键操作 |
| `browser_evaluate` | `function`（必填）, `element`?, `ref`? | 执行 JS 并获取返回值 |
| `browser_take_screenshot` | `type`?, `fullPage`?, `filename`?, `element`?, `ref`? | 截图保存 |
| `browser_console_messages` | `level`（必填）, `all`?, `filename`? | 获取浏览器 console 日志 |
| `browser_wait_for` | `text`?, `textGone`?, `time`? | 等待文本出现/消失/超时 |
| `browser_tabs` | `action`（必填）, `index`? | 标签页管理 |

## 验证能力（`--caps=testing`）

启用 `--caps=testing` 后可使用：
- `browser_verify_element_visible` — 验证元素可见（`role`, `accessibleName`）

## 测试 E2E 的标准流程

```
1. browser_navigate → 2. browser_snapshot → 3. browser_click/browser_type →
4. browser_wait_for → 5. browser_snapshot (验证状态变化) →
6. browser_console_messages (检查 console 错误) →
7. browser_take_screenshot (留存证据)
```

### 关键原则

1. **不修改代码**：测试 Skill 仅验证，不修复代码。修复交给 dev-story 循环
2. **快照优先**：使用 `browser_snapshot` 而非截图来定位元素，基于 accessibility tree 更可靠
3. **错误收集**：每次测试结束必须调用 `browser_console_messages` (level: "error") 收集前端错误
4. **截图留存**：关键路径完成后调用 `browser_take_screenshot` 保存视觉证据
5. **无 headless 限制**：Win32 环境下使用默认的 headed 模式（便于调试），CI 环境用 headless

## 表单填写模式

使用 `browser_fill_form` 批量填写：

```
fields: [
  { name: "邮箱", type: "textbox", ref: "...", value: "test@example.com" },
  { name: "密码", type: "textbox", ref: "...", value: "password123" }
]
```

## 等待策略

- 页面加载后：`browser_wait_for` { time: 2 }（等 2 秒让 React hydration 完成）
- 异步操作后：`browser_wait_for` { text: "预期文本" }
- 最长超时：避免超过 10 秒的隐式等待

## 注意事项

- Playwright MCP 不是安全边界，不要在测试中暴露敏感信息
- `browser_snapshot` 的 `ref` 值是后续操作的唯一可靠定位器，必须从快照中提取
- 测试失败时记录完整快照用于调试分析
