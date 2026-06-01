# SubastAR API

**Versión OpenAPI:** 3.0.3 · **API:** 1.0.0

Documentación en Markdown equivalente a [`api-spec.ts`](./api-spec.ts). La UI interactiva sigue en la app: **`/api-docs`** (lee el objeto TypeScript).

---

## Descripción

API REST del sistema de subastas en tiempo real: usuarios, subastas, pujas, artículos y pagos.

### Autenticación

JWT. Enviar en cada request protegido:

```http
Authorization: Bearer <token>
```


---


## Endpoints por tag

### Auth — Autenticación y registro

| Método | Ruta | Resumen |
|--------|------|---------|
| POST | `/auth/login` | Iniciar sesión |
| POST | `/auth/register` | Registro inicial de usuario (campos obligatorios: `email`, `firstName`, `lastName`, `domicilio`, `pais`) |
| POST | `/auth/register/document` | Subir documento de identidad - frente y dorso (multipart: `documentFront`, `documentBack`) |
| POST | `/auth/register/complete` | Completar registro con contraseña |
| POST | `/auth/forgot-password` | Solicitar recuperación de contraseña |
| POST | `/auth/refresh-token` | Renovar token de acceso |

### Users — Perfil

| Método | Ruta | Auth | Resumen |
|--------|------|------|---------|
| GET | `/users/me` | Bearer | Obtener perfil del usuario actual |
| PUT | `/users/me` | Bearer | Actualizar perfil |
| GET | `/users/me/metrics` | Bearer | Métricas del usuario |
| GET | `/users/me/category` | Bearer | Categoría actual y progreso |

### Categories

| Método | Ruta | Resumen |
|--------|------|---------|
| GET | `/categories` | Listar categorías de usuario disponibles |
| GET | `/categories/{id}` | Detalle de una categoría |

### Payment Methods — Medios de pago

| Método | Ruta | Auth | Resumen |
|--------|------|------|---------|
| GET | `/payment-methods` | Bearer | Listar medios de pago |
| POST | `/payment-methods/bank-account` | Bearer | Registrar cuenta bancaria |
| POST | `/payment-methods/credit-card` | Bearer | Registrar tarjeta |
| POST | `/payment-methods/certified-check` | Bearer | Registrar cheque certificado (Oro/Platino) |
| DELETE | `/payment-methods/{id}` | Bearer | Eliminar medio de pago |
| GET | `/payment-methods/{id}/status` | Bearer | Estado de verificación |

### Auctions

| Método | Ruta | Auth | Resumen |
|--------|------|------|---------|
| GET | `/auctions` | — | Listar subastas (query: status, category, currency, fechas, page, limit) |
| GET | `/auctions/active` | — | Subastas en vivo |
| GET | `/auctions/upcoming` | — | Próximas subastas |
| GET | `/auctions/{id}` | — | Detalle de subasta |
| GET | `/auctions/{id}/catalog` | — | Catálogo de la subasta |
| POST | `/auctions/{id}/join` | Bearer | Unirse a una subasta (devuelve `sessionId`, `wsUrl`) |
| GET | `/auctions/{id}/stream` | Bearer | URL de streaming |

### Items — Artículos / piezas

| Método | Ruta | Auth | Resumen |
|--------|------|------|---------|
| GET | `/items` | — | Listar artículos (auctionId, status, paginación) |
| GET | `/items/{id}` | Bearer | Detalle (precio base solo registrados) |
| GET | `/items/{id}/images` | — | Galería |
| GET | `/items/{id}/history` | — | Historial de propietarios |

### Bids — Pujas

Reglas documentadas en spec: mínimo ~1% sobre oferta actual; máximo ~20% sobre precio base (excepto oro/platino según negocio).

| Método | Ruta | Auth | Resumen |
|--------|------|------|---------|
| POST | `/bids` | Bearer | Realizar una puja |
| GET | `/bids/auction/{auctionId}` | — | Pujas de una subasta |
| GET | `/bids/auction/{auctionId}/item/{itemId}/current` | — | Puja actual del ítem |
| GET | `/bids/my` | Bearer | Mis pujas |
| GET | `/bids/my/won` | Bearer | Pujas ganadas |

