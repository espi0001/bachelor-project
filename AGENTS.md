<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent guidance for this repo

Detailed rules live in skills under `.claude/skills/`. Read the relevant one **before** writing code.
They are the source of truth, not this file.

| Skill                  | Read it when                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| `project-conventions`  | Any code change. Language, file headers, layout, naming, TypeScript, Clerk, database, styling, a11y. |
| `ticket-handler`       | Building a BA ticket end to end (`/ticket-handler BA-123`).                                      |
| `jira-ticket-tjek`     | Code work needs a ticket, or BA tickets need checking.                                           |
| `pr-desc`              | Writing the pull request description for the current branch (`/pr-desc`).                        |
| `overvejelse-til-rapport` | A real choice is made or compared (technology, architecture, method). Logs it for the report. |

Cursor gets a short version of `project-conventions` via `.cursor/rules/project-conventions.mdc`.

## Non-obvious constraints

These are the rules that are expensive to get wrong. The full reasons are in `project-conventions`.

- **Customer data is separated only by `auth_org_id`.** Every query on customer data has
  `WHERE auth_org_id = ${orgId}`, and `orgId` comes only from `await auth()` on the server, never
  from the browser, a URL or a form. Forgetting it lets one customer see another customer's data.
- **`cacheComponents` is on.** Per-request data (Clerk, database, Shopify) and hooks like
  `usePathname` must render inside `<Suspense>`. `npm run dev` does not catch a missing boundary;
  `npm run build` does, so run it before saying you are done.
- **Supabase is only Postgres and migrations.** No `supabase-js`, Supabase Auth, Storage or
  Realtime. All SQL goes through `sql` from `@/lib/db` as a tagged template. Schema changes are a
  new file in `supabase/migrations/`; never edit an applied one, and never run
  `supabase db push` (it is the real database).
- **The middleware file is `src/proxy.ts`** (Next 16 renamed `middleware.ts`). Every page is
  protected there; a new public route or webhook goes in `isPublicRoute` with a comment saying why.
- **Secrets stay on the server.** Never prefix a secret with `NEXT_PUBLIC_`. Stored Shopify
  secrets are encrypted with `encrypt()` from `@/lib/crypto`.
- **The user owns git.** Do not create branches, commit, push or open PRs. Suggest a branch name
  or PR text instead.
- **No test runner.** Do not scaffold tests unless asked.

## `.agent-notes/` (local, ignored)

Gitignored scratch for what an agent produces while working: verification tables from
`ticket-handler`, plans, notes. Write there freely and do not ask whether to commit it. Nothing
committed may reference it, because a teammate's checkout will not have it. Anything worth keeping
moves to the report, `README.md` or a skill.
