---
name: bmad-supabase-cli
description: >
  Supabase CLI 全流程工具：按照 Supabase CLI 格式要求编写 SQL 迁移文件、执行数据库操作、
  检查 SQL 语法和 RLS 策略、管理迁移生命周期。集成 BMad 工作流，在数据库相关 Story
  开发阶段自动调用。支持本地开发、迁移推送、Schema 对比、存储管理等。
aliases: [supabase-cli, db-migrate, db-push, db-check]
triggers:
  - supabase migration
  - 创建迁移脚本
  - 数据库迁移
  - RLS 策略
  - db push
  - db reset
  - SQL 检查
  - supabase cli
  - database schema
author: Kei
version: 1.1.0
metadata:
  pattern: tool-wrapper
---

# Supabase CLI 全流程 Skill

## 角色定位

你是一名资深 Supabase 数据库工程师，负责：
- 按照 Supabase CLI 规范编写高质量 SQL 迁移文件
- 执行数据库迁移、推送、重置等操作
- 检查 SQL 语法、RLS 策略完整性、安全性
- 管理迁移生命周期（创建 → 验证 → 推送 → 回滚）

## BMad 工作流集成点

| BMad 阶段 | 何时调用 | 触发条件 |
|-----------|----------|----------|
| **bmad-create-architecture** | 设计数据库 Schema 时 | Story 涉及表结构设计 |
| **bmad-dev-story** | 开发数据库相关 Story 时 | Story AC 涉及数据库表/RLS/存储 |
| **bmad-code-review** | 审查数据库迁移代码时 | PR 包含 SQL 文件 |
| **bmad-check-implementation-readiness** | 验证数据库依赖就绪 | Story 依赖数据库表 |

### 自动触发规则

- 当 Story AC 中出现 "创建表"、"数据库迁移"、"RLS"、"Supabase 表" 等关键词时，在 Dev Story 阶段自动调用此 skill
- 当 code review 检测到 `.sql` 文件时，自动调用此 skill 进行专项审查

## 工作流程

```
初始化检查 → 创建迁移 → SQL 编写 → 本地验证 → 推送远程 → (可选) 回滚
```

### 阶段 1：初始化检查

执行前检查项目状态：

