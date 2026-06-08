# Roadmap de testing manual de la API

Walkthrough end-to-end del backend siguiendo el journey real de un
usuario. Pensado para correr con `curl` + `jq`. Pasos en orden: si
salteás uno, los siguientes probablemente fallen por falta de pre-condición.

> **No es un test automatizado.** Es una guía para pegar comandos en
> la terminal y verificar a ojo que cada endpoint responde como
> esperás. Tiempo estimado: 20-30 min.

## Prerequisitos

- Backend levantado:
  ```bash
  cd backend
  npm install            # solo la primera vez
  npm run db:reset       # WIPE + schema + complemento + seed
  npm run seed:admin     # crea admin@subastar.local / admin123
  npm run dev            # http://localhost:4000/v1
  ```
- Tools:
  ```bash
  brew install jq         # parsear JSON
  npm i -g wscat          # opcional, para probar WebSocket
  ```

## 0. Cargar datos de prueba en la DB

El seed mínimo solo crea países + el admin. Para probar subastas hace
falta una subasta, un catálogo, un ítem y un dueño. Pegá este bloque
en `psql`:

```sql
-- Martillero
INSERT INTO personas (identificador, documento, nombre, direccion, estado)
OVERRIDING SYSTEM VALUE
VALUES (1000, '99999999', 'Martillero Demo', 'Av. Demo 123', 'activo')
ON CONFLICT (identificador) DO NOTHING;
SELECT setval(pg_get_serial_sequence('personas', 'identificador'),
              GREATEST((SELECT MAX(identificador) FROM personas), 1000));

INSERT INTO subastadores (identificador, matricula, region)
VALUES (1000, 'M-123', 'CABA') ON CONFLICT (identificador) DO NOTHING;

-- Dueño
INSERT INTO personas (identificador, documento, nombre, direccion, estado)
OVERRIDING SYSTEM VALUE
VALUES (1001, '88888888', 'Dueño Demo', 'Calle False 123', 'activo')
ON CONFLICT (identificador) DO NOTHING;
SELECT setval(pg_get_serial_sequence('personas', 'identificador'),
              GREATEST((SELECT MAX(identificador) FROM personas), 1001));

INSERT INTO duenios (identificador, numeropais, verificacion_financiera, verificacion_judicial, calificacionriesgo, verificador)
VALUES (1001, 32, 'si', 'si', 5, 1)
ON CONFLICT (identificador) DO NOTHING;

-- Subasta (15 días en el futuro, bronce, ARS)
INSERT INTO subastas (fecha, hora, estado, subastador, ubicacion, categoria, moneda)
VALUES (CURRENT_DATE + INTERVAL '15 days', '14:00', 'abierta', 1000, 'Salón Demo', 'bronce', 'ARS');

-- Producto
INSERT INTO productos (fecha, disponible, descripcioncompleta, revisor, duenio)
VALUES (CURRENT_DATE, 'si', 'Juego de té de 18 piezas — pieza demo', 1, 1001);

-- Catálogo + item (asume que esta es la subasta 1 y producto 1)
INSERT INTO catalogos (descripcion, subasta, responsable)
SELECT 'Catálogo demo', s.identificador, 1
  FROM subastas s ORDER BY s.identificador DESC LIMIT 1;

INSERT INTO itemscatalogo (catalogo, producto, preciobase, comision, subastado)
SELECT c.identificador, p.identificador, 10000.00, 1000.00, 'no'
  FROM catalogos c, productos p
 ORDER BY c.identificador DESC, p.identificador DESC LIMIT 1;
```

Anotá los IDs que devuelven los INSERTs (especialmente `subasta_id`,
`producto_id`, `item_id`). Para los comandos asumimos `subasta=1`,
`item=1`.

## 1. Health check

```bash
curl -s http://localhost:4000/v1/health | jq
# { "status": "ok", "db": "up", "time": "..." }
```

## 2. Registración del usuario (3 pasos)

### 2.1 Step 1: datos básicos

```bash
USER_ID=$(curl -s -X POST http://localhost:4000/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "ana@example.com",
    "firstName": "Ana",
    "lastName": "Pérez",
    "domicilio": "Av. Siempreviva 742, CABA",
    "pais": "Argentina",
    "documento": "30123456"
  }' | jq -r '.userId')
echo "USER_ID=$USER_ID"
# Esperado: 201 con { "userId": ..., "message": "Registro iniciado" }
```

### 2.2 Step 2: documento (frente y dorso)

