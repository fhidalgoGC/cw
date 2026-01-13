import React, { useCallback, useState } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn, Layout } from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import {
  getUserData,
  saveUserData,
  UserData,
  SavedVehicle,
  VehicleSize,
  getVehicleName,
} from "@/lib/storage";

export default function VehicleManagementScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicleName, setNewVehicleName] = useState("");
  const [newVehicleSize, setNewVehicleSize] = useState<VehicleSize>("small");
  const [newVehiclePlate, setNewVehiclePlate] = useState("");

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

  const handleAddVehicle = async () => {
    if (!newVehicleName.trim()) {
      Alert.alert("Error", "Por favor ingresa un nombre para el vehículo");
      return;
    }
    if (userData) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newVehicle: SavedVehicle = {
        id: Date.now().toString(),
        name: newVehicleName.trim(),
        size: newVehicleSize,
        plate: newVehiclePlate.trim() || undefined,
      };
      const updatedData: UserData = {
        ...userData,
        vehicles: [...(userData.vehicles || []), newVehicle],
      };
      await saveUserData(updatedData);
      setUserData(updatedData);
      setNewVehicleName("");
      setNewVehiclePlate("");
      setNewVehicleSize("small");
      setShowAddForm(false);
    }
  };

  const handleRemoveVehicle = (vehicleId: string, vehicleName: string) => {
    Alert.alert(
      "Eliminar Vehículo",
      `¿Estás seguro de eliminar "${vehicleName}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            if (userData) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              const updatedData: UserData = {
                ...userData,
                vehicles: userData.vehicles.filter((v) => v.id !== vehicleId),
              };
              await saveUserData(updatedData);
              setUserData(updatedData);
            }
          },
        },
      ]
    );
  };

  const getVehicleIcon = (size: VehicleSize): keyof typeof Feather.glyphMap => {
    switch (size) {
      case "small":
        return "circle";
      case "suv":
        return "truck";
      case "large":
        return "truck";
      default:
        return "truck";
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.skeleton, { backgroundColor: theme.backgroundSecondary }]} />
      </ThemedView>
    );
  }

  const vehicles = userData?.vehicles || [];

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
              <ThemedText type="h3">Mis Vehículos</ThemedText>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowAddForm(!showAddForm);
                }}
                style={[
                  styles.addButton,
                  { backgroundColor: isDark ? Colors.accent + "30" : Colors.primary + "15" },
                ]}
              >
                <Feather
                  name={showAddForm ? "x" : "plus"}
                  size={20}
                  color={isDark ? Colors.accent : Colors.primary}
                />
              </Pressable>
            </View>

            {showAddForm ? (
              <Animated.View entering={FadeIn} style={styles.addForm}>
                <View style={styles.inputGroup}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Nombre del Vehículo
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
                    value={newVehicleName}
                    onChangeText={setNewVehicleName}
                    placeholder="Mi Auto"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Placa (opcional)
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
                    value={newVehiclePlate}
                    onChangeText={setNewVehiclePlate}
                    placeholder="ABC-123"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="characters"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Tamaño del Vehículo
                  </ThemedText>
                  <View style={styles.sizeOptions}>
                    {(["small", "suv", "large"] as VehicleSize[]).map((size) => (
                      <Pressable
                        key={size}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setNewVehicleSize(size);
                        }}
                        style={[
                          styles.sizeOption,
                          {
                            backgroundColor:
                              newVehicleSize === size
                                ? isDark
                                  ? Colors.accent
                                  : Colors.primary
                                : theme.backgroundSecondary,
                            borderColor:
                              newVehicleSize === size
                                ? isDark
                                  ? Colors.accent
                                  : Colors.primary
                                : theme.backgroundTertiary,
                          },
                        ]}
                      >
                        <ThemedText
                          type="caption"
                          style={{
                            color: newVehicleSize === size ? "#FFFFFF" : theme.text,
                            fontWeight: newVehicleSize === size ? "600" : "400",
                          }}
                        >
                          {getVehicleName(size)}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <Button onPress={handleAddVehicle} style={styles.addVehicleButton}>
                  Agregar Vehículo
                </Button>
              </Animated.View>
            ) : null}

            {vehicles.length > 0 ? (
              <Animated.View layout={Layout} style={styles.vehiclesList}>
                {vehicles.map((vehicle, index) => (
                  <Animated.View
                    key={vehicle.id}
                    entering={FadeInDown.delay(index * 50)}
                    layout={Layout}
                    style={[
                      styles.vehicleItem,
                      { backgroundColor: theme.backgroundSecondary },
                    ]}
                  >
                    <View style={styles.vehicleInfo}>
                      <View
                        style={[
                          styles.vehicleIcon,
                          { backgroundColor: isDark ? Colors.accent + "20" : Colors.primary + "15" },
                        ]}
                      >
                        <Feather
                          name={getVehicleIcon(vehicle.size)}
                          size={20}
                          color={isDark ? Colors.accent : Colors.primary}
                        />
                      </View>
                      <View style={styles.vehicleText}>
                        <ThemedText type="body" style={{ fontWeight: "600" }}>
                          {vehicle.name}
                        </ThemedText>
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          {getVehicleName(vehicle.size)}
                          {vehicle.plate ? ` - ${vehicle.plate}` : ""}
                        </ThemedText>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => handleRemoveVehicle(vehicle.id, vehicle.name)}
                      style={styles.removeButton}
                    >
                      <Feather name="trash-2" size={18} color={Colors.error} />
                    </Pressable>
                  </Animated.View>
                ))}
              </Animated.View>
            ) : !showAddForm ? (
              <View style={styles.emptyState}>
                <Feather
                  name="truck"
                  size={48}
                  color={theme.textSecondary}
                  style={{ opacity: 0.5 }}
                />
                <ThemedText
                  type="body"
                  style={[styles.emptyText, { color: theme.textSecondary }]}
                >
                  No tienes vehículos guardados
                </ThemedText>
                <ThemedText
                  type="caption"
                  style={[styles.emptySubtext, { color: theme.textSecondary }]}
                >
                  Agrega un vehículo para reservar más rápido
                </ThemedText>
              </View>
            ) : null}
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  addForm: {
    marginBottom: Spacing.lg,
    gap: Spacing.md,
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
  sizeOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  sizeOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    borderWidth: 1,
  },
  addVehicleButton: {
    backgroundColor: Colors.primary,
    marginTop: Spacing.sm,
  },
  vehiclesList: {
    gap: Spacing.sm,
  },
  vehicleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  vehicleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleText: {
    flex: 1,
  },
  removeButton: {
    padding: Spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    marginTop: Spacing.md,
  },
  emptySubtext: {
    textAlign: "center",
  },
});
