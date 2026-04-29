---
name: detect-missing-standards
code: MS
description: 检测缺失的技术标准
---

# Detect Missing Standards

在Gate Check和Fix Loop过程中检测项目标准缺失。

## 检测逻辑

### 技术栈识别

扫描代码中涉及的技术栈：
- Supabase (RPC, RLS, migrations)
- Next.js (App Router, API routes, middleware)
- Sentry (config, beforeSend)
- Vercel (CLI, environments)
- React (hooks, components)
- 其他框架/库

### 标准查找

对每个识别的tech：
```
lookup in {project_standards}:
  - project-context.md → 搜索 "{tech}" section
  - CLAUDE.md → 搜索 "{tech}" 相关规则
  - AGENTS.md → 搜索 "{tech}" 相关约束
  - MEMORY.md → 搜索历史 "{tech}" 标准
```

### 缺失标记

如果未找到：
```
missing-standard:{tech}:
  detected_in: {file}:{line}
  context: {代码片段}
  status: pending
  action: 建议运行 bmad-technical-research 建立 {tech} 规范
```

## 不阻塞执行

missing-standard只是记录，不阻塞代码执行：
- Gate Check仍可通过 (只要没有violation)
- Fix Loop不处理missing-standard
- Task可以继续完成

## 任务结束报告

在story完成时，如果有missing-standard：

```
⚠️ 标准缺失检测报告

| Tech | Detected In | Status | Recommended Action |
|------|-------------|--------|-------------------|
| Vercel CLI | `vercel-deploy.ts:15` | pending | run bmad-technical-research |
| Sentry beforeSend | `sentry.client.config.ts:20` | pending | run bmad-technical-research |

建议:
下次开发前运行 `/bmad-technical-research {tech}` 建立规范。
或在 Pulse 时自动进行TR。
```

## Memory记录

将missing-standard记录到：
- Session log: 当日发现
- MEMORY.md: Missing Standards Registry table
- BOND.md: 项目标准缺失清单

下次遇到同一tech时，提前告知用户："该技术栈缺少标准"。