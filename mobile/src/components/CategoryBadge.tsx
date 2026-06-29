import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { UiCategory } from "../context/AppContext";

interface CategoryBadgeProps {
  category: UiCategory;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  style?: ViewStyle;
}

type CategoryStyle = {
  label: string;
  bg: string;
  text: string;
  border: string;
  iconSet: "feather" | "mci";
  iconName: string;
};

const categoryStyles: Record<UiCategory, CategoryStyle> = {
  comun: {
    label: "Común",
    bg: "#F5F5F5",
    text: "#737373",
    border: "#E5E5E5",
    iconSet: "feather",
    iconName: "circle",
  },
  especial: {
    label: "Especial",
    bg: "#EFF6FF",
    text: "#146C94",
    border: "#BFDBFE",
    iconSet: "feather",
    iconName: "star",
  },
  plata: {
    label: "Plata",
    bg: "#F1F5F9",
    text: "#475569",
    border: "#CBD5E1",
    iconSet: "feather",
    iconName: "shield",
  },
  oro: {
    label: "Oro",
    bg: "#FEF9C3",
    text: "#92400E",
    border: "#FDE68A",
    iconSet: "feather",
    iconName: "award",
  },
  platino: {
    label: "Platino",
    bg: "#F8FAFC",
    text: "#334155",
    border: "#E2E8F0",
    iconSet: "mci",
    iconName: "crown",
  },
};

const sizeConfig = {
  sm: { px: 8, py: 2, fontSize: 10, iconSize: 12, gap: 4 },
  md: { px: 12, py: 4, fontSize: 12, iconSize: 14, gap: 6 },
  lg: { px: 16, py: 6, fontSize: 14, iconSize: 16, gap: 8 },
};

export default function CategoryBadge({
  category,
  size = "md",
  showLabel = true,
  style,
}: CategoryBadgeProps) {
  const cs = categoryStyles[category];
  const sc = sizeConfig[size];

  const icon =
    cs.iconSet === "mci" ? (
      <MaterialCommunityIcons
        name={cs.iconName as any}
        size={sc.iconSize}
        color={cs.text}
      />
    ) : (
      <Feather name={cs.iconName as any} size={sc.iconSize} color={cs.text} />
    );

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: cs.bg,
          borderColor: cs.border,
          paddingHorizontal: sc.px,
          paddingVertical: sc.py,
          gap: sc.gap,
        },
        style,
      ]}
    >
      {icon}
      {showLabel && (
        <Text style={[styles.label, { color: cs.text, fontSize: sc.fontSize }]}>
          {cs.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 9999,
    borderWidth: 1,
  },
  label: {
    fontWeight: "600",
  },
});
