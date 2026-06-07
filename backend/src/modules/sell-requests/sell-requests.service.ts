/**
 * Lógica de negocio del módulo Sell Requests.
 *
 * Cubre el lado del vendedor del flujo. El lado de la empresa
 * (transiciones `pending → reviewing → rejected_by_company |
 * conditions_offered`) se va a manejar desde el módulo `admin`.
 *
 * Diagrama de estados (`SellRequest.status`):
 *   pending → reviewing →
 *     rejected_by_company             (terminal, motivo en rechazo_motivo)
 *   | conditions_offered →
 *       accepted                       (va a subasta)
 *     | conditions_rejected → returning → returned   (motivo del vendedor)
 */
import { withTransaction } from '../../db';
import * as repo from './sell-requests.repository';
import { Conflict, NotFound, UnprocessableEntity } from '../../utils/errors';

// ─── Tipos ────────────────────────────────────────────────────────────

export interface SubmitInput {
  clienteId: number;
  titulo: string;
  descripcion?: string;
  historia?: string;
  declaracionOrigenUrl?: string;
  imageUrls: string[];   // mínimo 6 según el swagger
}

export interface ReturnCostBreakdown {
  amount: number;
  currency: string;
  breakdown: {
    shipping: number;
    handling: number;
    insurance: number;
  };
  carrier: string;
  estimatedDeliveryDate: string; // ISO date
}

// ─── Helpers ──────────────────────────────────────────────────────────

const MIN_IMAGES = 6;

function calculateReturnCost(precioBase: number): ReturnCostBreakdown {
  const shipping  = 1500;
  const handling  = 500;
  const insurance = Math.max(200, precioBase * 0.01);
  const amount    = shipping + handling + insurance;

  const eta = new Date();
  eta.setDate(eta.getDate() + 7);

  return {
    amount: Number(amount.toFixed(2)),
    currency: 'ARS',
    breakdown: {
      shipping,
      handling,
      insurance: Number(insurance.toFixed(2)),
    },
    carrier: 'Andreani',
    estimatedDeliveryDate: eta.toISOString().slice(0, 10),
  };
}

/**
 * Garantiza que el cliente exista como `duenios` antes de hacer la
 * primera solicitud de venta. Idempotente.
 */
async function ensureDuenio(clienteId: number) {
  if (await repo.duenioExists(clienteId)) return;
  await withTransaction(async (client) => {
    await repo.ensureDuenioExists(client, clienteId);
  });
}

async function loadOwnRequest(duenioId: number, requestId: number) {
  const row = await repo.findById(requestId, duenioId);
  if (!row) throw new NotFound('Solicitud no encontrada');
  return row;
}

// ─── Casos de uso ─────────────────────────────────────────────────────

/**
 * POST /sell/request — el cliente carga un objeto a vender.
 * Crea (si hace falta) la fila de `duenios` para el cliente.
 */
export async function submitRequest(input: SubmitInput) {
  if (input.imageUrls.length < MIN_IMAGES) {
    throw new UnprocessableEntity(`Se requieren al menos ${MIN_IMAGES} imágenes`);
  }
  if (!input.titulo.trim()) {
    throw new UnprocessableEntity('Falta el título');
  }
  if (!input.declaracionOrigenUrl) {
    throw new UnprocessableEntity('Falta la declaración de titularidad');
  }

  await ensureDuenio(input.clienteId);

  return withTransaction(async (client) => {
    const id = await repo.insertSellRequest(client, {
      duenio_id: input.clienteId,
      titulo: input.titulo.trim(),
      descripcion: input.descripcion?.trim() ?? null,
      historia: input.historia?.trim() ?? null,
      declaracion_origen_url: input.declaracionOrigenUrl,
    });

    for (let i = 0; i < input.imageUrls.length; i++) {
      await repo.insertSellRequestImage(client, id, input.imageUrls[i], i);
    }

    return { id, estado: 'pending' as const };
  });
}

export async function listMyRequests(clienteId: number, page: number, limit: number) {
  const result = await repo.listByDuenio(clienteId, page, limit);
  return { ...result, page, limit };
}

