# Setup Progetto - Guida Iniziale

## Struttura Progetto

```
duosync/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Route group per autenticazione
│   │   ├── login/
│   │   └── magic-link/
│   ├── (dashboard)/       # Route group per dashboard
│   │   ├── timeline/
│   │   ├── intervals/
│   │   └── connections/
│   ├── api/               # API routes
│   │   ├── timeline/
│   │   ├── intervals/
│   │   ├── connections/
│   │   └── auth/
│   └── layout.tsx
├── lib/
│   ├── db/
│   │   ├── schema.ts       # Drizzle schema
│   │   ├── index.ts        # DB connection
│   │   └── migrations/    # Drizzle migrations
│   ├── env.ts             # Environment variables con default
│   ├── time/
│   │   └── dayjs.ts       # dayjs configuration
│   └── utils/
│       ├── errors.ts      # Error codes e utilities
│       └── validation.ts  # Zod schemas
├── store/                 # Redux store
│   ├── index.ts           # Store configuration
│   ├── hooks.ts           # Typed hooks
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── intervalsSlice.ts
│   │   ├── timelineSlice.ts
│   │   ├── connectionsSlice.ts
│   │   └── uiSlice.ts
│   └── api/
│       ├── intervalsApi.ts
│       ├── timelineApi.ts
│       └── connectionsApi.ts
├── features/              # Feature-based organization
│   ├── intervals/
│   │   ├── hooks/
│   │   ├── components/    # Solo logica, no layout
│   │   └── index.ts
│   ├── timeline/
│   ├── connections/
│   └── auth/
├── components/            # Componenti UI condivisi (shadcn/ui)
│   └── ui/               # shadcn/ui components
├── messages/             # i18n translations
│   ├── it.json
│   └── en.json
├── public/
├── .env.example
├── .env.local            # Non committato
├── package.json
├── tsconfig.json
├── next.config.ts
├── drizzle.config.ts
└── tailwind.config.ts
```

## Setup Iniziale

### 1. Inizializzazione Next.js

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
```

**Configurazione `next.config.ts`:**
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configurazione base
};

export default nextConfig;
```

### 2. Installazione Dipendenze Core

```bash
# Core
npm install next@latest react@latest react-dom@latest

# Database
npm install drizzle-orm drizzle-kit pg
npm install -D @types/pg

# Auth
npm install next-auth@beta

# State Management
npm install @reduxjs/toolkit react-redux
npm install next-redux-wrapper

# Date/Time
npm install dayjs
npm install dayjs-timezone
npm install rrule

# UI
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input dialog toast tooltip

# i18n
npm install next-intl

# Logging
npm install pino

# Rate Limiting
npm install @upstash/ratelimit @upstash/redis
# OPPURE
npm install rate-limiter-flexible

# Validation
npm install zod

# Email (opzionale)
npm install resend

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test  # Per E2E
```

### 3. Configurazione TypeScript

**`tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 4. File `.env.example`

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/duosync?sslmode=disable

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Email (opzionale)
EMAIL_SERVER=
EMAIL_FROM=noreply@localhost

# Node Environment
NODE_ENV=development
```

### 5. File `lib/env.ts`

```typescript
/**
 * Environment variables con valori di default
 * L'app si avvia sempre, anche senza .env
 */

const isProduction = process.env.NODE_ENV === 'production';

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/duosync?sslmode=disable',
  
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 
    'dev-secret-change-in-production-' + Math.random().toString(36),
  
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  
  EMAIL_SERVER: process.env.EMAIL_SERVER || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@localhost',
  
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

// Warning in produzione
if (isProduction) {
  if (env.NEXTAUTH_SECRET.includes('dev-secret')) {
    console.warn('⚠️  WARNING: Using default NEXTAUTH_SECRET in production!');
  }
  if (env.DATABASE_URL.includes('localhost')) {
    console.warn('⚠️  WARNING: Using default DATABASE_URL in production!');
  }
}

if (!env.EMAIL_SERVER) {
  console.info('ℹ️  Magic link disabled: EMAIL_SERVER not set');
}
```

### 6. Configurazione Drizzle

