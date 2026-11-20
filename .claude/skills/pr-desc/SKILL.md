---
name: pr-desc
description: Skriv PR-titel og -beskrivelse for den nuværende branch ud fra diff mod main og BA-ticketen. Use when the user asks for a PR description or PR text.
argument-hint: [BA-123]
disable-model-invocation: true
---

# PR-beskrivelse (BA)

Skriv titel og beskrivelse til en pull request for den nuværende branch. Brugeren opretter selv PR'en: du må aldrig køre `git push` eller `gh pr create`. Du skriver kun teksten.

## Trin
1. Find ticket-nøglen: `$ARGUMENTS`, ellers fra branch-navnet (`git branch --show-current`, fx `feature/BA-139-…`). Findes den ingen af stederne, så spørg.
2. Se ændringerne: `git fetch origin main`, derefter `git diff origin/main...HEAD --stat` og `git log origin/main..HEAD --oneline`. Læs selve diffen for de filer, der betyder noget. Er der ucommittede ændringer, så sig det: de kommer ikke med i PR'en.
3. Hent ticketen med Atlassian MCP (esterworkwork.atlassian.net, projekt **BA**) for at få acceptkriterierne. Er MCP ikke forbundet, så skriv beskrivelsen uden og marker kriterie-afsnittet med 🟡 **Afklar**.
4. Findes `.agent-notes/BA-<nr>.md` (fra `ticket-handler`), så brug den til "How was it tested". Ellers spørg, hvad der er tjekket. Find aldrig selv på, at noget er testet.
5. Udfyld skabelonen nedenfor og vis den i en kodeblok, så den kan kopieres.

## Regler
- PR-teksten er på **engelsk** (som koden). Titel: `BA-<nr>: <short title>`.
- Skriv hvad og hvorfor, ikke en liste over hver fil.
- Kun punkter, der passer: slet tjeklistelinjer, der ikke er relevante (fx migration), i stedet for at krydse dem af.
- Kryds kun et punkt af, hvis det er tjekket i denne session eller står i verifikationsfilen.

## Skabelon

```markdown
## BA-<nr>: <short title>

Jira: https://esterworkwork.atlassian.net/browse/BA-<nr>

### What does this PR do?
<1–3 sentences: what changed and why>

### Acceptance criteria
- [x] <criterion> — <how it was checked>
- [ ] <criterion> — not checked yet: <why>

### How to test
1. `git checkout <branch>` and `npm run dev`
2. <steps to see the change>

### Notes for the reviewer
<choices made, things you are unsure of, follow-up tickets>

### Checklist
- [ ] `npm run lint` and `npm run build` pass
- [ ] Tested on mobile and desktop
- [ ] Usable with keyboard only, no errors in the console
- [ ] Every new query on customer data has `WHERE auth_org_id = ${orgId}`
- [ ] New migration in `supabase/migrations/` (not applied to the real database)
- [ ] New env variable told to the group and created in Vercel (Production and Preview)
```
