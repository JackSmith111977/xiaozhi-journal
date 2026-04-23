# Story 13.3: SMTP 邮件服务集成

Status: ready-for-dev

---

## Story

As a 用户,
I want 收到中文格式的密码重置和验证邮件,
So that 我能正常使用账号功能（阻塞 Story 8.3）。

---

## Acceptance Criteria

### AC1: Supabase SMTP 配置

**Given** 现有 `supabase/config.toml`
**When** 配置 SMTP
**Then** 取消注释 `[auth.email.smtp]` 段
**And** 填入邮件服务凭据（Resend 或阿里云 DirectMail）
**And** 设置 `enabled = true`
**And** `sender_name` 设为 "小知 Journal"

### AC2: 环境变量配置

**Given** SMTP 配置完成
**When** 在 `.env.local` 中添加环境变量
**Then** 包含 `SUPABASE_SMTP_HOST`（如 `smtpdm.aliyun.com` 或 `smtp.resend.com`）
**And** 包含 `SUPABASE_SMTP_PORT`（465 或 587）
**And** 包含 `SUPABASE_SMTP_USER`（发信邮箱）
**And** 包含 `SUPABASE_SMTP_PASS`（SMTP 密码/API Key）
**And** `SUPABASE_SMTP_ADMIN_EMAIL` 设为 noreply 域名邮箱
**And** `.env.example` 包含上述变量占位符（不暴露真实值）

### AC3: 密码重置邮件中文模板

**Given** 邮件服务配置完毕
**When** 用户请求密码重置
**Then** 收到中文格式邮件（非 Supabase 默认英文模板）
**And** 发件人显示 "小知 Journal"
**And** 邮件标题: "重置你的小知 Journal 密码"
**And** 邮件正文包含中文引导文案
**And** 重置按钮文字为中文"重置密码"

### AC4: 本地开发邮件测试

**Given** 本地开发环境（`supabase start`）
**When** 触发密码重置
**Then** 邮件发送到 Inbucket 测试服务器（`http://localhost:54324`）
**And** 可在 Inbucket Web UI 查看邮件内容
**And** 可复制重置链接到浏览器测试

---

## Tasks/Subtasks

- [ ] Task 1: 配置 Supabase SMTP
  - [ ] 修改 `supabase/config.toml`，启用 `[auth.email.smtp]`
  - [ ] 设置 `host`, `port`, `user`, `pass`, `admin_email`, `sender_name`
  - [ ] 验证本地 `supabase start` 无报错
- [ ] Task 2: 环境变量
  - [ ] 在 `.env.local` 添加 SMTP 环境变量（使用 `env()` 引用）
  - [ ] 在 `.env.example` 添加占位符
  - [ ] 确认 `supabase/config.toml` 使用 `env()` 引用而非硬编码
- [ ] Task 3: 中文邮件模板
  - [ ] 创建 `supabase/templates/password-reset.html`
  - [ ] 创建 `supabase/templates/email-confirmation.html`
  - [ ] 在 `supabase/config.toml` 配置模板路径
  - [ ] 邮件样式符合「暖日」设计系统（背景 `#FDF8F5`，主色 `#E8C4A0`，按钮 `#D4856A`）
- [ ] Task 4: 本地开发验证
  - [ ] 启动本地 Supabase（`supabase start`）
  - [ ] 通过 Inbucket UI 验证密码重置邮件正常发送
  - [ ] 验证中文模板渲染正确
  - [ ] 验证重置链接可正常工作

---

## Dev Notes

### 架构上下文

- **阻塞关系**: 此 story 阻塞 Story 8.3（密码重置）和 Story 13.4（事务邮件系统）
- **SMTP 选型**: 架构文档已确认使用 **阿里云 DirectMail**（国内可达性，免费 2000 封/天）
- **备选方案**: Resend（`smtp.resend.com:587`），开发阶段可用，生产环境需切换 DirectMail
- **本地开发**: Supabase 本地使用 Inbucket 测试邮件服务器，不实际发送外部邮件