Necesitás dos archivos pequeños — pueden ser cualquier jpg/png/pdf
chico. Si no tenés, generá unos placeholder:

```bash
# generar PDFs vacíos de prueba
printf '%%PDF-1.4\n%%EOF\n' > /tmp/front.pdf
printf '%%PDF-1.4\n%%EOF\n' > /tmp/back.pdf

curl -s -X POST http://localhost:4000/v1/auth/register/document \
  -F "userId=$USER_ID" \
  -F "documentFront=@/tmp/front.pdf" \
  -F "documentBack=@/tmp/back.pdf" | jq
# Esperado: 200 con { userId, documentFrontUrl, documentBackUrl, message }
```

### 2.3 Step 3: setear password

```bash
curl -s -X POST http://localhost:4000/v1/auth/register/complete \
  -H 'Content-Type: application/json' \
  -d "{ \"userId\": $USER_ID, \"password\": \"secret123\" }" | jq
# Esperado: 200 { "message": "Registro completado" }
```

## 3. Login como usuario (sigue pending)

```bash
USER_TOKEN=$(curl -s -X POST http://localhost:4000/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{ "email": "ana@example.com", "password": "secret123" }' | jq -r '.accessToken')
echo "USER_TOKEN=$USER_TOKEN"

curl -s http://localhost:4000/v1/users/me \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.admissionStatus, .category'
# Esperado: "pending", "bronce"
```

## 4. Admin aprueba al usuario

```bash
ADMIN_TOKEN=$(curl -s -X POST http://localhost:4000/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{ "email": "admin@subastar.local", "password": "admin123" }' | jq -r '.accessToken')

# Ver el listado de pendientes
curl -s "http://localhost:4000/v1/admin/users?admissionStatus=pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.items[]| {id, email, admissionStatus}'

# Aprobar (asignando categoría plata)
curl -s -X POST "http://localhost:4000/v1/admin/users/$USER_ID/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "category": "plata", "notes": "OK por demo" }' | jq '.admissionStatus, .category'
# Esperado: "approved", "plata"
```

## 5. Usuario agrega medio de pago y admin lo verifica

```bash
# Crear tarjeta
MEDIO_ID=$(curl -s -X POST http://localhost:4000/v1/payment-methods/credit-card \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "number": "4111111111111111",
    "brand": "Visa",
    "holder": "Ana Pérez",
    "expMonth": 12,
    "expYear": 2030
  }' | jq -r '.id')
echo "MEDIO_ID=$MEDIO_ID"

# Status: pending_verification
curl -s "http://localhost:4000/v1/payment-methods/$MEDIO_ID/status" \
  -H "Authorization: Bearer $USER_TOKEN" | jq

# La empresa lo verifica. NO hay endpoint todavía → SQL directo:
psql "$DATABASE_URL" -c "UPDATE medios_pago SET verificado = TRUE WHERE identificador = $MEDIO_ID;"

# Volver a chequear
curl -s "http://localhost:4000/v1/payment-methods/$MEDIO_ID/status" \
  -H "Authorization: Bearer $USER_TOKEN" | jq
# Esperado: "verified"
```

## 6. Browsing público (sin token)

```bash
curl -s http://localhost:4000/v1/categories                | jq 'length'
curl -s http://localhost:4000/v1/categories/plata          | jq '.tier'

curl -s http://localhost:4000/v1/auctions                  | jq '.items[0] | {id, fecha, categoria, moneda}'
curl -s http://localhost:4000/v1/auctions/active           | jq 'length'
curl -s http://localhost:4000/v1/auctions/upcoming         | jq 'length'
curl -s http://localhost:4000/v1/auctions/1                | jq
curl -s http://localhost:4000/v1/auctions/1/catalog        | jq

# Item sin auth: precio_base oculto
curl -s http://localhost:4000/v1/items/1                   | jq '.precio_base'
# Esperado: null

# Item con auth: precio_base visible
curl -s http://localhost:4000/v1/items/1 \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.precio_base'
# Esperado: "10000.00"

curl -s http://localhost:4000/v1/items/1/images           | jq
curl -s http://localhost:4000/v1/items/1/history          | jq
```

## 7. Subasta en vivo: join + WebSocket + bid

### 7.1 Conectar al WebSocket (en otra terminal)

```bash
wscat -c ws://localhost:4000/ws/auction/1
# < {"type":"hello","at":"...","auctionId":1,"message":"..."}
```

### 7.2 Unirse a la subasta

