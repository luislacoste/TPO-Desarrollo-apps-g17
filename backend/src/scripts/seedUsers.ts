/**
 * Crea (o actualiza) cuentas de usuario de prueba, listas para usar:
 * aprobadas (admisión `approved`), con las condiciones de la empresa
 * aceptadas y con password seteado (pueden loguear y participar).
 *
 * Uso:  npm run seed:users
 *
 * Pre-condición: ya se aplicaron los schemas + `db/seed.sql` y `seed:admin`
 * (que crea el empleado id=1 usado como verificador / updated_by).
 */
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { pool } from '../db';
import { hashPassword } from '../services/hash';

const PASSWORD  = '123QWE!@#';
const CATEGORIA = 'platino';          // máxima: pueden participar en cualquier subasta
const NUMEROPAIS = 32;                // Argentina (igual que el admin del seed)

const USERS = [
  { id: 2001, email: 'luis@gmail.com', firstName: 'Luis', lastName: 'Demo', documento: '40000001' },
  { id: 2002, email: 'test@gmail.com', firstName: 'Test', lastName: 'Demo', documento: '40000002' },
];

async function main() {
  console.log('[seed:users] creando cuentas de prueba (aprobadas + condiciones aceptadas)');
  const passwordHash = await hashPassword(PASSWORD);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const u of USERS) {
      // Persona
      await client.query(
        `INSERT INTO personas (identificador, documento, nombre, direccion, estado)
         VALUES ($1, $2, $3, 'N/A', 'activo')
         ON CONFLICT (identificador) DO UPDATE
           SET documento = EXCLUDED.documento, nombre = EXCLUDED.nombre`,
        [u.id, u.documento, `${u.firstName} ${u.lastName}`],
      );

      // Cliente (admitido + categoría)
      await client.query(
        `INSERT INTO clientes (identificador, numeropais, admitido, categoria, verificador)
         VALUES ($1, $2, 'si', $3, 1)
         ON CONFLICT (identificador) DO UPDATE
           SET admitido = 'si', categoria = EXCLUDED.categoria`,
        [u.id, NUMEROPAIS, CATEGORIA],
      );

      // Perfil con condiciones aceptadas
      await client.query(
        `INSERT INTO clientes_perfil
           (cliente_id, first_name, last_name, domicilio, pais, document_verified, conditions_accepted_at)
         VALUES ($1, $2, $3, 'Calle Falsa 123', 'Argentina', TRUE, NOW())
         ON CONFLICT (cliente_id) DO UPDATE
           SET first_name = EXCLUDED.first_name,
               last_name  = EXCLUDED.last_name,
               document_verified = TRUE,
               conditions_accepted_at = NOW()`,
        [u.id, u.firstName, u.lastName],
      );

      // Admisión approved
      await client.query(
        `INSERT INTO clientes_admision (cliente_id, estado, updated_by)
         VALUES ($1, 'approved', 1)
         ON CONFLICT (cliente_id) DO UPDATE
           SET estado = 'approved', updated_at = NOW()`,
        [u.id],
      );

      // Participación (no bloqueada)
      await client.query(
        `INSERT INTO clientes_participacion (cliente_id, bids_blocked)
         VALUES ($1, FALSE)
         ON CONFLICT (cliente_id) DO NOTHING`,
        [u.id],
      );

      // Credenciales (con password → pueden loguear)
      await client.query(
        `INSERT INTO clientes_credenciales (cliente_id, email, password_hash, role)
         VALUES ($1, $2, $3, 'user')
         ON CONFLICT (cliente_id) DO UPDATE
           SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash`,
        [u.id, u.email, passwordHash],
      );

      // Medio de pago VERIFICADO (requisito para unirse / pujar)
      await client.query(
        `INSERT INTO medios_pago
           (identificador, cliente_id, tipo, verificado, bank_name, bank_cbu, bank_holder)
         VALUES ($1, $2, 'bank_account', TRUE, 'Banco Demo', $3, $4)
         ON CONFLICT (identificador) DO NOTHING`,
        [9500 + (u.id - 2000), u.id, String(u.id).padStart(22, '0'), `${u.firstName} ${u.lastName}`],
      );

      console.log(`[seed:users]  ✓ ${u.email} (cliente ${u.id}, ${CATEGORIA}, medio de pago verificado)`);
    }

    // ── test@gmail.com publica 1 subasta con 3 ítems (camisetas) ──────
    const SELLER = 2002; // test@gmail.com
    // test pasa a ser dueño (necesario para que sus productos referencien duenios)
    await client.query(
      `INSERT INTO duenios
         (identificador, numeropais, verificacion_financiera, verificacion_judicial, calificacionriesgo, verificador)
       VALUES ($1, $2, 'si', 'si', 5, 1)
       ON CONFLICT (identificador) DO NOTHING`,
      [SELLER, NUMEROPAIS],
    );

    const PRODUCTS = [
      { id: 9301, item: 9401, desc: 'Camiseta de Racing Club',  precio: 15000 },
      { id: 9302, item: 9402, desc: 'Camiseta de River Plate',  precio: 18000 },
      { id: 9303, item: 9403, desc: 'Camiseta de Boca Juniors', precio: 17000 },
    ];

    for (const p of PRODUCTS) {
      await client.query(
        `INSERT INTO productos
           (identificador, fecha, disponible, descripcioncatalogo, descripcioncompleta, revisor, duenio)
         VALUES ($1, CURRENT_DATE, 'si', $2, $2, 1, $3)
         ON CONFLICT (identificador) DO NOTHING`,
        [p.id, p.desc, SELLER],
      );
    }

    // Martillero (subastador) para la subasta — persona + fila en subastadores.
    await client.query(
      `INSERT INTO personas (identificador, documento, nombre, direccion, estado)
       VALUES (9200, '30999888', 'Martillero Demo', 'N/A', 'activo')
       ON CONFLICT (identificador) DO NOTHING`,
    );
    await client.query(
      `INSERT INTO subastadores (identificador, matricula, region)
       VALUES (9200, 'MAT-DEMO-001', 'CABA')
       ON CONFLICT (identificador) DO NOTHING`,
    );

    // Subasta (abierta) + catálogo. Fecha futura para cumplir el CHECK (> hoy+10).
    await client.query(
      `INSERT INTO subastas
         (identificador, fecha, hora, estado, subastador, ubicacion, categoria, moneda)
       VALUES (9001, CURRENT_DATE + INTERVAL '15 days', '19:00', 'abierta', 9200,
               'Camisetas de fútbol - CABA', 'comun', 'ARS')
       ON CONFLICT (identificador) DO UPDATE SET subastador = EXCLUDED.subastador`,
    );
    await client.query(
      `INSERT INTO catalogos (identificador, descripcion, subasta, responsable)
       VALUES (9101, 'Camisetas históricas', 9001, 1)
       ON CONFLICT (identificador) DO NOTHING`,
    );

    for (const p of PRODUCTS) {
      await client.query(
        `INSERT INTO itemscatalogo (identificador, catalogo, producto, preciobase, comision, subastado)
         VALUES ($1, 9101, $2, $3, 10, 'no')
         ON CONFLICT (identificador) DO NOTHING`,
        [p.item, p.id, p.precio],
      );
    }
    console.log('[seed:users]  ✓ subasta #9001 de test con 3 camisetas (Racing/River/Boca)');

    await client.query('COMMIT');
    console.log('[seed:users] OK. Cuentas listas (password: 123QWE!@#).');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed:users] error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
