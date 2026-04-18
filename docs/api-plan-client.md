# Plan de API — App Cliente (Car Wash)

> Documento de planeación. Ningún endpoint existe aún. Describe todos los endpoints que consume la **app móvil del cliente** para reemplazar AsyncStorage y conectarse al backend.
>
> Prefijo base: `/api`  
> Formato: JSON  
> Autenticación: Bearer token en header `Authorization: Bearer <token>` (salvo rutas marcadas como públicas)

---

## Patrón de creación idempotente

Cualquier formulario de la app (vehículo, dirección, cita, membresía) usa **dos pasos**:

**Paso 1 — Generar ID (`POST`)**  
La app llama al `POST` del recurso al abrir el formulario. El backend responde solo con un `id` nuevo. No se guarda nada más.

```
POST /api/vehicles
→ { id: "abc123" }
```

**Paso 2 — Guardar datos (`PUT`)**  
Al confirmar el formulario, la app hace `PUT` con el `id` del paso 1. El backend crea el recurso si no existía, o lo actualiza si ya existía (idempotente).

```
PUT /api/vehicles/abc123
body: { brand, model, color, size, plate }
→ { id: "abc123", brand, model, ... }
```

**Ventajas:**
- Si la red falla en el `PUT`, el cliente puede reintentar con el mismo `id` sin crear duplicados.
- Aplica igual para: vehículos, direcciones, membresías y citas.

---

## Tipos compartidos

> Estos tipos viven en `shared/types.ts` y son usados tanto por el cliente como por el admin.

