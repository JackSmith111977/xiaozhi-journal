---
name: bmad-story-e2e-verify
description: Automated E2E verification loop for BMAD stories using Next.js DevTools MCP and Playwright MCP. Plans test coverage from story AC, executes browser automation, records results, and iterates dev→review→verify until all acceptance criteria pass. Triggers explicitly via /story-e2e-verify or implicitly when story review completes.
aliases: [story-e2e-verify, e2e-verify-story, story-test-loop]
triggers: [e2e verification, story verification, browser test loop, run e2e, verify story in browser, story review completed, dev-story done review done]
author: Kei
version: 1.0.0
metadata:
  module: bmm
  pattern: pipeline+reviewer
---

# bmad-story-e2e-verify — Story E2E 自动化验证

## 概述

在 Story 开发完成并 review 后，自动启动 E2E 验证循环：

```
dev-story → code-review → [THIS SKILL] → 发现问题 → 修复 → dev-story → ... → 全部通过
```

**核心原则**：
- Phase 1-6（E2E 测试阶段）**不修改代码**，仅记录和报告
- Phase 7（编排阶段）**可以修改代码**，在同会话内完成 修复→review→re-verify 闭环
- 测试计划从 Story 文件的 AC 自动生成
- 使用真实浏览器（Playwright MCP）和 Next.js MCP 双重验证
- **不退出对话**：检测 P0/P1 失败后必须在同会话内继续执行修复循环

## 触发条件

- **显式**：用户输入 `/story-e2e-verify` 或 "对 [story] 执行 e2e 验证"
- **隐式**：检测到 Story 进入 review 状态或对话中出现 "review 完成"、"dev-story 完成"

## 工作流程

### Phase 1: 定位 Story

1. 从上下文中识别目标 Story ID（如 `8-4`）
2. 在 `_bmad-output/implementation-artifacts/` 中查找对应 Story 文件
3. 如果找不到，使用 `bmad-help` 确认 sprint 状态

### Phase 2: 生成测试计划

1. 读取 Story 文件，提取：
   - **验收标准（Acceptance Criteria）** → Happy Path 用例
   - **技术实现细节** → 暗示的路由和交互
   - **review 阶段的边缘情况** → 从 review notes 或 edge-case-hunter 输出中提取
2. 调用 Next.js MCP `get_routes` 获取当前路由清单，确认 Story 涉及的路由
3. 按 [test-planning-guide](references/test-planning-guide.md) 生成测试计划
4. 自检覆盖度：AC 全覆？边缘情况 ≥ 2？回归 ≥ 1？
5. 将测试计划输出给用户确认（首次循环）或自动进入执行（第 2+ 轮）

### Phase 3: 启动开发服务器

1. 检查是否有 Next.js 进程在运行
2. 如果没有，在后台启动 `npm run dev`（或 `pnpm dev` / `bun dev`）
3. 等待服务器就绪（读取 `get_project_metadata` 确认 MCP 可用）
4. 确认无编译错误（调用 `get_errors`）

### Phase 4: 浏览器验证（不修改代码）

> 详细操作指南见 [playwright-actions](references/playwright-actions.md)

按测试计划逐条执行：

```
For each test case:
  1. browser_navigate → 目标 URL
  2. browser_wait_for → 等 hydration 完成 (time: 2)
  3. browser_snapshot → 获取页面可访问性状态
  4. 执行交互操作（browser_click / browser_type / browser_fill_form）
  5. browser_wait_for → 等预期结果出现
  6. browser_snapshot → 验证状态变化
  7. browser_take_screenshot → 留存证据
  8. 记录 PASS / FAIL
```

### Phase 5: 错误收集

测试完成后：

1. 调用 Next.js MCP `get_errors` — 获取编译/运行时错误
2. 调用 Playwright `browser_console_messages` (level: "error") — 获取前端运行时错误
3. 读取 Next.js 开发日志（通过 `get_logs` 获取路径后 Read）

### Phase 6: 生成报告

将本轮结果写入 `_bmad-output/implementation-artifacts/e2e-verify-{STORY_ID}-round-{N}.md`：

- 测试计划 + 每条用例的实际结果
- 截图路径
- 待修复问题清单（按 P0/P1/P2 排序）
- Console 错误 + Next.js 错误

