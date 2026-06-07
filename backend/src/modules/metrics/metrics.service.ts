import * as repo from './metrics.repository';
import { NotFound } from '../../utils/errors';

export async function getUserMetrics(userId: number) {
  if (!(await repo.clienteExists(userId))) {
    throw new NotFound('Usuario no encontrado');
  }
  const row = await repo.getUserMetrics(userId);
  const totalAuctions = Number(row.total_auctions);
  const wonAuctions   = Number(row.won_auctions);
  const totalBids     = Number(row.total_bids);
  const totalSpent    = Number(row.total_spent);
  const winRate = totalAuctions > 0 ? wonAuctions / totalAuctions : 0;
  return {
    userId,
    totalAuctions,
    wonAuctions,
    totalBids,
    totalSpent,
    winRate: Number(winRate.toFixed(4)),
  };
}

export async function getAuctionParticipation(userId: number) {
  if (!(await repo.clienteExists(userId))) {
    throw new NotFound('Usuario no encontrado');
  }
  const rows = await repo.getAuctionParticipation(userId);
  return rows.map((r) => ({
    auctionId: r.subasta_id,
    fecha: r.fecha,
    estado: r.estado,
    numeroPostor: r.numero_postor,
    bidsCount: r.bids_count,
    wonItems: r.won_items,
    totalSpent: Number(r.total_spent),
  }));
}
