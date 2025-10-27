# Partner Installation Portal - Documentazione

## Panoramica

Il **Partner Installation Portal** è un'applicazione web full-stack che integra Salesforce per gestire le installazioni dei partner. Il portale permette agli amministratori di configurare partner e squadre, mentre i partner possono schedulare le installazioni tramite un planner drag-and-drop con calcolo automatico del tempo di viaggio.

## Architettura

### Stack Tecnologico

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + tRPC
- **Database**: MySQL/TiDB (via Drizzle ORM)
- **Autenticazione Admin**: Manus OAuth
- **Autenticazione Partner**: Username/Password (bcrypt)
- **Integrazioni**: Salesforce (webhook), Google Maps API

### Struttura del Database

#### Tabella `partners`
Memorizza i dati dei partner con mappatura Salesforce.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | int | ID univoco del partner |
| `salesforcePartnerId` | varchar | ID del partner in Salesforce |
| `name` | varchar | Nome azienda partner |
| `email` | varchar | Email di contatto |
| `phone` | varchar | Telefono di contatto |
| `startingAddress` | text | Indirizzo di partenza per calcolo tempo di viaggio |
| `username` | varchar | Username per login |
| `passwordHash` | text | Password hashata (bcrypt) |
| `isActive` | boolean | Stato attivo/inattivo |

#### Tabella `teams`
Memorizza le squadre di installazione con mappatura Salesforce.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | int | ID univoco della squadra |
| `salesforceTeamId` | varchar | ID della squadra in Salesforce |
| `partnerId` | int | ID del partner proprietario |
| `name` | varchar | Nome della squadra |
| `description` | text | Descrizione della squadra |
| `isActive` | boolean | Stato attivo/inattivo |

#### Tabella `installations`
Memorizza le installazioni ricevute da Salesforce.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | int | ID univoco dell'installazione |
| `serviceAppointmentId` | varchar | ID Service Appointment Salesforce |
| `customerName` | varchar | Nome del cliente |
| `customerCF` | varchar | Codice fiscale del cliente |
| `customerPhone` | varchar | Telefono del cliente |
| `customerEmail` | varchar | Email del cliente |
| `customerAddress` | text | Indirizzo di residenza |
| `installationAddress` | text | Indirizzo di installazione |
| `customerSurname` | varchar | Cognome del cliente |
| `installationType` | varchar | Tipo di installazione (es. Impianto Solare) |
| `technicalNotes` | text | Note tecniche |
| `installerNotes` | text | Note installatori |
| `imagesToView` | text | JSON array di URL immagini |
| `completionLink` | text | Link a Digital Experience Salesforce |
| `pdfUrl` | text | URL PDF allegato |
| `durationMinutes` | int | Durata stimata in minuti |
| `travelTimeMinutes` | int | Tempo di viaggio calcolato (Google Maps) |
| `status` | enum | pending, accepted, scheduled, in_progress, completed, cancelled, rejected |
| `rejectionReason` | text | Motivo del rifiuto (se rejected) |
| `acceptedAt` | datetime | Data/ora accettazione |
| `teamId` | int | ID squadra assegnata |
| `partnerId` | int | ID partner assegnato |
| `scheduledStart` | datetime | Data/ora inizio schedulata |
| `scheduledEnd` | datetime | Data/ora fine schedulata |

#### Tabella `apiConfig`
Memorizza le configurazioni API.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | int | ID univoco |
| `configKey` | varchar | Chiave configurazione |
| `configValue` | text | Valore configurazione |
| `description` | text | Descrizione |

## Flusso di Integrazione Salesforce

### 1. Webhook in Ingresso (Salesforce → Portale)

**Endpoint**: `POST /api/webhook/salesforce`

**Payload JSON**:
```json
{
  "ServiceAppointmentId": "SA-001",
  "CustomerName": "Mario Rossi",
  "CustomerCF": "RSSMRA80A01H501U",
  "CustomerPhone": "+39 123 456 7890",
  "CustomerEmail": "mario.rossi@example.com",
  "CustomerAddress": "Via Roma 1, Milano, 20100",
  "InstallationAddress": "Via Verdi 10, Milano, 20121",
  "TechnicalNotes": "Installazione standard",
  "ImagesToView": ["https://example.com/img1.jpg"],
  "CompletionLink": "https://salesforce.com/completion/SA-001",
  "DurationMinutes": 120
}
```

