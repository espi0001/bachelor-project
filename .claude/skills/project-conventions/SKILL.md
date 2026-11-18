---
name: project-conventions
description: Kodekonventioner for dette repo (sprog i appen og koden, fil-header-kommentarer). Use when writing, creating or editing code files in src/ or supabase/migrations/ in this repo.
---

# Projektkonventioner

Gælder for både Claude Code og Cursor. Cursor håndhæver de samme regler automatisk via `.cursor/rules/project-conventions.mdc`. Ændrer du en regel her, så ret den også dér.

## Sprog: engelsk

All app text and code are in English: UI text, error messages, page titles, placeholders, code comments, names in code, and comments in SQL migrations.

- Gælder `src/`, `supabase/migrations/` og kommentarer i `.env`-filer.
- Rapporten, "Overvejelser og valg", Jira-tickets og mødenoter skrives stadig på dansk.
- Apostroffer i JSX skrives som `&apos;` (ESLint-reglen `react/no-unescaped-entities`).

## Fil-header-kommentar

Every new or touched file in `src/` starts with a 1–2 line `/** */` comment saying what the file does (after `'use client'` / `'use server'`).

- Brug altid `/** */` (ikke `//`), så alle headers ser ens ud og er nemme at søge efter.
- Kommentaren står øverst i filen. Har filen et `'use client'`- eller `'use server'`-direktiv, står direktivet først og kommentaren lige under.
- Beskriv **hvad** filen gør, ikke hvordan. Højst 2 linjer.
- "Touched" betyder: redigerer du en eksisterende fil uden header, så tilføj den. Passer en eksisterende header ikke længere, så ret den.
- Gælder ikke genererede filer (fx `next-env.d.ts`) eller config-filer i roden (`next.config.ts`, `eslint.config.mjs`).

Eksempel:

```ts
'use server';
/** Server actions for connecting a Shopify store and saving its credentials. */

import { auth } from '@clerk/nextjs/server';
```
