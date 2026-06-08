/**
 * Lógica de negocio del módulo Bids.
 *
 * Reglas de las pujas (consigna del TPO):
 *   - **mínimo**: `oferta_actual + 1% * precio_base`
 *     (ej. base=10000, última oferta=15000 → mínimo 15100).
 *     Si no hay puja previa, el mínimo es el precio base.
 *   - **máximo**: `oferta_actual + 20% * precio_base`
 *     (ej. base=10000, última oferta=15000 → máximo 17000).
 *     Si no hay puja previa, el máximo es `precio_base * 1.20`.
 *   - **Estos límites NO aplican** a subastas de categoría
 *     **oro** o **platino** (regla por categoría de la subasta,
 *     no del usuario).
 *   - el cliente tiene que ser `asistente` de la subasta
 *   - el cliente no debe estar `bids_blocked` y debe estar `approved`
 *   - el item no debe estar `subastado = 'si'`
 *   - la subasta tiene que estar `abierta`
 */
import * as repo from './bids.repository';
import * as auctionsRepo from '../auctions/auctions.repository';
import { assertCanParticipate } from '../auctions/auctions.service';
import { events } from '../../services/events';
import { Conflict, NotFound, UnprocessableEntity } from '../../utils/errors';

const MIN_INCREMENT_OVER_BASE = 0.01;  // +1% del precio base
const MAX_INCREMENT_OVER_BASE = 0.20;  // +20% del precio base

export interface PlaceBidInput {
  itemId: number;
  importe: number;
}

export async function placeBid(clienteId: number, input: PlaceBidInput) {
  if (!Number.isFinite(input.importe) || input.importe <= 0) {
    throw new UnprocessableEntity('importe inválido');
  }

  await assertCanParticipate(clienteId);

  const ctx = await repo.getItemBidContext(input.itemId);
  if (!ctx) throw new NotFound('Item no encontrado');
  if (ctx.subasta_estado !== 'abierta') {
    throw new Conflict('La subasta no está abierta');
  }
  if (ctx.subastado === 'si') {
    throw new Conflict('El item ya fue subastado');
  }

  // Tiene que estar inscripto como asistente.
  const asistencia = await auctionsRepo.findAsistencia(clienteId, ctx.subasta_id);
  if (!asistencia) {
    throw new Conflict('Tenés que unirte a la subasta antes de pujar');
  }

  // Reglas de monto: mínimo = oferta_actual + 1% del precio base.
  //                   máximo = oferta_actual + 20% del precio base.
  // Si no hay puja previa, el "current" para esos cálculos es 0 y el
  // mínimo cae al precio base.
  const base    = Number(ctx.precio_base);
  const current = ctx.current_highest ? Number(ctx.current_highest) : 0;
  const minIncrement = base * MIN_INCREMENT_OVER_BASE;
  const minNext = current > 0 ? current + minIncrement : base;

  if (input.importe < minNext) {
    throw new UnprocessableEntity(
      `El importe debe ser al menos ${minNext.toFixed(2)} ` +
      `(mínimo: oferta actual + 1% del precio base)`,
    );
  }

  // Tope del 20%: NO aplica en subastas oro / platino (consigna).
  const exempt = ctx.subasta_categoria === 'oro' || ctx.subasta_categoria === 'platino';
  if (!exempt) {
    const maxIncrement = base * MAX_INCREMENT_OVER_BASE;
    const maxAllowed   = current > 0 ? current + maxIncrement : base + maxIncrement;
    if (input.importe > maxAllowed) {
      throw new UnprocessableEntity(
        `El importe supera el tope (máx ${maxAllowed.toFixed(2)}: ` +
        `oferta actual + 20% del precio base)`,
      );
    }
  }

  const bidId = await repo.insertBid(asistencia.id, input.itemId, input.importe);

  // Broadcast a los clientes WS suscriptos a la subasta.
  events.emit('bid_placed', {
    auctionId:   ctx.subasta_id,
    itemId:      input.itemId,
    bidId,
    importe:     input.importe,
    clienteId,
    asistenteId: asistencia.id,
  });

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
