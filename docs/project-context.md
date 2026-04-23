---
project_name: 'Xiaozhi Journal'
user_name: 'Kei'
date: '2026-04-16'
sections_completed: ['technology_stack', 'critical_rules', 'patterns', 'ai_agent_rules']
existing_patterns_found: 15
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Category | Package | Version | Notes |
|----------|---------|---------|-------|
| **Framework** | next | 16.2.3 | App Router, **NOT the Next.js you know** — read `node_modules/next/dist/docs/` before writing code |
| **Runtime** | react | 19.2.4 | React 19, Server Components default |
| | react-dom | 19.2.4 | |
| **Styling** | tailwindcss | ^4 | v4 with `@theme` directive, not v3 `theme()` config |
| | @tailwindcss/postcss | ^4 | |
| | tw-animate-css | ^1.4.0 | Animation utilities |
| | class-variance-authority | ^0.7.1 | cva() for variant classes |
| **UI Components** | shadcn | ^4.2.0 | Installed via `npx shadcn@latest add` — components in `src/components/ui/` |
| | @base-ui/react | ^1.3.0 | Headless UI primitives |
| | lucide-react | ^1.8.0 | Icon library |
| **Animation** | framer-motion | ^12.38.0 | Spring animations, page transitions, wave chart growth |
| **State** | zustand | ^5.0.12 | Single store pattern in `src/store/journal.ts` |
| **Data** | idb | ^8.0.3 | IndexedDB wrapper, async promise-based API |
| **Utilities** | clsx | ^2.1.1 | Conditional class names |
| | tailwind-merge | ^3.5.0 | Merge Tailwind classes |
| | qrcode | ^1.5.4 | QR code generation (for share card) |
| **Language** | typescript | ^5 | Strict mode enabled, `@/*` alias to `./src/*` |
| | eslint | ^9 | eslint-config-next |

**Config:**
- `next.config.ts` — images.remotePatterns for QR code API
- `tsconfig.json` — strict: true, jsx: react-jsx, paths: `@/*` → `./src/*`
- `globals.css` — Tailwind v4 `@theme` + CSS custom properties for "暖日" color palette

---

## Critical Implementation Rules

### 1. Next.js 16 Specific Rules

- **This is NOT the Next.js you know** — APIs, conventions, and file structure may differ from training data
- Server Components are the default; use `"use client"` only for components with hooks/state
- Read relevant docs in `node_modules/next/dist/docs/` before writing any code
- Route Handlers: `app/api/*/route.ts` uses `NextResponse.json()`

### 2. State Management (Zustand)

- Single store: `src/store/journal.ts`
- **Immutable updates required** — use `set((state) => ({ ...state, journals: [...state.journals, new] }))`
- **Never mutate state directly** — `state.journals.push(journal)` is an anti-pattern
- Store actions that touch DB are async: `addJournal`, `updateJournal`, `updateAIResponse`
- Loading states: `loading` (global), `aiWaiting` (AI waiting), `saving` (not yet implemented)

### 3. IndexedDB Data Layer (`lib/db.ts`)

- Singleton pattern: `dbPromise` + `dbInstance` for lazy initialization
- Two stores: `journals` (keyPath: `id`) and `appMeta` (keyPath: `key`)
- IndexedDB has `timestamp` and `status` indexes
- **All DB operations are async** — use `await` consistently
- `getPendingJournals()` returns items with `status: 'pending'` for retry logic
- Error handling: `blocked`/`blocking`/`terminated` lifecycle hooks for version upgrades

### 4. AI Pipeline (`lib/ai.ts`)

