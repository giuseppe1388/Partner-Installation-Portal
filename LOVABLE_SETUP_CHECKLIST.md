# Lovable Setup Checklist - Partner Installation Portal

Una checklist passo-passo per ricreare l'app su Lovable.

## ✅ Fase 1: Preparazione

- [ ] Leggere la guida completa `LOVABLE_GUIDE.md`
- [ ] Preparare account Supabase
- [ ] Preparare account Salesforce (per webhook)
- [ ] Preparare Google Maps API key
- [ ] Preparare credenziali OAuth Manus

## ✅ Fase 2: Setup Progetto Lovable

- [ ] Creare nuovo progetto su Lovable
- [ ] Selezionare template React + TypeScript
- [ ] Configurare nome progetto: "Partner Installation Portal"
- [ ] Creare file `.env.local` con variabili ambiente
- [ ] Installare dipendenze npm

## ✅ Fase 3: Database Supabase

- [ ] Creare progetto Supabase
- [ ] Copiare connection string PostgreSQL
- [ ] Eseguire script `database_supabase.sql`
- [ ] Verificare creazione tabelle
- [ ] Configurare Row Level Security (RLS)
- [ ] Aggiungere API key Supabase a `.env.local`

## ✅ Fase 4: Backend Setup

### tRPC Configuration
- [ ] Creare file `server/trpc.ts` con configurazione tRPC
- [ ] Creare file `server/routers.ts` con procedure tRPC
- [ ] Implementare router admin
- [ ] Implementare router partner
- [ ] Implementare router technician
- [ ] Testare endpoint tRPC con Postman

### Database Layer
- [ ] Creare file `server/db.ts` con query helpers
- [ ] Implementare funzioni per users
- [ ] Implementare funzioni per partners
- [ ] Implementare funzioni per teams
- [ ] Implementare funzioni per installations
- [ ] Implementare funzioni per technicians

### Webhook Integration
- [ ] Creare file `server/webhook.ts`
- [ ] Implementare endpoint POST `/api/webhook/salesforce`
- [ ] Implementare handler per creazione installazioni
- [ ] Implementare handler per aggiornamento installazioni
- [ ] Testare webhook con curl/Postman

### Salesforce Sync
- [ ] Creare file `server/salesforceWebhook.ts`
- [ ] Implementare `sendAcceptanceToSalesforce()`
- [ ] Implementare `sendRejectionToSalesforce()`
- [ ] Implementare `sendScheduleToSalesforce()`
- [ ] Testare webhook outbound a Salesforce

## ✅ Fase 5: Frontend - Struttura Base

### Layout e Routing
- [ ] Creare `client/src/App.tsx` con routing
- [ ] Creare `client/src/components/DashboardLayout.tsx`
- [ ] Creare `client/src/lib/trpc.ts` client setup
- [ ] Implementare autenticazione OAuth
- [ ] Implementare logout

### Shared Components
- [ ] Creare `client/src/components/PDFViewer.tsx`
- [ ] Creare dialog components (shadcn/ui)
- [ ] Creare form components
- [ ] Creare table components
- [ ] Creare badge/status components

## ✅ Fase 6: Frontend - Admin Dashboard

### Partners Management
- [ ] Creare `client/src/pages/admin/Partners.tsx`
- [ ] Implementare lista partner
- [ ] Implementare form creazione partner
- [ ] Implementare form modifica partner
- [ ] Implementare eliminazione partner
- [ ] Implementare search/filter

### Teams Management
- [ ] Creare `client/src/pages/admin/Teams.tsx`
- [ ] Implementare lista squadre
- [ ] Implementare form creazione squadra
- [ ] Implementare form modifica squadra
- [ ] Implementare eliminazione squadra
- [ ] Implementare assegnazione a partner

### Installations Overview
- [ ] Creare `client/src/pages/admin/Installations.tsx`
- [ ] Implementare lista installazioni
- [ ] Implementare filtri per stato
- [ ] Implementare ricerca
- [ ] Implementare visualizzazione dettagli
- [ ] Implementare export CSV

### Settings
- [ ] Creare `client/src/pages/admin/Settings.tsx`
- [ ] Implementare form configurazione API keys
- [ ] Implementare form webhook URLs
- [ ] Implementare form Google Maps API
- [ ] Implementare salvataggio configurazioni

## ✅ Fase 7: Frontend - Partner Portal

### Dashboard
- [ ] Creare `client/src/pages/partner/Dashboard.tsx`
- [ ] Implementare calendar view (react-big-calendar)
- [ ] Implementare drag-and-drop scheduling
- [ ] Implementare team selector
- [ ] Implementare date navigation

### Installations List
- [ ] Creare `client/src/pages/partner/Installations.tsx`
- [ ] Implementare lista installazioni
- [ ] Implementare filtri per stato
- [ ] Implementare ricerca
- [ ] Implementare dialog dettagli
- [ ] Implementare pulsante "Visualizza PDF"

### Timeline/Gantt Chart
- [ ] Creare `client/src/pages/partner/TimelineDashboard.tsx`
- [ ] Implementare visualizzazione timeline
- [ ] Implementare drag-and-drop su timeline
- [ ] Implementare snapping a 15 minuti
- [ ] Implementare team rows
- [ ] Implementare context menu

### Actions
- [ ] Implementare pulsante "Accetta"
- [ ] Implementare pulsante "Rifiuta" con motivazione
- [ ] Implementare dialog di conferma
- [ ] Implementare webhook sync con Salesforce
- [ ] Implementare toast notifications

## ✅ Fase 8: Frontend - Technician App