```typescript
// ─── Enums ───────────────────────────────────────────────────────────────────

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

type UserRole = "client" | "admin" | "company";

// ─── Modelos principales ─────────────────────────────────────────────────────

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
  vehicleId?: string;
  addressId?: string;
  vehicleSize: VehicleSize;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehiclePlate?: string;
  addressLabel?: string;
  washType: WashType;
  addOns: string[];       // IDs de servicios seleccionados
  date: string;           // "YYYY-MM-DD"
  time: string;           // "10:00 AM"
  totalPrice: number;
  status: BookingStatus;
  assignedCompany?: Company; // empresa asignada para este servicio
  usedMembershipId?: string;
  comments?: string;
  feedback?: BookingFeedback;
  cancelledBy?: "client" | "admin" | "company";
  cancelReason?: string;
  createdAt: string;      // ISO
  updatedAt: string;      // ISO
}

interface BookingFeedback {
  rating: number;         // 1–5
  cleanliness: string;    // "excelente" | "buena" | "regular" | "mala"
  punctuality: string;    // "a_tiempo" | "leve_retraso" | "retraso"
  extras: string[];       // ["amabilidad", "productos", ...]
  comment?: string;
  createdAt: string;      // ISO
}

// Vista pública de una empresa (lo que ve el cliente)
interface Company {
  id: string;
  name: string;
  rating?: number;        // promedio de calificaciones recibidas
}

// ─── Wrappers de respuesta ────────────────────────────────────────────────────

interface ApiResponse<T> {
  success: true;
  data: T;
}

interface ApiError {
  success: false;
  error: {
    code: string;    // ej. "BOOKING_NOT_FOUND"
    message: string;
  };
}

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

interface GenerateIdResponse {
  id: string;
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

**Errores:**
- `400 EMAIL_ALREADY_EXISTS`
- `400 INVALID_PHONE`

---

### `POST /api/auth/login`
Inicia sesión.

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

**Errores:**
- `401 INVALID_CREDENTIALS`

---

### `POST /api/auth/logout`
Invalida el token. Requiere auth.

**Request body:** vacío  
**Response `200`:** `ApiResponse<{ message: string }>`

---

### `GET /api/auth/me`
Devuelve el usuario autenticado. Requiere auth.

**Response `200`:** `ApiResponse<User>`

---

## 2. Perfil — `/api/profile`

### `GET /api/profile`
Devuelve el perfil completo del usuario. Requiere auth.

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
Actualiza datos del perfil. Requiere auth.

**Request body:**
```typescript
interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  email?: string;
}
```

**Response `200`:** `ApiResponse<User>`

**Errores:**
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

**Response `200`:** `ApiResponse<{ message: string }>`

**Errores:**
- `401 INVALID_CURRENT_PASSWORD`

---

## 3. Vehículos — `/api/vehicles`

### `GET /api/vehicles`
Lista los vehículos del usuario. Requiere auth.

**Response `200`:** `ApiResponse<SavedVehicle[]>`

---

### `POST /api/vehicles` ★
Solo genera y devuelve un nuevo ID. Se llama al abrir el formulario de nuevo vehículo. Requiere auth.

**Request body:** vacío  
**Response `201`:** `ApiResponse<GenerateIdResponse>`

---

### `PUT /api/vehicles/:vehicleId`
Crea o actualiza un vehículo con el ID generado. Idempotente. Requiere auth.

**Request body:**
```typescript
interface UpsertVehicleRequest {
  brand: string;
  model: string;
  color: string;
  size: VehicleSize;
  plate?: string;
}
```

**Response `200`:** `ApiResponse<SavedVehicle>`

**Errores:**
- `403 FORBIDDEN`

---

### `DELETE /api/vehicles/:vehicleId`
Elimina un vehículo. Requiere auth.

**Response `200`:** `ApiResponse<{ message: string }>`

**Errores:**
- `404 VEHICLE_NOT_FOUND`
- `403 FORBIDDEN`

---

## 4. Direcciones — `/api/addresses`

### `GET /api/addresses`
Lista las direcciones del usuario. Requiere auth.

**Response `200`:** `ApiResponse<SavedAddress[]>`

---

### `POST /api/addresses` ★
Solo genera y devuelve un nuevo ID. Se llama al abrir el formulario de nueva dirección. Requiere auth.

**Request body:** vacío  
**Response `201`:** `ApiResponse<GenerateIdResponse>`

---

### `PUT /api/addresses/:addressId`
Crea o actualiza una dirección con el ID generado. Idempotente. El backend valida que `state`, `city` y `colony` sean zonas de cobertura. Requiere auth.

**Request body:**
```typescript
interface UpsertAddressRequest {
  alias: string;
  state: string;         // solo "Jalisco"
  city: string;          // solo "Tlajomulco de Zúñiga"
  colony: string;        // "Villa California" | "Casa Fuerte" | "Adamar"
  coto?: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  reference?: string;
}
```

**Response `200`:** `ApiResponse<SavedAddress>`

**Errores:**
- `403 FORBIDDEN`
- `400 INVALID_LOCATION`

---

### `DELETE /api/addresses/:addressId`
Elimina una dirección. Requiere auth.

**Response `200`:** `ApiResponse<{ message: string }>`

**Errores:**
- `404 ADDRESS_NOT_FOUND`
- `403 FORBIDDEN`

---

## 5. Membresías — `/api/memberships`

### `GET /api/memberships`
Lista las membresías del usuario. Requiere auth.

**Query params:**
```typescript
interface GetMembershipsQuery {
  status?: "active" | "expired" | "cancelled";
}
```

**Response `200`:** `ApiResponse<Membership[]>`

---

### `POST /api/memberships` ★
Solo genera y devuelve un nuevo ID. Se llama al iniciar el flujo de compra de un paquete. Requiere auth.

**Request body:** vacío  
**Response `201`:** `ApiResponse<GenerateIdResponse>`

---

### `PUT /api/memberships/:membershipId`
Activa la membresía con el ID generado. Idempotente. El backend calcula `expirationDate`, `washesRemaining` y `addOnUsage` según el paquete y duración. Requiere auth.

**Request body:**
```typescript
interface UpsertMembershipRequest {
  packageId: PackageId;
  durationId: DurationId;
  vehicleSize: VehicleSize;
}
```

**Response `200`:** `ApiResponse<Membership>`

**Errores:**
- `400 INVALID_PACKAGE`

---

### `GET /api/memberships/:membershipId`
Detalle de una membresía. Requiere auth.

**Response `200`:** `ApiResponse<Membership>`

**Errores:**
- `404 MEMBERSHIP_NOT_FOUND`
- `403 FORBIDDEN`

---

### `DELETE /api/memberships/:membershipId`
Cancela una membresía activa. Requiere auth.

**Response `200`:** `ApiResponse<Membership>`

**Errores:**
- `404 MEMBERSHIP_NOT_FOUND`
- `403 FORBIDDEN`
- `400 MEMBERSHIP_NOT_ACTIVE`

---

## 6. Citas — `/api/bookings`

> **Cómo funciona la asignación de empresa desde el cliente:**  
> El cliente **nunca elige** una empresa. Simplemente escoge un horario disponible y el backend asigna automáticamente una de las empresas de lavado disponibles en ese slot. Si la empresa asignada rechaza la cita, el sistema busca otra empresa disponible y la reasigna sin que el cliente tenga que hacer nada. El cliente solo ve el nombre de la empresa en el detalle de su cita una vez que fue confirmada. Todos los endpoints de citas del cliente son contra el sistema en general, no contra una empresa específica.

### `GET /api/bookings`
Lista las citas del usuario. Requiere auth.

**Query params:**
```typescript
interface GetBookingsQuery {
  status?: BookingStatus;
  page?: number;   // default: 1
  limit?: number;  // default: 20
}
```

**Response `200`:** `PaginatedResponse<Booking>`

---

### `GET /api/bookings/:bookingId`
Detalle de una cita. Requiere auth.

**Response `200`:** `ApiResponse<Booking>`

**Errores:**
- `404 BOOKING_NOT_FOUND`
- `403 FORBIDDEN`

---

### `POST /api/bookings` ★
Solo genera y devuelve un nuevo ID. Se llama al iniciar el flujo de reserva. Requiere auth.

**Request body:** vacío  
**Response `201`:** `ApiResponse<GenerateIdResponse>`

---

### `PUT /api/bookings/:bookingId`
Crea o actualiza la cita con el ID generado. Idempotente. El cliente **no indica empresa** — el backend selecciona automáticamente una empresa disponible en el horario elegido. Valida disponibilidad del horario y descuenta lavada de membresía si aplica. La cita queda con `status: "pending"` mientras la empresa confirma. Requiere auth.

**Request body:**
```typescript
interface UpsertBookingRequest {
  // Vehículo — una de las dos opciones:
  vehicleId?: string;
  vehicleSize?: VehicleSize;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehiclePlate?: string;

