# Partner Installation Portal

Un sistema completo di gestione delle installazioni con integrazione Salesforce, portale partner per la schedulazione e app mobile per i tecnici.

## Caratteristiche Principali

### Portale Partner
- **Planner Gantt-style**: Visualizzazione timeline multi-squadra con drag-and-drop
- **Snapping a 15 minuti**: Allineamento automatico degli slot temporali
- **Gestione Installazioni**: Tabella con ricerca, filtro e modifica stato
- **Workflow Accettazione/Rifiuto**: Accetta o rifiuta incarichi con note obbligatorie
- **Integrazione Google Maps**: Pulsanti per navigazione e calcolo distanze
- **Responsive Design**: Funziona su desktop, tablet e smartphone

### App Mobile Tecnici
- **Lista Interventi**: Visualizzazione ordinata per ora
- **Dettagli Completi**: Dati cliente, indirizzo, note tecniche
- **Navigazione**: Google Maps, Waze e link per caricamento documenti
- **Aggiornamento Stato**: Inizia Lavoro e Completa intervento
- **Persistenza Sessione**: Login persiste dopo refresh

### Integrazione Salesforce
- **Webhook in Ingresso**: Ricezione installazioni da Salesforce
- **Webhook in Uscita**: Invio schedulazioni, accettazioni, rifiuti, cancellazioni
- **EventType**: Tutti i webhook includono eventType per Make automation
- **Sincronizzazione Bidirezzionale**: Dati sempre sincronizzati

## Stack Tecnologico

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + tRPC
- **Database**: MySQL + Drizzle ORM
- **Autenticazione**: JWT per partner/tecnici, OAuth per admin
- **API**: Google Maps API, Salesforce Webhooks

## Installazione Locale

### Prerequisiti
- Node.js 22+
- pnpm (package manager)
- MySQL 8+

### Setup

1. **Clonare il repository**
   ```bash
   git clone <your-repo-url>
   cd partner_portal
   ```

2. **Installare dipendenze**
   ```bash
   pnpm install
   ```

3. **Configurare il database**
   ```bash
   # Creare un file .env locale con DATABASE_URL
   # Esempio: mysql://user:password@localhost:3306/partner_portal
   
   # Eseguire le migrazioni
   pnpm db:push
   ```

4. **Configurare le variabili di ambiente**
   - Copiare `.env.example` in `.env`
   - Aggiungere le chiavi API (Google Maps, Salesforce)
   - Impostare JWT_SECRET

5. **Avviare il server di sviluppo**
   ```bash
   pnpm dev
   ```

6. **Accedere all'applicazione**
   - Admin: http://localhost:3000/admin (OAuth Manus)
   - Partner: http://localhost:3000/partner
     - Username: `demo`
     - Password: `demo123`
   - Tecnico: http://localhost:3000/technician
     - Username: `marco`
     - Password: `tech123`

## Deployment su Render

### Prerequisiti
- Account GitHub con il repository
- Account Render
- MySQL database (Render o esterno)

### Passaggi di Deployment

1. **Preparare il repository**
   ```bash
   # Assicurarsi che il codice sia pushato su GitHub
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Creare un nuovo servizio su Render**
   - Andare su https://dashboard.render.com
   - Cliccare "New +" → "Web Service"
   - Selezionare il repository GitHub
   - Configurare le impostazioni:
     - **Name**: partner-portal
     - **Environment**: Node
     - **Build Command**: `pnpm install && pnpm db:push`
     - **Start Command**: `pnpm start`
     - **Plan**: Starter (o superiore)

3. **Configurare le variabili di ambiente**
   In Render Dashboard → Environment:
   ```
   DATABASE_URL=mysql://user:password@host:3306/partner_portal
   NODE_ENV=production
   JWT_SECRET=<generate-secure-key>
   VITE_APP_ID=<your-app-id>
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://portal.manus.im
   OWNER_OPEN_ID=<your-owner-id>
   OWNER_NAME=<your-name>
   VITE_APP_TITLE=Partner Installation Portal
   VITE_APP_LOGO=<your-logo-url>
   BUILT_IN_FORGE_API_URL=https://api.manus.im
   BUILT_IN_FORGE_API_KEY=<your-api-key>
   GOOGLE_MAPS_API_KEY=<your-google-maps-key>
   SALESFORCE_WEBHOOK_URL=<your-salesforce-webhook-url>
   ```

4. **Configurare il database**
   - Se usi Render PostgreSQL: aggiungere il database add-on
   - Se usi MySQL esterno: inserire la connection string in DATABASE_URL

5. **Deploy**
   - Cliccare "Create Web Service"
   - Render automaticamente farà il build e il deploy
   - Accedere all'applicazione tramite il link fornito da Render

## Webhook Salesforce

### Endpoint di Ricezione
```
POST /api/webhook/salesforce
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

