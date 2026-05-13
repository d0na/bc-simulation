# Come Creare E Pilotare Un Esperimento

Questa guida spiega, passo per passo, come creare, popolare, rivedere, validare e lanciare un esperimento riproducibile in Sesame.

L'obiettivo non e' solo descrivere gli artifact, ma mostrare l'ordine operativo reale per portare un esempio dall'idea alla simulazione.

## A Chi Serve Questa Guida

Usa questa guida se vuoi:

- creare un nuovo esperimento da zero
- duplicare e adattare l'esempio `dao-vote-costs-v1`
- capire quali file sono scritti a mano e quali sono generati
- capire quando deve intervenire il gate umano
- lanciare la simulazione finale tramite il backend esistente

## Prerequisiti

Dovresti avere gia':

- la repository Sesame disponibile in locale
- Node.js 20+ installato
- Java 21+ installato
- il backend disponibile quando vuoi lanciare la simulazione
- i server MCP disponibili quando vuoi raccogliere dati reali

Comando utile:

```bash
npm run dev:all
```

Questo avvia:

- `apps/api`
- `apps/web`
- `mcp-server`

Se ti serve solo il backend per il launch:

```bash
npm run dev:api
```

## Modello Mentale

Un esperimento non e' un singolo file JSON.

E' una catena di artifact versionati:

1. definire cosa recuperare
2. renderizzare i prompt
3. catturare gli output MCP grezzi
4. normalizzare l'evidenza
5. generare le MED
6. generare i modelli probabilistici
7. fare la review e approvare
8. generare l'input di simulazione
9. lanciare la simulazione

Regola base:

Se vuoi riproducibilita', non saltare gli artifact intermedi.

## Avvio Rapido: Clonare L'Esempio Esistente

Il modo piu' rapido per creare un nuovo esperimento e' copiare la directory di esempio:

```bash
cp -R experiments/dao-vote-costs-v1 experiments/mio-nuovo-esperimento
```

Poi aggiorna tutti i riferimenti:

- `experiment_id` in tutti gli artifact
- nome della cartella
- indirizzo e label del contratto
- obiettivo
- regole di aggregazione
- regole dei modelli probabilistici
- blueprint di simulazione

I file minimi da controllare subito sono:

- `experiment.json`
- `00-overview/00-objective.md`
- `00-overview/01-status-and-notes.md`
- `10-human-input/10-retrieval-request.json` dopo aver eseguito lo step di preparazione
- `10-human-input/11-med-aggregation-rules.json`
- `10-human-input/12-probability-model-rules.json`
- `10-human-input/13-simulation-blueprint.json`

## Ruolo Dei File

Ogni file dentro la cartella esperimento ha un ruolo diverso.

### `00-overview/`

- `00-objective.md`
  Dichiarazione human-readable dell'obiettivo dell'esperimento.

- `01-status-and-notes.md`
  Note operative human-readable, ordine del workflow e promemoria sul gate di review.

### `10-human-input/`

- `experiment.json`
  E' il descrittore principale. Definisce l'identita' dell'esperimento e i path degli artifact.

- `10-retrieval-request.json`
  Viene prima preparato da script, poi rivisto ed eventualmente modificato dall'utente. Descrive cosa deve essere recuperato da Etherscan e Dune.

- `11-med-aggregation-rules.json`
  Regole deterministiche che definiscono come l'evidenza low-level diventa MED.

- `12-probability-model-rules.json`
  Regole deterministiche per generare i modelli probabilistici.

- `13-simulation-blueprint.json`
  Mapping approvato tra MED, modelli probabilistici ed eventi del backend.

### `20-rendered-prompts/`

- `20-rendered-retrieval-prompts.json`
  Contiene i payload di prompt concreti derivati dalla request.

### `30-mcp-raw/`

- `30-etherscan-mcp-capture.json`
  Capture grezza o quasi grezza del workflow MCP Etherscan.

- `31-dune-mcp-capture.json`
  Capture grezza o quasi grezza del workflow MCP Dune.

- `32-simulation-mcp-capture.json`
  Capture opzionale strutturata del workflow MCP di simulazione.

