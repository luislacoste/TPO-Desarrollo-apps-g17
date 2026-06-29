# Guía de scripts `.sh`

Referencia de todos los scripts de shell del repo: qué hace cada uno, cómo
se usa y qué flags (`--`) o variables de entorno acepta.

> Todos viven en la raíz del proyecto. Ejecutalos desde ahí: `./nombre.sh`.

## Resumen rápido

| Script | Para qué | Flags | Variables de entorno |
|--------|----------|-------|----------------------|
| `start.sh` | Levanta backend (+ frontend si existe) en local | `--reset` | — |
| `start-mobile.sh` | Levanta la app mobile (Expo) | — | — |
| `start-swagger.sh` | Levanta Swagger UI (Docker) | — | — |
| `test-all.sh` | Tests pass/fail de toda la API | `--reset` | — |
| `test-app.sh` | Recorrido exploratorio que muestra respuestas | `--write`, `--full`, `-h`/`--help` | `API_URL`, `EMAIL`, `PASSWORD`, `BIDS` |

---

## `start.sh`

**Qué hace:** levanta la app completa en local. En el primer arranque deja todo listo solo:

- Crea `backend/.env` si no existe (detecta el usuario de PostgreSQL del sistema; `PORT=4000`, `DB_PORT=5432`).
- Asegura que **PostgreSQL** esté levantado (lo arranca con Homebrew si está caído) y **crea la base de datos** si no existe.
- Instala `node_modules` donde falten.
- Arranca el **backend** (dev server en `http://localhost:4000`).
- Arranca el **frontend** Next.js en `http://localhost:3000` **sólo si existe `frontend/package.json`** (si no, lo saltea con un aviso).
- `Ctrl-C` corta todos los procesos hijos (tiene `trap` de limpieza).

**Uso:**
```bash
./start.sh           # arranca normalmente
./start.sh --reset   # wipe DB + re-aplica schema + seeds, luego arranca
```

**Flags:**
- `--reset` → `npm run db:reset` (re-aplica el schema) + `npm run seed:admin` antes de arrancar. Útil para empezar de cero.

**Pre-requisitos:** Node 20+, npm, PostgreSQL (en macOS se gestiona vía Homebrew).

**Notas:**
- Por defecto sólo seedea el **admin** (`admin@subastar.local` / `admin123`). Para datos de ejemplo más ricos: `cd backend && npm run seed:demo`.
- Puertos: backend `4000`, frontend `3000` (si aplica).

---

## `start-mobile.sh`

**Qué hace:** levanta la app **mobile** (Expo).

- Verifica que `node`/`npm` estén instalados y que exista `mobile/package.json`.
- Instala dependencias si falta `node_modules`.
- Corre `npx expo start -c` (el `-c` limpia la caché de Metro en cada arranque).

**Uso:**
```bash
./start-mobile.sh
```

**Flags:** ninguno.

**Pre-requisitos:**
- Node instalado.
- Backend corriendo (`./start.sh`).
- **Expo Go** instalado en el celular (https://expo.dev/go).
- Celular y compu en la **misma red WiFi** (la app infiere el host automáticamente).

---

## `start-swagger.sh`

**Qué hace:** levanta **Swagger UI** en Docker para explorar la documentación de la API.

- Corre el contenedor `swaggerapi/swagger-ui` en el puerto `8080`.
- Sirve `documentacion/swagger.yml` (monta el repo como `/app`).

**Uso:**
```bash
./start-swagger.sh
# luego abrir http://localhost:8080
```

**Flags:** ninguno.

**Pre-requisitos:** Docker instalado y corriendo.

---

## `test-all.sh`

**Qué hace:** ejecuta **todos** los endpoints REST + WebSocket del backend y reporta **pass / fail** con un total al final. Recorre el flujo completo: health, registro en 3 pasos, login, aprobación por admin, medios de pago, crear subasta, pujas, etc.

- No usa `set -e`: si un test falla, sigue y cuenta el fallo.
- Chequea status codes y algunos campos clave (no valida shapes JSON exhaustivos).

**Uso:**
```bash
./test-all.sh           # asume backend ya corriendo
./test-all.sh --reset   # primero wipe DB + seed admin + seed test
```

**Flags:**
- `--reset` → `db:reset` + `seed:admin` + `seed:test` antes de correr los tests.

**Pre-requisitos:**
- Backend levantado en `http://localhost:4000` (`npm run dev` o `./start.sh`).
- `jq` instalado (`brew install jq`).
- `psql` en el `PATH` (para `--reset` y algunas operaciones admin).
- `backend/.env` con las variables `DB_*` y `JWT_*`.

**Notas:** el `API` está fijo en `http://localhost:4000/v1` (editable en el script).

---

## `test-app.sh`

**Qué hace:** recorrido **exploratorio** de la API. A diferencia de `test-all.sh` (pass/fail), este "usa" la app: llama a los endpoints y **muestra las respuestas** para ver los datos reales que consume el mobile.

- Chequea `/health` primero; si el backend está caído, avisa cómo levantarlo y sale.
- **Descubre IDs reales** (una subasta y un ítem de su catálogo), así se adapta a los datos que tengas.
- Agrupa el recorrido en secciones: **1) Público** (sin token), **2) Login**, **3) Usuario**, **4) Admin**, **5) Acciones** (sólo con `--write`).
- Status code coloreado (verde 2xx / amarillo 4xx / rojo 5xx). Con `jq` muestra JSON formateado y trunca arrays largos (total + primeros 3).

**Uso:**
```bash
./test-app.sh                 # recorrido de sólo lectura
./test-app.sh --write         # + acciones (ver abajo)
./test-app.sh --full          # no trunca los arrays largos
BIDS=8 ./test-app.sh --write  # define cuántas pujas escalonadas hacer
API_URL=http://192.168.0.10:4000/v1 ./test-app.sh   # apuntar a otro host
EMAIL=otro@mail PASSWORD=xxx ./test-app.sh           # usar otro usuario
```

**Flags:**
- `--write` → ejecuta acciones que **modifican datos**:
  1. **Verifica un medio de pago**: si el usuario no tiene uno verificado, crea una cuenta bancaria y la verifica (vía endpoint admin) — requisito para poder pujar.
  2. Se une a la subasta (`join`).
  3. **Guerra de pujas**: N pujas escalonadas sobre un ítem, respetando el mínimo (+1% de la base) y el tope (+20%) del backend.
  4. Pujas de apertura sobre otros ítems del catálogo.
  5. Estado final (mejor oferta, todas las pujas, mis pujas) + favoritos + settings.
- `--full` → no trunca arrays (muestra la respuesta completa).
- `-h` / `--help` → muestra la cabecera de ayuda.

**Variables de entorno:**
- `API_URL` — base de la API (default `http://localhost:4000/v1`).
- `EMAIL` / `PASSWORD` — credenciales de login (default `admin@subastar.local` / `admin123`).
- `BIDS` — cantidad de pujas escalonadas en la guerra de pujas (default `5`).

**Pre-requisitos:**
- Backend corriendo (`./start.sh`).
- `jq` recomendado (sin él muestra JSON crudo y omite el descubrimiento de IDs y la auto-verificación).
- Para datos más ricos: `cd backend && npm run seed:demo`.

**Notas:**
- Como sólo existe el login `admin` por defecto, las acciones se hacen desde esa cuenta. La auto-verificación del medio de pago (paso 1 de `--write`) requiere rol admin.
- No aborta ante errores: las respuestas 4xx se muestran como información útil del flujo real.
