# Strategia di Implementazione

## Fase 0: Decisioni Critiche (PRIMA di iniziare)

✅ **COMPLETATA** - Tutte le decisioni integrate nella documentazione.

**Riepilogo decisioni:**
- Timezone: Multi-timezone (UTC calcoli, display locale) - Vedi `01-principles.md`
- Intervalli: Max 24h - Vedi `02-database-schema.md`
- Overlap utente: Permesso - Vedi `02-database-schema.md`
- Recurrence Rules: Weekly + daily - Vedi `02-database-schema.md`
- Cache TTL: 5 minuti - Vedi `05-state-management.md`
- Token Strategy: UUID v4 nel DB - Vedi `06-authentication.md`
- Connection Limits: 50 (solo `accepted`) - Vedi `07-connections.md`
- Error Handling: Error codes + messaggi IT/EN - Vedi `04-api-design.md`
- Rate Limiting: Completo - Vedi `04-api-design.md`
- Email: Resend + template completi - Vedi `06-authentication.md`
- Testing: Test completi + coverage >80% - Vedi sezione Testing Strategy
- Deployment: Coolify su VPS - Vedi sezione Deployment Strategy
- Accessibility: WCAG AA completo - Vedi `14-frontend-approach.md`
- i18n: next-intl (IT/EN) - Vedi `14-frontend-approach.md`

## Fase 1: Setup Base + Decisioni Architetturali

**Obiettivi:**
- Definire timezone strategy
- Setup librerie core
- Validazione base

**Task:**
1. ✅ Installare `rrule` per ricorrenze (o `date-fns-tz` se preferisci)
2. ✅ Installare `dayjs` con timezone support (`dayjs-timezone`)
3. ✅ Definire schema DB con CHECK constraints
4. ✅ Creare utility per timezone conversion
5. ✅ Documentare regole di business (validazione, priorità)

**Deliverable:**
- Schema DB completo con constraints
- Utility functions per timezone
- Documentazione regole di business

## Fase 2: Algoritmi Core + Testing

**Obiettivi:**
- Implementare merge algorithm con test completi
- Implementare risoluzione ricorrenze con test edge cases
- Validare performance

**Task:**
1. ✅ Implementare `mergeIntervals()` in `lib/algorithms/merge.service.ts` con priorità
2. ✅ Test unitari per tutti gli edge cases:
   - Overlap parziale
   - Overlap completo
   - Boundary cases (start === end)
   - 3+ intervalli sovrapposti
   - Priorità sleep > busy > other
3. ✅ Implementare `resolveRecurrences()` in `lib/algorithms/recurrence.service.ts` con `rrule`
4. ✅ Test edge cases ricorrenze:
   - DST transitions
   - Leap years
   - Ricorrenze oltre mezzanotte (max 24h)
   - "until" date validation
   - Disattivazione giorni specifici tramite exceptions
5. ✅ Benchmark con dataset realistici (100 utenti, 1000 intervalli)
6. ✅ Profiling e ottimizzazione se necessario

**Deliverable:**
- Funzioni core testate e documentate in `lib/algorithms/`
- Test suite completa
- Benchmark results

**Struttura File:**
- `lib/algorithms/merge.service.ts` - Funzione `mergeIntervals()`
- `lib/algorithms/recurrence.service.ts` - Funzione `resolveRecurrences()`
- `lib/algorithms/complement.service.ts` - Funzione `calculateFreeSlots()`

## Fase 3: Backend API + Validazione

**Obiettivi:**
- Endpoint timeline funzionante
- Validazione completa
- Error handling

**Task:**
1. ✅ Implementare `/api/timeline` endpoint in `app/api/timeline/route.ts`
2. ✅ Implementare business logic in `lib/services/timeline.service.ts` (usa algoritmi da `lib/algorithms/`)
3. ✅ Validazione input (date format, userIds array)
3. ✅ Error handling:
   - DB errors → 500 con messaggio generico
   - Invalid input → 400 con messaggio specifico
   - Timeout → 504
4. ✅ Logging strutturato (usare `pino` o `winston`)
5. ✅ Rate limiting (prevent abuse)
6. ✅ Integration tests per endpoint

**Deliverable:**
- Endpoint `/api/timeline` funzionante
- Error handling completo
- Test integration

## Fase 4: Redux Setup + SSR

**Obiettivi:**
- Redux configurato correttamente con Next.js
- SSR funzionante
- No hydration mismatches

**Task:**
1. ✅ Installare `@reduxjs/toolkit`, `react-redux`, `next-redux-wrapper`
2. ✅ Configurare store con middleware
3. ✅ Setup RTK Query base API
4. ✅ Configurare SSR con `next-redux-wrapper`
5. ✅ Testare hydration (no mismatches)
6. ✅ Prefetch dati critici in Server Components
7. ✅ Testare navigation tra pagine

**Deliverable:**
- Redux store configurato
- SSR funzionante
- No hydration errors

## Fase 5: NextAuth + Redux Sync

**Obiettivi:**
- NextAuth configurato
- Session sincronizzata con Redux
- Token-based auth funzionante

**Task:**
1. ✅ Installare NextAuth v5
2. ✅ Configurare CredentialsProvider (token)
3. ✅ Configurare EmailProvider (magic link)
4. ✅ Creare auth slice Redux
5. ✅ Middleware per sync session → Redux
6. ✅ Polling session ogni 5 min (opzionale, per sicurezza)
7. ✅ Testare login/logout flow

**Deliverable:**
- NextAuth configurato
- Session sync funzionante
- Auth flow completo

