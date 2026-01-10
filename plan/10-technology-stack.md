# Technology Stack

## Core

- **Next.js 15** (App Router)
- **NextAuth.js v5** (Auth.js) - latest version
- **Drizzle ORM** - latest version
- **PostgreSQL** - latest stable (con supporto GIST indexes)
- **TypeScript** - strict mode
- **Redux Toolkit** - State management
- **RTK Query** - API calls e caching

## Performance

- **PostgreSQL GIST indexes** per range queries efficienti
- **Nessun cache layer necessario** se il modello è corretto (O(n log n) è già veloce)
- **RTK Query caching** per ridurre chiamate API

## Date/Time Libraries

- **rrule** - Risoluzione ricorrenze
- **dayjs** + **dayjs-timezone** - Manipolazione date/time e timezone conversion

## Infrastructure

- **Docker Compose** (dev + prod)
- **Drizzle Kit** (migrations)

## Frontend UI

- **shadcn/ui** - Componenti UI base
- **Tailwind CSS** - Styling
- **Layout/Template** - Gestito manualmente

**Nota:** Vedi [Approccio Frontend](./14-frontend-approach.md) per dettagli su responsabilità implementazione.

## Development Tools

- **ESLint** - Linting
- **TypeScript** - Type checking
- **Jest** / **Vitest** - Testing
- **Redux DevTools** - Debugging Redux

## Logging

- **pino** - Logging strutturato JSON, performante
- **Log levels**: ERROR, WARN, INFO, DEBUG (configurabile via env)
- **Output**: File log locale per MVP, aggregazione in fase 2
- **Monitoring avanzato**: Sentry/Datadog in fase 2 se necessario

## Key Choices

- **Redux Toolkit**: State management scalabile, DevTools, RTK Query integrato
- **Drizzle ORM**: Type-safe, performante, migliore di Prisma per questo use case
- **NextAuth v5**: Standard de-facto per auth in Next.js, supporta custom providers
- **rrule**: Libreria matura e testata per ricorrenze, gestisce DST e edge cases
- **pino**: Logging performante e strutturato, sufficiente per MVP

