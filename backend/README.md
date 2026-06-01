# Backend — SubastAR (Node + Express + TypeScript)

API REST + WebSocket que implementa el contrato definido en `documentacion/swagger.yml`.

## Estructura

```
backend/
├── src/
│   ├── server.ts              # Punto de entrada (Express + WS)
│   ├── config/                # env loader, db, cors, jwt
│   ├── middleware/            # auth (JWT), requireRole('admin'), errorHandler, validate (zod), upload (multer)
│   ├── modules/               # Un directorio por feature; cada uno expone routes/controller/service
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
│   ├── types/                 # tipos compartidos (puede re-exportar shared/types)
│   └── utils/                 # helpers (dates, ids, money)
│
├── prisma/                    # schema + migraciones (si usamos Prisma)
│   ├── schema.prisma
│   └── migrations/
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── uploads/                   # archivos subidos en dev (no commitear contenido)
└── .env.example
```

## Convención por módulo

Cada `modules/<feature>/` tiene:

- `<feature>.routes.ts` — define los endpoints y middlewares
- `<feature>.controller.ts` — parsea request, delega al service, arma response
- `<feature>.service.ts` — lógica de negocio (no toca req/res)
- `<feature>.schema.ts` *(opcional)* — validación zod
- `<feature>.types.ts` *(opcional)* — tipos específicos

## Bootstrap inicial

```bash
cd backend
npm init -y
npm i express cors helmet morgan jsonwebtoken bcryptjs zod
npm i -D typescript ts-node-dev @types/node @types/express @types/cors @types/morgan @types/jsonwebtoken @types/bcryptjs
npx tsc --init
# DB: Prisma (recomendado para sumarse a la estructura SQL existente en db/)
npm i prisma @prisma/client
npx prisma init
```
