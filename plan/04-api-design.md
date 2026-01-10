# API Design

## Timeline Computation (Backend Only)

### Endpoint

```
GET /api/timeline?date=2025-03-10&userIds=1,2,3
```

**Query Parameters:**
- `date`: YYYY-MM-DD format in UTC (required)
- `userIds`: Comma-separated list of user IDs (required)

**Nota:** `date` è sempre in UTC. Il backend converte i risultati al timezone dell'utente corrente (dal session).

**Response (Payload Ideale):**

Il frontend non pensa, disegna.

```typescript
[
  { "start": "09:30", "end": "11:00", "category": "match" },
  { "start": "11:00", "end": "13:00", "category": "sleep" },
  { "start": "15:00", "end": "18:00", "category": "match" }
]
```

**Nota:** Gli orari (`start`, `end`) sono già convertiti nel timezone dell'utente corrente. Il backend:
1. Calcola tutto in UTC
2. Converte al timezone utente nell'ultimo step
3. Restituisce segmenti pronti per il rendering

**Stop.**
- Niente merge
- Niente cicli
- Niente logica
- Solo rendering

**Nota:** Il backend può includere anche `left` e `width` (percentuali) se necessario per il rendering, ma il payload minimale è quello sopra.

**Error Responses:**

Standardizzati con error codes e messaggi sempre in inglese. Traduzione nel frontend tramite i18n:

```typescript
{
  "error": {
    "code": "INTERVAL_INVALID",
    "message": "The specified interval is invalid"
  }
}
```

**Error Codes:**
- `INTERVAL_INVALID` - Invalid interval
- `CONNECTION_LIMIT_REACHED` - Connection limit reached (50)
- `RECURRENCE_INVALID` - Invalid recurrence rule
- `UNAUTHORIZED` - Unauthorized
- `TIMELINE_TIMEOUT` - Timeline calculation timeout
- `NETWORK_ERROR` - Network error
- `VALIDATION_ERROR` - Validation error
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded

**HTTP Status:**
- `400`: Invalid input (con error code specifico)
- `401`: Unauthorized (no session)
- `429`: Rate limit exceeded
- `500`: Server error (DB down, etc.)
- `504`: Timeout (calculation too slow)

**Traduzione Frontend:**
- Messaggi API sempre in inglese
- Frontend traduce usando i18n basandosi sul `code`
- Mapping `code` → traduzione in `messages/it.json` e `messages/en.json`

**Error Handling Frontend:**
- Error boundaries React per sezioni critiche
- Retry logic con exponential backoff (max 3 tentativi)
- Offline detection con feedback visivo
- Traduzione automatica errori tramite i18n

## CRUD Intervalli

### Create

```
POST /api/intervals
Content-Type: application/json

{
  "start_ts": "2025-03-10T09:00:00Z",
  "end_ts": "2025-03-10T17:00:00Z",
  "category": "busy",
  "description": "Meeting",
  "recurrence_rule": {
    "type": "weekly",
    "daysOfWeek": [1, 2, 3, 4, 5],
    "until": null
  }
}
```

**Response:**
```typescript
{
  "id": 123,
  "start_ts": "2025-03-10T09:00:00Z",
  "end_ts": "2025-03-10T17:00:00Z",
  "category": "busy",
  "description": "Meeting",
  "recurrence_rule": { ... },
  "created_at": "...",
  "updated_at": "..."
}
```

### Read

```
GET /api/intervals?date=2025-03-10
```

**Response:** Array di intervalli per la data specificata (singoli + ricorrenze risolte).

### Update

```
PUT /api/intervals/:id
Content-Type: application/json

{
  "start_ts": "2025-03-10T10:00:00Z",
  "end_ts": "2025-03-10T18:00:00Z",
  "category": "busy",
  "description": "Updated meeting"
}
```

### Delete

```
DELETE /api/intervals/:id
```

**Response:** `204 No Content` on success

## Regole di Validazione

- `start_ts` e `end_ts` sempre in `timestamptz` (ISO 8601)
- Se `recurrence_rule` presente, `start_ts` e `end_ts` sono la base
- Validazione: `end_ts > start_ts` (enforced by DB CHECK constraint)
- Validazione: `end_ts - start_ts <= 7 days` (enforced by DB CHECK constraint)
- `category` deve essere `'sleep' | 'busy' | 'other'`
- **Tutti i tipi**: `recurrence_rule.daysOfWeek` richiesto (array non vuoto di numeri 1-7)
  - Pattern unificato: utente seleziona giorni per tutti i tipi (weekly/daily/monthly)
- **Monthly**: `recurrence_rule.dayOfMonth` XOR `recurrence_rule.byWeekday` (uno solo)
  - `dayOfMonth`: 1-31, oppure `-1` o `"last"` per ultimo giorno del mese
  - `byWeekday`: formato "first-monday", "last-friday", etc.
  - Se combinato con `daysOfWeek`, filtra per giorno settimana

## Frontend: Solo Rendering

### Cosa Fa il Frontend

1. Chiama `GET /api/timeline?date=...&userIds=...`
2. Riceve array di segmenti già calcolati
3. Renderizza sulla timeline
4. **Stop**

### Cosa NON Fa il Frontend

- ❌ Calcoli di overlap
- ❌ Risoluzione ricorrenze
- ❌ Merge di intervalli
- ❌ Calcoli di percentuali (già nel backend)
- ❌ Decisioni logiche sui segmenti

**Se il frontend "decide" qualcosa → stai sbagliando.**

## Rate Limiting e Security

**Rate Limiting:**
- Autenticato: 100 req/min
- Non autenticato: 10 req/min
- Timeline endpoint: 20 req/min (più restrittivo)
- Per IP + userId (se autenticato)

**Security Headers:**
- CSP (Content Security Policy) - Restrictive policy
- HSTS (Strict-Transport-Security) - Force HTTPS in produzione
- X-Frame-Options: DENY (previene clickjacking)
- X-Content-Type-Options: nosniff

**CORS:**
- Solo dominio app in produzione
- Tutti gli origins in sviluppo

**Input Sanitization:**
- Validazione con `zod` prima di processare
- Sanitization con `dompurify` per HTML
- CSRF tokens per operazioni critiche (POST/PUT/DELETE)

