# Partner Portal TODO

## Fase 1: Database Schema e Configurazione
- [x] Definire schema database per partner, squadre, installazioni
- [x] Definire schema database per configurazione API (Google Maps, Salesforce)
- [x] Aggiungere campo Partner ID Salesforce nella tabella partner
- [x] Aggiungere campo Team ID Salesforce nella tabella squadre

## Fase 2: Backend - Webhook e Integrazione
- [x] Implementare endpoint POST per ricevere webhook da Salesforce
- [x] Implementare integrazione Google Maps API per calcolo distanze
- [x] Implementare logica di invio webhook a Salesforce (schedulazione)
- [x] Creare procedure tRPC per gestione installazioni (admin)
- [x] Creare procedure tRPC per gestione squadre (admin)
- [x] Creare procedure tRPC per gestione partner (admin)
- [x] Creare procedure tRPC per configurazione API (admin)

## Fase 3: Frontend - Interfaccia Admin
- [x] Implementare dashboard admin per gestione partner
- [x] Implementare creazione/modifica/eliminazione partner con Partner ID Salesforce
- [x] Implementare gestione squadre con Team ID Salesforce
- [x] Implementare pagina configurazione API (Google Maps, Salesforce Webhook URL)
- [x] Implementare sistema di ruoli (admin vs partner)
- [x] Implementare visualizzazione installazioni

## Fase 3b: Frontend - Autenticazione e Profilo Partner
- [x] Implementare pagina di login con username/password
- [x] Implementare dashboard principale con lista installazioni
- [x] Implementare visualizzazione squadre partner

## Fase 4: Frontend - Gestione Squadre
- [x] Implementare visualizzazione squadre nella dashboard partner

## Fase 5: Frontend - Planner e Schedulazione
- [x] Implementare calendario/planner con drag-and-drop
- [x] Implementare assegnazione installazioni a squadre
- [x] Implementare calcolo automatico tempo di viaggio
- [x] Implementare visualizzazione installazioni in attesa

## Fase 6: Frontend - Dettagli Installazione
- [x] Implementare visualizzazione dati cliente nel planner
- [x] Implementare dialog schedulazione con dettagli installazione

## Fase 7: Testing e Documentazione
- [x] Test endpoint webhook in ingresso
- [x] Test endpoint webhook in uscita
- [x] Test interfaccia admin
- [x] Test interfaccia partner
- [x] Documentazione API e configurazione

## Fase 8: Miglioramenti Interfaccia Partner
- [x] Aggiungere modulo a sinistra con lista completa installazioni
- [x] Implementare visualizzazione dettaglio installazione (sola lettura)
- [x] Modificare webhook in uscita per inviare solo date (non Partner/Team ID)
- [x] Implementare webhook di cancellazione installazione da Salesforce

## Fase 9: Visualizzazione Multi-Squadra Timeline
- [x] Implementare menu a sinistra con installazioni in attesa
- [x] Creare visualizzazione timeline/Gantt con tutte le squadre
- [x] Mostrare slot installazioni per squadra (stile Field Service)
- [x] Permettere drag-and-drop installazioni negli slot delle squadre
- [x] Aggiungere controlli navigazione (1/2/3 giorni, avanti/indietro)