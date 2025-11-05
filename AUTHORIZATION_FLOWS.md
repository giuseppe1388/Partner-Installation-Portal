# Flussi di Autorizzazione - Diagrammi e Sequenze

Diagrammi visivi dei flussi di autorizzazione nel Partner Installation Portal.

## 📊 Diagramma Gerarchico

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                          │
│  - Visualizza tutti i partner                               │
│  - Crea/Modifica/Elimina partner                            │
│  - Crea/Modifica/Elimina squadre                            │
│  - Visualizza tutte le installazioni                        │
│  - Configura API keys e webhook                            │
└─────────────────────────────────────────────────────────────┘
         │
         ├─→ Crea Partner 1 ──────────────────┐
         │                                     │
         ├─→ Crea Partner 2 ──────────────────┤
         │                                     │
         └─→ Crea Partner 3 ──────────────────┤
                                              │
                    ┌─────────────────────────┴──────────────────────────┐
                    │                                                     │
         ┌──────────▼──────────┐                          ┌──────────────▼──────────┐
         │  PARTNER 1 PORTAL   │                          │  PARTNER 2 PORTAL       │
         │                     │                          │                         │
         │ - Visualizza:       │                          │ - Visualizza:           │
         │   • Squadre P1      │                          │   • Squadre P2          │
         │   • Installazioni P1│                          │   • Installazioni P2    │
         │                     │                          │                         │
         │ - Azioni:           │                          │ - Azioni:               │
         │   • Accetta/Rifiuta │                          │   • Accetta/Rifiuta     │
         │   • Schedula        │                          │   • Schedula            │
         │   • Rinomina squadre│                          │   • Rinomina squadre    │
         └─────────┬───────────┘                          └────────────┬────────────┘
                   │                                                   │
        ┌──────────┴──────────┐                          ┌────────────┴──────────┐
        │                     │                          │                       │
    ┌───▼────────┐    ┌───────▼────┐              ┌──────▼────┐        ┌────────▼─────┐
    │ Squadra P1 │    │ Squadra P1 │              │Squadra P2 │        │ Squadra P2  │
    │   Nord     │    │   Sud      │              │  Milano   │        │  Roma       │
    └───┬────────┘    └───┬────────┘              └──────┬────┘        └────────┬─────┘
        │                 │                              │                       │
    ┌───▼──────┐      ┌───▼──────┐              ┌───────▼──────┐        ┌────────▼──────┐
    │ Tech 1   │      │ Tech 2   │              │ Tech 3       │        │ Tech 4        │
    │ (Squad P1)│      │ (Squad P1)│              │ (Squad P2)   │        │ (Squad P2)    │
    └──────────┘      └──────────┘              └──────────────┘        └───────────────┘
```

---

## 🔄 Flusso: Admin Crea Partner e Squadre

```
┌──────────────────────┐
│   ADMIN DASHBOARD    │
└──────────┬───────────┘
           │
           ├─→ Click "Nuovo Partner"
           │
           ├─→ Form: Nome, Email, Username, Password
           │
           ├─→ POST /api/trpc/admin.partners.create
           │
           ├─→ Backend:
           │   1. Valida input (Zod)
           │   2. Hash password (bcrypt)
           │   3. INSERT INTO partners
           │   4. Ritorna partner ID
           │
           ├─→ Database:
           │   INSERT partners (
           │     salesforcePartnerId,
           │     name, email, username,
           │     passwordHash, isActive
           │   )
           │
           ├─→ Risposta: Partner creato (ID: 1)
           │
           └─→ Admin seleziona Partner 1
               │
               ├─→ Click "Nuova Squadra"
               │
               ├─→ Form: Nome, Descrizione, Salesforce Team ID
               │
               ├─→ POST /api/trpc/admin.teams.create
               │
               ├─→ Backend:
               │   1. Valida input
               │   2. INSERT INTO teams (partnerId: 1)
               │   3. Ritorna team ID
               │
               ├─→ Database:
               │   INSERT teams (
               │     salesforceTeamId,
               │     partnerId: 1,
               │     name, description
               │   )
               │
               └─→ Risposta: Squadra creata (ID: 1, partnerId: 1)
