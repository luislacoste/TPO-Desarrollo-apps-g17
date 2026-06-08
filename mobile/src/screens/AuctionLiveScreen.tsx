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
import { api } from '../lib/api'
import { useAuctionSocket } from '../lib/useAuctionSocket'

interface Props {
  navigation: any
  route: { params: { auctionId: string } }
}

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

export default function AuctionLiveScreen({ navigation, route }: Props) {
  const { auctionId } = route.params
  const { allAuctions, activeAuctions } = useAppData()
  const allKnown = [...activeAuctions, ...allAuctions]
  const auction = allKnown.find(a => a.id === auctionId) ?? allKnown[0]

  const [items, setItems] = useState<LiveItem[]>([])
  const [loading, setLoading] = useState(true)
  const [ended, setEnded] = useState(auction?.status === 'ended')
  const [lastBidLabel, setLastBidLabel] = useState<string | null>(null)

  const { connected, lastEvent } = useAuctionSocket(Number(auctionId))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const id = Number(auctionId)
      const [catalog, bids] = await Promise.all([
        api.getAuctionCatalog(id),
        api.getBidsForAuction(id),
      ])
      const bidMap = new Map<number, { max: number; count: number }>()
      for (const b of bids) {
        const importe = Number(b.importe)
        const prev = bidMap.get(b.item_id)
        bidMap.set(b.item_id, prev
          ? { max: Math.max(prev.max, importe), count: prev.count + 1 }
          : { max: importe, count: 1 },
        )
      }
      setItems(catalog.map(item => ({
        id: String(item.item_id),
        title: item.descripcion_catalogo ?? `Item #${item.item_id}`,
        description: `Base: $${Number(item.precio_base).toLocaleString('es-AR')}`,
        basePrice: Number(item.precio_base),
        currentBid: bidMap.get(item.item_id)?.max,
        bidCount: bidMap.get(item.item_id)?.count ?? 0,
        subastado: item.subastado === 'si',
        justUpdated: false,
      })))
    } catch {
      // Si falla la carga, la lista queda vacía — el usuario puede reintentar
    } finally {
      setLoading(false)
    }
  }, [auctionId])

  useEffect(() => { load() }, [load])

  // Eventos en vivo
  useEffect(() => {
    if (!lastEvent) return
    if (lastEvent.type === 'auction_ended') {
      setEnded(true)
      return
    }
    if (lastEvent.type === 'bid_placed') {
      const { itemId, importe } = lastEvent
      setItems(prev => prev.map(item => {
        if (item.id !== String(itemId)) return item
        setLastBidLabel(`Nueva puja: $${importe.toLocaleString('es-AR')} en ${item.title.slice(0, 25)}…`)
        return { ...item, currentBid: Math.max(item.currentBid ?? 0, importe), bidCount: item.bidCount + 1, justUpdated: true }
      }))
      setTimeout(() => {
        setItems(prev => prev.map(item => item.id === String(itemId) ? { ...item, justUpdated: false } : item))
      }, 2000)
    }
    if (lastEvent.type === 'item_sold') {
      setItems(prev => prev.map(item => item.id === String(lastEvent.itemId) ? { ...item, subastado: true } : item))
    }
  }, [lastEvent])

  const totalBids = items.reduce((acc, item) => acc + item.bidCount, 0)
  const auctioneerInitial = (auction?.auctioneer ?? 'S').charAt(0).toUpperCase()
  const categoryLabel = auction?.category
    ? auction.category.charAt(0).toUpperCase() + auction.category.slice(1)
    : 'Común'

  return (
    <SafeAreaView style={styles.root}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color="#0a3d54" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>{auction?.title ?? 'Subasta'}</Text>
        <View style={[styles.liveBadge, ended && { backgroundColor: '#737373' }]}>
          {!ended && <View style={styles.liveDot} />}
          <Text style={styles.liveBadgeText}>{ended ? 'CERRADA' : 'EN VIVO'}</Text>
        </View>
      </View>

      {/* Auctioneer info bar */}
      <View style={styles.auctioneerBar}>
        <View style={styles.auctioneerRow}>
          <View style={styles.auctioneerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{auctioneerInitial}</Text>
            </View>
            <View style={styles.auctioneerInfo}>
              <Text style={styles.auctioneerName}>{auction?.auctioneer ?? 'N/D'}</Text>
              <View style={styles.ratingRow}>
                <Feather name="star" size={12} color="#FD9A00" />
                <Text style={styles.ratingText}>4.8</Text>
              </View>
            </View>
          </View>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{categoryLabel}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <View style={[styles.wsDot, { backgroundColor: connected ? '#16A34A' : '#D4D4D4' }]} />
            <Text style={[styles.metaLive, !connected && { color: '#737373' }]}>
              {connected ? 'Conectado en vivo' : 'Conectando…'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="tool" size={14} color="#737373" />
            <Text style={styles.metaText}>{items.length} items</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="users" size={14} color="#737373" />
            <Text style={styles.metaText}>{totalBids} ofertas</Text>
          </View>
        </View>
      </View>

      {/* Live ticker */}
      {lastBidLabel && !ended && (
        <View style={styles.ticker}>
          <View style={styles.tickerDot} />
          <Text style={styles.tickerText} numberOfLines={1}>{lastBidLabel}</Text>
        </View>
      )}

      {/* Scrollable content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeading}>Items en esta subasta ({items.length})</Text>

        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#146C94" />
          </View>
        )}

        {items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.itemCard, item.justUpdated && styles.itemCardFlash, item.subastado && styles.itemCardSold]}
            onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
            activeOpacity={0.8}
          >
            <View style={styles.itemThumb}>
              <Feather name="image" size={26} color="#D4D4D4" />
              {item.subastado && (
                <View style={styles.soldOverlay}>
                  <Text style={styles.soldText}>✓</Text>
                </View>
              )}
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle} numberOfLines={1}>#{index + 1} {item.title}</Text>
              <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
              <View style={styles.itemBottom}>
                <View>
                  <Text style={styles.itemBidLabel}>Oferta actual</Text>
                  <Text style={[styles.itemBidValue, item.justUpdated && { color: '#16A34A' }]}>
                    $ {(item.currentBid ?? item.basePrice).toLocaleString('es-AR')}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Feather name="users" size={11} color="#737373" />
                  <Text style={styles.metaText}>{item.bidCount} ofertas</Text>
                </View>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color="#737373" />
          </TouchableOpacity>
        ))}

        {/* Como participar */}
        <View style={styles.howBox}>
          <Text style={styles.howTitle}>COMO PARTICIPAR</Text>
          {[
            'Selecciona el item por el que quieres pujar',
            'Ingresa tu oferta (debe ser mayor a la actual)',
            'Confirma tu puja y espera el resultado',
            'Puedes pujar por multiples items simultaneamente',
          ].map((text, i) => (
            <Text key={i} style={styles.howStep}>{i + 1}. {text}</Text>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: '#AFD3E2',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,61,84,0.15)',
  },
  backBtn: { padding: 4, marginLeft: -4, flexShrink: 0 },
  topBarTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#0a3d54' },
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
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  liveBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },

  auctioneerBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: 'rgba(245,245,245,0.3)',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    gap: 12,
  },
  auctioneerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  auctioneerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(23,23,23,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarLetter: { fontSize: 15, fontWeight: '700', color: '#171717' },
  auctioneerInfo: { gap: 4 },
  auctioneerName: { fontSize: 17, fontWeight: '500', color: '#0A0A0A' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, color: '#737373' },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#FEF3C6',
    borderWidth: 1,
    borderColor: '#FEE685',
    borderRadius: 999,
  },
  categoryPillText: { fontSize: 12, fontWeight: '500', color: '#BB4D00' },

  wsDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaLive: { fontSize: 13, fontWeight: '700', color: '#16A34A' },
  metaText: { fontSize: 12, color: '#737373' },
  ticker: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', borderBottomWidth: 1, borderBottomColor: '#BBF7D0',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  tickerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#16A34A', flexShrink: 0 },
  tickerText: { fontSize: 13, color: '#15803D', fontWeight: '500', flex: 1 },
  loadingWrap: { alignItems: 'center', paddingVertical: 24 },
  itemCardFlash: { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' },
  itemCardSold: { opacity: 0.55 },
  soldOverlay: {
    position: 'absolute', width: '100%', height: '100%', borderRadius: 10,
    backgroundColor: 'rgba(22,163,74,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  soldText: { fontSize: 22, color: '#16A34A', fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  sectionHeading: { fontSize: 16, fontWeight: '600', color: '#0A0A0A', marginBottom: 4 },

  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 14,
  },
  itemThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemTitle: { fontSize: 14, fontWeight: '500', color: '#0A0A0A' },
  itemDesc: { fontSize: 12, color: '#737373' },
  itemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  itemBidLabel: { fontSize: 11, color: '#737373' },
  itemBidValue: { fontSize: 14, fontWeight: '700', color: '#171717' },

  howBox: {
    padding: 16,
    backgroundColor: '#AFD3E2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#8BBDD0',
    gap: 6,
    marginTop: 4,
  },
  howTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a3d54',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  howStep: { fontSize: 13, color: '#146C94', lineHeight: 20 },
})
