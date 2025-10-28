# Integrazione Salesforce - Partner Installation Portal

Questo documento descrive come integrare il Partner Installation Portal con Salesforce utilizzando il Salesforce Webhook Bridge.

## Architettura di Integrazione

```
┌─────────────────────────────────┐
│  Salesforce                     │
│  (Service Appointment)          │
└──────────┬──────────────────────┘
           │
           │ Webhook (quando cambiano i dati)
           │
┌──────────▼──────────────────────┐
│  Salesforce Webhook Bridge      │
│  (Riceve e trasforma dati)      │
└──────────┬──────────────────────┘
           │
           │ POST /api/webhook/salesforce
           │
┌──────────▼──────────────────────────────────┐
│  Partner Installation Portal                │
│  - Riceve Service Appointment               │
│  - Crea installazione                       │
│  - Schedula con partner                     │
│  - Invia aggiornamenti a Salesforce         │
└─────────────────────────────────────────────┘
```

## Flusso di Dati Bidirezzionale

### 1. Salesforce → Partner Portal (Ricezione)

**Trigger:** Nuovo Service Appointment creato in Salesforce

**Dati ricevuti:**
```json
{
  "ServiceAppointmentId": "SA-001",
  "CustomerName": "Mario",
  "CustomerPhone": "+39 333 1234567",
  "CustomerEmail": "mario@example.com",
  "CustomerAddress": "Via Roma 10, 20100 Milano",
  "CustomerCF": "RSSMRA80A01H501Z",
  "InstallationAddress": "Via Milano 5, 20100 Milano",
  "InstallationType": "Impianto Solare",
  "TechnicalNotes": "Installazione su tetto piano",
  "InstallerNotes": "Verificare accesso",
  "DurationMinutes": 120,
  "ScheduledStart": "2025-10-28T10:00:00Z",
  "ScheduledEnd": "2025-10-28T12:00:00Z",
  "Status": "Scheduled",
  "Territory": "Milano"
}
```

**Elaborazione:**
1. Partner Portal riceve il webhook su POST `/api/webhook/salesforce`
2. Crea una nuova installazione con status `pending`
3. Partner vede l'installazione nella lista "Da Schedulare"

### 2. Partner Portal → Salesforce (Invio)

**Trigger 1: Accettazione Incarico**
```json
{
  "eventType": "acceptance",
  "ServiceAppointmentId": "SA-001",
  "Status": "Accepted"
}
```

**Trigger 2: Schedulazione**
```json
{
  "eventType": "schedule",
  "ServiceAppointmentId": "SA-001",
  "StartDateTime": "2025-10-28T10:00:00Z",
  "EndDateTime": "2025-10-28T12:00:00Z"
}
```

**Trigger 3: Rifiuto Incarico**
```json
{
  "eventType": "rejection",
  "ServiceAppointmentId": "SA-001",
  "Status": "Rejected",
  "RejectionReason": "Motivo del rifiuto"
}
```

**Trigger 4: Cancellazione**
```json
{
  "eventType": "cancellation",
  "ServiceAppointmentId": "SA-001",
  "Status": "Cancelled"
}
```

## Configurazione del Connettore Salesforce

### Connettore da Creare: "Partner Installation Portal"

**Tipo:** Webhook Receiver + Salesforce Integration

**Slug:** `partner-installation-portal`

### Step 1: Creare il Webhook Endpoint nel Bridge

Nel Salesforce Webhook Bridge, crea un nuovo endpoint:

```
Nome: Partner Installation Portal
Slug: partner-installation-portal
Descrizione: Riceve Service Appointment da Salesforce e li sincronizza con il Partner Portal
URL Destinazione: https://your-partner-portal.com/api/webhook/salesforce
```

### Step 2: Configurare le Mappature

Crea le seguenti mappature nel Bridge:

#### Mappatura 1: Crea Service Appointment (Salesforce → Partner Portal)

| Campo | Valore |
|-------|--------|
| Nome | Crea Service Appointment |
| Oggetto Salesforce | ServiceAppointment |
| Operazione | CREATE |
| Condizione | Quando il campo `Status` = "Scheduled" |

**Field Mappings:**
```json
{
  "ServiceAppointmentId": "Id",
  "CustomerName": "ParentRecord.Name",
  "CustomerPhone": "ParentRecord.Phone",
  "CustomerEmail": "Contact.Email",
  "CustomerAddress": "ParentRecord.BillingStreet",
  "CustomerCF": "ParentRecord.CustomerCF__c",
  "InstallationAddress": "Address",
  "InstallationType": "ServiceType",
  "TechnicalNotes": "Description",
  "InstallerNotes": "Notes",
  "DurationMinutes": "DurationInMinutes",
  "ScheduledStart": "SchedStartTime",
  "ScheduledEnd": "SchedEndTime",
  "Status": "Status",
  "Territory": "Territory"
}
```

#### Mappatura 2: Aggiorna Service Appointment (Salesforce → Partner Portal)

