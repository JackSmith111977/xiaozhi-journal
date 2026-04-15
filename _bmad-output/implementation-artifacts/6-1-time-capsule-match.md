# Story 6.1: 历史匹配逻辑 + 弹窗触发

## Story

As a 打开 App 的用户,
I want 在合适的时机被提醒旧日记,
so that 我能感受到跨越时间的自我共鸣。

## Acceptance Criteria

1. **Given** 用户完成一次新的日记记录
   **When** 系统检查是否有可匹配的历史日记
   **Then** 按优先级遍历时间锚点（周年 → 半年 → 季度），找到第一个命中的窗口
   **And** 每个锚点的匹配条件为：同月同日 ± 容差天数，且时间差 ≥ 该锚点的最小时间门槛
   **And** 多个候选时优先选择心情相近（mood 值 ±1）的那条
   **And** 触发成功后执行频率控制（24h 内不重复、同一篇日记 30 天冷却）
   **Then** 准备展示 TimeCapsuleModal

2. **Given** 时间胶囊触发
   **When** 弹窗出现
   **Then** 使用 shadcn Dialog + Framer Motion 弹性缩放（scale 0.9 → 1.0, 0.3s）
   **And** 背景遮罩为 `rgba(61,61,61,0.4)` + `backdrop-filter: blur(4px)`
   **And** 弹窗内显示：匹配的旧日记日期 + 心情 + 金句
   **And** 标题根据实际时间差动态生成（见 Dev Notes）
   **And** 包含 "去看看" 按钮（Secondary）和 "稍后再说" 按钮（Tertiary）

## Tasks / Subtasks

