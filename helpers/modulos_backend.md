# Módulos del backend — resumen de endpoints

Referencia rápida del estado del backend. Cada sección lista los endpoints
implementados con qué hacen, qué validan y si requieren JWT.

> Base URL: `http://localhost:4000/v1`
> Auth: `Authorization: Bearer <accessToken>` (devuelto por `/auth/login`)

---

## Health

| Método | Path | Auth | Qué hace |
|---|---|---|---|
| GET | `/health` | — | Verifica que el proceso responde y que la DB es alcanzable (`SELECT 1`). |

---

## Auth (`/v1/auth`)

Flujo de registro **multi-paso** (1 → 2 → 3) + login + refresh + forgot.

| Método | Path | Auth | Qué hace |
|---|---|---|---|
| POST | `/login` | — | Login con `email + password`. Devuelve `{ accessToken, refreshToken, user }`. Rechaza cuentas con registro incompleto (`password_hash IS NULL`). |
| POST | `/register` | — | **Step 1**: recibe `email, firstName, lastName, domicilio, pais, documento`. Crea filas en `personas + clientes + clientes_perfil + clientes_admision (pending) + clientes_credenciales (sin password)`. Devuelve `{ userId }`. Valida email y documento únicos, y que el país exista. |
| POST | `/register/document` | — | **Step 2**: `multipart/form-data` con `userId + documentFront + documentBack` (jpg/png/pdf, ≤ 5 MB). Guarda paths en `clientes_perfil`. |
| POST | `/register/complete` | — | **Step 3**: setea el password (bcrypt) con `userId + password`. Requiere que step 2 esté hecho. Habilita login. |
| POST | `/forgot-password` | — | Placeholder: siempre 200 (no envía mail). |
| POST | `/refresh-token` | — | Rota el refresh: revoca el viejo, emite par nuevo. 401 si está expirado/revocado/desconocido. |

**Reglas clave:** el documento (DNI) es obligatorio en step 1 porque
`personas.documento` es `NOT NULL`. El email queda guardado desde step 1
pero el login está bloqueado hasta que step 3 setea el password.

---

## Users (`/v1/users`) — todos requieren JWT

| Método | Path | Qué hace |
|---|---|---|
| GET | `/me` | Perfil completo del usuario logueado: id, email, role, documento, firstName/lastName/phone/domicilio/pais, category, admissionStatus + notes + timestamps, documentVerified, bidsBlocked + reason + until, createdAt/updatedAt. |
| PUT | `/me` | Actualiza `firstName, lastName, phone, domicilio`. Whitelist: cualquier otro campo se ignora (no se puede tocar email, role, category ni admissionStatus desde acá). Sincroniza `personas.nombre`. |
| GET | `/me/metrics` | `totalAuctions, wonAuctions, totalBids, totalSpent, winRate`. Una query con 4 subqueries sobre `asistentes, pujos, registrodesubasta`. |
| GET | `/me/category` | `{ current, next, isMax }` — categoría actual + siguiente tier para progreso. |

---

## Categories (`/v1/categories`) — públicos

| Método | Path | Qué hace |
|---|---|---|
| GET | `/` | Lista las 4 categorías estáticas (`bronce, plata, oro, platino`) con `tier, description, benefits, requirements`. |
| GET | `/:id` | Detalle de una categoría; 404 si el id no existe. |

**Nota:** las categorías son constantes en código (`categories.service.ts`),
no en DB. Son inmutables y son parte del contrato.

---

## Auctions (`/v1/auctions`)

| Método | Path | Auth | Qué hace |
|---|---|---|---|
| GET | `/` | — | Listado paginado con filtros `status, category, fechaDesde, fechaHasta, page, limit`. Cada subasta incluye `items_count`. Devuelve `{ items, page, limit, total }`. |
| GET | `/active` | — | Subastas `estado='abierta'` con `fecha <= hoy`. |
| GET | `/upcoming` | — | Subastas `estado='abierta'` con `fecha > hoy`. |
| GET | `/:id` | — | Detalle con subastador (JOIN a `personas`). |
| GET | `/:id/catalog` | — | Items del catálogo de la subasta (incluye `descripcion_catalogo` y `fotos_count`). |
| POST | `/:id/join` | JWT | Inscribe al cliente como `asistente` con el `numeropostor` siguiente. Idempotente (si ya está inscripto devuelve la asistencia). Devuelve `{ sessionId, asistente, wsUrl }`. |
| GET | `/:id/stream` | JWT | URL placeholder del streaming (`streamUrl` + `wsUrl`). |

