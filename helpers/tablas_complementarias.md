# Tablas complementarias — SubastAR

Definidas en `db/schema_complemento.sql`. Se aplican **después** de `EstructuraActual.sql` (`schema.sql`).

---

## Auth

### `clientes_credenciales`
Credenciales de cada cliente: email, `password_hash` (nullable hasta el step 3 del registro), rol (`user` | `admin`). Permite login con JWT.

### `refresh_tokens`
Tokens de refresco JWT. Se almacena el hash (no el token en texto plano). Al hacer logout o al refrescar, el token anterior se revoca (`revoked_at`).

---

## Perfil y admisión

### `clientes_perfil`
Datos extendidos del perfil: `firstName`, `lastName`, teléfono, domicilio, país, URLs del frente/dorso del documento y flag `document_verified`.

### `clientes_admision`
Estado de admisión del cliente: `pending → approved / rejected / blocked / suspended`. Lo gestiona el admin. Tiene notas y auditoría de quién lo modificó.

### `clientes_participacion`
Bloqueo de pujas: `bids_blocked` + motivo + vencimiento. Se activa automáticamente cuando hay una multa pendiente y se libera al pagarla.

---

## Pagos y multas

### `medios_pago`
Medios de pago del cliente: tarjeta de crédito (`cc_*`), cuenta bancaria (`bank_*`) o cheque certificado (`check_*`). El campo `verificado` lo activa un admin. Sin al menos uno verificado el cliente no puede pujar.

### `pagos`
Lifecycle de un pago: `pending → processing → completed | failed | overdue | defaulted`. Puede estar ligado a un `registrodesubasta` (compra real) y a una multa (`fine_id`). Genera factura al completarse.

### `multas`
Multa del 10% sobre el importe ofertado por impago. `deadline_at = issued_at + 72hs`. Estados: `pending → paid | overdue | waived`. Al vencer sin pagar bloquea la cuenta del cliente (`admision → blocked`).

### `facturas`
Comprobante generado al marcar un pago como `completed`. Tiene número único, monto, moneda y URL opcional al PDF.

---

## Solicitudes de venta

### `solicitudes_venta`
Flujo completo de "quiero vender un objeto":

```
pending → reviewing → rejected_by_company
                   → conditions_offered → accepted
                                       → conditions_rejected → returning → returned
```

Guarda precio base propuesto, comisión, notas y datos de devolución.

### `sell_request_imagenes`
Imágenes subidas con la solicitud de venta (mínimo 6 según la consigna). Se guardan antes de que exista un `producto` asociado.

---

## UX

### `favoritos`
Tabla pivot `cliente ↔ itemscatalogo`. Permite que el usuario marque ítems como favoritos. PK compuesta `(cliente_id, item_id)`.

### `notificaciones`
Mensajes internos enviados al cliente: pujas superadas, pago pendiente, subasta ganada, etc. Campo `metadata` en JSONB para datos adicionales. Tiene flag `leida` con timestamp.

### `notificaciones_settings`
Preferencias de notificación por cliente: push, email y toggles por tipo de evento (subasta iniciando, puja superada, pago, etc.).
