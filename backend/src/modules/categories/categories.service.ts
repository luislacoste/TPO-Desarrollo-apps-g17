/**
 * Catálogo de categorías de usuario.
 *
 * Las 5 categorías válidas son común, especial, plata, oro y platino
 * (contrato swagger), ordenadas por `tier` ascendente.
 *
 * La categoría del cliente determina **a qué subastas puede acceder**: sólo
 * puede unirse a una subasta cuyo `tier` sea menor o igual al suyo
 * (común < especial < plata < oro < platino). La regla se aplica en
 * `auctions.service.join`.
 *
 * Son estáticas — no se modifican desde la UI ni desde admin.
 */
import { NotFound } from '../../utils/errors';

export type CategoryId = 'comun' | 'especial' | 'plata' | 'oro' | 'platino';

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
    id: 'comun',
    name: 'Común',
    tier: 1,
    description: 'Acceso básico a subastas públicas de categoría común.',
    benefits: [
      'Participar en subastas de categoría común',
      'Hacer pujas con los métodos de pago estándar',
    ],
    requirements: ['Registro completado y aprobado por la empresa.'],
  },
  {
    id: 'especial',
    name: 'Especial',
    tier: 2,
    description: 'Acceso a subastas comunes y especiales.',
    benefits: [
      'Todo lo de Común',
      'Acceso a subastas de categoría especial',
    ],
    requirements: [
      'Participación sostenida sin multas',
    ],
  },
  {
    id: 'plata',
    name: 'Plata',
    tier: 3,
    description: 'Beneficios extra, límite de pujas mayor.',
    benefits: [
      'Todo lo de Especial',
      'Acceso a subastas de categoría plata',
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
    tier: 4,
    description: 'Subastas exclusivas, beneficios premium.',
    benefits: [
      'Todo lo de Plata',
      'Acceso a subastas de categoría oro',
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
    tier: 5,
    description: 'Acceso completo, sin límites de reglas estándar.',
    benefits: [
      'Todo lo de Oro',
      'Acceso a subastas de categoría platino',
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