**`drizzle.config.ts`:**
```typescript
import { defineConfig } from "drizzle-kit";
import { env } from "./lib/env";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
```

### 7. Setup Database

```bash
# Genera migrazione iniziale
npx drizzle-kit generate

# Applica migrazione
npx drizzle-kit migrate

# Studio (opzionale, per vedere DB)
npx drizzle-kit studio
```

### 8. Configurazione NextAuth Base

**`app/api/auth/[...nextauth]/route.ts`:**
```typescript
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Token",
      credentials: {
        token: { type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;
        
        const user = await db.query.users.findFirst({
          where: eq(users.token, credentials.token as string),
        });
        
        if (!user) return null;
        
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
    EmailProvider({
      server: env.EMAIL_SERVER || undefined,
      from: env.EMAIL_FROM,
    }),
  ],
  secret: env.NEXTAUTH_SECRET,
});
```

### 9. Configurazione Redux Base

**`store/index.ts`:**
```typescript
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { intervalsApi } from './api/intervalsApi';
import { timelineApi } from './api/timelineApi';
import { connectionsApi } from './api/connectionsApi';
import authSlice from './slices/authSlice';
import intervalsSlice from './slices/intervalsSlice';
import timelineSlice from './slices/timelineSlice';
import connectionsSlice from './slices/connectionsSlice';
import uiSlice from './slices/uiSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice,
      intervals: intervalsSlice,
      timeline: timelineSlice,
      connections: connectionsSlice,
      ui: uiSlice,
      [intervalsApi.reducerPath]: intervalsApi.reducer,
      [timelineApi.reducerPath]: timelineApi.reducer,
      [connectionsApi.reducerPath]: connectionsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        intervalsApi.middleware,
        timelineApi.middleware,
        connectionsApi.middleware
      ),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

setupListeners(makeStore().dispatch);
```

**`store/hooks.ts`:**
```typescript
import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, AppStore, RootState } from './index';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
```

### 10. Configurazione i18n Base

**`messages/it.json`:**
```json
{
  "errors": {
    "INTERVAL_INVALID": "L'intervallo specificato non è valido",
    "CONNECTION_LIMIT_REACHED": "Hai raggiunto il limite massimo di 50 connessioni",
    "RECURRENCE_INVALID": "La regola di ricorrenza non è valida",
    "UNAUTHORIZED": "Non autorizzato",
    "TIMELINE_TIMEOUT": "Il calcolo della timeline è troppo lento",
    "NETWORK_ERROR": "Errore di rete",
    "VALIDATION_ERROR": "Errore di validazione",
    "RATE_LIMIT_EXCEEDED": "Troppe richieste, riprova più tardi"
  }
}
```

**`messages/en.json`:**
```json
{
  "errors": {
    "INTERVAL_INVALID": "The specified interval is invalid",
    "CONNECTION_LIMIT_REACHED": "You have reached the maximum limit of 50 connections",
    "RECURRENCE_INVALID": "The recurrence rule is invalid",
    "UNAUTHORIZED": "Unauthorized",
    "TIMELINE_TIMEOUT": "Timeline calculation timeout",
    "NETWORK_ERROR": "Network error",
    "VALIDATION_ERROR": "Validation error",
    "RATE_LIMIT_EXCEEDED": "Too many requests, please try again later"
  }
}
```

## Checklist Setup Iniziale

- [ ] Next.js inizializzato
- [ ] Dipendenze installate
- [ ] TypeScript configurato
- [ ] `.env.example` creato
- [ ] `lib/env.ts` creato con default
- [ ] Drizzle configurato
- [ ] Schema DB creato
- [ ] Migrazione iniziale applicata
- [ ] NextAuth configurato base
- [ ] Redux store configurato base
- [ ] i18n configurato base
- [ ] shadcn/ui inizializzato
- [ ] Struttura cartelle creata

## Prossimi Step

1. ⏭️ Creare schema DB completo
2. ⏭️ Implementare algoritmi core
3. ⏭️ Creare API endpoints
4. ⏭️ Integrare Redux con Next.js SSR
5. ⏭️ Implementare frontend logica

