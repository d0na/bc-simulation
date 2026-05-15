# Flusso Umano Di Modellazione

Questa guida spiega il flusso human-in-the-loop per modellare ed eseguire un esperimento riproducibile in Sesame.

E' intenzionalmente diversa dalla guida tooling:

- la guida tooling spiega cosa fa ogni script
- questa guida spiega cosa deve decidere l'utente, quando lanciare i comandi, quali file vengono prodotti e quando correggere le assunzioni a monte

## Principio Base

Il workflow non e':

1. chiedere all'AI una simulazione
2. lanciarla subito

Il workflow corretto e':

1. definire il perimetro dell'esperimento
2. raccogliere evidenza
3. far proporre al sistema delle astrazioni
4. revisionare quelle astrazioni come modeler umano
5. approvare o correggere le assunzioni
6. generare il payload backend
7. validare e lanciare

L'umano e' responsabile del giudizio di modellazione.
Il tooling locale e' responsabile della tracciabilita'.

## Categorie Di File

Prima del flusso step-by-step, distingui tre categorie di file.

### File sorgente umani

Questi sono i file normalmente scritti direttamente dall'utente e vanno trattati come source of truth:

- `experiment.json`
- `10-human-input/05-discovery-brief.json`

### File proposti dall'AI o preparati da script e poi rivisti dall'umano

Questi vengono inizializzati dall'AI o dagli script, ma richiedono comunque review umana e possono essere modificati manualmente dopo:

- `10-human-input/10-retrieval-request.json`
- `10-human-input/11-med-aggregation-rules.json`
- `10-human-input/12-probability-model-rules.json`
- `10-human-input/13-simulation-blueprint.json`
- `60-human-review/60-review-decision.json`

### File generati o derivati

Questi non dovrebbero normalmente essere editati a mano:

- `20-rendered-prompts/20-rendered-retrieval-prompts.json`
- `30-mcp-raw/39-raw-mcp-retrieval.json`
- `40-normalized-evidence/40-retrieval-evidence.json`
- `50-generated-proposals/50-med-proposal.json`
- `50-generated-proposals/51-probability-model-proposal.json`
- `70-execution/70-simulation-input.json`
- `70-execution/71-run-manifest.json`
- `70-execution/72-validation-report.json`

### File di capture raw

Questi sono copie versionate degli output MCP. Sono strutturati, ma rappresentano ancora dati catturati dall'esterno:

- `30-mcp-raw/30-etherscan-mcp-capture.json`
- `30-mcp-raw/31-dune-mcp-capture.json`
- `30-mcp-raw/32-simulation-mcp-capture.json`

Quando un output generato sembra sbagliato, la correzione normale e':

1. correggere l'input umano o il raw capture
2. rigenerare i file downstream

Non trattare le proposal generate come superficie principale di editing.

## Flusso Umano End-To-End

## Step 1: Definire L'Esperimento

Tu definisci:

- nome esperimento
- obiettivo
- contratto e chain di interesse
- fenomeno generale da simulare

File da creare o rivedere:

- `experiment.json`
- `10-human-input/05-discovery-brief.json`

Domande da chiarire:

- quale comportamento voglio capire?
- quale contratto o porzione di protocollo e' in scope?
- quale domanda di business o ricerca sto testando?

Qui non devi ancora lanciare nulla.

## Step 2: Generare I Draft Del Layer Di Input

Lancia:

```bash
npm run generate:input-layer -- experiments/mio-nuovo-esperimento
```

File prodotti:

- `10-human-input/11-med-aggregation-rules.json`
- `10-human-input/12-probability-model-rules.json`
- `10-human-input/13-simulation-blueprint.json`

Input usati dallo script:

- `experiment.json` e `10-human-input/05-discovery-brief.json` (sempre)
- `40-normalized-evidence/40-retrieval-evidence.json` (se gia' disponibile, per proposal piu' contestualizzate)

Comportamento di default:

- usa un generatore locale deterministico
- non richiede nessun SDK AI o API key

Comportamento AI opzionale:

- imposta `SESAME_INPUT_LAYER_PROVIDER=anthropic`
- imposta `ANTHROPIC_API_KEY`

I file prodotti restano draft.
Vanno rivisti e approvati dall'umano nel passo successivo prima di essere usati dalla pipeline.

## Step 3: Rivedere Il Layer Di Input Umano

Rivedi i draft generati e finalizza:

- `10-human-input/11-med-aggregation-rules.json`
- `10-human-input/12-probability-model-rules.json`
- `10-human-input/13-simulation-blueprint.json`

Domande da porsi:

- le regole di aggregazione catturano il comportamento che vuoi modellare?
- le regole probabilistiche riflettono le aspettative sul fenomeno?
- il blueprint mappa correttamente verso il backend?

Modifica dove necessario prima di procedere.

Nota: `10-retrieval-request.json` viene preparato dallo script nel passo successivo.

## Step 4: Preparare La Retrieval Request

Lancia:

```bash
npm run prepare:retrieval-request -- experiments/mio-nuovo-esperimento
```

