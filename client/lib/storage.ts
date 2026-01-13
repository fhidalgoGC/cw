import AsyncStorage from "@react-native-async-storage/async-storage";

export type VehicleSize = "small" | "suv" | "large";
export type WashType = "basic" | "complete";

export interface AddOn {
  id: string;
  name: string;
  price: number;
}

export interface PackageAddOn {
  addOnId: string;
  includedUses: number;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  monthlyPrice?: number;
  washesIncluded: number;
  addOnsIncluded: PackageAddOn[];
  perks: string[];
  popular?: boolean;
  color: string;
}

export interface Membership {
  packageId: string;
  activatedAt: string;
  renewalDate: string;
  washesRemaining: number;
  addOnUsage: Record<string, number>;
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
  usedMembership?: boolean;
}

export interface SavedVehicle {
  id: string;
  name: string;
  size: VehicleSize;
  plate?: string;
}

export interface UserAddress {
  street: string;
  city: string;
  zipCode: string;
}

export interface UserData {
  name: string;
  phone?: string;
  email?: string;
  address?: UserAddress;
  vehicles: SavedVehicle[];
  membership?: Membership;
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

export const PACKAGES: Package[] = [
  {
    id: "esencial",
    name: "Esencial",
    description: "Perfecto para mantener tu auto impecable cada semana",
    price: 599,
    washesIncluded: 4,
    addOnsIncluded: [
      { addOnId: "interior", includedUses: 1 },
    ],
    perks: [
      "4 lavadas al mes",
      "1 interior completo",
      "Prioridad en citas",
    ],
    color: "#3B82F6",
  },
  {
    id: "premium",
    name: "Premium",
    description: "El más popular para quienes cuidan cada detalle",
    price: 1299,
    washesIncluded: 12,
    addOnsIncluded: [
      { addOnId: "interior", includedUses: 4 },
      { addOnId: "rines", includedUses: 4 },
      { addOnId: "cera", includedUses: 2 },
    ],
    perks: [
      "12 lavadas al mes",
      "4 interiores completos",
      "4 detallados de rines",
      "2 encerados premium",
      "Acceso prioritario",
    ],
    popular: true,
    color: "#8B5CF6",
  },
  {
    id: "elite",
    name: "Elite",
    description: "Cuidado ilimitado para los más exigentes",
    price: 2499,
    washesIncluded: 30,
    addOnsIncluded: [
      { addOnId: "interior", includedUses: 8 },
      { addOnId: "rines", includedUses: 8 },
      { addOnId: "cera", includedUses: 4 },
      { addOnId: "motor", includedUses: 2 },
      { addOnId: "tapiceria", includedUses: 2 },
    ],
    perks: [
      "30 lavadas al mes",
      "8 interiores completos",
      "8 detallados de rines",
      "4 encerados premium",
      "2 lavados de motor",
      "2 limpiezas de tapicería",
      "Servicio VIP express",
    ],
    color: "#F59E0B",
  },
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
  const defaultData: UserData = {
    name: "Usuario",
    vehicles: [],
    hasSubscription: false,
    subscriptionWashesLeft: 0,
  };

  try {
    const data = await AsyncStorage.getItem(USER_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      const normalized: UserData = {
        ...defaultData,
        ...parsed,
        vehicles: parsed.vehicles ?? [],
      };
      if (normalized.hasSubscription && !normalized.membership) {
        normalized.membership = {
          packageId: "premium",
          activatedAt: new Date().toISOString(),
          renewalDate: getNextMonthDate(),
          washesRemaining: normalized.subscriptionWashesLeft || 20,
          addOnUsage: {},
        };
      }
      return normalized;
    }
    return defaultData;
  } catch {
    return defaultData;
  }
}

export async function saveUserData(userData: UserData): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
  } catch {
    console.error("Failed to save user data");
  }
}

export async function activateMembership(packageId: string): Promise<UserData> {
  const userData = await getUserData();
  const pkg = PACKAGES.find((p) => p.id === packageId);
  
  if (!pkg) {
    throw new Error("Package not found");
  }

  const addOnUsage: Record<string, number> = {};
  pkg.addOnsIncluded.forEach((addon) => {
    addOnUsage[addon.addOnId] = addon.includedUses;
  });

  const membership: Membership = {
    packageId,
    activatedAt: new Date().toISOString(),
    renewalDate: getNextMonthDate(),
    washesRemaining: pkg.washesIncluded,
    addOnUsage,
  };

  const updatedUserData: UserData = {
    ...userData,
    hasSubscription: true,
    subscriptionWashesLeft: pkg.washesIncluded,
    membership,
  };

  await saveUserData(updatedUserData);
  return updatedUserData;
}

export async function cancelMembership(): Promise<UserData> {
  const userData = await getUserData();
  
  const updatedUserData: UserData = {
    ...userData,
    hasSubscription: false,
    subscriptionWashesLeft: 0,
    membership: undefined,
  };

  await saveUserData(updatedUserData);
  return updatedUserData;
}

export async function useMembershipWash(): Promise<UserData | null> {
  const userData = await getUserData();
  
  if (!userData.membership || userData.membership.washesRemaining <= 0) {
    return null;
  }

  const updatedUserData: UserData = {
    ...userData,
    subscriptionWashesLeft: userData.membership.washesRemaining - 1,
    membership: {
      ...userData.membership,
      washesRemaining: userData.membership.washesRemaining - 1,
    },
  };

  await saveUserData(updatedUserData);
  return updatedUserData;
}

export async function useMembershipAddOn(addOnId: string): Promise<UserData | null> {
  const userData = await getUserData();
  
  if (!userData.membership) {
    return null;
  }

  const remaining = userData.membership.addOnUsage[addOnId] || 0;
  if (remaining <= 0) {
    return null;
  }

  const updatedUserData: UserData = {
    ...userData,
    membership: {
      ...userData.membership,
      addOnUsage: {
        ...userData.membership.addOnUsage,
        [addOnId]: remaining - 1,
      },
    },
  };

  await saveUserData(updatedUserData);
  return updatedUserData;
}

export function getActiveMembership(userData: UserData): { package: Package; membership: Membership } | null {
  if (!userData.membership) {
    return null;
  }
  
  const pkg = PACKAGES.find((p) => p.id === userData.membership?.packageId);
  if (!pkg) {
    return null;
  }

  return { package: pkg, membership: userData.membership };
}

export function getMembershipAddOnRemaining(userData: UserData, addOnId: string): number {
  if (!userData.membership) {
    return 0;
  }
  return userData.membership.addOnUsage[addOnId] || 0;
}

export function getNextMonthDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
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

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
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

export function getAddOnName(addOnId: string): string {
  const addon = ADD_ONS.find((a) => a.id === addOnId);
  return addon?.name || addOnId;
}
