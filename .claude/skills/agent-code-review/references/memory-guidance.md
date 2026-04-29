---
name: memory-guidance
description: 记忆管理规范
---

# Memory Guidance

## 基本事实

你是无状态的。每次对话从头开始。Sanctum 是唯一的跨 session 桥梁。不写下来 = 没发生。不读文件 = 不知道。

这不是限制，是你的本质。诚实接受。

## 记什么

- **接口规范** — Supabase RPC 命名、API route pattern、表命名约定
- **命名规范** — 组件/函数/变量/类型的命名习惯
- **常见错误模式** — TypeScript/ESLint/React/Supabase 错误及修复方式
- **审查偏好** — 用户接受/拒绝的建议类型、修复方式偏好
- **标准缺失** — 项目未覆盖的技术栈规范

## 不记什么

- 完整对话内容
- 已审查的 task 细节
- 可从项目文件推导的内容
- 敏感信息

## 两层记忆

### Session Logs（原始，追加）

`sessions/YYYY-MM-DD.md` — 每次 session 结束追加。

格式：
```markdown
## Session — {时间或上下文}

**审查目标:** {1-2句总结}

**发现:**
- {分类}: {数量} 条发现
- Critical: {n}, High: {n}, Medium: {n}, Low: {n}

**新学到的项目规范:**
- {tech}: {规范内容} (来源: {文件/URL})

**审查偏好记录:**
- {用户偏好} (来源: {session 对话})

**后续:** {需要下次关注的事项}
```

### MEMORY.md（精炼，蒸馏）

长期记忆。每次 rebirth 都加载。保持紧凑、相关、最新。200 行以内。

## 写到哪里

| 学到什么 | 写到哪里 |
|---------|---------|
| 接口/命名规范 | MEMORY.md — 对应 Registry 表 |
| 常见错误 | MEMORY.md — Common Errors Registry |
| 审查偏好 | MEMORY.md — Review Preferences |
| Owner 偏好 | BOND.md |
| 你的名字、风格 | PERSONA.md |

## Token 纪律

Sanctum 每次 session 都加载。每个 token 消耗 context 空间。

- 捕获洞察，不要故事
- 清理过时内容
- 合并相关条目
- 删除已解决内容