- `39-raw-mcp-retrieval.json`
  Bundle grezzo unificato assemblato dai capture per server.

### `40-normalized-evidence/`

- `40-retrieval-evidence.json`
  Evidenza canonica normalizzata usata dal resto del framework.

### `50-generated-proposals/`

- `50-med-proposal.json`
  Proposal MED generata.

- `51-probability-model-proposal.json`
  Proposal probabilistica generata.

### `60-human-review/`

- `60-review-decision.json`
  Record di review preparato da script e poi completato e approvato dal reviewer umano.

### `70-execution/`

- `70-simulation-input.json`
  Payload compatibile col backend, generato dagli artifact approvati.

- `71-run-manifest.json`
  Record di tracciabilita' con hash, Git SHA, metadati di generazione e launch.

- `72-validation-report.json`
  Placeholder per il report di validazione.

## Step 1: Creare O Aggiornare `experiment.json`

Questo file deve riflettere tutto il set di artifact dell'esperimento.

Quando crei un nuovo esperimento:

1. assegna un `experiment_id` univoco
2. definisci un `objective` chiaro
3. mantieni allineati i path degli artifact
4. mantieni allineati i riferimenti ai template in `prompts/`

Se rinomini la cartella ma non aggiorni `experiment.json`, la validazione puo' anche leggere i file, ma la tracciabilita' diventa sbagliata.

## Step 2: Preparare L'Intento Di Retrieval

Esegui:

```bash
npm run prepare:retrieval-request -- experiments/mio-nuovo-esperimento
```

Cosa fa:

- crea o aggiorna `10-human-input/10-retrieval-request.json`
- collega l'obiettivo dell'esperimento ai template di prompt

Cosa devi controllare:

- chain target
- indirizzo del contratto
- label del contratto
- finestra temporale Dune
- metriche richieste

Se la request e' sbagliata, tutta la catena a valle sara' sbagliata.

## Step 3: Renderizzare I Prompt

Esegui:

```bash
npm run render:retrieval-prompts -- experiments/mio-nuovo-esperimento
```

Cosa fa:

- genera `20-rendered-prompts/20-rendered-retrieval-prompts.json`
- produce un payload prompt concreto per Etherscan
- produce un payload prompt concreto per Dune

Come usarlo:

- copia o adatta il testo renderizzato quando usi i tool MCP live
- considera questo file come il ponte verificabile tra intenzione del repo e uso dei tool

## Step 4: Catturare Gli Output MCP

Popola i capture file per server:

- `30-mcp-raw/30-etherscan-mcp-capture.json`
- `30-mcp-raw/31-dune-mcp-capture.json`
- opzionalmente `30-mcp-raw/32-simulation-mcp-capture.json`

Dal punto di vista del repository, questo step e' ancora manuale.

Pattern atteso:

1. esegui le query MCP esternamente
2. copia i risultati strutturati rilevanti nei capture file
3. conserva `source_ref` o campi equivalenti di provenienza

### Cosa Aspettarsi Nel Capture Etherscan

Campi tipici:

- `function_name`
- `gas_estimate`
- `source_ref`
- `event_name`

### Cosa Aspettarsi Nel Capture Dune

Campi tipici:

- `metric_name`
- `granularity`
- `trend_hint`
- `notes`
- `source_ref`

### Cosa Aspettarsi Nel Capture Simulation MCP

Questo file e' ancora soprattutto un placeholder.

Usalo per persistere:

- proposte di blueprint
- note di dry-run
- interpretazioni del server di simulazione che non vuoi perdere

## Step 5: Assemblare Il Raw Retrieval Unificato

Esegui:

```bash
npm run assemble:raw-mcp-retrieval -- experiments/mio-nuovo-esperimento
```

Cosa fa:

- legge i capture per server
- scrive `30-mcp-raw/39-raw-mcp-retrieval.json`

Perche' conta:

- congela lo stato raw cross-server in un solo bundle
- ti da' un input unico per normalizzazione e review

## Step 6: Normalizzare L'Evidenza

Esegui:

```bash
npm run normalize:retrieval-evidence -- experiments/mio-nuovo-esperimento
```

