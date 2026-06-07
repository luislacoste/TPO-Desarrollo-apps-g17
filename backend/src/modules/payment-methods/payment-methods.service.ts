/**
 * Lógica de Payment Methods.
 * El cheque certificado NO está restringido a Oro/Platino (corrección 5.2).
 */
import * as repo from './payment-methods.repository';
import { Conflict, NotFound, UnprocessableEntity } from '../../utils/errors';

// ─── Shape de salida (oculta datos sensibles si los hubiera) ──────────

function toResponse(row: repo.PaymentMethodRow) {
  const base = {
    id: row.id,
    tipo: row.tipo,
    verificado: row.verificado,
    createdAt: row.created_at,
  };
  if (row.tipo === 'credit_card') {
    return {
      ...base,
      last4: row.cc_last4,
      brand: row.cc_brand,
      holder: row.cc_holder,
      expMonth: row.cc_exp_month,
      expYear: row.cc_exp_year,
    };
  }
  if (row.tipo === 'bank_account') {
    return {
      ...base,
      bankName: row.bank_name,
      cbu: row.bank_cbu,
      holder: row.bank_holder,
    };
  }
  return {
    ...base,
    checkNumber: row.check_number,
    bankName: row.check_bank,
    amount: row.check_amount !== null ? Number(row.check_amount) : null,
    currency: row.check_currency,
  };
}

// ─── Casos de uso ─────────────────────────────────────────────────────

export async function listMine(clienteId: number) {
  const rows = await repo.listByCliente(clienteId);
  return rows.map(toResponse);
}

export async function getStatus(id: number, clienteId: number) {
  const row = await repo.findById(id, clienteId);
  if (!row) throw new NotFound('Medio de pago no encontrado');
  return {
    id: row.id,
    tipo: row.tipo,
    verificado: row.verificado,
    estado: row.verificado ? 'verified' : 'pending_verification',
  };
}

export interface CreditCardInput {
  number: string;
  brand: string;
  holder: string;
  expMonth: number;
  expYear: number;
}

export async function addCreditCard(clienteId: number, input: CreditCardInput) {
  if (!/^\d{13,19}$/.test(input.number)) {
    throw new UnprocessableEntity('Número de tarjeta inválido');
  }
  if (!input.brand?.trim() || !input.holder?.trim()) {
    throw new UnprocessableEntity('Faltan brand u holder');
  }
  if (!Number.isInteger(input.expMonth) || input.expMonth < 1 || input.expMonth > 12) {
    throw new UnprocessableEntity('expMonth inválido');
  }
  if (!Number.isInteger(input.expYear) || input.expYear < new Date().getFullYear()) {
    throw new UnprocessableEntity('expYear inválido o vencido');
  }
  const id = await repo.insertCreditCard(clienteId, input);
  const row = await repo.findById(id);
  return toResponse(row!);
}

export interface BankAccountInput {
  bankName: string;
  cbu: string;
  holder: string;
}

export async function addBankAccount(clienteId: number, input: BankAccountInput) {
  if (!input.bankName?.trim() || !input.cbu?.trim() || !input.holder?.trim()) {
    throw new UnprocessableEntity('Faltan campos obligatorios');
  }
  if (!/^\d{22}$/.test(input.cbu)) {
    throw new UnprocessableEntity('CBU inválido (debe tener 22 dígitos)');
  }
  const id = await repo.insertBankAccount(clienteId, input);
  const row = await repo.findById(id);
  return toResponse(row!);
}

export interface CertifiedCheckInput {
  checkNumber: string;
  bankName: string;
  amount: number;
  currency: string;
}

export async function addCertifiedCheck(clienteId: number, input: CertifiedCheckInput) {
  if (!input.checkNumber?.trim() || !input.bankName?.trim() || !input.currency?.trim()) {
    throw new UnprocessableEntity('Faltan campos obligatorios');
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new UnprocessableEntity('amount inválido');
  }
  // Sin restricción de categoría (corrección 5.2).
  const id = await repo.insertCertifiedCheck(clienteId, input);
  const row = await repo.findById(id);
  return toResponse(row!);
}

export async function deleteMine(id: number, clienteId: number) {
  const row = await repo.findById(id, clienteId);
  if (!row) throw new NotFound('Medio de pago no encontrado');
  if (await repo.isUsedByPayments(id)) {
    throw new Conflict('No se puede eliminar: tiene pagos asociados');
  }
  await repo.deleteById(id, clienteId);
}
