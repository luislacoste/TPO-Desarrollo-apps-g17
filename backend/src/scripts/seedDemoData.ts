/**
 * Seed de datos demo para probar flujos end-to-end con el usuario admin.
 *
 * Carga datos idempotentes para:
 * - subastas (upcoming + cerrada)
 * - catalogos/items/productos
 * - asistentes + pujos + registro de subasta (metricas)
 * - medios de pago
 * - pagos + factura
 * - notificaciones + favoritos
 *
 * Requiere haber corrido antes:
 *   npm run db:reset
 *   npm run seed:admin
 */
import { pool } from '../db';

const IDS = {
  adminClienteId: 1,
  verifierEmpleadoId: 1,

  auctioneerPersonaId: 110,
  ownerPersonaId: 120,
  bidderPersonaId: 130,

  bidderClienteId: 130,
  ownerId: 120,
  auctioneerId: 110,

  subastaUpcomingId: 5002,
  subastaClosedId: 5003,
  subastaRacingBocaId: 5004,

  catalogoUpcomingId: 6002,
  catalogoClosedId: 6003,
  catalogoRacingBocaId: 6004,

  productoUpcoming1: 1002,
  productoUpcoming2: 1003,
  productoClosed1: 1001,
  productoRacing: 1004,
  productoBoca: 1005,

  itemUpcoming1: 7002,
  itemUpcoming2: 7003,
  itemClosed1: 7001,
  itemRacing: 7004,
  itemBoca: 7005,

  asistAdminClosed: 8001,
  asistBidderClosed: 8002,

  pujoAdminClosed: 9001,
  pujoBidderClosed: 9002,

  registroWonAdmin: 9101,

  pagoPending: 9201,
  pagoCompleted: 9202,
  pagoOverdue: 9203,

  facturaCompleted: 9301,

  notif1: 9401,
  notif2: 9402,
  notif3: 9403,
  notif4: 9404,
};

