/**
 * Queries SQL del módulo Payments.
 *
 * Tabla `pagos` referencia opcionalmente a `registrodesubasta`
 * (cuando es por una compra real). Las facturas viven en `facturas`.
 */
import type { PoolClient } from 'pg';
import { query } from '../../db';

export interface PaymentRow {
  id: number;
  registrodesubasta_id: number | null;
  cliente_id: number;
  monto: string;
  moneda: string;
  estado: 'pending' | 'processing' | 'completed' | 'failed' | 'overdue' | 'defaulted';
  medio_pago_id: number | null;
  due_date: string | null;
  paid_at: Date | null;
  fine_id: number | null;
  created_at: Date;
}

export interface PaymentDetailRow extends PaymentRow {
  base_amount: string | null;
  commission: string | null;
}

export interface InvoiceRow {
  id: number;
  pago_id: number;
  numero: string;
  monto: string;
  moneda: string;
  pdf_url: string | null;
  issued_at: Date;
}

// ─── Listados ─────────────────────────────────────────────────────────

export async function listPendingByCliente(clienteId: number) {
  const { rows } = await query<PaymentRow>(
    `SELECT identificador AS id, registrodesubasta_id, cliente_id,
            monto, moneda, estado, medio_pago_id, due_date, paid_at,
            fine_id, created_at
       FROM pagos
      WHERE cliente_id = $1
        AND estado IN ('pending', 'processing', 'overdue')
      ORDER BY due_date NULLS LAST, created_at`,
    [clienteId],
  );
  return rows;
}

export async function findById(id: number, clienteId?: number) {
  let sql = `
    SELECT p.identificador AS id, p.registrodesubasta_id, p.cliente_id,
           p.monto, p.moneda, p.estado, p.medio_pago_id, p.due_date,
           p.paid_at, p.fine_id, p.created_at,
           r.importe  AS base_amount,
           r.comision AS commission
      FROM pagos p
      LEFT JOIN registrodesubasta r ON r.identificador = p.registrodesubasta_id
     WHERE p.identificador = $1`;
  const params: unknown[] = [id];
  if (clienteId !== undefined) {
    sql += ' AND p.cliente_id = $2';
    params.push(clienteId);
  }
  const { rows } = await query<PaymentDetailRow>(sql, params);
  return rows[0] ?? null;
}

// ─── Pago + factura ───────────────────────────────────────────────────

export async function markAsPaid(
  client: PoolClient,
  paymentId: number,
  medioPagoId: number,
) {
  const { rowCount } = await client.query(
    `UPDATE pagos
        SET estado        = 'completed',
            medio_pago_id = $2,
            paid_at       = NOW()
      WHERE identificador = $1
        AND estado IN ('pending', 'processing')`,
    [paymentId, medioPagoId],
  );
  return rowCount ?? 0;
}

export async function insertFactura(
  client: PoolClient,
  pagoId: number,
  numero: string,
  monto: number,
  moneda: string,
) {
  const { rows } = await client.query<{ id: number }>(
    `INSERT INTO facturas (pago_id, numero, monto, moneda)
     VALUES ($1, $2, $3, $4)
     RETURNING identificador AS id`,
    [pagoId, numero, monto, moneda],
  );
  return rows[0].id;
}

// ─── Facturas ─────────────────────────────────────────────────────────

export async function listInvoicesByCliente(clienteId: number) {
  const { rows } = await query<InvoiceRow>(
    `SELECT f.identificador AS id,
            f.pago_id,
            f.numero,
            f.monto,
            f.moneda,
            f.pdf_url,
            f.issued_at
       FROM facturas f
       JOIN pagos    p ON p.identificador = f.pago_id
      WHERE p.cliente_id = $1
      ORDER BY f.issued_at DESC`,
    [clienteId],
  );
  return rows;
}

export async function insertPayment(data: {
  clienteId: number;
  monto: number;
  moneda: string;
  dueDate: string;
}): Promise<number> {
  const { rows } = await query<{ id: number }>(
    `INSERT INTO pagos (cliente_id, monto, moneda, estado, due_date)
     VALUES ($1, $2, $3, 'pending', $4)
     RETURNING identificador AS id`,
    [data.clienteId, data.monto, data.moneda, data.dueDate],
  );
  return rows[0].id;
}

// ─── Helper interno: ¿el medio de pago pertenece al cliente? ──────────

export async function medioPagoBelongsTo(medioPagoId: number, clienteId: number): Promise<boolean> {
  const { rows } = await query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM medios_pago WHERE identificador = $1 AND cliente_id = $2) AS exists`,
    [medioPagoId, clienteId],
  );
  return rows[0]?.exists ?? false;
}
