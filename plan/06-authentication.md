# Authentication

## NextAuth v5 Flow

### Phase 1: Token-Based (Initial)

1. User receives unique token (QR code, link, manual entry)
2. Token stored in `users.token` on first use
3. NextAuth custom provider validates token
4. Session created, token bound to session

### Phase 2: Email Association

1. User can add email to account (optional)
2. Email stored in `users.email`
3. Email verification via NextAuth magic link

### Phase 3: Multi-Device Recovery

1. User requests magic link via email
2. Magic link contains one-time token
3. Token validates and creates session on new device
4. Original token remains valid (both devices work)

## NextAuth Configuration

**Nota:** La configurazione NextAuth è in `app/api/auth/[...nextauth]/route.ts` e usa la business logic da `lib/services/auth.service.ts`.

```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";

export const authOptions: NextAuthOptions = {
  providers: [
    // Custom credentials provider for token
    CredentialsProvider({
      name: "Token",
      credentials: {
        token: { type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;
        
        const user = await db.query.users.findFirst({
          where: eq(users.token, credentials.token),
        });
        
        if (!user) return null;
        
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
    
    // Email magic link provider
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};
```

## Redux Sync

Vedi [Rischi e Complessità](./08-risks.md) - Sezione 7 per dettagli su sincronizzazione NextAuth + Redux.

**Pattern:**
- Polling periodico della session (es. ogni 5 min)
- Event listener per session changes
- Middleware Redux per sincronizzare session → auth slice
- Gestire loading state durante sync

## Token Strategy

**Decisione:** UUID v4 nel DB

**Implementazione:**

```typescript
import { randomUUID } from "crypto";

// Generazione token al momento della creazione utente
const token = randomUUID();

// Salvare in users.token nel DB
await db.insert(users).values({
  name: userName,
  token: token,
  // ...
});
```

**Validazione con NextAuth:**

```typescript
// NextAuth CredentialsProvider
CredentialsProvider({
  name: "Token",
  credentials: {
    token: { type: "text" },
  },
  async authorize(credentials) {
    if (!credentials?.token) return null;
    
    const user = await db.query.users.findFirst({
      where: eq(users.token, credentials.token),
    });
    
    if (!user) return null;
    
    return {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
    };
  },
}),
```

**Rotazione:** 
- Manuale: Utente può rigenerare token nelle impostazioni
- Automatica: Su logout (NextAuth gestisce)
- Rotazione automatica in fase 2 se necessario

**Razionale:**
UUID nel DB è la scelta più semplice e coerente con NextAuth CredentialsProvider. Allineato con il pattern originale dell'app, offre sicurezza (token univoci e non prevedibili) senza la complessità di JWT stateless.

## Email Templates e Magic Link

**Provider:** Resend

**Template Magic Link:**
- HTML responsive + text fallback
- Branding app + link cliccabile + scadenza
- Template personalizzato (non default NextAuth)

**Template Notifiche:**
- "Mario ha aggiornato i suoi impegni. Tocca per aggiornare la timeline."
- Messaggio breve + link per aggiornare timeline

**Fallback Strategy:**
- Se email fallisce, log error ma app continua (feature opzionale)
- Magic link disabilitato se `EMAIL_SERVER` non configurato

**Rate Limiting Email:**
- Max 5 email/utente/ora
- Previene spam e abusi

## Security Considerations

- Rate limiting su endpoint di login
- Token validation su ogni request
- Session expiration (default NextAuth: 30 giorni)
- HTTPS obbligatorio in produzione

