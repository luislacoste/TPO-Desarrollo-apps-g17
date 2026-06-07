import type { Request, Response } from 'express';
import * as svc from './bids.service';
import { Unauthorized, UnprocessableEntity, NotFound } from '../../utils/errors';

function paramId(req: Request, name: string): number {
  const id = Number(req.params[name]);
  if (!Number.isInteger(id) || id <= 0) {
    throw new UnprocessableEntity(`${name} inválido`);
  }
  return id;
}

function requireClienteId(req: Request): number {
  if (!req.user) throw new Unauthorized();
  return req.user.sub;
}

export async function placeBid(req: Request, res: Response) {
  const clienteId = requireClienteId(req);
  const itemId  = Number(req.body?.itemId);
  const importe = Number(req.body?.importe);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw new UnprocessableEntity('itemId inválido');
  }
  const result = await svc.placeBid(clienteId, { itemId, importe });
  res.status(201).json(result);
}

export async function listForAuction(req: Request, res: Response) {
  res.json(await svc.listForAuction(paramId(req, 'auctionId')));
}

export async function currentForItem(req: Request, res: Response) {
  const bid = await svc.currentForItem(
    paramId(req, 'auctionId'),
    paramId(req, 'itemId'),
  );
  if (!bid) throw new NotFound('No hay pujas para este item');
  res.json(bid);
}

export async function listMine(req: Request, res: Response) {
  res.json(await svc.listMine(requireClienteId(req)));
}

export async function listMyWon(req: Request, res: Response) {
  res.json(await svc.listMyWon(requireClienteId(req)));
}
