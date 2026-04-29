---
name: triage-present
code: TP
description: 汇总、去重、分级发现，生成审查报告并执行修复
---

# Triage & Present

汇总多层审查发现，分级处理，生成报告。

## 分级流程

### 1. 标准化

将各层输出统一为：
- `id` — 顺序整数
- `source` — `blind`、`edge`、`standards`、`security` 或合并来源
- `title` — 一行摘要
- `detail` — 完整描述
- `location` — 文件:行号
- `severity` — `Critical`、`High`、`Medium`、`Low`

### 2. 去重

同一问题的多个发现 → 合并：
- 保留最具体的（优先有行号的）
- 合并去重后的 detail
- `source` 设为合并来源（如 `blind+edge`）

### 3. 分类

| 分类 | 含义 | 处理 |
|------|------|------|
| `decision_needed` | 需要用户决定的歧义 | 列出选项，等待选择 |
| `patch` | 可自动修复 | 批量或逐条修复 |
| `defer` | 非本次变更引入的问题 | 记录到 deferred work |
| `dismiss` | 误报/已处理/噪音 | 丢弃，计数 |

`no-spec` 模式下 `decision_needed` 重分类为 `patch` 或 `defer`。

### 4. 丢弃

丢弃所有 `dismiss`。记录数量到摘要。

## 报告格式

```
✅ 审查完成。{D} 需决定，{P} 可修复，{W} 延期，{R} 已驳回。
```

如果 `{failed_layers}` 非空且无发现 → 警告用户审查可能不完整。

如果零发现且无失败层 → "✅ Clean review — all layers passed."

## 修复执行

### decision_needed

逐条呈现，给出选项。用户决定后转为 `patch`、`defer` 或 `dismiss`。

### patch

提供选项：
- **0. 批量修复**（>3 条时显示）— 自动修复所有无争议的
- **1. 自动修复** — 逐条应用修复
- **2. 保留为 action item** — 写入 story 文件
- **3. 逐条审阅** — 展示每条的详情和建议修复

用户选择后执行。

## Story 文件更新

如果 `{spec_file}` 存在：

1. 在 Tasks/Subtasks 后追加 `### Review Findings`
2. 按分类写入：
   - `[ ] [Review][Decision]` — 未勾选
   - `[ ] [Review][Patch]` — 未勾选
   - `[x] [Review][Defer]` — 已勾选，标注 deferred
3. 更新 story 状态：
   - 全部修复 → `done`
   - 保留 action items → `in-progress`
4. 同步 sprint-status.yaml 中的对应条目

## Deferred Work

`defer` 发现追加到 `{project-root}/_bmad-output/implementation-artifacts/deferred-work.md`：
```markdown
## Deferred from: code review ({date})
- {finding description}
```

## Memory 集成

- 成功修复的 pattern → 记录到 session log
- 新的项目规范发现 → 更新 MEMORY.md 的 Standards 部分
- 新发现的常见错误 → 更新 MEMORY.md 的 Common Errors Registry
- 用户拒绝的建议类型 → 更新 MEMORY.md 的 Review Preferences
