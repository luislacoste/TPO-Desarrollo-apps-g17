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
  Alert,
  Image,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'

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

export default function RegisterScreen({ navigation }: Props) {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    email: '',
    address: '',
    country: '',
    documentFront: null as string | null,
    documentBack: null as string | null,
    password: '',
    confirmPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [stepError, setStepError] = useState<string | null>(null)

  const update = (key: keyof typeof formData, value: string | null) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    setFieldErrors(prev => ({ ...prev, [key]: '' }))
  }

  const handleNext = () => {
    if (currentStep === 1) {
      const errors: Record<string, string> = {}
      if (!formData.firstName.trim()) errors.firstName = 'El nombre es obligatorio'
      if (!formData.lastName.trim()) errors.lastName = 'El apellido es obligatorio'
      if (!formData.dni.trim()) errors.dni = 'El DNI es obligatorio'
      else if (!/^\d{7,8}$/.test(formData.dni.trim())) errors.dni = 'El DNI debe tener 7 u 8 numeros'
      if (!formData.email.trim()) errors.email = 'El email es obligatorio'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'El email no es valido'
      if (!formData.address.trim()) errors.address = 'El domicilio es obligatorio'
      if (!formData.country.trim()) errors.country = 'El pais es obligatorio'
      if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }
    } else if (currentStep === 2) {
      if (!formData.documentFront || !formData.documentBack) {
        setStepError('Debes subir ambas fotos del documento para continuar')
        return
      }
      setStepError(null)
    } else if (currentStep === 4) {
      const errors: Record<string, string> = {}
      if (formData.password.length < 8) errors.password = 'Debe tener al menos 8 caracteres'
      else if (!/[A-Z]/.test(formData.password)) errors.password = 'Debe incluir al menos una mayuscula'
      else if (!/[0-9]/.test(formData.password)) errors.password = 'Debe incluir al menos un numero'
      if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Las contrasenas no coinciden'
      if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }
    }

    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step)
      setFieldErrors({})
    } else {
      navigation.replace('Login')
    }
  }

  const handleBack = () => {
    setFieldErrors({})
    setStepError(null)
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    } else {
      navigation.goBack()
    }
  }

  const pickImage = async (field: 'documentFront' | 'documentBack') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir fotos.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0]) {
      update(field, result.assets[0].uri)
      setStepError(null)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <FieldInput icon="user" label="Nombre" placeholder="Tu nombre"
              value={formData.firstName} onChangeText={v => update('firstName', v)}
              error={fieldErrors.firstName} />
            <FieldInput icon="user" label="Apellido" placeholder="Tu apellido"
              value={formData.lastName} onChangeText={v => update('lastName', v)}
              error={fieldErrors.lastName} />
            <FieldInput icon="credit-card" label="DNI" placeholder="Tu DNI (7 u 8 digitos)"
              value={formData.dni} onChangeText={v => update('dni', v)}
              keyboardType="numeric" error={fieldErrors.dni} />
            <FieldInput icon="mail" label="Email" placeholder="tu@email.com"
              value={formData.email} onChangeText={v => update('email', v)}
              keyboardType="email-address" error={fieldErrors.email} />
            <FieldInput icon="map-pin" label="Domicilio" placeholder="Tu direccion"
              value={formData.address} onChangeText={v => update('address', v)}
              error={fieldErrors.address} />
            <FieldInput icon="globe" label="Pais" placeholder="Tu pais"
              value={formData.country} onChangeText={v => update('country', v)}
              error={fieldErrors.country} />
          </View>
        )

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepHelp}>
              Sube fotos de tu documento de identidad para verificar tu cuenta
            </Text>
            <TouchableOpacity
              style={[styles.docArea, !!formData.documentFront && styles.docAreaDone]}
              onPress={() => pickImage('documentFront')}
              activeOpacity={0.8}
            >
              {formData.documentFront ? (
                <>
                  <Image source={{ uri: formData.documentFront }} style={styles.docPreview} />
                  <View style={styles.docDoneOverlay}>
                    <Feather name="check-circle" size={20} color="#16A34A" />
                    <Text style={[styles.docLabel, { color: '#16A34A' }]}>Frente subido</Text>
                  </View>
                </>
              ) : (
                <>
                  <Feather name="upload" size={36} color="#737373" />
                  <Text style={styles.docLabel}>Subir frente del documento</Text>
                  <Text style={styles.docHint}>Tocá para abrir la galería</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.docArea, !!formData.documentBack && styles.docAreaDone]}
              onPress={() => pickImage('documentBack')}
              activeOpacity={0.8}
            >
              {formData.documentBack ? (
                <>
                  <Image source={{ uri: formData.documentBack }} style={styles.docPreview} />
                  <View style={styles.docDoneOverlay}>
                    <Feather name="check-circle" size={20} color="#16A34A" />
                    <Text style={[styles.docLabel, { color: '#16A34A' }]}>Dorso subido</Text>
                  </View>
                </>
              ) : (
                <>
                  <Feather name="upload" size={36} color="#737373" />
                  <Text style={styles.docLabel}>Subir dorso del documento</Text>
                  <Text style={styles.docHint}>Tocá para abrir la galería</Text>
                </>
              )}
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
              Tu documentacion esta siendo verificada. Te notificaremos cuando tu cuenta sea aprobada.
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
        const passwordsMatch = formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepHelp}>Crea una contrasena segura para tu cuenta</Text>
            <FieldInput icon="lock" label="Contrasena" placeholder="Minimo 8 caracteres"
              value={formData.password} onChangeText={v => update('password', v)}
              secure error={fieldErrors.password} />
            <FieldInput icon="lock" label="Confirmar contrasena" placeholder="Repite tu contrasena"
              value={formData.confirmPassword} onChangeText={v => update('confirmPassword', v)}
              secure error={fieldErrors.confirmPassword} />
            <View style={styles.requirements}>
              <Text style={styles.reqTitle}>La contrasena debe tener:</Text>
              <Requirement met={hasLength} text="Minimo 8 caracteres" />
              <Requirement met={hasUpper} text="Una letra mayuscula" />
              <Requirement met={hasNumber} text="Un numero" />
              <Requirement met={passwordsMatch} text="Las contrasenas coinciden" />
            </View>
          </View>
        )
      }

      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepHelp}>
              Agrega un medio de pago para participar en subastas
            </Text>
            <PayOption icon="credit-card" title="Tarjeta de Credito" sub="Visa, Mastercard, Amex" color="#1D4ED8" bg="#DBEAFE" />
            <PayOption icon="home" title="Cuenta Bancaria" sub="Transferencia directa" color="#15803D" bg="#DCFCE7" />
            <PayOption icon="file-text" title="Cheque Certificado" sub="Para montos elevados" color="#B45309" bg="#FEF3C7" />
            <Text style={styles.payNote}>
              Podras agregar mas medios de pago desde tu perfil
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
            <Feather name="arrow-left" size={20} color="#0a3d54" />
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
                { backgroundColor: step.id <= currentStep ? '#146C94' : 'rgba(10,61,84,0.2)' },
              ]}
            />
          ))}
        </View>
        <View style={styles.stepTitleRow}>
          <View style={styles.stepIconWrap}>
            <Feather name={STEPS[currentStep - 1].icon as any} size={20} color="#146C94" />
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
        {stepError && (
          <Text style={styles.stepErrorText}>{stepError}</Text>
        )}
        <TouchableOpacity style={styles.continueBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.continueBtnText}>
            {currentStep === 5 ? 'Finalizar Registro' : 'Continuar'}
          </Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FieldInput({
  icon,
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  secure = false,
  error,
}: {
  icon: string
  label: string
  placeholder: string
  value: string
  onChangeText: (v: string) => void
  keyboardType?: any
  secure?: boolean
  error?: string
}) {
  return (
    <View style={fi.wrap}>
      <Text style={fi.label}>{label}</Text>
      <View style={[fi.inputWrap, !!error && fi.inputWrapError]}>
        <Feather name={icon as any} size={18} color={error ? '#EF4444' : '#737373'} style={fi.icon} />
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
      {!!error && <Text style={fi.errorText}>{error}</Text>}
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

function PayOption({
  icon,
  title,
  sub,
  color,
  bg,
}: {
  icon: string
  title: string
  sub: string
  color: string
  bg: string
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
    backgroundColor: '#AFD3E2',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,61,84,0.15)',
    gap: 12,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0a3d54' },
  headerSub: { fontSize: 12, color: '#146C94' },
  progressWrap: { flexDirection: 'row', gap: 4 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: { fontSize: 15, fontWeight: '600', color: '#0a3d54' },
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
    overflow: 'hidden',
  },
  docAreaDone: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  docPreview: { width: '100%', height: '100%', position: 'absolute' },
  docDoneOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingVertical: 6,
  },
  docLabel: { fontSize: 14, fontWeight: '500', color: '#737373' },
  docHint: { fontSize: 11, color: '#A3A3A3' },
  pendingCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pendingTitle: { fontSize: 20, fontWeight: '700', color: '#0A0A0A' },
  pendingDesc: {
    fontSize: 13,
    color: '#737373',
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 16,
  },
  statusCard: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    gap: 8,
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
  stepErrorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '500',
  },
  continueBtn: {
    height: 52,
    backgroundColor: '#146C94',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
})

const fi = StyleSheet.create({
  wrap: { gap: 4 },
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
  inputWrapError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',
  },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: '#0A0A0A' },
  errorText: { fontSize: 12, color: '#EF4444' },
})

const req = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, color: '#737373' },
})

const po = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: '#0A0A0A' },
  sub: { fontSize: 12, color: '#737373' },
})
