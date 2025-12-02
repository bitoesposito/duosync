# Configurazione Notifiche Push

Questo documento descrive come configurare le notifiche push per DuoSync.

## Installazione Dipendenze

Prima di tutto, installa il pacchetto `web-push`:

```bash
npm install web-push
```

## Configurazione VAPID Keys

Le VAPID keys sono necessarie per autenticare le richieste push al browser. 

### Generazione delle chiavi

Puoi generare le chiavi usando il pacchetto `web-push`:

```bash
npx web-push generate-vapid-keys
```

Questo genererà una coppia di chiavi pubblica e privata.

### Configurazione delle variabili d'ambiente

Aggiungi le seguenti variabili al tuo file `.env`:

```env
VAPID_PUBLIC_KEY=<la_tua_chiave_pubblica>
VAPID_PRIVATE_KEY=<la_tua_chiave_privata>
VAPID_SUBJECT=mailto:admin@duosync.local
```

**Nota**: In sviluppo, se le chiavi non sono presenti nelle variabili d'ambiente, verranno generate automaticamente. Tuttavia, per produzione è **fortemente consigliato** configurare le chiavi manualmente.

## Migrazione Database

Dopo aver aggiunto la tabella `push_subscriptions` allo schema, esegui la migrazione:

```bash
npm run db:push
```

## Come Funziona

1. **Registrazione Subscription**: Quando un utente accetta le notifiche nel browser, il client si sottoscrive alle push notifications e registra la subscription sul server tramite `/api/notifications/subscribe`.

2. **Invio Notifiche**: Quando un utente clicca sul pulsante "Conferma" nella lista impegni, viene chiamato `/api/notifications/confirm`, che invia notifiche push a tutti gli altri utenti che hanno accettato le notifiche.

3. **Ricezione Notifiche**: Il service worker (`/public/sw.js`) gestisce l'arrivo delle notifiche push e le mostra all'utente.

## Endpoint API

- `GET /api/notifications/vapid-public-key` - Ottiene la chiave pubblica VAPID
- `POST /api/notifications/subscribe` - Registra una subscription push per un utente
- `DELETE /api/notifications/subscribe` - Rimuove una subscription push
- `POST /api/notifications/confirm` - Invia notifiche agli altri utenti quando un utente conferma i suoi impegni

Vedi la documentazione Postman in `/api-docs` per maggiori dettagli.

