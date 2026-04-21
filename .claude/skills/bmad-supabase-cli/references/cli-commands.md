# Supabase CLI 命令参考

## 初始化

| 命令 | 用途 | 说明 |
|------|------|------|
| `supabase init` | 初始化本地项目 | 生成 `supabase/config.toml` 和 `supabase/migrations/` |
| `supabase login` | 登录 Supabase 账户 | 浏览器交互式登录 |
| `supabase login --token <token>` | 使用 token 登录 | CI/CD 环境使用 |
| `supabase link --project-ref <ref>` | 关联远程项目 | `<ref>` 是项目 URL 中的标识符 |

## 本地开发

| 命令 | 用途 | 说明 |
|------|------|------|
| `supabase start` | 启动本地 Supabase 栈 | 启动 PostgreSQL + API + Studio 等容器 |
| `supabase stop` | 停止本地栈 | 保留数据 |
| `supabase stop --no-backup` | 停止并清除数据 | 清理环境 |
| `supabase status` | 查看服务状态 | 确认连接和端口 |

## 迁移管理

| 命令 | 用途 | 说明 |
|------|------|------|
| `supabase migration new <name>` | 创建新迁移文件 | 自动生成 `supabase/migrations/{timestamp}_<name>.sql` |
| `supabase migration list` | 查看迁移历史 | 对比本地与远程状态 |
| `supabase migration up` | 应用所有待处理的迁移 | 本地数据库 |
| `supabase migration down` | 回滚最近一次迁移 | 默认 1 次，可指定次数 |
| `supabase migration repair <version> --status applied` | 修复迁移状态 | 手动标记为已应用 |
| `supabase migration repair <version> --status reverted` | 修复迁移状态 | 手动标记为已回滚 |
| `supabase migration squash` | 合并多个迁移为一个 | 减少迁移文件数量 |

## 数据库操作

| 命令 | 用途 | 说明 |
|------|------|------|
| `supabase db push` | 推送迁移到远程 | 将本地迁移应用到远程数据库 |
| `supabase db push --dry-run` | 预览推送效果 | 不实际执行 |
| `supabase db push --include-all` | 包含种子数据 | 推送 migrations + seeds |
| `supabase db reset` | 重置本地数据库 | 重新执行所有迁移 |
| `supabase db diff -f <filename>` | 对比 Schema 差异 | 保存差异到 SQL 文件 |
| `supabase db diff --schema public --use-migra` | 使用 migra 工具对比 | 更精确的 diff |
| `supabase db pull` | 拉取远程 Schema 变更 | 同步远程变更到本地 |
| `supabase db dump` | 导出远程数据库内容 | 数据备份 |
| `supabase db lint` | 检查数据库问题 | 验证 Schema 完整性 |

## 存储管理

| 命令 | 用途 | 说明 |
|------|------|------|
| `supabase storage ls [path] --experimental` | 列出存储对象 | 需要 `--experimental` |
| `supabase storage cp <src> <dst> --experimental` | 复制文件 | 本地 ↔ 远程 |
| `supabase storage mv <src> <dst> --experimental` | 移动文件 | 远程内移动 |
| `supabase storage rm <file> ... --experimental` | 删除文件 | 支持多个文件 |

## SQL 执行

| 命令 | 用途 | 说明 |
|------|------|------|
| `supabase db execute -f <file.sql>` | 执行 SQL 文件 | 直接运行任意 SQL |
| `supabase db execute -c "SELECT 1"` | 执行 SQL 命令 | 交互式测试 |

## 类型生成

| 命令 | 用途 | 说明 |
|------|------|------|
| `supabase gen types typescript --local` | 生成 TypeScript 类型 | 基于本地数据库 Schema |
| `supabase gen types typescript --project-id <ref>` | 生成远程 TypeScript 类型 | 基于远程数据库 Schema |
| `supabase gen types typescript --local > src/lib/database.types.ts` | 保存类型到文件 | 推荐输出到 `src/lib/` |

## 常用工作流

### 首次设置项目

```bash
supabase init
supabase login
supabase link --project-ref <your-project-ref>
supabase db push          # 推送所有本地迁移
supabase migration list   # 确认状态
```

### 创建并应用新迁移

```bash
# 1. 创建迁移文件
supabase migration new create_users_table
# 或直接手动创建 supabase/migrations/NNN_description.sql

# 2. 编辑 SQL 文件...

# 3. 本地验证
supabase db reset

# 4. 预览
supabase db push --dry-run

# 5. 推送
supabase db push

# 6. 确认
supabase migration list
```

### 回滚错误迁移

```bash
# 1. 查看当前状态
supabase migration list

# 2. 回滚
supabase migration down

# 3. 修复 SQL 文件

# 4. 重新推送
supabase db push
```

### 从远程拉取变更

```bash
supabase db pull          # 拉取远程 Schema 变更
supabase db reset         # 本地应用
supabase migration list   # 确认同步
```

### 迁移编号冲突解决

```bash
# 1. 查看状态
supabase migration list

# 2. 重命名冲突的本地文件为新编号

# 3. 修复标记
supabase migration repair <version> --status reverted

# 4. 重新推送
supabase db push
```

### 压缩迁移文件（减少数量）

```bash
supabase migration squash  # 合并所有已应用迁移
supabase db push           # 推送
```
