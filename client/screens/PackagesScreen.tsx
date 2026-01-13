import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  PACKAGES,
  ADD_ONS,
  Package,
  UserData,
  getUserData,
  activateMembership,
  cancelMembership,
  getActiveMembership,
  formatPrice,
  formatShortDate,
  getAddOnName,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type TabType = "packages" | "membership";

export default function PackagesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [activeTab, setActiveTab] = useState<TabType>("packages");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    const data = await getUserData();
    setUserData(data);
    if (data.membership) {
      setActiveTab("membership");
    }
  };

  const handleTabChange = (tab: TabType) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const handleActivatePackage = (pkg: Package) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("PackagePurchase", { packageId: pkg.id });
  };

  const handleCancelMembership = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      "Cancelar Membresía",
      "¿Estás seguro de que deseas cancelar tu membresía? Perderás todos los beneficios restantes.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              const updatedData = await cancelMembership();
              setUserData(updatedData);
              setActiveTab("packages");
              Alert.alert("Membresía Cancelada", "Tu membresía ha sido cancelada.");
            } catch (error) {
              Alert.alert("Error", "No se pudo cancelar la membresía");
            }
            setIsLoading(false);
          },
        },
      ]
    );
  };

  const activeMembership = userData ? getActiveMembership(userData) : null;

  const renderPackageCard = (pkg: Package, index: number) => {
    const isActive = activeMembership?.package.id === pkg.id;

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
            isActive ? { borderColor: pkg.color, borderWidth: 2 } : undefined,
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
                name={pkg.id === "elite" ? "award" : pkg.id === "premium" ? "star" : "check-circle"}
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
              /mes
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

          {isActive ? (
            <View style={[styles.activeTag, { backgroundColor: `${pkg.color}20` }]}>
              <Feather name="check-circle" size={16} color={pkg.color} />
              <ThemedText type="body" style={{ color: pkg.color, fontWeight: "600" }}>
                Plan Activo
              </ThemedText>
            </View>
          ) : (
            <Button
              onPress={() => handleActivatePackage(pkg)}
              disabled={isLoading || !!activeMembership}
              style={[
                styles.activateButton,
                { backgroundColor: activeMembership ? theme.backgroundTertiary : pkg.color },
              ]}
            >
              {activeMembership ? "Ya tienes un plan activo" : "Activar Paquete"}
            </Button>
          )}
        </Card>
      </Animated.View>
    );
  };

  const renderMembershipTab = () => {
    if (!activeMembership) {
      return (
        <Animated.View entering={FadeIn} style={styles.emptyState}>
          <Feather
            name="package"
            size={64}
            color={isDark ? Colors.accent : Colors.primary}
          />
          <ThemedText type="h2" style={styles.emptyTitle}>
            Sin Membresía Activa
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.emptyText, { color: theme.textSecondary }]}
          >
            Activa un paquete para disfrutar de lavadas ilimitadas y servicios
            adicionales incluidos.
          </ThemedText>
          <Button
            onPress={() => setActiveTab("packages")}
            style={{ marginTop: Spacing.lg }}
          >
            Ver Paquetes
          </Button>
        </Animated.View>
      );
    }

    const { package: pkg, membership } = activeMembership;
    const totalWashes = pkg.washesIncluded;
    const washesUsed = totalWashes - membership.washesRemaining;
    const washProgress = (membership.washesRemaining / totalWashes) * 100;

    return (
      <Animated.View entering={FadeIn}>
        <Card
          elevation={2}
          style={StyleSheet.flatten([styles.membershipCard, { borderColor: pkg.color, borderWidth: 2 }])}
        >
          <View style={styles.membershipHeader}>
            <View
              style={[styles.membershipIcon, { backgroundColor: `${pkg.color}20` }]}
            >
              <Feather
                name={pkg.id === "elite" ? "award" : pkg.id === "premium" ? "star" : "check-circle"}
                size={32}
                color={pkg.color}
              />
            </View>
            <View style={styles.membershipTitleContainer}>
              <ThemedText type="h1">{pkg.name}</ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Renovación: {formatShortDate(membership.renewalDate)}
              </ThemedText>
            </View>
          </View>
        </Card>

        <ThemedText type="h3" style={styles.sectionTitle}>
          Lavadas Disponibles
        </ThemedText>
        <Card elevation={1} style={styles.usageCard}>
          <View style={styles.usageHeader}>
            <Feather
              name="droplet"
              size={24}
              color={isDark ? Colors.accent : Colors.primary}
            />
            <View style={styles.usageInfo}>
              <ThemedText type="h2">
                {membership.washesRemaining} de {totalWashes}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Lavadas restantes este mes
              </ThemedText>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: theme.backgroundTertiary },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${washProgress}%`,
                    backgroundColor: isDark ? Colors.accent : Colors.primary,
                  },
                ]}
              />
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {washesUsed} usadas
            </ThemedText>
          </View>
        </Card>

        <ThemedText type="h3" style={styles.sectionTitle}>
          Servicios Adicionales Incluidos
        </ThemedText>
        {pkg.addOnsIncluded.map((addon, index) => {
          const remaining = membership.addOnUsage[addon.addOnId] || 0;
          const total = addon.includedUses;
          const used = total - remaining;
          const progress = (remaining / total) * 100;

          return (
            <Animated.View
              key={addon.addOnId}
              entering={FadeInDown.delay(index * 50).springify()}
            >
              <Card elevation={1} style={styles.addonCard}>
                <View style={styles.addonHeader}>
                  <Feather
                    name="plus-circle"
                    size={20}
                    color={isDark ? Colors.accent : Colors.primary}
                  />
                  <ThemedText type="body" style={styles.addonName}>
                    {getAddOnName(addon.addOnId)}
                  </ThemedText>
                  <ThemedText
                    type="body"
                    style={{ color: isDark ? Colors.accent : Colors.primary, fontWeight: "600" }}
                  >
                    {remaining}/{total}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.addonProgressBar,
                    { backgroundColor: theme.backgroundTertiary },
                  ]}
                >
                  <View
                    style={[
                      styles.addonProgressFill,
                      {
                        width: `${progress}%`,
                        backgroundColor: isDark ? Colors.accent : Colors.primary,
                      },
                    ]}
                  />
                </View>
              </Card>
            </Animated.View>
          );
        })}

        <Button
          onPress={handleCancelMembership}
          disabled={isLoading}
          style={[styles.cancelButton, { backgroundColor: `${Colors.error}15` }]}
          textColor={Colors.error}
        >
          Cancelar Membresía
        </Button>
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
        <View style={styles.tabsContainer}>
          <Pressable
            style={[
              styles.tab,
              activeTab === "packages" && [
                styles.activeTab,
                { backgroundColor: isDark ? Colors.accent : Colors.primary },
              ],
            ]}
            onPress={() => handleTabChange("packages")}
          >
            <ThemedText
              type="body"
              style={[
                styles.tabText,
                activeTab === "packages" && styles.activeTabText,
              ]}
            >
              Paquetes
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              activeTab === "membership" && [
                styles.activeTab,
                { backgroundColor: isDark ? Colors.accent : Colors.primary },
              ],
            ]}
            onPress={() => handleTabChange("membership")}
          >
            <ThemedText
              type="body"
              style={[
                styles.tabText,
                activeTab === "membership" && styles.activeTabText,
              ]}
            >
              Mi Membresía
            </ThemedText>
          </Pressable>
        </View>

        {activeTab === "packages" ? (
          <View style={styles.packagesContainer}>
            {PACKAGES.map((pkg, index) => renderPackageCard(pkg, index))}
          </View>
        ) : (
          renderMembershipTab()
        )}
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
  tabsContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
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
  activeTag: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  activateButton: {
    marginTop: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.md,
  },
  emptyTitle: {
    marginTop: Spacing.md,
  },
  emptyText: {
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
  membershipCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  membershipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  membershipIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  membershipTitleContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  usageCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  usageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  usageInfo: {
    flex: 1,
  },
  progressBarContainer: {
    gap: Spacing.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  addonCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  addonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  addonName: {
    flex: 1,
  },
  addonProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  addonProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  cancelButton: {
    marginTop: Spacing.xl,
  },
});
