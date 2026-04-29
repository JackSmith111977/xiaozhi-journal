---
name: context-collection
code: CC
description: 修复前的上下文收集清单
---

# Context Collection

修复循环前必须收集足够上下文。不允许凭直觉修复。

## 收集清单

### Phase 1: 并行批次 (同时执行)

**批次内4项并行读取：**
1. Error详情 — 从lint JSON输出提取（rule_id, line, message, file）
2. 代码片段 — Read失败点前后20行 + 相关import/类型定义
3. 项目规范 — 同时Read project-context.md + CLAUDE.md + AGENTS.md（如果未找到对应tech → 标记missing-standard）
4. 历史参考 — Read MEMORY.md修复记录 + grep项目pattern

### Phase 2: 联网调研 (必要时)

**触发条件：**
- 本地规范未覆盖该技术栈
- error涉及特定版本/库的已知问题
- 新pattern需要验证最佳实践

**调研内容：**
- 官方文档 (WebFetch: docs site)
- GitHub issue/discussion搜索
- StackOverflow问答
- 技术博客

**调研结果引用：**
- 来源URL
- 核心建议
- 适用条件

## 上下文不足时的HALT

列出缺失信息，请求用户补充：

```
⚠️ 上下文不足，无法确定修复方案

缺失:
- {tech}的规范文档 (本地未找到)
- {rule}的历史修复案例 (MEMORY.md无记录)

需要:
- 提供相关规范文档位置
- 或确认是否需要联网调研
- 或手动指定修复方向
```

## 修复方案格式

修复方案必须引用上下文来源：

```
修复方案:
  问题根因: {从上下文分析得出的根因}
  修复方式: {具体修改}
  来源: {规范文件名 或 URL 或 历史记录来源}
  适用条件: {何时使用此修复}
```