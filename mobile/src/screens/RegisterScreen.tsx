import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Feather } from '@expo/vector-icons'
import { api } from '../lib/api'

interface Props {
  navigation: any
}

type Step = 1 | 2 | 3 | 4 | 5

const STEPS = [
  { id: 1, title: 'Datos Personales', icon: 'user' },
  { id: 2, title: 'Documento', icon: 'file' },
  { id: 3, title: 'Verificacion', icon: 'check-circle' },
  { id: 4, title: 'Contrasena', icon: 'lock' },
  { id: 5, title: 'Medio de Pago', icon: 'credit-card' },
]

interface DocFile {
  uri: string
  name: string
  type: string
}

export default function RegisterScreen({ navigation }: Props) {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [docFront, setDocFront] = useState<DocFile | null>(null)
  const [docBack, setDocBack] = useState<DocFile | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    email: '',
    address: '',
    country: '',
    password: '',
    confirmPassword: '',
  })

  const update = (key: keyof typeof formData, value: string) =>
    setFormData(prev => ({ ...prev, [key]: value }))

  const pickDocument = async (side: 'front' | 'back') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir el documento.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      const ext = asset.uri.split('.').pop() ?? 'jpg'
      const file: DocFile = {
        uri: asset.uri,
        name: `${side}.${ext}`,
        type: asset.mimeType ?? `image/${ext}`,
      }
      if (side === 'front') setDocFront(file)
      else setDocBack(file)
    }
  }

  const validateStep1 = (): string | null => {
    const { firstName, lastName, dni, email, address, country } = formData
    if (!firstName.trim()) return 'El nombre es obligatorio'
    if (!lastName.trim()) return 'El apellido es obligatorio'
    if (!dni.trim()) return 'El DNI es obligatorio'
    if (!email.trim() || !email.includes('@')) return 'Ingresá un email válido'
    if (!address.trim()) return 'El domicilio es obligatorio'
    if (!country.trim()) return 'El país es obligatorio'
    return null
  }

  const validateStep4 = (): string | null => {
    const { password, confirmPassword } = formData
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
    if (!/[A-Z]/.test(password)) return 'La contraseña debe tener al menos una mayúscula'
    if (!/[0-9]/.test(password)) return 'La contraseña debe tener al menos un número'
    if (password !== confirmPassword) return 'Las contraseñas no coinciden'
    return null
  }

  const handleNext = async () => {
    if (loading) return
    setError(null)

    if (currentStep === 1) {
      const validErr = validateStep1()
      if (validErr) { setError(validErr); return }
      setLoading(true)
      try {
        const { userId: id } = await api.registerStart({
          email: formData.email.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          domicilio: formData.address.trim(),
          pais: formData.country.trim(),
          documento: formData.dni.trim(),
        })
        setUserId(id)
        setCurrentStep(2)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear la cuenta')
      } finally {
        setLoading(false)
      }
      return
    }

    if (currentStep === 2) {
      if (!docFront) { setError('Subí la foto del frente del documento'); return }
      if (!docBack) { setError('Subí la foto del dorso del documento'); return }
      if (userId == null) { setError('Error inesperado. Volvé al paso 1.'); return }
      setLoading(true)
      try {
        await api.registerDocument(userId, docFront, docBack)
        setCurrentStep(3)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al subir documentos')
      } finally {
        setLoading(false)
      }
      return
    }

    if (currentStep === 3) {
      setCurrentStep(4)
      return
    }

    if (currentStep === 4) {
      const validErr = validateStep4()
      if (validErr) { setError(validErr); return }
      if (userId == null) { setError('Error inesperado. Volvé al paso 1.'); return }
      setLoading(true)
      try {
        await api.registerComplete(userId, formData.password)
        setCurrentStep(5)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al completar el registro')
      } finally {
        setLoading(false)
      }
      return
    }

    // Step 5 — done
    Alert.alert(
      'Registro completado',
      'Tu cuenta está pendiente de aprobación. Te notificaremos cuando sea activada.',
      [{ text: 'Entendido', onPress: () => navigation.replace('Login') }],
    )
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as Step)
    else navigation.goBack()
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <FieldInput icon="user" label="Nombre" placeholder="Tu nombre"
              value={formData.firstName} onChangeText={v => update('firstName', v)} />
            <FieldInput icon="user" label="Apellido" placeholder="Tu apellido"
              value={formData.lastName} onChangeText={v => update('lastName', v)} />
            <FieldInput icon="credit-card" label="DNI" placeholder="Tu DNI"
              value={formData.dni} onChangeText={v => update('dni', v)} keyboardType="numeric" />
            <FieldInput icon="mail" label="Email" placeholder="tu@email.com"
              value={formData.email} onChangeText={v => update('email', v)} keyboardType="email-address" />
            <FieldInput icon="map-pin" label="Domicilio" placeholder="Tu dirección"
              value={formData.address} onChangeText={v => update('address', v)} />
            <FieldInput icon="globe" label="País" placeholder="Tu país"
              value={formData.country} onChangeText={v => update('country', v)} />
          </View>
        )

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepHelp}>
              Subí fotos de tu documento de identidad para verificar tu cuenta
            </Text>
            <TouchableOpacity
              style={[styles.docArea, docFront && styles.docAreaDone]}
              onPress={() => pickDocument('front')}
              activeOpacity={0.8}
            >
              <Feather
                name={docFront ? 'check-circle' : 'file'}
                size={36}
                color={docFront ? '#16A34A' : '#737373'}
              />
              <Text style={[styles.docLabel, docFront && { color: '#16A34A' }]}>
                {docFront ? 'Frente subido' : 'Subir frente del documento'}
              </Text>
              {!docFront && <Text style={styles.docHint}>Tocá para seleccionar una foto</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.docArea, docBack && styles.docAreaDone]}
              onPress={() => pickDocument('back')}
              activeOpacity={0.8}
            >
              <Feather
                name={docBack ? 'check-circle' : 'file'}
                size={36}
                color={docBack ? '#16A34A' : '#737373'}
              />
              <Text style={[styles.docLabel, docBack && { color: '#16A34A' }]}>
                {docBack ? 'Dorso subido' : 'Subir dorso del documento'}
              </Text>
              {!docBack && <Text style={styles.docHint}>Tocá para seleccionar una foto</Text>}
            </TouchableOpacity>
          </View>
        )

      case 3:
        return (
          <View style={[styles.stepContent, styles.centerContent]}>
            <View style={styles.pendingCircle}>
              <Feather name="check-circle" size={48} color="#D97706" />
            </View>
            <Text style={styles.pendingTitle}>En revision</Text>
            <Text style={styles.pendingDesc}>
              Tu documentacion esta siendo verificada. Podés continuar para configurar tu contraseña.
            </Text>
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <Text style={styles.statusKey}>Estado:</Text>
                <Text style={[styles.statusVal, { color: '#D97706' }]}>Pendiente de revision</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusKey}>Tiempo estimado:</Text>
                <Text style={styles.statusVal}>24-48 horas</Text>
              </View>
            </View>
          </View>
        )

      case 4: {
        const hasLength = formData.password.length >= 8
        const hasUpper = /[A-Z]/.test(formData.password)
        const hasNumber = /[0-9]/.test(formData.password)
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepHelp}>Crea una contraseña segura para tu cuenta</Text>
            <FieldInput icon="lock" label="Contraseña" placeholder="Mínimo 8 caracteres"
              value={formData.password} onChangeText={v => update('password', v)} secure />
            <FieldInput icon="lock" label="Confirmar contraseña" placeholder="Repetí tu contraseña"
              value={formData.confirmPassword} onChangeText={v => update('confirmPassword', v)} secure />
            <View style={styles.requirements}>
              <Text style={styles.reqTitle}>La contraseña debe tener:</Text>
              <Requirement met={hasLength} text="Mínimo 8 caracteres" />
              <Requirement met={hasUpper} text="Una letra mayúscula" />
              <Requirement met={hasNumber} text="Un número" />
            </View>
          </View>
        )
      }

      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepHelp}>
              Registro casi listo. Podés agregar un medio de pago ahora o desde tu perfil.
            </Text>
            <PayOption icon="credit-card" title="Tarjeta de Crédito" sub="Visa, Mastercard, Amex" color="#1D4ED8" bg="#DBEAFE" />
            <PayOption icon="home" title="Cuenta Bancaria" sub="Transferencia directa" color="#15803D" bg="#DCFCE7" />
            <PayOption icon="file-text" title="Cheque Certificado" sub="Para montos elevados" color="#B45309" bg="#FEF3C7" />
            <Text style={styles.payNote}>
              Podés agregar más medios de pago desde tu perfil cuando lo necesites
            </Text>
          </View>
        )
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#0A0A0A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Crear Cuenta</Text>
            <Text style={styles.headerSub}>Paso {currentStep} de 5</Text>
          </View>
        </View>
        <View style={styles.progressWrap}>
          {STEPS.map(step => (
            <View
              key={step.id}
              style={[
                styles.progressSegment,
                { backgroundColor: step.id <= currentStep ? '#3E73EE' : '#E5E5E5' },
              ]}
            />
          ))}
        </View>
        <View style={styles.stepTitleRow}>
          <View style={styles.stepIconWrap}>
            <Feather name={STEPS[currentStep - 1].icon as any} size={20} color="#3E73EE" />
          </View>
          <Text style={styles.stepTitle}>{STEPS[currentStep - 1].title}</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.continueBtn, loading && styles.continueBtnDisabled]}
          onPress={handleNext}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.continueBtnText}>
                {currentStep === 5 ? 'Finalizar Registro' : 'Continuar'}
              </Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FieldInput({
  icon, label, placeholder, value, onChangeText, keyboardType = 'default', secure = false,
}: {
  icon: string
  label: string
  placeholder: string
  value: string
  onChangeText: (v: string) => void
  keyboardType?: any
  secure?: boolean
}) {
  return (
    <View style={fi.wrap}>
      <Text style={fi.label}>{label}</Text>
      <View style={fi.inputWrap}>
        <Feather name={icon as any} size={18} color="#737373" style={fi.icon} />
        <TextInput
          style={fi.input}
          placeholder={placeholder}
          placeholderTextColor="#A3A3A3"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secure}
          autoCapitalize="none"
        />
      </View>
    </View>
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

function PayOption({ icon, title, sub, color, bg }: {
  icon: string; title: string; sub: string; color: string; bg: string
}) {
  return (
    <TouchableOpacity style={po.wrap} activeOpacity={0.8}>
      <View style={[po.iconBox, { backgroundColor: bg }]}>
        <Feather name={icon as any} size={22} color={color} />
      </View>
      <View style={po.text}>
        <Text style={po.title}>{title}</Text>
        <Text style={po.sub}>{sub}</Text>
      </View>
      <Feather name="arrow-right" size={18} color="#737373" />
    </TouchableOpacity>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    gap: 12,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0A0A0A' },
  headerSub: { fontSize: 12, color: '#737373' },
  progressWrap: { flexDirection: 'row', gap: 4 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
  },
  stepTitle: { fontSize: 15, fontWeight: '600', color: '#0A0A0A' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  stepContent: { gap: 16 },
  stepHelp: { fontSize: 13, color: '#737373', textAlign: 'center' },
  centerContent: { alignItems: 'center', paddingVertical: 16 },
  docArea: {
    height: 150,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E5E5',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FAFAFA',
  },
  docAreaDone: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  docLabel: { fontSize: 14, fontWeight: '500', color: '#737373' },
  docHint: { fontSize: 11, color: '#A3A3A3' },
  pendingCircle: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#FEF9C3',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  pendingTitle: { fontSize: 20, fontWeight: '700', color: '#0A0A0A' },
  pendingDesc: {
    fontSize: 13, color: '#737373', textAlign: 'center', maxWidth: 280, marginBottom: 16,
  },
  statusCard: {
    width: '100%', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, gap: 8,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusKey: { fontSize: 13, color: '#737373' },
  statusVal: { fontSize: 13, fontWeight: '500', color: '#0A0A0A' },
  requirements: { gap: 6 },
  reqTitle: { fontSize: 12, color: '#737373' },
  payNote: { fontSize: 12, color: '#737373', textAlign: 'center', marginTop: 8 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  errorText: { fontSize: 13, color: '#E7000B', textAlign: 'center' },
  continueBtn: {
    height: 52,
    backgroundColor: '#3E73EE',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueBtnDisabled: { opacity: 0.6 },
  continueBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
})

const fi = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500', color: '#0A0A0A' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', height: 48,
    backgroundColor: '#F5F5F5', borderRadius: 12, borderWidth: 1,
    borderColor: '#E5E5E5', paddingHorizontal: 12,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: '#0A0A0A' },
})

const req = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, color: '#737373' },
})

const po = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
    borderRadius: 14, borderWidth: 1, borderColor: '#E5E5E5', backgroundColor: '#FFFFFF',
  },
  iconBox: {
    width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: '#0A0A0A' },
  sub: { fontSize: 12, color: '#737373' },
})
