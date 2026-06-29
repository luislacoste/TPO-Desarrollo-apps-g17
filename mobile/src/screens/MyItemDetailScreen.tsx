import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { api, BackendSellRequestDetail, resolveMediaUrl } from '../lib/api'
import { useAppData } from '../context/AppContext'
import { sellStatusStyle } from '../lib/sellStatus'

interface Props {
  navigation: any
  route: { params: { id: number } }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatMoney(amount: string | null, currency: string | null): string {
  if (!amount) return '—'
  const n = Number(amount)
  if (isNaN(n)) return '—'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency ?? 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

export default function MyItemDetailScreen({ navigation, route }: Props) {
  const { id } = route.params
  const { session } = useAppData()
  const [data, setData] = useState<BackendSellRequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!session?.accessToken) {
        setError('Tu sesión expiró. Iniciá sesión de nuevo.')
        setLoading(false)
        return
      }
      try {
        const res = await api.getSellRequestDetail(session.accessToken, id)
        if (active) setData(res)
      } catch (err: any) {
        if (active) setError(err?.message ?? 'No se pudo cargar el artículo')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [id, session?.accessToken])

  const status = data ? sellStatusStyle(data.estado) : null
  const isRejected =
    data?.estado === 'rejected_by_company' || data?.estado === 'conditions_rejected'

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#0a3d54" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del artículo</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#146C94" />
        </View>
      ) : error || !data ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={40} color="#E7000B" />
          <Text style={styles.errorText}>{error ?? 'Artículo no encontrado'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Imágenes */}
          {data.images.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.gallery}
            >
              {data.images.map(img => {
                const uri = resolveMediaUrl(img.url)
                return uri ? (
                  <Image key={img.id} source={{ uri }} style={styles.galleryImg} />
                ) : null
              })}
            </ScrollView>
          ) : (
            <View style={styles.noImages}>
              <Feather name="image" size={28} color="#A3A3A3" />
              <Text style={styles.noImagesText}>Sin imágenes</Text>
            </View>
          )}

          <View style={styles.body}>
            {/* Título + estado */}
            <Text style={styles.title}>{data.titulo}</Text>
            {status ? (
              <View style={[styles.badge, { backgroundColor: status.bg, alignSelf: 'flex-start' }]}>
                <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
              </View>
            ) : null}

            {/* Descripción */}
            {data.descripcion ? (
              <Section title="Descripción">
                <Text style={styles.paragraph}>{data.descripcion}</Text>
              </Section>
            ) : null}

            {/* Historia */}
            {data.historia ? (
              <Section title="Historia / procedencia">
                <Text style={styles.paragraph}>{data.historia}</Text>
              </Section>
            ) : null}

            {/* Datos */}
            <Section title="Información">
              <Row label="Precio base" value={formatMoney(data.precio_base, data.moneda)} />
              <Row label="Imágenes" value={String(data.images.length)} />
              <Row label="Creada" value={formatDate(data.created_at)} />
              <Row label="Actualizada" value={formatDate(data.updated_at)} />
            </Section>

            {/* Condiciones ofrecidas */}
            {data.estado === 'conditions_offered' && data.condiciones_notas ? (
              <Section title="Condiciones ofrecidas por la empresa">
                <Text style={styles.paragraph}>{data.condiciones_notas}</Text>
              </Section>
            ) : null}

            {/* Motivo de rechazo */}
            {isRejected && data.rechazo_motivo ? (
              <View style={styles.rejectBox}>
                <View style={styles.rejectHeader}>
                  <Feather name="x-circle" size={16} color="#B91C1C" />
                  <Text style={styles.rejectTitle}>Motivo del rechazo</Text>
                </View>
                <Text style={styles.rejectText}>{data.rechazo_motivo}</Text>
                {data.rechazo_por ? (
                  <Text style={styles.rejectMeta}>Rechazada por: {data.rechazo_por}</Text>
                ) : null}
              </View>
            ) : null}

            {/* Costo de devolución */}
            {data.return_amount ? (
              <Section title="Costo de devolución">
                <Row label="Importe" value={formatMoney(data.return_amount, data.moneda)} />
                {data.return_carrier ? <Row label="Transporte" value={data.return_carrier} /> : null}
                {data.return_eta ? <Row label="Entrega estimada" value={formatDate(data.return_eta)} /> : null}
              </Section>
            ) : null}
          </View>
        </ScrollView>
      )}
    </View>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText: { fontSize: 14, color: '#737373', textAlign: 'center' },
  content: { paddingBottom: 32 },
  gallery: { gap: 10, padding: 16 },
  galleryImg: { width: 220, height: 165, borderRadius: 14, backgroundColor: '#F5F5F5' },
  noImages: {
    height: 140,
    margin: 16,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  noImagesText: { fontSize: 12, color: '#A3A3A3' },
  body: { paddingHorizontal: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#0A0A0A' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  section: { gap: 6, marginTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0a3d54' },
  paragraph: { fontSize: 14, color: '#404040', lineHeight: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowLabel: { fontSize: 13, color: '#737373' },
  rowValue: { fontSize: 13, fontWeight: '500', color: '#0A0A0A' },
  rejectBox: {
    marginTop: 8,
    padding: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    gap: 6,
  },
  rejectHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rejectTitle: { fontSize: 14, fontWeight: '700', color: '#B91C1C' },
  rejectText: { fontSize: 14, color: '#7F1D1D', lineHeight: 20 },
  rejectMeta: { fontSize: 12, color: '#B91C1C' },
})
