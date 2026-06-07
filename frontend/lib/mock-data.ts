// Mock data for SubastApp wireframes

export type UserCategory = 'comun' | 'especial' | 'plata' | 'oro' | 'platino'

export interface User {
  id: string
  name: string
  email: string
  category: UserCategory
  avatar?: string
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
  owner?: string
  history?: string
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

// Current user mock
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
    rating: 4.8
  }
}

// Mock auctions
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
    thumbnail: '/auctions/tech-premium.jpg'
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
    thumbnail: '/auctions/electrodomesticos.jpg'
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
    thumbnail: '/auctions/mobile-world.jpg'
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
    thumbnail: '/auctions/antiguedades-europeas.jpg'
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
    thumbnail: '/auctions/nintendo.jpg'
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
    thumbnail: '/auctions/moda.jpg'
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
    thumbnail: '/auctions/vehiculos.jpg'
  }
]

// Mock items for auction auc_001 (Subasta Tech Premium)
export const auctionItems: Item[] = [
  {
    id: 'item_001',
    auctionId: 'auc_001',
    title: 'iPhone 15 Pro Max 256GB',
    description: 'Nuevo, sellado, garantia oficial Apple',
    longDescription: 'iPhone 15 Pro Max de 256GB completamente nuevo, original y sellado de fabrica. Caracteristicas destacadas:\n• Capacidad de 256GB para fotos, videos y aplicaciones.\n• Conector USB-C para mayor compatibilidad y comodidad.\n• Camara de alta calidad con zoom optico 5x.\n• Chip A17 Pro de maxima performance.\nSe entrega en su caja original y cerrada con garantia oficial Apple Argentina.',
    basePrice: 700000,
    currentBid: 850000,
    bidCount: 23,
    images: ['/items/iphone-1.jpg'],
    status: 'live'
  },
  {
    id: 'item_002',
    auctionId: 'auc_001',
    title: 'AirPods Pro 2da Gen',
    description: 'Con estuche MagSafe, sellados',
    longDescription: 'AirPods Pro de 2da generacion sellados de fabrica con estuche de carga MagSafe. Cancelacion activa de ruido hasta 2x mas potente. Audio adaptativo para experiencias de escucha personalizadas. Hasta 30 horas de escucha total con el estuche. Resistencia al agua y sudor IPX4.',
    basePrice: 120000,
    currentBid: 180000,
    bidCount: 15,
    images: ['/items/airpods-1.jpg'],
    status: 'pending'
  },
  {
    id: 'item_003',
    auctionId: 'auc_001',
    title: 'Apple Watch Series 9',
    description: '45mm GPS, correa deportiva',
    longDescription: 'Apple Watch Series 9 de 45mm con GPS, caja de aluminio y correa deportiva incluida. Chip S9 SiP con doble CPU de nucleo neural para procesar solicitudes hasta 2x mas rapido. Pantalla siempre activa hasta 2000 nits de brillo. Sensor de temperatura de muñeca. Resistente al agua hasta 50 metros.',
    basePrice: 250000,
    currentBid: 320000,
    bidCount: 12,
    images: ['/items/watch-1.jpg'],
    status: 'pending'
  },
  {
    id: 'item_004',
    auctionId: 'auc_001',
    title: 'MacBook Pro 14" M3',
    description: '16GB RAM, 512GB SSD, Space Black',
    longDescription: 'MacBook Pro de 14 pulgadas con chip M3, 16GB de memoria unificada y 512GB de SSD en color Space Black. Pantalla Liquid Retina XDR de 14.2". Bateria de hasta 18 horas. Tres puertos Thunderbolt 4, puerto HDMI, ranura SDXC y MagSafe 3. Ideal para profesionales creativos y desarrolladores.',
    basePrice: 2000000,
    currentBid: 2350000,
    bidCount: 31,
    images: ['/items/macbook-1.jpg'],
    status: 'pending'
  },
  {
    id: 'item_005',
    auctionId: 'auc_001',
    title: 'iPad Pro 12.9" M2',
    description: '256GB WiFi + Cellular, con Apple Pencil',
    longDescription: 'iPad Pro de 12.9 pulgadas con chip M2, 256GB de almacenamiento, conectividad WiFi 6E y Cellular 5G. Incluye Apple Pencil de 2da generacion. Pantalla Liquid Retina XDR con ProMotion de 120Hz. Camara trasera de 12MP con LiDAR Scanner. Camara frontal de 12MP ultra gran angular con Center Stage.',
    basePrice: 800000,
    currentBid: 940000,
    bidCount: 18,
    images: ['/items/ipad-1.jpg'],
    status: 'pending'
  },
  {
    id: 'item_006',
    auctionId: 'auc_001',
    title: 'Mac Mini M4 Pro',
    description: '24GB RAM, 512GB SSD, con Magic Keyboard',
    longDescription: 'Mac Mini con chip M4 Pro, 24GB de memoria unificada y 512GB de SSD. Incluye Magic Keyboard con Touch ID. Conectividad Thunderbolt 5, tres puertos USB-A, HDMI 2.1 y puerto de red Ethernet 10Gb. Soporte para hasta tres monitores externos. El escritorio mas potente y compacto de Apple.',
    basePrice: 1200000,
    currentBid: 1380000,
    bidCount: 9,
    images: ['/items/macmini-1.jpg'],
    status: 'pending'
  },

  // auc_002 — Electrodomesticos Hogar
  {
    id: 'item_007',
    auctionId: 'auc_002',
    title: 'Heladera Samsung French Door',
    description: '519L, No Frost, dispensador de agua',
    basePrice: 90000,
    currentBid: 120000,
    bidCount: 8,
    images: ['/items/heladera-1.jpg'],
    status: 'pending'
  },
  {
    id: 'item_008',
    auctionId: 'auc_002',
    title: 'Lavarropas LG 10kg Inverter',
    description: 'Carga frontal, WiFi, vapor, 1400 RPM',
    basePrice: 60000,
    currentBid: 75000,
    bidCount: 5,
    images: ['/items/lavarropas-1.jpg'],
    status: 'pending'
  },
  {
    id: 'item_009',
    auctionId: 'auc_002',
    title: 'Aire Acondicionado Inverter 3000 frig',
    description: 'Frio/calor, WiFi, filtro antialergico',
    basePrice: 55000,
    currentBid: 68000,
    bidCount: 11,
    images: ['/items/aire-1.jpg'],
    status: 'pending'
  },

  // auc_003 — Mobile World
  {
    id: 'item_010',
    auctionId: 'auc_003',
    title: 'Samsung Galaxy S24 Ultra',
    description: '512GB, Titanium Black, S-Pen incluido',
    basePrice: 900000,
    currentBid: 1050000,
    bidCount: 19,
    images: ['/items/samsung-1.jpg'],
    status: 'pending'
  },
  {
    id: 'item_011',
    auctionId: 'auc_003',
    title: 'Xiaomi 14 Ultra',
    description: '512GB, camara Leica, carga 90W',
    basePrice: 600000,
    currentBid: 720000,
    bidCount: 14,
    images: ['/items/xiaomi-1.jpg'],
    status: 'pending'
  },

  // auc_004 — Antiguedades Europeas (ended)
  {
    id: 'item_012',
    auctionId: 'auc_004',
    title: 'Reloj de Pendulo Siglo XVIII',
    description: 'Caja de roble tallado, origen frances',
    basePrice: 400000,
    currentBid: 580000,
    bidCount: 22,
    images: ['/items/reloj-1.jpg'],
    status: 'sold',
    winner: 'usr_005'
  },
  {
    id: 'item_013',
    auctionId: 'auc_004',
    title: 'Escritorio Luis XVI',
    description: 'Madera de nogal con herrajes de bronce dorado',
    basePrice: 700000,
    currentBid: 950000,
    bidCount: 17,
    images: ['/items/escritorio-1.jpg'],
    status: 'sold',
    winner: 'usr_003'
  },
  {
    id: 'item_014',
    auctionId: 'auc_004',
    title: 'Porcelana de Sevres',
    description: 'Juego de te completo, 12 piezas, circa 1780',
    basePrice: 200000,
    currentBid: 310000,
    bidCount: 29,
    images: ['/items/porcelana-1.jpg'],
    status: 'sold',
    winner: 'usr_002'
  },

  // auc_005 — Nintendo Fan Store
  {
    id: 'item_015',
    auctionId: 'auc_005',
    title: 'Nintendo Switch OLED',
    description: 'Edicion especial Zelda, nueva en caja',
    basePrice: 18000,
    currentBid: 25000,
    bidCount: 34,
    images: ['/items/switch-1.jpg'],
    status: 'pending'
  },
  {
    id: 'item_016',
    auctionId: 'auc_005',
    title: 'The Legend of Zelda — Tears of the Kingdom',
    description: 'Edicion coleccionista con artbook y poster',
    basePrice: 8000,
    currentBid: 12000,
    bidCount: 41,
    images: ['/items/zelda-1.jpg'],
    status: 'pending'
  },
  {
    id: 'item_017',
    auctionId: 'auc_005',
    title: 'Joy-Con Edicion Especial Mario',
    description: 'Par de Joy-Con, nunca usados, sellados',
    basePrice: 6000,
    currentBid: 9500,
    bidCount: 27,
    images: ['/items/joycon-1.jpg'],
    status: 'pending'
  },
  {
    id: 'item_018',
    auctionId: 'auc_005',
    title: 'Figura Amiibo - Link',
    description: 'Coleccion completa 8 figuras, mint in box',
    basePrice: 4000,
    currentBid: 6200,
    bidCount: 18,
    images: ['/items/amiibo-1.jpg'],
    status: 'pending'
  },

  // auc_006 — Moda y Accesorios Premium
  {
    id: 'item_019',
    auctionId: 'auc_006',
    title: 'Bolso Louis Vuitton Neverfull MM',
    description: 'Lona monogram, autenticado, con dustbag',
    basePrice: 350000,
    currentBid: 420000,
    bidCount: 16,
    images: ['/items/lv-1.jpg'],
    status: 'pending'
  },
  {
    id: 'item_020',
    auctionId: 'auc_006',
    title: 'Reloj Tag Heuer Carrera',
    description: 'Acero, esfera negra, movimiento automatico',
    basePrice: 800000,
    currentBid: 920000,
    bidCount: 11,
    images: ['/items/tagheuer-1.jpg'],
    status: 'pending'
  },
  {
    id: 'item_021',
    auctionId: 'auc_006',
    title: 'Zapatillas Air Jordan 1 Retro High OG',
    description: 'Chicago colorway, talle 42, deadstock',
    basePrice: 120000,
    currentBid: 185000,
    bidCount: 38,
    images: ['/items/jordan-1.jpg'],
    status: 'pending'
  },
  {
    id: 'item_022',
    auctionId: 'auc_006',
    title: 'Cinturon Hermes H',
    description: 'Cuero negro, hebilla dorada, talle 85',
    basePrice: 180000,
    currentBid: 210000,
    bidCount: 9,
    images: ['/items/hermes-1.jpg'],
    status: 'pending'
  },

  // auc_007 — Vehiculos y Motos Clasicas
  {
    id: 'item_023',
    auctionId: 'auc_007',
    title: 'Ford Mustang Fastback 1968',
    description: 'V8 390, restaurado, color Verde Highland',
    basePrice: 12000000,
    currentBid: 14500000,
    bidCount: 7,
    images: ['/items/mustang-1.jpg'],
    status: 'pending'
  },
  {
    id: 'item_024',
    auctionId: 'auc_007',
    title: 'Harley-Davidson Sportster 1972',
    description: '883cc, cromada, 12.000km originales',
    basePrice: 3500000,
    currentBid: 4200000,
    bidCount: 12,
    images: ['/items/harley-1.jpg'],
    status: 'pending'
  },
  {
    id: 'item_025',
    auctionId: 'auc_007',
    title: 'Volkswagen Escarabajo 1963',
    description: 'Color rojo original, motor reconstruido',
    basePrice: 2800000,
    currentBid: 3100000,
    bidCount: 15,
    images: ['/items/escarabajo-1.jpg'],
    status: 'pending'
  },
  {
    id: 'item_026',
    auctionId: 'auc_007',
    title: 'Vespa GS 150 1961',
    description: 'Color azul celeste, estado original',
    basePrice: 1500000,
    currentBid: 1950000,
    bidCount: 20,
    images: ['/items/vespa-1.jpg'],
    status: 'pending'
  }
]

