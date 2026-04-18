# Plan de API — App Administrador (Car Wash)

> Documento de planeación. Ningún endpoint existe aún. Describe todos los endpoints que consume la **app del administrador** para gestionar el negocio: citas, catálogos, reportes, clientes y disponibilidad.
>
> Prefijo base: `/api/admin`  
> Formato: JSON  
> Autenticación: Bearer token en header `Authorization: Bearer <token>`  
> Todos los endpoints requieren `role: "admin"`. El backend retorna `403 FORBIDDEN` si un cliente intenta acceder.

---

## Tipos compartidos

> Los tipos base (`User`, `Booking`, `Membership`, `VehicleSize`, `WashType`, `BookingStatus`, `ApiResponse<T>`, `PaginatedResponse<T>`, etc.) están definidos en `shared/types.ts`. Ver `api-plan-client.md` para la referencia completa.

Tipos adicionales exclusivos del admin:

```typescript
// Empresa de lavado registrada en el sistema
interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  rating?: number;           // promedio de calificaciones
  totalBookings: number;
  completedBookings: number;
  createdAt: string;         // ISO
}

// Disponibilidad de una empresa (sus propios horarios)
interface CompanyAvailability {
  companyId: string;
  slots: CompanySlot[];
  blockedDates: string[];    // "YYYY-MM-DD"
}

interface CompanySlot {
  time: string;              // "09:00 AM"
  enabled: boolean;
}

// Booking enriquecido para el admin (incluye datos del cliente y empresa asignada)
interface AdminBookingItem {
  id: string;
  userId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  vehicleSize: VehicleSize;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehiclePlate?: string;
  addressLabel?: string;
  addressFull?: string;          // dirección completa formateada
  washType: WashType;
  addOns: string[];
  date: string;                  // "YYYY-MM-DD"
  time: string;                  // "10:00 AM"
  totalPrice: number;
  status: BookingStatus;
  assignedCompanyId?: string;    // empresa asignada actualmente
  assignedCompanyName?: string;
  companyStatus:                 // estado de aceptación de la empresa
    | "pending_acceptance"       // asignada, esperando respuesta
    | "accepted_by_company"      // empresa aceptó
    | "rejected_by_company";     // empresa rechazó → el sistema reasigna
  assignmentAttempts: number;    // cuántas empresas han rechazado esta cita
  usedMembershipId?: string;
  comments?: string;
  feedback?: BookingFeedback;
  cancelledBy?: "client" | "admin" | "company";
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Ítem de cliente en listado
interface AdminClientItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  activeMembershipsCount: number;
  totalSpent: number;
}

// Detalle completo de cliente
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
```

---

## 1. Autenticación Admin — `/api/auth`

El admin usa los mismos endpoints de auth que el cliente. La diferencia es que el backend devuelve `role: "admin"` en el objeto `User` y el token tiene permisos elevados.

