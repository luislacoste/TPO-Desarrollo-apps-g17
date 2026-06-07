/**
 * Lógica de Payments.
 */
import { withTransaction } from '../../db';
import * as repo from './payments.repository';
import { Conflict, NotFound, UnprocessableEntity } from '../../utils/errors';

function toResponse(row: repo.PaymentRow) {
  return {
    id: row.id,
    registroSubastaId: row.registrodesubasta_id,
    clienteId: row.cliente_id,
    monto: Number(row.monto),
    moneda: row.moneda,
    estado: row.estado,
    medioPagoId: row.medio_pago_id,
    dueDate: row.due_date,
    paidAt: row.paid_at,
    fineId: row.fine_id,
    createdAt: row.created_at,
  };
}

function toDetailResponse(row: repo.PaymentDetailRow) {
  return {
    ...toResponse(row),
    breakdown: {
      baseAmount: row.base_amount  !== null ? Number(row.base_amount)  : null,
      commission: row.commission   !== null ? Number(row.commission)   : null,
    },
  };
}

export async function listPending(clienteId: number) {
  const rows = await repo.listPendingByCliente(clienteId);
  return rows.map(toResponse);
}

export async function getById(id: number, clienteId: number) {
  const row = await repo.findById(id, clienteId);
  if (!row) throw new NotFound('Pago no encontrado');
  return toDetailResponse(row);
}

/**
 * POST /payments/{id}/pay
 * - El pago debe estar pending|processing
 * - El medio de pago tiene que pertenecer al cliente
 * - Marca el pago como `completed`, genera factura, devuelve el detalle.
 */
export async function pay(clienteId: number, paymentId: number, medioPagoId: number) {
  const pago = await repo.findById(paymentId, clienteId);
  if (!pago) throw new NotFound('Pago no encontrado');

  if (pago.estado === 'completed') {
    throw new Conflict('El pago ya está pagado');
  }
  if (pago.estado === 'overdue' || pago.estado === 'defaulted') {
    throw new Conflict('El pago está vencido; se aplican multas');
  }
  if (!['pending', 'processing'].includes(pago.estado)) {
    throw new Conflict(`El pago no admite pago en estado ${pago.estado}`);
  }
  if (!(await repo.medioPagoBelongsTo(medioPagoId, clienteId))) {
    throw new UnprocessableEntity('Medio de pago inválido para este cliente');
  }

  await withTransaction(async (client) => {
    const updated = await repo.markAsPaid(client, paymentId, medioPagoId);
    if (updated === 0) {
      throw new Conflict('No se pudo procesar el pago (estado cambió concurrentemente)');
    }
    const numero = generateInvoiceNumber(paymentId);
    await repo.insertFactura(client, paymentId, numero, Number(pago.monto), pago.moneda);
  });

  return getById(paymentId, clienteId);
}

export async function listInvoices(clienteId: number) {
  const rows = await repo.listInvoicesByCliente(clienteId);
  return rows.map((r) => ({
    id: r.id,
    paymentId: r.pago_id,
    numero: r.numero,
    monto: Number(r.monto),
    moneda: r.moneda,
    pdfUrl: r.pdf_url,
    issuedAt: r.issued_at,
  }));
}

function generateInvoiceNumber(paymentId: number) {
  // Académico: simple y único. En prod habría serie + correlativo AFIP.
  const ts = Date.now().toString(36).toUpperCase();
  return `INV-${paymentId.toString().padStart(6, '0')}-${ts}`;
}