```

---

## 🔐 Flusso: Partner Login e Autorizzazione

```
┌──────────────────────┐
│   PARTNER LOGIN      │
└──────────┬───────────┘
           │
           ├─→ Inserisci Username + Password
           │
           ├─→ POST /api/trpc/partner.login
           │
           ├─→ Backend:
           │   1. SELECT * FROM partners WHERE username = ?
           │   2. Verifica password (bcrypt.compare)
           │   3. Genera JWT token
           │      {
           │        sub: "1",
           │        partnerId: 1,
           │        username: "azienda_xyz",
           │        role: "partner",
           │        exp: timestamp
           │      }
           │   4. Ritorna token
           │
           ├─→ Frontend:
           │   1. Salva token in localStorage
           │   2. Configura header Authorization: Bearer {token}
           │   3. Redirect a Partner Dashboard
           │
           └─→ Partner Dashboard
               │
               ├─→ GET /api/trpc/partner.myTeams
               │   (Header: Authorization: Bearer {token})
               │
               ├─→ Backend:
               │   1. Legge JWT token dal header
               │   2. Estrae partnerId = 1
               │   3. SELECT * FROM teams WHERE partnerId = 1
               │   4. Ritorna solo squadre del partner 1
               │
               └─→ Mostra solo squadre del partner 1
```

---

## 📋 Flusso: Partner Visualizza Installazioni

```
┌──────────────────────────────┐
│  PARTNER DASHBOARD           │
│  (JWT: partnerId = 1)        │
└──────────┬────────────────────┘
           │
           ├─→ Click "Installazioni"
           │
           ├─→ GET /api/trpc/partner.myInstallations
           │   (Header: Authorization: Bearer {token})
           │
           ├─→ Backend:
           │   1. Estrae JWT token
           │   2. Legge partnerId = 1
           │   3. Verifica: input.partnerId === partner.id
           │      ✓ Se OK → continua
           │      ✗ Se NO → throw FORBIDDEN
           │   4. SELECT * FROM installations 
           │      WHERE partnerId = 1
           │      ORDER BY createdAt DESC
           │   5. Ritorna installazioni
           │
           ├─→ Database Query:
           │   SELECT * FROM installations
           │   WHERE partnerId = 1
           │   ORDER BY createdAt DESC
           │
           ├─→ Risposta:
           │   [
           │     {
           │       id: 1,
           │       serviceAppointmentId: "SA001",
           │       customerName: "Cliente A",
           │       installationAddress: "Via Roma 10",
           │       status: "pending",
           │       partnerId: 1,
           │       ...
           │     },
           │     {
           │       id: 2,
           │       serviceAppointmentId: "SA002",
           │       customerName: "Cliente B",
           │       installationAddress: "Via Milano 20",
           │       status: "pending",
           │       partnerId: 1,
           │       ...
           │     }
           │   ]
           │
           └─→ Mostra tabella con installazioni
               (Solo installazioni di partner 1)
