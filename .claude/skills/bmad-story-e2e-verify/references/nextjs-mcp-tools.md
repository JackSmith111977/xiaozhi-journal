# Next.js DevTools MCP 工具参考

> 来源：[官方文档](https://nextjs.org/docs/app/guides/mcp) + MCP 握手实测
> 适用于 Next.js 16+，MCP endpoint: `/_next/mcp`

## 配置方式

项目根目录 `.mcp.json`：

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

启动 `npm run dev` 后自动连接。

## 工具列表

### 1. `get_project_metadata`
- **输入**：无参数
- **输出**：项目路径、dev server URL、Next.js 版本
- **用途**：确认开发服务器已启动且 MCP 可用

### 2. `get_errors`
- **输入**：无参数
- **输出**：构建错误、运行时错误、类型错误（source-mapped stack traces）
- **用途**：测试后第一步检查 — 确认没有引入回归错误

### 3. `get_page_metadata`
- **输入**：无参数（读取当前浏览器会话的页面）
- **输出**：路由、组件、渲染信息
- **用途**：验证页面是否正确渲染、使用了正确的组件

### 4. `get_routes`
- **输入**：可选 `routerType: "app" | "pages"`
- **输出**：按路由器类型分组的路由列表，动态段显示为 `[param]`
- **用途**：规划测试需要覆盖的路由清单

### 5. `get_server_action_by_id`
- **输入**：`actionId: string`
- **输出**：Server Action 的文件名和导出名
- **用途**：验证 Server Action 是否可调用

### 6. `get_logs`
- **输入**：无参数
- **输出**：开发日志文件路径
- **用途**：读取服务器端日志，排查测试中遇到的异常

## 测试最佳实践

1. **测试前**：调用 `get_project_metadata` 确认服务器状态
2. **测试后**：调用 `get_errors` 检查回归
3. **验证页面**：通过 Playwright 导航到页面后，用 `get_page_metadata` 交叉验证
4. **多路由**：用 `get_routes` 生成完整路由清单，确保每个 story 涉及的路由都被测试

## 注意事项

- MCP 仅在 `next dev` 运行时可用
- 多端口支持：可发现多个 running Next.js 实例
- 工具返回值包含 `success` 字段，始终检查 success === true
