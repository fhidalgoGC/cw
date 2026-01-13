import AsyncStorage from "@react-native-async-storage/async-storage";

export type VehicleSize = "small" | "suv" | "large";
export type WashType = "basic" | "complete";

export interface AddOn {
  id: string;
  name: string;
  price: number;
}

export interface Booking {
  id: string;
  vehicleSize: VehicleSize;
  washType: WashType;
  addOns: string[];
  date: string;
  time: string;
  totalPrice: number;
  status: "upcoming" | "completed" | "cancelled";
  createdAt: string;
}

export interface UserData {
  name: string;
  hasSubscription: boolean;
  subscriptionWashesLeft: number;
}

const BOOKINGS_KEY = "@carwash_bookings";
const USER_KEY = "@carwash_user";

export const VEHICLE_PRICES: Record<VehicleSize, number> = {
  small: 150,
  suv: 200,
  large: 250,
};

export const WASH_TYPE_PRICES: Record<WashType, number> = {
  basic: 0,
  complete: 80,
};

export const ADD_ONS: AddOn[] = [
  { id: "rines", name: "Detallado de Rines", price: 50 },
  { id: "motor", name: "Lavado de Motor", price: 70 },
  { id: "interior", name: "Interior Completo", price: 100 },
  { id: "cera", name: "Encerado Premium", price: 80 },
  { id: "tapiceria", name: "Limpieza de Tapicería", price: 120 },
];

export const SUBSCRIPTION_PRICE = 1999;
export const SUBSCRIPTION_WASHES = 20;

export async function getBookings(): Promise<Booking[]> {
  try {
    const data = await AsyncStorage.getItem(BOOKINGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveBooking(booking: Booking): Promise<void> {
  try {
    const bookings = await getBookings();
    bookings.unshift(booking);
    await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  } catch {
    console.error("Failed to save booking");
  }
}

export async function updateBooking(updatedBooking: Booking): Promise<void> {
  try {
    const bookings = await getBookings();
    const index = bookings.findIndex((b) => b.id === updatedBooking.id);
    if (index !== -1) {
      bookings[index] = updatedBooking;
      await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    }
  } catch {
    console.error("Failed to update booking");
  }
}

export async function getUserData(): Promise<UserData> {
  try {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data
      ? JSON.parse(data)
      : { name: "Usuario", hasSubscription: false, subscriptionWashesLeft: 0 };
  } catch {
    return { name: "Usuario", hasSubscription: false, subscriptionWashesLeft: 0 };
  }
}

export async function saveUserData(userData: UserData): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
  } catch {
    console.error("Failed to save user data");
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatPrice(price: number): string {
  return `$${price.toLocaleString("es-MX")}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function getVehicleName(size: VehicleSize): string {
  switch (size) {
    case "small":
      return "Pequeño";
    case "suv":
      return "Camioneta";
    case "large":
      return "Grande";
  }
}

export function getWashTypeName(type: WashType): string {
  return type === "basic" ? "Básico" : "Completo";
}
