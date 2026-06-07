/**
 * Lógica de negocio del módulo Auctions.
 */
import * as repo from './auctions.repository';
import { query } from '../../db';
import { Conflict, Forbidden, NotFound, UnprocessableEntity } from '../../utils/errors';

interface ListInput {
  status?: string;
  category?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

export async function list(input: ListInput) {
  const page  = Math.max(1, Number(input.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(input.limit ?? 20)));

  const status = input.status as 'abierta' | 'cerrada' | undefined;
  if (status && !['abierta', 'cerrada'].includes(status)) {
    throw new UnprocessableEntity(`status inválido: ${input.status}`);
  }

  const { items, total } = await repo.listSubastas({
    status,
    category: input.category,
    fechaDesde: input.fechaDesde,
    fechaHasta: input.fechaHasta,
    page,
    limit,
  });

  return { items, page, limit, total };
}

export function listActive()   { return repo.findActiveSubastas(); }
export function listUpcoming() { return repo.findUpcomingSubastas(); }

export async function getById(id: number) {
  const row = await repo.findSubastaById(id);
  if (!row) throw new NotFound('Subasta no encontrada');
  return row;
}

export async function getCatalog(id: number) {
  // Asegurarnos que la subasta existe antes de devolver el catálogo (vacío sino).
  const auction = await repo.findSubastaById(id);
  if (!auction) throw new NotFound('Subasta no encontrada');
  return repo.getSubastaCatalog(id);
}

/**
 * POST /auctions/{id}/join — el cliente se inscribe como asistente.
 * Reglas:
 *   - el cliente tiene que estar `admision.estado = approved`
 *   - el cliente no puede tener `bids_blocked = true`
 *   - la subasta tiene que estar `abierta`
 *   - no puede unirse dos veces (devuelve la asistencia existente)
 *
 * Devuelve `{ sessionId, asistente, wsUrl }`. La URL del WebSocket es
 * el placeholder definido en el swagger.
 */
export async function join(clienteId: number, subastaId: number) {
  const auction = await repo.findSubastaById(subastaId);
  if (!auction) throw new NotFound('Subasta no encontrada');
  if (auction.estado !== 'abierta') {
    throw new Conflict('La subasta no está abierta');
  }

  await assertCanParticipate(clienteId);

  const existing = await repo.findAsistencia(clienteId, subastaId);
  if (existing) {
    return {
      sessionId: existing.id,
      asistente: { id: existing.id, numeropostor: existing.numeropostor },
      wsUrl: buildWsUrl(subastaId),
    };
  }

  const numeropostor = await repo.nextPostorNumber(subastaId);
  const asistenteId  = await repo.insertAsistente(clienteId, subastaId, numeropostor);

  return {
    sessionId: asistenteId,
    asistente: { id: asistenteId, numeropostor },
    wsUrl: buildWsUrl(subastaId),
  };
}

export async function getStreamUrl(subastaId: number) {
  const auction = await repo.findSubastaById(subastaId);
  if (!auction) throw new NotFound('Subasta no encontrada');
  // Placeholder: el streaming real se conectaría a un servicio externo.
  return {
    auctionId: subastaId,
    streamUrl: `https://stream.subastar.com/auction/${subastaId}`,
    wsUrl: buildWsUrl(subastaId),
  };
}

// ─── Helpers internos (también los usa el módulo bids) ────────────────

function buildWsUrl(subastaId: number) {
  return `wss://api.subastar.com/ws/auction/${subastaId}`;
}

/**
 * Compartido con bids: chequea que el cliente esté apto para pujar /
 * participar. Si no, tira el error apropiado.
 */
export async function assertCanParticipate(clienteId: number) {
  const { rows } = await query<{
    admision_estado: string | null;
    bids_blocked: boolean | null;
  }>(
    `SELECT ca.estado AS admision_estado,
            COALESCE(cprt.bids_blocked, FALSE) AS bids_blocked
       FROM clientes c
  LEFT JOIN clientes_admision        ca   ON ca.cliente_id   = c.identificador
  LEFT JOIN clientes_participacion   cprt ON cprt.cliente_id = c.identificador
      WHERE c.identificador = $1`,
    [clienteId],
  );
  const r = rows[0];
  if (!r) throw new NotFound('Cliente no encontrado');
  if (r.admision_estado !== 'approved') {
    throw new Forbidden('Tu cuenta aún no está aprobada');
  }
  if (r.bids_blocked) {
    throw new Forbidden('Tu participación está bloqueada (multas vigentes)');
  }
}
