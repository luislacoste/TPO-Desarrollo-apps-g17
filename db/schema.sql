-- =====================================================================
-- SubastAR — Schema base en PostgreSQL
-- =====================================================================
-- Esta es la traducción a PostgreSQL del archivo `EstructuraActual.sql`
-- (que está en SQL Server, sintaxis original del enunciado del TP).
--
-- Cambios respecto al original:
--   * Sintaxis MSSQL → PostgreSQL (`identity` → `GENERATED`, `varbinary(max)` → `BYTEA`,
--     `getdate()` → `NOW()`, `dateAdd(...)` → `INTERVAL`, sin `go`).
--   * Typos corregidos: `incativo` → `inactivo`, `carrada` → `cerrada`,
--     `verificaci?nFinanciera/Judicial` → `verificacion_financiera/judicial`,
--     `varchar(30) not null.` → `,`.
--   * Enum `categoria`: comun/especial/plata/oro/platino (determina a qué subastas accede el cliente).
--   * Identificadores en minúscula (PG los pliega así por defecto).
-- =====================================================================

DROP TABLE IF EXISTS registrodesubasta CASCADE;
DROP TABLE IF EXISTS pujos CASCADE;
DROP TABLE IF EXISTS asistentes CASCADE;
DROP TABLE IF EXISTS itemscatalogo CASCADE;
DROP TABLE IF EXISTS catalogos CASCADE;
DROP TABLE IF EXISTS fotos CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS subastas CASCADE;
DROP TABLE IF EXISTS subastadores CASCADE;
DROP TABLE IF EXISTS duenios CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS seguros CASCADE;
DROP TABLE IF EXISTS sectores CASCADE;
DROP TABLE IF EXISTS empleados CASCADE;
DROP TABLE IF EXISTS personas CASCADE;
DROP TABLE IF EXISTS paises CASCADE;

-- ---------------------------------------------------------------------
-- Paises
-- ---------------------------------------------------------------------
CREATE TABLE paises (
    numero        INT          NOT NULL,
    nombre        VARCHAR(250) NOT NULL,
    nombrecorto   VARCHAR(250),
    capital       VARCHAR(250) NOT NULL,
    nacionalidad  VARCHAR(250) NOT NULL,
    idiomas       VARCHAR(150) NOT NULL,
    CONSTRAINT pk_paises PRIMARY KEY (numero)
);

-- ---------------------------------------------------------------------
-- Personas
-- ---------------------------------------------------------------------
CREATE TABLE personas (
    identificador SERIAL PRIMARY KEY,
    documento     VARCHAR(20)  NOT NULL,
    nombre        VARCHAR(150) NOT NULL,
    direccion     VARCHAR(250),
    estado        VARCHAR(15)  CHECK (estado IN ('activo', 'inactivo')),
    foto          BYTEA
);

-- ---------------------------------------------------------------------
-- Empleados
-- ---------------------------------------------------------------------
CREATE TABLE empleados (
    identificador INT NOT NULL,
    cargo         VARCHAR(100),
    sector        INT,
    CONSTRAINT pk_empleados PRIMARY KEY (identificador),
    CONSTRAINT fk_empleados_personas FOREIGN KEY (identificador) REFERENCES personas (identificador)
);

-- ---------------------------------------------------------------------
-- Sectores
-- ---------------------------------------------------------------------
CREATE TABLE sectores (
    identificador      SERIAL PRIMARY KEY,
    nombresector       VARCHAR(150) NOT NULL,
    codigosector       VARCHAR(10),
    responsablesector  INT,
    CONSTRAINT fk_sectores_empleados FOREIGN KEY (responsablesector) REFERENCES empleados (identificador)
);

ALTER TABLE empleados
    ADD CONSTRAINT fk_empleados_sectores FOREIGN KEY (sector) REFERENCES sectores (identificador);

-- ---------------------------------------------------------------------
-- Seguros
-- ---------------------------------------------------------------------
CREATE TABLE seguros (
    nropoliza         VARCHAR(30)    NOT NULL,
    compania          VARCHAR(150)   NOT NULL,
    polizacombinada   VARCHAR(2)     CHECK (polizacombinada IN ('si', 'no')),
    importe           DECIMAL(18, 2) NOT NULL CHECK (importe > 0),
    CONSTRAINT pk_seguro PRIMARY KEY (nropoliza)
);