async function bumpSerial(client: import('pg').PoolClient, table: string, column: string) {
  await client.query(
    `SELECT setval(
      pg_get_serial_sequence($1, $2),
      GREATEST((SELECT COALESCE(MAX(${column}), 1) FROM ${table}), 1)
    )`,
    [table, column],
  );
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const adminExists = await client.query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM clientes WHERE identificador = $1) AS exists`,
      [IDS.adminClienteId],
    );
    if (!adminExists.rows[0]?.exists) {
      throw new Error('No existe cliente admin (id=1). Corre primero: npm run seed:admin');
    }

    await client.query(
      `INSERT INTO personas (identificador, documento, nombre, direccion, estado)
       OVERRIDING SYSTEM VALUE
       VALUES
         ($1, '30100100', 'Marina Leclerc', 'Av. Libertador 100, CABA', 'activo'),
         ($2, '30900120', 'Coleccionista Federal SA', 'Rosario 450, Santa Fe', 'activo'),
         ($3, '32111222', 'Paula Bidder', 'Laprida 1200, CABA', 'activo')
       ON CONFLICT (identificador) DO UPDATE
         SET nombre = EXCLUDED.nombre,
             direccion = EXCLUDED.direccion,
             estado = EXCLUDED.estado`,
      [IDS.auctioneerPersonaId, IDS.ownerPersonaId, IDS.bidderPersonaId],
    );

    await client.query(
      `INSERT INTO subastadores (identificador, matricula, region)
       VALUES ($1, 'MAT-AR-0091', 'AMBA')
       ON CONFLICT (identificador) DO UPDATE
         SET matricula = EXCLUDED.matricula,
             region = EXCLUDED.region`,
      [IDS.auctioneerId],
    );

    await client.query(
      `INSERT INTO duenios (
         identificador,
         numeropais,
         verificacion_financiera,
         verificacion_judicial,
         calificacionriesgo,
         verificador
       )
       VALUES ($1, 32, 'si', 'si', 2, $2)
       ON CONFLICT (identificador) DO UPDATE
         SET numeropais = EXCLUDED.numeropais,
             verificacion_financiera = EXCLUDED.verificacion_financiera,
             verificacion_judicial = EXCLUDED.verificacion_judicial,
             calificacionriesgo = EXCLUDED.calificacionriesgo,
             verificador = EXCLUDED.verificador`,
      [IDS.ownerId, IDS.verifierEmpleadoId],
    );

    await client.query(
      `INSERT INTO clientes (identificador, numeropais, admitido, categoria, verificador)
       VALUES ($1, 32, 'si', 'oro', $2)
       ON CONFLICT (identificador) DO UPDATE
         SET numeropais = EXCLUDED.numeropais,
             admitido = EXCLUDED.admitido,
             categoria = EXCLUDED.categoria,
             verificador = EXCLUDED.verificador`,
      [IDS.bidderClienteId, IDS.verifierEmpleadoId],
    );

    await client.query(
      `INSERT INTO clientes_perfil (
         cliente_id, first_name, last_name, phone, domicilio, pais, document_verified
       )
       VALUES ($1, 'Paula', 'Bidder', '+54 11 4100-7788', 'Laprida 1200, CABA', 'Argentina', TRUE)
       ON CONFLICT (cliente_id) DO UPDATE
         SET first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name,
             phone = EXCLUDED.phone,
             domicilio = EXCLUDED.domicilio,
             pais = EXCLUDED.pais,
             document_verified = EXCLUDED.document_verified,
             updated_at = NOW()`,
      [IDS.bidderClienteId],
    );

    await client.query(
      `INSERT INTO clientes_admision (cliente_id, estado, notas, updated_by)
       VALUES
         ($1, 'approved', 'Aprobado para participar en demo', $2),
         ($3, 'approved', 'Aprobado para demo', $2)
       ON CONFLICT (cliente_id) DO UPDATE
         SET estado = EXCLUDED.estado,
             notas = EXCLUDED.notas,
             updated_by = EXCLUDED.updated_by,
             updated_at = NOW()`,
      [IDS.adminClienteId, IDS.verifierEmpleadoId, IDS.bidderClienteId],
    );

    await client.query(
      `INSERT INTO clientes_participacion (cliente_id, bids_blocked)
       VALUES ($1, FALSE), ($2, FALSE)
       ON CONFLICT (cliente_id) DO UPDATE
         SET bids_blocked = FALSE,
             bids_blocked_reason = NULL,
             bids_blocked_until = NULL,
             updated_at = NOW()`,
      [IDS.adminClienteId, IDS.bidderClienteId],
    );

    await client.query(
      `INSERT INTO seguros (nropoliza, compania, polizacombinada, importe)
       VALUES
         ('POL-DEMO-1001', 'La Proteccion SA', 'si', 250000),
         ('POL-DEMO-1002', 'La Proteccion SA', 'no', 140000),
         ('POL-DEMO-1003', 'Andes Seguros', 'no', 98000)
       ON CONFLICT (nropoliza) DO UPDATE
         SET compania = EXCLUDED.compania,
             polizacombinada = EXCLUDED.polizacombinada,
             importe = EXCLUDED.importe`,
    );

    await client.query(
      `INSERT INTO productos (
         identificador,
         fecha,
         disponible,
         descripcioncatalogo,
         descripcioncompleta,
         revisor,
         duenio,
         seguro
       )
       OVERRIDING SYSTEM VALUE
       VALUES
         ($1, CURRENT_DATE - INTERVAL '14 days', 'si', 'Reloj Omega Seamaster 1972', 'https://demo.subastar.local/docs/omega-seamaster', $4, $5, 'POL-DEMO-1001'),
         ($2, CURRENT_DATE - INTERVAL '9 days', 'si', 'Coleccion de monedas virreinales', 'https://demo.subastar.local/docs/monedas-virreinales', $4, $5, 'POL-DEMO-1002'),
         ($3, CURRENT_DATE - INTERVAL '3 days', 'si', 'Escultura en bronce siglo XX', 'https://demo.subastar.local/docs/escultura-bronce', $4, $5, 'POL-DEMO-1003'),
         ($6, CURRENT_DATE - INTERVAL '1 day', 'si', 'Camiseta Racing Club Temporada 2024', 'https://demo.subastar.local/docs/camiseta-racing', $4, $5, 'POL-DEMO-1001'),
         ($7, CURRENT_DATE - INTERVAL '1 day', 'si', 'Camiseta Boca Juniors Temporada 2024', 'https://demo.subastar.local/docs/camiseta-boca', $4, $5, 'POL-DEMO-1002')
       ON CONFLICT (identificador) DO UPDATE
         SET fecha = EXCLUDED.fecha,
             disponible = EXCLUDED.disponible,
             descripcioncatalogo = EXCLUDED.descripcioncatalogo,
             descripcioncompleta = EXCLUDED.descripcioncompleta,
             revisor = EXCLUDED.revisor,
             duenio = EXCLUDED.duenio,
             seguro = EXCLUDED.seguro`,
      [
        IDS.productoClosed1,
        IDS.productoUpcoming1,
        IDS.productoUpcoming2,
        IDS.verifierEmpleadoId,
        IDS.ownerId,
        IDS.productoRacing,
        IDS.productoBoca,
      ],
    );

    await client.query(`DELETE FROM pujos WHERE identificador IN ($1, $2)`, [IDS.pujoAdminClosed, IDS.pujoBidderClosed]);
    await client.query(`DELETE FROM asistentes WHERE identificador IN ($1, $2)`, [IDS.asistAdminClosed, IDS.asistBidderClosed]);
    await client.query(`DELETE FROM itemscatalogo WHERE identificador IN ($1, $2, $3, $4, $5)`, [IDS.itemClosed1, IDS.itemUpcoming1, IDS.itemUpcoming2, IDS.itemRacing, IDS.itemBoca]);
    await client.query(`DELETE FROM catalogos WHERE identificador IN ($1, $2, $3)`, [IDS.catalogoClosedId, IDS.catalogoUpcomingId, IDS.catalogoRacingBocaId]);
    await client.query(`DELETE FROM subastas WHERE identificador IN ($1, $2, $3)`, [IDS.subastaClosedId, IDS.subastaUpcomingId, IDS.subastaRacingBocaId]);

    await client.query(
      `INSERT INTO subastas (
         identificador,
         fecha,
         hora,
         estado,
         subastador,
         ubicacion,
         capacidadasistentes,
         tienedeposito,
         seguridadpropia,
         categoria,
         moneda
       )
       OVERRIDING SYSTEM VALUE
       VALUES
         ($1, CURRENT_DATE + INTERVAL '12 days', '19:30', 'abierta', $3, 'Salon Palermo - Pabellon Azul', 120, 'si', 'si', 'oro', 'USD'),
         ($2, CURRENT_DATE + INTERVAL '15 days', '18:00', 'cerrada', $3, 'Auditorio Centro - CABA', 90, 'si', 'no', 'plata', 'ARS'),
         ($4, CURRENT_DATE + INTERVAL '11 days', '20:00', 'abierta', $3, 'Subasta Futbol - CABA', 80, 'si', 'si', 'oro', 'ARS')`,
      [IDS.subastaUpcomingId, IDS.subastaClosedId, IDS.auctioneerId, IDS.subastaRacingBocaId],
    );

    await client.query(
      `INSERT INTO catalogos (identificador, descripcion, subasta, responsable)
       OVERRIDING SYSTEM VALUE
       VALUES
         ($1, 'Catalogo Demo Upcoming', $3, $4),
         ($2, 'Catalogo Demo Closed', $5, $4),
         ($6, 'Camisetas Futbol Argentino', $7, $4)`,
      [
        IDS.catalogoUpcomingId,
        IDS.catalogoClosedId,
        IDS.subastaUpcomingId,
        IDS.verifierEmpleadoId,
        IDS.subastaClosedId,
        IDS.catalogoRacingBocaId,
        IDS.subastaRacingBocaId,
      ],
    );

    await client.query(
      `INSERT INTO itemscatalogo (identificador, catalogo, producto, preciobase, comision, subastado)
       OVERRIDING SYSTEM VALUE
       VALUES
         ($1, $4, $7, 1800.00, 180.00, 'si'),
         ($2, $3, $5, 3500.00, 350.00, 'no'),
         ($6, $3, $8, 1200.00, 120.00, 'no'),
         ($9, $10, $11, 25000.00, 2500.00, 'no'),
         ($12, $10, $13, 22000.00, 2200.00, 'no')`,
      [
        IDS.itemClosed1,        // $1
        IDS.itemUpcoming1,      // $2
        IDS.catalogoUpcomingId, // $3
        IDS.catalogoClosedId,   // $4
        IDS.productoUpcoming1,  // $5
        IDS.itemUpcoming2,      // $6
        IDS.productoClosed1,    // $7
        IDS.productoUpcoming2,  // $8
        IDS.itemRacing,         // $9
        IDS.catalogoRacingBocaId, // $10
        IDS.productoRacing,     // $11
        IDS.itemBoca,           // $12
        IDS.productoBoca,       // $13
      ],
    );

    await client.query(
      `INSERT INTO asistentes (identificador, numeropostor, cliente, subasta)
       OVERRIDING SYSTEM VALUE
       VALUES
         ($1, 101, $3, $5),
         ($2, 205, $4, $5)`,
      [
        IDS.asistAdminClosed,
        IDS.asistBidderClosed,
        IDS.adminClienteId,
        IDS.bidderClienteId,
        IDS.subastaClosedId,
      ],
    );

    await client.query(
      `INSERT INTO pujos (identificador, asistente, item, importe, ganador)
       OVERRIDING SYSTEM VALUE
       VALUES
         ($1, $3, $5, 2100.00, 'si'),
         ($2, $4, $5, 1980.00, 'no')`,
      [
        IDS.pujoAdminClosed,
        IDS.pujoBidderClosed,
        IDS.asistAdminClosed,
        IDS.asistBidderClosed,
        IDS.itemClosed1,
      ],
    );

    await client.query(`DELETE FROM facturas WHERE identificador = $1`, [IDS.facturaCompleted]);
    await client.query(`DELETE FROM pagos WHERE identificador IN ($1, $2, $3)`, [IDS.pagoPending, IDS.pagoCompleted, IDS.pagoOverdue]);
    await client.query(`DELETE FROM registrodesubasta WHERE identificador = $1`, [IDS.registroWonAdmin]);

    await client.query(
      `INSERT INTO registrodesubasta (
         identificador,
         subasta,
         duenio,
         producto,
         cliente,
         importe,
         comision
       )
       OVERRIDING SYSTEM VALUE
       VALUES ($1, $2, $3, $4, $5, 2100.00, 180.00)`,
      [
        IDS.registroWonAdmin,
        IDS.subastaClosedId,
        IDS.ownerId,
        IDS.productoClosed1,
        IDS.adminClienteId,
      ],
    );

    await client.query(`DELETE FROM medios_pago WHERE cliente_id = $1`, [IDS.adminClienteId]);
    const cc = await client.query<{ id: number }>(
      `INSERT INTO medios_pago (
         cliente_id, tipo, verificado,
         cc_last4, cc_brand, cc_holder, cc_exp_month, cc_exp_year
       )
       VALUES ($1, 'credit_card', TRUE, '4242', 'Visa', 'Admin Sistema', 12, 2029)
       RETURNING identificador AS id`,
      [IDS.adminClienteId],
    );
    const bank = await client.query<{ id: number }>(
      `INSERT INTO medios_pago (
         cliente_id, tipo, verificado,
         bank_name, bank_cbu, bank_holder
       )
       VALUES ($1, 'bank_account', TRUE, 'Banco Nacion', '2850590940090418135201', 'Admin Sistema')
       RETURNING identificador AS id`,
      [IDS.adminClienteId],
    );
    await client.query(
      `INSERT INTO medios_pago (
         cliente_id, tipo, verificado,
         check_number, check_bank, check_amount, check_currency
       )
       VALUES ($1, 'certified_check', FALSE, 'CHK-2026-001', 'Banco Ciudad', 5000, 'ARS')`,
      [IDS.adminClienteId],
    );

    await client.query(
      `INSERT INTO pagos (
         identificador,
         registrodesubasta_id,
         cliente_id,
         monto,
         moneda,
         estado,
         medio_pago_id,
         due_date,
         paid_at,
         created_at
       )
       OVERRIDING SYSTEM VALUE
       VALUES
         ($1, NULL, $4, 1200.00, 'ARS', 'pending', NULL, CURRENT_DATE + INTERVAL '5 days', NULL, NOW() - INTERVAL '1 day'),
         ($2, $5, $4, 2280.00, 'ARS', 'completed', $6, CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '36 hours', NOW() - INTERVAL '4 days'),
         ($3, NULL, $4, 700.00, 'ARS', 'overdue', $7, CURRENT_DATE - INTERVAL '3 days', NULL, NOW() - INTERVAL '7 days')`,
      [
        IDS.pagoPending,
        IDS.pagoCompleted,
        IDS.pagoOverdue,
        IDS.adminClienteId,
        IDS.registroWonAdmin,
        cc.rows[0].id,
        bank.rows[0].id,
      ],
    );

    await client.query(
      `INSERT INTO facturas (identificador, pago_id, numero, monto, moneda, pdf_url, issued_at)
       OVERRIDING SYSTEM VALUE
       VALUES ($1, $2, 'FAC-DEMO-0001', 2280.00, 'ARS', 'https://demo.subastar.local/facturas/FAC-DEMO-0001.pdf', NOW() - INTERVAL '36 hours')`,
      [IDS.facturaCompleted, IDS.pagoCompleted],
    );

    await client.query(`DELETE FROM notificaciones WHERE cliente_id = $1`, [IDS.adminClienteId]);
    await client.query(
      `INSERT INTO notificaciones (
         identificador,
         cliente_id,
         tipo,
         titulo,
         mensaje,
         metadata,
         leida,
         leida_at,
         created_at
       )
       OVERRIDING SYSTEM VALUE
       VALUES
         ($1, $5, 'auction', 'Subasta proxima a iniciar', 'La subasta oro #5002 comienza en menos de 24 horas.', '{"auctionId":5002}', FALSE, NULL, NOW() - INTERVAL '2 hours'),
         ($2, $5, 'bid', 'Puja ganadora confirmada', 'Ganaste el lote del reloj Omega por ARS 2.100.', '{"auctionId":5003,"itemId":7001}', FALSE, NULL, NOW() - INTERVAL '4 hours'),
         ($3, $5, 'payment', 'Pago pendiente', 'Tenes un pago pendiente con vencimiento en 5 dias.', '{"paymentId":9201}', FALSE, NULL, NOW() - INTERVAL '1 day'),
         ($4, $5, 'system', 'Perfil verificado', 'Tu perfil fue verificado por el administrador.', '{"scope":"profile"}', TRUE, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days')`,
      [IDS.notif1, IDS.notif2, IDS.notif3, IDS.notif4, IDS.adminClienteId],
    );

    await client.query(
      `INSERT INTO notificaciones_settings (
         cliente_id,
         push_enabled,
         email_enabled,
         auction_starting,
         bid_outbid,
         bid_won,
         payment_alerts
       )
       VALUES ($1, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE)
       ON CONFLICT (cliente_id) DO UPDATE
         SET push_enabled = EXCLUDED.push_enabled,
             email_enabled = EXCLUDED.email_enabled,
             auction_starting = EXCLUDED.auction_starting,
             bid_outbid = EXCLUDED.bid_outbid,
             bid_won = EXCLUDED.bid_won,
             payment_alerts = EXCLUDED.payment_alerts`,
      [IDS.adminClienteId],
    );

    await client.query(`DELETE FROM favoritos WHERE cliente_id = $1`, [IDS.adminClienteId]);
    await client.query(
      `INSERT INTO favoritos (cliente_id, item_id)
       VALUES ($1, $2), ($1, $3)
       ON CONFLICT (cliente_id, item_id) DO NOTHING`,
      [IDS.adminClienteId, IDS.itemUpcoming1, IDS.itemClosed1],
    );

    await bumpSerial(client, 'personas', 'identificador');
    await bumpSerial(client, 'subastas', 'identificador');
    await bumpSerial(client, 'productos', 'identificador');
    await bumpSerial(client, 'catalogos', 'identificador');
    await bumpSerial(client, 'itemscatalogo', 'identificador');
    await bumpSerial(client, 'asistentes', 'identificador');
    await bumpSerial(client, 'pujos', 'identificador');
    await bumpSerial(client, 'registrodesubasta', 'identificador');
    await bumpSerial(client, 'medios_pago', 'identificador');
    await bumpSerial(client, 'pagos', 'identificador');
    await bumpSerial(client, 'facturas', 'identificador');
    await bumpSerial(client, 'notificaciones', 'identificador');

    await client.query('COMMIT');
    console.log('[seed:demo] OK. Datos demo cargados para admin (auctions, notifications, payment methods, payments).');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed:demo] error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
