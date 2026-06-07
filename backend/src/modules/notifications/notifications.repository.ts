/**
 * Queries SQL del módulo Notifications.
 * Maneja `notificaciones` + `notificaciones_settings`.
 */
import { query } from '../../db';

export interface NotificationRow {
  id: number;
  cliente_id: number;
  tipo: string;
  titulo: string | null;
  mensaje: string | null;
  metadata: Record<string, unknown> | null;
  leida: boolean;
  leida_at: Date | null;
  created_at: Date;
}

export interface SettingsRow {
  cliente_id: number;
  push_enabled: boolean;
  email_enabled: boolean;
  auction_starting: boolean;
  bid_outbid: boolean;
  bid_won: boolean;
  payment_alerts: boolean;
}

// ─── Notificaciones ───────────────────────────────────────────────────

export async function listByCliente(clienteId: number, read?: boolean) {
  let sql = `SELECT identificador AS id, cliente_id, tipo, titulo, mensaje,
                    metadata, leida, leida_at, created_at
               FROM notificaciones
              WHERE cliente_id = $1`;
  const params: unknown[] = [clienteId];
  if (read !== undefined) {
    sql += ' AND leida = $2';
    params.push(read);
  }
  sql += ' ORDER BY created_at DESC';
  const { rows } = await query<NotificationRow>(sql, params);
  return rows;
}

export async function markRead(id: number, clienteId: number) {
  const { rowCount } = await query(
    `UPDATE notificaciones
        SET leida    = TRUE,
            leida_at = NOW()
      WHERE identificador = $1
        AND cliente_id    = $2
        AND leida = FALSE`,
    [id, clienteId],
  );
  return rowCount ?? 0;
}

export async function exists(id: number, clienteId: number): Promise<boolean> {
  const { rows } = await query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM notificaciones WHERE identificador = $1 AND cliente_id = $2) AS exists`,
    [id, clienteId],
  );
  return rows[0]?.exists ?? false;
}

// ─── Settings ─────────────────────────────────────────────────────────

export async function getSettings(clienteId: number) {
  const { rows } = await query<SettingsRow>(
    `SELECT cliente_id, push_enabled, email_enabled, auction_starting,
            bid_outbid, bid_won, payment_alerts
       FROM notificaciones_settings
      WHERE cliente_id = $1`,
    [clienteId],
  );
  return rows[0] ?? null;
}

export async function ensureSettings(clienteId: number) {
  await query(
    `INSERT INTO notificaciones_settings (cliente_id)
     VALUES ($1)
     ON CONFLICT (cliente_id) DO NOTHING`,
    [clienteId],
  );
}

interface SettingsPatch {
  push_enabled?: boolean;
  email_enabled?: boolean;
  auction_starting?: boolean;
  bid_outbid?: boolean;
  bid_won?: boolean;
  payment_alerts?: boolean;
}

export async function updateSettings(clienteId: number, patch: SettingsPatch) {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const [col, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    sets.push(`${col} = $${++i}`);
    values.push(value);
  }
  if (sets.length === 0) return;
  values.unshift(clienteId);
  await query(
    `UPDATE notificaciones_settings
        SET ${sets.join(', ')}
      WHERE cliente_id = $1`,
    values,
  );
}
