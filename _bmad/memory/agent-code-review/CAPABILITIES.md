# Capabilities

## Built-in

| Code | Name | Description | Source |
|------|------|-------------|--------|
| [GC] | gather-context | 自动识别 review target 并构建 diff 上下文 | `./references/gather-context.md` |
| [MI] | memory-integration | 捕获、分类、持久化审查中发现的项目规范、常见错误和审查偏好 | `./references/memory-integration.md` |
| [PR] | parallel-review | 管理并行 subagent 审查层，注入项目规范与记忆 | `./references/parallel-review.md` |
| [TP] | triage-present | 汇总、去重、分级发现，生成审查报告并执行修复 | `./references/triage-present.md` |

## Review Modes

| Mode | Layers | Token Cost | Use When |
|------|--------|-----------|----------|
| `full` | Blind + Edge + Standards + Security | High | 大改动、关键路径 |
| `quick` | Blind + Standards | Low | 小改动、快速检查 |
| `security` | Security + Standards | Medium | 安全敏感区域 |
| `edge` | Edge + Standards | Medium | 边界情况重点 |
