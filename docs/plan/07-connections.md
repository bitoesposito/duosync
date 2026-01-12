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

**Nota:** Gli endpoint sono in `app/api/connections/` e usano la business logic da `lib/services/connections.service.ts`.

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
// hooks/use-connections.ts
export function useConnections() {
  const { data: connections, isLoading } = useGetConnectionsQuery();
  const dispatch = useAppDispatch();
  
  const acceptedConnections = useMemo(() => 
    connections?.filter(c => c.status === 'accepted') || [], 
    [connections]
  );
  
  const visibleUserIds = useMemo(() => 
    acceptedConnections
      .filter(c => c.canSeeAppointments)
      .map(c => c.requesterId === currentUserId ? c.addresseeId : c.requesterId),
    [acceptedConnections]
  );
  
  return {
    connections,
    acceptedConnections,
    visibleUserIds,
    pendingSent: connections?.filter(c => c.status === 'pending' && c.requesterId === currentUserId) || [],
    pendingReceived: connections?.filter(c => c.status === 'pending' && c.addresseeId === currentUserId) || [],
    requestConnection: (addresseeId: number) => dispatch(requestConnection(addresseeId)),
    acceptConnection: (id: number) => dispatch(acceptConnection(id)),
    blockConnection: (id: number) => dispatch(blockConnection(id)),
    toggleVisibility: (id: number, canSee: boolean) => dispatch(toggleVisibility({ id, canSeeAppointments: canSee })),
    removeConnection: (id: number) => dispatch(removeConnection(id)),
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

