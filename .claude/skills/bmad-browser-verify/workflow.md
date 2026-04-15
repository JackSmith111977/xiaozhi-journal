# 浏览器验证工作流

## 阶段 1：解析 Story

### 1.1 定位 Story

如果用户未指定 Story：
- 扫描 `_bmad-output/implementation-artifacts/*.md` 中 `Status: review` 的文件
- 呈现列表给用户，询问要验证哪个 Story

### 1.2 读取 Story 文件

读取 Story `.md` 文件并提取：
- **Story 标题** 和描述
- **验收标准** — 每个 Given/When/Then 块
- **开发代理记录 → 文件列表** — 哪些组件文件被修改
- **开发说明** — 路由/路径信息、组件名称

### 1.3 将 AC 映射到路由

为每个 AC 确定：
- **路由** — 要导航到的 URL 路径（例如 `/` 对应首页 Story）
- **关键交互** — 验证该 AC 需要什么浏览器操作（点击、输入、等待、快照）
- **预期状态** — 交互后应该可见/为真的内容

为每个 AC 标记验证级别：
- **LOAD** — 页面加载无错误（始终需要）
- **ELEMENT** — 特定元素可见且属性正确
- **INTERACT** — 用户交互产生预期行为
- **ERROR** — 预期错误状态或边界情况被正确处理

---

## 阶段 2：启动开发服务器

### 2.1 检查运行中的服务器

调用 `mcp__next-devtools__nextjs_index` 发现任何运行中的 Next.js 开发服务器。

- 如果找到端口 3000（或其他端口）的服务器，使用它
- 如果没有服务器运行，启动一个

### 2.2 启动开发服务器

如果没有服务器运行：
```bash
cd xiaozhi-journal && npm run dev
```
在后台运行。等待 "Ready" 消息或约 15 秒。

### 2.3 初始化 Next.js DevTools

调用 `mcp__next-devtools__nextjs_init` 并传入项目路径以建立 MCP 连接。

---

## 阶段 3：加载页面并检测错误

### 3.1 启动浏览器

调用 `mcp__playwright__browser_start` 或 `mcp__next-devtools__browser_eval` 并设置 action 为 `start`。

### 3.2 导航到每个路由

对于阶段 1 中识别的每个唯一路由：

1. **导航**：`mcp__playwright__browser_navigate` 到 `{base_url}/{route}`
2. **等待**：`mcp__playwright__browser_wait_for` 设置 `time: 3`（秒）
3. **控制台错误**：`mcp__playwright__browser_console_messages` 设置 `level: error`
4. **Next.js 错误**：`mcp__next-devtools__nextjs_call` 设置 `toolName: get_errors` 传入开发服务器端口
5. **快照**：`mcp__playwright__browser_snapshot` — 捕获无障碍快照
6. **截图**：`mcp__playwright__browser_take_screenshot` — 保存用于报告

### 3.3 记录页面加载结果

为每个路由记录：
- **HTTP 状态** — 页面是否成功加载
- **控制台错误** — 浏览器控制台中的 JS 错误
- **Next.js 错误** — 开发服务器的编译/运行时错误
- **无障碍快照** — 验证关键元素是否在树中
- **截图路径** — 报告引用

**门控：** 如果任何路由存在关键错误（编译失败、空白页面），停止并报告。非关键的控制台警告可以继续到阶段 4。

---

## 阶段 4：验证 AC 交互

对于标记为 **ELEMENT** 或 **INTERACT** 的每个 AC：

### 4.1 元素验证

使用 `mcp__playwright__browser_snapshot` 验证：
- 元素存在于无障碍树中
- 正确的 role、label、文本内容
- CSS 属性可见（如需要可通过 evaluate 检查颜色、尺寸）

### 4.2 交互验证

对于每个关键交互：

1. **导航** 到路由（如果尚未在该页面）
2. **执行操作**：`browser_click`、`browser_type`、`browser_press_key` 等
3. **等待结果**：`browser_wait_for` 设置文本出现/消失
4. **验证**：`browser_snapshot` 或 `browser_evaluate` 确认预期状态
5. **截图**：捕获视觉证明

### 4.3 关键交互模式

将这些常见模式映射到 MCP 工具序列：

| 模式 | 工具 |
|------|------|
| 点击按钮 → 查看结果 | `click` → `wait_for` → `snapshot` |
| 表单输入 → 查看变化 | `type` → `wait_for` → `snapshot` |
| 悬停 → 查看提示 | `hover` → `wait_for` → `snapshot` |
| 键盘导航 | `press_key` → `wait_for` → `snapshot` |
| 表单验证 | 输入无效内容 → `wait_for` 错误 → `snapshot` |
| 页面跳转 | `click` → `wait_for` 文本 → `snapshot` |

### 4.4 验证深度规则

- **仅 LOAD 的 AC**：验证页面加载、无错误、元素存在即可
- **ELEMENT 的 AC**：验证元素属性（role、label、文本、属性）
- **INTERACT 的 AC**：执行完整的 Given/When/Then 交互链
- 跳过需要以下条件的 AC：后端数据配置、身份验证、第三方服务

---

## 阶段 5：生成报告

### 5.1 构建报告结构

在 `_bmad-output/implementation-artifacts/browser-verify-{story-id}.md` 创建报告：

```markdown
# 浏览器验证报告：{Story ID} - {Story 标题}

**日期：** {timestamp}
**开发服务器：** 端口 {port}
**浏览器：** {browser}

## 摘要

| 指标 | 结果 |
|------|------|
| 测试路由数 | X |
| 验证 AC 数 | Y 通过 / Z 总计 |
| 控制台错误 | N |
| Next.js 错误 | N |
| 总体结果 | 通过 / 失败 / 部分通过 |

## 路由结果

### `/{route}`

- 页面加载：是/否
- 控制台错误：{列表或"无"}
- Next.js 错误：{列表或"无"}
- 找到的关键元素：{列表}
- 截图：`{路径}`

## AC 验证结果

### AC #1：{标题} — 通过 / 失败

- **路由：** `/{route}`
- **级别：** LOAD / ELEMENT / INTERACT
- **执行的步骤：**
  1. 导航到 `/{route}` ✓
  2. 验证元素 "[名称]" 存在 ✓
  3. 点击 "[元素]" → 验证结果 ✓
- **截图：** `{路径}`
- **说明：** {任何观察}

### AC #2：{标题} — 失败

- **路由：** `/{route}`
- **级别：** INTERACT
- **执行的步骤：**
  1. 导航到 `/{route}` ✓
  2. 点击 "[元素]" ✓
  3. 预期 "[结果]" — 未找到 ✗
- **截图：** `{路径}`
- **失败原因：** {具体描述}

## 控制台错误

{列出所有发现的控制台错误，或"无"}

## 建议

{修复失败或改进验证的具体建议}
```

### 5.2 更新 Story 状态

如果 **所有 AC 通过**：
- 将 Story 文件中的 `Status:` 从 `review` 更新为 `done`
- 将 `sprint-status.yaml` 中对应 Story 更新为 `done`

如果 **任何 AC 失败**：
- 保持 Story 的 `Status:` 为 `review`
- 在 Story 文件中添加 `## 浏览器验证问题` 部分，包含失败详情
- 建议用户返回 Dev Story (DS) 修复

### 5.3 呈现结果

向用户总结：
- 总体结果（通过/失败/部分通过）
- 哪些 AC 通过、哪些失败
- 失败项的截图
- 后续步骤
