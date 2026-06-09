/**
 * Queries SQL del módulo Admin.
 *
 * Cubre dos áreas:
 *   - gestión de usuarios (listado + transiciones de admisión / categoría)
 *   - gestión de multas (listado global + aplicar manual + condonar)
 *
 * Nota: los admins son personas que están al mismo tiempo en `clientes`
 * (rol admin) y en `empleados`. El seed crea persona/empleado/cliente
 * con id=1. Cuando un admin actúa, `req.user.sub = empleados.identificador`.
 */
import type { PoolClient } from 'pg';
import { query } from '../../db';

// ─── Listado de usuarios ──────────────────────────────────────────────

export interface AdminUserRow {
  id: number;
  email: string | null;
  role: 'user' | 'admin' | null;
  documento: string | null;
  first_name: string | null;
  last_name: string | null;
  categoria: 'bronce' | 'plata' | 'oro' | 'platino' | null;
  admision_estado: string | null;
  admision_notas: string | null;
  admision_updated_at: Date | null;
  admision_updated_by: number | null;
  bids_blocked: boolean;
  bids_blocked_reason: string | null;
  document_verified: boolean | null;
  created_at: Date | null;
}

const USER_SELECT = `
  SELECT c.identificador          AS id,
         cc.email,
         cc.role,
         p.documento,
         cp.first_name,
         cp.last_name,
         c.categoria,
         ca.estado                AS admision_estado,
         ca.notas                 AS admision_notas,
         ca.updated_at            AS admision_updated_at,
         ca.updated_by            AS admision_updated_by,
         COALESCE(cprt.bids_blocked, FALSE) AS bids_blocked,
         cprt.bids_blocked_reason,
         cp.document_verified,
         cc.created_at
    FROM clientes c
    LEFT JOIN clientes_credenciales  cc   ON cc.cliente_id   = c.identificador
    LEFT JOIN personas               p    ON p.identificador = c.identificador
    LEFT JOIN clientes_perfil        cp   ON cp.cliente_id   = c.identificador
    LEFT JOIN clientes_admision      ca   ON ca.cliente_id   = c.identificador
    LEFT JOIN clientes_participacion cprt ON cprt.cliente_id = c.identificador
`;

interface UsersListFilters {
  admissionStatus?: string;
  category?: string;
  search?: string;
  page: number;
  limit: number;
}