### Sell Requests

| Método | Ruta | Auth | Resumen |
|--------|------|------|---------|
| POST | `/sell/request` | Bearer | Solicitar venta (multipart, mín. 6 imágenes, declaración de titularidad) |
| GET | `/sell/my-requests` | Bearer | Mis solicitudes |
| GET | `/sell/my-requests/{id}` | Bearer | Detalle |
| PUT | `/sell/my-requests/{id}/accept` | Bearer | Aceptar condiciones de venta (transición → `accepted`) |
| POST | `/sell/my-requests/{id}/reject` | Bearer | Rechazar condiciones (motivo obligatorio; transición → `conditions_rejected`) |
| GET | `/sell/my-requests/{id}/rejection-reason` | Bearer | Consultar motivo de rechazo (empresa o vendedor) |
| GET | `/sell/my-requests/{id}/return-cost` | Bearer | Consultar costo de devolución del objeto |

**Transiciones de `SellRequest.status`** (`pending → reviewing → {rejected_by_company | conditions_offered → {accepted | conditions_rejected → returning → returned}}`). Detalle en `swagger.yml` (sección "Flujo de venta").


### My Items — Artículos del usuario

| Método | Ruta | Auth | Resumen |
|--------|------|------|---------|
| GET | `/my-items` | Bearer | Mis artículos |
| GET | `/my-items/{id}` | Bearer | Detalle |
| GET | `/my-items/{id}/location` | Bearer | Ubicación en depósito |
| GET | `/my-items/{id}/insurance` | Bearer | Póliza de seguro |

### Favorites

| Método | Ruta | Auth | Resumen |
|--------|------|------|---------|
| GET | `/favorites` | Bearer | Listar favoritos |
| POST | `/favorites/{itemId}` | Bearer | Agregar |
| DELETE | `/favorites/{itemId}` | Bearer | Quitar |

### Notifications

| Método | Ruta | Auth | Resumen |
|--------|------|------|---------|
| GET | `/notifications` | Bearer | Listar (query: `read`) |
| PUT | `/notifications/{id}/read` | Bearer | Marcar como leída |
| GET | `/notifications/settings` | Bearer | Configuración |
| PUT | `/notifications/settings` | Bearer | Actualizar configuración |

### Metrics

| Método | Ruta | Auth | Resumen |
|--------|------|------|---------|
| GET | `/metrics/user/{userId}` | Bearer | Métricas de un usuario |
| GET | `/metrics/user/{userId}/auctions` | Bearer | Participación en subastas |

### Payments

| Método | Ruta | Auth | Resumen |
|--------|------|------|---------|
| GET | `/payments/pending` | Bearer | Pagos pendientes |
| GET | `/payments/{id}` | Bearer | Detalle de pago |
| POST | `/payments/{id}/pay` | Bearer | Procesar pago |
| GET | `/payments/invoices` | Bearer | Mis facturas |

### Fines (Multas por impago)

Si el comprador no paga, el sistema genera una **multa del 10% sobre el valor ofertado** y le deja al usuario **72 hs** (`Fine.deadlineAt`) para regularizar. Mientras la multa está vigente el usuario queda con `bidsBlocked: true` (no puede pujar). Vencidas las 72 hs, la multa pasa a `overdue` y el usuario queda con `admissionStatus: blocked`.

| Método | Ruta | Auth | Resumen |
|--------|------|------|---------|
| GET | `/fines` | Bearer | Listar mis multas (filtro `status`) |
| GET | `/fines/{id}` | Bearer | Detalle de multa |
| POST | `/fines/{id}/pay` | Bearer | Regularizar multa pagando (levanta `bidsBlocked` si está dentro de las 72 hs) |

### Admin

Endpoints internos para personal de la empresa. **Todos requieren JWT con `role: admin`**; un token con `role: user` recibe `403 Forbidden`.

