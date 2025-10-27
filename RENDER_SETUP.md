# Guida al Deployment su Render

Questa guida ti aiuterà a deployare il Partner Installation Portal su Render con GitHub integration.

## Prerequisiti

1. Account Render (https://render.com)
2. Repository GitHub: https://github.com/giuseppe1388/Partner-Installation-Portal
3. Database MySQL (Render o esterno)
4. API Keys:
   - Google Maps API Key
   - Salesforce Webhook URL

## Step 1: Preparare il Repository GitHub

✅ **Già completato**

Il codice è stato pushato su GitHub. Verifica che il repository sia visibile:
- https://github.com/giuseppe1388/Partner-Installation-Portal

## Step 2: Creare un Database MySQL su Render

### Opzione A: Usare Render MySQL Add-on

1. Vai su https://dashboard.render.com
2. Clicca "New +" → "MySQL"
3. Configura:
   - **Name**: `partner-portal-db`
   - **Database Name**: `partner_portal`
   - **User**: `partner_user`
   - **Plan**: Starter (o superiore)
4. Clicca "Create Database"
5. Copia la connection string (apparirà come `DATABASE_URL`)

### Opzione B: Usare MySQL Esterno

Se hai già un database MySQL:
- Usa la connection string: `mysql://user:password@host:port/database`
- Assicurati che il database sia accessibile da Render

## Step 3: Creare il Web Service su Render

1. Vai su https://dashboard.render.com
2. Clicca "New +" → "Web Service"
3. Seleziona il repository GitHub:
   - Clicca "Connect account" se necessario
   - Seleziona `Partner-Installation-Portal`
4. Configura il servizio:
   - **Name**: `partner-portal`
   - **Environment**: `Node`
   - **Region**: Scegli la regione più vicina
   - **Branch**: `master`
   - **Build Command**: `pnpm install && pnpm db:push`
   - **Start Command**: `pnpm start`
   - **Plan**: Starter (o superiore)

## Step 4: Configurare le Variabili di Ambiente

Nel Render Dashboard, vai a "Environment" e aggiungi:

### Database
```
DATABASE_URL=<connection_string_dal_step_2>
```

### Node.js
```
NODE_ENV=production
PORT=3000
```

### JWT
```
JWT_SECRET=<genera_una_chiave_sicura>
```

Puoi generare una chiave sicura con:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Manus OAuth (Richiesto per Admin)
```
VITE_APP_ID=<your_app_id>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=<your_owner_open_id>
OWNER_NAME=<your_name>
```

### App Branding
```
VITE_APP_TITLE=Partner Installation Portal
VITE_APP_LOGO=https://your-domain.com/logo.png
```

### Manus Built-in APIs
```
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=<your_api_key>
```

### Analytics (Opzionale)
```
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=<your_website_id>
```

### Google Maps API
```
GOOGLE_MAPS_API_KEY=<your_google_maps_api_key>
```

Ottieni la chiave da:
1. Vai su https://console.cloud.google.com/
2. Crea un nuovo progetto
3. Attiva "Distance Matrix API" e "Geocoding API"
4. Crea una chiave API (Credentials)
5. Copia la chiave

### Salesforce Webhook Configuration
```
SALESFORCE_WEBHOOK_URL=<your_salesforce_webhook_url>
```

Questo URL sarà configurato in Salesforce per ricevere gli aggiornamenti di schedulazione.

## Step 5: Deploy

1. Clicca "Create Web Service"
2. Render automaticamente:
   - Clona il repository
   - Installa le dipendenze
   - Esegue le migrazioni del database
   - Avvia il server
3. Aspetta che il deploy sia completato (2-5 minuti)
4. Copia l'URL del servizio (es. `https://partner-portal.onrender.com`)

## Step 6: Configurare Salesforce Webhook

Dopo il deploy, configura Salesforce per inviare webhook a:

```
https://partner-portal.onrender.com/api/webhook/salesforce
```

**Payload di esempio:**
```json
{
  "ServiceAppointmentId": "SA-001",
  "CustomerName": "Mario",
  "CustomerSurname": "Rossi",
  "CustomerCF": "RSSMRA80A01H501Z",
  "CustomerPhone": "+39 333 1234567",
  "CustomerEmail": "mario@example.com",
  "CustomerAddress": "Via Roma 10, 20100 Milano",
  "InstallationAddress": "Via Milano 5, 20100 Milano",
  "InstallationType": "Impianto Solare",
  "TechnicalNotes": "Installazione su tetto piano",
  "InstallerNotes": "Verificare accesso",
  "DurationMinutes": 120,
  "ScheduledStart": "2025-10-28T10:00:00Z",
  "ScheduledEnd": "2025-10-28T12:00:00Z"
}
```

## Step 7: Accedere all'Applicazione

### Admin Portal
- URL: `https://partner-portal.onrender.com/admin`
- Autenticazione: Manus OAuth

### Partner Portal
- URL: `https://partner-portal.onrender.com/partner`
- Username: `demo`
- Password: `demo123`

### Technician App
- URL: `https://partner-portal.onrender.com/technician`
- Username: `marco`
- Password: `tech123`

## Step 8: Monitoraggio e Logs

Nel Render Dashboard:
1. Clicca sul servizio `partner-portal`
2. Vai a "Logs" per vedere i log in tempo reale
3. Verifica che non ci siano errori

### Comandi Utili

```bash
# Visualizzare i log
# Nel Render Dashboard → Logs

# Riavviare il servizio
# Nel Render Dashboard → Manual Restart

# Visualizzare le variabili di ambiente
# Nel Render Dashboard → Environment
```

## Troubleshooting

### Errore: "Database not available"
- Verifica che `DATABASE_URL` sia configurato correttamente
- Assicurati che il database sia accessibile da Render
- Esegui manualmente le migrazioni:
  - Nel Render Dashboard, clicca "Shell"
  - Esegui: `pnpm db:push`

### Errore: "Cannot find module"
- Verifica che `pnpm install` sia stato eseguito
- Controlla i log di build nel Render Dashboard

### Webhook non ricevuti
- Verifica che Salesforce invii al corretto endpoint
- Controlla i log nel Render Dashboard
- Testa con: `curl -X POST https://partner-portal.onrender.com/api/webhook/test -H "Content-Type: application/json" -d '{"test": true}'`

### Applicazione lenta
- Verifica il piano Render (potrebbe essere necessario un upgrade)
- Controlla l'utilizzo di CPU/memoria nei log

## Aggiornamenti Futuri

Quando vuoi deployare nuovi aggiornamenti:

1. Fai i cambiamenti locali
2. Commit e push su GitHub:
   ```bash
   git add .
   git commit -m "Descrizione cambiamenti"
   git push github master
   ```
3. Render automaticamente:
   - Rileva il push
   - Esegue il build
   - Fa il deploy

## Backup e Disaster Recovery

### Backup del Database

Per Render MySQL:
1. Nel Render Dashboard, vai al database
2. Clicca "Backups"
3. Clicca "Create Backup"

Per database esterno:
- Usa gli strumenti nativi del tuo provider MySQL

### Ripristino

1. Esegui le migrazioni: `pnpm db:push`
2. I dati verranno ricreati dal database

## Supporto

Per problemi o domande:
1. Controlla i log nel Render Dashboard
2. Consulta la documentazione in `DOCUMENTAZIONE.md`
3. Testa i webhook con `test-webhook.sh`

## Prossimi Passi

Dopo il deploy:

1. **Configurare i Partner**
   - Accedi come admin
   - Vai in "Partner"
   - Crea i partner con i loro Salesforce Partner IDs

2. **Configurare le Squadre**
   - Vai in "Squadre"
   - Crea le squadre per ogni partner

3. **Configurare i Tecnici**
   - Vai in "Tecnici"
   - Crea i tecnici con le loro credenziali

4. **Testare il Flusso**
   - Invia un webhook di test da Salesforce
   - Accedi come partner e schedula un'installazione
   - Verifica che il webhook di schedulazione arrivi a Salesforce

Buon deployment! 🚀