export async function getMyRequestById(clienteId: number, requestId: number) {
  const row = await loadOwnRequest(clienteId, requestId);
  const images = await repo.listImages(row.id);
  return { ...row, images };
}

/**
 * PUT /sell/my-requests/{id}/accept — el vendedor acepta las condiciones
 * propuestas por la empresa. Solo válido en `conditions_offered`.
 */
export async function acceptConditions(clienteId: number, requestId: number) {
  const row = await loadOwnRequest(clienteId, requestId);
  if (row.estado !== 'conditions_offered') {
    throw new Conflict('Solo se pueden aceptar condiciones en estado conditions_offered');
  }
  const updated = await repo.acceptConditions(requestId);
  if (updated === 0) {
    throw new Conflict('No se pudo aceptar (estado cambió concurrentemente)');
  }
  return getMyRequestById(clienteId, requestId);
}

/**
 * POST /sell/my-requests/{id}/reject — el vendedor rechaza condiciones,
 * dispara el cálculo del costo de devolución y deja la solicitud en
 * `conditions_rejected`.
 */
export async function rejectConditions(
  clienteId: number,
  requestId: number,
  reason: string,
) {
  if (!reason.trim()) {
    throw new UnprocessableEntity('El motivo del rechazo es obligatorio');
  }
  const row = await loadOwnRequest(clienteId, requestId);
  if (row.estado !== 'conditions_offered') {
    throw new Conflict('Solo se pueden rechazar condiciones en estado conditions_offered');
  }

  const cost = calculateReturnCost(Number(row.precio_base ?? 0));

  const updated = await repo.rejectConditions(
    requestId,
    reason.trim(),
    cost.amount,
    cost.carrier,
    cost.estimatedDeliveryDate,
  );
  if (updated === 0) {
    throw new Conflict('No se pudo rechazar (estado cambió concurrentemente)');
  }

  return getMyRequestById(clienteId, requestId);
}

/**
 * GET /sell/my-requests/{id}/rejection-reason
 * Devuelve el motivo cuando la solicitud está rechazada (sea por la
 * empresa o por el vendedor).
 */
export async function getRejectionReason(clienteId: number, requestId: number) {
  const row = await loadOwnRequest(clienteId, requestId);
  const rechazada = ['rejected_by_company', 'conditions_rejected'].includes(row.estado);
  if (!rechazada) {
    throw new Conflict('La solicitud no está rechazada');
  }
  if (!row.rechazo_motivo || !row.rechazo_por || !row.rechazo_at) {
    throw new Conflict('La solicitud no tiene un motivo registrado');
  }
  return {
    rejectionBy: row.rechazo_por,
    reason: row.rechazo_motivo,
    rejectedAt: row.rechazo_at,
  };
}

/**
 * GET /sell/my-requests/{id}/return-cost
 * Devuelve el costo cuando la solicitud requiere devolución
 * (`conditions_rejected | returning | returned`).
 */
export async function getReturnCost(clienteId: number, requestId: number): Promise<ReturnCostBreakdown> {
  const row = await loadOwnRequest(clienteId, requestId);
  if (!['conditions_rejected', 'returning', 'returned'].includes(row.estado)) {
    throw new Conflict('La solicitud no está en un estado que requiera devolución');
  }
  if (row.return_amount === null) {
    // No debería pasar: el cálculo se hace en `rejectConditions`. Recalculo on-the-fly por defensa.
    return calculateReturnCost(Number(row.precio_base ?? 0));
  }
  const amount = Number(row.return_amount);
  // Reconstruyo el breakdown desde el total (proporciones fijas).
  return {
    amount,
    currency: 'ARS',
    breakdown: {
      shipping:  1500,
      handling:  500,
      insurance: Number((amount - 2000).toFixed(2)),
    },
    carrier: row.return_carrier ?? 'Andreani',
    estimatedDeliveryDate: row.return_eta ?? new Date().toISOString().slice(0, 10),
  };
}