### `POST /api/auth/login`
Inicia sesión con credenciales de administrador.

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
  user: User; // user.role === "admin"
  token: string;
}
// ApiResponse<LoginResponse>
```

**Errores:**
- `401 INVALID_CREDENTIALS`

---

### `GET /api/auth/me`
Devuelve el administrador autenticado.

**Response `200`:** `ApiResponse<User>`

---

## 2. Gestión de Citas — `/api/admin/bookings`

### `GET /api/admin/bookings`
Lista todas las citas del sistema con filtros y paginación.

**Query params:**
```typescript
interface AdminGetBookingsQuery {
  status?: BookingStatus;
  date?: string;        // "YYYY-MM-DD" — citas de ese día exacto
  dateFrom?: string;    // inicio de rango
  dateTo?: string;      // fin de rango
  userId?: string;      // filtrar por cliente específico
  companyId?: string;   // filtrar por empresa asignada
  companyStatus?:       // filtrar por estado de asignación
    | "pending_acceptance"
    | "accepted_by_company"
    | "rejected_by_company";
  search?: string;      // búsqueda por nombre de cliente o placa
  page?: number;        // default: 1
  limit?: number;       // default: 20
}
```

**Response `200`:** `PaginatedResponse<AdminBookingItem>`

---

### `GET /api/admin/bookings/:bookingId`
Detalle completo de una cita.

**Response `200`:** `ApiResponse<AdminBookingItem>`

**Errores:**
- `404 BOOKING_NOT_FOUND`

---

### `PATCH /api/admin/bookings/:bookingId/accept`
Acepta una cita (cambia `status` de `pending` → `accepted`).

**Request body:** vacío  
**Response `200`:** `ApiResponse<AdminBookingItem>`

**Errores:**
- `404 BOOKING_NOT_FOUND`
- `400 INVALID_STATUS_TRANSITION` — solo se puede aceptar si está en `pending`

---

### `PATCH /api/admin/bookings/:bookingId/reject`
Rechaza una cita pendiente (cambia `status` de `pending` → `cancelled`, `cancelledBy: "admin"`).

**Request body:**
```typescript
interface RejectBookingRequest {
  reason: string; // obligatorio al rechazar
}
```

**Response `200`:** `ApiResponse<AdminBookingItem>`

**Errores:**
- `404 BOOKING_NOT_FOUND`
- `400 INVALID_STATUS_TRANSITION` — solo se puede rechazar si está en `pending`

---

### `PATCH /api/admin/bookings/:bookingId/start`
Marca la cita como en curso (cambia `status` de `accepted` → `in_progress`).

**Request body:** vacío  
**Response `200`:** `ApiResponse<AdminBookingItem>`

**Errores:**
- `404 BOOKING_NOT_FOUND`
- `400 INVALID_STATUS_TRANSITION` — solo se puede iniciar si está en `accepted`

---

### `PATCH /api/admin/bookings/:bookingId/complete`
Marca la cita como completada (cambia `status` de `in_progress` → `completed`).

**Request body:** vacío  
**Response `200`:** `ApiResponse<AdminBookingItem>`

**Errores:**
- `404 BOOKING_NOT_FOUND`
- `400 INVALID_STATUS_TRANSITION` — solo se puede completar si está en `in_progress`

---

### `PATCH /api/admin/bookings/:bookingId/reassign`
Reasigna manualmente una cita a otra empresa disponible. Se usa cuando la empresa asignada rechaza o cuando el admin quiere cambiar la asignación. El backend elige la siguiente empresa disponible en el mismo horario. Si no hay empresas disponibles, la cita queda con `status: "cancelled"`.

**Request body:**
```typescript
interface ReassignBookingRequest {
  companyId?: string; // si se omite, el backend elige automáticamente
}
```

**Response `200`:** `ApiResponse<AdminBookingItem>`

**Errores:**
- `404 BOOKING_NOT_FOUND`
- `400 NO_COMPANIES_AVAILABLE` — no hay empresas disponibles en ese horario
- `400 INVALID_STATUS_TRANSITION` — solo se puede reasignar en `pending` o cuando `companyStatus === "rejected_by_company"`

---

### `PATCH /api/admin/bookings/:bookingId/cancel`
Cancela una cita desde el admin (disponible en `pending`, `accepted` e `in_progress`).

**Request body:**
```typescript
interface AdminCancelBookingRequest {
  reason?: string;
}
```

**Response `200`:** `ApiResponse<AdminBookingItem>`

**Errores:**
- `404 BOOKING_NOT_FOUND`
- `400 CANNOT_CANCEL` — no se puede cancelar una cita `completed`

---

## 3. Agenda del Día — `/api/admin/agenda`

### `GET /api/admin/agenda`
Vista de todas las citas de un día específico, ordenadas por hora. Ideal para la vista principal del admin.

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
  summary: {
    total: number;
    pending: number;
    accepted: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  bookings: AdminBookingItem[]; // ordenadas por time asc
}

// ApiResponse<AgendaResponse>
```

