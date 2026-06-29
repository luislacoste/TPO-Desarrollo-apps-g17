import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { api } from '../lib/api'

interface Props {
  navigation: any
  route: { params?: { userId?: number; email?: string } }
}

type CheckStatus = 'idle' | 'pending' | 'approved' | 'rejected'

export default function PendingApprovalScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState(route.params?.email ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkStatus, setCheckStatus] = useState<CheckStatus>('idle')
  const [approvedUserId, setApprovedUserId] = useState<number | null>(null)

  const handleCheckStatus = async () => {
    if (!email.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const result = await api.checkApprovalStatus(email.trim().toLowerCase())
      if (result.admissionStatus === 'approved') {
        setCheckStatus('approved')
        setApprovedUserId(result.userId)
      } else if (result.admissionStatus === 'rejected') {
        setCheckStatus('rejected')
      } else {
        setCheckStatus('pending')
      }
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo verificar el estado. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoToSetPassword = () => {
    if (!approvedUserId) return
    navigation.replace('SetPassword', { userId: approvedUserId })
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Estado pendiente */}
      <View style={styles.statusSection}>
        <View style={styles.pendingCircle}>
          <Feather name="clock" size={48} color="#D97706" />
        </View>
        <Text style={styles.title}>Perfil en revisión</Text>
        <Text style={styles.desc}>
          Tu documentación fue enviada correctamente. El equipo administrativo la está
          revisando. Te avisaremos cuando tu cuenta sea aprobada.
        </Text>

        <View style={styles.infoCard}>
          <InfoRow icon="check-circle" text="Datos personales enviados" done />
          <InfoRow icon="check-circle" text="Documentación subida" done />
          <InfoRow icon="check-circle" text="Condiciones aceptadas" done />
          <InfoRow icon="clock" text="Aprobación administrativa" done={false} />
        </View>
      </View>

      {/* Verificar si ya fui aprobado */}
      <View style={styles.checkSection}>
        <Text style={styles.checkTitle}>¿Ya recibiste la aprobación?</Text>
        <Text style={styles.checkDesc}>
          Ingresá tu email para verificar si tu cuenta fue aprobada
        </Text>

        <View style={styles.inputWrap}>
          <Feather name="mail" size={18} color="#737373" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="tu@email.com"
            placeholderTextColor="#A3A3A3"
            value={email}
            onChangeText={v => { setEmail(v); setCheckStatus('idle'); setError(null) }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Resultado del chequeo */}
        {checkStatus === 'pending' && (
          <View style={styles.resultCard}>
            <Feather name="clock" size={18} color="#D97706" />
            <Text style={styles.resultTextPending}>Tu cuenta sigue en revisión. Volvé más tarde.</Text>
          </View>
        )}
        {checkStatus === 'rejected' && (
          <View style={[styles.resultCard, styles.resultCardRejected]}>
            <Feather name="x-circle" size={18} color="#EF4444" />
            <Text style={styles.resultTextRejected}>Tu cuenta fue rechazada. Contactá al administrador.</Text>
          </View>
        )}
        {checkStatus === 'approved' && (
          <View style={[styles.resultCard, styles.resultCardApproved]}>
            <Feather name="check-circle" size={18} color="#16A34A" />
            <Text style={styles.resultTextApproved}>¡Tu cuenta fue aprobada!</Text>
          </View>
        )}

        {checkStatus === 'approved' ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleGoToSetPassword}
            activeOpacity={0.85}
          >
            <Feather name="lock" size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Configurar contraseña</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, (!email.trim() || loading) && styles.btnDisabled]}
            onPress={handleCheckStatus}
            disabled={!email.trim() || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : (
                <>
                  <Feather name="refresh-cw" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Verificar estado</Text>
                </>
              )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.replace('Login')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function InfoRow({ icon, text, done }: { icon: string; text: string; done: boolean }) {
  return (
    <View style={ir.row}>
      <Feather name={icon as any} size={16} color={done ? '#16A34A' : '#D97706'} />
      <Text style={[ir.text, done && ir.textDone]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EEF2FF' },
  scroll: { paddingBottom: 40 },
  statusSection: {
    alignItems: 'center',
    paddingTop: 72,
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  pendingCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#0A0A0A', textAlign: 'center' },
  desc: { fontSize: 14, color: '#737373', textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  infoCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  checkSection: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  checkTitle: { fontSize: 16, fontWeight: '700', color: '#0A0A0A' },
  checkDesc: { fontSize: 13, color: '#737373', lineHeight: 18 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: '#0A0A0A' },
  errorText: { fontSize: 13, color: '#EF4444', textAlign: 'center' },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  resultCardApproved: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  resultCardRejected: { backgroundColor: '#FFF5F5', borderColor: '#FECACA' },
  resultTextPending: { flex: 1, fontSize: 13, color: '#92400E' },
  resultTextApproved: { flex: 1, fontSize: 13, color: '#15803D', fontWeight: '600' },
  resultTextRejected: { flex: 1, fontSize: 13, color: '#EF4444' },
  primaryBtn: {
    height: 52,
    backgroundColor: '#146C94',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  secondaryBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 14, color: '#737373' },
  btnDisabled: { opacity: 0.55 },
})

const ir = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { fontSize: 14, color: '#737373' },
  textDone: { color: '#0A0A0A' },
})
