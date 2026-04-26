---
name: pnpm-best-practices
description: pnpm 包管理器最佳实践参考（基于官方文档调研）
type: reference
---

# pnpm 最佳实践

**调研日期**: 2026-04-26
**版本**: pnpm 10+
**来源**: https://pnpm.io/ （官方文档）

## 1. 核心特性

pnpm 是高性能包管理器，核心优势：
- **磁盘空间效率**: 内容可寻址存储，多项目共享依赖
- **安装速度**: 优化安装管道，比 npm/yarn 更快
- **内置 Monorepo 支持**: `pnpm-workspace.yaml` 原生工作空间
- **供应链安全**: 默认禁用 postinstall 脚本，`minimumReleaseAge` 控制新包延迟

**主要 OSS 采用者**: Next.js, Vite, Vue, Prisma, SvelteKit, Turborepo, Astro, Nuxt, Material UI 等。

## 2. 安装方式

### 推荐: Corepack（Node.js 内置）

```bash
# 1. 更新 corepack
npm install --global corepack@latest

# 2. 启用 pnpm
corepack enable pnpm

# 3. 在项目中锁定版本（自动写入 package.json 的 packageManager 字段）
corepack use pnpm@latest-10
```

### 备选: npm 全局安装

```bash
npm install -g pnpm@latest-10
```

**本项目使用**: 版本 `pnpm@9.15.3`（通过 `package.json` 的 `packageManager` 字段声明）。

## 3. 配置

### package.json

```json
{
  "packageManager": "pnpm@9.15.3"
}
```

`packageManager` 字段作用：
- **Corepack**: 自动下载并使用声明的版本
- **pnpm**: 验证包管理器名称匹配（`packageManagerStrict`，默认 `true`）
- **版本检查**: `packageManagerStrictVersion` 默认 `false`，不强制版本精确匹配

### .npmrc

项目 `.npmrc`:

```
# pnpm is the project's official package manager
# packageManager field in package.json enforces pnpm name (not npm/yarn)
# Version matching is lenient by default (packageManagerStrictVersion=false)
```

### pnpm 关键设置（.npmrc 可配置）

| 设置 | 默认值 | 说明 |
|------|--------|------|
| `packageManagerStrict` | `true` | 检查 `packageManager` 名称是否匹配 |
| `packageManagerStrictVersion` | `false` | 是否检查精确版本匹配 |
| `managePackageManagerVersions` | `true` | 自动下载声明的 pnpm 版本 |
| `preferFrozenLockfile` | `true` | CI 中使用冻结 lockfile，跳过解析 |
| `nodeLinker` | `isolated` | `hoisted` 模式用于无 symlink 环境（如 AWS Lambda） |
| `ignoreScripts` | `false` | 跳过所有脚本 |
| `strictDepBuilds` | `false` | 未审核的 postinstall 脚本报错退出 |
| `minimumReleaseAge` | `0` | 新包延迟 N 分钟后再安装（安全特性） |

## 4. 常用命令

| npm 命令 | pnpm 等价 | 说明 |
|----------|-----------|------|
| `npm install` | `pnpm install` | 安装所有依赖（从 lockfile） |
| `npm i <pkg>` | `pnpm add <pkg>` | 安装 dependencies |
| `npm i -D <pkg>` | `pnpm add -D <pkg>` | 安装 devDependencies |
| `npm run <cmd>` | `pnpm <cmd>` | 运行脚本（如 `pnpm dev`、`pnpm build`） |
| `npm update` | `pnpm update` | 更新依赖 |
| `npm uninstall` | `pnpm remove` | 移除依赖 |
| `npx <cmd>` | `pnpm exec <cmd>` | 执行命令 |
| `npm outdated` | `pnpm outdated` | 查看过期依赖 |

**注意**: pnpm 不需要 `run` 关键字 — `pnpm dev` 等价于 `npm run dev`。

## 5. CI/CD 配置

### GitHub Actions / Vercel

```yaml
# pnpm 在 CI 中的推荐设置
- uses: pnpm/action-setup@v4
  with:
    version: 9.15.3
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'pnpm'

- run: pnpm install --frozen-lockfile
- run: pnpm build
- run: pnpm lint
```

### Vercel 部署

- **Build Command**: `pnpm build`
- **Install Command**: `pnpm install`
- **Node Version**: 20.x
- Vercel 内置支持 pnpm，自动识别 `packageManager` 字段
- 默认 `packageManagerStrictVersion=false` 确保版本偏差不阻塞部署

## 6. 迁移指南（从 npm）

```bash
# 1. 安装 pnpm
npm install -g pnpm@latest-10

# 2. 从 npm lockfile 生成 pnpm-lock.yaml
pnpm install

# 3. 删除 npm lockfile
rm package-lock.json

# 4. 添加 packageManager 字段（corepack 方式）
corepack use pnpm@9.15.3

# 5. 验证
pnpm dev
pnpm build
```

## 7. 常见陷阱

### Docker / Serverless

| 环境 | 注意事项 |
|------|---------|
| **Vercel** | 默认 pnpm 配置即可，无需额外设置 |
| **AWS Lambda** | 需设置 `nodeLinker=hoisted`（不支持 symlink） |
| **Docker** | 按官方流程安装 pnpm，使用 `--frozen-lockfile` |
| **Monorepo** | 使用 `pnpm-workspace.yaml` + `--filter` 参数 |

### pnpm 特有行为

- **依赖提升**: pnpm 使用 symlink 而非扁平 node_modules，`require.resolve` 行为与 npm 不同
- **生命周期脚本**: 默认禁止依赖项的 postinstall，可通过 `onlyBuiltDependencies` 白名单放开
- **`pnpm add` 与 `pnpm install` 不同**: `add` 安装新包，`install` 安装已有依赖

## 8. 供应链安全

pnpm 10+ 提供多层安全机制：

| 机制 | 说明 |
|------|------|
| `minimumReleaseAge` | 新发布包延迟安装（如 `360` = 6 小时） |
| `trustPolicy: no-downgrade` | 拒绝 trust 证据降级的包 |
| `blockExoticSubdeps` | 限制 git repo / tarball URL 为直接依赖 |
| 默认禁用 postinstall | 通过 `onlyBuiltDependencies` 白名单控制 |

## 9. 本项目配置状态

| 文件 | 状态 | 说明 |
|------|------|------|
| `package.json` | ✅ | 已添加 `"packageManager": "pnpm@9.15.3"` |
| `.npmrc` | ✅ | 已创建，使用默认严格模式 |
| `pnpm-lock.yaml` | ✅ | 项目锁文件 |
| `package-lock.json` | ❌ | 已删除（npm 遗留） |
| `docs/project-context.md` | ✅ | 已更新技术栈 + Agent Rules |
| `AGENTS.md` | ✅ | 已追加 pnpm 规则 section |
| Phase 1 story docs | ✅ | 已修正 npm → pnpm |

## 10. 参考链接

- [pnpm 官方文档](https://pnpm.io/)
- [pnpm 安装指南](https://pnpm.io/installation)
- [pnpm CLI 命令](https://pnpm.io/pnpm-cli)
- [pnpm 配置选项](https://pnpm.io/settings)
- [pnpm .npmrc 配置](https://pnpm.io/npmrc)
- [pnpm package.json 配置](https://pnpm.io/package_json)