- [x] Task 1: 实现多锚点匹配逻辑 (AC: #1)
  - [x] 配置驱动的时间锚点系统（周年、半年、季度）
  - [x] 同月同日 ± 容差天数匹配，时间差 ≥ 门槛
  - [x] 多个候选时按心情相近排序
  - [x] 频率控制：24h 不重复、30 天同篇冷却
- [x] Task 2: 创建时间胶囊弹窗 (AC: #2)
  - [x] 更新 `components/capsule-popup.tsx` 支持动态标题
  - [x] 使用 shadcn Dialog + Framer Motion 弹性缩放
  - [x] 实现背景遮罩（毛玻璃效果）
  - [x] 实现动态标题文案 + 旧日记内容 + 两个按钮
- [x] Task 3: 修复 code review 发现的高级别问题
  - [x] useEffect 添加清理机制（取消标志 + 状态重置）
  - [x] setMonth 月末日期回滚问题修复（diffInDays 改为日历日计算）
  - [x] handleClose 添加 once 防护
  - [x] 排除未来时间戳日记匹配
  - [x] recordShown 职责分离（移到调用方）

## Dev Notes

### 匹配逻辑 — 配置驱动的多锚点系统

```javascript
const ANCHOR_CONFIGS = [
  { key: 'year_ago',      months: 12, toleranceDays: 3, minDays: 365, priority: 1 },
  { key: 'half_year_ago', months: 6,  toleranceDays: 3, minDays: 180, priority: 2 },
  { key: 'quarter_ago',   months: 3,  toleranceDays: 2, minDays: 90,  priority: 3 },
];
```

算法流程：
1. 按 priority 从低到高遍历锚点配置
2. 对每个锚点：计算目标日期范围 `[targetDate - tolerance, targetDate + tolerance]`
3. 在历史日记中查找该窗口内的候选
4. 排除时间差 < minDays 的记录
5. 第一个命中的锚点即返回（短路），不再检查更低优先级的锚点
6. 多个候选时：心情相近（mood ±1）的优先，其次随机选择

**不再使用的旧逻辑：**
- ~~"相似情绪（mood ±1）可作为独立触发条件"~~ — 心情只作为排序偏好，不作为独立触发
- ~~30% 随机触发~~ — 改为确定性触发 + 频率控制

### 动态标题文案

根据实际时间差（天）生成：

| 时间差 | 文案 |
|--------|------|
| ≥ 730 天（2年+） | "X 年前的今天，你也有过这样的感受" |
| ≥ 365 天（1年+） | "一年前的今天，你也这样想过" |
| ≥ 180 天（半年+） | "大约半年前，你写下了这些" |
| ≥ 90 天（季度+） | "几个月前的你，也在经历类似的时刻" |

### 频率控制
- 24 小时内最多触发一次（通过 `lastShownDate` 记录）
- 同一篇日记被展示后，冷却 30 天不再展示
- 用户连续关闭弹窗（≥3次），进入 7 天冷却期

### 弹窗规格
- 出现动画：scale 0.9 → 1.0, 0.3s cubic-bezier
- 背景：`rgba(61,61,61,0.4)` + `backdrop-filter: blur(4px)`
- 按钮："去看看"（Secondary）+ "稍后再说"（Tertiary）

### References
- [Source: ux-design-specification.md#Modal & Overlay Patterns]
- [Source: ux-design-specification.md#Button Hierarchy]

## Dev Agent Record

### Agent Model Used

qwen3.6-plus

### Debug Log References

- Next.js DevTools `get_errors`: `{"configErrors":[],"sessionErrors":[]}` — 零错误
- Browser console: 0 errors, 0 warnings
- 页面正常渲染，所有组件可见

### Completion Notes List

**Task 1: 实现多锚点匹配逻辑**
- 新建 `src/lib/time-capsule.ts`，包含完整的配置驱动多锚点匹配系统
- `ANCHOR_CONFIGS` 配置数组：周年(12月/±3天/≥365天)、半年(6月/±3天/≥180天)、季度(3月/±2天/≥90天)
- 按 priority 从低到高遍历，第一个命中的锚点短路返回
- 多个候选时优先选心情相近（mood ±1）的，其次随机
- 频率控制状态通过 `AppMeta` store 持久化到 IndexedDB：
  - `lastShownDate`：24h 不重复
  - `cooldownJournalIds`：同篇 30 天冷却（ capped at 100 entries）
  - `closeCount` + `closeCooldownUntil`：连续关闭 ≥3 次 → 7 天冷却期
- 导出函数：`checkTimeCapsule`（主入口）、`findTimeCapsule`（纯函数）、`recordClose`、`recordShown`、`getCapsuleTitle`

**Task 2: 更新弹窗支持动态标题**
- 删除 `page.tsx` 中旧的 `checkTimeCapsule` 函数（6 行有 bug 的代码）
- 替换为 `import { checkTimeCapsule } from '@/lib/time-capsule'`
- useEffect 改为 async/await 调用新的 `checkTimeCapsule`，接收 `title` 字段
- 新增 `capsuleTitle` state，传递给 `CapsulePopup` 组件
- `capsule-popup.tsx` 新增 `title` prop，替换硬编码标题
- 关闭按钮调用 `recordClose()` 记录关闭次数，触发冷却逻辑
- Esc 键绑定改为调用 `handleClose`（含 `recordClose`）

**Task 3: Code review 修复（High 级别 5 项 + Medium 2 项）**
- `diffInDays` 改为日历日计算（normalize to midnight），避免 DST 偏移
- `loadState` 添加 try-catch + 严格类型守卫（typeof 检查 string/number）
- `recordShown` 从 `checkTimeCapsule` 内部移至调用方（page.tsx），避免"匹配了但没展示"的浪费
- useEffect 添加 `cancelled` cleanup + 状态重置（`setCapsuleTitle('')` / `setCapsuleJournal(null)`）
- `handleClose` 添加 `useRef` once 防护，避免 Esc + 点击遮罩双重触发
- 未来时间戳日记排除（`if (diff < 0) return false`）
- `cooldownJournalIds` 限制最大 100 条目，防止无限增长

### File List

| 操作 | 文件路径 |
|------|---------|
| 新增 | `src/lib/time-capsule.ts` |
| 修改 | `src/app/page.tsx` |
| 修改 | `src/components/capsule-popup.tsx` |

### Change Log

- 重构时间胶囊匹配逻辑：从固定"一年前"改为配置驱动多锚点系统
- 新增动态标题文案生成（周年/半年/季度四档）
- 新增频率控制：24h 不重复、同篇 30 天冷却、连续关闭 7 天冷却
- 移除 30% 随机触发，改为确定性触发 + 频率控制
- 修复旧逻辑中 `||` 导致心情相近即可触发（无日期约束）的 bug
- **Review 修复：** `diffInDays` 日历日计算（DST 安全）、`loadState` 类型守卫 + try-catch、`recordShown` 职责分离、useEffect cleanup、handleClose once 防护、排除未来时间戳、cooldown 数组 capped at 100

Status: review
