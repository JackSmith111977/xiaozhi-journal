---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
workflowType: 'research'
research_type: 'technical'
research_topic: 'alibaba-cloud-directmail-smtp'
research_goals: '完整流程概览 — 从注册到生产部署的全链路'
user_name: 'Kei'
date: '2026-04-27'
web_research_enabled: true
source_verification: true
status: 'archived'
archived_reason: 'SMTP 服务商已变更为 Resend，本调研文档不再适用'
archived_date: '2026-04-27'
---

# Research Report: 阿里云 DirectMail SMTP 配置

**Date:** 2026-04-27
**Author:** Kei
**Research Type:** Technical
**Status:** ⚠️ ARCHIVED — SMTP 服务商已变更为 Resend（2026-04-27）

> **Note:** 本文档已归档。当前 SMTP 服务商为 Resend，请参阅 Resend SMTP 配置指南。

---

## Technical Research Scope Confirmation

**Research Topic:** 阿里云 DirectMail SMTP 配置
**Research Goals:** 完整流程概览 — 从注册到生产部署的全链路

**Technical Research Scope:**

- Architecture Analysis — 阿里云邮件推送服务架构、邮件发送流程
- Implementation Approaches — 注册、域名配置、SMTP 凭据获取、Supabase 集成
- Technology Stack — 阿里云 DirectMail 平台、SMTP 协议、DNS 配置
- Integration Patterns — Supabase Auth SMTP 集成、Vercel 环境变量配置
- Performance Considerations — 发信限制、发送速率、域名信誉管理

**Research Methodology:**

- Current web data with rigorous source verification
- Multi-source validation for critical configuration steps
- Confidence level framework for uncertain technical information
- Comprehensive technical coverage with official documentation sources

**Scope Confirmed:** 2026-04-27

---

## Technology Stack Analysis

### 阿里云 DirectMail 服务架构

阿里云邮件推送（Direct Mail）是阿里云提供的邮件发送服务，支持事务邮件、通知邮件和批量邮件发送。

**核心服务组件：**
- **SMTP 接入点** — `smtpdm.aliyun.com`（国内）、区域站点地址各异
- **API 接口** — RESTful API，支持 SDK 调用（AccessKey 认证）
- **管理控制台** — 发信域名管理、发信地址管理、邮件模板管理

**发送方式对比：**

| 方式 | 适用场景 | 认证凭据 |
|------|---------|---------|
| **SMTP** | 触发邮件、批量邮件（推荐首选） | 发信地址 + SMTP 密码 |
| **API** | 程序化发送、高级功能 | AccessKey ID + Secret |
| **控制台** | 手动测试、单次发送 | 无需凭据 |

