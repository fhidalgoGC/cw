import React, { useState } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Image } from "expo-image";
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
import { VehicleSize, VEHICLE_PRICES, formatPrice } from "@/lib/storage";

import vehicleSmall from "../../assets/images/vehicle-small.png";
import vehicleSuv from "../../assets/images/vehicle-suv.png";
import vehicleLarge from "../../assets/images/vehicle-large.png";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "VehicleSelection">;
type RouteType = RouteProp<RootStackParamList, "VehicleSelection">;

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

export default function VehicleSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const membershipId = route.params?.membershipId;

  const [selectedSize, setSelectedSize] = useState<VehicleSize | null>(null);

  const handleSelect = (size: VehicleSize) => {
    Haptics.selectionAsync();
    setSelectedSize(size);
  };

  const handleContinue = () => {
    if (selectedSize) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate("ServiceCustomization", { vehicleSize: selectedSize, membershipId });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Elige el tamaño de tu vehículo para ver precios personalizados
          </ThemedText>
        </Animated.View>

        <View style={styles.optionsContainer}>
          {VEHICLE_OPTIONS.map((option, index) => {
            const isSelected = selectedSize === option.size;
            return (
              <Animated.View
                key={option.size}
                entering={FadeInDown.delay(100 + index * 50).springify()}
              >
                <Pressable
                  onPress={() => handleSelect(option.size)}
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
                    source={option.image}
                    style={styles.vehicleImage}
                    contentFit="contain"
                  />
                  <View style={styles.optionInfo}>
                    <ThemedText type="h3">{option.name}</ThemedText>
                    <ThemedText
                      type="caption"
                      style={{ color: theme.textSecondary }}
                    >
                      {option.description}
                    </ThemedText>
                  </View>
                  <View style={styles.priceContainer}>
                    <ThemedText
                      type="h2"
                      style={{
                        color: isDark ? Colors.accent : Colors.primary,
                      }}
                    >
                      {formatPrice(VEHICLE_PRICES[option.size])}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={{ color: theme.textSecondary }}
                    >
                      desde
                    </ThemedText>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Button
          onPress={handleContinue}
          disabled={!selectedSize}
          style={styles.continueButton}
        >
          Continuar
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
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
  priceContainer: {
    alignItems: "flex-end",
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  continueButton: {
    backgroundColor: Colors.primary,
  },
});
