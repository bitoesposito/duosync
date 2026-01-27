# Rischi e Complessità Nascoste

## 1. Risoluzione Ricorrenze: Complessità Reale

**Problemi:**
- Ricorrenze che attraversano mezzanotte (es. 22:00-02:00) - max 24h
- Gestione "until" date con timezone
- Ricorrenze che cambiano con DST (Daylight Saving Time)
- Calcolo efficiente: generare solo istanze per il giorno corrente richiesto
- Disattivazione giorni specifici tramite `recurrence_exceptions`

**Soluzione:**
- Usare libreria matura (es. `rrule`) per risoluzione ricorrenze (solo weekly/daily)
- Testare edge cases: DST transitions, leap years
- Validare che "until" sia sempre nel futuro rispetto a `start_ts` base
- Gestire correttamente `recurrence_exceptions` per escludere giorni specifici (es. weekend)

## 2. Timezone Handling

**Problema critico non menzionato:**
- Utenti in timezone diversi
- Intervalli salvati in UTC, ma visualizzati in locale
- Ricorrenze con timezone base vs timezone utente

**Soluzione:**
- Salvare sempre `timestamptz` in UTC nel DB
- Convertire a timezone utente solo per display
- Risolvere ricorrenze in UTC, poi convertire per display
- Documentare chiaramente: tutti i calcoli in UTC

**Decisione MVP:** Singolo timezone per tutti gli utenti (configurabile, default UTC)

## 3. Algoritmo Merge con Priorità: Edge Cases

**Problemi:**
- Intervalli che si sovrappongono parzialmente (es. 09:00-11:00 e 10:00-12:00)
- Priorità quando 3+ intervalli si sovrappongono
- Intervalli che iniziano esattamente quando l'altro finisce (boundary cases)
- Sleep che si sovrappone a busy: quale prevale?

**Soluzione:**
- Testare tutti i casi di overlap: parziale, completo, boundary
- Definire regole di priorità chiare e documentate
- Validare che merge mantenga invarianti (no gap, no overlap)

## 4. Performance Real-World

**Cosa succede con:**
- 100+ utenti connessi
- 1000+ intervalli per giorno (singoli + ricorrenze risolte)
- Query che ritorna migliaia di righe
- Merge di 1000+ intervalli

**Soluzione:**
- Benchmark con dati realistici (100 utenti, 10 intervalli/utente)
- Profiling del merge algorithm
- Considerare paginazione se intervalli > 1000
- Cache intelligente: invalidare solo quando necessario

## 5. Cache Invalidation

**Problema:**
- Quando invalidare cache timeline?
- Utente A aggiunge intervallo → deve invalidare cache per tutti gli utenti connessi?
- Come gestire invalidation distribuita (se multi-server)?

**Soluzione:**
- Cache key: `timeline:${date}:${sortedUserIds.join(',')}`
- Invalidate su: creazione/modifica/eliminazione intervallo
- RTK Query gestisce automaticamente, ma verificare tag-based invalidation
- Considerare WebSocket/SSE per real-time updates (fase 2)

## 6. Redux + Next.js SSR

**Problemi:**
- Store initialization su server vs client
- Hydration mismatches
- RTK Query con SSR (prefetching, serialization)
- Store persistence tra page navigations

**Soluzione:**
- Usare `next-redux-wrapper` o pattern custom per SSR
- Prefetch dati critici in `getServerSideProps` o Server Components
- Evitare hydration mismatches: non serializzare Date objects, usare stringhe ISO
- Testare navigation tra pagine con Redux DevTools

## 7. NextAuth v5 + Redux Sync

**Problema:**
- Session NextAuth vive sul server
- Redux auth slice vive sul client
- Come sincronizzare senza race conditions?

**Soluzione:**
- Polling periodico della session (es. ogni 5 min)
- Event listener per session changes
- Middleware Redux per sincronizzare session → auth slice
- Gestire loading state durante sync

## 8. Migrazione Dati: Ricorrenze Esistenti

**Problema critico:**
- Come mappare `recurring_appointments` esistenti a `busy_intervals`?
- Quale `start_ts` base usare? (primo lunedì del 2025 è arbitrario)
- Come validare che ricorrenze esistenti siano corrette?
- Cosa fare con ricorrenze senza "until" (infinite)?
- Rimuovere ricorrenze monthly
- Rimuovere intervalli > 24h

**Soluzione:**
- Script di migrazione che:
  1. Prende primo giorno della settimana con `repeatDays`
  2. Crea `start_ts` base (es. primo lunedì 2025-01-06 se repeatDays include 1)
  3. Mantiene `recurrence_rule` solo per weekly/daily
  4. Rimuove intervalli > 24h
  5. Valida che tutti i giorni siano coperti
- Testare migrazione su copia del DB reale
- Rollback plan se migrazione fallisce

## 9. Validazione Intervalli

**Edge cases da validare:**
- `end_ts <= start_ts` (invalid) - ✅ DB CHECK constraint
- Intervalli che si estendono oltre 24h (invalid) - ✅ Max 24h, solo giorno singolo
- Intervalli per giorni futuri (invalid) - ✅ Solo giorno corrente supportato
- Ricorrenze con `until < start_ts` (invalid)
- Ricorrenze con `daysOfWeek` vuoto (invalid)
- Ricorrenze con `type` diverso da `weekly` o `daily` (invalid) - ✅ Monthly deprecato
- Overlap detection: stesso utente può avere intervalli sovrapposti? - ✅ Permesso

**Soluzione:**
- Validazione lato backend (API routes)
- Validazione lato DB (CHECK constraints)
- Validazione lato frontend (UX, ma backend è source of truth)
- Documentare regole di business chiare

## 10. Error Handling e Resilienza

**Cosa succede se:**
- Query timeline fallisce (DB down, timeout)?
- Merge algorithm riceve dati malformati?
- Risoluzione ricorrenze fallisce (date invalid)?
- RTK Query cache è stale?

**Soluzione:**
- Error boundaries per errori React
- Retry logic con exponential backoff
- Fallback UI (mostra ultimi dati cached, mostra errore)
- Logging strutturato per debugging
- Monitoring e alerting per errori critici

## 11. Testing Strategy

**Cosa testare:**
- Algoritmo merge con tutti gli edge cases (max 24h)
- Risoluzione ricorrenze (weekly/daily) con DST, leap years
- Disattivazione giorni specifici tramite exceptions
- Query SQL con 100+ userIds
- Performance con dataset realistici
- Redux selectors memoization
- RTK Query cache invalidation

**Soluzione:**
- Unit tests per algoritmi core (merge, ricorrenze)
- Integration tests per API endpoints
- E2E tests per flow critici (login, crea intervallo, vedi timeline)
- Performance tests con dataset realistici
- Test di migrazione dati

## 12. UX Durante Calcolo Timeline

**Problema:**
- Timeline calculation può richiedere 100-500ms con molti utenti
- Come mostrare loading state?
- Come gestire transizioni smooth?

**Soluzione:**
- Skeleton UI durante loading
- Ottimistic updates: mostra dati cached mentre carica nuovi
- Debounce richieste timeline (non refetch su ogni keystroke)
- Progress indicator se calcolo > 1s