| Campo | Valore |
|-------|--------|
| Nome | Aggiorna Service Appointment |
| Oggetto Salesforce | ServiceAppointment |
| Operazione | UPDATE |
| Condizione | Quando il campo `Status` cambia |

**Field Mappings:** (stesso come Mappatura 1)

### Step 3: Configurare Salesforce per Inviare Webhook

In Salesforce, configura un Flow o Apex Trigger per inviare webhook quando:

1. **Nuovo Service Appointment creato**
   - Trigger: Service Appointment creato
   - Azione: Invia HTTP POST a `https://bridge.your-domain.com/api/webhook/partner-installation-portal`

2. **Service Appointment aggiornato**
   - Trigger: Service Appointment aggiornato
   - Azione: Invia HTTP POST con i dati aggiornati

**Payload di esempio da Salesforce:**
```json
{
  "timestamp": "2025-10-28T10:30:00Z",
  "eventType": "serviceappointment.created",
  "source": "salesforce",
  "data": {
    "ServiceAppointmentId": "SA-001",
    "CustomerName": "Mario",
    "CustomerPhone": "+39 333 1234567",
    "CustomerEmail": "mario@example.com",
    "CustomerAddress": "Via Roma 10, 20100 Milano",
    "CustomerCF": "RSSMRA80A01H501Z",
    "InstallationAddress": "Via Milano 5, 20100 Milano",
    "InstallationType": "Impianto Solare",
    "TechnicalNotes": "Installazione su tetto piano",
    "InstallerNotes": "Verificare accesso",
    "DurationMinutes": 120,
    "ScheduledStart": "2025-10-28T10:00:00Z",
    "ScheduledEnd": "2025-10-28T12:00:00Z",
    "Status": "Scheduled",
    "Territory": "Milano"
  },
  "metadata": {
    "correlationId": "uuid-12345"
  }
}
```

## Configurazione nel Partner Portal

### 1. Aggiungere le Variabili di Ambiente

Nel file `.env` o nelle impostazioni di Render, aggiungi:

```
SALESFORCE_WEBHOOK_URL=https://bridge.your-domain.com/api/webhook/partner-installation-portal
SALESFORCE_INSTANCE_URL=https://your-instance.salesforce.com
SALESFORCE_CLIENT_ID=your-client-id
SALESFORCE_CLIENT_SECRET=your-client-secret
SALESFORCE_USERNAME=your-salesforce-username
SALESFORCE_PASSWORD=your-salesforce-password
```

### 2. Configurare il Webhook di Ricezione

L'endpoint è già implementato in `server/webhook.ts`:

```typescript
POST /api/webhook/salesforce
```

Questo endpoint:
1. Riceve i dati del Service Appointment
2. Crea o aggiorna l'installazione nel database
3. Assegna il partner e la squadra corretti
4. Notifica il partner della nuova installazione

### 3. Configurare gli Webhook di Invio

Gli endpoint di invio sono già implementati in `server/salesforceWebhook.ts`:

```typescript
// Invia accettazione a Salesforce
sendAcceptanceToSalesforce(installationId, salesforceWebhookUrl)

// Invia schedulazione a Salesforce
sendScheduleToSalesforce(installationId, salesforceWebhookUrl)

// Invia rifiuto a Salesforce
sendRejectionToSalesforce(installationId, rejectionReason, salesforceWebhookUrl)

// Invia cancellazione a Salesforce
sendCancellationToSalesforce(installationId, salesforceWebhookUrl)
```

## Mappatura Salesforce → Partner Portal

### Oggetti Salesforce Utilizzati

#### ServiceAppointment (Appuntamento di Servizio)

| Campo Label | Nome API | Mappatura Partner Portal | Tipo | Note |
|-------------|----------|-------------------------|------|------|
| ID Appuntamento di servizio | Id | ServiceAppointmentId | Text | Identificatore univoco |
| Data/ora inizio pianificata | SchedStartTime | ScheduledStart | DateTime | Data/ora inizio |
| Data/ora fine pianificata | SchedEndTime | ScheduledEnd | DateTime | Data/ora fine |
| Durata (minuti) | DurationInMinutes | DurationMinutes | Number | Durata stimata |
| Indirizzo | Address | InstallationAddress | Text | Indirizzo installazione |
| Descrizione | Description | TechnicalNotes | Text | Note tecniche |
| Note | Notes | InstallerNotes | Text | Note installatori |
| Stato | Status | Status | Picklist | Stato appuntamento |
| Tipo di servizio | ServiceType | InstallationType | Text | Tipo di servizio |
| Territorio | Territory | Territory | Text | Territorio |
| Contatto | ContactId | ContactId | Lookup | Contatto cliente |
| Account | ParentRecordId | AccountId | Lookup | Account cliente |

#### Account (Cliente)

| Campo Label | Nome API | Mappatura Partner Portal | Tipo | Note |
|-------------|----------|-------------------------|------|------|
| Nome | Name | CustomerName | Text | Nome cliente |
| Telefono | Phone | CustomerPhone | Phone | Telefono cliente |
| Indirizzo fatturazione | BillingStreet | CustomerAddress | Text | Indirizzo cliente |
| Codice Fiscale | CustomerCF__c | CustomerCF | Text | Codice fiscale (custom field) |
| Città | BillingCity | City | Text | Città |
| Provincia | BillingStateCode | Province | Text | Provincia |
| CAP | BillingPostalCode | PostalCode | Text | Codice postale |
| Paese | BillingCountry | Country | Text | Paese |