```bash
curl -s -X POST http://localhost:4000/v1/auctions/1/join \
  -H "Authorization: Bearer $USER_TOKEN" | jq
# Esperado: { sessionId, asistente: {id, numeropostor}, wsUrl }
# Si falla con 403: categoría insuficiente / sin medio de pago verificado.
# Si falla con 409: ya estás en otra subasta abierta.
```

### 7.3 Hacer una puja

Con `precio_base=10000` y sin pujas previas, el mínimo es 10000.

```bash
curl -s -X POST http://localhost:4000/v1/bids \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "itemId": 1, "importe": 10500 }' | jq
# Esperado: 201 con { id, itemId, asistenteId, importe }
# En la terminal del wscat tiene que llegar:
#   {"type":"bid_placed",...}
#   {"type":"bid_accepted",...}
```

### 7.4 Probar las reglas de monto

```bash
# Mínimo: oferta_actual (10500) + 1% base (100) = 10600
curl -s -X POST http://localhost:4000/v1/bids \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "itemId": 1, "importe": 10550 }' | jq
# Esperado: 422 ("El importe debe ser al menos 10600...")

# Máximo: oferta_actual (10500) + 20% base (2000) = 12500
curl -s -X POST http://localhost:4000/v1/bids \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "itemId": 1, "importe": 13000 }' | jq
# Esperado: 422 ("El importe supera el tope...")

# Puja válida
curl -s -X POST http://localhost:4000/v1/bids \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "itemId": 1, "importe": 11000 }' | jq
```

### 7.5 Consultar pujas

```bash
curl -s "http://localhost:4000/v1/bids/auction/1"                          | jq
curl -s "http://localhost:4000/v1/bids/auction/1/item/1/current"           | jq
curl -s "http://localhost:4000/v1/bids/my" \
  -H "Authorization: Bearer $USER_TOKEN" | jq
curl -s "http://localhost:4000/v1/bids/my/won" \
  -H "Authorization: Bearer $USER_TOKEN" | jq
```

### 7.6 Stream URL

```bash
curl -s http://localhost:4000/v1/auctions/1/stream \
  -H "Authorization: Bearer $USER_TOKEN" | jq
# Esperado: { auctionId, streamUrl, wsUrl }
```

## 8. Perfil y métricas

```bash
curl -s http://localhost:4000/v1/users/me \
  -H "Authorization: Bearer $USER_TOKEN" | jq

curl -s -X PUT http://localhost:4000/v1/users/me \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "phone": "+541199999999", "domicilio": "Nueva direccion 123" }' | jq

curl -s http://localhost:4000/v1/users/me/metrics \
  -H "Authorization: Bearer $USER_TOKEN" | jq
# Esperado: totalBids >= 2 después de las pujas

curl -s http://localhost:4000/v1/users/me/category \
  -H "Authorization: Bearer $USER_TOKEN" | jq

curl -s "http://localhost:4000/v1/metrics/user/$USER_ID" \
  -H "Authorization: Bearer $USER_TOKEN" | jq
curl -s "http://localhost:4000/v1/metrics/user/$USER_ID/auctions" \
  -H "Authorization: Bearer $USER_TOKEN" | jq
```

## 9. Favoritos

```bash
curl -s -X POST http://localhost:4000/v1/favorites/1 \
  -H "Authorization: Bearer $USER_TOKEN" | jq

curl -s http://localhost:4000/v1/favorites \
  -H "Authorization: Bearer $USER_TOKEN" | jq

curl -s -X DELETE http://localhost:4000/v1/favorites/1 \
  -H "Authorization: Bearer $USER_TOKEN" -o /dev/null -w "%{http_code}\n"
# Esperado: 204
```

## 10. Notificaciones

```bash
curl -s http://localhost:4000/v1/notifications \
  -H "Authorization: Bearer $USER_TOKEN" | jq

curl -s http://localhost:4000/v1/notifications/settings \
  -H "Authorization: Bearer $USER_TOKEN" | jq

curl -s -X PUT http://localhost:4000/v1/notifications/settings \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "emailEnabled": false, "bidOutbid": true }' | jq
```

## 11. Flujo de venta (solicitar vender un objeto)

Necesitás 6+ imágenes y 1 declaración. Generá placeholders:

