---
name: ticket-handler
description: Byg en BA-ticket fra start til slut: hent, plan, godkendelse, kode, tjek. Use when the user asks to build or work on a BA ticket.
argument-hint: <BA-123>
disable-model-invocation: true
---

# Ticket handler (BA)

Byg Jira-ticketen `$ARGUMENTS` i dette repo. Står der ikke en nøgle her (fx i Cursor), så brug den ticket, brugeren nævner i beskeden. Input er en nøgle (`BA-123`), et tal (`123` = `BA-123`) eller et Jira-link. Er der intet input, så spørg og vent.

**Plan først.** Skriv ingen kode, før brugeren har godkendt planen.

## Principper
- **Enkelt nok.** Den simpleste løsning, der opfylder alle acceptkriterier. Ingen abstraktioner "til senere".
- **DRY.** Sig til, hvis den samme logik står to steder.
- **Tydelig frem for smart.** Skal man læse koden to gange, er den for smart.
- **Hold dig til ticketen.** Alt andet er en ny ticket. Sig det.
- **Følg `project-conventions`.** Læs skillen, før du skriver kode. Kode og kommentarer er på engelsk, selv om ticketen og planen er på dansk.
- **Brug ordene fra `GLOSSARY.md`** i navne, UI-tekst og planen. Mangler et begreb, så foreslå det i planen.
- **Next.js 16.** API'erne er anderledes end i det meste træningsdata. Læs guiden i `node_modules/next/dist/docs/`, før du bruger en API, du er i tvivl om (se `AGENTS.md`).

## Trin

### 1. Hent ticketen
- Hent den med Atlassian MCP (esterworkwork.atlassian.net, projekt **BA**). Er MCP ikke forbundet, så bed brugeren indsætte ticketen. Gæt ikke.
- Læs titel, beskrivelse, acceptkriterier, kommentarer og links (fx Figma). Nyeste kommentar vinder, hvis noget modsiger beskrivelsen. Sig det.
- **Mangler beskrivelse eller acceptkriterier: stop.** Brug skillen `jira-ticket-tjek` først.
- **Er ticketen større end 1–2 dages arbejde: stop.** Foreslå at dele den op i vertikale stykker med `jira-ticket-tjek`.
- Er det en epic, så list under-tickets og spørg, hvilken der skal laves.

### 2. Foreslå et branch-navn
Brugeren laver selv branchen og står selv for commit, push og PR. Gør aldrig noget af det selv: foreslå kun navnet.

Format: `<prefix>/BA-<nr>-<kort-beskrivelse>`

| Type | Prefix | Eksempel |
|---|---|---|
| Ny funktion | `feature/` | `feature/BA-139-clerk-login-flow` |
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

Når brugeren har valgt en mulighed, så tilbyd at logge valget i "Overvejelser og valg" med skillen `overvejelse-til-rapport` (muligheder, valg og begrundelse). Gælder kun reelle valg (teknologi, arkitektur, metode), ikke småting som et variabelnavn.

### 4. Kode
- Tjek først, at brugeren står på den nye branch og ikke på `main` (`git branch --show-current`). Står de på `main`, så stop og bed dem lave branchen.
- Følg den godkendte plan. Afviger du, så stop og sig det.
- Fjerner eller omdøber du en prop, en route eller et API-felt, så spørg først.
- Hemmeligheder hører til i `.env.local`, aldrig i koden.

### 5. Tjek
1. `npm run dev` og tjek **hvert acceptkriterie** i browseren: mobil og desktop, kun tastatur, og ingen fejl i konsollen.
2. Kør skillen `kode-review` mod `main` (Standarder og Spec). Ret fund i filer, du har ændret. Andre fund nævnes i opsummeringen.
   Tjek også selv det, reviewet ikke ser i diffen:
   - Tomme eller manglende data håndteret?
   - Tilgængelighed i browseren: labels, alt-tekst, synligt fokus.
3. Kør:
   ```bash
   npm run lint
   npx tsc --noEmit
   npm run build
   ```
   Fejl i filer, du har ændret, skal rettes. Fejl andre steder skal bare nævnes.

### 6. Gem verifikationen
Skriv `.agent-notes/BA-<nr>.md` (mappen er gitignored, så spørg ikke om commit). Det er testdokumentation, gruppen kan bruge i rapporten eller som bilag, så skriv det, så det giver mening uden chatten:

```markdown
# Verifikation: BA-<nr> — <titel>
Dato: <yyyy-mm-dd> · Branch: <branch>

## Acceptkriterier
| # | Acceptkriterie | Hvordan tjekket | Resultat |
|---|---|---|---|
| 1 | … | Browser, mobil + desktop / kun tastatur / kode | OK / Ikke OK |

## Andre scenarier
| Scenarie | Forventet | Resultat |
|---|---|---|
| Ingen organisation valgt | Besked "Select an organization first." | OK |
| Tomme data / API-fejl | … | … |

## Kvalitetstjek
- `npm run lint`: OK / fejl (hvilke)
- `npx tsc --noEmit`: OK / fejl
- `npm run build`: OK / fejl

## Åbne punkter
- …
```

Skriv kun "OK" for det, du faktisk har tjekket. Kunne du ikke tjekke noget (fx i browseren), så skriv "Ikke tjekket" og hvorfor.

### 7. Opsummering
- Hvad er ændret, og hvorfor.
- Tabel: acceptkriterie → hvordan det er tjekket → OK / ikke OK. Henvis til `.agent-notes/BA-<nr>.md`.
- Åbne punkter og forslag til nye tickets.
- Resultatet af `kode-review` (antal fund pr. akse, og hvad der er rettet).
- Forslag til PR-titel: `BA-<nr>: <titel>`, og at `/pr-desc` kan skrive beskrivelsen.
