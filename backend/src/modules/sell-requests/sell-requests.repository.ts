/**
 * Queries SQL del módulo Sell Requests.
 *
 * Las solicitudes viven en `solicitudes_venta` (complemento) y referencian
 * a `duenios` (tabla del enunciado). Como cliente y dueño son ambos extensiones
 * de `personas`, el mismo `identificador` puede tener fila en clientes y en duenios.
 * Si no existe el row de dueño cuando un cliente hace su primera solicitud,
 * lo creamos automáticamente con `ensureDuenioExists`.
 */
import type { PoolClient } from 'pg';
import { query } from '../../db';

const SYSTEM_VERIFICADOR_ID = 1;
const DEFAULT_RIESGO        = 3;

// ─── Tipos planos ─────────────────────────────────────────────────────

export interface SellRequestRow {
  id: number;
  duenio_id: number;
  producto_id: number | null;
  titulo: string;
  descripcion: string | null;
  historia: string | null;
  declaracion_origen_url: string | null;
  estado: string;
  precio_base: string | null;
  comision_porcentaje: string | null;
  moneda: string | null;
  condiciones_notas: string | null;
  condiciones_offered_at: Date | null;
  rechazo_motivo: string | null;
  rechazo_por: 'company' | 'user' | null;
  rechazo_at: Date | null;
  return_amount: string | null;
  return_carrier: string | null;
  return_eta: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ImageRow {
  id: number;
  url: string;
  orden: number;
}

// ─── duenios shell ────────────────────────────────────────────────────

export async function duenioExists(personaId: number): Promise<boolean> {
  const { rows } = await query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM duenios WHERE identificador = $1) AS exists`,
    [personaId],
  );
  return rows[0]?.exists ?? false;
}

/**
 * Crea la fila de `duenios` para una persona si no existe.
 * Toma el `numeropais` desde `clientes` del mismo identificador.
 */
export async function ensureDuenioExists(client: PoolClient, personaId: number) {
  const { rowCount } = await client.query(
    `INSERT INTO duenios (identificador, numeropais, verificacion_financiera, verificacion_judicial, calificacionriesgo, verificador)
     SELECT $1,
            c.numeropais,
            'no', 'no', $2, $3
       FROM clientes c
      WHERE c.identificador = $1
        AND NOT EXISTS (SELECT 1 FROM duenios d WHERE d.identificador = $1)`,
    [personaId, DEFAULT_RIESGO, SYSTEM_VERIFICADOR_ID],
  );
  return rowCount ?? 0;
}

// ─── Inserts (multipart) ──────────────────────────────────────────────

export async function insertSellRequest(
  client: PoolClient,
  data: {
    duenio_id: number;
    titulo: string;
    descripcion: string | null;
    historia: string | null;
    declaracion_origen_url: string | null;
  },
): Promise<number> {
  const { rows } = await client.query<{ id: number }>(
    `INSERT INTO solicitudes_venta
       (duenio_id, titulo, descripcion, historia, declaracion_origen_url, estado)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING identificador AS id`,
    [data.duenio_id, data.titulo, data.descripcion, data.historia, data.declaracion_origen_url],
  );
  return rows[0].id;
}

export async function insertSellRequestImage(
  client: PoolClient,
  solicitudId: number,
  url: string,
  orden: number,
) {
  await client.query(
    `INSERT INTO sell_request_imagenes (solicitud_id, url, orden)
     VALUES ($1, $2, $3)`,
    [solicitudId, url, orden],
  );
}

// ─── Lookups ──────────────────────────────────────────────────────────

export async function findById(id: number, duenioId?: number) {
  let sql = `SELECT identificador          AS id,
                    duenio_id,
                    producto_id,
                    titulo,
                    descripcion,
                    historia,
                    declaracion_origen_url,
                    estado,
                    precio_base,
                    comision_porcentaje,
                    moneda,
                    condiciones_notas,
                    condiciones_offered_at,
                    rechazo_motivo,
                    rechazo_por,
                    rechazo_at,
                    return_amount,
                    return_carrier,
                    return_eta,
                    created_at,
                    updated_at
               FROM solicitudes_venta
              WHERE identificador = $1`;
  const params: unknown[] = [id];
  if (duenioId !== undefined) {
    sql += ' AND duenio_id = $2';
    params.push(duenioId);
  }
  const { rows } = await query<SellRequestRow>(sql, params);
  return rows[0] ?? null;
}

export async function listByDuenio(duenioId: number, page: number, limit: number) {
  const { rows } = await query<SellRequestRow>(
    `SELECT identificador AS id, duenio_id, producto_id, titulo, descripcion,
            estado, precio_base, comision_porcentaje, moneda,
            created_at, updated_at,
            historia, declaracion_origen_url, condiciones_notas,
            condiciones_offered_at, rechazo_motivo, rechazo_por, rechazo_at,
            return_amount, return_carrier, return_eta
       FROM solicitudes_venta
      WHERE duenio_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
    [duenioId, limit, (page - 1) * limit],
  );
  const totalQ = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM solicitudes_venta WHERE duenio_id = $1`,
    [duenioId],
  );
  return { items: rows, total: totalQ.rows[0].total };
}

export async function listImages(solicitudId: number) {
  const { rows } = await query<ImageRow>(
    `SELECT identificador AS id, url, orden
       FROM sell_request_imagenes
      WHERE solicitud_id = $1
      ORDER BY orden, identificador`,
    [solicitudId],
  );
  return rows;
}

// ─── Transiciones de estado ───────────────────────────────────────────

export async function acceptConditions(id: number) {
  const { rowCount } = await query(
    `UPDATE solicitudes_venta
        SET estado = 'accepted',
            updated_at = NOW()
      WHERE identificador = $1
        AND estado        = 'conditions_offered'`,
    [id],
  );
  return rowCount ?? 0;
}

/**
 * Acepta en lote todas las solicitudes en estado aprobable
 * (`pending`, `reviewing`, `conditions_offered`) → `accepted`.
 * Completa condiciones por defecto donde falten (precio base / comisión / moneda).
 * Devuelve los ids afectados.
 */
export async function acceptAllPending(defaults: {
  precio_base: number;
  comision_porcentaje: number;
  moneda: string;
}): Promise<number[]> {
  const { rows } = await query<{ identificador: number }>(
    `UPDATE solicitudes_venta
        SET estado              = 'accepted',
            precio_base         = COALESCE(precio_base, $1),
            comision_porcentaje = COALESCE(comision_porcentaje, $2),
            moneda              = COALESCE(moneda, $3),
            updated_at          = NOW()
      WHERE estado IN ('pending', 'reviewing', 'conditions_offered')
      RETURNING identificador`,
    [defaults.precio_base, defaults.comision_porcentaje, defaults.moneda],
  );
  return rows.map((r) => r.identificador);
}

/** Asigna el producto creado al publicar la solicitud como subasta. */
export async function setProductoId(id: number, productoId: number): Promise<void> {
  await query(
    `UPDATE solicitudes_venta SET producto_id = $2, updated_at = NOW() WHERE identificador = $1`,
    [id, productoId],
  );
}

export async function offerConditions(
  id: number,
  data: { precio_base: number; comision_porcentaje: number; moneda: string; notas: string | null },
) {
  const { rowCount } = await query(
    `UPDATE solicitudes_venta
        SET estado                 = 'conditions_offered',
            precio_base            = $2,
            comision_porcentaje    = $3,
            moneda                 = $4,
            condiciones_notas      = $5,
            condiciones_offered_at = NOW(),
            updated_at             = NOW()
      WHERE identificador = $1
        AND estado IN ('pending', 'reviewing')`,
    [id, data.precio_base, data.comision_porcentaje, data.moneda, data.notas],
  );
  return rowCount ?? 0;
}

export async function rejectConditions(
  id: number,
  reason: string,
  returnAmount: number,
  carrier: string,
  etaDate: string,
) {
  const { rowCount } = await query(
    `UPDATE solicitudes_venta
        SET estado          = 'conditions_rejected',
            rechazo_motivo  = $2,
            rechazo_por     = 'user',
            rechazo_at      = NOW(),
            return_amount   = $3,
            return_carrier  = $4,
            return_eta      = $5,
            updated_at      = NOW()
      WHERE identificador = $1
        AND estado        = 'conditions_offered'`,
    [id, reason, returnAmount, carrier, etaDate],
  );
  return rowCount ?? 0;
}
