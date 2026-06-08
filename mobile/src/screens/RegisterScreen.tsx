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
} from 'react-native'
import { Feather } from '@expo/vector-icons'

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
    documentFront: false,
    documentBack: false,
    password: '',
    confirmPassword: '',
  })

  const update = (key: keyof typeof formData, value: string | boolean) =>
    setFormData(prev => ({ ...prev, [key]: value }))

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step)
    } else {
      navigation.replace('Home')
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    } else {
      navigation.goBack()
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <FieldInput
              icon="user"
              label="Nombre"
              placeholder="Tu nombre"
              value={formData.firstName}
              onChangeText={v => update('firstName', v)}
            />
            <FieldInput
              icon="user"
              label="Apellido"
              placeholder="Tu apellido"
              value={formData.lastName}
              onChangeText={v => update('lastName', v)}
            />
            <FieldInput
              icon="credit-card"
              label="DNI"
              placeholder="Tu DNI"
              value={formData.dni}
              onChangeText={v => update('dni', v)}
              keyboardType="numeric"
            />
            <FieldInput
              icon="mail"
              label="Email"
              placeholder="tu@email.com"
              value={formData.email}
              onChangeText={v => update('email', v)}
              keyboardType="email-address"
            />
            <FieldInput
              icon="map-pin"
              label="Domicilio"
              placeholder="Tu direccion"
              value={formData.address}
              onChangeText={v => update('address', v)}
            />
            <FieldInput
              icon="globe"
              label="Pais"
              placeholder="Tu pais"
              value={formData.country}
              onChangeText={v => update('country', v)}
            />
          </View>
        )

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepHelp}>
              Sube fotos de tu documento de identidad para verificar tu cuenta
            </Text>
            <TouchableOpacity
              style={[styles.docArea, formData.documentFront && styles.docAreaDone]}
              onPress={() => update('documentFront', !formData.documentFront)}
              activeOpacity={0.8}
            >
              <Feather
                name={formData.documentFront ? 'check-circle' : 'file'}
                size={36}
                color={formData.documentFront ? '#16A34A' : '#737373'}
              />
              <Text
                style={[styles.docLabel, formData.documentFront && { color: '#16A34A' }]}
              >
                {formData.documentFront ? 'Frente subido' : 'Subir frente del documento'}
              </Text>
              {!formData.documentFront && (
                <Text style={styles.docHint}>JPG, PNG hasta 5MB</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.docArea, formData.documentBack && styles.docAreaDone]}
              onPress={() => update('documentBack', !formData.documentBack)}
              activeOpacity={0.8}
            >
              <Feather
                name={formData.documentBack ? 'check-circle' : 'file'}
                size={36}
                color={formData.documentBack ? '#16A34A' : '#737373'}
              />
              <Text
                style={[styles.docLabel, formData.documentBack && { color: '#16A34A' }]}
              >
                {formData.documentBack ? 'Dorso subido' : 'Subir dorso del documento'}
              </Text>
              {!formData.documentBack && (
                <Text style={styles.docHint}>JPG, PNG hasta 5MB</Text>
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
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepHelp}>Crea una contrasena segura para tu cuenta</Text>
            <FieldInput
              icon="lock"
              label="Contrasena"
              placeholder="Minimo 8 caracteres"
              value={formData.password}
              onChangeText={v => update('password', v)}
              secure
            />
            <FieldInput
              icon="lock"
              label="Confirmar contrasena"
              placeholder="Repite tu contrasena"
              value={formData.confirmPassword}
              onChangeText={v => update('confirmPassword', v)}
              secure
            />
            <View style={styles.requirements}>
              <Text style={styles.reqTitle}>La contrasena debe tener:</Text>
              <Requirement met={hasLength} text="Minimo 8 caracteres" />
              <Requirement met={hasUpper} text="Una letra mayuscula" />
              <Requirement met={hasNumber} text="Un numero" />
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
            <Feather name="arrow-left" size={20} color="#0A0A0A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Crear Cuenta</Text>
            <Text style={styles.headerSub}>Paso {currentStep} de 5</Text>
          </View>
        </View>
        {/* Progress bar */}
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
        {/* Step title */}
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
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  continueBtn: {
    height: 52,
    backgroundColor: '#3E73EE',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
})

const fi = StyleSheet.create({
  wrap: { gap: 6 },
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