// Mock bids for current item
export const currentBids: Bid[] = [
  {
    id: 'bid_001',
    itemId: 'item_001',
    userId: 'usr_003',
    userName: 'Maria S.',
    amount: 7500,
    timestamp: '2026-03-15T19:45:30Z',
    status: 'accepted'
  },
  {
    id: 'bid_002',
    itemId: 'item_001',
    userId: 'usr_001',
    userName: 'Carlos R.',
    amount: 7200,
    timestamp: '2026-03-15T19:44:15Z',
    status: 'outbid'
  },
  {
    id: 'bid_003',
    itemId: 'item_001',
    userId: 'usr_004',
    userName: 'Juan P.',
    amount: 6800,
    timestamp: '2026-03-15T19:42:00Z',
    status: 'outbid'
  },
  {
    id: 'bid_004',
    itemId: 'item_001',
    userId: 'usr_003',
    userName: 'Maria S.',
    amount: 6500,
    timestamp: '2026-03-15T19:40:30Z',
    status: 'outbid'
  },
  {
    id: 'bid_005',
    itemId: 'item_001',
    userId: 'usr_001',
    userName: 'Carlos R.',
    amount: 5500,
    timestamp: '2026-03-15T19:38:00Z',
    status: 'outbid'
  }
]

// Mock payment methods
export const paymentMethods: PaymentMethod[] = [
  {
    id: 'pm_001',
    type: 'credit_card',
    name: 'Visa Platinum',
    lastFour: '4242',
    verified: true,
    expiryDate: '12/28'
  },
  {
    id: 'pm_002',
    type: 'bank_account',
    name: 'Cuenta Corriente',
    bank: 'Banco Nacion',
    lastFour: '7890',
    verified: true
  },
  {
    id: 'pm_003',
    type: 'credit_card',
    name: 'Mastercard Gold',
    lastFour: '5678',
    verified: false,
    expiryDate: '06/27'
  }
]

