import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  updateBooking,
  formatDate,
  formatPrice,
  getVehicleName,
  getWashTypeName,
  ADD_ONS,
  Booking,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "AppointmentDetail">;

export default function AppointmentDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [booking, setBooking] = useState<Booking>(route.params.booking);
  const [isCancelling, setIsCancelling] = useState(false);

  const selectedAddOns = ADD_ONS.filter((a) => booking.addOns.includes(a.id));

  const getStatusColor = () => {
    switch (booking.status) {
      case "upcoming":
        return Colors.success;
      case "completed":
        return Colors.accent;
      case "cancelled":
        return Colors.error;
      default:
        return theme.textSecondary;
    }
  };

  const getStatusText = () => {
    switch (booking.status) {
      case "upcoming":
        return "Confirmada";
      case "completed":
        return "Completada";
      case "cancelled":
        return "Cancelada";
      default:
        return "";
    }
  };

  const handleReschedule = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Reprogramar Cita",
      "Para reprogramar tu cita, cancela esta y crea una nueva reservación.",
      [{ text: "Entendido" }]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancelar Cita",
      "¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.",
      [
        { text: "No, mantener", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: confirmCancel,
        },
      ]
    );
  };

  const confirmCancel = async () => {
    setIsCancelling(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    const updatedBooking: Booking = { ...booking, status: "cancelled" };
    await updateBooking(updatedBooking);
    setBooking(updatedBooking);

    setIsCancelling(false);
    Alert.alert("Cita Cancelada", "Tu cita ha sido cancelada exitosamente.");
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
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: `${getStatusColor()}15` },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
            />
            <ThemedText type="h3" style={{ color: getStatusColor() }}>
              {getStatusText()}
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Card elevation={1} style={styles.detailsCard}>
            <ThemedText type="h2" style={styles.cardTitle}>
              Detalles del Servicio
            </ThemedText>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Feather
                  name="truck"
                  size={20}
                  color={isDark ? Colors.accent : Colors.primary}
                />
              </View>
              <View style={styles.detailContent}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Vehículo
                </ThemedText>
                <ThemedText type="body">
                  {getVehicleName(booking.vehicleSize)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Feather
                  name="droplet"
                  size={20}
                  color={isDark ? Colors.accent : Colors.primary}
                />
              </View>
              <View style={styles.detailContent}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Tipo de Lavado
                </ThemedText>
                <ThemedText type="body">
                  {getWashTypeName(booking.washType)}
                </ThemedText>
              </View>
            </View>

            {selectedAddOns.length > 0 ? (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Feather
                    name="plus-circle"
                    size={20}
                    color={isDark ? Colors.accent : Colors.primary}
                  />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Servicios Adicionales
                  </ThemedText>
                  <ThemedText type="body">
                    {selectedAddOns.map((a) => a.name).join(", ")}
                  </ThemedText>
                </View>
              </View>
            ) : null}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Card elevation={1} style={styles.detailsCard}>
            <ThemedText type="h2" style={styles.cardTitle}>
              Fecha y Hora
            </ThemedText>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Feather
                  name="calendar"
                  size={20}
                  color={isDark ? Colors.accent : Colors.primary}
                />
              </View>
              <View style={styles.detailContent}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Fecha
                </ThemedText>
                <ThemedText type="body">{formatDate(booking.date)}</ThemedText>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Feather
                  name="clock"
                  size={20}
                  color={isDark ? Colors.accent : Colors.primary}
                />
              </View>
              <View style={styles.detailContent}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Hora
                </ThemedText>
                <ThemedText type="body">{booking.time}</ThemedText>
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Card elevation={2} style={styles.priceCard}>
            <View style={styles.priceRow}>
              <ThemedText type="body">Total Pagado</ThemedText>
              <ThemedText
                type="h1"
                style={{ color: isDark ? Colors.accent : Colors.primary }}
              >
                {formatPrice(booking.totalPrice)}
              </ThemedText>
            </View>
          </Card>
        </Animated.View>

        {booking.status === "upcoming" ? (
          <Animated.View
            entering={FadeInDown.delay(250).springify()}
            style={styles.actionsContainer}
          >
            <Button
              onPress={handleReschedule}
              style={[styles.rescheduleButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              Reprogramar Cita
            </Button>
            <Button
              onPress={handleCancel}
              disabled={isCancelling}
              style={[styles.cancelButton, { backgroundColor: `${Colors.error}15` }]}
            >
              {isCancelling ? "Cancelando..." : "Cancelar Cita"}
            </Button>
          </Animated.View>
        ) : null}
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
    padding: Spacing.xl,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  detailsCard: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  priceCard: {
    marginBottom: Spacing.xl,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionsContainer: {
    gap: Spacing.md,
  },
  rescheduleButton: {
    backgroundColor: "transparent",
  },
  cancelButton: {
    backgroundColor: "transparent",
  },
});
