/**
 * Lógica del módulo Admin.
 *
 * Cubre las operaciones del personal de la empresa sobre usuarios y multas.
 * Todos los métodos asumen que el caller ya pasó por `requireRole('admin')`.
 *
 * Convenciones:
 *   - `actorId` es el `req.user.sub` del admin (también es su id de
 *     `empleados`, por el seed).
 *   - Los cambios de admisión / categoría / participación van en una
 *     transacción cuando tocan más de una tabla.
 */
import { withTransaction } from '../../db';
import * as repo from './admin.repository';
import * as pmRepo from '../payment-methods/payment-methods.repository';
import * as sellRepo from '../sell-requests/sell-requests.repository';
import * as paymentsRepo from '../payments/payments.repository';
import * as auctionsRepo from '../auctions/auctions.repository';
import { env } from '../../config/env';
import { BadRequest, Conflict, NotFound, UnprocessableEntity } from '../../utils/errors';

const VALID_CATEGORIES = ['comun', 'especial', 'plata', 'oro', 'platino'] as const;
const VALID_ADMISSION  = ['pending', 'approved', 'rejected', 'blocked', 'suspended'] as const;

// ─── Helpers de respuesta ─────────────────────────────────────────────

function toUserResponse(row: repo.AdminUserRow) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    documento: row.documento,
    firstName: row.first_name,
    lastName: row.last_name,
    category: row.categoria,
    admissionStatus: row.admision_estado,
    admissionNotes: row.admision_notas,
    admissionUpdatedAt: row.admision_updated_at,
    admissionUpdatedBy: row.admision_updated_by,
    bidsBlocked: row.bids_blocked,
    bidsBlockedReason: row.bids_blocked_reason,
    documentVerified: row.document_verified ?? false,
    createdAt: row.created_at,
  };
}

