-- =====================================================================
-- SubastAR — Schema complementario
-- =====================================================================
-- Tablas adicionales necesarias para soportar el contrato del swagger
-- que no están modeladas en `EstructuraActual.sql`:
--   - autenticación (email/password/JWT)
--   - estado de admisión extendido
--   - multas e impago (10% / 72hs)
--   - medios de pago
--   - pagos y facturas
--   - solicitudes de venta con flujo de estados
--   - favoritos
--   - notificaciones + configuración
--   - refresh tokens
--
-- Se aplica DESPUÉS de `schema.sql`.
-- =====================================================================

DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS notificaciones_settings CASCADE;
DROP TABLE IF EXISTS notificaciones CASCADE;
DROP TABLE IF EXISTS favoritos CASCADE;
DROP TABLE IF EXISTS sell_request_imagenes CASCADE;
DROP TABLE IF EXISTS solicitudes_venta CASCADE;
DROP TABLE IF EXISTS facturas CASCADE;
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS multas CASCADE;
DROP TABLE IF EXISTS medios_pago CASCADE;
DROP TABLE IF EXISTS clientes_participacion CASCADE;
DROP TABLE IF EXISTS clientes_admision CASCADE;
DROP TABLE IF EXISTS clientes_perfil CASCADE;
DROP TABLE IF EXISTS clientes_credenciales CASCADE;