---

## 4. Disponibilidad Global — `/api/admin/availability`

La disponibilidad global define qué horarios existen en el sistema (ej. 9 AM, 10 AM, 11 AM…) y qué fechas están completamente bloqueadas. La **capacidad** de cada slot (cuántos clientes puede recibir) se calcula automáticamente contando las empresas activas disponibles en ese horario. Si en la fecha X a las 11 AM hay 3 empresas disponibles, el slot tiene capacidad 3.

> **Regla:** un horario aparece como `available: false` en la app del cliente si ninguna empresa activa está disponible en él, o si la fecha está bloqueada globalmente o en el calendario de todas las empresas.

### `GET /api/admin/availability`
Devuelve la configuración global de horarios y fechas bloqueadas, junto con la capacidad calculada por slot.

**Response `200`:**
```typescript
interface AvailabilityConfig {
  slots: ScheduleSlot[];
  blockedDates: BlockedDate[];
}

interface ScheduleSlot {
  time: string;           // "09:00 AM"
  enabled: boolean;       // si el horario existe en el sistema
  companiesAvailable: number; // empresas activas con este horario habilitado
}

interface BlockedDate {
  date: string;    // "YYYY-MM-DD"
  reason?: string;
}

// ApiResponse<AvailabilityConfig>
```

---

### `PUT /api/admin/availability`
Actualiza los horarios que existen en el sistema (activa o desactiva slots globalmente). Desactivar un slot significa que ninguna empresa puede recibir citas en ese horario.

**Request body:**
```typescript
interface UpdateAvailabilityRequest {
  slots?: ScheduleSlot[];
}
```

**Response `200`:** `ApiResponse<AvailabilityConfig>`

---

### `POST /api/admin/availability/block`
Bloquea una o varias fechas (los clientes no podrán agendar en esas fechas).

**Request body:**
```typescript
interface BlockDatesRequest {
  dates: string[]; // ["YYYY-MM-DD", ...]
  reason?: string;
}
```

**Response `200`:** `ApiResponse<{ blockedDates: BlockedDate[] }>`

---

### `DELETE /api/admin/availability/block`
Desbloquea fechas previamente bloqueadas.

**Request body:**
```typescript
interface UnblockDatesRequest {
  dates: string[]; // ["YYYY-MM-DD", ...]
}
```

**Response `200`:** `ApiResponse<{ blockedDates: BlockedDate[] }>`

---

## 5. Empresas — `/api/admin/companies`

Las empresas son los prestadores de servicio que realizan los lavados. Cada empresa define sus propios horarios disponibles. La capacidad de cada slot horario = número de empresas activas disponibles en ese slot. Cuando se agenda una cita, el sistema asigna automáticamente una empresa; si la empresa rechaza, el sistema intenta con la siguiente disponible.

---

### `GET /api/admin/companies`
Lista todas las empresas registradas (activas e inactivas).

**Query params:**
```typescript
interface GetCompaniesQuery {
  active?: boolean;    // filtrar solo activas
  search?: string;     // búsqueda por nombre
  page?: number;
  limit?: number;
}
```

**Response `200`:** `PaginatedResponse<Company>`

---

### `POST /api/admin/companies`
Registra una nueva empresa en el sistema. El backend crea credenciales de acceso para que la empresa pueda iniciar sesión y gestionar sus citas asignadas.

**Request body:**
```typescript
interface CreateCompanyRequest {
  name: string;
  email: string;       // se usará como usuario de login
  phone: string;
  password: string;    // contraseña inicial para el acceso de la empresa
}
```

**Response `201`:** `ApiResponse<Company>`

**Errores:**
- `400 EMAIL_ALREADY_EXISTS`

---

### `GET /api/admin/companies/:companyId`
Detalle de una empresa con sus estadísticas.

