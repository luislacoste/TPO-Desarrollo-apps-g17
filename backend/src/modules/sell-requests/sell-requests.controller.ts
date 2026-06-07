/**
 * Controllers del módulo Sell Requests.
 */
import type { Request, Response } from 'express';
import * as svc from './sell-requests.service';
import { BadRequest, Unauthorized, UnprocessableEntity } from '../../utils/errors';

function requireClienteId(req: Request): number {
  if (!req.user) throw new Unauthorized();
  return req.user.sub;
}

function paramId(req: Request, name = 'id'): number {
  const id = Number(req.params[name]);
  if (!Number.isInteger(id) || id <= 0) {
    throw new UnprocessableEntity(`${name} inválido`);
  }
  return id;
}

/**
 * POST /sell/request — multipart.
 * Campos:
 *   - title         (string, body)
 *   - description   (string, body, opcional)
 *   - historia      (string, body, opcional)
 *   - images        (array de archivos, ≥ 6)
 *   - ownershipDeclaration (un archivo)
 */
export async function submit(req: Request, res: Response) {
  const clienteId = requireClienteId(req);
  const files = req.files as
    | {
        images?: Express.Multer.File[];
        ownershipDeclaration?: Express.Multer.File[];
      }
    | undefined;

  const images       = files?.images ?? [];
  const ownership    = files?.ownershipDeclaration?.[0];

  if (images.length < 6) {
    throw new BadRequest('Se requieren al menos 6 imágenes en `images`');
  }
  if (!ownership) {
    throw new BadRequest('Falta el archivo `ownershipDeclaration`');
  }

  const result = await svc.submitRequest({
    clienteId,
    titulo:               req.body?.title ?? req.body?.titulo ?? '',
    descripcion:          req.body?.description ?? req.body?.descripcion,
    historia:             req.body?.historia ?? req.body?.history,
    declaracionOrigenUrl: `/uploads/${ownership.filename}`,
    imageUrls:            images.map((f) => `/uploads/${f.filename}`),
  });
  res.status(201).json({ ...result, message: 'Solicitud de venta creada' });
}

export async function listMine(req: Request, res: Response) {
  const clienteId = requireClienteId(req);
  const page  = Math.max(1, Number(req.query.page  ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
  res.json(await svc.listMyRequests(clienteId, page, limit));
}

export async function getMine(req: Request, res: Response) {
  const clienteId = requireClienteId(req);
  res.json(await svc.getMyRequestById(clienteId, paramId(req)));
}

export async function accept(req: Request, res: Response) {
  const clienteId = requireClienteId(req);
  res.json(await svc.acceptConditions(clienteId, paramId(req)));
}

export async function reject(req: Request, res: Response) {
  const clienteId = requireClienteId(req);
  const reason = req.body?.reason;
  if (typeof reason !== 'string' || reason.trim() === '') {
    throw new UnprocessableEntity('reason es obligatorio');
  }
  res.json(await svc.rejectConditions(clienteId, paramId(req), reason));
}

export async function getRejectionReason(req: Request, res: Response) {
  const clienteId = requireClienteId(req);
  res.json(await svc.getRejectionReason(clienteId, paramId(req)));
}

export async function getReturnCost(req: Request, res: Response) {
  const clienteId = requireClienteId(req);
  res.json(await svc.getReturnCost(clienteId, paramId(req)));
}
