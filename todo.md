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

## Fase 10: Redesign Schedulatore Stile Salesforce Field Service
- [x] Rifare layout con sidebar sinistra (lista installazioni), colonna centrale (risorse), timeline destra
- [x] Implementare blocchi colorati di dimensione variabile (basata su durata)
- [x] Mostrare nome cliente/servizio nei blocchi
- [x] Implementare scroll verticale per molte squadre
- [x] Migliorare visualizzazione compatta (molte righe visibili)

## Fase 11: Menu Navigazione Partner e Miglioramenti Planner
- [x] Aggiungere menu navigazione (Planner, Installazioni)
- [x] Mostrare solo installazioni pending/cancelled nella sidebar planner
- [x] Aggiungere legenda colori per stati installazioni
- [x] Aggiungere selezione periodo (Oggi, 3 giorni, 1 settimana)
- [x] Creare pagina lista installazioni completa con filtri
- [x] Visualizzare documenti/allegati caricati dai tecnici (preparato per integrazione)

## Fase 12: Technician Mobile App
- [x] Creare tabella technicians nel database
- [x] Implementare login tecnici (username/password)
- [x] Creare interfaccia mobile lista interventi ordinati per ora
- [x] Implementare selezione data per vedere interventi
- [x] Creare pagina dettaglio intervento con pulsante "Chiama"
- [x] Mostrare allegati e link caricamento documenti (Digital Experience)
- [x] Implementare pulsanti "Inizia Lavoro" e "Completa" per aggiornare stato

## Fase 13: Miglioramenti UI Partner Portal
- [x] Sostituire menu tab orizzontale con menu laterale fisso (stile admin)

## Fase 14: Resize Blocchi Planner
- [x] Implementare resize dei blocchi installazioni (trascinare bordi)
- [x] Permettere aumento/diminuzione durata slot
- [x] Aggiornare ore di fine quando resize
- [x] Inviare durata modificata nel webhook a Salesforce



## Fase 15: Menu Contestuale e Gestione Stati
- [x] Implementare menu contestuale (tasto destro) su appuntamenti
- [x] Aggiungere opzioni cambio stato nel menu contestuale
- [x] Implementare stato "Da Confermare" quando sposti uno slot
- [x] Inviare webhook a Salesforce quando cambio stato a "Schedulato"
- [x] Webhook include: Service Appointment ID, Start DateTime, End DateTime



## Fase 16: Miglioramenti Cambio Stato e Modifica Date
- [x] Inviare webhook di cancellazione a Salesforce quando stato = "Cancelled"
- [x] Rimuovere appuntamento dallo slot quando stato = "Cancelled"
- [x] Rimuovere funzionalità resize dei blocchi
- [x] Aggiungere dialog per modificare data/ora inizio e fine
- [x] Permettere modifica solo di start/end datetime (non durata)
- [x] Aggiornare webhook a Salesforce quando modifichi le date



## Bug Report
- [x] Quando annullo uno slot, non si toglie dal calendario (RISOLTO: aggiunto filtro status === 'cancelled')
- [x] Resize non funziona (RISOLTO: rimosso react-resizable come richiesto)



## Fase 17: Miglioramenti Technician App
- [x] Aggiungere pulsante "Carica Moduli" nella pagina dettaglio intervento
- [x] Pulsante apre il link dal campo completionLink del record cliente



## Fase 18: Aggiunta Pulsanti Navigazione (Google Maps e Waze)
- [x] Aggiungere campi googleMapsLink e wazeLink allo schema database
- [x] Aggiungere pulsanti Google Maps e Waze nella technician app
- [x] Pulsanti aprono i link dal record cliente



## Fase 19: Generazione Automatica Link Google Maps e Waze
- [x] Rimuovere campi googleMapsLink e wazeLink dal database
- [x] Generare link Google Maps automaticamente da installationAddress
- [x] Generare link Waze automaticamente da installationAddress
- [x] Mostrare pulsanti nel dialog tecnico senza necessità di link manuali



## Bug Report
- [x] Login tecnico non persiste dopo refresh pagina (RISOLTO: aggiunta persistenza localStorage)



- [x] Appuntamenti annullati visibili nella technician app (RISOLTO: aggiunto filtro status !== 'cancelled')



