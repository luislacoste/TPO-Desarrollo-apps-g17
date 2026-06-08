/**
 * Crea (o actualiza) el usuario admin del sistema.
 *
 * Uso:
 *   npm run seed:admin                    → usa defaults
 *   ADMIN_EMAIL=x ADMIN_PASSWORD=y npm run seed:admin
 *
 * Pre-condición: ya se aplicaron `db/schema.sql`, `db/schema_complemento.sql`
 * y `db/seed.sql` (que crea persona/empleado id=1).
 */
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { pool } from '../db';
import { hashPassword } from '../services/hash';

async function main() {
  const email    = process.env.ADMIN_EMAIL    ?? 'admin@subastar.local';
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';

  console.log(`[seed:admin] email=${email}`);
  const passwordHash = await hashPassword(password);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Cliente shell (id=1, apuntando a la persona del seed.sql).
    await client.query(
      `INSERT INTO clientes (identificador, numeropais, admitido, categoria, verificador)
       VALUES (1, 32, 'si', 'platino', 1)
       ON CONFLICT (identificador) DO NOTHING`,
    );

    // Perfil
    await client.query(
      `INSERT INTO clientes_perfil (cliente_id, first_name, last_name, domicilio, pais, document_verified)
       VALUES (1, 'Admin', 'Sistema', 'N/A', 'Argentina', TRUE)
       ON CONFLICT (cliente_id) DO NOTHING`,
    );

    // Admisión approved
    await client.query(
      `INSERT INTO clientes_admision (cliente_id, estado, updated_by)
       VALUES (1, 'approved', 1)
       ON CONFLICT (cliente_id) DO UPDATE
         SET estado = 'approved', updated_at = NOW()`,
    );

    // Credenciales (upsert)
    await client.query(
      `INSERT INTO clientes_credenciales (cliente_id, email, password_hash, role)
       VALUES (1, $1, $2, 'admin')
       ON CONFLICT (cliente_id) DO UPDATE
         SET email = EXCLUDED.email,
             password_hash = EXCLUDED.password_hash,
             role = 'admin'`,
      [email, passwordHash],
    );

    await client.query('COMMIT');
    console.log(`[seed:admin] OK. Usuario admin creado/actualizado.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed:admin] error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