**Response `200`:**
```typescript
interface CompanyDetail extends Company {
  availability: CompanyAvailability;
  recentBookings: AdminBookingItem[];
  stats: {
    totalBookings: number;
    completedBookings: number;
    rejectedBookings: number;
    averageRating: number;
  };
}

// ApiResponse<CompanyDetail>
```

**Errores:**
- `404 COMPANY_NOT_FOUND`

---

### `PUT /api/admin/companies/:companyId`
Actualiza los datos de una empresa.

**Request body:**
```typescript
interface UpdateCompanyRequest {
  name?: string;
  email?: string;
  phone?: string;
  active?: boolean;    // desactivar impide que se asignen nuevas citas
}
```

**Response `200`:** `ApiResponse<Company>`

**Errores:**
- `404 COMPANY_NOT_FOUND`
- `400 EMAIL_ALREADY_EXISTS`

---

### `GET /api/admin/companies/:companyId/availability`
Consulta los horarios configurados por una empresa específica.

**Response `200`:** `ApiResponse<CompanyAvailability>`

**Errores:**
- `404 COMPANY_NOT_FOUND`

---

### `PUT /api/admin/companies/:companyId/availability`
Actualiza los horarios disponibles de una empresa. Se puede configurar qué días y horas está disponible la empresa para recibir citas.

**Request body:**
```typescript
interface UpdateCompanyAvailabilityRequest {
  slots: CompanySlot[];
  blockedDates?: string[]; // "YYYY-MM-DD" — días que la empresa no trabaja
}
```

**Response `200`:** `ApiResponse<CompanyAvailability>`

**Errores:**
- `404 COMPANY_NOT_FOUND`

---

## 6. Catálogo — `/api/admin/catalog`

El admin puede ver y editar los catálogos que la app cliente consume. Cambios aquí se reflejan automáticamente en la app sin necesidad de actualización.

---

### 5.1 Paquetes / Suscripciones

#### `GET /api/admin/catalog/packages`
Lista todos los paquetes (activos e inactivos).

**Response `200`:**
```typescript
interface AdminPackage {
  id: string;
  name: string;
  washType: WashType;
  description: string;
  color: string;
  popular: boolean;
  active: boolean;        // si está visible para los clientes
  perks: string[];
  addOnsIncluded: PackageAddOnCatalog[];
  durations: PackageDurationCatalog[];
}

// ApiResponse<AdminPackage[]>
```

---

#### `PUT /api/admin/catalog/packages/:packageId`
Actualiza un paquete existente (precio, descripción, beneficios, add-ons incluidos, etc.).

**Request body:**
```typescript
interface UpdatePackageRequest {
  name?: string;
  description?: string;
  color?: string;
  popular?: boolean;
  active?: boolean;
  perks?: string[];
  addOnsIncluded?: PackageAddOnCatalog[];
  durations?: PackageDurationCatalog[];
}
```

**Response `200`:** `ApiResponse<AdminPackage>`

**Errores:**
- `404 PACKAGE_NOT_FOUND`

---

### 5.2 Servicios y Tipos de Lavado

#### `GET /api/admin/catalog/services`
Lista todos los servicios (tipos de lavado, add-ons y precios base por tamaño).

**Response `200`:**
```typescript
interface AdminServiceCatalog {
  vehiclePrices: Record<VehicleSize, number>;
  washTypePrices: Record<WashType, number>;
  services: AdminServiceOption[];
}

interface AdminServiceOption {
  id: string;
  name: string;
  price: number;
  includedIn: WashType[];
  minMinutes: number;
  maxMinutes: number;
  active: boolean;
}

// ApiResponse<AdminServiceCatalog>
```

---

#### `PUT /api/admin/catalog/services/vehicle-prices`
Actualiza los precios base por tamaño de vehículo.

