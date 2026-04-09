import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import vehicleSmall from "../../assets/images/vehicle-small.png";
import vehicleSuv from "../../assets/images/vehicle-suv.png";
import vehicleLarge from "../../assets/images/vehicle-large.png";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  PACKAGES,
  Package,
  PackageDuration,
  UserData,
  VehicleSize,
  getUserData,
  getActiveMemberships,
  getVehicleName,
  formatPrice,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const VEHICLE_OPTIONS: { size: VehicleSize; image: any }[] = [
  { size: "small", image: vehicleSmall },
  { size: "suv", image: vehicleSuv },
  { size: "large", image: vehicleLarge },
];

export default function PackagesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedVehicleSize, setSelectedVehicleSize] = useState<VehicleSize | null>(null);
  const [selectedDurations, setSelectedDurations] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    const data = await getUserData();
    setUserData(data);
  };

  const handleSelectVehicle = (size: VehicleSize) => {
    Haptics.selectionAsync();
    setSelectedVehicleSize(size);
  };

  const handleSelectDuration = (pkgId: string, durationId: string) => {
    Haptics.selectionAsync();
    setSelectedDurations((prev) => ({ ...prev, [pkgId]: durationId }));
  };

  const handleBuyPackage = (pkg: Package) => {
    if (!selectedVehicleSize) return;
    const durationId = selectedDurations[pkg.id] || pkg.durations[0].id;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("PackagePurchase", {
      packageId: pkg.id,
      durationId,
      vehicleSize: selectedVehicleSize,
    });
  };

  const activeMemberships = userData ? getActiveMemberships(userData) : [];

  const getSelectedDuration = (pkg: Package): PackageDuration => {
    const durationId = selectedDurations[pkg.id] || pkg.durations[0].id;
    return pkg.durations.find((d) => d.id === durationId) || pkg.durations[0];
  };

  const getPrice = (pkg: Package): number => {
    if (!selectedVehicleSize) return 0;
    const duration = getSelectedDuration(pkg);
    return duration.prices[selectedVehicleSize];
  };

  const renderPackageCard = (pkg: Package, index: number) => {
    const selectedDuration = getSelectedDuration(pkg);
    const price = getPrice(pkg);

    return (
      <Animated.View
        key={pkg.id}
        entering={FadeInDown.delay(index * 100 + 200).springify()}
      >
        <Card
          elevation={pkg.popular ? 2 : 1}
          style={StyleSheet.flatten([
            styles.packageCard,
            pkg.popular ? styles.popularCard : undefined,
          ])}
        >
          {pkg.popular ? (
            <View style={[styles.popularBadge, { backgroundColor: pkg.color }]}>
              <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                Más Popular
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.packageHeader}>
            <View
              style={[styles.packageIcon, { backgroundColor: `${pkg.color}20` }]}
            >
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
          </View>

          <View style={styles.durationSelector}>
            {pkg.durations.map((dur) => {
              const isSelected = selectedDuration.id === dur.id;
              return (
                <Pressable
                  key={dur.id}
                  onPress={() => handleSelectDuration(pkg.id, dur.id)}
                  style={[
                    styles.durationOption,
                    {
                      backgroundColor: isSelected
                        ? pkg.color + "20"
                        : theme.backgroundSecondary,
                      borderColor: isSelected ? pkg.color : theme.backgroundTertiary,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                >
                  <ThemedText
                    type="caption"
                    style={{
                      fontWeight: isSelected ? "700" : "500",
                      color: isSelected ? pkg.color : theme.text,
                    }}
                  >
                    {dur.label}
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={{ color: isSelected ? pkg.color : theme.textSecondary, fontSize: 11 }}
                  >
                    {dur.washesIncluded} lavadas
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.priceContainer}>
            <ThemedText type="display" style={{ color: pkg.color }}>
              {selectedVehicleSize ? formatPrice(price) : "---"}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              / {selectedDuration.label.toLowerCase()}
            </ThemedText>
          </View>

          <View style={styles.perksContainer}>
            {pkg.perks.map((perk, perkIndex) => (
              <View key={perkIndex} style={styles.perkRow}>
                <Feather name="check-circle" size={16} color={Colors.success} />
                <ThemedText type="body" style={styles.perkText}>
                  {perk}
                </ThemedText>
              </View>
            ))}
            <View style={styles.perkRow}>
              <Feather name="check-circle" size={16} color={Colors.success} />
              <ThemedText type="body" style={styles.perkText}>
                {selectedDuration.washesIncluded} lavadas en {selectedDuration.label.toLowerCase()}
              </ThemedText>
            </View>
          </View>

          <Button
            onPress={() => handleBuyPackage(pkg)}
            disabled={!selectedVehicleSize}
            style={[
              styles.activateButton,
              {
                backgroundColor: selectedVehicleSize ? pkg.color : theme.backgroundTertiary,
                opacity: selectedVehicleSize ? 1 : 0.5,
              },
            ]}
          >
            {selectedVehicleSize ? "Comprar Paquete" : "Selecciona un vehículo"}
          </Button>
        </Card>
      </Animated.View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeMemberships.length > 0 ? (
          <Pressable
            style={[styles.activeMembershipBanner, { backgroundColor: isDark ? Colors.accent + "20" : Colors.primary + "15" }]}
            onPress={() => navigation.navigate("MembershipDetail")}
          >
            <Feather
              name="package"
              size={20}
              color={isDark ? Colors.accent : Colors.primary}
            />
            <ThemedText type="body" style={{ flex: 1, fontWeight: "500" }}>
              Tienes {activeMemberships.length} {activeMemberships.length === 1 ? "paquete activo" : "paquetes activos"}
            </ThemedText>
            <Feather
              name="chevron-right"
              size={20}
              color={isDark ? Colors.accent : Colors.primary}
            />
          </Pressable>
        ) : null}

        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Tipo de Vehículo
          </ThemedText>
          <View style={styles.vehicleSelector}>
            {VEHICLE_OPTIONS.map((option) => {
              const isSelected = selectedVehicleSize === option.size;
              return (
                <Pressable
                  key={option.size}
                  onPress={() => handleSelectVehicle(option.size)}
                  style={[
                    styles.vehicleOption,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? Colors.accent + "20" : Colors.primary + "15")
                        : theme.backgroundSecondary,
                      borderColor: isSelected
                        ? (isDark ? Colors.accent : Colors.primary)
                        : theme.backgroundTertiary,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                >
                  <Image
                    source={option.image}
                    style={styles.vehicleImage}
                    contentFit="contain"
                  />
                  <ThemedText
                    type="caption"
                    style={{
                      fontWeight: isSelected ? "700" : "500",
                      color: isSelected
                        ? (isDark ? Colors.accent : Colors.primary)
                        : theme.text,
                      textAlign: "center",
                    }}
                  >
                    {getVehicleName(option.size)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <ThemedText type="h3" style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          Paquetes Disponibles
        </ThemedText>

        <View style={styles.packagesContainer}>
          {PACKAGES.map((pkg, index) => renderPackageCard(pkg, index))}
        </View>
      </ScrollView>
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
  },
  activeMembershipBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  vehicleSelector: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  vehicleOption: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  vehicleImage: {
    width: 60,
    height: 40,
  },
  packagesContainer: {
    gap: Spacing.lg,
  },
  packageCard: {
    padding: Spacing.xl,
    overflow: "hidden",
  },
  popularCard: {
    borderWidth: 0,
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomLeftRadius: BorderRadius.md,
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
  durationSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  durationOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 2,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  perksContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  perkText: {
    flex: 1,
  },
  activateButton: {
    marginTop: Spacing.xs,
  },
});
