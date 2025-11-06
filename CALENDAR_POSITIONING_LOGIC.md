# Logica di Posizionamento Appuntamenti sul Calendario

Documentazione dettagliata di come il sistema calcola la posizione degli appuntamenti sul Gantt chart in base all'ora selezionata.

## 📋 Indice

1. [Panoramica del Sistema](#panoramica-del-sistema)
2. [Costanti e Dimensioni](#costanti-e-dimensioni)
3. [Flusso di Calcolo](#flusso-di-calcolo)
4. [Algoritmo di Positioning](#algoritmo-di-positioning)
5. [Snapping a 15 Minuti](#snapping-a-15-minuti)
6. [Esempi Pratici](#esempi-pratici)
7. [Gestione Bordi](#gestione-bordi)
8. [Ottimizzazioni](#ottimizzazioni)

---

## 🎯 Panoramica del Sistema

Il sistema di posizionamento funziona in 3 fasi:

```
┌─────────────────────────────────────────────────────────────┐
│ FASE 1: USER DRAG                                           │
│ User trascina installazione su coordinate (x, y)           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ FASE 2: CALCOLO POSIZIONE                                  │
│ Converti pixel in ore e minuti                             │
│ Applica snapping a 15 minuti                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ FASE 3: SALVATAGGIO                                        │
│ Invia al backend con ora e squadra                         │
│ Aggiorna database e Salesforce                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📏 Costanti e Dimensioni

### Dimensioni Principali

```typescript
// Larghezza di un'ora in pixel
const HOUR_WIDTH = 80;

// Altezza di una riga squadra in pixel
const ROW_HEIGHT = 48;

// Ore visualizzate nel Gantt (08:00 - 20:00)
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

// Intervallo di snap (15 minuti)
const SNAP_INTERVAL = 15;

// Larghezza totale del Gantt
const TOTAL_WIDTH = HOUR_WIDTH * HOURS.length;  // 80 * 12 = 960px

// Orario di inizio
const START_HOUR = 8;

// Orario di fine
const END_HOUR = 20;
```

### Conversione Pixel ↔ Tempo

```
1 ora = 80 pixel
1 minuto = 80 / 60 = 1.33 pixel

Esempi:
- 15 minuti = 20 pixel
- 30 minuti = 40 pixel
- 45 minuti = 60 pixel
- 60 minuti = 80 pixel
```

---

## 🔄 Flusso di Calcolo

### Step 1: Cattura Evento Drag

```typescript
const [{ isOver }, drop] = useDrop(() => ({
  accept: ITEM_TYPE,
  drop: (item: { installation: Installation }, monitor) => {
    // Ottieni la posizione del mouse
    const clientOffset = monitor.getClientOffset();
    
    if (!clientOffset || !rowRef.current) {
      onDrop(item.installation, team, date, hours[0], 0);
      return;
    }
    
    // clientOffset = { x: 450, y: 200 }
    // Questa è la posizione assoluta nel viewport
  },
}));
```

### Step 2: Calcola Posizione Relativa

```typescript
// Ottieni il bounding rect della riga
const rect = rowRef.current.getBoundingClientRect();
// rect = { left: 200, top: 100, width: 960, height: 48, ... }

// Calcola la posizione relativa rispetto alla riga
const relativeX = clientOffset.x - rect.left;
// relativeX = 450 - 200 = 250 pixel

// Questo significa che l'utente ha trascinato 250 pixel
// dall'inizio della riga
```

### Step 3: Converti Pixel in Ore

```typescript
// Calcola quante ore rappresentano i 250 pixel
const hourOffset = relativeX / HOUR_WIDTH;
// hourOffset = 250 / 80 = 3.125 ore

// Estrai la parte intera (ore complete)
const hoursFromStart = Math.floor(hourOffset);
// hoursFromStart = 3 ore

// Calcola i minuti dalla parte decimale
const minutesFraction = hourOffset - Math.floor(hourOffset);
// minutesFraction = 0.125 ore

const minutesRaw = minutesFraction * 60;
// minutesRaw = 0.125 * 60 = 7.5 minuti

// Arrotonda ai minuti più vicini
const minutesRounded = Math.round(minutesRaw);
// minutesRounded = 8 minuti (arrotondato)
```

### Step 4: Calcola Ora Assoluta

```typescript
// L'orario di inizio del Gantt è 08:00
const startHourOfDay = hours[0];  // 8

// Calcola l'ora assoluta
let hour = hoursFromStart + startHourOfDay;
// hour = 3 + 8 = 11 (ore 11:00)

let minute = minutesRounded;
// minute = 8 (minuti)

// Risultato: 11:08
```

---

## 🎯 Algoritmo di Positioning

### Algoritmo Completo

```typescript
function calculatePositionFromDrag(
  clientOffset: { x: number; y: number },
  rowRef: HTMLDivElement,
  hours: number[],
  HOUR_WIDTH: number
): { hour: number; minute: number } {
  
  // STEP 1: Calcola posizione relativa
  const rect = rowRef.getBoundingClientRect();
  const relativeX = clientOffset.x - rect.left;
  
  // STEP 2: Converti pixel in ore
  const hourOffset = relativeX / HOUR_WIDTH;
  let hour = Math.floor(hourOffset) + hours[0];
  let minute = Math.round((hourOffset - Math.floor(hourOffset)) * 60);
  
  // STEP 3: Applica snapping a 15 minuti
  const remainder = minute % 15;
  if (remainder < 7.5) {
    minute = minute - remainder;
  } else {
    minute = minute - remainder + 15;
  }
  
  // STEP 4: Gestisci overflow (minuti >= 60)
  if (minute >= 60) {
    minute = 0;
    hour += 1;
  }
  
  // STEP 5: Valida orario (non fuori dal range)
  if (hour < hours[0]) {
    hour = hours[0];
    minute = 0;
  } else if (hour >= 20) {
    hour = 19;
    minute = 45;
  }
  
  return { hour, minute };
}
```

---

## 🔐 Snapping a 15 Minuti

### Logica di Snapping

Lo snapping arrotonda i minuti agli intervalli di 15 minuti più vicini:

```
Minuti Input → Minuti Output
0-7          → 0
8-22         → 15
23-37        → 30
38-52        → 45
53-59        → 60 (prossima ora)
```

### Implementazione

```typescript
const remainder = minute % 15;
// remainder = minuti % 15

// Se il resto è < 7.5, arrotonda per difetto
if (remainder < 7.5) {
  minute = minute - remainder;
}
// Se il resto è >= 7.5, arrotonda per eccesso
else {
  minute = minute - remainder + 15;
}

// Se minuti >= 60, incrementa l'ora
if (minute >= 60) {
  minute = 0;
  hour += 1;
}
```

### Esempi di Snapping

| Minuti Input | Calcolo | Minuti Output | Azione |
|---|---|---|---|
| 3 | 3 % 15 = 3 < 7.5 | 0 | Arrotonda a 0 |
| 8 | 8 % 15 = 8 >= 7.5 | 15 | Arrotonda a 15 |
| 22 | 22 % 15 = 7 < 7.5 | 15 | Arrotonda a 15 |
| 23 | 23 % 15 = 8 >= 7.5 | 30 | Arrotonda a 30 |
| 37 | 37 % 15 = 7 < 7.5 | 30 | Arrotonda a 30 |
| 38 | 38 % 15 = 8 >= 7.5 | 45 | Arrotonda a 45 |
| 52 | 52 % 15 = 7 < 7.5 | 45 | Arrotonda a 45 |
| 53 | 53 % 15 = 8 >= 7.5 | 60 → 0 | Arrotonda a prossima ora |

---

## 📊 Esempi Pratici

### Esempio 1: Drag a 09:30

```
┌─────────────────────────────────────────────────────────────┐
│ GANTT CHART                                                 │
│ 08:00 │ 09:00 │ 10:00 │ 11:00 │ 12:00 │ ...               │
│       │   ↑   │       │       │       │                    │
│       │  DRAG │       │       │       │                    │
│       │  (x=90)       │       │       │                    │
└─────────────────────────────────────────────────────────────┘

CALCOLO:
1. relativeX = 90 pixel (dall'inizio della riga)
2. hourOffset = 90 / 80 = 1.125 ore
3. hoursFromStart = 1 ora
4. minutesFraction = 0.125 ore
5. minutesRaw = 0.125 * 60 = 7.5 minuti
6. minutesRounded = 8 minuti
7. hour = 1 + 8 = 09
8. minute = 8

SNAPPING:
- remainder = 8 % 15 = 8 >= 7.5
- minute = 8 - 8 + 15 = 15

RISULTATO: 09:15
```

### Esempio 2: Drag a 10:45

```
┌─────────────────────────────────────────────────────────────┐
│ GANTT CHART                                                 │
│ 08:00 │ 09:00 │ 10:00 │ 11:00 │ 12:00 │ ...               │
│       │       │   ↑   │       │       │                    │
│       │       │  DRAG │       │       │                    │
│       │       │ (x=220)       │       │                    │
└─────────────────────────────────────────────────────────────┘

CALCOLO:
1. relativeX = 220 pixel
2. hourOffset = 220 / 80 = 2.75 ore
3. hoursFromStart = 2 ore
4. minutesFraction = 0.75 ore
5. minutesRaw = 0.75 * 60 = 45 minuti
6. minutesRounded = 45 minuti
7. hour = 2 + 8 = 10
8. minute = 45

SNAPPING:
- remainder = 45 % 15 = 0 < 7.5
- minute = 45 - 0 = 45

RISULTATO: 10:45
```

### Esempio 3: Drag a 11:52 (Arrotonda a 12:00)

```
┌─────────────────────────────────────────────────────────────┐
│ GANTT CHART                                                 │
│ 08:00 │ 09:00 │ 10:00 │ 11:00 │ 12:00 │ ...               │
│       │       │       │   ↑   │       │                    │
│       │       │       │  DRAG │       │                    │
│       │       │       │ (x=318)       │                    │
└─────────────────────────────────────────────────────────────┘

CALCOLO:
1. relativeX = 318 pixel
2. hourOffset = 318 / 80 = 3.975 ore
3. hoursFromStart = 3 ore
4. minutesFraction = 0.975 ore
5. minutesRaw = 0.975 * 60 = 58.5 minuti
6. minutesRounded = 59 minuti (arrotondato)
7. hour = 3 + 8 = 11
8. minute = 59

SNAPPING:
- remainder = 59 % 15 = 14 >= 7.5
- minute = 59 - 14 + 15 = 60
- minute >= 60: minute = 0, hour = 12

RISULTATO: 12:00
```

### Esempio 4: Drag a 08:08 (Arrotonda a 08:00)

```
┌─────────────────────────────────────────────────────────────┐
│ GANTT CHART                                                 │
│ 08:00 │ 09:00 │ 10:00 │ 11:00 │ 12:00 │ ...               │
│ ↑     │       │       │       │       │                    │
│DRAG   │       │       │       │       │                    │
│(x=10) │       │       │       │       │                    │
└─────────────────────────────────────────────────────────────┘

CALCOLO:
1. relativeX = 10 pixel
2. hourOffset = 10 / 80 = 0.125 ore
3. hoursFromStart = 0 ore
4. minutesFraction = 0.125 ore
5. minutesRaw = 0.125 * 60 = 7.5 minuti
6. minutesRounded = 8 minuti (arrotondato)
7. hour = 0 + 8 = 08
8. minute = 8

SNAPPING:
- remainder = 8 % 15 = 8 >= 7.5
- minute = 8 - 8 + 15 = 15

RISULTATO: 08:15
```

---

## 🛡️ Gestione Bordi

### Validazione Orario

```typescript
// Validazione dopo il calcolo
if (hour < hours[0]) {
  // Se l'ora è prima dell'inizio (08:00)
  hour = hours[0];
  minute = 0;
} else if (hour >= 20) {
  // Se l'ora è dopo la fine (20:00)
  hour = 19;
  minute = 45;
}
```

### Gestione Overflow Minuti

```typescript
// Se minuti >= 60, incrementa l'ora
if (minute >= 60) {
  minute = 0;
  hour += 1;
}

// Se minuti < 0, decrementa l'ora
if (minute < 0) {
  minute = 60;
  hour -= 1;
}
```

### Validazione Finale

```typescript
// Assicurati che l'ora sia nel range valido
const MAX_HOUR = 20;
const MIN_HOUR = 8;

if (hour > MAX_HOUR) {
  hour = MAX_HOUR - 1;
  minute = 45;
}

if (hour < MIN_HOUR) {
  hour = MIN_HOUR;
  minute = 0;
}
```

---

## 🎨 Anteprima Visiva Durante Drag

### Calcolo Posizione Anteprima

```typescript
const [dragPosition, setDragPosition] = useState<{
  hour: number;
  minute: number;
  x: number;
  duration: number;
} | null>(null);

// Durante hover, calcola e mostra anteprima
hover: (item: { installation: Installation }, monitor) => {
  const clientOffset = monitor.getClientOffset();
  if (clientOffset && rowRef.current) {
    const rect = rowRef.current.getBoundingClientRect();
    const relativeX = clientOffset.x - rect.left;
    
    // Calcola ora e minuti
    const hourOffset = relativeX / HOUR_WIDTH;
    let hour = Math.floor(hourOffset) + hours[0];
    let minute = Math.round((hourOffset - Math.floor(hourOffset)) * 60);
    
    // Applica snapping
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
}
```

### Rendering Anteprima

```typescript
{dragPosition && isOver && draggedItem && (
  <>
    {/* Blocco semitrasparente */}
    <div
      className={`absolute h-[32px] ${STATUS_COLORS[draggedItem.status]} text-white rounded px-2 py-1 opacity-50`}
      style={{
        left: `${dragPosition.x}px`,
        width: `${(dragPosition.duration / 60) * HOUR_WIDTH}px`,
        top: "4px",
      }}
    >
      {String(dragPosition.hour).padStart(2, '0')}:{String(dragPosition.minute).padStart(2, '0')}
    </div>
    
    {/* Linea verticale rossa */}
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none"
      style={{ left: `${dragPosition.x}px`, zIndex: 10 }}
    />
    
    {/* Tooltip con orario */}
    <div
      className="absolute bg-gray-900 text-white px-3 py-2 rounded text-sm whitespace-nowrap pointer-events-none"
      style={{
        left: `${dragPosition.x}px`,
        top: '-40px',
        transform: 'translateX(-50%)',
        zIndex: 50,
      }}
    >
      {String(dragPosition.hour).padStart(2, '0')}:{String(dragPosition.minute).padStart(2, '0')} - 
      {String(endTime?.getHours()).padStart(2, '0')}:{String(endTime?.getMinutes()).padStart(2, '0')}
    </div>
  </>
)}
```

---

## 🚀 Ottimizzazioni

### Memoizzazione Calcoli

```typescript
// Memoizza le ore per evitare ricalcoli
const hours = useMemo(() => {
  return Array.from({ length: 12 }, (_, i) => i + 8);
}, []);

// Memoizza le installazioni filtrate
const teamInstallations = useMemo(() => {
  return installations.filter((inst) => {
    if (inst.teamId !== team.id || !inst.scheduledStart) return false;
    const instDate = parseISO(inst.scheduledStart);
    return format(instDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
  });
}, [installations, team.id, date]);
```

### Debouncing Hover

```typescript
// Evita ricalcoli troppo frequenti durante hover
let debounceTimer: NodeJS.Timeout;

hover: (item, monitor) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    // Calcola posizione
    setDragPosition({ hour, minute, x: relativeX, duration });
  }, 16); // ~60fps
}
```

### Cache Posizioni

```typescript
// Cache delle posizioni calcolate
const positionCache = new Map<string, { hour: number; minute: number }>();

function getPosition(relativeX: number, hours: number[]): { hour: number; minute: number } {
  const cacheKey = `${relativeX}-${hours[0]}`;
  
  if (positionCache.has(cacheKey)) {
    return positionCache.get(cacheKey)!;
  }
  
  const position = calculatePosition(relativeX, hours);
  positionCache.set(cacheKey, position);
  
  return position;
}
```

---

## 📐 Formule Matematiche

### Conversione Pixel → Ora

```
hourOffset = relativeX / HOUR_WIDTH
hour = floor(hourOffset) + startHour
minute = round((hourOffset - floor(hourOffset)) * 60)
```

### Conversione Ora → Pixel

```
relativeX = (hour - startHour + minute / 60) * HOUR_WIDTH
```

### Larghezza Blocco

```
blockWidth = (durationMinutes / 60) * HOUR_WIDTH
```

### Posizione Blocco Schedulato

```
leftPosition = (scheduledStart.getHours() - startHour + scheduledStart.getMinutes() / 60) * HOUR_WIDTH
```

---

## 🔍 Debug e Logging

### Log Dettagliati

```typescript
function calculatePositionWithLogging(
  clientOffset: { x: number; y: number },
  rowRef: HTMLDivElement,
  hours: number[],
  HOUR_WIDTH: number
) {
  const rect = rowRef.getBoundingClientRect();
  const relativeX = clientOffset.x - rect.left;
  
  console.log('=== POSITIONING DEBUG ===');
  console.log('clientOffset:', clientOffset);
  console.log('rect.left:', rect.left);
  console.log('relativeX:', relativeX);
  
  const hourOffset = relativeX / HOUR_WIDTH;
  console.log('hourOffset:', hourOffset);
  
  let hour = Math.floor(hourOffset) + hours[0];
  let minute = Math.round((hourOffset - Math.floor(hourOffset)) * 60);
  
  console.log('hour (before snap):', hour);
  console.log('minute (before snap):', minute);
  
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
  
  console.log('hour (after snap):', hour);
  console.log('minute (after snap):', minute);
  console.log('RESULT:', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  
  return { hour, minute };
}
```

---

## 🧪 Test Cases

### Test 1: Drag a Inizio Ora

```typescript
test('Drag at start of hour (08:00)', () => {
  const result = calculatePosition(0, [8]);
  expect(result).toEqual({ hour: 8, minute: 0 });
});
```

### Test 2: Drag a Metà Ora

```typescript
test('Drag at middle of hour (08:30)', () => {
  const result = calculatePosition(40, [8]);  // 40px = 0.5 ore
  expect(result).toEqual({ hour: 8, minute: 30 });
});
```

### Test 3: Drag con Snapping

```typescript
test('Drag with snapping (08:08 → 08:15)', () => {
  const result = calculatePosition(10.67, [8]);  // 10.67px ≈ 8 minuti
  expect(result).toEqual({ hour: 8, minute: 15 });
});
```

### Test 4: Drag oltre l'ora

```typescript
test('Drag beyond hour boundary (08:52 → 09:00)', () => {
  const result = calculatePosition(69.33, [8]);  // 69.33px ≈ 52 minuti
  expect(result).toEqual({ hour: 9, minute: 0 });
});
```

---

**Creato:** 5 Novembre 2025
**Versione:** 1.0.0

