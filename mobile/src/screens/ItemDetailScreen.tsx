import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useAppData } from '../context/AppContext'
import { api, BackendItemDetail } from '../lib/api'
import { useAuctionSocket } from '../lib/useAuctionSocket'

type BidStatus = 'idle' | 'success' | 'error'

interface LiveItem {
  id: string
  title: string
  description: string
  basePrice: number
  currentBid: number | undefined
  bidCount: number
  subastado: boolean
  justUpdated: boolean
}

interface Props {
  navigation: any
  route: { params: { item: LiveItem; auctionEndDate: string | null; auctionId: number } }
}

// Reglas de monto del backend (bids.service):
//   mínimo = oferta actual + 1% del precio base (o el precio base si no hay pujas)
//   máximo = oferta actual + 20% del precio base (sin tope en subastas oro/platino)
const MIN_PCT = 0.01
const MAX_PCT = 0.20

function secondsUntil(dateString: string | null): number {
  if (!dateString) return 0
  const diff = Math.floor((new Date(dateString).getTime() - Date.now()) / 1000)
  return Math.max(0, diff)
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return 'Finalizada'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatARS(amount: number): string {
  return '$ ' + amount.toLocaleString('es-AR')
}

export default function ItemDetailScreen({ navigation, route }: Props) {
  const { item, auctionEndDate, auctionId } = route.params
  const { session, activeAuctions, allAuctions } = useAppData()
  // Subasta a la que pertenece el ítem, tomada de los datos del backend ya
  // cargados en contexto (mismo origen que usa AuctionLiveScreen).
  const auction = [...activeAuctions, ...allAuctions].find(a => a.id === String(auctionId))

  const [detail, setDetail] = useState<BackendItemDetail | null>(null)
  const [liveBid, setLiveBid] = useState<number | undefined>(item.currentBid)
  const [liveBidCount, setLiveBidCount] = useState(item.bidCount)
  const [bidJustUpdated, setBidJustUpdated] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(() => secondsUntil(auctionEndDate))
  const [bidStatus, setBidStatus] = useState<BidStatus>('idle')
  const [bidLoading, setBidLoading] = useState(false)
  const [bidError, setBidError] = useState<string | null>(null)
  // Se vende en vivo (evento item_sold del WebSocket para este ítem).
  const [liveSold, setLiveSold] = useState(false)

  // Datos de catálogo/ítem: el detalle del backend manda; el item de
  // navegación es sólo fallback instantáneo mientras `detail` carga.
  const basePrice = detail?.precio_base != null ? Number(detail.precio_base) : item.basePrice
  const isSold = liveSold || (detail ? detail.subastado === 'si' : item.subastado)
  const itemTitle = detail?.descripcion_catalogo ?? item.title

  const currentBid = liveBid ?? basePrice
  // Paso = 1% del precio base (redondeado hacia arriba para no caer por debajo
  // del mínimo del backend). Mínimo/máximo válidos según haya o no pujas previas.
  const hasBid = (liveBid ?? 0) > 0
  const minStep = Math.max(1, Math.ceil(basePrice * MIN_PCT))
  const minBid = hasBid ? currentBid + minStep : basePrice
  const capExempt = auction?.category === 'oro' || auction?.category === 'platino'
  const maxBid = capExempt
    ? Number.POSITIVE_INFINITY
    : currentBid + Math.floor(basePrice * MAX_PCT)
  const [bidAmount, setBidAmount] = useState(minBid)

  const { connected, lastEvent } = useAuctionSocket(auctionId)

  const flashBidUpdate = useCallback(() => {
    setBidJustUpdated(true)
    setTimeout(() => setBidJustUpdated(false), 2000)
  }, [])

  const fetchLiveBid = useCallback(async () => {
    try {
      // Mejor oferta desde el endpoint dedicado del backend; el listado sólo
      // se usa para el contador de ofertas del ítem.
      const [best, bids] = await Promise.all([
        api.getCurrentBid(auctionId, Number(item.id)),
        api.getBidsForAuction(auctionId),
      ])
      setLiveBidCount(bids.filter(b => b.item_id === Number(item.id)).length)
      if (best) {
        const maxBid = Number(best.importe)
        setLiveBid(prev => {
          if (prev !== maxBid) flashBidUpdate()
          return maxBid
        })
      }
    } catch {}
  }, [auctionId, item.id, flashBidUpdate])

  // Fetch item detail for descripcion_completa and duenio_nombre
  useEffect(() => {
    api.getItemDetail(Number(item.id), session?.accessToken).then(setDetail).catch(() => {})
  }, [item.id, session?.accessToken])

  // Fetch authoritative best bid from backend on mount
  useEffect(() => { fetchLiveBid() }, [fetchLiveBid])

  // Countdown based on real auction end date
  useEffect(() => {
    const timer = setInterval(() => setTimeRemaining(secondsUntil(auctionEndDate)), 1000)
    return () => clearInterval(timer)
  }, [auctionEndDate])

  // Live bid updates via WebSocket
  useEffect(() => {
    if (!lastEvent) return
    if (lastEvent.type === 'bid_placed' && lastEvent.itemId === Number(item.id)) {
      setLiveBid(prev => Math.max(prev ?? 0, lastEvent.importe))
      setLiveBidCount(prev => prev + 1)
      flashBidUpdate()
      // Mantener el monto válido contra la nueva oferta (mínimo del backend).
      setBidAmount(prev => Math.max(prev, lastEvent.importe + minStep))
    }
    if (lastEvent.type === 'item_sold' && lastEvent.itemId === Number(item.id)) {
      setLiveSold(true)
      if (typeof lastEvent.importe === 'number') setLiveBid(prev => Math.max(prev ?? 0, lastEvent.importe))
    }
    if (lastEvent.type === 'auction_ended') {
      setTimeRemaining(0)
    }
  }, [lastEvent, item.id, flashBidUpdate, minStep])

  const handleOffer = async () => {
    if (bidLoading) return
    if (!session?.accessToken) {
      setBidError('Necesitás iniciar sesión para pujar')
      setBidStatus('error')
      return
    }
    setBidLoading(true)
    setBidError(null)
    try {
      await api.joinAuction(session.accessToken, auctionId)
      await api.placeBid(session.accessToken, { itemId: Number(item.id), importe: bidAmount })
      setBidStatus('success')
      await fetchLiveBid()
    } catch (err: any) {
      setBidError(err?.message ?? 'No se pudo realizar la puja')
      setBidStatus('error')
    } finally {
      setBidLoading(false)
    }
  }

  const quickIncrements = [minStep, minStep * 2, minStep * 5]
  const selectedQuickIndex = quickIncrements.indexOf(bidAmount - currentBid)

  const decrement = () => setBidAmount(prev => Math.max(minBid, prev - minStep))
  const increment = () => setBidAmount(prev => Math.min(maxBid, prev + minStep))
  const applyQuick = (inc: number) => setBidAmount(Math.min(maxBid, currentBid + inc))

  const overCurrent = bidAmount - currentBid
  const longDesc = detail?.descripcion_completa ?? detail?.descripcion_catalogo ?? item.description
  const owner = detail?.duenio_nombre
  const auctionClosed = auction?.status === 'ended' || timeRemaining === 0

  return (
    <SafeAreaView style={styles.root}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color="#0a3d54" />
        </TouchableOpacity>
        <View style={styles.topBarText}>
          <Text style={styles.topBarSub} numberOfLines={1}>{auction?.title ?? 'Subasta'}</Text>
          <Text style={styles.topBarTitle} numberOfLines={1}>{itemTitle}</Text>
        </View>
        <View style={[styles.liveBadge, auctionClosed && styles.liveBadgeClosed]}>
          {!auctionClosed && <View style={styles.liveDot} />}
          <Text style={styles.liveBadgeText}>{auctionClosed ? 'CERRADA' : 'EN VIVO'}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Image placeholder */}
        <View style={styles.imagePlaceholder}>
          <Feather name="image" size={64} color="#D4D4D4" />
          {detail && detail.fotos_count === 0 && (
            <Text style={styles.noPhotoText}>Sin fotos disponibles</Text>
          )}
        </View>

        {/* Info section */}
        <View style={styles.infoSection}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="users" size={15} color="#737373" />
              <Text style={styles.metaText}>{liveBidCount} ofertas</Text>
            </View>
            {owner && (
              <View style={styles.metaItem}>
                <Feather name="user" size={15} color="#737373" />
                <Text style={styles.metaText}>{owner}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <View style={[styles.wsDot, { backgroundColor: connected ? '#16A34A' : '#D4D4D4' }]} />
              <Text style={styles.metaText}>{connected ? 'En vivo' : 'Conectando…'}</Text>
            </View>
          </View>
          <Text style={styles.itemTitle}>{itemTitle}</Text>
          <View style={styles.countdownRow}>
            <Feather name="zap" size={18} color={timeRemaining > 0 ? '#FB2C36' : '#737373'} />
            <Text style={[styles.countdownText, timeRemaining === 0 && { color: '#737373' }]}>
              {timeRemaining > 0 ? `Termina en ${formatCountdown(timeRemaining)}` : 'Subasta finalizada'}
            </Text>
          </View>
          {longDesc ? (
            <Text style={styles.itemDescription}>{longDesc}</Text>
          ) : (
            <ActivityIndicator size="small" color="#D4D4D4" style={{ marginTop: 4 }} />
          )}
        </View>

        {/* Current bid bar */}
        <View style={styles.bidBar}>
          <View>
            <Text style={styles.bidBarLabel}>Oferta actual</Text>
            <Text style={[styles.bidBarValue, bidJustUpdated && styles.bidBarValueUpdated]}>
              {formatARS(currentBid)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.bidBarLabel}>Precio base</Text>
            <Text style={styles.bidBarValue}>{formatARS(basePrice)}</Text>
          </View>
        </View>

        {/* Bid input section */}
        <View style={styles.bidSection}>
          <Text style={styles.bidSectionTitle}>Tu oferta</Text>
          <Text style={styles.bidRangeHint}>
            Mínimo {formatARS(minBid)}
            {capExempt ? ' · sin tope (oro/platino)' : ` · máximo ${formatARS(maxBid)}`}
          </Text>

          {/* +/- controls */}
          <View style={styles.bidControls}>
            <TouchableOpacity onPress={decrement} style={styles.decrementBtn} activeOpacity={0.7}>
              <Feather name="minus" size={20} color="#737373" />
            </TouchableOpacity>

            <View style={styles.bidAmountWrap}>
              <Text style={styles.bidAmount}>{formatARS(bidAmount)}</Text>
              <Text style={styles.bidOver}>+{formatARS(overCurrent)} sobre actual</Text>
            </View>

            <TouchableOpacity onPress={increment} style={styles.incrementBtn} activeOpacity={0.7}>
              <Feather name="plus" size={20} color="#146C94" />
            </TouchableOpacity>
          </View>

          {/* Quick bid chips */}
          <View style={styles.quickBids}>
            {quickIncrements.map((inc, i) => {
              const isSelected = i === selectedQuickIndex
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => applyQuick(inc)}
                  style={[styles.quickChip, isSelected && styles.quickChipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.quickChipText, isSelected && styles.quickChipTextActive]}>
                    +{formatARS(inc)}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.offerBtn, (bidLoading || isSold || auctionClosed) && { opacity: 0.6 }]}
            onPress={handleOffer}
            activeOpacity={0.85}
            disabled={isSold || auctionClosed}
          >
            {bidLoading
              ? <ActivityIndicator color="#FAFAFA" />
              : <Text style={styles.offerBtnText}>
                  {isSold ? 'Item ya subastado' : `Ofertar ${formatARS(bidAmount)}`}
                </Text>
            }
          </TouchableOpacity>

          <Text style={styles.termsText}>Al ofertar aceptas los terminos y condiciones</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Confirmation overlay */}
      {bidStatus !== 'idle' && (
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>

            <View style={[
              styles.iconCircle,
              { backgroundColor: bidStatus === 'success' ? '#DCFCE7' : '#FFC4C7' }
            ]}>
              <Feather
                name={bidStatus === 'success' ? 'check' : 'x'}
                size={40}
                color={bidStatus === 'success' ? '#00A63E' : '#E7000B'}
                strokeWidth={3}
              />
            </View>

            <Text style={styles.overlayTitle}>
              {bidStatus === 'success' ? 'Oferta realizada' : 'No pudimos realizar tu oferta'}
            </Text>

            {bidStatus === 'success' ? (
              <>
                <Text style={styles.overlaySubtitle}>Tu oferta de {formatARS(bidAmount)}</Text>
                <Text style={styles.overlaySubtitle}>por {itemTitle} fue registrada</Text>
              </>
            ) : (
              <Text style={styles.overlaySubtitle}>{bidError ?? 'Intente ofertar nuevamente'}</Text>
            )}

            <View style={styles.overlayButtons}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => bidStatus === 'success' ? navigation.goBack() : setBidStatus('idle')}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>
                  {bidStatus === 'success' ? 'Ver otros items de esta subasta' : 'Intentar de nuevo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => navigation.navigate('Main')}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryBtnText}>Volver al inicio</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 62,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: '#AFD3E2',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,61,84,0.15)',
  },
  backBtn: { padding: 4, marginLeft: -4, flexShrink: 0 },
  topBarText: { flex: 1, minWidth: 0 },
  topBarSub: { fontSize: 11, color: '#146C94', lineHeight: 15 },
  topBarTitle: { fontSize: 15, fontWeight: '600', color: '#0a3d54', lineHeight: 20 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FB2C36',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 0,
  },
  liveBadgeClosed: { backgroundColor: '#737373' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  liveBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },

  scroll: { flex: 1 },

  imagePlaceholder: {
    width: '100%',
    height: 240,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noPhotoText: { fontSize: 13, color: '#A3A3A3' },

  infoSection: { padding: 16, gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: '#737373' },
  wsDot: { width: 8, height: 8, borderRadius: 4 },
  itemTitle: { fontSize: 22, fontWeight: '700', color: '#0A0A0A', lineHeight: 28 },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countdownText: { fontSize: 17, fontWeight: '700', color: '#FB2C36' },
  itemDescription: { fontSize: 14, color: '#737373', lineHeight: 22 },

  bidBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(245,245,245,0.5)',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  bidBarLabel: { fontSize: 12, color: '#737373', lineHeight: 16 },
  bidBarValue: { fontSize: 20, fontWeight: '700', color: '#0A0A0A', lineHeight: 28 },
  bidBarValueUpdated: { color: '#16A34A' },

  bidSection: { padding: 16, paddingBottom: 24, gap: 14 },
  bidSectionTitle: { fontSize: 16, fontWeight: '600', color: '#0A0A0A' },
  bidRangeHint: { fontSize: 12, color: '#737373', marginTop: -8 },

  bidControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  decrementBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  incrementBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#146C94',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidAmountWrap: { flex: 1, alignItems: 'center', gap: 4 },
  bidAmount: { fontSize: 24, fontWeight: '700', color: '#0A0A0A' },
  bidOver: { fontSize: 12, color: '#737373' },

  quickBids: { flexDirection: 'row', gap: 8 },
  quickChip: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipActive: { backgroundColor: '#146C94' },
  quickChipText: { fontSize: 13, fontWeight: '500', color: '#0A0A0A' },
  quickChipTextActive: { color: '#FAFAFA' },

  offerBtn: {
    height: 52,
    backgroundColor: '#146C94',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerBtnText: { fontSize: 16, fontWeight: '600', color: '#FAFAFA' },

  termsText: { fontSize: 12, color: '#737373', textAlign: 'center' },

  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFFFFF', zIndex: 50,
    alignItems: 'center', justifyContent: 'center',
    padding: 32,
  },
  overlayContent: {
    alignItems: 'center', gap: 8, width: '100%',
  },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  overlayTitle: {
    fontSize: 20, fontWeight: '700', color: '#0A0A0A',
    textAlign: 'center', marginTop: 8,
  },
  overlaySubtitle: {
    fontSize: 16, color: '#737373', textAlign: 'center',
  },
  overlayButtons: {
    width: '100%', gap: 12, marginTop: 24,
  },
  primaryBtn: {
    width: '100%', height: 36, backgroundColor: '#146C94',
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 14, fontWeight: '500', color: '#FAFAFA' },
  secondaryBtn: {
    width: '100%', height: 36, backgroundColor: '#AFD3E2',
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E5E5E5',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '500', color: '#0A0A0A' },
})