### 技术规格

**Supabase SMTP 配置模式**（`supabase/config.toml`）:
```toml
[auth.email.smtp]
enabled = true
host = "env(SUPABASE_SMTP_HOST)"
port = 465
user = "env(SUPABASE_SMTP_USER)"
pass = "env(SUPABASE_SMTP_PASS)"
admin_email = "env(SUPABASE_SMTP_ADMIN_EMAIL)"
sender_name = "小知 Journal"
```

**环境变量模板**（`.env.example`）:
```
# SMTP Email Service (阿里云 DirectMail 或 Resend)
SUPABASE_SMTP_HOST=smtpdm.aliyun.com
SUPABASE_SMTP_PORT=465
SUPABASE_SMTP_USER=noreply@yourdomain.com
SUPABASE_SMTP_PASS=<smtp_password>
SUPABASE_SMTP_ADMIN_EMAIL=noreply@yourdomain.com
```

**邮件模板路径**:
- `supabase/templates/password-reset.html` — 密码重置
- `supabase/templates/email-confirmation.html` — 邮箱验证

**Supabase 模板配置**:
```toml
[auth.email.template.reset_password]
subject = "重置你的小知 Journal 密码"
content_path = "./supabase/templates/password-reset.html"

[auth.email.template.signup]
subject = "欢迎加入小知 Journal"
content_path = "./supabase/templates/email-confirmation.html"
```

### 中文邮件模板 HTML 结构

密码重置模板示例:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Noto Sans SC', sans-serif; background-color: #FDF8F5; color: #3D3D3D; }
    .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 16px; padding: 32px; }
    .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #F5EDE4; }
    .header h1 { color: #D4856A; font-size: 24px; font-family: 'Noto Serif SC', serif; }
    .content { padding: 24px 0; line-height: 1.8; }
    .btn { display: inline-block; background: #D4856A; color: #fff; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; margin: 16px 0; }
    .footer { padding-top: 24px; border-top: 1px solid #F5EDE4; color: #8A817C; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>重置你的密码</h1>
    </div>
    <div class="content">
      <p>你好，</p>
      <p>我们收到了重置密码的请求。如果这不是你本人的操作，请忽略此邮件。</p>
      <p>点击下方按钮重置密码：</p>
      <p style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="btn">重置密码</a>
      </p>
      <p>此链接有效期为 1 小时。</p>
    </div>
    <div class="footer">
      <p>小知 Journal — 你的温暖日记伙伴</p>
    </div>
  </div>
</body>
</html>
```

### 注意事项

1. **`supabase/config.toml` 中密码必须用 `env()` 引用**，不可硬编码
2. **Inbucket 仅用于本地开发**，生产环境需配置真实 SMTP
3. **邮件模板中的 `{{ .ConfirmationURL }}`** 是 Supabase 内置变量
4. **邮件样式需符合「暖日」设计系统**，使用项目定义的色值
5. **本地测试完成后**，需要在 Supabase Dashboard 的 Auth → Email Templates 中上传自定义模板（或通过 CLI）
6. 如果用户尚未有备案域名，可先用 Resend 作为开发期 SMTP，后续切换到 DirectMail

### 相关文件

- `supabase/config.toml` — SMTP 配置
- `supabase/templates/password-reset.html` — 密码重置模板（新建）
- `supabase/templates/email-confirmation.html` — 邮箱确认模板（新建）
- `.env.local` — 本地环境变量（已有，新增 SMTP 变量）
- `.env.example` — 环境变量模板（已有，新增 SMTP 占位符）

### 前置依赖

- Supabase 项目已初始化（✅ 已完成，Epic 9 Story 9.1）
- `supabase CLI` 已安装且已 link 到远程项目

---

## Dev Agent Record

### Implementation Plan

_待实现_

### Completion Notes

_待实现_

---

## File List

_待实现_

---

## Change Log

- 创建 Story 13.3（2026-04-23）
