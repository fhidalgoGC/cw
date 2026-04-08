import React, { useCallback, useState } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert, Modal, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import {
  SavedVehicle,
  VehicleSize,
  getVehicleName,
  getSavedVehicles,
  saveVehicle,
  deleteVehicle,
} from "@/lib/storage";

import vehicleSmall from "../../assets/images/vehicle-small.png";
import vehicleSuv from "../../assets/images/vehicle-suv.png";
import vehicleLarge from "../../assets/images/vehicle-large.png";

interface VehicleOption {
  size: VehicleSize;
  name: string;
  description: string;
  image: any;
}

const VEHICLE_OPTIONS: VehicleOption[] = [
  { size: "small", name: "Pequeño", description: "Sedán, Hatchback, Coupé", image: vehicleSmall },
  { size: "suv", name: "Camioneta", description: "SUV, Crossover, Van", image: vehicleSuv },
  { size: "large", name: "Grande", description: "Pickup, Camión, SUV Grande", image: vehicleLarge },
];

const VEHICLE_IMAGES: Record<VehicleSize, any> = {
  small: vehicleSmall,
  suv: vehicleSuv,
  large: vehicleLarge,
};


export default function VehicleManagementScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [vehicles, setVehicles] = useState<SavedVehicle[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newPlate, setNewPlate] = useState("");
  const [newSize, setNewSize] = useState<VehicleSize>("small");

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const v = await getSavedVehicles();
        setVehicles(v);
      };
      load();
    }, [])
  );

  const handleAddVehicle = async () => {
    if (!newBrand.trim() || !newModel.trim() || !newColor.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const vehicle = await saveVehicle({
      brand: newBrand.trim(),
      model: newModel.trim(),
      color: newColor.trim(),
      size: newSize,
      plate: newPlate.trim() || undefined,
    });
    setVehicles((prev) => [...prev, vehicle]);
    setShowAddModal(false);
    setNewBrand("");
    setNewModel("");
    setNewColor("");
    setNewPlate("");
    setNewSize("small");
  };

  const handleRemoveVehicle = (vehicleId: string, vehicleLabel: string) => {
    Alert.alert(
      "Eliminar Vehículo",
      `¿Eliminar "${vehicleLabel}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteVehicle(vehicleId);
            setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
          },
        },
      ]
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
        {vehicles.length > 0 ? (
          <Animated.View layout={Layout} style={styles.vehiclesList}>
            {vehicles.map((vehicle, index) => (
              <Animated.View
                key={vehicle.id}
                entering={FadeInDown.delay(index * 50).springify()}
                layout={Layout}
              >
                <View
                  style={[
                    styles.vehicleCard,
                    { backgroundColor: theme.backgroundDefault },
                  ]}
                >
                  <Image
                    source={VEHICLE_IMAGES[vehicle.size]}
                    style={styles.vehicleImage}
                    contentFit="contain"
                  />
                  <View style={styles.vehicleInfo}>
                    <ThemedText type="h3" style={{ fontSize: 16 }}>
                      {vehicle.brand ? `${vehicle.brand} ${vehicle.model || ""} ${vehicle.color || ""}`.trim() : (vehicle as any).name || "Vehículo"}
                    </ThemedText>
                    <View style={styles.vehicleMeta}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        <ThemedText type="small" style={{ fontWeight: "700", color: theme.textSecondary }}>Tamaño:</ThemedText> {getVehicleName(vehicle.size)}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.md }}>
                        <ThemedText type="small" style={{ fontWeight: "700", color: theme.textSecondary }}>Placa:</ThemedText> {vehicle.plate || "—"}
                      </ThemedText>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleRemoveVehicle(vehicle.id, `${vehicle.brand} ${vehicle.model}`)}
                    style={styles.removeButton}
                  >
                    <Feather name="trash-2" size={18} color={Colors.error} />
                  </Pressable>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="truck" size={40} color={theme.textSecondary + "60"} />
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.md }}>
              No tienes vehículos guardados
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary + "80", textAlign: "center" }}>
              Agrega un vehículo para reservar más rápido
            </ThemedText>
          </View>
        )}

        <Pressable
          onPress={() => setShowAddModal(true)}
          style={[styles.addButton, { borderColor: theme.backgroundTertiary }]}
        >
          <Feather name="plus" size={18} color={isDark ? Colors.accent : Colors.primary} />
          <ThemedText type="body" style={{ color: isDark ? Colors.accent : Colors.primary, fontWeight: "600" }}>
            Agregar Vehículo
          </ThemedText>
        </Pressable>
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <ThemedText type="h2">Registrar Vehículo</ThemedText>
            <Pressable onPress={() => setShowAddModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            <View style={styles.inputGroup}>
              <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Marca
              </ThemedText>
              <TextInput
                value={newBrand}
                onChangeText={setNewBrand}
                placeholder="Honda, Toyota, BMW..."
                placeholderTextColor={theme.textSecondary + "80"}
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.backgroundTertiary }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Modelo
              </ThemedText>
              <TextInput
                value={newModel}
                onChangeText={setNewModel}
                placeholder="Civic 2023, Corolla 2024..."
                placeholderTextColor={theme.textSecondary + "80"}
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.backgroundTertiary }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Color
              </ThemedText>
              <TextInput
                value={newColor}
                onChangeText={setNewColor}
                placeholder="Blanco, Negro, Rojo..."
                placeholderTextColor={theme.textSecondary + "80"}
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.backgroundTertiary }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Placa (opcional)
              </ThemedText>
              <TextInput
                value={newPlate}
                onChangeText={setNewPlate}
                placeholder="ABC-1234"
                placeholderTextColor={theme.textSecondary + "80"}
                autoCapitalize="characters"
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.backgroundTertiary }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
                Tamaño del Vehículo
              </ThemedText>
              <View style={styles.sizeCardsContainer}>
                {VEHICLE_OPTIONS.map((opt) => {
                  const isActive = newSize === opt.size;
                  return (
                    <Pressable
                      key={opt.size}
                      onPress={() => setNewSize(opt.size)}
                      style={[
                        styles.sizeCard,
                        {
                          backgroundColor: isActive
                            ? isDark
                              ? "rgba(6, 182, 212, 0.15)"
                              : "rgba(30, 64, 175, 0.08)"
                            : theme.backgroundDefault,
                          borderColor: isActive
                            ? isDark
                              ? Colors.accent
                              : Colors.primary
                            : theme.backgroundTertiary,
                        },
                      ]}
                    >
                      <Image
                        source={opt.image}
                        style={styles.sizeCardImage}
                        contentFit="contain"
                      />
                      <View style={styles.sizeCardInfo}>
                        <ThemedText type="h3" style={{ fontSize: 15 }}>{opt.name}</ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary, fontSize: 11 }}>
                          {opt.description}
                        </ThemedText>
                      </View>
                      <Feather
                        name={isActive ? "check-circle" : "circle"}
                        size={20}
                        color={isActive ? (isDark ? Colors.accent : Colors.primary) : theme.backgroundTertiary}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <Button
              onPress={handleAddVehicle}
              disabled={!newBrand.trim() || !newModel.trim() || !newColor.trim()}
              style={styles.saveButton}
            >
              Guardar Vehículo
            </Button>
          </View>
        </View>
      </Modal>
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
    paddingTop: Spacing.xl,
  },
  vehiclesList: {
    gap: Spacing.md,
  },
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  vehicleImage: {
    width: 64,
    height: 48,
    marginRight: Spacing.lg,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 4,
  },
  removeButton: {
    padding: Spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
    borderRadius: BorderRadius.lg,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  inputGroup: {},
  input: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
  },
  sizeCardsContainer: {
    gap: Spacing.sm,
  },
  sizeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  sizeCardImage: {
    width: 52,
    height: 38,
    marginRight: Spacing.md,
  },
  sizeCardInfo: {
    flex: 1,
  },
  modalFooter: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
});
