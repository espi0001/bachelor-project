---
name: project-conventions
description: Code conventions for this repo - language, file headers, folder layout and naming, TypeScript, Next.js 16, Clerk organizations and data access, Supabase migrations, server actions, secrets, Tailwind and accessibility. Use when writing, creating, reviewing or editing code files in src/ or supabase/migrations/ in this repo.
---

# Project conventions

Applies to both Claude Code and Cursor. Cursor gets a short version via `.cursor/rules/project-conventions.mdc`. If you change a rule here, change it there too.

Stack: Next.js 16 (App Router, `cacheComponents`) · React 19 · TypeScript strict · Tailwind v4 · Clerk (login + organizations) · Supabase (Postgres + migrations only) via `postgres` · Shopify Admin API · Photoroom API · Vercel · GitHub.

> `AGENTS.md` wins: Next.js 16 has breaking changes. Read the guide in `node_modules/next/dist/docs/` before you use an API you are unsure about.

The rules describe what the code **does today**. If a rule is not followed somewhere, fix it when you touch that file anyway. Do not do a big cleanup without a ticket.

## Language: English

All app text and code are in English: UI text, error messages, page titles, placeholders, code comments, names in code, and comments in SQL migrations.

- Applies to `src/`, `supabase/migrations/` and comments in `.env` files.
- The report, "Overvejelser og valg", Jira tickets and meeting notes stay in Danish.
- Write apostrophes in JSX as `&apos;` (ESLint rule `react/no-unescaped-entities`).

## File header comment

Every new or touched file in `src/` starts with a 1–2 line `/** */` comment saying what the file does (after `'use client'` / `'use server'`).

- Always use `/** */` (not `//`), so all headers look the same and are easy to search for.
- The comment goes at the top of the file. If the file has a `'use client'` or `'use server'` directive, the directive comes first and the comment right below it.
- Describe **what** the file does, not how. 2 lines max.
- "Touched" means: if you edit an existing file without a header, add one. If an existing header no longer fits, fix it.
- Does not apply to generated files (e.g. `next-env.d.ts`) or config files in the root (`next.config.ts`, `eslint.config.mjs`).

Example:

```ts
'use server';
/** Server actions for connecting a Shopify store and saving its credentials. */

import { auth } from '@clerk/nextjs/server';
```

## Comments in code

Comments explain **why**, not what. The code already shows what.

- Write a comment when a reader would otherwise ask "why?": a security choice, a Shopify or Clerk quirk, a requirement from the design. See e.g. `prepare: false` in `src/lib/db.ts`.
- Exported functions in `src/lib/` get a `/** */` comment when the name does not say everything (e.g. what they throw).

## Folder layout

```
src/
├── app/                  # App Router. One folder per page
│   ├── <route>/          # page.tsx + files only that page uses (actions.ts, *-form.tsx …)
│   └── api/              # route.ts handlers (e.g. webhooks/clerk)
├── components/           # components used by more than one page
├── lib/                  # server logic and shared types
│   ├── db.ts             # the one Postgres connection
│   ├── crypto.ts         # encrypts secrets before they are stored
│   ├── shopify/          # Shopify Admin API (client, oauth, products …)
│   └── photoroom/        # Photoroom API
└── proxy.ts              # Next 16 proxy (was middleware.ts): Clerk + public routes
supabase/
└── migrations/           # SQL migrations (Supabase CLI)
```

- Import with `@/*` (points to `src/*`). Use `./` only for files in the same folder.
- No barrel files (`index.ts`). Import the module directly.
- Put a file as close to where it is used as possible. If only one page uses it, it lives in that page's folder. Move it to `components/` or `lib/` only when a second page needs it.
- A new external service gets its own folder in `src/lib/` (like `shopify/` and `photoroom/`).

## Spotting components

When you write, review or suggest code, look for UI that should be a component. If you find some, say so.

Recommend a component when:

- The same markup and classes appear **2 or more times**, in one file or across files. Example: the primary button class string (`rounded-md bg-zinc-900 px-4 py-2 …`) is repeated in `generate-images-dialog.tsx`, and the secondary button style appears in both that file and `product-row.tsx`.
- A block has its own state or logic and makes the surrounding component hard to read (e.g. a long JSX section with its own `useState`).
- A UI element has a clear name in the design (button, badge, status message, empty state).

Do not recommend a component for:

- Markup used once that has no logic of its own. Splitting it only adds a file to jump to.
- Two pieces that look alike but change for different reasons. Forcing them into one component with many props is worse than the duplication.

How to act on it:

- **In code you are writing for the current task:** make the component, and say that you did.
- **In existing code outside the task, or in a code review:** do not change it. Name the files and lines, suggest a component name and where it goes (see "Folder layout"), and suggest a separate ticket.
- Keep the component as simple as the current uses need. Add props only for differences that exist today.

## Naming

- Files: kebab-case everywhere (`product-row.tsx`, `request-origin.ts`, `oauth-cookie.ts`).
- Components: PascalCase and named export (`export function ProductRow`). Only files that Next requires a default export from (`page.tsx`, `layout.tsx`, `not-found.tsx`, `proxy.ts`) have a default export.
- Module-level constants: `UPPER_SNAKE_CASE` (`SIGN_IN_URL`, `IMAGE_TYPES`).
- Functions and variables: camelCase. Booleans read as a yes/no question (`isPublicRoute`, `hasImages`).
- Database: tables in singular and snake_case (`store`). Columns in snake_case. Encrypted columns end in `_encrypted`.

## TypeScript

