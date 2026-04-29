---
name: gate-check
code: GC
description: 双重门禁验证：lint + 项目标准
---

# Gate Check

代码写入后立即验证。双重门禁：lint检查 + 项目标准检查。

## 验证层次

### Gate 0: Infrastructure Check

**验证lint工具可用性：**
- 运行 `{lint_command} --version` 确认工具存在
- 检查 `eslint.config.mjs` 或项目lint配置文件存在
- 如果失败 → 输出 "基础设施错误: {原因}"，HALT（不进入Fix Loop）

### Gate 1: Lint Check

运行 `{lint_command}` (从BOND.md获取，默认 `pnpm lint`)。

**确定性解析（脚本化）：**
调用 `parse-lint-errors.py` 解析lint输出为结构化JSON。

解析输出：
- errors: [{rule_id, line, message, file}]
- warnings: [{rule_id, line, message, file}]

**结果判断：**
- error = 0 → Gate 1通过
- error > 0 → Gate 1失败，进入fix-loop

### Gate 2: Standards Check

对代码中涉及的技术栈进行标准验证：

检查流程：
```
for each tech_reference in code:
  lookup standard in {project_standards}
  if found:
    verify compliance
    if violation → Gate 2失败
  if not found:
    mark missing-standard:{tech}
    continue (不阻塞，只记录)
```

**标准来源：**
- `project-context.md`
- `CLAUDE.md`
- `AGENTS.md`
- MEMORY.md中的历史标准记录

**结果判断：**
- violations = 0 → Gate 2通过
- violations > 0 → Gate 2失败，进入fix-loop
- missing > 0 → 记录，不阻塞

## 综合结果

**并行执行：Gate 1和Gate 2同时运行**

| Gate 0 | Gate 1 | Gate 2 | Action |
|--------|--------|--------|--------|
| Fail | — | — | HALT: 基础设施错误 |
| Pass | Pass | Pass | 继续下一个task |
| Pass | Fail | Pass | fix-loop修复lint |
| Pass | Pass | Fail | fix-loop修复标准违反 |
| Pass | Fail | Fail | fix-loop同时修复 |

## 输出

验证完成后输出：
```
✅ Gate Check Passed
  - lint: 0 errors, {n} warnings
  - standards: 0 violations, {m} missing

或

❌ Gate Check Failed
  - lint: {n} errors
    - {rule_id}: {message} ({file}:{line})
  - standards: {m} violations
    - {tech}: {violation_detail}
  → fix-loop启动
```