#!/usr/bin/env bash
# Levanta la app de SubastAR (frontend + backend).
# Uso: ./start.sh
#
# En el primer arranque:
#   - crea backend/.env con el usuario de Postgres del sistema
#   - levanta PostgreSQL si está caído (requiere Homebrew)
#   - crea la base de datos si no existe
#   - instala node_modules si no están

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

log()  { printf "${GREEN}==>${RESET} %s\n" "$*"; }
warn() { printf "${YELLOW}!!  %s${RESET}\n" "$*"; }
err()  { printf "${RED}xx  %s${RESET}\n" "$*"; }

command -v node >/dev/null 2>&1 || { err "Node no está instalado. Instalá Node 20+ desde https://nodejs.org"; exit 1; }
command -v npm  >/dev/null 2>&1 || { err "npm no está disponible"; exit 1; }

# Limpiar procesos hijos al salir (Ctrl-C, kill, etc.)
PIDS=()
cleanup() {
  log "Cerrando procesos..."
  for pid in "${PIDS[@]:-}"; do
    kill -0 "$pid" 2>/dev/null && kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT INT TERM

# ─── PostgreSQL ────────────────────────────────────────────────────────────────

ensure_postgres() {
  # 1. Detectar si PostgreSQL ya responde
  if pg_isready -q 2>/dev/null; then
    return 0
  fi

  # 2. Intentar levantar via brew services
  if command -v brew >/dev/null 2>&1; then
    local svc
    svc=$(brew services list 2>/dev/null | awk '/^postgresql/ {print $1; exit}')
    if [ -n "$svc" ]; then
      log "PostgreSQL ($svc) detenido — iniciando con brew services..."
      brew services start "$svc" >/dev/null
      # Esperar hasta 10 s a que levante
      local i=0
      while ! pg_isready -q 2>/dev/null && [ $i -lt 10 ]; do
        sleep 1; i=$((i+1))
      done
    fi
  fi

  if ! pg_isready -q 2>/dev/null; then
    err "No se pudo conectar a PostgreSQL. Inicialo manualmente y volvé a correr ./start.sh"
    exit 1
  fi
}

detect_pg_user() {
  # En macOS con Homebrew el usuario de Postgres suele ser el usuario del sistema
  local sys_user
  sys_user="$(whoami)"
  if psql -U "$sys_user" -l -q 2>/dev/null | grep -q "template1"; then
    echo "$sys_user"
  elif psql -U postgres -l -q 2>/dev/null | grep -q "template1"; then
    echo "postgres"
  else
    # Devolver el usuario del sistema como mejor intento
    echo "$sys_user"
  fi
}

setup_backend_env() {
  local env_file="$ROOT/backend/.env"
  [ -f "$env_file" ] && return 0

  log "backend/.env no existe — creando con valores por defecto para el entorno local..."

  ensure_postgres
  local pg_user
  pg_user="$(detect_pg_user)"
  log "Usuario de PostgreSQL detectado: $pg_user"

  cat > "$env_file" <<EOF
# Server
PORT=4000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=subastar
DB_USER=$pg_user
DB_PASSWORD=
DB_POOL_MAX=10

# JWT
JWT_SECRET=dev-secret-change-in-prod
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=5

# Fines (multas)
FINE_PERCENTAGE=10
FINE_DEADLINE_HOURS=72
EOF
  log "backend/.env creado (DB_USER=$pg_user). Editalo si necesitás cambiar la contraseña."
}

ensure_database() {
  # Leer DB_NAME y DB_USER del .env
  local db_name db_user
  db_name="$(grep -E '^DB_NAME=' "$ROOT/backend/.env" | cut -d= -f2 | tr -d ' \r')"
  db_user="$(grep -E '^DB_USER=' "$ROOT/backend/.env" | cut -d= -f2 | tr -d ' \r')"
  db_name="${db_name:-subastar}"
  db_user="${db_user:-$(whoami)}"

  if psql -U "$db_user" -lqt 2>/dev/null | cut -d\| -f1 | grep -qw "$db_name"; then
    return 0
  fi

  log "Base de datos '$db_name' no existe — creando..."
  createdb -U "$db_user" "$db_name" && log "Base de datos '$db_name' creada."
}

# ─── Frontend ──────────────────────────────────────────────────────────────────
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
  log "Frontend: instalando dependencias si hace falta..."
  pushd frontend >/dev/null
  [ ! -d "node_modules" ] && npm install
  log "Frontend: arrancando Next.js dev en http://localhost:3000"
  npm run dev &
  PIDS+=($!)
  popd >/dev/null
else
  warn "No se encontró frontend/package.json — salto frontend."
fi

# ─── Backend ───────────────────────────────────────────────────────────────────
if [ -d "backend" ] && [ -f "backend/package.json" ]; then
  setup_backend_env
  ensure_postgres
  ensure_database

  log "Backend: instalando dependencias si hace falta..."
  pushd backend >/dev/null
  [ ! -d "node_modules" ] && npm install

  log "Backend: arrancando dev server en http://localhost:4000"
  npm run dev &
  PIDS+=($!)
  popd >/dev/null
else
  warn "backend/package.json no existe — salto backend."
fi

if [ "${#PIDS[@]}" -eq 0 ]; then
  err "No se levantó ningún servicio."
  exit 1
fi

log "Servicios corriendo. Ctrl-C para cortar."
wait
