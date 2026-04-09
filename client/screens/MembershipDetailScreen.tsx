import React, { useCallback, useState } from "react";
import { StyleSheet, View, ScrollView, Alert } from "react-native";
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
import {
  getUserData,
  UserData,
  PACKAGES,
  ADD_ONS,
  getActiveMemberships,
  getDaysRemaining,
  cancelMembership,
  Package,
  Membership,
} from "@/lib/storage";
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

  const handleCancelMembership = (membership: Membership, pkg: Package) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Cancelar Paquete",
      `¿Estás seguro de cancelar tu paquete ${pkg.name}? Perderás las lavadas restantes.`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            await cancelMembership(membership.id);
            loadUserData();
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.skeleton, { backgroundColor: theme.backgroundSecondary }]} />
      </ThemedView>
    );
  }

  const activeMemberships = userData ? getActiveMemberships(userData) : [];

  if (activeMemberships.length === 0) {
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
              Sin Paquetes Activos
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              Aún no tienes paquetes activos. Adquiere uno para disfrutar de
              lavadas y beneficios exclusivos.
            </ThemedText>
            <Button
              onPress={() => navigation.navigate("PackageVehicleSelection")}
              style={styles.activateButton}
            >
              Ver Paquetes Disponibles
            </Button>
          </Animated.View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="h3" style={styles.sectionHeader}>
          Paquetes Comprados ({activeMemberships.length})
        </ThemedText>

        {activeMemberships.map(({ package: pkg, membership, daysRemaining }, index) => {
          const duration = pkg.durations.find((d) => d.id === membership.durationId);
          const totalWashes = duration ? duration.washesIncluded : membership.washesRemaining;
          const progressPercent = (membership.washesRemaining / totalWashes) * 100;

          return (
            <Animated.View
              key={membership.id}
              entering={FadeInDown.delay(index * 100).springify()}
            >
              <Card
                elevation={2}
                style={{ ...styles.packageCard, backgroundColor: pkg.color }}
              >
                <View style={styles.packageHeader}>
                  <View style={styles.packageBadge}>
                    <Feather
                      name={pkg.id === "premium" ? "award" : pkg.id === "completo" ? "star" : "check-circle"}
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.packageTitleContainer}>
                    <ThemedText type="h2" style={styles.packageName}>
                      {pkg.name}
                    </ThemedText>
                    <View style={styles.daysContainer}>
                      <Feather name="clock" size={14} color="rgba(255,255,255,0.8)" />
                      <ThemedText type="caption" style={styles.daysText}>
                        {daysRemaining} {daysRemaining === 1 ? "día" : "días"} restantes
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <View style={styles.washesSection}>
                  <ThemedText type="h1" style={styles.washesCount}>
                    {membership.washesRemaining}
                  </ThemedText>
                  <ThemedText type="body" style={styles.washesLabel}>
                    de {totalWashes} lavadas restantes
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

                <View style={styles.expirationInfo}>
                  <Feather name="calendar" size={14} color="rgba(255,255,255,0.8)" />
                  <ThemedText type="caption" style={styles.expirationText}>
                    Vence: {new Date(membership.expirationDate).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </ThemedText>
                </View>
              </Card>

              {pkg.addOnsIncluded.length > 0 ? (
                <Card elevation={1} style={styles.addOnsCard}>
                  <ThemedText type="body" style={{ fontWeight: "600", marginBottom: Spacing.sm }}>
                    Add-Ons Incluidos
                  </ThemedText>
                  {pkg.addOnsIncluded.map((addon) => {
                    const addOnInfo = ADD_ONS.find((a) => a.id === addon.addOnId);
                    const remaining = membership.addOnUsage[addon.addOnId] || 0;
                    return (
                      <View
                        key={addon.addOnId}
                        style={[styles.addOnRow, { borderBottomColor: theme.backgroundTertiary }]}
                      >
                        <ThemedText type="caption">
                          {addOnInfo?.name || addon.addOnId}
                        </ThemedText>
                        <ThemedText
                          type="caption"
                          style={{
                            color: remaining > 0 ? Colors.success : Colors.error,
                            fontWeight: "600",
                          }}
                        >
                          {remaining}/{addon.includedUses}
                        </ThemedText>
                      </View>
                    );
                  })}
                </Card>
              ) : null}

              <Button
                onPress={() => handleCancelMembership(membership, pkg)}
                style={[styles.cancelButton, { backgroundColor: Colors.error + "15" }]}
                textColor={Colors.error}
              >
                Cancelar Paquete
              </Button>
            </Animated.View>
          );
        })}

        <Animated.View entering={FadeInDown.delay(activeMemberships.length * 100 + 50).springify()}>
          <Button
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate("VehicleSelection");
            }}
            style={styles.bookButton}
          >
            <View style={styles.bookButtonContent}>
              <Feather name="calendar" size={20} color="#FFFFFF" />
              <ThemedText type="body" style={styles.bookButtonText}>
                Agendar Cita
              </ThemedText>
            </View>
          </Button>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(activeMemberships.length * 100 + 100).springify()}>
          <Button
            onPress={() => navigation.navigate("PackageVehicleSelection")}
            style={[styles.addMoreButton, { backgroundColor: theme.backgroundSecondary }]}
            textColor={isDark ? Colors.accent : Colors.primary}
          >
            Comprar Otro Paquete
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
  sectionHeader: {
    marginBottom: Spacing.sm,
  },
  packageCard: {
    padding: Spacing.xl,
  },
  packageHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  packageBadge: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  packageTitleContainer: {
    flex: 1,
  },
  packageName: {
    color: "#FFFFFF",
  },
  daysContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  daysText: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  washesSection: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  washesCount: {
    fontSize: 56,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 64,
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
  expirationInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  expirationText: {
    color: "rgba(255,255,255,0.8)",
  },
  addOnsCard: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  addOnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
  },
  cancelButton: {
    marginBottom: Spacing.xl,
  },
  bookButton: {
    backgroundColor: Colors.primary,
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
  addMoreButton: {
    marginTop: Spacing.sm,
  },
});
