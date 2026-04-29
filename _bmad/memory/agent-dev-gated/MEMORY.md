# Memory

_Curated long-term knowledge. Empty at birth — grows through sessions._

_Keep under 200 lines. Raw session notes go in `sessions/YYYY-MM-DD.md`._

## Fix History Registry

| Error Type | Rule ID | Context Source | Fix Approach | Date |
|------------|---------|----------------|--------------|------|
| ESLint config | `react/no-deprecated-props` | standards/ | 规则不存在，移除，forwardRef 检测改用 code review | 2026-04-29 |
| tsconfig | `exactOptionalPropertyTypes` | standards/typescript-5 | framer-motion 类型不兼容，回滚 | 2026-04-29 |

## Missing Standards Registry

| Tech | First Detected | Status | Action |
|------|----------------|--------|--------|
| _待填充_ | | pending | TR recommended |

## External Reference Registry

| Tech/Topic | Source URL | Key Guidance | Last Updated |
|------------|------------|--------------|--------------|
| _待填充_ | | | |

## Project Paths

- `project-context.md`: `D:\WorkPlace\VibeCoding\Xiaozhi Journal/docs/project-context.md`
- `CLAUDE.md`: `D:\WorkPlace\VibeCoding\Xiaozhi Journal/CLAUDE.md`
- `Story files`: `D:\WorkPlace\VibeCoding\Xiaozhi Journal/_bmad-output/implementation-artifacts/`

## Lint Configuration

- Command: `pnpm lint`
- Config: `eslint.config.mjs`
- Presets: `next/core-web-vitals`, `next/typescript`
- Custom rules:
  - `@typescript-eslint/no-explicit-any: error`
  - `@typescript-eslint/ban-ts-comment: error` (ts-ignore banned, ts-expect-error allowed with description)
  - `no-restricted-imports: error` (bans `framer-motion`, `@base-ui/react` root imports)
  - `react/button-has-type: error` (button must have type attribute)
- tsconfig: `verbatimModuleSyntax: true`, `noUncheckedIndexedAccess: true`

## Standards Coverage Summary

| Category | Configured | Source |
|----------|------------|--------|
| tsconfig | 2 rules | typescript-5 |
| eslint | 5 rules | typescript-5, motion-v12, base-ui-react |
| Code Review | ~30+ rules | all standards files |

Reference: `_bmad-output/planning-artifacts/standards-rule-mapping.md`