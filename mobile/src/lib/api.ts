import { NativeModules, Platform } from 'react-native'
import Constants from 'expo-constants'

export type BackendCategory = 'comun' | 'especial' | 'plata' | 'oro' | 'platino'

export interface AuthUser {
  id: number
  email: string
  role: 'user' | 'admin'
  firstName: string | null
  lastName: string | null
  category: BackendCategory | null
  admissionStatus: string | null
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface BackendAuction {
  id: number
  fecha: string
  hora: string
  estado: 'abierta' | 'cerrada'
  ubicacion: string | null
  capacidad_asistentes: number | null
  tiene_deposito: 'si' | 'no' | null
  seguridad_propia: 'si' | 'no' | null
  categoria: BackendCategory | null
  moneda: 'ARS' | 'USD'
  subastador_id: number | null
  subastador_nombre: string | null
  items_count: number
}

export interface BackendNotification {
  id: number
  tipo: 'bid' | 'auction' | 'payment' | 'system'
  titulo: string | null
  mensaje: string | null
  metadata: Record<string, unknown> | null
  leida: boolean
  leidaAt: string | null
  createdAt: string
}

export interface BackendPaymentMethod {
  id: number
  tipo: 'credit_card' | 'bank_account' | 'certified_check'
  verificado: boolean
  createdAt: string
  last4?: string
  brand?: string
  holder?: string
  expMonth?: number
  expYear?: number
  bankName?: string
  cbu?: string
  checkNumber?: string
  amount?: number | null
  currency?: string | null
}

export interface BackendMe {
  id: number
  email: string
  role: 'user' | 'admin'
  documento: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  domicilio: string | null
  pais: string | null
  category: BackendCategory | null
  admissionStatus: string | null
  documentVerified: boolean
  bidsBlocked: boolean
}

export interface BackendMetrics {
  totalAuctions: number
  wonAuctions: number
  totalBids: number
  totalSpent: number
  winRate: number
}

function inferHost(): string {
  // Expo Go: hostUri is "192.168.x.x:8081" — most reliable source
  const hostUri: string | undefined =
    (Constants.expoConfig as any)?.hostUri ??
    (Constants as any).manifest?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoClient?.hostUri

  if (hostUri) {
    const host = hostUri.split(':')[0]
    if (host && host !== 'localhost' && host !== '127.0.0.1') return host
  }

  // Fallback: extract from Metro bundler scriptURL
  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL
  if (scriptURL) {
    const match = scriptURL.match(/https?:\/\/([^/:]+)|exp:\/\/([^/:]+)/)
    const host = match?.[1] ?? match?.[2]
    if (host && host !== 'localhost' && host !== '127.0.0.1') return host
  }

  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost'
}

export function getApiBaseUrl() {
  return `http://${inferHost()}:4000/v1`
}

export function getWsBaseUrl() {
  return `ws://${inferHost()}:4000`
}

export interface BackendAuctionItem {
  item_id: number
  catalogo_id: number
  producto_id: number
  precio_base: string
  comision: string
  subastado: 'si' | 'no'
  descripcion_catalogo: string | null
  fotos_count: number
}

export interface BackendBidRow {
  id: number
  importe: string
  ganador: boolean
  item_id: number
  asistente_id: number
  cliente_id: number
  numero_postor: number
  subasta_id: number
}

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const headers = new Headers(init?.headers)
  if (!headers.has('Content-Type') && init?.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message ?? 'Error de red'
    throw new Error(message)
  }

  return payload as T
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  registerStart: (body: {
    email: string
    firstName: string
    lastName: string
    domicilio: string
    pais: string
    documento: string
    phone?: string
  }) =>
    request<{ userId: number; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  registerDocument: async (userId: number, documentFront: { uri: string; name: string; type: string }, documentBack: { uri: string; name: string; type: string }) => {
    const form = new FormData()
    form.append('userId', String(userId))
    form.append('documentFront', documentFront as any)
    form.append('documentBack', documentBack as any)
    const response = await fetch(`${getApiBaseUrl()}/auth/register/document`, {
      method: 'POST',
      body: form,
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message ?? 'Error subiendo documentos')
    return payload as { userId: number; documentFrontUrl: string; documentBackUrl: string; message: string }
  },

  registerComplete: (userId: number, password: string) =>
    request<{ message: string }>('/auth/register/complete', {
      method: 'POST',
      body: JSON.stringify({ userId, password }),
    }),

  getAuctionCatalog: (id: number) => request<BackendAuctionItem[]>(`/auctions/${id}/catalog`),
  getBidsForAuction: (id: number) => request<BackendBidRow[]>(`/bids/auction/${id}`),

  getActiveAuctions: () => request<BackendAuction[]>('/auctions/active'),
  getUpcomingAuctions: () => request<BackendAuction[]>('/auctions/upcoming'),
  listAuctions: () => request<{ items: BackendAuction[]; page: number; limit: number; total: number }>('/auctions'),

  getMe: (token: string) => request<BackendMe>('/users/me', undefined, token),
  getMyMetrics: (token: string) => request<BackendMetrics>('/users/me/metrics', undefined, token),
  getNotifications: (token: string) => request<BackendNotification[]>('/notifications', undefined, token),
  getPaymentMethods: (token: string) => request<BackendPaymentMethod[]>('/payment-methods', undefined, token),
}
