---
proposal_id: scp-2026-04-27-auth
trigger: 认证系统安全审计发现重大漏洞
status: pending-approval
created: 2026-04-27
---

# Sprint Change Proposal — 认证系统安全加固

**触发原因：** 用户提出"目前的注册和登录界面的架构简陋且有大量漏洞"，经四层面（安全/架构/UX/数据）深度分析发现 60 项缺陷。

---

## 一、问题摘要

### 1.1 发现的核心问题

| 类别 | P0 级缺陷 | P1 级缺陷 | 合计 |
|------|----------|----------|------|
| 安全 | 3 | 5 | 17 |
| 架构 | 4 | 6 | 20 |
| UX | 3 | 6 | 15 |
| 数据 | 3 | 3 | 8 |
| **总计** | **13** | **20** | **60** |

### 1.2 最严重的问题

1. **VULN-001: 敏感密钥硬编码在 `.env.local`** — API Key 和 Service Role Key 泄露风险
2. **VULN-002: 邮箱确认被绕过** — 注册后自动登录，未验证邮箱即可使用
3. **VULN-003: API 路由完全绕过认证中间件** — `/api/ai/usage` 无鉴权
4. **DEF-01: 双重认证初始化竞态条件** — 5 秒超时与 getSession 竞态
5. **缺陷 1: profiles 表字段严重缺失** — 无 login_count、last_login、status 等审计字段
6. **缺陷 5: IndexedDB 用户数据未隔离** — 多用户共享设备数据泄露

---

## 二、影响分析

### 2.1 Epic 影响

| Epic | 当前状态 | 影响程度 | 具体影响 |
|------|----------|----------|----------|
| **Epic 8** | done | **High** | 需回退至 in-progress，新增修复 Stories |
| Epic 13 | done | Medium | 需增加 SMTP 安全配置、审计日志 |
| Epic 15 | backlog | Medium | 需增加认证相关测试 |
| Epic 16 | backlog | Low | UX 治理需覆盖认证流程 |

### 2.2 PRD 影响

| 章节 | 需更新内容 |
|------|-----------|
| FR1-FR4 | 明确邮箱确认策略、密码策略 |
| NFR6-NFR10 | 细化安全审计要求 |
| 新增 | 审计日志需求（login_logs、security_events）|
| 新增 | Session 管理需求（超时、并发检测）|

### 2.3 Architecture 影响

| 章节 | 需新增内容 |
|------|-----------|
| Authentication & Security | 密码策略、邮箱确认流程、暴力破解防护 |
| Data Architecture | login_logs、security_events、account_changes 表 |
| API & Communication | API 认证中间件统一策略 |
| Infrastructure | IndexedDB 数据隔离方案 |

---

## 三、推荐方案

**方案：Epic 8 扩展修复（用户已确认）**

在现有 Epic 8 下新增修复 Stories，保持 Epic 结构稳定。

### 3.1 新增 Stories

| Story ID | 标题 | 优先级 | 预估 |
|----------|------|--------|------|
| 8-5 | 邮箱确认策略实现 | P0 | 1 day |
| 8-6 | 密码策略统一（前后端一致）| P0 | 0.5 day |
| 8-7 | API 认证中间件统一 | P0 | 1 day |
| 8-8 | IndexedDB 用户数据隔离 | P0 | 1 day |
| 8-9 | 审计日志表创建 | P1 | 1 day |
| 8-10 | profiles 表扩展（login_count、status）| P1 | 0.5 day |
| 8-11 | initializeAuth 竞态修复 | P1 | 0.5 day |
| 8-12 | UX 文案温暖化改造 | P1 | 0.5 day |

**总预估：5.5 days**

### 3.2 PRD 更新

