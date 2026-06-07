/**
 * Lógica de negocio del módulo Items.
 */
import * as repo from './items.repository';
import { NotFound, UnprocessableEntity } from '../../utils/errors';

interface ListInput {
  auctionId?: number;
  status?: string;
  page?: number;
  limit?: number;
}

export async function list(input: ListInput) {
  const page  = Math.max(1, Number(input.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(input.limit ?? 20)));

  let status: 'si' | 'no' | undefined;
  if (input.status === 'sold')   status = 'si';
  if (input.status === 'unsold') status = 'no';
  if (input.status && status === undefined) {
    throw new UnprocessableEntity(`status inválido (usar sold|unsold)`);
  }

  const { items, total } = await repo.listItems({
    auctionId: input.auctionId,
    status,
    page,
    limit,
  });
  return { items, page, limit, total };
}

/**
 * GET /items/{id}.
 * Cuando el caller NO está autenticado, el swagger esconde el `precio_base`
 * (solo registrados pueden verlo). Aplicamos esa regla acá.
 */
export async function getById(id: number, isAuthenticated: boolean) {
  const row = await repo.findItemById(id);
  if (!row) throw new NotFound('Item no encontrado');
  if (!isAuthenticated) {
    return { ...row, precio_base: null };
  }
  return row;
}

export async function listPhotos(itemId: number) {
  const item = await repo.findItemById(itemId);
  if (!item) throw new NotFound('Item no encontrado');
  return repo.listItemPhotos(itemId);
}

export async function getPhotoBinary(itemId: number, photoId: number) {
  const buf = await repo.getPhotoBinary(itemId, photoId);
  if (!buf) throw new NotFound('Foto no encontrada');
  return buf;
}

export async function getHistory(itemId: number) {
  const item = await repo.findItemById(itemId);
  if (!item) throw new NotFound('Item no encontrado');
  return repo.getOwnershipHistory(itemId);
}
