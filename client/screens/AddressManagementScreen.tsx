import React, { useCallback, useState } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert, Modal, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
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
  SavedAddress,
  getSavedAddresses,
  saveAddress,
  deleteAddress,
} from "@/lib/storage";

export default function AddressManagementScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAlias, setNewAlias] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newColony, setNewColony] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newReference, setNewReference] = useState("");

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const addrs = await getSavedAddresses();
        setAddresses(addrs);
      };
      load();
    }, [])
  );

  const handleAddAddress = async () => {
    if (!newAlias.trim() || !newStreet.trim() || !newColony.trim() || !newCity.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const addr = await saveAddress({
      alias: newAlias.trim(),
      street: newStreet.trim(),
      colony: newColony.trim(),
      city: newCity.trim(),
      reference: newReference.trim() || undefined,
    });
    setAddresses((prev) => [...prev, addr]);
    setShowAddModal(false);
    setNewAlias("");
    setNewStreet("");
    setNewColony("");
    setNewCity("");
    setNewReference("");
  };

  const handleRemoveAddress = (addressId: string, alias: string) => {
    Alert.alert(
      "Eliminar Dirección",
      `¿Eliminar "${alias}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteAddress(addressId);
            setAddresses((prev) => prev.filter((a) => a.id !== addressId));
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
        {addresses.length > 0 ? (
          <Animated.View layout={Layout} style={styles.addressList}>
            {addresses.map((addr, index) => (
              <Animated.View
                key={addr.id}
                entering={FadeInDown.delay(index * 50).springify()}
                layout={Layout}
              >
                <View
                  style={[
                    styles.addressCard,
                    { backgroundColor: theme.backgroundDefault },
                  ]}
                >
                  <View style={[styles.addressIconContainer, { backgroundColor: (isDark ? Colors.accent : Colors.primary) + "15" }]}>
                    <Feather name="map-pin" size={20} color={isDark ? Colors.accent : Colors.primary} />
                  </View>
                  <View style={styles.addressInfo}>
                    <ThemedText type="h3" style={{ fontSize: 16 }}>
                      {addr.alias}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {addr.street}, {addr.colony}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {addr.city}
                      {addr.reference ? ` - ${addr.reference}` : ""}
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => handleRemoveAddress(addr.id, addr.alias)}
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
            <Feather name="map-pin" size={40} color={theme.textSecondary + "60"} />
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.md }}>
              No tienes direcciones guardadas
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary + "80", textAlign: "center" }}>
              Agrega una dirección para el servicio a domicilio
            </ThemedText>
          </View>
        )}

        <Pressable
          onPress={() => setShowAddModal(true)}
          style={[styles.addButton, { borderColor: theme.backgroundTertiary }]}
        >
          <Feather name="plus" size={18} color={isDark ? Colors.accent : Colors.primary} />
          <ThemedText type="body" style={{ color: isDark ? Colors.accent : Colors.primary, fontWeight: "600" }}>
            Agregar Dirección
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
            <ThemedText type="h2">Registrar Dirección</ThemedText>
            <Pressable onPress={() => setShowAddModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            <View style={styles.inputGroup}>
              <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Nombre de la dirección
              </ThemedText>
              <TextInput
                value={newAlias}
                onChangeText={setNewAlias}
                placeholder="Casa, Oficina, Trabajo..."
                placeholderTextColor={theme.textSecondary + "80"}
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.backgroundTertiary }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Calle y número
              </ThemedText>
              <TextInput
                value={newStreet}
                onChangeText={setNewStreet}
                placeholder="Av. Reforma 123"
                placeholderTextColor={theme.textSecondary + "80"}
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.backgroundTertiary }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Colonia
              </ThemedText>
              <TextInput
                value={newColony}
                onChangeText={setNewColony}
                placeholder="Col. Centro"
                placeholderTextColor={theme.textSecondary + "80"}
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.backgroundTertiary }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Ciudad
              </ThemedText>
              <TextInput
                value={newCity}
                onChangeText={setNewCity}
                placeholder="Ciudad de México"
                placeholderTextColor={theme.textSecondary + "80"}
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.backgroundTertiary }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Referencia (opcional)
              </ThemedText>
              <TextInput
                value={newReference}
                onChangeText={setNewReference}
                placeholder="Portón azul, junto a la farmacia..."
                placeholderTextColor={theme.textSecondary + "80"}
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.backgroundTertiary }]}
              />
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <Button
              onPress={handleAddAddress}
              disabled={!newAlias.trim() || !newStreet.trim() || !newColony.trim() || !newCity.trim()}
              style={styles.saveButton}
            >
              Guardar Dirección
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
  addressList: {
    gap: Spacing.md,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  addressIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  addressInfo: {
    flex: 1,
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
  modalFooter: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
});
