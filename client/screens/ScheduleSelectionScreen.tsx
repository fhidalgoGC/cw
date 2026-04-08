import React from "react";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedView } from "@/components/ThemedView";
import { SchedulePicker } from "@/components/SchedulePicker";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "ScheduleSelection">;

export default function ScheduleSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();

  const { vehicleSize, washType, addOns, totalPrice, addressLabel, vehicleBrand, vehicleModel, vehicleColor, vehiclePlate } = route.params;

  const handleConfirm = (selectedDate: Date, selectedTime: string, reservationExpiry: number) => {
    navigation.navigate("Payment", {
      vehicleSize,
      washType,
      addOns,
      date: selectedDate.toISOString(),
      time: selectedTime,
      totalPrice,
      reservationExpiry,
      addressLabel,
      vehicleBrand,
      vehicleModel,
      vehicleColor,
      vehiclePlate,
    });
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <SchedulePicker
        washType={washType}
        addOns={addOns}
        onConfirm={handleConfirm}
        showEstimatedTime={true}
      />
    </ThemedView>
  );
}