-- ---------------------------------------------------------------------
-- Clientes
-- ---------------------------------------------------------------------
CREATE TABLE clientes (
    identificador INT         NOT NULL,
    numeropais    INT,
    admitido      VARCHAR(2)  CHECK (admitido IN ('si', 'no')),
    categoria     VARCHAR(10) CHECK (categoria IN ('comun', 'especial', 'plata', 'oro', 'platino')),
    verificador   INT         NOT NULL,
    CONSTRAINT pk_clientes        PRIMARY KEY (identificador),
    CONSTRAINT fk_clientes_personas  FOREIGN KEY (identificador) REFERENCES personas (identificador),
    CONSTRAINT fk_clientes_empleados FOREIGN KEY (verificador)   REFERENCES empleados (identificador),
    CONSTRAINT fk_clientes_paises    FOREIGN KEY (numeropais)    REFERENCES paises (numero)
);

-- ---------------------------------------------------------------------
-- Dueños
-- ---------------------------------------------------------------------
CREATE TABLE duenios (
    identificador          INT NOT NULL,
    numeropais             INT,
    verificacion_financiera VARCHAR(2) CHECK (verificacion_financiera IN ('si', 'no')),
    verificacion_judicial   VARCHAR(2) CHECK (verificacion_judicial   IN ('si', 'no')),
    calificacionriesgo     INT CHECK (calificacionriesgo IN (1, 2, 3, 4, 5, 6)),
    verificador            INT NOT NULL,
    CONSTRAINT pk_duenios          PRIMARY KEY (identificador),
    CONSTRAINT fk_duenios_personas FOREIGN KEY (identificador) REFERENCES personas (identificador),
    CONSTRAINT fk_duenios_empleados FOREIGN KEY (verificador)  REFERENCES empleados (identificador),
    CONSTRAINT fk_duenios_paises    FOREIGN KEY (numeropais)   REFERENCES paises (numero)
);

-- ---------------------------------------------------------------------
-- Subastadores
-- ---------------------------------------------------------------------
CREATE TABLE subastadores (
    identificador INT NOT NULL,
    matricula     VARCHAR(15),
    region        VARCHAR(50),
    CONSTRAINT pk_subastadores PRIMARY KEY (identificador),
    CONSTRAINT fk_subastadores_personas FOREIGN KEY (identificador) REFERENCES personas (identificador)
);

-- ---------------------------------------------------------------------
-- Subastas
-- ---------------------------------------------------------------------
CREATE TABLE subastas (
    identificador      SERIAL PRIMARY KEY,
    -- Las subastas tienen al menos 10 días de anticipación al momento de crearlas.
    fecha              DATE        CHECK (fecha > CURRENT_DATE + INTERVAL '10 days'),
    hora               TIME NOT NULL,
    estado             VARCHAR(10) CHECK (estado IN ('abierta', 'cerrada')),
    subastador         INT,
    -- Dirección del evento.
    ubicacion          VARCHAR(350),
    capacidadasistentes INT,
    -- Características del lugar.
    tienedeposito      VARCHAR(2) CHECK (tienedeposito IN ('si', 'no')),
    seguridadpropia    VARCHAR(2) CHECK (seguridadpropia IN ('si', 'no')),
    categoria          VARCHAR(10) CHECK (categoria IN ('comun', 'especial', 'plata', 'oro', 'platino')),
    -- Una subasta no puede ser bimonetaria. Default ARS para compatibilidad.
    moneda             VARCHAR(10) NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD')),
    CONSTRAINT fk_subastas_subastadores FOREIGN KEY (subastador) REFERENCES subastadores (identificador)
);

-- ---------------------------------------------------------------------
-- Productos
-- ---------------------------------------------------------------------
CREATE TABLE productos (
    identificador        SERIAL PRIMARY KEY,
    fecha                DATE,
    disponible           VARCHAR(2)   CHECK (disponible IN ('si', 'no')),
    -- Se obtiene después de la revisión del empleado.
    descripcioncatalogo  VARCHAR(500) DEFAULT 'No Posee',
    -- URL al PDF firmado con la descripción completa.
    descripcioncompleta  VARCHAR(300) NOT NULL,
    revisor              INT NOT NULL,
    duenio               INT NOT NULL,
    seguro               VARCHAR(30),
    CONSTRAINT fk_productos_empleados FOREIGN KEY (revisor) REFERENCES empleados (identificador),
    CONSTRAINT fk_productos_duenios   FOREIGN KEY (duenio)  REFERENCES duenios   (identificador),
    CONSTRAINT fk_productos_seguros   FOREIGN KEY (seguro)  REFERENCES seguros   (nropoliza)
);

