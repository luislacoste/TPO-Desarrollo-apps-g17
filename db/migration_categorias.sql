-- =====================================================================
-- Migración: categorías común/especial/plata/oro/platino
--
-- Actualiza el CHECK de `categoria` en `clientes` y `subastas` del set
-- viejo (bronce/plata/oro/platino) al nuevo (comun/especial/plata/oro/
-- platino). Migra los datos 'bronce' existentes a 'comun'.
--
-- No destructivo. Aplicar sobre una base ya creada:
--   psql -U <user> -d subastar -f db/migration_categorias.sql
-- =====================================================================

BEGIN;

-- ── clientes ─────────────────────────────────────────────────────────
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_categoria_check;
UPDATE clientes SET categoria = 'comun' WHERE categoria = 'bronce';
ALTER TABLE clientes ADD CONSTRAINT clientes_categoria_check
  CHECK (categoria IN ('comun', 'especial', 'plata', 'oro', 'platino'));

-- ── subastas ─────────────────────────────────────────────────────────
-- `subastas_fecha_check` es NOT VALID (permite subastas históricas con
-- fecha pasada). Como un UPDATE re-evalúa esa fila, lo soltamos para poder
-- migrar la categoría de subastas viejas y lo recreamos igual (NOT VALID).
ALTER TABLE subastas DROP CONSTRAINT IF EXISTS subastas_categoria_check;
ALTER TABLE subastas DROP CONSTRAINT IF EXISTS subastas_fecha_check;

UPDATE subastas SET categoria = 'comun' WHERE categoria = 'bronce';

ALTER TABLE subastas ADD CONSTRAINT subastas_categoria_check
  CHECK (categoria IN ('comun', 'especial', 'plata', 'oro', 'platino'));
ALTER TABLE subastas ADD CONSTRAINT subastas_fecha_check
  CHECK (fecha > CURRENT_DATE + INTERVAL '10 days') NOT VALID;

COMMIT;