-- ---------------------------------------------------------------------
-- Auth: credenciales del cliente
-- ---------------------------------------------------------------------
-- password_hash es NULLABLE: la fila se crea en `POST /auth/register`
-- (step 1) con el email, y el password se setea en `POST /auth/register/complete`
-- (step 3). Mientras `password_hash IS NULL`, el login está bloqueado.
CREATE TABLE clientes_credenciales (
    cliente_id    INT          PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role          VARCHAR(10)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_credenciales_clientes FOREIGN KEY (cliente_id) REFERENCES clientes (identificador) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Perfil ampliado (campos del swagger que no están en personas/clientes)
-- ---------------------------------------------------------------------
CREATE TABLE clientes_perfil (
    cliente_id          INT PRIMARY KEY,
    first_name          VARCHAR(100),
    last_name           VARCHAR(100),
    phone               VARCHAR(30),
    domicilio           VARCHAR(250),
    pais                VARCHAR(100),
    document_front_url  TEXT,
    document_back_url   TEXT,
    document_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    -- Fecha en que el cliente aceptó las condiciones de la empresa (NULL = no aceptó)
    conditions_accepted_at TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_perfil_clientes FOREIGN KEY (cliente_id) REFERENCES clientes (identificador) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Estado de admisión (extiende `clientes.admitido` con los 5 estados del swagger)
-- ---------------------------------------------------------------------
CREATE TABLE clientes_admision (
    cliente_id   INT PRIMARY KEY,
    estado       VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (estado IN ('pending', 'approved', 'rejected', 'blocked', 'suspended')),
    notas        TEXT,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by   INT,
    CONSTRAINT fk_admision_clientes  FOREIGN KEY (cliente_id) REFERENCES clientes  (identificador) ON DELETE CASCADE,
    CONSTRAINT fk_admision_empleados FOREIGN KEY (updated_by) REFERENCES empleados (identificador)
);

-- ---------------------------------------------------------------------
-- Bloqueo de participación (mientras hay multa vigente)
-- ---------------------------------------------------------------------
CREATE TABLE clientes_participacion (
    cliente_id         INT PRIMARY KEY,
    bids_blocked       BOOLEAN     NOT NULL DEFAULT FALSE,
    bids_blocked_reason VARCHAR(100),
    bids_blocked_until TIMESTAMPTZ,
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_participacion_clientes FOREIGN KEY (cliente_id) REFERENCES clientes (identificador) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Medios de pago
-- ---------------------------------------------------------------------
CREATE TABLE medios_pago (
    identificador SERIAL PRIMARY KEY,
    cliente_id    INT          NOT NULL,
    tipo          VARCHAR(20)  NOT NULL CHECK (tipo IN ('credit_card', 'bank_account', 'certified_check')),
    verificado    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- credit_card
    cc_last4      VARCHAR(4),
    cc_brand      VARCHAR(30),
    cc_holder     VARCHAR(100),
    cc_exp_month  INT,
    cc_exp_year   INT,

    -- bank_account
    bank_name     VARCHAR(150),
    bank_cbu      VARCHAR(30),
    bank_holder   VARCHAR(100),

    -- certified_check (sin restricción de categoría; corrección 5.2)
    check_number   VARCHAR(50),
    check_bank     VARCHAR(150),
    check_amount   DECIMAL(18, 2),
    check_currency VARCHAR(10),

    CONSTRAINT fk_medios_pago_clientes FOREIGN KEY (cliente_id) REFERENCES clientes (identificador) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Pagos (lifecycle de pagos del swagger, sobre `registrodesubasta`)
-- ---------------------------------------------------------------------
CREATE TABLE pagos (
    identificador        SERIAL PRIMARY KEY,
    registrodesubasta_id INT,
    cliente_id           INT NOT NULL,
    monto                DECIMAL(18, 2) NOT NULL,
    moneda               VARCHAR(10) NOT NULL DEFAULT 'ARS',
    estado               VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (estado IN ('pending', 'processing', 'completed', 'failed', 'overdue', 'defaulted')),
    medio_pago_id        INT,
    due_date             DATE,
    paid_at              TIMESTAMPTZ,
    fine_id              INT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pagos_registro     FOREIGN KEY (registrodesubasta_id) REFERENCES registrodesubasta (identificador),
    CONSTRAINT fk_pagos_clientes     FOREIGN KEY (cliente_id)           REFERENCES clientes          (identificador),
    CONSTRAINT fk_pagos_medios_pago  FOREIGN KEY (medio_pago_id)        REFERENCES medios_pago      (identificador)
);

-- ---------------------------------------------------------------------
-- Multas (10% sobre la oferta, deadline 72hs)
-- ---------------------------------------------------------------------
CREATE TABLE multas (
    identificador    SERIAL PRIMARY KEY,
    cliente_id       INT NOT NULL,
    pago_id          INT,
    pujo_id          INT,
    bid_amount       DECIMAL(18, 2) NOT NULL,
    fine_percentage  DECIMAL(5, 2)  NOT NULL DEFAULT 10.00,
    amount           DECIMAL(18, 2) NOT NULL,
    moneda           VARCHAR(10)    NOT NULL DEFAULT 'ARS',
    estado           VARCHAR(20)    NOT NULL DEFAULT 'pending' CHECK (estado IN ('pending', 'paid', 'overdue', 'waived')),
    issued_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    deadline_at      TIMESTAMPTZ    NOT NULL,
    paid_at          TIMESTAMPTZ,
    waived_at        TIMESTAMPTZ,
    waived_by        INT,
    waived_reason    TEXT,
    CONSTRAINT fk_multas_clientes  FOREIGN KEY (cliente_id) REFERENCES clientes  (identificador) ON DELETE CASCADE,
    CONSTRAINT fk_multas_pagos     FOREIGN KEY (pago_id)    REFERENCES pagos     (identificador),
    CONSTRAINT fk_multas_pujos     FOREIGN KEY (pujo_id)    REFERENCES pujos     (identificador),
    CONSTRAINT fk_multas_waived_by FOREIGN KEY (waived_by)  REFERENCES empleados (identificador)
);

-- Linkear `pagos.fine_id` después de crear `multas`.
ALTER TABLE pagos
    ADD CONSTRAINT fk_pagos_multas FOREIGN KEY (fine_id) REFERENCES multas (identificador);

-- ---------------------------------------------------------------------
-- Facturas
-- ---------------------------------------------------------------------
CREATE TABLE facturas (
    identificador SERIAL PRIMARY KEY,
    pago_id       INT NOT NULL,
    numero        VARCHAR(50) NOT NULL UNIQUE,
    monto         DECIMAL(18, 2) NOT NULL,
    moneda        VARCHAR(10) NOT NULL,
    pdf_url       TEXT,
    issued_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_facturas_pagos FOREIGN KEY (pago_id) REFERENCES pagos (identificador) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Solicitudes de venta (flujo completo del swagger)
-- ---------------------------------------------------------------------
CREATE TABLE solicitudes_venta (
    identificador          SERIAL PRIMARY KEY,
    duenio_id              INT NOT NULL,
    producto_id            INT,                       -- se asigna cuando la empresa aprueba
    titulo                 VARCHAR(255) NOT NULL,
    descripcion            TEXT,
    historia               TEXT,
    declaracion_origen_url TEXT,
    estado                 VARCHAR(30) NOT NULL DEFAULT 'pending'
                           CHECK (estado IN ('pending', 'reviewing', 'rejected_by_company',
                                             'conditions_offered', 'accepted',
                                             'conditions_rejected', 'returning', 'returned')),
    -- Condiciones propuestas por la empresa
    precio_base            DECIMAL(18, 2),
    comision_porcentaje    DECIMAL(5, 2),
    moneda                 VARCHAR(10),
    condiciones_notas      TEXT,
    condiciones_offered_at TIMESTAMPTZ,
    -- Rechazo (empresa o vendedor)
    rechazo_motivo         TEXT,
    rechazo_por            VARCHAR(10) CHECK (rechazo_por IN ('company', 'user')),
    rechazo_at             TIMESTAMPTZ,
    -- Devolución
    return_amount          DECIMAL(18, 2),
    return_carrier         VARCHAR(150),
    return_eta             DATE,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_solicitudes_duenios   FOREIGN KEY (duenio_id)   REFERENCES duenios   (identificador) ON DELETE CASCADE,
    CONSTRAINT fk_solicitudes_productos FOREIGN KEY (producto_id) REFERENCES productos (identificador)
);

-- Imágenes de la solicitud (mín. 6 según el swagger; se persisten antes de tener `producto`)
CREATE TABLE sell_request_imagenes (
    identificador SERIAL PRIMARY KEY,
    solicitud_id  INT NOT NULL,
    url           TEXT NOT NULL,
    orden         INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_imagenes_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes_venta (identificador) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Favoritos
-- ---------------------------------------------------------------------
CREATE TABLE favoritos (
    cliente_id INT NOT NULL,
    item_id    INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (cliente_id, item_id),
    CONSTRAINT fk_favoritos_clientes      FOREIGN KEY (cliente_id) REFERENCES clientes      (identificador) ON DELETE CASCADE,
    CONSTRAINT fk_favoritos_itemscatalogo FOREIGN KEY (item_id)    REFERENCES itemscatalogo (identificador) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Notificaciones
-- ---------------------------------------------------------------------
CREATE TABLE notificaciones (
    identificador SERIAL PRIMARY KEY,
    cliente_id    INT NOT NULL,
    tipo          VARCHAR(50) NOT NULL,
    titulo        VARCHAR(255),
    mensaje       TEXT,
    metadata      JSONB,
    leida         BOOLEAN NOT NULL DEFAULT FALSE,
    leida_at      TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notificaciones_clientes FOREIGN KEY (cliente_id) REFERENCES clientes (identificador) ON DELETE CASCADE
);

CREATE TABLE notificaciones_settings (
    cliente_id        INT PRIMARY KEY,
    push_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
    auction_starting  BOOLEAN NOT NULL DEFAULT TRUE,
    bid_outbid        BOOLEAN NOT NULL DEFAULT TRUE,
    bid_won           BOOLEAN NOT NULL DEFAULT TRUE,
    payment_alerts    BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_notif_settings_clientes FOREIGN KEY (cliente_id) REFERENCES clientes (identificador) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Refresh tokens (para JWT refresh)
-- ---------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    token_hash  VARCHAR(255) PRIMARY KEY,
    cliente_id  INT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at  TIMESTAMPTZ,
    CONSTRAINT fk_refresh_clientes FOREIGN KEY (cliente_id) REFERENCES clientes (identificador) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Índices útiles
-- ---------------------------------------------------------------------
CREATE INDEX idx_notificaciones_cliente_leida ON notificaciones (cliente_id, leida);
CREATE INDEX idx_pagos_cliente_estado         ON pagos          (cliente_id, estado);
CREATE INDEX idx_multas_cliente_estado        ON multas         (cliente_id, estado);
CREATE INDEX idx_solicitudes_duenio_estado    ON solicitudes_venta (duenio_id, estado);
