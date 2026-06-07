/**
 * Lógica de negocio del módulo Bids.
 *
 * Reglas de las pujas (documentadas en `api-spec.md`):
 *   - mínimo: ~1% sobre la oferta actual del item
 *   - máximo: ~20% sobre precio base (excepto categorías oro / platino)
 *   - el cliente tiene que ser `asistente` de la subasta
 *   - el cliente no debe estar `bids_blocked` y debe estar `approved`
 *   - el item no debe estar `subastado = 'si'`
 *   - la subasta tiene que estar `abierta`
 */
import * as repo from './bids.repository';
import * as auctionsRepo from '../auctions/auctions.repository';
import { assertCanParticipate } from '../auctions/auctions.service';
import { query } from '../../db';
import { Conflict, NotFound, UnprocessableEntity } from '../../utils/errors';

const MIN_INCREMENT_RATIO = 0.01;  // +1% sobre la oferta actual
const MAX_BID_OVER_BASE   = 0.20;  // +20% sobre precio base (default)

export interface PlaceBidInput {
  itemId: number;
  importe: number;
}

export async function placeBid(clienteId: number, input: PlaceBidInput) {
  if (!Number.isFinite(input.importe) || input.importe <= 0) {
    throw new UnprocessableEntity('importe inválido');
  }

  const ctx = await repo.getItemBidContext(input.itemId);
  if (!ctx) throw new NotFound('Item no encontrado');
  if (ctx.subasta_estado !== 'abierta') {
    throw new Conflict('La subasta no está abierta');
  }
  if (ctx.subastado === 'si') {
    throw new Conflict('El item ya fue subastado');
  }

  await assertCanParticipate(clienteId);

  // Tiene que estar inscripto como asistente.
  const asistencia = await auctionsRepo.findAsistencia(clienteId, ctx.subasta_id);
  if (!asistencia) {
    throw new Conflict('Tenés que unirte a la subasta antes de pujar');
  }

  // Reglas de monto.
  const base    = Number(ctx.precio_base);
  const current = ctx.current_highest ? Number(ctx.current_highest) : 0;
  const minNext = current > 0
    ? current * (1 + MIN_INCREMENT_RATIO)
    : base;

  if (input.importe < minNext) {
    throw new UnprocessableEntity(
      `El importe debe ser al menos ${minNext.toFixed(2)} (mínimo +1% sobre la oferta actual)`,
    );
  }

  // Tope del 20% sobre precio base, salvo categoría oro / platino.
  const { rows: catRows } = await query<{ categoria: string | null }>(
    `SELECT categoria FROM clientes WHERE identificador = $1`,
    [clienteId],
  );
  const cat = catRows[0]?.categoria;
  const exempt = cat === 'oro' || cat === 'platino';
  if (!exempt) {
    const maxAllowed = base * (1 + MAX_BID_OVER_BASE);
    if (input.importe > maxAllowed) {
      throw new UnprocessableEntity(
        `El importe supera el tope del 20% sobre el precio base (máx ${maxAllowed.toFixed(2)})`,
      );
    }
  }

  const bidId = await repo.insertBid(asistencia.id, input.itemId, input.importe);
  return {
    id: bidId,
    itemId: input.itemId,
    asistenteId: asistencia.id,
    importe: input.importe,
  };
}

export function listForAuction(subastaId: number) {
  return repo.listByAuction(subastaId);
}

export function currentForItem(subastaId: number, itemId: number) {
  return repo.currentForItem(subastaId, itemId);
}

export function listMine(clienteId: number) {
  return repo.listByCliente(clienteId);
}

export function listMyWon(clienteId: number) {
  return repo.listWonByCliente(clienteId);
}
