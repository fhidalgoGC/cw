# Plan de API — Car Wash Backend

> Documento de planeación. Ningún endpoint existe aún. Este plan describe todos los endpoints que se deben implementar en el backend Express para que la app deje de depender de AsyncStorage y toda la lógica de negocio pase por la API.
>
> Prefijo base: `/api`  
> Formato: JSON  
> Autenticación: Bearer token en header `Authorization: Bearer <token>` (salvo rutas públicas)

---

## Tipos base compartidos

Estos tipos se usan a lo largo de todos los endpoints y deben vivir en `shared/types.ts`.

```typescript
// ─── Enums ──────────────────────────────────────────────────────────────────

type VehicleSize = "small" | "suv" | "large";

type WashType = "basic" | "complete" | "premium" | "detail" | "full";

type BookingStatus =
  | "pending"      // recién creada, esperando que el admin la acepte
  | "accepted"     // admin aceptó
  | "in_progress"  // servicio en curso
  | "completed"    // servicio terminado
  | "cancelled";   // cancelada por cliente o admin

type PackageId = "basico" | "completo" | "premium";

type DurationId = "1semana" | "1mes" | "3meses";

type UserRole = "client" | "admin";

// ─── Modelos principales ────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  createdAt: string; // ISO
}

interface SavedVehicle {
  id: string;
  userId: string;
  brand: string;
  model: string;
  color: string;
  size: VehicleSize;
  plate?: string;
}

interface SavedAddress {
  id: string;
  userId: string;
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

interface Membership {
  id: string;
  userId: string;
  packageId: PackageId;
  durationId: DurationId;
  vehicleSize: VehicleSize;
  activatedAt: string;    // ISO
  expirationDate: string; // ISO
  washesRemaining: number;
  addOnUsage: Record<string, number>; // { [addOnId]: usosRestantes }
  status: "active" | "expired" | "cancelled";
}

interface Booking {
  id: string;
  userId: string;
  vehicleId?: string;        // si seleccionó vehículo guardado
  addressId?: string;        // si seleccionó dirección guardada
  vehicleSize: VehicleSize;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehiclePlate?: string;
  addressLabel?: string;
  washType: WashType;
  addOns: string[];          // IDs de servicios seleccionados
  date: string;              // ISO date "YYYY-MM-DD"
  time: string;              // "10:00 AM"
  totalPrice: number;
  status: BookingStatus;
  usedMembershipId?: string; // si se pagó con membresía
  comments?: string;
  feedback?: BookingFeedback;
  cancelledBy?: "client" | "admin";
  cancelReason?: string;
  createdAt: string;         // ISO
  updatedAt: string;         // ISO
}

interface BookingFeedback {
  rating: number;            // 1–5
  cleanliness: string;       // "excelente" | "buena" | "regular" | "mala"
  punctuality: string;       // "a_tiempo" | "leve_retraso" | "retraso"
  extras: string[];          // ["amabilidad", "productos", ...]
  comment?: string;
  createdAt: string;         // ISO
}

// ─── Wrapper de respuestas ───────────────────────────────────────────────────

// Respuesta exitosa
interface ApiResponse<T> {
  success: true;
  data: T;
}

// Respuesta de error
interface ApiError {
  success: false;
  error: {
    code: string;    // ej. "BOOKING_NOT_FOUND"
    message: string; // mensaje legible
  };
}

// Respuesta paginada
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

---

## 1. Autenticación — `/api/auth`

### `POST /api/auth/register`
Registra un nuevo usuario cliente.

**Request body:**
```typescript
interface RegisterRequest {
  name: string;
  phone: string;
  email: string;
  password: string;
}
```

**Response `201`:**
```typescript
interface RegisterResponse {
  user: User;
  token: string;
}
// ApiResponse<RegisterResponse>
```

**Errores posibles:**
- `400 EMAIL_ALREADY_EXISTS` — el email ya está registrado
- `400 INVALID_PHONE` — formato de teléfono inválido

---

### `POST /api/auth/login`
Inicia sesión con email y contraseña.

**Request body:**
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Response `200`:**
```typescript
interface LoginResponse {
  user: User;
  token: string;
}
// ApiResponse<LoginResponse>
```

**Errores posibles:**
- `401 INVALID_CREDENTIALS` — email o contraseña incorrectos

---

### `POST /api/auth/logout`
Invalida el token actual. Requiere auth.

**Request body:** vacío

**Response `200`:**
```typescript
// ApiResponse<{ message: string }>
```

---

### `GET /api/auth/me`
Devuelve el usuario autenticado actual. Requiere auth.

**Response `200`:**
```typescript
// ApiResponse<User>
```

---

## 2. Perfil — `/api/profile`

### `GET /api/profile`
Devuelve el perfil completo del usuario autenticado. Requiere auth.

**Response `200`:**
```typescript
interface ProfileResponse {
  user: User;
  vehicles: SavedVehicle[];
  addresses: SavedAddress[];
  memberships: Membership[];
}
// ApiResponse<ProfileResponse>
```

---

### `PUT /api/profile`
Actualiza los datos del perfil. Requiere auth.

**Request body:**
```typescript
interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  email?: string;
}
```

**Response `200`:**
```typescript
// ApiResponse<User>
```

**Errores posibles:**
- `400 EMAIL_ALREADY_EXISTS`

---

### `PUT /api/profile/password`
Cambia la contraseña. Requiere auth.

**Request body:**
```typescript
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
```

**Response `200`:**
```typescript
// ApiResponse<{ message: string }>
```

**Errores posibles:**
- `401 INVALID_CURRENT_PASSWORD`

---

## 3. Vehículos — `/api/vehicles`

### `GET /api/vehicles`
Lista todos los vehículos del usuario autenticado. Requiere auth.

**Response `200`:**
```typescript
// ApiResponse<SavedVehicle[]>
```

---

### `POST /api/vehicles`
Guarda un nuevo vehículo. Requiere auth.

**Request body:**
```typescript
interface CreateVehicleRequest {
  brand: string;
  model: string;
  color: string;
  size: VehicleSize;
  plate?: string;
}
```

**Response `201`:**
```typescript
// ApiResponse<SavedVehicle>
```

---

### `PUT /api/vehicles/:vehicleId`
Edita un vehículo existente. Requiere auth.

**Request body:**
```typescript
interface UpdateVehicleRequest {
  brand?: string;
  model?: string;
  color?: string;
  size?: VehicleSize;
  plate?: string;
}
```

**Response `200`:**
```typescript
// ApiResponse<SavedVehicle>
```

**Errores posibles:**
- `404 VEHICLE_NOT_FOUND`
- `403 FORBIDDEN` — el vehículo no pertenece al usuario

---

### `DELETE /api/vehicles/:vehicleId`
Elimina un vehículo. Requiere auth.

**Response `200`:**
```typescript
// ApiResponse<{ message: string }>
```

**Errores posibles:**
- `404 VEHICLE_NOT_FOUND`
- `403 FORBIDDEN`

---

## 4. Direcciones — `/api/addresses`

### `GET /api/addresses`
Lista todas las direcciones del usuario autenticado. Requiere auth.

**Response `200`:**
```typescript
// ApiResponse<SavedAddress[]>
```

---

### `POST /api/addresses`
Guarda una nueva dirección. Requiere auth.

El backend valida que `state`, `city` y `colony` sean valores permitidos.

**Request body:**
```typescript
interface CreateAddressRequest {
  alias: string;
  state: string;       // solo "Jalisco"
  city: string;        // solo "Tlajomulco de Zúñiga"
  colony: string;      // "Villa California" | "Casa Fuerte" | "Adamar"
  coto?: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  reference?: string;
}
```

**Response `201`:**
```typescript
// ApiResponse<SavedAddress>
```

**Errores posibles:**
- `400 INVALID_LOCATION` — estado, ciudad o colonia fuera de cobertura

---

### `PUT /api/addresses/:addressId`
Edita una dirección existente. Requiere auth.

**Request body:**
```typescript
interface UpdateAddressRequest {
  alias?: string;
  state?: string;
  city?: string;
  colony?: string;
  coto?: string;
  street?: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  reference?: string;
}
```

**Response `200`:**
```typescript
// ApiResponse<SavedAddress>
```

**Errores posibles:**
- `404 ADDRESS_NOT_FOUND`
- `403 FORBIDDEN`
- `400 INVALID_LOCATION`

---

### `DELETE /api/addresses/:addressId`
Elimina una dirección. Requiere auth.

**Response `200`:**
```typescript
// ApiResponse<{ message: string }>
```

**Errores posibles:**
- `404 ADDRESS_NOT_FOUND`
- `403 FORBIDDEN`

---

## 5. Membresías — `/api/memberships`

### `GET /api/memberships`
Lista todas las membresías del usuario autenticado (activas, vencidas y canceladas). Requiere auth.

**Query params:**
```typescript
interface GetMembershipsQuery {
  status?: "active" | "expired" | "cancelled"; // filtro opcional
}
```

**Response `200`:**
```typescript
// ApiResponse<Membership[]>
```

---

### `POST /api/memberships`
Activa (compra) una nueva membresía. Requiere auth.

El backend calcula `expirationDate`, `washesRemaining` y `addOnUsage` según el paquete y duración.

**Request body:**
```typescript
interface CreateMembershipRequest {
  packageId: PackageId;
  durationId: DurationId;
  vehicleSize: VehicleSize;
  // En el futuro: paymentMethodId para procesar pago real
}
```

**Response `201`:**
```typescript
// ApiResponse<Membership>
```

**Errores posibles:**
- `400 INVALID_PACKAGE` — packageId o durationId no existe

---

### `GET /api/memberships/:membershipId`
Detalle de una membresía específica. Requiere auth.

**Response `200`:**
```typescript
// ApiResponse<Membership>
```

**Errores posibles:**
- `404 MEMBERSHIP_NOT_FOUND`
- `403 FORBIDDEN`

---

### `DELETE /api/memberships/:membershipId`
Cancela una membresía activa. Requiere auth.

**Response `200`:**
```typescript
// ApiResponse<Membership> // membership con status: "cancelled"
```

**Errores posibles:**
- `404 MEMBERSHIP_NOT_FOUND`
- `403 FORBIDDEN`
- `400 MEMBERSHIP_NOT_ACTIVE` — ya está cancelada o vencida

---

## 6. Reservas / Citas — `/api/bookings`

### `GET /api/bookings`
Lista las citas del usuario autenticado. Requiere auth.

**Query params:**
```typescript
interface GetBookingsQuery {
  status?: BookingStatus;
  page?: number;    // default: 1
  limit?: number;   // default: 20
}
```

**Response `200`:**
```typescript
// PaginatedResponse<Booking>
```

---

### `GET /api/bookings/:bookingId`
Detalle de una cita. Requiere auth.

**Response `200`:**
```typescript
// ApiResponse<Booking>
```

**Errores posibles:**
- `404 BOOKING_NOT_FOUND`
- `403 FORBIDDEN`

---

### `POST /api/bookings`
Crea una nueva reserva. Requiere auth.

El backend valida disponibilidad del horario, descuenta la lavada de la membresía si se indica `membershipId`, y crea la cita con `status: "pending"`.

**Request body:**
```typescript
interface CreateBookingRequest {
  // Vehículo — una de las dos opciones:
  vehicleId?: string;       // ID de vehículo guardado
  vehicleSize?: VehicleSize; // o indicar tamaño directo
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehiclePlate?: string;

