/**
 * Queries SQL del módulo Users.
 *
 * Las tablas involucradas son varias (personas + clientes + perfil +
 * credenciales + admisión + participación), así que el repository
 * concentra los JOINs y deja al service trabajar con un solo objeto.
 */
import type { PoolClient } from 'pg';
import { query } from '../../db';

// ─── Tipos planos ─────────────────────────────────────────────────────

export interface MeRow {
  id: number;
  email: string;
  role: 'user' | 'admin';
  documento: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  domicilio: string | null;
  pais: string | null;
  numeropais: number | null;
  pais_nombre: string | null;
  category: 'comun' | 'especial' | 'plata' | 'oro' | 'platino' | null;
  admision_estado: string | null;
  admision_notas: string | null;
  admision_updated_at: Date | null;
  admision_updated_by: number | null;
  document_verified: boolean | null;
  bids_blocked: boolean | null;
  bids_blocked_reason: string | null;
  bids_blocked_until: Date | null;
  created_at: Date;
  perfil_updated_at: Date | null;
}

export interface MetricsRow {
  total_auctions: number;
  won_auctions: number;
  total_bids: number;
  total_spent: number;
}

// ─── Lookups ──────────────────────────────────────────────────────────

export async function findMe(clienteId: number): Promise<MeRow | null> {
  const { rows } = await query<MeRow>(
    `SELECT
        cc.cliente_id                          AS id,
        cc.email                               AS email,
        cc.role                                AS role,
        p.documento                            AS documento,
        cp.first_name                          AS first_name,
        cp.last_name                           AS last_name,
        cp.phone                               AS phone,
        cp.domicilio                           AS domicilio,
        cp.pais                                AS pais,
        c.numeropais                           AS numeropais,
        pa.nombre                              AS pais_nombre,
        c.categoria                            AS category,
        ca.estado                              AS admision_estado,
        ca.notas                               AS admision_notas,
        ca.updated_at                          AS admision_updated_at,
        ca.updated_by                          AS admision_updated_by,
        cp.document_verified                   AS document_verified,
        COALESCE(cprt.bids_blocked, FALSE)     AS bids_blocked,
        cprt.bids_blocked_reason               AS bids_blocked_reason,
        cprt.bids_blocked_until                AS bids_blocked_until,
        cc.created_at                          AS created_at,
        cp.updated_at                          AS perfil_updated_at
       FROM clientes_credenciales      cc
       JOIN clientes                   c    ON c.identificador  = cc.cliente_id
       JOIN personas                   p    ON p.identificador  = cc.cliente_id
  LEFT JOIN clientes_perfil            cp   ON cp.cliente_id    = cc.cliente_id
  LEFT JOIN clientes_admision          ca   ON ca.cliente_id    = cc.cliente_id
  LEFT JOIN clientes_participacion     cprt ON cprt.cliente_id  = cc.cliente_id
  LEFT JOIN paises                     pa   ON pa.numero        = c.numeropais
      WHERE cc.cliente_id = $1`,
    [clienteId],
  );
  return rows[0] ?? null;
}

export async function getMetrics(clienteId: number): Promise<MetricsRow> {
  // Una sola query con subqueries; cada subquery toca una tabla distinta.
  const { rows } = await query<MetricsRow>(
    `SELECT
        COALESCE((SELECT COUNT(DISTINCT a.subasta)
                    FROM asistentes a
                   WHERE a.cliente = $1), 0)::int AS total_auctions,
        COALESCE((SELECT COUNT(*)
                    FROM registrodesubasta r
                   WHERE r.cliente = $1), 0)::int AS won_auctions,
        COALESCE((SELECT COUNT(p.identificador)
                    FROM pujos p
                    JOIN asistentes a ON a.identificador = p.asistente
                   WHERE a.cliente = $1), 0)::int AS total_bids,
        COALESCE((SELECT SUM(r.importe)
                    FROM registrodesubasta r
                   WHERE r.cliente = $1), 0)::numeric AS total_spent`,
    [clienteId],
  );
  return rows[0];
}

// ─── Actualización de perfil ──────────────────────────────────────────

interface UpdateProfileInput {
  first_name?: string;
  last_name?:  string;
  phone?:      string;
  domicilio?:  string;
}

export async function updateMyProfile(
  clienteId: number,
  data: UpdateProfileInput,
) {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const [col, value] of Object.entries(data)) {
    if (value === undefined) continue;
    sets.push(`${col} = $${++i}`);
    values.push(value);
  }
  if (sets.length === 0) return;

  values.unshift(clienteId);
  await query(
    `UPDATE clientes_perfil
        SET ${sets.join(', ')}, updated_at = NOW()
      WHERE cliente_id = $1`,
    values,
  );
}

/**
 * `personas.nombre` se mantiene sincronizado con first_name + last_name
 * (lo usa el enunciado en otras partes del modelo).
 * Recibe un client opcional para sumarse a una transacción si hace falta.
 */
export async function syncPersonaNombre(
  clienteId: number,
  nombre: string,
  direccion: string | null,
  client?: PoolClient,
) {
  const exec = client ? client.query.bind(client) : query;
  await exec(
    `UPDATE personas
        SET nombre = $2,
            direccion = COALESCE($3, direccion)
      WHERE identificador = $1`,
    [clienteId, nombre, direccion],
  );
}
