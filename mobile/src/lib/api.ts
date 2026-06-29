import { NativeModules, Platform } from 'react-native'
import Constants from 'expo-constants'

export type BackendCategory = 'bronce' | 'plata' | 'oro' | 'platino'

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
  conditionsAccepted: boolean
  companyConditions: string | null
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

export interface BackendItemDetail {
  id: number
  catalogo_id: number
  producto_id: number
  subasta_id: number | null
  precio_base: string | null
  comision: string
  subastado: 'si' | 'no' | null
  descripcion_catalogo: string | null
  descripcion_completa: string | null
  fotos_count: number
  duenio_id: number
  duenio_nombre: string | null
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

// ─── Mock mode ────────────────────────────────────────────────────────────────
// Poné MOCK_MODE = false cuando el backend esté levantado
const MOCK_MODE = false

function delay<T>(value: T, ms = 700): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms))
}

const mockApi = {
  login: (_email: string, _password: string) =>
    delay<AuthResponse>({
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh',
      user: {
        id: 1,
        email: 'usuario@test.com',
        role: 'user',
        firstName: 'María',
        lastName: 'González',
        category: 'plata',
        admissionStatus: 'approved',
      },
    }),
  registerStart: (_body: any) => delay({ userId: 1, message: 'Registro iniciado' }),
  registerDocument: (_userId: number, _front: any, _back: any) =>
    delay({ userId: 1, documentFrontUrl: '', documentBackUrl: '', message: 'Documentos subidos' }),
  registerComplete: (_userId: number, _password: string) => delay({ message: 'ok' }),
  getMe: (_token: string) =>
    delay<BackendMe>({
      id: 1,
      email: 'usuario@test.com',
      role: 'user',
      documento: '12345678',
      firstName: 'María',
      lastName: 'González',
      phone: null,
      domicilio: 'Av. Corrientes 1234',
      pais: 'Argentina',
      category: 'plata',
      admissionStatus: 'approved',
      documentVerified: true,
      bidsBlocked: false,
      // false → redirige a la pantalla de condiciones al iniciar sesión
      conditionsAccepted: false,
      companyConditions:
        'Al participar en las subastas organizadas por esta empresa, usted acepta cumplir con todas las normas y reglamentos vigentes. ' +
        'Sus datos personales serán tratados conforme a la política de privacidad. ' +
        'El incumplimiento puede resultar en la suspensión de su cuenta. ' +
        'La categoría asignada determina las subastas a las que puede acceder.',
    }),
  getMyMetrics: (_token: string) =>
    delay<BackendMetrics>({ totalAuctions: 5, wonAuctions: 2, totalBids: 12, totalSpent: 15000, winRate: 40 }),
  getNotifications: (_token: string) => delay<BackendNotification[]>([]),
  getPaymentMethods: (_token: string) => delay<BackendPaymentMethod[]>([]),
  getActiveAuctions: () => delay<BackendAuction[]>([]),
  getUpcomingAuctions: () => delay<BackendAuction[]>([]),
  listAuctions: () => delay({ items: [] as BackendAuction[], page: 1, limit: 10, total: 0 }),
  getAuctionCatalog: (_id: number) => delay<BackendAuctionItem[]>([]),
  getBidsForAuction: (_id: number) => delay<BackendBidRow[]>([]),
  getItemDetail: (_id: number, _token?: string) => delay<BackendItemDetail>({} as BackendItemDetail),
  joinAuction: (_token: string, _auctionId: number) =>
    delay({ sessionId: 1, asistente: { id: 1, numeropostor: 1 }, wsUrl: '' }),
  placeBid: (_token: string, _body: { itemId: number; importe: number }) =>
    delay({ id: 1, itemId: 1, asistenteId: 1, importe: 100 }),
  acceptConditions: (_token: string) => delay({ message: 'Condiciones aceptadas' }),
  rejectConditions: (_token: string) => delay({ message: 'Condiciones rechazadas' }),
  registerAcceptConditions: (_userId: number) => delay({ message: 'Condiciones aceptadas' }),
  checkApprovalStatus: (_email: string) =>
    delay<{ userId: number; admissionStatus: string }>({ userId: 1, admissionStatus: 'approved' }),
}

const realApi = {
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
  getItemDetail: (id: number, token?: string) =>
    request<BackendItemDetail>(`/items/${id}`, undefined, token),
  joinAuction: (token: string, auctionId: number) =>
    request<{ sessionId: number; asistente: { id: number; numeropostor: number }; wsUrl: string }>(
      `/auctions/${auctionId}/join`,
      { method: 'POST' },
      token,
    ),

  placeBid: (token: string, body: { itemId: number; importe: number }) =>
    request<{ id: number; itemId: number; asistenteId: number; importe: number }>(
      '/bids',
      { method: 'POST', body: JSON.stringify(body) },
      token,
    ),

  getActiveAuctions: () => request<BackendAuction[]>('/auctions/active'),
  getUpcomingAuctions: () => request<BackendAuction[]>('/auctions/upcoming'),
  listAuctions: () => request<{ items: BackendAuction[]; page: number; limit: number; total: number }>('/auctions'),

  getMe: (token: string) => request<BackendMe>('/users/me', undefined, token),
  acceptConditions: (token: string) =>
    request<{ message: string }>('/users/me/conditions/accept', { method: 'POST' }, token),
  rejectConditions: (token: string) =>
    request<{ message: string }>('/users/me/conditions/reject', { method: 'POST' }, token),
  registerAcceptConditions: (userId: number) =>
    request<{ message: string }>('/auth/register/accept-conditions', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  checkApprovalStatus: (email: string) =>
    request<{ userId: number; admissionStatus: string }>('/auth/check-status', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  getMyMetrics: (token: string) => request<BackendMetrics>('/users/me/metrics', undefined, token),
  getNotifications: (token: string) => request<BackendNotification[]>('/notifications', undefined, token),
  getPaymentMethods: (token: string) => request<BackendPaymentMethod[]>('/payment-methods', undefined, token),
}

export const api = MOCK_MODE ? mockApi : realApi
