# Ordliste

Faste begreber i projektet. Brug de samme ord i kode, UI, Jira, rapporten og samtaler med Instant.

- Rapporten og Jira bruger det danske ord. Koden og UI'et bruger det engelske navn (se `project-conventions`).
- Kun begreber fra domænet, ingen tekniske løsninger. Beslutninger står i "Overvejelser og valg" i Drive.
- Nye begreber foreslås med skillen `grill-med-docs` eller i en pull request.

## Format

```
**<Dansk begreb>** (`englishName`) – definition i én sætning.
*Undgå:* <ord vi ikke bruger om det>
```

## Begreber

**Kildebillede** (`sourceImage`) – det billede, et genereret billede laves ud fra: ét af produktets billeder i Shopify eller et billede uploadet fra brugerens enhed.
*Undgå:* originalbillede, grundbillede, inputbillede

**Livsstilsbillede** (`lifestyleImage`) – et billede, der viser produktet i brug eller i et miljø.
*Undgå:* stemningsbillede, lifestyle-billede

**Packshot** (`packshot`) – et billede af produktet alene på en neutral baggrund.
*Undgå:* produktbillede (dækker alle billedtyper), studiebillede

**Referencebillede** (`referenceImage`) – ét billede fra butikken, som billedmodellen bruger som inspiration til baggrunden.
*Undgå:* inspirationsbillede, guidance image, eksempelbillede

**Visual tone of voice** (`visualToneOfVoice`) – butikkens beskrivelse af, hvordan dens livsstilsbilleder skal se ud, som sendes med i prompten ved generering.
*Undgå:* tone of voice (det er Instants tekst-tone), stilprofil, brand style
