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
import { api, UploadFile } from '../lib/api'
import { useAppData } from '../context/AppContext'

interface Props {
  navigation: any
}

// El backend exige un mínimo de 6 imágenes (sell-requests.service.ts).
const MIN_IMAGES = 6
const MAX_IMAGES = 20

export default function ProposeItemScreen({ navigation }: Props) {
  const { session } = useAppData()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [historia, setHistoria] = useState('')
  const [images, setImages] = useState<UploadFile[]>([])
  const [ownership, setOwnership] = useState<UploadFile | null>(null)
  const [declared, setDeclared] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toUploadFile = (
    asset: ImagePicker.ImagePickerAsset,
    prefix: string,
  ): UploadFile => {
    const type = asset.mimeType ?? 'image/jpeg'
    const ext = type.split('/')[1] ?? 'jpg'
    return {
      uri: asset.uri,
      type,
      name: asset.fileName ?? `${prefix}_${Date.now()}.${ext}`,
    }
  }

  const ensurePermission = async (): Promise<boolean> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu galería para subir las fotos del bien.',
      )
      return false
    }
    return true
  }

  const pickImages = async () => {
    if (!(await ensurePermission())) return
    const remaining = MAX_IMAGES - images.length
    if (remaining <= 0) {
      Alert.alert('Límite alcanzado', `Podés subir hasta ${MAX_IMAGES} imágenes.`)
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    })
    if (!result.canceled && result.assets.length > 0) {
      const picked = result.assets.map((a, i) => toUploadFile(a, `item_${images.length + i}`))
      setImages(prev => [...prev, ...picked].slice(0, MAX_IMAGES))
      setError(null)
    }
  }

  const removeImage = (uri: string) => {
    setImages(prev => prev.filter(img => img.uri !== uri))
  }

  const pickOwnership = async () => {
    if (!(await ensurePermission())) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0]) {
      setOwnership(toUploadFile(result.assets[0], 'titularidad'))
      setError(null)
    }
  }

  const validate = (): string | null => {
    if (!title.trim()) return 'El título del bien es obligatorio'
    if (images.length < MIN_IMAGES)
      return `Tenés que subir al menos ${MIN_IMAGES} imágenes (subiste ${images.length})`
    if (!ownership) return 'Falta la declaración de titularidad'
    if (!declared) return 'Tenés que confirmar la declaración para continuar'
    return null
  }

  const handleSubmit = async () => {
    if (loading) return
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    if (!session?.accessToken) {
      setError('Tu sesión expiró. Iniciá sesión de nuevo.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await api.submitSellRequest(
        session.accessToken,
        {
          title: title.trim(),
          description: description.trim() || undefined,
          historia: historia.trim() || undefined,
        },
        images,
        ownership!,
      )
      Alert.alert(
        'Solicitud enviada',
        'Tu propuesta de venta fue enviada y quedó pendiente de revisión por la empresa.',
        [{ text: 'Entendido', onPress: () => navigation.goBack() }],
      )
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo enviar la solicitud. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const imagesComplete = images.length >= MIN_IMAGES

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#0a3d54" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Vender un bien</Text>
          <Text style={styles.headerSub}>Proponé un artículo para subastar</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Datos del bien */}
        <Text style={styles.sectionTitle}>Datos del bien</Text>

        <Field label="Título" required>
          <TextInput
            style={styles.input}
            placeholder="Ej: Reloj de colección años 60"
            placeholderTextColor="#A3A3A3"
            value={title}
            onChangeText={t => { setTitle(t); setError(null) }}
          />
        </Field>

        <Field label="Descripción">
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describí el estado, materiales y características del bien"
            placeholderTextColor="#A3A3A3"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </Field>

        <Field label="Historia / procedencia">
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Contanos el origen o la historia del bien (opcional)"
            placeholderTextColor="#A3A3A3"
            value={historia}
            onChangeText={setHistoria}
            multiline
            textAlignVertical="top"
          />
        </Field>

        {/* Imágenes */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Imágenes del bien</Text>
          <Text style={[styles.counter, imagesComplete && styles.counterDone]}>
            {images.length}/{MIN_IMAGES} mínimo
          </Text>
        </View>
        <Text style={styles.help}>
          Se requieren al menos {MIN_IMAGES} fotos desde distintos ángulos.
        </Text>

        <View style={styles.imageGrid}>
          {images.map(img => (
            <View key={img.uri} style={styles.thumbWrap}>
              <Image source={{ uri: img.uri }} style={styles.thumb} />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeImage(img.uri)}
              >
                <Feather name="x" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < MAX_IMAGES && (
            <TouchableOpacity style={styles.addThumb} onPress={pickImages} activeOpacity={0.8}>
              <Feather name="plus" size={26} color="#146C94" />
              <Text style={styles.addThumbText}>Agregar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Titularidad */}
        <Text style={styles.sectionTitle}>Declaración de titularidad</Text>
        <Text style={styles.help}>
          Subí un documento o foto que acredite que sos el titular del bien.
        </Text>
        <TouchableOpacity
          style={[styles.ownershipArea, !!ownership && styles.ownershipDone]}
          onPress={pickOwnership}
          activeOpacity={0.8}
        >
          {ownership ? (
            <>
              <Image source={{ uri: ownership.uri }} style={styles.ownershipPreview} />
              <View style={styles.ownershipOverlay}>
                <Feather name="check-circle" size={18} color="#16A34A" />
                <Text style={[styles.ownershipLabel, { color: '#16A34A' }]}>
                  Titularidad cargada
                </Text>
              </View>
            </>
          ) : (
            <>
              <Feather name="file-text" size={32} color="#737373" />
              <Text style={styles.ownershipLabel}>Subir declaración de titularidad</Text>
              <Text style={styles.ownershipHint}>Tocá para abrir la galería</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Declaración jurada */}
        <TouchableOpacity
          style={styles.declareRow}
          onPress={() => { setDeclared(d => !d); setError(null) }}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, declared && styles.checkboxOn]}>
            {declared && <Feather name="check" size={14} color="#FFFFFF" />}
          </View>
          <Text style={styles.declareText}>
            Declaro que soy el titular del bien y que la información y la documentación
            provistas son verídicas.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="send" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Enviar propuesta</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.requiredMark}> *</Text> : null}
      </Text>
      {children}
    </View>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

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
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#0A0A0A', marginTop: 6 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  counter: { fontSize: 12, fontWeight: '600', color: '#D97706' },
  counterDone: { color: '#16A34A' },
  help: { fontSize: 12, color: '#737373' },
  field: { gap: 4 },
  label: { fontSize: 14, fontWeight: '500', color: '#0A0A0A' },
  requiredMark: { color: '#E7000B' },
  input: {
    minHeight: 48,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0A0A0A',
  },
  textArea: { minHeight: 90 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumbWrap: { width: 90, height: 90, borderRadius: 12, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(10,61,84,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addThumb: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#AFD3E2',
    backgroundColor: '#F0F7FB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addThumbText: { fontSize: 11, color: '#146C94', fontWeight: '500' },
  ownershipArea: {
    height: 140,
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
  ownershipDone: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  ownershipPreview: { width: '100%', height: '100%', position: 'absolute' },
  ownershipOverlay: {
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
  ownershipLabel: { fontSize: 14, fontWeight: '500', color: '#737373' },
  ownershipHint: { fontSize: 11, color: '#A3A3A3' },
  declareRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 6,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#146C94',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: '#146C94' },
  declareText: { flex: 1, fontSize: 13, color: '#0A0A0A', lineHeight: 18 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  errorText: { fontSize: 13, color: '#EF4444', textAlign: 'center', fontWeight: '500' },
  submitBtn: {
    height: 52,
    backgroundColor: '#146C94',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
})
