import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Envuelve un handler async para que cualquier promesa rechazada
 * caiga en el errorHandler global vía `next(err)`.
 *
 * Express 4 no propaga errores async por sí solo.
 */
export function asyncHandler<P = unknown, ResBody = unknown, ReqBody = unknown>(
  fn: (req: Request<P, ResBody, ReqBody>, res: Response<ResBody>, next: NextFunction) => Promise<unknown>,
): RequestHandler<P, ResBody, ReqBody> {
  return (req, res, next) => {
    Promise.resolve(fn(req as never, res as never, next)).catch(next);
  };
}
