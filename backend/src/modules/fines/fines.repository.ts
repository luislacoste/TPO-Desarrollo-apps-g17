/**
 * Queries SQL del módulo Fines.
 *
 * Multas del 10% por impago, con `deadline_at = issued_at + 72h`.
 * Cuando se vence el plazo: la multa pasa a `overdue` y el usuario
 * queda con `admissionStatus = blocked`. Procesado on-read (sin cron).
 */
import type { PoolClient } from 'pg';
import { query } from '../../db';

export interface FineRow {
  id: number;
  cliente_id: number;
  pago_id: number | null;
  pujo_id: number | null;
  bid_amount: string;
  fine_percentage: string;
  amount: string;
  moneda: string;
  estado: 'pending' | 'paid' | 'overdue' | 'waived';
  issued_at: Date;
  deadline_at: Date;
  paid_at: Date | null;
  waived_at: Date | null;
  waived_by: number | null;
  waived_reason: string | null;
}

const SELECT_FINE = `
  SELECT identificador AS id, cliente_id, pago_id, pujo_id,
         bid_amount, fine_percentage, amount, moneda, estado,
         issued_at, deadline_at, paid_at, waived_at, waived_by, waived_reason
    FROM multas
`;

// ─── Auto-overdue: actualiza pending → overdue cuando vencieron 72hs ──

/**
 * Marca como overdue las multas pending del cliente que ya pasaron su
 * deadline, y bloquea su cuenta. Devuelve la cantidad de multas
 * transicionadas.
 */
export async function processOverdueForCliente(
  client: PoolClient | null,
  clienteId: number,
): Promise<number> {
  const exec = client ? client.query.bind(client) : query;

  const upd = await exec(
    `UPDATE multas
        SET estado = 'overdue'
      WHERE cliente_id = $1
        AND estado     = 'pending'
        AND deadline_at < NOW()`,
    [clienteId],
  );

  const transitioned = upd.rowCount ?? 0;
  if (transitioned > 0) {
    // Bloqueo total de la cuenta + bloqueo de pujas.
    await exec(
      `UPDATE clientes_admision
          SET estado     = 'blocked',
              notas      = COALESCE(notas, '') || ' [auto] Multa(s) vencida(s).',
              updated_at = NOW()
        WHERE cliente_id = $1`,
      [clienteId],
    );
    await exec(
      `INSERT INTO clientes_participacion (cliente_id, bids_blocked, bids_blocked_reason)
       VALUES ($1, TRUE, 'overdue_fine')
       ON CONFLICT (cliente_id) DO UPDATE
         SET bids_blocked        = TRUE,
             bids_blocked_reason = 'overdue_fine',
             updated_at          = NOW()`,
      [clienteId],
    );
  }
  return transitioned;
}

// ─── Lookups ──────────────────────────────────────────────────────────

export async function listByCliente(clienteId: number, status?: string) {
  let sql = `${SELECT_FINE} WHERE cliente_id = $1`;
  const params: unknown[] = [clienteId];
  if (status) {
    sql += ' AND estado = $2';
    params.push(status);
  }
  sql += ' ORDER BY issued_at DESC';
  const { rows } = await query<FineRow>(sql, params);
  return rows;
}

export async function findById(id: number, clienteId?: number) {
  let sql = `${SELECT_FINE} WHERE identificador = $1`;
  const params: unknown[] = [id];
  if (clienteId !== undefined) {
    sql += ' AND cliente_id = $2';
    params.push(clienteId);
  }
  const { rows } = await query<FineRow>(sql, params);
  return rows[0] ?? null;
}

export async function countOtherPending(clienteId: number, exceptId: number): Promise<number> {
  const { rows } = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count
       FROM multas
      WHERE cliente_id    = $1
        AND identificador <> $2
        AND estado IN ('pending', 'overdue')`,
    [clienteId, exceptId],
  );
  return rows[0]?.count ?? 0;
}

// ─── Pago ─────────────────────────────────────────────────────────────

export async function markFinePaid(client: PoolClient, fineId: number) {
  const { rowCount } = await client.query(
    `UPDATE multas
        SET estado = 'paid',
            paid_at = NOW()
      WHERE identificador = $1
        AND estado        = 'pending'`,
    [fineId],
  );
  return rowCount ?? 0;
}

export async function unblockParticipation(client: PoolClient, clienteId: number) {
  await client.query(
    `UPDATE clientes_participacion
        SET bids_blocked        = FALSE,
            bids_blocked_reason = NULL,
            bids_blocked_until  = NULL,
            updated_at          = NOW()
      WHERE cliente_id = $1`,
    [clienteId],
  );
}