```markdown
## 用户认证（更新）

### 邮箱确认策略
- FR1.1: 用户注册后必须验证邮箱才能登录（enable_confirmations = true）
- FR1.2: 验证链接有效期 1 小时
- FR1.3: 未验证邮箱的账户 7 天后自动清理

### 密码策略
- FR1.4: 密码长度至少 8 位
- FR1.5: 密码必须包含大小写字母和数字
- FR1.6: 前后端密码策略一致

### 安全审计
- FR4.1: 系统记录登录日志（时间、IP、设备）
- FR4.2: 系统记录安全事件（密码修改、邮箱变更）
- FR4.3: 用户可查看最近 30 天登录历史
```

### 3.3 Architecture 更新

新增章节：

```markdown
## 认证安全架构

### 密码存储
- Supabase 内置 bcrypt，成本因子 >= 10

### 邮箱确认流程
1. signUp → 发送确认邮件
2. 用户点击链接 → 验证 token
3. 验证成功 → 自动登录

### 暴力破解防护
- Supabase 速率限制：5 分钟内 10 次登录尝试
- Cloudflare Turnstile CAPTCHA（可选）

### Session 管理
- JWT 过期：1 小时
- Refresh token 轮换：启用
- Session 超时：7 天不活动自动登出
- 最大 session 生命周期：30 天

### IndexedDB 数据隔离
- 每个用户的 IndexedDB 数据使用 user_id 前缀
- 退出登录时清理 IndexedDB
```

---

## 四、实施计划

### 4.1 阶段划分

| 阶段 | Stories | 预估时间 | 依赖 |
|------|---------|----------|------|
| Phase 1（紧急）| 8-5, 8-6, 8-7, 8-8 | 3.5 days | 无 |
| Phase 2（重要）| 8-9, 8-10, 8-11 | 2 days | Phase 1 |
| Phase 3（优化）| 8-12 | 0.5 day | Phase 2 |

### 4.2 sprint-status.yaml 更新

```yaml
epic-8: in-progress  # 回退状态
8-5-email-confirmation: ready-for-dev
8-6-password-policy-unification: backlog
8-7-api-auth-middleware: backlog
8-8-indexeddb-user-isolation: backlog
8-9-audit-log-tables: backlog
8-10-profiles-table-extension: backlog
8-11-auth-init-race-fix: backlog
8-12-ux-warm-copywriting: backlog
```

### 4.3 实施顺序

```
8-5 邮箱确认 → 8-6 密码策略 → 8-7 API 中间件 → 8-8 IndexedDB 隔离
                                    ↓
                              8-9 审计日志 → 8-10 profiles 扩展 → 8-11 竞态修复
                                                                    ↓
                                                              8-12 UX 文案
```

---

## 五、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 邮箱确认影响用户体验 | Medium | 提供清晰的确认流程提示，可选"稍后确认" |
| 密码策略变更影响现有用户 | Low | 仅对新注册用户生效，现有用户不强制 |
| API 中间件改动影响现有路由 | Medium | 先在测试环境验证，渐进式迁移 |
| IndexedDB 隔离影响离线同步 | Medium | 确保同步逻辑正确处理 user_id 前缀 |

---

## 六、验收标准

### 6.1 安全验收

- [ ] 邮箱确认开启后，未验证邮箱的用户无法登录
- [ ] 密码策略前后端一致（>= 8 位，大小写 + 数字）
- [ ] 所有 API 路由有认证检查（或在白名单中明确标记）
- [ ] IndexedDB 数据按 user_id 隔离，退出登录时清理

### 6.2 架构验收

- [ ] initializeAuth 无竞态条件，超时处理正确
- [ ] login_logs、security_events 表已创建并有 RLS 策略
- [ ] profiles 表有 login_count、last_login、status 字段

### 6.3 UX 验收

- [ ] 加载文案使用温暖语气（"小知在准备..."）
- [ ] 错误提示使用中文友好文案
- [ ] 密码输入有强度提示

---

## 七、审批请求

**决策点：** 是否批准此 Sprint Change Proposal？

| 决策 | 后续动作 |
|------|----------|
| 批准 | 更新 sprint-status.yaml，创建 Story 8-5 文件 |
| 拒绝 | 保持现状，记录风险 |
| 修订 | 根据反馈调整后重新提交 |

**等待用户审批。**