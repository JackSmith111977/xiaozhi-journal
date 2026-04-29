---
name: Code Review 全量修复策略
description: 收到 review findings 时应批量修复而非挑选，遵循 lint gate 不可破坏原则
type: feedback
---

**Rule:** 所有 review findings（High/Medium/Low）必须一次性全部修复，不跳过不推迟。

**Why:** 用户明确要求 "全都需要"。部分修复会导致后续重复 code review 流程，浪费时间。

**How to apply:**
- 列出全部 findings 后规划修复顺序（通常：先提取组件 → 替换颜色 → 加 aria/reduced-motion → 去 lint）
- 每改一批就跑一次 pnpm lint + tsc --noEmit，确保门禁不被破坏
- 发现 TypeScript 类型收窄问题（如 mode 字符串在 if-return 后被收窄为 never）时，提取子组件而非用类型断言绕过
- eslint-disable-next-line 必须放在报错的同一行，不能放在上一行
