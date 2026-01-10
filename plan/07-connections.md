# User Connections System

## Connection States

- `pending`: Request sent, awaiting acceptance
- `accepted`: Both users can see each other's appointments
- `blocked`: One user blocked the other (no visibility)

## Permission Model

- `canSeeAppointments`: Boolean flag per connection
- Default: `true` when connection accepted
- User can toggle visibility per connection
- Blocking sets `canSeeAppointments = false` automatically

## API Endpoints

```
POST /api/connections/request { addresseeId }
GET  /api/connections (list all connections with status, include otherUser data)
PUT  /api/connections/:id/accept
PUT  /api/connections/:id/block
PUT  /api/connections/:id/visibility { canSeeAppointments }
DELETE /api/connections/:id
```

## State Management (Connections)

Vedi [State Management](./05-state-management.md) per dettagli su Redux slice e RTK Query.

**Custom Hook (Public API):**

```typescript
// features/connections/index.ts
export function useConnections() {
  const { acceptedConnections, visibleUserIds, requestConnection } = useConnections();
  
  return {
    connections,
    acceptedConnections,
    visibleUserIds,
    pendingSent,
    pendingReceived,
    requestConnection,
    acceptConnection,
    blockConnection,
    toggleVisibility,
    removeConnection,
    isLoading,
  };
}
```

**Hook Usage in Components:**

```typescript
// In components
const { acceptedConnections, visibleUserIds, requestConnection } = useConnections();

// Per timeline: usa visibleUserIds direttamente
const userIds = [currentUserId, ...visibleUserIds];
```

## Query Logic (Backend)

Quando si calcola la timeline:

```typescript
// Get all users with accepted connections where canSeeAppointments = true
const visibleUsers = await db.query.userConnections.findMany({
  where: and(
    or(
      eq(userConnections.requesterId, currentUserId),
      eq(userConnections.addresseeId, currentUserId)
    ),
    eq(userConnections.status, 'accepted'),
    eq(userConnections.canSeeAppointments, true)
  )
});

// Include currentUserId + visibleUsers in timeline query
const userIds = [currentUserId, ...visibleUsers.map(c => 
  c.requesterId === currentUserId ? c.addresseeId : c.requesterId
)];
```

## Connection Limits

**Decisione:** 50 connessioni per utente

**Implementazione:**

```typescript
// In API route - Solo connessioni 'accepted' contano nel limite
const acceptedConnectionsCount = await db.query.userConnections.count({
  where: and(
    or(
      eq(userConnections.requesterId, currentUserId),
      eq(userConnections.addresseeId, currentUserId)
    ),
    eq(userConnections.status, 'accepted') // Solo accepted contano
  ),
});

if (acceptedConnectionsCount >= 50) {
  return NextResponse.json(
    { error: "Hai raggiunto il limite massimo di 50 connessioni. Rimuovi alcune connessioni per aggiungerne di nuove." },
    { status: 403 }
  );
}
```

**Regole:**
- Solo connessioni `accepted` contano nel limite
- `pending` e `blocked` non contano
- Quando si accetta una connessione, verificare limite
- Quando si rimuove una connessione, liberare slot immediatamente

