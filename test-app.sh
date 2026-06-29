#!/usr/bin/env bash
# =====================================================================
# test-app.sh — recorrido EXPLORATORIO de la API de SubastAR.
#
# A diferencia de test-all.sh (que da pass/fail), este script "usa" la
# app: llama a los endpoints y MUESTRA las respuestas para que puedas
# ver los datos reales que vería el mobile.
#
# Uso:
#   ./test-app.sh                 # recorrido de sólo lectura
#   ./test-app.sh --write         # + acciones: guerra de pujas, favoritos, settings
#   ./test-app.sh --full          # no trunca los arrays largos
#   BIDS=8 ./test-app.sh --write  # cantidad de pujas escalonadas (default 5)
#   API_URL=http://192.168.0.10:4000/v1 ./test-app.sh
#   EMAIL=otro@mail PASSWORD=xxx ./test-app.sh
#
# Con --write arma una "guerra de pujas": N pujas escalonadas sobre un
# ítem (respetando mínimo +1% y tope +20% del backend) + pujas de
# apertura sobre otros ítems, y muestra el estado final.
#
# Pre-requisitos:
#   - Backend corriendo:  ./start.sh         (o cd backend && npm run dev)
#   - Datos:              admin se crea solo; para más data:
#                         cd backend && npm run seed:demo
#   - jq instalado (brew install jq) — recomendado para ver JSON lindo.
# =====================================================================

set -uo pipefail

# ─── Configuración ──────────────────────────────────────────────────
API="${API_URL:-http://localhost:4000/v1}"
EMAIL="${EMAIL:-admin@subastar.local}"
PASSWORD="${PASSWORD:-admin123}"
BIDS="${BIDS:-5}"          # cantidad de pujas escalonadas en la "guerra de pujas"
TOKEN=""

WRITE=0
FULL=0
for arg in "$@"; do
  case "$arg" in
    --write) WRITE=1 ;;
    --full)  FULL=1 ;;
    -h|--help)
      sed -n '2,25p' "$0"; exit 0 ;;
    *) echo "Argumento desconocido: $arg"; exit 1 ;;
  esac
done

# Colores
G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'; B='\033[0;34m'; C='\033[0;36m'; D='\033[2m'; N='\033[0m'

HAVE_JQ=0
command -v jq >/dev/null 2>&1 && HAVE_JQ=1

# Filtro de truncado: para arrays muestra total + primeros 3 elementos.
TRUNC='if type=="array" then {_array:true, total:length, muestra:(.[0:3])} else . end'

# ─── Helpers ────────────────────────────────────────────────────────

# hit METHOD PATH [JSON_BODY] → imprime body + (última línea) status code
hit() {
  local method="$1" path="$2" body="${3:-}"
  local args=(-s -X "$method" -w $'\n%{http_code}' -H "Accept: application/json")
  [ -n "$TOKEN" ] && args+=(-H "Authorization: Bearer $TOKEN")
  [ -n "$body" ] && args+=(-H "Content-Type: application/json" -d "$body")
  curl "${args[@]}" "$API$path" 2>/dev/null
}

# silent METHOD PATH → sólo el body (sin status), para descubrir IDs
silent() { hit "$1" "$2" | sed '$d'; }

# jqval METHOD PATH FILTER → extrae un valor del body (requiere jq)
jqval() {
  [ "$HAVE_JQ" = 1 ] || { echo ""; return; }
  silent "$1" "$2" | jq -r "$3" 2>/dev/null || echo ""
}

pretty() {
  local data="$1"
  if [ -z "$data" ]; then printf "  ${D}(sin cuerpo)${N}\n"; return; fi
  if [ "$HAVE_JQ" = 1 ]; then
    local filter="."; [ "$FULL" = 0 ] && filter="$TRUNC"
    printf '%s' "$data" | jq "$filter" 2>/dev/null | sed 's/^/  /' \
      || printf '  %s\n' "$data"
  else
    printf '  %s\n' "$data"
  fi
}

# show "Título" METHOD PATH [BODY]
show() {
  local title="$1" method="$2" path="$3" body="${4:-}"
  local raw status payload color
  raw="$(hit "$method" "$path" "$body")"
  status="$(printf '%s' "$raw" | tail -n1)"
  payload="$(printf '%s' "$raw" | sed '$d')"

  case "$status" in
    2*) color="$G" ;;
    3*|4*) color="$Y" ;;
    *) color="$R" ;;
  esac
  printf "\n${C}• %s${N}\n" "$title"
  printf "  ${D}%s %s${N} → ${color}%s${N}\n" "$method" "$path" "$status"
  pretty "$payload"
}

section() {
  printf "\n${B}══════════════════════════════════════════════════════════════${N}\n"
  printf "${B}  %s${N}\n" "$1"
  printf "${B}══════════════════════════════════════════════════════════════${N}\n"
}

# precio_base de un ítem dentro del catálogo de la subasta
item_base() { jqval GET "/auctions/$AUCTION_ID/catalog" ".[] | select(.item_id==$1) | .precio_base" | head -1; }
# mejor oferta actual de un ítem (0 si no hay)
item_current() { local v; v="$(jqval GET "/bids/auction/$AUCTION_ID/item/$1/current" '.importe // 0')"; echo "${v:-0}"; }

# next_bid BASE CURRENT → próximo importe válido (paso ~5% de la base,
# nunca menos que el mínimo +1%, y si no hay pujas usa el precio base).
next_bid() {
  awk -v b="${1:-0}" -v c="${2:-0}" 'BEGIN{
    b+=0; c+=0;
    minS=int(b*0.01); if(minS<b*0.01) minS++; if(minS<1) minS=1;   # +1% (mínimo)
    step=int(b*0.05); if(step<minS) step=minS;                     # ~5% por puja
    print (c>0 ? c+step : (b>0 ? b : 1)); }'
}

