import type { Request, Response } from 'express';
import * as svc from './payments.service';
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

export async function listPending(req: Request, res: Response) {
  res.json(await svc.listPending(requireClienteId(req)));
}

export async function getById(req: Request, res: Response) {
  res.json(await svc.getById(paramId(req), requireClienteId(req)));
}

export async function pay(req: Request, res: Response) {
  const medioPagoId = Number(req.body?.paymentMethodId);
  if (!Number.isInteger(medioPagoId) || medioPagoId <= 0) {
    throw new UnprocessableEntity('paymentMethodId inválido');
  }
  const result = await svc.pay(requireClienteId(req), paramId(req), medioPagoId);
  res.json(result);
}

export async function invoices(req: Request, res: Response) {
  res.json(await svc.listInvoices(requireClienteId(req)));
}