**Comportamento**:
- Se `ServiceAppointmentId` esiste, aggiorna l'installazione
- Altrimenti, crea una nuova installazione con stato `pending`

### 2. Webhook in Uscita - Schedulazione (Portale → Salesforce)

**Trigger**: Quando un partner schedula un'installazione

**Payload JSON**:
```json
{
  "eventType": "schedule",
  "ServiceAppointmentId": "SA-001",
  "StartDateTime": "2025-10-26T09:00:00Z",
  "EndDateTime": "2025-10-26T11:00:00Z"
}
```

### 3. Webhook in Uscita - Accettazione (Portale → Salesforce)

**Trigger**: Quando un partner accetta un incarico

**Payload JSON**:
```json
{
  "eventType": "acceptance",
  "ServiceAppointmentId": "SA-001",
  "Status": "Accepted"
}
```

### 4. Webhook in Uscita - Rifiuto (Portale → Salesforce)

**Trigger**: Quando un partner rifiuta un incarico

**Payload JSON**:
```json
{
  "eventType": "rejection",
  "ServiceAppointmentId": "SA-001",
  "Status": "Rejected",
  "RejectionReason": "Motivo del rifiuto"
}
```

### 5. Webhook in Uscita - Cancellazione (Portale → Salesforce)

**Trigger**: Quando un partner cancella una schedulazione

**Payload JSON**:
```json
{
  "eventType": "cancellation",
  "ServiceAppointmentId": "SA-001",
  "Status": "Cancelled"
}
```

**URL**: Configurabile dall'interfaccia admin in **Configurazione → Salesforce Webhook URL**

## Interfaccia Admin

### Accesso
- URL: `/admin/partners` (o qualsiasi rotta `/admin/*`)
- Autenticazione: Manus OAuth (solo utenti con ruolo `admin`)

### Funzionalità

#### Gestione Partner
- **Crea Partner**: Inserisci nome, Salesforce Partner ID, username, password, indirizzo di partenza
- **Modifica Partner**: Aggiorna dati (password opzionale)
- **Elimina Partner**: Rimuovi partner dal sistema
- **Visualizza Partner**: Lista completa con stato attivo/inattivo

#### Gestione Squadre
- **Crea Squadra**: Associa squadra a un partner con Salesforce Team ID
- **Modifica Squadra**: Aggiorna nome, descrizione, partner
- **Elimina Squadra**: Rimuovi squadra
- **Visualizza Squadre**: Lista completa con partner associato

#### Visualizzazione Installazioni
- Monitora tutte le installazioni ricevute da Salesforce
- Visualizza stato (pending, scheduled, in_progress, completed, cancelled)
- Vedi partner e squadra assegnati

#### Configurazione API
- **Google Maps API Key**: Inserisci chiave per calcolo tempo di viaggio
- **Salesforce Webhook URL**: Configura endpoint per invio schedulazioni
- **Webhook Endpoint (in ingresso)**: Copia URL per configurare Salesforce

## Interfaccia Partner

