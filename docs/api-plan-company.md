# Plan de API — App Empresa (Car Wash)

> Documento de planeación. Ningún endpoint existe aún. Describe todos los endpoints que consume la **app de la empresa de lavado** para gestionar las citas que le son asignadas, sus horarios, los paquetes que trabaja y los servicios que ofrece.
>
> Prefijo base: `/api/company`  
> Auth compartida: `/api/auth`  
> Formato: JSON  
> Autenticación: Bearer token en header `Authorization: Bearer <token>`  
> Todos los endpoints requieren `role: "company"`. El backend retorna `403 FORBIDDEN` si un cliente o admin intenta acceder.

---

## Tipos compartidos

> Los tipos base (`User`, `Booking`, `BookingStatus`, `VehicleSize`, `WashType`, `ApiResponse<T>`, `PaginatedResponse<T>`, etc.) están definidos en `shared/types.ts`. Ver `api-plan-client.md` para la referencia completa.

Tipos adicionales propios de empresa:

```typescript
// Perfil de la empresa autenticada
interface CompanyProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  rating?: number;
  createdAt: string; // ISO
}

// Disponibilidad de la empresa
interface CompanyAvailability {
  slots: CompanySlot[];
  blockedDates: string[]; // "YYYY-MM-DD"
}

interface CompanySlot {
  time: string;       // "09:00 AM"
  enabled: boolean;
}

// Cita asignada a la empresa (vista de empresa)
interface CompanyBookingItem {
  id: string;
  clientName: string;
  clientPhone: string;
  addressFull: string;         // dirección formateada del servicio
  vehicleSize: VehicleSize;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehiclePlate?: string;
  washType: WashType;
  addOns: string[];
  date: string;                // "YYYY-MM-DD"
  time: string;                // "10:00 AM"
  totalPrice: number;
  status: BookingStatus;
  companyStatus:
    | "pending_acceptance"     // recién asignada, esperando respuesta
    | "accepted_by_company"    // empresa aceptó
    | "rejected_by_company";   // empresa rechazó
  comments?: string;           // comentarios del cliente
  createdAt: string;
}

// Paquete del catálogo con bandera de si la empresa lo trabaja
interface CompanyPackageOption {
  packageId: string;
  name: string;
  washType: WashType;
  active: boolean;   // true = esta empresa trabaja este paquete
}

// Servicio del catálogo con bandera de si la empresa lo ofrece
interface CompanyServiceOption {
  serviceId: string;
  name: string;
  price: number;
  active: boolean;   // true = esta empresa ofrece este servicio
}
```

---

## 1. Autenticación — `/api/auth`

La empresa usa los mismos endpoints de auth compartidos. El token resultante tiene `role: "company"`.

