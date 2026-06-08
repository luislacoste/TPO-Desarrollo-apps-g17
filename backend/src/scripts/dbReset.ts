/**
 * Recrea la base de datos aplicando los .sql del repo.
 *
 * Uso:  npm run db:reset
 * Usa las mismas variables `DB_*` del `.env` (vía src/config/env).
 *
 * Orden:
 *   1. db/schema.sql              ← port del enunciado a PostgreSQL
 *   2. db/schema_complemento.sql  ← tablas adicionales del swagger
 *   3. db/seed.sql                ← datos base mínimos
 */
import fs from 'fs';
import path from 'path';
import { pool } from '../db';

const FILES = [
  '../../../db/schema.sql',
  '../../../db/schema_complemento.sql',
  '../../../db/seed.sql',
];

async function runFile(rel: string) {
  const abs = path.resolve(__dirname, rel);
  const sql = fs.readFileSync(abs, 'utf8');
  console.log(`[db:reset] aplicando ${path.basename(abs)} (${sql.split('\n').length} líneas)`);
  await pool.query(sql);
}

async function main() {
  try {
    for (const f of FILES) {
      await runFile(f);
    }
    console.log('[db:reset] OK');
  } catch (err) {
    console.error('[db:reset] error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
