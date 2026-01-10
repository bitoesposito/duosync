# Approccio Frontend

## Stack UI

- **shadcn/ui**: Componenti UI base (Button, Input, Dialog, Toast, etc.)
- **Layout/Template**: Gestito manualmente dallo sviluppatore
- **Focus**: Solo logica di business

## Responsabilità Implementazione

### ✅ Implementare (Logica)

- Redux slices e RTK Query APIs
- Custom hooks (`useIntervals`, `useTimeline`, `useConnections`)
- Selectors memoizzati
- Business logic (validazione, trasformazioni dati)
- Error handling logic
- Loading states management
- Cache invalidation logic

### ⚠️ Segnalare (Elementi UX Necessari)

Quando mancano elementi UX critici per la logica, segnalare:

- **Skeleton UI**: Necessario per loading states
- **Error Boundaries**: Necessario per error handling
- **Toast Notifications**: Necessario per feedback utente
- **Modal/Dialog**: Necessario per navigatore intervalli multi-giorno
- **Tooltip**: Necessario per info intervalli
- **Form Validation**: Necessario per UX migliore
- **Loading Indicators**: Necessario per operazioni async

### ❌ Non Implementare (Layout/Template)

- Layout HTML/CSS
- Template pagine
- Styling personalizzato
- Responsive breakpoints (se non critici per logica)

## Pattern Implementazione

### Hooks Pattern

```typescript
// ✅ Implementare: Hook con logica
export function useIntervals(date: string) {
  const { data, isLoading, error } = useGetIntervalsQuery(date);
  // Logica business qui
  return { intervals: data, isLoading, error };
}

// ⚠️ Segnalare: Componente UI necessario
// Componente Timeline richiede:
// - Skeleton durante isLoading
// - Error boundary per error
// - Tooltip per hover intervalli
```

### RTK Query Pattern

```typescript
// ✅ Implementare: API endpoint
export const intervalsApi = createApi({
  endpoints: (builder) => ({
    getIntervals: builder.query<Interval[], string>({
      query: (date) => `/api/intervals?date=${date}`,
      providesTags: ['Intervals'],
    }),
  }),
});

// ⚠️ Segnalare: UI necessaria
// useGetIntervalsQuery richiede:
// - Loading state UI
// - Error state UI
// - Empty state UI
```

## Checklist Elementi UX da Segnalare

Quando implementi logica, verifica e segnala se mancano:

- [ ] Loading states (skeleton, spinner)
- [ ] Error states (error boundary, error message)
- [ ] Empty states (nessun dato)
- [ ] Success feedback (toast, notification)
- [ ] Form validation feedback
- [ ] Confirmation dialogs (delete, etc.)
- [ ] Tooltips per info aggiuntive
- [ ] Modals per azioni complesse
- [ ] Progress indicators per operazioni lunghe
- [ ] Offline indicator

## Accessibility (a11y)

**Approccio:** a11y completo (WCAG AA compliant)

**Implementazione:**
- Keyboard navigation completa (Tab, Enter, Esc)
- ARIA labels descrittivi (shadcn/ui già include)
- Color contrast WCAG AA (minimo 4.5:1 per testo normale)
- Focus management (focus trap in modals, focus visible sempre)
- Screen reader testing (NVDA/JAWS, validazione con axe DevTools)

## Internationalization (i18n)

**Approccio:** i18n completo (IT/EN) con next-intl

**Libreria:** `next-intl` (integrato con Next.js App Router)

**Struttura:**
```
messages/
  it.json
  en.json
```

**Implementazione:**
- Traduzioni per: UI labels, error messages (mappati da error codes API), date/time formats
- Language switcher: Dropdown in header con flag/lingua corrente
- Persistenza: Cookie per salvare preferenza utente
- Date/time formatting: Locale-aware automatico (dayjs con locale IT/EN)

**Error Messages Translation:**
- API restituisce sempre messaggi in inglese + `code`
- Frontend mappa `code` → traduzione usando i18n
- Esempio mapping:
  ```json
  // messages/it.json
  {
    "errors": {
      "INTERVAL_INVALID": "L'intervallo specificato non è valido",
      "CONNECTION_LIMIT_REACHED": "Hai raggiunto il limite massimo di connessioni"
    }
  }
  ```

**Routing:** Locale-aware routing con next-intl

## Note

- Essere critico: se la logica richiede un elemento UX per funzionare correttamente, segnalarlo
- Non essere prescrittivo: non dire "usa questo componente", ma "serve un modo per mostrare X"
- Focus su funzionalità: la logica deve funzionare anche senza UI perfetta, ma segnalare gap