Cosa fa:

- converte i campi MCP grezzi in evidenza canonica
- scrive `40-normalized-evidence/40-retrieval-evidence.json`

Cosa controllare:

- nomi delle funzioni
- nomi degli eventi
- nomi delle metriche
- riferimenti di provenienza
- trend hint

E' il punto in cui una capture grezza di bassa qualita' diventa immediatamente evidente.

## Step 7: Definire Le Regole MED

Modifica:

```text
experiments/mio-nuovo-esperimento/10-human-input/11-med-aggregation-rules.json
```

Ogni regola deve rispondere a queste domande:

- quali funzioni appartengono a una MED
- quali eventi appartengono a una MED
- quali metriche giustificano l'astrazione
- come derivare il gas rappresentativo
- quale rationale deve comparire

Mantieni le regole strette.

MED sbagliata:

- "tutta la governance"

MED migliori:

- "proposal lifecycle"
- "voting interaction"
- "treasury execution"

## Step 8: Generare La Proposal MED

Esegui:

```bash
npm run generate:med-proposal -- experiments/mio-nuovo-esperimento
```

Cosa fa:

- legge l'evidenza normalizzata
- applica le regole MED
- scrive `50-generated-proposals/50-med-proposal.json`

Cosa controllare:

- `maps_to.functions`
- `maps_to.events`
- `cost_model.representative_gas`
- `evidence_refs`
- `rationale`

Se la proposal MED e' concettualmente sbagliata, correggi le regole, non il file generato.

## Step 9: Definire Le Regole Dei Modelli Probabilistici

Modifica:

```text
experiments/mio-nuovo-esperimento/10-human-input/12-probability-model-rules.json
```

Ogni regola deve specificare:

- MED target
- tipo di distribuzione
- parametri
- metriche che giustificano la proposal
- confidence
- note per il reviewer

Importante:

Il generatore finale supporta solo i tipi di distribuzione gia' accettati dal backend.

Non introdurre tipi non supportati se non prevedi anche di estendere il backend.

## Step 10: Generare La Proposal Probabilistica

Esegui:

```bash
npm run generate:probability-model-proposal -- experiments/mio-nuovo-esperimento
```

Cosa fa:

- legge l'evidenza normalizzata
- legge le MED generate
- applica le regole probabilistiche
- scrive `50-generated-proposals/51-probability-model-proposal.json`

Cosa controllare:

- `target_med`
- `distribution_type`
- `parameters`
- `heuristic_parameters`
- `evidence_refs`
- `confidence`

## Step 11: Preparare La Review Umana

Esegui:

```bash
npm run prepare:review-decision -- experiments/mio-nuovo-esperimento
```

Cosa fa:

- aggiorna `60-human-review/60-review-decision.json`
- registra gli hash delle proposal sotto review
- conserva edit e note gia' presenti quando possibile

A questo punto il reviewer umano deve ispezionare:

- `40-normalized-evidence/40-retrieval-evidence.json`
- `50-generated-proposals/50-med-proposal.json`
- `50-generated-proposals/51-probability-model-proposal.json`
- `10-human-input/13-simulation-blueprint.json`

## Step 12: Review Umana Ed Edit

Il reviewer deve poi decidere:

- reject
- approve
- approve with edits

La parte piu' importante non e' solo la stringa di stato, ma il fatto che `60-human-review/60-review-decision.json` rifletta correttamente:

- cosa e' stato revisionato
- cosa e' stato cambiato
- quali hash delle proposal sono stati approvati

### Quando Modificare Il File Di Review

Modifica `60-human-review/60-review-decision.json` quando:

- il gas rappresentativo di una MED va corretto
- un parametro probabilistico va aumentato o ridotto
- la rationale e' accettata ma i parametri vanno calibrati

Esempi tipici:

- aumentare `representative_gas`
- ridurre `scalingFactorY`
- mantenere il modello ma abbassare la confidence nelle note

## Step 13: Verificare La Coerenza Della Review

Esegui:

```bash
npm run check:review-consistency -- experiments/mio-nuovo-esperimento
```

Cosa fa:

