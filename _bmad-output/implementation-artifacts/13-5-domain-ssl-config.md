# Story 13.5: 域名与 SSL 配置

Status: done

---

## Story

As a 运营者,
I want 绑定自定义域名并配置 SSL,
So that 用户通过可信赖的域名访问产品。

---

## Acceptance Criteria

### AC1: Vercel 域名绑定 + DNS 配置

**Given** Vercel 项目已创建
**When** 添加自定义域名
**Then** 在 Vercel Dashboard 绑定域名
**And** DNS 配置 CNAME 记录指向 `cname.vercel-dns.com`
**And** Vercel 自动配置免费 SSL 证书

### AC2: 中国大陆可达性 ✅ 已解决

**Given** 中国大陆用户访问
**When** 通过 Cloudflare Proxy 访问自定义域名
**Then** DNS 解析正常（Cloudflare 边缘节点）
**And** SSL Full (Strict) 端到端加密
**And** 无需 ICP 备案（境外服务器）

**已实施方案：**
- 域名：`xiaozhi-journal.keidesu.top`
- 架构：Cloudflare DNS (Proxied) → Vercel Edge
- SSL：Full (Strict)
- 状态：已上线验证

---

## Tasks/Subtasks

- [x] Task 1: Vercel 域名绑定 (AC: 1)
  - [x] 1.1 创建操作指南文档（CLI + Dashboard 方式）
  - [x] 1.2 记录 DNS 配置值：A 记录 76.76.21.21，CNAME cname.vercel-dns-0.com
  - [x] 1.3 记录 Vercel CLI 命令序列
  - [x] 1.4 记录 SSL 自动配置流程（Let's Encrypt HTTP-01/DNS-01）

- [x] Task 2: DNS 配置验证 (AC: 1)
  - [x] 2.1 提供 dig 命令验证方法
  - [x] 2.2 提供国内 DNS 测试命令（223.5.5.5 / 119.29.29.29）
  - [x] 2.3 记录 HTTPS 验证方法

- [x] Task 3: 中国大陆可达性评估 (AC: 2)
  - [x] 3.1 调研 Vercel 官方说明（无中国节点）
  - [x] 3.2 调研 DNS 污染问题（GitHub #803）
  - [x] 3.3 记录官方推荐方案：自定义域名替代 .vercel.app
  - [x] 3.4 记录资源内化建议

- [x] Task 4: ICP 备案决策与文档 (AC: 2)
  - [x] 4.1 调研个人备案流程（10-20 工作日）
  - [x] 4.2 记录决策：Vercel 境外服务器暂不备案
  - [x] 4.3 记录触发条件：国内用户占比 > 50%

- [x] Task 5: 页面备案号展示准备（如已备案）(AC: 2)
  - [x] 5.1 提供备案号组件代码示例
  - [x] 5.2 组件样式符合暖日设计系统

---

## Dev Notes

### 技术背景

**Vercel 域名绑定流程：**

1. Vercel Dashboard → Project → Settings → Domains
2. 输入自定义域名（如 `xiaozhi-journal.com`）
3. Vercel 提供三种验证方式：
   - **推荐：DNS CNAME** — `cname.vercel-dns.com`
   - A 记录（用于子域名如 `www.`）
   - Nameserver（用于根域名托管）
4. SSL 证书由 Vercel 自动配置（Let's Encrypt）

**DNS 配置示例：**

```
# 根域名（如 xiaozhi-journal.com）
类型: A
值: 76.76.21.21（Vercel 提供）

# 子域名（如 www.xiaozhi-journal.com）
类型: CNAME
值: cname.vercel-dns.com
```

**中国大陆可达性风险：**

| 场景 | 影响 | 解决方案 |
|------|------|----------|
| `*.vercel.app` DNS 污染 | 国内用户无法访问 | 使用自定义域名 + 国内 CDN |
| 自定义域名解析慢 | 首屏加载延迟 | 使用阿里云/腾讯云 DNS 解析 |
| 无 ICP 备案 | 国内托管服务不可用 | 使用 Vercel 全球 CDN（暂不备案）|

**ICP 备案必要性评估：**

- **使用 Vercel 全球 CDN**：不需要 ICP 备案（服务器在境外）
- **使用阿里云/腾讯云国内托管**：必须 ICP 备案（合规要求）
- **当前决策**：Phase 2-3 使用 Vercel 全球 CDN，暂不备案；如国内用户增长显著再评估备案

### 相关架构决策（来自 architecture.md）

