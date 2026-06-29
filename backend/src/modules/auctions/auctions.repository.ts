/**
 * Queries SQL del módulo Auctions.
 *
 * Une `subastas` (tabla del enunciado) con `subastadores` + `personas`
 * para devolver el nombre del subastador, y cuenta los ítems del
 * catálogo asociado.
 */
import { query } from '../../db';

export interface SubastaRow {
  id: number;
  fecha: string;
  hora: string;
  estado: 'abierta' | 'cerrada';
  ubicacion: string | null;
  capacidad_asistentes: number | null;
  tiene_deposito: 'si' | 'no' | null;
  seguridad_propia: 'si' | 'no' | null;
  categoria: 'comun' | 'especial' | 'plata' | 'oro' | 'platino' | null;
  moneda: 'ARS' | 'USD';
  subastador_id: number | null;
  subastador_nombre: string | null;
  items_count: number;
}

export interface CatalogItemRow {
  item_id: number;
  catalogo_id: number;
  producto_id: number;
  precio_base: string;        // numeric ⇒ string en pg
  comision: string;
  subastado: 'si' | 'no' | null;
  descripcion_catalogo: string | null;
  fotos_count: number;
}

interface ListFilters {
  status?: 'abierta' | 'cerrada';
  category?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page: number;
  limit: number;
}

const BASE_SELECT = `
  SELECT s.identificador          AS id,
         s.fecha,
         s.hora,
         s.estado,
         s.ubicacion,
         s.capacidadasistentes    AS capacidad_asistentes,
         s.tienedeposito          AS tiene_deposito,
         s.seguridadpropia        AS seguridad_propia,
         s.categoria,
         s.moneda,
         sub.identificador        AS subastador_id,
         p.nombre                 AS subastador_nombre,
         (SELECT COUNT(*)::int
            FROM catalogos c
            JOIN itemscatalogo ic ON ic.catalogo = c.identificador
           WHERE c.subasta = s.identificador) AS items_count
    FROM subastas s
    LEFT JOIN subastadores sub ON sub.identificador = s.subastador
    LEFT JOIN personas     p   ON p.identificador   = sub.identificador
`;

