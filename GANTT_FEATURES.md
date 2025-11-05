# Caratteristiche Gantt Chart - Partner Installation Portal

Documentazione completa delle funzionalità del Gantt chart per la pianificazione installazioni.

## 📋 Indice

1. [Panoramica](#panoramica)
2. [Caratteristiche Principali](#caratteristiche-principali)
3. [Interfaccia Utente](#interfaccia-utente)
4. [Drag and Drop](#drag-and-drop)
5. [Gestione Squadre](#gestione-squadre)
6. [Gestione Installazioni](#gestione-installazioni)
7. [Visualizzazione Timeline](#visualizzazione-timeline)
8. [Interazioni Utente](#interazioni-utente)
9. [Codice Implementazione](#codice-implementazione)

---

## 🎯 Panoramica

Il **Gantt Chart** è uno strumento di pianificazione visuale che permette ai partner di:
- Visualizzare tutte le installazioni assegnate su una timeline
- Pianificare installazioni trascinandole su date e orari specifici
- Gestire più squadre contemporaneamente
- Visualizzare conflitti di orario
- Modificare status delle installazioni in tempo reale

### Stack Tecnologico
- **Libreria:** react-dnd (Drag and Drop)
- **Date Management:** date-fns
- **UI:** shadcn/ui + Tailwind CSS
- **Backend:** tRPC

---

## ✨ Caratteristiche Principali

### 1. Visualizzazione Multi-Squadra
```
┌─────────────────────────────────────────────────────────────┐
│ GANTT CHART - 5 Novembre 2025                              │
├─────────────────────────────────────────────────────────────┤
│ Squadra Nord    │ 08:00 │ 09:00 │ 10:00 │ 11:00 │ 12:00 │ │
│ [Cliente A]     │ ████████████ (120 min)                    │
│                 │                                            │
├─────────────────────────────────────────────────────────────┤
│ Squadra Sud     │ 08:00 │ 09:00 │ 10:00 │ 11:00 │ 12:00 │ │
│ [Cliente B]     │            ████████████ (120 min)        │
│                 │                                            │
├─────────────────────────────────────────────────────────────┤
│ Squadra Milano  │ 08:00 │ 09:00 │ 10:00 │ 11:00 │ 12:00 │ │
│ [Cliente C]     │                    ████████ (90 min)     │
│                 │                                            │
└─────────────────────────────────────────────────────────────┘
```

### 2. Drag and Drop Intuitivo
- **Trascinamento:** Seleziona un'installazione e trascinala su data/ora
- **Snapping:** Snap automatico a intervalli di 15 minuti
- **Anteprima:** Visualizza l'orario di inizio e fine durante il drag
- **Feedback Visivo:** Linea verticale e tooltip in tempo reale

### 3. Gestione dello Stato
```
Status Disponibili:
├─ pending (Grigio) - In attesa di accettazione
├─ scheduled (Blu) - Schedulata
├─ confirmed (Viola) - Confermata
├─ in_progress (Giallo) - In corso
├─ completed (Verde) - Completata
└─ cancelled (Rosso) - Annullata
```

### 4. Visualizzazione Temporale
- **Orario:** 08:00 - 20:00 (12 ore)
- **Larghezza Ora:** 80px
- **Altezza Riga:** 48px
- **Intervallo Snap:** 15 minuti

### 5. Installazioni Non Schedulate
```
┌─────────────────────────────────┐
│ INSTALLAZIONI DA SCHEDULARE     │
├─────────────────────────────────┤
│ ☐ Cliente A - Via Roma 10       │
│   Durata: 120 min               │
│   [Drag to schedule]            │
├─────────────────────────────────┤
│ ☐ Cliente B - Via Milano 20     │
│   Durata: 90 min                │
│   [Drag to schedule]            │
└─────────────────────────────────┘
```

---

## 🎨 Interfaccia Utente

### Layout Principale

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                       │
│ [← Prev] [5 Nov 2025] [Next →] [1 Day] [7 Days] [Logout]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ SIDEBAR                    │ GANTT CHART                    │
│                            │                                │
│ Installazioni da           │ Squadra Nord                   │
│ Schedulare:                │ ├─ 08:00 - 10:00 [Cliente A]  │
│                            │                                │
│ ☐ Cliente A               │ Squadra Sud                    │
│   120 min                  │ ├─ 09:00 - 11:00 [Cliente B]  │
│                            │                                │
│ ☐ Cliente B               │ Squadra Milano                 │
│   90 min                   │ ├─ 10:00 - 11:30 [Cliente C]  │
│                            │                                │
│ ☐ Cliente C               │                                │
│   60 min                   │                                │
│                            │                                │
└─────────────────────────────────────────────────────────────┘
```

### Componenti Principali

1. **Header Navigation**
   - Pulsanti precedente/successivo per navigare date
   - Selezione data corrente
   - Pulsanti per visualizzare 1 giorno o 7 giorni
   - Pulsante logout

2. **Sidebar Installazioni**
   - Lista installazioni non schedulate
   - Durata in minuti
   - Trascinabili nel Gantt

3. **Gantt Chart Area**
   - Timeline oraria (08:00 - 20:00)
   - Righe per ogni squadra
   - Blocchi installazione trascinabili
   - Griglia oraria

4. **Detail Panel**
   - Visualizzazione dettagli installazione
   - Pulsanti accetta/rifiuta
   - Informazioni cliente
   - Note tecniche

---

## 🔄 Drag and Drop

### Meccanica Drag and Drop

```typescript
// 1. User seleziona installazione
const [{ isDragging }, drag] = useDrag(() => ({
  type: ITEM_TYPE,
  item: { installation },
  collect: (monitor) => ({
    isDragging: !!monitor.isDragging(),
  }),
}));

// 2. User trascina su una squadra
const [{ isOver }, drop] = useDrop(() => ({
  accept: ITEM_TYPE,
  drop: (item: { installation }, monitor) => {
    // Calcola posizione
    const clientOffset = monitor.getClientOffset();
    const relativeX = clientOffset.x - rect.left;
    
    // Converti pixel in ore
    const hourOffset = relativeX / HOUR_WIDTH;
    let hour = Math.floor(hourOffset) + hours[0];
    let minute = Math.round((hourOffset - Math.floor(hourOffset)) * 60);
    
    // Snap a 15 minuti
    const remainder = minute % 15;
    if (remainder < 7.5) {
      minute = minute - remainder;
    } else {
      minute = minute - remainder + 15;
    }
    
    // Chiama backend per salvare
    onDrop(item.installation, team, date, hour, minute);
  },
  hover: (item, monitor) => {
    // Mostra anteprima durante hover
    setDragPosition({ hour, minute, x: relativeX, duration });
  },
}));

// 3. 3. Backend salva la schedulazione
scheduleMutation.mutate({
  installationId: installation.id,
  teamId: team.id,
  scheduledStart: new Date(date.getTime() + hour * 3600000 + minute * 60000),
  scheduledEnd: new Date(date.getTime() + (hour + duration/60) * 3600000 + minute * 60000)
});
```

### Snapping a 15 Minuti

Il sistema arrotonda automaticamente i minuti a intervalli di 15:
- 0-7 min → 0 min
- 8-22 min → 15 min
- 23-37 min → 30 min
- 38-52 min → 45 min
- 53-59 min → 60 min (prossima ora)

### Anteprima Visiva

Durante il drag, viene mostrato:
1. **Linea Verticale Rossa** - Posizione esatta del cursore
2. **Blocco Semitrasparente** - Anteprima della durata
3. **Tooltip** - Orario di inizio e fine
   ```
   09:00 - 11:00
   ```

---

## 👥 Gestione Squadre

### Visualizzazione Squadre

```typescript
// Carica squadre del partner
const { data: teams } = trpc.partner.myTeams.useQuery({
  partnerId: partner.id,
});

// Mostra una riga per ogni squadra
{teams?.map((team) => (
  <TeamRow
    key={team.id}
    team={team}
    date={currentDate}
    installations={scheduledInstallations}
    hours={hours}
    onDrop={handleDrop}
    onBlockClick={handleBlockClick}
  />
))}
```

### Informazioni Squadra

Ogni riga squadra contiene:
- **Nome Squadra** - Es. "Squadra Nord"
- **Installazioni Giornaliere** - Blocchi trascinabili
- **Spazio Libero** - Area per aggiungere nuove installazioni
- **Orari Operativi** - 08:00 - 20:00

### Colori Squadra

Ogni squadra ha un colore distintivo per facilitare l'identificazione:
- Squadra Nord - Blu
- Squadra Sud - Verde
- Squadra Milano - Arancione
- Squadra Roma - Rosso

---

## 📦 Gestione Installazioni

### Ciclo di Vita Installazione

```
pending (In Attesa)
    ↓ [Accetta]
accepted (Accettata)
    ↓ [Schedula]
scheduled (Schedulata)
    ↓ [Conferma]
confirmed (Confermata)
    ↓ [Inizia]
in_progress (In Corso)
    ↓ [Completa]
completed (Completata)

Alternative:
pending → [Rifiuta] → rejected (Rifiutata)
scheduled → [Annulla] → cancelled (Annullata)
```

### Proprietà Installazione

```typescript
interface Installation {
  id: number;
  serviceAppointmentId: string;
  customerName: string;
  installationAddress: string;
  installationType?: string;
  durationMinutes?: number;      // Durata in minuti (default 120)
  status: string;                 // pending, scheduled, etc.
  teamId?: number;                // Squadra assegnata
  scheduledStart?: Date;          // Inizio schedulazione
  scheduledEnd?: Date;            // Fine schedulazione
  technicalNotes?: string;        // Note tecniche
}
```

### Calcolo Durata

La larghezza del blocco nel Gantt è calcolata da:
```typescript
const durationHours = (installation.durationMinutes || 120) / 60;
const width = durationHours * HOUR_WIDTH;  // 80px per ora
```

Esempi:
- 60 min → 80px
- 90 min → 120px
- 120 min → 160px
- 150 min → 200px

### Filtraggio Installazioni

```typescript
// Installazioni non schedulate (sidebar)
const unscheduledInstallations = installations.filter(
  (inst) => inst.status === "pending" || inst.status === "cancelled"
);

// Installazioni schedulate (Gantt)
const scheduledInstallations = installations.filter(
  (inst) => inst.status !== "pending" && inst.scheduledStart
);

// Installazioni per squadra e data
const teamInstallations = installations.filter((inst) => {
  if (inst.teamId !== team.id || !inst.scheduledStart) return false;
  const instDate = parseISO(inst.scheduledStart);
  return format(instDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
});
```

---

## 📅 Visualizzazione Timeline

### Orari Visualizzati

```
08:00 ├─────────────────────────────────────────┤
09:00 ├─────────────────────────────────────────┤
10:00 ├─────────────────────────────────────────┤
11:00 ├─────────────────────────────────────────┤
12:00 ├─────────────────────────────────────────┤
13:00 ├─────────────────────────────────────────┤
14:00 ├─────────────────────────────────────────┤
15:00 ├─────────────────────────────────────────┤
16:00 ├─────────────────────────────────────────┤
17:00 ├─────────────────────────────────────────┤
18:00 ├─────────────────────────────────────────┤
19:00 ├─────────────────────────────────────────┤
20:00 └─────────────────────────────────────────┘
```

### Dimensioni

```typescript
const HOUR_WIDTH = 80;      // Larghezza di un'ora in pixel
const ROW_HEIGHT = 48;      // Altezza di una riga squadra
const HOURS = 12;           // Ore visualizzate (08:00 - 20:00)

// Larghezza totale Gantt
const totalWidth = HOUR_WIDTH * HOURS;  // 960px

// Altezza totale Gantt
const totalHeight = ROW_HEIGHT * teams.length;
```

### Navigazione Date

```typescript
// Pulsante Precedente
const handlePrevDay = () => {
  setCurrentDate(addDays(currentDate, -1));
};

// Pulsante Successivo
const handleNextDay = () => {
  setCurrentDate(addDays(currentDate, 1));
};

// Visualizzazione 1 Giorno
const handleShowOneDay = () => {
  setDaysToShow(1);
};

// Visualizzazione 7 Giorni
const handleShowSevenDays = () => {
  setDaysToShow(7);
};
```

---

## 🎯 Interazioni Utente

### Click su Installazione

```typescript
const handleBlockClick = (installation: Installation) => {
  setSelectedInstallation(installation);
  // Mostra detail panel con:
  // - Informazioni cliente
  // - Indirizzo installazione
  // - Note tecniche
  // - Pulsanti accetta/rifiuta/completa
};
```

### Context Menu (Click Destro)

```
┌─────────────────────────────────┐
│ ● In Attesa                     │
│ ● Schedulata                    │
│ ● Confermata                    │
│ ● In Corso                      │
│ ● Completata                    │
│ ● Annullata                     │
└─────────────────────────────────┘
```

Permette di cambiare rapidamente lo stato di un'installazione.

### Accettazione Installazione

```typescript
const handleAccept = () => {
  acceptMutation.mutate({
    installationId: selectedInstallation.id,
  });
  // Backend:
  // 1. Aggiorna status a "accepted"
  // 2. Salva acceptedAt timestamp
  // 3. Invia webhook a Salesforce
  // 4. Ritorna installazione aggiornata
};
```

### Rifiuto Installazione

```typescript
const handleReject = () => {
  if (rejectionReason.trim().length < 10) {
    toast.error('Motivazione troppo breve');
    return;
  }
  
  rejectMutation.mutate({
    installationId: selectedInstallation.id,
    rejectionReason: rejectionReason.trim(),
  });
  // Backend:
  // 1. Valida motivazione (min 10 caratteri)
  // 2. Aggiorna status a "rejected"
  // 3. Salva rejectionReason
  // 4. Invia webhook a Salesforce
};
```

### Schedulazione Installazione

```typescript
const handleDrop = (
  installation: Installation,
  team: Team,
  date: Date,
  hour: number,
  minute: number
) => {
  const startTime = new Date(date);
  startTime.setHours(hour, minute, 0, 0);
  
  const durationMinutes = installation.durationMinutes || 120;
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
  
  scheduleMutation.mutate({
    installationId: installation.id,
    teamId: team.id,
    scheduledStart: startTime,
    scheduledEnd: endTime,
  });
  // Backend:
  // 1. Verifica che squadra appartiene al partner
  // 2. Calcola travel time da Google Maps
  // 3. Aggiorna status a "scheduled"
  // 4. Salva scheduledStart, scheduledEnd, teamId
  // 5. Invia webhook a Salesforce
};
```

---

## 💻 Codice Implementazione

### Componente InstallationBlock

```typescript
function InstallationBlock({
  installation,
  onClick,
  onStatusChange,
}: {
  installation: Installation;
  onClick: () => void;
  onStatusChange?: (status: string) => void;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { installation },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const durationHours = (installation.durationMinutes || 120) / 60;
  const width = durationHours * HOUR_WIDTH;
  const colorInfo = STATUS_COLORS[installation.status] || STATUS_COLORS.pending;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={drag as any}
          className={`relative h-[32px] ${colorInfo} text-white rounded px-2 py-1 cursor-pointer hover:opacity-90 transition-opacity text-xs overflow-hidden ${
            isDragging ? "opacity-0 pointer-events-none" : ""
          }`}
          style={{ width: `${width}px`, top: "4px" }}
          onClick={onClick}
        >
          <div className="font-medium truncate">{installation.customerName}</div>
          <div className="text-[10px] opacity-90 truncate">
            {installation.installationType || installation.installationAddress.substring(0, 25)}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onStatusChange?.("pending")}>
          <span className="w-2 h-2 rounded-full mr-2 bg-gray-500" />
          In Attesa
        </ContextMenuItem>
        {/* ... altri status ... */}
      </ContextMenuContent>
    </ContextMenu>
  );
}
```

### Componente TeamRow

```typescript
function TeamRow({
  team,
  date,
  installations,
  hours,
  onDrop,
  onBlockClick,
  onStatusChange,
}: {
  team: Team;
  date: Date;
  installations: Installation[];
  hours: number[];
  onDrop: (installation: Installation, team: Team, date: Date, hour: number, minute: number) => void;
  onBlockClick: (installation: Installation) => void;
  onStatusChange?: (installationId: number, status: string) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [dragPosition, setDragPosition] = useState<{ hour: number; minute: number; x: number; duration: number } | null>(null);
  
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: { installation: Installation }, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset || !rowRef.current) return;

      const rect = rowRef.current.getBoundingClientRect();
      const relativeX = clientOffset.x - rect.left;
      
      const hourOffset = relativeX / HOUR_WIDTH;
      let hour = Math.floor(hourOffset) + hours[0];
      let minute = Math.round((hourOffset - Math.floor(hourOffset)) * 60);
      
      // Snap a 15 minuti
      const remainder = minute % 15;
      if (remainder < 7.5) {
        minute = minute - remainder;
      } else {
        minute = minute - remainder + 15;
      }
      
      if (minute >= 60) {
        minute = 0;
        hour += 1;
      }
      
      onDrop(item.installation, team, date, hour, minute);
    },
    hover: (item: { installation: Installation }, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (clientOffset && rowRef.current) {
        const rect = rowRef.current.getBoundingClientRect();
        const relativeX = clientOffset.x - rect.left;
        
        const hourOffset = relativeX / HOUR_WIDTH;
        let hour = Math.floor(hourOffset) + hours[0];
        let minute = Math.round((hourOffset - Math.floor(hourOffset)) * 60);
        
        const remainder = minute % 15;
        if (remainder < 7.5) {
          minute = minute - remainder;
        } else {
          minute = minute - remainder + 15;
        }
        
        if (minute >= 60) {
          minute = 0;
          hour += 1;
        }
        
        const duration = item.installation.durationMinutes || 120;
        setDragPosition({ hour, minute, x: relativeX, duration });
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));
  
  drop(rowRef);

  const teamInstallations = installations.filter((inst) => {
    if (inst.teamId !== team.id || !inst.scheduledStart) return false;
    const instDate = typeof inst.scheduledStart === 'string' ? parseISO(inst.scheduledStart) : inst.scheduledStart;
    return format(instDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
  });

  return (
    <div
      ref={rowRef}
      className={`relative border-b border-r overflow-visible ${isOver ? "bg-blue-50 dark:bg-blue-950" : ""}`}
      style={{ height: `${ROW_HEIGHT}px`, minWidth: `${hours.length * HOUR_WIDTH}px` }}
    >
      {/* Anteprima drag */}
      {dragPosition && isOver && (
        <>
          <div
            className={`absolute h-[32px] bg-blue-500 text-white rounded px-2 py-1 opacity-50 flex items-center justify-center text-xs font-semibold`}
            style={{
              left: `${dragPosition.x}px`,
              width: `${(dragPosition.duration / 60) * HOUR_WIDTH}px`,
              top: "4px",
            }}
          >
            {String(dragPosition.hour).padStart(2, '0')}:{String(dragPosition.minute).padStart(2, '0')}
          </div>
        </>
      )}
      
      {/* Installazioni */}
      {teamInstallations.map((inst) => {
        const instStart = typeof inst.scheduledStart === 'string' ? parseISO(inst.scheduledStart) : new Date(inst.scheduledStart!);
        const startHour = instStart.getHours() + instStart.getMinutes() / 60;
        const offsetHours = startHour - hours[0];
        const left = offsetHours * HOUR_WIDTH;

        return (
          <div key={inst.id} style={{ position: 'absolute', left: `${left}px` }}>
            <InstallationBlock 
              installation={inst} 
              onClick={() => onBlockClick(inst)}
              onStatusChange={(newStatus) => {
                onStatusChange?.(inst.id, newStatus);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
```

---

## 🚀 Performance Optimization

### Memoizzazione

```typescript
// Memoizza installazioni non schedulate
const unscheduledInstallations = useMemo(() => {
  if (!installations) return [];
  return installations.filter((inst) => inst.status === "pending" || inst.status === "cancelled");
}, [installations]);

// Memoizza date da visualizzare
const dates = useMemo(() => {
  const result = [];
  for (let i = 0; i < daysToShow; i++) {
    result.push(addDays(currentDate, i));
  }
  return result;
}, [currentDate, daysToShow]);

// Memoizza ore
const hours = useMemo(() => {
  return Array.from({ length: 12 }, (_, i) => i + 8);
}, []);
```

### Virtualizzazione

Per grandi quantità di installazioni, considera l'uso di:
- `react-window` - Virtualizzazione liste
- `react-virtualized` - Virtualizzazione tabelle

### Lazy Loading

```typescript
// Carica installazioni solo quando necessario
const { data: installations, isLoading } = trpc.partner.myInstallations.useQuery(
  { partnerId: partner.id },
  { enabled: !!partner.id }  // Carica solo se partner.id è disponibile
);
```

---

## 🔐 Sicurezza

### Verifiche Backend

```typescript
// Verifica che installazione appartiene al partner
if (installation.partnerId !== partner.id) {
  throw new TRPCError({ code: 'FORBIDDEN' });
}

// Verifica che squadra appartiene al partner
if (team.partnerId !== partner.id) {
  throw new TRPCError({ code: 'FORBIDDEN' });
}

// Verifica che installazione è nello stato corretto
if (installation.status !== 'pending' && installation.status !== 'accepted') {
  throw new TRPCError({ code: 'INVALID_STATE' });
}
```

### Validazione Input

```typescript
const scheduleSchema = z.object({
  installationId: z.number().positive(),
  teamId: z.number().positive(),
  scheduledStart: z.date(),
  scheduledEnd: z.date(),
});

// Valida che end > start
if (input.scheduledEnd <= input.scheduledStart) {
  throw new TRPCError({ code: 'INVALID_INPUT' });
}
```

---

## 📊 Statistiche e Metriche

### Informazioni Visualizzate

```typescript
// Tempo totale schedulato
const totalScheduledTime = scheduledInstallations.reduce(
  (sum, inst) => sum + (inst.durationMinutes || 0),
  0
);

// Numero installazioni per squadra
const installationsPerTeam = teams.map((team) => ({
  team: team.name,
  count: scheduledInstallations.filter((inst) => inst.teamId === team.id).length,
}));

// Utilizzo squadre (%)
const teamUtilization = teams.map((team) => ({
  team: team.name,
  utilization: (
    scheduledInstallations
      .filter((inst) => inst.teamId === team.id)
      .reduce((sum, inst) => sum + (inst.durationMinutes || 0), 0) / 
    (12 * 60) // 12 ore di lavoro
  ) * 100,
}));
```

---

**Creato:** 5 Novembre 2025
**Versione:** 1.0.0