```bash
for i in 1 2 3 4 5 6; do
  printf '%%PDF-1.4\n%%EOF\n' > /tmp/img$i.pdf
done
printf '%%PDF-1.4\n%%EOF\n' > /tmp/ownership.pdf

SELL_ID=$(curl -s -X POST http://localhost:4000/v1/sell/request \
  -H "Authorization: Bearer $USER_TOKEN" \
  -F "title=Reloj antiguo" \
  -F "description=Reloj de bolsillo de 1900" \
  -F "historia=Heredado del bisabuelo" \
  -F "ownershipDeclaration=@/tmp/ownership.pdf" \
  -F "images=@/tmp/img1.pdf" -F "images=@/tmp/img2.pdf" \
  -F "images=@/tmp/img3.pdf" -F "images=@/tmp/img4.pdf" \
  -F "images=@/tmp/img5.pdf" -F "images=@/tmp/img6.pdf" \
  | jq -r '.id')
echo "SELL_ID=$SELL_ID"

curl -s http://localhost:4000/v1/sell/my-requests \
  -H "Authorization: Bearer $USER_TOKEN" | jq

curl -s "http://localhost:4000/v1/sell/my-requests/$SELL_ID" \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.estado, (.images | length)'
# Esperado: "pending", 6

# Simular que la empresa propone condiciones (no hay endpoint todavía):
psql "$DATABASE_URL" <<SQL
UPDATE solicitudes_venta
   SET estado = 'conditions_offered',
       precio_base = 50000,
       comision_porcentaje = 10,
       moneda = 'ARS',
       condiciones_offered_at = NOW()
 WHERE identificador = $SELL_ID;
SQL

# Aceptar condiciones
curl -s -X PUT "http://localhost:4000/v1/sell/my-requests/$SELL_ID/accept" \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.estado'
# Esperado: "accepted"

# O rechazar (probá esto en una solicitud nueva)
# curl -s -X POST "http://localhost:4000/v1/sell/my-requests/$SELL_ID/reject" \
#   -H "Authorization: Bearer $USER_TOKEN" \
#   -H 'Content-Type: application/json' \
#   -d '{ "reason": "El precio base es muy bajo" }' | jq

# Consultar motivo y costo de devolución (cuando esté rechazada)
# curl -s "http://localhost:4000/v1/sell/my-requests/$SELL_ID/rejection-reason" -H "Authorization: Bearer $USER_TOKEN" | jq
# curl -s "http://localhost:4000/v1/sell/my-requests/$SELL_ID/return-cost"     -H "Authorization: Bearer $USER_TOKEN" | jq
```

## 12. Pagos

Como no hay cierre de subasta automático, simulemos un pago con SQL:

```bash
psql "$DATABASE_URL" <<SQL
INSERT INTO pagos (cliente_id, monto, moneda, estado, due_date)
VALUES ($USER_ID, 11000.00, 'ARS', 'pending', CURRENT_DATE + INTERVAL '3 days')
RETURNING identificador;
SQL
# Anotar el id devuelto, ej PAY_ID=1

PAY_ID=1  # ajustar al id real

curl -s "http://localhost:4000/v1/payments/pending" \
  -H "Authorization: Bearer $USER_TOKEN" | jq

curl -s "http://localhost:4000/v1/payments/$PAY_ID" \
  -H "Authorization: Bearer $USER_TOKEN" | jq

curl -s -X POST "http://localhost:4000/v1/payments/$PAY_ID/pay" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{ \"paymentMethodId\": $MEDIO_ID }" | jq
# Esperado: estado=completed, paidAt definido

curl -s "http://localhost:4000/v1/payments/invoices" \
  -H "Authorization: Bearer $USER_TOKEN" | jq
# Esperado: 1 factura generada
```

## 13. Multas (admin aplica + usuario regulariza)

```bash
# Crear un pago vencido
psql "$DATABASE_URL" <<SQL
INSERT INTO pagos (cliente_id, monto, moneda, estado, due_date)
VALUES ($USER_ID, 11000.00, 'ARS', 'pending', CURRENT_DATE - INTERVAL '1 day')
RETURNING identificador;
SQL
# Anotar el PAY2_ID

PAY2_ID=2  # ajustar

# Admin aplica multa del 10%
FINE_ID=$(curl -s -X POST "http://localhost:4000/v1/admin/payments/$PAY2_ID/apply-fine" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{}' | jq -r '.id')
echo "FINE_ID=$FINE_ID"

# Usuario ve sus multas
curl -s http://localhost:4000/v1/fines \
  -H "Authorization: Bearer $USER_TOKEN" | jq
# Esperado: 1 multa pending con deadline = NOW + 72h

# Usuario intenta pujar — debería estar bloqueado
curl -s -X POST http://localhost:4000/v1/bids \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "itemId": 1, "importe": 12000 }' | jq
# Esperado: 403 "Tu participación está bloqueada..."

# Usuario regulariza
curl -s -X POST "http://localhost:4000/v1/fines/$FINE_ID/pay" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{ \"paymentMethodId\": $MEDIO_ID }" | jq
# Esperado: estado=paid, paidAt definido. bids_blocked automáticamente FALSE.

# Confirmar que ya puede pujar
curl -s http://localhost:4000/v1/users/me \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.bidsBlocked, .admissionStatus'
# Esperado: false, "approved"
```

