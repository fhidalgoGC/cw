import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import VehicleSelectionScreen from "@/screens/VehicleSelectionScreen";
import ServiceCustomizationScreen from "@/screens/ServiceCustomizationScreen";
import ScheduleSelectionScreen from "@/screens/ScheduleSelectionScreen";
import PaymentScreen from "@/screens/PaymentScreen";
import ConfirmationScreen from "@/screens/ConfirmationScreen";
import AppointmentDetailScreen from "@/screens/AppointmentDetailScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import PackagesScreen from "@/screens/PackagesScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { VehicleSize, WashType, Booking } from "@/lib/storage";

export type RootStackParamList = {
  Main: undefined;
  VehicleSelection: undefined;
  ServiceCustomization: { vehicleSize: VehicleSize };
  ScheduleSelection: {
    vehicleSize: VehicleSize;
    washType: WashType;
    addOns: string[];
    totalPrice: number;
  };
  Payment: {
    vehicleSize: VehicleSize;
    washType: WashType;
    addOns: string[];
    date: string;
    time: string;
    totalPrice: number;
  };
  Confirmation: { booking: Booking };
  AppointmentDetail: { booking: Booking };
  Profile: undefined;
  Packages: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VehicleSelection"
        component={VehicleSelectionScreen}
        options={{
          presentation: "modal",
          headerTitle: "Selecciona tu Vehículo",
        }}
      />
      <Stack.Screen
        name="ServiceCustomization"
        component={ServiceCustomizationScreen}
        options={{
          presentation: "modal",
          headerTitle: "Personaliza tu Lavado",
        }}
      />
      <Stack.Screen
        name="ScheduleSelection"
        component={ScheduleSelectionScreen}
        options={{
          presentation: "modal",
          headerTitle: "Elige Horario",
        }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{
          presentation: "modal",
          headerTitle: "Confirmar Pago",
        }}
      />
      <Stack.Screen
        name="Confirmation"
        component={ConfirmationScreen}
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="AppointmentDetail"
        component={AppointmentDetailScreen}
        options={{
          headerTitle: "Detalles de Cita",
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          presentation: "modal",
          headerTitle: "Perfil",
        }}
      />
      <Stack.Screen
        name="Packages"
        component={PackagesScreen}
        options={{
          headerTitle: "Paquetes y Membresías",
        }}
      />
    </Stack.Navigator>
  );
}
