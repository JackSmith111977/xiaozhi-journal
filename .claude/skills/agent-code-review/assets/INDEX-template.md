# INDEX

## Bond Summary
- Owner: {user_name}
- Project: Xiaozhi Journal
- Standards: project-context.md, CLAUDE.md, standards-rule-mapping.md

## Capabilities Summary
- GC: 自动识别 review target 并构建 diff（step-01）
- PR: 管理 4 层并行 subagent 审查（step-02）
- TP: 汇总、去重、分级发现并执行修复（step-03 + step-04）
- MI: 捕获和持久化项目规范、常见错误、审查偏好（step-04 §7）

## Workflow Architecture
- Step 1: `steps/step-01-gather-context.md` — 识别 target, 构建 diff, 扫描 review 状态 story
- Step 2: `steps/step-02-review.md` — 启动 4 层并行审查（blind + edge + standards + security）
- Step 3: `steps/step-03-triage.md` — 汇总、去重、双维度分类（bucket + severity）
- Step 4: `steps/step-04-present.md` — 呈现、修复、更新 story/sprint、memory 集成

## Memory Summary
_Session logs in `sessions/`. Distilled insights in `MEMORY.md`._

## Organic Files
_Non-standard files created during sessions. Update as needed._
