import AsyncStorage from "@react-native-async-storage/async-storage";

export type VehicleSize = "small" | "suv" | "large";
export type WashType = "basic" | "complete" | "premium" | "detail" | "full";

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
  durationDays: number;
  addOnsIncluded: PackageAddOn[];
  perks: string[];
  popular?: boolean;
  color: string;
}

export interface Membership {
  id: string;
  packageId: string;
  activatedAt: string;
  expirationDate: string;
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
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehiclePlate?: string;
  addressLabel?: string;
  comments?: string;
}

export interface SavedVehicle {
  id: string;
  brand: string;
  model: string;
  color: string;
  size: VehicleSize;
  plate?: string;
}

export interface UserAddress {
  street: string;
  city: string;
  zipCode: string;
}

export interface SavedAddress {
  id: string;
  alias: string;
  state: string;
  city: string;
  colony: string;
  coto?: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  reference?: string;
}

export const AVAILABLE_STATES = ["Jalisco"];
export const AVAILABLE_CITIES = ["Tlajomulco de Zúñiga"];
export const AVAILABLE_COLONIES = ["Villa California", "Casa Fuerte", "Adamar"];

export interface UserData {
  name: string;
  phone?: string;
  email?: string;
  address?: UserAddress;
  addresses: SavedAddress[];
  vehicles: SavedVehicle[];
  memberships: Membership[];
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
  premium: 150,
  detail: 250,
  full: 380,
};

export interface ServiceOption {
  id: string;
  name: string;
  price: number;
  includedIn: WashType[];
  minMinutes: number;
  maxMinutes: number;
}

export const ALL_SERVICES: ServiceOption[] = [
  { id: "exterior", name: "Lavado Exterior", price: 0, includedIn: ["basic", "complete", "premium", "detail", "full"], minMinutes: 15, maxMinutes: 20 },
  { id: "aspirado", name: "Aspirado", price: 0, includedIn: ["basic", "complete", "premium", "detail", "full"], minMinutes: 10, maxMinutes: 15 },
  { id: "interior", name: "Interior Completo", price: 100, includedIn: ["complete", "premium", "detail", "full"], minMinutes: 15, maxMinutes: 25 },
  { id: "vidrios", name: "Limpieza de Vidrios", price: 0, includedIn: ["complete", "premium", "detail", "full"], minMinutes: 5, maxMinutes: 10 },
  { id: "rines", name: "Detallado de Rines", price: 50, includedIn: ["premium", "detail", "full"], minMinutes: 10, maxMinutes: 15 },
  { id: "motor", name: "Lavado de Motor", price: 70, includedIn: ["detail", "full"], minMinutes: 15, maxMinutes: 20 },
  { id: "cera", name: "Encerado Premium", price: 80, includedIn: ["detail", "full"], minMinutes: 15, maxMinutes: 25 },
  { id: "tapiceria", name: "Limpieza de Tapicería", price: 120, includedIn: ["full"], minMinutes: 20, maxMinutes: 30 },
];

export function getEstimatedTime(washType: WashType, addOnIds: string[]): { min: number; max: number } {
  const includedIds = getIncludedServiceIds(washType);
  const allServiceIds = [...new Set([...includedIds, ...addOnIds])];
  let min = 0;
  let max = 0;
  for (const id of allServiceIds) {
    const service = ALL_SERVICES.find((s) => s.id === id);
    if (service) {
      min += service.minMinutes;
      max += service.maxMinutes;
    }
  }
  return { min, max };
}

export const ADD_ONS: AddOn[] = [
  { id: "rines", name: "Detallado de Rines", price: 50 },
  { id: "motor", name: "Lavado de Motor", price: 70 },
  { id: "interior", name: "Interior Completo", price: 100 },
  { id: "cera", name: "Encerado Premium", price: 80 },
  { id: "tapiceria", name: "Limpieza de Tapicería", price: 120 },

];

export function getIncludedServiceIds(washType: WashType): string[] {
  return ALL_SERVICES.filter((s) => s.includedIn.includes(washType)).map((s) => s.id);
}

