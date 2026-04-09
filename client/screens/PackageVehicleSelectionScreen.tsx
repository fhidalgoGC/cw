import React, { useState, useCallback } from "react";
import { StyleSheet, View, ScrollView, Pressable } from "react-native";
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
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  VehicleSize,
  UserData,
  getUserData,
  getActiveMemberships,
  getVehicleName,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const VEHICLE_OPTIONS: { size: VehicleSize; image: any }[] = [
  { size: "small", image: vehicleSmall },
  { size: "suv", image: vehicleSuv },
  { size: "large", image: vehicleLarge },
];

export default function PackageVehicleSelectionScreen() {
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

  const activeMemberships = userData ? getActiveMemberships(userData) : [];

  const handleSelectVehicle = (size: VehicleSize) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("Packages", { vehicleSize: size });
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
          <ThemedText type="h2" style={styles.title}>
            Tipo de Vehículo
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            El precio del paquete depende del tipo de vehículo
          </ThemedText>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(150).springify()}
          style={styles.vehicleRow}
        >
          {VEHICLE_OPTIONS.map((option) => (
            <Pressable
              key={option.size}
              onPress={() => handleSelectVehicle(option.size)}
              style={[
                styles.vehicleCard,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <View style={[styles.vehicleImageContainer, { backgroundColor: theme.backgroundDefault }]}>
                <Image
                  source={option.image}
                  style={styles.vehicleImage}
                  contentFit="contain"
                />
              </View>
              <ThemedText type="body" style={styles.vehicleName}>
                {getVehicleName(option.size)}
              </ThemedText>
            </Pressable>
          ))}
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
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.xl,
  },
  vehicleRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  vehicleCard: {
    flex: 1,
    alignItems: "center",
    borderRadius: BorderRadius.xl,
    paddingBottom: Spacing.md,
    overflow: "hidden",
  },
  vehicleImageContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  vehicleImage: {
    width: 80,
    height: 50,
  },
  vehicleName: {
    fontWeight: "600",
    textAlign: "center",
  },
});
