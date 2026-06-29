import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/errors';

/** Forma mínima de un error de PostgreSQL (driver `pg`). */
interface PgError {
  code?: string;
  constraint?: string;
  column?: string;
  table?: string;
  detail?: string;
}

function isPgError(err: unknown): err is PgError {
  return typeof err === 'object' && err !== null && typeof (err as PgError).code === 'string';
}

/**
 * Traduce los errores más comunes de PostgreSQL a un mensaje claro para el
 * usuario, en vez de un 500 genérico. Devuelve null si no sabe mapearlo.
 */
function mapPgError(err: PgError): { status: number; code: string; message: string } | null {
  const c = err.constraint ?? '';
  switch (err.code) {
    case '23505': { // unique_violation
      let message = 'Ya existe un registro con esos datos';
      if (/email/i.test(c)) message = 'El email ya está registrado';
      else if (/document|dni/i.test(c)) message = 'El documento ya está registrado';
      return { status: 409, code: 'Conflict', message };
    }
    case '23514': { // check_violation
      let message = 'Alguno de los datos enviados no es válido';
      if (/categoria/i.test(c)) message = 'Categoría inválida';
      else if (/fecha/i.test(c)) message = 'La fecha no cumple las reglas de la subasta';
      else if (/estado/i.test(c)) message = 'Estado inválido';
      return { status: 422, code: 'UnprocessableEntity', message };
    }
    case '23503': // foreign_key_violation
      return { status: 409, code: 'Conflict', message: 'Referencia inválida: el recurso relacionado no existe' };
    case '23502': // not_null_violation
      return {
        status: 422,
        code: 'UnprocessableEntity',
        message: `Falta un campo requerido${err.column ? `: ${err.column}` : ''}`,
      };
    default:
      return null;
  }
}

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

  // Errores de base de datos → mensaje claro en vez de 500 genérico.
  if (isPgError(err)) {
    const mapped = mapPgError(err);
    if (mapped) {
      return res.status(mapped.status).json({ code: mapped.code, message: mapped.message });
    }
    console.error('[error] DB sin mapear:', err);
    return res.status(500).json({ code: 'InternalServerError', message: 'Error interno del servidor' });
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
