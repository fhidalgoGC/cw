# Flujo de la App Empresa — Car Wash

> Describe pantalla por pantalla qué hace la empresa de lavado, qué decisiones toma y qué endpoints consume en cada paso.
>
> **Actor:** empresa de lavado de carros registrada en la plataforma. Tiene su propio login con `role: "company"`. Define sus horarios, elige los paquetes y servicios que ofrece, y gestiona las citas que el sistema le asigna.
>
> **Prefijo de endpoints propios de empresa:** `/api/company`

---

## Índice

1. [Login](#1-login)
2. [Dashboard — Citas del día](#2-dashboard--citas-del-día)
3. [Gestión de citas asignadas](#3-gestión-de-citas-asignadas)
4. [Mis horarios](#4-mis-horarios)
5. [Paquetes que ofrezco](#5-paquetes-que-ofrezco)
6. [Servicios que ofrezco](#6-servicios-que-ofrezco)
7. [Mi perfil de empresa](#7-mi-perfil-de-empresa)

---

## 1. Login

La empresa inicia sesión con las credenciales que la plataforma le asignó al registrarla.

```
Pantalla: Login
│
├── Empresa ingresa email + contraseña
│   └── POST /api/auth/login
│       ├── Éxito: token guardado, role === "company" → navega al Dashboard
│       └── Error 401 → "Credenciales incorrectas"
│
└── Si ya hay token guardado
    └── GET /api/auth/me
        ├── Éxito → navega al Dashboard
        └── Error 401 → borra token → muestra Login
```

---

## 2. Dashboard — Citas del día

Pantalla principal de la empresa. Muestra las citas que le fueron asignadas hoy, ordenadas por hora. Es la vista desde la que la empresa acepta o rechaza citas y marca su progreso.

```
Pantalla: Dashboard
│
├── Al entrar (o al cambiar fecha)
│   └── GET /api/company/bookings?date=YYYY-MM-DD
│       → Muestra las citas asignadas a esta empresa en esa fecha
│         ordenadas por hora, con datos del cliente y vehículo
│
├── Resumen del día:
│   - Cuántas citas pendientes de aceptar
│   - Cuántas aceptadas / en curso / completadas
│
└── Por cada cita:
    │
    ├── Si companyStatus = "pending_acceptance"  (recién asignada)
    │   ├── [Aceptar]  → PATCH /api/company/bookings/:id/accept
    │   │               → companyStatus pasa a "accepted_by_company"
    │   └── [Rechazar] → PATCH /api/company/bookings/:id/reject  (pide razón)
    │                   → el sistema busca otra empresa automáticamente
    │
    ├── Si companyStatus = "accepted_by_company" y status = "accepted"
    │   └── [Iniciar servicio] → PATCH /api/company/bookings/:id/start
    │                           → status pasa a "in_progress"
    │
    ├── Si status = "in_progress"
    │   └── [Marcar completado] → PATCH /api/company/bookings/:id/complete
    │                             → status pasa a "completed"
    │
    └── Si status = "completed" o "cancelled"
        └── [Ver detalle] → flujo 3.2 (solo lectura)
```

---

## 3. Gestión de Citas Asignadas

### 3.1 Historial y filtros

```
Pantalla: Mis citas
│
├── Al entrar (default: citas de hoy)
│   └── GET /api/company/bookings?date=YYYY-MM-DD&page=1
│
├── Filtros disponibles:
│   ├── Por estado (pending_acceptance / accepted / in_progress / completed / cancelled)
│   ├── Por rango de fechas
│   └── Búsqueda por nombre de cliente o placa
│   └── GET /api/company/bookings?companyStatus=X&dateFrom=Y&dateTo=Z
│
└── Al tocar una cita → flujo 3.2
```

### 3.2 Detalle de cita

```
Pantalla: Detalle de cita
│
├── Al entrar
│   └── GET /api/company/bookings/:bookingId
│       → Muestra:
│         - Nombre y teléfono del cliente
│         - Dirección completa del servicio
│         - Vehículo: marca, modelo, color, tamaño, placa
│         - Tipo de lavado + add-ons solicitados
│         - Fecha y hora
│         - Comentarios del cliente
│         - Estado actual
│
└── Acciones según estado (mismas que en el dashboard):
    ├── Aceptar  → PATCH /api/company/bookings/:id/accept
    ├── Rechazar → PATCH /api/company/bookings/:id/reject  (pide razón)
    ├── Iniciar  → PATCH /api/company/bookings/:id/start
    └── Completar→ PATCH /api/company/bookings/:id/complete
```

---

## 4. Mis Horarios

La empresa configura en qué horarios está disponible para recibir citas. Esto determina directamente los cupos que ven los clientes al agendar: si la empresa habilita las 11 AM, ese horario suma un cupo disponible.

```
Pantalla: Mis horarios
│
├── Al entrar
│   └── GET /api/company/availability
│       → Muestra: qué horarios tiene activos (09 AM, 10 AM, 11 AM…)
│                  y qué fechas tiene bloqueadas
│
├── Activar o desactivar un slot horario
│   └── PUT /api/company/availability
│       body: { slots: [{ time: "09:00 AM", enabled: true/false }, ...] }
│       → Al desactivar un slot, ese horario ya no cuenta como cupo disponible
│         para nuevas citas (las citas existentes no se afectan)
│
├── Bloquear fechas específicas (vacaciones, imprevistos)
│   └── PUT /api/company/availability
│       body: { blockedDates: ["YYYY-MM-DD", ...] }
│       → En esas fechas la empresa no aparece como disponible
│
└── Regla importante:
    La plataforma define qué horarios existen globalmente (ej. solo hay slots
    de 9 AM a 5 PM). La empresa solo puede activar/desactivar dentro de esos
    horarios permitidos por la plataforma.
```

---

## 5. Paquetes que Ofrezco

La empresa elige qué paquetes de membresía está dispuesta a atender. Un cliente con membresía "Premium" solo puede usar esa membresía con empresas que tengan el paquete Premium activo.

```
Pantalla: Mis paquetes
│
├── Al entrar
│   └── GET /api/company/packages
│       → Lista todos los paquetes del catálogo (Básico, Completo, Premium)
│         marcados como activo/inactivo para esta empresa
│
├── Activar o desactivar un paquete
│   └── PUT /api/company/packages
│       body: { packages: [{ packageId: "basico", active: true }, ...] }
│       → Si desactiva "Premium", la empresa ya no recibirá citas
│         de clientes con membresía Premium
│
└── Nota: solo la plataforma puede crear o editar los paquetes del catálogo.
          La empresa solo elige cuáles trabaja.
```

---

## 6. Servicios que Ofrezco

La empresa elige qué servicios y add-ons puede realizar. Esto filtra las citas que el sistema le asigna: solo recibirá citas que incluyan servicios que tiene activos.

```
Pantalla: Mis servicios
│
├── Al entrar
│   └── GET /api/company/services
│       → Lista todos los servicios del catálogo (tipos de lavado + add-ons)
│         marcados como activo/inactivo para esta empresa
│
├── Activar o desactivar un servicio
│   └── PUT /api/company/services
│       body: { services: [{ serviceId: "detailing", active: true }, ...] }
│       → Al desactivar "detailing", el sistema no asignará a esta empresa
│         citas que incluyan ese servicio
│
└── Nota: solo la plataforma puede crear, editar o eliminar servicios del catálogo.
          La empresa solo elige cuáles ofrece.
```

---

## 7. Mi Perfil de Empresa

La empresa puede ver y actualizar sus propios datos de contacto.

```
Pantalla: Mi perfil
│
├── Al entrar
│   └── GET /api/company/profile
│       → Muestra: nombre, email, teléfono, estado (activa/inactiva)
│
├── [Editar datos]
│   └── PUT /api/company/profile
│       body: { name?, phone? }
│       Nota: el email y la contraseña los gestiona la plataforma
│
└── [Cerrar sesión]
    └── POST /api/auth/logout
```

---

## Resumen: pantallas y sus endpoints principales

| Pantalla                 | Endpoints que consume                                                                 |
|--------------------------|---------------------------------------------------------------------------------------|
| Login                    | `POST /api/auth/login`, `GET /api/auth/me`                                           |
| Dashboard (citas hoy)    | `GET /api/company/bookings?date=X`, acciones de cita (accept/reject/start/complete)  |
| Mis citas — Listado      | `GET /api/company/bookings` (con filtros)                                             |
| Mis citas — Detalle      | `GET /api/company/bookings/:id`, acciones de cita                                    |
| Mis horarios             | `GET /api/company/availability`, `PUT /api/company/availability`                     |
| Mis paquetes             | `GET /api/company/packages`, `PUT /api/company/packages`                             |
| Mis servicios            | `GET /api/company/services`, `PUT /api/company/services`                             |
| Mi perfil                | `GET /api/company/profile`, `PUT /api/company/profile`                               |

> **Nota:** todos los endpoints `/api/company/...` son exclusivos para usuarios con `role: "company"`. El backend retorna `403 FORBIDDEN` si un cliente o admin intenta acceder.
