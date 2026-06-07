import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/errors';

/**
 * Middleware final que captura cualquier error y lo traduce al formato
 * de error del swagger: `{ code, message, details? }` con el HTTP status
 * apropiado.
 */
export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  console.error('[error] no manejado:', err);
  res.status(500).json({
    code: 'InternalServerError',
    message: 'Error interno del servidor',
  });
};

/**
 * Captura rutas no definidas — devuelve 404 antes del errorHandler.
 */
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    code: 'NotFound',
    message: 'Endpoint no encontrado',
  });
}