**Validaciones de `join`:** admisión `approved`, no `bids_blocked`,
subasta `abierta`. Reutilizado por `bids` vía
`auctions.service.assertCanParticipate(clienteId)`.

---

## Items (`/v1/items`)

| Método | Path | Auth | Qué hace |
|---|---|---|---|
| GET | `/` | — | Listado paginado con filtros `auctionId, status=sold\|unsold, page, limit`. |
| GET | `/:id` | opcional | Detalle del item. **Si NO hay JWT, oculta `precio_base`** (regla del swagger: solo registrados lo ven). |
| GET | `/:id/images` | — | Lista de fotos del item con `url` apuntando al endpoint binario. |
| GET | `/:id/images/:photoId` | — | Sirve el `BYTEA` con `Content-Type: image/jpeg`. |
| GET | `/:id/history` | — | Historial de transferencias del item vía `registrodesubasta` (subasta, fecha, cliente, importe). |

---

## Bids (`/v1/bids`)

| Método | Path | Auth | Qué hace |
|---|---|---|---|
| POST | `/` | JWT | Hace una puja. Body: `{ itemId, importe }`. |
| GET | `/my` | JWT | Todas las pujas del usuario logueado. |
| GET | `/my/won` | JWT | Pujas marcadas `ganador='si'`. |
| GET | `/auction/:auctionId` | — | Todas las pujas de una subasta. |
| GET | `/auction/:auctionId/item/:itemId/current` | — | Puja más alta del item; 404 si no hay pujas. |

**Validaciones de `POST /bids`** (en orden):

1. Cliente `approved` + no `bids_blocked` (`assertCanParticipate`).
2. Subasta `estado='abierta'`.
3. Item no `subastado='si'`.
4. Cliente inscripto como `asistente` de la subasta (sino 409 _"Tenés que unirte a la subasta antes de pujar"_).
5. **Importe mínimo:** `oferta_actual * 1.01` (o `precio_base` si no hay pujas previas).
6. **Importe máximo:** `precio_base * 1.20` — **excepto** si la categoría del cliente es `oro` o `platino` (sin tope).

> Las rutas `/bids/my*` están **antes** de `/bids/auction/:auctionId` en
> el router para que `my` no sea matcheado como `auctionId`.

---

## Sell Requests (`/v1/sell`) — todos requieren JWT

Cubre el lado **del vendedor** del flujo. Las transiciones que dispara la
empresa (`pending → reviewing → rejected_by_company | conditions_offered`)
van a ir en el módulo `admin`.

| Método | Path | Qué hace |
|---|---|---|
| POST | `/request` | Carga un objeto a vender. **Multipart** con `title, description, historia, images (≥6 archivos), ownershipDeclaration (1 archivo)`. Si el cliente nunca cargó nada, primero crea su fila en `duenios` (idempotente). Crea `solicitudes_venta (estado: pending)` + N `sell_request_imagenes`. |
| GET | `/my-requests` | Listado paginado de mis solicitudes (`?page=&limit=`). |
| GET | `/my-requests/:id` | Detalle + array de imágenes. Solo el dueño puede verlo. |
| PUT | `/my-requests/:id/accept` | Acepta las condiciones propuestas por la empresa. **Solo válido en `conditions_offered`**. Transiciona a `accepted`. |
| POST | `/my-requests/:id/reject` | Rechaza condiciones con `reason` obligatorio. **Solo válido en `conditions_offered`**. Transiciona a `conditions_rejected`, calcula `returnCost` y lo guarda. |
| GET | `/my-requests/:id/rejection-reason` | Devuelve `{ rejectionBy, reason, rejectedAt }`. Sirve para rechazos de la empresa o del vendedor. 409 si la solicitud no está rechazada. |
| GET | `/my-requests/:id/return-cost` | Devuelve breakdown: `{ amount, currency, breakdown: { shipping, handling, insurance }, carrier, estimatedDeliveryDate }`. Solo disponible cuando la solicitud está en `conditions_rejected | returning | returned`. |

