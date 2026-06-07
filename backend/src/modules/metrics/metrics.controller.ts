import type { Request, Response } from 'express';
import * as svc from './metrics.service';
import { UnprocessableEntity } from '../../utils/errors';

function paramUserId(req: Request): number {
  const id = Number(req.params.userId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new UnprocessableEntity('userId inválido');
  }
  return id;
}

export async function user(req: Request, res: Response) {
  res.json(await svc.getUserMetrics(paramUserId(req)));
}

export async function userAuctions(req: Request, res: Response) {
  res.json(await svc.getAuctionParticipation(paramUserId(req)));
}
