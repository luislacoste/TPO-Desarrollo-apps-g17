/**
 * Inserta datos de prueba para que el test-all.sh tenga contra qué pegar:
 *   - martillero (persona+subastador)
 *   - dueño (persona+duenios)
 *   - subasta abierta en 15 días, bronce, ARS
 *   - producto + catálogo + ítem (precio base 10000)
 *
 * Idempotente: usa ON CONFLICT DO NOTHING / INSERT ... WHERE NOT EXISTS.
 *
 * Pre-condición: ya se aplicaron schema.sql + schema_complemento.sql + seed.sql.
 */
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { pool } from '../db';

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Limpiar pujas y asistentes previos del demo para que los tests de bids empiecen desde cero.
    await client.query(`
      DELETE FROM pujos
       WHERE item IN (
         SELECT ic.identificador
           FROM itemscatalogo ic
           JOIN catalogos c ON c.identificador = ic.catalogo
           JOIN subastas  s ON s.identificador = c.subasta
          WHERE s.subastador = 1000
       )
    `);
    await client.query(`
      DELETE FROM asistentes
       WHERE subasta IN (SELECT identificador FROM subastas WHERE subastador = 1000)
    `);

    // Martillero
    await client.query(`
      INSERT INTO personas (identificador, documento, nombre, direccion, estado)
      OVERRIDING SYSTEM VALUE
      VALUES (1000, '99999999', 'Martillero Demo', 'Av. Demo 123', 'activo')
      ON CONFLICT (identificador) DO NOTHING
    `);
    await client.query(`
      INSERT INTO subastadores (identificador, matricula, region)
      VALUES (1000, 'M-123', 'CABA')
      ON CONFLICT (identificador) DO NOTHING
    `);

    // Dueño
    await client.query(`
      INSERT INTO personas (identificador, documento, nombre, direccion, estado)
      OVERRIDING SYSTEM VALUE
      VALUES (1001, '88888888', 'Dueño Demo', 'Calle False 123', 'activo')
      ON CONFLICT (identificador) DO NOTHING
    `);
    await client.query(`
      INSERT INTO duenios (identificador, numeropais, verificacion_financiera, verificacion_judicial, calificacionriesgo, verificador)
      VALUES (1001, 32, 'si', 'si', 5, 1)
      ON CONFLICT (identificador) DO NOTHING
    `);

    // Asegurar que la secuencia de personas no choque después con SERIAL inserts.
    await client.query(`
      SELECT setval(pg_get_serial_sequence('personas', 'identificador'),
                    GREATEST((SELECT MAX(identificador) FROM personas), 1001))
    `);

    // Subasta — solo crear si no hay ninguna abierta de prueba todavía.
    await client.query(`
      INSERT INTO subastas (fecha, hora, estado, subastador, ubicacion, categoria, moneda)
      SELECT CURRENT_DATE + INTERVAL '15 days', '14:00', 'abierta', 1000, 'Salón Demo', 'bronce', 'ARS'
      WHERE NOT EXISTS (SELECT 1 FROM subastas WHERE subastador = 1000 AND estado = 'abierta')
    `);

    // Producto demo: siempre el "Juego de té" (identificado por su descripción).
    await client.query(`
      INSERT INTO productos (fecha, disponible, descripcioncompleta, revisor, duenio)
      SELECT CURRENT_DATE, 'si', 'Juego de té de 18 piezas — pieza demo', 1, 1001
      WHERE NOT EXISTS (
        SELECT 1 FROM productos
         WHERE duenio = 1001
           AND descripcioncompleta = 'Juego de té de 18 piezas — pieza demo'
      )
    `);

    // Catálogo asociado a la subasta demo.
    await client.query(`
      INSERT INTO catalogos (descripcion, subasta, responsable)
      SELECT 'Catálogo demo', s.identificador, 1
        FROM subastas s
       WHERE s.subastador = 1000 AND s.estado = 'abierta'
         AND NOT EXISTS (SELECT 1 FROM catalogos c WHERE c.subasta = s.identificador)
       LIMIT 1
    `);

    // Ítem del catálogo demo (precio base 10000) usando el producto demo específico.
    await client.query(`
      INSERT INTO itemscatalogo (catalogo, producto, preciobase, comision, subastado)
      SELECT c.identificador, p.identificador, 10000.00, 1000.00, 'no'
        FROM catalogos c
        JOIN subastas  s ON s.identificador = c.subasta
        JOIN productos p ON p.duenio = 1001
                        AND p.descripcioncompleta = 'Juego de té de 18 piezas — pieza demo'
       WHERE s.subastador = 1000 AND s.estado = 'abierta'
         AND NOT EXISTS (
           SELECT 1 FROM itemscatalogo ic
            WHERE ic.catalogo = c.identificador AND ic.producto = p.identificador
         )
       LIMIT 1
    `);

    await client.query('COMMIT');

    // Mostrar los IDs creados para que test-all.sh los lea.
    // Filtra por el producto demo específico para evitar devolver ítems de otro precio.
    const { rows: ids } = await client.query<{
      subasta_id: number; producto_id: number; catalogo_id: number; item_id: number;
    }>(`
      SELECT s.identificador AS subasta_id,
             p.identificador AS producto_id,
             c.identificador AS catalogo_id,
             ic.identificador AS item_id
        FROM subastas s
        JOIN catalogos c ON c.subasta = s.identificador
        JOIN itemscatalogo ic ON ic.catalogo = c.identificador
        JOIN productos p ON p.identificador = ic.producto
       WHERE s.subastador = 1000 AND s.estado = 'abierta'
         AND p.descripcioncompleta = 'Juego de té de 18 piezas — pieza demo'
         AND ic.preciobase = 10000.00
       ORDER BY s.identificador DESC LIMIT 1
    `);

    if (ids[0]) {
      console.log(JSON.stringify({
        ok: true,
        subastaId: ids[0].subasta_id,
        productoId: ids[0].producto_id,
        catalogoId: ids[0].catalogo_id,
        itemId: ids[0].item_id,
      }));
    } else {
      console.log(JSON.stringify({ ok: true }));
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed:test] error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
