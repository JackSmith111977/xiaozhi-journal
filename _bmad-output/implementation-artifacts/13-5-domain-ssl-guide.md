# 域名与 SSL 配置操作指南

> 本文档基于 2026 年最新官方文档调研，为 Story 13.5 实施指南。

---

## Sources

- [Vercel Custom Domain Setup](https://vercel.com/docs/domains/set-up-custom-domain) — Feb 26, 2026
- [Vercel DNS Records Management](https://vercel.com/docs/domains/managing-dns-records) — Feb 27, 2026
- [Vercel SSL Certificates](https://vercel.com/docs/domains/working-with-ssl) — Mar 5, 2026
- [Accessing from Mainland China](https://vercel.com/kb/guide/accessing-vercel-hosted-sites-from-mainland-china) — Nov 2025
- [Cloudflare SSL/TLS Settings](https://developers.cloudflare.com/ssl/ssl-tls/encryption-modes/) — 2026
- [Cloudflare DNS Proxy](https://developers.cloudflare.com/dns/proxy-status/) — 2026
- [阿里云 ICP 备案流程](https://help.aliyun.com/zh/icp-filing/basic-icp-service/user-guide/icp-filing-application-overview)
- [GitHub: vercel.app DNS Pollution #803](https://github.com/vercel/community/discussions/803)

---

## 1. 中国大陆可达性现状

### 官方承认的问题

Vercel 官方知识库明确说明：
- **无中国节点** — "does not have servers or CDN nodes in mainland China"
- **网络管控** — "block or throttle traffic to foreign domains"
- **合规门槛** — 境内托管需 ICP license，平台未提供本地化支持

### DNS 污染情况

`*.vercel.app` 在中国大陆遭遇 **DNS 污染 + SNI 阻断**：
- DNS 解析返回错误 IP（包括被封锁的 IP）
- 即使 DNS 解析成功，SNI 检测仍可能阻断 HTTPS 连接

### 官方解决方案

Vercel 官方推荐：
> "Swap the `.vercel.app` domain for your own custom domain"

**核心结论**：必须绑定自定义域名才能提高国内可达性。

---

## 2. Vercel 域名绑定（CLI 方式）

### Quick Reference

```bash
# 1. 查看现有域名
vercel domains ls

# 2. 添加域名到项目
vercel domains add example.com my-project

# 3. 检查需要的 DNS 记录
vercel domains inspect example.com

# 4. 配置 DNS（根域名）
vercel dns add example.com '@' A 76.76.21.21

# 4b. 配置 DNS（子域名）
vercel dns add example.com www CNAME cname.vercel-dns-0.com

# 5. 验证配置
vercel domains inspect example.com

# 6. 检查 SSL 证书
vercel certs ls

# 7. 测试域名
vercel httpstat /
```

### 步骤详解

**Step 1: 添加域名**

```bash
vercel domains add xiaozhi-journal.com xiaozhi-journal
vercel domains add www.xiaozhi-journal.com xiaozhi-journal
```

**Step 2: 检查所需 DNS 记录**

```bash
vercel domains inspect xiaozhi-journal.com
```

输出显示当前验证状态和需要的记录类型。

**Step 3: 配置 DNS 记录**

| 域名类型 | 记录类型 | 值 |
|----------|----------|-----|
| 根域名 (`@`) | A | `76.76.21.21` |
| 子域名 (`www`) | CNAME | `cname.vercel-dns-0.com` |

> **注意**：以上值为 Vercel 通用值。项目可能有特定值，需运行 `vercel domains inspect` 确认。

---

## 3. DNS 配置（外部 DNS 提供商）

如使用阿里云/腾讯云/Cloudflare 管理 DNS：

### 根域名配置

```
类型: A
主机记录: @
记录值: 76.76.21.21
TTL: 600（或默认）
```

### 子域名配置（推荐）

```
类型: CNAME
主机记录: www
记录值: cname.vercel-dns-0.com
TTL: 600
```

### DNS 验证命令

```bash
# 使用国内 DNS 测试
dig @223.5.5.5 www.xiaozhi-journal.com
dig @119.29.29.29 www.xiaozhi-journal.com

# 检查 A 记录
dig A xiaozhi-journal.com +short

# 检查 CNAME 记录
dig CNAME www.xiaozhi-journal.com +short
```

---

## 4. Cloudflare 代理配置（当前方案）

> **当前生产环境已使用此方案**：`xiaozhi-journal.keidesu.top`

### 架构说明

```
用户请求 → Cloudflare DNS → Cloudflare Proxy → Vercel Edge → Next.js App
```

**优势：**
- Cloudflare 全球 CDN 加速（含亚洲节点）
- 额外安全层（WAF、DDoS 防护）
- SSL 端到端加密
- 可配置国内可达性优化

### Cloudflare DNS 配置

**Step 1: 添加 DNS 记录**

在 Cloudflare Dashboard → DNS → Records：

| 类型 | 名称 | 内容 | Proxy 状态 |
|------|------|------|------------|
| CNAME | `xiaozhi-journal` | `<vercel-project>.vercel.app` | **Proxied（橙色云）** |

> **关键**：必须开启 Proxied 模式才能启用 Cloudflare CDN。

**Step 2: 验证 DNS 解析**

```bash
# 通过 Cloudflare DNS 查询
dig @1.1.1.1 xiaozhi-journal.keidesu.top

# 国内 DNS 查询（验证可达性）
dig @223.5.5.5 xiaozhi-journal.keidesu.top
```

Proxied 模式下，返回的 IP 是 Cloudflare 的边缘节点 IP，而非 Vercel IP。

### Cloudflare SSL 配置

**SSL/TLS 模式选择：**

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| Off | 无加密 | 不推荐 |
| Flexible | 用户→CF 加密，CF→Vercel 不加密 | 不推荐 |
| **Full** | 端到端加密，但不验证 Vercel 证书 | 可用 |
| **Full (Strict)** | 端到端加密 + 验证 Vercel 证书有效 | **推荐** |

**推荐配置**：`Full (Strict)`
- 需要 Vercel SSL 证书有效（Let's Encrypt）
- Cloudflare 验证 Vercel 证书后才建立连接
- 安全性最高

**配置路径**：Cloudflare Dashboard → SSL/TLS → Overview → Full (Strict)

### 其他 Cloudflare 优化设置

| 设置 | 推荐值 | 说明 |
|------|--------|------|
| Always Use HTTPS | On | HTTP 自动跳转 HTTPS |
| Auto Minify | 可选 | HTML/CSS/JS 压缩 |
| Brotli | On | 更高效压缩 |
| Rocket Loader | Off | 可能干扰 Next.js 脱水 |
| Early Hints | On | 预加载资源 |
| WebSockets | On | 支持 Supabase Realtime |

### 注意事项

1. **Rocket Loader 可能干扰 Next.js** — 建议关闭或测试后启用
2. **Page Rules 可针对性调整** — 如对 `/api/*` 路径禁用某些优化
3. **防火墙规则可设置** — 限制恶意请求、地理屏蔽
4. **Vercel 需添加域名** — 在 Vercel Dashboard 添加自定义域名，让 Vercel 知道该域名指向它

### Vercel 侧配置

**添加域名到 Vercel 项目：**

```bash
vercel domains add xiaozhi-journal.keidesu.top xiaozhi-journal
```

或在 Vercel Dashboard → Project → Settings → Domains 添加。

**Vercel 会验证域名所有权**，DNS 配置正确后 SSL 自动生成。

---

## 5. SSL 证书自动配置

### Vercel 使用 Let's Encrypt

证书颁发流程：
1. Vercel 向 Let's Encrypt 申请证书
2. Let's Encrypt 返回 challenge（验证方式）
3. Vercel 创建验证文件/记录
4. Let's Encrypt 验证后颁发证书
5. 证书自动部署到 Vercel 基础设施

### 验证方式

| 域名类型 | 验证方式 | 要求 |
|----------|----------|------|
| 非通配符域名 | HTTP-01 challenge | DNS 记录已配置且生效 |
| 通配符域名 (`*.example.com`) | DNS-01 challenge | Nameserver 必须指向 Vercel |

### 检查 SSL 状态

```bash
# 查看证书列表
vercel certs ls

# 测试 HTTPS 连接
curl -I https://www.xiaozhi-journal.com
```

### 常见问题

- **证书未生成**：DNS 记录未生效或被重定向阻断验证路径
- **验证路径保留**：`/.well-known` 路径不能被重定向或重写

---

## 6. ICP 备案决策

### 决策矩阵

| 场景 | ICP 备案要求 | 建议 |
|------|--------------|------|
| Vercel 全球 CDN（境外服务器） | 不需要 | **当前推荐** |
| 阿里云/腾讯云国内托管 | 必须 | 如国内用户增长显著再评估 |

### 个人备案限制

- 仅限 **非经营性用途**
- 涉及收费/交易必须使用企业资质
- 网站名称不能包含"企业"、"商业"等字样

### 备案流程（如需）

**周期**：10-20 工作日（整体 1-22 工作日）

**步骤**：
1. 注册接入商账号（阿里云/腾讯云）
2. 购买大陆节点服务器（≥3 个月）
3. 填写备案信息（域名实名认证需与备案主体一致）
4. 上传证明材料（身份证、幕布拍照）
5. 短信核验（工信部备案管理系统）
6. 接入商初审 → 管局终审

**备案成功后**：30 日内完成公安联网备案

---

## 7. 国内访问优化建议

### 官方建议

1. **自定义域名** — 替代 `*.vercel.app`
2. **资源内化** — Self-host fonts, analytics, key resources
3. **静态镜像** — 在国内基础设施部署静态版本

### 不推荐方案

Vercel 官方：
> "does not recommend placing a proxy in front"

但用户可选择国内 CDN（阿里云 CDN）作为前端层。

### 重要提醒

Vercel 官方声明：
> "Vercel cannot guarantee availability or performance within mainland China."

境外托管站点仍可能遭遇波动或中断。

---

## 8. 完成检查清单

- [ ] 自定义域名已购买
- [ ] 域名已添加到 Vercel 项目
- [ ] DNS A/CNAME 记录已配置
- [ ] DNS 解析验证成功（国内 DNS 测试）
- [ ] SSL 证书状态为 Valid
- [ ] HTTPS 访问正常
- [ ] HTTP 自动跳转 HTTPS
- [ ] 国内访问速度评估完成
- [ ] ICP 备案决策已记录到 `architecture.md`

---

## 9. 后续代码准备（如已备案）

在 `src/app/layout.tsx` 页脚添加备案号：

```tsx
export function ICPBadge() {
  return (
    <a
      href="https://beian.miit.gov.cn"
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-[#8A817C] hover:text-[#D4856A]"
    >
      京ICP备XXXXXXXX号
    </a>
  )
}
```

---

## References

- [Setting up a custom domain - Vercel](https://vercel.com/docs/domains/set-up-custom-domain)
- [Managing DNS Records - Vercel](https://vercel.com/docs/domains/managing-dns-records)
- [Working with SSL Certificates - Vercel](https://vercel.com/docs/domains/working-with-ssl)
- [Accessing Vercel-hosted sites from mainland China](https://vercel.com/kb/guide/accessing-vercel-hosted-sites-from-mainland-china)
- [Cloudflare SSL/TLS Encryption Modes](https://developers.cloudflare.com/ssl/ssl-tls/encryption-modes/)
- [Cloudflare DNS Proxy Status](https://developers.cloudflare.com/dns/proxy-status/)
- [ICP备案流程 - 阿里云](https://help.aliyun.com/zh/icp-filing/basic-icp-service/user-guide/icp-filing-application-overview)
- [vercel.app DNS Pollution #803 - GitHub](https://github.com/vercel/community/discussions/803)