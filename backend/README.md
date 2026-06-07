# Backend — SubastAR (Node + Express + TypeScript)

API REST + WebSocket que implementa el contrato definido en `documentacion/swagger.yml`. **Base de datos: PostgreSQL**, queries SQL planas con el driver `pg` (sin ORM).

## Estructura

```
backend/
├── src/
│   ├── server.ts              # Punto de entrada (Express + WS)
│   ├── config/                # env loader, cors, jwt
│   ├── db/                    # Pool de PostgreSQL (`pool.ts`) + helpers `query` y `withTransaction` (`index.ts`)
│   ├── middleware/            # auth (JWT), requireRole('admin'), errorHandler, upload (multer)
│   ├── modules/               # Un directorio por feature; cada uno expone routes/controller/service/repository
│   │   ├── auth/              # login, register (3 pasos), refresh, forgot
│   │   ├── users/             # GET/PUT /users/me, métricas, categoría
│   │   ├── categories/        # catálogo de categorías
│   │   ├── auctions/          # listado, detalle, join, stream
│   │   ├── items/             # ítems de subasta, galería, historial
│   │   ├── bids/              # POST /bids, listados, mis pujas/ganadas
│   │   ├── sell-requests/     # alta + accept/reject + rejection-reason + return-cost
│   │   ├── payment-methods/   # credit-card, bank-account, certified-check (sin restricción de categoría)
│   │   ├── payments/          # pendientes, detalle, pagar, facturas
│   │   ├── fines/             # GET /fines, /fines/{id}, /fines/{id}/pay
│   │   ├── notifications/     # listado, marcar leída, settings
│   │   ├── favorites/         # GET/POST/DELETE
│   │   ├── metrics/           # /metrics/user/{id}
│   │   └── admin/             # users approve/reject/category/admission, fines, block-participation
│   ├── routes/                # index que monta cada modules/*/routes en /v1
│   ├── services/              # cross-cutting: mail, storage, hashing, ws
│   ├── ws/                    # handlers WebSocket (subastas en vivo)
│   └── utils/                 # helpers (dates, ids, money)
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── uploads/                   # archivos subidos en dev (no commitear contenido)
└── .env.example
```

El schema y migraciones SQL van en `../db/` (raíz del repo), no acá adentro.

## Convención por módulo

Cada `modules/<feature>/` tiene:

- `<feature>.routes.ts` — define los endpoints y middlewares
- `<feature>.controller.ts` — parsea request, delega al service, arma response
- `<feature>.service.ts` — lógica de negocio (no toca req/res, no escribe SQL)
- `<feature>.repository.ts` — **todas las queries SQL del módulo**; recibe el pool de `src/db/` y devuelve datos planos

Las queries SQL viven sólo dentro de los `*.repository.ts`. Ni controllers ni services tocan SQL directamente.

## Bootstrap inicial

```bash
cd backend
npm init -y
npm i express cors helmet morgan jsonwebtoken bcryptjs dotenv
npm i -D typescript ts-node-dev @types/node @types/express @types/cors @types/morgan @types/jsonwebtoken @types/bcryptjs
npx tsc --init

# Driver de DB (PostgreSQL):
npm i pg
npm i -D @types/pg
```
