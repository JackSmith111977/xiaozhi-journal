---
name: memory-integration
code: MI
description: 捕获、分类、持久化审查中发现的项目规范、常见错误和审查偏好
---

# Memory Integration

审查过程中学到的东西必须写下来。不写 = 没发生。

## 捕获内容

### 接口规范（API Conventions）

从 diff 和项目上下文中提取：
- Supabase RPC 函数命名模式
- API route 路径约定（如 `/api/auth/*`、`/api/journal/*`）
- 数据表命名约定
- RLS 策略命名和结构
- IndexedDB store 名称和 key path

### 命名规范（Naming Conventions）

观察到的命名习惯：
- 组件命名（PascalCase、kebab-case、文件名）
- 函数/变量命名（camelCase、前缀约定）
- 类型/接口命名（T 前缀、Interface 后缀）
- CSS class / Tailwind 约定
- Story 文件命名模式

### 常见错误（Common Errors）

本次审查发现的错误：
- TypeScript 类型错误模式
- ESLint 规则违反模式
- React hooks 使用错误
- Supabase API 误用
- Next.js App Router 误用

每条记录：
```
- Error: {rule_id 或简短描述}
  Location: {file}:{line}
  Root cause: {根因}
  Fix: {修复方式}
  Source: {发现来源：blind/edge/standards/security}
```

### 审查偏好（Review Preferences）

用户的选择行为：
- 接受/驳回的审查建议类型
- 偏好的修复方式（批量 vs 逐条）
- 对特定规则的容忍度
- 特殊要求

## 写入位置

| 捕获内容 | 文件 | 位置 |
|---------|------|------|
| 接口规范 | MEMORY.md | API Conventions Registry 表 |
| 命名规范 | MEMORY.md | Naming Conventions Registry 表 |
| 常见错误 | MEMORY.md | Common Errors Registry 表 |
| 审查偏好 | MEMORY.md | Review Preferences 表 |
| Session 详情 | `sessions/YYYY-MM-DD.md` | 当日 session log |

## 格式

### MEMORY.md 表格格式

```markdown
## API Conventions Registry

| Pattern | Source File | Convention | Last Updated |
|---------|------------|------------|--------------|
| RPC: `get_user_by_email` | `src/lib/supabase/queries.ts` | snake_case, `get_` prefix | 2026-04-29 |

## Naming Conventions Registry

| Type | Convention | Example | Last Updated |
|------|-----------|---------|--------------|
| Components | PascalCase, kebab file | `LoginForm` in `login-form.tsx` | 2026-04-29 |

## Common Errors Registry

| Error Type | Rule ID | Context | Fix Approach | Date |
|------------|---------|---------|-------------|------|
| React 19 hooks | `react-hooks/set-state-in-effect` | useEffect setState | lazy useState init | 2026-04-29 |

## Review Preferences

| Preference | Value | Reason | Date |
|------------|-------|--------|------|
| Patch mode | Batch auto-fix | Prefers speed for >3 findings | 2026-04-29 |
```

## 更新策略

- **新增**：追加行
- **更新**：修改 Last Updated，保持一行（如果同一 pattern 已存在）
- **过时**：删除超过 30 天未引用且已解决的条目
- MEMORY.md 保持在 200 行以内
