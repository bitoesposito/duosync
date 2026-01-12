# Algoritmi Core

**Nota:** Gli algoritmi sono implementati in `lib/algorithms/` come funzioni pure (no side effects, condivise). La business logic che li orchestrazione è in `lib/services/`.

## Pipeline Backend (End-to-End)

### Query SQL Corretta (Range-Based, Scalabile)

**Caso: giorno D (in UTC), lista utenti**

```sql
SELECT
  user_id,
  start_ts,
  end_ts,
  category,
  recurrence_rule
FROM busy_intervals
WHERE user_id = ANY(:user_ids)
  AND start_ts < :day_end_utc
  AND end_ts > :day_start_utc;
```

**Nota:** `day_start` e `day_end` sono sempre in UTC. La conversione al timezone utente avviene dopo i calcoli.

**Questa query:**
- ✅ Prende solo ciò che interseca il giorno
- ✅ Non guarda stringhe
- ✅ Non cicla per utente
- ✅ Scala

**Le ricorrenze:**
- Le risolvi subito dopo la query
- Solo nel range `[day_start, day_end]`
- Le trasformi temporaneamente in intervalli normali
- **Non le salvi**

## Algoritmo Corretto (Merge + Complemento)

### Input

- Lista di intervalli: `[start, end, category, userId]`
- Range giorno: `[D_start, D_end]`

### Step 1 — Normalizzazione

Clampa tutto nel giorno:

```typescript
for (const interval of intervals) {
  interval.start = max(interval.start, D_start);
  interval.end = min(interval.end, D_end);
}
```

### Step 2 — Risoluzione Ricorrenze

Per ogni intervallo con `recurrence_rule`:
- Genera istanze solo per il range `[D_start, D_end]`
- Filtra date presenti in `recurrence_exceptions` (escludi o applica modifiche)
- Trasforma in intervalli normali con `start_ts` e `end_ts` specifici
- Aggiungi all'array (sostituisci l'originale)

**Implementazione con `rrule`:**

```typescript
import { RRule, Frequency } from 'rrule';

function resolveRecurrences(
  intervals: Interval[],
  dayStart: Date,
  dayEnd: Date
): Interval[] {
  const resolved: Interval[] = [];
  
  for (const interval of intervals) {
    if (!interval.recurrenceRule) {
      // Singolo intervallo, aggiungi direttamente
      resolved.push(interval);
      continue;
    }
    
    const rule = interval.recurrenceRule;
    
    // Mappa type a Frequency
    const frequencyMap: Record<string, Frequency> = {
      daily: RRule.DAILY,
      weekly: RRule.WEEKLY,
      monthly: RRule.MONTHLY,
    };
    
    // Costruisci opzioni RRule
    const rruleOptions: Partial<RRule.Options> = {
      freq: frequencyMap[rule.type],
      dtstart: interval.startTs,
      until: rule.until ? new Date(rule.until) : undefined,
    };
    
    // Aggiungi opzioni specifiche per tipo
    // Pattern unificato: tutti i tipi usano daysOfWeek
    const daysOfWeek = rule.daysOfWeek.map(d => d - 1); // rrule usa 0-6
    
    if (rule.type === 'weekly') {
      rruleOptions.byweekday = daysOfWeek;
    } else if (rule.type === 'daily') {
      // Daily con giorni selezionati: ricorrenza ogni giorno selezionato
      rruleOptions.byweekday = daysOfWeek;
      rruleOptions.freq = RRule.DAILY; // Mantieni daily, ma filtra per giorni
    } else if (rule.type === 'monthly') {
      // Monthly: combina dayOfMonth/byWeekday con daysOfWeek
      if (rule.dayOfMonth) {
        // Supporto ultimo giorno del mese
        if (rule.dayOfMonth === -1 || rule.dayOfMonth === 'last') {
          rruleOptions.bymonthday = [-1];
        } else {
          rruleOptions.bymonthday = [rule.dayOfMonth];
        }
        // Se daysOfWeek presente, filtra per giorno settimana
        if (daysOfWeek.length > 0) {
          rruleOptions.byweekday = daysOfWeek;
        }
      } else if (rule.byWeekday) {
        // Es. "first-monday" -> { weekday: 0, n: 1 }
        const [position, weekday] = parseByWeekday(rule.byWeekday);
        rruleOptions.byweekday = [{ weekday, n: position }];
        // Se daysOfWeek presente, deve matchare con byWeekday
        if (daysOfWeek.length > 0 && daysOfWeek.includes(weekday)) {
          rruleOptions.byweekday = [{ weekday, n: position }];
        }
      }
    }
    
    // Crea RRule
    const rrule = new RRule(rruleOptions);
    
    // Genera occorrenze solo nel range richiesto
    const occurrences = rrule.between(dayStart, dayEnd, true);
    
    // Carica exceptions per questa ricorrenza (se presenti)
    const exceptions = await loadRecurrenceExceptions(interval.id, dayStart, dayEnd);
    const exceptionDates = new Set(exceptions.map(e => e.exceptionDate.toISOString().split('T')[0]));
    const modifiedIntervals = new Map(
      exceptions
        .filter(e => e.modifiedInterval)
        .map(e => [e.exceptionDate.toISOString().split('T')[0], e.modifiedInterval])
    );
    
    // Crea intervalli per ogni occorrenza
    for (const occurrence of occurrences) {
      const occurrenceDate = occurrence.toISOString().split('T')[0];
      
      // Controlla se questa data ha un'eccezione
      if (exceptionDates.has(occurrenceDate)) {
        // Se ha modifiedInterval, usa quello invece di escludere
        const modified = modifiedIntervals.get(occurrenceDate);
        if (modified) {
          resolved.push({
            ...interval,
            startTs: new Date(modified.start_ts),
            endTs: new Date(modified.end_ts),
            category: modified.category || interval.category,
            recurrenceRule: undefined, // Non più ricorrente, è un'istanza modificata
          });
        }
        // Se non ha modifiedInterval, escludi questa occorrenza (skip)
        continue;
      }
      
      // Occorrenza normale, senza eccezioni
      const duration = interval.endTs.getTime() - interval.startTs.getTime();
      resolved.push({
        ...interval,
        startTs: occurrence,
        endTs: new Date(occurrence.getTime() + duration),
        recurrenceRule: undefined, // Non più ricorrente, è un'istanza
      });
    }
  }
  
  return resolved;
}

// Helper per parsare "first-monday", "last-friday", etc.
function parseByWeekday(byWeekday: string): [number, number] {
  const [position, weekday] = byWeekday.split('-');
  const positionMap: Record<string, number> = {
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    last: -1,
  };
  const weekdayMap: Record<string, number> = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
  };
  return [positionMap[position], weekdayMap[weekday]];
}

// Helper per caricare exceptions per una ricorrenza
async function loadRecurrenceExceptions(
  recurrenceId: number,
  dayStart: Date,
  dayEnd: Date
): Promise<Array<{ exceptionDate: Date; modifiedInterval?: any }>> {
  // Query DB per exceptions nel range richiesto
  return await db.query.recurrenceExceptions.findMany({
    where: and(
      eq(recurrenceExceptions.recurrenceId, recurrenceId),
      gte(recurrenceExceptions.exceptionDate, dayStart.toISOString().split('T')[0]),
      lte(recurrenceExceptions.exceptionDate, dayEnd.toISOString().split('T')[0])
    ),
  });
}
```