**Request body:**
```typescript
interface UpdateVehiclePricesRequest {
  prices: Record<VehicleSize, number>;
  // Ejemplo: { small: 150, suv: 200, large: 250 }
}
```

**Response `200`:** `ApiResponse<Record<VehicleSize, number>>`

---

#### `PUT /api/admin/catalog/services/wash-type-prices`
Actualiza los precios adicionales por tipo de lavado.

**Request body:**
```typescript
interface UpdateWashTypePricesRequest {
  prices: Record<WashType, number>;
  // Ejemplo: { basic: 0, complete: 80, premium: 150, detail: 250, full: 380 }
}
```

**Response `200`:** `ApiResponse<Record<WashType, number>>`

---

#### `PUT /api/admin/catalog/services/:serviceId`
Actualiza un servicio específico (nombre, precio, tiempo estimado, activo/inactivo).

**Request body:**
```typescript
interface UpdateServiceRequest {
  name?: string;
  price?: number;
  minMinutes?: number;
  maxMinutes?: number;
  active?: boolean;
}
```

**Response `200`:** `ApiResponse<AdminServiceOption>`

**Errores:**
- `404 SERVICE_NOT_FOUND`

---

### 5.3 Zonas de Cobertura

#### `GET /api/admin/catalog/zones`
Lista los estados, ciudades y colonias de cobertura disponibles.

**Response `200`:**
```typescript
interface ZoneCatalog {
  states: string[];
  cities: string[];
  colonies: string[];
}

// ApiResponse<ZoneCatalog>
```

---

#### `PUT /api/admin/catalog/zones`
Actualiza las zonas de cobertura (agregar o quitar colonias, ciudades, etc.).

**Request body:**
```typescript
interface UpdateZoneCatalogRequest {
  states?: string[];
  cities?: string[];
  colonies?: string[];
}
```

**Response `200`:** `ApiResponse<ZoneCatalog>`

---

## 6. Reportes — `/api/admin/reports`

### `GET /api/admin/reports/revenue`
Reporte de ingresos por período.

**Query params:**
```typescript
interface RevenueReportQuery {
  period: "day" | "week" | "month" | "custom";
  date?: string;     // si period === "day"
  dateFrom?: string; // si period === "custom"
  dateTo?: string;   // si period === "custom"
}
```

**Response `200`:**
```typescript
interface RevenueReport {
  period: string;
  dateFrom: string;
  dateTo: string;
  totalRevenue: number;
  membershipRevenue: number;    // de ventas de paquetes/membresías
  individualRevenue: number;    // de citas pagadas sin membresía
  totalBookings: number;
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

### `GET /api/admin/reports/bookings`
Reporte de citas: cantidad por estado, por día, tendencias.

**Query params:**
```typescript
interface BookingsReportQuery {
  dateFrom?: string;
  dateTo?: string;
}
```

**Response `200`:**
```typescript
interface BookingsReport {
  dateFrom: string;
  dateTo: string;
  totalBookings: number;
  byStatus: Record<BookingStatus, number>;
  byDay: BookingsByDay[];
  cancellationRate: number;    // porcentaje
  completionRate: number;      // porcentaje
}

interface BookingsByDay {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
}

// ApiResponse<BookingsReport>
```

---

### `GET /api/admin/reports/services`
Reporte de servicios más solicitados.

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

### `GET /api/admin/reports/memberships`
Reporte de membresías vendidas y activas.

**Query params:**
```typescript
interface MembershipsReportQuery {
  dateFrom?: string;
  dateTo?: string;
}
```

**Response `200`:**
```typescript
interface MembershipsReport {
  totalSold: number;
  totalRevenue: number;
  currentlyActive: number;
  byPackage: MembershipByPackage[];
  byDuration: MembershipByDuration[];
}

interface MembershipByPackage {
  packageId: PackageId;
  packageName: string;
  count: number;
  revenue: number;
}

