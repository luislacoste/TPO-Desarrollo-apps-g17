import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { UiPaymentMethod } from "../context/AppContext";

interface PaymentMethodCardProps {
  method: UiPaymentMethod;
}

const typeConfig = {
  credit_card: {
    iconName: "credit-card",
    label: "Tarjeta de Credito",
    bgColor: "#1D4ED8",
  },
  bank_account: {
    iconName: "home",
    label: "Cuenta Bancaria",
    bgColor: "#065F46",
  },
  certified_check: {
    iconName: "file-text",
    label: "Cheque Certificado",
    bgColor: "#92400E",
  },
};

export default function PaymentMethodCard({ method }: PaymentMethodCardProps) {
  const config = typeConfig[method.type];

  const maskedNumber =
    method.type === "credit_card"
      ? `•••• •••• •••• ${method.lastFour ?? "----"}`
      : method.lastFour
        ? `•••• ${method.lastFour}`
        : method.type === "bank_account"
          ? "CBU registrado"
          : "N° registrado";

  return (
    <View style={styles.card}>
      {/* Colored header */}
      <View style={[styles.header, { backgroundColor: config.bgColor }]}>
        <View style={styles.headerTop}>
          <Feather
            name={config.iconName as any}
            size={28}
            color="rgba(255,255,255,0.85)"
          />
          <Feather
            name="more-vertical"
            size={20}
            color="rgba(255,255,255,0.7)"
          />
        </View>
        <View style={styles.headerBottom}>
          <Text style={styles.maskedNumber}>{maskedNumber}</Text>
          <Text style={styles.cardName}>{method.name}</Text>
        </View>
        {/* Decorative circles */}
        <View style={[styles.decorCircle, styles.decorCircle1]} />
        <View style={[styles.decorCircle, styles.decorCircle2]} />
      </View>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.detailsLeft}>
          <Text style={styles.typeLabel}>{config.label}</Text>
          {method.bank ? (
            <Text style={styles.subLabel}>{method.bank}</Text>
          ) : method.expiryDate ? (
            <Text style={styles.subLabel}>Vence: {method.expiryDate}</Text>
          ) : null}
        </View>
        <View
          style={[
            styles.verifiedBadge,
            { backgroundColor: method.verified ? "#DCFCE7" : "#FEF9C3" },
          ]}
        >
          <Feather
            name={method.verified ? "check-circle" : "alert-circle"}
            size={13}
            color={method.verified ? "#16A34A" : "#D97706"}
          />
          <Text
            style={[
              styles.verifiedText,
              { color: method.verified ? "#16A34A" : "#D97706" },
            ]}
          >
            {method.verified ? "Verificado" : "Pendiente"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    overflow: "hidden",
  },
  header: {
    height: 120,
    padding: 16,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerBottom: {
    gap: 2,
  },
  maskedNumber: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "monospace",
    letterSpacing: 2,
  },
  cardName: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },
  decorCircle: {
    position: "absolute",
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  decorCircle1: {
    width: 120,
    height: 120,
    top: -30,
    right: -20,
  },
  decorCircle2: {
    width: 80,
    height: 80,
    bottom: -30,
    right: 40,
  },
  details: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailsLeft: {
    gap: 2,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0A0A0A",
  },
  subLabel: {
    fontSize: 12,
    color: "#737373",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
