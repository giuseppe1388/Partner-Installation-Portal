# Logica di Autorizzazione e Visibilità Dati

Documentazione completa della logica di autorizzazione per il Partner Installation Portal.

## 📋 Indice

1. [Modello di Ruoli](#modello-di-ruoli)
2. [Flusso Admin](#flusso-admin)
3. [Flusso Partner](#flusso-partner)
4. [Flusso Technician](#flusso-technician)
5. [Database Schema](#database-schema)
6. [tRPC Procedures](#trpc-procedures)
7. [Row Level Security (RLS)](#row-level-security)
8. [Esempi di Codice](#esempi-di-codice)

---

## 🔐 Modello di Ruoli

### Ruoli Disponibili

| Ruolo | Descrizione | Accesso |
|-------|-------------|---------|
| **admin** | Amministratore di sistema | Accesso totale a tutti i dati |
| **partner** | Azienda partner | Accesso solo ai propri dati |
| **technician** | Tecnico installatore | Accesso solo alle proprie squadre |

### Matrice di Autorizzazione

```
                    Admin  Partner  Technician
Visualizzare Partner   ✓      ✗        ✗
Creare Partner         ✓      ✗        ✗
Modificare Partner     ✓      ✗        ✗
Eliminare Partner      ✓      ✗        ✗

Visualizzare Squadra   ✓      ✓*       ✗
Creare Squadra         ✓      ✗        ✗
Modificare Squadra     ✓      ✓*       ✗
Eliminare Squadra      ✓      ✗        ✗

Visualizzare Install.  ✓      ✓*       ✓**
Creare Install.        ✓      ✗        ✗
Accettare Install.     ✓      ✓*       ✗
Rifiutare Install.     ✓      ✓*       ✗
Schedulare Install.    ✓      ✓*       ✗
Completare Install.    ✓      ✗        ✓**

Visualizzare Tech.     ✓      ✓*       ✗
Creare Tech.           ✓      ✓*       ✗
Modificare Tech.       ✓      ✓*       ✗
Eliminare Tech.        ✓      ✓*       ✗
```

**Legenda:**
- `✓` = Accesso totale
- `✓*` = Accesso solo ai propri dati
- `✓**` = Accesso solo alle proprie squadre
- `✗` = Nessun accesso

---

## 👨‍💼 Flusso Admin

### 1. Admin Crea Partner

```
Admin Dashboard
    ↓
Clicca "Nuovo Partner"
    ↓
Form: Nome, Email, Phone, Starting Address, Username, Password
    ↓
POST /api/trpc/admin.partners.create
    ↓
Database: INSERT INTO partners
    ↓
Risposta: Partner creato con ID
```

**Dati Salvati:**
```typescript
{
  id: 1,
  salesforcePartnerId: "P001",
  name: "Azienda XYZ",
  email: "contact@azienda.it",
  phone: "+39 123 456 7890",
  startingAddress: "Via Roma 10, Milano",
  username: "azienda_xyz",
  passwordHash: "hashed_password",
  isActive: true,
  createdAt: "2025-11-05T10:00:00Z",
  updatedAt: "2025-11-05T10:00:00Z"
}
```

### 2. Admin Crea Squadra per Partner

```
Admin Dashboard → Partners → Seleziona Partner
    ↓
Clicca "Nuova Squadra"
    ↓
Form: Salesforce Team ID, Nome, Descrizione, Partner (select)
    ↓
POST /api/trpc/admin.teams.create
    ↓
Database: INSERT INTO teams
    ↓
Risposta: Squadra creata con ID
```

**Dati Salvati:**
```typescript
{
  id: 1,
  salesforceTeamId: "T001",
  partnerId: 1,  // Link al Partner
  name: "Squadra Nord",
  description: "Installazioni zona nord",
  isActive: true,
  createdAt: "2025-11-05T10:00:00Z",
  updatedAt: "2025-11-05T10:00:00Z"
}
```

### 3. Admin Visualizza Tutte le Installazioni

```
Admin Dashboard → Installations
    ↓
GET /api/trpc/admin.installations.list
    ↓
Database: SELECT * FROM installations
    ↓
Risposta: Tutte le installazioni (senza filtri)
```

---

## 🏢 Flusso Partner

### 1. Partner Accede al Portale

```
Login Page
    ↓
Inserisci Username + Password
    ↓
POST /api/trpc/partner.login
    ↓
Database: SELECT * FROM partners WHERE username = ?
    ↓
Verifica password (bcrypt)
    ↓
Genera JWT Token
    ↓
Risposta: Token + Partner Data
    ↓
Salva Token in localStorage
    ↓
Redirect a Partner Dashboard
```

**JWT Token Contiene:**
```typescript
{
  sub: "1",           // Partner ID
  partnerId: 1,
  username: "azienda_xyz",
  role: "partner",
  iat: 1730784000,
  exp: 1730870400
}
```

### 2. Partner Visualizza Solo le Proprie Squadre

```
Partner Dashboard
    ↓
GET /api/trpc/partner.myTeams
    ↓
Backend: Legge JWT token → partnerId = 1
    ↓
Database: SELECT * FROM teams WHERE partnerId = 1
    ↓
Risposta: Solo squadre del partner 1
```

**Logica Backend:**
```typescript
// server/routers.ts
partner: router({
  myTeams: publicProcedure
    .input(z.object({ partnerId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Verifica che il partner richiedente sia il proprietario
      const partner = ctx.user; // Da JWT token
      
      if (partner.id !== input.partnerId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Non puoi visualizzare squadre di altri partner'
        });
      }

      return db.query.teams.findMany({
        where: (teams, { eq }) => eq(teams.partnerId, input.partnerId)
      });
    }),
})
```

### 3. Partner Visualizza Solo le Proprie Installazioni

```
Partner Dashboard → Installations
    ↓
GET /api/trpc/partner.myInstallations
    ↓
Backend: Legge JWT token → partnerId = 1
    ↓
Database: SELECT * FROM installations WHERE partnerId = 1
    ↓
Risposta: Solo installazioni del partner 1
```

**Logica Backend:**
```typescript
partner: router({
  myInstallations: publicProcedure
    .input(z.object({ partnerId: z.number() }))
    .query(async ({ input, ctx }) => {
      const partner = ctx.user;
      
      if (partner.id !== input.partnerId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Non puoi visualizzare installazioni di altri partner'
        });
      }

      return db.query.installations.findMany({
        where: (installations, { eq }) => 
          eq(installations.partnerId, input.partnerId),
        orderBy: (installations, { desc }) => 
          desc(installations.createdAt)
      });
    }),
})
```

### 4. Partner Accetta Installazione

```
Partner Dashboard → Installazione
    ↓
Clicca "Accetta"
    ↓
Dialog di conferma
    ↓
POST /api/trpc/partner.acceptInstallation
    ↓
Backend:
  1. Verifica che installazione appartiene al partner
  2. Aggiorna status a "accepted"
  3. Salva acceptedAt timestamp
  4. Invia webhook a Salesforce
    ↓
Database: UPDATE installations SET status='accepted', acceptedAt=NOW()
    ↓
Salesforce Webhook: POST to salesforce_webhook_url
    ↓
Risposta: Installazione accettata
```

**Logica Backend:**
```typescript
partner: router({
  acceptInstallation: publicProcedure
    .input(z.object({ installationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const partner = ctx.user;
      
      // Verifica che installazione appartiene al partner
      const installation = await db.query.installations.findFirst({
        where: (installations, { eq }) => 
          eq(installations.id, input.installationId)
      });

      if (!installation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Installazione non trovata'
        });
      }

      if (installation.partnerId !== partner.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Non puoi accettare installazioni di altri partner'
        });
      }

      // Aggiorna status
      const updated = await db.update(schema.installations)
        .set({
          status: 'accepted',
          acceptedAt: new Date()
        })
        .where(eq(schema.installations.id, input.installationId))
        .returning();

      // Invia webhook a Salesforce
      await sendAcceptanceToSalesforce(input.installationId);

      return updated[0];
    }),
})
```

### 5. Partner Rifiuta Installazione

```
Partner Dashboard → Installazione
    ↓
Clicca "Rifiuta"
    ↓
Dialog: Inserisci motivazione (min 10 caratteri)
    ↓
POST /api/trpc/partner.rejectInstallation
    ↓
Backend:
  1. Verifica che installazione appartiene al partner
  2. Valida motivazione (min 10 caratteri)
  3. Aggiorna status a "rejected"
  4. Salva rejectionReason
  5. Invia webhook a Salesforce
    ↓
Database: UPDATE installations SET status='rejected', rejectionReason=?
    ↓
Salesforce Webhook: POST to salesforce_webhook_url
    ↓
Risposta: Installazione rifiutata
```

**Logica Backend:**
```typescript
partner: router({
  rejectInstallation: publicProcedure
    .input(z.object({
      installationId: z.number(),
      rejectionReason: z.string().min(10)
    }))
    .mutation(async ({ input, ctx }) => {
      const partner = ctx.user;
      
      const installation = await db.query.installations.findFirst({
        where: (installations, { eq }) => 
          eq(installations.id, input.installationId)
      });

      if (!installation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Installazione non trovata'
        });
      }

      if (installation.partnerId !== partner.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Non puoi rifiutare installazioni di altri partner'
        });
      }

      const updated = await db.update(schema.installations)
        .set({
          status: 'rejected',
          rejectionReason: input.rejectionReason
        })
        .where(eq(schema.installations.id, input.installationId))
        .returning();

      await sendRejectionToSalesforce(
        input.installationId,
        input.rejectionReason
      );

      return updated[0];
    }),
})
```

### 6. Partner Schedula Installazione

```
Partner Dashboard → Gantt Chart
    ↓
Drag installazione su data/ora
    ↓
POST /api/trpc/partner.scheduleInstallation
    ↓
Backend:
  1. Verifica che installazione appartiene al partner
  2. Verifica che squadra appartiene al partner
  3. Valida orario (non sovrapposto)
  4. Calcola travel time da Google Maps
  5. Aggiorna installazione
  6. Invia webhook a Salesforce
    ↓
Database: UPDATE installations SET status='scheduled', teamId=?, scheduledStart=?, scheduledEnd=?
    ↓
Salesforce Webhook: POST to salesforce_webhook_url
    ↓
Risposta: Installazione schedulata
```

**Logica Backend:**
```typescript
partner: router({
  scheduleInstallation: publicProcedure
    .input(z.object({
      installationId: z.number(),
      teamId: z.number(),
      scheduledStart: z.date(),
      scheduledEnd: z.date()
    }))
    .mutation(async ({ input, ctx }) => {
      const partner = ctx.user;
      
      // Verifica installazione
      const installation = await db.query.installations.findFirst({
        where: (installations, { eq }) => 
          eq(installations.id, input.installationId)
      });

      if (installation.partnerId !== partner.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // Verifica squadra
      const team = await db.query.teams.findFirst({
        where: (teams, { eq }) => eq(teams.id, input.teamId)
      });

      if (team.partnerId !== partner.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Non puoi assegnare a squadre di altri partner'
        });
      }

      // Calcola travel time
      const travelTime = await calculateTravelTime(
        team.startingAddress,
        installation.installationAddress
      );

      // Aggiorna
      const updated = await db.update(schema.installations)
        .set({
          status: 'scheduled',
          teamId: input.teamId,
          partnerId: partner.id,
          scheduledStart: input.scheduledStart,
          scheduledEnd: input.scheduledEnd,
          travelTimeMinutes: travelTime
        })
        .where(eq(schema.installations.id, input.installationId))
        .returning();

      await sendScheduleToSalesforce(input.installationId);

      return updated[0];
    }),
})
```

---

## 👷 Flusso Technician

### 1. Technician Accede al Portale

```
Login Page
    ↓
Inserisci Username + Password
    ↓
POST /api/trpc/technician.login
    ↓
Database: SELECT * FROM technicians WHERE username = ?
    ↓
Verifica password
    ↓
Genera JWT Token
    ↓
Risposta: Token + Technician Data
    ↓
Redirect a Technician Dashboard
```

**JWT Token Contiene:**
```typescript
{
  sub: "1",           // Technician ID
  technicianId: 1,
  teamId: 1,
  partnerId: 1,
  username: "tech_001",
  role: "technician",
  iat: 1730784000,
  exp: 1730870400
}
```

### 2. Technician Visualizza Solo le Proprie Installazioni

```
Technician Dashboard
    ↓
Seleziona data
    ↓
GET /api/trpc/technician.myInstallations
    ↓
Backend: Legge JWT token → teamId = 1
    ↓
Database: SELECT * FROM installations 
          WHERE teamId = 1 AND DATE(scheduledStart) = ?
    ↓
Risposta: Solo installazioni della squadra 1 per quella data
```

**Logica Backend:**
```typescript
technician: router({
  myInstallations: publicProcedure
    .input(z.object({ teamId: z.number() }))
    .query(async ({ input, ctx }) => {
      const technician = ctx.user;
      
      // Verifica che technician appartiene a questa squadra
      if (technician.teamId !== input.teamId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Non puoi visualizzare installazioni di altre squadre'
        });
      }

      return db.query.installations.findMany({
        where: (installations, { eq, and }) => 
          and(
            eq(installations.teamId, input.teamId),
            gte(installations.scheduledStart, startOfDay(new Date())),
            lte(installations.scheduledStart, endOfDay(new Date()))
          ),
        orderBy: (installations, { asc }) => 
          asc(installations.scheduledStart)
      });
    }),
})
```

### 3. Technician Completa Installazione

```
Technician Dashboard → Installazione
    ↓
Clicca "Completa"
    ↓
Dialog: Inserisci note, upload foto
    ↓
POST /api/trpc/technician.completeInstallation
    ↓
Backend:
  1. Verifica che installazione appartiene alla squadra del technician
  2. Aggiorna status a "completed"
  3. Salva note e foto
  4. Invia webhook a Salesforce
    ↓
Database: UPDATE installations SET status='completed', ...
    ↓
Salesforce Webhook: POST to salesforce_webhook_url
    ↓
Risposta: Installazione completata
```

---

## 🗄️ Database Schema

### Relazioni tra Tabelle

```
partners (1)
    ↓ (1:N)
    └─→ teams (N)
            ↓ (1:N)
            └─→ technicians (N)

partners (1)
    ↓ (1:N)
    └─→ installations (N)

teams (1)
    ↓ (1:N)
    └─→ installations (N)
```

### Queries Importanti

**Installazioni di un Partner:**
```sql
SELECT * FROM installations 
WHERE partnerId = $1
ORDER BY createdAt DESC;
```

**Squadre di un Partner:**
```sql
SELECT * FROM teams 
WHERE partnerId = $1
AND isActive = true;
```

**Installazioni di una Squadra per una Data:**
```sql
SELECT * FROM installations 
WHERE teamId = $1
AND DATE(scheduledStart) = $2
ORDER BY scheduledStart ASC;
```

**Technician di una Squadra:**
```sql
SELECT * FROM technicians 
WHERE teamId = $1
AND isActive = true;
```

---

## 🔐 Row Level Security (RLS)

### RLS Policies su Supabase

```sql
-- Partners: Ogni partner vede solo i propri dati
CREATE POLICY "Partners can view their own data"
  ON partners
  FOR SELECT
  USING (
    id = (
      SELECT id FROM partners 
      WHERE username = current_user
    )
  );

-- Teams: Ogni partner vede solo le proprie squadre
CREATE POLICY "Partners can view their teams"
  ON teams
  FOR SELECT
  USING (
    partnerId = (
      SELECT id FROM partners 
      WHERE username = current_user
    )
  );

-- Installations: Ogni partner vede solo le proprie installazioni
CREATE POLICY "Partners can view their installations"
  ON installations
  FOR SELECT
  USING (
    partnerId = (
      SELECT id FROM partners 
      WHERE username = current_user
    )
  );

-- Technicians: Ogni partner vede solo i propri technician
CREATE POLICY "Partners can view their technicians"
  ON technicians
  FOR SELECT
  USING (
    partnerId = (
      SELECT id FROM partners 
      WHERE username = current_user
    )
  );

-- Installations: Technician vede solo installazioni della propria squadra
CREATE POLICY "Technicians can view their team installations"
  ON installations
  FOR SELECT
  USING (
    teamId = (
      SELECT teamId FROM technicians 
      WHERE username = current_user
    )
  );
```

---

## 🔌 tRPC Procedures

### Admin Routers

```typescript
admin: router({
  // Partners
  partners: router({
    list: adminProcedure.query(async () => {
      // Tutte i partner
    }),
    create: adminProcedure
      .input(partnerSchema)
      .mutation(async ({ input }) => {
        // Crea partner
      }),
    update: adminProcedure
      .input(z.object({ id: z.number(), ...partnerSchema }))
      .mutation(async ({ input }) => {
        // Modifica partner
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        // Elimina partner
      }),
  }),

  // Teams
  teams: router({
    list: adminProcedure.query(async () => {
      // Tutte le squadre
    }),
    create: adminProcedure
      .input(teamSchema)
      .mutation(async ({ input }) => {
        // Crea squadra
      }),
    update: adminProcedure
      .input(z.object({ id: z.number(), ...teamSchema }))
      .mutation(async ({ input }) => {
        // Modifica squadra
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        // Elimina squadra
      }),
  }),

  // Installations
  installations: router({
    list: adminProcedure.query(async () => {
      // Tutte le installazioni
    }),
  }),
})
```

### Partner Routers

```typescript
partner: router({
  login: publicProcedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      // Login partner
    }),

  myTeams: publicProcedure
    .input(z.object({ partnerId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Squadre del partner
    }),

  myInstallations: publicProcedure
    .input(z.object({ partnerId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Installazioni del partner
    }),

  acceptInstallation: publicProcedure
    .input(z.object({ installationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Accetta installazione
    }),

  rejectInstallation: publicProcedure
    .input(z.object({
      installationId: z.number(),
      rejectionReason: z.string().min(10)
    }))
    .mutation(async ({ input, ctx }) => {
      // Rifiuta installazione
    }),

  scheduleInstallation: publicProcedure
    .input(z.object({
      installationId: z.number(),
      teamId: z.number(),
      scheduledStart: z.date(),
      scheduledEnd: z.date()
    }))
    .mutation(async ({ input, ctx }) => {
      // Schedula installazione
    }),

  updateTeamName: publicProcedure
    .input(z.object({
      teamId: z.number(),
      newName: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      // Rinomina squadra
    }),
})
```

### Technician Routers

```typescript
technician: router({
  login: publicProcedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      // Login technician
    }),

  myInstallations: publicProcedure
    .input(z.object({ teamId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Installazioni della squadra
    }),

  completeInstallation: publicProcedure
    .input(z.object({
      installationId: z.number(),
      notes: z.string().optional(),
      photoUrls: z.array(z.string()).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      // Completa installazione
    }),

  updateStatus: publicProcedure
    .input(z.object({
      installationId: z.number(),
      status: z.enum(['in_progress', 'completed'])
    }))
    .mutation(async ({ input, ctx }) => {
      // Aggiorna stato
    }),
})
```

---

## 📊 Esempi di Codice

### Esempio 1: Admin Crea Partner

**Frontend:**
```typescript
// pages/admin/Partners.tsx
const createMutation = trpc.admin.partners.create.useMutation({
  onSuccess: () => {
    utils.admin.partners.list.invalidate();
    toast.success('Partner creato con successo');
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  
  createMutation.mutate({
    salesforcePartnerId: formData.get('salesforcePartnerId') as string,
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    startingAddress: formData.get('startingAddress') as string,
    username: formData.get('username') as string,
    password: formData.get('password') as string,
  });
};
```

**Backend:**
```typescript
// server/routers.ts
admin: router({
  partners: router({
    create: adminProcedure
      .input(z.object({
        salesforcePartnerId: z.string(),
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
        startingAddress: z.string(),
        username: z.string().min(3),
        password: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        // Hash password
        const passwordHash = await bcrypt.hash(input.password, 10);

        // Crea partner
        const partner = await db.insert(schema.partners).values({
          salesforcePartnerId: input.salesforcePartnerId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          startingAddress: input.startingAddress,
          username: input.username,
          passwordHash,
          isActive: true,
        }).returning();

        return partner[0];
      }),
  }),
})
```

### Esempio 2: Partner Visualizza Solo le Proprie Installazioni

**Frontend:**
```typescript
// pages/partner/Installations.tsx
const { data: installations } = trpc.partner.myInstallations.useQuery({
  partnerId: partner.id,
});

// Mostra solo le installazioni del partner loggato
return (
  <Table>
    <TableBody>
      {installations?.map((inst) => (
        <TableRow key={inst.id}>
          <TableCell>{inst.customerName}</TableCell>
          <TableCell>{inst.installationAddress}</TableCell>
          <TableCell>
            <Badge>{inst.status}</Badge>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
```

**Backend:**
```typescript
// server/routers.ts
partner: router({
  myInstallations: publicProcedure
    .input(z.object({ partnerId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Verifica che il partner richiedente sia il proprietario
      const partner = ctx.user; // Da JWT token
      
      if (partner.id !== input.partnerId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Non puoi visualizzare installazioni di altri partner'
        });
      }

      // Restituisci solo le installazioni di questo partner
      return db.query.installations.findMany({
        where: (installations, { eq }) => 
          eq(installations.partnerId, input.partnerId),
        orderBy: (installations, { desc }) => 
          desc(installations.createdAt)
      });
    }),
})
```

### Esempio 3: Partner Accetta Installazione

**Frontend:**
```typescript
// pages/partner/Installations.tsx
const acceptMutation = trpc.partner.acceptInstallation.useMutation({
  onSuccess: () => {
    utils.partner.myInstallations.invalidate();
    toast.success('Installazione accettata con successo');
  },
});

const handleAccept = (installationId: number) => {
  acceptMutation.mutate({ installationId });
};
```

**Backend:**
```typescript
// server/routers.ts
partner: router({
  acceptInstallation: publicProcedure
    .input(z.object({ installationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const partner = ctx.user;
      
      // Verifica che installazione appartiene al partner
      const installation = await db.query.installations.findFirst({
        where: (installations, { eq }) => 
          eq(installations.id, input.installationId)
      });

      if (!installation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Installazione non trovata'
        });
      }

      if (installation.partnerId !== partner.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Non puoi accettare installazioni di altri partner'
        });
      }

      // Aggiorna status
      const updated = await db.update(schema.installations)
        .set({
          status: 'accepted',
          acceptedAt: new Date()
        })
        .where(eq(schema.installations.id, input.installationId))
        .returning();

      // Invia webhook a Salesforce
      await sendAcceptanceToSalesforce(input.installationId);

      return updated[0];
    }),
})
```

---

## 🔒 Checklist Sicurezza

- ✅ Verificare JWT token in ogni procedura
- ✅ Validare input con Zod
- ✅ Verificare proprietà delle risorse
- ✅ Implementare RLS su Supabase
- ✅ Hash password con bcrypt
- ✅ Implementare rate limiting
- ✅ Loggare accessi non autorizzati
- ✅ Implementare CORS correttamente
- ✅ Nascondere API keys in environment

---

**Creato:** 5 Novembre 2025
**Versione:** 1.0.0

