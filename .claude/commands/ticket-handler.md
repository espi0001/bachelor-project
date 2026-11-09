---
description: Byg en BA-ticket fra start til slut: hent, plan, godkendelse, kode, tjek
argument-hint: <BA-123>
---

# Ticket handler (BA)

Byg Jira-ticketen `$ARGUMENTS` i dette repo. Input er en nøgle (`BA-123`), et tal (`123` = `BA-123`) eller et Jira-link. Er der intet input, så spørg og vent.

**Plan først.** Skriv ingen kode, før brugeren har godkendt planen.

## Principper
- **Enkelt nok.** Den simpleste løsning, der opfylder alle acceptkriterier. Ingen abstraktioner "til senere".
- **DRY.** Sig til, hvis den samme logik står to steder.
- **Tydelig frem for smart.** Skal man læse koden to gange, er den for smart.
- **Hold dig til ticketen.** Alt andet er en ny ticket. Sig det.
- **Next.js 16.** API'erne er anderledes end i det meste træningsdata. Læs guiden i `node_modules/next/dist/docs/`, før du bruger en API, du er i tvivl om (se `AGENTS.md`).

## Trin

### 1. Hent ticketen
- Hent den med Atlassian MCP (esterworkwork.atlassian.net, projekt **BA**). Er MCP ikke forbundet, så bed brugeren indsætte ticketen. Gæt ikke.
- Læs titel, beskrivelse, acceptkriterier, kommentarer og links (fx Figma). Nyeste kommentar vinder, hvis noget modsiger beskrivelsen. Sig det.
- **Mangler beskrivelse eller acceptkriterier: stop.** Brug skillen `jira-ticket-tjek` først.
- Er det en epic, så list under-tickets og spørg, hvilken der skal laves.

### 2. Lav en branch
```bash
git fetch origin main
git checkout -b <prefix>/BA-<nr>-<kort-beskrivelse> origin/main
```
| Type | Prefix | Eksempel |
|---|---|---|
| Ny funktion | `feat/` | `feat/BA-139-clerk-login-flow` |
| Fejl | `fix/` | `fix/BA-140-upload-fejlbesked` |
| Opsætning, opdateringer | `chore/` | `chore/BA-110-eslint-config` |

Beskrivelsen er højst 6 ord i kebab-case.

### 3. Plan
Læs de relevante filer først. Vis så:
- **Hvad der skal laves**, med filstier.
- **Valg undervejs:** 2–3 muligheder (A, B, C), hvor A er din anbefaling. Kort om fordele og ulemper.
- **Hvordan hvert acceptkriterie tjekkes** i browseren.
- **Hvad der kan gå i stykker.**

**Stop og vent på godkendelse.**

### 4. Kode
- Tjek først, at du ikke står på `main` (`git branch --show-current`).
- Følg den godkendte plan. Afviger du, så stop og sig det.
- Fjerner eller omdøber du en prop, en route eller et API-felt, så spørg først.
- Hemmeligheder hører til i `.env.local`, aldrig i koden.

### 5. Tjek
1. `npm run dev` og tjek **hvert acceptkriterie** i browseren: mobil og desktop, kun tastatur, og ingen fejl i konsollen.
2. Gennemgå koden som en kritisk reviewer:
   - Opfylder koden kriterierne, eller ser det bare sådan ud?
   - Server/Client: er `"use client"` kun brugt, hvor det er nødvendigt?
   - Tomme eller manglende data håndteret?
   - Tilgængelighed: semantisk HTML, labels, alt-tekst, synligt fokus.
3. Kør:
   ```bash
   npm run lint
   npx tsc --noEmit
   npm run build
   ```
   Fejl i filer, du har ændret, skal rettes. Fejl andre steder skal bare nævnes.

### 6. Opsummering
- Hvad er ændret, og hvorfor.
- Tabel: acceptkriterie → hvordan det er tjekket → OK / ikke OK.
- Åbne punkter og forslag til nye tickets.
- Forslag til PR-titel: `BA-<nr>: <titel>`.
