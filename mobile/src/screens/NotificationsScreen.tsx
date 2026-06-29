import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppData } from "../context/AppContext";

interface Props {
  navigation: any;
}

function getTypeStyle(type: "bid" | "auction" | "payment" | "system") {
  switch (type) {
    case "bid":
      return { bg: "#FEF9C3", color: "#D97706", icon: "tool" };
    case "auction":
      return { bg: "#EFF6FF", color: "#3E73EE", icon: "bell" };
    case "payment":
      return { bg: "#DCFCE7", color: "#16A34A", icon: "credit-card" };
    default:
      return { bg: "#F5F5F5", color: "#737373", icon: "settings" };
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (hours < 1) return "Hace un momento";
  if (hours < 24) return `Hace ${hours}h`;
  if (days === 1) return "Ayer";
  return `Hace ${days} dias`;
}

export default function NotificationsScreen({ navigation }: Props) {
  const { notifications, refreshPrivateData } = useAppData();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notificaciones</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadText}>{unreadCount} sin leer</Text>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Feather name="check" size={18} color="#146C94" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Feather name="trash-2" size={18} color="#146C94" />
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const ts = getTypeStyle(item.type);
          return (
            <TouchableOpacity
              style={[styles.notifItem, !item.read && styles.notifUnread]}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, { backgroundColor: ts.bg }]}>
                <Feather name={ts.icon as any} size={18} color={ts.color} />
              </View>
              <View style={styles.notifBody}>
                <View style={styles.notifTitleRow}>
                  <Text
                    style={[
                      styles.notifTitle,
                      item.read && styles.notifTitleRead,
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifMessage} numberOfLines={2}>
                  {item.message}
                </Text>
                <Text style={styles.notifTime}>
                  {formatTimestamp(item.timestamp)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <TouchableOpacity
            style={styles.empty}
            onPress={refreshPrivateData}
            activeOpacity={0.8}
          >
            <View style={styles.emptyIconWrap}>
              <Feather name="bell" size={32} color="#D4D4D4" />
            </View>
            <Text style={styles.emptyTitle}>No hay notificaciones</Text>
            <Text style={styles.emptyText}>
              Cuando el backend genere alertas van a aparecer acá. Toca para
              refrescar.
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
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#AFD3E2",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(10,61,84,0.15)",
  },
  title: { fontSize: 20, fontWeight: "700", color: "#0a3d54" },
  unreadText: { fontSize: 13, color: "#146C94", marginTop: 2 },
  actions: { flexDirection: "row", gap: 4 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  separator: { height: 1, backgroundColor: "#E5E5E5" },
  notifItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  notifUnread: { backgroundColor: "#F0F4FF" },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notifBody: { flex: 1 },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  notifTitle: { flex: 1, fontSize: 14, fontWeight: "600", color: "#0A0A0A" },
  notifTitleRead: { fontWeight: "500" },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#146C94",
    marginTop: 4,
    flexShrink: 0,
  },
  notifMessage: {
    fontSize: 13,
    color: "#737373",
    marginTop: 2,
    lineHeight: 18,
  },
  notifTime: { fontSize: 11, color: "#A3A3A3", marginTop: 6 },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#0A0A0A" },
  emptyText: { fontSize: 13, color: "#737373", textAlign: "center" },
});