### Step 3 — Sort

```typescript
intervals.sort((a, b) => a.start.getTime() - b.start.getTime());
```

### Step 4 — Merge Globale (con Priorità)

**Una sola passata:**

```typescript
const merged: Array<{ start: Date; end: Date; category: string }> = [];

for (const interval of intervals) {
  if (merged.length === 0) {
    merged.push({ ...interval });
    continue;
  }

  const last = merged[merged.length - 1];

  if (interval.start <= last.end) {
    // Overlap: merge
    last.end = max(last.end, interval.end);
    last.category = maxPriority(last.category, interval.category);
  } else {
    // No overlap: nuovo intervallo
    merged.push({ ...interval });
  }
}

function maxPriority(a: string, b: string): string {
  const priority = { sleep: 3, busy: 2, other: 1 };
  return priority[a] > priority[b] ? a : b;
}
```

**Priorità:** `sleep > busy > other`

**Edge cases gestiti:**
- Overlap parziale: merge con priorità
- Overlap completo: merge con priorità
- Boundary cases (start === end): considerato overlap
- 3+ intervalli sovrapposti: gestito iterativamente

### Step 5 — Complemento (Slot Liberi)

```typescript
const freeSlots: Array<{ start: Date; end: Date }> = [];
let cursor = D_start;

for (const interval of merged) {
  if (cursor < interval.start) {
    freeSlots.push({ start: cursor, end: interval.start });
  }
  cursor = max(cursor, interval.end);
}

if (cursor < D_end) {
  freeSlots.push({ start: cursor, end: D_end });
}
```

**Questi sono gli slot liberi comuni (in UTC).**

### Step 6 — Conversione Timezone (se multi-timezone)

```typescript
// Dopo tutti i calcoli, converti al timezone utente corrente
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

function convertToUserTimezone(
  segments: TimelineSegment[],
  userTimezone: string
): TimelineSegment[] {
  return segments.map(segment => ({
    ...segment,
    start: dayjs(segment.start).tz(userTimezone).format('HH:mm'),
    end: dayjs(segment.end).tz(userTimezone).format('HH:mm'),
  }));
}
```

**Nota:** Conversione solo per display. Tutti i calcoli precedenti rimangono in UTC.

### Complessità

**O(n log n)** dove:
- n = numero di intervalli reali nel range (singoli + risolti)
- **Indipendente dal numero di utenti** finché il giorno è uno

Questo scala.

## Testing Requirements

Vedi [Rischi e Complessità](./08-risks.md) per edge cases da testare.

## Struttura File Implementazione

Gli algoritmi sono implementati in `lib/algorithms/` come funzioni pure:

- `lib/algorithms/merge.service.ts` - Funzione `mergeIntervals()` con priorità
- `lib/algorithms/recurrence.service.ts` - Funzione `resolveRecurrences()` con `rrule`
- `lib/algorithms/complement.service.ts` - Funzione `calculateFreeSlots()` per slot liberi

La business logic che orchestra questi algoritmi è in `lib/services/`:

- `lib/services/timeline.service.ts` - Orchestrazione completa pipeline timeline (usa algoritmi da `lib/algorithms/`)
- `lib/services/intervals.service.ts` - Business logic per CRUD intervalli
