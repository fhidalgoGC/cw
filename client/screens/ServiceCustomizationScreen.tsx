import React, { useState, useMemo } from "react";
import { StyleSheet, View, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
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
import {
  WashType,
  VEHICLE_PRICES,
  WASH_TYPE_PRICES,
  ALL_SERVICES,
  getIncludedServiceIds,
  SUBSCRIPTION_PRICE,
  formatPrice,
} from "@/lib/storage";

const subscriptionBadge = require("../../assets/images/subscription-badge.png");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "ServiceCustomization">;

export default function ServiceCustomizationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { vehicleSize } = route.params;

  const [washType, setWashType] = useState<WashType>("basic");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [wantsSubscription, setWantsSubscription] = useState(false);

  const includedServiceIds = useMemo(() => getIncludedServiceIds(washType), [washType]);

  const totalPrice = useMemo(() => {
    if (wantsSubscription) {
      return SUBSCRIPTION_PRICE;
    }
    const basePrice = VEHICLE_PRICES[vehicleSize];
    const washPrice = WASH_TYPE_PRICES[washType];
    const addOnsPrice = selectedAddOns.reduce((sum, id) => {
      const service = ALL_SERVICES.find((s) => s.id === id);
      if (service && !includedServiceIds.includes(id)) {
        return sum + service.price;
      }
      return sum;
    }, 0);
    return basePrice + washPrice + addOnsPrice;
  }, [vehicleSize, washType, selectedAddOns, wantsSubscription, includedServiceIds]);

  const toggleAddOn = (id: string) => {
    if (includedServiceIds.includes(id)) return;
    Haptics.selectionAsync();
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleWashTypeChange = (type: WashType) => {
    Haptics.selectionAsync();
    setWashType(type);
    setSelectedAddOns((prev) => {
      const newIncluded = getIncludedServiceIds(type);
      return prev.filter((id) => !newIncluded.includes(id));
    });
  };

  const handleSubscriptionToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWantsSubscription(!wantsSubscription);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const allSelected = [...includedServiceIds, ...selectedAddOns];
    navigation.navigate("ScheduleSelection", {
      vehicleSize,
      washType,
      addOns: allSelected,
      totalPrice,
    });
  };

  const basicPrice = VEHICLE_PRICES[vehicleSize] + WASH_TYPE_PRICES.basic;
  const completePrice = VEHICLE_PRICES[vehicleSize] + WASH_TYPE_PRICES.complete;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <ThemedText type="h2" style={styles.sectionTitle}>
            Tipo de Lavado
          </ThemedText>
          <View style={styles.washTypeContainer}>
            <Pressable
              onPress={() => handleWashTypeChange("basic")}
              style={[
                styles.washTypeOption,
                {
                  backgroundColor:
                    washType === "basic"
                      ? isDark
                        ? "rgba(6, 182, 212, 0.15)"
                        : "rgba(30, 64, 175, 0.08)"
                      : theme.backgroundDefault,
                  borderColor:
                    washType === "basic"
                      ? isDark
                        ? Colors.accent
                        : Colors.primary
                      : theme.backgroundTertiary,
                },
              ]}
            >
              <ThemedText
                type="h3"
                style={{
                  color:
                    washType === "basic"
                      ? isDark
                        ? Colors.accent
                        : Colors.primary
                      : theme.text,
                }}
              >
                Básico
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Exterior + Aspirado
              </ThemedText>
              <ThemedText
                type="body"
                style={{
                  color: isDark ? Colors.accent : Colors.primary,
                  marginTop: Spacing.xs,
                  fontWeight: "700",
                }}
              >
                {formatPrice(basicPrice)}
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => handleWashTypeChange("complete")}
              style={[
                styles.washTypeOption,
                {
                  backgroundColor:
                    washType === "complete"
                      ? isDark
                        ? "rgba(6, 182, 212, 0.15)"
                        : "rgba(30, 64, 175, 0.08)"
                      : theme.backgroundDefault,
                  borderColor:
                    washType === "complete"
                      ? isDark
                        ? Colors.accent
                        : Colors.primary
                      : theme.backgroundTertiary,
                },
              ]}
            >
              <ThemedText
                type="h3"
                style={{
                  color:
                    washType === "complete"
                      ? isDark
                        ? Colors.accent
                        : Colors.primary
                      : theme.text,
                }}
              >
                Completo
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Exterior + Interior + Vidrios
              </ThemedText>
              <ThemedText
                type="body"
                style={{
                  color: isDark ? Colors.accent : Colors.primary,
                  marginTop: Spacing.xs,
                  fontWeight: "700",
                }}
              >
                {formatPrice(completePrice)}
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <ThemedText type="h2" style={styles.sectionTitle}>
            Servicios
          </ThemedText>
          <View style={styles.addOnsContainer}>
            {ALL_SERVICES.map((service) => {
              const isIncluded = includedServiceIds.includes(service.id);
              const isSelected = isIncluded || selectedAddOns.includes(service.id);
              return (
                <Pressable
                  key={service.id}
                  onPress={() => toggleAddOn(service.id)}
                  disabled={isIncluded}
                  style={[
                    styles.addOnItem,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? "rgba(6, 182, 212, 0.15)"
                          : "rgba(30, 64, 175, 0.08)"
                        : theme.backgroundDefault,
                      opacity: isIncluded ? 1 : undefined,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? Colors.accent
                            : Colors.primary
                          : "transparent",
                        borderColor: isSelected
                          ? isDark
                            ? Colors.accent
                            : Colors.primary
                          : theme.textSecondary,
                      },
                    ]}
                  >
                    {isSelected ? (
                      <Feather name="check" size={14} color="#FFFFFF" />
                    ) : null}
                  </View>
                  <ThemedText type="body" style={styles.addOnName}>
                    {service.name}
                  </ThemedText>
                  {isIncluded ? (
                    <View style={[styles.includedBadge, { backgroundColor: Colors.success + "20" }]}>
                      <ThemedText
                        type="small"
                        style={{ color: Colors.success, fontWeight: "600" }}
                      >
                        $0
                      </ThemedText>
                    </View>
                  ) : (
                    <ThemedText
                      type="body"
                      style={{ color: isDark ? Colors.accent : Colors.primary }}
                    >
                      +{formatPrice(service.price)}
                    </ThemedText>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Pressable onPress={handleSubscriptionToggle}>
            <Card
              elevation={2}
              style={StyleSheet.flatten([
                styles.subscriptionCard,
                {
                  backgroundColor: wantsSubscription
                    ? isDark
                      ? Colors.primary
                      : "#EEF2FF"
                    : isDark
                    ? "rgba(6, 182, 212, 0.15)"
                    : "rgba(30, 64, 175, 0.08)",
                  borderWidth: 2,
                  borderColor: wantsSubscription
                    ? isDark
                      ? Colors.accent
                      : Colors.primary
                    : "transparent",
                },
              ])}
            >
              <View style={styles.subscriptionContent}>
                <Image
                  source={subscriptionBadge}
                  style={styles.subscriptionBadge}
                  contentFit="contain"
                />
                <View style={styles.subscriptionInfo}>
                  <View style={styles.subscriptionHeader}>
                    <ThemedText
                      type="h3"
                      style={{
                        color: wantsSubscription
                          ? isDark
                            ? "#FFFFFF"
                            : Colors.primary
                          : isDark
                          ? Colors.accent
                          : Colors.primary,
                      }}
                    >
                      Pase de 20 Lavadas
                    </ThemedText>
                    <View
                      style={[
                        styles.premiumBadge,
                        { backgroundColor: Colors.success },
                      ]}
                    >
                      <ThemedText
                        type="small"
                        style={{ color: "#FFFFFF", fontWeight: "600" }}
                      >
                        AHORRA 40%
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText
                    type="caption"
                    style={{
                      color: wantsSubscription
                        ? isDark
                          ? "#E0E7FF"
                          : "#4338CA"
                        : theme.textSecondary,
                    }}
                  >
                    20 lavados básicos al mes por solo {formatPrice(SUBSCRIPTION_PRICE)}
                  </ThemedText>
                </View>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor: wantsSubscription
                      ? isDark
                        ? Colors.accent
                        : Colors.primary
                      : theme.textSecondary,
                  },
                ]}
              >
                {wantsSubscription ? (
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
            </Card>
          </Pressable>
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
        <View style={styles.priceRow}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Total
          </ThemedText>
          <ThemedText
            type="h1"
            style={{ color: isDark ? Colors.accent : Colors.primary }}
          >
            {formatPrice(totalPrice)}
          </ThemedText>
        </View>
        <Button onPress={handleContinue} style={styles.continueButton}>
          Elegir Horario
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
  washTypeContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  washTypeOption: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: "center",
  },
  addOnsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  addOnItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  addOnName: {
    flex: 1,
  },
  includedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  subscriptionCard: {
    marginBottom: Spacing.lg,
  },
  subscriptionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  subscriptionBadge: {
    width: 48,
    height: 48,
    marginRight: Spacing.md,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
    marginBottom: Spacing.xs,
  },
  premiumBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: Spacing.xl,
    top: Spacing.xl,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  footer: {
    padding: Spacing.xl,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  continueButton: {
    backgroundColor: Colors.primary,
  },
});
