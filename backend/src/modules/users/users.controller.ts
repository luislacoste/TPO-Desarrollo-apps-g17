/**
 * Controllers de Users. Solo parsean req/res y delegan al service.
 * Todos los endpoints requieren JWT (se enchufa el middleware `auth` en
 * `users.routes.ts`).
 */
import type { Request, Response } from 'express';
import * as svc from './users.service';
import { Unauthorized, UnprocessableEntity } from '../../utils/errors';

function requireClienteId(req: Request): number {
  if (!req.user) throw new Unauthorized();
  return req.user.sub;
}

export async function getMe(req: Request, res: Response) {
  const me = await svc.getMe(requireClienteId(req));
  res.json(me);
}

export async function updateMe(req: Request, res: Response) {
  const id = requireClienteId(req);
  const body = req.body ?? {};
  const allowed: svc.UpdateMeInput = {};
  const ALLOWED_KEYS: Array<keyof svc.UpdateMeInput> = ['firstName', 'lastName', 'phone', 'domicilio'];

  for (const key of ALLOWED_KEYS) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== 'string') {
        throw new UnprocessableEntity(`Campo ${key} debe ser string`);
      }
      allowed[key] = body[key];
    }
  }
  const me = await svc.updateMe(id, allowed);
  res.json(me);
}

export async function getMyMetrics(req: Request, res: Response) {
  const metrics = await svc.getMyMetrics(requireClienteId(req));
  res.json(metrics);
}

export async function getMyCategory(req: Request, res: Response) {
  const cat = await svc.getMyCategory(requireClienteId(req));
  res.json(cat);
}

export async function acceptConditions(req: Request, res: Response) {
  const result = await svc.acceptConditions(requireClienteId(req));
  res.json(result);
}
