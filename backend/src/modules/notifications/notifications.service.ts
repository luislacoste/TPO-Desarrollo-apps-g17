import * as repo from './notifications.repository';
import { Conflict, NotFound } from '../../utils/errors';

const SETTINGS_KEYS = [
  'push_enabled',
  'email_enabled',
  'auction_starting',
  'bid_outbid',
  'bid_won',
  'payment_alerts',
] as const;

type SettingsKey = typeof SETTINGS_KEYS[number];
const SETTINGS_DEFAULTS: Record<SettingsKey, boolean> = {
  push_enabled: true,
  email_enabled: true,
  auction_starting: true,
  bid_outbid: true,
  bid_won: true,
  payment_alerts: true,
};

function toNotificationResponse(row: repo.NotificationRow) {
  return {
    id: row.id,
    tipo: row.tipo,
    titulo: row.titulo,
    mensaje: row.mensaje,
    metadata: row.metadata,
    leida: row.leida,
    leidaAt: row.leida_at,
    createdAt: row.created_at,
  };
}

function toSettingsResponse(row: repo.SettingsRow | null, clienteId: number) {
  return {
    clienteId,
    pushEnabled:     row?.push_enabled     ?? SETTINGS_DEFAULTS.push_enabled,
    emailEnabled:    row?.email_enabled    ?? SETTINGS_DEFAULTS.email_enabled,
    auctionStarting: row?.auction_starting ?? SETTINGS_DEFAULTS.auction_starting,
    bidOutbid:       row?.bid_outbid       ?? SETTINGS_DEFAULTS.bid_outbid,
    bidWon:          row?.bid_won          ?? SETTINGS_DEFAULTS.bid_won,
    paymentAlerts:   row?.payment_alerts   ?? SETTINGS_DEFAULTS.payment_alerts,
  };
}

// ─── Notificaciones ───────────────────────────────────────────────────

export async function listMine(clienteId: number, read?: boolean) {
  const rows = await repo.listByCliente(clienteId, read);
  return rows.map(toNotificationResponse);
}

export async function markRead(clienteId: number, id: number) {
  if (!(await repo.exists(id, clienteId))) {
    throw new NotFound('Notificación no encontrada');
  }
  const updated = await repo.markRead(id, clienteId);
  if (updated === 0) {
    throw new Conflict('La notificación ya estaba leída');
  }
  return { id, leida: true };
}

// ─── Settings ─────────────────────────────────────────────────────────

export async function getSettings(clienteId: number) {
  const row = await repo.getSettings(clienteId);
  return toSettingsResponse(row, clienteId);
}

export interface SettingsInput {
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  auctionStarting?: boolean;
  bidOutbid?: boolean;
  bidWon?: boolean;
  paymentAlerts?: boolean;
}

export async function updateSettings(clienteId: number, input: SettingsInput) {
  await repo.ensureSettings(clienteId);
  await repo.updateSettings(clienteId, {
    push_enabled:     input.pushEnabled,
    email_enabled:    input.emailEnabled,
    auction_starting: input.auctionStarting,
    bid_outbid:       input.bidOutbid,
    bid_won:          input.bidWon,
    payment_alerts:   input.paymentAlerts,
  });
  return getSettings(clienteId);
}
