import React, { useState, useCallback } from "react";
import { StyleSheet, View, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";

import vehicleSmall from "../../assets/images/vehicle-small.png";
import vehicleSuv from "../../assets/images/vehicle-suv.png";
import vehicleLarge from "../../assets/images/vehicle-large.png";
import { useNavigation, useFocusEffect, useRoute, RouteProp } from "@react-navigation/native";
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
  getUserData,
  getActiveMemberships,
  getIncludedServiceIds,
  getVehicleName,
  UserData,
  Package,
  Membership,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "BookingPackageOption">;

export default function BookingPackageOptionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { vehicleSize, addressLabel, vehicleBrand, vehicleModel, vehicleColor, vehiclePlate } = route.params;

  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const data = await getUserData();
        setUserData(data);

        const actives = data ? getActiveMemberships(data) : [];
        const matching = actives.filter((a) => a.membership.vehicleSize === vehicleSize);
        if (matching.length === 0) {
          navigation.replace("ServiceCustomization", {
            vehicleSize,
            addressLabel,
            vehicleBrand,
            vehicleModel,
            vehicleColor,
            vehiclePlate,
          });
        }
      };
      load();
    }, [])
  );

  const activeMemberships = userData ? getActiveMemberships(userData) : [];
  const matchingMemberships = activeMemberships.filter((a) => a.membership.vehicleSize === vehicleSize);

  if (matchingMemberships.length === 0) {
    return <ThemedView style={styles.container} />;
  }

  const handleSelectMembership = (membershipId: string) => {
    Haptics.selectionAsync();
    setSelectedMembershipId((prev) => (prev === membershipId ? null : membershipId));
  };

  const handleUsePackage = () => {
    if (!selectedMembershipId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const selected = matchingMemberships.find((m) => m.membership.id === selectedMembershipId);
    if (!selected) return;

    const pkg = selected.package;
    const addOns = getIncludedServiceIds(pkg.washType);

    navigation.navigate("ScheduleSelection", {
      vehicleSize,
      washType: pkg.washType,
      addOns,
      totalPrice: 0,
      addressLabel,
      vehicleBrand,
      vehicleModel,
      vehicleColor,
      vehiclePlate,
      membershipId: selectedMembershipId,
    });
  };

  const handleContinueNormal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("ServiceCustomization", {
      vehicleSize,
      addressLabel,
      vehicleBrand,
      vehicleModel,
      vehicleColor,
      vehiclePlate,
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <View style={[styles.infoBanner, { backgroundColor: Colors.primary + "12" }]}>
            <View style={[styles.infoBannerIcon, { backgroundColor: Colors.primary + "20" }]}>
              <Feather name="gift" size={22} color={Colors.primary} />
            </View>
            <View style={styles.infoBannerText}>
              <ThemedText type="h3" style={{ color: Colors.primary }}>
                Tienes paquetes disponibles
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Usa una lavada de tu paquete o continúa con el proceso normal
              </ThemedText>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <ThemedText type="h2" style={styles.sectionTitle}>
            Mis Paquetes
          </ThemedText>
        </Animated.View>

        {matchingMemberships.map(({ package: pkg, membership, daysRemaining }, index) => {
          const duration = pkg.durations.find((d) => d.id === membership.durationId);
          const totalWashes = duration ? duration.washesIncluded : membership.washesRemaining;
          const isSelected = selectedMembershipId === membership.id;

          return (
            <Animated.View
              key={membership.id}
              entering={FadeInDown.delay(150 + index * 80).springify()}
            >
              <Pressable onPress={() => handleSelectMembership(membership.id)}>
                <Card
                  elevation={isSelected ? 2 : 1}
                  style={StyleSheet.flatten([
                    styles.packageCard,
                    isSelected ? { borderColor: pkg.color, borderWidth: 2 } : undefined,
                  ])}
                >
                  <View style={[styles.vehicleBanner, { backgroundColor: `${pkg.color}08` }]}>
                    <Image
                      source={membership.vehicleSize === "small" ? vehicleSmall : membership.vehicleSize === "suv" ? vehicleSuv : vehicleLarge}
                      style={styles.vehicleBannerImage}
                      contentFit="contain"
                    />
                    <ThemedText type="body" style={{ fontWeight: "700" }}>
                      {getVehicleName(membership.vehicleSize)}
                    </ThemedText>
                  </View>

                  <View style={styles.packageHeader}>
                    <View style={[styles.packageIcon, { backgroundColor: `${pkg.color}20` }]}>
                      <Feather
                        name={pkg.id === "premium" ? "award" : pkg.id === "completo" ? "star" : "check-circle"}
                        size={24}
                        color={pkg.color}
                      />
                    </View>
                    <View style={styles.packageTitleContainer}>
                      <ThemedText type="h2">{pkg.name}</ThemedText>
                      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                        {pkg.description}
                      </ThemedText>
                    </View>
                    <View style={[styles.radioOuter, { borderColor: isSelected ? pkg.color : theme.backgroundTertiary }]}>
                      {isSelected ? (
                        <View style={[styles.radioInner, { backgroundColor: pkg.color }]} />
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={[styles.statBadge, { backgroundColor: pkg.color + "15" }]}>
                      <Feather name="droplet" size={14} color={pkg.color} />
                      <ThemedText type="caption" style={{ color: pkg.color, fontWeight: "700" }}>
                        {membership.washesRemaining}/{totalWashes} lavadas
                      </ThemedText>
                    </View>
                    <View style={[styles.statBadge, { backgroundColor: theme.backgroundSecondary }]}>
                      <Feather name="clock" size={14} color={theme.textSecondary} />
                      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                        {daysRemaining} {daysRemaining === 1 ? "día" : "días"}
                      </ThemedText>
                    </View>
                    {duration ? (
                      <View style={[styles.statBadge, { backgroundColor: theme.backgroundSecondary }]}>
                        <Feather name="calendar" size={14} color={theme.textSecondary} />
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          {duration.label}
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>

                  {isSelected ? (
                    <View style={styles.selectedInfo}>
                      <Feather name="check-circle" size={16} color={Colors.success} />
                      <ThemedText type="body" style={{ color: Colors.success, fontWeight: "600" }}>
                        Se descontará 1 lavada de este paquete
                      </ThemedText>
                    </View>
                  ) : null}
                </Card>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        {selectedMembershipId ? (
          <Button
            onPress={handleUsePackage}
            style={[styles.primaryButton, { backgroundColor: Colors.success }]}
          >
            Usar Paquete
          </Button>
        ) : null}
        <Pressable
          onPress={handleContinueNormal}
          style={styles.secondaryButton}
        >
          <ThemedText type="body" style={{ color: Colors.primary, fontWeight: "600" }}>
            Continuar sin paquete
          </ThemedText>
          <Feather name="arrow-right" size={18} color={Colors.primary} />
        </Pressable>
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
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  infoBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  infoBannerText: {
    flex: 1,
    gap: Spacing.xs,
  },
  sectionTitle: {
    marginTop: Spacing.sm,
  },
  packageCard: {
    padding: Spacing.xl,
    overflow: "hidden",
  },
  packageHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  packageIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  packageTitleContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  vehicleBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginHorizontal: -Spacing.xs,
  },
  vehicleBannerImage: {
    width: 64,
    height: 40,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  selectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.success + "30",
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  primaryButton: {
    width: "100%",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
});
