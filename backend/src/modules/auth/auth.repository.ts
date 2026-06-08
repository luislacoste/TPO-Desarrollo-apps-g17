/**
 * Queries SQL del módulo Auth.
 *
 * Convención del proyecto: TODA query SQL del módulo vive en este archivo.
 * Ni el controller ni el service tocan SQL directamente.
 */
import type { PoolClient } from 'pg';
import { query } from '../../db';

// ─── Tipos planos (lo que devuelven las queries) ──────────────────────

export interface ClienteRow {
  identificador: number;
  numeropais: number | null;
  admitido: 'si' | 'no' | null;
  categoria: 'comun' | 'especial' | 'plata' | 'oro' | 'platino' | null;
  verificador: number;
}

export interface CredencialesRow {
  cliente_id: number;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  created_at: Date;
}

export interface ClienteFullRow {
  cliente_id: number;
  email: string;
  role: 'user' | 'admin';
  first_name: string | null;
  last_name: string | null;
  categoria: string | null;
  admission_estado: string | null;
}

// ─── Lookups simples ──────────────────────────────────────────────────

export async function findCredentialsByEmail(email: string) {
  // Solo cuentas con password seteado (registro completado).
  const { rows } = await query<CredencialesRow>(
    `SELECT cliente_id, email, password_hash, role, created_at
       FROM clientes_credenciales
      WHERE email = $1
        AND password_hash IS NOT NULL`,
    [email],
  );
  return rows[0] ?? null;
}

export async function findClienteFullById(clienteId: number) {
  const { rows } = await query<ClienteFullRow>(
    `SELECT cc.cliente_id,
            cc.email,
            cc.role,
            cp.first_name,
            cp.last_name,
            c.categoria,
            ca.estado AS admission_estado
       FROM clientes_credenciales cc
       JOIN clientes              c  ON c.identificador  = cc.cliente_id
  LEFT JOIN clientes_perfil       cp ON cp.cliente_id    = cc.cliente_id
  LEFT JOIN clientes_admision     ca ON ca.cliente_id    = cc.cliente_id
      WHERE cc.cliente_id = $1`,
    [clienteId],
  );
  return rows[0] ?? null;
}

export async function findPaisNumeroByNombre(nombre: string): Promise<number | null> {
  const { rows } = await query<{ numero: number }>(
    `SELECT numero FROM paises
      WHERE LOWER(nombre)      = LOWER($1)
         OR LOWER(nombrecorto) = LOWER($1)
      LIMIT 1`,
    [nombre],
  );
  return rows[0]?.numero ?? null;
}

export async function emailExists(email: string): Promise<boolean> {
  const { rows } = await query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM clientes_credenciales WHERE email = $1) AS exists`,
    [email],
  );
  return rows[0]?.exists ?? false;
}

export async function documentoExists(documento: string): Promise<boolean> {
  const { rows } = await query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM personas WHERE documento = $1) AS exists`,
    [documento],
  );
  return rows[0]?.exists ?? false;
}

export async function findClienteByDocumento(documento: string) {
  const { rows } = await query<{ identificador: number }>(
    `SELECT p.identificador
       FROM personas p
       JOIN clientes c ON c.identificador = p.identificador
      WHERE p.documento = $1`,
    [documento],
  );
  return rows[0] ?? null;
}

// ─── Inserts transaccionales (registro) ───────────────────────────────

export async function insertPersona(
  client: PoolClient,
  data: { documento: string; nombre: string; direccion: string | null },
): Promise<number> {
  const { rows } = await client.query<{ identificador: number }>(
    `INSERT INTO personas (documento, nombre, direccion, estado)
     VALUES ($1, $2, $3, 'activo')
     RETURNING identificador`,
    [data.documento, data.nombre, data.direccion],
  );
  return rows[0].identificador;
}