### Phase 7: 同会话修复循环（必须执行）

**核心原则：本 Skill 不退出当前对话，在同会话内完成 修复→review→re-verify 闭环。**

#### 7.1 检查验证结果

1. 统计 PASS/FAIL 数量
2. 读取 [verification-checklist](references/verification-checklist.md)

**全部通过？** → 跳到 7.4。

**有 P0/P1 失败？** → 执行 7.2-7.3。

#### 7.2 自动修复（同会话内）

> 本 Skill 声明"不修改代码"仅指 E2E 测试阶段。Phase 7 是编排阶段，负责协调修复流程。

按以下顺序在同会话内执行（**不要输出报告后停止，必须继续**）：

1. **分析根因**：对每个 P0/P1 失败用例，定位涉及的源码文件和问题类型（UI/逻辑/状态/API）
2. **修复代码**：
   - 读取相关源码文件
   - 直接修改代码修复问题（本 Skill 在此阶段**可以**修改代码）
   - 如果是复杂逻辑（涉及多文件/架构调整），调用 `bmad-dev-story` 子工作流处理
3. **验证修复**：
   - `npx tsc --noEmit` 检查 TypeScript 编译
   - 调用 Next.js MCP `get_errors` 检查运行时错误

#### 7.3 自动 Re-Review

1. 修复完成后，在同会话内执行 code-review：
   - 读取修改过的文件
   - 按 `bmad-code-review` 标准检查（安全/性能/回归/代码风格）
   - 发现新问题 → 回到 7.2 修复
   - Review 通过 → 进入 7.4

#### 7.4 重新验证

1. 轮次 +1（更新报告文件名中的 round 编号）
2. 回到 Phase 4（浏览器验证），仅执行之前 FAIL 的用例
3. 新用例 PASS → 标记该用例为 PASS
4. 仍有 FAIL → 回到 7.2
5. **全部 PASS** → 跳到 7.5

#### 7.5 完成

1. 输出最终成功报告
2. 更新 Story 文件中的 Dev Agent Record → E2E Verification 区，写入验证历史摘要
3. 更新 `sprint-status.yaml` 中 story 状态为 `done`
4. 流程结束

> **安全上限**：最多循环 5 轮。超过后输出摘要，列出未解决问题，建议人工介入。

> **对话中断恢复**：如果对话意外中断，重新调用本 Skill 时读取最新的 `e2e-verify-{STORY_ID}-round-{N}.md`，从 Phase 7 的失败用例继续。

## Next.js MCP 工具参考

详见 [nextjs-mcp-tools](references/nextjs-mcp-tools.md)

关键调用顺序：
1. `get_project_metadata` — 确认服务器状态
2. `get_routes` — 规划测试路由
3. `get_errors` — 每轮后检查回归
4. `get_page_metadata` — 交叉验证页面渲染

## Playwright 操作指南

详见 [playwright-actions](references/playwright-actions.md)

关键原则：
- **不修改代码**：仅验证
- **快照定位**：从 `browser_snapshot` 提取 `ref` 值
- **截图留存**：每个关键路径完成后截图
- **错误收集**：每条用例结束后收集 console errors

## 测试计划模板

详见 [templates/test-plan-template.md](templates/test-plan-template.md)

## 输出产物

| 文件 | 内容 |
|------|------|
| `e2e-verify-{STORY_ID}-round-{N}.md` | 单轮测试报告 |
| Story 文件 → Dev Agent Record → E2E Verification 区 | 验证历史摘要 |
| `sprint-status.yaml` | Story 状态更新 |

## 注意事项

- 开发服务器已运行时跳过启动步骤
- 隐式触发时先输出测试计划让用户确认
- 显式触发时直接进入 Phase 2
- Phase 1-6 不修改代码，Phase 7 可以修改代码
- 循环中复用已启动的服务器和浏览器实例（除非崩溃）
- 截图保存在 `_bmad-output/e2e-screenshots/` 目录
- **P0/P1 失败时不退出对话**：必须继续执行 Phase 7 修复循环直到全部通过或达到 5 轮上限
- 对话意外中断后重新调用本 Skill，读取最新 round 报告从失败用例继续
