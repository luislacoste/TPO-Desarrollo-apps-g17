import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { api } from '../lib/api'
import { useAuctionSocket } from '../lib/useAuctionSocket'
import CategoryBadge from '../components/CategoryBadge'
import type { UiAuction } from '../context/AppContext'

interface Props {
  navigation: any
  route: { params: { auction: UiAuction } }
}

interface LiveItem {
  item_id: number
  descripcion: string
  precio_base: number
  current_highest: number | null
  bid_count: number
  subastado: boolean
  just_updated: boolean
}

function formatCurrency(amount: number, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function LiveAuctionScreen({ navigation, route }: Props) {
  const { auction } = route.params
  const auctionId = Number(auction.id)

  const [items, setItems] = useState<LiveItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ended, setEnded] = useState(auction.status === 'ended')
  const [lastBidLabel, setLastBidLabel] = useState<string | null>(null)

  const { connected, lastEvent } = useAuctionSocket(auctionId)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [catalog, bids] = await Promise.all([
        api.getAuctionCatalog(auctionId),
        api.getBidsForAuction(auctionId),
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
        item_id: item.item_id,
        descripcion: item.descripcion_catalogo ?? `Item #${item.item_id}`,
        precio_base: Number(item.precio_base),
        current_highest: bidMap.get(item.item_id)?.max ?? null,
        bid_count: bidMap.get(item.item_id)?.count ?? 0,
        subastado: item.subastado === 'si',
        just_updated: false,
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el catálogo')
    } finally {
      setLoading(false)
    }
  }, [auctionId])

  useEffect(() => { load() }, [load])

  // Handle live WS events
  useEffect(() => {
    if (!lastEvent) return

    if (lastEvent.type === 'auction_ended') {
      setEnded(true)
      return
    }

    if (lastEvent.type === 'bid_placed') {
      const { itemId, importe } = lastEvent
      setItems(prev => prev.map(item => {
        if (item.item_id !== itemId) return item
        setLastBidLabel(
          `Nueva puja: ${formatCurrency(importe, auction.currency)} en ${item.descripcion.slice(0, 28)}${item.descripcion.length > 28 ? '…' : ''}`
        )
        return {
          ...item,
          current_highest: Math.max(item.current_highest ?? 0, importe),
          bid_count: item.bid_count + 1,
          just_updated: true,
        }
      }))
      setTimeout(() => {
        setItems(prev => prev.map(item =>
          item.item_id === itemId ? { ...item, just_updated: false } : item
        ))
      }, 2000)
    }

    if (lastEvent.type === 'item_sold') {
      setItems(prev => prev.map(item =>
        item.item_id === lastEvent.itemId ? { ...item, subastado: true } : item
      ))
    }
  }, [lastEvent])

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#0A0A0A" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{auction.title}</Text>
          <View style={styles.headerMeta}>
            <CategoryBadge category={auction.category} size="sm" />
            <View style={[styles.wsDot, { backgroundColor: connected ? '#16A34A' : '#D4D4D4' }]} />
            <Text style={styles.wsLabel}>{connected ? 'En vivo' : 'Conectando…'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={load} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={18} color="#737373" />
        </TouchableOpacity>
      </View>

      {/* Auction ended banner */}
      {ended && (
        <View style={styles.endedBanner}>
          <Feather name="check-circle" size={15} color="#FFFFFF" />
          <Text style={styles.endedText}>Subasta finalizada</Text>
        </View>
      )}

      {/* Live ticker */}
      {lastBidLabel && !ended && (
        <View style={styles.ticker}>
          <View style={styles.tickerDot} />
          <Text style={styles.tickerText} numberOfLines={1}>{lastBidLabel}</Text>
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3E73EE" />
          <Text style={styles.loadingText}>Cargando catálogo…</Text>
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <TouchableOpacity style={styles.centered} onPress={load} activeOpacity={0.8}>
          <Feather name="wifi-off" size={32} color="#D4D4D4" />
          <Text style={styles.errorTitle}>No se pudo cargar</Text>
          <Text style={styles.errorText}>{error}. Tocá para reintentar.</Text>
        </TouchableOpacity>
      )}

      {/* Items list */}
      {!loading && !error && (
        <FlatList
          data={items}
          keyExtractor={item => String(item.item_id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <View style={[
              styles.itemCard,
              item.just_updated && styles.itemCardFlash,
              item.subastado && styles.itemCardSold,
            ]}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemIndex}>#{index + 1}</Text>
                {item.subastado && (
                  <View style={styles.soldBadge}>
                    <Text style={styles.soldText}>ADJUDICADO</Text>
                  </View>
                )}
              </View>
              <Text style={styles.itemName}>{item.descripcion}</Text>
              <View style={styles.bidRows}>
                <View style={styles.bidRow}>
                  <Text style={styles.bidLabel}>Precio base</Text>
                  <Text style={styles.bidBase}>
                    {formatCurrency(item.precio_base, auction.currency)}
                  </Text>
                </View>
                <View style={styles.bidRow}>
                  <Text style={styles.bidLabel}>Mejor puja</Text>
                  <Text style={[styles.bidCurrent, item.just_updated && styles.bidCurrentFlash]}>
                    {item.current_highest
                      ? formatCurrency(item.current_highest, auction.currency)
                      : '—'}
                  </Text>
                </View>
              </View>
              {item.bid_count > 0 && (
                <Text style={styles.bidCount}>
                  {item.bid_count} {item.bid_count === 1 ? 'puja' : 'pujas'}
                </Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Feather name="package" size={40} color="#D4D4D4" />
              <Text style={styles.errorTitle}>Sin items en el catálogo</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0A0A0A' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  wsDot: { width: 8, height: 8, borderRadius: 4 },
  wsLabel: { fontSize: 12, color: '#737373' },
  refreshBtn: { padding: 6 },
  endedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  endedText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  ticker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 1,
    borderBottomColor: '#BBF7D0',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tickerDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A', flexShrink: 0,
  },
  tickerText: { fontSize: 13, color: '#15803D', fontWeight: '500', flex: 1 },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32,
  },
  loadingText: { fontSize: 13, color: '#737373' },
  errorTitle: { fontSize: 15, fontWeight: '600', color: '#0A0A0A' },
  errorText: { fontSize: 13, color: '#737373', textAlign: 'center' },
  list: { padding: 16, gap: 12 },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 14,
    gap: 8,
  },
  itemCardFlash: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  itemCardSold: {
    opacity: 0.6,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemIndex: { fontSize: 11, color: '#A3A3A3', fontWeight: '600' },
  soldBadge: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  soldText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#0A0A0A', lineHeight: 20 },
  bidRows: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  bidRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bidLabel: { fontSize: 12, color: '#737373' },
  bidBase: { fontSize: 13, fontWeight: '500', color: '#737373' },
  bidCurrent: { fontSize: 15, fontWeight: '700', color: '#0A0A0A' },
  bidCurrentFlash: { color: '#16A34A' },
  bidCount: { fontSize: 11, color: '#A3A3A3' },
})
