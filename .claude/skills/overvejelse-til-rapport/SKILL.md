---
name: "overvejelse-til-rapport"
description: "Log et valg eller en overvejelse i bachelorprojektets 'Overvejelser og valg' med muligheder, valg og begrundelse, og peg på rapportafsnittet. Use when the group decides, considers or compares a technology, method or theory."
---

# Overvejelse → rapport

> Samme skill ligger i Claude-projektet "Bachelor project". Ændres den ét sted, så ret den andet sted. Denne kopi har ikke dokument-id'et, fordi repoet er offentligt.

Vejlederen (Peter) vil have, at vi ikke "kun" løser opgaver, men analyserer og begrunder vores tilgang. For hver teori, metode og teknologi skal vi vise: hvilke muligheder der er, hvad vi valgte, og hvorfor.

Denne skill gør en overvejelse eller beslutning til en struktureret post i "Overvejelser og valg" (Google Doc i Bachelor-mappen i Drive) og peger på, hvor den hører hjemme i "Bachelor rapport".

**Adgang til Drive:** Find dokumenterne ved at søge efter titlen med Google Drive-værktøjet. Har du ikke Google Drive/Docs-værktøjer i denne session, så spring læsning og skrivning i dokumenterne over: skriv posten og rapportteksten i chatten, så brugeren selv kan indsætte dem, og sig, at de ikke er tjekket mod eksisterende poster.

Brug den også, når brugeren beder om at "tjekke overvejelserne": gå de eksisterende punkter igennem og markér dem, der mangler alternativer eller begrundelse.

## 1. Forstå valget
- Hvad skal der vælges mellem? (fx login-løsning, database, procesmodel, målgruppe)
- Er det **besluttet**, noget vi **overvejer**, eller noget der **skal bekræftes** (fx med vejleder eller Instant)?
- Er det uklart, så stil ét kort spørgsmål.

## 2. Læs først
- "Overvejelser og valg": find den fane, emnet hører til (se listen i trin 4), og tjek om emnet allerede findes. Så byg videre på det i stedet for at lave en ny post.
- Tjek også oversigtstabellen på fanen "Forside".
- Indholdsfortegnelsen i "Bachelor rapport" (den kan have ændret sig).
- Relevante mødeopsummeringer, hvis valget kommer fra et møde (så du kan henvise med tidskoder).

## 3. Find mulighederne
- Mindst 2–3 realistiske muligheder, også dem gruppen ikke har nævnt.
- Du må søge på nettet efter alternativer og kilder (officiel dokumentation, artikler, bøger). Skriv tydeligt, hvilke muligheder og kilder du selv har fundet, så gruppen kan tjekke dem.
- Find aldrig på kilder, tal eller udsagn.

## 4. Skriv posten
Dokumentet er delt op i faner efter emne. Placér posten i den fane, der passer:

| Fane | Fx |
|---|---|
| Problem, idé og målgruppe | idé, problemformulering, målgruppe |
| Scope og MVP | afgrænsning, MVP, nice to have |
| Metode og proces | procesmodel, projektstyring, arbejdsgang, kildestil |
| Krav og risici | kravspecifikation, risikoanalyse |
| Research og data | interviews, empiri, dataindsamling |
| Teknologi og arkitektur | stak, backend, arkitektur, datakilde, flows |
| Login, roller og adgang | Clerk, roller, adgang for vejleder og censor |
| Shopify-integration | forbindelse til butikker, nøgler, webhooks |
| Database | databasevalg, datamodel, migrationer |
| Udviklingsmiljø, Git og deployment | Vercel, CI, code review, branches, AI-opsætning i repoet |
| AI og billedgenerering | billed-API'er, prompts, AI eller regler |
| Overvågning af ændrede billedkrav | Google- og Meta-krav over tid |
| AI-etik og AI i projektet | AI-mærkning, etik, brug af AI i arbejdet |
| Design og UI | font, layout, visuel stil |
| Test | teststrategi, brugertest |