interface MembershipByDuration {
  durationId: DurationId;
  durationLabel: string;
  count: number;
}

// ApiResponse<MembershipsReport>
```

---

## 7. Clientes — `/api/admin/clients`

### `GET /api/admin/clients`
Lista todos los clientes registrados con estadísticas.

**Query params:**
```typescript
interface AdminGetClientsQuery {
  search?: string;  // búsqueda por nombre, email o teléfono
  page?: number;    // default: 1
  limit?: number;   // default: 20
}
```

**Response `200`:** `PaginatedResponse<AdminClientItem>`

---

### `GET /api/admin/clients/:userId`
Perfil completo de un cliente con historial y estadísticas.

**Response `200`:** `ApiResponse<AdminClientDetail>`

**Errores:**
- `404 USER_NOT_FOUND`

---

### `GET /api/admin/clients/:userId/bookings`
Historial completo de citas de un cliente específico.

**Query params:**
```typescript
interface ClientBookingsQuery {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}
```

**Response `200`:** `PaginatedResponse<AdminBookingItem>`

---

### `GET /api/admin/clients/:userId/memberships`
Membresías de un cliente específico.

**Response `200`:** `ApiResponse<Membership[]>`

---

## 9. Transiciones de estado válidas

### Flujo completo con asignación de empresa

```
                   ┌─ empresa acepta ──────────────────────────────────────────────────┐
                   │                                                                    ↓
 cliente agenda → pending ──── sistema asigna empresa ──── empresa acepta ──── accepted ──── start ──── in_progress ──── complete ──── completed
                   │                      │                      │                │                        │
                   │              empresa rechaza          empresa rechaza    admin cancela          admin cancela
                   │           (sistema reasigna)        (sin más empresas)
                   │                      │                      │
                   └──────────────────────┴──────────────────────┴─────────── cancelled
                           (cliente o admin también pueden cancelar)
