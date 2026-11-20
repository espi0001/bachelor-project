---
name: "overvejelse-til-rapport"
description: "Log et valg eller en overvejelse i bachelorprojektets 'Overvejelser og valg' med muligheder, valg og begrundelse, og peg på rapportafsnittet. Use when the group decides, considers or compares a technology, method or theory."
---

# Overvejelse → rapport

> Samme skill ligger i Claude-projektet "Bachelor project". Ændres den ét sted, så ret den andet sted. Denne kopi har ikke dokument-id'et, fordi repoet er offentligt.

Vejlederen vil have, at vi ikke "kun" løser opgaver, men analyserer og begrunder vores tilgang. For hver teori, metode og teknologi skal vi vise: hvilke muligheder der er, hvad vi valgte, og hvorfor.

Denne skill gør en overvejelse eller beslutning til en struktureret post i "Overvejelser og valg" (Google Doc i Bachelor-mappen i Drive) og peger på, hvor den hører hjemme i "Bachelor rapport".

**Adgang til Drive:** Find dokumenterne ved at søge efter titlen med Google Drive-værktøjet. Har du ikke Google Drive/Docs-værktøjer i denne session, så spring læsning og skrivning i dokumenterne over: skriv posten og rapportteksten i chatten, så brugeren selv kan indsætte dem, og sig, at de ikke er tjekket mod eksisterende poster.

Brug den også, når brugeren beder om at "tjekke overvejelserne": gå de eksisterende punkter igennem og markér dem, der mangler alternativer eller begrundelse.

## 1. Forstå valget
- Hvad skal der vælges mellem? (fx login-løsning, database, procesmodel, målgruppe)
- Er det **besluttet**, noget vi **overvejer**, eller noget der **skal bekræftes** (fx med vejleder eller Instant)?
- Er det uklart, så stil ét kort spørgsmål.

## 2. Læs først
- "Overvejelser og valg": findes emnet allerede? Så byg videre på det i stedet for at lave en ny post.
- Indholdsfortegnelsen i "Bachelor rapport" (den kan have ændret sig).
- Relevante mødeopsummeringer, hvis valget kommer fra et møde (så du kan henvise med tidskoder).

## 3. Find mulighederne
- Mindst 2–3 realistiske muligheder, også dem gruppen ikke har nævnt.
- Du må søge på nettet efter alternativer og kilder (officiel dokumentation, artikler, bøger). Skriv tydeligt, hvilke muligheder og kilder du selv har fundet, så gruppen kan tjekke dem.
- Find aldrig på kilder, tal eller udsagn.

## 4. Skriv posten
Placér den under den passende overskrift i dokumentet (fx **Teknologi**, **Løsningen**, **Metode og proces**, **Research**). Opret en ny overskrift, hvis ingen passer.

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
  1. Tilføj posten i "Overvejelser og valg" under <overskrift>
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