# Asegura que el usuario tenga un medio de pago VERIFICADO (requisito para
# unirse y pujar). Si no lo tiene, crea una cuenta bancaria y la verifica
# usando el endpoint admin (sólo posible si el usuario es admin).
ensure_verified_payment() {
  local verified
  verified="$(jqval GET /payment-methods '[.[] | select(.verificado==true)] | length')"
  if [ -n "$verified" ] && [ "$verified" != "0" ]; then
    printf "\n  ${G}✓ El usuario ya tiene un medio de pago verificado.${N}\n"
    return
  fi

  printf "\n  ${C}El usuario no tiene medio de pago verificado — creando y verificando uno…${N}\n"
  local created cstatus cbody pmid
  created="$(hit POST /payment-methods/bank-account '{"bankName":"Banco Test","cbu":"0000000000000000000000","holder":"Admin Test"}')"
  cstatus="$(printf '%s' "$created" | tail -n1)"
  cbody="$(printf '%s' "$created" | sed '$d')"
  pmid="$(printf '%s' "$cbody" | jq -r '.id // empty' 2>/dev/null)"
  printf "  ${D}POST /payment-methods/bank-account${N} → %s  (id=%s)\n" "$cstatus" "${pmid:-?}"

  if [ -z "$pmid" ]; then
    printf "  ${Y}! No se pudo crear el medio de pago; las pujas pueden fallar.${N}\n"
    pretty "$cbody"; return
  fi
  if [ "${ROLE:-}" = "admin" ]; then
    show "Verificar medio de pago #$pmid (admin)" POST "/admin/payment-methods/$pmid/verify"
  else
    printf "  ${Y}! El usuario no es admin; no puede auto-verificar. Pedí a un admin que verifique el medio #%s.${N}\n" "$pmid"
  fi
  show "Estado del medio de pago #$pmid" GET "/payment-methods/$pmid/status"
}

# ─── Pre-flight ─────────────────────────────────────────────────────
section "SubastAR · recorrido de la API"
printf "  API:     %s\n" "$API"
printf "  Usuario: %s\n" "$EMAIL"
[ "$HAVE_JQ" = 0 ] && printf "  ${Y}! jq no está instalado — el JSON se muestra crudo (brew install jq)${N}\n"

health_status="$(hit GET /health | tail -n1)"
if [ "$health_status" != "200" ]; then
  printf "\n${R}✗ El backend no responde en %s (status %s).${N}\n" "$API" "$health_status"
  printf "  Levantalo con:  ${C}./start.sh${N}\n"
  printf "  Para datos de ejemplo:  ${C}cd backend && npm run seed:demo${N}\n"
  exit 1