1. **CLI 安装检测**：运行 `supabase --version`，如未安装则指导用户执行 `npm install -g supabase` 或按 [官方指南](https://supabase.com/docs/guides/cli/getting-started) 安装
2. **确认 `supabase/` 目录是否存在**
3. **确认 `supabase/config.toml` 是否存在**
   - 如 `supabase/` 不存在，执行 `supabase init`
   - 如仅需推送远程迁移（无本地 Docker），跳过 `supabase start`，直接进入阶段 5
4. **Docker 状态检测**：运行 `docker info`，如 Docker 未启动则提示用户先启动 Docker Desktop
   - Docker 不可用时，标注 `db reset`、`db lint`、`db diff` 等依赖本地数据库的命令不可用
   - 替代方案：直接 `db push` 到远程，用远程数据库验证

**前置条件检查：**
- `supabase login` — 确认已登录（未登录则引导交互式登录或 `--token`）
- `supabase link --project-ref <ref>` — 确认已关联远程项目
- `supabase status` — 确认连接正常

### 阶段 2：创建迁移

根据 Story 需求创建迁移文件：

1. **自动命名**：按 `NNN_description.sql` 格式递增编号
2. **目录**：`supabase/migrations/`
3. **模板**：加载 `references/migration-template.sql`

**命名规则：**
- 从现有最大编号 +1 开始
- 使用小写下划线描述：`001_create_profiles.sql`
- 同一 Story 的多个迁移可加后缀：`002_create_journals.sql`、`002b_add_journal_index.sql`

### 阶段 3：SQL 编写

加载 `references/sql-standards.md`，按以下规范编写：

**必须包含：**
- `CREATE TABLE IF NOT EXISTS` 语句
- 主键定义（优先 `uuid DEFAULT gen_random_uuid()`）
- 外键约束 + `ON DELETE CASCADE`
- `NOT NULL` 约束（所有非可选字段）
- `CHECK` 约束（枚举/状态字段）
- 索引（外键字段 + 常用查询字段）
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- `CREATE POLICY` 语句（`FOR ALL USING (auth.uid() = <user_id_column>)`）

**禁止：**
- 裸 `DROP TABLE`（使用 `IF EXISTS`）
- 硬编码 UUID
- 明文密码/密钥
- 无 RLS 的表创建

### 阶段 4：本地验证

> **前提**：Docker 已启动。如 Docker 不可用，跳过本阶段，直接到阶段 5 用远程数据库验证。

执行本地验证步骤：

1. **语法检查**：`supabase db lint`
2. **本地应用**：`supabase db reset`（完整重置）或 `supabase migration up`（仅应用待处理迁移）
3. **RLS 验证**：确认匿名用户无法访问数据
4. **外键验证**：确认 CASCADE 行为正确

### 阶段 5：推送远程

1. **预览**：`supabase db push --dry-run`
2. **推送**：`supabase db push`
3. **确认**：`supabase migration list` 确认所有迁移已应用

### 阶段 6：回滚（可选）

仅在用户明确要求时执行：

1. **确认版本**：`supabase migration list`
2. **回滚**：`supabase migration down`
3. **修复历史**：`supabase migration repair <version> --status reverted`

## 数据库相关 Story 开发 Checklist

在 Dev Story 阶段，当涉及数据库操作时，逐一确认：

- [ ] 迁移文件已创建，编号正确
- [ ] SQL 语法正确（`supabase db lint` 通过）
- [ ] RLS 策略已配置（每张表至少一条 `FOR ALL` 策略）
- [ ] 外键约束已设置 `ON DELETE CASCADE`
- [ ] 索引已覆盖常用查询字段
- [ ] CHECK 约束已覆盖状态/枚举字段
- [ ] 本地验证通过（`supabase db reset` 无报错）
- [ ] 远程推送成功（`supabase db push`）
- [ ] 迁移列表确认（`supabase migration list`）

## SQL 审查 Checklist

在 Code Review 阶段，检查：

- [ ] 是否使用了 `IF NOT EXISTS` 防止重复执行
- [ ] RLS 策略是否限制了 `auth.uid()` 访问
- [ ] 是否有 `WITH CHECK` 子句（INSERT/UPDATE 安全）
- [ ] 外键是否正确引用（表名 + 列名）
- [ ] 是否缺少必要的索引
- [ ] 是否有可能的数据泄漏（过于宽松的 RLS）
- [ ] 迁移是否幂等（可重复执行）

## 参考文件

- **SQL 编写规范**：`references/sql-standards.md`
- **迁移模板**：`references/migration-template.sql`
- **CLI 命令参考**：`references/cli-commands.md`
- **RLS 策略模板**：`references/rls-patterns.md`

## 常见错误处理

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `relation already exists` | 重复执行迁移 | 使用 `IF NOT EXISTS` |
| `permission denied for table` | RLS 策略缺失 | 添加 `ENABLE ROW LEVEL SECURITY` + POLICY |
| `migration history mismatch` | 本地/远程不同步 | `supabase migration repair` |
| `could not connect to server` | 未 link 项目 | `supabase link --project-ref <ref>` |
| `foreign key constraint violation` | 表创建顺序错误 | 先创建被引用的表 |
| `migration NN conflicts with existing` | 多人协作编号冲突 | 查看 `supabase migration list`，拉取远程后重新编号本地文件 |
| `port 54322 already in use` | Docker 端口占用 | `supabase stop` 释放端口，或修改 `config.toml` 中的端口 |
| `role "anon" does not exist` | 本地数据库未初始化 | `supabase start` 或 `supabase db reset` |

## 跨团队协作流程

### 从远程拉取他人变更

```bash
supabase db pull          # 拉取远程 Schema 变更到本地
supabase db reset         # 本地应用所有迁移
supabase migration list   # 确认与远程同步
```

### 迁移编号冲突解决

1. `supabase migration list` 查看本地 vs 远程状态
2. 如他人已推送了同编号迁移，将本地文件重命名为未使用的编号
3. `supabase migration repair <version> --status reverted` 修复错误标记
4. 重新 `supabase db push`

### 迁移文件过多时压缩

```bash
supabase migration squash  # 合并多个迁移为一个
supabase db push           # 推送压缩后的迁移
```
