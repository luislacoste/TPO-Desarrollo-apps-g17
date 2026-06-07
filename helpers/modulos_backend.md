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

| Módulo | Endpoints aproximados | Notas |
|---|---|---|
| `payment-methods` | listar, alta (credit card / bank account / certified check), eliminar, status | Cheque certificado sin restricción de categoría (corrección 5.2). |
| `payments` | pendientes, detalle, pagar, facturas | Genera multa automática al vencer (consigna). |
| `fines` | listar mías, detalle, pagar (regulariza dentro de 72hs) | Tablas `multas` con `deadline_at = issued_at + 72h`. |
| `admin` | aprobar/rechazar usuario, asignar categoría, cambiar admisión, aplicar/condonar multas, block-participation | Requiere `requireRole('admin')`. |
| `favorites` | agregar, quitar, listar | Tabla `favoritos`. |
| `notifications` | listar, marcar leída, settings | Tablas `notificaciones` + `notificaciones_settings`. |
| `metrics` | métricas de cualquier usuario, participación en subastas | Reusable con queries similares a `users/me/metrics`. |
| **WebSocket** | `wss://.../ws/auction/{id}` | Eventos `bid_placed, bid_accepted, item_sold, auction_ended, item_changed`. Por implementar. |
