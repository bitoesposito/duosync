# Design Rules (Non Violabili)

## 1. Se il DB può farlo, JS non deve

- Usa GIST indexes per overlap queries
- Usa range queries native PostgreSQL
- Usa CHECK constraints per validazione
- Non fare validazioni che il DB può fare

## 2. Mai calcoli per utente nel confronto globale

- Un solo calcolo aggregato, non N calcoli separati
- Query SQL con `ANY(:user_ids)` invece di loop
- Merge algorithm unico per tutti gli utenti

## 3. Mai espansione eager delle ricorrenze

- Risolvi solo nel range richiesto
- Mai materializzare tutte le istanze future
- Usa `rrule.between()` per generare solo occorrenze nel range

## 4. Mai stringhe per rappresentare il tempo

- Sempre `timestamptz` nel DB
- Sempre `Date` objects in JavaScript
- Converti a stringhe solo per display nel frontend
- Usa ISO 8601 per serializzazione

## 5. Se aumenta il numero di utenti e rallenta → modello errato

- Complessità deve essere O(n log n) dove n = intervalli nel range
- Non O(m * k) dove m = utenti, k = intervalli per utente
- Se aggiungere utenti rallenta, rivedere algoritmo

## 6. Frontend solo rendering

- Frontend chiama API e renderizza
- Nessun calcolo nel frontend
- Nessuna logica di business nel frontend
- Se il frontend "decide" qualcosa → stai sbagliando

## 7. Validazione a più livelli

- DB: CHECK constraints per invarianti fondamentali
- Backend: Validazione business logic
- Frontend: Validazione UX (ma backend è source of truth)

## 8. Error handling sempre

- Error boundaries per React errors
- Try-catch per async operations
- Fallback UI per errori
- Logging strutturato per debugging

## 9. Testing prima di ottimizzare

- Test unitari per algoritmi core
- Benchmark con dati realistici
- Profiling prima di ottimizzare
- Non ottimizzare prematuramente

## 10. Documentazione inline

- Commenti per logica complessa
- JSDoc per funzioni pubbliche
- README per setup e architettura
- Documentare decisioni importanti