```

---

## ✅ Flusso: Partner Accetta Installazione

```
┌──────────────────────────────────────┐
│  PARTNER DASHBOARD                   │
│  (JWT: partnerId = 1)                │
│  Vede installazione ID: 1            │
└──────────┬──────────────────────────┘
           │
           ├─→ Click "Accetta"
           │
           ├─→ Dialog di conferma
           │   "Sei sicuro di accettare questa installazione?"
           │
           ├─→ Click "Conferma"
           │
           ├─→ POST /api/trpc/partner.acceptInstallation
           │   {
           │     installationId: 1
           │   }
           │   (Header: Authorization: Bearer {token})
           │
           ├─→ Backend:
           │   1. Estrae JWT token
           │   2. Legge partnerId = 1
           │   3. SELECT * FROM installations WHERE id = 1
           │   4. Verifica: installation.partnerId === partner.id
           │      ✓ Se OK → continua
           │      ✗ Se NO → throw FORBIDDEN
           │   5. UPDATE installations
           │      SET status = 'accepted',
           │          acceptedAt = NOW()
           │      WHERE id = 1
           │   6. Invia webhook a Salesforce:
           │      POST to salesforce_webhook_url
           │      {
           │        eventType: 'acceptance',
           │        ServiceAppointmentId: 'SA001',
           │        Status: 'Accepted'
           │      }
           │   7. Ritorna installazione aggiornata
           │
           ├─→ Database Update:
           │   UPDATE installations
           │   SET status = 'accepted',
           │       acceptedAt = '2025-11-05 10:30:00'
           │   WHERE id = 1
           │
           ├─→ Salesforce Webhook:
           │   POST https://salesforce.com/webhook
           │   {
           │     eventType: 'acceptance',
           │     ServiceAppointmentId: 'SA001',
           │     Status: 'Accepted',
           │     Timestamp: '2025-11-05T10:30:00Z'
           │   }
           │
           ├─→ Risposta: Installazione accettata
           │
           └─→ Toast: "Installazione accettata con successo"
               Refresh lista installazioni
```

---

## ❌ Flusso: Partner Rifiuta Installazione

```
┌──────────────────────────────────────┐
│  PARTNER DASHBOARD                   │
│  (JWT: partnerId = 1)                │
│  Vede installazione ID: 1            │
└──────────┬──────────────────────────┘
           │
           ├─→ Click "Rifiuta"
           │
           ├─→ Dialog: Inserisci motivazione
           │   (Minimo 10 caratteri)
           │
           ├─→ Esempio: "Conflitto di orario con altro incarico"
           │
           ├─→ Click "Conferma Rifiuto"
           │
           ├─→ POST /api/trpc/partner.rejectInstallation
           │   {
           │     installationId: 1,
           │     rejectionReason: "Conflitto di orario con altro incarico"
           │   }
           │   (Header: Authorization: Bearer {token})
           │
           ├─→ Backend:
           │   1. Estrae JWT token
           │   2. Legge partnerId = 1
           │   3. Valida rejectionReason.length >= 10
           │      ✓ Se OK → continua
           │      ✗ Se NO → throw VALIDATION_ERROR
           │   4. SELECT * FROM installations WHERE id = 1
           │   5. Verifica: installation.partnerId === partner.id
           │      ✓ Se OK → continua
           │      ✗ Se NO → throw FORBIDDEN
           │   6. UPDATE installations
           │      SET status = 'rejected',
           │          rejectionReason = 'Conflitto di orario...'
           │      WHERE id = 1
           │   7. Invia webhook a Salesforce:
           │      POST to salesforce_webhook_url
           │      {
           │        eventType: 'rejection',
           │        ServiceAppointmentId: 'SA001',
           │        Status: 'Rejected',
           │        RejectionReason: 'Conflitto di orario...'
           │      }
           │   8. Ritorna installazione aggiornata
           │
           ├─→ Database Update:
           │   UPDATE installations
           │   SET status = 'rejected',
           │       rejectionReason = 'Conflitto di orario con altro incarico'
           │   WHERE id = 1
           │
           ├─→ Salesforce Webhook:
           │   POST https://salesforce.com/webhook
           │   {
           │     eventType: 'rejection',
           │     ServiceAppointmentId: 'SA001',
           │     Status: 'Rejected',
           │     RejectionReason: 'Conflitto di orario con altro incarico',
           │     Timestamp: '2025-11-05T10:35:00Z'
           │   }
           │
           ├─→ Risposta: Installazione rifiutata
           │
           └─→ Toast: "Installazione rifiutata"
               Refresh lista installazioni
