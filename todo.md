# Partner Portal TODO

## Fase 1: Database Schema e Configurazione
- [x] Definire schema database per partner, squadre, installazioni
- [x] Definire schema database per configurazione API (Google Maps, Salesforce)
- [x] Aggiungere campo Partner ID Salesforce nella tabella partner
- [x] Aggiungere campo Team ID Salesforce nella tabella squadre

## Fase 2: Backend - Webhook e Integrazione
- [x] Implementare endpoint POST per ricevere webhook da Salesforce
- [x] Implementare integrazione Google Maps API per calcolo distanze
- [ ] Implementare logica di invio webhook a Salesforce (schedulazione)
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
- [ ] Implementare pagina di login con username/password
- [ ] Implementare pagina profilo partner con indirizzo di partenza
- [ ] Implementare dashboard principale con lista installazioni

## Fase 4: Frontend - Gestione Squadre
- [ ] Implementare interfaccia per creare/modificare squadre
- [ ] Implementare lista squadre con membri

## Fase 5: Frontend - Planner e Schedulazione
- [ ] Implementare calendario/planner con drag-and-drop
- [ ] Implementare assegnazione installazioni a squadre
- [ ] Implementare calcolo automatico tempo di viaggio
- [ ] Implementare visualizzazione work order per squadra

## Fase 6: Frontend - Dettagli Installazione
- [ ] Implementare pagina dettaglio installazione con dati cliente
- [ ] Implementare visualizzazione immagini tecniche
- [ ] Implementare link a Digital Experience Salesforce

## Fase 7: Testing e Documentazione
- [ ] Test endpoint webhook in ingresso
- [ ] Test endpoint webhook in uscita
- [ ] Test completo flusso di schedulazione
- [ ] Documentazione API e configurazione

