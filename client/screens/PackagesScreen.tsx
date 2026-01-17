import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
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
  PACKAGES,
  Package,
  UserData,
  getUserData,
  getActiveMemberships,
  formatPrice,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PackagesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [userData, setUserData] = useState<UserData | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    const data = await getUserData();
    setUserData(data);
  };

  const handleActivatePackage = (pkg: Package) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("PackagePurchase", { packageId: pkg.id });
  };

  const activeMemberships = userData ? getActiveMemberships(userData) : [];

  const renderPackageCard = (pkg: Package, index: number) => {
    return (
      <Animated.View
        key={pkg.id}
        entering={FadeInDown.delay(index * 100).springify()}
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
                name={pkg.id === "elite" ? "award" : pkg.id === "premium" ? "star" : pkg.id === "express15" ? "zap" : "check-circle"}
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

          <View style={styles.priceContainer}>
            <ThemedText type="display" style={{ color: pkg.color }}>
              {formatPrice(pkg.price)}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              / {pkg.durationDays} días
            </ThemedText>
          </View>

          <View style={styles.perksContainer}>
            {pkg.perks.map((perk, perkIndex) => (
              <View key={perkIndex} style={styles.perkRow}>
                <Feather name="check" size={16} color={pkg.color} />
                <ThemedText type="body" style={styles.perkText}>
                  {perk}
                </ThemedText>
              </View>
            ))}
          </View>

          <Button
            onPress={() => handleActivatePackage(pkg)}
            style={[styles.activateButton, { backgroundColor: pkg.color }]}
          >
            Comprar Paquete
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

        <ThemedText type="h3" style={styles.sectionTitle}>
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