  // Dirección — una de las dos opciones:
  addressId?: string;       // ID de dirección guardada
  addressLabel?: string;    // o texto libre

  // Servicio
  washType: WashType;
  addOns: string[];         // IDs de servicios extra seleccionados

  // Horario
  date: string;             // "YYYY-MM-DD"
  time: string;             // "10:00 AM"

  // Pago
  membershipId?: string;    // si usa membresía (precio = 0)
  // En el futuro: paymentMethodId

  // Extra
  comments?: string;
}
```

**Response `201`:**
```typescript
// ApiResponse<Booking>
```

**Errores posibles:**
- `400 SLOT_UNAVAILABLE` — el horario ya no está disponible
- `400 INVALID_MEMBERSHIP` — membresía no activa, vencida o sin lavadas
- `400 MEMBERSHIP_VEHICLE_MISMATCH` — el tamaño del vehículo no coincide con la membresía
- `400 INVALID_LOCATION` — dirección fuera de cobertura
- `400 INVALID_ADDON` — ID de add-on no existe

---

### `PATCH /api/bookings/:bookingId/reschedule`
Reagenda una cita (solo si está en estado `pending` o `accepted`). Requiere auth.

**Request body:**
```typescript
interface RescheduleBookingRequest {
  date: string; // "YYYY-MM-DD"
  time: string; // "10:00 AM"
}
```

**Response `200`:**
```typescript
// ApiResponse<Booking>
```

**Errores posibles:**
- `404 BOOKING_NOT_FOUND`
- `403 FORBIDDEN`
- `400 CANNOT_RESCHEDULE` — la cita está en un estado que no permite reagendar
- `400 SLOT_UNAVAILABLE`

---

### `PATCH /api/bookings/:bookingId/cancel`
Cancela una cita (cliente). Requiere auth.

**Request body:**
```typescript
interface CancelBookingRequest {
  reason?: string;
}
```

**Response `200`:**
```typescript
// ApiResponse<Booking>
```

**Errores posibles:**
- `404 BOOKING_NOT_FOUND`
- `403 FORBIDDEN`
- `400 CANNOT_CANCEL` — la cita está en un estado que no permite cancelar (`in_progress` o `completed`)

---

### `POST /api/bookings/:bookingId/feedback`
Envía el feedback de una cita completada. Requiere auth.

Solo disponible si `status === "completed"` y la cita no tiene feedback previo.

**Request body:**
```typescript
interface CreateFeedbackRequest {
  rating: number;          // 1–5
  cleanliness: string;     // "excelente" | "buena" | "regular" | "mala"
  punctuality: string;     // "a_tiempo" | "leve_retraso" | "retraso"
  extras: string[];        // ["amabilidad", "productos", ...]
  comment?: string;
}
```

**Response `201`:**
```typescript
// ApiResponse<Booking> // booking con feedback incluido
```

**Errores posibles:**
- `404 BOOKING_NOT_FOUND`
- `403 FORBIDDEN`
- `400 BOOKING_NOT_COMPLETED` — la cita no está completada
- `400 FEEDBACK_ALREADY_EXISTS` — ya existe feedback para esta cita

---

## 7. Disponibilidad — `/api/availability`

### `GET /api/availability`
Consulta los horarios disponibles para una fecha dada. Ruta pública.

**Query params:**
```typescript
interface GetAvailabilityQuery {
  date: string;           // "YYYY-MM-DD"
  vehicleSize: VehicleSize; // para calcular duración estimada
}
```

**Response `200`:**
```typescript
interface AvailabilityResponse {
  date: string;
  slots: TimeSlot[];
}

