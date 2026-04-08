import React, { useState, useCallback } from "react";
import { StyleSheet, View, Pressable, ScrollView, Modal, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  VehicleSize,
  SavedVehicle,
  getSavedVehicles,
  saveVehicle,
  getVehicleName,
} from "@/lib/storage";

import vehicleSmall from "../../assets/images/vehicle-small.png";
import vehicleSuv from "../../assets/images/vehicle-suv.png";
import vehicleLarge from "../../assets/images/vehicle-large.png";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "VehicleSelection">;

interface VehicleOption {
  size: VehicleSize;
  name: string;
  description: string;
  image: any;
}

const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    size: "small",
    name: "Pequeño",
    description: "Sedán, Hatchback, Coupé",
    image: vehicleSmall,
  },
  {
    size: "suv",
    name: "Camioneta",
    description: "SUV, Crossover, Van",
    image: vehicleSuv,
  },
  {
    size: "large",
    name: "Grande",
    description: "Pickup, Camión, SUV Grande",
    image: vehicleLarge,
  },
];

const VEHICLE_IMAGES: Record<VehicleSize, any> = {
  small: vehicleSmall,
  suv: vehicleSuv,
  large: vehicleLarge,
};

const COLOR_MAP: Record<string, string> = {
  blanco: "#F5F5F5",
  negro: "#1A1A1A",
  gris: "#9E9E9E",
  plata: "#C0C0C0",
  rojo: "#E53935",
  azul: "#1E88E5",
  verde: "#43A047",
  amarillo: "#FDD835",
  naranja: "#FB8C00",
  café: "#795548",
  beige: "#D7CCC8",
  dorado: "#FFD54F",
};

function getColorDot(colorName: string): string {
  const lower = colorName.toLowerCase();
  return COLOR_MAP[lower] || "#9E9E9E";
}

export default function VehicleSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedSize, setSelectedSize] = useState<VehicleSize | null>(null);
  const [savedVehicles, setSavedVehicles] = useState<SavedVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newPlate, setNewPlate] = useState("");
  const [newSize, setNewSize] = useState<VehicleSize>("small");

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const vehicles = await getSavedVehicles();
        setSavedVehicles(vehicles);
      };
      load();
    }, [])
  );

  const handleSelectSaved = (vehicle: SavedVehicle) => {
    Haptics.selectionAsync();
    setSelectedVehicleId(vehicle.id);
    setSelectedSize(vehicle.size);
  };

  const handleContinue = () => {
    if (selectedSize && selectedVehicleId) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate("ServiceCustomization", { vehicleSize: selectedSize });
    }
  };

  const handleAddVehicle = async () => {
    if (!newBrand.trim() || !newModel.trim() || !newColor.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const vehicle = await saveVehicle({
      brand: newBrand.trim(),
      model: newModel.trim(),
      color: newColor.trim(),
      size: newSize,
      plate: newPlate.trim() || undefined,
    });
    setSavedVehicles((prev) => [...prev, vehicle]);
    setShowAddModal(false);
    setNewBrand("");
    setNewModel("");
    setNewColor("");
    setNewPlate("");
    setNewSize("small");
    setSelectedVehicleId(vehicle.id);
    setSelectedSize(vehicle.size);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <ThemedText type="h2" style={styles.sectionTitle}>
            Mis Vehículos
          </ThemedText>

          {savedVehicles.length > 0 ? (
            <View style={styles.optionsContainer}>
              {savedVehicles.map((vehicle, index) => {
                const isSelected = selectedVehicleId === vehicle.id;
                return (
                  <Animated.View
                    key={vehicle.id}
                    entering={FadeInDown.delay(100 + index * 50).springify()}
                  >
                    <Pressable
                      onPress={() => handleSelectSaved(vehicle)}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? "rgba(6, 182, 212, 0.15)"
                              : "rgba(30, 64, 175, 0.08)"
                            : theme.backgroundDefault,
                          borderColor: isSelected
                            ? isDark
                              ? Colors.accent
                              : Colors.primary
                            : "transparent",
                        },
                      ]}
                    >
                      <Image
                        source={VEHICLE_IMAGES[vehicle.size]}
                        style={styles.vehicleImage}
                        contentFit="contain"
                      />
                      <View style={styles.optionInfo}>
                        <ThemedText type="h3">{vehicle.brand} {vehicle.model}</ThemedText>
                        <View style={styles.vehicleMeta}>
                          <View
                            style={[
                              styles.colorDot,
                              { backgroundColor: getColorDot(vehicle.color) },
                            ]}
                          />
                          <ThemedText type="small" style={{ color: theme.textSecondary }}>
                            {vehicle.color}
                          </ThemedText>
                          <View style={[styles.sizeBadge, { backgroundColor: (isDark ? Colors.accent : Colors.primary) + "15" }]}>
                            <ThemedText type="small" style={{ color: isDark ? Colors.accent : Colors.primary, fontWeight: "600", fontSize: 11 }}>
                              {getVehicleName(vehicle.size)}
                            </ThemedText>
                          </View>
                          {vehicle.plate ? (
                            <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                              {vehicle.plate}
                            </ThemedText>
                          ) : null}
                        </View>
                      </View>
                      <Feather
                        name={isSelected ? "check-circle" : "chevron-right"}
                        size={20}
                        color={isSelected ? (isDark ? Colors.accent : Colors.primary) : theme.textSecondary}
                      />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
              <Feather name="truck" size={40} color={theme.textSecondary + "60"} />
              <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.md }}>
                No tienes vehículos registrados
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary + "80", textAlign: "center" }}>
                Registra tu vehículo para comenzar
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
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Button
          onPress={handleContinue}
          disabled={!selectedVehicleId}
          style={styles.continueButton}
        >
          Continuar
        </Button>
      </View>

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
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundDefault,
                    color: theme.text,
                    borderColor: theme.backgroundTertiary,
                  },
                ]}
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
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundDefault,
                    color: theme.text,
                    borderColor: theme.backgroundTertiary,
                  },
                ]}
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
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundDefault,
                    color: theme.text,
                    borderColor: theme.backgroundTertiary,
                  },
                ]}
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
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundDefault,
                    color: theme.text,
                    borderColor: theme.backgroundTertiary,
                  },
                ]}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Tamaño
              </ThemedText>
              <View style={styles.sizeSelector}>
                {VEHICLE_OPTIONS.map((opt) => {
                  const isActive = newSize === opt.size;
                  return (
                    <Pressable
                      key={opt.size}
                      onPress={() => setNewSize(opt.size)}
                      style={[
                        styles.sizeOption,
                        {
                          backgroundColor: isActive
                            ? isDark
                              ? Colors.accent
                              : Colors.primary
                            : theme.backgroundDefault,
                          borderColor: isActive
                            ? isDark
                              ? Colors.accent
                              : Colors.primary
                            : theme.backgroundTertiary,
                        },
                      ]}
                    >
                      <ThemedText
                        type="small"
                        style={{
                          color: isActive ? "#FFFFFF" : theme.text,
                          fontWeight: "600",
                        }}
                      >
                        {opt.name}
                      </ThemedText>
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
              style={styles.continueButton}
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
    paddingBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  vehicleImage: {
    width: 64,
    height: 48,
    marginRight: Spacing.lg,
  },
  optionInfo: {
    flex: 1,
  },
  vehicleMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  sizeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: Spacing.xs,
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
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
    borderRadius: BorderRadius.lg,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  continueButton: {
    backgroundColor: Colors.primary,
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
  sizeSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  sizeOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  modalFooter: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
});
