import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { StyleSheet, View, Pressable, ScrollView, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getEstimatedTime } from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "ScheduleSelection">;

const RESERVATION_SECONDS = 5 * 60;

const WEEKDAY_SLOTS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
];

const SATURDAY_SLOTS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
];

const SUNDAY_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
];

function getTimeSlotsForDate(date: Date): string[] {
  const day = date.getDay();
  if (day === 0) return SUNDAY_SLOTS;
  if (day === 6) return SATURDAY_SLOTS;
  return WEEKDAY_SLOTS;
}

function generateDates(): { date: Date; label: string; dayName: string }[] {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayName = date.toLocaleDateString("es-MX", { weekday: "short" });
    const label = date.getDate().toString();

    dates.push({ date, label, dayName });
  }

  return dates;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutos`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) {
    return hours === 1 ? "1 hora" : `${hours} horas`;
  }
  if (remainder === 30) {
    return hours === 1 ? "1 hora y media" : `${hours} horas y media`;
  }
  const hourStr = hours === 1 ? "1 hora" : `${hours} horas`;
  return `${hourStr} y ${remainder} min`;
}

function formatTimeRange(min: number, max: number): string {
  return `${formatDuration(min)} a ${formatDuration(max)}`;
}

export default function ScheduleSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { vehicleSize, washType, addOns, totalPrice, addressLabel } = route.params;

  const dates = useMemo(() => generateDates(), []);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESERVATION_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasExpiredRef = useRef(false);
  const expiryRef = useRef<number | null>(null);

  const isReserved = selectedDate !== null && selectedTime !== null;
  const estimatedTime = useMemo(() => getEstimatedTime(washType, addOns), [washType, addOns]);
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) return [];
    return getTimeSlotsForDate(selectedDate);
  }, [selectedDate]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    hasExpiredRef.current = false;
    const expiry = Date.now() + RESERVATION_SECONDS * 1000;
    expiryRef.current = expiry;
    setSecondsLeft(RESERVATION_SECONDS);
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (secondsLeft === 0 && isReserved && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Tiempo agotado",
        "Tu reserva de horario ha expirado. Por favor selecciona un nuevo horario.",
        [{ text: "Entendido" }]
      );
      setSelectedTime(null);
      setSecondsLeft(RESERVATION_SECONDS);
      expiryRef.current = null;
    }
  }, [secondsLeft, isReserved]);

  useFocusEffect(
    useCallback(() => {
      if (expiryRef.current && Date.now() >= expiryRef.current) {
        stopTimer();
        expiryRef.current = null;
        hasExpiredRef.current = true;
        setSelectedTime(null);
        setSecondsLeft(RESERVATION_SECONDS);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          "Tiempo agotado",
          "Tu reserva de horario ha expirado. Por favor selecciona un nuevo horario.",
          [{ text: "Entendido" }]
        );
      } else if (expiryRef.current && !timerRef.current) {
        const remaining = Math.max(0, Math.ceil((expiryRef.current - Date.now()) / 1000));
        if (remaining > 0) {
          hasExpiredRef.current = false;
          setSecondsLeft(remaining);
          const expiry = expiryRef.current;
          timerRef.current = setInterval(() => {
            const r = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
            setSecondsLeft(r);
            if (r <= 0) {
              if (timerRef.current) clearInterval(timerRef.current);
              timerRef.current = null;
            }
          }, 1000);
        }
      }
    }, [stopTimer])
  );

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  const handleDateSelect = (date: Date) => {
    Haptics.selectionAsync();
    const slots = getTimeSlotsForDate(date);
    if (selectedTime && !slots.includes(selectedTime)) {
      setSelectedTime(null);
      stopTimer();
    }
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    Haptics.selectionAsync();
    setSelectedTime(time);
    if (selectedDate) {
      startTimer();
    }
  };

  const handleContinue = () => {
    if (selectedDate && selectedTime && expiryRef.current) {
      stopTimer();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate("Payment", {
        vehicleSize,
        washType,
        addOns,
        date: selectedDate.toISOString(),
        time: selectedTime,
        totalPrice,
        reservationExpiry: expiryRef.current,
        addressLabel,
      });
    }
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isTimeLow = secondsLeft <= 60;
  const timerColor = isTimeLow ? Colors.error : Colors.warning;
  const timerProgress = secondsLeft / RESERVATION_SECONDS;

  return (
    <ThemedView style={styles.container}>
      {isReserved ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[
            styles.timerBar,
            { backgroundColor: timerColor + "15" },
          ]}
        >
          <View style={styles.timerContent}>
            <View style={styles.timerLeft}>
              <View style={[styles.timerIconCircle, { backgroundColor: timerColor + "25" }]}>
                <Feather name="clock" size={16} color={timerColor} />
              </View>
              <View>
                <ThemedText type="small" style={{ color: timerColor, fontWeight: "700" }}>
                  Horario reservado
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Completa tu reserva antes de que expire
                </ThemedText>
              </View>
            </View>
            <View style={[styles.timerBadge, { backgroundColor: timerColor }]}>
              <Feather name="clock" size={12} color="#FFFFFF" />
              <ThemedText type="body" style={styles.timerText}>
                {formatCountdown(secondsLeft)}
              </ThemedText>
            </View>
          </View>
          <View style={[styles.timerProgressBg, { backgroundColor: timerColor + "20" }]}>
            <View
              style={[
                styles.timerProgressFill,
                {
                  backgroundColor: timerColor,
                  width: `${timerProgress * 100}%`,
                },
              ]}
            />
          </View>
        </Animated.View>
      ) : null}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <ThemedText type="h2" style={styles.sectionTitle}>
            Selecciona el Día
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesContainer}
          >
            {dates.map((item, index) => {
              const isSelected = isDateSelected(item.date);
              const isToday = index === 0;

              return (
                <Pressable
                  key={index}
                  onPress={() => handleDateSelect(item.date)}
                  style={[
                    styles.dateCard,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? Colors.accent
                          : Colors.primary
                        : theme.backgroundDefault,
                      borderColor: isSelected
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
                      color: isSelected
                        ? "#FFFFFF"
                        : theme.textSecondary,
                      textTransform: "uppercase",
                    }}
                  >
                    {isToday ? "Hoy" : item.dayName}
                  </ThemedText>
                  <ThemedText
                    type="h2"
                    style={{
                      color: isSelected ? "#FFFFFF" : theme.text,
                    }}
                  >
                    {item.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {selectedDate ? (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <ThemedText type="h2" style={styles.sectionTitle}>
              Selecciona la Hora
            </ThemedText>
            <View style={styles.timeSlotsContainer}>
              {availableTimeSlots.map((time) => {
                const isSelected = selectedTime === time;

                return (
                  <Pressable
                    key={time}
                    onPress={() => handleTimeSelect(time)}
                    style={[
                      styles.timeSlot,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? Colors.accent
                            : Colors.primary
                          : theme.backgroundDefault,
                        borderColor: isSelected
                          ? isDark
                            ? Colors.accent
                            : Colors.primary
                          : theme.backgroundTertiary,
                      },
                    ]}
                  >
                    <ThemedText
                      type="body"
                      style={{
                        color: isSelected ? "#FFFFFF" : theme.text,
                        fontWeight: isSelected ? "600" : "400",
                      }}
                    >
                      {time}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        ) : null}

        {selectedDate && selectedTime ? (
          <Animated.View
            entering={FadeInDown.springify()}
            style={[
              styles.summaryCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              Tu cita
            </ThemedText>
            <ThemedText type="h3">
              {selectedDate.toLocaleDateString("es-MX", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </ThemedText>
            <ThemedText
              type="body"
              style={{ color: isDark ? Colors.accent : Colors.primary }}
            >
              {selectedTime}
            </ThemedText>
            <View style={styles.estimatedTimeRow}>
              <Feather name="clock" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Tiempo estimado: {formatTimeRange(estimatedTime.min, estimatedTime.max)}
              </ThemedText>
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.backgroundDefault,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <Button
          onPress={handleContinue}
          disabled={!selectedDate || !selectedTime}
          style={styles.continueButton}
        >
          Continuar al Pago
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timerBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  timerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  timerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  timerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  timerText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  timerProgressBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  timerProgressFill: {
    height: 4,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  datesContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  dateCard: {
    width: 72,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    borderWidth: 1,
  },
  timeSlotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  timeSlot: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  summaryCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  estimatedTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  footer: {
    padding: Spacing.xl,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  continueButton: {
    backgroundColor: Colors.primary,
  },
});
