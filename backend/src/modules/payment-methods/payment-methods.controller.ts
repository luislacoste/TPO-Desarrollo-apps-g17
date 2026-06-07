import type { Request, Response } from 'express';
import * as svc from './payment-methods.service';
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

export async function list(req: Request, res: Response) {
  res.json(await svc.listMine(requireClienteId(req)));
}

export async function status(req: Request, res: Response) {
  res.json(await svc.getStatus(paramId(req), requireClienteId(req)));
}

export async function addCreditCard(req: Request, res: Response) {
  const created = await svc.addCreditCard(requireClienteId(req), {
    number:   String(req.body?.number ?? ''),
    brand:    String(req.body?.brand ?? ''),
    holder:   String(req.body?.holder ?? ''),
    expMonth: Number(req.body?.expMonth),
    expYear:  Number(req.body?.expYear),
  });
  res.status(201).json(created);
}

export async function addBankAccount(req: Request, res: Response) {
  const created = await svc.addBankAccount(requireClienteId(req), {
    bankName: String(req.body?.bankName ?? ''),
    cbu:      String(req.body?.cbu ?? ''),
    holder:   String(req.body?.holder ?? ''),
  });
  res.status(201).json(created);
}

export async function addCertifiedCheck(req: Request, res: Response) {
  const created = await svc.addCertifiedCheck(requireClienteId(req), {
    checkNumber: String(req.body?.checkNumber ?? ''),
    bankName:    String(req.body?.bankName ?? ''),
    amount:      Number(req.body?.amount),
    currency:    String(req.body?.currency ?? 'ARS'),
  });
  res.status(201).json(created);
}

export async function remove(req: Request, res: Response) {
  await svc.deleteMine(paramId(req), requireClienteId(req));
  res.status(204).end();
}