### Dashboard
- [ ] Creare `client/src/pages/technician/Dashboard.tsx`
- [ ] Implementare date picker
- [ ] Implementare lista installazioni giornaliere
- [ ] Implementare ordinamento per orario
- [ ] Implementare status colors

### Installation Details
- [ ] Implementare dialog dettagli installazione
- [ ] Implementare visualizzazione immagini
- [ ] Implementare pulsante "Visualizza PDF"
- [ ] Implementare pulsante "Chiama cliente"
- [ ] Implementare pulsante "Google Maps"
- [ ] Implementare pulsante "Carica Moduli"

### Status Management
- [ ] Implementare pulsante "Inizia Lavoro"
- [ ] Implementare pulsante "Completa"
- [ ] Implementare dialog note completamento
- [ ] Implementare upload foto/documenti
- [ ] Implementare sync con database

## ✅ Fase 9: Styling e UX

### Responsive Design
- [ ] Testare su desktop (1920x1080)
- [ ] Testare su tablet (768px)
- [ ] Testare su mobile (375px)
- [ ] Verificare sidebar collapsibile
- [ ] Verificare menu mobile

### Theming
- [ ] Configurare colori brand
- [ ] Configurare font
- [ ] Configurare spacing
- [ ] Configurare shadows
- [ ] Implementare dark mode (opzionale)

### Accessibility
- [ ] Verificare contrast colori
- [ ] Verificare keyboard navigation
- [ ] Verificare focus rings
- [ ] Aggiungere aria-labels
- [ ] Testare con screen reader

## ✅ Fase 10: Testing

### Unit Tests
- [ ] Testare funzioni database
- [ ] Testare tRPC procedures
- [ ] Testare webhook handlers
- [ ] Testare utility functions

### Integration Tests
- [ ] Testare flusso autenticazione
- [ ] Testare creazione installazione
- [ ] Testare accettazione installazione
- [ ] Testare rifiuto installazione
- [ ] Testare schedulazione installazione

### E2E Tests
- [ ] Testare flusso admin completo
- [ ] Testare flusso partner completo
- [ ] Testare flusso technician completo
- [ ] Testare sincronizzazione Salesforce

### Manual Testing
- [ ] Testare su browser Chrome
- [ ] Testare su browser Firefox
- [ ] Testare su browser Safari
- [ ] Testare su mobile iOS
- [ ] Testare su mobile Android

## ✅ Fase 11: Performance Optimization

- [ ] Implementare code splitting
- [ ] Ottimizzare bundle size
- [ ] Implementare lazy loading
- [ ] Configurare caching
- [ ] Testare performance con Lighthouse

## ✅ Fase 12: Security

- [ ] Implementare CORS correttamente
- [ ] Validare input con Zod
- [ ] Implementare rate limiting
- [ ] Configurare RLS su Supabase
- [ ] Implementare HTTPS
- [ ] Implementare CSP headers
- [ ] Nascondere API keys in environment
- [ ] Implementare token refresh JWT

## ✅ Fase 13: Documentation

- [ ] Documentare API endpoints
- [ ] Documentare database schema
- [ ] Documentare environment variables
- [ ] Documentare deployment process
- [ ] Creare README.md
- [ ] Creare CONTRIBUTING.md

## ✅ Fase 14: Deployment

### Pre-Deployment
- [ ] Verificare build senza errori
- [ ] Eseguire test suite
- [ ] Verificare environment variables
- [ ] Backup database
- [ ] Testare webhook URLs

### Deployment Options
- [ ] Opzione A: Vercel
  - [ ] Connettere repository GitHub
  - [ ] Configurare environment variables
  - [ ] Eseguire build
  - [ ] Testare su production

- [ ] Opzione B: Netlify
  - [ ] Connettere repository GitHub
  - [ ] Configurare environment variables
  - [ ] Eseguire build
  - [ ] Testare su production

- [ ] Opzione C: Docker
  - [ ] Creare Dockerfile
  - [ ] Creare docker-compose.yml
  - [ ] Build image
  - [ ] Push a registry (Docker Hub/ECR)
  - [ ] Deploy su server

### Post-Deployment
- [ ] Verificare applicazione live
- [ ] Testare flussi utente
- [ ] Monitorare logs
- [ ] Configurare monitoring/alerting
- [ ] Comunicare URL a stakeholder

## ✅ Fase 15: Maintenance

- [ ] Configurare backup automatici
- [ ] Implementare monitoring
- [ ] Implementare logging
- [ ] Pianificare aggiornamenti dipendenze
- [ ] Pianificare review sicurezza
- [ ] Documentare runbook

---

## 📊 Tempo Stimato

| Fase | Tempo |
|------|-------|
| 1-2 | 1 ora |
| 3-4 | 2 ore |
| 5-6 | 4 ore |
| 7-8 | 6 ore |
| 9-10 | 4 ore |
| 11-12 | 3 ore |
| 13-14 | 2 ore |
| 15 | Ongoing |
| **TOTALE** | **~22 ore** |

---

## 🎯 Success Criteria

- ✅ Tutte le fasi completate
- ✅ Nessun errore TypeScript
- ✅ Nessun errore runtime
- ✅ Tutti i test passano
- ✅ Performance Lighthouse > 80
- ✅ Responsive su tutti i device
- ✅ Sincronizzazione Salesforce funzionante
- ✅ Autenticazione OAuth funzionante
- ✅ Database backup configurato
- ✅ Monitoring configurato

---

**Creato:** 5 Novembre 2025
**Versione:** 1.0.0

