# Estructura del backend — guía rápida

Documento de referencia interna del equipo. Explica qué hace cada carpeta del backend de SubastAR y cómo conviven entre sí. El backend está armado en **Node + Express + TypeScript** con **PostgreSQL** y queries SQL planas (sin ORM).

> Cuando dudes dónde meter un archivo nuevo, releé este doc.

---

## Árbol resumido

```
backend/
├── src/
│   ├── server.ts
│   ├── config/
│   ├── db/
│   ├── middleware/
│   ├── modules/
│   │   └── <feature>/
│   │       ├── <feature>.routes.ts
│   │       ├── <feature>.controller.ts
│   │       ├── <feature>.service.ts
│   │       └── <feature>.repository.ts
│   ├── routes/
│   ├── services/
│   ├── ws/
│   └── utils/
├── tests/
├── uploads/
└── .env.example
```

---

## Flujo de un request

Cuando llega un HTTP request a la API, atraviesa estas capas, en este orden:

```
Cliente (app RN)
   │
   ▼
server.ts                       ← arranca Express, monta /routes
   │
   ▼
middleware/                     ← logger, cors, auth (JWT), requireRole
   │
   ▼
modules/<feature>/<feature>.routes.ts
   │
   ▼
modules/<feature>/<feature>.controller.ts   ← parsea req, llama al service, arma res
   │
   ▼
modules/<feature>/<feature>.service.ts      ← reglas de negocio (no toca SQL ni req/res)
   │
   ▼
modules/<feature>/<feature>.repository.ts   ← queries SQL (única capa que toca la DB)
   │
   ▼
db/                                          ← pool de Postgres, query(), withTransaction()
   │
   ▼
PostgreSQL
```

La idea es **separar responsabilidades**: cada capa hace una sola cosa y se puede testear/cambiar sin tocar las otras.

---

## Carpetas top-level

### `src/server.ts`
Punto de entrada. Crea la app de Express, conecta middlewares globales, monta `src/routes/`, levanta el WebSocket de `src/ws/` y arranca el listener en el puerto del `.env`.

### `src/config/`
Carga y valida variables de entorno (`PORT`, `JWT_SECRET`, `DB_*`, `FINE_PERCENTAGE`, etc.), configuración de CORS, JWT y cualquier constante global que dependa del entorno. Toda otra carpeta lee desde acá, no de `process.env` directo.

### `src/db/`
Conexión a PostgreSQL. Exporta:

- `pool` — instancia compartida de `pg.Pool` configurada por las env `DB_*`.
- `query(text, params?)` — helper tipado para ejecutar queries simples.
- `withTransaction(fn)` — wrapper que abre BEGIN, ejecuta `fn(client)` y hace COMMIT (o ROLLBACK si algo tira error).

Solo los `*.repository.ts` deberían importar de acá. El resto del código consume datos a través de repositories.

### `src/middleware/`
Funciones que se enganchan en una ruta antes del controller. Casos típicos del proyecto:

- `auth.ts` — valida el JWT del header `Authorization` y carga `req.user`.
- `requireRole.ts` — `requireRole('admin')` corta con 403 los endpoints del tag Admin.
- `errorHandler.ts` — captura errores y los traduce a códigos HTTP del swagger (400/401/403/404/409/422).
- `upload.ts` — wrapper de `multer` para los endpoints multipart (registro de DNI, sell-request).

### `src/modules/<feature>/`
Una carpeta por feature del swagger (auth, users, auctions, bids, sell-requests, fines, payments, admin, etc.). Cada módulo es **autosuficiente**: incluye sus rutas, su lógica y sus queries. La regla es que un módulo conoce su negocio y los services de otros módulos, pero **nunca** lee directamente las tablas de otro módulo.

Dentro de cada módulo hay convención fija:

| Archivo | Qué hace | Toca... |
|---|---|---|
| `<feature>.routes.ts` | Declara los endpoints (`router.post(...)`) y conecta middlewares. | Express, controller |
| `<feature>.controller.ts` | Lee `req`, llama al service, arma `res`. **Nada de negocio acá.** | service |
| `<feature>.service.ts` | Reglas de negocio. Decide qué pasa cuando se aprueba un usuario, se aplica una multa, etc. | repository, otros services, utils |
| `<feature>.repository.ts` | **Todas** las queries SQL del módulo. Devuelve datos planos (rows). | `src/db/` |

#### Módulos previstos según el swagger

- `auth` — login, registro multi-paso, refresh, forgot.
- `users` — `/users/me`, métricas, categoría.
- `categories` — catálogo de categorías de usuario.
- `auctions` — listado, detalle, join, stream.
- `items` — ítems de subasta, galería, historial.
- `bids` — pujas, mis pujas, ganadas.
- `sell-requests` — alta, accept/reject, motivo de rechazo, costo de devolución.
- `payment-methods` — credit-card, bank-account, certified-check (sin restricción de categoría).
- `payments` — pendientes, detalle, pagar, facturas.
- `fines` — listado, detalle, pago (multas 10% / 72hs).
- `notifications` — listado, marcar leída, settings.
- `favorites` — agregar/quitar.
- `metrics` — métricas de usuario.
- `admin` — endpoints internos: aprobar/rechazar usuarios, asignar categoría, cambiar admisión, aplicar/condonar multas, bloquear/desbloquear participación.

