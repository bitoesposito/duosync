# Principi Cardine (Non Violabili)

Questi principi sono **fondamentali** e non devono essere violati durante l'implementazione.

## 1. Il tempo è un intervallo continuo, non una lista di eventi

Il tempo non è una lista discreta di eventi, ma un continuum. Gli intervalli sono l'entità di dominio reale.

## 2. Il confronto multi-utente è un'aggregazione, non una vista

Il confronto tra più utenti è un calcolo aggregato che produce un risultato unico, non una semplice vista dei dati.

## 3. Niente stringhe per rappresentare il tempo

- ❌ `"09:00"` come rappresentazione del tempo
- ❌ `"2025-03-10"` come rappresentazione della data
- ✅ `timestamptz` nel database
- ✅ `Date` objects in JavaScript
- ✅ Stringhe solo per display nel frontend

## 4. Niente giorni discreti

Non trattare i giorni come entità discrete. Gli intervalli possono attraversare mezzanotte, estendersi oltre 24h, etc.

## 5. Niente calcoli nel frontend

Il frontend **solo renderizza**. Tutti i calcoli (merge, ricorrenze, complemento) avvengono nel backend.

**Se il frontend "decide" qualcosa → stai sbagliando.**

## 6. Se aumenta il numero di utenti e rallenta → modello errato

La complessità deve essere **O(n log n)** dove n = intervalli nel range, non O(m * k) dove m = utenti, k = intervalli per utente.

Se aggiungere utenti rallenta il sistema, il modello è sbagliato.

## Regole di Design Correlate

Vedi [Design Rules](./11-design-rules.md) per regole dettagliate di implementazione.

