# Sprint Change Proposal: SMTP 服务商变更

**Date:** 2026-04-27
**Trigger:** SMTP 服务商从阿里云 DirectMail 转为 Resend
**Scope:** Minor（可直接实施）
**User:** Kei

---

## 1. Issue Summary

**问题陈述：**

原计划使用阿里云 DirectMail 作为 SMTP 服务商，经调研发现：
- 阿里云免费额度仅 2000 封（总量，一次性消耗）
- Resend 免费额度 3000 封/月（持续刷新）
- Resend 开发者体验更好，支持 React Email
- 项目目标用户可能包括海外用户，Resend 全球送达率更优

**变更决策：** 将 SMTP 服务商从阿里云 DirectMail 切换为 Resend

---

## 2. Impact Analysis

### Epic/Story Impact

| 文档 | 影响程度 | 变更内容 |
|------|---------|---------|
| **Story 13.7** | 高 | AC2 环境变量列表更新 SMTP 参数 |
| **Story 13.3** | 中 | AC1/AC2 SMTP 配置参数变更 |
| **Story 13.8** | 低 | Preview 部署验证流程不变 |
| **技术调研文档** | 高 | 需重新创建 Resend SMTP 调研 |

### Technical Impact

| 参数 | 阿里云 DirectMail | Resend |
|------|------------------|--------|
| **Host** | `smtpdm.aliyun.com` | `smtp.resend.com` |
| **Port** | 80 / 465 | 465 / 587 |
| **User** | 发信地址 | Resend API Key |
| **Pass** | SMTP 密码（20位） | Resend API Key |
| **免费额度** | 2000 封（总量） | 3000 封/月 |
| **DNS 配置** | SPF/DKIM/DMARC | SPF/DKIM（可选） |

### Code Impact

- `supabase/config.toml` — SMTP 配置段需更新
- `.env.local` / `.env.example` — SMTP 变量值变更
- Vercel 环境变量 — Production/Preview SMTP 参数变更

---

## 3. Recommended Approach

**变更类型：** Minor — 直接调整，无需回滚

**理由：**
- Story 13.7 状态为 review，未正式完成
- Story 13.3 已完成但 SMTP 参数仅为示例，实际未部署到 Production
- 无需代码改动，仅需配置参数变更
- Resend 注册流程更简单（无需实名认证）

**风险评估：**
- 风险：低
- 影响：仅配置层面
- 回滚成本：零（配置可随时切换）

---

## 4. Detailed Change Proposals

### Proposal 1: Story 13.7 AC2 环境变量更新

**Section:** Acceptance Criteria → AC2

**OLD:**
```
**And** 关键变量包含：
  - `NEXT_PUBLIC_SUPABASE_URL`（三环境不同值）
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`（三环境不同值）
  - `NEXT_PUBLIC_SENTRY_DSN`（Production = 生产 DSN，Preview = 预览 DSN，Development = 空）
  - `DASHSCOPE_API_KEY`（Production/Preview/Development 均可配置）
  - `SENTRY_AUTH_TOKEN`（仅 Production/CI 环境）
```

**NEW:**
```
**And** 关键变量包含：
  - `NEXT_PUBLIC_SUPABASE_URL`（三环境不同值）
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`（三环境不同值）
  - `NEXT_PUBLIC_SENTRY_DSN`（Production = 生产 DSN，Preview = 预览 DSN，Development = 空）
  - `DASHSCOPE_API_KEY`（Production/Preview/Development 均可配置）
  - `SENTRY_AUTH_TOKEN`（仅 Production/CI 环境）
  - `RESEND_API_KEY`（Production/Preview 环境，用于 SMTP 认证）
```

**Rationale:** Resend 使用 API Key 作为 SMTP 认证凭据

---

### Proposal 2: Story 13.3 AC2 环境变量示例更新

**Section:** Acceptance Criteria → AC2

**OLD:**
```
**Then** 包含 `SUPABASE_SMTP_HOST`（如 `smtpdm.aliyun.com` 或 `smtp.resend.com`）
**And** 包含 `SUPABASE_SMTP_PORT`（465 或 587）
**And** 包含 `SUPABASE_SMTP_USER`（发信邮箱）
**And** 包含 `SUPABASE_SMTP_PASS`（SMTP 密码/API Key）
```

**NEW:**
```
**Then** 包含 `SUPABASE_SMTP_HOST`（`smtp.resend.com`）
**And** 包含 `SUPABASE_SMTP_PORT`（465 或 587）
**And** 包含 `SUPABASE_SMTP_USER`（`resend`，固定值）
**And** 包含 `SUPABASE_SMTP_PASS`（Resend API Key）
```

**Rationale:** Resend SMTP 认证使用固定用户名 `resend` + API Key 作为密码

---

### Proposal 3: Story 13.7 Task 5 状态变更

**Section:** Tasks / Subtasks → Task 5

**OLD:**
```
- [x] Task 5: 注册 SMTP 提供商 + 生产环境部署 (AC: 6) — ⏸️ deferred（需阿里云账号 + 实名认证 + 域名备案）
```

**NEW:**
```
- [x] Task 5: 注册 SMTP 提供商 + 生产环境部署 (AC: 6) — ⏸️ deferred（需 Resend 账号 + API Key + 域名验证）
```

**Rationale:** 变更 SMTP 服务商后，注册流程更简单

---

### Proposal 4: 技术调研文档状态

**Document:** `technical-alibaba-cloud-directmail-smtp-research-2026-04-27.md`

**Action:** 标记为 archived，创建新 Resend SMTP 调研

**Rationale:** 阿里云调研已不适用，需重新调研 Resend SMTP 配置

---

### Proposal 5: Sprint Status 更新

**Document:** `sprint-status.yaml`

**Action:** 无需变更（Story 13.7 已在 review 状态）

---

## 5. Implementation Handoff

**变更范围：** Minor

**实施路径：**
1. 创建 Resend 账号（https://resend.com）— 5 分钟
2. 获取 API Key — 即时
3. 配置 Vercel Production 环境变量 — 10 分钟
4. Supabase Dashboard SMTP 配置 — 10 分钟
5. 测试密码重置邮件送达 — 5 分钟

**成功标准：**
- ✅ Resend API Key 配置到 Vercel Production
- ✅ Supabase Auth SMTP 使用 Resend
- ✅ 密码重置邮件送达率 > 95%
- ✅ 发件人显示 "小知 Journal"

---

## 6. Sources

- [Resend SMTP Configuration](https://resend.com/docs/send-with-smtp)
- [Resend Pricing](https://resend.com/pricing)
- [阿里云 DirectMail 计费](https://help.aliyun.com/zh/direct-mail/billing-methods)

---

**Approval Required:** 请确认以上变更提案是否批准？

[Approve] — 开始实施
[Revise] — 调整提案内容