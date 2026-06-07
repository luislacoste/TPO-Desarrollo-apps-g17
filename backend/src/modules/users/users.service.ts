/**
 * Lógica de negocio del módulo Users.
 * Endpoints: GET/PUT /users/me, GET /users/me/metrics, GET /users/me/category.
 */
import * as repo from './users.repository';
import { findCategoryById, nextCategory } from '../categories/categories.service';
import { NotFound, UnprocessableEntity } from '../../utils/errors';

// ─── Tipos de respuesta (mapeo del MeRow al shape del swagger) ────────

export interface MeResponse {
  id: number;
  email: string;
  role: 'user' | 'admin';
  documento: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  domicilio: string | null;
  pais: string | null;
  category: string | null;
  admissionStatus: string | null;
  admissionNotes: string | null;
  admissionUpdatedAt: Date | null;
  admissionUpdatedBy: number | null;
  documentVerified: boolean;
  bidsBlocked: boolean;
  bidsBlockedReason: string | null;
  bidsBlockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}

function toMeResponse(row: repo.MeRow): MeResponse {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    documento: row.documento,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    domicilio: row.domicilio,
    pais: row.pais ?? row.pais_nombre,
    category: row.category,
    admissionStatus: row.admision_estado,
    admissionNotes: row.admision_notas,
    admissionUpdatedAt: row.admision_updated_at,
    admissionUpdatedBy: row.admision_updated_by,
    documentVerified: row.document_verified ?? false,
    bidsBlocked: row.bids_blocked ?? false,
    bidsBlockedReason: row.bids_blocked_reason,
    bidsBlockedUntil: row.bids_blocked_until,
    createdAt: row.created_at,
    updatedAt: row.perfil_updated_at,
  };
}

// ─── Casos de uso ─────────────────────────────────────────────────────

export async function getMe(clienteId: number): Promise<MeResponse> {
  const row = await repo.findMe(clienteId);
  if (!row) throw new NotFound('Usuario no encontrado');
  return toMeResponse(row);
}

export interface UpdateMeInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  domicilio?: string;
}

export async function updateMe(clienteId: number, input: UpdateMeInput): Promise<MeResponse> {
  // Filtrar valores vacíos para no pisar con string vacío.
  const clean: Record<string, string> = {};
  if (input.firstName !== undefined) clean.first_name = input.firstName.trim();
  if (input.lastName  !== undefined) clean.last_name  = input.lastName.trim();
  if (input.phone     !== undefined) clean.phone      = input.phone.trim();
  if (input.domicilio !== undefined) clean.domicilio  = input.domicilio.trim();

  if (Object.values(clean).some((v) => v === '')) {
    throw new UnprocessableEntity('Los campos no pueden quedar vacíos');
  }
  if (Object.keys(clean).length === 0) {
    // Nada que actualizar: devolvemos el estado actual.
    return getMe(clienteId);
  }

  await repo.updateMyProfile(clienteId, clean);

  // Si cambian first/last/domicilio, mantener `personas` sincronizado.
  if (clean.first_name !== undefined || clean.last_name !== undefined || clean.domicilio !== undefined) {
    const fresh = await repo.findMe(clienteId);
    if (fresh) {
      const nombre = `${fresh.first_name ?? ''} ${fresh.last_name ?? ''}`.trim();
      await repo.syncPersonaNombre(clienteId, nombre || 'N/A', clean.domicilio ?? null);
    }
  }

  return getMe(clienteId);
}

// ─── Métricas ─────────────────────────────────────────────────────────

export interface MetricsResponse {
  totalAuctions: number;
  wonAuctions: number;
  totalBids: number;
  totalSpent: number;
  winRate: number;
}

export async function getMyMetrics(clienteId: number): Promise<MetricsResponse> {
  const row = await repo.getMetrics(clienteId);
  const totalAuctions = Number(row.total_auctions);
  const wonAuctions   = Number(row.won_auctions);
  const totalBids     = Number(row.total_bids);
  const totalSpent    = Number(row.total_spent);
  const winRate = totalAuctions > 0 ? wonAuctions / totalAuctions : 0;

  return {
    totalAuctions,
    wonAuctions,
    totalBids,
    totalSpent,
    winRate: Number(winRate.toFixed(4)),
  };
}

// ─── Categoría del usuario + progreso ─────────────────────────────────

export interface MyCategoryResponse {
  current: ReturnType<typeof findCategoryById> | null;
  next: ReturnType<typeof findCategoryById> | null;
  /** Si está en `platino` ya no tiene siguiente. */
  isMax: boolean;
}

export async function getMyCategory(clienteId: number): Promise<MyCategoryResponse> {
  const row = await repo.findMe(clienteId);
  if (!row) throw new NotFound('Usuario no encontrado');
  const current = row.category ? findCategoryById(row.category) : null;
  const next    = row.category ? nextCategory(row.category)     : null;
  return { current, next, isMax: next === null };
}
