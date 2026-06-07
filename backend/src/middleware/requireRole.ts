import type { Request, Response, NextFunction } from 'express';
import { ForbiddenAdmin, Unauthorized } from '../utils/errors';

/**
 * Exige que `req.user.role` esté entre los permitidos.
 * Si el rol pedido es `admin`, devuelve 403 `ForbiddenAdmin` (según swagger).
 *
 * Uso: `router.get('/admin/users', auth, requireRole('admin'), ...)`.
 */
export function requireRole(...allowed: Array<'user' | 'admin'>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new Unauthorized());
    if (!allowed.includes(req.user.role)) {
      return next(new ForbiddenAdmin());
    }
    next();
  };
}
