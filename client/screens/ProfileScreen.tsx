import React, { useCallback, useState } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getUserData, saveUserData, UserData, PACKAGES, getSavedAddresses } from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, "Profile">;

interface MenuItemProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  color?: string;
}

function MenuItem({ icon, title, subtitle, onPress, color }: MenuItemProps) {
  const { theme, isDark } = useTheme();
  const iconColor = color || (isDark ? Colors.accent : Colors.primary);

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.menuItem,
        { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={[styles.menuIcon, { backgroundColor: iconColor + "20" }]}>
        <Feather name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.menuContent}>
        <ThemedText type="body" style={{ fontWeight: "600" }}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [addressCount, setAddressCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
      loadAddressCount();
    }, [])
  );

  const loadAddressCount = async () => {
    const addrs = await getSavedAddresses();
    setAddressCount(addrs.length);
  };

  const loadUserData = async () => {
    const data = await getUserData();
    setUserData(data);
    setName(data.name);
    setPhone(data.phone || "");
    setEmail(data.email || "");
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (userData) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const updatedData: UserData = {
        ...userData,
        name: name.trim() || "Usuario",
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      };
      await saveUserData(updatedData);
      setUserData(updatedData);
      setIsEditing(false);
    }
  };

  const getAddressSubtitle = () => {
    if (addressCount === 0) return "Agregar dirección";
    return `${addressCount} dirección${addressCount > 1 ? "es" : ""} guardada${addressCount > 1 ? "s" : ""}`;
  };

  const getVehiclesSubtitle = () => {
    if (!userData?.vehicles || userData.vehicles.length === 0) {
      return "Agregar vehículos";
    }
    return `${userData.vehicles.length} vehículo${userData.vehicles.length > 1 ? "s" : ""} guardado${userData.vehicles.length > 1 ? "s" : ""}`;
  };

  const getMembershipSubtitle = () => {
    if (!userData?.membership) return "Sin paquete activo";
    const pkg = PACKAGES.find((p) => p.id === userData.membership?.packageId);
    if (pkg) {
      return `${pkg.name} - ${userData.membership.washesRemaining} lavadas restantes`;
    }
    return "Paquete activo";
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.skeleton, { backgroundColor: theme.backgroundSecondary }]} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <Card elevation={1} style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3">Información Personal</ThemedText>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}
                style={[
                  styles.editButton,
                  { backgroundColor: isDark ? Colors.accent + "30" : Colors.primary + "15" },
                ]}
              >
                <ThemedText
                  type="caption"
                  style={{
                    color: isDark ? Colors.accent : Colors.primary,
                    fontWeight: "600",
                  }}
                >
                  {isEditing ? "Guardar" : "Editar"}
                </ThemedText>
              </Pressable>
            </View>

            {isEditing ? (
              <View style={styles.editForm}>
                <View style={styles.inputGroup}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Nombre
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.backgroundDefault,
                        color: theme.text,
                        borderColor: theme.backgroundTertiary,
                      },
                    ]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Tu nombre"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Teléfono
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.backgroundDefault,
                        color: theme.text,
                        borderColor: theme.backgroundTertiary,
                      },
                    ]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Tu teléfono"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Correo
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.backgroundDefault,
                        color: theme.text,
                        borderColor: theme.backgroundTertiary,
                      },
                    ]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="tu@email.com"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.infoDisplay}>
                <View style={styles.infoRow}>
                  <Feather name="user" size={18} color={theme.textSecondary} />
                  <ThemedText type="body">{userData?.name || "Usuario"}</ThemedText>
                </View>
                {phone ? (
                  <View style={styles.infoRow}>
                    <Feather name="phone" size={18} color={theme.textSecondary} />
                    <ThemedText type="body">{phone}</ThemedText>
                  </View>
                ) : null}
                {email ? (
                  <View style={styles.infoRow}>
                    <Feather name="mail" size={18} color={theme.textSecondary} />
                    <ThemedText type="body">{email}</ThemedText>
                  </View>
                ) : null}
              </View>
            )}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Card elevation={1} style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Mis Datos
            </ThemedText>
            <View style={styles.menuList}>
              <MenuItem
                icon="map-pin"
                title="Direcciones"
                subtitle={getAddressSubtitle()}
                onPress={() => navigation.navigate("AddressManagement")}
              />
              <MenuItem
                icon="truck"
                title="Mis Vehículos"
                subtitle={getVehiclesSubtitle()}
                onPress={() => navigation.navigate("VehicleManagement")}
              />
              <MenuItem
                icon="award"
                title="Mis Paquetes"
                subtitle={getMembershipSubtitle()}
                onPress={() => navigation.navigate("MembershipDetail")}
                color={userData?.membership ? Colors.success : undefined}
              />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Card elevation={1} style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Información
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Versión 1.0.0
            </ThemedText>
          </Card>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>
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
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  skeleton: {
    margin: Spacing.xl,
    height: 200,
    borderRadius: BorderRadius.lg,
  },
  section: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  editButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  editForm: {
    gap: Spacing.sm,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    ...Typography.body,
  },
  infoDisplay: {
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  menuList: {
    gap: Spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  menuContent: {
    flex: 1,
  },
});
