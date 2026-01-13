import React, { useState, useMemo } from "react";
import { StyleSheet, View, Pressable, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "ScheduleSelection">;

const TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

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

export default function ScheduleSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { vehicleSize, washType, addOns, totalPrice } = route.params;

  const dates = useMemo(() => generateDates(), []);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const handleDateSelect = (date: Date) => {
    Haptics.selectionAsync();
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    Haptics.selectionAsync();
    setSelectedTime(time);
  };

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate("Payment", {
        vehicleSize,
        washType,
        addOns,
        date: selectedDate.toISOString(),
        time: selectedTime,
        totalPrice,
      });
    }
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
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

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <ThemedText type="h2" style={styles.sectionTitle}>
            Selecciona la Hora
          </ThemedText>
          <View style={styles.timeSlotsContainer}>
            {TIME_SLOTS.map((time, index) => {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Spacing.xl,
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
  footer: {
    padding: Spacing.xl,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  continueButton: {
    backgroundColor: Colors.primary,
  },
});
