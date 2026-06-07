-- =====================================================================
-- SubastAR — Seed mínimo
-- =====================================================================
-- Datos base necesarios para que la app levante y los registros nuevos
-- de clientes puedan respetar las FKs obligatorias del enunciado:
--   * paises (al menos uno, para `clientes.numeropais`)
--   * sectores (para `empleados.sector`)
--   * empleados (para `clientes.verificador` y `productos.revisor`,
--     que son NOT NULL)
--
-- Aplicar después de `schema.sql` + `schema_complemento.sql`.
-- =====================================================================

-- Paises de prueba (mínimo Argentina). Numero según ISO 3166-1 numeric.
INSERT INTO paises (numero, nombre, nombrecorto, capital, nacionalidad, idiomas) VALUES
    (32, 'Argentina', 'AR', 'Buenos Aires', 'argentina',  'es'),
    (76, 'Brasil',    'BR', 'Brasilia',     'brasileña',  'pt'),
    (152, 'Chile',    'CL', 'Santiago',     'chilena',    'es'),
    (858, 'Uruguay',  'UY', 'Montevideo',   'uruguaya',   'es')
ON CONFLICT (numero) DO NOTHING;

-- Persona de sistema (id = 1) que sirve de empleado/admin operativo.
INSERT INTO personas (identificador, documento, nombre, direccion, estado)
OVERRIDING SYSTEM VALUE
VALUES (1, '00000000', 'Admin del Sistema', 'N/A', 'activo')
ON CONFLICT (identificador) DO NOTHING;

-- Resetear secuencia para que los próximos inserts no choquen con el id=1.
SELECT setval(pg_get_serial_sequence('personas', 'identificador'),
              GREATEST((SELECT MAX(identificador) FROM personas), 1));

-- Sector de sistemas (placeholder).
INSERT INTO sectores (identificador, nombresector, codigosector)
OVERRIDING SYSTEM VALUE
VALUES (1, 'Sistemas', 'SYS')
ON CONFLICT (identificador) DO NOTHING;

SELECT setval(pg_get_serial_sequence('sectores', 'identificador'),
              GREATEST((SELECT MAX(identificador) FROM sectores), 1));

-- Empleado admin (id = 1). Sirve de `verificador` por defecto en los
-- registros de clientes hasta que un admin humano apruebe / asigne otro.
INSERT INTO empleados (identificador, cargo, sector) VALUES
    (1, 'Administrador', 1)
ON CONFLICT (identificador) DO NOTHING;

-- Nota: el usuario admin para login (email + password con bcrypt) se
-- crea con `npm run seed:admin` desde `backend/`. Ese script inserta
-- `clientes` (id=1), `clientes_credenciales`, `clientes_perfil` y
-- `clientes_admision (approved)` usando bcrypt real para el password.