export async function listUsers(f: UsersListFilters) {
  const where: string[] = [];
  const params: unknown[] = [];
  let i = 0;

  if (f.admissionStatus) { where.push(`ca.estado    = $${++i}`); params.push(f.admissionStatus); }
  if (f.category)        { where.push(`c.categoria  = $${++i}`); params.push(f.category); }
  if (f.search) {
    const pat = `%${f.search}%`;
    where.push(`(cc.email ILIKE $${++i} OR cp.first_name ILIKE $${i} OR cp.last_name ILIKE $${i} OR p.documento ILIKE $${i})`);
    params.push(pat);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const { rows } = await query<AdminUserRow>(
    `${USER_SELECT}
     ${whereSql}
     ORDER BY c.identificador
     LIMIT $${++i} OFFSET $${++i}`,
    [...params, f.limit, (f.page - 1) * f.limit],
  );

  const totalQ = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total
       FROM clientes c
       LEFT JOIN clientes_credenciales  cc ON cc.cliente_id   = c.identificador
       LEFT JOIN personas               p  ON p.identificador = c.identificador
       LEFT JOIN clientes_perfil        cp ON cp.cliente_id   = c.identificador
       LEFT JOIN clientes_admision      ca ON ca.cliente_id   = c.identificador
       ${whereSql}`,
    params,
  );

  return { items: rows, total: totalQ.rows[0].total };
}

export async function findUserById(id: number) {
  const { rows } = await query<AdminUserRow>(
    `${USER_SELECT} WHERE c.identificador = $1`,
    [id],
  );
  return rows[0] ?? null;
}

// ─── Mutaciones sobre usuario ─────────────────────────────────────────

export async function setAdmissionStatus(
  client: PoolClient | null,
  clienteId: number,
  estado: string,
  notas: string | null,
  updatedBy: number,
) {
  const exec = client ? client.query.bind(client) : query;
  await exec(
    `INSERT INTO clientes_admision (cliente_id, estado, notas, updated_at, updated_by)
     VALUES ($1, $2, $3, NOW(), $4)
     ON CONFLICT (cliente_id) DO UPDATE
       SET estado     = EXCLUDED.estado,
           notas      = COALESCE(EXCLUDED.notas, clientes_admision.notas),
           updated_at = NOW(),
           updated_by = EXCLUDED.updated_by`,
    [clienteId, estado, notas, updatedBy],
  );

  // Sincronizar `clientes.admitido` con el flag legacy del enunciado.
  const admitido = estado === 'approved' ? 'si' : 'no';
  await exec(
    `UPDATE clientes SET admitido = $2 WHERE identificador = $1`,
    [clienteId, admitido],
  );
}

export async function setCategory(clienteId: number, categoria: string) {
  const { rowCount } = await query(
    `UPDATE clientes SET categoria = $2 WHERE identificador = $1`,
    [clienteId, categoria],
  );
  return rowCount ?? 0;
}

export async function setBidsBlocked(
  client: PoolClient | null,
  clienteId: number,
  blocked: boolean,
  reason: string | null,
  until: string | null,
) {
  const exec = client ? client.query.bind(client) : query;
  await exec(
    `INSERT INTO clientes_participacion
       (cliente_id, bids_blocked, bids_blocked_reason, bids_blocked_until, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (cliente_id) DO UPDATE
       SET bids_blocked        = EXCLUDED.bids_blocked,
           bids_blocked_reason = EXCLUDED.bids_blocked_reason,
           bids_blocked_until  = EXCLUDED.bids_blocked_until,
           updated_at          = NOW()`,
    [clienteId, blocked, reason, until],
  );
}

// ─── Listado / lookups de multas ──────────────────────────────────────

export interface AdminFineRow {
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

const FINE_SELECT = `
  SELECT identificador AS id, cliente_id, pago_id, pujo_id,
         bid_amount, fine_percentage, amount, moneda, estado,
         issued_at, deadline_at, paid_at, waived_at, waived_by, waived_reason
    FROM multas
`;

interface FineListFilters {
  status?: string;
  userId?: number;
  page: number;
  limit: number;
}

export async function listFines(f: FineListFilters) {
  const where: string[] = [];
  const params: unknown[] = [];
  let i = 0;

  if (f.status)         { where.push(`estado     = $${++i}`); params.push(f.status); }
  if (f.userId)         { where.push(`cliente_id = $${++i}`); params.push(f.userId); }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { rows } = await query<AdminFineRow>(
    `${FINE_SELECT}
     ${whereSql}
     ORDER BY issued_at DESC
     LIMIT $${++i} OFFSET $${++i}`,
    [...params, f.limit, (f.page - 1) * f.limit],
  );
  const totalQ = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM multas ${whereSql}`,
    params,
  );
  return { items: rows, total: totalQ.rows[0].total };
}

export async function findFineById(id: number) {
  const { rows } = await query<AdminFineRow>(
    `${FINE_SELECT} WHERE identificador = $1`,
    [id],
  );
  return rows[0] ?? null;
}

// ─── Apply fine ──────────────────────────────────────────────────────

export async function getPaymentForFine(paymentId: number) {
  const { rows } = await query<{
    id: number;
    cliente_id: number;
    monto: string;
    moneda: string;
    estado: string;
    fine_id: number | null;
    bid_amount: string | null;
  }>(
    `SELECT p.identificador  AS id,
            p.cliente_id,
            p.monto,
            p.moneda,
            p.estado,
            p.fine_id,
            r.importe        AS bid_amount
       FROM pagos p
       LEFT JOIN registrodesubasta r ON r.identificador = p.registrodesubasta_id
      WHERE p.identificador = $1`,
    [paymentId],
  );
  return rows[0] ?? null;
}

export async function insertFine(
  client: PoolClient,
  data: {
    cliente_id: number;
    pago_id: number;
    bid_amount: number;
    fine_percentage: number;
    amount: number;
    moneda: string;
    deadlineHours: number;
  },
) {
  const { rows } = await client.query<{ id: number }>(
    `INSERT INTO multas
       (cliente_id, pago_id, bid_amount, fine_percentage, amount, moneda,
        estado, issued_at, deadline_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(),
             NOW() + ($7::int || ' hours')::interval)
     RETURNING identificador AS id`,
    [data.cliente_id, data.pago_id, data.bid_amount, data.fine_percentage,
     data.amount, data.moneda, data.deadlineHours],
  );
  return rows[0].id;
}

export async function linkPaymentToFine(
  client: PoolClient,
  paymentId: number,
  fineId: number,
) {
  await client.query(
    `UPDATE pagos SET fine_id = $2, estado = 'overdue' WHERE identificador = $1`,
    [paymentId, fineId],
  );
}

// ─── Waive ────────────────────────────────────────────────────────────

export async function waiveFine(
  client: PoolClient,
  fineId: number,
  byEmpleadoId: number,
  reason: string,
) {
  const { rowCount } = await client.query(
    `UPDATE multas
        SET estado        = 'waived',
            waived_at     = NOW(),
            waived_by     = $2,
            waived_reason = $3
      WHERE identificador = $1
        AND estado IN ('pending', 'overdue')`,
    [fineId, byEmpleadoId, reason],
  );
  return rowCount ?? 0;
}

export async function countOpenFinesFor(clienteId: number, exceptId?: number): Promise<number> {
  let sql = `SELECT COUNT(*)::int AS count FROM multas
              WHERE cliente_id = $1
                AND estado IN ('pending', 'overdue')`;
  const params: unknown[] = [clienteId];
  if (exceptId !== undefined) {
    sql += ' AND identificador <> $2';
    params.push(exceptId);
  }
  const { rows } = await query<{ count: number }>(sql, params);
  return rows[0]?.count ?? 0;
}