Regler for placering:
- Inden for fanen står posterne efter dato. En opfølgning ("del 2", "opdatering") står lige under den post, den bygger videre på.
- Passer ingen fane, så foreslå en ny fane i stedet for at lægge posten et tilfældigt sted.
- Skriv aldrig i fanen "Arkiv (gammel version)".
- Erstatter posten en ældre post, så lad den gamle stå og tilføj 🟡 **[Claude] Erstattet af:** "<ny post>" under den.
- Tilføj en række i oversigtstabellen på "Forside" (Emne, Status, Dato, Fane). Når status ændres i en post, så ret også rækken.

```
### <Emne>
**Status:** Besluttet <dd/mm> / Overvejer / Skal bekræftes med <hvem>
**Spørgsmål:** Hvad skal vi vælge, og hvorfor er det vigtigt for projektet?

**Muligheder:**
| Mulighed | Fordele | Ulemper | Kilde |
|---|---|---|---|
| A | ... | ... | [1] |
| B | ... | ... | [2] |

**Kriterier:** Hvad vurderer vi efter? (fx tid, pris, sikkerhed, læring, kompatibilitet med Instant, krav fra platformene)
**Valg:** <A>
**Begrundelse:** 2–4 sætninger, der kobler valget til kriterierne.
**Kilder:** IEEE-format, fx [1] Clerk, "Next.js Quickstart," clerk.com. [Online]. Tilgængelig: <url>
**Hører til i rapporten:** <afsnit, fx 5.3 Teknologivalg og begrundelser>
```

Regler:
- Dansk, korte sætninger.
- "Instant bruger det" eller "det er det, vi kender" må gerne være et argument, men aldrig det eneste.
- Er status "Overvejer", så udfyld Valg og Begrundelse med "Ikke besluttet endnu" og skriv, hvad der mangler for at beslutte.
- Idé, målgruppe og proces må ikke stå som besluttet, før gruppen siger det.
- Slet aldrig gruppens tekst. Er der allerede løse punkter om emnet, så lad dem stå og tilføj den strukturerede post lige under.

## 5. Peg på rapporten
Brug indholdsfortegnelsen. Typisk:
- Procesmodel (fx Double Diamond) → 2.1
- Projektstyring og værktøjer (Jira, Git) → 2.2
- Dataindsamling (interviews, research) → 2.3
- Målgruppe og personas → 3.2
- Prioritering af krav (fx MoSCoW) → 4.2
- MVP og scope → 4.3
- Arkitektur → 5.1, database → 5.2, teknologier → 5.3, UI → 5.5
- Teststrategi → 7.1
- AI-etik og regler → 8.3, refleksion over valg → 8.2

Foreslå en kort tekst (3–6 sætninger, sammenhængende tekst, ikke punkter) til afsnittet, med kildehenvisninger som [1].

## 6. Godkendelse
- Vis posten og rapportteksten først. Skriv først i dokumenterne, når brugeren siger ja.
- Forslag som nummereret liste, fx:
  1. Tilføj posten i "Overvejelser og valg" i fanen <fane> (og en række på Forside)
  2. Tilføj teksten i rapporten under <afsnit>
  3. Tilføj kilderne i litteraturlisten
  4. Opret Jira-opgave i BA: <fx "Undersøg alternativer til X">

## 7. Markeringer (må indsættes uden at spørge)
Start altid med 🟡 **[Claude]**, fx:
- 🟡 **[Claude] Begrundelse mangler:** Vi bruger X, men har ikke beskrevet alternativer.
- 🟡 **[Claude] Kilde mangler:** Påstanden om Y skal have en kilde.
- 🟡 **[Claude] Litteraturliste:** Kilde [n] skal tilføjes i litteraturlisten.
- 🟡 **[Claude] Skal bekræftes:** Spørg <Peter/Instant> om Z.

## 8. Afslut svaret med
- Den nummererede liste med forslag, så brugeren kan svare fx "ja til 1 og 3".
- Hvor du har indsat 🟡-markeringer (dokument + afsnit).