- confronta gli hash correnti delle proposal con quelli registrati nella review
- fallisce se le proposal sono cambiate dopo l'approvazione

Questo e' critico.

Se fallisce, non proseguire verso la simulazione.
Devi:

- rigenerare la review e farla approvare di nuovo
- oppure ripristinare le proposal effettivamente approvate

## Step 14: Validare L'Esperimento

Esegui:

```bash
npm run validate:experiment -- experiments/mio-nuovo-esperimento
```

Cosa controlla:

- presenza degli artifact
- consistenza degli `experiment_id`
- struttura delle proposal
- integrita' della review
- forma del payload di simulazione

Cosa non controlla completamente:

- qualita' semantica delle astrazioni
- realismo dei parametri probabilistici
- correttezza interpretativa dei dati Etherscan o Dune

## Step 15: Generare L'Input Di Simulazione

Esegui:

```bash
npm run generate:simulation-input -- experiments/mio-nuovo-esperimento
```

Cosa fa:

- applica gli edit approvati nella review
- mappa MED e modelli probabilistici tramite il blueprint
- scrive `70-execution/70-simulation-input.json`

Il blueprint definisce:

- nomi degli eventi
- nomi delle entity
- mapping di creazione istanze
- mapping delle dipendenze
- eventuali override del gas

## Step 16: Validare Di Nuovo

Esegui:

```bash
npm run validate:experiment -- experiments/mio-nuovo-esperimento
```

Riesegui la validazione dopo la generazione del simulation input perche' qui emergono rischi operativi come:

- tipi di distribuzione non supportati
- dipendenze mal mappate
- entity mancanti

## Step 17: Lanciare L'Esperimento

Se serve, avvia il backend:

```bash
npm run dev:api
```

Poi lancia:

```bash
npm run launch:experiment -- experiments/mio-nuovo-esperimento
```

Oppure con URL esplicito:

```bash
npm run launch:experiment -- experiments/mio-nuovo-esperimento http://localhost:8099
```

Cosa fa:

- legge `70-execution/70-simulation-input.json`
- esegue una POST verso `/newsimulation`
- aggiorna `70-execution/71-run-manifest.json`

## Step 18: Controllare Il Manifest

Dopo generazione, validazione o launch, controlla:

```text
experiments/mio-nuovo-esperimento/70-execution/71-run-manifest.json
```

Campi chiave:

- `code_version`
- `artifact_hashes`
- `generation`
- `validation`
- `launch`

Questo file e' il ledger minimo di riproducibilita'.

## Sequenza Consigliata Di Comandi

Per un run end-to-end normale:

```bash
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

## Errori Tipici

### La validazione fallisce per drift degli hash di review

Causa:

- le proposal sono cambiate dopo la review

Fix:

- riesegui `prepare:review-decision`
- fai riesaminare e aggiornare `60-human-review/60-review-decision.json`

### La MED e' formalmente corretta ma concettualmente sbagliata

Causa:

- regole di aggregazione troppo larghe o poco informative

Fix:

- modifica `10-human-input/11-med-aggregation-rules.json`
- rigenera la proposal MED

### La proposal probabilistica usa parametri poco realistici

Causa:

- regole troppo euristiche

Fix:

- modifica `10-human-input/12-probability-model-rules.json`
- rigenera la proposal probabilistica

### La generazione del simulation input fallisce

Causa:

- il blueprint punta a MED o model id inesistenti

Fix:

- riallinea `10-human-input/13-simulation-blueprint.json` con le proposal generate

### Il launch fallisce

Causa:

- backend spento
- payload rifiutato dal backend
- distribuzione non supportata

Fix:

- avvia il backend
- controlla `70-execution/70-simulation-input.json`
- riduci il payload ai soli campi supportati dal backend

## Consigli Minimi Per Uso Reale

- considera i file generati come output rigenerabili
- considera i file di regole come vera source of truth
- considera `60-human-review/60-review-decision.json` come artifact di compliance, non come scratchpad
- considera `70-execution/71-run-manifest.json` come audit record principale
- se hai dubbi, rigenera e fai nuova review invece di patchare a mano i file generati