| Método | Ruta | Auth | Resumen |
|--------|------|------|---------|
| GET | `/admin/users` | Bearer (admin) | Listado paginado de usuarios (filtros: `admissionStatus`, `category`, `search`) |
| GET | `/admin/users/{id}` | Bearer (admin) | Detalle del usuario con datos de admisión |
| POST | `/admin/users/{id}/approve` | Bearer (admin) | Aprobar usuario pendiente (puede asignar categoría inicial) |
| POST | `/admin/users/{id}/reject` | Bearer (admin) | Rechazar usuario (motivo obligatorio) |
| PATCH | `/admin/users/{id}/category` | Bearer (admin) | Asignar/cambiar categoría (`bronce`, `plata`, `oro`, `platino`) |
| PATCH | `/admin/users/{id}/admission` | Bearer (admin) | Cambiar estado de admisión (`pending`, `approved`, `rejected`, `blocked`, `suspended`) |
| GET | `/admin/fines` | Bearer (admin) | Listar multas de toda la plataforma (filtros: `status`, `userId`) |
| POST | `/admin/payments/{id}/apply-fine` | Bearer (admin) | Aplicar multa del 10% sobre un pago impago (manual) |
| POST | `/admin/fines/{id}/waive` | Bearer (admin) | Condonar una multa (motivo obligatorio) |
| POST | `/admin/users/{id}/block-participation` | Bearer (admin) | Bloquear pujas/participación del usuario |
| POST | `/admin/users/{id}/unblock-participation` | Bearer (admin) | Habilitar participación (falla si hay multas vigentes) |

---

## Esquemas (`components.schemas`)

| Nombre | Uso breve |
|--------|-----------|
| `UserCategory` | `bronce` \| `plata` \| `oro` \| `platino` |
| `UserRole` | `user` \| `admin` |
| `AdmissionStatus` | `pending` \| `approved` \| `rejected` \| `blocked` \| `suspended` |
| `User` | Perfil base (incluye `role`, `admissionStatus`, `admissionNotes`, `bidsBlocked`) |
| `FineStatus` | `pending` \| `paid` \| `overdue` \| `waived` |
| `Fine` | Multa del 10% por impago, con `deadlineAt = issuedAt + 72h` |
| `UserMetrics` | Subastas, pujas, gasto, rating, etc. |
| `Category` | Categoría con beneficios y requisitos |
| `PaymentMethod` | `credit_card` \| `bank_account` \| `certified_check` |
| `Auction` / `AuctionDetail` | Subasta y detalle ampliado |
| `Item` / `ItemDetail` | Ítem en catálogo y detalle |
| `Bid` | Puja con estado |
| `SellRequest` / `SellRequestDetail` | Solicitud de venta (detalle incluye `conditions`, `rejectionReason`, `rejectionBy`, `returnCost`) |
| `SellRequestStatus` | `pending` \| `reviewing` \| `rejected_by_company` \| `conditions_offered` \| `accepted` \| `conditions_rejected` \| `returning` \| `returned` (`approved`/`rejected` legacy) |
| `SellRequestConditions` | Precio base, comisión, moneda, notas, `offeredAt` |
| `ReturnCost` | Costo de devolución con breakdown (envío, handling, seguro) |
| `MyItem` / `MyItemDetail` | Ítem del vendedor |
| `Notification` / `NotificationSettings` | Notificaciones |
| `Payment` / `PaymentDetail` | Pagos y desglose |
| `Invoice` | Factura |
| `Pagination` | Paginación de listas |
| `WebSocketEvent` | `bid_placed`, `bid_accepted`, `item_sold`, `auction_ended`, `item_changed` |

Los tipos completos, ejemplos y códigos HTTP por operación están en **`api-spec.ts`** y en **`/api-docs`**.

---

## Códigos de retorno

- 200 OK → consultas exitosas  
- 201 Created → creación de recursos (registro, pujas, objetos)  
- 204 No Content → eliminación o acciones sin respuesta  
- 400 Bad Request → datos inválidos  
- 401 Unauthorized → sin token o inválido  
- 403 Forbidden → sin permisos (categoría insuficiente)  
- 404 Not Found → recurso inexistente  
- 409 Conflict → conflicto de negocio (ej: puja inválida)  
- 422 Unprocessable Content → validaciones fallidas  
- 429 Too Many Requests → rate limiting  
- 500 Internal Server Error → error general  

---

## Seguridad global

- **bearerAuth:** HTTP Bearer, formato JWT (`components.securitySchemes.bearerAuth`).
