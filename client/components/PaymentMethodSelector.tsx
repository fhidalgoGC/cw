import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

export interface PaymentMethod {
  id: string;
  type: "card" | "transfer" | "cash";
  name: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "card", type: "card", name: "Tarjeta de Crédito/Débito", description: "Visa, Mastercard, Amex", icon: "credit-card" },
  { id: "transfer", type: "transfer", name: "Transferencia", description: "SPEI / Transferencia bancaria", icon: "repeat" },
  { id: "cash", type: "cash", name: "Efectivo", description: "Pago al momento del servicio", icon: "dollar-sign" },
];

interface PaymentMethodSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function PaymentMethodSelector({ selectedId, onSelect }: PaymentMethodSelectorProps) {
  const { theme, isDark } = useTheme();

  const handleSelect = (id: string) => {
    Haptics.selectionAsync();
    onSelect(id);
  };

  return (
    <View style={styles.container}>
      {PAYMENT_METHODS.map((method) => {
        const isSelected = selectedId === method.id;
        return (
          <Pressable
            key={method.id}
            onPress={() => handleSelect(method.id)}
            style={[
              styles.paymentMethod,
              {
                backgroundColor: isSelected
                  ? isDark
                    ? "rgba(6, 182, 212, 0.15)"
                    : "rgba(30, 64, 175, 0.08)"
                  : theme.backgroundDefault,
                borderColor: isSelected
                  ? isDark
                    ? Colors.accent
                    : Colors.primary
                  : theme.backgroundTertiary,
                borderWidth: isSelected ? 2 : 1,
              },
            ]}
          >
            <Feather
              name={method.icon}
              size={24}
              color={
                isSelected
                  ? isDark
                    ? Colors.accent
                    : Colors.primary
                  : theme.textSecondary
              }
            />
            <View style={styles.paymentInfo}>
              <ThemedText type="body" style={{ fontWeight: "500" }}>
                {method.name}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {method.description}
              </ThemedText>
            </View>
            {isSelected ? (
              <Feather
                name="check-circle"
                size={20}
                color={isDark ? Colors.accent : Colors.primary}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  paymentInfo: {
    flex: 1,
    gap: 2,
  },
});
