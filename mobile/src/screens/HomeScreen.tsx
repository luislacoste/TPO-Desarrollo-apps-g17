import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppData } from "../context/AppContext";

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round(
    (startOfDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );
  const time = date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  if (diffDays === 0) return `Hoy ${time}`;
  if (diffDays === 1) return `Mañana ${time}`;
  const dayName = date.toLocaleDateString("es-AR", { weekday: "long" });
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${time}`;
}

const ICON_COLORS = ["#FF6900", "#FE9A00", "#FB2C36", "#00B4D8", "#06D6A0"];

interface Props {
  navigation: any;
}

export default function HomeScreen({ navigation }: Props) {
  const {
    me,
    activeAuctions,
    upcomingAuctions,
    notifications,
    loading,
    error,
    refreshPublicData,
  } = useAppData();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayName =
    `${me?.firstName ?? ""} ${me?.lastName ?? ""}`.trim() ||
    me?.email ||
    "Usuario";

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola,</Text>
          <Text style={styles.userName}>{displayName}</Text>
        </View>
        <TouchableOpacity
          style={styles.bellWrap}
          onPress={() => navigation.navigate("Notifications")}
        >
          <Feather name="bell" size={20} color="#0A0A0A" />
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {unreadCount > 9 ? "9+" : String(unreadCount)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="#737373" />
          <Text style={styles.searchPlaceholder}>
            Buscar subastas, articulos...
          </Text>
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Categorias row */}
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowTitle}>Categorias</Text>
          <View style={styles.rowRight}>
            <Text style={styles.rowCount}>5</Text>
            <Feather name="chevron-right" size={16} color="#737373" />
          </View>
        </TouchableOpacity>

        {/* En Vivo Ahora */}
        {activeAuctions.length > 0 && (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("Catalog")}
          >
            <View style={styles.rowLeft}>
              <MaterialCommunityIcons name="fire" size={20} color="#FB2C36" />
              <Text style={styles.rowTitle}>En Vivo Ahora</Text>
            </View>
            <View style={styles.rowRight}>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>
                  {activeAuctions.length} activas
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color="#737373" />
            </View>
          </TouchableOpacity>
        )}

        {loading && upcomingAuctions.length === 0 && !error && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#3E73EE" />
            <Text style={styles.loadingText}>Cargando subastas...</Text>
          </View>
        )}

        {error ? (
          <TouchableOpacity
            style={styles.errorBanner}
            onPress={refreshPublicData}
            activeOpacity={0.8}
          >
            <Text style={styles.errorBannerText}>
              {error}. Tocá para reintentar.
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Proximas Subastas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.rowLeft}>
              <Feather name="clock" size={18} color="#0A0A0A" />
              <Text style={styles.sectionTitle}>Proximas Subastas</Text>
            </View>
            <TouchableOpacity
              style={styles.rowLeft}
              onPress={() => navigation.navigate("Catalog")}
            >
              <Text style={styles.seeAll}>Ver todas</Text>
              <Feather name="chevron-right" size={15} color="#0A0A0A" />
            </TouchableOpacity>
          </View>

          {upcomingAuctions.map((auction, i) => (
            <TouchableOpacity
              key={auction.id}
              style={styles.auctionItem}
              onPress={() => navigation.navigate("Catalog")}
              activeOpacity={0.8}
            >
              {/* Icon box */}
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: ICON_COLORS[i % ICON_COLORS.length] },
                ]}
              >
                <MaterialCommunityIcons
                  name="gavel"
                  size={24}
                  color="rgba(255,255,255,0.85)"
                />
                <View style={styles.itemCountBadge}>
                  <Text style={styles.itemCountText}>{auction.itemCount}</Text>
                </View>
              </View>

              {/* Info */}
              <View style={styles.auctionInfo}>
                <Text style={styles.auctionTitle} numberOfLines={1}>
                  {auction.title}
                </Text>
                <Text style={styles.auctionDate}>
                  Inicia: {formatRelativeDate(auction.startDate)}
                </Text>
                <Text style={styles.auctionPrice}>
                  {auction.startingPrice > 0
                    ? `Desde $ ${auction.startingPrice.toLocaleString("es-AR")}`
                    : "Precio a confirmar"}
                </Text>
              </View>

              <Feather name="chevron-right" size={18} color="#737373" />
            </TouchableOpacity>
          ))}

          {!loading && upcomingAuctions.length === 0 && (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyTitle}>No hay subastas próximas</Text>
              <Text style={styles.emptyText}>
                Cuando cargues subastas en la base van a aparecer acá.
              </Text>
            </View>
          )}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  greeting: { fontSize: 13, color: "#737373" },
  userName: { fontSize: 20, fontWeight: "700", color: "#0A0A0A" },
  bellWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E7000B",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  bellBadgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "700" },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 44,
    backgroundColor: "#F5F5F5",
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  searchPlaceholder: { fontSize: 14, color: "#A3A3A3" },
  scroll: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowTitle: { fontSize: 16, fontWeight: "600", color: "#0A0A0A" },
  rowCount: { fontSize: 12, color: "#737373" },
  liveBadge: {
    backgroundColor: "#FB2C36",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  liveBadgeText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  section: { padding: 16, gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#0A0A0A" },
  seeAll: { fontSize: 14, fontWeight: "500", color: "#0A0A0A" },
  auctionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 14,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    flexShrink: 0,
  },
  itemCountBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#0A0A0A",
    alignItems: "center",
    justifyContent: "center",
  },
  itemCountText: { fontSize: 10, fontWeight: "700", color: "#FAFAFA" },
  auctionInfo: { flex: 1, gap: 2 },
  auctionTitle: { fontSize: 14, fontWeight: "500", color: "#0A0A0A" },
  auctionDate: { fontSize: 12, color: "#737373" },
  auctionPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0A0A0A",
    paddingTop: 2,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  errorBannerText: { color: "#B91C1C", fontSize: 13 },
  emptyBlock: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#FAFAFA",
  },
  emptyTitle: { fontSize: 14, fontWeight: "600", color: "#0A0A0A" },
  emptyText: { fontSize: 12, color: "#737373", marginTop: 4 },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 24,
  },
  loadingText: { fontSize: 13, color: "#737373" },
});
