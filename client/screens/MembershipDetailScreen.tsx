import React, { useCallback, useState } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
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
import { getUserData, UserData, PACKAGES, ADD_ONS } from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type MembershipNavigationProp = NativeStackNavigationProp<RootStackParamList, "MembershipDetail">;

export default function MembershipDetailScreen() {
  const navigation = useNavigation<MembershipNavigationProp>();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    const data = await getUserData();
    setUserData(data);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.skeleton, { backgroundColor: theme.backgroundSecondary }]} />
      </ThemedView>
    );
  }

  const membership = userData?.membership;
  const pkg = membership ? PACKAGES.find((p) => p.id === membership.packageId) : null;

  if (!membership || !pkg) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: isDark ? Colors.accent + "20" : Colors.primary + "15" },
              ]}
            >
              <Feather
                name="award"
                size={48}
                color={isDark ? Colors.accent : Colors.primary}
              />
            </View>
            <ThemedText type="h2" style={styles.emptyTitle}>
              Sin Membresía
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              Aún no tienes una membresía activa. Obtén un paquete para disfrutar de
              lavadas ilimitadas y beneficios exclusivos.
            </ThemedText>
            <Button
              onPress={() => navigation.navigate("Packages")}
              style={styles.activateButton}
            >
              Ver Paquetes Disponibles
            </Button>
          </Animated.View>
        </View>
      </ThemedView>
    );
  }

  const progressPercent = (membership.washesRemaining / pkg.washesIncluded) * 100;
  const renewalDate = new Date(membership.renewalDate);
  const formattedRenewal = renewalDate.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <Card
            elevation={2}
            style={{ ...styles.mainCard, backgroundColor: pkg.color }}
          >
            <View style={styles.packageHeader}>
              <View style={styles.packageBadge}>
                <Feather name="award" size={24} color="#FFFFFF" />
              </View>
              <ThemedText type="h2" style={styles.packageName}>
                {pkg.name}
              </ThemedText>
            </View>

            <View style={styles.washesSection}>
              <ThemedText type="h1" style={styles.washesCount}>
                {membership.washesRemaining}
              </ThemedText>
              <ThemedText type="body" style={styles.washesLabel}>
                de {pkg.washesIncluded} lavadas restantes
              </ThemedText>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
              </View>
            </View>

            <View style={styles.renewalInfo}>
              <Feather name="calendar" size={16} color="rgba(255,255,255,0.8)" />
              <ThemedText type="caption" style={styles.renewalText}>
                Se renueva el {formattedRenewal}
              </ThemedText>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Card elevation={1} style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Servicios Incluidos
            </ThemedText>
            <View style={styles.perksList}>
              {pkg.perks.map((perk, index) => (
                <View key={index} style={styles.perkItem}>
                  <Feather
                    name="check-circle"
                    size={18}
                    color={Colors.success}
                  />
                  <ThemedText type="body">{perk}</ThemedText>
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>

        {pkg.addOnsIncluded.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Card elevation={1} style={styles.section}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Add-Ons Incluidos
              </ThemedText>
              <View style={styles.addOnsList}>
                {pkg.addOnsIncluded.map((addon) => {
                  const addOnInfo = ADD_ONS.find((a) => a.id === addon.addOnId);
                  const remaining = membership.addOnUsage[addon.addOnId] || 0;
                  return (
                    <View
                      key={addon.addOnId}
                      style={[
                        styles.addOnItem,
                        { backgroundColor: theme.backgroundSecondary },
                      ]}
                    >
                      <View style={styles.addOnInfo}>
                        <ThemedText type="body" style={{ fontWeight: "600" }}>
                          {addOnInfo?.name || addon.addOnId}
                        </ThemedText>
                        <ThemedText
                          type="caption"
                          style={{ color: theme.textSecondary }}
                        >
                          {remaining} de {addon.includedUses} disponibles
                        </ThemedText>
                      </View>
                      <View
                        style={[
                          styles.addOnBadge,
                          {
                            backgroundColor:
                              remaining > 0 ? Colors.success + "20" : Colors.error + "20",
                          },
                        ]}
                      >
                        <ThemedText
                          type="caption"
                          style={{
                            color: remaining > 0 ? Colors.success : Colors.error,
                            fontWeight: "600",
                          }}
                        >
                          {remaining}
                        </ThemedText>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Button
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate("VehicleSelection");
            }}
            disabled={membership.washesRemaining <= 0}
            style={[
              styles.bookButton,
              { backgroundColor: membership.washesRemaining > 0 ? pkg.color : theme.backgroundTertiary },
            ]}
          >
            <View style={styles.bookButtonContent}>
              <Feather name="calendar" size={20} color="#FFFFFF" />
              <ThemedText type="body" style={styles.bookButtonText}>
                {membership.washesRemaining > 0
                  ? "Agendar Cita con mi Paquete"
                  : "Sin lavadas disponibles"}
              </ThemedText>
            </View>
          </Button>
        </Animated.View>
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
  content: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  skeleton: {
    margin: Spacing.xl,
    height: 200,
    borderRadius: BorderRadius.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  activateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing["2xl"],
  },
  mainCard: {
    padding: Spacing.xl,
  },
  packageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  packageBadge: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  packageName: {
    color: "#FFFFFF",
  },
  washesSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  washesCount: {
    fontSize: 64,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 72,
  },
  washesLabel: {
    color: "rgba(255,255,255,0.9)",
    marginBottom: Spacing.md,
  },
  progressBar: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  renewalInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  renewalText: {
    color: "rgba(255,255,255,0.8)",
  },
  section: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  perksList: {
    gap: Spacing.sm,
  },
  perkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  addOnsList: {
    gap: Spacing.sm,
  },
  addOnItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  addOnInfo: {
    flex: 1,
  },
  addOnBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  bookButton: {
    marginTop: Spacing.md,
  },
  bookButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
