# Infrastructure Specifications

Documentazione completa delle specifiche infrastrutturali per il refactor di DuoSync.

## Struttura Documentazione

0. **[Principi Cardine](./01-principles.md)** - Regole fondamentali non violabili
1. **[Environment Variables](./ENV-EXPLANATION.md)** - Configurazione con valori di default
2. **[Database Schema](./02-database-schema.md)** - Schema completo con Drizzle
3. **[Algoritmi Core](./03-algorithms.md)** - Merge, ricorrenze, pipeline backend
4. **[API Design](./04-api-design.md)** - Endpoints, error handling, rate limiting, security
5. **[State Management](./05-state-management.md)** - Redux Toolkit + RTK Query
6. **[Authentication](./06-authentication.md)** - NextAuth v5 flow + email templates
7. **[Connections System](./07-connections.md)** - Sistema amicizie e permessi
8. **[Rischi e Complessità](./08-risks.md)** - Problemi noti e soluzioni
9. **[Strategia Implementazione](./09-implementation-strategy.md)** - Fasi, testing, deployment, backup
10. **[Technology Stack](./10-technology-stack.md)** - Stack tecnologico + logging
11. **[Design Rules](./11-design-rules.md)** - Regole di design non violabili
12. **[Approccio Frontend](./14-frontend-approach.md)** - shadcn/ui + focus logica + a11y + i18n
13. **[Setup Progetto](./15-project-setup.md)** - Struttura progetto e configurazione iniziale
14. **[Cosa Manca](./16-missing-before-start.md)** - Checklist pre-implementazione

## Quick Start

**Prima di iniziare:**
1. Leggi [Cosa Manca](./16-missing-before-start.md) - Checklist pre-implementazione
2. Leggi [Setup Progetto](./15-project-setup.md) - Struttura e configurazione iniziale
3. Leggi [Principi Cardine](./01-principles.md) - Regole non violabili
4. Leggi [Strategia Implementazione](./09-implementation-strategy.md) - Fasi di lavoro
5. Leggi [Rischi e Complessità](./08-risks.md) - Cosa non sottostimare

**Status:** ✅ **PRONTO PER IMPLEMENTAZIONE** - Tutte le decisioni integrate nella documentazione

**Durante implementazione:**
- Riferisciti a [Algoritmi Core](./03-algorithms.md) per logica business
- Riferisciti a [API Design](./04-api-design.md) per endpoints
- Riferisciti a [State Management](./05-state-management.md) per Redux

## Decisioni Architetturali Completate

**Tutte le decisioni sono integrate nella documentazione:**

- **Timezone**: Multi-timezone (UTC calcoli, display locale) - Vedi `01-principles.md`
- **Intervalli > 24h**: Max 7 giorni - Vedi `02-database-schema.md`
- **Overlap utente**: Permesso - Vedi `02-database-schema.md`
- **Recurrence Rules**: Weekly + daily + monthly - Vedi `02-database-schema.md`
- **Cache TTL**: 5 minuti - Vedi `05-state-management.md`
- **Token Strategy**: UUID v4 nel DB - Vedi `06-authentication.md`
- **Connection Limits**: 50 (solo `accepted`) - Vedi `07-connections.md`
- **Error Handling**: Error codes + messaggi IT/EN - Vedi `04-api-design.md`
- **Rate Limiting**: Completo (100 req/min autenticato) - Vedi `04-api-design.md`
- **Email**: Resend + template completi - Vedi `06-authentication.md`
- **Testing**: Test completi + coverage >80% - Vedi `09-implementation-strategy.md`
- **Deployment**: Coolify su VPS - Vedi `09-implementation-strategy.md`
- **Accessibility**: WCAG AA completo - Vedi `14-frontend-approach.md`
- **i18n**: next-intl (IT/EN) - Vedi `14-frontend-approach.md`  

## Timeline Stimata

**Totale: 25-35 giorni** (5-7 settimane)

- Fase 0: Decisioni critiche (1-2 giorni)
- Fase 1: Setup base (2-3 giorni)
- Fase 2: Algoritmi core + testing (5-7 giorni) ⚠️ CRITICO
- Fase 3: Backend API (3-4 giorni)
- Fase 4: Redux setup (2-3 giorni)
- Fase 5: NextAuth (3-4 giorni)
- Fase 6: Frontend (5-7 giorni)
- Fase 7: Migrazione (2-3 giorni, se necessario)

## Contatti e Note

Per domande o chiarimenti, consulta la sezione specifica nella documentazione.

