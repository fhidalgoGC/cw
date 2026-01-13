import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  RefreshControl,
  ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
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
  getBookings,
  getUserData,
  Booking,
  UserData,
  formatDate,
  formatPrice,
  getVehicleName,
} from "@/lib/storage";

import subscriptionBadge from "@assets/images/subscription-badge.png";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [user, bookings] = await Promise.all([getUserData(), getBookings()]);
    setUserData(user);
    setRecentBookings(
      bookings.filter((b) => b.status === "upcoming").slice(0, 3)
    );
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  const handleBookPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("VehicleSelection");
  };

  const handleProfilePress = () => {
    navigation.navigate("Profile");
  };

  const handleBookingPress = (booking: Booking) => {
    navigation.navigate("AppointmentDetail", { booking });
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Animated.View
          entering={FadeInDown.delay(100)}
          style={[styles.skeleton, { backgroundColor: theme.backgroundSecondary }]}
        />
        <Animated.View
          entering={FadeInDown.delay(200)}
          style={[
            styles.skeleton,
            styles.skeletonLarge,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <Animated.View
          entering={FadeInDown.delay(50).springify()}
          style={styles.header}
        >
          <View>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              Bienvenido
            </ThemedText>
            <ThemedText type="h1">{userData?.name || "Usuario"}</ThemedText>
          </View>
          <Pressable onPress={handleProfilePress} style={styles.profileButton}>
            <Feather
              name="user"
              size={24}
              color={isDark ? Colors.accent : Colors.primary}
            />
          </Pressable>
        </Animated.View>

        {userData?.hasSubscription ? (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Card
              elevation={2}
              onPress={() => navigation.navigate("Packages")}
              style={StyleSheet.flatten([
                styles.subscriptionCard,
                { backgroundColor: isDark ? Colors.primary : "#EEF2FF" },
              ])}
            >
              <View style={styles.subscriptionContent}>
                <Image
                  source={subscriptionBadge}
                  style={styles.subscriptionBadge}
                  contentFit="contain"
                />
                <View style={styles.subscriptionInfo}>
                  <ThemedText
                    type="h3"
                    style={{ color: isDark ? "#FFFFFF" : Colors.primary }}
                  >
                    Pase Premium Activo
                  </ThemedText>
                  <ThemedText
                    type="body"
                    style={{ color: isDark ? "#E0E7FF" : "#4338CA" }}
                  >
                    {userData.subscriptionWashesLeft} lavadas restantes
                  </ThemedText>
                </View>
              </View>
            </Card>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Card
              elevation={2}
              onPress={() => navigation.navigate("Packages")}
              style={StyleSheet.flatten([
                styles.promoCard,
                {
                  backgroundColor: isDark
                    ? "rgba(6, 182, 212, 0.15)"
                    : "rgba(30, 64, 175, 0.08)",
                },
              ])}
            >
              <View style={styles.promoContent}>
                <Image
                  source={subscriptionBadge}
                  style={styles.promoBadge}
                  contentFit="contain"
                />
                <View style={styles.promoInfo}>
                  <ThemedText
                    type="h3"
                    style={{ color: isDark ? Colors.accent : Colors.primary }}
                  >
                    Pase de 20 Lavadas
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Ahorra hasta 40% con tu suscripción mensual
                  </ThemedText>
                </View>
                <Feather
                  name="chevron-right"
                  size={24}
                  color={isDark ? Colors.accent : Colors.primary}
                />
              </View>
            </Card>
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInDown.delay(150).springify()}
          style={styles.bookSection}
        >
          <Button onPress={handleBookPress} style={styles.bookButton}>
            Reservar Lavado
          </Button>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.section}
        >
          <ThemedText type="h2" style={styles.sectionTitle}>
            Próximas Citas
          </ThemedText>

          {recentBookings.length > 0 ? (
            recentBookings.map((booking, index) => (
              <Animated.View
                key={booking.id}
                entering={FadeInDown.delay(250 + index * 50).springify()}
              >
                <Card
                  elevation={1}
                  onPress={() => handleBookingPress(booking)}
                  style={styles.bookingCard}
                >
                  <View style={styles.bookingHeader}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: Colors.success },
                      ]}
                    />
                    <ThemedText type="caption" style={{ color: Colors.success }}>
                      Confirmada
                    </ThemedText>
                  </View>
                  <View style={styles.bookingInfo}>
                    <ThemedText type="h3">
                      {getVehicleName(booking.vehicleSize)}
                    </ThemedText>
                    <ThemedText
                      type="body"
                      style={{ color: theme.textSecondary }}
                    >
                      {formatDate(booking.date)} - {booking.time}
                    </ThemedText>
                  </View>
                  <View style={styles.bookingFooter}>
                    <ThemedText
                      type="h3"
                      style={{ color: isDark ? Colors.accent : Colors.primary }}
                    >
                      {formatPrice(booking.totalPrice)}
                    </ThemedText>
                    <Feather
                      name="chevron-right"
                      size={20}
                      color={theme.textSecondary}
                    />
                  </View>
                </Card>
              </Animated.View>
            ))
          ) : (
            <Card elevation={1} style={styles.emptyCard}>
              <Feather
                name="calendar"
                size={32}
                color={theme.textSecondary}
                style={styles.emptyIcon}
              />
              <ThemedText
                type="body"
                style={[styles.emptyText, { color: theme.textSecondary }]}
              >
                No tienes citas próximas
              </ThemedText>
              <ThemedText
                type="caption"
                style={{ color: theme.textSecondary, textAlign: "center" }}
              >
                Reserva tu primer lavado y mantén tu auto impecable
              </ThemedText>
            </Card>
          )}
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: 100,
    gap: Spacing.lg,
  },
  skeleton: {
    height: 80,
    borderRadius: BorderRadius.lg,
  },
  skeletonLarge: {
    height: 200,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  subscriptionCard: {
    marginBottom: Spacing.lg,
  },
  subscriptionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  subscriptionBadge: {
    width: 48,
    height: 48,
    marginRight: Spacing.lg,
  },
  subscriptionInfo: {
    flex: 1,
  },
  promoCard: {
    marginBottom: Spacing.lg,
  },
  promoContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  promoBadge: {
    width: 40,
    height: 40,
    marginRight: Spacing.md,
  },
  promoInfo: {
    flex: 1,
  },
  bookSection: {
    marginBottom: Spacing["2xl"],
  },
  bookButton: {
    backgroundColor: Colors.primary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  bookingCard: {
    marginBottom: Spacing.md,
  },
  bookingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  bookingInfo: {
    marginBottom: Spacing.md,
  },
  bookingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyText: {
    marginBottom: Spacing.xs,
  },
});
