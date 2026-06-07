/**
 * Lógica de negocio del módulo Auth. No toca req/res ni SQL directamente.
 *
 * Endpoints cubiertos:
 *   - registerStart       → POST /auth/register
 *   - registerDocument    → POST /auth/register/document
 *   - registerComplete    → POST /auth/register/complete
 *   - login               → POST /auth/login
 *   - refreshTokens       → POST /auth/refresh-token
 *   - forgotPassword      → POST /auth/forgot-password
 */
import { withTransaction } from '../../db';
import * as repo from './auth.repository';
import { hashPassword, hashToken, randomToken, verifyPassword } from '../../services/hash';
import { signAccessToken } from '../../services/jwt';
import { env } from '../../config/env';
import {
  BadRequest,
  Conflict,
  NotFound,
  Unauthorized,
  UnprocessableEntity,
} from '../../utils/errors';

const SYSTEM_VERIFICADOR_ID = 1;     // empleado de sistema (seed)
const REFRESH_TOKEN_DAYS = 7;

// ─── Tipos ────────────────────────────────────────────────────────────

export interface RegisterStartInput {
  email: string;
  firstName: string;
  lastName: string;
  domicilio: string;
  pais: string;
  documento: string;        // DNI (NOT NULL en personas)
  phone?: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    role: 'user' | 'admin';
    firstName: string | null;
    lastName: string | null;
    category: string | null;
    admissionStatus: string | null;
  };
}

// ─── Helpers internos ─────────────────────────────────────────────────

function refreshExpiryDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TOKEN_DAYS);
  return d;
}

async function issueTokens(payload: {
  sub: number;
  email: string;
  role: 'user' | 'admin';
}): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = signAccessToken(payload);
  const refreshToken = randomToken();
  await repo.insertRefreshToken(hashToken(refreshToken), payload.sub, refreshExpiryDate());
  return { accessToken, refreshToken };
}

// ─── Casos de uso ─────────────────────────────────────────────────────

/**
 * POST /auth/register
 * Step 1 del registro: crea persona + cliente + perfil + admisión pending.
 * No fija password todavía (eso es step 3).
 */
export async function registerStart(input: RegisterStartInput): Promise<{ userId: number }> {
  // 1) email no debe estar ya tomado
  if (await repo.emailExists(input.email)) {
    throw new Conflict('El email ya está registrado');
  }
  // 2) DNI tampoco
  if (await repo.documentoExists(input.documento)) {
    throw new Conflict('El documento ya está registrado');
  }
  // 3) país tiene que existir en la tabla `paises`
  const paisNumero = await repo.findPaisNumeroByNombre(input.pais);
  if (!paisNumero) {
    throw new UnprocessableEntity(`País no reconocido: ${input.pais}`);
  }

  const nombreCompleto = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();

  return withTransaction(async (client) => {
    const personaId = await repo.insertPersona(client, {
      documento: input.documento.trim(),
      nombre: nombreCompleto,
      direccion: input.domicilio,
    });

    await repo.insertClienteShell(client, {
      identificador: personaId,
      numeropais: paisNumero,
      verificador: SYSTEM_VERIFICADOR_ID,
    });

    await repo.insertClientePerfil(client, {
      cliente_id: personaId,
      first_name: input.firstName,
      last_name: input.lastName,
      domicilio: input.domicilio,
      pais: input.pais,
    });

    await repo.insertClienteAdmisionPending(client, personaId);

    // Pre-creamos la fila de credenciales con el email; el password
    // se completa en `registerComplete` (step 3). Hasta entonces el
    // login no funciona (password_hash IS NULL).
    await repo.insertCredencialesShell(client, personaId, input.email);

    return { userId: personaId };
  });
}

/**
 * POST /auth/register/document
 * Step 2: persiste las URLs de los archivos subidos (frente + dorso).
 */
export async function registerDocument(input: {
  userId: number;
  documentFrontUrl: string;
  documentBackUrl: string;
}) {
  const perfil = await repo.getClientePerfilDocs(input.userId);
  if (!perfil) throw new NotFound('Usuario no encontrado');

  await repo.updateClientePerfilDocs(
    input.userId,
    input.documentFrontUrl,
    input.documentBackUrl,
  );

  return {
    userId: input.userId,
    documentFrontUrl: input.documentFrontUrl,
    documentBackUrl: input.documentBackUrl,
  };
}

/**
 * POST /auth/register/complete
 * Step 3: fija el password y deja al usuario apto para login.
 */
export async function registerComplete(userId: number, password: string) {
  if (password.length < 8) {
    throw new UnprocessableEntity('El password debe tener al menos 8 caracteres');
  }

  const perfil = await repo.getClientePerfilDocs(userId);
  if (!perfil) throw new NotFound('Usuario no encontrado');
  if (!perfil.document_front_url || !perfil.document_back_url) {
    throw new Conflict('Faltan los documentos de identidad. Subilos antes en /auth/register/document.');
  }

  if (await repo.hasPasswordSet(userId)) {
    throw new Conflict('El registro ya fue completado');
  }

  const passwordHash = await hashPassword(password);
  const updated = await repo.setCredencialesPassword(userId, passwordHash);
  if (updated === 0) {
    // No tiene fila de credenciales (algo raro pasó en step 1).
    throw new NotFound('Usuario no encontrado');
  }
  return { message: 'Registro completado' };
}

/**
 * POST /auth/login
 */
export async function login(email: string, password: string): Promise<AuthResult> {
  const creds = await repo.findCredentialsByEmail(email);
  if (!creds) throw new Unauthorized('Credenciales inválidas');

  const ok = await verifyPassword(password, creds.password_hash);
  if (!ok) throw new Unauthorized('Credenciales inválidas');

  const full = await repo.findClienteFullById(creds.cliente_id);
  if (!full) throw new Unauthorized('Credenciales inválidas');

  const { accessToken, refreshToken } = await issueTokens({
    sub: creds.cliente_id,
    email: creds.email,
    role: creds.role,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: creds.cliente_id,
      email: creds.email,
      role: creds.role,
      firstName: full.first_name,
      lastName: full.last_name,
      category: full.categoria,
      admissionStatus: full.admission_estado,
    },
  };
}

/**
 * POST /auth/refresh-token
 * Rota el refresh: revoca el viejo, emite par nuevo.
 */
export async function refreshTokens(refreshToken: string) {
  if (!refreshToken) throw new BadRequest('Falta refreshToken');

  const tokenHash = hashToken(refreshToken);
  const stored = await repo.findRefreshToken(tokenHash);
  if (!stored) throw new Unauthorized('Refresh token desconocido');
  if (stored.revoked_at) throw new Unauthorized('Refresh token revocado');
  if (stored.expires_at < new Date()) throw new Unauthorized('Refresh token expirado');

  const full = await repo.findClienteFullById(stored.cliente_id);
  if (!full) throw new Unauthorized('Usuario inexistente');

  await repo.revokeRefreshToken(tokenHash);

  return issueTokens({
    sub: stored.cliente_id,
    email: full.email,
    role: full.role,
  });
}

/**
 * POST /auth/forgot-password
 * Para el TPO no enviamos mails reales. Siempre 200 (no leak de qué emails
 * existen). En producción acá se dispararía un job de envío de email.
 */
export async function forgotPassword(_email: string) {
  return { message: 'Si el email está registrado, recibirás instrucciones para recuperarlo.' };
}