```

---

## 📅 Flusso: Partner Schedula Installazione

```
┌──────────────────────────────────────┐
│  PARTNER DASHBOARD - GANTT CHART     │
│  (JWT: partnerId = 1)                │
│  Vede installazione ID: 1            │
│  Status: accepted                    │
└──────────┬──────────────────────────┘
           │
           ├─→ Drag installazione su Gantt chart
           │   Seleziona: Squadra, Data, Ora
           │
           ├─→ Esempio:
           │   Squadra: "Squadra Nord" (ID: 1)
           │   Data: 2025-11-10
           │   Ora: 09:00 - 11:00
           │
           ├─→ POST /api/trpc/partner.scheduleInstallation
           │   {
           │     installationId: 1,
           │     teamId: 1,
           │     scheduledStart: "2025-11-10T09:00:00Z",
           │     scheduledEnd: "2025-11-10T11:00:00Z"
           │   }
           │   (Header: Authorization: Bearer {token})
           │
           ├─→ Backend:
           │   1. Estrae JWT token
           │   2. Legge partnerId = 1
           │   3. SELECT * FROM installations WHERE id = 1
           │   4. Verifica: installation.partnerId === partner.id
           │      ✓ Se OK → continua
           │      ✗ Se NO → throw FORBIDDEN
           │   5. SELECT * FROM teams WHERE id = 1
           │   6. Verifica: team.partnerId === partner.id
           │      ✓ Se OK → continua
           │      ✗ Se NO → throw FORBIDDEN
           │   7. Calcola travel time da Google Maps:
           │      - Da: team.startingAddress
           │      - A: installation.installationAddress
           │      - Tempo: 45 minuti
           │   8. UPDATE installations
           │      SET status = 'scheduled',
           │          teamId = 1,
           │          partnerId = 1,
           │          scheduledStart = '2025-11-10 09:00:00',
           │          scheduledEnd = '2025-11-10 11:00:00',
           │          travelTimeMinutes = 45
           │      WHERE id = 1
           │   9. Invia webhook a Salesforce
           │   10. Ritorna installazione aggiornata
           │
           ├─→ Database Update:
           │   UPDATE installations
           │   SET status = 'scheduled',
           │       teamId = 1,
           │       partnerId = 1,
           │       scheduledStart = '2025-11-10 09:00:00',
           │       scheduledEnd = '2025-11-10 11:00:00',
           │       travelTimeMinutes = 45
           │   WHERE id = 1
           │
           ├─→ Salesforce Webhook:
           │   POST https://salesforce.com/webhook
           │   {
           │     eventType: 'schedule',
           │     ServiceAppointmentId: 'SA001',
           │     Status: 'Scheduled',
           │     ScheduledStart: '2025-11-10T09:00:00Z',
           │     ScheduledEnd: '2025-11-10T11:00:00Z',
           │     TeamId: 'T001',
           │     TravelTimeMinutes: 45
           │   }
           │
           ├─→ Risposta: Installazione schedulata
           │
           └─→ Toast: "Installazione schedulata con successo"
               Aggiorna Gantt chart