#### Contact (Contatto)

| Campo Label | Nome API | Mappatura Partner Portal | Tipo | Note |
|-------------|----------|-------------------------|------|------|
| Email | Email | CustomerEmail | Email | Email cliente |
| Telefono | Phone | CustomerPhone | Phone | Telefono cliente |
| Nome | FirstName | CustomerFirstName | Text | Nome contatto |
| Cognome | LastName | CustomerLastName | Text | Cognome contatto |

### Custom Fields Richiesti in Salesforce

Crea i seguenti custom fields in Salesforce:

1. **Account.CustomerCF__c**
   - Tipo: Text
   - Lunghezza: 16
   - Descrizione: Codice fiscale cliente

2. **ServiceAppointment.Type__c** (opzionale, se non usi ServiceType)
   - Tipo: Picklist
   - Valori: Impianto Solare, Impianto Eolico, Batteria, etc.
   - Descrizione: Tipo di installazione

## Testing dell'Integrazione

### Test 1: Webhook di Ricezione

```bash
curl -X POST https://your-partner-portal.com/api/webhook/salesforce \
  -H "Content-Type: application/json" \
  -d '{
    "ServiceAppointmentId": "SA-TEST-001",
    "CustomerName": "Mario",
    "CustomerPhone": "+39 333 1234567",
    "CustomerEmail": "mario@example.com",
    "CustomerAddress": "Via Roma 10, 20100 Milano",
    "CustomerCF": "RSSMRA80A01H501Z",
    "InstallationAddress": "Via Milano 5, 20100 Milano",
    "InstallationType": "Impianto Solare",
    "TechnicalNotes": "Test",
    "InstallerNotes": "Test",
    "DurationMinutes": 120,
    "ScheduledStart": "2025-10-28T10:00:00Z",
    "ScheduledEnd": "2025-10-28T12:00:00Z",
    "Status": "Scheduled",
    "Territory": "Milano"
  }'
```

**Risposta attesa:**
```json
{
  "success": true,
  "message": "Installation created/updated successfully",
  "installationId": 1
}
```

### Test 2: Webhook di Invio (Accettazione)

Accedi come partner e accetta un'installazione. Il sistema dovrebbe inviare un webhook a Salesforce:

```json
{
  "eventType": "acceptance",
  "ServiceAppointmentId": "SA-001",
  "Status": "Accepted"
}
```

## Troubleshooting

### Problema: Webhook non ricevuto

**Soluzione:**
1. Verificare che l'endpoint sia raggiungibile: `curl https://your-partner-portal.com/api/webhook/salesforce`
2. Verificare i log del server: `[Webhook] Received webhook...`
3. Verificare che Salesforce possa raggiungere l'URL (firewall/CORS)

### Problema: Dati non sincronizzati

**Soluzione:**
1. Verificare la mappatura dei campi nel Bridge
2. Verificare che i custom fields in Salesforce siano corretti
3. Controllare i log del Bridge per errori di trasformazione

### Problema: Webhook di invio non funziona

**Soluzione:**
1. Verificare che `SALESFORCE_WEBHOOK_URL` sia configurato
2. Verificare i log: `[SalesforceWebhook] Sending payload...`
3. Verificare che l'endpoint Salesforce sia raggiungibile

## Monitoraggio

### Log del Partner Portal

```bash
# Webhook ricevuti
grep "\[Webhook\]" /var/log/partner-portal.log

# Webhook inviati a Salesforce
grep "\[SalesforceWebhook\]" /var/log/partner-portal.log
```

### Dashboard Salesforce Webhook Bridge

Accedi al Bridge per visualizzare:
- Webhook ricevuti
- Mappature applicate
- Errori e retry
- Statistiche di sincronizzazione

## Prossimi Passi

1. **Creare il Connettore nel Bridge**
   - Accedi al Salesforce Webhook Bridge
   - Crea un nuovo endpoint con slug `partner-installation-portal`
   - Configura le mappature

2. **Configurare Salesforce**
   - Crea i custom fields richiesti
   - Configura il Flow per inviare webhook

3. **Testare l'Integrazione**
   - Usa i test curl forniti
   - Verifica i log
   - Testa il flusso completo

4. **Monitorare la Sincronizzazione**
   - Controlla i log del Portal
   - Verifica i dati in Salesforce
   - Monitora le performance

## Supporto

Per problemi o domande:
1. Consulta la documentazione del Salesforce Webhook Bridge
2. Controlla i log del Partner Portal
3. Verifica la configurazione delle variabili di ambiente
4. Contatta il team di supporto

---

**Data:** 28 Ottobre 2025
**Versione:** 1.0
**Ultimo Aggiornamento:** 28 Ottobre 2025

