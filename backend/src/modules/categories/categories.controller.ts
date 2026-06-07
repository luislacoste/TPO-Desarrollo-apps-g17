/**
 * Controllers de Categories. Endpoints públicos (sin JWT).
 */
import type { Request, Response } from 'express';
import * as svc from './categories.service';

export function list(_req: Request, res: Response) {
  res.json(svc.listCategories());
}

export function getById(req: Request, res: Response) {
  const category = svc.getCategoryByIdOrThrow(req.params.id);
  res.json(category);
}
