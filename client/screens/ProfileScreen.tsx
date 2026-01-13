import React, { useCallback, useState } from "react";
import { StyleSheet, View, TextInput, Alert } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getUserData, saveUserData, UserData } from "@/lib/storage";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    const data = await getUserData();
    setUserData(data);
    setName(data.name);
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (userData) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const updatedData = { ...userData, name: name.trim() || "Usuario" };
      await saveUserData(updatedData);
      setUserData(updatedData);
      Alert.alert("Guardado", "Tu perfil ha sido actualizado");
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
        </Card>

        {userData?.hasSubscription ? (
          <Card
            elevation={2}
            style={[
              styles.section,
              { backgroundColor: isDark ? Colors.primary : "#EEF2FF" },
            ]}
          >
            <ThemedText
              type="h3"
              style={{ color: isDark ? "#FFFFFF" : Colors.primary }}
            >
              Pase Premium Activo
            </ThemedText>
            <ThemedText
              type="body"
              style={[
                styles.subscriptionText,
                { color: isDark ? "#E0E7FF" : "#4338CA" },
              ]}
            >
              {userData.subscriptionWashesLeft} de 20 lavadas restantes este mes
            </ThemedText>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(userData.subscriptionWashesLeft / 20) * 100}%`,
                    backgroundColor: isDark ? Colors.accent : Colors.primary,
                  },
                ]}
              />
            </View>
          </Card>
        ) : (
          <Card elevation={1} style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Suscripción
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              No tienes una suscripción activa. Obtén el Pase de 20 Lavadas para
              ahorrar hasta 40% en tus lavados.
            </ThemedText>
          </Card>
        )}

        <Card elevation={1} style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Información
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Versión 1.0.0
          </ThemedText>
        </Card>

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
  subscriptionText: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  saveButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
  },
});