File prodotto o aggiornato:

- `10-human-input/10-retrieval-request.json`

Ciclo di vita di questo file:

1. lo script lo prepara o aggiorna
2. l'utente lo rivede
3. l'utente lo modifica se necessario

Poi rivedi:

- indirizzo contratto target
- chain
- finestra Dune
- metriche richieste
- focus del retrieval

Se questo file e' sbagliato, l'evidenza downstream sara' sbagliata.

## Step 5: Renderizzare I Prompt MCP

Lancia:

```bash
npm run render:retrieval-prompts -- experiments/mio-nuovo-esperimento
```

File prodotto:

- `20-rendered-prompts/20-rendered-retrieval-prompts.json`

Questo file e' la base versionata dei prompt da usare verso i MCP.

Qui non hai ancora evidenza.
Hai solo la richiesta preparata che guidera' la raccolta dati.

## Step 6: Catturare Gli Output Raw Dei MCP

Ora raccogli i dati dai server MCP e li salvi in:

- `30-mcp-raw/30-etherscan-mcp-capture.json`
- `30-mcp-raw/31-dune-mcp-capture.json`
- `30-mcp-raw/32-simulation-mcp-capture.json` quando rilevante

Responsabilita' umana in questa fase:

- confermare che i dati contratto-level riguardino il contratto giusto
- confermare che i risultati Dune corrispondano alla metrica e alla finestra temporale volute
- conservare riferimenti di provenienza quando disponibili
- evitare di copiare materiale rumoroso o irrilevante

Questa e' ancora una fase pre-modellazione.
Stai raccogliendo evidenza, non stai ancora approvando astrazioni.

## Step 7: Assemblare Il Bundle Raw Unificato

Lancia:

```bash
npm run assemble:raw-mcp-retrieval -- experiments/mio-nuovo-esperimento
```

File prodotto:

- `30-mcp-raw/39-raw-mcp-retrieval.json`

Questo congela lo stato raw MCP in un unico artifact di repo.

## Step 8: Normalizzare L'Evidenza

Lancia:

```bash
npm run normalize:retrieval-evidence -- experiments/mio-nuovo-esperimento
```

File prodotto:

- `40-normalized-evidence/40-retrieval-evidence.json`

Review umana in questa fase:

- ci sono le funzioni importanti?
- ci sono gli eventi importanti?
- ci sono le metriche di trend?
- l'evidenza e' tracciabile ai raw capture?
- manca qualcosa di chiaramente importante o qualcosa e' etichettato male?

Se l'evidenza e' sbagliata:

- rivedi i raw capture o la retrieval request
- rigenera

Normalmente non devi patchare a mano l'evidenza normalizzata.

## Step 9: Generare La Proposal MED

Lancia:

```bash
npm run generate:med-proposal -- experiments/mio-nuovo-esperimento
```

File prodotto:

- `50-generated-proposals/50-med-proposal.json`

Questa proposal va letta come:

- layer candidato di astrazione
- non modello finale approvato

Domande umane:

- ogni MED e' troppo larga o troppo stretta?
- le funzioni e gli eventi raggruppati stanno davvero insieme?
- il gas rappresentativo e' plausibile?
- la rationale descrive una vera unita' comportamentale?

Se la MED proposal e' debole:

- modifica `10-human-input/11-med-aggregation-rules.json`
- rigenera

## Step 10: Generare La Proposal Probabilistica

Lancia:

```bash
npm run generate:probability-model-proposal -- experiments/mio-nuovo-esperimento
```

File prodotto:

- `50-generated-proposals/51-probability-model-proposal.json`

Domande umane:

- la distribuzione scelta e' coerente col trend osservato?
- i parametri sono plausibili?
- la proposal e' troppo speculativa per l'evidenza disponibile?
- la confidence e' sovrastimata?
- il backend supporta davvero quel distribution type?

Se la proposal e' debole:

- modifica `10-human-input/12-probability-model-rules.json`
- rigenera

## Step 11: Preparare Il Record Di Review

Lancia:

```bash
npm run prepare:review-decision -- experiments/mio-nuovo-esperimento
```

File prodotto o aggiornato:

- `60-human-review/60-review-decision.json`

Questo file registra:

- stato della review
- quali artifact sono sotto review
- hash degli artifact
- edit umani
- note del reviewer

Ciclo di vita di questo file:

1. lo script prepara o aggiorna lo scaffold di review
2. l'utente decide lo stato della review
3. l'utente registra edit, note e intenzione di approvazione

Qui il modeler umano trasforma proposal generate in assunzioni approvate.

## Step 12: Eseguire La Review Umana Di Modellazione

Leggi insieme:

- `40-normalized-evidence/40-retrieval-evidence.json`
- `50-generated-proposals/50-med-proposal.json`
- `50-generated-proposals/51-probability-model-proposal.json`
- `10-human-input/13-simulation-blueprint.json`
- `60-human-review/60-review-decision.json`

Poi decidi:

- reject
- approve
- approve with edits

Edit umani tipici:

