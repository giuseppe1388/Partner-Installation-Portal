# Guida Lovable - Partner Installation Portal

Questa guida ti aiuterà a ricreare il **Partner Installation Portal** su Lovable, mantenendo tutte le funzionalità e l'architettura originale.

## 📋 Indice

1. [Panoramica del Progetto](#panoramica-del-progetto)
2. [Architettura Tecnica](#architettura-tecnica)
3. [Setup Iniziale](#setup-iniziale)
4. [Database Supabase](#database-supabase)
5. [Configurazione Backend](#configurazione-backend)
6. [Implementazione Frontend](#implementazione-frontend)
7. [Integrazione Salesforce](#integrazione-salesforce)
8. [Deployment](#deployment)

---

## 🎯 Panoramica del Progetto

### Descrizione
Il **Partner Installation Portal** è un sistema di gestione installazioni che collega:
- **Admin Dashboard** - Gestione partner, squadre e installazioni
- **Partner Portal** - Accettazione/rifiuto incarichi, pianificazione con Gantt chart
- **Technician Mobile App** - Visualizzazione installazioni giornaliere

### Stack Tecnologico
- **Frontend:** React 19 + Tailwind CSS 4 + TypeScript
- **Backend:** Express.js + tRPC 11
- **Database:** PostgreSQL (Supabase)
- **Autenticazione:** OAuth Manus + JWT
- **Integrazioni:** Salesforce Webhook, Google Maps API

### Funzionalità Principali
✅ Autenticazione multi-ruolo (Admin, Partner, Technician)
✅ Gestione partner e squadre
✅ Planificazione drag-and-drop con Gantt chart
✅ Status management (pending → accepted → scheduled → completed)
✅ Sincronizzazione bidirezionale Salesforce
✅ Viewer PDF integrato
✅ Responsive design mobile-first

---

## 🏗️ Architettura Tecnica

### Struttura Directory
```
partner-portal/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Page components
│   │   │   ├── admin/        # Admin dashboard
│   │   │   ├── partner/      # Partner portal
│   │   │   └── technician/   # Technician app
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/              # Utilities (tRPC client)
│   │   └── App.tsx           # Main router
│   └── index.html
├── server/                    # Backend Express
│   ├── routers.ts            # tRPC procedures
│   ├── db.ts                 # Database queries
│   ├── webhook.ts            # Salesforce webhooks
│   ├── salesforceWebhook.ts  # Webhook handlers
│   └── _core/                # Framework utilities
├── drizzle/                   # Database schema
│   └── schema.ts
├── shared/                    # Shared types
└── storage/                   # S3 storage helpers
```

### Flow Dati
```
Salesforce Webhook
    ↓
POST /api/webhook/salesforce
    ↓
Database (installations)
    ↓
tRPC Procedures
    ↓
Frontend (React Components)
    ↓
User Actions (accept/reject/schedule)
    ↓
tRPC Mutations
    ↓
Database Update + Salesforce Webhook Response
```

---

## 🚀 Setup Iniziale

### 1. Creare Progetto Lovable
1. Vai su [Lovable.dev](https://lovable.dev)
2. Clicca "Create New Project"
3. Seleziona "React + TypeScript"
4. Nomina il progetto: `Partner Installation Portal`

### 2. Configurare Environment Variables
Crea un file `.env.local` con:
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Salesforce
SALESFORCE_WEBHOOK_URL=https://your-salesforce-instance.com/webhook
SALESFORCE_API_KEY=your_api_key

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_key

# OAuth
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
JWT_SECRET=your_jwt_secret

# App Config
VITE_APP_TITLE=Partner Installation Portal
VITE_APP_LOGO=https://your-logo-url.png
```

### 3. Installare Dipendenze
```bash
npm install react-big-calendar react-dnd date-fns drizzle-orm @trpc/react-query sonner lucide-react
npm install --save-dev @types/react-big-calendar
```

---

## 🗄️ Database Supabase

### 1. Creare Progetto Supabase
1. Vai su [Supabase](https://supabase.com)
2. Clicca "New Project"
3. Seleziona la regione più vicina
4. Copia la connection string PostgreSQL

### 2. Eseguire Schema SQL
1. Vai su Supabase Dashboard → SQL Editor
2. Copia il contenuto di `database_supabase.sql`
3. Esegui lo script

### 3. Configurare Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

-- Create policies (example for installations)
CREATE POLICY "Partners can view their installations"
  ON installations
  FOR SELECT
  USING (
    partnerId = (SELECT id FROM partners WHERE username = current_user)
  );
```

---

## ⚙️ Configurazione Backend

### 1. Creare Server Express
Crea file `server.ts`:
```typescript
import express from 'express';
import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import { appRouter } from './routers';

const app = express();
app.use(express.json());

// tRPC endpoint
app.use('/api/trpc', createHTTPHandler({
  router: appRouter,
  createContext: async (opts) => ({
    req: opts.req,
    res: opts.res,
    user: null, // Will be populated by auth middleware
  }),
}));

// Webhook endpoint
app.post('/api/webhook/salesforce', async (req, res) => {
  // Handle Salesforce webhook
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 2. Implementare tRPC Routers
Crea file `server/routers.ts`:
```typescript
import { router, publicProcedure, protectedProcedure } from './trpc';
import { z } from 'zod';

export const appRouter = router({
  // Admin procedures
  admin: router({
    partners: router({
      list: publicProcedure.query(async () => {
        // Get all partners
      }),
      create: protectedProcedure
        .input(z.object({ name: z.string(), email: z.string() }))
        .mutation(async ({ input }) => {
          // Create partner
        }),
    }),
  }),

  // Partner procedures
  partner: router({
    myInstallations: publicProcedure
      .input(z.object({ partnerId: z.number() }))
      .query(async ({ input }) => {
        // Get partner's installations
      }),
    acceptInstallation: publicProcedure
      .input(z.object({ installationId: z.number() }))
      .mutation(async ({ input }) => {
        // Accept installation + send webhook to Salesforce
      }),
    rejectInstallation: publicProcedure
      .input(z.object({ 
        installationId: z.number(),
        rejectionReason: z.string()
      }))
      .mutation(async ({ input }) => {
        // Reject installation + send webhook to Salesforce
      }),
  }),

  // Technician procedures
  technician: router({
    myInstallations: publicProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        // Get technician's installations
      }),
  }),
});
```

### 3. Implementare Database Queries
Crea file `server/db.ts`:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../drizzle/schema';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

export async function getPartners() {
  return db.query.partners.findMany();
}

export async function getInstallationsByPartnerId(partnerId: number) {
  return db.query.installations.findMany({
    where: (installations, { eq }) => eq(installations.partnerId, partnerId),
  });
}

export async function updateInstallationStatus(
  id: number,
  status: string,
  data?: any
) {
  return db.update(schema.installations)
    .set({ status, ...data })
    .where(eq(schema.installations.id, id));
}
```

---

## 🎨 Implementazione Frontend

### 1. Struttura Componenti
```
client/src/
├── pages/
│   ├── admin/
│   │   ├── Partners.tsx      # Partner management
│   │   ├── Teams.tsx         # Team management
│   │   ├── Installations.tsx # Installation overview
│   │   └── Settings.tsx      # Configuration
│   ├── partner/
│   │   ├── Dashboard.tsx     # Main dashboard
│   │   ├── Installations.tsx # Installation list
│   │   ├── TimelineDashboard.tsx # Gantt chart
│   │   └── PartnerPortal.tsx # Portal layout
│   └── technician/
│       ├── Dashboard.tsx     # Technician dashboard
│       └── TechnicianPortal.tsx # Portal layout
├── components/
│   ├── DashboardLayout.tsx   # Sidebar layout
│   ├── PDFViewer.tsx         # PDF viewer
│   └── ui/                   # shadcn/ui components
└── lib/
    └── trpc.ts              # tRPC client setup
```

### 2. Implementare Admin Dashboard
```typescript
// pages/admin/Partners.tsx
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';

export default function PartnersPage() {
  const { data: partners } = trpc.admin.partners.list.useQuery();
  const createMutation = trpc.admin.partners.create.useMutation();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Partner Management</h1>
      
      <Table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Stato</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {partners?.map((partner) => (
            <tr key={partner.id}>
              <td>{partner.name}</td>
              <td>{partner.email}</td>
              <td>{partner.isActive ? 'Attivo' : 'Inattivo'}</td>
              <td>
                <Button>Modifica</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
```

### 3. Implementare Partner Portal
```typescript
// pages/partner/Dashboard.tsx
import { trpc } from '@/lib/trpc';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { it } from 'date-fns/locale';

const localizer = dateFnsLocalizer({
  format, parse, startOfWeek, getDay,
  locales: { 'it': it },
});

export default function PartnerDashboard() {
  const { data: installations } = trpc.partner.myInstallations.useQuery({
    partnerId: partner.id,
  });

  const events = installations?.map((inst) => ({
    id: inst.id,
    title: inst.customerName,
    start: new Date(inst.scheduledStart),
    end: new Date(inst.scheduledEnd),
    resource: inst,
  })) || [];

  return (
    <div className="h-screen">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
      />
    </div>
  );
}
```

### 4. Implementare PDF Viewer
```typescript
// components/PDFViewer.tsx
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PDFViewer({ isOpen, onClose, pdfUrl }) {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh]">
        <iframe
          src={`${pdfUrl}#page=${currentPage}`}
          className="w-full h-full"
        />
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            <Button onClick={() => setCurrentPage(p => p - 1)}>
              <ChevronLeft />
            </Button>
            <span>Page {currentPage}</span>
            <Button onClick={() => setCurrentPage(p => p + 1)}>
              <ChevronRight />
            </Button>
          </div>
          
          <Button onClick={() => window.open(pdfUrl, '_blank')}>
            <Download className="mr-2" />
            Scarica
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🔗 Integrazione Salesforce

### 1. Webhook Receiver
```typescript
// server/webhook.ts
app.post('/api/webhook/salesforce', async (req, res) => {
  const {
    ServiceAppointmentId,
    CustomerName,
    InstallationAddress,
    // ... altri campi
  } = req.body;

  try {
    // Check if installation exists
    const existing = await db.query.installations.findFirst({
      where: (installations, { eq }) =>
        eq(installations.serviceAppointmentId, ServiceAppointmentId),
    });

    if (existing) {
      // Update existing
      await db.update(schema.installations)
        .set({ customerName, installationAddress })
        .where(eq(schema.installations.id, existing.id));
    } else {
      // Create new
      await db.insert(schema.installations).values({
        serviceAppointmentId: ServiceAppointmentId,
        customerName,
        installationAddress,
        status: 'pending',
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Webhook Sender
```typescript
// server/salesforceWebhook.ts
export async function sendAcceptanceToSalesforce(installationId: number) {
  const installation = await db.query.installations.findFirst({
    where: (installations, { eq }) => eq(installations.id, installationId),
  });

  const webhookUrl = process.env.SALESFORCE_WEBHOOK_URL;
  
  const payload = {
    eventType: 'acceptance',
    ServiceAppointmentId: installation.serviceAppointmentId,
    Status: 'Accepted',
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return response.ok;
}
```

---

## 📱 Responsive Design

### Mobile-First Approach
```typescript
// Tailwind breakpoints
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px

// Example responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

### Key Responsive Components
1. **Admin Dashboard** - Sidebar collapsible su mobile
2. **Partner Portal** - Gantt chart scrollabile orizzontalmente
3. **Technician App** - Ottimizzato per schermi piccoli

---

## 🚀 Deployment

### 1. Preparare Build
```bash
npm run build
```

### 2. Opzioni Deployment

#### Opzione A: Vercel
```bash
npm install -g vercel
vercel
```

#### Opzione B: Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

#### Opzione C: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 3. Variabili Ambiente Production
Configura su Vercel/Netlify/Docker:
```
DATABASE_URL=postgresql://...
SALESFORCE_WEBHOOK_URL=https://...
GOOGLE_MAPS_API_KEY=...
JWT_SECRET=...
```

---

## 📚 Risorse Utili

### Documentazione
- [tRPC Documentation](https://trpc.io)
- [React Big Calendar](https://jquense.github.io/react-big-calendar/)
- [Drizzle ORM](https://orm.drizzle.team)
- [Supabase](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)

### Librerie Consigliate
- `react-dnd` - Drag and drop
- `sonner` - Toast notifications
- `lucide-react` - Icons
- `date-fns` - Date utilities
- `zod` - Schema validation

---

## 🔐 Security Best Practices

1. **Environment Variables** - Non committare `.env` files
2. **CORS** - Configurare CORS per Salesforce
3. **JWT** - Implementare token refresh
4. **RLS** - Abilitare Row Level Security su Supabase
5. **Input Validation** - Usare Zod per validare input
6. **Rate Limiting** - Implementare rate limiting su API

---

## 🐛 Troubleshooting

### Problema: Webhook non ricevuti
**Soluzione:** Verificare:
- URL webhook configurato correttamente in Salesforce
- Firewall consente connessioni in entrata
- Logs server per errori

### Problema: Database connection error
**Soluzione:**
- Verificare DATABASE_URL
- Controllare IP whitelist su Supabase
- Testare connessione con `psql`

### Problema: tRPC client non funziona
**Soluzione:**
- Verificare URL endpoint tRPC
- Controllare CORS configuration
- Verificare token JWT valido

---

## 📞 Support

Per domande o problemi:
1. Consulta la documentazione ufficiale
2. Controlla i logs server
3. Verifica le variabili ambiente
4. Testa con Postman/curl

---

**Ultima Aggiornamento:** 5 Novembre 2025
**Versione:** 1.0.0

