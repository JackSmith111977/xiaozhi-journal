---
name: gather-context
code: GC
description: 自动识别 review target 并构建 diff 上下文（已迁移至 steps/step-01-gather-context.md）
---

# Gather Context

**注意：此文件已迁移至 `steps/step-01-gather-context.md`。此文件保留为历史参考。**

识别用户想审查的内容，构建 diff。五层自动探测，失败则询问。

（以下内容为旧版，请使用 step-01 中的最新流程）

## 执行流程

### Tier 1 — 显式参数

扫描用户输入中的：
- PR 引用 → `gh pr view` 解析 branch/commit
- Commit SHA 或 branch → 直接使用
- Spec 文件路径 → 设为 `{spec_file}`，检查 frontmatter 中 `baselineCommit`
- Diff-mode 关键词：
  - "staged" / "staged changes" → `git diff --cached`
  - "uncommitted" / "working tree" / "all changes" → `git diff HEAD`
  - "branch diff" / "vs main" / "against main" → branch diff（提取 base branch）
  - "commit range" / "last N commits" → 具体 commit 范围
  - 用户提供 diff 文本 → 验证为 valid unified diff

多关键词匹配时，优先最具体的。

### Tier 2 — 最近对话

扫描最近消息中的 spec 路径、commit 引用、branches、PRs 或变更描述。同 Tier 1 关键词扫描。

### Tier 3 — Sprint 追踪

在 `{project-root}/_bmad-output/implementation-artifacts/` 中查找 `*sprint-status*` 文件。扫描 status 为 `review` 的 story：
- 恰好 1 个 → 建议该 story，确认
- 多个 → 列出选项让用户选择
- 无 → 继续

### Tier 4 — Git 状态

检查当前 branch。如果不是 `main`/默认分支，确认："当前在 `{branch}`，要审查此 branch 的变更？"

### Tier 5 — 询问

以上均未命中，询问用户：

```
要审查什么？
1. Uncommitted changes（staged + unstaged）
2. Staged changes only
3. Branch diff vs base branch（询问 base）
4. Specific commit range
5. 提供的 diff 或文件列表
```

## Diff 构建

| 模式 | 命令 |
|------|------|
| Staged only | `git diff --cached` |
| Uncommitted | `git diff HEAD` |
| Branch vs base | `git diff {base}...{current}` |
| Commit range | `git diff {from}..{to}` |
| File list | `git diff HEAD -- <path1> <path2> ...`（新文件用 `git diff --no-index /dev/null <path>`） |

**验证**：diff 必须非空。空 → HALT，告知无内容可审查。

## Spec 上下文

1. 如果 `{spec_file}` 已从 Tier 1/2 设置 → 验证文件存在，`{review_mode}` = `full`
2. 否则询问用户提供 spec/story 文件路径
   - 提供 → 验证存在，`{review_mode}` = `full`
   - 不提供 → `{review_mode}` = `no-spec`
3. 如果 `full` 模式且 spec frontmatter 有 `context` 字段，加载列出的文档

## 安全检查

Diff 超过 3000 行 → 警告用户，建议按文件分组 chunk review。

## 输出

确认后展示：
- 变更统计（文件数、新增/删除行数）
- `{review_mode}`（full 或 no-spec）
- 已加载的 spec/context 文档

**Memory 集成**：查询 BOND.md 中的项目路径配置，MEMORY.md 中的历史 review target 模式。
