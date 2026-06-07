import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Unauthorized } from '../utils/errors';

export interface JwtPayload {
  sub: number;        // cliente.identificador
  role: 'user' | 'admin';
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Lee el header `Authorization: Bearer <token>`, verifica el JWT y
 * carga `req.user`. Si falta o es inválido, responde 401.
 */
export function auth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new Unauthorized('Falta el header Authorization Bearer'));
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) return next(new Unauthorized('Token vacío'));

  try {
    const payload = jwt.verify(token, env.jwt.secret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    next(new Unauthorized('Token inválido o expirado'));
  }
}

/**
 * Versión opcional: si hay token lo carga, si no continúa sin `req.user`.
 * Útil para endpoints que se comportan distinto si el cliente está logueado.
 */
export function authOptional(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  const token = header.slice('Bearer '.length).trim();
  if (!token) return next();

  try {
    req.user = jwt.verify(token, env.jwt.secret) as JwtPayload;
  } catch {
    // ignoramos: el endpoint puede seguir como anónimo
  }
  next();
}