**Flujo de estados (`solicitudes_venta.estado`):**

```
pending → reviewing →
  rejected_by_company       (terminal, motivo en rechazo_motivo)
| conditions_offered →
    accepted                (va a subasta)
  | conditions_rejected → returning → returned   (motivo del vendedor)
```

**Detalles:**
- El cálculo del costo de devolución (`calculateReturnCost`) usa fórmula
  fija: `shipping=1500 + handling=500 + insurance=max(200, precio_base*1%)`.
  Carrier por defecto: Andreani, ETA: +7 días. Cambia si la consigna
  define otra cosa.
- Cuando un cliente hace su primera solicitud y no existe en `duenios`,
  se crea automáticamente con `verificacion_financiera/judicial='no'`,
  `calificacionriesgo=3` y `verificador=1` (admin de sistema).
- Las imágenes se guardan en `uploads/` vía multer; las URLs quedan
  como `/uploads/<filename>` en `sell_request_imagenes.url` y
  `solicitudes_venta.declaracion_origen_url`.

---

## Payment Methods (`/v1/payment-methods`) — todos requieren JWT

Una sola tabla `medios_pago` con los 3 subtipos. El cheque certificado
**no** está restringido a Oro/Platino (corrección 5.2).

| Método | Path | Qué hace |
|---|---|---|
| GET | `/` | Lista mis medios de pago (sólo del usuario logueado). |
| POST | `/bank-account` | Registra cuenta bancaria: `{ bankName, cbu, holder }`. Valida CBU de 22 dígitos. |
| POST | `/credit-card` | Registra tarjeta: `{ number, brand, holder, expMonth, expYear }`. Guarda solo `last4` (no el PAN completo). Valida fecha de expiración. |
| POST | `/certified-check` | Registra cheque certificado: `{ checkNumber, bankName, amount, currency }`. Disponible para cualquier categoría. |
| DELETE | `/:id` | Elimina. 409 si el medio tiene `pagos` asociados. |
| GET | `/:id/status` | Estado de verificación: `{ id, tipo, verificado, estado: 'verified' \| 'pending_verification' }`. |

---

## Payments (`/v1/payments`) — todos requieren JWT

| Método | Path | Qué hace |
|---|---|---|
| GET | `/pending` | Pagos del usuario con estado `pending`, `processing` u `overdue`. |
| GET | `/invoices` | Mis facturas. Devuelve `[{ id, paymentId, numero, monto, moneda, pdfUrl, issuedAt }]`. |
| GET | `/:id` | Detalle del pago + `breakdown: { baseAmount, commission }` desde `registrodesubasta`. |
| POST | `/:id/pay` | Body `{ paymentMethodId }`. Valida que el pago esté `pending|processing`, el método pertenezca al cliente; marca `completed`, setea `paid_at`, genera `factura`. |

> Las rutas `/pending` y `/invoices` se declaran **antes** de `/:id` para
> que el router no las matchee como id.

---

## Fines (`/v1/fines`) — todos requieren JWT

Multas del **10%** sobre la oferta, plazo de **72 hs** para regularizar.

| Método | Path | Qué hace |
|---|---|---|
| GET | `/?status=pending\|paid\|overdue\|waived` | Lista mis multas. Antes de devolver, procesa overdues. |
| GET | `/:id` | Detalle. |
| POST | `/:id/pay` | Body `{ paymentMethodId }`. Regulariza: solo si la multa está `pending`. Si está `overdue` → 409 (caso judicial). En transacción: marca `paid`, y si no hay otras multas `pending|overdue` del cliente, **desbloquea `bids_blocked`**. |

**Auto-overdue sin cron:** en cada lectura/pago se ejecuta
`processOverdueForCliente`, que:
1. `UPDATE multas SET estado='overdue' WHERE estado='pending' AND deadline_at < NOW() AND cliente_id=$1`.
2. Si transicionó al menos una, marca `clientes_admision.estado = 'blocked'` y `clientes_participacion.bids_blocked = true` con motivo `overdue_fine`.

