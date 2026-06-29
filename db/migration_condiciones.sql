-- =====================================================================
-- Migración: aceptación de condiciones de la empresa
--
-- Agrega la columna `conditions_accepted_at` a `clientes_perfil` para
-- registrar cuándo el cliente aceptó las condiciones de la empresa.
--
-- No destructivo. Aplicar sobre una base ya creada:
--   psql -U <user> -d subastar -f db/migration_condiciones.sql
-- =====================================================================

ALTER TABLE clientes_perfil
  ADD COLUMN IF NOT EXISTS conditions_accepted_at TIMESTAMPTZ;
