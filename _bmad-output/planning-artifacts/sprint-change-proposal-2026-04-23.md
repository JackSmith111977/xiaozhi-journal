# Sprint Change Proposal — Vercel 部署 Story 补充

**日期**: 2026-04-23
**触发者**: Correct Course 流程（`/bmad-correct-course`）
**范围分类**: Minor（直接实现，无需 Epic 级别变更）

---

## 1. 问题摘要

Vercel 部署最佳实践文档已固化（`_bmad-output/standards/vercel-deployment-environments-best-practices.md`），覆盖三环境模型（Production/Preview/Development）、分支映射、环境变量隔离、分支级变量覆盖等内容。

但 Epic 13 的 Story 未覆盖这些能力：
- Story 13.1（CI/CD 流水线）原始 AC 仅 5 行，缺少 Preview 部署、Source Maps CI、环境变量隔离等内容
- 无 Story 覆盖 Vercel 三环境变量配置
- 无 Story 覆盖 Preview 部署验证流程

此缺口导致 CI/CD 实现缺少关键的环境隔离和验证能力。

---

## 2. 影响分析

### Epic 影响

| Epic | 影响 |
|------|------|
| Epic 13: 部署与运维 | Story 13.1 AC 扩展 + 新增 Story 13.7/13.8 |

### Artifact 冲突

| 文件 | 变更类型 |
|------|---------|
| `epics.md` | Story 13.1 AC 扩展 + 新增 Story 13.7/13.8 |
| `sprint-status.yaml` | 新增 13-7/13-8 条目 |
| `implementation-artifacts/13-7-vercel-three-env-config.md` | 新建 |
| `implementation-artifacts/13-8-preview-deployment-verification.md` | 新建 |

### 技术影响

- 不影响现有代码
- 不涉及架构变更
- 仅补充规划文档和 Story 定义

---

## 3. 推荐路径

**Option 1: Direct Adjustment**

修改现有 Story 13.1 AC，新增 Story 13.7/13.8。

- 工作量: Low
- 风险: Low
- 不需要回滚或 MVP 重定义

---

## 4. 详细变更

### Story 13.1: CI/CD 流水线（AC 扩展）

**新增 AC**:
- PR 推送自动触发 Preview 部署 + GitHub PR 评论含 Preview URL
- `SENTRY_AUTH_TOKEN` 仅 CI 环境变量，自动上传 Source Maps
- 本地开发 `vercel dev` / `vercel env pull` 流程
- 环境变量修改后 Redeploy 要求

### Story 13.7: Vercel 三环境配置（新建）

覆盖：
- Production Branch 配置（main）
- 环境变量三环境隔离（Development/Preview/Production）
- `VERCEL_ENV` 系统变量使用
- 分支级变量覆盖
- Sentry 按环境采样率区分
- 安全要求（`.env*` 不提交、`SENTRY_AUTH_TOKEN` 仅 CI）

### Story 13.8: Preview 部署验证流程（新建）

覆盖：
- PR 自动触发 Preview 部署 + 唯一 URL
- Preview 环境变量隔离验证
- 浏览器 Console 无错误验证
- Share Deployment 临时分享

---

## 5. 实施交接

| 项目 | 内容 |
|------|------|
| 范围分类 | Minor |
| 执行角色 | Developer agent |
| 交付物 | 更新 `epics.md`、`sprint-status.yaml`，创建 13-7/13-8 story 文件 |
| 成功标准 | 所有文档更新完毕，可通过 `bmad-dev-story` 开始实现 |

---

## 6. Checklist 执行记录

| 章节 | 状态 |
|------|------|
| 1.1 触发 Story 识别 | [x] Epic 13 CI/CD 相关 Story |
| 1.2 核心问题定义 | [x] Vercel 最佳实践缺少对应 Story |
| 1.3 初始影响评估 | [x] 仅 Epic 13 文档影响 |
| 2.1 当前 Epic 评估 | [x] Epic 13 仍可按原计划完成 |
| 2.2 Epic 级别变化 | [x] 无需修改 Epic scope |
| 2.3 未来 Epic 审查 | [x] 无影响 |
| 2.4 新 Epic 需求 | [x] 不需要 |
| 2.5 优先级调整 | [x] 不需要 |
| 3.1 PRD 冲突检查 | [x] 无冲突 |
| 3.2 架构冲突检查 | [x] 无冲突，architecture.md 已提及 Vercel 分支策略 |
| 3.3 UI/UX 冲突检查 | [x] 不适用 |
| 3.4 其他 Artifact 影响 | [x] 无 |
| 4.1 Direct Adjustment | [x] Viable — 推荐路径 |
| 4.2 Rollback | [x] Not viable — 不需要 |
| 4.3 MVP Review | [x] Not viable — 不影响 |
| 4.4 选定路径 | [x] Option 1 |
| 5.1 问题摘要 | [x] 完成 |
| 5.2 影响文档 | [x] 完成 |
| 5.3 推荐路径 | [x] 完成 |
| 5.4 MVP 影响 | [x] 无影响 |
| 5.5 交接计划 | [x] Developer agent 直接实现 |
| 6.4 sprint-status.yaml 更新 | [x] 新增 13-7/13-8 |
| 6.5 下一步确认 | [x] 通过 `bmad-dev-story` 开始 13-7 |
