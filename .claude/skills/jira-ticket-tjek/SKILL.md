---
name: jira-ticket-tjek
description: Opret, opdel eller tjek Jira-tickets til kodeopgaver i BA: find eksisterende ticket først, del store opgaver i vertikale stykker med blokeringer, og sørg for beskrivelse, acceptkriterier, ansvarlig, epic, startdato og deadline. Use when code work needs a ticket, a feature or plan must be split into tickets, or tickets in BA need checking.
---

# Jira-ticket-tjek (BA)

> Samme skill ligger i Claude-projektet "Bachelor project". Ændres den ét sted, så ret den andet sted.

Jira: esterworkwork.atlassian.net, projektnøgle **BA**.

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

## Del en større opgave op
Bruges, når en opgave er større end 1–2 dages arbejde, eller når en plan, et design eller en grill-session skal blive til tickets. Inspireret af Matt Pococks /to-tickets (MIT).
1. Del arbejdet i **vertikale stykker** (tracer bullets). Hvert stykke går hele vejen gennem de lag, det har brug for (database, API, UI, test), og kan vises eller testes alene. Eksempel: "Upload ét billede og se om det opfylder Googles minimumsstørrelse" i stedet for "Lav hele databasen".
2. Oprydning, der gør resten lettere, kommer først som sit eget stykke.
3. Giv hvert stykke dets **blokeringer**: de tickets, der skal være færdige først. Uden blokeringer kan stykket startes med det samme.
4. Vis opdelingen som en nummereret liste: titel, blokeret af og hvad stykket leverer set fra brugeren. Spørg: Er stykkerne for store eller for små? Er blokeringerne rigtige? Skal noget slås sammen eller deles?
5. Ret til, indtil gruppen siger ja. Opret så tickets i rækkefølge med blokeringerne først, så de kan linkes. Alle stykker kommer under den samme forælder eller epic.

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
- **Scope:** højst 1–2 dages arbejde. Ellers del den op (se "Del en større opgave op").
- **Forælder:** hører den under en overordnet ticket, så er den linket.
- **Epic:** altid linket til den rigtige epic. Kode hører normalt under BA-8 "Develop 2: Udvikling". Find epics med `project = BA AND issuetype = Epic`.
- **Startdato og deadline:** altid sat (felterne Start date og Due date). Datoerne tages fra "Ugeplan" eller "Plan" i Drive. Står de der ikke, så skriv 🟡 **[Claude] Afklar:** og spørg. Find aldrig selv på datoer.
- **Blokeret?** Venter ticketen på en anden ticket, så link dem med Jiras "is blocked by", hvis værktøjet kan, og skriv det også i "Blokeret af". Mangler der noget uden for Jira (design, data, svar fra Instant), så står det i ticketen.

## Skabelon
```
**Hvad:** …
**Hvorfor:** …
**Links:** Figma / krav-ID / mødeopsummering
**Epic:** BA-…
**Start:** dd/mm · **Deadline:** dd/mm

**Acceptkriterier**
- [ ] …
- [ ] …

**Blokeret af:** BA-… / design, data eller svar fra Instant (hvis relevant)
```

## Regler
- Skriv på samme sprog som ticketen eller den overordnede ticket.
- Find ikke på krav. Ved du ikke noget, så skriv 🟡 **[Claude] Afklar:** og spørgsmålet.
- Acceptkriterier skal kunne testes. "Ser godt ud" er ikke et kriterie. "Fejlbesked vises, hvis filen er over 8 MB" er.
