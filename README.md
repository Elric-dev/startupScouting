# AI Startup Scouting Agent (versione Italiano)

**MVP per lo scouting automatizzato di acceleratori e startup** *Sviluppato per il processo di selezione - Paprika*

Versione in inglese sotto 

Un sistema di automazione intelligente che individua i principali acceleratori europei, estrae i dati del portfolio e genera proposte di valore standardizzate utilizzando il modello **Gemini 2.5 Flash**.

---

## Stack Tecnologico

* **Google Apps Script (V8 Engine):** Ambiente di esecuzione cloud-native.
* **Node.js & Clasp:** Workflow di sviluppo locale e controllo di versione.
* **Gemini AI API (Paid Tier):** LLM principale per l'estrazione e l'analisi dei dati.
* **Google Drive API:** Utilizzata per il logging persistente del sistema.
* **dotenv:** Gestione locale delle variabili d'ambiente (secret).

---

## Installazione e Configurazione

1. **Node.js:** Installa da [nodejs.org](https://nodejs.org/).
2. **Clasp:** Installa globalmente tramite `npm install -g @google/clasp`.
3. **Abilita Apps Script API:** Visita [script.google.com/home/usersettings](https://script.google.com/home/usersettings) e imposta su **ON**.
4. **Autenticazione:** Esegui `clasp login` nel terminale.
5. **Ambiente:**
* Crea un file `.claspignore` per evitare che i file di test locali e `node_modules` vengano caricati sul cloud.
* Imposta la tua `GEMINI_API_KEY` nelle **Impostazioni del progetto Google Apps Script** sotto "Proprietà script".



---

## Sicurezza e Permessi

Al primo avvio, Google richiederà l'autorizzazione. Questa è una procedura standard per i progetti Apps Script che utilizzano manifest personalizzati. Il progetto richiede specificamente:

* **drive.file:** Solo per gestire il file `startup_scouter_logs.txt` creato dall'app, archiviato nella stessa cartella (condivisa) all'interno di Drive.
* **spreadsheets:** Per popolare i risultati dello scouting esclusivamente all'interno di Google Sheets.
* **script.external_request:** Per comunicare in modo sicuro con le API di Gemini AI.

Tutte le chiavi API sono gestite tramite le "Proprietà dello script" (variabili d'ambiente) per garantire che non siano mai codificate o esposte nel frontend.

---

## Affidabilità e Caratteristiche Tecniche

### 1. Architettura Pipeline Multi-Stadio

Per ottimizzare l'accuratezza e i costi delle API, il sistema utilizza un flusso di esecuzione in 3 fasi:

* **Fase 1 (Scout):** Identifica i migliori acceleratori e i relativi metadati.
* **Fase 2 (Bulk Extract):** Esegue un'estrazione generale delle informazioni sulle startup dalle homepage degli acceleratori.
* **Fase 3 (Deep Analysis):** Un agente di "cleanup" mirato che visita i siti web delle singole startup per risolvere dati mancanti o errori di formattazione.

### 2. Idempotenza e Integrità dei Dati

Il sistema tratta l'**URL del sito web** come Chiave Primaria. Prima di ogni chiamata AI o inserimento di riga:

* Gli URL vengono **normalizzati** (rimozione protocolli/slash finali).
* Una ricerca tramite `Set` verifica le voci esistenti per prevenire duplicati e sprechi di crediti API.
* I riferimenti circolari (acceleratori che elencano se stessi come startup) vengono filtrati tramite guardie logiche.

### 3. Gestione del Traffico e Quota

Progettato per funzionare entro i limiti delle API (15 RPM):

* **Throttling:** Implementato un cooldown obbligatorio di 300 millisecondi tra le richieste (originariamente superiore, ridotto dopo il passaggio alle API a pagamento).
* **Impostazione Temperatura:** Temperatura impostata a 0.2 per limitare le allucinazioni.
* **Backoff Esponenziale:** Gestisce automaticamente gli errori **429 (Rate Limit)** con una finestra di ripristino di 60 secondi.

### 4. Logging Aziendale (Enterprise)

Invece di log su console volatili, il sistema mantiene un file `startup_scouter_logs.txt` persistente su **Google Drive**, fornendo una traccia di controllo completa delle risposte API e della salute del sistema.

---

## Istruzioni per l'uso

1. Apri il foglio Google **startupScout**: https://drive.google.com/drive/folders/1DvEDDQzUhoTZ9Gfu7356UvP7DPb8PrJQ, e cerca il documento google sheets. 
2. Individua il menu **"Startup Scouting AI"**.
3. **Passaggio 1:** Esegui "Scout Accelerators" per popolare la lista base.
4. **Passaggio 2:** Esegui "Update Startups" per estrarre i dati del portfolio.
5. **Passaggio 3:** Esegui "Generate Value Propositions" per finalizzare lo schema di branding:
* *Formato: "Startup [Nome] aiuta [Target] a fare [Azione] in modo che [Beneficio]."*


---

## Autore

**Gustavo Mafla**
gmaflaroca@gmail.com

*Contattami per richiedere l'accesso e l'utilizzo dei fogli Google già configurati.*

## Licenza

MIT

---
---


## AI Startup Scouting Agent

**MVP for automated Accelerator and Startup Scouting** *Built for Recuiting Procress - Paprika*

An intelligent automation system that scouts top-tier European accelerators, extracts portfolio data, and generates standardized value propositions using the **Gemini 2.5 Flash** model.

---

## Stack

* **Google Apps Script (V8 Engine):** Cloud-native execution environment.
* **Node.js & Clasp:** Local development workflow and version control.
* **Gemini AI API (Paid Tier):** Core LLM for data extraction and analysis.
* **Google Drive API:** Used for persistent system logging.
* **dotenv:** Local secret management.

---

## Installation & Setup

1. **Node.js:** Install from [nodejs.org](https://nodejs.org/).
2. **Clasp:** Install globally via `npm install -g @google/clasp`.
3. **Enable Apps Script API:** Visit [script.google.com/home/usersettings](https://script.google.com/home/usersettings) and set to **ON**.
4. **Authentication:** Run `clasp login` in your terminal.
5. **Environment:** * Create a `.claspignore` to prevent local test files and `node_modules` from pushing to the cloud.
* Set your `GEMINI_API_KEY` in the **Google Apps Script Project Settings** under "Script Properties."

---
## Security & Permissions

Upon first run, Google will prompt for authorization. This is standard for Apps Script projects using custom manifests. The project specifically requests:

- drive.file: Only to manage the startup_scouter_logs.txt file created by this app, housed in the same (shared) folder inside drive

- spreadsheets: To populate scouting results within GoogleSheets only.

- script.external_request: To securely communicate with the Gemini AI API.

All API keys are managed via Script Properties (Environment Variables) to ensure they are never hard-coded or exposed in the frontend.


---

## Engineering Reliability & Features

### 1. Multi-Stage Pipeline Architecture

To optimize for accuracy and API costs, the system uses a 3-step execution flow:

* **Stage 1 (Scout):** Identifies top accelerators and their metadata.
* **Stage 2 (Bulk Extract):** Performs broad-stroke extraction of startup information from accelerator homepages.
* **Stage 3 (Deep Analysis):** A surgical "cleanup" agent that visits individual startup websites to resolve missing data or formatting errors.

### 2. Idempotency & Data Integrity

The system treats the **Website URL** as a Primary Key. Before any AI call or row insertion:

* URLs are **normalized** (removing protocols/trailing slashes).
* A `Set` lookup checks for existing entries to prevent duplicates and wasted API credits.
* Self-references (accelerators listing themselves as startups) are filtered via logic-based guards.

### 3. Traffic Management & Quota Handling

Designed to work within strict API constraints (15 RPM):

* **Throttling:** Implemented a mandatory 300-millisecond cooldown between requests. Originally much higher, but after upgrading to paid API usage, reduced for ease of use
* **Temperature Setting:** Set temperature to 0.2 to limit hallucinations. 
* **Exponential Backoff:** Automatically handles **429 (Rate Limit)** errors with a 60-second recovery window.

### 4. Enterprise Logging

Rather than volatile console logs, the system maintains a persistent `startup_scouter_logs.txt` in **Google Drive**, providing a full audit trail of API responses and system health.

---

## 🚀 How to Use

1. Open the startupScout Google Sheet.
2. Locate the **"Startup Scouting AI"** menu.
3. **Step 1:** Run "Scout Accelerators" to populate the base list.
4. **Step 2:** Run "Update Startups" to crawl portfolio data.
5. **Step 3:** Run "Generate Value Propositions" to finalize the branding schema:
* *Format: "Startup [Name] helps [Target] do [Action] so that [Benefit]."*



---

## Author

Gustavo Mafla
gmaflaroca@gmail.com

* contact me to request access and usage of the ready-made Google Sheets.


## License 
MIT