## Fase 20: Pagina Gestione Installazioni nel Partner Portal
- [x] Creare pagina tabella con tutte le installazioni
- [x] Aggiungere colonna stato con dropdown per cambio stato
- [x] Implementare filtro per stato
- [x] Implementare ricerca unificata (nome, cognome, telefono, indirizzo)
- [x] Aggiungere pulsante per inviare webhook a Salesforce quando cambio stato

## Fase 21: Snapping a 15 Minuti nel Planner
- [x] Implementare logica di snapping a intervalli di 15 minuti quando trascini gli slot
- [x] Arrotondare automaticamente l'ora di inizio agli slot di 15 minuti più vicini
- [x] Testare il drag-and-drop con snapping


## Fase 22: Aggiornamenti Live senza Refresh Pagina
- [x] Implementare optimistic updates nel planner partner
- [x] Implementare optimistic updates nella technician app
- [x] Aggiornare lo stato degli appuntamenti in tempo reale senza refresh
- [x] Ripristinare i dati in caso di errore

## Fase 23: Snapping a 15 Minuti Corretto con useRef
- [x] Implementare logica di snapping a intervalli di 15 minuti
- [x] Usare useRef per ottenere un riferimento affidabile alla riga
- [x] Arrotondare automaticamente l'ora di inizio agli slot di 15 minuti più vicini

## Fase 24: Indicatore Visivo durante il Drag-and-Drop
- [x] Aggiungere un tooltip che mostra l'ora di inizio e fine mentre trascini
- [x] Mostrare un'anteprima del blocco nel calendario durante il drag
- [x] Evidenziare la posizione di rilascio con snapping a 15 minuti

## Bug da Risolvere

- [x] Verificare che il calcolo dell'ora di fine sia corretto quando si trascina uno slot con snapping a 15 minuti
- [x] Verificare che il blocco nel calendario mostri correttamente l'inizio e la fine (es. 12:30-13:30)
- [ ] Pagina Installazioni deve avere una tabella con ricerca e cambio stato inline
- [ ] Aggiungere pulsante di ricerca nella tabella Installazioni
- [ ] Aggiungere possibilità di cambiare stato direttamente dalla tabella Installazioni



## Fase 25: Separazione Planner e Installazioni
- [x] Separare la lista delle installazioni dal planner in due pagine distinte
- [x] La lista installazioni ha una tabella con colonne (Cliente, Telefono, Indirizzo, Durata, Stato, Azioni)
- [x] Aggiungere pulsante di ricerca nella tabella Installazioni
- [x] Aggiungere possibilità di cambiare stato direttamente dalla tabella Installazioni
- [x] Replicare esattamente la stessa grafica di prima (logo, icone, colori)
- [x] Mantenere la stessa visualizzazione degli appuntamenti nel planner
- [x] Usare le stesse icone per i pulsanti di navigazione

## Fase 26: Aggiungere Stato "Confermato"
- [x] Aggiungere lo stato "Confermato" agli appuntamenti
- [x] Aggiungere il colore per lo stato "Confermato" nella legenda
- [x] Aggiungere l'opzione "Confermato" nel menu di cambio stato
- [ ] Implementare il webhook a Salesforce quando lo stato diventa "Confermato"

## Bug da Risolvere

- [x] Il drag-and-drop degli slot "Da Schedulare" non funziona - gli slot non vengono spostati nel calendario



## Fase 27: Menu Collapsibile e Responsive Design
- [x] Aggiungere toggle per aprire/chiudere il menu a sinistra
- [x] Adattare il planner a smartphone (responsive design)
- [x] Testare su dispositivi mobili
- [x] Aggiungere hamburger menu per mobile

## Fase 28: Guida Integrazione Salesforce
- [ ] Creare documentazione su come collegare a Salesforce
- [ ] Definire il formato dei dati per l'integrazione
- [ ] Testare l'integrazione con Salesforce



## Bug da Risolvere (Continua)

- [x] Cambiare i colori dei badge di stato da chiaro a scuro/nero per migliore leggibilità
- [x] Aggiungere colonna con data di inizio e fine nella tabella Installazioni
- [x] Permettere di cambiare la data oltre allo stato nel dialog di cambio stato



## Bug da Risolvere (Continua 2)

- [x] Aggiungere scroll orizzontale sul gantt per scorrere a destra
- [x] Spostare il pulsante Esci in basso nel menu a sinistra
- [x] Cambiare i colori grigio delle installazioni da trascinare (renderli più visibili)
- [x] Bloccare la colonna "Squadre" e sincronizzare lo scroll con una sola barra

