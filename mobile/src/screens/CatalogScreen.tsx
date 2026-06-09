import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AuctionCard from "../components/AuctionCard";
import CategoryBadge from "../components/CategoryBadge";
import { UiCategory, useAppData } from "../context/AppContext";

type FilterStatus = "all" | "live" | "upcoming" | "ended";

const STATUS_TABS: { id: FilterStatus; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "live", label: "En Vivo" },
  { id: "upcoming", label: "Proximas" },
  { id: "ended", label: "Finalizadas" },
];

const CATEGORIES: UiCategory[] = ["comun", "especial", "plata", "oro", "platino"];

interface Props {
  navigation: any;
}

export default function CatalogScreen({ navigation }: Props) {
  const { allAuctions, loading, error, refreshPublicData } = useAppData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<UiCategory | null>(
    null,
  );
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = allAuctions.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || a.category === selectedCategory;
    const matchesStatus =
      selectedStatus === "all" || a.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Catalogo</Text>
          <TouchableOpacity
            style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
            onPress={() => setShowFilters((v) => !v)}
          >
            <Feather
              name="sliders"
              size={18}
              color={showFilters ? "#FFFFFF" : "#0a3d54"}
            />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="#737373" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar subastas..."
            placeholderTextColor="#A3A3A3"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={16} color="#737373" />
            </TouchableOpacity>
          )}
        </View>

        {/* Status tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {STATUS_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                selectedStatus === tab.id && styles.tabActive,
              ]}
              onPress={() => setSelectedStatus(tab.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedStatus === tab.id && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Filter panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterPanelTitle}>Filtrar por categoria</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <TouchableOpacity
              style={[
                styles.allCatBtn,
                !selectedCategory && styles.allCatBtnActive,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[
                  styles.allCatText,
                  !selectedCategory && { color: "#FFFFFF" },
                ]}
              >
                Todas
              </Text>
            </TouchableOpacity>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() =>
                  setSelectedCategory(selectedCategory === cat ? null : cat)
                }
              >
                <CategoryBadge
                  category={cat}
                  size="sm"
                  style={
                    selectedCategory === cat
                      ? { borderWidth: 2, borderColor: "#146C94" }
                      : undefined
                  }
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Results count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filtered.length}{" "}
          {filtered.length === 1
            ? "subasta encontrada"
            : "subastas encontradas"}
        </Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <AuctionCard
            auction={item}
            onPress={() => navigation.navigate('AuctionLive', { auctionId: item.id })}
          />
        )}
        ListEmptyComponent={
          <TouchableOpacity
            style={styles.empty}
            onPress={refreshPublicData}
            activeOpacity={0.8}
          >
            <Feather name="search" size={48} color="#D4D4D4" />
            <Text style={styles.emptyTitle}>
              {loading ? "Cargando subastas..." : "No se encontraron subastas"}
            </Text>
            <Text style={styles.emptyText}>
              {loading
                ? "Esperá un momento."
                : "Intenta con otros filtros o toca para reintentar."}
            </Text>
          </TouchableOpacity>
        }
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#AFD3E2",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(10,61,84,0.15)",
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 20, fontWeight: "700", color: "#0a3d54" },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnActive: { backgroundColor: "#146C94" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 44,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#0A0A0A" },
  tabsRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F5F5F5",
  },
  tabActive: { backgroundColor: "#146C94" },
  tabText: { fontSize: 13, fontWeight: "500", color: "#737373" },
  tabTextActive: { color: "#FFFFFF", fontWeight: "600" },
  filterPanel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    gap: 10,
  },
  filterPanelTitle: { fontSize: 13, fontWeight: "500", color: "#0A0A0A" },
  filterRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  allCatBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#F5F5F5",
  },
  allCatBtnActive: { backgroundColor: "#146C94" },
  allCatText: { fontSize: 12, fontWeight: "500", color: "#737373" },
  countRow: { paddingHorizontal: 16, paddingVertical: 10 },
  countText: { fontSize: 13, color: "#737373" },
  errorText: { fontSize: 12, color: "#B91C1C", marginTop: 4 },
  list: { paddingHorizontal: 16, gap: 14, paddingBottom: 24 },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#0A0A0A" },
  emptyText: { fontSize: 13, color: "#737373", textAlign: "center" },
});