export async function listSubastas(f: ListFilters) {
  const where: string[] = [];
  const params: unknown[] = [];
  let i = 0;

  if (f.status)     { where.push(`s.estado    = $${++i}`); params.push(f.status); }
  if (f.category)   { where.push(`s.categoria = $${++i}`); params.push(f.category); }
  if (f.fechaDesde) { where.push(`s.fecha    >= $${++i}`); params.push(f.fechaDesde); }
  if (f.fechaHasta) { where.push(`s.fecha    <= $${++i}`); params.push(f.fechaHasta); }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const { rows } = await query<SubastaRow>(
    `${BASE_SELECT}
     ${whereSql}
     ORDER BY s.fecha, s.hora
     LIMIT $${++i} OFFSET $${++i}`,
    [...params, f.limit, (f.page - 1) * f.limit],
  );

  const totalQ = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM subastas s ${whereSql}`,
    params,
  );

  return { items: rows, total: totalQ.rows[0].total };
}

export async function findActiveSubastas() {
  const { rows } = await query<SubastaRow>(
    `${BASE_SELECT}
      WHERE s.estado = 'abierta'
        AND s.fecha <= CURRENT_DATE
      ORDER BY s.fecha, s.hora`,
  );
  return rows;
}

export async function findUpcomingSubastas() {
  const { rows } = await query<SubastaRow>(
    `${BASE_SELECT}
      WHERE s.estado = 'abierta'
        AND s.fecha > CURRENT_DATE
      ORDER BY s.fecha, s.hora`,
  );
  return rows;
}

export async function findSubastaById(id: number) {
  const { rows } = await query<SubastaRow>(
    `${BASE_SELECT} WHERE s.identificador = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function getSubastaCatalog(subastaId: number) {
  const { rows } = await query<CatalogItemRow>(
    `SELECT ic.identificador          AS item_id,
            c.identificador            AS catalogo_id,
            ic.producto                AS producto_id,
            ic.preciobase              AS precio_base,
            ic.comision,
            ic.subastado,
            pr.descripcioncatalogo     AS descripcion_catalogo,
            (SELECT COUNT(*)::int FROM fotos f WHERE f.producto = ic.producto) AS fotos_count
       FROM catalogos       c
       JOIN itemscatalogo   ic ON ic.catalogo = c.identificador
       JOIN productos       pr ON pr.identificador = ic.producto
      WHERE c.subasta = $1
      ORDER BY ic.identificador`,
    [subastaId],
  );
  return rows;
}

// ─── Asistencia ───────────────────────────────────────────────────────

export async function findAsistencia(clienteId: number, subastaId: number) {
  const { rows } = await query<{ id: number; numeropostor: number }>(
    `SELECT identificador AS id, numeropostor
       FROM asistentes
      WHERE cliente = $1 AND subasta = $2`,
    [clienteId, subastaId],
  );
  return rows[0] ?? null;
}

export async function nextPostorNumber(subastaId: number): Promise<number> {
  const { rows } = await query<{ next: number }>(
    `SELECT COALESCE(MAX(numeropostor), 0) + 1 AS next
       FROM asistentes
      WHERE subasta = $1`,
    [subastaId],
  );
  return rows[0].next;
}

export async function insertAsistente(
  clienteId: number,
  subastaId: number,
  numeroPostor: number,
) {
  const { rows } = await query<{ id: number }>(
    `INSERT INTO asistentes (cliente, subasta, numeropostor)
     VALUES ($1, $2, $3)
     RETURNING identificador AS id`,
    [clienteId, subastaId, numeroPostor],
  );
  return rows[0].id;
}

/**
 * ¿El cliente tiene al menos un medio de pago verificado por la empresa?
 * Necesario para poder pujar (consigna).
 */
export async function hasVerifiedPaymentMethod(clienteId: number): Promise<boolean> {
  const { rows } = await query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM medios_pago
        WHERE cliente_id = $1
          AND verificado = TRUE
     ) AS exists`,
    [clienteId],
  );
  return rows[0]?.exists ?? false;
}

/**
 * ¿El cliente ya está conectado a OTRA subasta abierta?
 * La consigna prohíbe estar en más de una subasta a la vez.
 */
export async function hasActiveAsistenciaElsewhere(
  clienteId: number,
  exceptSubastaId: number,
): Promise<boolean> {
  const { rows } = await query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1
         FROM asistentes a
         JOIN subastas   s ON s.identificador = a.subasta
        WHERE a.cliente   = $1
          AND s.estado    = 'abierta'
          AND a.subasta  <> $2
     ) AS exists`,
    [clienteId, exceptSubastaId],
  );
  return rows[0]?.exists ?? false;
}

export async function getClienteCategoria(clienteId: number): Promise<string | null> {
  const { rows } = await query<{ categoria: string | null }>(
    `SELECT categoria FROM clientes WHERE identificador = $1`,
    [clienteId],
  );
  return rows[0]?.categoria ?? null;
}

// ─── Cierre de subasta ────────────────────────────────────────────────

export interface AuctionItemWithBid {
  item_id: number;
  producto_id: number;
  comision: string;
  subastado: 'si' | 'no' | null;
  duenio_id: number;
  pujo_id: number | null;
  importe: string | null;
  cliente_id: number | null;
}

export async function getAuctionItemsWithBids(subastaId: number) {
  const { rows } = await query<AuctionItemWithBid>(`
    SELECT ic.identificador        AS item_id,
           ic.producto             AS producto_id,
           ic.comision,
           ic.subastado,
           pr.duenio               AS duenio_id,
           best.pujo_id,
           best.importe,
           best.cliente_id
      FROM catalogos     c
      JOIN itemscatalogo ic ON ic.catalogo      = c.identificador
      JOIN productos     pr ON pr.identificador = ic.producto
      LEFT JOIN LATERAL (
        SELECT pj.identificador AS pujo_id,
               pj.importe,
               a.cliente        AS cliente_id
          FROM pujos      pj
          JOIN asistentes a  ON a.identificador = pj.asistente
         WHERE pj.item = ic.identificador
         ORDER BY pj.importe DESC
         LIMIT 1
      ) best ON TRUE
     WHERE c.subasta = $1
     ORDER BY ic.identificador`,
    [subastaId],
  );
  return rows;
}

import type { PoolClient } from 'pg';