  // Dirección — una de las dos opciones:
  addressId?: string;
  addressLabel?: string;

  // Servicio
  washType: WashType;
  addOns: string[];       // IDs de servicios (incluidos + extras)

  // Horario
  date: string;           // "YYYY-MM-DD"
  time: string;           // "10:00 AM"

  // Pago
  membershipId?: string;  // si usa membresía → precio = 0

  // Extra
  comments?: string;
}
```

**Response `200`:** `ApiResponse<Booking>`

**Errores:**
- `400 SLOT_UNAVAILABLE`
- `400 INVALID_MEMBERSHIP`
- `400 MEMBERSHIP_VEHICLE_MISMATCH`
- `400 INVALID_LOCATION`
- `400 INVALID_ADDON`

---

### `PATCH /api/bookings/:bookingId/reschedule`
Reagenda una cita. Solo permitido en estado `pending` o `accepted`. Requiere auth.

**Request body:**
```typescript
interface RescheduleBookingRequest {
  date: string; // "YYYY-MM-DD"
  time: string; // "10:00 AM"
}
```

**Response `200`:** `ApiResponse<Booking>`

**Errores:**
- `404 BOOKING_NOT_FOUND`
- `403 FORBIDDEN`
- `400 CANNOT_RESCHEDULE`
- `400 SLOT_UNAVAILABLE`

---

### `PATCH /api/bookings/:bookingId/cancel`
Cancela una cita. No permitido en estado `in_progress` o `completed`. Requiere auth.

**Request body:**
```typescript
interface CancelBookingRequest {
  reason?: string;
}
```

**Response `200`:** `ApiResponse<Booking>`

**Errores:**
- `404 BOOKING_NOT_FOUND`
- `403 FORBIDDEN`
- `400 CANNOT_CANCEL`

---

### `POST /api/bookings/:bookingId/feedback`
Envía el feedback de una cita completada. Solo si `status === "completed"` y no tiene feedback previo. Requiere auth.

**Request body:**
```typescript
interface CreateFeedbackRequest {
  rating: number;        // 1–5
  cleanliness: string;   // "excelente" | "buena" | "regular" | "mala"
  punctuality: string;   // "a_tiempo" | "leve_retraso" | "retraso"
  extras: string[];      // ["amabilidad", "productos", "rapidez", ...]
  comment?: string;
}
```

**Response `201`:** `ApiResponse<Booking>`

**Errores:**
- `404 BOOKING_NOT_FOUND`
- `403 FORBIDDEN`
- `400 BOOKING_NOT_COMPLETED`
- `400 FEEDBACK_ALREADY_EXISTS`

---

## 7. Disponibilidad — `/api/availability`

### `GET /api/availability`
Consulta los horarios disponibles para una fecha. Ruta pública — no requiere auth.

La disponibilidad de cada horario está determinada por cuántas empresas de lavado están disponibles en ese horario. Si a las 11 AM hay 5 empresas registradas y disponibles, `spotsLeft` es 5. Al agendar una cita en ese horario, el backend asigna una empresa y el `spotsLeft` baja a 4.

**Query params:**
```typescript
interface GetAvailabilityQuery {
  date: string;             // "YYYY-MM-DD"
  vehicleSize: VehicleSize; // para calcular duración estimada del slot
}
```

**Response `200`:**
```typescript
interface AvailabilityResponse {
  date: string;
  slots: TimeSlot[];
}