- **API**: 阿里云百炼 `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
- **Model**: `qwen-turbo`
- **Timeout**: 15 seconds with `AbortController`
- **Retry**: Parse failure triggers one retry with new timeout
- **Fallback**: 10 local golden quotes when API fails
- **Response format**: Strict JSON — `{response, goldenQuote, moodLabel, fromFallback}`
- **API Key**: `process.env.DASHSCOPE_API_KEY` in `.env.local` (server-side only)
- **Never expose API key to client** — only used in Route Handler

### 5. Type Definitions (`types/index.ts`)

- `MoodLevel = 1 | 2 | 3 | 4 | 5` — literal union type
- `Journal.status`: `'pending' | 'ai_ready' | 'ai_done'`
- `MOOD_MAP`: `Record<MoodLevel, { emoji: string; label: string }>` — source of truth for mood → emoji/label mapping
- **JSON fields**: camelCase (`goldenQuote`, `moodLabel`, `aiResponse`, `shareCount`)

### 6. File Naming Conventions

- **Components**: kebab-case (`mood-selector.tsx`, `journal-input.tsx`)
- **Exports**: PascalCase (`export function MoodSelector()`)
- **Lib functions**: camelCase (`fetchJournals()`, `addJournal()`)
- **API routes**: kebab-case folders (`app/api/journal/route.ts`)
- **DB stores**: camelCase plural (`journals`, `appMeta`)

### 7. Color Palette ("暖日")

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#FDF8F5` | Page background (warm off-white) |
| `--primary` | `#E8C4A0` | Primary (soft brown) |
| `--accent` | `#D4856A` | Accent (warm coral, buttons, golden quote) |
| `--secondary` | `#F5EDE4` | Card/section backgrounds |
| `--text-primary` | `#3D3D3D` | Primary text (warm gray) |
| `--text-secondary` | `#8A817C` | Secondary text |
| `--destructive` | `#D4856A` | Error (warm coral, not red) |

- **Border radius**: sm=8px, md=12px, lg=16px, xl=24px, 2xl=24px, 3xl=32px
- **Fonts**: Noto Serif SC (titles/golden quotes), Noto Sans SC (body)

### 8. Error Handling Patterns

| Scenario | Behavior |
|----------|----------|
| AI API failure | Return 200 + `fromFallback: true`, NOT HTTP error |
| Network disconnect | Journal saves to IndexedDB, marks `pending`, no error shown |
| Component-level error | `error` state + Chinese user message |
| Console logging | `console.error` in dev, silent in prod |

### 9. Animation Patterns

| Effect | Implementation | Parameters |
|--------|---------------|------------|
| Emoji bounce | Framer Motion `spring` | scale(1.3) → bounce back |
| Input slide-in | Framer Motion `spring` | slide from bottom |
| Typewriter reveal | Aceternity Text Generate | ~50ms/char |
| Golden quote flip | Aceternity 3D Card + CSS 3D transform | 0.6s |
| Wave chart growth | Framer Motion `animate` | 0.8s entrance, new data points bounce |
| Popup appear | Framer Motion `scale 0.9 → 1.0` | 0.3s cubic-bezier |
| Respect `prefers-reduced-motion` | Disable animations | Direct display |

### 10. Time Capsule (`lib/time-capsule.ts`)

- Multi-anchor matching: year (12mo ±3d), half-year (6mo ±3d), quarter (3mo ±2d)
- Priority: year > half-year > quarter (lower number = higher priority)
- Frequency control: 24h no-repeat, same journal 30-day cooldown
- Close suppression: 3 consecutive closes → 7-day cooldown
- State stored in IndexedDB `appMeta` under key `capsuleState`

---

## Project Structure

