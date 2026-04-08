import React, { useState, useCallback } from "react";
import { StyleSheet, View, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
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
import {
  saveBooking,
  useMembershipWash,
  generateId,
  formatPrice,
  formatDate,
  getVehicleName,
  getWashTypeName,
  ADD_ONS,
  ALL_SERVICES,
  Booking,
  getUserData,
  UserData,
  getActiveMemberships,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "Payment">;

interface PaymentMethod {
  id: string;
  type: "visa" | "mastercard" | "amex";
  last4: string;
  isDefault: boolean;
}

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "1", type: "visa", last4: "4242", isDefault: true },
  { id: "2", type: "mastercard", last4: "8888", isDefault: false },
];

export default function PaymentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { vehicleSize, washType, addOns, date, time, totalPrice } = route.params;

  const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(null);
  const isUsingMembership = !!selectedMembershipId;

  const [userData, setUserData] = useState<UserData | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadUserData = async () => {
        const data = await getUserData();
        setUserData(data);
      };
      loadUserData();
    }, [])
  );

  const activeMemberships = userData ? getActiveMemberships(userData) : [];

  const handleMembershipSelect = (membershipId: string | null) => {
    Haptics.selectionAsync();
    setSelectedMembershipId(membershipId);
  };

  const [selectedPayment, setSelectedPayment] = useState<string>(
    MOCK_PAYMENT_METHODS.find((m) => m.isDefault)?.id || "1"
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedAddOns = ALL_SERVICES.filter((s) => addOns.includes(s.id));

  const getCardIcon = (type: PaymentMethod["type"]) => {
    switch (type) {
      case "visa":
        return "credit-card";
      case "mastercard":
        return "credit-card";
      case "amex":
        return "credit-card";
      default:
        return "credit-card";
    }
  };

  const getCardName = (type: PaymentMethod["type"]) => {
    switch (type) {
      case "visa":
        return "Visa";
      case "mastercard":
        return "Mastercard";
      case "amex":
        return "American Express";
      default:
        return "Card";
    }
  };

  const handlePaymentSelect = (id: string) => {
    Haptics.selectionAsync();
    setSelectedPayment(id);
  };

  const handlePay = async () => {
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (isUsingMembership && selectedMembershipId) {
      await useMembershipWash(selectedMembershipId);
    }

    const booking: Booking = {
      id: generateId(),
      vehicleSize,
      washType,
      addOns,
      date,
      time,
      totalPrice: isUsingMembership ? 0 : totalPrice,
      status: "upcoming",
      createdAt: new Date().toISOString(),
      usedMembership: isUsingMembership,
    };

    await saveBooking(booking);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsProcessing(false);

    navigation.navigate("Confirmation", { booking });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <ThemedText type="h2" style={styles.sectionTitle}>
            Resumen del Pedido
          </ThemedText>
          <Card elevation={1} style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Vehículo
              </ThemedText>
              <ThemedText type="body">{getVehicleName(vehicleSize)}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Tipo de Lavado
              </ThemedText>
              <ThemedText type="body">{getWashTypeName(washType)}</ThemedText>
            </View>
            {selectedAddOns.length > 0 ? (
              <View style={styles.summaryRow}>
                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                  Servicios Extra
                </ThemedText>
                <ThemedText type="body" style={styles.addOnsList}>
                  {selectedAddOns.map((a) => a.name).join(", ")}
                </ThemedText>
              </View>
            ) : null}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Fecha
              </ThemedText>
              <ThemedText type="body">{formatDate(date)}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Hora
              </ThemedText>
              <ThemedText type="body">{time}</ThemedText>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <ThemedText type="h3">Total</ThemedText>
              {isUsingMembership ? (
                <View style={{ alignItems: "flex-end" }}>
                  <ThemedText
                    type="h2"
                    style={{ color: Colors.success }}
                  >
                    Incluido
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Con tu paquete
                  </ThemedText>
                </View>
              ) : (
                <ThemedText
                  type="h2"
                  style={{ color: isDark ? Colors.accent : Colors.primary }}
                >
                  {formatPrice(totalPrice)}
                </ThemedText>
              )}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <ThemedText type="h2" style={styles.sectionTitle}>
            Método de Pago
          </ThemedText>

          {activeMemberships.length > 0 ? (
            <View style={styles.paymentMethods}>
              <Pressable
                onPress={() => handleMembershipSelect(null)}
                style={[
                  styles.paymentMethod,
                  {
                    backgroundColor: !isUsingMembership
                      ? isDark
                        ? "rgba(6, 182, 212, 0.15)"
                        : "rgba(30, 64, 175, 0.08)"
                      : theme.backgroundDefault,
                    borderColor: !isUsingMembership
                      ? isDark
                        ? Colors.accent
                        : Colors.primary
                      : theme.backgroundTertiary,
                  },
                ]}
              >
                <Feather
                  name="credit-card"
                  size={24}
                  color={
                    !isUsingMembership
                      ? isDark
                        ? Colors.accent
                        : Colors.primary
                      : theme.textSecondary
                  }
                />
                <View style={styles.paymentInfo}>
                  <ThemedText type="body">Pago Directo</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Paga esta lavada individualmente
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    {
                      borderColor: !isUsingMembership
                        ? isDark
                          ? Colors.accent
                          : Colors.primary
                        : theme.textSecondary,
                    },
                  ]}
                >
                  {!isUsingMembership ? (
                    <View
                      style={[
                        styles.radioInner,
                        {
                          backgroundColor: isDark
                            ? Colors.accent
                            : Colors.primary,
                        },
                      ]}
                    />
                  ) : null}
                </View>
              </Pressable>

              {activeMemberships.map(({ package: pkg, membership, daysRemaining }) => {
                const isSelected = selectedMembershipId === membership.id;
                return (
                  <Pressable
                    key={membership.id}
                    onPress={() => handleMembershipSelect(membership.id)}
                    style={[
                      styles.paymentMethod,
                      {
                        backgroundColor: isSelected
                          ? pkg.color + "20"
                          : theme.backgroundDefault,
                        borderColor: isSelected
                          ? pkg.color
                          : theme.backgroundTertiary,
                      },
                    ]}
                  >
                    <View style={[styles.packageIcon, { backgroundColor: pkg.color }]}>
                      <Feather
                        name={pkg.id === "elite" ? "award" : pkg.id === "premium" ? "star" : "check-circle"}
                        size={18}
                        color="#FFFFFF"
                      />
                    </View>
                    <View style={styles.paymentInfo}>
                      <ThemedText type="body">{pkg.name}</ThemedText>
                      <View style={styles.packageMeta}>
                        <ThemedText type="small" style={{ color: pkg.color, fontWeight: "600" }}>
                          {membership.washesRemaining} lavadas
                        </ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {daysRemaining} días
                        </ThemedText>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        { borderColor: isSelected ? pkg.color : theme.textSecondary },
                      ]}
                    >
                      {isSelected ? (
                        <View
                          style={[styles.radioInner, { backgroundColor: pkg.color }]}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {!isUsingMembership ? (
            <View style={styles.cardPaymentSection}>
              {activeMemberships.length > 0 ? (
                <View style={styles.divider}>
                  <View style={[styles.dividerLine, { backgroundColor: theme.backgroundTertiary }]} />
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Tarjeta
                  </ThemedText>
                  <View style={[styles.dividerLine, { backgroundColor: theme.backgroundTertiary }]} />
                </View>
              ) : null}
              <View style={styles.paymentMethods}>
                {MOCK_PAYMENT_METHODS.map((method) => {
                  const isSelected = selectedPayment === method.id;
                  return (
                    <Pressable
                      key={method.id}
                      onPress={() => handlePaymentSelect(method.id)}
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
                        },
                      ]}
                    >
                      <Feather
                        name={getCardIcon(method.type)}
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
                        <ThemedText type="body">
                          {getCardName(method.type)} ****{method.last4}
                        </ThemedText>
                        {method.isDefault ? (
                          <ThemedText
                            type="small"
                            style={{ color: theme.textSecondary }}
                          >
                            Predeterminada
                          </ThemedText>
                        ) : null}
                      </View>
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor: isSelected
                              ? isDark
                                ? Colors.accent
                                : Colors.primary
                              : theme.textSecondary,
                          },
                        ]}
                      >
                        {isSelected ? (
                          <View
                            style={[
                              styles.radioInner,
                              {
                                backgroundColor: isDark
                                  ? Colors.accent
                                  : Colors.primary,
                              },
                            ]}
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                style={[styles.addPayment, { borderColor: theme.textSecondary }]}
              >
                <Feather name="plus" size={20} color={theme.textSecondary} />
                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                  Agregar Método de Pago
                </ThemedText>
              </Pressable>

              <View style={styles.secureNote}>
                <Feather name="lock" size={16} color={theme.textSecondary} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Pago seguro encriptado
                </ThemedText>
              </View>
            </View>
          ) : (
            <Card elevation={1} style={[styles.membershipActiveCard, { backgroundColor: Colors.success + "15" }]}>
              <View style={styles.membershipBadge}>
                <Feather name="award" size={24} color={Colors.success} />
                <View style={{ flex: 1 }}>
                  <ThemedText type="h3" style={{ color: Colors.success }}>
                    Usando tu Paquete
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Esta lavada se descontará de tu paquete activo
                  </ThemedText>
                </View>
              </View>
            </Card>
          )}
        </Animated.View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.backgroundDefault,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <Button
          onPress={handlePay}
          disabled={isProcessing}
          style={[styles.payButton, { backgroundColor: Colors.success }]}
        >
          {isProcessing
            ? "Procesando..."
            : isUsingMembership
            ? "Confirmar Cita"
            : `Pagar ${formatPrice(totalPrice)}`}
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  summaryCard: {
    marginBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  addOnsList: {
    flex: 1,
    textAlign: "right",
    marginLeft: Spacing.lg,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginVertical: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(128, 128, 128, 0.2)",
    marginVertical: Spacing.md,
  },
  cardPaymentSection: {
    marginTop: Spacing.sm,
  },
  packageIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  packageMeta: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: 2,
  },
  membershipActiveCard: {
    marginTop: Spacing.md,
  },
  paymentMethods: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  paymentInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  addPayment: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: Spacing.sm,
  },
  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xl,
  },
  footer: {
    padding: Spacing.xl,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  payButton: {
    backgroundColor: Colors.success,
  },
  membershipBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
});