fi

# ─── Descubrimiento de IDs reales ───────────────────────────────────
AUCTION_ID="$(jqval GET /auctions/active   '.[0].id // empty')"
[ -z "$AUCTION_ID" ] && AUCTION_ID="$(jqval GET /auctions/upcoming '.[0].id // empty')"
[ -z "$AUCTION_ID" ] && AUCTION_ID="$(jqval GET /auctions          '.items[0].id // empty')"
[ -z "$AUCTION_ID" ] && AUCTION_ID="1"

ITEM_ID="$(jqval GET "/auctions/$AUCTION_ID/catalog" '.[0].item_id // empty')"
[ -z "$ITEM_ID" ] && ITEM_ID="$(jqval GET /items '(.[0].id // .items[0].id) // empty')"
[ -z "$ITEM_ID" ] && ITEM_ID="1"

printf "  Subasta de prueba: #%s   ·   Ítem de prueba: #%s\n" "$AUCTION_ID" "$ITEM_ID"
[ "$HAVE_JQ" = 0 ] && printf "  ${Y}! Sin jq no se pueden descubrir IDs; usando defaults 1.${N}\n"

# ─── 1) Público (sin token) ─────────────────────────────────────────
section "1 · Público (sin autenticación)"
show "Health check"                 GET "/health"
show "Catálogo de categorías"       GET "/categories"
show "Detalle de categoría (oro)"   GET "/categories/oro"
show "Listado de subastas"          GET "/auctions"
show "Subastas en vivo"             GET "/auctions/active"
show "Próximas subastas"            GET "/auctions/upcoming"
show "Detalle de subasta"           GET "/auctions/$AUCTION_ID"
show "Catálogo de la subasta"       GET "/auctions/$AUCTION_ID/catalog"
show "Listado de ítems"             GET "/items"
show "Detalle de ítem"              GET "/items/$ITEM_ID"
show "Imágenes del ítem"            GET "/items/$ITEM_ID/images"
show "Historial de propietarios"    GET "/items/$ITEM_ID/history"
show "Pujas de la subasta"          GET "/bids/auction/$AUCTION_ID"
show "Mejor oferta del ítem"        GET "/bids/auction/$AUCTION_ID/item/$ITEM_ID/current"

# ─── 2) Login ───────────────────────────────────────────────────────
section "2 · Login"
login_raw="$(hit POST /auth/login "$(printf '{"email":"%s","password":"%s"}' "$EMAIL" "$PASSWORD")")"
login_status="$(printf '%s' "$login_raw" | tail -n1)"
login_body="$(printf '%s' "$login_raw" | sed '$d')"
if [ "$HAVE_JQ" = 1 ]; then
  TOKEN="$(printf '%s' "$login_body" | jq -r '.accessToken // empty' 2>/dev/null)"
fi
printf "\n${C}• POST /auth/login${N} → "
if [ -n "$TOKEN" ]; then
  printf "${G}%s${N}\n" "$login_status"
  printf "  token: ${D}%s…%s${N}\n" "${TOKEN:0:12}" "${TOKEN: -6}"
  [ "$HAVE_JQ" = 1 ] && printf '%s' "$login_body" | jq '{user}' 2>/dev/null | sed 's/^/  /'
else
  printf "${R}%s${N}\n" "$login_status"
  pretty "$login_body"
  printf "  ${Y}! Sin token no se pueden probar los endpoints autenticados.${N}\n"
fi

