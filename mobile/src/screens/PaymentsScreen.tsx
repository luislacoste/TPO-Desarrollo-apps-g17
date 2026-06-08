import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import PaymentMethodCard from "../components/PaymentMethodCard";
import { useAppData } from "../context/AppContext";

interface Props {
  navigation: any;
}

const ADD_OPTIONS = [
  {
    icon: "credit-card",
    title: "Tarjeta de Credito",
    sub: "Visa, Mastercard, Amex",
    color: "#1D4ED8",
    bg: "#DBEAFE",
  },
  {
    icon: "home",
    title: "Cuenta Bancaria",
    sub: "Transferencia directa",
    color: "#15803D",
    bg: "#DCFCE7",
  },
  {
    icon: "file-text",
    title: "Cheque Certificado",
    sub: "Para montos elevados",
    color: "#B45309",
    bg: "#FEF3C7",
  },
];

const INFO_BULLETS = [
  "Debes tener al menos un medio de pago verificado para participar en subastas.",
  "Los cheques certificados solo estan disponibles para usuarios categoria Oro y Platino.",
  "La verificacion de cuentas bancarias puede demorar hasta 48 horas.",
];

export default function PaymentsScreen({ navigation }: Props) {
  const { paymentMethods } = useAppData();

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color="#0A0A0A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Medios de Pago</Text>
          <Text style={styles.headerSub}>
            {paymentMethods.length} metodos registrados
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Registered methods */}
        <View style={styles.methodsList}>
          {paymentMethods.map((method) => (
            <PaymentMethodCard key={method.id} method={method} />
          ))}
          {paymentMethods.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                No tenés medios de pago registrados
              </Text>
              <Text style={styles.emptyText}>
                Cuando agregues uno desde el backend, va a aparecer acá.
              </Text>
            </View>
          )}
        </View>

        {/* Add new */}
        <View style={styles.addSection}>
          <Text style={styles.addTitle}>Agregar nuevo metodo</Text>
          <View style={styles.addOptions}>
            {ADD_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.title}
                style={styles.addOption}
                activeOpacity={0.8}
              >
                <View style={[styles.addIconBox, { backgroundColor: opt.bg }]}>
                  <Feather name={opt.icon as any} size={22} color={opt.color} />
                </View>
                <View style={styles.addText}>
                  <Text style={styles.addOptTitle}>{opt.title}</Text>
                  <Text style={styles.addOptSub}>{opt.sub}</Text>
                </View>
                <Feather name="plus" size={18} color="#737373" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Informacion importante</Text>
          <View style={styles.infoBullets}>
            {INFO_BULLETS.map((b, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.85}>
          <Feather name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Agregar Metodo de Pago</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#0A0A0A" },
  headerSub: { fontSize: 12, color: "#737373", marginTop: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 24 },
  methodsList: { gap: 14 },
  emptyState: {
    padding: 16,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 14,
  },
  emptyTitle: { fontSize: 14, fontWeight: "600", color: "#0A0A0A" },
  emptyText: { fontSize: 12, color: "#737373", marginTop: 4 },
  addSection: { gap: 12 },
  addTitle: { fontSize: 15, fontWeight: "600", color: "#0A0A0A" },
  addOptions: { gap: 10 },
  addOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#FAFAFA",
  },
  addIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { flex: 1 },
  addOptTitle: { fontSize: 14, fontWeight: "600", color: "#0A0A0A" },
  addOptSub: { fontSize: 12, color: "#737373", marginTop: 1 },
  infoBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  infoTitle: { fontSize: 13, fontWeight: "600", color: "#0A0A0A" },
  infoBullets: { gap: 8 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#737373",
    marginTop: 6,
    flexShrink: 0,
  },
  bulletText: { flex: 1, fontSize: 12, color: "#737373", lineHeight: 18 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
  },
  addBtn: {
    height: 52,
    backgroundColor: "#146C94",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addBtnText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
});
