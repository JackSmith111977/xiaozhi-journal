---
name: parallel-review
code: PR
description: 管理并行 subagent 审查层，注入项目规范与记忆
---

# Parallel Review

管理多层并行审查。根据审查模式选择 subagent 组合。

## 审查模式

| 模式 | Subagent 层 | 适用场景 |
|------|------------|---------|
| `full` | Blind Hunter + Edge Case Hunter + Standards Auditor + Security Scanner | 大改动、关键路径 |
| `quick` | Blind Hunter + Standards Auditor | 小改动、快速检查 |
| `security` | Security Scanner + Standards Auditor | 安全敏感区域 |
| `edge` | Edge Case Hunter + Standards Auditor | 边界情况重点检查 |

默认 `full`。用户可指定。

## Subagent 定义

每个 subagent 以独立 Agent 启动，**不传入对话上下文**——仅传入 diff 和相关规范。

### 1. Blind Hunter

- **输入**：`{diff_output}` 仅
- **无上下文**：无 spec、无项目文档、无记忆
- **调用**：`bmad-review-adversarial-general` skill
- **角色**：Cynical reviewer。假设问题存在，至少找出 10 个问题
- **输出**：Markdown 列表

Prompt 注入记忆中的常见错误模式：
```
以下为此项目历史上发现过的常见错误模式（供参考，不限于此）：
{MEMORY.md 中的 Common Errors Registry}
```

### 2. Edge Case Hunter

- **输入**：`{diff_output}` + 项目读取权限
- **调用**：`bmad-review-edge-case-hunter` skill
- **角色**：Path tracer。枚举所有分支路径和边界条件
- **输出**：JSON 数组（`location`, `trigger_condition`, `guard_snippet`, `potential_consequence`）

### 3. Standards Auditor

- **输入**：`{diff_output}` + `{spec_file}` + 项目上下文文档
- **角色**：验证 AC 合规性 + 项目规范合规性
- **加载**：
  - `{project-root}/docs/project-context.md`
  - `{project-root}/CLAUDE.md`
  - `{project-root}/_bmad/memory/agent-code-review/MEMORY.md`（历史规范记录）
  - `{project-root}/_bmad/output/planning-artifacts/standards-rule-mapping.md`（标准映射）

Prompt：
```
你是一个 Standards Auditor。审查此 diff 是否符合项目标准。

项目标准来源：
{project-context.md 内容}
{CLAUDE.md 内容}
{历史规范记录}

检查：
1. Acceptance Criteria 是否全部实现
2. 技术栈使用是否符合项目规范（Supabase RPC 命名、Next.js API route pattern、Tailwind v4 语法等）
3. 命名约定是否符合项目习惯
4. 文件结构是否符合项目架构

输出：Markdown 列表。每条发现：标题 + 违反的规范 + diff 中的证据。
```

### 4. Security Scanner

- **输入**：`{diff_output}` + 项目读取权限
- **角色**：OWASP Top 10 + 项目特定安全检查
- **检查项**：
  - 硬编码 secret / API key
  - SQL injection / NoSQL injection 风险
  - XSS 风险（`dangerouslySetInnerHTML`、`v-html`）
  - 未经认证的敏感端点
  - RLS 策略缺失或过于宽松
  - 依赖引入未经验证（`package.json` 变更）
  - `.env` 文件意外提交
  - Supabase client 在 server component 中的不当使用

Prompt：
```
你是一个 Security Scanner。审查此 diff 的安全漏洞。

项目技术栈：
- Next.js 16 App Router（Server Components default）
- Supabase Auth + RLS
- React 19
- IndexedDB 本地存储

检查 OWASP Top 10 及上述项目特定风险。

输出：Markdown 列表。每条发现：标题 + 风险等级（Critical/High/Medium/Low）+ 位置 + 证据。
```

## 并行执行

如果 subagent 工具可用，同时启动所有选定层。否则，生成每个审查角色的 prompt 文件到 `{project-root}/_bmad-output/implementation-artifacts/`，告知用户手动运行并粘贴结果。

## 失败处理

Subagent 超时/失败/空结果 → 记录到 `{failed_layers}`，继续用剩余层。

## 收集

收集所有层的发现，传递给 triage-present 能力。

## Memory 集成

- 查询 MEMORY.md 中的历史发现，注入到相关 subagent prompt
- 查询 BOND.md 中的项目路径，确定标准文档位置
- 记录本次发现的 new patterns 到 session log
