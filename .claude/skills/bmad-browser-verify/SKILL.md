---
name: bmad-browser-verify
description: 使用 MCP 浏览器自动化在真实浏览器中验证 Story 的验收标准。加载页面、检测错误、验证关键交互，并生成通过/失败报告。
aliases: [browser-verify]
triggers: [browser verify, 浏览器验证, verify story in browser, 验证 story 效果]
author: Kei
version: 1.0.0
---

## 用途

BMad Story 的自动化浏览器验证。使用 MCP Playwright 工具来：
- 启动开发服务器并导航到 Story 相关页面
- 检测控制台错误、hydration 失败和渲染问题
- 将验收标准（Given/When/Then）作为浏览器交互执行
- 生成结构化的 AC 通过/失败报告

**Pipeline：** 解析 Story → 启动服务器 → 加载页面 → 检测错误 → 验证 AC → 生成报告

---

## 快速开始

当用户调用此 Skill 时：

1. **定位 Story** — 询问要验证哪个 Story，或扫描 `_bmad-output/implementation-artifacts/*.md` 中 `Status: review` 的 Story
2. **读取 Story 文件** 提取验收标准和页面/路由信息
3. **执行工作流** 按照 `workflow.md` 执行

---

## 工作流

按照 `workflow.md` 执行完整的验证流水线。

**阶段：**
1. **解析** — 读取 Story，提取 AC，映射到路由
2. **启动** — 启动开发服务器，等待就绪
3. **加载** — 导航到每个路由，捕获错误
4. **验证** — 通过 MCP Playwright 执行关键 AC 交互
5. **报告** — 生成通过/失败报告

---

## 设计模式

- **Pipeline** — 编排顺序阶段：解析 → 启动 → 加载 → 验证 → 报告
- **Tool Wrapper** — 封装 MCP Playwright 和 Next.js DevTools 工具使用模式

---

## 输出

- 验证报告：`{project-root}/_bmad-output/implementation-artifacts/browser-verify-[story-id].md`
- 截图与报告一同保存
