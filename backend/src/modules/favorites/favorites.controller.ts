import type { Request, Response } from 'express';
import * as svc from './favorites.service';
import { Unauthorized, UnprocessableEntity } from '../../utils/errors';

function requireClienteId(req: Request): number {
  if (!req.user) throw new Unauthorized();
  return req.user.sub;
}

function itemIdParam(req: Request): number {
  const id = Number(req.params.itemId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new UnprocessableEntity('itemId inválido');
  }
  return id;
}

export async function list(req: Request, res: Response) {
  res.json(await svc.listMine(requireClienteId(req)));
}

export async function add(req: Request, res: Response) {
  await svc.add(requireClienteId(req), itemIdParam(req));
  res.status(201).json({ message: 'Agregado a favoritos' });
}

export async function remove(req: Request, res: Response) {
  await svc.remove(requireClienteId(req), itemIdParam(req));
  res.status(204).end();
}
