#!/usr/bin/env bash
# =====================================================================
# test-all.sh — ejecuta todos los endpoints REST + WebSocket del backend
# de SubastAR y reporta pass / fail.
#
# Uso:
#   ./test-all.sh           # corre los tests (asume backend ya corriendo)
#   ./test-all.sh --reset   # primero WIPE de DB + seed admin + seed test
#
# Pre-requisitos:
#   - Backend levantado en http://localhost:4000 (npm run dev)
#   - jq instalado (brew install jq)
#   - psql en PATH (para --reset y test 5 si el medio de pago lo necesita)
#   - backend/.env con DB_* y JWT_*
#
# El script NO valida shapes JSON exhaustivos — chequea status codes
# y un par de campos clave. Si un test falla pero el siguiente puede
# correr igual, el script sigue (no aborta) y al final reporta el total.
# =====================================================================

# IMPORTANTE: no usamos `set -e` para poder seguir contando fallos.
set -uo pipefail

API="http://localhost:4000/v1"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"

# Colores
G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'; B='\033[0;34m'; N='\033[0m'

PASS=0
FAIL=0
FAILS=()

step()  { printf "\n${B}→ %s${N}\n" "$*"; }
note()  { printf "  ${Y}!${N} %s\n" "$*"; }

# Verifica que el status code real coincida con el esperado.
# Args: <label> <expected-status> <actual-status> [extra-info]
assert_status() {
  local label="$1" expected="$2" actual="$3" extra="${4:-}"
  if [ "$actual" = "$expected" ]; then
    printf "  ${G}✓${N} %s (%s)\n" "$label" "$actual"
    PASS=$((PASS + 1))
  else
    printf "  ${R}✗${N} %s (esperado %s, obtuvo %s) %s\n" "$label" "$expected" "$actual" "$extra"
    FAILS+=("$label — esperado $expected, obtuvo $actual")
    FAIL=$((FAIL + 1))
  fi
}

# Hace un curl y devuelve "BODY|STATUS" para parsear las dos cosas.
curl_capture() {
  curl -s -w "|%{http_code}" "$@"
}

split_body() { echo "${1%|*}"; }
split_code() { echo "${1##*|}"; }

# ─── Pre-checks ──────────────────────────────────────────────────────
step "Pre-checks"
command -v curl >/dev/null || { echo "Falta curl"; exit 1; }
command -v jq   >/dev/null || { echo "Falta jq (brew install jq)"; exit 1; }

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API/health" || echo "000")
if [ "$CODE" = "000" ]; then
  echo "  ${R}✗${N} backend no responde en $API. Levantalo con: cd backend && npm run dev"
  exit 1
fi
printf "  ${G}✓${N} backend responde\n"

# ─── Reset opcional ─────────────────────────────────────────────────
if [ "${1:-}" = "--reset" ]; then
  step "--reset: db:reset + seed:admin + seed:test"
  (cd "$BACKEND" && npm run db:reset --silent)   || { echo "db:reset falló"; exit 1; }
  (cd "$BACKEND" && npm run seed:admin --silent) || { echo "seed:admin falló"; exit 1; }
fi

# Siempre corremos seed:test (idempotente) para asegurarnos de tener
# subasta + ítem demo.
step "Cargando datos de prueba (seed:test)"
SEED_OUTPUT=$(cd "$BACKEND" && npm run seed:test --silent 2>/dev/null | tail -1)
echo "  $SEED_OUTPUT"
SUBASTA_ID=$(echo "$SEED_OUTPUT" | jq -r '.subastaId // empty' 2>/dev/null || echo "")
ITEM_ID=$(echo "$SEED_OUTPUT"    | jq -r '.itemId    // empty' 2>/dev/null || echo "")
if [ -z "$SUBASTA_ID" ] || [ -z "$ITEM_ID" ]; then
  echo "${R}✗${N} no se pudo obtener subastaId / itemId del seed:test"
  exit 1
fi
echo "  subastaId=$SUBASTA_ID  itemId=$ITEM_ID"

# Cargar .env para psql (la usamos en algunas operaciones admin que
# todavía no tienen endpoint, como verificar medios de pago).
if [ -f "$BACKEND/.env" ]; then
  set -a; source "$BACKEND/.env"; set +a
fi
export PGHOST="${DB_HOST:-localhost}"
export PGPORT="${DB_PORT:-5432}"
export PGDATABASE="${DB_NAME:-subastar}"
export PGUSER="${DB_USER:-postgres}"
export PGPASSWORD="${DB_PASSWORD:-postgres}"

psql_run() { psql -v ON_ERROR_STOP=1 -q -c "$1"; }

# Email único por corrida para no chocar con runs anteriores.
EMAIL="ana+$(date +%s)@example.com"
DOCUMENTO="$(date +%s | tail -c 9)"

# =====================================================================
# 1. HEALTH
# =====================================================================
step "1. Health"
RES=$(curl_capture "$API/health")
assert_status "GET /health" 200 "$(split_code "$RES")"

# =====================================================================
# 2. AUTH: registro 3 pasos
# =====================================================================
step "2. Auth — registro 3 pasos"

# 2.1 register
RES=$(curl_capture -X POST "$API/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{
    \"email\": \"$EMAIL\",
    \"firstName\": \"Ana\",
    \"lastName\": \"Pérez\",
    \"domicilio\": \"Av. Siempreviva 742\",
    \"pais\": \"Argentina\",
    \"documento\": \"$DOCUMENTO\"
  }")
assert_status "POST /auth/register" 201 "$(split_code "$RES")"
USER_ID=$(split_body "$RES" | jq -r '.userId // empty')
[ -n "$USER_ID" ] && printf "    userId=%s\n" "$USER_ID"

# 2.2 register/document — necesita archivos placeholder
printf '%%PDF-1.4\n%%EOF\n' > /tmp/subastar_front.pdf
printf '%%PDF-1.4\n%%EOF\n' > /tmp/subastar_back.pdf
RES=$(curl_capture -X POST "$API/auth/register/document" \
  -F "userId=$USER_ID" \
  -F "documentFront=@/tmp/subastar_front.pdf" \
  -F "documentBack=@/tmp/subastar_back.pdf")
assert_status "POST /auth/register/document" 200 "$(split_code "$RES")"

# 2.3 register/complete
RES=$(curl_capture -X POST "$API/auth/register/complete" \
  -H 'Content-Type: application/json' \
  -d "{ \"userId\": $USER_ID, \"password\": \"secret123\" }")
assert_status "POST /auth/register/complete" 200 "$(split_code "$RES")"

# =====================================================================
# 3. LOGIN (user todavía pending)
# =====================================================================
step "3. Login"
RES=$(curl_capture -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{ \"email\": \"$EMAIL\", \"password\": \"secret123\" }")
assert_status "POST /auth/login (user)" 200 "$(split_code "$RES")"
USER_TOKEN=$(split_body "$RES" | jq -r '.accessToken // empty')
REFRESH=$(split_body "$RES" | jq -r '.refreshToken // empty')

RES=$(curl_capture "$API/users/me" -H "Authorization: Bearer $USER_TOKEN")
assert_status "GET /users/me (pending)" 200 "$(split_code "$RES")"
ADMSTATUS=$(split_body "$RES" | jq -r '.admissionStatus')
[ "$ADMSTATUS" = "pending" ] || note "admissionStatus esperado 'pending', obtuvo '$ADMSTATUS'"

# =====================================================================
# 4. ADMIN — login + aprobar usuario
# =====================================================================
step "4. Admin login + aprobar"
RES=$(curl_capture -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{ "email": "admin@subastar.local", "password": "admin123" }')
assert_status "POST /auth/login (admin)" 200 "$(split_code "$RES")"
ADMIN_TOKEN=$(split_body "$RES" | jq -r '.accessToken // empty')

RES=$(curl_capture "$API/admin/users?admissionStatus=pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
assert_status "GET /admin/users?admissionStatus=pending" 200 "$(split_code "$RES")"

RES=$(curl_capture -X POST "$API/admin/users/$USER_ID/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "category": "plata", "notes": "test-all" }')
assert_status "POST /admin/users/:id/approve" 200 "$(split_code "$RES")"
CAT=$(split_body "$RES" | jq -r '.category')
[ "$CAT" = "plata" ] || note "category esperado 'plata', obtuvo '$CAT'"

# =====================================================================
# 5. Payment methods + verificación
# =====================================================================
step "5. Payment methods"

RES=$(curl_capture -X POST "$API/payment-methods/credit-card" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "number": "4111111111111111",
    "brand": "Visa",
    "holder": "Ana Pérez",
    "expMonth": 12,
    "expYear": 2030
  }')
assert_status "POST /payment-methods/credit-card" 201 "$(split_code "$RES")"
MEDIO_ID=$(split_body "$RES" | jq -r '.id')

RES=$(curl_capture -X POST "$API/payment-methods/bank-account" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "bankName": "Galicia",
    "cbu": "0070123456789012345678",
    "holder": "Ana Pérez"
  }')
assert_status "POST /payment-methods/bank-account" 201 "$(split_code "$RES")"

RES=$(curl_capture -X POST "$API/payment-methods/certified-check" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "checkNumber": "CHK-001",
    "bankName": "Santander",
    "amount": 50000,
    "currency": "ARS"
  }')
assert_status "POST /payment-methods/certified-check" 201 "$(split_code "$RES")"

RES=$(curl_capture "$API/payment-methods" -H "Authorization: Bearer $USER_TOKEN")
assert_status "GET /payment-methods" 200 "$(split_code "$RES")"

RES=$(curl_capture "$API/payment-methods/$MEDIO_ID/status" \
  -H "Authorization: Bearer $USER_TOKEN")
assert_status "GET /payment-methods/:id/status" 200 "$(split_code "$RES")"

# Verificar el medio (no hay endpoint admin → SQL directo)
note "Verificando medio de pago $MEDIO_ID vía psql"
psql_run "UPDATE medios_pago SET verificado = TRUE WHERE identificador = $MEDIO_ID;" \
  >/dev/null 2>&1 || note "psql falló: chequeá DB_* en backend/.env"

# =====================================================================
# 6. Crear subasta (admin) + browsing público
# =====================================================================
step "6. Crear subasta (admin)"

RES=$(curl_capture -X POST "$API/auctions" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "fecha": "2026-12-01",
    "hora": "15:00",
    "estado": "abierta",
    "ubicacion": "Salón Test",
    "categoria": "bronce",
    "moneda": "ARS"
  }')
assert_status "POST /auctions (admin)" 201 "$(split_code "$RES")"
NEW_SUBASTA_ID=$(split_body "$RES" | jq -r '.id')

RES=$(curl_capture -X POST "$API/auctions" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"fecha":"2026-12-02","hora":"10:00"}')
assert_status "POST /auctions (user) → 403" 403 "$(split_code "$RES")"

step "6b. Browsing público"

for path in /categories /categories/plata \
            /auctions /auctions/active /auctions/upcoming \
            "/auctions/$SUBASTA_ID" "/auctions/$SUBASTA_ID/catalog" \
            "/items?auctionId=$SUBASTA_ID" "/items/$ITEM_ID" \
            "/items/$ITEM_ID/images" "/items/$ITEM_ID/history"; do
  RES=$(curl_capture "$API$path")
  assert_status "GET $path" 200 "$(split_code "$RES")"
done

# Item sin token: precio base oculto
RES=$(curl_capture "$API/items/$ITEM_ID")
PRECIO=$(split_body "$RES" | jq -r '.precio_base')
[ "$PRECIO" = "null" ] && printf "  ${G}✓${N} precio_base oculto sin token\n" && PASS=$((PASS+1)) \
  || { printf "  ${R}✗${N} precio_base debería estar oculto sin token (got %s)\n" "$PRECIO"; FAIL=$((FAIL+1)); }

# Item con token: precio base visible
RES=$(curl_capture "$API/items/$ITEM_ID" -H "Authorization: Bearer $USER_TOKEN")
PRECIO=$(split_body "$RES" | jq -r '.precio_base')
[ "$PRECIO" != "null" ] && printf "  ${G}✓${N} precio_base visible con token (=%s)\n" "$PRECIO" && PASS=$((PASS+1)) \
  || { printf "  ${R}✗${N} precio_base debería estar visible con token\n"; FAIL=$((FAIL+1)); }

# =====================================================================
# 7. Subasta en vivo: join + bid
# =====================================================================
step "7. Subasta en vivo"

RES=$(curl_capture -X POST "$API/auctions/$SUBASTA_ID/join" \
  -H "Authorization: Bearer $USER_TOKEN")
assert_status "POST /auctions/:id/join" 200 "$(split_code "$RES")"

RES=$(curl_capture "$API/auctions/$SUBASTA_ID/stream" \
  -H "Authorization: Bearer $USER_TOKEN")
assert_status "GET /auctions/:id/stream" 200 "$(split_code "$RES")"

# Sin pujas previas: el mínimo es el precio base (10000)
RES=$(curl_capture -X POST "$API/bids" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{ \"itemId\": $ITEM_ID, \"importe\": 10000 }")
assert_status "POST /bids (válida 10000)" 201 "$(split_code "$RES")"

# Reglas de monto: con oferta=10000, mínimo siguiente = 10000 + 1% base (100) = 10100
RES=$(curl_capture -X POST "$API/bids" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{ \"itemId\": $ITEM_ID, \"importe\": 10050 }")
assert_status "POST /bids (debajo del mínimo) → 422" 422 "$(split_code "$RES")"

# Sobre el máximo: 10000 + 20% base (2000) = 12000
RES=$(curl_capture -X POST "$API/bids" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{ \"itemId\": $ITEM_ID, \"importe\": 15000 }")
assert_status "POST /bids (encima del máximo) → 422" 422 "$(split_code "$RES")"

# Una más válida
RES=$(curl_capture -X POST "$API/bids" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{ \"itemId\": $ITEM_ID, \"importe\": 11500 }")
assert_status "POST /bids (válida 11500)" 201 "$(split_code "$RES")"

# Listados
RES=$(curl_capture "$API/bids/auction/$SUBASTA_ID")
assert_status "GET /bids/auction/:id" 200 "$(split_code "$RES")"
RES=$(curl_capture "$API/bids/auction/$SUBASTA_ID/item/$ITEM_ID/current")
assert_status "GET /bids/auction/:id/item/:itemId/current" 200 "$(split_code "$RES")"
RES=$(curl_capture "$API/bids/my" -H "Authorization: Bearer $USER_TOKEN")
assert_status "GET /bids/my" 200 "$(split_code "$RES")"
RES=$(curl_capture "$API/bids/my/won" -H "Authorization: Bearer $USER_TOKEN")
assert_status "GET /bids/my/won" 200 "$(split_code "$RES")"

# =====================================================================
# 8. Perfil + métricas
# =====================================================================
step "8. Users y Metrics"

RES=$(curl_capture -X PUT "$API/users/me" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "phone": "+541199999999" }')
assert_status "PUT /users/me" 200 "$(split_code "$RES")"

RES=$(curl_capture "$API/users/me/metrics" -H "Authorization: Bearer $USER_TOKEN")
assert_status "GET /users/me/metrics" 200 "$(split_code "$RES")"
RES=$(curl_capture "$API/users/me/category" -H "Authorization: Bearer $USER_TOKEN")
assert_status "GET /users/me/category" 200 "$(split_code "$RES")"

RES=$(curl_capture "$API/metrics/user/$USER_ID" -H "Authorization: Bearer $USER_TOKEN")
assert_status "GET /metrics/user/:id" 200 "$(split_code "$RES")"
RES=$(curl_capture "$API/metrics/user/$USER_ID/auctions" -H "Authorization: Bearer $USER_TOKEN")
assert_status "GET /metrics/user/:id/auctions" 200 "$(split_code "$RES")"

# =====================================================================
# 9. Favoritos
# =====================================================================
step "9. Favoritos"
RES=$(curl_capture -X POST "$API/favorites/$ITEM_ID" -H "Authorization: Bearer $USER_TOKEN")
assert_status "POST /favorites/:itemId" 201 "$(split_code "$RES")"
RES=$(curl_capture "$API/favorites" -H "Authorization: Bearer $USER_TOKEN")
assert_status "GET /favorites" 200 "$(split_code "$RES")"
RES=$(curl_capture -X DELETE "$API/favorites/$ITEM_ID" -H "Authorization: Bearer $USER_TOKEN")
assert_status "DELETE /favorites/:itemId" 204 "$(split_code "$RES")"

# =====================================================================
# 10. Notificaciones
# =====================================================================
step "10. Notificaciones"
RES=$(curl_capture "$API/notifications" -H "Authorization: Bearer $USER_TOKEN")
assert_status "GET /notifications" 200 "$(split_code "$RES")"
RES=$(curl_capture "$API/notifications/settings" -H "Authorization: Bearer $USER_TOKEN")
assert_status "GET /notifications/settings" 200 "$(split_code "$RES")"
RES=$(curl_capture -X PUT "$API/notifications/settings" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "emailEnabled": false }')
assert_status "PUT /notifications/settings" 200 "$(split_code "$RES")"

# =====================================================================
# 11. Sell requests
# =====================================================================
step "11. Sell requests"

for i in 1 2 3 4 5 6; do
  printf '%%PDF-1.4\n%%EOF\n' > /tmp/subastar_img$i.pdf
done
printf '%%PDF-1.4\n%%EOF\n' > /tmp/subastar_own.pdf

RES=$(curl_capture -X POST "$API/sell/request" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -F "title=Reloj antiguo" \
  -F "description=Reloj de bolsillo" \
  -F "historia=Heredado" \
  -F "ownershipDeclaration=@/tmp/subastar_own.pdf" \
  -F "images=@/tmp/subastar_img1.pdf" -F "images=@/tmp/subastar_img2.pdf" \
  -F "images=@/tmp/subastar_img3.pdf" -F "images=@/tmp/subastar_img4.pdf" \
  -F "images=@/tmp/subastar_img5.pdf" -F "images=@/tmp/subastar_img6.pdf")
assert_status "POST /sell/request" 201 "$(split_code "$RES")"
SELL_ID=$(split_body "$RES" | jq -r '.id')

RES=$(curl_capture "$API/sell/my-requests" -H "Authorization: Bearer $USER_TOKEN")
assert_status "GET /sell/my-requests" 200 "$(split_code "$RES")"
RES=$(curl_capture "$API/sell/my-requests/$SELL_ID" -H "Authorization: Bearer $USER_TOKEN")
assert_status "GET /sell/my-requests/:id" 200 "$(split_code "$RES")"

# Simular que la empresa propone condiciones (no hay endpoint todavía)
note "Simulando 'conditions_offered' vía psql"
psql_run "UPDATE solicitudes_venta SET estado='conditions_offered', precio_base=50000, comision_porcentaje=10, moneda='ARS', condiciones_offered_at=NOW() WHERE identificador=$SELL_ID;" \
  >/dev/null 2>&1

RES=$(curl_capture -X PUT "$API/sell/my-requests/$SELL_ID/accept" \
  -H "Authorization: Bearer $USER_TOKEN")
assert_status "PUT /sell/my-requests/:id/accept" 200 "$(split_code "$RES")"

# =====================================================================
# 12. Pagos
# =====================================================================
step "12. Pagos"

# Crear un pago de prueba (no hay endpoint para esto fuera del cierre de subasta)
note "Insertando pago vía psql"
PAY_ID=$(psql -tAq -c "INSERT INTO pagos (cliente_id, monto, moneda, estado, due_date) VALUES ($USER_ID, 11500, 'ARS', 'pending', CURRENT_DATE + INTERVAL '3 days') RETURNING identificador;" 2>/dev/null | tr -d ' \n')

if [ -n "$PAY_ID" ]; then
  RES=$(curl_capture "$API/payments/pending" -H "Authorization: Bearer $USER_TOKEN")
  assert_status "GET /payments/pending" 200 "$(split_code "$RES")"
  RES=$(curl_capture "$API/payments/$PAY_ID" -H "Authorization: Bearer $USER_TOKEN")
  assert_status "GET /payments/:id" 200 "$(split_code "$RES")"
  RES=$(curl_capture -X POST "$API/payments/$PAY_ID/pay" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{ \"paymentMethodId\": $MEDIO_ID }")
  assert_status "POST /payments/:id/pay" 200 "$(split_code "$RES")"
  RES=$(curl_capture "$API/payments/invoices" -H "Authorization: Bearer $USER_TOKEN")
  assert_status "GET /payments/invoices" 200 "$(split_code "$RES")"
else
  note "No se pudo crear el pago de prueba — salteo pagos"
fi

# =====================================================================
# 13. Multas — admin aplica, user regulariza
# =====================================================================
step "13. Multas"

PAY2_ID=$(psql -tAq -c "INSERT INTO pagos (cliente_id, monto, moneda, estado, due_date) VALUES ($USER_ID, 11500, 'ARS', 'pending', CURRENT_DATE - INTERVAL '1 day') RETURNING identificador;" 2>/dev/null | tr -d ' \n')

if [ -n "$PAY2_ID" ]; then
  RES=$(curl_capture -X POST "$API/admin/payments/$PAY2_ID/apply-fine" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{}')
  assert_status "POST /admin/payments/:id/apply-fine" 201 "$(split_code "$RES")"
  FINE_ID=$(split_body "$RES" | jq -r '.id')

  RES=$(curl_capture "$API/fines" -H "Authorization: Bearer $USER_TOKEN")
  assert_status "GET /fines" 200 "$(split_code "$RES")"
  RES=$(curl_capture "$API/fines/$FINE_ID" -H "Authorization: Bearer $USER_TOKEN")
  assert_status "GET /fines/:id" 200 "$(split_code "$RES")"

  # User está bloqueado → pujar debería dar 403
  RES=$(curl_capture -X POST "$API/bids" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{ \"itemId\": $ITEM_ID, \"importe\": 12000 }")
  assert_status "POST /bids (bloqueado por multa) → 403" 403 "$(split_code "$RES")"

  # Pagar multa
  RES=$(curl_capture -X POST "$API/fines/$FINE_ID/pay" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{ \"paymentMethodId\": $MEDIO_ID }")
  assert_status "POST /fines/:id/pay" 200 "$(split_code "$RES")"
else
  note "No se pudo crear el pago vencido — salteo multas"
fi

# =====================================================================
# 14. Admin endpoints restantes
# =====================================================================
step "14. Admin restantes"

RES=$(curl_capture "$API/admin/users" -H "Authorization: Bearer $ADMIN_TOKEN")
assert_status "GET /admin/users" 200 "$(split_code "$RES")"
RES=$(curl_capture "$API/admin/users/$USER_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
assert_status "GET /admin/users/:id" 200 "$(split_code "$RES")"

RES=$(curl_capture -X PATCH "$API/admin/users/$USER_ID/category" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "category": "oro" }')
assert_status "PATCH /admin/users/:id/category" 200 "$(split_code "$RES")"

RES=$(curl_capture -X PATCH "$API/admin/users/$USER_ID/admission" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "admissionStatus": "approved" }')
assert_status "PATCH /admin/users/:id/admission" 200 "$(split_code "$RES")"

RES=$(curl_capture -X POST "$API/admin/users/$USER_ID/block-participation" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "reason": "investigación" }')
assert_status "POST /admin/users/:id/block-participation" 200 "$(split_code "$RES")"

RES=$(curl_capture -X POST "$API/admin/users/$USER_ID/unblock-participation" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
assert_status "POST /admin/users/:id/unblock-participation" 200 "$(split_code "$RES")"

RES=$(curl_capture "$API/admin/fines" -H "Authorization: Bearer $ADMIN_TOKEN")
assert_status "GET /admin/fines" 200 "$(split_code "$RES")"

# =====================================================================
# 15. Edge cases
# =====================================================================
step "15. Edge cases"

RES=$(curl_capture "$API/users/me")
assert_status "GET /users/me sin token → 401" 401 "$(split_code "$RES")"

RES=$(curl_capture "$API/admin/users" -H "Authorization: Bearer $USER_TOKEN")
assert_status "GET /admin/users con token user → 403" 403 "$(split_code "$RES")"

RES=$(curl_capture "$API/auctions/9999")
assert_status "GET /auctions/9999 (inexistente) → 404" 404 "$(split_code "$RES")"

RES=$(curl_capture -X POST "$API/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{ "email": "no-es-email" }')
assert_status "POST /auth/register (input inválido) → 422" 422 "$(split_code "$RES")"

# Refresh token: el viejo debe ser revocado tras refresh
RES=$(curl_capture -X POST "$API/auth/refresh-token" \
  -H 'Content-Type: application/json' \
  -d "{ \"refreshToken\": \"$REFRESH\" }")
assert_status "POST /auth/refresh-token (válido)" 200 "$(split_code "$RES")"

RES=$(curl_capture -X POST "$API/auth/refresh-token" \
  -H 'Content-Type: application/json' \
  -d "{ \"refreshToken\": \"$REFRESH\" }")
assert_status "POST /auth/refresh-token (revocado) → 401" 401 "$(split_code "$RES")"

# =====================================================================
# Resumen
# =====================================================================
printf "\n${B}====================${N}\n"
printf "  ${G}PASS:${N} %d\n" "$PASS"
printf "  ${R}FAIL:${N} %d\n" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  printf "  ${R}Fallos:${N}\n"
  printf "    - %s\n" "${FAILS[@]}"
fi
printf "${B}====================${N}\n"

# Cleanup de temporales
rm -f /tmp/subastar_*.pdf

exit "$FAIL"
