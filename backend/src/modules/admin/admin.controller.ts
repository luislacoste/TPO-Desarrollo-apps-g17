import type { Request, Response } from 'express';
import * as svc from './admin.service';
import { Unauthorized, UnprocessableEntity } from '../../utils/errors';

function actorId(req: Request): number {
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

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new UnprocessableEntity(`Campo requerido: ${field}`);
  }
  return value.trim();
}

// ─── Usuarios ─────────────────────────────────────────────────────────

export async function listUsers(req: Request, res: Response) {
  const { admissionStatus, category, search, page, limit } = req.query;
  res.json(await svc.listUsers({
    admissionStatus: typeof admissionStatus === 'string' ? admissionStatus : undefined,
    category:        typeof category        === 'string' ? category        : undefined,
    search:          typeof search          === 'string' ? search          : undefined,
    page:  page  ? Number(page)  : undefined,
    limit: limit ? Number(limit) : undefined,
  }));
}

export async function getUserById(req: Request, res: Response) {
  res.json(await svc.getUserById(paramId(req)));
}

export async function approveUser(req: Request, res: Response) {
  const category = req.body?.category ? String(req.body.category) : undefined;
  const notes    = req.body?.notes    ? String(req.body.notes)    : undefined;
  res.json(await svc.approveUser(actorId(req), paramId(req), category, notes));
}

export async function rejectUser(req: Request, res: Response) {
  const reason = requireString(req.body?.reason, 'reason');
  const notes  = req.body?.notes ? String(req.body.notes) : undefined;
  res.json(await svc.rejectUser(actorId(req), paramId(req), reason, notes));
}

export async function changeCategory(req: Request, res: Response) {
  const category = requireString(req.body?.category, 'category');
  const reason   = req.body?.reason ? String(req.body.reason) : undefined;
  res.json(await svc.changeCategory(actorId(req), paramId(req), category, reason));
}

export async function changeAdmission(req: Request, res: Response) {
  const admissionStatus = requireString(req.body?.admissionStatus, 'admissionStatus');
  const notes           = req.body?.notes ? String(req.body.notes) : undefined;
  res.json(await svc.changeAdmission(actorId(req), paramId(req), admissionStatus, notes));
}

// ─── Participación ────────────────────────────────────────────────────

export async function blockParticipation(req: Request, res: Response) {
  const reason = requireString(req.body?.reason, 'reason');
  const until  = req.body?.until ? String(req.body.until) : undefined;
  res.json(await svc.blockParticipation(actorId(req), paramId(req), reason, until));
}

export async function unblockParticipation(req: Request, res: Response) {
  res.json(await svc.unblockParticipation(actorId(req), paramId(req)));
}

// ─── Multas ───────────────────────────────────────────────────────────

export async function listFines(req: Request, res: Response) {
  const { status, userId, page, limit } = req.query;
  res.json(await svc.listFines({
    status: typeof status === 'string' ? status : undefined,
    userId: userId ? Number(userId) : undefined,
    page:   page   ? Number(page)   : undefined,
    limit:  limit  ? Number(limit)  : undefined,
  }));
}

export async function applyFine(req: Request, res: Response) {
  const pct   = req.body?.finePercentage !== undefined ? Number(req.body.finePercentage) : undefined;
  const notes = req.body?.notes ? String(req.body.notes) : undefined;
  res.status(201).json(await svc.applyFine(actorId(req), paramId(req), {
    finePercentage: pct,
    notes,
  }));
}

export async function waiveFine(req: Request, res: Response) {
  const reason = requireString(req.body?.reason, 'reason');
  res.json(await svc.waiveFine(actorId(req), paramId(req), reason));
}
