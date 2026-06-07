/**
 * Errores de dominio. El `errorHandler` los traduce a códigos HTTP
 * según el contrato del swagger.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class BadRequest extends HttpError {
  constructor(message = 'Datos inválidos', details?: unknown) {
    super(400, 'BadRequest', message, details);
  }
}

export class Unauthorized extends HttpError {
  constructor(message = 'Sin token o token inválido') {
    super(401, 'Unauthorized', message);
  }
}

export class Forbidden extends HttpError {
  constructor(message = 'Sin permisos (categoría insuficiente)') {
    super(403, 'Forbidden', message);
  }
}

export class ForbiddenAdmin extends HttpError {
  constructor(message = 'Acceso restringido a rol admin') {
    super(403, 'ForbiddenAdmin', message);
  }
}

export class NotFound extends HttpError {
  constructor(message = 'Recurso no encontrado') {
    super(404, 'NotFound', message);
  }
}

export class Conflict extends HttpError {
  constructor(message = 'Conflicto de negocio', details?: unknown) {
    super(409, 'Conflict', message, details);
  }
}

export class UnprocessableEntity extends HttpError {
  constructor(message = 'Validaciones fallidas', details?: unknown) {
    super(422, 'UnprocessableEntity', message, details);
  }
}

export class TooManyRequests extends HttpError {
  constructor(message = 'Rate limiting') {
    super(429, 'TooManyRequests', message);
  }
}
