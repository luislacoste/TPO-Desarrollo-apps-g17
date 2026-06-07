import * as repo from './favorites.repository';
import { NotFound } from '../../utils/errors';

function toResponse(row: repo.FavoriteRow) {
  return {
    itemId: row.item_id,
    catalogoId: row.catalogo_id,
    subastaId: row.subasta_id,
    precioBase: row.precio_base !== null ? Number(row.precio_base) : null,
    descripcionCatalogo: row.descripcion_catalogo,
    fotosCount: row.fotos_count,
    createdAt: row.created_at,
  };
}

export async function listMine(clienteId: number) {
  const rows = await repo.listByCliente(clienteId);
  return rows.map(toResponse);
}

export async function add(clienteId: number, itemId: number) {
  if (!(await repo.itemExists(itemId))) {
    throw new NotFound('Item no encontrado');
  }
  await repo.addFavorite(clienteId, itemId);
}

export async function remove(clienteId: number, itemId: number) {
  // Idempotente: si no estaba, devolvemos 204 igual.
  await repo.removeFavorite(clienteId, itemId);
}
