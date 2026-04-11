Status: review

# Story 2.1: 心情表情选择器

## Story

As a 想要快速记录心情的用户,
I want 看到 5 个清晰的表情按钮,
so that 我可以在 3 秒内选择当天的心情。

## Acceptance Criteria

1. **Given** 用户打开首页
   **When** 页面渲染
   **Then** 显示 "今天心情怎么样？" 标题（Noto Serif SC, 26px+）
   **And** 水平排列 5 个表情按钮：😡 😔 😐 😊 😴
   **And** 每个按钮为 56x56px 圆角方形（rounded-full），间距 16px
   **And** 按钮使用定制 SVG 图标（非标准 emoji）
   **And** hover 时按钮 scale(1.15) 并上浮 2px（Framer Motion spring）

2. **Given** 用户点击一个表情
   **When** 点击事件触发
   **Then** 被点击的表情放大至 scale(1.3) 后回弹，背景变为暖珊瑚色
   **And** 未选中的表情透明度降至 50%
   **And** 日记输入框从下方弹性滑入（Framer Motion spring 动画）

3. **Given** 用户使用键盘导航
   **When** 按 Tab 键聚焦到表情按钮
   **Then** 焦点指示器为暖珊瑚色 `outline: 2px solid #D4856A`
   **And** 每个表情按钮有 `aria-label`（如"烦躁"、"难过"、"平静"、"开心"、"疲惫"）
   **And** 容器使用 `role="radiogroup"`，按钮使用 `role="radio"`

## Tasks / Subtasks

- [x] Task 1: 创建心情选择器组件 (AC: #1)
  - [x] 创建 `components/mood-selector.tsx`
  - [x] 实现 5 个定制 SVG 表情图标
  - [x] 实现水平排列布局（56x56px, 16px 间距）
  - [x] 添加 hover 动画（scale(1.15) + 上浮 2px）
- [x] Task 2: 实现点击交互 (AC: #2)
  - [x] 点击时表情放大至 scale(1.3) 回弹，背景变暖珊瑚色
  - [x] 未选中表情透明度降至 50%
  - [x] 触发输入框弹性滑入（通过 Zustand store 状态）
- [x] Task 3: 无障碍适配 (AC: #3)
  - [x] 添加 aria-label 到每个表情按钮
  - [x] 使用 role="radiogroup" 和 role="radio"
  - [x] 添加键盘导航焦点指示器

## Dev Notes

### 心情映射
| 值 | 表情 | 标签 | 颜色 |
|----|------|------|------|
| 1 | 😡 | 烦躁 | 暖粉调 |
| 2 | 😔 | 难过 | 暖灰调 |
| 3 | 😐 | 平静 | 标准暖日色 |
| 4 | 😊 | 开心 | 暖黄调 |
| 5 | 😴 | 疲惫 | 冷灰调 |

### 动效参数
- Hover: `whileHover={{ scale: 1.15, y: -2 }}`
- Click: `whileTap={{ scale: 1.3 }}`
- 输入框滑入: Framer Motion spring 动画

### References
- [Source: ux-design-specification.md#MoodSelector]
- [Source: ux-design-specification.md#Accessibility Considerations]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