### Endpoint di Cancellazione
```
POST /api/webhook/salesforce/delete
```

**Payload:**
```json
{
  "ServiceAppointmentId": "SA-001"
}
```

### Webhook in Uscita (Schedulazione)
Quando il partner schedula un'installazione, il sistema invia:

```json
{
  "eventType": "schedule",
  "ServiceAppointmentId": "SA-001",
  "StartDateTime": "2025-10-28T10:00:00Z",
  "EndDateTime": "2025-10-28T12:00:00Z"
}
```

### Webhook in Uscita (Accettazione)
```json
{
  "eventType": "acceptance",
  "ServiceAppointmentId": "SA-001",
  "Status": "Accepted"
}
```

### Webhook in Uscita (Rifiuto)
```json
{
  "eventType": "rejection",
  "ServiceAppointmentId": "SA-001",
  "Status": "Rejected",
  "RejectionReason": "Motivo del rifiuto"
}
```

### Webhook in Uscita (Cancellazione)
```json
{
  "eventType": "cancellation",
  "ServiceAppointmentId": "SA-001",
  "Status": "Cancelled"
}
```

## Configurazione Iniziale

### 1. Creare Partner
1. Accedere come admin
2. Andare in "Partner"
3. Cliccare "Aggiungi Partner"
4. Inserire:
   - Nome partner
   - Email
   - Telefono
   - Indirizzo di partenza (per calcolo distanze)
   - Username e password per login partner
   - Salesforce Partner ID

### 2. Creare Squadre
1. Andare in "Squadre"
2. Cliccare "Aggiungi Squadra"
3. Inserire:
   - Nome squadra
   - Descrizione
   - Salesforce Team ID
   - Selezionare il partner

### 3. Creare Tecnici
1. Andare in "Tecnici"
2. Cliccare "Aggiungi Tecnico"
3. Inserire:
   - Nome tecnico
   - Email
   - Telefono
   - Username e password per login
   - Selezionare squadra e partner

### 4. Configurare API
1. Andare in "Configurazione API"
2. Inserire:
   - Google Maps API Key
   - Salesforce Webhook URL

## Struttura del Progetto

```
partner_portal/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Pagine (Admin, Partner, Technician)
│   │   ├── components/       # Componenti riutilizzabili
│   │   ├── contexts/         # React contexts
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utility e configurazioni
│   │   └── App.tsx           # Router principale
│   └── public/               # Asset statici
├── server/                    # Backend Node.js
│   ├── db.ts                 # Query helper database
│   ├── routers.ts            # Procedure tRPC
│   ├── webhook.ts            # Endpoint webhook
│   ├── salesforceWebhook.ts  # Funzioni webhook Salesforce
│   ├── googleMaps.ts         # Integrazione Google Maps
│   └── _core/                # Framework core
├── drizzle/                   # Schema e migrazioni database
│   └── schema.ts             # Definizione tabelle
├── test-webhook.sh           # Script di test webhook
└── README.md                 # Questo file
```

## Comandi Utili

```bash
# Sviluppo
pnpm dev              # Avviare server di sviluppo

# Database
pnpm db:push          # Eseguire migrazioni
pnpm db:studio        # Aprire Drizzle Studio

# Build
pnpm build            # Build per produzione
pnpm start            # Avviare server produzione

# Test
bash test-webhook.sh  # Testare webhook localmente
```

## Troubleshooting

### Errore: "Database not available"
- Verificare che DATABASE_URL è configurato correttamente
- Verificare che il database MySQL è in esecuzione
- Eseguire `pnpm db:push` per creare le tabelle

### Errore: "Salesforce webhook URL not configured"
- Andare in Admin → Configurazione API
- Inserire il Salesforce Webhook URL

### Errore: "Google Maps API key not configured"
- Andare in Admin → Configurazione API
- Inserire il Google Maps API Key

### Webhook non ricevuti
- Verificare che il server è in esecuzione
- Verificare che Salesforce può raggiungere l'URL del webhook
- Controllare i log del server per errori

## Supporto e Documentazione

Per ulteriori informazioni:
- Consultare `DOCUMENTAZIONE.md` per dettagli tecnici
- Controllare i log del server per errori
- Testare i webhook con `test-webhook.sh`

## Licenza

Proprietario: [Your Company Name]