interface TimeSlot {
  time: string;        // "09:00 AM"
  available: boolean;
  spotsLeft: number;   // cuántos lugares quedan en ese horario
}

// ApiResponse<AvailabilityResponse>
```

---

## 8. Catálogo — `/api/catalog`

Rutas públicas (no requieren auth) para que la app obtenga los datos del catálogo desde el backend en vez de tenerlos hardcodeados.

### `GET /api/catalog/packages`
Lista todos los paquetes disponibles con sus precios y duraciones.

**Response `200`:**
```typescript
interface PackageCatalog {
  id: PackageId;
  name: string;
  washType: WashType;
  description: string;
  color: string;
  popular?: boolean;
  perks: string[];
  addOnsIncluded: PackageAddOnCatalog[];
  durations: PackageDurationCatalog[];
}

interface PackageAddOnCatalog {
  addOnId: string;
  includedUses: number;
}

interface PackageDurationCatalog {
  id: DurationId;
  label: string;
  days: number;
  washesIncluded: number;
  prices: Record<VehicleSize, number>;
}

// ApiResponse<PackageCatalog[]>
```

---

### `GET /api/catalog/services`
Lista todos los servicios disponibles (tipos de lavado y add-ons) con sus precios.

**Response `200`:**
```typescript
interface ServiceCatalogResponse {
  vehiclePrices: Record<VehicleSize, number>;
  washTypePrices: Record<WashType, number>;
  services: ServiceOption[];
}

