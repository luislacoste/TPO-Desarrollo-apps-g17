/**
 * Queries SQL del módulo Items.
 *
 * El "item" del swagger es la pareja (catálogo, producto), modelada
 * en `itemscatalogo`. Las fotos cuelgan de `productos` vía `fotos`.
 */
import { query } from '../../db';

export interface ItemRow {
  id: number;
  catalogo_id: number;
  producto_id: number;
  subasta_id: number | null;
  precio_base: string | null;     // se omite para anónimos
  comision: string;
  subastado: 'si' | 'no' | null;
  descripcion_catalogo: string | null;
  descripcion_completa: string | null;
  fotos_count: number;
  duenio_id: number;
  duenio_nombre: string | null;
}

export interface PhotoRow {
  id: number;
  producto_id: number;
  /** URL al endpoint que sirve el binario (no exponemos BYTEA inline). */
  url: string;
}

export interface OwnershipRow {
  subasta_id: number;
  fecha: string | null;
  cliente_id: number;
  cliente_nombre: string | null;
  importe: string;
}

const SELECT_BASE = `
  SELECT ic.identificador      AS id,
         ic.catalogo            AS catalogo_id,
         ic.producto            AS producto_id,
         c.subasta              AS subasta_id,
         ic.preciobase          AS precio_base,
         ic.comision,
         ic.subastado,
         pr.descripcioncatalogo AS descripcion_catalogo,
         pr.descripcioncompleta AS descripcion_completa,
         (SELECT COUNT(*)::int FROM fotos f WHERE f.producto = ic.producto) AS fotos_count,
         pr.duenio              AS duenio_id,
         p.nombre               AS duenio_nombre
    FROM itemscatalogo ic
    JOIN catalogos     c  ON c.identificador  = ic.catalogo
    JOIN productos     pr ON pr.identificador = ic.producto
    LEFT JOIN duenios  d  ON d.identificador  = pr.duenio
    LEFT JOIN personas p  ON p.identificador  = d.identificador
`;

interface ListFilters {
  auctionId?: number;
  status?: 'si' | 'no';
  page: number;
  limit: number;
}

export async function listItems(f: ListFilters) {
  const where: string[] = [];
  const params: unknown[] = [];
  let i = 0;

  if (f.auctionId !== undefined) { where.push(`c.subasta    = $${++i}`); params.push(f.auctionId); }
  if (f.status)                  { where.push(`ic.subastado = $${++i}`); params.push(f.status); }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const { rows } = await query<ItemRow>(
    `${SELECT_BASE}
     ${whereSql}
     ORDER BY ic.identificador
     LIMIT $${++i} OFFSET $${++i}`,
    [...params, f.limit, (f.page - 1) * f.limit],
  );

  const totalQ = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total
       FROM itemscatalogo ic
       JOIN catalogos c ON c.identificador = ic.catalogo
       ${whereSql}`,
    params,
  );

  return { items: rows, total: totalQ.rows[0].total };
}

export async function findItemById(id: number) {
  const { rows } = await query<ItemRow>(
    `${SELECT_BASE} WHERE ic.identificador = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function listItemPhotos(itemId: number) {
  const { rows } = await query<PhotoRow>(
    `SELECT f.identificador AS id,
            f.producto      AS producto_id,
            CONCAT('/v1/items/', $1::text, '/images/', f.identificador) AS url
       FROM fotos f
       JOIN itemscatalogo ic ON ic.producto = f.producto
      WHERE ic.identificador = $1
      ORDER BY f.identificador`,
    [itemId],
  );
  return rows;
}

export async function getPhotoBinary(itemId: number, photoId: number) {
  const { rows } = await query<{ foto: Buffer }>(
    `SELECT f.foto
       FROM fotos f
       JOIN itemscatalogo ic ON ic.producto = f.producto
      WHERE f.identificador = $2
        AND ic.identificador = $1`,
    [itemId, photoId],
  );
  return rows[0]?.foto ?? null;
}

export async function getOwnershipHistory(itemId: number) {
  // Cada fila de `registrodesubasta` para el producto de este item es
  // una transferencia de propiedad documentada.
  const { rows } = await query<OwnershipRow>(
    `SELECT r.subasta      AS subasta_id,
            s.fecha,
            r.cliente      AS cliente_id,
            p.nombre       AS cliente_nombre,
            r.importe
       FROM itemscatalogo ic
       JOIN registrodesubasta r ON r.producto = ic.producto
       JOIN subastas s ON s.identificador = r.subasta
       JOIN clientes c ON c.identificador = r.cliente
       JOIN personas p ON p.identificador = c.identificador
      WHERE ic.identificador = $1
      ORDER BY s.fecha`,
    [itemId],
  );
  return rows;
}
