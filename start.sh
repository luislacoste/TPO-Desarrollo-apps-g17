#!/usr/bin/env bash
# Levanta la app de SubastAR (frontend + backend si existe).
# Uso: ./start.sh

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
command -v npm  >/dev/null 2>&1 || { err "npm no está disponible";  exit 1; }

# Limpiar procesos hijos al salir (Ctrl-C, kill, etc.)
PIDS=()
cleanup() {
  log "Cerrando procesos..."
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
}
trap cleanup EXIT INT TERM

# ─── Frontend ──────────────────────────────────────────────────────────────
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
  log "Frontend: instalando dependencias si hace falta..."
  pushd frontend >/dev/null

  if [ ! -d "node_modules" ]; then
    npm install
  fi

  log "Frontend: arrancando Next.js dev en http://localhost:3000"
  npm run dev &
  PIDS+=($!)
  popd >/dev/null
else
  warn "No se encontró frontend/package.json — salto frontend."
fi

# ─── Backend ───────────────────────────────────────────────────────────────
if [ -d "backend" ] && [ -f "backend/package.json" ]; then
  log "Backend: instalando dependencias si hace falta..."
  pushd backend >/dev/null

  if [ ! -d "node_modules" ]; then
    npm install
  fi

  if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    warn "backend/.env no existe. Copiá .env.example y completá las variables (DB_*, JWT_SECRET, etc.) antes de poder operar contra la DB."
  fi

  if npm run | grep -q "  dev"; then
    log "Backend: arrancando dev server en http://localhost:${PORT:-3000}"
    npm run dev &
    PIDS+=($!)
  else
    warn "Backend no tiene script 'dev' en package.json — salto backend."
  fi

  popd >/dev/null
else
  warn "backend/package.json todavía no existe — solo se levanta el frontend. (cuando se inicialice el backend, este script lo va a tomar automáticamente)"
fi

if [ "${#PIDS[@]}" -eq 0 ]; then
  err "No se levantó ningún servicio."
  exit 1
fi

log "Servicios corriendo. Ctrl-C para cortar."
wait
