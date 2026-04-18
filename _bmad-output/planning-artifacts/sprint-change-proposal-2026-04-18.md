---
project_name: 'Xiaozhi Journal'
user_name: 'Kei'
date: '2026-04-18'
change_trigger: 'Vercel 默认域名在中国大陆被 DNS 污染，国内用户无法正常访问'
scope_classification: 'Minor'
artifacts_modified:
  - architecture.md
  - epics.md
  - open-next.config.ts (新增)
  - wrangler.jsonc (新增)
---

# Sprint Change Proposal — 新增 Cloudflare Workers 国内部署方案

## 1. 问题摘要

**触发原因**：Vercel 默认域名 `vercel.app` 在中国大陆被 DNS 污染，国内用户无法正常访问部署后的应用（`https://xiaozhi-journal.vercel.app/`）。

**发现时机**：部署完成后验证阶段发现国内不可访问。

**证据**：多次尝试 `curl` 和浏览器访问均超时/连接重置。

---

## 2. 影响分析

### Epic 影响

| Epic | 影响程度 | 说明 |
|------|---------|------|
| **Epic 13: 部署与运维** | **高** | Story 13.1 CI/CD 流水线需要补充 Cloudflare Workers 部署路径 |
| **Epic 9: 数据云端同步** | 低 | Supabase 不变，仅前端托管平台变更 |
| **其余 Epic** | 无 | 功能层面不受影响 |

### 文档冲突

| 文档 | 冲突章节 | 修改状态 |
|------|---------|---------|
| `architecture.md` | Important Decisions (第 162 行) | ✅ 已更新 |
| `architecture.md` | Infrastructure & Deployment (第 263-274 行) | ✅ 已更新 |
| `epics.md` | Additional Requirements (第 129 行) | ✅ 已更新 |
| `epics.md` | Story 13.1 CI/CD 流水线 (第 1203-1216 行) | ✅ 已更新 |

### 技术影响

- **应用代码**：零改动 — OpenNext 适配器处理所有兼容性
- **新增配置**：`open-next.config.ts`（已创建）、`wrangler.jsonc`（已创建）
- **部署命令**：`npx @opennextjs/cloudflare build && npx @opennextjs/cloudflare deploy`
- **兼容性要求**：`nodejs_compat` 标志 + `compatibility_date >= 2024-09-23`

---

## 3. 推荐路径

**选项 1：直接调整（已采用）**

- 新增 Cloudflare Workers 作为国内部署方案
- 保留 Vercel 作为国际版部署方案
- 通过域名路由（DNS 层面）区分国内外流量
- **工作量**：低 — 仅修改 BMad 文档 + 新增配置文件
- **风险**：低 — OpenNext 成熟度高，Next.js 16 官方支持

---

## 4. 详细变更提案

### 4.1 architecture.md — Infrastructure & Deployment

**修改内容**：将单一 Vercel 部署方案改为双平台策略。

- Vercel → 国际版（Next.js 原生支持）
- Cloudflare Workers + OpenNext → 国内版（解决 DNS 污染）

### 4.2 epics.md — Story 13.1 CI/CD 流水线

**修改内容**：从 Vercel 自动部署改为 GitHub Actions 双平台并行部署。

- Vercel：通过 Vercel CLI 或 Git 集成
- Cloudflare Workers：通过 OpenNext CLI 构建部署

### 4.3 新增配置文件

- `open-next.config.ts`：OpenNext Cloudflare 适配器配置
- `wrangler.jsonc`：Workers 入口点 + `nodejs_compat` 兼容性标志 + 静态资源绑定

---

## 5. 实施交接

**变更分类**：Minor — 仅文档更新 + 新增配置文件，不影响现有代码

**执行方**：Developer agent

**交付物**：
1. ✅ `architecture.md` — Infrastructure & Deployment 章节已更新
2. ✅ `epics.md` — Story 13.1 验收标准已更新
3. ✅ `epics.md` — Additional Requirements 已更新
4. ✅ `open-next.config.ts` — 已创建并提交
5. ✅ `wrangler.jsonc` — 已创建并提交
6. ✅ `@opennextjs/cloudflare` + `wrangler` — 已安装为 devDependencies

**下一步**：
1. 推送代码到 GitHub
2. 在 Cloudflare Pages 中更新构建命令为 `npx @opennextjs/cloudflare build`
3. 触发重新部署
4. 验证国内可访问性

**成功标准**：
- Cloudflare Workers 部署成功（`.open-next` 输出）
- 国内用户可通过 `*.workers.dev` 或自定义域名正常访问
- Vercel 国际部署不受影响

---

*Proposal approved by Kei on 2026-04-18 (Batch mode)*
