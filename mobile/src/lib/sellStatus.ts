import { SellRequestEstado } from './api'

export interface SellStatusStyle {
  label: string
  color: string
  bg: string
}

// Mapea el estado del backend (sell-requests.service.ts) a etiqueta + colores.
const STYLES: Record<SellRequestEstado, SellStatusStyle> = {
  pending:             { label: 'Pendiente',               color: '#B45309', bg: '#FEF3C7' },
  reviewing:           { label: 'En revisión',             color: '#1D4ED8', bg: '#DBEAFE' },
  conditions_offered:  { label: 'Condiciones ofrecidas',   color: '#0a3d54', bg: '#AFD3E2' },
  accepted:            { label: 'Aceptada',                color: '#15803D', bg: '#DCFCE7' },
  rejected_by_company: { label: 'Rechazada por la empresa', color: '#B91C1C', bg: '#FEE2E2' },
  conditions_rejected: { label: 'Condiciones rechazadas',  color: '#B91C1C', bg: '#FEE2E2' },
  returning:           { label: 'En devolución',           color: '#B45309', bg: '#FEF3C7' },
  returned:            { label: 'Devuelta',                color: '#525252', bg: '#F5F5F5' },
}

const FALLBACK: SellStatusStyle = { label: 'Desconocido', color: '#525252', bg: '#F5F5F5' }

export function sellStatusStyle(estado: SellRequestEstado | string): SellStatusStyle {
  return STYLES[estado as SellRequestEstado] ?? FALLBACK
}