-- ---------------------------------------------------------------------
-- Fotos (de productos)
-- ---------------------------------------------------------------------
CREATE TABLE fotos (
    identificador SERIAL PRIMARY KEY,
    producto      INT   NOT NULL,
    foto          BYTEA NOT NULL,
    CONSTRAINT fk_fotos_productos FOREIGN KEY (producto) REFERENCES productos (identificador)
);

-- ---------------------------------------------------------------------
-- Catálogos
-- ---------------------------------------------------------------------
CREATE TABLE catalogos (
    identificador SERIAL PRIMARY KEY,
    descripcion   VARCHAR(250) NOT NULL,
    subasta       INT,
    responsable   INT NOT NULL,
    CONSTRAINT fk_catalogos_empleados FOREIGN KEY (responsable) REFERENCES empleados (identificador),
    CONSTRAINT fk_catalogos_subastas  FOREIGN KEY (subasta)     REFERENCES subastas  (identificador)
);

-- ---------------------------------------------------------------------
-- Items del catálogo
-- ---------------------------------------------------------------------
CREATE TABLE itemscatalogo (
    identificador SERIAL PRIMARY KEY,
    catalogo      INT NOT NULL,
    producto      INT NOT NULL,
    preciobase    DECIMAL(18, 2) NOT NULL CHECK (preciobase > 0.01),
    comision      DECIMAL(18, 2) NOT NULL CHECK (comision   > 0.01),
    subastado     VARCHAR(2) CHECK (subastado IN ('si', 'no')),
    CONSTRAINT fk_itemscatalogo_catalogos FOREIGN KEY (catalogo) REFERENCES catalogos (identificador),
    CONSTRAINT fk_itemscatalogo_productos FOREIGN KEY (producto) REFERENCES productos (identificador)
);

-- ---------------------------------------------------------------------
-- Asistentes a la subasta
-- ---------------------------------------------------------------------
CREATE TABLE asistentes (
    identificador SERIAL PRIMARY KEY,
    numeropostor  INT NOT NULL,
    cliente       INT NOT NULL,
    subasta       INT NOT NULL,
    CONSTRAINT fk_asistentes_clientes FOREIGN KEY (cliente) REFERENCES clientes (identificador),
    CONSTRAINT fk_asistentes_subasta  FOREIGN KEY (subasta) REFERENCES subastas (identificador)
);

-- ---------------------------------------------------------------------
-- Pujos
-- ---------------------------------------------------------------------
CREATE TABLE pujos (
    identificador SERIAL PRIMARY KEY,
    asistente     INT NOT NULL,
    item          INT NOT NULL,
    importe       DECIMAL(18, 2) NOT NULL CHECK (importe > 0.01),
    ganador       VARCHAR(2) CHECK (ganador IN ('si', 'no')) DEFAULT 'no',
    CONSTRAINT fk_pujos_asistentes     FOREIGN KEY (asistente) REFERENCES asistentes    (identificador),
    CONSTRAINT fk_pujos_itemscatalogo  FOREIGN KEY (item)      REFERENCES itemscatalogo (identificador)
);

-- ---------------------------------------------------------------------
-- Registro de subasta
-- ---------------------------------------------------------------------
CREATE TABLE registrodesubasta (
    identificador SERIAL PRIMARY KEY,
    subasta       INT NOT NULL,
    duenio        INT NOT NULL,
    producto      INT NOT NULL,
    cliente       INT NOT NULL,
    importe       DECIMAL(18, 2) NOT NULL CHECK (importe  > 0.01),
    comision      DECIMAL(18, 2) NOT NULL CHECK (comision > 0.01),
    CONSTRAINT fk_registrodesubasta_subastas  FOREIGN KEY (subasta)  REFERENCES subastas  (identificador),
    CONSTRAINT fk_registrodesubasta_duenios   FOREIGN KEY (duenio)   REFERENCES duenios   (identificador),
    CONSTRAINT fk_registrodesubasta_producto  FOREIGN KEY (producto) REFERENCES productos (identificador),
    CONSTRAINT fk_registrodesubasta_cliente   FOREIGN KEY (cliente)  REFERENCES clientes  (identificador)
);