## 14. Endpoints admin restantes

```bash
# Listar todas las multas
curl -s "http://localhost:4000/v1/admin/fines" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.items[0]'

# Cambiar categoría
curl -s -X PATCH "http://localhost:4000/v1/admin/users/$USER_ID/category" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "category": "oro" }' | jq '.category'

# Cambiar estado de admisión
curl -s -X PATCH "http://localhost:4000/v1/admin/users/$USER_ID/admission" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "admissionStatus": "approved", "notes": "Reactivado" }' | jq '.admissionStatus'

# Bloquear / desbloquear participación
curl -s -X POST "http://localhost:4000/v1/admin/users/$USER_ID/block-participation" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "reason": "investigación interna" }' | jq '.bidsBlocked'

curl -s -X POST "http://localhost:4000/v1/admin/users/$USER_ID/unblock-participation" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.bidsBlocked'

# Rechazar otro usuario (probar el flow rechazo)
# Crear primero un usuario en pending y después:
# curl -s -X POST "http://localhost:4000/v1/admin/users/OTRO_ID/reject" \
#   -H "Authorization: Bearer $ADMIN_TOKEN" \
#   -H 'Content-Type: application/json' \
#   -d '{ "reason": "Documentación no concuerda" }' | jq
```

## 15. Casos de error / edge cases

```bash
# 401 sin token
curl -s http://localhost:4000/v1/users/me -w "%{http_code}\n" -o /dev/null
# Esperado: 401

# 403 ForbiddenAdmin (user accediendo a /admin)
curl -s http://localhost:4000/v1/admin/users \
  -H "Authorization: Bearer $USER_TOKEN" -w "%{http_code}\n" -o /dev/null
# Esperado: 403

# 404 recurso inexistente
curl -s http://localhost:4000/v1/auctions/9999 -w "%{http_code}\n" -o /dev/null
# Esperado: 404

# 422 input inválido
curl -s -X POST http://localhost:4000/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{ "email": "no-es-email" }' -w "%{http_code}\n" -o /dev/null
# Esperado: 422

# 409 puja sin haberse unido
# (depende del estado, hacer login con otro user que no se unió)

# 409 segunda subasta abierta
# (crear otra subasta abierta en la DB, intentar /join con USER_TOKEN
# después del primer join → debería 409)

# Refresh token
REFRESH=$(curl -s -X POST http://localhost:4000/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{ "email": "ana@example.com", "password": "secret123" }' | jq -r '.refreshToken')

curl -s -X POST http://localhost:4000/v1/auth/refresh-token \
  -H 'Content-Type: application/json' \
  -d "{ \"refreshToken\": \"$REFRESH\" }" | jq

# Usar el refresh viejo (ya revocado) → 401
curl -s -X POST http://localhost:4000/v1/auth/refresh-token \
  -H 'Content-Type: application/json' \
  -d "{ \"refreshToken\": \"$REFRESH\" }" -w "%{http_code}\n" -o /dev/null
# Esperado: 401
```

---

## Cobertura

Este roadmap toca **todos los endpoints REST** + el WebSocket
(`bid_placed`). Quedan **fuera del happy path**, requieren setup adicional
o son tests negativos:

- Endpoints admin para cambio masivo (no implementados, se hacen vía SQL).
- Transiciones de `sell-requests` que requieren intervención de la
  empresa (`pending → reviewing → conditions_offered`) — se simulan con
  SQL hasta que existan los endpoints admin correspondientes.
- Endpoints de seguros / location / my-items — el módulo no está
  implementado todavía.
- Cierre de subasta + adjudicación automática — no implementado.
- Verificación de medio de pago (admin) — no hay endpoint, se hace
  vía SQL.

Cuando se sumen esos endpoints, completar las secciones correspondientes
de este doc.
