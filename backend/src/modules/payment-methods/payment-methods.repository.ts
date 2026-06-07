/**
 * Queries SQL del módulo Payment Methods.
 *
 * Tabla `medios_pago` (complemento) tiene los 3 subtipos en una sola
 * tabla (credit_card, bank_account, certified_check) con columnas
 * específicas de cada subtipo.
 */
import { query } from '../../db';

export interface PaymentMethodRow {
  id: number;
  cliente_id: number;
  tipo: 'credit_card' | 'bank_account' | 'certified_check';
  verificado: boolean;
  created_at: Date;
  cc_last4: string | null;
  cc_brand: string | null;
  cc_holder: string | null;
  cc_exp_month: number | null;
  cc_exp_year: number | null;
  bank_name: string | null;
  bank_cbu: string | null;
  bank_holder: string | null;
  check_number: string | null;
  check_bank: string | null;
  check_amount: string | null;
  check_currency: string | null;
}

const SELECT_ALL = `
  SELECT identificador AS id, cliente_id, tipo, verificado, created_at,
         cc_last4, cc_brand, cc_holder, cc_exp_month, cc_exp_year,
         bank_name, bank_cbu, bank_holder,
         check_number, check_bank, check_amount, check_currency
    FROM medios_pago
`;

export async function listByCliente(clienteId: number) {
  const { rows } = await query<PaymentMethodRow>(
    `${SELECT_ALL} WHERE cliente_id = $1 ORDER BY identificador DESC`,
    [clienteId],
  );
  return rows;
}

export async function findById(id: number, clienteId?: number) {
  let sql = `${SELECT_ALL} WHERE identificador = $1`;
  const params: unknown[] = [id];
  if (clienteId !== undefined) {
    sql += ' AND cliente_id = $2';
    params.push(clienteId);
  }
  const { rows } = await query<PaymentMethodRow>(sql, params);
  return rows[0] ?? null;
}

export async function insertCreditCard(
  clienteId: number,
  data: { number: string; brand: string; holder: string; expMonth: number; expYear: number },
) {
  const last4 = data.number.slice(-4);
  const { rows } = await query<{ id: number }>(
    `INSERT INTO medios_pago (cliente_id, tipo, cc_last4, cc_brand, cc_holder, cc_exp_month, cc_exp_year)
     VALUES ($1, 'credit_card', $2, $3, $4, $5, $6)
     RETURNING identificador AS id`,
    [clienteId, last4, data.brand, data.holder, data.expMonth, data.expYear],
  );
  return rows[0].id;
}

export async function insertBankAccount(
  clienteId: number,
  data: { bankName: string; cbu: string; holder: string },
) {
  const { rows } = await query<{ id: number }>(
    `INSERT INTO medios_pago (cliente_id, tipo, bank_name, bank_cbu, bank_holder)
     VALUES ($1, 'bank_account', $2, $3, $4)
     RETURNING identificador AS id`,
    [clienteId, data.bankName, data.cbu, data.holder],
  );
  return rows[0].id;
}

export async function insertCertifiedCheck(
  clienteId: number,
  data: { checkNumber: string; bankName: string; amount: number; currency: string },
) {
  const { rows } = await query<{ id: number }>(
    `INSERT INTO medios_pago (cliente_id, tipo, check_number, check_bank, check_amount, check_currency)
     VALUES ($1, 'certified_check', $2, $3, $4, $5)
     RETURNING identificador AS id`,
    [clienteId, data.checkNumber, data.bankName, data.amount, data.currency],
  );
  return rows[0].id;
}

export async function isUsedByPayments(medioPagoId: number): Promise<boolean> {
  const { rows } = await query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM pagos WHERE medio_pago_id = $1) AS exists`,
    [medioPagoId],
  );
  return rows[0]?.exists ?? false;
}

export async function deleteById(id: number, clienteId: number) {
  const { rowCount } = await query(
    `DELETE FROM medios_pago WHERE identificador = $1 AND cliente_id = $2`,
    [id, clienteId],
  );
  return rowCount ?? 0;
}
