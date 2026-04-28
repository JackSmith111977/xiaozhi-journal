# 数据库备份策略操作指南

> 本文档基于 2026 年最新 Supabase 官方文档调研，为 Story 13.6 实施指南。

---

## Sources

- [Database Backups - Supabase Docs](https://supabase.com/docs/guides/platform/backups)
- [Point-in-Time Recovery - Supabase Docs](https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery)
- [Pricing - Supabase](https://supabase.com/pricing)
- [Supabase Backup Complete Guide - SimpleBackups](https://simplebackups.com/learn/supabase-backup)
- [Supabase Pricing 2026 - UIBakery](https://uibakery.io/blog/supabase-pricing)

---

## 1. Supabase 备份策略概览

### 重要发现：Free tier 无备份

**⚠️ 关键结论：Free tier 不提供自动备份功能。**

根据 2026 年最新官方文档：

| Tier | 价格 | 自动备份 | Retention | PITR |
|------|------|----------|-----------|------|
| **Free** | $0 | ❌ **无** | N/A | ❌ |
| **Pro** | $25/mo | ✅ Daily | **7 天** | ✅ Add-on |
| **Team** | $599/mo | ✅ Daily | **14 天** | ✅ Add-on |
| **Enterprise** | Custom | ✅ Daily | **30 天** | ✅ Add-on |

> **注意**：早期文档提到 Free tier 有 7 天备份，但 2026 年官方确认 Free tier 不提供备份。这意味着 Free tier 项目无法从 Supabase Dashboard 恢复数据。

### 备份内容

| 包含 | 不包含 |
|------|--------|
| PostgreSQL 数据库（表 + 索引 + RLS 策略） | Storage API 存储的文件（仅保留 metadata）|
| Auth 用户数据（auth.users 表） | 自定义角色的密码（需重新设置）|
| 表结构（DDL） | 函数代码（Edge Functions）|

### 备份机制

**Daily Physical Snapshots:**
- Pro/Team/Enterprise tier 每日自动生成物理快照
- 快照包含完整数据库状态
- 快照存储在 Supabase 服务器，与项目在同一地理区域

**恢复时间：**
- 取决于数据库大小
- 小数据库（<1GB）：几分钟
- 大数据库：可能需要数小时

---

## 2. Point-in-Time Recovery (PITR)

### PITR 功能

PITR 使用 WAL（Write-Ahead Log）持续记录事务日志，允许恢复到任意秒级时间点。

| 特性 | 说明 |
|------|------|
| **恢复粒度** | 秒级精度 |
| **最小计算规格** | Small compute 或更高 |
| **可用 Tier** | Pro/Team/Enterprise（Add-on）|
| **收费方式** | 按小时计费，使用量计费 |

### PITR Retention 选项

| Retention | 估算月费 |
|-----------|----------|
| 7 天 | ~$100/mo |
| 14 天 | ~$200/mo |
| 28 天 | ~$400/mo |

> **价格说明**：PITR 是独立 add-on，费用基于数据库大小和日志量。典型项目月费在"低百美元范围"。

### PITR 配置

**Dashboard 路径：**
```
Settings → Database → Backups → Point-in-Time tab
```

**启用步骤：**
1. 选择 Retention 窗口（7/14/28 天）
2. 确认计算规格 ≥ Small
3. 启用 Add-on

**禁用影响：**
- 立即停止计费
- 已使用时长按实际收费
- Retention 窗口关闭

---

## 3. 恢复操作流程

### Free tier 用户（无备份）

**唯一方案：升级到 Pro**

```
升级到 Pro ($25/mo) → 获得 7 天备份 → 立即可恢复
```

> **注意**：升级后需要等待下一个 backup cycle（通常凌晨）才能获得备份点。无法恢复升级前的数据。

### Pro/Team tier 用户

**Dashboard 恢复路径：**
```
Dashboard → Project → Settings → Database → Backups → Restore
```

**恢复步骤：**

1. **选择备份点**
   - Daily Snapshot：选择最近 7 天内的某个快照
   - PITR（如启用）：选择任意时间点

2. **确认恢复**
   - 点击 Restore 按钮
   - 系统提示服务中断时间

3. **等待完成**
   - 服务暂停（时间取决于数据库大小）
   - 恢复完成后自动恢复服务

### 恢复注意事项

| 注意点 | 说明 |
|--------|------|
| **服务中断** | 恢复期间数据库不可用 |
| **RLS 策略** | 自动恢复，无需手动配置 |
| **自定义角色密码** | 需重新设置（备份不存储）|
| **Storage 文件** | 仅恢复 metadata，文件需手动恢复 |
| **时间窗口** | Pro tier 最多恢复 7 天内，Team tier 14 天内 |

### 恢复后验证

**关键验证项：**

```sql
-- 验证 RLS 策略生效
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- 验证用户数据完整
SELECT COUNT(*) FROM journals WHERE user_id = 'xxx';
```

---

## 4. 当前项目备份策略决策

### 当前状态确认

**项目：** Xiaozhi Journal
**Supabase Tier：** 待确认（需查看 Dashboard）

**决策矩阵：**

| 场景 | 建议 |
|------|------|
| **当前 Free tier** | ⚠️ 无法恢复数据。强烈建议升级 Pro。 |
| **当前 Pro tier** | ✅ 7 天备份可用。满足基本 SLA。 |
| **用户数据增长 > 1000 条** | 建议 Pro + PITR（秒级恢复）。 |
| **SLA 要求 ≥ 99.9%** | 必须 Team tier（14 天）+ PITR。 |

### 升级时机评估

| 触发条件 | 升级建议 |
|----------|----------|
| 用户数据量增长 | Pro tier（7 天备份保护）|
| DAU > 100 | Pro tier |
| DAU > 1000 | Team tier + PITR |
| 商业运营正式启动 | Team tier（14 天 + PITR）|

---

## 5. 用户数据导出验证

### 现有实现分析（Story 9.4）

**文件：** `xiaozhi-journal/src/lib/export.ts`

**导出格式：**
```json
{
  "version": "1.0",
  "profile": { "nickname", "email", "registeredAt" },
  "journals": [
    {
      "id", "content", "mood", "moodEmoji",
      "aiResponse", "goldenQuote", "moodLabel",
      "createdAt", "updatedAt", "status"
    }
  ],
  "exportedAt": "ISO-8601"
}
```

**字段命名：** ✅ camelCase（符合前端规范）

**数据源：**
- Supabase `journals` 表（分页查询）
- IndexedDB `pending` 状态日记（合并去重）

### ⚠️ 发现缺口

**现有导出仅包含 2 张表：**
- ✅ `profiles`（通过 auth.users 补充）
- ✅ `journals`

**缺失 4 张表（AC3 要求）：**
- ❌ `ai_usage` — AI 使用量记录
- ❌ `user_api_keys` — 用户 BYOK Key
- ❌ `subscriptions` — 订阅状态
- ❌ `app_meta` — 用户元数据

**建议：** Story 9.4 需扩展导出范围，或单独创建"完整导出"功能。

---

## 6. Free tier 备份替代方案

### GitHub Actions 自动备份

**方案：** 使用 GitHub Actions 每日执行 pg_dump，备份到外部存储。

**示例配置：**

```yaml
# .github/workflows/db-backup.yml
name: Daily DB Backup
on:
  schedule:
    - cron: '0 0 * * *'  # 每日凌晨 UTC

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Install pg_dump
        run: sudo apt-get install postgresql-client
      
      - name: Dump database
        env:
          DB_URL: ${{ secrets.SUPABASE_DB_URL }}
        run: pg_dump "$DB_URL" > backup.sql
      
      - name: Upload to S3
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_KEY }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET }}
        run: aws s3 cp backup.sql s3://my-backups/xiaozhi-journal/
```

**注意：** 此方案需要：
1. Supabase Database URL（从 Dashboard 获取）
2. AWS S3 或其他外部存储
3. GitHub Actions secrets 配置

---

## 7. 完成检查清单

- [ ] 确认当前 Supabase tier（Dashboard 查看）
- [ ] 如果 Free tier，决定是否升级 Pro
- [ ] 记录升级决策到 `architecture.md`
- [ ] 如果 Pro tier，测试恢复流程（可选）
- [ ] 验证数据导出完整性（扩展缺失表）
- [ ] 配置 GitHub Actions 备份（如 Free tier 用户）

---

## 8. 参考链接

- [Database Backups - Supabase Docs](https://supabase.com/docs/guides/platform/backups)
- [Point-in-Time Recovery - Supabase Docs](https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery)
- [Pricing - Supabase](https://supabase.com/pricing)
- [Supabase Backup Complete Guide - SimpleBackups](https://simplebackups.com/learn/supabase-backup)
- [Supabase Pricing 2026 - UIBakery](https://uibakery.io/blog/supabase-pricing)
- [Restore Supabase Backup - RapidDev](https://www.rapidevelopers.com/supabase-tutorial/how-to-restore-supabase-backup)