interface ServiceOption {
  id: string;
  name: string;
  price: number;
  includedIn: WashType[];
  minMinutes: number;
  maxMinutes: number;
}

// ApiResponse<ServiceCatalogResponse>
```

---

## 9. Admin — `/api/admin`

Todos los endpoints de esta sección requieren auth y que el usuario tenga `role: "admin"`. El backend debe retornar `403 FORBIDDEN` si un cliente intenta acceder.

---

### 9.1 Gestión de citas

#### `GET /api/admin/bookings`
Lista todas las citas del sistema con filtros. Requiere rol admin.

**Query params:**
```typescript
interface AdminGetBookingsQuery {
  status?: BookingStatus;
  date?: string;          // "YYYY-MM-DD" — citas de ese día
  dateFrom?: string;      // rango de fechas
  dateTo?: string;
  userId?: string;        // filtrar por cliente
  page?: number;          // default: 1
  limit?: number;         // default: 20
}
```

**Response `200`:**
```typescript
interface AdminBookingItem {
  id: string;
  userId: string;
  clientName: string;
  clientPhone: string;
  vehicleSize: VehicleSize;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehiclePlate?: string;
  addressLabel?: string;
  washType: WashType;
  addOns: string[];
  date: string;
  time: string;
  totalPrice: number;
  status: BookingStatus;
  usedMembershipId?: string;
  comments?: string;
  feedback?: BookingFeedback;
  cancelledBy?: "client" | "admin";
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

// PaginatedResponse<AdminBookingItem>
```

---

#### `GET /api/admin/bookings/:bookingId`
Detalle completo de una cita. Requiere rol admin.

**Response `200`:**
```typescript
// ApiResponse<AdminBookingItem>
```

---

#### `PATCH /api/admin/bookings/:bookingId/accept`
El admin acepta una cita (cambia status a `"accepted"`). Requiere rol admin.

**Request body:** vacío

**Response `200`:**
```typescript
// ApiResponse<AdminBookingItem>
```

**Errores posibles:**
- `404 BOOKING_NOT_FOUND`
- `400 INVALID_STATUS_TRANSITION` — solo se puede aceptar si está en `"pending"`

---

#### `PATCH /api/admin/bookings/:bookingId/start`
El admin marca una cita como en curso (cambia status a `"in_progress"`). Requiere rol admin.

**Request body:** vacío

**Response `200`:**
```typescript
// ApiResponse<AdminBookingItem>
```

**Errores posibles:**
- `404 BOOKING_NOT_FOUND`
- `400 INVALID_STATUS_TRANSITION` — solo se puede iniciar si está en `"accepted"`

---

#### `PATCH /api/admin/bookings/:bookingId/complete`
El admin marca una cita como completada (cambia status a `"completed"`). Requiere rol admin.

**Request body:** vacío

**Response `200`:**
```typescript
// ApiResponse<AdminBookingItem>
```

**Errores posibles:**
- `404 BOOKING_NOT_FOUND`
- `400 INVALID_STATUS_TRANSITION` — solo se puede completar si está en `"in_progress"`

---

#### `PATCH /api/admin/bookings/:bookingId/cancel`
El admin cancela una cita. Requiere rol admin.

**Request body:**
```typescript
interface AdminCancelBookingRequest {
  reason?: string;
}
```

**Response `200`:**
```typescript
// ApiResponse<AdminBookingItem>
```

**Errores posibles:**
- `404 BOOKING_NOT_FOUND`
- `400 CANNOT_CANCEL` — no se puede cancelar si está en `"completed"`

---

### 9.2 Agenda del día

#### `GET /api/admin/agenda`
Vista de agenda de un día específico, ordenada por hora. Requiere rol admin.

**Query params:**
```typescript
interface AdminAgendaQuery {
  date: string; // "YYYY-MM-DD"
}
```

**Response `200`:**
```typescript
interface AgendaResponse {
  date: string;
  totalBookings: number;
  pendingCount: number;
  acceptedCount: number;
  inProgressCount: number;
  completedCount: number;
  cancelledCount: number;
  bookings: AdminBookingItem[]; // ordenadas por hora asc
}

// ApiResponse<AgendaResponse>
```

---

### 9.3 Disponibilidad / Horarios

#### `GET /api/admin/availability`
Consulta la configuración de horarios disponibles. Requiere rol admin.

**Response `200`:**
```typescript
interface AvailabilityConfig {
  slots: ScheduleSlot[];
  maxConcurrentBookings: number; // cuántas citas simultáneas se aceptan
  blockedDates: string[];        // fechas bloqueadas "YYYY-MM-DD"
}

interface ScheduleSlot {
  time: string;   // "09:00 AM"
  enabled: boolean;
}

// ApiResponse<AvailabilityConfig>
```

---

#### `PUT /api/admin/availability`
Actualiza la configuración de horarios. Requiere rol admin.

**Request body:**
```typescript
interface UpdateAvailabilityRequest {
  slots?: ScheduleSlot[];
  maxConcurrentBookings?: number;
}
```

**Response `200`:**
```typescript
// ApiResponse<AvailabilityConfig>
```

---

#### `POST /api/admin/availability/block`
Bloquea una o varias fechas (no se pueden agendar citas). Requiere rol admin.

**Request body:**
```typescript
interface BlockDatesRequest {
  dates: string[]; // ["YYYY-MM-DD", ...]
  reason?: string;
}
```

**Response `200`:**
```typescript
// ApiResponse<{ blockedDates: string[] }>
```

---

#### `DELETE /api/admin/availability/block`
Desbloquea fechas previamente bloqueadas. Requiere rol admin.

**Request body:**
```typescript
interface UnblockDatesRequest {
  dates: string[]; // ["YYYY-MM-DD", ...]
}
```

**Response `200`:**
```typescript
// ApiResponse<{ blockedDates: string[] }>
```

---

### 9.4 Finanzas / Reportes

#### `GET /api/admin/reports/revenue`
Reporte de ingresos por período. Requiere rol admin.

**Query params:**
```typescript
interface RevenueReportQuery {
  period: "day" | "week" | "month" | "custom";
  date?: string;     // para period: "day"
  dateFrom?: string; // para period: "custom"
  dateTo?: string;   // para period: "custom"
}
```

**Response `200`:**
```typescript
interface RevenueReport {
  period: string;
  dateFrom: string;
  dateTo: string;
  totalRevenue: number;
  membershipRevenue: number;   // de compras de membresía
  individualRevenue: number;   // de citas pagadas sin membresía
  completedBookings: number;
  cancelledBookings: number;
  averageTicket: number;
  revenueByDay: RevenueByDay[];
}

interface RevenueByDay {
  date: string;
  revenue: number;
  bookingsCount: number;
}

// ApiResponse<RevenueReport>
```

---

#### `GET /api/admin/reports/services`
Reporte de servicios más solicitados. Requiere rol admin.

**Query params:**
```typescript
interface ServicesReportQuery {
  dateFrom?: string;
  dateTo?: string;
}
```

**Response `200`:**
```typescript
interface ServicesReport {
  washTypeBreakdown: WashTypeCount[];
  addOnBreakdown: AddOnCount[];
  vehicleSizeBreakdown: VehicleSizeCount[];
}

interface WashTypeCount {
  washType: WashType;
  count: number;
  percentage: number;
}

interface AddOnCount {
  addOnId: string;
  addOnName: string;
  count: number;
}

interface VehicleSizeCount {
  vehicleSize: VehicleSize;
  count: number;
  percentage: number;
}

// ApiResponse<ServicesReport>
```

---

### 9.5 Gestión de clientes

#### `GET /api/admin/clients`
Lista todos los clientes registrados. Requiere rol admin.

**Query params:**
```typescript
interface AdminGetClientsQuery {
  search?: string;  // búsqueda por nombre, email o teléfono
  page?: number;
  limit?: number;
}
```

**Response `200`:**
```typescript
interface AdminClientItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
  totalBookings: number;
  completedBookings: number;
  activeMembershipsCount: number;
  totalSpent: number;
}