### `src/routes/`
Un `index.ts` que importa los `routes.ts` de todos los módulos y los monta bajo el prefijo `/v1`. La idea es que `server.ts` solo haga `app.use('/v1', routes)` y todo lo demás viva acá.

### `src/services/`
Servicios **cross-cutting**: cosas que usan varios módulos. Por ejemplo:

- `mail.ts` — mandar mails (verificación, recupero, notificaciones).
- `storage.ts` — guardar/leer archivos en `uploads/`.
- `hash.ts` — bcrypt.
- `jwt.ts` — firmar / verificar tokens.
- `websocket.ts` — broadcast a clientes conectados.

Si un service es específico de **un solo módulo** (ej. lógica de cálculo de multa), va dentro del módulo, no acá.

### `src/ws/`
Handlers del WebSocket de subastas en vivo (`wss://api.subastar.com/ws/auction/{auctionId}`). Acá se manejan los eventos `bid_placed`, `bid_accepted`, `item_sold`, `auction_ended`, `item_changed` definidos en el swagger.

### `src/utils/`
Helpers chiquitos y puros: formateo de fechas, cálculo de montos, generación de IDs, etc. No deben importar `db`, `services` ni nada con efectos.

### `tests/unit/` y `tests/integration/`
- **unit** — testea services y utils con todo mockeado.
- **integration** — levanta la app + DB de test y prueba endpoints completos.

### `uploads/`
Carpeta donde el backend guarda los archivos subidos por usuarios en desarrollo (DNI frente/dorso, fotos de productos, declaración de titularidad). El contenido está ignorado por git; solo se versiona el `.gitkeep`.

### `.env.example`
Plantilla de variables de entorno. Cada dev hace `cp .env.example .env` y completa los valores reales. **Nunca commitear `.env`** (ya está en `.gitignore`).

---

## Ejemplo concreto: `POST /fines/{id}/pay`

Para entender cómo se conecta todo, sigamos el flujo del endpoint que regulariza una multa.

### 1. `fines.routes.ts`
```ts
router.post(
  '/fines/:id/pay',
  auth,                                  // middleware: valida JWT
  finesController.pay,
);
```

### 2. `fines.controller.ts`
```ts
export async function pay(req, res, next) {
  try {
    const fine = await finesService.payFine({
      fineId: req.params.id,
      userId: req.user.id,
      paymentMethodId: req.body.paymentMethodId,
    });
    res.json(fine);
  } catch (err) { next(err); }
}
```

### 3. `fines.service.ts`
```ts
export async function payFine({ fineId, userId, paymentMethodId }) {
  const fine = await finesRepo.findById(fineId, userId);
  if (!fine) throw new NotFound();
  if (fine.status === 'overdue') throw new Conflict('La multa ya está vencida');
  if (fine.status !== 'pending') throw new Conflict('La multa no admite pago');

  return withTransaction(async (client) => {
    const updated = await finesRepo.markPaid(client, fineId);
    await usersRepo.unblockParticipation(client, userId);
    return updated;
  });
}
```

### 4. `fines.repository.ts`
```ts
export async function findById(id, userId) {
  const { rows } = await query(
    'SELECT * FROM fines WHERE id = $1 AND user_id = $2',
    [id, userId],
  );
  return rows[0] ?? null;
}

export async function markPaid(client, id) {
  const { rows } = await client.query(
    `UPDATE fines
       SET status = 'paid', paid_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id],
  );
  return rows[0];
}
```

Cada capa solo conoce a la siguiente. Si mañana cambia el motor o querés agregar caché, lo tocás en un solo lugar.

---

## Reglas que no se rompen

- **El SQL vive solo en `*.repository.ts`.** Controllers y services no escriben queries.
- **Los controllers no tienen reglas de negocio.** Si vas a poner un `if` que decide algo de negocio (estados, montos, permisos más allá del rol), va al service.
- **Los services no tocan `req`/`res`.** Reciben datos y devuelven datos. Eso los hace testeables sin Express.
- **Validación de input al inicio del controller** (campos obligatorios, tipos, rangos). Si falta algo, tirar un error y dejar que `errorHandler` lo traduzca a 400/422.
- **Errores de negocio** se tiran como clases (`new NotFound()`, `new Conflict('...')`) y los traduce `errorHandler` a códigos HTTP. No `res.status(409).json(...)` desde el service.
- **Una transacción por operación que toca múltiples tablas** (ej. pagar multa y desbloquear usuario). Usar `withTransaction` de `src/db/`.
- **Nunca commitear `.env`** ni archivos de `backend/uploads/`.
