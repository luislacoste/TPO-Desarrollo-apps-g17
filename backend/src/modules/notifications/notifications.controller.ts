import type { Request, Response } from 'express';
import * as svc from './notifications.service';
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

function parseBool(value: unknown): boolean | undefined {
  if (typeof value !== 'string') return undefined;
  if (value === 'true')  return true;
  if (value === 'false') return false;
  return undefined;
}

export async function list(req: Request, res: Response) {
  const read = parseBool(req.query.read);
  res.json(await svc.listMine(requireClienteId(req), read));
}

export async function markRead(req: Request, res: Response) {
  res.json(await svc.markRead(requireClienteId(req), paramId(req)));
}

export async function getSettings(req: Request, res: Response) {
  res.json(await svc.getSettings(requireClienteId(req)));
}

export async function updateSettings(req: Request, res: Response) {
  const body = req.body ?? {};
  const allowed: svc.SettingsInput = {};
  const ALLOWED: Array<keyof svc.SettingsInput> = [
    'pushEnabled', 'emailEnabled', 'auctionStarting', 'bidOutbid', 'bidWon', 'paymentAlerts',
  ];
  for (const key of ALLOWED) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== 'boolean') {
        throw new UnprocessableEntity(`${key} debe ser boolean`);
      }
      allowed[key] = body[key];
    }
  }
  res.json(await svc.updateSettings(requireClienteId(req), allowed));
}