Esto cubre la regla del swagger sin necesidad de un job programado.

---

## Admin (`/v1/admin`) — todos requieren JWT con `role: admin`

Si el JWT tiene `role: user` (o no hay token), `requireRole('admin')`
responde **`403 ForbiddenAdmin`** (corrección 2.3 del swagger).

### Usuarios

| Método | Path | Qué hace |
|---|---|---|
| GET | `/users` | Listado paginado con filtros `admissionStatus`, `category`, `search` (busca en email, first_name, last_name, documento con ILIKE). |
| GET | `/users/:id` | Detalle completo del usuario con admisión, perfil y participación. |
| POST | `/users/:id/approve` | Aprueba un usuario `pending`. Body opcional `{ category?, notes? }`. Transiciona admisión a `approved` y sincroniza `clientes.admitido='si'`. Asigna categoría inicial si se pasa. |
| POST | `/users/:id/reject` | Rechaza un usuario `pending`. Body `{ reason* (obligatorio), notes? }`. Guarda el motivo en `clientes_admision.notas`. |
| PATCH | `/users/:id/category` | Cambia categoría. Body `{ category, reason? }`. Valida que sea `bronce/plata/oro/platino`. |
| PATCH | `/users/:id/admission` | Cambia el estado de admisión libremente. Body `{ admissionStatus, notes? }`. Si pasa a `blocked`/`suspended`, también bloquea participación. |
| POST | `/users/:id/block-participation` | Bloquea participación. Body `{ reason*, until? }`. UPSERT en `clientes_participacion`. |
| POST | `/users/:id/unblock-participation` | Desbloquea. **409** si el usuario tiene multas `pending` u `overdue` sin regularizar. |

### Multas (lado empresa)

| Método | Path | Qué hace |
|---|---|---|
| GET | `/fines` | Listado global paginado, filtros `status`, `userId`. |
| POST | `/payments/:id/apply-fine` | Aplica multa manual sobre un pago. Body opcional `{ finePercentage?: number=10, notes? }`. En transacción: inserta `multas (pending, deadline=NOW+72h)`, linkea `pagos.fine_id`, transiciona pago a `overdue` y bloquea participación con motivo `unpaid_fine`. |
| POST | `/fines/:id/waive` | Condona una multa `pending|overdue`. Body `{ reason* }`. Si era la única abierta del usuario, **desbloquea** participación. |

**Detalles:**
- `actorId = req.user.sub` se usa como `empleados.identificador` para auditoría
  (`clientes_admision.updated_by`, `multas.waived_by`). Se asume que los admins
  también tienen fila en `empleados` (el seed crea persona/empleado/cliente
  id=1).
- El cálculo del monto de la multa: `amount = bid_amount * fine_percentage / 100`,
  con `bid_amount` tomado de `registrodesubasta.importe` (o `pagos.monto` si
  no hay registrodesubasta). `fine_percentage` default = `env.FINE_PERCENTAGE`
  (=10). `deadline_at = NOW() + env.FINE_DEADLINE_HOURS` (=72h).

---

## Favorites (`/v1/favorites`) — todos requieren JWT

Tabla `favoritos` con PK compuesta `(cliente_id, item_id)`.

| Método | Path | Qué hace |
|---|---|---|
| GET | `/` | Lista mis favoritos con datos del item (catálogo, subasta, precio base, fotos). |
| POST | `/:itemId` | Agrega un item a favoritos. **Idempotente** (ON CONFLICT DO NOTHING). 404 si el item no existe. |
| DELETE | `/:itemId` | Quita un item. Idempotente (204 aunque no estuviera). |

---

## Notifications (`/v1/notifications`) — todos requieren JWT

| Método | Path | Qué hace |
|---|---|---|
| GET | `/?read=true\|false` | Lista mis notificaciones. Filtro opcional `read`. |
| GET | `/settings` | Configuración de notificaciones. Si nunca se guardó, devuelve defaults (todo en `true`). |
| PUT | `/settings` | Actualiza preferencias. Body opcional `{ pushEnabled, emailEnabled, auctionStarting, bidOutbid, bidWon, paymentAlerts }` (todos boolean). UPSERT. |
| PUT | `/:id/read` | Marca como leída. 404 si no existe; 409 si ya estaba leída. |

