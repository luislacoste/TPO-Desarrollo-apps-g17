import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { api } from '../lib/api'

interface Props {
  navigation: any
  route: { params: { userId: number; email: string } }
}

const CONDITIONS_TEXT =
  'Al registrarse en nuestra plataforma, usted acepta cumplir con todas las normas ' +
  'y reglamentos vigentes establecidos por la empresa.\n\n' +
  'Sus datos personales serán tratados de forma confidencial y conforme a la ' +
  'política de privacidad vigente.\n\n' +
  'La categoría asignada a su cuenta determina las subastas a las que puede ' +
  'acceder. Esta categoría es definida por el equipo administrativo.\n\n' +
  'El incumplimiento de estas condiciones puede resultar en la suspensión o ' +
  'cancelación definitiva de su cuenta, sin derecho a reembolso.\n\n' +
  'Cualquier disputa será resuelta conforme a la legislación vigente de la ' +
  'República Argentina.'

export default function CompanyConditionsScreen({ navigation, route }: Props) {
  const { userId, email } = route.params
  const [loading, setLoading] = useState(false)

  const handleAccept = async () => {
    if (loading) return
    setLoading(true)
    try {
      await api.registerAcceptConditions(userId)
      navigation.replace('PendingApproval', { userId, email })
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo registrar la aceptación. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = () => {
    Alert.alert(
      'Rechazar condiciones',
      '¿Estás seguro? Tu registro no podrá completarse si rechazás las condiciones.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: () => navigation.replace('Login'),
        },
      ],
    )
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Feather name="file-text" size={28} color="#146C94" />
        </View>
        <Text style={styles.title}>Condiciones de la Empresa</Text>
        <Text style={styles.subtitle}>
          Leé y aceptá las condiciones para completar tu registro
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.conditionsCard}>
          <Text style={styles.conditionsTitle}>Términos y Condiciones</Text>
          <Text style={styles.conditionsText}>{CONDITIONS_TEXT}</Text>
        </View>

        <View style={styles.noticeCard}>
          <Feather name="info" size={16} color="#D97706" />
          <Text style={styles.noticeText}>
            Al aceptar, confirmás que leíste y comprendiste las condiciones. Tu cuenta quedará
            pendiente de aprobación por el equipo administrativo.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.acceptBtn, loading && styles.btnDisabled]}
          onPress={handleAccept}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="check" size={18} color="#FFFFFF" />
              <Text style={styles.acceptBtnText}>Aceptar y continuar</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.rejectBtn, loading && styles.btnDisabled]}
          onPress={handleReject}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Feather name="x" size={18} color="#EF4444" />
          <Text style={styles.rejectBtnText}>Rechazar</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#AFD3E2',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,61,84,0.15)',
    gap: 8,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#0a3d54' },
  subtitle: { fontSize: 13, color: '#146C94', lineHeight: 18 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16 },
  conditionsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  conditionsTitle: { fontSize: 15, fontWeight: '700', color: '#0A0A0A' },
  conditionsText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  noticeCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  noticeText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 18 },
  footer: {
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  acceptBtn: {
    height: 52,
    backgroundColor: '#146C94',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  rejectBtn: {
    height: 52,
    backgroundColor: '#FFF5F5',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectBtnText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
  btnDisabled: { opacity: 0.6 },
})
