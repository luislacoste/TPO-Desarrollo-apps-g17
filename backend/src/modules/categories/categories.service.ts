/**
 * Catálogo de categorías de usuario.
 *
 * Estas 4 categorías están definidas en el contrato (swagger) y son
 * estáticas — no se modifican desde la UI ni desde admin. Por eso viven
 * acá como constante en código en lugar de una tabla.
 *
 * Las descripciones reflejan la tabla de "Categorías de usuario" del
 * encabezado del swagger.
 */
import { NotFound } from '../../utils/errors';

export type CategoryId = 'bronce' | 'plata' | 'oro' | 'platino';

export interface Category {
  id: CategoryId;
  name: string;
  tier: number;
  description: string;
  benefits: string[];
  /** Pista de qué hay que cumplir para alcanzar este tier. */
  requirements: string[];
}

const CATEGORIES: ReadonlyArray<Category> = [
  {
    id: 'bronce',
    name: 'Bronce',
    tier: 1,
    description: 'Acceso básico a subastas públicas.',
    benefits: [
      'Participar en subastas públicas',
      'Hacer pujas con los métodos de pago estándar',
    ],
    requirements: ['Registro completado y aprobado por la empresa.'],
  },
  {
    id: 'plata',
    name: 'Plata',
    tier: 2,
    description: 'Beneficios extra, límite de pujas mayor.',
    benefits: [
      'Todo lo de Bronce',
      'Límite de pujas más alto',
      'Notificaciones prioritarias',
    ],
    requirements: [
      'Historial de pagos a tiempo',
      'Verificación financiera aprobada',
    ],
  },
  {
    id: 'oro',
    name: 'Oro',
    tier: 3,
    description: 'Subastas exclusivas, beneficios premium.',
    benefits: [
      'Todo lo de Plata',
      'Acceso a subastas exclusivas',
      'Soporte prioritario',
    ],
    requirements: [
      'Volumen de compra sostenido',
      'Sin multas pendientes',
    ],
  },
  {
    id: 'platino',
    name: 'Platino',
    tier: 4,
    description: 'Acceso completo, sin límites de reglas estándar.',
    benefits: [
      'Todo lo de Oro',
      'Sin tope de puja',
      'Acceso a subastas privadas',
    ],
    requirements: [
      'Invitación de la empresa',
      'Calificación de riesgo 5 o 6',
    ],
  },
] as const;

export function listCategories(): ReadonlyArray<Category> {
  return CATEGORIES;
}

export function findCategoryById(id: string): Category | null {
  return CATEGORIES.find((c) => c.id === id) ?? null;
}

export function getCategoryByIdOrThrow(id: string): Category {
  const c = findCategoryById(id);
  if (!c) throw new NotFound(`Categoría desconocida: ${id}`);
  return c;
}

/** Devuelve la siguiente categoría en el tier, o null si ya es la máxima. */
export function nextCategory(id: string): Category | null {
  const current = findCategoryById(id);
  if (!current) return null;
  return CATEGORIES.find((c) => c.tier === current.tier + 1) ?? null;
}