> `/settings` se declara **antes** que `/:id/read` para que el router
> no lo matchee como id.

---

## Metrics (`/v1/metrics`) — todos requieren JWT

Stats agregadas de un usuario. Cualquier usuario autenticado puede
consultar las métricas de cualquier otro (stats públicas dentro de
la app; restringir más adelante si hace falta).

| Método | Path | Qué hace |
|---|---|---|
| GET | `/user/:userId` | `{ userId, totalAuctions, wonAuctions, totalBids, totalSpent, winRate }`. Misma fórmula que `/users/me/metrics` pero generalizada. |
| GET | `/user/:userId/auctions` | Listado de subastas en las que participó: `[{ auctionId, fecha, estado, numeroPostor, bidsCount, wonItems, totalSpent }]`. |

---

## WebSocket — Subastas en vivo

**URL:** `ws://localhost:4000/ws/auction/:auctionId`
(en producción: `wss://api.subastar.com/ws/auction/{auctionId}`)

**Auth:** ninguna. Los eventos son públicos. Las validaciones de quién
puede pujar siguen estando en `POST /v1/bids`.

**Cómo funciona:**
- Cada conexión queda asociada a una "sala" identificada por `auctionId`.
- Los services emiten eventos de dominio en `src/services/events.ts`
  (un `EventEmitter` singleton). Esto los desacopla del transporte.
- `src/ws/index.ts` se suscribe a esos eventos y los broadcastea como
  JSON a todos los clientes de la sala correspondiente.

**Eventos enviados al cliente** (todos llevan `at` ISO y `auctionId`):

| Tipo | Cuándo se emite | Disparador |
|---|---|---|
| `hello` | Al conectarse, como ACK. | El propio WS server. |
| `bid_placed` | Después de un `POST /v1/bids` exitoso. | `bids.service.placeBid` → `events.emit('bid_placed', ...)`. |
| `bid_accepted` | Igual que `bid_placed`. La API valida antes de aceptar, así que coinciden. | Idem. |
| `item_sold` | Cuando un item se vende (endpoint admin futuro). | `events.emit('item_sold', ...)`. |
| `auction_ended` | Cuando una subasta pasa a `cerrada`. | `events.emit('auction_ended', ...)`. |
| `item_changed` | Cambio de precio/estado/descripción de un item. | `events.emit('item_changed', ...)`. |

**Smoke test rápido con `wscat`:**

```bash
npm i -g wscat
wscat -c ws://localhost:4000/ws/auction/1
# < {"type":"hello","at":"...","auctionId":1,"message":"..."}
```

Después en otra terminal, hacer un `POST /v1/bids` autenticado para
el item de esa subasta y debería llegar `{type:"bid_placed",...}` por
el WS.

---

## Reglas transversales

Aplicables a todos los módulos del backend:

- **Convención de archivos por módulo:** `<feature>.routes.ts` (declara endpoints),
  `<feature>.controller.ts` (parsea req/res, valida input inline),
  `<feature>.service.ts` (lógica de negocio, no toca req/res ni SQL),
  `<feature>.repository.ts` (todas las queries SQL del módulo).
- **Errores tipados:** los services tiran `NotFound`, `Conflict`,
  `Forbidden`, `UnprocessableEntity`, etc. (de `utils/errors.ts`).
  El `errorHandler` los traduce al formato `{ code, message, details? }`
  del swagger con su HTTP status.
- **Paginación estándar:** `?page=1&limit=20` (limit máx 100).
  Response shape: `{ items, page, limit, total }`.
- **Auth:** JWT en `Authorization: Bearer <token>`. `req.user`
  queda con `{ sub, email, role }`. Para endpoints con comportamiento
  distinto autenticado/anónimo se usa `authOptional`.
- **Cross-module:** los services pueden llamar a otros services
  (ej. `bids.service` ↔ `auctions.service.assertCanParticipate`).
  Lo que NO se permite es saltarse el repository de otro módulo.

---

## Módulos pendientes

Backend completo — todos los módulos REST + WebSocket implementados.
