Status: done

# Story 9.4: 数据导出（GDPR 可携带权）

## Story

As a 用户,
I want 导出自己的全部日记数据,
So that 我能保留自己的数据副本或迁移到其他平台（符合 NFR16）。

## Acceptance Criteria

1. **Given** 用户在设置页点击"导出数据"
   **When** 请求发起
   **Then** 查询 `supabase.from('journals').select()` WHERE `user_id = auth.uid()`
   **And** 返回全部日记数据（含 AI 回应、金句、情绪标签）
   **And** 导出为 JSON 文件，字段使用 `camelCase`

2. **Given** 导出文件生成完毕
   **When** 文件下载触发
   **Then** 文件名格式为 `xiaozhi-journal-export-{YYYY-MM-DD}.json`
   **And** 文件包含用户 profile 信息（昵称、注册时间）

3. **Given** 导出数据量较大（>100 条）
   **When** 导出进行中
   **Then** 显示加载提示："正在准备你的数据，请稍候..."
   **And** 完成后自动下载

## Tasks / Subtasks

- [ ] Task 1: 创建数据导出函数 (AC: #1)
  - [ ] `src/lib/export.ts` — fetch all journals + profile from Supabase
  - [ ] Map DB snake_case fields to camelCase
  - [ ] Include profile info

- [ ] Task 2: 设置页增加"导出数据"按钮 (AC: #2, #3)
  - [ ] 设置页增加"导出数据"按钮
  - [ ] 点击 → 查询 + 生成 JSON → 下载
  - [ ] 加载提示

## Dev Notes

### 前置 Story 依赖

- **Story 9.1**（已完成）：journals、profiles 表
- **Story 8.4**（已完成）：设置页 (`src/app/settings/page.tsx`)

### 架构约束

- 导出使用 Supabase 查询（云端数据），也可合并 IndexedDB 本地数据
- 文件名使用日期格式
- camelCase 字段名导出

### File List (预期)

- `src/lib/export.ts` — 新增：数据导出
- `src/app/settings/page.tsx` — 修改：增加"导出数据"按钮

### References

- [Source: epics.md#Epic 9 → Story 9.4]

## Dev Agent Record

### Agent Model Used

qwen3.6-plus

### Debug Log References

### Completion Notes List

### File List

### Change Log

## Senior Developer Review (AI)