interface TimeSlot {
  time: string;       // "09:00 AM"
  available: boolean; // false si spotsLeft === 0 o la fecha está bloqueada
  spotsLeft: number;  // número de empresas disponibles en este horario
}

// ApiResponse<AvailabilityResponse>
```

---

## 8. Catálogo — `/api/catalog`

Rutas públicas — no requieren auth. La app las consume para mostrar paquetes y precios en vez de tenerlos hardcodeados.

### `GET /api/catalog/packages`
Lista todos los paquetes disponibles con precios y duraciones.

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

### `GET /api/catalog/companies`
Lista las empresas de lavado activas registradas en el sistema. Ruta pública.

**Response `200`:**
```typescript
// ApiResponse<Company[]>
```

---

### `GET /api/catalog/services`
Lista tipos de lavado, add-ons y precios base por tamaño de vehículo.

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

## 9. Tabla resumen

> ★ = el `POST` solo genera un ID. El `PUT` correspondiente crea o actualiza el recurso.

| Método   | Endpoint                              | Auth    | Descripción                                  |
|----------|---------------------------------------|---------|----------------------------------------------|
| POST     | `/api/auth/register`                  | Pública | Registrar nuevo cliente                      |
| POST     | `/api/auth/login`                     | Pública | Iniciar sesión                               |
| POST     | `/api/auth/logout`                    | Cliente | Cerrar sesión                                |
| GET      | `/api/auth/me`                        | Cliente | Usuario autenticado actual                   |
| GET      | `/api/profile`                        | Cliente | Perfil completo                              |
| PUT      | `/api/profile`                        | Cliente | Actualizar perfil                            |
| PUT      | `/api/profile/password`               | Cliente | Cambiar contraseña                           |
| GET      | `/api/vehicles`                       | Cliente | Listar vehículos                             |
| POST ★   | `/api/vehicles`                       | Cliente | Generar ID para nuevo vehículo               |
| PUT      | `/api/vehicles/:id`                   | Cliente | Crear o actualizar vehículo                  |
| DELETE   | `/api/vehicles/:id`                   | Cliente | Eliminar vehículo                            |
| GET      | `/api/addresses`                      | Cliente | Listar direcciones                           |
| POST ★   | `/api/addresses`                      | Cliente | Generar ID para nueva dirección              |
| PUT      | `/api/addresses/:id`                  | Cliente | Crear o actualizar dirección                 |
| DELETE   | `/api/addresses/:id`                  | Cliente | Eliminar dirección                           |
| GET      | `/api/memberships`                    | Cliente | Listar membresías                            |
| POST ★   | `/api/memberships`                    | Cliente | Generar ID para nueva membresía              |
| PUT      | `/api/memberships/:id`                | Cliente | Activar membresía                            |
| GET      | `/api/memberships/:id`                | Cliente | Detalle de membresía                         |
| DELETE   | `/api/memberships/:id`                | Cliente | Cancelar membresía                           |
| GET      | `/api/bookings`                       | Cliente | Listar mis citas                             |
| GET      | `/api/bookings/:id`                   | Cliente | Detalle de cita                              |
| POST ★   | `/api/bookings`                       | Cliente | Generar ID para nueva cita                   |
| PUT      | `/api/bookings/:id`                   | Cliente | Crear o actualizar cita                      |
| PATCH    | `/api/bookings/:id/reschedule`        | Cliente | Reagendar cita                               |
| PATCH    | `/api/bookings/:id/cancel`            | Cliente | Cancelar cita                                |
| POST     | `/api/bookings/:id/feedback`          | Cliente | Enviar feedback                              |
| GET      | `/api/availability`                   | Pública | Consultar horarios disponibles (spotsLeft = empresas disponibles) |
| GET      | `/api/catalog/companies`              | Pública | Listar empresas de lavado activas            |
| GET      | `/api/catalog/packages`               | Pública | Catálogo de paquetes                         |
| GET      | `/api/catalog/services`               | Pública | Catálogo de servicios y precios              |
