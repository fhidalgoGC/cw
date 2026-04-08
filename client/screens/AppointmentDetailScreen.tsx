import React, { useState, useMemo } from "react";
import { StyleSheet, View, ScrollView, Alert, Pressable, Modal } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import vehicleSmall from "../../assets/images/vehicle-small.png";
import vehicleSuv from "../../assets/images/vehicle-suv.png";
import vehicleLarge from "../../assets/images/vehicle-large.png";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { SchedulePicker } from "@/components/SchedulePicker";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  updateBooking,
  formatDate,
  formatPrice,
  getVehicleName,
  getWashTypeName,
  ALL_SERVICES,
  VEHICLE_PRICES,
  WASH_TYPE_PRICES,
  Booking,
  VehicleSize,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "AppointmentDetail">;

const VEHICLE_IMAGES: Record<VehicleSize, any> = {
  small: vehicleSmall,
  suv: vehicleSuv,
  large: vehicleLarge,
};

function getServiceDateTime(booking: Booking): Date {
  const dateObj = new Date(booking.date);
  const match = booking.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    dateObj.setHours(hours, minutes, 0, 0);
  }
  return dateObj;
}

export default function AppointmentDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [booking, setBooking] = useState<Booking>(route.params.booking);
  const [isCancelling, setIsCancelling] = useState(false);
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  const allIncludedServices = useMemo(() => {
    const includedByWash = ALL_SERVICES.filter((s) => s.includedIn.includes(booking.washType));
    const extras = ALL_SERVICES.filter(
      (s) => booking.addOns.includes(s.id) && !s.includedIn.includes(booking.washType)
    );
    return [
      ...includedByWash.map((s) => ({ ...s, isIncluded: true })),
      ...extras.map((s) => ({ ...s, isIncluded: false })),
    ];
  }, [booking.washType, booking.addOns]);

  const canReschedule = useMemo(() => {
    if (booking.status !== "upcoming") return false;
    const serviceTime = getServiceDateTime(booking);
    const now = new Date();
    const hoursUntilService = (serviceTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilService >= 2;
  }, [booking]);

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
    if (!canReschedule) {
      Alert.alert(
        "No se puede reprogramar",
        "Solo puedes reprogramar tu cita hasta 2 horas antes del servicio.",
        [{ text: "Entendido" }]
      );
      return;
    }
    setShowRescheduleModal(true);
  };

  const handleRescheduleConfirm = async (selectedDate: Date, selectedTime: string, _reservationExpiry: number) => {
    const updatedBooking: Booking = {
      ...booking,
      date: selectedDate.toISOString(),
      time: selectedTime,
    };
    await updateBooking(updatedBooking);
    setBooking(updatedBooking);
    setShowRescheduleModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const displayDate = selectedDate.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    Alert.alert(
      "Cita reprogramada",
      `Tu cita ha sido reprogramada para el ${displayDate} a las ${selectedTime}.`,
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
          <Card elevation={1} style={styles.summaryCard}>
            <View style={styles.vehicleSummaryRow}>
              <Image
                source={VEHICLE_IMAGES[booking.vehicleSize]}
                style={styles.vehicleSummaryImage}
                contentFit="contain"
              />
              <View style={styles.vehicleSummaryInfo}>
                <ThemedText type="h3">
                  {booking.vehicleBrand && booking.vehicleModel
                    ? `${booking.vehicleBrand} ${booking.vehicleModel}`
                    : getVehicleName(booking.vehicleSize)}
                </ThemedText>
                <View style={styles.vehicleSummaryMeta}>
                  {booking.vehicleColor ? (
                    <View style={styles.vehicleMetaItem}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        Color:
                      </ThemedText>
                      <ThemedText type="small" style={{ fontWeight: "600" }}>
                        {booking.vehicleColor}
                      </ThemedText>
                    </View>
                  ) : null}
                  {booking.vehiclePlate ? (
                    <View style={styles.vehicleMetaItem}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        Placa:
                      </ThemedText>
                      <ThemedText type="small" style={{ fontWeight: "600" }}>
                        {booking.vehiclePlate}
                      </ThemedText>
                    </View>
                  ) : null}
                  <View style={styles.vehicleMetaItem}>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Tamaño:
                    </ThemedText>
                    <ThemedText type="small" style={{ fontWeight: "600" }}>
                      {getVehicleName(booking.vehicleSize)}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Tipo de Lavado
              </ThemedText>
              <View style={{ alignItems: "flex-end" }}>
                <ThemedText type="body">{getWashTypeName(booking.washType)}</ThemedText>
                <ThemedText type="small" style={{ color: Colors.success, fontWeight: "600" }}>
                  {formatPrice(VEHICLE_PRICES[booking.vehicleSize] + WASH_TYPE_PRICES[booking.washType])}
                </ThemedText>
              </View>
            </View>

            {allIncludedServices.length > 0 ? (
              <View>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setServicesExpanded(!servicesExpanded);
                  }}
                  style={styles.summaryRow}
                >
                  <View style={styles.servicesToggle}>
                    <ThemedText type="body" style={{ color: theme.textSecondary }}>
                      Servicios
                    </ThemedText>
                    <View style={[styles.servicesBadge, { backgroundColor: (isDark ? Colors.accent : Colors.primary) + "15" }]}>
                      <ThemedText type="small" style={{ color: isDark ? Colors.accent : Colors.primary, fontWeight: "600" }}>
                        {allIncludedServices.length}
                      </ThemedText>
                    </View>
                  </View>
                  <Feather
                    name={servicesExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={isDark ? Colors.accent : Colors.primary}
                  />
                </Pressable>
                {servicesExpanded ? (
                  <View style={styles.servicesExpandedList}>
                    {allIncludedServices.map((service, index) => {
                      const prevService = index > 0 ? allIncludedServices[index - 1] : null;
                      const showDivider = prevService !== null && prevService.isIncluded && !service.isIncluded;
                      return (
                        <View key={service.id}>
                          {showDivider ? (
                            <View style={styles.servicesDivider} />
                          ) : null}
                          <View style={styles.serviceItem}>
                            <View style={styles.serviceItemLeft}>
                              <Feather
                                name={service.isIncluded ? "check-circle" : "plus-circle"}
                                size={14}
                                color={service.isIncluded ? Colors.success : Colors.warning}
                              />
                              <ThemedText type="body" style={{ fontSize: 14 }}>
                                {service.name}
                              </ThemedText>
                            </View>
                            <ThemedText
                              type="small"
                              style={{
                                color: service.isIncluded ? Colors.success : Colors.warning,
                                fontWeight: "600",
                              }}
                            >
                              {service.isIncluded ? "Incluido" : `+${formatPrice(service.price)}`}
                            </ThemedText>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.summaryDivider} />

            {booking.addressLabel ? (
              <>
                <View style={styles.summaryRow}>
                  <ThemedText type="body" style={{ color: theme.textSecondary }}>
                    Dirección
                  </ThemedText>
                  <View style={{ flex: 1, marginLeft: Spacing.lg, alignItems: "flex-end" }}>
                    <ThemedText type="body" style={{ textAlign: "right" }}>
                      {booking.addressLabel}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.summaryDivider} />
              </>
            ) : null}

            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Fecha
              </ThemedText>
              <ThemedText type="body">{formatDate(booking.date)}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Hora
              </ThemedText>
              <ThemedText type="body">{booking.time}</ThemedText>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <ThemedText type="h3">Total Pagado</ThemedText>
              {booking.usedMembership ? (
                <View style={{ alignItems: "flex-end" }}>
                  <ThemedText type="h2" style={{ color: Colors.success }}>
                    Incluido
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Con tu paquete
                  </ThemedText>
                </View>
              ) : (
                <ThemedText
                  type="h2"
                  style={{ color: isDark ? Colors.accent : Colors.primary }}
                >
                  {formatPrice(booking.totalPrice)}
                </ThemedText>
              )}
            </View>
          </Card>
        </Animated.View>

        {booking.status === "upcoming" ? (
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            style={styles.actionsContainer}
          >
            <View style={[styles.rescheduleNote, { backgroundColor: (canReschedule ? Colors.accent : Colors.warning) + "15" }]}>
              <Feather name="info" size={16} color={canReschedule ? Colors.accent : Colors.warning} />
              <ThemedText type="small" style={{ color: canReschedule ? Colors.accent : Colors.warning, flex: 1 }}>
                {canReschedule
                  ? "Puedes reprogramar tu cita hasta 2 horas antes del servicio"
                  : "No puedes reprogramar a menos de 2 horas del servicio"}
              </ThemedText>
            </View>
            <Button
              onPress={handleReschedule}
              style={[
                styles.rescheduleButton,
                {
                  backgroundColor: canReschedule
                    ? theme.backgroundSecondary
                    : theme.backgroundTertiary,
                  opacity: canReschedule ? 1 : 0.6,
                },
              ]}
            >
              Reprogramar Cita
            </Button>
            <Button
              onPress={handleCancel}
              disabled={isCancelling}
              style={[styles.cancelButton, { backgroundColor: `${Colors.error}15` }]}
              textColor={Colors.error}
            >
              {isCancelling ? "Cancelando..." : "Cancelar Cita"}
            </Button>
          </Animated.View>
        ) : null}
      </ScrollView>

      <Modal
        visible={showRescheduleModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <ThemedView style={modalStyles.container}>
          <View style={[modalStyles.header, { borderBottomColor: theme.backgroundTertiary }]}>
            <ThemedText type="h2">Reprogramar Cita</ThemedText>
            <Pressable
              onPress={() => setShowRescheduleModal(false)}
              style={[modalStyles.closeButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Feather name="x" size={20} color={theme.text} />
            </Pressable>
          </View>
          <View style={modalStyles.noteContainer}>
            <View style={[modalStyles.note, { backgroundColor: Colors.warning + "15" }]}>
              <Feather name="info" size={16} color={Colors.warning} />
              <ThemedText type="small" style={{ color: Colors.warning, flex: 1 }}>
                Solo puedes reprogramar hasta 2 horas antes del servicio
              </ThemedText>
            </View>
          </View>
          {showRescheduleModal ? (
            <SchedulePicker
              washType={booking.washType}
              addOns={booking.addOns}
              onConfirm={handleRescheduleConfirm}
              showEstimatedTime={false}
            />
          ) : null}
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  noteContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});

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
  summaryCard: {
    marginBottom: Spacing.xl,
  },
  vehicleSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  vehicleSummaryImage: {
    width: 56,
    height: 56,
    marginRight: Spacing.md,
  },
  vehicleSummaryInfo: {
    flex: 1,
  },
  vehicleSummaryMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: 4,
  },
  vehicleMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(128, 128, 128, 0.15)",
    marginVertical: Spacing.md,
  },
  servicesToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  servicesBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
  },
  servicesExpandedList: {
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  servicesDivider: {
    height: 1,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    marginVertical: Spacing.xs,
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  serviceItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  actionsContainer: {
    gap: Spacing.md,
  },
  rescheduleNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  rescheduleButton: {
    backgroundColor: "transparent",
  },
  cancelButton: {
    backgroundColor: "transparent",
  },
});
