import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { api } from '../lib/api'

interface Props {
  navigation: any
  route: { params: { userId: number } }
}

export default function SetPasswordScreen({ navigation, route }: Props) {
  const { userId } = route.params
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const hasLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const isValid = hasLength && hasUpper && hasNumber && passwordsMatch

  const handleSetPassword = async () => {
    if (!isValid || loading) return
    setLoading(true)
    setError(null)
    try {
      await api.registerComplete(userId, password)
      setDone(true)
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo guardar la contraseña. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <View style={styles.successRoot}>
        <View style={styles.successCircle}>
          <Feather name="check-circle" size={56} color="#16A34A" />
        </View>
        <Text style={styles.successTitle}>¡Todo listo!</Text>
        <Text style={styles.successDesc}>
          Tu contraseña fue creada exitosamente. Ya podés iniciar sesión con tu email y contraseña.
        </Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.replace('Login')}
          activeOpacity={0.85}
        >
          <Text style={styles.loginBtnText}>Ir al inicio de sesión</Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.approvedBadge}>
            <Feather name="check-circle" size={20} color="#16A34A" />
            <Text style={styles.approvedBadgeText}>Cuenta aprobada</Text>
          </View>
          <Text style={styles.title}>Configurá tu contraseña</Text>
          <Text style={styles.subtitle}>
            Tu cuenta fue aprobada. Creá una contraseña segura para comenzar a participar.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Nueva contraseña</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={18} color="#737373" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputPadRight]}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor="#A3A3A3"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#737373" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={18} color="#737373" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputPadRight]}
                placeholder="Repetí tu contraseña"
                placeholderTextColor="#A3A3A3"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
                <Feather name={showConfirm ? 'eye-off' : 'eye'} size={18} color="#737373" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Requisitos */}
          <View style={styles.requirements}>
            <Text style={styles.reqTitle}>La contraseña debe tener:</Text>
            <Requirement met={hasLength} text="Mínimo 8 caracteres" />
            <Requirement met={hasUpper} text="Una letra mayúscula" />
            <Requirement met={hasNumber} text="Un número" />
            <Requirement met={passwordsMatch} text="Las contraseñas coinciden" />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.submitBtn, (!isValid || loading) && styles.btnDisabled]}
            onPress={handleSetPassword}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : (
                <>
                  <Feather name="check" size={18} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Guardar contraseña</Text>
                </>
              )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Requirement({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={req.row}>
      <View style={[req.dot, { backgroundColor: met ? '#16A34A' : '#A3A3A3' }]} />
      <Text style={[req.text, met && { color: '#16A34A' }]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EEF2FF' },
  scroll: { paddingBottom: 40 },
  headerSection: {
    paddingTop: 72,
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  approvedBadgeText: { fontSize: 13, fontWeight: '600', color: '#15803D' },
  title: { fontSize: 24, fontWeight: '700', color: '#0A0A0A' },
  subtitle: { fontSize: 14, color: '#737373', lineHeight: 20 },
  form: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  fieldWrap: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500', color: '#0A0A0A' },
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
  inputPadRight: { paddingRight: 8 },
  eyeBtn: { padding: 4 },
  requirements: { gap: 6 },
  reqTitle: { fontSize: 12, color: '#737373', marginBottom: 2 },
  errorText: { fontSize: 13, color: '#EF4444', textAlign: 'center' },
  submitBtn: {
    height: 52,
    backgroundColor: '#146C94',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  btnDisabled: { opacity: 0.55 },
  successRoot: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: { fontSize: 26, fontWeight: '700', color: '#0A0A0A' },
  successDesc: { fontSize: 14, color: '#737373', textAlign: 'center', lineHeight: 20 },
  loginBtn: {
    height: 52,
    backgroundColor: '#146C94',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    marginTop: 8,
  },
  loginBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
})

const req = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, color: '#737373' },
})
