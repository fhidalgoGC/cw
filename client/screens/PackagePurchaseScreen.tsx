import React, { useState } from "react";
import { StyleSheet, View, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { PACKAGES, activateMembership, formatPrice } from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "PackagePurchase">;
type RouteType = RouteProp<RootStackParamList, "PackagePurchase">;

interface PaymentMethod {
  id: string;
  name: string;
  icon: keyof typeof Feather.glyphMap;
  last4?: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "card1", name: "Visa", icon: "credit-card", last4: "4242" },
  { id: "card2", name: "Mastercard", icon: "credit-card", last4: "8888" },
  { id: "apple", name: "Apple Pay", icon: "smartphone" },
];

export default function PackagePurchaseScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedPayment, setSelectedPayment] = useState<string>("card1");
  const [isProcessing, setIsProcessing] = useState(false);

  const { packageId } = route.params;
  const pkg = PACKAGES.find((p) => p.id === packageId);

  if (!pkg) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="body">Paquete no encontrado</ThemedText>
      </ThemedView>
    );
  }

  const handlePurchase = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      await activateMembership(pkg.id);
      setIsProcessing(false);
      
      Alert.alert(
        "¡Compra Exitosa!",
        `Tu paquete ${pkg.name} ha sido activado. Ahora tienes ${pkg.washesIncluded} lavadas disponibles.`,
        [
          {
            text: "Continuar",
            onPress: () => {
              navigation.popToTop();
            },
          },
        ]
      );
    } catch (error) {
      setIsProcessing(false);
      Alert.alert("Error", "No se pudo procesar el pago. Intenta de nuevo.");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <Card
            elevation={2}
            style={{ ...styles.packageSummary, borderLeftColor: pkg.color }}
          >
            <View style={styles.packageHeader}>
              <View style={[styles.packageIcon, { backgroundColor: pkg.color + "20" }]}>
                <Feather
                  name={pkg.id === "elite" ? "award" : pkg.id === "premium" ? "star" : "check-circle"}
                  size={28}
                  color={pkg.color}
                />
              </View>
              <View style={styles.packageInfo}>
                <ThemedText type="h2">{pkg.name}</ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {pkg.washesIncluded} lavadas al mes
                </ThemedText>
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Card elevation={1} style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Método de Pago
            </ThemedText>
            <View style={styles.paymentMethods}>
              {PAYMENT_METHODS.map((method) => (
                <Pressable
                  key={method.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedPayment(method.id);
                  }}
                  style={[
                    styles.paymentMethod,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor:
                        selectedPayment === method.id
                          ? isDark
                            ? Colors.accent
                            : Colors.primary
                          : theme.backgroundTertiary,
                      borderWidth: selectedPayment === method.id ? 2 : 1,
                    },
                  ]}
                >
                  <Feather
                    name={method.icon}
                    size={24}
                    color={
                      selectedPayment === method.id
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
                    {method.last4 ? (
                      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                        **** {method.last4}
                      </ThemedText>
                    ) : null}
                  </View>
                  {selectedPayment === method.id ? (
                    <Feather
                      name="check-circle"
                      size={20}
                      color={isDark ? Colors.accent : Colors.primary}
                    />
                  ) : null}
                </Pressable>
              ))}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Card elevation={1} style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Resumen de Compra
            </ThemedText>
            <View style={styles.summaryRow}>
              <ThemedText type="body">Paquete {pkg.name}</ThemedText>
              <ThemedText type="body">{formatPrice(pkg.price)}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Impuestos incluidos
              </ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                $0.00
              </ThemedText>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <ThemedText type="h3">Total</ThemedText>
              <ThemedText type="h2" style={{ color: pkg.color }}>
                {formatPrice(pkg.price)}/mes
              </ThemedText>
            </View>
          </Card>
        </Animated.View>

        <View style={styles.footer}>
          <ThemedText
            type="caption"
            style={[styles.disclaimer, { color: theme.textSecondary }]}
          >
            Al continuar, aceptas los términos de suscripción. Tu membresía se
            renovará automáticamente cada mes.
          </ThemedText>
          <Button
            onPress={handlePurchase}
            disabled={isProcessing}
            style={[styles.purchaseButton, { backgroundColor: pkg.color }]}
          >
            {isProcessing ? "Procesando..." : `Pagar ${formatPrice(pkg.price)}`}
          </Button>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  packageSummary: {
    borderLeftWidth: 4,
  },
  packageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  packageIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  packageInfo: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  paymentMethods: {
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
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  footer: {
    marginTop: "auto",
    gap: Spacing.md,
  },
  disclaimer: {
    textAlign: "center",
  },
  purchaseButton: {
    marginTop: Spacing.sm,
  },
});
