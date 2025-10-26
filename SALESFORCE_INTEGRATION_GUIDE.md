# Guida Integrazione Salesforce - Partner Installation Portal

## Panoramica

Il **Partner Installation Portal** è integrato con Salesforce tramite webhook. Quando gli stati degli appuntamenti cambiano, il sistema invia automaticamente i dati aggiornati a Salesforce.

## Configurazione

### 1. Configurare l'URL del Webhook in Salesforce

Per collegare il portal a Salesforce, è necessario configurare l'URL del webhook nel database del portal.

**Passo 1**: Accedi al pannello admin del portal
**Passo 2**: Vai a Settings → API Configuration
**Passo 3**: Aggiungi una nuova configurazione API con:
- **Key**: `salesforce_webhook_url`
- **Value**: L'URL del tuo webhook Salesforce (es. `https://your-salesforce-instance.salesforce.com/services/apexrest/your-endpoint`)

### 2. Configurare le Credenziali Salesforce

Se il tuo webhook richiede autenticazione, aggiungi:
- **Key**: `salesforce_api_key`
- **Value**: La tua API Key o OAuth token

## Trigger e Webhook

### Trigger 1: Schedule Installation (Schedulazione)

**Quando**: Quando un'installazione viene schedulata nel planner
**Endpoint**: POST `/api/webhook/salesforce`
**Payload**:
```json
{
  "ServiceAppointmentId": "string",
  "StartDateTime": "2025-10-26T12:30:00.000Z",
  "EndDateTime": "2025-10-26T15:00:00.000Z"
}
```

**Campi**:
- `ServiceAppointmentId`: ID univoco dell'appuntamento in Salesforce
- `StartDateTime`: Data e ora di inizio (formato ISO 8601)
- `EndDateTime`: Data e ora di fine (formato ISO 8601)

---

### Trigger 2: Update Installation Duration

**Quando**: Quando la durata di un'installazione già schedulata viene modificata
**Endpoint**: POST `/api/webhook/salesforce`
**Payload**: Stesso formato del Trigger 1 (con orari aggiornati)

---

### Trigger 3: Change Status - Scheduled

**Quando**: Quando lo stato di un'installazione cambia a "Schedulato"
**Endpoint**: POST `/api/webhook/salesforce`
**Payload**: Stesso formato del Trigger 1

---

### Trigger 4: Change Status - Cancelled

**Quando**: Quando lo stato di un'installazione cambia a "Annullato"
**Endpoint**: POST `/api/webhook/salesforce`
**Payload**:
```json
{
  "ServiceAppointmentId": "string",
  "Status": "Cancelled"
}
```

---

### Trigger 5: Change Status - Confirmed (NUOVO)

**Quando**: Quando lo stato di un'installazione cambia a "Confermato"
**Endpoint**: POST `/api/webhook/salesforce`
**Payload**:
```json
{
  "ServiceAppointmentId": "string",
  "Status": "Confirmed",
  "StartDateTime": "2025-10-26T12:30:00.000Z",
  "EndDateTime": "2025-10-26T15:00:00.000Z"
}
```

---

## Formato dei Dati Completo

### Installation Object

Quando viene inviato un webhook, il sistema include i seguenti dati:

```json
{
  "id": 1,
  "serviceAppointmentId": "0015g00000XXXXX",
  "customerName": "Anna Bianchi",
  "customerPhone": "+39 347 1122334",
  "customerEmail": "anna@example.com",
  "customerAddress": "Via Cavour 88, Firenze",
  "installationAddress": "Via Cavour 88, Firenze",
  "durationMinutes": 150,
  "status": "scheduled",
  "teamId": 1,
  "partnerId": 1,
  "scheduledStart": "2025-10-26T12:30:00.000Z",
  "scheduledEnd": "2025-10-26T15:00:00.000Z",
  "travelTimeMinutes": 30,
  "technicalNotes": "Installazione standard",
  "imagesToView": "https://example.com/images/...",
  "completionLink": "https://example.com/completion/..."
}
```

### Stati Disponibili

| Stato | Descrizione | Webhook Inviato |
|-------|-------------|-----------------|
| `pending` | In Attesa | No |
| `scheduled` | Schedulato | Sì (con orari) |
| `confirmed` | Confermato | Sì (con orari) |
| `in_progress` | In Corso | No |
| `completed` | Completato | No |
| `cancelled` | Annullato | Sì (solo status) |

---

## Esempio di Integrazione Salesforce

### 1. Creare un Apex REST Endpoint

```apex
@RestResource(urlMapping='/installation/webhook')
global class InstallationWebhookHandler {
    @HttpPost
    global static void handleWebhook() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        try {
            String body = req.requestBody.toString();
            Map<String, Object> payload = (Map<String, Object>) JSON.deserializeUntyped(body);
            
            String serviceAppointmentId = (String) payload.get('ServiceAppointmentId');
            String status = (String) payload.get('Status');
            String startDateTime = (String) payload.get('StartDateTime');
            String endDateTime = (String) payload.get('EndDateTime');
            
            // Aggiorna il Service Appointment in Salesforce
            ServiceAppointment sa = [
                SELECT Id, Status, SchedStartTime, SchedEndTime 
                FROM ServiceAppointment 
                WHERE Id = :serviceAppointmentId
                LIMIT 1
            ];
            
            if (status != null) {
                sa.Status = status;
            }
            if (startDateTime != null) {
                sa.SchedStartTime = DateTime.valueOf(startDateTime);
            }
            if (endDateTime != null) {
                sa.SchedEndTime = DateTime.valueOf(endDateTime);
            }
            
            update sa;
            
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'success' => 'true',
                'message' => 'Service Appointment updated successfully'
            }));
        } catch (Exception e) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'error' => e.getMessage()
            }));
        }
    }
}
```

### 2. Configurare il Webhook nel Portal

1. Accedi al pannello admin
2. Vai a Settings → API Configuration
3. Crea una nuova configurazione:
   - **Key**: `salesforce_webhook_url`
   - **Value**: `https://your-instance.salesforce.com/services/apexrest/installation/webhook`

### 3. Testare il Webhook

Usa l'endpoint di test disponibile:

```bash
curl -X POST https://your-portal.com/api/webhook/test \
  -H "Content-Type: application/json" \
  -d '{
    "ServiceAppointmentId": "0015g00000XXXXX",
    "StartDateTime": "2025-10-26T12:30:00.000Z",
    "EndDateTime": "2025-10-26T15:00:00.000Z"
  }'
```

---

## Snapping a 15 Minuti

Quando trascini uno slot nel planner, il sistema **arrotonda automaticamente** l'ora di inizio a intervalli di 15 minuti:

- **12:07** → **12:00**
- **12:08** → **12:15**
- **12:22** → **12:15**
- **12:23** → **12:30**

L'ora di fine viene calcolata automaticamente aggiungendo la durata all'ora di inizio.

---

## Troubleshooting

### Il webhook non viene inviato

1. Verifica che l'URL del webhook sia configurato correttamente
2. Controlla i log del server per eventuali errori
3. Assicurati che lo stato dell'installazione sia uno di quelli che triggerano il webhook

### Errore di autenticazione

1. Verifica che le credenziali Salesforce siano corrette
2. Controlla che il token non sia scaduto
3. Assicurati che l'utente Salesforce abbia i permessi necessari

### Orari non corretti

1. Verifica che il fuso orario sia configurato correttamente
2. Assicurati che gli orari siano in formato ISO 8601
3. Controlla che il server e Salesforce siano sincronizzati

---

## Contatti e Supporto

Per domande o problemi con l'integrazione, contatta il team di supporto.

