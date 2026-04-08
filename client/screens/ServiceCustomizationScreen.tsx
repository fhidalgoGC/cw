import React, { useState, useMemo } from "react";
import { StyleSheet, View, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
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
  formatPrice,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "ServiceCustomization">;

interface WashOption {
  type: WashType;
  name: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
}

const WASH_OPTIONS: WashOption[] = [
  {
    type: "basic",
    name: "Básico",
    description: "Exterior + Aspirado",
    icon: "droplet",
  },
  {
    type: "complete",
    name: "Completo",
    description: "Exterior + Interior + Vidrios",
    icon: "sun",
  },
  {
    type: "premium",
    name: "Premium",
    description: "Completo + Rines",
    icon: "star",
  },
  {
    type: "detail",
    name: "Detallado",
    description: "Premium + Motor + Cera",
    icon: "award",
  },
  {
    type: "full",
    name: "Full",
    description: "Todo incluido",
    icon: "shield",
  },
];

export default function ServiceCustomizationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { vehicleSize, addressLabel } = route.params;

  const [washType, setWashType] = useState<WashType>("basic");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  const includedServiceIds = useMemo(() => getIncludedServiceIds(washType), [washType]);

  const totalPrice = useMemo(() => {
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
  }, [vehicleSize, washType, selectedAddOns, includedServiceIds]);

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

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const allSelected = [...includedServiceIds, ...selectedAddOns];
    navigation.navigate("ScheduleSelection", {
      vehicleSize,
      washType,
      addOns: allSelected,
      totalPrice,
      addressLabel,
    });
  };

  const getWashPrice = (type: WashType) => {
    return VEHICLE_PRICES[vehicleSize] + WASH_TYPE_PRICES[type];
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
            Tipo de Lavado
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.washTypeScroll}
          >
            {WASH_OPTIONS.map((option, index) => {
              const isSelected = washType === option.type;
              const price = getWashPrice(option.type);
              return (
                <Pressable
                  key={option.type}
                  onPress={() => handleWashTypeChange(option.type)}
                  style={[
                    styles.washTypeCard,
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
                  <View
                    style={[
                      styles.washTypeIcon,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? Colors.accent + "25"
                            : Colors.primary + "15"
                          : theme.backgroundTertiary,
                      },
                    ]}
                  >
                    <Feather
                      name={option.icon}
                      size={22}
                      color={
                        isSelected
                          ? isDark
                            ? Colors.accent
                            : Colors.primary
                          : theme.textSecondary
                      }
                    />
                  </View>
                  <ThemedText
                    type="h3"
                    style={{
                      color: isSelected
                        ? isDark
                          ? Colors.accent
                          : Colors.primary
                        : theme.text,
                      textAlign: "center",
                    }}
                  >
                    {option.name}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={{
                      color: theme.textSecondary,
                      textAlign: "center",
                    }}
                    numberOfLines={2}
                  >
                    {option.description}
                  </ThemedText>
                  <ThemedText
                    type="body"
                    style={{
                      color: Colors.success,
                      marginTop: Spacing.xs,
                      fontWeight: "700",
                    }}
                  >
                    {formatPrice(price)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
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
                    },
                  ]}
                >
                  {isIncluded ? (
                    <Feather name="check-circle" size={22} color={Colors.success} />
                  ) : (
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
                  )}
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  washTypeScroll: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  washTypeCard: {
    width: 130,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: "center",
    gap: Spacing.xs,
  },
  washTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  addOnsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
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