export function getExtraServices(): ServiceOption[] {
  return ALL_SERVICES.filter((s) => s.includedIn.length === 0);
}

export const PACKAGES: Package[] = [
  {
    id: "esencial",
    name: "Esencial",
    description: "Perfecto para mantener tu auto impecable cada semana",
    price: 599,
    washesIncluded: 4,
    durationDays: 30,
    addOnsIncluded: [
      { addOnId: "interior", includedUses: 1 },
    ],
    perks: [
      "4 lavadas",
      "1 interior completo",
      "Prioridad en citas",
      "Vigencia: 30 días",
    ],
    color: "#3B82F6",
  },
  {
    id: "premium",
    name: "Premium",
    description: "El más popular para quienes cuidan cada detalle",
    price: 1299,
    washesIncluded: 12,
    durationDays: 30,
    addOnsIncluded: [
      { addOnId: "interior", includedUses: 4 },
      { addOnId: "rines", includedUses: 4 },
      { addOnId: "cera", includedUses: 2 },
    ],
    perks: [
      "12 lavadas",
      "4 interiores completos",
      "4 detallados de rines",
      "2 encerados premium",
      "Vigencia: 30 días",
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
    durationDays: 30,
    addOnsIncluded: [
      { addOnId: "interior", includedUses: 8 },
      { addOnId: "rines", includedUses: 8 },
      { addOnId: "cera", includedUses: 4 },
      { addOnId: "motor", includedUses: 2 },
      { addOnId: "tapiceria", includedUses: 2 },
    ],
    perks: [
      "30 lavadas",
      "8 interiores completos",
      "8 detallados de rines",
      "4 encerados premium",
      "2 lavados de motor",
      "2 limpiezas de tapicería",
      "Vigencia: 30 días",
    ],
    color: "#F59E0B",
  },
  {
    id: "express15",
    name: "Express 15",
    description: "Paquete rápido para 15 días",
    price: 349,
    washesIncluded: 2,
    durationDays: 15,
    addOnsIncluded: [],
    perks: [
      "2 lavadas",
      "Vigencia: 15 días",
      "Ideal para probar",
    ],
    color: "#10B981",
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
    addresses: [],
    memberships: [],
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
        memberships: parsed.memberships ?? [],
      };
      if (parsed.membership && !parsed.memberships?.length) {
        const legacyMembership: Membership = {
          ...parsed.membership,
          id: parsed.membership.id || generateId(),
          expirationDate: parsed.membership.expirationDate || parsed.membership.renewalDate,
        };
        normalized.memberships = [legacyMembership];
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

export async function saveVehicle(vehicle: Omit<SavedVehicle, "id">): Promise<SavedVehicle> {
  const userData = await getUserData();
  const newVehicle: SavedVehicle = { ...vehicle, id: generateId() };
  userData.vehicles.push(newVehicle);
  await saveUserData(userData);
  return newVehicle;
}

export async function getSavedVehicles(): Promise<SavedVehicle[]> {
  const userData = await getUserData();
  return userData.vehicles;
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  const userData = await getUserData();
  userData.vehicles = userData.vehicles.filter((v) => v.id !== vehicleId);
  await saveUserData(userData);
}

export async function saveAddress(address: Omit<SavedAddress, "id">): Promise<SavedAddress> {
  const userData = await getUserData();
  if (!userData.addresses) userData.addresses = [];
  const newAddress: SavedAddress = { ...address, id: generateId() };
  userData.addresses.push(newAddress);
  await saveUserData(userData);
  return newAddress;
}

export async function getSavedAddresses(): Promise<SavedAddress[]> {
  const userData = await getUserData();
  return userData.addresses || [];
}

export async function deleteAddress(addressId: string): Promise<void> {
  const userData = await getUserData();
  userData.addresses = (userData.addresses || []).filter((a) => a.id !== addressId);
  await saveUserData(userData);
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

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + pkg.durationDays);

  const membership: Membership = {
    id: generateId(),
    packageId,
    activatedAt: new Date().toISOString(),
    expirationDate: expirationDate.toISOString(),
    washesRemaining: pkg.washesIncluded,
    addOnUsage,
  };

  const updatedUserData: UserData = {
    ...userData,
    hasSubscription: true,
    memberships: [...userData.memberships, membership],
  };

  await saveUserData(updatedUserData);
  return updatedUserData;
}

export async function cancelMembership(membershipId: string): Promise<UserData> {
  const userData = await getUserData();
  
  const updatedUserData: UserData = {
    ...userData,
    memberships: userData.memberships.filter((m) => m.id !== membershipId),
    hasSubscription: userData.memberships.length > 1,
  };

  await saveUserData(updatedUserData);
  return updatedUserData;
}

export async function useMembershipWash(membershipId: string): Promise<UserData | null> {
  const userData = await getUserData();
  
  const membershipIndex = userData.memberships.findIndex((m) => m.id === membershipId);
  if (membershipIndex === -1) {
    return null;
  }

  const membership = userData.memberships[membershipIndex];
  if (membership.washesRemaining <= 0) {
    return null;
  }

  const updatedMemberships = [...userData.memberships];
  updatedMemberships[membershipIndex] = {
    ...membership,
    washesRemaining: membership.washesRemaining - 1,
  };

  const updatedUserData: UserData = {
    ...userData,
    memberships: updatedMemberships,
  };

  await saveUserData(updatedUserData);
  return updatedUserData;
}

export async function useMembershipAddOn(membershipId: string, addOnId: string): Promise<UserData | null> {
  const userData = await getUserData();
  
  const membershipIndex = userData.memberships.findIndex((m) => m.id === membershipId);
  if (membershipIndex === -1) {
    return null;
  }

  const membership = userData.memberships[membershipIndex];
  const remaining = membership.addOnUsage[addOnId] || 0;
  if (remaining <= 0) {
    return null;
  }

  const updatedMemberships = [...userData.memberships];
  updatedMemberships[membershipIndex] = {
    ...membership,
    addOnUsage: {
      ...membership.addOnUsage,
      [addOnId]: remaining - 1,
    },
  };

  const updatedUserData: UserData = {
    ...userData,
    memberships: updatedMemberships,
  };

  await saveUserData(updatedUserData);
  return updatedUserData;
}

export function getActiveMemberships(userData: UserData): { package: Package; membership: Membership; daysRemaining: number }[] {
  const now = new Date();
  return userData.memberships
    .filter((m) => {
      const expDate = new Date(m.expirationDate);
      return expDate > now && m.washesRemaining > 0;
    })
    .map((m) => {
      const pkg = PACKAGES.find((p) => p.id === m.packageId);
      const expDate = new Date(m.expirationDate);
      const daysRemaining = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return pkg ? { package: pkg, membership: m, daysRemaining } : null;
    })
    .filter((item): item is { package: Package; membership: Membership; daysRemaining: number } => item !== null);
}

export function getActiveMembership(userData: UserData): { package: Package; membership: Membership } | null {
  const actives = getActiveMemberships(userData);
  if (actives.length === 0) {
    return null;
  }
  return { package: actives[0].package, membership: actives[0].membership };
}

export function getMembershipAddOnRemaining(membership: Membership, addOnId: string): number {
  return membership.addOnUsage[addOnId] || 0;
}

export function getDaysRemaining(expirationDate: string): number {
  const now = new Date();
  const expDate = new Date(expirationDate);
  return Math.max(0, Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
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
  switch (type) {
    case "basic":
      return "Básico";
    case "complete":
      return "Completo";
    case "premium":
      return "Premium";
    case "detail":
      return "Detallado";
    case "full":
      return "Full";
    default:
      return type;
  }
}

export function getAddOnName(addOnId: string): string {
  const addon = ADD_ONS.find((a) => a.id === addOnId);
  return addon?.name || addOnId;
}
