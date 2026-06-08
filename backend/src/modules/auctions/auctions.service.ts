/**
 * Lógica de negocio del módulo Auctions.
 */
import * as repo from './auctions.repository';
import { findCategoryById } from '../categories/categories.service';
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
 *
 * Reglas (consigna):
 *   1. la subasta tiene que estar `abierta`;
 *   2. el cliente tiene que estar `admision.estado = approved` y no
 *      tener `bids_blocked = true` (`assertCanParticipate`);
 *   3. la **categoría del cliente** tiene que ser **mayor o igual** que
 *      la categoría de la subasta (bronce<plata<oro<platino);
 *   4. el cliente tiene que tener **al menos un medio de pago verificado**
 *      por la empresa;
 *   5. el cliente **no** puede estar conectado a otra subasta abierta.
 *
 * Si ya está inscripto en la misma subasta, devuelve idempotentemente la
 * asistencia existente.
 *
 * Devuelve `{ sessionId, asistente, wsUrl }`.
 */
export async function join(clienteId: number, subastaId: number) {
  const auction = await repo.findSubastaById(subastaId);
  if (!auction) throw new NotFound('Subasta no encontrada');
  if (auction.estado !== 'abierta') {
    throw new Conflict('La subasta no está abierta');
  }

  // (2) admisión + participación
  await assertCanParticipate(clienteId);

  // (3) categoría del cliente >= categoría de la subasta
  if (auction.categoria) {
    const clientCat = await repo.getClienteCategoria(clienteId);
    const auctionTier = findCategoryById(auction.categoria)?.tier ?? 0;
    const clientTier  = clientCat ? (findCategoryById(clientCat)?.tier ?? 0) : 0;
    if (clientTier < auctionTier) {
      throw new Forbidden(
        `Tu categoría (${clientCat ?? 'sin categoría'}) no permite acceder a una subasta ${auction.categoria}`,
      );
    }
  }

  // (4) medio de pago verificado por la empresa
  if (!(await repo.hasVerifiedPaymentMethod(clienteId))) {
    throw new Forbidden(
      'Necesitás al menos un medio de pago verificado por la empresa para participar',
    );
  }

  // Idempotencia: si ya está en ESTA subasta, devolver la asistencia existente.
  const existing = await repo.findAsistencia(clienteId, subastaId);
  if (existing) {
    return {
      sessionId: existing.id,
      asistente: { id: existing.id, numeropostor: existing.numeropostor },
      wsUrl: buildWsUrl(subastaId),
    };
  }

  // (5) no puede estar conectado a otra subasta abierta.
  if (await repo.hasActiveAsistenciaElsewhere(clienteId, subastaId)) {
    throw new Conflict(
      'Ya estás conectado a otra subasta abierta. No podés participar en más de una a la vez.',
    );
  }

  const numeropostor = await repo.nextPostorNumber(subastaId);
  const asistenteId  = await repo.insertAsistente(clienteId, subastaId, numeropostor);

  return {
    sessionId: asistenteId,
    asistente: { id: asistenteId, numeropostor },
    wsUrl: buildWsUrl(subastaId),
  };
}

export async function create(data: {
  fecha: string;
  hora: string;
  estado?: string;
  subastadorId?: number;
  ubicacion?: string;
  categoria?: string;
  moneda?: string;
  capacidadAsistentes?: number;
  tieneDeposito?: string;
  seguridadPropia?: string;
}) {
  if (!data.fecha) throw new UnprocessableEntity('fecha es requerida');
  if (!data.hora)  throw new UnprocessableEntity('hora es requerida');

  const VALID_ESTADOS    = ['abierta', 'cerrada'];
  const VALID_CATEGORIAS = ['bronce', 'plata', 'oro', 'platino'];
  const VALID_MONEDAS    = ['ARS', 'USD'];

  if (data.estado && !VALID_ESTADOS.includes(data.estado)) {
    throw new UnprocessableEntity(`estado inválido: ${data.estado}`);
  }
  if (data.categoria && !VALID_CATEGORIAS.includes(data.categoria)) {
    throw new UnprocessableEntity(`categoria inválida: ${data.categoria}`);
  }
  if (data.moneda && !VALID_MONEDAS.includes(data.moneda)) {
    throw new UnprocessableEntity(`moneda inválida: ${data.moneda}`);
  }

  const id = await repo.insertSubasta({
    fecha:               data.fecha,
    hora:                data.hora,
    estado:              (data.estado as 'abierta' | 'cerrada') ?? 'abierta',
    subastador:          data.subastadorId,
    ubicacion:           data.ubicacion,
    categoria:           data.categoria as 'bronce' | 'plata' | 'oro' | 'platino' | undefined,
    moneda:              (data.moneda as 'ARS' | 'USD') ?? 'ARS',
    capacidadasistentes: data.capacidadAsistentes,
    tienedeposito:       data.tieneDeposito as 'si' | 'no' | undefined,
    seguridadpropia:     data.seguridadPropia as 'si' | 'no' | undefined,
  });

  const subasta = await repo.findSubastaById(id);
  return subasta!;
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
