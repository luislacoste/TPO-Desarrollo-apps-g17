/**
 * Lógica de Fines (multas).
 *
 * Las multas se crean automáticamente al vencer un `Payment` (lo dispara
 * el módulo de admin o un job). Acá implementamos el lado del usuario:
 *   - listar las mías (con filtro de status)
 *   - ver detalle
 *   - pagar (regularizar): solo posible si la multa está `pending`
 *     (dentro de las 72hs). Si está `overdue`, 409 — la cuenta queda
 *     bloqueada y el caso entra al circuito judicial.
 *
 * Como no hay cron job, en cada lectura corremos `processOverdueForCliente`
 * que transiciona pending → overdue lo que ya pasó deadline y bloquea
 * la cuenta. Eso hace que el estado expuesto siempre sea correcto.
 */
import { withTransaction } from '../../db';
import * as repo from './fines.repository';
import { Conflict, NotFound, UnprocessableEntity } from '../../utils/errors';
import * as paymentsRepo from '../payments/payments.repository';

function toResponse(row: repo.FineRow) {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    pagoId: row.pago_id,
    pujoId: row.pujo_id,
    bidAmount: Number(row.bid_amount),
    finePercentage: Number(row.fine_percentage),
    amount: Number(row.amount),
    moneda: row.moneda,
    estado: row.estado,
    issuedAt: row.issued_at,
    deadlineAt: row.deadline_at,
    paidAt: row.paid_at,
    waivedAt: row.waived_at,
    waivedBy: row.waived_by,
    waivedReason: row.waived_reason,
  };
}

// ─── Casos de uso ─────────────────────────────────────────────────────

export async function listMine(clienteId: number, status?: string) {
  if (status && !['pending', 'paid', 'overdue', 'waived'].includes(status)) {
    throw new UnprocessableEntity(`status inválido: ${status}`);
  }
  await repo.processOverdueForCliente(null, clienteId);
  const rows = await repo.listByCliente(clienteId, status);
  return rows.map(toResponse);
}

export async function getMineById(clienteId: number, fineId: number) {
  await repo.processOverdueForCliente(null, clienteId);
  const row = await repo.findById(fineId, clienteId);
  if (!row) throw new NotFound('Multa no encontrada');
  return toResponse(row);
}

/**
 * POST /fines/{id}/pay — regulariza pagando.
 * Reglas:
 *   - la multa tiene que estar `pending`
 *   - el medio de pago tiene que pertenecer al cliente
 *   - en la misma transacción: multa → paid, y si no hay otras
 *     multas pending|overdue, desbloquea `bids_blocked`.
 */
export async function pay(clienteId: number, fineId: number, medioPagoId: number) {
  if (!Number.isInteger(medioPagoId) || medioPagoId <= 0) {
    throw new UnprocessableEntity('paymentMethodId inválido');
  }
  if (!(await paymentsRepo.medioPagoBelongsTo(medioPagoId, clienteId))) {
    throw new UnprocessableEntity('Medio de pago inválido para este cliente');
  }

  // Procesar overdue antes de pagar (puede que entre el read y el pay haya pasado deadline).
  await repo.processOverdueForCliente(null, clienteId);

  const fine = await repo.findById(fineId, clienteId);
  if (!fine) throw new NotFound('Multa no encontrada');
  if (fine.estado === 'paid')   throw new Conflict('La multa ya está pagada');
  if (fine.estado === 'waived') throw new Conflict('La multa fue condonada');
  if (fine.estado === 'overdue') {
    throw new Conflict('La multa está vencida; la cuenta entra al circuito judicial');
  }

  await withTransaction(async (client) => {
    const updated = await repo.markFinePaid(client, fineId);
    if (updated === 0) {
      throw new Conflict('No se pudo regularizar la multa (estado cambió concurrentemente)');
    }
    const otherPending = await repo.countOtherPending(clienteId, fineId);
    if (otherPending === 0) {
      await repo.unblockParticipation(client, clienteId);
    }
  });

  return getMineById(clienteId, fineId);
}
