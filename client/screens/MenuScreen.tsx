import React, { useCallback, useState } from "react";
import { StyleSheet, View, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  getUserData,
  getSavedAddresses,
  PACKAGES,
  UserData,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface MenuItemData {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  screen: keyof RootStackParamList;
}

export default function MenuScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [addressCount, setAddressCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const [user, addrs] = await Promise.all([getUserData(), getSavedAddresses()]);
    setUserData(user);
    setAddressCount(addrs.length);
  };

  const vehicleCount = userData?.vehicles?.length || 0;

  const getMembershipLabel = () => {
    if (!userData?.membership) return "Sin paquete activo";
    const pkg = PACKAGES.find((p) => p.id === userData.membership?.packageId);
    return pkg ? `${pkg.name} - ${userData.membership.washesRemaining} lavadas` : "Paquete activo";
  };

  const accentColor = isDark ? Colors.accent : Colors.primary;

  const menuItems: MenuItemData[] = [
    {
      icon: "user",
      title: "Mi Perfil",
      subtitle: "Nombre, teléfono, correo",
      color: accentColor,
      screen: "Profile",
    },
    {
      icon: "map-pin",
      title: "Direcciones",
      subtitle: addressCount > 0
        ? `${addressCount} dirección${addressCount > 1 ? "es" : ""} guardada${addressCount > 1 ? "s" : ""}`
        : "Agregar dirección",
      color: Colors.success,
      screen: "AddressManagement",
    },
    {
      icon: "truck",
      title: "Mis Vehículos",
      subtitle: vehicleCount > 0
        ? `${vehicleCount} vehículo${vehicleCount > 1 ? "s" : ""} guardado${vehicleCount > 1 ? "s" : ""}`
        : "Agregar vehículos",
      color: Colors.warning,
      screen: "VehicleManagement",
    },
    {
      icon: "award",
      title: "Mis Paquetes",
      subtitle: getMembershipLabel(),
      color: userData?.membership ? Colors.success : Colors.error,
      screen: "MembershipDetail",
    },
  ];

  const handleItemPress = (screen: keyof RootStackParamList) => {
    Haptics.selectionAsync();
    navigation.navigate(screen as any);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: accentColor + "15" }]}>
            <Feather name="user" size={32} color={accentColor} />
          </View>
          <ThemedText type="h1">{userData?.name || "Usuario"}</ThemedText>
          {userData?.email ? (
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {userData.email}
            </ThemedText>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <Pressable
              key={item.screen}
              style={({ pressed }) => [
                styles.menuItem,
                { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => handleItemPress(item.screen)}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: item.color + "15" }]}>
                <Feather name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.menuItemText}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>{item.title}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>{item.subtitle}</ThemedText>
              </View>
              <Feather name="chevron-right" size={18} color={theme.textSecondary} />
            </Pressable>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.footer}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Sparkle Clean v1.0.0
          </ThemedText>
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
    gap: Spacing.xs,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  menuSection: {
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  menuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    flex: 1,
    gap: 2,
  },
  footer: {
    alignItems: "center",
    paddingTop: Spacing.lg,
  },
});
