export interface MockItem {
  id: string
  auctionId: string
  title: string
  description: string
  longDescription?: string
  basePrice: number
  currentBid?: number
  bidCount?: number
  status: 'pending' | 'live' | 'sold' | 'unsold'
}

export const mockItems: MockItem[] = [
  // auc_001 — Subasta Tech Premium
  { id: 'item_001', auctionId: 'auc_001', title: 'iPhone 15 Pro Max 256GB', description: 'Nuevo, sellado, garantia oficial Apple', longDescription: 'iPhone 15 Pro Max de 256GB completamente nuevo y sellado de fabrica. Chip A17 Pro, camara 5x, USB-C, garantia oficial Apple Argentina.', basePrice: 700000, currentBid: 850000, bidCount: 23, status: 'live' },
  { id: 'item_002', auctionId: 'auc_001', title: 'AirPods Pro 2da Gen', description: 'Con estuche MagSafe, sellados', longDescription: 'AirPods Pro de 2da generacion sellados. Cancelacion activa de ruido, audio adaptativo, 30hs con estuche, resistente al agua IPX4.', basePrice: 120000, currentBid: 180000, bidCount: 15, status: 'pending' },
  { id: 'item_003', auctionId: 'auc_001', title: 'Apple Watch Series 9', description: '45mm GPS, correa deportiva', longDescription: 'Apple Watch Series 9 de 45mm GPS. Chip S9, pantalla siempre activa 2000 nits, sensor temperatura, resistente al agua 50m.', basePrice: 250000, currentBid: 320000, bidCount: 12, status: 'pending' },
  { id: 'item_004', auctionId: 'auc_001', title: 'MacBook Pro 14" M3', description: '16GB RAM, 512GB SSD, Space Black', longDescription: 'MacBook Pro 14" con chip M3, 16GB RAM, 512GB SSD. Pantalla Liquid Retina XDR, bateria 18hs, Thunderbolt 4, HDMI, MagSafe 3.', basePrice: 2000000, currentBid: 2350000, bidCount: 31, status: 'pending' },
  { id: 'item_005', auctionId: 'auc_001', title: 'iPad Pro 12.9" M2', description: '256GB WiFi+Cellular, con Apple Pencil', longDescription: 'iPad Pro 12.9" M2, 256GB, WiFi 6E y 5G. Incluye Apple Pencil 2da gen. Pantalla ProMotion 120Hz, camara 12MP, LiDAR.', basePrice: 800000, currentBid: 940000, bidCount: 18, status: 'pending' },
  { id: 'item_006', auctionId: 'auc_001', title: 'Mac Mini M4 Pro', description: '24GB RAM, 512GB SSD, con Magic Keyboard', longDescription: 'Mac Mini M4 Pro, 24GB RAM, 512GB SSD. Thunderbolt 5, HDMI 2.1, Ethernet 10Gb. Soporte hasta 3 monitores externos.', basePrice: 1200000, currentBid: 1380000, bidCount: 9, status: 'pending' },

  // auc_002 — Electrodomesticos Hogar
  { id: 'item_007', auctionId: 'auc_002', title: 'Heladera Samsung French Door', description: '519L, No Frost, dispensador de agua', basePrice: 90000, currentBid: 120000, bidCount: 8, status: 'pending' },
  { id: 'item_008', auctionId: 'auc_002', title: 'Lavarropas LG 10kg Inverter', description: 'Carga frontal, WiFi, vapor, 1400 RPM', basePrice: 60000, currentBid: 75000, bidCount: 5, status: 'pending' },
  { id: 'item_009', auctionId: 'auc_002', title: 'Aire Acondicionado Inverter 3000 frig', description: 'Frio/calor, WiFi, filtro antialergico', basePrice: 55000, currentBid: 68000, bidCount: 11, status: 'pending' },

  // auc_003 — Mobile World
  { id: 'item_010', auctionId: 'auc_003', title: 'Samsung Galaxy S24 Ultra', description: '512GB, Titanium Black, S-Pen incluido', basePrice: 900000, currentBid: 1050000, bidCount: 19, status: 'pending' },
  { id: 'item_011', auctionId: 'auc_003', title: 'Xiaomi 14 Ultra', description: '512GB, camara Leica, carga 90W', basePrice: 600000, currentBid: 720000, bidCount: 14, status: 'pending' },

  // auc_005 — Nintendo Fan Store
  { id: 'item_015', auctionId: 'auc_005', title: 'Nintendo Switch OLED', description: 'Edicion especial Zelda, nueva en caja', basePrice: 18000, currentBid: 25000, bidCount: 34, status: 'pending' },
  { id: 'item_016', auctionId: 'auc_005', title: 'Zelda — Tears of the Kingdom', description: 'Edicion coleccionista con artbook y poster', basePrice: 8000, currentBid: 12000, bidCount: 41, status: 'pending' },
  { id: 'item_017', auctionId: 'auc_005', title: 'Joy-Con Edicion Especial Mario', description: 'Par de Joy-Con, nunca usados, sellados', basePrice: 6000, currentBid: 9500, bidCount: 27, status: 'pending' },
  { id: 'item_018', auctionId: 'auc_005', title: 'Figura Amiibo - Link', description: 'Coleccion completa 8 figuras, mint in box', basePrice: 4000, currentBid: 6200, bidCount: 18, status: 'pending' },

  // auc_006 — Moda y Accesorios Premium
  { id: 'item_019', auctionId: 'auc_006', title: 'Bolso Louis Vuitton Neverfull MM', description: 'Lona monogram, autenticado, con dustbag', basePrice: 350000, currentBid: 420000, bidCount: 16, status: 'pending' },
  { id: 'item_020', auctionId: 'auc_006', title: 'Reloj Tag Heuer Carrera', description: 'Acero, esfera negra, movimiento automatico', basePrice: 800000, currentBid: 920000, bidCount: 11, status: 'pending' },
  { id: 'item_021', auctionId: 'auc_006', title: 'Zapatillas Air Jordan 1 Retro High OG', description: 'Chicago colorway, talle 42, deadstock', basePrice: 120000, currentBid: 185000, bidCount: 38, status: 'pending' },
  { id: 'item_022', auctionId: 'auc_006', title: 'Cinturon Hermes H', description: 'Cuero negro, hebilla dorada, talle 85', basePrice: 180000, currentBid: 210000, bidCount: 9, status: 'pending' },

  // auc_007 — Vehiculos y Motos Clasicas
  { id: 'item_023', auctionId: 'auc_007', title: 'Ford Mustang Fastback 1968', description: 'V8 390, restaurado, color Verde Highland', basePrice: 12000000, currentBid: 14500000, bidCount: 7, status: 'pending' },
  { id: 'item_024', auctionId: 'auc_007', title: 'Harley-Davidson Sportster 1972', description: '883cc, cromada, 12.000km originales', basePrice: 3500000, currentBid: 4200000, bidCount: 12, status: 'pending' },
  { id: 'item_025', auctionId: 'auc_007', title: 'Volkswagen Escarabajo 1963', description: 'Color rojo original, motor reconstruido', basePrice: 2800000, currentBid: 3100000, bidCount: 15, status: 'pending' },
  { id: 'item_026', auctionId: 'auc_007', title: 'Vespa GS 150 1961', description: 'Color azul celeste, estado original', basePrice: 1500000, currentBid: 1950000, bidCount: 20, status: 'pending' },
]

export function getItemsForAuction(auctionId: string): MockItem[] {
  const items = mockItems.filter(item => item.auctionId === auctionId)
  // Si no hay items reales para esta subasta, mostramos los de auc_001 como demo
  return items.length > 0 ? items : mockItems.filter(item => item.auctionId === 'auc_001')
}