// PaginatedResponse<AdminClientItem>
```

---

#### `GET /api/admin/clients/:userId`
Perfil completo de un cliente. Requiere rol admin.

**Response `200`:**
```typescript
interface AdminClientDetail {
  user: User;
  vehicles: SavedVehicle[];
  addresses: SavedAddress[];
  memberships: Membership[];
  recentBookings: AdminBookingItem[];
  stats: {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalSpent: number;
  };
}

// ApiResponse<AdminClientDetail>
```

---

## 10. Tabla resumen de endpoints

| Método   | Endpoint                                       | Auth      | Descripción                                |
|----------|------------------------------------------------|-----------|--------------------------------------------|
| POST     | `/api/auth/register`                           | Pública   | Registrar nuevo usuario                    |
| POST     | `/api/auth/login`                              | Pública   | Iniciar sesión                             |
| POST     | `/api/auth/logout`                             | Cliente   | Cerrar sesión                              |
| GET      | `/api/auth/me`                                 | Cliente   | Usuario autenticado actual                 |
| GET      | `/api/profile`                                 | Cliente   | Perfil completo                            |
| PUT      | `/api/profile`                                 | Cliente   | Actualizar perfil                          |
| PUT      | `/api/profile/password`                        | Cliente   | Cambiar contraseña                         |
| GET      | `/api/vehicles`                                | Cliente   | Listar vehículos                           |
| POST     | `/api/vehicles`                                | Cliente   | Agregar vehículo                           |
| PUT      | `/api/vehicles/:id`                            | Cliente   | Editar vehículo                            |
| DELETE   | `/api/vehicles/:id`                            | Cliente   | Eliminar vehículo                          |
| GET      | `/api/addresses`                               | Cliente   | Listar direcciones                         |
| POST     | `/api/addresses`                               | Cliente   | Agregar dirección                          |
| PUT      | `/api/addresses/:id`                           | Cliente   | Editar dirección                           |
| DELETE   | `/api/addresses/:id`                           | Cliente   | Eliminar dirección                         |
| GET      | `/api/memberships`                             | Cliente   | Listar membresías                          |
| POST     | `/api/memberships`                             | Cliente   | Comprar membresía                          |
| GET      | `/api/memberships/:id`                         | Cliente   | Detalle de membresía                       |
| DELETE   | `/api/memberships/:id`                         | Cliente   | Cancelar membresía                         |
| GET      | `/api/bookings`                                | Cliente   | Listar mis citas                           |
| GET      | `/api/bookings/:id`                            | Cliente   | Detalle de cita                            |
| POST     | `/api/bookings`                                | Cliente   | Crear nueva cita                           |
| PATCH    | `/api/bookings/:id/reschedule`                 | Cliente   | Reagendar cita                             |
| PATCH    | `/api/bookings/:id/cancel`                     | Cliente   | Cancelar cita                              |
| POST     | `/api/bookings/:id/feedback`                   | Cliente   | Enviar feedback de cita                    |
| GET      | `/api/availability`                            | Pública   | Consultar horarios disponibles             |
| GET      | `/api/catalog/packages`                        | Pública   | Catálogo de paquetes                       |
| GET      | `/api/catalog/services`                        | Pública   | Catálogo de servicios y precios            |
| GET      | `/api/admin/bookings`                          | Admin     | Listar todas las citas                     |
| GET      | `/api/admin/bookings/:id`                      | Admin     | Detalle de cita                            |
| PATCH    | `/api/admin/bookings/:id/accept`               | Admin     | Aceptar cita                               |
| PATCH    | `/api/admin/bookings/:id/start`                | Admin     | Marcar cita en curso                       |
| PATCH    | `/api/admin/bookings/:id/complete`             | Admin     | Marcar cita completada                     |
| PATCH    | `/api/admin/bookings/:id/cancel`               | Admin     | Cancelar cita                              |
| GET      | `/api/admin/agenda`                            | Admin     | Agenda del día                             |
| GET      | `/api/admin/availability`                      | Admin     | Config de horarios                         |
| PUT      | `/api/admin/availability`                      | Admin     | Actualizar config de horarios              |
| POST     | `/api/admin/availability/block`                | Admin     | Bloquear fechas                            |
| DELETE   | `/api/admin/availability/block`                | Admin     | Desbloquear fechas                         |
| GET      | `/api/admin/reports/revenue`                   | Admin     | Reporte de ingresos                        |
| GET      | `/api/admin/reports/services`                  | Admin     | Reporte de servicios                       |
| GET      | `/api/admin/clients`                           | Admin     | Listar clientes                            |
| GET      | `/api/admin/clients/:userId`                   | Admin     | Perfil completo de cliente                 |

---

## 11. Transiciones de estado válidas para una cita

```
pending ──── accept ──── accepted ──── start ──── in_progress ──── complete ──── completed
   │                        │
   └───── cancel ───────────┴─────────────────────────────────────── cancel ──── cancelled
         (cliente o admin)                                           (admin)
```

> Una cita en `in_progress` o `completed` **no puede cancelarse** desde el lado del cliente. Solo el admin puede cancelar una cita `in_progress` si es necesario. Una cita `completed` no puede cancelarse por nadie.
