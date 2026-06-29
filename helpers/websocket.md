# WebSocket — tiempo real en SubastAR

Cómo funciona el tiempo real de las subastas (pujas, ventas, cierre) de punta
a punta: backend, bus de eventos y consumo en el mobile.

## Idea general

```
  REST (POST /v1/bids, POST /v1/admin/auctions/:id/close)
        │  (al persistir un cambio)
        ▼
  services/events  (EventEmitter de dominio)
        │  emit('bid_placed' | 'item_sold' | 'auction_ended' | ...)
        ▼
  ws/index.ts  (WebSocketServer)  ── broadcast a la "sala" de esa subasta ──▶  clientes
                                                                                  │
                                                              mobile: useAuctionSocket(auctionId)
                                                                                  │
                                                          AuctionLiveScreen / ItemDetailScreen
```

El WebSocket es **read-only / informativo**: el cliente sólo recibe eventos.
Toda acción (pujar, unirse, cerrar) sigue yendo por REST con su auth y sus
validaciones. El WS no requiere token (los eventos son públicos).

## URL

```
ws://<host>:4000/ws/auction/<auctionId>
```
- Una conexión = suscripción a la subasta `<auctionId>` (una "sala").
- En el mobile el host se infiere igual que la API (`getWsBaseUrl()` en
  `mobile/src/lib/api.ts` → `ws://<host>:4000`).

---

## Backend

### 1. Bus de eventos — `backend/src/services/events.ts`
Un `EventEmitter` singleton (`events`). Los services emiten eventos de dominio
sin acoplarse al WebSocket. Eventos definidos (`DomainEvents`):

| Evento | Payload | Quién lo emite |
|--------|---------|----------------|
| `bid_placed` | `{ auctionId, itemId, bidId, importe, clienteId, asistenteId }` | `bids.service.placeBid` (al pujar) |
| `bid_accepted` | igual que bid_placed | se emite junto a `bid_placed` (en esta API toda puja válida queda aceptada) |
| `item_sold` | `{ auctionId, itemId, clienteId, importe }` | `admin.service.closeAuction` (por cada ítem adjudicado) |
| `auction_ended` | `{ auctionId }` | `admin.service.closeAuction` (al cerrar) |
| `item_changed` | `{ auctionId, itemId, change }` | reservado (aún no se emite) |

> Importante: los eventos se emiten **después** de commitear la transacción,
> así sólo se broadcastea lo que realmente quedó persistido.

### 2. Servidor WS — `backend/src/ws/index.ts`
- `setupWebSocket(httpServer)` se engancha al `http.Server` en `server.ts`
  (mismo puerto que la API, vía el evento `upgrade`).
- Mantiene `rooms: Map<auctionId, Set<WebSocket>>`.
- En cada `upgrade` parsea `auctionId` de la URL (`/ws/auction/:id`); si no
  matchea, responde 404 y cierra.
- Al conectar: mete el socket en la sala y manda un mensaje `hello`.
- Se suscribe a los eventos de dominio y, por cada uno, hace `broadcast` a la
  sala correspondiente (sólo a sockets `OPEN`).
- Al `close`/`error` saca el socket de la sala.

### 3. Tipos de mensaje — `backend/src/ws/types.ts`
`WsServerMessage` = unión de `hello | bid_placed | bid_accepted | item_sold |
auction_ended | item_changed`. Todos llevan `type`, `at` (ISO) y `auctionId`.

### Cómo agregar un evento nuevo
1. Definí el tipo en `services/events.ts` (`DomainEvents` + interfaz del payload).
2. Agregá la variante en `ws/types.ts` (`WsServerMessage`).
3. Suscribite en `ws/index.ts` (`events.on('mi_evento', e => broadcast(e.auctionId, {...}))`).
4. Emití desde el service correspondiente, **después** de persistir.
5. (Mobile) agregá la variante en `WsMessage` y manejala en la pantalla.

---

## Mobile

### Hook — `mobile/src/lib/useAuctionSocket.ts`
```ts
const { connected, lastEvent } = useAuctionSocket(auctionId)
```
- Abre `ws://<host>:4000/ws/auction/<auctionId>`.
- **Reconexión automática**: si se cierra, reintenta cada 3 s.
- Limpia la conexión al desmontar (no deja sockets colgados).
- Expone:
  - `connected: boolean` — estado de la conexión (para el indicador "En vivo").
  - `lastEvent: WsMessage | null` — el último mensaje recibido.
- `WsMessage` es la unión de tipos espejo del backend (`hello`, `bid_placed`,
  `bid_accepted`, `item_sold`, `auction_ended`, `item_changed`).

### Patrón de consumo
Las pantallas reaccionan al `lastEvent` con un `useEffect`:
```ts
useEffect(() => {
  if (!lastEvent) return
  if (lastEvent.type === 'bid_placed' && lastEvent.itemId === Number(item.id)) {
    setLiveBid(prev => Math.max(prev ?? 0, lastEvent.importe))
    // …
  }
  if (lastEvent.type === 'item_sold' && lastEvent.itemId === Number(item.id)) { /* marcar vendido */ }
  if (lastEvent.type === 'auction_ended') { /* cerrar / finalizar countdown */ }
}, [lastEvent, item.id])
```

### Pantallas que lo usan
| Pantalla | Suscripción | Reacción |
|----------|-------------|----------|
| `AuctionLiveScreen` | `useAuctionSocket(auctionId)` | `bid_placed` → actualiza oferta/contador del ítem y muestra ticker; `item_sold` → marca el ítem vendido; `auction_ended` → badge **CERRADA** |
| `ItemDetailScreen` | `useAuctionSocket(auctionId)` | `bid_placed` (de su ítem) → sube "Oferta actual" + ajusta el mínimo; `item_sold` (de su ítem) → vendido + deshabilita pujar; `auction_ended` → countdown a "finalizada" |

> Las **listas** (Catálogo, Home) **no** usan WebSocket: muestran datos del
> fetch inicial. El tiempo real está en las pantallas de subasta en vivo y de
> detalle, que es donde se ven las pujas.

---

## Cómo probarlo a mano

Con el backend levantado (`./start.sh`), escuchá una sala y dispará una puja:

```bash
# 1) listener WS (en una terminal)
node -e 'const W=require("ws");const ws=new W("ws://localhost:4000/ws/auction/5004");
ws.on("open",()=>console.log("conectado"));ws.on("message",d=>console.log(d.toString()))'

# 2) en otra terminal: login + puja (o cerrar la subasta) por REST
TOKEN=$(curl -s -X POST http://localhost:4000/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@subastar.local","password":"admin123"}' | sed -E 's/.*"accessToken":"([^"]+)".*/\1/')
curl -s -X POST http://localhost:4000/v1/bids -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"itemId":7004,"importe":40000}'
# → el listener recibe bid_placed + bid_accepted al instante
```

## Archivos clave
- Backend: `backend/src/services/events.ts`, `backend/src/ws/index.ts`, `backend/src/ws/types.ts`, `backend/src/server.ts` (monta el WS)
- Emisores: `backend/src/modules/bids/bids.service.ts`, `backend/src/modules/admin/admin.service.ts`
- Mobile: `mobile/src/lib/useAuctionSocket.ts`, `mobile/src/lib/api.ts` (`getWsBaseUrl`), `mobile/src/screens/AuctionLiveScreen.tsx`, `mobile/src/screens/ItemDetailScreen.tsx`
