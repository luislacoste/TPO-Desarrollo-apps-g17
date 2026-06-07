import type { Request, Response } from 'express';
import * as svc from './fines.service';
import { Unauthorized, UnprocessableEntity } from '../../utils/errors';

function requireClienteId(req: Request): number {
  if (!req.user) throw new Unauthorized();
  return req.user.sub;
}

function paramId(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new UnprocessableEntity('id inválido');
  }
  return id;
}

export async function listMine(req: Request, res: Response) {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  res.json(await svc.listMine(requireClienteId(req), status));
}

export async function getById(req: Request, res: Response) {
  res.json(await svc.getMineById(requireClienteId(req), paramId(req)));
}

export async function pay(req: Request, res: Response) {
  const medioPagoId = Number(req.body?.paymentMethodId);
  const result = await svc.pay(requireClienteId(req), paramId(req), medioPagoId);
  res.json(result);
}
