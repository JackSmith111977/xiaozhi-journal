# Sprint Change Proposal — 2026-04-26

## Section 1: Issue Summary

**问题：包管理器标准不一致**

项目在 Phase 1（Epic 1, 8, 9）使用 npm，但 Epic 13 开始无声明地切换到 pnpm。当前状态：

- `pnpm-lock.yaml` 与 `package-lock.json` 并存
- `package.json` 缺少 `packageManager` 字段
- 无 `.npmrc` 配置文件
- 多个 story 文档指定 "使用 npm"，与实际情况矛盾
- 未来规划（epics.md Phase 3 Monorepo）全部使用 pnpm

**触发 Story：** 13-1-cicd-pipeline — Vercel 部署配置指定 `pnpm build` / `pnpm install`

---

## Section 2: Impact Analysis

### Epic 影响

| Epic | 影响 | 操作 |
|------|------|------|
| **Epic 13**（当前） | Story 13-1/13-2 已用 pnpm，13-3~13-8 将使用 pnpm | 追加 Story 13-9 正式采纳 pnpm |
| **Epic 1/8/9**（已完成） | Story 文档提到 "使用 npm" | 修正文档中的 npm 引用 |
| **Epic 3~7, 10~16**（未来） | 无影响，均使用 pnpm | — |

### 制品冲突

| 制品 | 冲突 | 操作 |
|------|------|------|
| `package.json` | 缺 `packageManager` 字段 | 追加 `"packageManager": "pnpm@9.15.3"` |
| `.npmrc` | 不存在 | 新建 |
| `package-lock.json` | npm 遗留锁文件，不应存在 | 删除 |
| `docs/project-context.md` | 技术栈未列出 pnpm | 追加一行 + Agent Rule |
| `AGENTS.md` | 无 pnpm 规则 | 追加 pnpm section |
| `_bmad-output/standards/` | 无 pnpm 标准文件 | 新建 `pnpm-best-practices.md` |
| Phase 1 story 文档 | `npm run dev` / "使用 npm" | 统一替换为 pnpm |

---

## Section 3: Recommended Approach

**选择：Direct Adjustment（直接调整）**

- 在 **Epic 13** 追加 **Story 13-9**（正式采纳 pnpm）
- 立即执行所有变更，不阻塞 13-5~13-8 开发
- 工作量：低
- 风险：低
- 无需回滚，不影响 MVP scope

**替代方案：**
- Rollback：不可行，会丢失 13-1/13-2 成果
- MVP Review：不相关

---

## Section 4: Detailed Change Proposals

### Proposal A: Epic 13 追加 Story 13-9

- Story 名：13-9-pnpm-standardization
- Status：backlog（创建后立即执行）
- 覆盖所有以下变更

### Proposal B: package.json 加 packageManager 字段

```diff
+ "packageManager": "pnpm@9.15.3",
```

### Proposal C: 新建 .npmrc

```
package-manager-strict=false
```

Vercel 构建环境兼容性需要。

### Proposal D: 删除 package-lock.json

npm 遗留锁文件，已废弃。

### Proposal E: 更新 docs/project-context.md

Technology Stack 追加行：
```
| **Package Manager** | pnpm | 9.15.3 | `packageManager` 字段 + `.npmrc` 强制约束 |
```

Agent Rules 追加：
```
11. **DO** use `pnpm` for all package management — never `npm` or `yarn`.
```

### Proposal F: 更新 AGENTS.md

追加 pnpm 包管理规则 section。

### Proposal G: 新建 pnpm 最佳实践标准文件

路径：`_bmad-output/standards/pnpm-best-practices.md`

### Proposal H: 修正 Phase 1 story 文档

统一替换：
- "使用 npm（非 pnpm/yarn）" → "使用 pnpm（已正式采纳为项目包管理器）"
- `npm run` → `pnpm`
- `npm install` → `pnpm add`

涉及文件：1-1, 1-2, 1-3, 8-1~8-4, 9-1~9-5, 2-1~2-2 的 story 文档。

---

## Section 5: Implementation Handoff

| Scope | 类型 | 执行者 |
|-------|------|--------|
| **Minor** | 代码/文档修改 | Developer agent（当前 Agent） |

**执行顺序：**
1. 创建 Story 13-9（sprint-status.yaml）
2. 执行 Proposal B~D（package.json / .npmrc / 删除 lock 文件）
3. 执行 Proposal E~G（文档/标准文件）
4. 执行 Proposal H（修复旧文档）
5. 提交 commit
