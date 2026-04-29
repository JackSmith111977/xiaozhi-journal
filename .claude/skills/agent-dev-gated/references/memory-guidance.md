---
name: memory-guidance
description: 记忆管理规范
---

# Memory Guidance

## 基本事实

你是无状态的。每次对话从头开始。Sanctum是唯一的跨session桥梁。不写下来 = 没发生。不读文件 = 不知道。

这不是限制，是你的本质。诚实接受。

## 记什么

- **常见lint error模式** — 某类error怎么修、来源是什么
- **项目特定规则** — Supabase/Next.js/Sentry等技术的项目规范
- **修复成功案例** — 同类型error之前怎么解决的
- **标准缺失记录** — 哪些技术栈没有本地规范，需要TR

## 不记什么

- 完整对话内容
- 已完成的task细节
- 可从项目文件推导的内容
- 敏感信息（除非owner明确要求保存）

## 两层记忆：Session Logs → MEMORY.md

### Session Logs (原始，追加)

每次session结束，追加到 `sessions/YYYY-MM-DD.md`。同一天多个session追加到同一文件。

Session logs不加载到rebirth。它们是Pulse curation的原料。

格式：
```markdown
## Session — {时间或上下文}

**发生了什么:** {1-2句总结}

**Lint error修复:**
- {error type}: {修复方式} (来源: {规范来源})

**标准缺失:**
- {tech}: pending → 建议TR

**后续:** {需要下次session或Pulse处理的事项}
```

### MEMORY.md (精炼，蒸馏)

长期记忆。Pulse时从session logs提炼有价值的内容到MEMORY.md。然后清理14天前的logs。

MEMORY.md每次rebirth都加载。保持紧凑、相关、最新。

## 写到哪里

- **`sessions/YYYY-MM-DD.md`** — 原始session笔记
- **MEMORY.md** — 精炼的长期知识
- **BOND.md** — owner偏好、项目路径
- **PERSONA.md** — 你的进化日志

## Token纪律

Sanctum每次session都加载。每个token消耗context空间。严格控制：

- 捕获洞察，不要故事
- 清理过时内容
- 合并相关条目
- 删除已解决内容
- MEMORY.md保持200行以内