function toFineResponse(row: repo.AdminFineRow) {
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

// ─── Usuarios ─────────────────────────────────────────────────────────

export async function listUsers(input: {
  admissionStatus?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page  = Math.max(1, Number(input.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(input.limit ?? 20)));
  const { items, total } = await repo.listUsers({
    admissionStatus: input.admissionStatus,
    category: input.category,
    search: input.search,
    page,
    limit,
  });
  return { items: items.map(toUserResponse), page, limit, total };
}

export async function getUserById(id: number) {
  const row = await repo.findUserById(id);
  if (!row) throw new NotFound('Usuario no encontrado');
  return toUserResponse(row);
}

export async function approveUser(
  actorId: number,
  clienteId: number,
  category: string | undefined,
  notes: string | undefined,
) {
  const user = await repo.findUserById(clienteId);
  if (!user) throw new NotFound('Usuario no encontrado');
  if (user.admision_estado !== 'pending') {
    throw new Conflict(`No se puede aprobar en estado ${user.admision_estado}`);
  }
  if (category && !VALID_CATEGORIES.includes(category as never)) {
    throw new UnprocessableEntity(`Categoría inválida: ${category}`);
  }

  await withTransaction(async (client) => {
    await repo.setAdmissionStatus(client, clienteId, 'approved', notes ?? null, actorId);
    if (category) {
      await client.query(`UPDATE clientes SET categoria = $2 WHERE identificador = $1`,
        [clienteId, category]);
    }
  });

  return getUserById(clienteId);
}

export async function rejectUser(actorId: number, clienteId: number, reason: string, notes?: string) {
  if (!reason.trim()) throw new UnprocessableEntity('reason es obligatorio');
  const user = await repo.findUserById(clienteId);
  if (!user) throw new NotFound('Usuario no encontrado');
  if (user.admision_estado !== 'pending') {
    throw new Conflict(`No se puede rechazar en estado ${user.admision_estado}`);
  }
  const finalNotes = notes ? `${reason} — ${notes}` : reason;
  await repo.setAdmissionStatus(null, clienteId, 'rejected', finalNotes, actorId);
  return getUserById(clienteId);
}

export async function changeCategory(actorId: number, clienteId: number, category: string, _reason?: string) {
  if (!VALID_CATEGORIES.includes(category as never)) {
    throw new UnprocessableEntity(`Categoría inválida: ${category}`);
  }
  const user = await repo.findUserById(clienteId);
  if (!user) throw new NotFound('Usuario no encontrado');
  const updated = await repo.setCategory(clienteId, category);
  if (updated === 0) throw new NotFound('Usuario no encontrado');
  // `actorId` queda registrado en `admission.updated_by` cuando cambia
  // el estado, pero la categoría no tiene su propia auditoría; queda como TODO.
  void actorId;
  return getUserById(clienteId);
}

export async function changeAdmission(
  actorId: number,
  clienteId: number,
  admissionStatus: string,
  notes?: string,
) {
  if (!VALID_ADMISSION.includes(admissionStatus as never)) {
    throw new UnprocessableEntity(`admissionStatus inválido: ${admissionStatus}`);
  }
  const user = await repo.findUserById(clienteId);
  if (!user) throw new NotFound('Usuario no encontrado');

  await withTransaction(async (client) => {
    await repo.setAdmissionStatus(client, clienteId, admissionStatus, notes ?? null, actorId);
    // Si se bloquea o suspende, bloquear participación también.
    if (['blocked', 'suspended'].includes(admissionStatus)) {
      await repo.setBidsBlocked(client, clienteId, true,
        admissionStatus === 'blocked' ? 'admin_blocked' : 'admin_suspended',
        null);
    }
  });

  return getUserById(clienteId);
}

// ─── Participación ────────────────────────────────────────────────────

export async function blockParticipation(_actorId: number, clienteId: number, reason: string, until?: string) {
  if (!reason.trim()) throw new UnprocessableEntity('reason es obligatorio');
  const user = await repo.findUserById(clienteId);
  if (!user) throw new NotFound('Usuario no encontrado');
  await repo.setBidsBlocked(null, clienteId, true, reason, until ?? null);
  return getUserById(clienteId);
}

export async function unblockParticipation(_actorId: number, clienteId: number) {
  const user = await repo.findUserById(clienteId);
  if (!user) throw new NotFound('Usuario no encontrado');
  const openFines = await repo.countOpenFinesFor(clienteId);
  if (openFines > 0) {
    throw new Conflict(`El usuario tiene ${openFines} multa(s) vigente(s) / vencida(s) sin regularizar`);
  }
  await repo.setBidsBlocked(null, clienteId, false, null, null);
  return getUserById(clienteId);
}

// ─── Multas (admin) ───────────────────────────────────────────────────

export async function listFines(input: {
  status?: string;
  userId?: number;
  page?: number;
  limit?: number;
}) {
  const page  = Math.max(1, Number(input.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(input.limit ?? 20)));
  if (input.status && !['pending', 'paid', 'overdue', 'waived'].includes(input.status)) {
    throw new UnprocessableEntity(`status inválido: ${input.status}`);
  }
  const { items, total } = await repo.listFines({
    status: input.status,
    userId: input.userId,
    page,
    limit,
  });
  return { items: items.map(toFineResponse), page, limit, total };
}

/**
 * POST /admin/payments/{id}/apply-fine
 * Genera una multa del 10% sobre el valor ofertado del pago indicado.
 * Reglas:
 *   - el pago debe existir y no tener ya una multa asociada
 *   - el pago no debe estar ya `completed`
 * Acciones (en una transacción):
 *   - insert multa con `fine_percentage` (default 10) y deadline NOW+72h
 *   - linkear pago.fine_id, transicionar pago a `overdue`
 *   - bloquear participación del cliente
 */
export async function applyFine(
  _actorId: number,
  paymentId: number,
  options: { finePercentage?: number; notes?: string },
) {
  const pago = await repo.getPaymentForFine(paymentId);
  if (!pago) throw new NotFound('Pago no encontrado');
  if (pago.fine_id) throw new Conflict('El pago ya tiene una multa asociada');
  if (pago.estado === 'completed') throw new Conflict('El pago ya está pagado');

  const percentage = options.finePercentage ?? env.fines.percentage;
  if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
    throw new UnprocessableEntity('finePercentage inválido');
  }

  const bidAmount = Number(pago.bid_amount ?? pago.monto);
  if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
    throw new BadRequest('No se pudo determinar el importe base de la multa');
  }
  const amount = Number((bidAmount * percentage / 100).toFixed(2));

  let fineId = 0;
  await withTransaction(async (client) => {
    fineId = await repo.insertFine(client, {
      cliente_id:      pago.cliente_id,
      pago_id:         pago.id,
      bid_amount:      bidAmount,
      fine_percentage: percentage,
      amount,
      moneda:          pago.moneda,
      deadlineHours:   env.fines.deadlineHours,
    });
    await repo.linkPaymentToFine(client, pago.id, fineId);
    await repo.setBidsBlocked(client, pago.cliente_id, true, 'unpaid_fine', null);
  });

  const fine = await repo.findFineById(fineId);
  return toFineResponse(fine!);
}

