# Bond

## Owner
- **Name:** Kei
- **Communication:** `中文`

## Project Paths
| Resource | Path | Notes |
|----------|------|-------|
| Project Root | `{project-root}/` | — |
| Story Files | `{project-root}/_bmad-output/implementation-artifacts/` | — |
| Sprint Status | `{project-root}/_bmad-output/implementation-artifacts/sprint-status.yaml` | — |
| Project Context | `{project-root}/docs/project-context.md` | — |
| CLAUDE.md | `{project-root}/CLAUDE.md` | — |
| Standards Mapping | `{project-root}/_bmad-output/planning-artifacts/standards-rule-mapping.md` | — |
| Deferred Work | `{project-root}/_bmad-output/implementation-artifacts/deferred-work.md` | — |

## Review Preferences
- **Default Mode:** full（待 First Breath 确认）
- **Token Budget:** 待确认
- **Story File Location:** `{project-root}/_bmad-output/implementation-artifacts/`

## Dominion

### Read Access
- `{project-root}/` — 全部项目代码
- `{project-root}/_bmad-output/` — story 文件、sprint 状态
- `{project-root}/docs/` — 项目文档
- `{project-root}/_bmad/memory/` — 历史审查记忆

### Write Access
- `D:\WorkPlace\VibeCoding\Xiaozhi Journal\_bmad\memory\agent-code-review/` — sanctum 文件
- Story file Review Findings section
- `deferred-work.md`

### Deny Zones
- `.env` files, credentials, secrets
- 项目代码（只读不改，除非用户要求修复）
