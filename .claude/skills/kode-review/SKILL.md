---
name: "kode-review"
description: "Review kodeændringer siden et fast punkt (branch, commit, main) på to akser: Standarder (følger koden repoets regler?) og Spec (gør koden det, Jira-ticketen i BA bad om?). Use when the group wants a branch, PR or work-in-progress code reviewed."
---

# Kode-review

Inspireret af Matt Pococks /code-review (MIT). Spec-kilden er Jira-ticketen i BA.

> Samme skill ligger i Claude-projektet "Bachelor project". Ændres den ét sted, så ret den andet sted.

To akser, holdt adskilt:
- **Standarder:** Følger koden repoets dokumenterede regler?
- **Spec:** Gør koden det, ticketens acceptkriterier beder om?

Kode kan bestå den ene akse og dumpe den anden. Derfor rapporteres de hver for sig.

## 1. Fastlæg udgangspunktet
- Udgangspunktet er det, brugeren siger (branch, commit, `main`). Spørg, hvis det mangler.
- Tjek at udgangspunktet findes (`git rev-parse <punkt>`).
- Ved review af en committet branch/PR: `git diff <punkt>...HEAD`.
- Ved igangværende arbejde eller kald fra `ticket-handler`: `git diff "$(git merge-base <punkt> HEAD)"` for committed, staged og unstaged ændringer. Find også nye, ikke-ignorerede filer med `git ls-files --others --exclude-standard`, og læs deres indhold som tilføjelser i reviewet.
- Commits: `git log <punkt>..HEAD --oneline`.
- Giv begge agenter det valgte reviewgrundlag, inklusive de nye filer ved igangværende arbejde. Tjek først, om reviewet er tomt, når hele dette grundlag er med.
- Arbejd i en lokal klon af espi0001/bachelor-project. Er der ingen, så spørg.

## 2. Find spec (Jira)
Led efter ticket-nøgler (`BA-123`) i denne rækkefølge:
1. Branchnavnet
2. Commit-beskederne
3. Det, brugeren skriver

Hent ticketen med Atlassian MCP: beskrivelse, acceptkriterier og forælder-ticket. Findes der ingen ticket, så sig det, og spring Spec-aksen over. Det er også et fund, fordi al kode skal have en ticket.

## 3. Find standarder
Find alle filer i repoet, der beskriver, hvordan koden skal skrives. I dette repo er det altid skillen `project-conventions`, afsnittet "Non-obvious constraints" i `AGENTS.md` og `GLOSSARY.md` (navne i koden). Tag også `README.md` og lint- og TypeScript-opsætningen med. Det, værktøjerne allerede tjekker (ESLint, Prettier, `tsc`), skal ikke med i reviewet.

Oven i det gælder **lugtlisten** nedenfor (Fowler, *Refactoring* kap. 3). Repoets egne regler vinder altid. Et fund fra lugtlisten er en vurdering ("muligvis Feature Envy"), ikke en fejl.

- **Mysterious Name:** Et navn, der ikke siger, hvad det gør eller indeholder. → Omdøb.
- **Duplicated Code:** Samme logik flere steder i ændringen. → Træk den ud og kald den begge steder.
- **Feature Envy:** En funktion, der bruger et andet objekts data mere end sit eget. → Flyt den derhen.
- **Data Clumps:** De samme felter eller parametre følges ad. → Saml dem i én type.
- **Primitive Obsession:** En string eller et tal står for et domænebegreb. → Giv begrebet sin egen type.
- **Repeated Switches:** Samme `switch`/`if`-kæde på samme type flere steder. → Ét fælles map eller polymorfi.
- **Shotgun Surgery:** Én ændring kræver rettelser i mange filer. → Saml det, der ændres sammen.
- **Divergent Change:** Én fil ændres af flere uafhængige grunde. → Del den op.
- **Speculative Generality:** Abstraktioner eller parametre, ticketen ikke beder om. → Fjern dem.
- **Message Chains:** Lange kæder som `a.b().c().d()`. → Skjul dem bag én funktion.
- **Middle Man:** En funktion eller klasse, der mest sender videre. → Kald målet direkte.
- **Refused Bequest:** Arver meget, men bruger lidt af det. → Brug komposition.

## 4. Kør begge akser parallelt
Start to subagenter i samme kald, hver med frisk kontekst, så akserne ikke påvirker hinanden.

**Standarder-agenten** får diff-kommandoen, commit-listen, listen over standardfiler og hele lugtlisten. Opgave: "Rapportér pr. fil: (a) brud på en dokumenteret regel, med henvisning til fil og regel, og (b) lugte fra lugtlisten med citat af koden. Skeln mellem brud og vurderinger. Spring over, hvad værktøjer tjekker. Under 400 ord."

**Spec-agenten** får diff-kommandoen, commit-listen og ticketens tekst. Opgave: "Rapportér: (a) acceptkriterier, der mangler eller kun er delvist lavet, (b) kode, ticketen ikke bad om (scope creep), og (c) kriterier, der ser lavet ud, men ser forkerte ud. Citér acceptkriteriet ved hvert fund. Under 400 ord."

## 5. Saml rapporten
Vis rapporterne under `## Standarder` og `## Spec`. Bland dem ikke, og omranger ikke på tværs.

Slut med én linje: antal fund pr. akse og det værste fund i hver akse.

Foreslå derefter, og vent på "ja":
- Kommentar på Jira-ticketen med reviewet
- Nye tickets til større fund (via jira-ticket-tjek)
