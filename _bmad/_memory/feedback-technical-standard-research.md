---
name: technical-standard-research-workflow
description: 技术标准调研与固化的标准流程
type: feedback
---

# 技术标准调研与固化流程

**规则**: 每次调研新技术栈最佳实践时，遵循以下流程：

**Why**: 确保调研成果可复用、可追溯，成为 BMad dev-story 和 code-review 的参考依据。

**How to apply**:

## 1. 调研阶段

使用 BMad skill `bmad-technical-research`：
- Prompt 格式：`"{Technology} {Version} best practices {Year}"`
- 调研内容：
  - 官方文档最新版本
  - 核心配置模式（代码片段）
  - 最佳实践要点
  - 常见陷阱
  - 与旧版本的关键变更（如 migration guide）

## 2. 固化阶段

调研完成后执行：

**Step 1**: 创建标准文档
- 路径：`_bmad-output/standards/{technology}-{version}-best-practices.md`
- 文件名：kebab-case，如 `sentry-nextjs-best-practices.md`
- 内容结构：
  1. 核心配置（代码片段）
  2. 最佳实践要点（bullet points）
  3. 常见陷阱
  4. Migration 关键变更（如有）
  5. 参考链接（官方文档 URL）

**Step 2**: 更新 project-context.md
- Technology Stack 表格：添加新技术包 + 版本
- Technical Standards Reference 表格：添加新标准文件路径

**Step 3**: 更新 AGENTS.md
- 添加 `<!-- BEGIN:{technology}-agent-rules -->` 区块
- 包含关键规则（不超过 10 行）

## 3. 提交规范

Commit message 格式：
```
docs: 固化 {Technology} {Version} 最佳实践

调研成果固化到技术标准目录：
- _bmad-output/standards/{file} — 官方文档最佳实践参考
- docs/project-context.md — Technology Stack + Reference
- xiaozhi-journal/AGENTS.md — Agent rules

关键要点：{3-5 条}

目录统一：技术标准统一放 _bmad-output/standards/

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## 4. 目录约定

| 目录 | 用途 |
|------|------|
| `_bmad-output/standards/` | 技术标准规范（所有技术栈）|
| `_bmad/_memory/` | BMad 记忆系统（user/feedback/project/reference）|

**禁止**: 将技术标准放入 `_bmad/_memory/`