```

**Descripción del flujo de asignación:**

1. El cliente agenda → cita queda en `status: "pending"`, `companyStatus: "pending_acceptance"`
2. El sistema asigna automáticamente una empresa disponible en ese horario
3. La empresa acepta → `companyStatus: "accepted_by_company"`, el admin puede cambiar `status` a `"accepted"`
4. Si la empresa rechaza → `companyStatus: "rejected_by_company"` → sistema intenta con la siguiente empresa (`companyStatus: "pending_acceptance"` de nuevo)
5. Si no hay más empresas disponibles → `status: "cancelled"` automáticamente

### Tabla de transiciones del estado principal (`status`)

| Estado actual | Quién puede actuar    | Acción     | Estado resultante |
|---------------|-----------------------|------------|-------------------|
| `pending`     | Admin                 | `accept`   | `accepted`        |
| `pending`     | Admin / Cliente       | `cancel`   | `cancelled`       |
| `pending`     | Sistema (auto)        | —          | `cancelled` si no hay empresas |
| `accepted`    | Admin                 | `start`    | `in_progress`     |
| `accepted`    | Admin / Cliente       | `cancel`   | `cancelled`       |
| `in_progress` | Admin                 | `complete` | `completed`       |
| `in_progress` | Admin                 | `cancel`   | `cancelled`       |
| `completed`   | — (ninguna acción)    | —          | —                 |
| `cancelled`   | — (ninguna acción)    | —          | —                 |

### Tabla de `companyStatus` (asignación de empresa)

| `companyStatus`         | Significado                                               |
|-------------------------|-----------------------------------------------------------|
| `pending_acceptance`    | Empresa asignada, aún no responde                        |
| `accepted_by_company`   | Empresa confirmó que realizará el servicio               |
| `rejected_by_company`   | Empresa rechazó; se espera reasignación o cancelación    |

> El cliente solo puede cancelar desde `pending` o `accepted`. El admin puede cancelar en cualquier estado excepto `completed`. Una empresa no puede cancelar una cita `in_progress` o `completed`.

---

## 10. Tabla resumen

| Método | Endpoint                                          | Descripción                                                      |
|--------|---------------------------------------------------|------------------------------------------------------------------|
| POST   | `/api/auth/login`                                 | Login del admin                                                  |
| GET    | `/api/auth/me`                                    | Admin autenticado actual                                         |
| GET    | `/api/admin/bookings`                             | Listar todas las citas (filtros: status, fecha, empresa, cliente)|
| GET    | `/api/admin/bookings/:id`                         | Detalle de cita (incluye empresa asignada)                       |
| PATCH  | `/api/admin/bookings/:id/accept`                  | Aceptar cita (confirmar cuando empresa aceptó)                   |
| PATCH  | `/api/admin/bookings/:id/reject`                  | Rechazar cita (cancela con razón)                                |
| PATCH  | `/api/admin/bookings/:id/reassign`                | Reasignar cita a otra empresa                                    |
| PATCH  | `/api/admin/bookings/:id/start`                   | Marcar cita en curso                                             |
| PATCH  | `/api/admin/bookings/:id/complete`                | Marcar cita completada                                           |
| PATCH  | `/api/admin/bookings/:id/cancel`                  | Cancelar cita                                                    |
| GET    | `/api/admin/agenda`                               | Agenda del día (con resumen de estados)                          |
| GET    | `/api/admin/availability`                         | Ver horarios globales y capacidad por empresa                    |
| PUT    | `/api/admin/availability`                         | Activar/desactivar slots horarios globalmente                    |
| POST   | `/api/admin/availability/block`                   | Bloquear fechas globalmente                                      |
| DELETE | `/api/admin/availability/block`                   | Desbloquear fechas                                               |
| GET    | `/api/admin/companies`                            | Listar empresas de lavado                                        |
| POST   | `/api/admin/companies`                            | Registrar nueva empresa                                          |
| GET    | `/api/admin/companies/:id`                        | Detalle y estadísticas de empresa                                |
| PUT    | `/api/admin/companies/:id`                        | Actualizar datos de empresa                                      |
| GET    | `/api/admin/companies/:id/availability`           | Ver horarios de una empresa                                      |
| PUT    | `/api/admin/companies/:id/availability`           | Actualizar horarios de una empresa                               |
| GET    | `/api/admin/catalog/packages`                     | Ver catálogo de paquetes                                         |
| PUT    | `/api/admin/catalog/packages/:id`                 | Editar paquete (precios, duración, beneficios)                   |
| GET    | `/api/admin/catalog/services`                     | Ver catálogo de servicios                                        |
| PUT    | `/api/admin/catalog/services/vehicle-prices`      | Actualizar precios por tamaño de vehículo                        |
| PUT    | `/api/admin/catalog/services/wash-type-prices`    | Actualizar precios por tipo de lavado                            |
| PUT    | `/api/admin/catalog/services/:id`                 | Editar servicio individual                                       |
| GET    | `/api/admin/catalog/zones`                        | Ver zonas de cobertura                                           |
| PUT    | `/api/admin/catalog/zones`                        | Actualizar zonas de cobertura                                    |
| GET    | `/api/admin/reports/revenue`                      | Reporte de ingresos por período                                  |
| GET    | `/api/admin/reports/bookings`                     | Reporte de citas por período                                     |
| GET    | `/api/admin/reports/services`                     | Reporte de servicios más solicitados                             |
| GET    | `/api/admin/reports/memberships`                  | Reporte de membresías vendidas y activas                         |
| GET    | `/api/admin/clients`                              | Listar clientes                                                  |
| GET    | `/api/admin/clients/:userId`                      | Perfil completo de cliente                                       |
| GET    | `/api/admin/clients/:userId/bookings`             | Historial de citas de un cliente                                 |
| GET    | `/api/admin/clients/:userId/memberships`          | Membresías de un cliente                                         |