# ─── 3) Usuario autenticado ─────────────────────────────────────────
if [ -n "$TOKEN" ]; then
  section "3 · Usuario (con token)"
  show "Mi perfil"                  GET "/users/me"
  show "Mis métricas"               GET "/users/me/metrics"
  show "Mi categoría y progreso"    GET "/users/me/category"
  show "Mis notificaciones"         GET "/notifications"
  show "Config. de notificaciones"  GET "/notifications/settings"
  show "Mis medios de pago"         GET "/payment-methods"
  show "Mis favoritos"              GET "/favorites"
  show "Mis multas"                 GET "/fines"
  show "Pagos pendientes"           GET "/payments/pending"
  show "Mis facturas"               GET "/payments/invoices"
  show "Mis pujas"                  GET "/bids/my"
  show "Mis pujas ganadas"          GET "/bids/my/won"
  show "Mis solicitudes de venta"   GET "/sell/my-requests"

  # ─── 4) Admin (sólo si el usuario es admin) ──────────────────────
  ROLE="$(jqval GET /users/me '.role // empty')"
  if [ "$ROLE" = "admin" ]; then
    section "4 · Admin"
    show "Usuarios (paginado)"      GET "/admin/users"
    show "Multas de la plataforma"  GET "/admin/fines"
  else
    section "4 · Admin"
    printf "  ${D}(omitido — el usuario %s no es admin)${N}\n" "$EMAIL"
  fi

  # ─── 5) Acciones de escritura (opcional) ─────────────────────────
  if [ "$WRITE" = 1 ]; then
    section "5 · Acciones (--write)"
    printf "  ${D}Estas acciones modifican datos y pueden fallar según el estado\n  de la cuenta (admisión, medio de pago, categoría). Se muestran\n  las respuestas reales del backend.${N}\n"

    # Requisito para pujar: medio de pago verificado. Si falta, lo crea y verifica.
    [ "$HAVE_JQ" = 1 ] && ensure_verified_payment

    show "Unirse a la subasta"      POST "/auctions/$AUCTION_ID/join"

    if [ "$HAVE_JQ" = 0 ]; then
      printf "\n  ${Y}! Sin jq no puedo calcular importes válidos; hago una sola puja base.${N}\n"
      show "Realizar una puja"      POST "/bids" "$(printf '{"itemId":%s,"importe":1000}' "$ITEM_ID")"
    else
      # ── Guerra de pujas: N pujas escalonadas sobre el mismo ítem ──
      printf "\n  ${C}Guerra de pujas: %s pujas escalonadas sobre el ítem #%s${N}\n" "$BIDS" "$ITEM_ID"
      WAR_BASE="$(item_base "$ITEM_ID")"
      for ((i=1; i<=BIDS; i++)); do
        cur="$(item_current "$ITEM_ID")"
        next="$(next_bid "$WAR_BASE" "$cur")"
        show "Puja #$i sobre ítem $ITEM_ID  (actual=$cur → ofrece $next)" \
          POST "/bids" "$(printf '{"itemId":%s,"importe":%s}' "$ITEM_ID" "$next")"
      done

      # ── Pujas de apertura sobre otros ítems del catálogo ──
      OTHER_IDS="$(jqval GET "/auctions/$AUCTION_ID/catalog" "[.[].item_id] | map(select(. != $ITEM_ID)) | .[0:3] | .[]")"
      if [ -n "$OTHER_IDS" ]; then
        printf "\n  ${C}Pujas de apertura sobre otros ítems del catálogo${N}\n"
        for id in $OTHER_IDS; do
          base="$(item_base "$id")"
          cur="$(item_current "$id")"
          next="$(next_bid "$base" "$cur")"
          show "Apertura ítem $id  (ofrece $next)" \
            POST "/bids" "$(printf '{"itemId":%s,"importe":%s}' "$id" "$next")"
        done
      fi

      # ── Estado final tras la guerra de pujas ──
      printf "\n  ${C}Estado final de las pujas${N}\n"
      show "Mejor oferta del ítem $ITEM_ID" GET "/bids/auction/$AUCTION_ID/item/$ITEM_ID/current"
      show "Todas las pujas de la subasta"  GET "/bids/auction/$AUCTION_ID"
      show "Mis pujas"                      GET "/bids/my"
    fi

    show "Agregar a favoritos"      POST   "/favorites/$ITEM_ID"
    show "Quitar de favoritos"      DELETE "/favorites/$ITEM_ID"
    show "Actualizar notif. settings" PUT  "/notifications/settings" '{"email_enabled":true,"push_enabled":true}'
  else
    section "5 · Acciones de escritura"
    printf "  ${D}(omitido — corré con ${N}${C}--write${N}${D} para probar join, puja, favoritos, etc.)${N}\n"
  fi
fi

section "Fin del recorrido"
printf "  Listo. Probá: ${C}./test-app.sh --write${N}  ó  ${C}./test-app.sh --full${N}\n\n"