// Mock notifications
export const notifications: Notification[] = [
  {
    id: 'not_001',
    type: 'bid',
    title: 'Nueva puja superior',
    message: 'Tu puja en "Horizonte Infinito" fue superada. Oferta actual: $7,500',
    read: false,
    timestamp: '2026-03-15T19:45:30Z'
  },
  {
    id: 'not_002',
    type: 'auction',
    title: 'Subasta por comenzar',
    message: 'La subasta "Joyas Antiguas" comienza en 24 horas.',
    read: false,
    timestamp: '2026-03-15T19:00:00Z'
  },
  {
    id: 'not_003',
    type: 'payment',
    title: 'Pago recibido',
    message: 'Se proceso el pago de $4,200 por "Naturaleza Muerta".',
    read: true,
    timestamp: '2026-03-14T15:30:00Z'
  }
]

// Category labels and colors
export const categoryConfig: Record<UserCategory, { label: string; color: string; bgColor: string }> = {
  comun: { label: 'Comun', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  especial: { label: 'Especial', color: 'text-primary', bgColor: 'bg-primary/10' },
  plata: { label: 'Plata', color: 'text-silver', bgColor: 'bg-silver/10' },
  oro: { label: 'Oro', color: 'text-gold', bgColor: 'bg-gold/10' },
  platino: { label: 'Platino', color: 'text-platinum', bgColor: 'bg-platinum/20' }
}

// Helper function to format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Helper function to format date
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString))
}

// Helper function to calculate minimum bid
export function calculateMinBid(currentBid: number, basePrice: number): number {
  const base = currentBid || basePrice
  return Math.ceil(base * 1.01) // Minimum 1% increase
}

// Helper function to calculate maximum bid
export function calculateMaxBid(currentBid: number, basePrice: number): number {
  const base = currentBid || basePrice
  return Math.floor(base * 1.20) // Maximum 20% increase
}

// Helper to format date relative to today (e.g. "Mañana 10:00", "Lunes 09:00")
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((startOfDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24))

  const time = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })

  if (diffDays === 0) return `Hoy ${time}`
  if (diffDays === 1) return `Mañana ${time}`

  const dayName = date.toLocaleDateString('es-AR', { weekday: 'long' })
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${time}`
}
