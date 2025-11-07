# Decisione sulla Libreria Gantt Chart

## Analisi della Scelta

### Libreria Valutata: gantt-schedule-timeline-calendar
**Repository:** https://github.com/neuronetio/gantt-schedule-timeline-calendar

### Conclusione: Mantenimento del Gantt Personalizzato ✅

Dopo aver valutato la libreria `gantt-schedule-timeline-calendar`, abbiamo deciso di mantenere il Gantt chart personalizzato sviluppato con `react-dnd`. Ecco i motivi:

---

## 🔍 Analisi Comparativa

### gantt-schedule-timeline-calendar

#### ✅ Vantaggi
- Libreria completa e matura (v3.41.2)
- Supporto per timeline multi-riga
- Rendering ottimizzato per grandi dataset
- Tema CSS personalizzabile
- Supporto per zoom e pan
- Drag-and-drop integrato

#### ❌ Svantaggi
- **Complessità di Integrazione:** La libreria richiede una struttura di state molto specifica (`DeepState`) che non è compatibile con il nostro modello di dati
- **Problemi di Tipizzazione TypeScript:** La libreria non fornisce type definitions complete, causando errori TS2740 e TS2339
- **API Poco Chiara:** La documentazione non è sufficientemente dettagliata per integrare correttamente gli event listeners
- **Dipendenze Pesanti:** Aggiunge ~616 dipendenze al progetto
- **Overhead di Performance:** Per il nostro caso d'uso (max 50-100 installazioni), il vantaggio di performance è minimo
- **Curva di Apprendimento:** Richiede refactoring significativo del codice esistente

### Gantt Personalizzato (react-dnd)

#### ✅ Vantaggi
- **Perfettamente Integrato:** Già funzionante e testato nel progetto
- **Type Safety:** Completa compatibilità TypeScript
- **Controllo Totale:** Possiamo personalizzare ogni aspetto
- **Leggerezza:** Usa solo `react-dnd` e `date-fns`
- **Performance Ottimale:** Snapping a 15 minuti, anteprima visiva in tempo reale
- **Manutenibilità:** Codice semplice e ben documentato
- **Flessibilità:** Facile aggiungere nuove feature (colori status, filtri, etc.)

#### ❌ Svantaggi
- Non supporta nativamente grandi dataset (>1000 elementi)
- Zoom limitato (80px per ora)
- Meno feature out-of-the-box

---

## 📊 Confronto Tecnico

| Aspetto | gantt-schedule-timeline-calendar | Gantt Personalizzato |
|---|---|---|
| **Integrazione** | Difficile | Facile ✅ |
| **Type Safety** | Scarsa | Completa ✅ |
| **Performance** | Eccellente | Buona ✅ |
| **Dimensione Bundle** | +616 dipendenze | +0 dipendenze ✅ |
| **Curva Apprendimento** | Alta | Bassa ✅ |
| **Personalizzazione** | Media | Alta ✅ |
| **Manutenibilità** | Media | Alta ✅ |
| **Supporto Zoom** | Sì | Limitato |
| **Rendering Virtuale** | Sì | No |

---

## 🎯 Caso d'Uso

### Partner Installation Portal

**Caratteristiche:**
- Max 5-10 squadre per partner
- Max 50-100 installazioni per settimana
- Timeline: 08:00 - 20:00 (12 ore)
- Intervallo snap: 15 minuti
- Drag-and-drop per schedulazione

**Conclusione:** Il Gantt personalizzato è **perfetto** per questo caso d'uso.

---

## 🚀 Miglioramenti Futuri

Se in futuro avremo bisogno di supportare:
- Migliaia di installazioni
- Timeline multi-settimana
- Rendering virtuale
- Zoom avanzato

Allora potremmo valutare:
1. **Upgrade a libreria specifica:** `gantt-schedule-timeline-calendar` (con refactoring)
2. **Alternativa leggera:** `react-big-calendar` + custom Gantt
3. **Soluzione custom avanzata:** Usare Canvas API per performance ultra-ottimale

---

## 📝 Decisione Finale

**✅ Mantenere il Gantt Chart Personalizzato**

Il Gantt chart sviluppato con `react-dnd` è:
- ✅ Già funzionante e testato
- ✅ Perfettamente integrato nel progetto
- ✅ Completamente type-safe
- ✅ Facile da manutenere e estendere
- ✅ Ottimale per il nostro caso d'uso
- ✅ Leggero e performante

---

## 📚 Documentazione Correlata

- [GANTT_FEATURES.md](./GANTT_FEATURES.md) - Caratteristiche complete del Gantt
- [CALENDAR_POSITIONING_LOGIC.md](./CALENDAR_POSITIONING_LOGIC.md) - Logica di posizionamento
- [TimelineDashboard.tsx](./client/src/pages/partner/TimelineDashboard.tsx) - Implementazione

---

**Data Decisione:** 5 Novembre 2025
**Versione:** 1.0.0

