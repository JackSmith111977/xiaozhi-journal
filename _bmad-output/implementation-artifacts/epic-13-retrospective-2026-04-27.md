---
epic_number: 13
epic_title: 部署与运维（扩展）
user_name: Kei
date: 2026-04-27
status: done
---

# Epic 13 Retrospective: 部署与运维（扩展）

**Date:** 2026-04-27
**Facilitator:** Amelia (Developer)
**Participants:** Kei (Project Lead), Alice (Product Owner), Charlie (Senior Dev), Dana (QA Engineer)

---

## Epic Summary

**Epic 13: 部署与运维（扩展）** — 9 Stories 全部完成

| Metric | Value |
|--------|-------|
| Completed Stories | 9/9 (100%) |
| Deferred Items | 3 (合理 deferred) |
| Correct Course Actions | 2 (SMTP 变更 + Preview 验证简化) |
| Code Review Patches | 5 (Story 13.3) |

**Stories:**
- 13-1: CI/CD Pipeline ✓
- 13-2: Error Monitoring (Sentry) ✓
- 13-3: SMTP Email Service ✓
- 13-4: Transactional Email System ✓
- 13-5: Domain SSL Config ✓
- 13-6: Database Backup Strategy ✓
- 13-7: Vercel 三环境配置 ✓
- 13-8: Preview 部署验证 ✓
- 13-9: pnpm Standardization ✓

---

## What Went Well

### 1. Correct Course 工作流有效

**Amelia (Developer):** "SMTP 服务商从阿里云 DirectMail 变更为 Resend 的决策非常正确。"

**Charlie (Senior Dev):** "Resend 免费额度 3000 封/月 vs 阿里云 2000 封总量，明显更适合 MVP 阶段。注册流程也更简单，无需实名认证。"

**Alice (Product Owner):** "而且 Resend 全球送达率更好，符合项目可能扩展海外用户的战略。"

### 2. Deferred 决策务实

**Amelia (Developer):** "DAU<100 时的 deferred 决策很合理。SENTRY_AUTH_TOKEN（Source Maps）和分支级变量验证都延后了，避免过度工程。"

**Dana (QA Engineer):** "这符合 MVP 原则 — 先确保核心功能可用，不追求完美主义。"

### 3. Supabase 集成顺畅

**Charlie (Senior Dev):** "Supabase Auth + SMTP + Edge Function 的集成比预期顺利。本地 Mailpit 测试环境与生产 Resend 配置隔离清晰。"

**Kei (Project Lead):** "密码重置邮件成功送达验证通过，用户流程闭环完成。"

### 4. Vercel 三环境模型清晰

**Amelia (Developer):** "Production/Preview/Development 三环境隔离 + VERCEL_ENV 系统变量使用，使 Sentry 采样率配置正确区分环境。"

---

## Challenges & Lessons Learned

### 1. Supabase 模板配置细节

**Challenge:** `content_path` 路径问题和模板 section 名称混淆

**Lesson:**
- 模板 section 必须使用 `[auth.email.template.recovery]`（非 `reset_password`）
- `content_path` 相对于项目根目录，非 `supabase/` 目录
- Inbucket SMTP 端口为 1025（非 2500）

**Action:** 文档化 Supabase 模板配置注意事项

### 2. Edge Function Deno Runtime 隔离

**Challenge:** `tsconfig.json` 需排除 `supabase/functions`，否则 Next.js 构建报 Deno 类型错误

**Lesson:** Edge Function 使用 Deno runtime，与 Next.js TypeScript 环境需隔离

**Action:** 在 `tsconfig.json` exclude 中添加 `supabase/functions`

### 3. 邮件模板 CSS 零复用

**Challenge:** Supabase 无 partial/include 机制，邮件模板 CSS 重复

**Lesson:** 平台限制，无法改进。保持现状，接受重复。

**Action:** 无（接受平台限制）

### 4. Preview 部署验证需手动确认

**Challenge:** Vercel Authentication 保护 Preview URL，自动化验证受阻

**Lesson:** 验证型 Story 可能需要用户手动确认而非完全自动化

**Action:** 标记为用户验证完成，接受非自动化流程

---

## Code Review Highlights (Story 13.3)

**Patches Applied:**
- SMTP port 硬编码 → `env()` 引用
- Google Fonts `@import` 删除（隐私 + 邮件客户端不支持）
- `.note` 冗余内联样式移除
- `<html>` 添加 `lang="zh-CN"`
- 页脚对比度修复（WCAG AA）

**Deferred (合理):**
- 模板 "1小时" 有效期硬编码
- DKIM/SPF/DMARC 配置文档（基础设施范畴）
- TLS/SSL SMTP 配置（Supabase 内部处理）

---

## Technical Debt Status

| Item | Status | Priority |
|------|--------|----------|
| Lint 错误 (14 errors, 21 warnings) | Deferred | Low |
| SENTRY_AUTH_TOKEN Source Maps | Deferred (DAU<100) | Low |
| 分支级变量验证 | Deferred | Low |

---

## Next Epic Preparation

**Next Epic:** Epic 5（日记历史与详情）或 Epic 14（支付基础设施）

**Dependencies on Epic 13:**
- SMTP 邮件服务可用于所有后续 Epic
- Vercel 三环境配置稳定
- Sentry 错误监控就绪

**No blockers** — Epic 13 完成且稳定，后续 Epic 可正常开始。

---

## Action Items

| Item | Owner | Priority | Status |
|------|-------|----------|--------|
| 文档化 Supabase 模板配置细节 | Amelia | Medium | Done（Story 13.3 Dev Notes）|
| tsconfig.json 排除 Edge Function | Charlie | High | Done |
| Lint 错误追踪 | Dana | Low | Deferred |

---

## Team Agreements

1. **Deferred 决策原则:** DAU<100 时可合理延后非必需基础设施
2. **Correct Course 触发条件:** 发现更优替代方案时立即执行 Sprint Change Proposal
3. **验证型 Story:** 用户手动确认可替代完全自动化验证

---

## Summary

**Epic 13 完成状态:** ✅ 100% 完成，无遗留 blockers

**Key Takeaways:**
1. Correct Course 工作流验证有效，SMTP 变革决策正确
2. Supabase 集成比预期顺利，本地/生产环境隔离清晰
3. Deferred 决策务实，避免过度工程
4. 验证型 Story 可接受用户手动确认

**Preparation for Next Epic:** 无必需准备工作，可直接开始

---

## Change Log

- Retrospective 完成（2026-04-27）
- Sprint Status: epic-13-retrospective → done