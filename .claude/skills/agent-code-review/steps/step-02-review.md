---
failed_layers: '' # set at runtime: comma-separated list of layers that failed or returned empty
---

# Step 2: Review

## RULES

- YOU MUST ALWAYS SPEAK OUTPUT in your Agent communication style with the config `{communication_language}`
- The Blind Hunter subagent receives NO project context — diff only.
- The Edge Case Hunter subagent receives diff and project read access.
- The Standards Auditor subagent receives diff, spec, and context docs.
- The Security Scanner subagent receives diff and project read access.

## INSTRUCTIONS

1. If `{review_mode}` = `"no-spec"`, note to the user: "Standards Auditor skipped — no spec file provided."

2. Load sanctum memory before launching review:
   - `{project-root}/_bmad/memory/agent-code-review/MEMORY.md` — historical norms, common errors, review preferences
   - `{project-root}/_bmad/memory/agent-code-review/BOND.md` — project paths, review preferences

3. Launch parallel subagents without conversation context. If subagents are not available, generate prompt files in `{implementation_artifacts}` — one per reviewer role below — and HALT. Ask the user to run each in a separate session (ideally a different LLM) and paste back the findings. When findings are pasted, resume from this point and proceed to step 3.

   - **Blind Hunter** — receives `{diff_output}` only. No spec, no context docs, no project access. Invoke via the `bmad-review-adversarial-general` skill.

     Prompt 注入记忆中的常见错误模式：
     ```
     以下为此项目历史上发现过的常见错误模式（供参考，不限于此）：
     {MEMORY.md 中的 Common Errors Registry}
     ```

   - **Edge Case Hunter** — receives `{diff_output}` and read access to the project. Invoke via the `bmad-review-edge-case-hunter` skill.

   - **Standards Auditor** (only if `{review_mode}` = `"full"`) — receives `{diff_output}`, the content of the file at `{spec_file}`, and any loaded context docs. Its prompt:
     > You are an Acceptance Auditor. Review this diff against the spec and context docs. Check for: violations of acceptance criteria, deviations from spec intent, missing implementation of specified behavior, contradictions between spec constraints and actual code. Output findings as a Markdown list. Each finding: one-line title, which AC/constraint it violates, and evidence from the diff.

     Additional context loaded:
     - `{project-root}/docs/project-context.md`
     - `{project-root}/CLAUDE.md`
     - `{project-root}/_bmad/memory/agent-code-review/MEMORY.md`
     - `{project-root}/_bmad-output/planning-artifacts/standards-rule-mapping.md`

   - **Security Scanner** (always) — receives `{diff_output}` and project read access. Its prompt:
     > You are a Security Scanner. Review this diff for security vulnerabilities.
     >
     > Project stack: Next.js 16 App Router (Server Components default), Supabase Auth + RLS, React 19, IndexedDB.
     >
     > Check: OWASP Top 10, hardcoded secrets, SQL/NoSQL injection, XSS, unauthenticated sensitive endpoints, missing/overly permissive RLS policies, unverified dependencies, .env commits, Supabase client misuse in server components.
     >
     > Output: Markdown list. Each finding: title + severity (Critical/High/Medium/Low) + location + evidence.

4. **Subagent failure handling**: If any subagent fails, times out, or returns empty results, append the layer name to `{failed_layers}` (comma-separated) and proceed with findings from the remaining layers.

5. Collect all findings from the completed layers.


## NEXT

Read fully and follow `./step-03-triage.md`
