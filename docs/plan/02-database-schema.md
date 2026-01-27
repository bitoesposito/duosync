# Database Schema

## NextAuth Tables (auto-generated)

NextAuth v5 genera automaticamente queste tabelle:
- `users`: Extended with `email`, `emailVerified`, `name`
- `accounts`: OAuth provider accounts
- `sessions`: User sessions
- `verification_tokens`: Email magic link tokens

## Core Tables

### users (extends NextAuth)

```sql
id: serial (PK)
email: text (unique, nullable initially)
emailVerified: timestamp (nullable)
name: text (notNull)
token: text (unique, notNull) -- Initial login token
timezone: text (default: 'UTC') -- Timezone utente
createdAt: timestamptz
updatedAt: timestamptz
```

### user_connections (friendship system)

```sql
id: serial (PK)
requesterId: integer (FK -> users.id)
addresseeId: integer (FK -> users.id)
status: text ('pending' | 'accepted' | 'blocked')
canSeeAppointments: boolean (default: true)
createdAt: timestamptz
updatedAt: timestamptz
UNIQUE(requesterId, addresseeId)
INDEX(requesterId, status)
INDEX(addresseeId, status)
```

### busy_intervals (unica entità di dominio)

**Schema Drizzle:**

```typescript
import { pgTable, serial, integer, text, timestamp, jsonb, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const busyIntervals = pgTable("busy_intervals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startTs: timestamp("start_ts", { withTimezone: true }).notNull(),
  endTs: timestamp("end_ts", { withTimezone: true }).notNull(),
  category: text("category").notNull(), // 'sleep' | 'busy' | 'other'
  description: text("description"), // nullable
  recurrenceRule: jsonb("recurrence_rule"), // nullable
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  // CHECK constraint: end_ts > start_ts
  endAfterStart: check("end_after_start", sql`${table.endTs} > ${table.startTs}`),
  // CHECK constraint: max 24 hours
  maxDuration: check("max_duration", sql`${table.endTs} - ${table.startTs} <= INTERVAL '24 hours'`),
}));
```

**Indice obbligatorio (fondamentale):**

```sql
CREATE INDEX busy_intervals_range_idx
ON busy_intervals (start_ts, end_ts);
```

**Indice GIST (opzionale, per performance avanzata):**

```sql
CREATE INDEX busy_intervals_range_gist_idx
ON busy_intervals USING GIST (tstzrange(start_ts, end_ts));
```

**Indice per query per utente:**

```sql
CREATE INDEX busy_intervals_user_id_idx
ON busy_intervals (user_id);
```

### recurrence_rule (JSONB structure)

Le ricorrenze permettono di definire intervalli che si ripetono automaticamente. Possono essere disattivate per giorni specifici tramite `recurrence_exceptions`.

**Weekly:**
```json
{
  "type": "weekly",
  "daysOfWeek": [1, 2, 3, 4, 5], // 1=Monday, 7=Sunday
  "until": null // nullable, se null = infinite
}
```

**Daily:**
```json
{
  "type": "daily",
  "daysOfWeek": [1, 2, 3, 4, 5], // Giorni selezionati (es. weekdays)
  "until": null // nullable, se null = infinite
}
```

**Validazione:**
- `type` deve essere `"weekly" | "daily"`
- `daysOfWeek` richiesto (array non vuoto di numeri 1-7)
  - Pattern unificato: utente seleziona giorni per tutti i tipi
  - Toggle rapidi UI: "Giorni lavorativi" (1-5), "Weekend" (6-7), "Tutti" (1-7)
- `until` può essere `null` (infinite) o timestamp nel futuro rispetto a `start_ts`
- Disattivazione giorni specifici: Usare `recurrence_exceptions` per escludere giorni (es. weekend)

### recurrence_exceptions (nuova tabella)

**Schema Drizzle:**

```typescript
import { pgTable, serial, integer, date, jsonb, timestamp, unique } from "drizzle-orm/pg-core";

export const recurrenceExceptions = pgTable("recurrence_exceptions", {
  id: serial("id").primaryKey(),
  recurrenceId: integer("recurrence_id")
    .notNull()
    .references(() => busyIntervals.id, { onDelete: "cascade" }),
  exceptionDate: date("exception_date").notNull(), // Data specifica da escludere
  modifiedInterval: jsonb("modified_interval"), // Opzionale: intervallo modificato per quella data
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueRecurrenceDate: unique().on(table.recurrenceId, table.exceptionDate),
}));
```

**Struttura `modified_interval` (JSONB, opzionale):**
```json
{
  "start_ts": "2025-03-10T10:00:00Z", // Opzionale: nuovo start
  "end_ts": "2025-03-10T18:00:00Z", // Opzionale: nuovo end
  "category": "busy" // Opzionale: nuova category
}
```

**Note:**
- Se `modified_interval` è `null`: la data viene esclusa dalla ricorrenza
- Se `modified_interval` è presente: la data viene sostituita con l'intervallo modificato
- Quando si risolve ricorrenza, filtrare date in exceptions e applicare modifiche

### push_subscriptions (unchanged)

```sql
id: serial (PK)
userId: integer (FK -> users.id)
endpoint: text (unique)
p256dh: text
auth: text
createdAt: timestamptz
updatedAt: timestamptz
INDEX(userId)
```

## Modello Dati: Intervalli, Non Eventi

### Regola Fondamentale

**Non esistono "appointment giornalieri" o "template": esistono solo intervalli.**

- Un intervallo singolo: `start_ts` e `end_ts` specifici
- Un intervallo ricorrente: `start_ts` e `end_ts` base + `recurrence_rule` (weekly/daily)

### Ricorrenze: Risoluzione On-Demand

**Le ricorrenze:**
- NON si espandono
- NON si materializzano
- Si risolvono solo per il giorno richiesto

**Esempio:**
- Intervallo base: `2025-01-01 09:00:00` → `2025-01-01 17:00:00`
- Recurrence: `{ type: "weekly", daysOfWeek: [1, 2, 3, 4, 5] }`
- Query per un giorno specifico (es. martedì 10 marzo 2025):
  - Risolve solo per quel giorno: `2025-03-10 09:00:00` → `2025-03-10 17:00:00`
  - Tratta il risultato come intervallo normale

## Migrazione da Schema Vecchio

Vedi [Strategia Implementazione](./09-implementation-strategy.md) - Fase 7 per dettagli sulla migrazione.

