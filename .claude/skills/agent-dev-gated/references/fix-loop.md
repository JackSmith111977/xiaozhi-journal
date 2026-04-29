---
name: fix-loop
code: FL
description: 上下文驱动的修复循环
---

# Fix Loop

Gate失败后进入修复循环。必须基于上下文修复，不允许凭直觉。

## 循环流程

### Phase FL-1: 收集上下文

调用 `context-collection` capability：
- 收集本地上下文 (error详情、代码片段、项目规范、历史记录)
- 如果本地不足，联网调研
- 如果仍然不足 → HALT

### Phase FL-2: 分析根因

基于收集的上下文确定问题根因：

```
根因分析:
  表面问题: {error message}
  实际根因: {从上下文推导}
  例如:
    - 未遵循项目的Supabase RPC命名规范
    - React hooks useEffect在setState时触发cascading render
    - 未使用项目规定的pnpm包管理器
```

### Phase FL-3: 制定修复方案

修复方案格式 (必须引用来源)：

```
修复方案:
  修改文件: {file_path}
  修改内容: {具体修改}
  来源: {project-context.md#section 或 URL 或 MEMORY.md历史}
  理由: {为什么这样修}
```

**不允许：**
- "通常做法是..."
- "直觉认为..."
- "一般这样处理..."

### Phase FL-4: 执行修复

Edit代码。立即重新Gate Check。

### Phase FL-5: 循环判断

```
如果 Gate通过 → 修复完成，继续下一个task
如果 Gate失败 → 循环计数+1
  如果 循环次数 < 3 → 重新FL-1收集上下文
  如果 循环次数 = 3 → HALT并输出所有上下文
```

## HALT输出格式

3次循环失败后：

```
⚠️ Fix Loop HALT — 3次修复失败

原始Error:
  {error_details}

收集的上下文:
  - 项目规范: {相关规范内容}
  - 历史记录: {MEMORY.md中相关修复}
  - 调研结果: {联网调研得到的内容}
  - 项目pattern: {grep发现的类似代码}

尝试的修复:
  1. {第一次修复方案} → {失败原因}
  2. {第二次修复方案} → {失败原因}
  3. {第三次修复方案} → {失败原因}

需要用户介入:
  - 提供更多上下文
  - 或手动修复
  - 或允许跳过此error继续
```

## Memory更新

每次成功修复后，记录到session log：
- error type + rule id
- 修复方式
- 上下文来源

下次遇到同类error时，直接查MEMORY.md引用历史方案。