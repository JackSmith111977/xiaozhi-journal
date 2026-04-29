# Sprint Change Proposal — 2026-04-29

## 1. Issue Summary

**Problem Statement:** 项目 `_bmad-output/standards/` 目录下的技术规范文档无法自动执行，导致 agent 开发时可能偏离规范。

**Discovery Context:** 用户在构建 `agent-dev-gated` 时发现需要将 standards/ 配置到 eslint/tsconfig，实现门禁验证。

**Evidence:** 当前 `eslint.config.mjs` 仅使用 `eslint-config-next`，未覆盖 standards/ 中的自定义规则（如禁止 `any`、禁止 `@ts-ignore`）。

---

## 2. Impact Analysis

### Epic Impact
- **直接影响:** 无（配置变更不阻塞当前 epic）
- **间接影响:** 所有后续 `bmad-dev-story` 执行将受新增 lint 规则约束

### Story Impact
- **已完成 stories:** 无需修改
- **进行中 stories:** 如有 `any` 或 `@ts-ignore` 使用，需修复
- **未来 stories:** 必须遵守新 lint 规则

### Artifact Conflicts
- `tsconfig.json` — 新增 `verbatimModuleSyntax`
- `eslint.config.mjs` — 新增 `@typescript-eslint/no-explicit-any`、`@typescript-eslint/ban-ts-comment`

### Technical Impact
- **编译时:** TypeScript 更严格，`verbatimModuleSyntax` 强制类型导入语法
- **Lint 时:** 禁止 `any` 和 `@ts-ignore`，agent 必须使用类型安全方案

---

## 3. Recommended Approach

**Selected:** Direct Adjustment — 配置变更，无需回滚或 MVP 重定义

**Rationale:**
- 配置变更对已有代码影响小（lint 已 clean）
- 提升代码质量门槛，不降低功能交付
- 与 `agent-dev-gated` 门禁理念一致

**Effort:** Low（配置修改已完成）
**Risk:** Low（仅增量规则，不破坏现有功能）
**Timeline:** 无额外工期

---

## 4. Detailed Change Proposals

### Change 1: tsconfig.json — 新增 `verbatimModuleSyntax`

**OLD:**
```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true
  }
}
```

**NEW:**
```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true
  }
}
```

**Rationale:** TypeScript 5 规范要求，禁止非类型值的类型导入，确保 `isolatedModules` 兼容。

---

### Change 2: eslint.config.mjs — 新增 lint 规则

**OLD:**
```js
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([...]),
]);
```

**NEW:**
```js
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([...]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-ignore": true, "ts-expect-error": "allow-with-description" },
      ],
    },
  },
]);
```

**Rationale:** 
- `no-explicit-any`: TypeScript 5 规范禁止 `any`，强制类型安全
- `ban-ts-comment`: 禁止 `@ts-ignore`，仅允许带说明的 `@ts-expect-error`

---

### Change 3: 回滚 `exactOptionalPropertyTypes`

**Reason:** 与 `framer-motion` 类型定义不兼容，导致 13 个编译错误。第三方库类型未考虑此严格选项。

**Decision:** 暂不开启，待 framer-motion 更新或项目迁移后重新评估。

---

## 5. Implementation Handoff

**Scope Classification:** Minor — 配置变更已完成，无需额外协调

**Handoff:** Developer agent (GateKeeper) — 直接实施

**Responsibilities:**
- 每次 Edit/Write 后执行 Gate Check
- lint error > 0 → Fix Loop
- 修复方案必须引用来源（standards/ 文件名）

**Success Criteria:**
- `pnpm lint` → 0 errors
- `pnpm exec tsc --noEmit` → 0 errors
- 新代码无 `any`、无 `@ts-ignore`

---

## 6. 无法自动检测的规范

以下 standards/ 规范无法通过 eslint/tsconfig 检测，需通过 Code Review Checklist 约束：

| 规范来源 | 规则 | 检测方式 |
|---------|------|---------|
| React 19 | 禁止 `forwardRef` | Code review |
| Zustand v5 | 禁止跨 store import | Code review |
| Zustand v5 | 禁止 module-level 可变状态 | Code review |
| Next.js 16 | Server/Client 边界正确 | Code review |
| TypeScript 5 | 禁止循环类型引用 | Code review |

**Recommendation:** 未来可考虑：
- 自定义 eslint plugin 检测 `forwardRef`
- 项目级 lint 规则检测跨 store import

---

## 7. Verification Results

**Gate Check Passed:**
- lint: 0 errors
- TypeScript: 0 errors
- 配置文件已更新

**Files Modified:**
- `xiaozhi-journal/tsconfig.json`
- `xiaozhi-journal/eslint.config.mjs`

---

## 8. Next Steps

1. **GateKeeper 正式启用** — 下一次 `/agent-dev-gated` 调用时生效
2. **Code Review Checklist 更新** — 添加无法自动检测的规范项
3. **未来评估** — 待 framer-motion 类型更新后，重新尝试 `exactOptionalPropertyTypes`

---

**Proposal Status:** ✅ Approved
**Implementation:** Complete