```markdown
### New Infrastructure Architecture Decisions

**决策：** MVP 阶段用收款码 + 手动确认开通 Pro。Phase 2 注册个体工商户后接支付宝当面付。

**Areas for Future Enhancement:**
- 自定义域名国内可达性方案（Epic 13 Story 13.5）
```

### 前置依赖

- ✅ Vercel 项目已创建（Epic 0 Story 0-f）
- ✅ Production 部署已配置（Story 13.1）

### 与其他 Story 关系

| Story | 关系 |
|------|------|
| 13.1 CI/CD 流水线 | 前置 — Production 部署已运行 |
| 13.7 Vercel 三环境配置 | 相关 — Production 域名配置 |
| 13.8 Preview 部署验证 | 相关 — Preview 使用 `*.vercel.app` |

### 注意事项

1. **Vercel 域名验证时间** — DNS 配置后需等待几分钟到几小时生效
2. **SSL 证书自动配置** — Vercel 使用 Let's Encrypt，自动续期
3. **根域名 vs 子域名** — 根域名配置更复杂，建议先配置 `www.` 子域名
4. **中国大陆 DNS 污染** — `*.vercel.app` 可能被污染，自定义域名更稳定
5. **ICP 备案流程** — 需要 20+ 工作日，需企业资质或个人身份备案

### 文件变更预期

| 文件 | 变更 |
|------|------|
| `architecture.md` | 更新域名决策章节 |
| `src/app/layout.tsx` | 添加备案号（如已备案）|
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | 更新状态 |

### 建议实施顺序

1. **Phase 1：Vercel 原生域名** — 使用 `*.vercel.app` 快速上线（当前状态）
2. **Phase 2：自定义域名** — 购买域名 + Vercel 绑定 + DNS 配置
3. **Phase 3：国内可达性优化** — 评估是否需要国内 CDN + ICP 备案

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (claude-opus-4-7)

### Debug Log References

调研来源：Vercel 官方文档 + GitHub Community discussions + 阿里云 ICP 备案文档

### Completion Notes List

**Task 1-5 ✅**: 操作指南文档完成（调研驱动）
- 基于 2026 年最新官方文档调研
- DNS 配置：A 记录 `76.76.21.21`，CNAME `cname.vercel-dns-0.com`
- SSL：Let's Encrypt 自动配置（HTTP-01 / DNS-01 challenge）
- 中国大陆：官方承认无节点，DNS 污染问题确认，推荐自定义域名
- ICP 备案：Vercel 境外服务器不需要，触发条件记录

**补充 Cloudflare 配置章节**（基于当前生产环境）：
- 当前域名：`xiaozhi-journal.keidesu.top`（已上线）
- 架构：Cloudflare Proxy → Vercel Edge → Next.js App
- SSL 模式：Full (Strict)（端到端加密 + 证书验证）
- DNS：CNAME Proxied 模式（橙色云图标）
- 已更新 `docs/project-context.md` Deployment Configuration 章节

**调研来源**：
- [Vercel Domains 文档](https://vercel.com/docs/domains/set-up-custom-domain) — Feb 26, 2026
- [Vercel SSL 文档](https://vercel.com/docs/domains/working-with-ssl) — Mar 5, 2026
- [中国大陆访问指南](https://vercel.com/kb/guide/accessing-vercel-hosted-sites-from-mainland-china) — Nov 2025
- [Cloudflare SSL/TLS Settings](https://developers.cloudflare.com/ssl/ssl-tls/encryption-modes/) — 2026
- [GitHub #803: DNS Pollution](https://github.com/vercel/community/discussions/803)
- [阿里云 ICP 备案](https://help.aliyun.com/zh/icp-filing)

### File List

- `_bmad-output/implementation-artifacts/13-5-domain-ssl-guide.md` — 新建，操作指南文档（含 Cloudflare 配置）
- `_bmad-output/implementation-artifacts/13-5-domain-ssl-config.md` — 修改，更新 Tasks + Dev Agent Record
- `_bmad-output/planning-artifacts/architecture.md` — 修改，更新域名决策章节
- `docs/project-context.md` — 修改，添加 Deployment Configuration 章节（当前域名 + Cloudflare 代理）
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — 修改，状态更新

### Change Log

- 2026-04-26: Story 调研完成 — 基于官方文档创建操作指南，更新架构决策
- 2026-04-26: 补充 Cloudflare 配置 — 基于当前生产环境 `xiaozhi-journal.keidesu.top`，更新 project-context.md Deployment Configuration 章节
- 2026-04-26: Correct Course — AC2 更新为"已解决"，中国大陆可达性通过 Cloudflare Proxy 方案已实施