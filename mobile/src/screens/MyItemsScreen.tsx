import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { api, BackendSellRequest } from '../lib/api'
import { useAppData } from '../context/AppContext'
import { sellStatusStyle } from '../lib/sellStatus'

interface Props {
  navigation: any
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MyItemsScreen({ navigation }: Props) {
  const { session } = useAppData()
  const [items, setItems] = useState<BackendSellRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!session?.accessToken) {
      setError('Tu sesión expiró. Iniciá sesión de nuevo.')
      setLoading(false)
      return
    }
    setError(null)
    try {
      const res = await api.getMySellRequests(session.accessToken)
      setItems(res.items)
    } catch (err: any) {
      setError(err?.message ?? 'No se pudieron cargar tus artículos')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [session?.accessToken])

  useEffect(() => {
    load()
  }, [load])

  // Recargar cada vez que la pantalla vuelve a foco (ej: tras crear una solicitud).
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load)
    return unsubscribe
  }, [navigation, load])

  const onRefresh = () => {
    setRefreshing(true)
    load()
  }

  const renderItem = ({ item }: { item: BackendSellRequest }) => {
    const status = sellStatusStyle(item.estado)
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('MyItemDetail', { id: item.id })}
      >
        <View style={styles.cardIcon}>
          <Feather name="package" size={20} color="#146C94" />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.titulo}</Text>
          {item.descripcion ? (
            <Text style={styles.cardDesc} numberOfLines={1}>{item.descripcion}</Text>
          ) : null}
          <View style={styles.cardMeta}>
            <View style={[styles.badge, { backgroundColor: status.bg }]}>
              <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
            </View>
            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={18} color="#737373" />
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#0a3d54" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mis Artículos</Text>
          <Text style={styles.headerSub}>Tus propuestas de venta</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('ProposeItem')}
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#146C94" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={40} color="#E7000B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#146C94" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Feather name="package" size={36} color="#AFD3E2" />
              </View>
              <Text style={styles.emptyTitle}>Todavía no propusiste ningún bien</Text>
              <Text style={styles.emptyDesc}>
                Cargá un artículo para que la empresa lo evalúe y lo lleve a subasta.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('ProposeItem')}
              >
                <Feather name="plus" size={18} color="#FFFFFF" />
                <Text style={styles.emptyBtnText}>Vender un artículo</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#AFD3E2',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,61,84,0.15)',
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0a3d54' },
  headerSub: { fontSize: 12, color: '#146C94' },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#146C94',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText: { fontSize: 14, color: '#737373', textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#146C94',
  },
  retryText: { color: '#FFFFFF', fontWeight: '600' },
  listContent: { padding: 16, gap: 10, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 14,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#0A0A0A' },
  cardDesc: { fontSize: 12, color: '#737373' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardDate: { fontSize: 11, color: '#A3A3A3' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 60 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F7FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0A0A0A', textAlign: 'center' },
  emptyDesc: { fontSize: 13, color: '#737373', textAlign: 'center', maxWidth: 280 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 18,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#146C94',
  },
  emptyBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
})