_Source: [使用 SMTP 发送邮件 - 阿里云文档](https://help.aliyun.com/zh/direct-mail/user-guide/send-emails-using-smtp)_

### SMTP 连接参数

| 参数 | 值 | 说明 |
|------|-----|------|
| **Host** | `smtpdm.aliyun.com` | 国内站点 |
| **Port（非SSL）** | `25` 或 `80` | 支持 STARTTLS |
| **Port（SSL）** | `465` | 隐式 SSL/TLS |
| **Username** | 发信地址 | 如 `noreply@yourdomain.com` |
| **Password** | SMTP 密码 | 控制台设置，20 位 |

> ⚠️ 阿里云 ECS 默认禁用 25 端口，建议使用 80（STARTTLS）或 465（SSL）。

**区域站点 SMTP 地址：**
- 国内：`smtpdm.aliyun.com`
- 香港：按控制台显示的区域站点地址配置
- 海外：参见 [不同站点的 SMTP 服务地址](https://help.aliyun.com/zh/direct-mail/smtp-endpoints)

_Source: [不同站点的 SMTP 服务地址 - 阿里云文档](https://help.aliyun.com/zh/direct-mail/smtp-endpoints)_

### DNS 配置技术栈

发信域名需配置以下 DNS 记录：

| 记录类型 | 用途 | 主机记录示例 |
|---------|------|-------------|
| **TXT** | 域名所有权验证 | `_dnsauth` |
| **TXT** | SPF 防伪造 | `@` |
| **CNAME/TXT** | DKIM 签名 | 控制台生成 |
| **TXT** | DMARC 策略 | `_dmarc` |
| **MX** | 退信接收（可选） | `@` |

**SPF 记录标准格式：**
```
v=spf1 include:spf.dm.aliyun.com -all
```

_Source: [如何配置发信域名 - 阿里云文档](https://help.aliyun.com/zh/direct-mail/user-guide/configurations/)_

### Supabase SMTP 集成

Supabase 支持自定义 SMTP 配置，需在 Dashboard 或环境变量中设置。

**Dashboard 配置路径：**
- Project Settings → Authentication → SMTP Settings
- Enable Custom SMTP → 填写 SMTP 参数

**环境变量配置（自部署）：**
```env
GOTRUE_SMTP_ADMIN_EMAIL=admin@yourdomain.com
GOTRUE_SMTP_HOST=smtpdm.aliyun.com
GOTRUE_SMTP_PORT=80
GOTRUE_SMTP_USER=noreply@yourdomain.com
GOTRUE_SMTP_PASS=your-smtp-password
```

_Source: [Send emails with custom SMTP - Supabase Docs](https://supabase.com/docs/guides/auth/auth-smtp)_

### Vercel 环境变量配置

在 Vercel Dashboard 配置 Production/Preview 环境变量：

| 变量名 | Production | Preview |
|-------|-----------|---------|
| `SUPABASE_SMTP_HOST` | `smtpdm.aliyun.com` | 测试 SMTP |
| `SUPABASE_SMTP_PORT` | `80` 或 `465` | 测试端口 |
| `SUPABASE_SMTP_USER` | 生产发信地址 | 测试发信地址 |
| `SUPABASE_SMTP_PASS` | SMTP 密码 | SMTP 密码 |
| `SUPABASE_SMTP_ADMIN_EMAIL` | 管理员邮箱 | 管理员邮箱 |

---

## Research Overview

本次技术调研基于 2026-04-27 最新官方文档，全面覆盖阿里云 DirectMail SMTP 配置从注册到生产部署的全链路。调研采用多源验证方法，确保所有关键配置步骤均来自阿里云官方文档、Supabase 官方文档及行业最佳实践指南。

**调研范围：** DirectMail 服务架构、SMTP 参数、DNS 认证（SPF/DKIM/DMARC）、Supabase Auth 集成、Vercel 环境变量配置、成本优化、风险缓解。

**数据来源：** 阿里云官方文档、Supabase 官方文档、Cisco 安全最佳实践、AWS 邮件高可用架构参考。

**核心发现：** 阿里云 DirectMail 提供免费 2000 封额度，SMTP 接入点 `smtpdm.aliyun.com` 支持 STARTTLS（端口 80）和 SSL（端口 465）；三重认证体系（SPF/DKIM/DMARC）可将欺诈邮件拦截率提升至 95% 以上；Supabase Auth 内置 SMTP 队列机制无需额外设计邮件队列。

详见下方 Executive Summary 与 Technical Research Recommendations。

---

## Integration Patterns Analysis

### SMTP 协议集成

阿里云 DirectMail 支持 SMTP 协议接入，与 Supabase Auth 集成的关键参数：

| 参数 | 阿里云 DirectMail | Supabase 配置 |
|------|------------------|--------------|
| **Host** | `smtpdm.aliyun.com` | `GOTRUE_SMTP_HOST` |
| **Port** | `80`（STARTTLS）/ `465`（SSL） | `GOTRUE_SMTP_PORT` |
| **User** | 发信地址 | `GOTRUE_SMTP_USER` |
| **Pass** | SMTP 密码（20 位） | `GOTRUE_SMTP_PASS` |

**加密协议选择：**

| 协议 | 端口 | 说明 |
|------|------|------|
| **STARTTLS** | 80/587 | 连接后升级为加密，推荐 |
| **SSL/TLS** | 465 | 全程加密，隐式 SSL |

> ⚠️ STARTTLS 需客户端主动发起，若不发起则可能明文发送。建议配置服务器强制加密。

_Source: [SSL、TLS 和 STARTTLS 加密](https://bird.com/zh/guides/ssl-tls-starttls-encyption)_

### Supabase Auth 集成流程

**邮件发送工作流：**

```
用户请求 → Supabase Auth → SMTP Client → 阿里云 DirectMail → 收件人邮箱
```

**Dashboard 配置路径：**

1. Project Settings → Authentication → SMTP Settings
2. Enable Custom SMTP → 填写阿里云 SMTP 参数
3. Authentication → Emails → Templates → 配置密码重置模板

**邮件模板关键变量：**

| 变量 | 用途 |
|------|------|
| `{{ .ConfirmationURL }}` | 密码重置链接 |
| `{{ .Token }}` | 重置令牌 |
| `{{ .Email }}` | 用户邮箱 |

_Source: [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)_

### API 集成方式

阿里云 DirectMail 提供两种调用方式：

| 方式 | 适用场景 | 认证 |
|------|---------|------|
| **SMTP** | Supabase Auth 集成（推荐） | SMTP 密码 |
| **API** | 自定义邮件发送逻辑 | AccessKey |

**常用 API 接口：**

- `SingleSendMail` — 发送单条邮件（Body 传参限制 8MB）
- `BatchSendMail` — 批量发送邮件
- `single_send_mail_advance` — 发送带附件邮件（限制 15MB）

**SDK 支持：**
- Java / Python / PHP / Go / Node.js

_Source: [阿里云邮件推送 SDK](https://help.aliyun.com/zh/direct-mail/sdk-manual)_

### Vercel 环境变量集成

**Production 环境配置：**

```env
SUPABASE_SMTP_HOST=smtpdm.aliyun.com
SUPABASE_SMTP_PORT=80
SUPABASE_SMTP_USER=noreply@yourdomain.com
SUPABASE_SMTP_PASS=<smtp-password-20-char>
SUPABASE_SMTP_ADMIN_EMAIL=admin@yourdomain.com
```

**配置路径：**
- Vercel Dashboard → Settings → Environment Variables
- 按 Production/Preview 分别配置

### DNS 集成配置

发信域名需配置 DNS 记录以验证身份：

| 记录 | 主机 | 值 | 用途 |
|------|------|-----|------|
| TXT | `_dnsauth` | 控制台生成 | 域名所有权验证 |
| TXT | `@` | `v=spf1 include:spf.dm.aliyun.com -all` | SPF 防伪造 |
| CNAME | 控制台生成 | 控制台生成 | DKIM 签名 |
| TXT | `_dmarc` | `v=DMARC1; p=none` | DMARC 策略 |

_Source: [发信域名配置](https://help.aliyun.com/zh/direct-mail/user-guide/configurations/)_

---

## Architectural Patterns and Design

### 邮件发送服务架构

**生产级邮件发送架构分层：**

| 层级 | 功能 | 实现方案 |
|------|------|---------|
| **接入层** | API/SMTP 网关 | Supabase Auth 内置 |
| **消息队列层** | 异步处理、削峰填谷 | Supabase 内部队列 |
| **调度层** | 优先级管理、限流 | DirectMail 控制台 |
| **发送层** | SMTP 客户端 | 阿里云 DirectMail |
| **监控层** | 送达率、退信追踪 | DirectMail Dashboard |

**邮件发送流程：**

```
用户触发 → Supabase Auth
         → 内部队列（异步）
         → SMTP Client
         → 阿里云 DirectMail
         → DNS 认证（SPF/DKIM/DMARC）
         → 收件人邮箱
```

_Source: [企业级邮件推送架构](https://cloud.tencent.com/developer/article/2549087)_

### 域名信誉管理架构

**三重认证体系：**

| 协议 | 架构层 | 作用 |
|------|--------|------|
| **SPF** | DNS 层 | 授权发信 IP/服务器 |
| **DKIM** | 件层 | 邮件内容签名验证 |
| **DMARC** | 策略层 | 统一策略 + 报告反馈 |

**配置优先级：**

1. SPF — 基础必须，指定 `include:spf.dm.aliyun.com`
2. DKIM — 推荐，控制台生成 CNAME 记录
3. DMARC — 高级，`p=none` → `p=quarantine` → `p=reject` 渐进部署

> ⚠️ 完整实施 DMARC 的域名，欺诈邮件拦截率可达 95% 以上。

_Source: [邮件身份验证最佳实践 - Cisco](https://www.cisco.com/c/zh_cn/support/docs/security/email-security-appliance/215360-best-practice-for-email-authentication.html)_

### 域名隔离策略

**生产环境域名架构：**

```
主域名 example.com — 不用于发信
├── notify.example.com — 事务性邮件（高信誉）
├── promo.example.com — 营销邮件（独立信誉）
└── test.example.com — 测试环境（隔离）
```

**隔离原则：**
- 事务邮件与营销邮件使用不同子域名
- 测试环境独立域名，避免影响生产信誉
- 不发信的域名配置 DMARC `p=reject` 防滥用

_Source: [SPF/DKIM/DMARC 最佳实践](https://cloud.tencent.com/developer/article/2539451)_

### 高可用架构

**多通道冗余设计：**

| 主通道 | 备用通道 | 切换条件 |
|-------|---------|---------|
| 阿里云 DirectMail | 腾讯云邮件推送 | 主通道故障 |
| 国内站点 | 香港站点 | 区域不可达 |

**Supabase Auth 高可用：**
- Supabase 内置 SMTP 队列重试机制
- 失败自动重试（指数退避）
- 无需额外设计邮件队列

_Source: [邮件推送高可用实践](https://aws.amazon.com/cn/blogs/china/large-scale-marketing-campaign-and-email-high-availability/)_

### 安全架构

**凭据安全分层：**

| 凭据类型 | 存储位置 | 权限控制 |
|---------|---------|---------|
| SMTP 密码 | Vercel 环境变量 | Production Only |
| AccessKey | 阿里云 RAM | 最小权限原则 |
| 发信地址 | DirectMail 控制台 | 项目管理员 |

**安全最佳实践：**
- SMTP 密码 20 位，大小写混合
- AccessKey 使用 RAM 子账号
- 发信域名配置 SPF/DKIM 防伪造

_Source: [RAM 身份管理安全](https://help.aliyun.com/zh/direct-mail/security-compliance/)_

### 监控与运维架构

**关键监控指标：**

| 指标 | 健康阈值 | 告警条件 |
|------|---------|---------|
| 送达率 | > 95% | < 90% 告警 |
| 退信率 | < 2% | > 5% 告警 |
| 发送延迟 | < 5s | > 30s 告警 |

**DirectMail Dashboard 监控：**
- 实时发送统计
- 退信日志分析
- 域名验证状态

_Source: [邮件推送运维指南](https://help.aliyun.com/zh/direct-mail/user-guide/summary-of-common-email-return-codes-and-solutions)_

---

## Implementation Approaches and Technology Adoption

### 注册与开通流程

**阿里云 DirectMail 开通步骤：**

| 步骤 | 操作 | 时间 |
|------|------|------|
| **1. 账号注册** | 手机号 + 验证码 + 设置密码 | 5 分钟 |
| **2. 实名认证** | 个人：支付宝扫码；企业：营业执照 + 法人认证 | 个人 5 分钟 / 企业 3 工作日 |
| **3. 开通服务** | 控制台搜索"邮件推送" → 开通 | 即时 |
| **4. 域名配置** | 添加发信域名 → DNS 记录配置 → 验证 | 10-48 小时 |
| **5. 发信地址** | 创建发信地址 → 设置 SMTP 密码 | 即时 |

**实名认证方式：**

| 类型 | 方式 | 审核周期 |
|------|------|---------|
| **个人** | 支付宝扫码认证 | 5 分钟 |
| **企业** | 法人扫脸 / 企业支付宝 / 对公银行打款 | 3 工作日 |

_Source: [阿里云账号实名认证](https://help.aliyun.com/zh/account/step-1-register-an-alibaba-cloud-account)_

### 发信配额与计费

**免费额度：**

| 项目 | 额度 |
|------|------|
| 总免费额度 | 2000 封 |
| 每日免费上限 | 200 封 |

**计费方式：**

| 方式 | 价格 | 说明 |
|------|------|------|
| **按量付费** | ¥2.00/1000 封（¥0.002/封） | 后付费，适合小量 |
| **资源包** | ¥90（5万封）→ ¥1550（100万封） | 预付费，有效期 6 个月 |

**资源包规格对比：**

| 规格 | 价格 | 折合单价 | 节省 |
|------|------|---------|------|
| 5 万封 | ¥90 | ¥1.80/千封 | ¥10 |
| 50 万封 | ¥840 | ¥1.68/千封 | ¥160 |
| 100 万封 | ¥1590 | ¥1.59/千封 | ¥410 |

> ⚠️ 资源包有效期 6 个月，过期未用完作废。

_Source: [产品计费方式](https://help.aliyun.com/zh/direct-mail/billing-methods)_

### 测试验证流程

**本地开发环境测试方案：**

| 方案 | 适用场景 | 工具 |
|------|---------|------|
| **Mock 模拟** | 单元测试 | `unittest.mock` / Jest mock |
| **本地 SMTP** | 集成测试 | MailHog / Mailpit / Inbucket |
| **测试邮箱服务** | 端到端测试 | Mailtrap / Testmail.app |

**Supabase 本地测试：**
- Docker 启动 Inbucket（http://localhost:54324）
- 无需真实 SMTP，邮件自动进入测试邮箱
- Story 13.3 已配置本地 Inbucket 验证

**生产验证步骤：**
1. 配置 Production SMTP（Vercel 环境变量）
2. Supabase Dashboard → Authentication → SMTP Settings
3. 触发密码重置 → 检查邮件送达
4. 验证 SPF/DKIM/DMARC 配置生效

_Source: [SMTP 终极测试指南](https://www.cnblogs.com/yangykaifa/p/19320532)_

### 开发工作流

**推荐开发流程：**

```
本地开发 → MailHog/Mailpit 捕获邮件
集成测试 → Inbucket（Supabase 内置）
Preview 环境 → 测试 SMTP（低配额）
Production → 阿里云 DirectMail
```

**测试策略：**

| 测试类型 | 验证内容 |
|---------|---------|
| **单元测试** | Token 生成逻辑、邮件模板渲染 |
| **集成测试** | SMTP 连接、邮件发送成功率 |
| **端到端测试** | 密码重置完整流程（Selenium + Testmail.app） |

_Source: [密码重置端到端测试](https://testmail.app/blog/end-to-end-password-reset-testing-with-selenium/)_

### 部署与运维实践

**Vercel 环境变量配置：**

```env
# Production
SUPABASE_SMTP_HOST=smtpdm.aliyun.com
SUPABASE_SMTP_PORT=80
SUPABASE_SMTP_USER=noreply@mail.yourdomain.com
SUPABASE_SMTP_PASS=<20-char-password>
SUPABASE_SMTP_ADMIN_EMAIL=admin@yourdomain.com
```

**Supabase Dashboard 配置：**

1. Project Settings → Authentication → SMTP Settings
2. Enable Custom SMTP → 开关
3. 填写 SMTP 参数
4. Email Templates → 配置中文模板

**监控指标：**

| 指标 | 健康阈值 | 告警条件 |
|------|---------|---------|
| 送达率 | > 95% | < 90% |
| 退信率 | < 2% | > 5% |
| 发送延迟 | < 5s | > 30s |

_Source: [功能限制与规格](https://help.aliyun.com/zh/direct-mail/product-overview/limits)_

### 成本优化策略

**配额规划建议：**

| DAU | 月邮件量 | 推荐方案 |
|-----|---------|---------|
| < 100 | < 2000 | 免费额度 |
| 100-1000 | 2000-20000 | 按量付费 |
| > 1000 | > 20000 | 资源包（5万封） |

**成本估算（月度）：**

| 阶段 | 邮件量 | 费用 |
|------|--------|------|
| MVP（< 100 用户） | ~1000 封 | ¥0（免费） |
| 增长期（1000 用户） | ~10000 封 | ¥20（按量） |
| 成熟期（10000 用户） | ~100000 封 | ¥180（资源包） |

### 风险评估与缓解

**已知风险：**

| 风险 | 缓解措施 |
|------|---------|
| **新账号发送限制** | 爬坡期逐步增加发送量 |
| **IP/域名黑名单** | 配置 SPF/DKIM/DMARC |
| **退信率过高** | 清理无效邮箱、验证邮箱格式 |
| **配额耗尽** | 监控配额使用、提前购买资源包 |

**风控策略：**
- 新开通账号有发送量爬坡期
- 禁止短时间内大量发送未请求邮件
- 营销邮件需报备审核

_Source: [阿里云邮件推送风控](https://help.aliyun.com/zh/direct-mail/user-guide/summary-of-common-email-return-codes-and-solutions)_

---

## Executive Summary

阿里云 DirectMail 是国内领先的邮件发送服务，提供 SMTP 和 API 两种接入方式，支持事务邮件、通知邮件和批量邮件发送。本次技术调研基于 2026 年最新官方文档，全面分析从账号注册到生产部署的全链路配置方案。

**关键技术发现：**

1. **SMTP 接入参数** — 国内站点 `smtpdm.aliyun.com`，推荐 STARTTLS（端口 80）或 SSL（端口 465）
2. **三重认证体系** — SPF/DKIM/DMARC 配置可将欺诈邮件拦截率提升至 95% 以上
3. **免费额度** — 每账户 2000 封免费额度 + 每日 200 封上限，MVP 阶段零成本
4. **Supabase 集成** — Dashboard 配置 Custom SMTP，无需代码改动
5. **成本优化** — 资源包 ¥90（5万封）有效期 6 个月，比按量付费节省 10%

**战略建议：**

- MVP 阶段使用免费额度，无需提前购买资源包
- 配置 SPF/DKIM/DMARC 确保邮件送达率 > 95%
- 建议使用子域名隔离（如 `notify.example.com`），避免主域名信誉风险
- Supabase Auth 内置队列机制，无需额外设计邮件队列

---

## Technical Research Recommendations

### Implementation Roadmap

**Phase 1：账号注册与认证（0.5-1 天）**

| 步骤 | 操作 | 时间 |
|------|------|------|
| 1.1 | 阿里云账号注册 | 5 分钟 |
| 1.2 | 实名认证（个人：支付宝扫码） | 5 分钟 |
| 1.3 | 开通 DirectMail 服务 | 即时 |

**Phase 2：域名配置（1-2 天）**

| 步骤 | 操作 | 时间 |
|------|------|------|
| 2.1 | 添加发信域名 | 即时 |
| 2.2 | 配置 DNS TXT（SPF） | 10 分钟 |
| 2.3 | 配置 DNS CNAME（DKIM） | 10 分钟 |
| 2.4 | 配置 DNS TXT（DMARC） | 10 分钟 |
| 2.5 | DNS 验证生效 | 10-48 小时 |

**Phase 3：发信地址配置（0.5 天）**

| 步骤 | 操作 | 时间 |
|------|------|------|
| 3.1 | 创建发信地址 | 即时 |
| 3.2 | 设置 SMTP 密码（20 位） | 即时 |
| 3.3 | 测试 SMTP 连接 | 10 分钟 |

**Phase 4：Supabase/Vercel 配置（0.5 天）**

| 步骤 | 操作 | 时间 |
|------|------|------|
| 4.1 | Supabase Dashboard SMTP 配置 | 10 分钟 |
| 4.2 | Vercel Production 环境变量 | 10 分钟 |
| 4.3 | 配置中文邮件模板 | 30 分钟 |

**Phase 5：验证测试（0.5 天）**

| 步骤 | 操作 | 时间 |
|------|------|------|
| 5.1 | 触发密码重置邮件 | 5 分钟 |
| 5.2 | 验证邮件送达 | 5 分钟 |
| 5.3 | 检查 SPF/DKIM/DMARC 生效 | 10 分钟 |

### Technology Stack Recommendations

**SMTP 配置参数：**

```env
SUPABASE_SMTP_HOST=smtpdm.aliyun.com
SUPABASE_SMTP_PORT=80              # STARTTLS（推荐）
SUPABASE_SMTP_USER=noreply@mail.yourdomain.com
SUPABASE_SMTP_PASS=<20-char-password>
SUPABASE_SMTP_ADMIN_EMAIL=admin@yourdomain.com
```

**DNS 配置清单：**

| 记录 | 主机 | 值 |
|------|------|-----|
| TXT | `@` | `v=spf1 include:spf.dm.aliyun.com -all` |
| CNAME | 控制台生成 | 控制台生成（DKIM） |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:admin@yourdomain.com` |

### Success Metrics

**健康指标阈值：**

| 指标 | 目标值 | 告警阈值 |
|------|--------|---------|
| 送达率 | > 95% | < 90% |
| 退信率 | < 2% | > 5% |
| 发送延迟 | < 5s | > 30s |
| 垃圾邮件投诉率 | < 0.1% | > 0.5% |

---

## Technical Research Completion

**Technical Research Completion Date:** 2026-04-27
**Research Period:** 2026-04-27 comprehensive technical analysis
**Source Verification:** All technical facts verified against current official documentation
**Technical Confidence Level:** High — based on Alibaba Cloud official docs, Supabase docs, Cisco security best practices

_This comprehensive technical research document serves as an authoritative reference on Alibaba Cloud DirectMail SMTP configuration and provides strategic technical insights for informed decision-making and implementation._