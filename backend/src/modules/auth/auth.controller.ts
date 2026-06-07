/**
 * Controllers del módulo Auth. Solo se ocupan de:
 *   1. Validar / parsear `req` (sin lógica de negocio).
 *   2. Llamar al service correspondiente.
 *   3. Armar la respuesta HTTP.
 *
 * Cualquier validación más profunda (estado del registro, password,
 * tokens revocados, etc.) vive en el service y se expresa como errores
 * tipados que el `errorHandler` traduce a HTTP.
 */
import type { Request, Response } from 'express';
import * as svc from './auth.service';
import { BadRequest, UnprocessableEntity } from '../../utils/errors';

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new UnprocessableEntity(`Campo requerido: ${field}`);
  }
  return value.trim();
}

function requireEmail(value: unknown): string {
  const v = requireString(value, 'email').toLowerCase();
  // Validación básica, no exhaustiva.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    throw new UnprocessableEntity('Email inválido');
  }
  return v;
}

// ─── Endpoints ────────────────────────────────────────────────────────

export async function login(req: Request, res: Response) {
  const email    = requireEmail(req.body?.email);
  const password = requireString(req.body?.password, 'password');
  const result = await svc.login(email, password);
  res.status(200).json(result);
}

export async function registerStart(req: Request, res: Response) {
  const result = await svc.registerStart({
    email:     requireEmail(req.body?.email),
    firstName: requireString(req.body?.firstName, 'firstName'),
    lastName:  requireString(req.body?.lastName,  'lastName'),
    domicilio: requireString(req.body?.domicilio, 'domicilio'),
    pais:      requireString(req.body?.pais,      'pais'),
    documento: requireString(req.body?.documento, 'documento'),
    phone:     typeof req.body?.phone === 'string' ? req.body.phone : undefined,
  });
  res.status(201).json({ ...result, message: 'Registro iniciado' });
}

export async function registerDocument(req: Request, res: Response) {
  const userIdRaw = req.body?.userId;
  const userId = Number(userIdRaw);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new UnprocessableEntity('userId inválido');
  }

  // Multer parsea archivos en `req.files` cuando hay múltiples campos.
  const files = req.files as
    | { documentFront?: Express.Multer.File[]; documentBack?: Express.Multer.File[] }
    | undefined;

  const front = files?.documentFront?.[0];
  const back  = files?.documentBack?.[0];
  if (!front || !back) {
    throw new BadRequest('Faltan los archivos documentFront y documentBack');
  }

  const result = await svc.registerDocument({
    userId,
    documentFrontUrl: `/uploads/${front.filename}`,
    documentBackUrl:  `/uploads/${back.filename}`,
  });
  res.status(200).json({ ...result, message: 'Documentos recibidos' });
}

export async function registerComplete(req: Request, res: Response) {
  const userId = Number(req.body?.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new UnprocessableEntity('userId inválido');
  }
  const password = requireString(req.body?.password, 'password');
  const result = await svc.registerComplete(userId, password);
  res.status(200).json(result);
}

export async function forgotPassword(req: Request, res: Response) {
  const email = requireEmail(req.body?.email);
  const result = await svc.forgotPassword(email);
  res.status(200).json(result);
}

export async function refreshToken(req: Request, res: Response) {
  const token = requireString(req.body?.refreshToken, 'refreshToken');
  const tokens = await svc.refreshTokens(token);
  res.status(200).json(tokens);
}
