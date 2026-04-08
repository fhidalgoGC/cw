import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { StyleSheet, View, Pressable, ScrollView, Alert } from "react-native";
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
  WASH_TYPE_PRICES,
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

  const { vehicleSize, washType, addOns, date, time, totalPrice, reservationExpiry } = route.params;

  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!reservationExpiry) return 0;
    return Math.max(0, Math.ceil((reservationExpiry - Date.now()) / 1000));
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    if (!reservationExpiry) return;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((reservationExpiry - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [reservationExpiry]);

  useEffect(() => {
    if (secondsLeft === 0 && reservationExpiry && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Tiempo agotado",
        "Tu reserva de horario ha expirado. Selecciona un nuevo horario.",
        [{
          text: "Volver",
          onPress: () => navigation.goBack(),
        }]
      );
    }
  }, [secondsLeft, reservationExpiry, navigation]);

  const isTimerActive = !!reservationExpiry && secondsLeft > 0;
  const isTimeLow = secondsLeft <= 60;
  const timerColor = isTimeLow ? Colors.error : Colors.warning;

  const formatCountdown = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

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
  const [servicesExpanded, setServicesExpanded] = useState(false);

  const selectedAddOns = ALL_SERVICES.filter((s) => addOns.includes(s.id));

  const allIncludedServices = useMemo(() => {
    const includedByWash = ALL_SERVICES.filter((s) => s.includedIn.includes(washType));
    const extras = ALL_SERVICES.filter(
      (s) => addOns.includes(s.id) && !s.includedIn.includes(washType)
    );
    return [
      ...includedByWash.map((s) => ({ ...s, isIncluded: true })),
      ...extras.map((s) => ({ ...s, isIncluded: false })),
    ];
  }, [washType, addOns]);

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
    if (reservationExpiry && Date.now() >= reservationExpiry) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Tiempo agotado",
        "Tu reserva de horario ha expirado. Selecciona un nuevo horario.",
        [{ text: "Volver", onPress: () => navigation.goBack() }]
      );
      return;
    }

    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (reservationExpiry && Date.now() >= reservationExpiry) {
      setIsProcessing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Tiempo agotado",
        "Tu reserva expiró durante el procesamiento. Selecciona un nuevo horario.",
        [{ text: "Volver", onPress: () => navigation.goBack() }]
      );
      return;
    }

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
      {isTimerActive ? (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[
            styles.timerBar,
            { backgroundColor: timerColor + "15" },
          ]}
        >
          <View style={styles.timerContent}>
            <View style={styles.timerLeft}>
              <View style={[styles.timerIconCircle, { backgroundColor: timerColor + "25" }]}>
                <Feather name="clock" size={16} color={timerColor} />
              </View>
              <ThemedText type="small" style={{ color: timerColor, fontWeight: "700" }}>
                Completa tu pago
              </ThemedText>
            </View>
            <View style={[styles.timerBadge, { backgroundColor: timerColor }]}>
              <Feather name="clock" size={12} color="#FFFFFF" />
              <ThemedText type="body" style={styles.timerText}>
                {formatCountdown(secondsLeft)}
              </ThemedText>
            </View>
          </View>
          <View style={[styles.timerProgressBg, { backgroundColor: timerColor + "20" }]}>
            <View
              style={[
                styles.timerProgressFill,
                {
                  backgroundColor: timerColor,
                  width: `${(secondsLeft / (5 * 60)) * 100}%`,
                },
              ]}
            />
          </View>
        </Animated.View>
      ) : null}
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
              <View style={{ alignItems: "flex-end" }}>
                <ThemedText type="body">{getWashTypeName(washType)}</ThemedText>
                <ThemedText type="small" style={{ color: isDark ? Colors.accent : Colors.primary, fontWeight: "600" }}>
                  {WASH_TYPE_PRICES[washType] > 0 ? formatPrice(WASH_TYPE_PRICES[washType]) : "Base"}
                </ThemedText>
              </View>
            </View>
            {allIncludedServices.length > 0 ? (
              <View>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setServicesExpanded(!servicesExpanded);
                  }}
                  style={styles.summaryRow}
                >
                  <View style={styles.servicesToggle}>
                    <ThemedText type="body" style={{ color: theme.textSecondary }}>
                      Servicios Incluidos
                    </ThemedText>
                    <View style={[styles.servicesBadge, { backgroundColor: (isDark ? Colors.accent : Colors.primary) + "15" }]}>
                      <ThemedText type="small" style={{ color: isDark ? Colors.accent : Colors.primary, fontWeight: "600" }}>
                        {allIncludedServices.length}
                      </ThemedText>
                    </View>
                  </View>
                  <Feather
                    name={servicesExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={isDark ? Colors.accent : Colors.primary}
                  />
                </Pressable>
                {servicesExpanded ? (
                  <View style={styles.servicesExpandedList}>
                    {allIncludedServices.map((service) => (
                      <View key={service.id} style={styles.serviceItem}>
                        <View style={styles.serviceItemLeft}>
                          <Feather
                            name="check-circle"
                            size={14}
                            color={service.isIncluded ? Colors.success : (isDark ? Colors.accent : Colors.primary)}
                          />
                          <ThemedText type="body" style={{ fontSize: 14 }}>
                            {service.name}
                          </ThemedText>
                        </View>
                        <ThemedText
                          type="small"
                          style={{
                            color: service.isIncluded ? Colors.success : theme.textSecondary,
                            fontWeight: "600",
                          }}
                        >
                          {service.isIncluded ? "Incluido" : `+$${service.price}`}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                ) : null}
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
  timerBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  timerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  timerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  timerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  timerText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  timerProgressBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  timerProgressFill: {
    height: 4,
    borderRadius: 2,
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
  servicesToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  servicesBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: "center",
  },
  servicesExpandedList: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingLeft: Spacing.xs,
  },
  serviceItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
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
