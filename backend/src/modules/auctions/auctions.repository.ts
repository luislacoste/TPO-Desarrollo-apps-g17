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
  categoria: 'bronce' | 'plata' | 'oro' | 'platino' | null;
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
