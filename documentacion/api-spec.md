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
| PUT | `/sell/my-requests/{id}/accept` | Bearer | Aceptar condiciones de venta |

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

---

## Esquemas (`components.schemas`)

| Nombre | Uso breve |
|--------|-----------|
| `UserCategory` | `comun` \| `especial` \| `plata` \| `oro` \| `platino` |
| `User` | Perfil base |
| `UserMetrics` | Subastas, pujas, gasto, rating, etc. |
| `Category` | Categoría con beneficios y requisitos |
| `PaymentMethod` | `credit_card` \| `bank_account` \| `certified_check` |
| `Auction` / `AuctionDetail` | Subasta y detalle ampliado |
| `Item` / `ItemDetail` | Ítem en catálogo y detalle |
| `Bid` | Puja con estado |
| `SellRequest` / `SellRequestDetail` | Solicitud de venta |
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