// ─── Cierre de subasta ────────────────────────────────────────────────

const PAYMENT_DUE_DAYS = 7;

export async function closeAuction(_actorId: number, subastaId: number) {
  const auction = await auctionsRepo.findSubastaById(subastaId);
  if (!auction) throw new NotFound('Subasta no encontrada');
  if (auction.estado !== 'abierta') {
    throw new Conflict(`La subasta ya está ${auction.estado}`);
  }

  const items = await auctionsRepo.getAuctionItemsWithBids(subastaId);

  const adjudicated: { itemId: number; clienteId: number; importe: number; registroId: number; paymentId: number }[] = [];
  const skipped: { itemId: number; reason: string }[] = [];

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + PAYMENT_DUE_DAYS);
  const dueDateStr = dueDate.toISOString().slice(0, 10);

  await withTransaction(async (client) => {
    for (const item of items) {
      if (item.subastado === 'si') {
        skipped.push({ itemId: item.item_id, reason: 'ya subastado' });
        continue;
      }
      if (!item.pujo_id || !item.cliente_id || !item.importe) {
        skipped.push({ itemId: item.item_id, reason: 'sin pujas' });
        continue;
      }

      const importe  = Number(item.importe);
      const comision = Number(item.comision);

      const registroId = await auctionsRepo.insertRegistroDeSubasta(client, {
        subastaId,
        duenioId:   item.duenio_id,
        productoId: item.producto_id,
        clienteId:  item.cliente_id,
        importe,
        comision,
      });

      const paymentId = await paymentsRepo.insertAuctionPayment(client, {
        clienteId:           item.cliente_id,
        registrodesubastaId: registroId,
        monto:               importe,
        moneda:              auction.moneda,
        dueDate:             dueDateStr,
      });

      await auctionsRepo.markItemSubastado(client, item.item_id);
      await auctionsRepo.markBidGanador(client, item.pujo_id);

      adjudicated.push({ itemId: item.item_id, clienteId: item.cliente_id, importe, registroId, paymentId });
    }

    await auctionsRepo.closeAuction(client, subastaId);
  });

  return { auctionId: subastaId, estado: 'cerrada', adjudicated, skipped };
}

// ─── Medios de pago (admin) ───────────────────────────────────────────

export async function verifyPaymentMethod(_actorId: number, id: number) {
  const pm = await pmRepo.findById(id);
  if (!pm) throw new NotFound('Medio de pago no encontrado');
  await pmRepo.verifyById(id);
  const fresh = await pmRepo.findById(id);
  return {
    id: fresh!.id,
    clienteId: fresh!.cliente_id,
    tipo: fresh!.tipo,
    verificado: fresh!.verificado,
  };
}

// ─── Solicitudes de venta (admin) ─────────────────────────────────────

export async function offerSellRequestConditions(
  _actorId: number,
  id: number,
  data: { precioBase: number; comisionPorcentaje: number; moneda: string; notas?: string },
) {
  const VALID_MONEDAS = ['ARS', 'USD'];
  if (!Number.isFinite(data.precioBase) || data.precioBase <= 0) {
    throw new UnprocessableEntity('precioBase inválido');
  }
  if (!Number.isFinite(data.comisionPorcentaje) || data.comisionPorcentaje < 0) {
    throw new UnprocessableEntity('comisionPorcentaje inválido');
  }
  if (!VALID_MONEDAS.includes(data.moneda)) {
    throw new UnprocessableEntity(`moneda inválida: ${data.moneda}`);
  }

  const sr = await sellRepo.findById(id);
  if (!sr) throw new NotFound('Solicitud de venta no encontrada');
  if (!['pending', 'reviewing'].includes(sr.estado)) {
    throw new Conflict(`No se pueden ofrecer condiciones en estado '${sr.estado}'`);
  }

  const updated = await sellRepo.offerConditions(id, {
    precio_base: data.precioBase,
    comision_porcentaje: data.comisionPorcentaje,
    moneda: data.moneda,
    notas: data.notas ?? null,
  });
  if (updated === 0) throw new Conflict('No se pudo actualizar (estado cambió concurrentemente)');

  return sellRepo.findById(id);
}