- alzare o abbassare il representative gas
- ridurre un parametro probabilistico
- mantenere un modello ma abbassare la confidence nelle note
- documentare assunzioni non direttamente osservabili

Questo e' il passo di modellazione piu' importante dell'intera pipeline.

## Step 13: Verificare La Coerenza Della Review

Lancia:

```bash
npm run check:review-consistency -- experiments/mio-nuovo-esperimento
```

Risultato prodotto:

- pass oppure fail

Questo step verifica che gli hash delle proposal revisionate coincidano ancora con i file correnti.

Se fallisce:

- o rifai la preparazione review e la review stessa
- oppure ripristini la versione di proposal effettivamente approvata

## Step 14: Validare L'Esperimento

Lancia:

```bash
npm run validate:experiment -- experiments/mio-nuovo-esperimento
```

File aggiornato:

- `70-execution/71-run-manifest.json`

Questo controlla che l'esperimento sia abbastanza coerente da poter procedere.

Non sostituisce il giudizio di modellazione.

## Step 15: Generare Il Payload Finale Di Simulazione

Lancia:

```bash
npm run generate:simulation-input -- experiments/mio-nuovo-esperimento
```

File prodotto:

- `70-execution/70-simulation-input.json`

Questo file viene generato da:

- MED proposal approvata
- probability proposal approvata
- edit della review umana
- simulation blueprint

Se il payload finale sembra sbagliato, i file upstream da rivedere normalmente sono:

- `10-human-input/13-simulation-blueprint.json`
- `10-human-input/11-med-aggregation-rules.json`
- `10-human-input/12-probability-model-rules.json`
- `60-human-review/60-review-decision.json`

## Step 16: Validare Di Nuovo

Lancia:

```bash
npm run validate:experiment -- experiments/mio-nuovo-esperimento
```

Perche' validare di nuovo:

- ora esiste il payload finale di esecuzione
- gli errori di blueprint diventano rischi operativi in questo punto

## Step 17: Lanciare L'Esperimento

Lancia:

```bash
npm run launch:experiment -- experiments/mio-nuovo-esperimento
```

Usa:

- `70-execution/70-simulation-input.json`

Aggiorna:

- `70-execution/71-run-manifest.json`

Devi lanciare solo dopo che il gate di review e' soddisfatto.

## Step 18: Ispezionare Il Run Manifest

Leggi:

- `70-execution/71-run-manifest.json`

Questo e' l'audit record minimo di riproducibilita'.

Ti dice:

- quali artifact sono stati usati
- quali hash erano presenti
- quando e' avvenuta la generazione
- quando e' avvenuta la validazione
- quando e' avvenuto il launch
- quale revisione di codice era attiva

## Cosa Possiede Davvero L'Umano

Il modeler umano possiede:

- perimetro dell'esperimento
- perimetro del retrieval
- logica di grouping MED
- logica dei modelli probabilistici
- approvazione della review
- autorizzazione all'esecuzione

Il tooling possiede:

- rendering dei prompt
- assembly degli artifact
- normalizzazione dell'evidenza
- generazione delle proposal
- generazione del payload
- metadati di tracciabilita'

I file a responsabilita' mista sono:

- `10-human-input/10-retrieval-request.json`
- `10-human-input/11-med-aggregation-rules.json`
- `10-human-input/12-probability-model-rules.json`
- `10-human-input/13-simulation-blueprint.json`
- `60-human-review/60-review-decision.json`

Non sono puramente generati e non sono nemmeno puramente scritti da zero.
Vengono proposti dall'AI o preparati dagli script e poi finalizzati dall'umano.

## Regola Mentale Consigliata

Quando un file downstream sembra sbagliato, chiediti:

1. l'evidenza raw e' sbagliata?
2. le regole umane sono sbagliate?
3. la review e' obsoleta?
4. il blueprint e' sbagliato?

Solo dopo queste domande ha senso rigenerare.

Non usare i file generati come superficie di editing di lungo periodo.

## Sequenza Minima Di Comandi

```bash
npm run generate:input-layer -- experiments/mio-nuovo-esperimento
npm run prepare:retrieval-request -- experiments/mio-nuovo-esperimento
npm run render:retrieval-prompts -- experiments/mio-nuovo-esperimento
npm run assemble:raw-mcp-retrieval -- experiments/mio-nuovo-esperimento
npm run normalize:retrieval-evidence -- experiments/mio-nuovo-esperimento
npm run generate:med-proposal -- experiments/mio-nuovo-esperimento
npm run generate:probability-model-proposal -- experiments/mio-nuovo-esperimento
npm run prepare:review-decision -- experiments/mio-nuovo-esperimento
npm run check:review-consistency -- experiments/mio-nuovo-esperimento
npm run validate:experiment -- experiments/mio-nuovo-esperimento
npm run generate:simulation-input -- experiments/mio-nuovo-esperimento
npm run validate:experiment -- experiments/mio-nuovo-esperimento
npm run launch:experiment -- experiments/mio-nuovo-esperimento
```
