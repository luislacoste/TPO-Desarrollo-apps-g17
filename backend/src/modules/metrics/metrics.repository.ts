/**
 * Queries SQL del módulo Metrics.
 *
 * Reusa la lógica de `users.repository.getMetrics`, pero generaliza para
 * cualquier `userId`. Además expone el listado de subastas participadas.
 */
import { query } from '../../db';

export interface UserMetricsRow {
  total_auctions: number;
  won_auctions: number;
  total_bids: number;
  total_spent: number;
}

export interface AuctionParticipationRow {
  subasta_id: number;
  fecha: string | null;
  estado: 'abierta' | 'cerrada';
  numero_postor: number;
  bids_count: number;
  won_items: number;
  total_spent: number;
}

export async function clienteExists(clienteId: number): Promise<boolean> {
  const { rows } = await query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM clientes WHERE identificador = $1) AS exists`,
    [clienteId],
  );
  return rows[0]?.exists ?? false;
}

export async function getUserMetrics(clienteId: number) {
  const { rows } = await query<UserMetricsRow>(
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

export async function getAuctionParticipation(clienteId: number) {
  const { rows } = await query<AuctionParticipationRow>(
    `SELECT a.subasta                                           AS subasta_id,
            s.fecha,
            s.estado,
            a.numeropostor                                       AS numero_postor,
            (SELECT COUNT(p.identificador)::int
               FROM pujos p
              WHERE p.asistente = a.identificador)               AS bids_count,
            (SELECT COUNT(*)::int
               FROM registrodesubasta r
              WHERE r.cliente = a.cliente AND r.subasta = a.subasta) AS won_items,
            COALESCE((SELECT SUM(r.importe)
                        FROM registrodesubasta r
                       WHERE r.cliente = a.cliente AND r.subasta = a.subasta), 0)::numeric AS total_spent
       FROM asistentes a
       JOIN subastas   s ON s.identificador = a.subasta
      WHERE a.cliente = $1
      ORDER BY s.fecha DESC NULLS LAST`,
    [clienteId],
  );
  return rows;
}
