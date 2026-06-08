import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import CategoryBadge from "./CategoryBadge";
import type { UiAuction } from "../context/AppContext";

interface AuctionCardProps {
  auction: UiAuction;
  onPress?: () => void;
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export default function AuctionCard({ auction, onPress }: AuctionCardProps) {
  const isLive = auction.status === "live";
  const isEnded = auction.status === "ended";

  const statusConfig = {
    live: {
      label: "EN VIVO",
      bg: "#FB2C36",
      text: "#FFFFFF",
      thumbBg: "#FEE2E2",
    },
    upcoming: {
      label: "PROXIMA",
      bg: "#146C94",
      text: "#FFFFFF",
      thumbBg: "#EFF6FF",
    },
    ended: {
      label: "FINALIZADA",
      bg: "#E5E5E5",
      text: "#737373",
      thumbBg: "#F5F5F5",
    },
  };

  const status = statusConfig[auction.status];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Thumbnail area */}
      <View style={[styles.thumbnail, { backgroundColor: status.thumbBg }]}>
        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          {isLive && <View style={styles.pulseDot} />}
          <Text style={[styles.statusText, { color: status.text }]}>
            {status.label}
          </Text>
        </View>
        {/* Category badge */}
        <View style={styles.categoryWrap}>
          <CategoryBadge category={auction.category} size="sm" />
        </View>
        {/* Center icon */}
        <View style={styles.thumbIcon}>
          <Feather
            name={isLive ? "play" : isEnded ? "check-circle" : "calendar"}
            size={32}
            color={isEnded ? "#737373" : "#146C94"}
            style={{ opacity: 0.3 }}
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {auction.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {auction.description}
        </Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={13} color="#737373" />
            <Text style={styles.metaText}>{formatDate(auction.startDate)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="users" size={13} color="#737373" />
            <Text style={styles.metaText}>{auction.itemCount} piezas</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  thumbnail: {
    height: 120,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbIcon: {
    position: "absolute",
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  categoryWrap: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0A0A0A",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: "#737373",
    lineHeight: 18,
    marginBottom: 12,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: "#737373",
  },
});
