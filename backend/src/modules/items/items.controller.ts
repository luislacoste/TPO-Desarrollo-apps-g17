import type { Request, Response } from 'express';
import * as svc from './items.service';
import { UnprocessableEntity } from '../../utils/errors';

function paramId(req: Request, name: string): number {
  const id = Number(req.params[name]);
  if (!Number.isInteger(id) || id <= 0) {
    throw new UnprocessableEntity(`${name} inválido`);
  }
  return id;
}

export async function list(req: Request, res: Response) {
  const { auctionId, status, page, limit } = req.query;
  const result = await svc.list({
    auctionId: auctionId ? Number(auctionId) : undefined,
    status:    typeof status === 'string' ? status : undefined,
    page:      page  ? Number(page)  : undefined,
    limit:     limit ? Number(limit) : undefined,
  });
  res.json(result);
}

export async function getById(req: Request, res: Response) {
  const item = await svc.getById(paramId(req, 'id'), Boolean(req.user));
  res.json(item);
}

export async function getPhotos(req: Request, res: Response) {
  res.json(await svc.listPhotos(paramId(req, 'id')));
}

export async function getPhotoBinary(req: Request, res: Response) {
  const buf = await svc.getPhotoBinary(
    paramId(req, 'id'),
    paramId(req, 'photoId'),
  );
  res.setHeader('Content-Type', 'image/jpeg');
  res.send(buf);
}

export async function getHistory(req: Request, res: Response) {
  res.json(await svc.getHistory(paramId(req, 'id')));
}