- `strict` is on. Never use `any`. Use `unknown` and check the type (see `isImageType` in `src/lib/image-types.ts`).
- Use `type`, not `interface`.
- No `enum`. Use an `as const` array and derive the type from it (`IMAGE_TYPES` → `ImageType`).
- Data from the browser, Shopify and webhooks cannot be trusted. Check it before you use it.
- Put the type of an SQL result on the call: `sql<{ shopify_domain: string }[]>`.

## Next.js 16 and React

- Server Components are the default. Use `'use client'` only for hooks, event handlers and browser APIs, and as far down the tree as possible.
- `cacheComponents` is on. Data fetched per request (Clerk, database, Shopify) and hooks like `usePathname` must render inside `<Suspense>`. Otherwise the build fails. See `src/app/products/page.tsx` and `src/app/layout.tsx`.
- Fetch data in Server Components or server actions. Never in `useEffect`.
- Keep `useState` and `useEffect` to a minimum. Derive values instead of storing them.
- Never use `<img>`. Use `next/image`. Add new external image hosts to `images.remotePatterns` in `next.config.ts`. Data URLs need `unoptimized`.

## Login and organizations (Clerk)

Clerk handles login. A Clerk organization is a customer. All data belongs to one organization.

- All pages are protected in `src/proxy.ts`. A new public page or webhook must be added to `isPublicRoute` with a comment saying why.
- Always get `orgId` on the server with `await auth()`. Never take it from the browser, a URL or a form.
- Every query on a table with customer data must have `WHERE auth_org_id = ${orgId}`. It is the only separation between customers, so if you forget it, one customer can see another customer's data.
- If `orgId` is missing, show a message ("Select an organization first."). Do not throw an error.

## Database (Supabase)

Supabase is used **only** as a Postgres database and for migrations. We do not use `supabase-js`, Supabase Auth, Storage or Realtime.

- All SQL goes through `sql` from `@/lib/db`. Do not create a new connection.
- Insert values with the tagged template (`${value}`), so `postgres` escapes them. Never build SQL by joining strings.
- `@/lib/db`, `@/lib/crypto` and other files with secrets start with `import 'server-only';`.
- Database changes are made only as a new file in `supabase/migrations/`, created with `npx supabase migration new <name>`. Never edit a migration that has already run. Make a new one.
- Start a migration with a comment giving the ticket number and why (see `20261117114507_add_store_credentials.sql`). If it deletes data, say so clearly.
- New tables get `ENABLE ROW LEVEL SECURITY` and no policies. The app connects as the `postgres` user and bypasses RLS. RLS only closes Supabase's public REST API.

## Server actions and route handlers

- A server action checks input and `auth()` itself, even if the page already does. Anyone can call a server action directly.
- Return an error as data (`{ ok: false, error }` or `{ error }`) instead of throwing. The error message to the user is short and in English. Details go only to `console.error` on the server.
- Webhooks check the signature before they do anything (see `src/app/api/webhooks/clerk/route.ts`).

## Secrets and environment variables

- Secrets live in `.env.local` locally and in Vercel → Project Settings → Environment Variables. Never commit `.env*`.
- Read them only on the server. Never give a secret the `NEXT_PUBLIC_` prefix, because then it is sent to the browser.
- If a variable is missing, throw an error with its name and how to create it (see `getKey()` in `src/lib/crypto.ts`).
- The customer's Shopify secrets (Client secret, access token) are encrypted with `encrypt()` from `@/lib/crypto` before they are stored.
- If you add a new variable, tell the group. It must also be created in Vercel (Production and Preview).

## External APIs (Shopify, Photoroom)

- All calls to a service go through its client in `src/lib/<service>/`. Do not call `fetch` against Shopify or Photoroom anywhere else.
- Errors from a service that the user can fix themselves get their own error class (see `ShopifyAuthError`). The page then shows a message with a link to the fix.
- The Shopify API version is in one place: `SHOPIFY_API_VERSION` in `src/lib/shopify/client.ts`.

## Styling (Tailwind v4)

Tailwind v4 has no `tailwind.config`. The configuration is in `src/app/globals.css`.

- Use utility classes. New CSS only for things the classes cannot do.
- Mobile first: classes without a prefix are for small screens. Add `sm:`/`md:`/`lg:` upward.
- Support dark mode with `dark:` on colors, as the code does today.
- Colors: there are no design tokens yet. If a color repeats (e.g. Clerk blue `#2b47f4`), put it in `@theme` in `globals.css` as a token instead of writing the hex value in several places.

## Accessibility (WCAG AA)

- Semantic HTML first (`<button>`, `<dialog>`, `<table>` with `<caption>` and `scope`). ARIA only where HTML is not enough.
- All buttons and links have visible hover, `focus-visible` and disabled states.
- All images have `alt`. Decorative images have `alt=""` or `aria-hidden="true"`.
- If a button is disabled, explain why (see `disabledReason` in `generate-images-dialog.tsx`).
- Status that changes gets `aria-live` or `role="alert"`.
- The whole app can be used with a keyboard.

## Commands

```bash
npm run dev                          # next dev
npm run build                        # next build (Vercel runs the same)
npm run lint                         # eslint
npx supabase migration new <name>    # new empty migration
```

- Never run migrations against the linked database (`supabase db push`) without asking first. It is the real database.
- Run `npm run lint` and `npm run build` before you say you are done. `build` catches errors that `dev` does not show (e.g. a missing `<Suspense>`).
- There is no test runner. Do not write tests unless someone asks for it.
- Git: the user makes the branch, commit, push and PR themselves. Only suggest a branch name (see the `ticket-handler` skill).
