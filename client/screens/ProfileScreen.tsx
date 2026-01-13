import React, { useCallback, useState } from "react";
import { StyleSheet, View, TextInput, Alert, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
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
import {
  getUserData,
  saveUserData,
  UserData,
  SavedVehicle,
  VehicleSize,
  getVehicleName,
} from "@/lib/storage";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
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
    setName(data.name);
    setPhone(data.phone || "");
    setEmail(data.email || "");
    setStreet(data.address?.street || "");
    setCity(data.address?.city || "");
    setZipCode(data.address?.zipCode || "");
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
        address: street.trim() || city.trim() || zipCode.trim()
          ? { street: street.trim(), city: city.trim(), zipCode: zipCode.trim() }
          : undefined,
      };
      await saveUserData(updatedData);
      setUserData(updatedData);
      Alert.alert("Guardado", "Tu perfil ha sido actualizado");
    }
  };

  const handleAddVehicle = async () => {
    if (!newVehicleName.trim()) {
      Alert.alert("Error", "Por favor ingresa un nombre para el vehículo");
      return;
    }
    if (userData) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      setShowAddVehicle(false);
    }
  };

  const handleRemoveVehicle = (vehicleId: string) => {
    Alert.alert("Eliminar Vehículo", "¿Estás seguro de eliminar este vehículo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          if (userData) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const updatedData: UserData = {
              ...userData,
              vehicles: userData.vehicles.filter((v) => v.id !== vehicleId),
            };
            await saveUserData(updatedData);
            setUserData(updatedData);
          }
        },
      },
    ]);
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
            <ThemedText type="h3" style={styles.sectionTitle}>
              Información Personal
            </ThemedText>
            <View style={styles.inputGroup}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Nombre
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
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
                    backgroundColor: theme.backgroundSecondary,
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
                Correo Electrónico
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
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
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Card elevation={1} style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Dirección
            </ThemedText>
            <View style={styles.inputGroup}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Calle y Número
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.backgroundTertiary,
                  },
                ]}
                value={street}
                onChangeText={setStreet}
                placeholder="Av. Principal #123"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Ciudad
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                      borderColor: theme.backgroundTertiary,
                    },
                  ]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Ciudad"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  C.P.
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                      borderColor: theme.backgroundTertiary,
                    },
                  ]}
                  value={zipCode}
                  onChangeText={setZipCode}
                  placeholder="00000"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Card elevation={1} style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3">Mis Vehículos</ThemedText>
              <Pressable
                onPress={() => setShowAddVehicle(!showAddVehicle)}
                style={[
                  styles.addButton,
                  { backgroundColor: isDark ? Colors.accent + "30" : Colors.primary + "15" },
                ]}
              >
                <Feather
                  name={showAddVehicle ? "x" : "plus"}
                  size={20}
                  color={isDark ? Colors.accent : Colors.primary}
                />
              </Pressable>
            </View>

            {showAddVehicle ? (
              <View style={styles.addVehicleForm}>
                <View style={styles.inputGroup}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Nombre del Vehículo
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.backgroundSecondary,
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
                        backgroundColor: theme.backgroundSecondary,
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
                    Tamaño
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
              </View>
            ) : null}

            {userData?.vehicles && userData.vehicles.length > 0 ? (
              <View style={styles.vehiclesList}>
                {userData.vehicles.map((vehicle) => (
                  <View
                    key={vehicle.id}
                    style={[
                      styles.vehicleItem,
                      { backgroundColor: theme.backgroundSecondary },
                    ]}
                  >
                    <View style={styles.vehicleInfo}>
                      <Feather
                        name="truck"
                        size={20}
                        color={isDark ? Colors.accent : Colors.primary}
                      />
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
                      onPress={() => handleRemoveVehicle(vehicle.id)}
                      style={styles.removeButton}
                    >
                      <Feather name="trash-2" size={18} color={Colors.error} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : !showAddVehicle ? (
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                No tienes vehículos guardados. Agrega uno para reservar más rápido.
              </ThemedText>
            ) : null}
          </Card>
        </Animated.View>

        <Button onPress={handleSave} style={styles.saveButton}>
          Guardar Cambios
        </Button>
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
  inputGroup: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    ...Typography.body,
  },
  rowInputs: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  addVehicleForm: {
    marginBottom: Spacing.md,
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
  vehicleText: {
    flex: 1,
  },
  removeButton: {
    padding: Spacing.sm,
  },
  saveButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
  },
});
