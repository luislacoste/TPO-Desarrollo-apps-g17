/**
 * Queries SQL del módulo Favorites.
 * Tabla `favoritos` con PK compuesta `(cliente_id, item_id)`.
 */
import { query } from '../../db';

export interface FavoriteRow {
  item_id: number;
  catalogo_id: number;
  subasta_id: number | null;
  precio_base: string | null;
  descripcion_catalogo: string | null;
  fotos_count: number;
  created_at: Date;
}

export async function listByCliente(clienteId: number) {
  const { rows } = await query<FavoriteRow>(
    `SELECT f.item_id,
            ic.catalogo                AS catalogo_id,
            c.subasta                  AS subasta_id,
            ic.preciobase              AS precio_base,
            pr.descripcioncatalogo     AS descripcion_catalogo,
            (SELECT COUNT(*)::int FROM fotos fo WHERE fo.producto = ic.producto) AS fotos_count,
            f.created_at
       FROM favoritos          f
       JOIN itemscatalogo      ic ON ic.identificador = f.item_id
       JOIN catalogos          c  ON c.identificador  = ic.catalogo
       JOIN productos          pr ON pr.identificador = ic.producto
      WHERE f.cliente_id = $1
      ORDER BY f.created_at DESC`,
    [clienteId],
  );
  return rows;
}

export async function itemExists(itemId: number): Promise<boolean> {
  const { rows } = await query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM itemscatalogo WHERE identificador = $1) AS exists`,
    [itemId],
  );
  return rows[0]?.exists ?? false;
}

export async function addFavorite(clienteId: number, itemId: number) {
  // Idempotente: si ya existe, no hace nada.
  await query(
    `INSERT INTO favoritos (cliente_id, item_id)
     VALUES ($1, $2)
     ON CONFLICT (cliente_id, item_id) DO NOTHING`,
    [clienteId, itemId],
  );
}

export async function removeFavorite(clienteId: number, itemId: number) {
  await query(
    `DELETE FROM favoritos WHERE cliente_id = $1 AND item_id = $2`,
    [clienteId, itemId],
  );
}
