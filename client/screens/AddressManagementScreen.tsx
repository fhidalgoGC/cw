import React, { useCallback, useState } from "react";
import { StyleSheet, View, TextInput, Alert } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
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
import { getUserData, saveUserData, UserData } from "@/lib/storage";

export default function AddressManagementScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    const data = await getUserData();
    setUserData(data);
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
        address:
          street.trim() || city.trim() || zipCode.trim()
            ? {
                street: street.trim(),
                city: city.trim(),
                zipCode: zipCode.trim(),
              }
            : undefined,
      };
      await saveUserData(updatedData);
      setUserData(updatedData);
      Alert.alert("Guardado", "Tu dirección ha sido actualizada", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    }
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
              Dirección de Servicio
            </ThemedText>
            <ThemedText
              type="caption"
              style={[styles.description, { color: theme.textSecondary }]}
            >
              Esta dirección se usará para el servicio de lavado a domicilio.
            </ThemedText>

            <View style={styles.form}>
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
            </View>
          </Card>
        </Animated.View>

        <Button onPress={handleSave} style={styles.saveButton}>
          Guardar Dirección
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
    marginBottom: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.lg,
  },
  form: {
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
  rowInputs: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  saveButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
  },
});