```

---

## 👷 Flusso: Technician Visualizza Installazioni Giornaliere

```
┌──────────────────────────────────────┐
│  TECHNICIAN DASHBOARD                │
│  (JWT: teamId = 1, partnerId = 1)    │
└──────────┬──────────────────────────┘
           │
           ├─→ Seleziona data: 2025-11-10
           │
           ├─→ GET /api/trpc/technician.myInstallations
           │   {
           │     teamId: 1
           │   }
           │   (Header: Authorization: Bearer {token})
           │
           ├─→ Backend:
           │   1. Estrae JWT token
           │   2. Legge teamId = 1
           │   3. Verifica: input.teamId === technician.teamId
           │      ✓ Se OK → continua
           │      ✗ Se NO → throw FORBIDDEN
           │   4. SELECT * FROM installations
           │      WHERE teamId = 1
           │      AND DATE(scheduledStart) = '2025-11-10'
           │      ORDER BY scheduledStart ASC
           │   5. Ritorna installazioni
           │
           ├─→ Database Query:
           │   SELECT * FROM installations
           │   WHERE teamId = 1
           │   AND DATE(scheduledStart) = '2025-11-10'
           │   ORDER BY scheduledStart ASC
           │
           ├─→ Risposta:
           │   [
           │     {
           │       id: 1,
           │       serviceAppointmentId: "SA001",
           │       customerName: "Cliente A",
           │       installationAddress: "Via Roma 10",
           │       status: "scheduled",
           │       scheduledStart: "2025-11-10T09:00:00Z",
           │       scheduledEnd: "2025-11-10T11:00:00Z",
           │       travelTimeMinutes: 45,
           │       ...
           │     },
           │     {
           │       id: 2,
           │       serviceAppointmentId: "SA002",
           │       customerName: "Cliente B",
           │       installationAddress: "Via Milano 20",
           │       status: "scheduled",
           │       scheduledStart: "2025-11-10T14:00:00Z",
           │       scheduledEnd: "2025-11-10T16:00:00Z",
           │       travelTimeMinutes: 30,
           │       ...
           │     }
           │   ]
           │
           └─→ Mostra lista installazioni giornaliere
               Ordinate per orario di inizio
```

---

## ⚠️ Flusso: Tentativo di Accesso Non Autorizzato

```
┌──────────────────────────────────────┐
│  PARTNER 1 DASHBOARD                 │
│  (JWT: partnerId = 1)                │
└──────────┬──────────────────────────┘
           │
           ├─→ Tenta di accedere a installazione ID: 5
           │   (che appartiene a Partner 2)
           │
           ├─→ GET /api/trpc/partner.myInstallations
           │   {
           │     partnerId: 2  ← Diverso dal JWT!
           │   }
           │   (Header: Authorization: Bearer {token_partner_1})
           │
           ├─→ Backend:
           │   1. Estrae JWT token
           │   2. Legge partnerId = 1
           │   3. Verifica: input.partnerId === partner.id
           │      ✗ 2 !== 1 → throw FORBIDDEN
           │   4. Ritorna errore
           │
           ├─→ Risposta: 403 FORBIDDEN
           │   {
           │     code: 'FORBIDDEN',
           │     message: 'Non puoi visualizzare installazioni di altri partner'
           │   }
           │
           └─→ Toast: "Accesso negato"
               Redirect a dashboard
```

---

## 📊 Matrice di Visibilità Dati

### Admin
```
┌─────────────────────────────────────────┐
│ Vede TUTTO                              │
├─────────────────────────────────────────┤
│ ✓ Tutti i partner                       │
│ ✓ Tutte le squadre                      │
│ ✓ Tutte le installazioni                │
│ ✓ Tutti i technician                    │
│ ✓ Tutte le configurazioni               │
└─────────────────────────────────────────┘
```

### Partner 1
```
┌─────────────────────────────────────────┐
│ Vede SOLO i propri dati                 │
├─────────────────────────────────────────┤
│ ✓ Partner 1 (se stesso)                 │
│ ✓ Squadre di Partner 1                  │
│ ✓ Installazioni di Partner 1            │
│ ✓ Technician di Partner 1               │
│ ✗ Partner 2, 3, ...                     │
│ ✗ Squadre di Partner 2, 3, ...          │
│ ✗ Installazioni di Partner 2, 3, ...    │
└─────────────────────────────────────────┘
```

### Technician 1 (Squadra 1)
```
┌─────────────────────────────────────────┐
│ Vede SOLO le installazioni della squadra│
├─────────────────────────────────────────┤
│ ✓ Installazioni di Squadra 1            │
│ ✗ Installazioni di Squadra 2, 3, ...    │
│ ✗ Dati partner                          │
│ ✗ Dati squadre                          │
│ ✗ Dati altri technician                 │
└─────────────────────────────────────────┘
```

---

**Creato:** 5 Novembre 2025
**Versione:** 1.0.0