## Fase 6: Frontend Integration

**Obiettivi:**
- Timeline rendering funzionante
- Loading states
- Error handling UI

**Approccio:**
- **UI Components**: shadcn/ui per componenti base
- **Layout/Template**: Gestito manualmente dallo sviluppatore
- **Focus implementazione**: Solo logica di business, segnalare gap UX quando necessario

**Task:**
1. ✅ Installare e configurare shadcn/ui
2. ✅ Creare timeline slice in `store/slices/timelineSlice.ts` + RTK Query API in `store/api/timelineApi.ts`
3. ✅ Implementare hook `useTimeline()` in `hooks/use-timeline.ts` (wrapper su Redux)
4. ✅ Implementare componenti timeline in `components/timeline/`
4. ✅ ⚠️ Segnalare elementi UX necessari:
   - Skeleton UI durante loading
   - Error boundary per errori
   - Toast notifications per feedback
   - Modal per navigatore intervalli multi-giorno
   - Tooltip per info intervalli
5. ✅ Ottimistic updates (mostra cached data)
6. ✅ Debounce richieste (non refetch su ogni cambio)
7. ✅ Test E2E flow completo

**Deliverable:**
- Logica frontend completa
- Hooks e utilities esposti
- Documentazione elementi UX necessari
- E2E tests

## Fase 7: Migrazione Dati (se necessario)

**Obiettivi:**
- Migrare dati esistenti
- Validare migrazione
- Rollback plan

**Task:**
1. ✅ Analizzare dati esistenti
2. ✅ Creare script migrazione step-by-step con checkpoint:
   - Backup completo DB
   - Map `appointments` → `busy_intervals`
   - Map `recurring_appointments` → `busy_intervals` con `recurrence_rule` (weekly/daily)
   - Calcolare `start_ts` base per ricorrenze
   - Rimuovere intervalli > 24h
   - Valida integrità dati
3. ✅ Testare su copia DB reale
4. ✅ Validare dati migrati (conteggi, integrità foreign keys, test query)
5. ✅ Creare rollback script (ripristina backup se migrazione fallisce)
6. ✅ Eseguire migrazione in produzione (con backup, downtime <30 min)

**Deliverable:**
- Script migrazione testato con checkpoint
- Dati migrati validati
- Rollback plan documentato (disponibile per 24h)
- Backup automatico prima di migrazione (retention 7 giorni)

## Testing Strategy

**Approccio:** Test completi (unit + integration + E2E) + coverage >80% core

**Test Cases:**
- Algoritmi: Merge, ricorrenze (weekly/daily), complemento, timezone conversion
- API: CRUD intervalli, timeline calculation, connections
- E2E: Login → Crea intervallo → Crea ricorrenza weekly/daily → Disattiva giorni specifici → Vedi timeline → Elimina intervallo

**Coverage Target:**
- >80% algoritmi core (merge, ricorrenze)
- >60% generale

**Performance Benchmarks:**
- Timeline <500ms con 1000 intervalli
- Merge <100ms con 100 utenti

**Tools:**
- Jest/Vitest per unit + integration tests
- Playwright/Cypress per E2E tests
- Coverage monitorato con CI/CD

## Deployment Strategy

**Platform:** Coolify su VPS personale

**Approccio:** Deploy manuale via Coolify UI (o auto-deploy su push)

**Setup Coolify:**
- VPS con Coolify installato
- Git repository collegato
- Auto-deploy su push (opzionale)
- SSL automatico via Let's Encrypt
- Database PostgreSQL gestito da Coolify

**Rollback:** Disponibile tramite Coolify (previous deployment)

**Staging:** Opzionale per MVP, può essere aggiunto in fase 2

## Backup Strategy

**Approccio:** Backup manuale gestito da Coolify

**Frequency:** Settimanale (gestito da Coolify)

**Retention:** Ultimi 4 backup settimanali (1 mese)

**Recovery:** Ripristino via Coolify UI

**Disaster Recovery:** Backup esterni opzionali per archiviazione

## Checklist Pre-Implementazione

**Prima di iniziare a codare:**

- [x] Decisioni critiche prese (timezone, overlap, etc.)
- [x] Librerie scelte e installate (`rrule`, `dayjs-timezone`)
- [x] Schema DB definito con constraints
- [x] Regole di business documentate
- [x] Test strategy definita
- [x] Error handling strategy definita
- [x] Logging strategy definita

## Priorità Implementazione

**Ordine consigliato:**

1. **Fase 0** (1-2 giorni): Decisioni critiche
2. **Fase 1** (2-3 giorni): Setup base
3. **Fase 2** (5-7 giorni): Algoritmi core + testing (CRITICO)
4. **Fase 3** (3-4 giorni): Backend API
5. **Fase 4** (2-3 giorni): Redux setup
6. **Fase 5** (3-4 giorni): NextAuth
7. **Fase 6** (5-7 giorni): Frontend
8. **Fase 7** (se necessario, 2-3 giorni): Migrazione

**Totale stimato: 25-35 giorni** (circa 5-7 settimane)

## Rischi da Monitorare

**Durante implementazione, monitorare:**

1. **Performance**: Se merge > 500ms con 100 utenti → ottimizzare
2. **Memory**: Se risoluzione ricorrenze usa troppa memoria → limitare range
3. **Cache hits**: Se cache hit rate < 70% → rivedere strategy
4. **Error rate**: Se error rate > 1% → investigare
5. **User feedback**: Se UX confusa → migliorare loading states