/**
 * Acepta en lote TODAS las solicitudes de venta pendientes/en revisión/con
 * condiciones ofrecidas → `accepted`. Completa condiciones por defecto donde
 * falten. Pensado como atajo administrativo (demo / aprobación masiva).
 */
export async function acceptAllSellRequests(
  _actorId: number,
  data: { precioBase?: number; comisionPorcentaje?: number; moneda?: string },
) {
  const VALID_MONEDAS = ['ARS', 'USD'];
  const precioBase = data.precioBase ?? 1000;
  const comisionPorcentaje = data.comisionPorcentaje ?? 10;
  const moneda = data.moneda ?? 'ARS';

  if (!Number.isFinite(precioBase) || precioBase <= 0) {
    throw new UnprocessableEntity('precioBase inválido');
  }
  if (!Number.isFinite(comisionPorcentaje) || comisionPorcentaje < 0) {
    throw new UnprocessableEntity('comisionPorcentaje inválido');
  }
  if (!VALID_MONEDAS.includes(moneda)) {
    throw new UnprocessableEntity(`moneda inválida: ${moneda}`);
  }

  const ids = await sellRepo.acceptAllPending({
    precio_base: precioBase,
    comision_porcentaje: comisionPorcentaje,
    moneda,
  });
  return { accepted: ids.length, ids };
}

// ─── Pagos (admin) ────────────────────────────────────────────────────

export async function createPayment(
  _actorId: number,
  data: { clienteId: number; monto: number; moneda: string; dueDate: string },
) {
  const VALID_MONEDAS = ['ARS', 'USD'];
  if (!Number.isInteger(data.clienteId) || data.clienteId <= 0) {
    throw new UnprocessableEntity('clienteId inválido');
  }
  if (!Number.isFinite(data.monto) || data.monto <= 0) {
    throw new UnprocessableEntity('monto inválido');
  }
  if (!VALID_MONEDAS.includes(data.moneda)) {
    throw new UnprocessableEntity(`moneda inválida: ${data.moneda}`);
  }
  if (!data.dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(data.dueDate)) {
    throw new UnprocessableEntity('dueDate inválida (formato YYYY-MM-DD)');
  }

  const user = await repo.findUserById(data.clienteId);
  if (!user) throw new NotFound('Usuario no encontrado');

  const paymentId = await paymentsRepo.insertPayment(data);
  return paymentsRepo.findById(paymentId);
}

/**
 * POST /admin/fines/{id}/waive
 * Condona una multa. Si era la única abierta del usuario, desbloquea participación.
 */
export async function waiveFine(actorId: number, fineId: number, reason: string) {
  if (!reason.trim()) throw new UnprocessableEntity('reason es obligatorio');
  const fine = await repo.findFineById(fineId);
  if (!fine) throw new NotFound('Multa no encontrada');
  if (!['pending', 'overdue'].includes(fine.estado)) {
    throw new Conflict(`No se puede condonar en estado ${fine.estado}`);
  }

  await withTransaction(async (client) => {
    const updated = await repo.waiveFine(client, fineId, actorId, reason);
    if (updated === 0) {
      throw new Conflict('No se pudo condonar (estado cambió concurrentemente)');
    }
    const otherOpen = await repo.countOpenFinesFor(fine.cliente_id, fineId);
    if (otherOpen === 0) {
      await repo.setBidsBlocked(client, fine.cliente_id, false, null, null);
    }
  });

  const fresh = await repo.findFineById(fineId);
  return toFineResponse(fresh!);
}