export async function insertClienteShell(
  client: PoolClient,
  data: { identificador: number; numeropais: number; verificador: number },
) {
  await client.query(
    `INSERT INTO clientes (identificador, numeropais, admitido, categoria, verificador)
     VALUES ($1, $2, 'no', 'comun', $3)`,
    [data.identificador, data.numeropais, data.verificador],
  );
}

export async function insertClientePerfil(
  client: PoolClient,
  data: {
    cliente_id: number;
    first_name: string;
    last_name: string;
    domicilio: string;
    pais: string;
  },
) {
  await client.query(
    `INSERT INTO clientes_perfil (cliente_id, first_name, last_name, domicilio, pais)
     VALUES ($1, $2, $3, $4, $5)`,
    [data.cliente_id, data.first_name, data.last_name, data.domicilio, data.pais],
  );
}

export async function insertClienteAdmisionPending(
  client: PoolClient,
  cliente_id: number,
) {
  await client.query(
    `INSERT INTO clientes_admision (cliente_id, estado)
     VALUES ($1, 'pending')`,
    [cliente_id],
  );
}

export async function updateClientePerfilDocs(
  cliente_id: number,
  documentFrontUrl: string,
  documentBackUrl: string,
) {
  await query(
    `UPDATE clientes_perfil
        SET document_front_url = $2,
            document_back_url  = $3,
            updated_at         = NOW()
      WHERE cliente_id = $1`,
    [cliente_id, documentFrontUrl, documentBackUrl],
  );
}

export async function getClientePerfilDocs(cliente_id: number) {
  const { rows } = await query<{
    document_front_url: string | null;
    document_back_url: string | null;
  }>(
    `SELECT document_front_url, document_back_url
       FROM clientes_perfil
      WHERE cliente_id = $1`,
    [cliente_id],
  );
  return rows[0] ?? null;
}

/**
 * Step 1 del registro: crea la fila con email pero sin password.
 * El login queda bloqueado hasta `setCredencialesPassword`.
 */
export async function insertCredencialesShell(
  client: PoolClient,
  cliente_id: number,
  email: string,
) {
  await client.query(
    `INSERT INTO clientes_credenciales (cliente_id, email, role)
     VALUES ($1, $2, 'user')`,
    [cliente_id, email],
  );
}

/**
 * Step 3 del registro: setea el password hasheado en la fila ya creada.
 */
export async function setCredencialesPassword(
  cliente_id: number,
  passwordHash: string,
) {
  const { rowCount } = await query(
    `UPDATE clientes_credenciales
        SET password_hash = $2
      WHERE cliente_id = $1`,
    [cliente_id, passwordHash],
  );
  return rowCount ?? 0;
}

export async function hasPasswordSet(cliente_id: number): Promise<boolean> {
  const { rows } = await query<{ has: boolean }>(
    `SELECT (password_hash IS NOT NULL) AS has
       FROM clientes_credenciales
      WHERE cliente_id = $1`,
    [cliente_id],
  );
  return rows[0]?.has ?? false;
}

// ─── Refresh tokens ───────────────────────────────────────────────────

export async function insertRefreshToken(
  tokenHash: string,
  clienteId: number,
  expiresAt: Date,
) {
  await query(
    `INSERT INTO refresh_tokens (token_hash, cliente_id, expires_at)
     VALUES ($1, $2, $3)`,
    [tokenHash, clienteId, expiresAt],
  );
}

export async function findRefreshToken(tokenHash: string) {
  const { rows } = await query<{
    cliente_id: number;
    expires_at: Date;
    revoked_at: Date | null;
  }>(
    `SELECT cliente_id, expires_at, revoked_at
       FROM refresh_tokens
      WHERE token_hash = $1`,
    [tokenHash],
  );
  return rows[0] ?? null;
}

export async function revokeRefreshToken(tokenHash: string) {
  await query(
    `UPDATE refresh_tokens
        SET revoked_at = NOW()
      WHERE token_hash = $1
        AND revoked_at IS NULL`,
    [tokenHash],
  );
}