### `POST /api/auth/login`
Inicia sesión con las credenciales asignadas por la plataforma.

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
  user: User; // user.role === "company"
  token: string;
}
// ApiResponse<LoginResponse>
```

**Errores:**
- `401 INVALID_CREDENTIALS`

---

### `GET /api/auth/me`
Devuelve la empresa autenticada.

**Response `200`:** `ApiResponse<User>`

---

### `POST /api/auth/logout`
Invalida el token.

**Response `200`:** `ApiResponse<{ message: string }>`

---

## 2. Perfil de Empresa — `/api/company/profile`

### `GET /api/company/profile`
Devuelve los datos de la empresa autenticada.

**Response `200`:** `ApiResponse<CompanyProfile>`

---

### `PUT /api/company/profile`
Actualiza nombre y teléfono. El email y contraseña los gestiona la plataforma.

**Request body:**
```typescript
interface UpdateCompanyProfileRequest {
  name?: string;
  phone?: string;
}
```

**Response `200`:** `ApiResponse<CompanyProfile>`

---

## 3. Citas Asignadas — `/api/company/bookings`

### `GET /api/company/bookings`
Lista las citas asignadas a esta empresa. Por defecto muestra las de hoy.

**Query params:**
```typescript
interface GetCompanyBookingsQuery {
  date?: string;         // "YYYY-MM-DD" — citas de un día específico
  dateFrom?: string;
  dateTo?: string;
  companyStatus?:
    | "pending_acceptance"
    | "accepted_by_company"
    | "rejected_by_company";
  status?: BookingStatus;
  search?: string;       // búsqueda por nombre de cliente o placa
  page?: number;         // default: 1
  limit?: number;        // default: 20
}
```

**Response `200`:** `PaginatedResponse<CompanyBookingItem>`

---

### `GET /api/company/bookings/:bookingId`
Detalle completo de una cita asignada a esta empresa.

**Response `200`:** `ApiResponse<CompanyBookingItem>`

**Errores:**
- `404 BOOKING_NOT_FOUND`
- `403 FORBIDDEN` — la cita no está asignada a esta empresa

---

### `PATCH /api/company/bookings/:bookingId/accept`
La empresa acepta la cita asignada. Solo válido cuando `companyStatus === "pending_acceptance"`.

**Request body:** vacío

**Response `200`:** `ApiResponse<CompanyBookingItem>`

**Errores:**
- `404 BOOKING_NOT_FOUND`
- `403 FORBIDDEN`
- `400 INVALID_STATUS_TRANSITION` — la cita ya fue aceptada o rechazada

---

### `PATCH /api/company/bookings/:bookingId/reject`
La empresa rechaza la cita. El sistema busca automáticamente otra empresa disponible en el mismo horario. Si no hay más empresas, la cita se cancela.

**Request body:**
```typescript
interface RejectBookingRequest {
  reason: string; // obligatorio al rechazar
}
```

**Response `200`:** `ApiResponse<CompanyBookingItem>`

**Errores:**
- `404 BOOKING_NOT_FOUND`
- `403 FORBIDDEN`
- `400 INVALID_STATUS_TRANSITION` — solo se puede rechazar en `pending_acceptance`

---

### `PATCH /api/company/bookings/:bookingId/start`
Marca la cita como en curso. Solo válido cuando `status === "accepted"`.

**Request body:** vacío

**Response `200`:** `ApiResponse<CompanyBookingItem>`

**Errores:**
- `404 BOOKING_NOT_FOUND`
- `403 FORBIDDEN`
- `400 INVALID_STATUS_TRANSITION` — la cita no está en estado `accepted`

---

### `PATCH /api/company/bookings/:bookingId/complete`
Marca la cita como completada. Solo válido cuando `status === "in_progress"`.

**Request body:** vacío

**Response `200`:** `ApiResponse<CompanyBookingItem>`

**Errores:**
- `404 BOOKING_NOT_FOUND`
- `403 FORBIDDEN`
- `400 INVALID_STATUS_TRANSITION` — la cita no está en curso

---

## 4. Disponibilidad — `/api/company/availability`

### `GET /api/company/availability`
Devuelve los horarios activos y fechas bloqueadas de esta empresa.

**Response `200`:** `ApiResponse<CompanyAvailability>`

---

### `PUT /api/company/availability`
Actualiza los horarios disponibles y las fechas bloqueadas de esta empresa.

La empresa solo puede activar horarios que la plataforma haya habilitado globalmente. Cambiar los slots afecta el `spotsLeft` visible para los clientes al agendar: habilitar un horario suma un cupo, deshabilitarlo lo quita.

**Request body:**
```typescript
interface UpdateCompanyAvailabilityRequest {
  slots?: CompanySlot[];
  blockedDates?: string[]; // "YYYY-MM-DD" — reemplaza la lista completa
}
```

**Response `200`:** `ApiResponse<CompanyAvailability>`

**Errores:**
- `400 SLOT_NOT_ALLOWED` — el horario no está habilitado globalmente por la plataforma

---

## 5. Paquetes que Trabaja — `/api/company/packages`

### `GET /api/company/packages`
Lista todos los paquetes del catálogo con la bandera de si esta empresa los trabaja o no.

**Response `200`:** `ApiResponse<CompanyPackageOption[]>`

---

### `PUT /api/company/packages`
Actualiza qué paquetes trabaja esta empresa. Un cliente con membresía de un paquete que la empresa no trabaja no será asignado a ella.

**Request body:**
```typescript
interface UpdateCompanyPackagesRequest {
  packages: {
    packageId: string;
    active: boolean;
  }[];
}
```

**Response `200`:** `ApiResponse<CompanyPackageOption[]>`

**Errores:**
- `400 INVALID_PACKAGE` — algún packageId no existe en el catálogo

---

## 6. Servicios que Ofrece — `/api/company/services`

### `GET /api/company/services`
Lista todos los servicios del catálogo (tipos de lavado + add-ons) con la bandera de si esta empresa los ofrece.

**Response `200`:** `ApiResponse<CompanyServiceOption[]>`

---

### `PUT /api/company/services`
Actualiza qué servicios ofrece esta empresa. Solo se asignarán a esta empresa las citas que incluyan servicios que ella tiene activos.

**Request body:**
```typescript
interface UpdateCompanyServicesRequest {
  services: {
    serviceId: string;
    active: boolean;
  }[];
}
```

**Response `200`:** `ApiResponse<CompanyServiceOption[]>`

**Errores:**
- `400 INVALID_SERVICE` — algún serviceId no existe en el catálogo

---

## 7. Tabla resumen

| Método | Endpoint                                    | Descripción                                                   |
|--------|---------------------------------------------|---------------------------------------------------------------|
| POST   | `/api/auth/login`                           | Login de la empresa                                           |
| GET    | `/api/auth/me`                              | Empresa autenticada actual                                    |
| POST   | `/api/auth/logout`                          | Cerrar sesión                                                 |
| GET    | `/api/company/profile`                      | Ver perfil de la empresa                                      |
| PUT    | `/api/company/profile`                      | Actualizar nombre y teléfono                                  |
| GET    | `/api/company/bookings`                     | Listar citas asignadas (filtros: fecha, estado, búsqueda)     |
| GET    | `/api/company/bookings/:id`                 | Detalle de cita asignada                                      |
| PATCH  | `/api/company/bookings/:id/accept`          | Aceptar cita asignada                                         |
| PATCH  | `/api/company/bookings/:id/reject`          | Rechazar cita (sistema reasigna o cancela automáticamente)    |
| PATCH  | `/api/company/bookings/:id/start`           | Marcar cita en curso                                          |
| PATCH  | `/api/company/bookings/:id/complete`        | Marcar cita completada                                        |
| GET    | `/api/company/availability`                 | Ver horarios y fechas bloqueadas de la empresa                |
| PUT    | `/api/company/availability`                 | Actualizar horarios y fechas bloqueadas                       |
| GET    | `/api/company/packages`                     | Ver paquetes del catálogo con bandera activo/inactivo         |
| PUT    | `/api/company/packages`                     | Elegir qué paquetes trabaja la empresa                        |
| GET    | `/api/company/services`                     | Ver servicios del catálogo con bandera activo/inactivo        |
| PUT    | `/api/company/services`                     | Elegir qué servicios ofrece la empresa                        |

---

## 8. Transiciones de estado para la empresa

La empresa solo puede accionar sobre citas que le están asignadas.

| Estado actual (`status`) | `companyStatus` actual    | Acción disponible | Resultado                              |
|--------------------------|---------------------------|-------------------|----------------------------------------|
| `pending`                | `pending_acceptance`      | `accept`          | `companyStatus → accepted_by_company`  |
| `pending`                | `pending_acceptance`      | `reject`          | Sistema reasigna o cancela             |
| `accepted`               | `accepted_by_company`     | `start`           | `status → in_progress`                 |
| `in_progress`            | `accepted_by_company`     | `complete`        | `status → completed`                   |
| `completed`              | —                         | — (ninguna)       | —                                      |
| `cancelled`              | —                         | — (ninguna)       | —                                      |

> La empresa **no puede cancelar** citas. Si hay un problema, debe rechazar antes de aceptar, o contactar a la plataforma.
