---
name: jira-ticket-tjek
description: Opret eller tjek Jira-tickets til kodeopgaver i BA: find eksisterende ticket først, og sørg for beskrivelse, acceptkriterier og ansvarlig. Use when code work needs a ticket or tickets in BA need checking.
---

# Jira-ticket-tjek (BA)

Jira: esterworkwork.atlassian.net, projektnøgle **BA**.

> Samme skill ligger i Claude-projektet "Bachelor project". Ændres den ét sted, så ret den andet sted.

## Hvad skal have en ticket
- **Al kode skal have en ticket.** Fx features, komponenter, bugs, opsætning, refaktorering.
- **Andet kører i Drive-dokumenterne**, ikke i Jira. Fx rapporttekst, mødenoter, research. Foreslå ikke tickets til det.

## Før en ny ticket oprettes
1. Søg efter eksisterende tickets om det samme med JQL, fx
   `project = BA AND text ~ "upload" ORDER BY updated DESC`.
   Prøv 2–3 søgeord. Tjek også åbne epics/overordnede tickets.
2. Vælg én af tre:
   - **Byg videre på den eksisterende ticket**, hvis opgaven er en del af det, den allerede beskriver. Foreslå evt. ekstra acceptkriterier.
   - **Lav en under-ticket (subtask)** under den overordnede ticket, hvis opgaven er en selvstændig del af noget større.
   - **Lav en ny ticket**, kun hvis intet eksisterende passer.
3. Vis kort, hvad du fandt, hvilken mulighed du foreslår og hvorfor.

## Trin
1. Hent ticket(s) med Atlassian MCP.
2. Tjek mod tjeklisten nedenfor.
3. Vis en kort tabel: ticket, hvad der mangler.
4. Skriv forslag til det manglende efter skabelonen.
5. **Stop og vent på "ja"**, før du opretter eller redigerer noget i Jira.
6. Ved "ja": opret eller tilføj teksten. Slet aldrig tekst, som gruppen har skrevet.
7. Opsummér til sidst, hvilke tickets du har oprettet eller ændret.

## Tjekliste
- **Titel:** kort, starter med et verbum (fx "Byg upload af produktbillede").
- **Beskrivelse:** hvad og hvorfor, 1–3 sætninger. Link til Figma, krav-ID eller mødeopsummering, hvis det findes.
- **Acceptkriterier:** 2–6 punkter. Hvert punkt kan testes med ja/nej.
- **Ansvarlig:** Ester, Marcus eller Sebastian.
- **Scope:** højst 1–2 dages arbejde. Ellers foreslå under-tickets.
- **Forælder:** hører den under en overordnet ticket, så er den linket.
- **Blokeret?** Hvis noget mangler (design, data, svar fra Instant), står det i ticketen.

## Skabelon
```
**Hvad:** …
**Hvorfor:** …
**Links:** Figma / krav-ID / mødeopsummering

**Acceptkriterier**
- [ ] …
- [ ] …

**Blokeret af:** (hvis relevant)
```

## Regler
- Skriv på samme sprog som ticketen eller den overordnede ticket.
- Find ikke på krav. Ved du ikke noget, så skriv 🟡 **[Claude] Afklar:** og spørgsmålet.
- Acceptkriterier skal kunne testes. "Ser godt ud" er ikke et kriterie. "Fejlbesked vises, hvis filen er over 8 MB" er.
