This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## AI agent setup (Claude Code and Cursor)

The group uses both Claude Code and Cursor. Both tools read the same files, so keep exactly one copy of each rule and skill.

| What | Where | Read by |
|---|---|---|
| Project rules | `AGENTS.md` | Cursor directly. Claude Code through `CLAUDE.md`, which only contains `@AGENTS.md` |
| Skills | `.claude/skills/<name>/SKILL.md` | Claude Code, and Cursor 2.4+ |

Current skills:

- `ticket-handler`: builds a BA ticket from start to finish. Run `/ticket-handler BA-123`.
- `jira-ticket-tjek`: creates or checks Jira tickets in BA.

### Add a rule

Write it in `AGENTS.md`, below the `<!-- END:nextjs-agent-rules -->` line. `next dev` rewrites the block between the `BEGIN` and `END` markers, so anything inside it is lost.

### Add a skill

1. Create `.claude/skills/<name>/SKILL.md`.
2. Start the file with frontmatter that has `name` (same as the folder name) and `description` (what the skill does and when to use it).
3. Add `disable-model-invocation: true` if the skill should only run when someone calls it with `/<name>`.

Do not copy rules or skills into `.cursor/` or `.agents/`. Copies drift apart.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
