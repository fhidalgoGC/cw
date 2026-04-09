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
import PackageVehicleSelectionScreen from "@/screens/PackageVehicleSelectionScreen";
import AddressManagementScreen from "@/screens/AddressManagementScreen";
import VehicleManagementScreen from "@/screens/VehicleManagementScreen";
import MembershipDetailScreen from "@/screens/MembershipDetailScreen";
import PackagePurchaseScreen from "@/screens/PackagePurchaseScreen";
import BookingPaymentSelectionScreen from "@/screens/BookingPaymentSelectionScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { VehicleSize, WashType, Booking } from "@/lib/storage";

export type RootStackParamList = {
  Main: undefined;
  BookingPaymentSelection: undefined;
  VehicleSelection: undefined;
  ServiceCustomization: {
    vehicleSize: VehicleSize;
    addressLabel: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleColor: string;
    vehiclePlate?: string;
  };
  ScheduleSelection: {
    vehicleSize: VehicleSize;
    washType: WashType;
    addOns: string[];
    totalPrice: number;
    addressLabel: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleColor: string;
    vehiclePlate?: string;
    comments?: string;
  };
  Payment: {
    vehicleSize: VehicleSize;
    washType: WashType;
    addOns: string[];
    date: string;
    time: string;
    totalPrice: number;
    reservationExpiry?: number;
    addressLabel: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleColor: string;
    vehiclePlate?: string;
    comments?: string;
  };
  Confirmation: { booking: Booking };
  AppointmentDetail: { booking: Booking };
  Profile: undefined;
  PackageVehicleSelection: undefined;
  Packages: { vehicleSize: VehicleSize };
  AddressManagement: undefined;
  VehicleManagement: undefined;
  MembershipDetail: undefined;
  PackagePurchase: { packageId: string; durationId: string; vehicleSize: VehicleSize };
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
        name="BookingPaymentSelection"
        component={BookingPaymentSelectionScreen}
        options={{
          presentation: "modal",
          headerTitle: "Método de Pago",
        }}
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
        name="PackageVehicleSelection"
        component={PackageVehicleSelectionScreen}
        options={{
          headerTitle: "Paquetes",
        }}
      />
      <Stack.Screen
        name="Packages"
        component={PackagesScreen}
        options={{
          headerTitle: "Paquetes Disponibles",
        }}
      />
      <Stack.Screen
        name="AddressManagement"
        component={AddressManagementScreen}
        options={{
          headerTitle: "Mi Dirección",
        }}
      />
      <Stack.Screen
        name="VehicleManagement"
        component={VehicleManagementScreen}
        options={{
          headerTitle: "Mis Vehículos",
        }}
      />
      <Stack.Screen
        name="MembershipDetail"
        component={MembershipDetailScreen}
        options={{
          headerTitle: "Mis Paquetes",
        }}
      />
      <Stack.Screen
        name="PackagePurchase"
        component={PackagePurchaseScreen}
        options={{
          headerTitle: "Comprar Paquete",
        }}
      />
    </Stack.Navigator>
  );
}
