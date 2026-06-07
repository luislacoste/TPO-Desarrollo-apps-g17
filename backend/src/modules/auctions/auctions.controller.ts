import type { Request, Response } from 'express';
import * as svc from './auctions.service';
import { Unauthorized, UnprocessableEntity } from '../../utils/errors';

function paramId(req: Request, name = 'id'): number {
  const id = Number(req.params[name]);
  if (!Number.isInteger(id) || id <= 0) {
    throw new UnprocessableEntity(`${name} inválido`);
  }
  return id;
}

export async function list(req: Request, res: Response) {
  const { status, category, fechaDesde, fechaHasta, page, limit } = req.query;
  const result = await svc.list({
    status:     typeof status     === 'string' ? status     : undefined,
    category:   typeof category   === 'string' ? category   : undefined,
    fechaDesde: typeof fechaDesde === 'string' ? fechaDesde : undefined,
    fechaHasta: typeof fechaHasta === 'string' ? fechaHasta : undefined,
    page:  page  ? Number(page)  : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json(result);
}

export async function listActive(_req: Request, res: Response) {
  res.json(await svc.listActive());
}

export async function listUpcoming(_req: Request, res: Response) {
  res.json(await svc.listUpcoming());
}

export async function getById(req: Request, res: Response) {
  res.json(await svc.getById(paramId(req)));
}

export async function getCatalog(req: Request, res: Response) {
  res.json(await svc.getCatalog(paramId(req)));
}

export async function join(req: Request, res: Response) {
  if (!req.user) throw new Unauthorized();
  const result = await svc.join(req.user.sub, paramId(req));
  res.status(200).json(result);
}

export async function getStream(req: Request, res: Response) {
  res.json(await svc.getStreamUrl(paramId(req)));
}
