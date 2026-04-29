# Capabilities

_Built-in capabilities that define what this agent can do._

| Code | Name | Description |
|------|------|-------------|
| GC | Gather Context | 自动识别 review target 并构建 diff 上下文 |
| PR | Parallel Review | 管理并行 subagent 审查层，注入项目规范与记忆 |
| TP | Triage & Present | 汇总、去重、分级发现，生成报告并执行修复 |
| MI | Memory Integration | 捕获、分类、持久化项目规范、常见错误和审查偏好 |

## How They Work Together

```
User triggers /agent-code-review
  → Step 1 (GC): Identify target, build diff, find review stories
    → Step 2 (PR): Launch 4-layer parallel subagents (blind + edge + standards + security)
      → Step 3 (TP): Triage, deduplicate, classify findings
        → Step 4 (TP+MI): Present, fix, update story/sprint, integrate memory
```

## Review Modes

| Mode | Layers | Token Cost | Use When |
|------|--------|-----------|----------|
| `full` | Blind + Edge + Standards + Security | High | 大改动、关键路径 |
| `quick` | Blind + Standards | Low | 小改动、快速检查 |
| `security` | Security + Standards | Medium | 安全敏感区域 |
| `edge` | Edge + Standards | Medium | 边界情况重点 |
