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
import CategoryBadge from "../components/CategoryBadge";
import { useAppData } from "../context/AppContext";

function formatCurrency(amount: number, currency: string = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface Props {
  navigation: any;
}

const MENU_ITEMS = [
  { icon: "credit-card", label: "Medios de Pago", screen: "Payments" },
  { icon: "package", label: "Mis Articulos", screen: null },
  { icon: "heart", label: "Favoritos", screen: null },
  { icon: "settings", label: "Configuracion", screen: null },
  { icon: "help-circle", label: "Ayuda y Soporte", screen: null },
];

export default function ProfileScreen({ navigation }: Props) {
  const { me, metrics, logout } = useAppData();
  const successRate =
    metrics && metrics.totalAuctions > 0
      ? ((metrics.wonAuctions / metrics.totalAuctions) * 100).toFixed(0)
      : "0";

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity style={styles.settingsBtn}>
          <Feather name="settings" size={20} color="#0A0A0A" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Profile card */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.cardRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>
                  {(me?.firstName ?? me?.email ?? "U").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.userName}>
                  {`${me?.firstName ?? ""} ${me?.lastName ?? ""}`.trim() ||
                    "Usuario"}
                </Text>
                <Text style={styles.userEmail}>{me?.email ?? ""}</Text>
                <View style={{ marginTop: 6 }}>
                  <CategoryBadge
                    category={me?.category ?? "bronce"}
                    size="sm"
                  />
                </View>
              </View>
            </View>

            {/* Quick stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {metrics?.totalAuctions ?? 0}
                </Text>
                <Text style={styles.statLabel}>Subastas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: "#3E73EE" }]}>
                  {metrics?.wonAuctions ?? 0}
                </Text>
                <Text style={styles.statLabel}>Ganadas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.ratingRow}>
                  <Feather name="star" size={14} color="#D97706" />
                  <Text style={styles.statValue}>{me ? "5.0" : "0.0"}</Text>
                </View>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tus Metricas</Text>
          <View style={styles.metricsGrid}>
            {/* Total Pujas */}
            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <Feather name="activity" size={16} color="#3E73EE" />
              </View>
              <Text style={styles.metricLabel}>Total Pujas</Text>
              <Text style={styles.metricValue}>{metrics?.totalBids ?? 0}</Text>
            </View>

            {/* Total Gastado */}
            <View style={styles.metricCard}>
              <View
                style={[styles.metricIconWrap, { backgroundColor: "#DCFCE7" }]}
              >
                <Feather name="trending-up" size={16} color="#16A34A" />
              </View>
              <Text style={styles.metricLabel}>Total Gastado</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(metrics?.totalSpent ?? 0)}
              </Text>
            </View>

            {/* Success rate - full width */}
            <View style={[styles.metricCard, styles.metricCardFull]}>
              <View style={styles.metricCardRow}>
                <View style={styles.metricCardLeft}>
                  <View
                    style={[
                      styles.metricIconWrap,
                      { backgroundColor: "#FEF9C3" },
                    ]}
                  >
                    <Feather name="award" size={16} color="#D97706" />
                  </View>
                  <View>
                    <Text style={styles.metricLabel}>Tasa de exito</Text>
                    <Text style={styles.metricValue}>{successRate}%</Text>
                  </View>
                </View>
                <View style={styles.progressBarWrap}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${Number(successRate)}%` },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <View style={styles.menuList}>
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={() => item.screen && navigation.navigate(item.screen)}
                activeOpacity={0.8}
              >
                <View style={styles.menuIconWrap}>
                  <Feather name={item.icon as any} size={20} color="#0A0A0A" />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Feather name="chevron-right" size={18} color="#737373" />
              </TouchableOpacity>
            ))}

            {/* Logout */}
            <TouchableOpacity
              style={styles.logoutItem}
              onPress={() => {
                logout();
                navigation.replace("Login");
              }}
              activeOpacity={0.8}
            >
              <View style={styles.logoutIconWrap}>
                <Feather name="log-out" size={20} color="#E7000B" />
              </View>
              <Text style={styles.logoutLabel}>Cerrar Sesion</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#0A0A0A" },
  settingsBtn: { padding: 6 },
  scroll: { flex: 1 },
  profileSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#F0F4FF",
    paddingTop: 8,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 16,
    gap: 12,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#0A0A0A",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontSize: 26, fontWeight: "700", color: "#FFFFFF" },
  cardInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: "700", color: "#0A0A0A" },
  userEmail: { fontSize: 13, color: "#737373", marginTop: 1 },
  statsRow: {
    flexDirection: "row",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statDivider: { width: 1, backgroundColor: "#E5E5E5" },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0A0A0A",
    fontVariant: ["tabular-nums"],
  },
  statLabel: { fontSize: 10, color: "#737373" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  section: { paddingHorizontal: 16, paddingTop: 20, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#0A0A0A" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metricCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  metricCardFull: { flex: 0, width: "100%" },
  metricCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricCardLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: { fontSize: 11, color: "#737373" },
  metricValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0A0A0A",
    fontVariant: ["tabular-nums"],
  },
  progressBarWrap: { width: 80 },
  progressBarBg: {
    height: 8,
    backgroundColor: "#E5E5E5",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#D97706",
    borderRadius: 4,
  },
  menuList: { gap: 8 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 14,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: "#0A0A0A" },
  logoutItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 14,
    marginTop: 4,
  },
  logoutIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutLabel: { fontSize: 15, fontWeight: "500", color: "#E7000B" },
});
