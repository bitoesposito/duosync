# State Management

## Redux Toolkit (RTK) + RTK Query

**Pattern:**
- Redux Toolkit per state management globale
- RTK Query per tutte le chiamate API (caching, invalidation automatica)
- Custom hooks come public API (`useIntervals`, `useConnections`, `useTimeline`)
- Components **non** accedono allo store direttamente, solo tramite hooks
- Selectors per computed values (reselect per memoization)

## Store Structure

```
store/
  index.ts              # Store configuration
  hooks.ts              # Typed hooks (useAppDispatch, useAppSelector)
  slices/
    intervalsSlice.ts   # Intervalli dell'utente corrente
    connectionsSlice.ts # Collegamenti (amicizie)
    timelineSlice.ts    # Timeline segments (ricevuti dal backend)
    authSlice.ts        # Auth state (session, current user)
    uiSlice.ts          # UI state (locale, theme, etc.)
  api/
    intervalsApi.ts     # RTK Query endpoints per intervalli
    connectionsApi.ts   # RTK Query endpoints per connections
    timelineApi.ts      # RTK Query endpoints per timeline
```

## Regole

- Ogni dominio ha il suo slice in `store/slices/` (intervals, connections, timeline, auth, ui)
- RTK Query API in `store/api/` (organizzate per dominio)
- Hooks esposti in `hooks/` (barrel export, wrappano Redux hooks e RTK Query)
- Nessun accesso diretto allo store dai components
- Selectors memoizzati con `createSelector` (reselect)

## Error Handling

**API Errors:**
- API restituisce sempre messaggi in inglese + `code`
- Frontend traduce usando i18n basandosi sul `code`
- Mapping error codes → traduzioni in `i18n/it.json` e `i18n/en.json`

**Esempio:**
```typescript
// API response
{ error: { code: "INTERVAL_INVALID", message: "The specified interval is invalid" } }

// Frontend traduce
const translatedMessage = t(`errors.${error.code}`);
// it: "L'intervallo specificato non è valido"
// en: "The specified interval is invalid"
```

## Slice Overview

### Intervals Slice

- State: `intervals: Interval[]`, `selectedDate: string`
- RTK Query: `getIntervals`, `createInterval`, `updateInterval`, `deleteInterval`
- Selectors: `selectIntervalsByDate`, `selectIntervalsForDate`

### Timeline Slice

- State: `segments: TimelineSegment[]`, `date: string`, `userIds: number[]`
- RTK Query: `getTimeline` (chiama `/api/timeline`)
- Selectors: `selectTimelineSegments`, `selectTimelineForDate`

### Auth Slice

- State: `user: User | null`, `session: Session | null`
- Integrato con NextAuth (session sincronizzata)
- Selectors: `selectCurrentUser`, `selectCurrentUserId`

### UI Slice

- State: `locale: Locale`, `theme: 'light' | 'dark'`
- Persistito in localStorage
- Selectors: `selectLocale`, `selectTheme`

## Next.js SSR Integration

Vedi [Rischi e Complessità](./08-risks.md) - Sezione 6 per dettagli su SSR.

**Pattern consigliato:**
- Usare `next-redux-wrapper` o pattern custom per SSR
- Prefetch dati critici in Server Components
- Evitare hydration mismatches: non serializzare Date objects, usare stringhe ISO

## Cache Configuration

**RTK Query Default:**
- `keepUnusedDataFor: 300` (5 minuti)
- Tag-based invalidation per cache automatica

Vedi [Strategia Implementazione](./09-implementation-strategy.md) per decisioni su cache TTL.

