export type UserCategory = 'comun' | 'especial' | 'plata' | 'oro' | 'platino'

export interface User {
  id: string
  name: string
  email: string
  category: UserCategory
  verified: boolean
  documentVerified: boolean
  metrics: UserMetrics
}

export interface UserMetrics {
  totalAuctions: number
  wonAuctions: number
  totalBids: number
  totalSpent: number
  rating: number
}

export interface Auction {
  id: string
  title: string
  description: string
  category: UserCategory
  startDate: string
  endDate: string
  status: 'upcoming' | 'live' | 'ended'
  currency: 'USD' | 'EUR' | 'ARS'
  itemCount: number
  startingPrice: number
  currentItem?: number
  auctioneer: string
  streamUrl?: string
  thumbnail: string
}

export interface Item {
  id: string
  auctionId: string
  title: string
  description: string
  longDescription?: string
  basePrice: number
  currentBid?: number
  bidCount?: number
  images: string[]
  artist?: string
  year?: number
  status: 'pending' | 'live' | 'sold' | 'unsold'
  winner?: string
}

export interface Bid {
  id: string
  itemId: string
  userId: string
  userName: string
  amount: number
  timestamp: string
  status: 'pending' | 'accepted' | 'rejected' | 'outbid'
}

export interface PaymentMethod {
  id: string
  type: 'bank_account' | 'credit_card' | 'certified_check'
  name: string
  lastFour?: string
  bank?: string
  verified: boolean
  expiryDate?: string
}

export interface Notification {
  id: string
  type: 'bid' | 'auction' | 'payment' | 'system'
  title: string
  message: string
  read: boolean
  timestamp: string
}

export const currentUser: User = {
  id: 'usr_001',
  name: 'Juan Carlos Mendez',
  email: 'carlos@example.com',
  category: 'oro',
  verified: true,
  documentVerified: true,
  metrics: {
    totalAuctions: 45,
    wonAuctions: 12,
    totalBids: 156,
    totalSpent: 45800,
    rating: 4.8,
  },
}

export const auctions: Auction[] = [
  {
    id: 'auc_001',
    title: 'Subasta Tech Premium',
    description: 'Los mejores productos tecnologicos Apple en un solo lugar.',
    category: 'oro',
    startDate: '2026-06-01T18:00:00Z',
    endDate: '2026-06-01T20:15:00Z',
    status: 'live',
    currency: 'ARS',
    itemCount: 6,
    startingPrice: 180000,
    currentItem: 1,
    auctioneer: 'TechStore',
    streamUrl: 'https://stream.subastapp.com/auc_001',
    thumbnail: '',
  },
  {
    id: 'auc_002',
    title: 'Electrodomesticos Hogar',
    description: 'Los mejores electrodomesticos de marcas premium para equipar tu hogar.',
    category: 'comun',
    startDate: '2026-06-02T10:00:00-03:00',
    endDate: '2026-06-02T14:00:00-03:00',
    status: 'upcoming',
    currency: 'ARS',
    itemCount: 3,
    startingPrice: 120000,
    auctioneer: 'Lic. Roberto Fernandez',
    thumbnail: '',
  },
  {
    id: 'auc_003',
    title: 'Mobile World',
    description: 'Smartphones, tablets y accesorios tecnologicos de ultima generacion.',
    category: 'especial',
    startDate: '2026-06-02T14:00:00-03:00',
    endDate: '2026-06-02T18:00:00-03:00',
    status: 'upcoming',
    currency: 'ARS',
    itemCount: 2,
    startingPrice: 150000,
    auctioneer: 'Ing. Pablo Martinez',
    thumbnail: '',
  },
  {
    id: 'auc_004',
    title: 'Antiguedades Europeas',
    description: 'Muebles y decoracion del siglo XVIII provenientes de castillos europeos.',
    category: 'oro',
    startDate: '2026-05-10T18:00:00Z',
    endDate: '2026-05-10T22:00:00Z',
    status: 'ended',
    currency: 'EUR',
    itemCount: 3,
    startingPrice: 500000,
    auctioneer: 'Dra. Ana Lopez',
    thumbnail: '',
  },
  {
    id: 'auc_005',
    title: 'Nintendo Fan Store',
    description: 'Consolas, juegos y coleccionables exclusivos del universo Nintendo.',
    category: 'comun',
    startDate: '2026-06-08T09:00:00-03:00',
    endDate: '2026-06-08T13:00:00-03:00',
    status: 'upcoming',
    currency: 'ARS',
    itemCount: 4,
    startingPrice: 25000,
    auctioneer: 'Sr. Juan Perez',
    thumbnail: '',
  },
  {
    id: 'auc_006',
    title: 'Moda y Accesorios Premium',
    description: 'Ropa, bolsos y accesorios de marcas de lujo internacionales.',
    category: 'plata',
    startDate: '2026-06-09T11:00:00-03:00',
    endDate: '2026-06-09T15:00:00-03:00',
    status: 'upcoming',
    currency: 'ARS',
    itemCount: 4,
    startingPrice: 45000,
    auctioneer: 'Lic. Sofia Ramirez',
    thumbnail: '',
  },
  {
    id: 'auc_007',
    title: 'Vehiculos y Motos Clasicas',
    description: 'Automoviles y motocicletas restauradas de la epoca dorada.',
    category: 'platino',
    startDate: '2026-06-10T15:00:00-03:00',
    endDate: '2026-06-10T19:00:00-03:00',
    status: 'upcoming',
    currency: 'ARS',
    itemCount: 8,
    startingPrice: 350000,
    auctioneer: 'Ing. Carlos Benitez',
    thumbnail: '',
  },
]

export const paymentMethods: PaymentMethod[] = [
  { id: 'pm_001', type: 'credit_card', name: 'Visa Platinum', lastFour: '4242', verified: true, expiryDate: '12/28' },
  { id: 'pm_002', type: 'bank_account', name: 'Cuenta Corriente', bank: 'Banco Nacion', lastFour: '7890', verified: true },
  { id: 'pm_003', type: 'credit_card', name: 'Mastercard Gold', lastFour: '5678', verified: false, expiryDate: '06/27' },
]

export const notifications: Notification[] = [
  { id: 'not_001', type: 'bid', title: 'Nueva puja superior', message: 'Tu puja en "Horizonte Infinito" fue superada. Oferta actual: $7,500', read: false, timestamp: '2026-03-15T19:45:30Z' },
  { id: 'not_002', type: 'auction', title: 'Subasta por comenzar', message: 'La subasta "Joyas Antiguas" comienza en 24 horas.', read: false, timestamp: '2026-03-15T19:00:00Z' },
  { id: 'not_003', type: 'payment', title: 'Pago recibido', message: 'Se proceso el pago de $4,200 por "Naturaleza Muerta".', read: true, timestamp: '2026-03-14T15:30:00Z' },
]

export function formatCurrency(amount: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((startOfDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24))
  const time = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
  if (diffDays === 0) return `Hoy ${time}`
  if (diffDays === 1) return `Manana ${time}`
  const dayName = date.toLocaleDateString('es-AR', { weekday: 'long' })
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${time}`
}
