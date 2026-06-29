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
  ActivityIndicator,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { api } from '../lib/api'

interface Props {
  navigation: any
}

type Step = 1 | 2

interface DocFile {
  uri: string
  mimeType: string
  fileName: string
}

const STEPS = [
  { id: 1, title: 'Datos Personales', icon: 'user' },
  { id: 2, title: 'Documento', icon: 'file' },
]

export default function RegisterScreen({ navigation }: Props) {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [userId, setUserId] = useState<number | null>(null)
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [stepError, setStepError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    email: '',
    address: '',
    country: 'Argentina',
  })
  const [docFront, setDocFront] = useState<DocFile | null>(null)
  const [docBack, setDocBack] = useState<DocFile | null>(null)

  const update = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    setFieldErrors(prev => ({ ...prev, [key]: '' }))
  }

  const validateStep = (): boolean => {
    setApiError(null)
    setStepError(null)
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
      if (Object.keys(errors).length > 0) { setFieldErrors(errors); return false }
    }
    if (currentStep === 2) {
      if (!docFront || !docBack) {
        setStepError('Debes subir ambas fotos del documento para continuar')
        return false
      }
    }
    return true
  }

  const handleNext = async () => {
    if (!validateStep() || apiLoading) return
    setApiLoading(true)
    setApiError(null)
    try {
      if (currentStep === 1) {
        const res = await api.registerStart({
          email: formData.email.trim().toLowerCase(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          domicilio: formData.address.trim(),
          pais: formData.country.trim(),
          documento: formData.dni.trim(),
        })
        setUserId(res.userId)
        setCurrentStep(2)
        setFieldErrors({})

      } else {
        if (!userId || !docFront || !docBack) return
        await api.registerDocument(
          userId,
          { uri: docFront.uri, name: docFront.fileName, type: docFront.mimeType },
          { uri: docBack.uri, name: docBack.fileName, type: docBack.mimeType },
        )
        navigation.replace('CompanyConditions', {
          userId,
          email: formData.email.trim().toLowerCase(),
        })
      }
    } catch (err: any) {
      setApiError(err?.message ?? 'Error inesperado. Intentá de nuevo.')
    } finally {
      setApiLoading(false)
    }
  }

  const handleBack = () => {
    setFieldErrors({})
    setStepError(null)
    setApiError(null)
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    } else {
      navigation.goBack()
    }
  }

  const pickImage = async (field: 'front' | 'back') => {
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
      const asset = result.assets[0]
      const mime = asset.mimeType ?? 'image/jpeg'
      const ext = mime.split('/')[1] ?? 'jpg'
      const file: DocFile = {
        uri: asset.uri,
        mimeType: mime,
        fileName: asset.fileName ?? `doc_${field}_${Date.now()}.${ext}`,
      }
      if (field === 'front') setDocFront(file)
      else setDocBack(file)
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
            <FieldInput icon="globe" label="Pais" placeholder="Argentina"
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
              style={[styles.docArea, !!docFront && styles.docAreaDone]}
              onPress={() => pickImage('front')}
              activeOpacity={0.8}
            >
              {docFront ? (
                <>
                  <Image source={{ uri: docFront.uri }} style={styles.docPreview} />
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
              style={[styles.docArea, !!docBack && styles.docAreaDone]}
              onPress={() => pickImage('back')}
              activeOpacity={0.8}
            >
              {docBack ? (
                <>
                  <Image source={{ uri: docBack.uri }} style={styles.docPreview} />
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

    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#0a3d54" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Crear Cuenta</Text>
            <Text style={styles.headerSub}>Paso {currentStep} de 2</Text>
          </View>
        </View>
        <View style={styles.progressWrap}>
          {STEPS.map(step => (
            <View
              key={step.id}
              style={[styles.progressSegment, { backgroundColor: step.id <= currentStep ? '#146C94' : 'rgba(10,61,84,0.2)' }]}
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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {(stepError || apiError) ? (
          <Text style={styles.stepErrorText}>{stepError ?? apiError}</Text>
        ) : null}
        <TouchableOpacity
          style={[styles.continueBtn, apiLoading && { opacity: 0.7 }]}
          onPress={handleNext}
          activeOpacity={0.85}
          disabled={apiLoading}
        >
          {apiLoading
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : (
              <>
                <Text style={styles.continueBtnText}>
                  {currentStep === 2 ? 'Ver condiciones' : 'Continuar'}
                </Text>
                <Feather name="arrow-right" size={18} color="#FFFFFF" />
              </>
            )
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FieldInput({
  icon, label, placeholder, value, onChangeText, keyboardType = 'default', secure = false, error,
}: {
  icon: string; label: string; placeholder: string; value: string
  onChangeText: (v: string) => void; keyboardType?: any; secure?: boolean; error?: string
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


// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#AFD3E2',
    borderBottomWidth: 1, borderBottomColor: 'rgba(10,61,84,0.15)',
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
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepTitle: { fontSize: 15, fontWeight: '600', color: '#0a3d54' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  stepContent: { gap: 16 },
  stepHelp: { fontSize: 13, color: '#737373', textAlign: 'center' },
  centerContent: { alignItems: 'center', paddingVertical: 16 },
  docArea: {
    height: 150, borderWidth: 2, borderStyle: 'dashed', borderColor: '#E5E5E5',
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#FAFAFA', overflow: 'hidden',
  },
  docAreaDone: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  docPreview: { width: '100%', height: '100%', position: 'absolute' },
  docDoneOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: 'rgba(255,255,255,0.88)', paddingVertical: 6,
  },
  docLabel: { fontSize: 14, fontWeight: '500', color: '#737373' },
  docHint: { fontSize: 11, color: '#A3A3A3' },
  pendingCircle: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#FEF9C3',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  pendingTitle: { fontSize: 20, fontWeight: '700', color: '#0A0A0A' },
  pendingDesc: { fontSize: 13, color: '#737373', textAlign: 'center', maxWidth: 280, marginBottom: 16 },
  statusCard: { width: '100%', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, gap: 8 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusKey: { fontSize: 13, color: '#737373' },
  statusVal: { fontSize: 13, fontWeight: '500', color: '#0A0A0A' },
  footer: {
    padding: 16, borderTopWidth: 1, borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF', gap: 8,
  },
  stepErrorText: { fontSize: 13, color: '#EF4444', textAlign: 'center', fontWeight: '500' },
  continueBtn: {
    height: 52, backgroundColor: '#146C94', borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  continueBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
})

const fi = StyleSheet.create({
  wrap: { gap: 4 },
  label: { fontSize: 14, fontWeight: '500', color: '#0A0A0A' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', height: 48,
    backgroundColor: '#F5F5F5', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E5E5', paddingHorizontal: 12,
  },
  inputWrapError: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: '#0A0A0A' },
  errorText: { fontSize: 12, color: '#EF4444' },
})