export async function closeAuction(client: PoolClient, subastaId: number) {
  const { rowCount } = await client.query(
    `UPDATE subastas SET estado = 'cerrada' WHERE identificador = $1 AND estado = 'abierta'`,
    [subastaId],
  );
  return rowCount ?? 0;
}

export async function markItemSubastado(client: PoolClient, itemId: number) {
  await client.query(
    `UPDATE itemscatalogo SET subastado = 'si' WHERE identificador = $1`,
    [itemId],
  );
}

export async function markBidGanador(client: PoolClient, pujoId: number) {
  await client.query(
    `UPDATE pujos SET ganador = 'si' WHERE identificador = $1`,
    [pujoId],
  );
}

export async function insertRegistroDeSubasta(
  client: PoolClient,
  data: {
    subastaId: number;
    duenioId: number;
    productoId: number;
    clienteId: number;
    importe: number;
    comision: number;
  },
): Promise<number> {
  const { rows } = await client.query<{ id: number }>(
    `INSERT INTO registrodesubasta (subasta, duenio, producto, cliente, importe, comision)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING identificador AS id`,
    [data.subastaId, data.duenioId, data.productoId, data.clienteId, data.importe, data.comision],
  );
  return rows[0].id;
}

export interface CreateSubastaInput {
  fecha: string;
  hora: string;
  estado?: 'abierta' | 'cerrada';
  subastador?: number;
  ubicacion?: string;
  categoria?: 'comun' | 'especial' | 'plata' | 'oro' | 'platino';
  moneda?: 'ARS' | 'USD';
  capacidadasistentes?: number;
  tienedeposito?: 'si' | 'no';
  seguridadpropia?: 'si' | 'no';
}

export async function insertSubasta(data: CreateSubastaInput): Promise<number> {
  const { rows } = await query<{ id: number }>(
    `INSERT INTO subastas
       (fecha, hora, estado, subastador, ubicacion, categoria, moneda,
        capacidadasistentes, tienedeposito, seguridadpropia)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING identificador AS id`,
    [
      data.fecha,
      data.hora,
      data.estado ?? 'abierta',
      data.subastador ?? null,
      data.ubicacion ?? null,
      data.categoria ?? null,
      data.moneda ?? 'ARS',
      data.capacidadasistentes ?? null,
      data.tienedeposito ?? null,
      data.seguridadpropia ?? null,
    ],
  );
  return rows[0].id;
}

// ─── Catálogo e ítems ─────────────────────────────────────────────────

export async function findCatalogoBySubasta(subastaId: number): Promise<number | null> {
  const { rows } = await query<{ id: number }>(
    `SELECT identificador AS id FROM catalogos WHERE subasta = $1 LIMIT 1`,
    [subastaId],
  );
  return rows[0]?.id ?? null;
}

export async function insertCatalogo(subastaId: number, responsableId: number): Promise<number> {
  const { rows } = await query<{ id: number }>(
    `INSERT INTO catalogos (descripcion, subasta, responsable)
     VALUES ('Catálogo de subasta', $1, $2)
     RETURNING identificador AS id`,
    [subastaId, responsableId],
  );
  return rows[0].id;
}

/** Crea un producto (revisor = empleado admin, duenio = vendedor). */
export async function insertProducto(data: {
  descripcion: string;
  duenioId: number;
  revisorId: number;
}): Promise<number> {
  const desc = data.descripcion.slice(0, 300);
  const { rows } = await query<{ id: number }>(
    `INSERT INTO productos (fecha, disponible, descripcioncatalogo, descripcioncompleta, revisor, duenio)
     VALUES (CURRENT_DATE, 'si', $1, $2, $3, $4)
     RETURNING identificador AS id`,
    [desc, desc, data.revisorId, data.duenioId],
  );
  return rows[0].id;
}

export interface NewItemInput {
  productoId: number;
  precioBase: number;
  comision: number;
}

export async function insertItemsCatalogo(
  catalogoId: number,
  items: NewItemInput[],
): Promise<number[]> {
  const ids: number[] = [];
  for (const item of items) {
    const { rows } = await query<{ id: number }>(
      `INSERT INTO itemscatalogo (catalogo, producto, preciobase, comision, subastado)
       VALUES ($1, $2, $3, $4, 'no')
       RETURNING identificador AS id`,
      [catalogoId, item.productoId, item.precioBase, item.comision],
    );
    ids.push(rows[0].id);
  }
  return ids;
}
