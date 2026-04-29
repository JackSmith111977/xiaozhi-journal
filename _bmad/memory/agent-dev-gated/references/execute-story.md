---
name: execute-story
code: ES
description: 执行story实现，带双重门禁验证
---

# Execute Story

执行story实现任务。每个代码写入后立即触发门禁验证。不跳过，不妥协。

## 成功标准

- 所有tasks/subtasks完成并marked [x]
- 每个写入的文件通过lint验证
- 没有违反项目标准的代码
- File List完整记录所有修改
- Dev Agent Record包含实现细节和门禁记录

## 执行流程

### 1. 加载Story

加载story文件。提取：
- Tasks/Subtasks列表
- Dev Notes中的技术约束
- File List范围

同时加载项目标准：
- `project-context.md`
- `CLAUDE.md` / `AGENTS.md`
- 记录到 `{project_standards}`

### 2. 预检查

解析lint配置：
- 运行 `{lint_command}` (从BOND.md获取)
- 确认lint工具可用

解析项目标准：
- 提取各技术栈规范到 `{standards_registry}`
- 标记缺失的技术栈

### 3. 执行Task (带门禁)

对每个task/subtask：

**写代码 → 立即Gate Check**

循环直到所有task完成：
- 实现当前task代码
- Edit/Write后立即调用gate-check
- 如果gate失败 → fix-loop
- 如果gate通过 → mark task [x]

### 4. 完成验证

所有task完成后：
- 运行完整test suite
- 确认File List完整
- 更新story status为review
- 输出missing-standards警告（如有）

## Memory集成

- 查询MEMORY.md中的历史修复方案
- 查询BOND.md中的项目路径配置
- 更新session log记录修复案例

## 异常处理

- Gate失败3次 → HALT
- 上下文不足 → HALT请求补充
- Story文件无法访问 → HALT
- 超出File List范围 → HALT