```
xiaozhi-journal/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout + Google Fonts
│   │   ├── page.tsx                # Homepage (wave chart + mood + input + AI)
│   │   ├── globals.css             # Tailwind v4 + CSS variables
│   │   ├── api/journal/route.ts    # POST: AI proxy
│   │   └── history/                # History pages
│   │       ├── page.tsx            # History list
│   │       └── [id]/page.tsx       # Journal detail
│   ├── components/
│   │   ├── ui/                     # shadcn components (Button, Card, Textarea, Dialog, Skeleton)
│   │   ├── mood-selector.tsx       # 5 emoji mood picker
│   │   ├── journal-input.tsx       # Free text input
│   │   ├── emotion-chart.tsx       # 7-day wave chart (custom SVG + Framer Motion)
│   │   ├── emotion-tooltip.tsx     # Wave chart hover tooltip (fixed positioning)
│   │   ├── golden-quote.tsx        # Golden quote card (3D flip + share)
│   │   ├── typewriter.tsx          # Typewriter effect
│   │   ├── xiaozhi-bubble.tsx      # AI response bubble
│   │   ├── typing-indicator.tsx    # "小知正在想..." + bouncing dots
│   │   ├── empty-state.tsx         # Empty state guide
│   │   ├── capsule-popup.tsx       # Time capsule dialog
│   │   └── share-card.tsx          # Share card component
│   ├── lib/
│   │   ├── db.ts                   # IndexedDB CRUD
│   │   ├── ai.ts                   # AI call + fallback quotes
│   │   ├── seed-data.ts            # Demo data
│   │   ├── share-card-renderer.ts  # Canvas share card generation
│   │   ├── time-capsule.ts         # Time capsule matching logic
│   │   └── utils.ts                # cn() utility
│   ├── store/journal.ts            # Zustand store
│   └── types/index.ts              # Journal, AIResponse, MoodLevel, MOOD_MAP
```

---

## AI Agent Rules

1. **DO NOT** directly mutate Zustand state — always use immutable updates
2. **DO NOT** expose API keys to client-side code
3. **DO** use `fromFallback: true` for graceful degradation, never HTTP error codes for AI failures
4. **DO** save to IndexedDB first, then sync (offline-first pattern)
5. **DO** use kebab-case for file names, PascalCase for component exports
6. **DO** follow the "暖日" color palette — no random colors
7. **DO** respect `prefers-reduced-motion` for accessibility
8. **DO** use the existing `MOOD_MAP` for mood → emoji/label conversions
9. **DO** handle AI parse failures with retry + fallback pattern (15s timeout → retry → fallback)
10. **DO** check existing components before creating new ones — avoid duplication

---

## Technical Standards Reference

以下规范文档已固化，实现时**必须**遵循：

| 规范 | 文件路径 | 关键要点 |
|------|---------|---------|
| TypeScript 5 | `_bmad-output/standards/typescript-5-best-practices.md` | `noUncheckedIndexedAccess`, `satisfies`, 类型守卫 |
| Zustand v5 | `_bmad-output/standards/zustand-v5-best-practices.md` | 单 store + slice, selector, 禁止 cross-store import |
| IndexedDB | `_bmad-output/standards/idb-indexeddb-best-practices.md` | DBSchema 泛型, batch transaction, `tx.done` |
| Next.js 16 | `_bmad-output/standards/nextjs-16-best-practices.md` | App Router, SSR cookie, middleware auth |
| React 19 | `_bmad-output/standards/react-19-best-practices.md` | Server Components default, `"use client"` 仅用于 hooks |
| Tailwind v4 | `_bmad-output/standards/tailwindcss-v4-standards.md` | `@theme` directive, CSS custom properties |
| Motion v12 | `_bmad-output/standards/motion-v12-best-practices.md` | AnimatePresence, exitBeforeEnter |
| Supabase | `_bmad-output/standards/supabase-best-practices.md` | SSR client separation, RLS policies |
| shadcn | `_bmad-output/standards/shadcn-best-practices.md` | `npx shadcn@latest add`, 组件覆盖规则 |
| Base UI | `_bmad-output/standards/base-ui-react-best-practices.md` | Headless primitives, compound components |

**加载顺序**：BMad agent 激活时自动搜索 `**/project-context.md`，读取此文件后应继续读取上述 standards 文件以获取完整规范。

---

## Pending / Deferred Work

- `resize` event listener on wave chart tooltip has no throttle/debounce — acceptable for tooltip performance
- `svgRef` as `useCallback` dependency is unnecessary but stable
- SSR `window` access guard in `computePos` — currently safe (useEffect runs client-side), add `typeof window` guard for defense
- `mood` value bounds: `Math.round(avgMood)` theoretically could exceed 1-5, but data source guarantees range
