/**
 * Queries SQL del módulo Bids.
 *
 * `pujos` une `asistentes` (cliente + subasta) con `itemscatalogo`
 * (item). Para listar pujas de un cliente o de una subasta hay que
 * navegar siempre vía `asistentes`.
 */
import { query } from '../../db';

export interface BidRow {
  id: number;
  importe: string;
  ganador: 'si' | 'no' | null;
  item_id: number;
  asistente_id: number;
  cliente_id: number;
  numero_postor: number;
  subasta_id: number;
}

export interface ItemBidContext {
  item_id: number;
  catalogo_id: number;
  subasta_id: number;
  subasta_estado: 'abierta' | 'cerrada';
  precio_base: string;
  subastado: 'si' | 'no' | null;
  current_highest: string | null;
}

const SELECT_BID = `
  SELECT p.identificador           AS id,
         p.importe,
         p.ganador,
         p.item                    AS item_id,
         p.asistente               AS asistente_id,
         a.cliente                 AS cliente_id,
         a.numeropostor            AS numero_postor,
         a.subasta                 AS subasta_id
    FROM pujos p
    JOIN asistentes a ON a.identificador = p.asistente
`;

// ─── Contexto del item (para validar pujas) ───────────────────────────

export async function getItemBidContext(itemId: number) {
  const { rows } = await query<ItemBidContext>(
    `SELECT ic.identificador        AS item_id,
            ic.catalogo              AS catalogo_id,
            c.subasta                AS subasta_id,
            s.estado                 AS subasta_estado,
            ic.preciobase            AS precio_base,
            ic.subastado,
            (SELECT MAX(p.importe)::numeric::text
               FROM pujos p
              WHERE p.item = ic.identificador) AS current_highest
       FROM itemscatalogo ic
       JOIN catalogos     c ON c.identificador = ic.catalogo
       JOIN subastas      s ON s.identificador = c.subasta
      WHERE ic.identificador = $1`,
    [itemId],
  );
  return rows[0] ?? null;
}

// ─── Listados ─────────────────────────────────────────────────────────

export async function listByAuction(subastaId: number) {
  const { rows } = await query<BidRow>(
    `${SELECT_BID}
      WHERE a.subasta = $1
      ORDER BY p.identificador`,
    [subastaId],
  );
  return rows;
}

export async function currentForItem(subastaId: number, itemId: number) {
  const { rows } = await query<BidRow>(
    `${SELECT_BID}
      WHERE a.subasta = $1
        AND p.item    = $2
      ORDER BY p.importe DESC
      LIMIT 1`,
    [subastaId, itemId],
  );
  return rows[0] ?? null;
}

export async function listByCliente(clienteId: number) {
  const { rows } = await query<BidRow>(
    `${SELECT_BID}
      WHERE a.cliente = $1
      ORDER BY p.identificador DESC`,
    [clienteId],
  );
  return rows;
}

export async function listWonByCliente(clienteId: number) {
  const { rows } = await query<BidRow>(
    `${SELECT_BID}
      WHERE a.cliente = $1
        AND p.ganador = 'si'
      ORDER BY p.identificador DESC`,
    [clienteId],
  );
  return rows;
}

// ─── Insert ───────────────────────────────────────────────────────────

export async function insertBid(asistenteId: number, itemId: number, importe: number) {
  const { rows } = await query<{ id: number }>(
    `INSERT INTO pujos (asistente, item, importe)
     VALUES ($1, $2, $3)
     RETURNING identificador AS id`,
    [asistenteId, itemId, importe],
  );
  return rows[0].id;
}
