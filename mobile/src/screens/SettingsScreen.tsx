import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Switch,
} from 'react-native'
import { Feather } from '@expo/vector-icons'

interface Props { navigation: any }

export default function SettingsScreen({ navigation }: Props) {
  const [notifications, setNotifications] = useState(true)
  const [bidAlerts, setBidAlerts] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#0a3d54" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuracion</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>NOTIFICACIONES</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <Feather name="bell" size={18} color="#146C94" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Notificaciones push</Text>
              <Text style={styles.rowSub}>Alertas en tiempo real</Text>
            </View>
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: '#146C94' }} />
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <View style={styles.iconWrap}>
              <Feather name="shield" size={18} color="#146C94" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Alertas de pujas</Text>
              <Text style={styles.rowSub}>Cuando te superen una oferta</Text>
            </View>
            <Switch value={bidAlerts} onValueChange={setBidAlerts} trackColor={{ true: '#146C94' }} />
          </View>
        </View>

        <Text style={styles.sectionLabel}>APARIENCIA</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: '#F5F5F5' }]}>
              <Feather name="moon" size={18} color="#0A0A0A" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Modo oscuro</Text>
              <Text style={styles.rowSub}>Cambia el tema de la app</Text>
            </View>
            <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: '#146C94' }} />
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <View style={[styles.iconWrap, { backgroundColor: '#F5F5F5' }]}>
              <Feather name="globe" size={18} color="#0A0A0A" />
            </View>
            <Text style={[styles.rowTitle, { flex: 1 }]}>Idioma</Text>
            <Text style={styles.rowSub}>Español</Text>
            <Feather name="chevron-right" size={16} color="#737373" />
          </View>
        </View>

        <Text style={styles.sectionLabel}>ACERCA DE</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <Text style={[styles.rowTitle, { flex: 1 }]}>Version</Text>
            <Text style={styles.rowSub}>1.0.0</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowTitle, { flex: 1 }]}>Terminos y condiciones</Text>
            <Feather name="chevron-right" size={16} color="#737373" />
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={[styles.rowTitle, { flex: 1 }]}>Politica de privacidad</Text>
            <Feather name="chevron-right" size={16} color="#737373" />
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    backgroundColor: '#AFD3E2',
    borderBottomWidth: 1, borderBottomColor: 'rgba(10,61,84,0.15)',
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0a3d54' },
  scroll: { flex: 1 },
  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: '#737373',
    letterSpacing: 0.8, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
  },
  group: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF',
    borderRadius: 14, borderWidth: 1, borderColor: '#E5E5E5', overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '500', color: '#0A0A0A' },
  rowSub: { fontSize: 12, color: '#737373', marginTop: 1 },
})
