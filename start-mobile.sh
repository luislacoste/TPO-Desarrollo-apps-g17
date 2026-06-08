#!/usr/bin/env bash
# Levanta la app mobile de SubastAR (Expo).
# Uso: ./start-mobile.sh
#
# Pre-requisitos:
#   - Node instalado
#   - Backend corriendo (./start.sh)
#   - Expo Go instalado en el celular (https://expo.dev/go)
#   - Celular y Mac en la misma red WiFi

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'
RED='\033[0;31m'
RESET='\033[0m'

log() { printf "${GREEN}==>${RESET} %s\n" "$*"; }
err() { printf "${RED}xx  %s${RESET}\n" "$*"; }

command -v node >/dev/null 2>&1 || { err "Node no está instalado."; exit 1; }
command -v npm  >/dev/null 2>&1 || { err "npm no está disponible."; exit 1; }

if [ ! -d "$ROOT/mobile" ] || [ ! -f "$ROOT/mobile/package.json" ]; then
  err "No se encontró mobile/package.json"
  exit 1
fi

cd "$ROOT/mobile"

if [ ! -d "node_modules" ]; then
  log "Instalando dependencias..."
  npm install
fi

log "Arrancando Expo — escaneá el QR con Expo Go en tu celular"
npm start