### Accesso
- URL: `/partner`
- Autenticazione: Username/Password (creati dall'admin)

### Funzionalità

#### Dashboard
- **Installazioni in Attesa**: Lista installazioni da schedulare (sidebar sinistra)
- **Planner Calendario**: Calendario settimanale con drag-and-drop
- **Squadre**: Visualizzazione squadre disponibili

#### Schedulazione
1. **Drag-and-Drop**: Trascina un'installazione dalla sidebar al calendario
2. **Click su Installazione**: Apri dialog di schedulazione
3. **Seleziona Squadra**: Scegli la squadra da assegnare
4. **Conferma**: Il sistema:
   - Calcola il tempo di viaggio (Google Maps)
   - Aggiorna lo stato a `scheduled`
   - Invia webhook a Salesforce con i dati

#### Visualizzazione
- **Eventi Schedulati**: Visualizza installazioni già schedulate nel calendario
- **Dettagli Cliente**: Nome, indirizzo, durata stimata
- **Tempo di Viaggio**: Calcolato automaticamente da Google Maps

## Configurazione Iniziale

### 1. Accesso Admin
1. Accedi con Manus OAuth (l'owner del progetto è automaticamente admin)
2. Vai su `/admin/settings`

### 2. Configurazione API
1. **Google Maps API Key**:
   - Vai su [Google Cloud Console](https://console.cloud.google.com/)
   - Attiva "Distance Matrix API" e "Geocoding API"
   - Copia la chiave API
   - Incolla in "Configurazione → Google Maps API Key"

2. **Salesforce Webhook URL**:
   - Configura l'endpoint Salesforce che riceverà le schedulazioni
   - Incolla l'URL in "Configurazione → Salesforce Webhook URL"

3. **Webhook Endpoint (in ingresso)**:
   - Copia l'URL mostrato in "Configurazione"
   - Configura Salesforce per inviare webhook a questo URL

### 3. Creazione Partner
1. Vai su `/admin/partners`
2. Click "Nuovo Partner"
3. Compila:
   - **Salesforce Partner ID**: ID del partner in Salesforce
   - **Nome**: Nome azienda
   - **Email/Telefono**: Contatti
   - **Indirizzo di Partenza**: Per calcolo tempo di viaggio
   - **Username/Password**: Credenziali di accesso

### 4. Creazione Squadre
1. Vai su `/admin/teams`
2. Click "Nuova Squadra"
3. Compila:
   - **Salesforce Team ID**: ID della squadra in Salesforce
   - **Partner**: Seleziona il partner
   - **Nome**: Nome squadra (es. "Squadra 1")
   - **Descrizione**: Opzionale

### 5. Test Webhook (Salesforce → Portale)
Invia un POST a `/api/webhook/salesforce` con il payload di esempio sopra.

## API Endpoints

### Webhook
- `POST /api/webhook/salesforce` - Ricevi dati installazione da Salesforce
- `POST /api/webhook/test` - Test endpoint webhook

### tRPC (Admin)
- `partners.list` - Lista partner
- `partners.create` - Crea partner
- `partners.update` - Aggiorna partner
- `partners.delete` - Elimina partner
- `teams.list` - Lista squadre
- `teams.create` - Crea squadra
- `teams.update` - Aggiorna squadra
- `teams.delete` - Elimina squadra
- `apiConfig.list` - Lista configurazioni API
- `apiConfig.set` - Imposta configurazione API
- `installations.list` - Lista installazioni

### tRPC (Partner)
- `partner.login` - Login partner
- `partner.myInstallations` - Installazioni del partner
- `partner.myTeams` - Squadre del partner
- `partner.scheduleInstallation` - Schedula installazione

## Sicurezza

- **Admin**: Autenticazione OAuth + controllo ruolo `admin`
- **Partner**: Password hashate con bcrypt (10 rounds)
- **API Keys**: Memorizzate nel database (non in variabili d'ambiente)
- **Webhook**: Nessuna autenticazione (configurare firewall/IP whitelist se necessario)

## Deployment

1. Configura le variabili d'ambiente di sistema (già gestite da Manus)
2. Esegui `pnpm db:push` per creare le tabelle
3. Accedi come admin e configura le API
4. Crea partner e squadre
5. Configura Salesforce per inviare webhook

## Troubleshooting

### Webhook non ricevuto
- Verifica che Salesforce invii al corretto endpoint
- Controlla i log del server: `[Webhook] Created installation: ...`

### Tempo di viaggio non calcolato
- Verifica che Google Maps API Key sia configurata
- Controlla che il partner abbia un indirizzo di partenza
- Verifica i log: `[GoogleMaps] ...`

### Webhook a Salesforce non inviato
- Verifica che Salesforce Webhook URL sia configurato
- Controlla i log: `[SalesforceWebhook] Sending payload to Salesforce: ...`

### Partner non può fare login
- Verifica che il partner sia attivo (`isActive = true`)
- Controlla username/password corretti
- Verifica che il partner esista nel database

