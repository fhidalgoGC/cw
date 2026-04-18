# Flujo de la App Administrador — Car Wash

> Documento de lógica de negocio. Describe pantalla por pantalla qué hace el admin, qué decisiones toma y qué endpoints consume en cada paso.

---

## Índice de flujos

1. [Login](#1-login)
2. [Agenda del día (pantalla principal)](#2-agenda-del-día-pantalla-principal)
3. [Detalle de cita](#3-detalle-de-cita)
4. [Listado general de citas](#4-listado-general-de-citas)
5. [Gestión de empresas](#5-gestión-de-empresas)
6. [Catálogos](#6-catálogos)
7. [Reportes](#7-reportes)
8. [Clientes](#8-clientes)

---

## 1. Login

El admin entra a la app con su email y contraseña. Si la sesión ya existe (token guardado válido), se salta este paso y va directo a la Agenda.

```
Pantalla: Login
│
├── Admin ingresa email + contraseña
│   └── POST /api/auth/login
│       ├── Éxito: guarda token → navega a Agenda del día
│       └── Error 401: muestra "Credenciales incorrectas"
│
└── Si ya hay token guardado
    └── GET /api/auth/me
        ├── Éxito: navega a Agenda del día
        └── Error 401: borra token → muestra Login
```

---

## 2. Agenda del Día (pantalla principal)

Es la pantalla de inicio del admin. Muestra todas las citas del día actual ordenadas por hora, con un resumen de estados en la parte superior. El admin puede cambiar la fecha para ver otros días.

```
Pantalla: Agenda
│
├── Al entrar (o cambiar fecha)
│   └── GET /api/admin/agenda?date=YYYY-MM-DD
│       → Muestra resumen (total / pendientes / en curso / completadas / canceladas)
│       → Lista de citas ordenadas por hora
│
├── Por cada cita en la lista se muestra:
│   - Hora, nombre del cliente, tamaño de vehículo, tipo de lavado
│   - Empresa asignada y su estado (pendiente de confirmación / confirmada / rechazó)
│   - Estado de la cita (badge de color)
│
└── Acciones rápidas por cita (según estado actual):
    │
    ├── Si status = "pending" + companyStatus = "pending_acceptance"
    │   └── [Ver detalle] → flujo 3
    │
    ├── Si status = "pending" + companyStatus = "rejected_by_company"
    │   ├── [Reasignar] → PATCH /api/admin/bookings/:id/reassign
    │   └── [Cancelar]  → PATCH /api/admin/bookings/:id/cancel
    │
    ├── Si status = "pending" + companyStatus = "accepted_by_company"
    │   ├── [Aceptar]   → PATCH /api/admin/bookings/:id/accept
    │   └── [Cancelar]  → PATCH /api/admin/bookings/:id/cancel
    │
    ├── Si status = "accepted"
    │   ├── [Iniciar]   → PATCH /api/admin/bookings/:id/start
    │   └── [Cancelar]  → PATCH /api/admin/bookings/:id/cancel
    │
    ├── Si status = "in_progress"
    │   └── [Completar] → PATCH /api/admin/bookings/:id/complete
    │
    ├── Si status = "completed" o "cancelled"
    │   └── [Ver detalle] (solo lectura) → flujo 3
    │
    └── Botón "Bloquear fecha"
        └── POST /api/admin/availability/block (con la fecha actual o elegida)
```

---

## 3. Detalle de Cita

Pantalla de detalle completo de una cita. Accesible desde la agenda o desde el listado general.

```
Pantalla: Detalle de cita
│
├── Al entrar
│   └── GET /api/admin/bookings/:bookingId
│       → Muestra todos los datos:
│         - Datos del cliente (nombre, teléfono)
│         - Vehículo (marca, modelo, color, tamaño, placa)
│         - Dirección completa
│         - Servicio (tipo de lavado + add-ons)
│         - Fecha y hora
│         - Empresa asignada y companyStatus
│         - Estado de la cita
│         - Precio total (y si usó membresía)
│         - Comentarios del cliente
│         - Feedback (si ya existe)
│
├── Panel de acciones (mismo set que en la agenda, según estado)
│   ├── Aceptar   → PATCH /api/admin/bookings/:id/accept
│   ├── Rechazar  → PATCH /api/admin/bookings/:id/reject  (pide razón)
│   ├── Reasignar → PATCH /api/admin/bookings/:id/reassign
│   │               (opcional: elegir empresa específica o dejar que el sistema elija)
│   ├── Iniciar   → PATCH /api/admin/bookings/:id/start
│   ├── Completar → PATCH /api/admin/bookings/:id/complete
│   └── Cancelar  → PATCH /api/admin/bookings/:id/cancel  (pide razón opcional)
│
└── Enlace al perfil del cliente
    └── → flujo 8 (detalle de cliente)
```

---

## 4. Listado General de Citas

Vista que permite buscar, filtrar y ver todas las citas del sistema (no solo del día actual). Útil para revisar histórico, buscar por cliente o por empresa.

```
Pantalla: Citas
│
├── Al entrar (sin filtros)
│   └── GET /api/admin/bookings?page=1&limit=20
│
├── Filtros disponibles:
│   ├── Por estado (pending / accepted / in_progress / completed / cancelled)
│   ├── Por fecha o rango de fechas
│   ├── Por empresa asignada (companyId)
│   ├── Por estado de asignación (companyStatus)
│   └── Búsqueda libre (nombre de cliente o placa)
│   └── GET /api/admin/bookings?status=X&dateFrom=Y&dateTo=Z&companyId=W&search=...
│
├── Al tocar una cita de la lista
│   └── → flujo 3 (detalle de cita)
│
└── Paginación
    └── GET /api/admin/bookings?page=N
```

---

## 5. Gestión de Empresas

El admin registra y administra las empresas que prestan el servicio de lavado. Cada empresa tiene sus propios horarios disponibles, que determinan la capacidad de cada slot en la app del cliente.

### 5.1 Listado de empresas

```
Pantalla: Empresas
│
├── Al entrar
│   └── GET /api/admin/companies
│       → Lista todas las empresas con: nombre, estado (activa/inactiva),
│         total de citas, citas completadas, rating promedio
│
├── Filtro: activas / inactivas / búsqueda por nombre
│   └── GET /api/admin/companies?active=true&search=...
│
├── Botón "Nueva empresa"
│   └── → flujo 5.2
│
└── Al tocar una empresa
    └── → flujo 5.3
```

### 5.2 Crear empresa

```
Pantalla: Nueva empresa
│
├── Admin llena: nombre, email, teléfono, contraseña inicial
│   └── POST /api/admin/companies
│       ├── Éxito: empresa creada → navega al detalle de la empresa (flujo 5.3)
│       └── Error 400 EMAIL_ALREADY_EXISTS: muestra mensaje
│
└── La empresa creada puede iniciar sesión con role: "company"
    para aceptar/rechazar citas que le sean asignadas
```

### 5.3 Detalle de empresa

```
Pantalla: Detalle de empresa
│
├── Al entrar
│   └── GET /api/admin/companies/:companyId
│       → Muestra: datos, estadísticas (completadas, rechazadas, rating),
│         horarios actuales, citas recientes
│
├── Editar datos (nombre, email, teléfono, activar/desactivar)
│   └── PUT /api/admin/companies/:companyId
│       Nota: desactivar una empresa la excluye de futuras asignaciones
│             pero no afecta citas ya asignadas a ella
│
├── Ver/editar horarios de la empresa
│   ├── GET /api/admin/companies/:companyId/availability
│   │   → Muestra qué slots tiene activos y fechas bloqueadas propias
│   │
│   └── PUT /api/admin/companies/:companyId/availability
│       → Admin actualiza los slots habilitados y fechas en las que no trabaja
│       Nota: al cambiar horarios, se recalcula automáticamente el spotsLeft
│             visible en la app del cliente
│
└── Ver citas asignadas a esta empresa
    └── GET /api/admin/bookings?companyId=:companyId
```

---

## 6. Catálogos

El admin edita los catálogos que la app del cliente consume. Cualquier cambio aquí se refleja de inmediato en la app sin actualización.

### 6.1 Paquetes / Suscripciones

```
Pantalla: Paquetes
│
├── Al entrar
│   └── GET /api/admin/catalog/packages
│       → Lista paquetes: Básico, Completo, Premium
│         con precios, duraciones y add-ons incluidos
│
└── Al editar un paquete
    └── PUT /api/admin/catalog/packages/:packageId
        Puede cambiar: nombre, descripción, color, popularidad,
        activo/inactivo, beneficios, add-ons incluidos, precios por duración y tamaño
```

### 6.2 Servicios y Precios

```
Pantalla: Servicios
│
├── Al entrar
│   └── GET /api/admin/catalog/services
│       → Muestra:
│         - Precios base por tamaño de vehículo (small/suv/large)
│         - Precios adicionales por tipo de lavado
│         - Lista de add-ons con precio y estado (activo/inactivo)
│
├── Editar precios por tamaño de vehículo
│   └── PUT /api/admin/catalog/services/vehicle-prices
│
├── Editar precios por tipo de lavado
│   └── PUT /api/admin/catalog/services/wash-type-prices
│
└── Editar un add-on individual
    └── PUT /api/admin/catalog/services/:serviceId
        Puede cambiar: nombre, precio, tiempo estimado, activo/inactivo
```

### 6.3 Zonas de Cobertura

```
Pantalla: Zonas
│
├── Al entrar
│   └── GET /api/admin/catalog/zones
│       → Muestra: estados, ciudades y colonias cubiertas
│
└── Editar zonas
    └── PUT /api/admin/catalog/zones
        Puede agregar o quitar colonias (ej. agregar nueva colonia en Tlajomulco)
        Nota: quitar una colonia no cancela citas existentes en esa zona
```

### 6.4 Horarios Globales

```
Pantalla: Horarios globales
│
├── Al entrar
│   └── GET /api/admin/availability
│       → Muestra qué slots existen en el sistema (9 AM, 10 AM…)
│         y cuántas empresas están disponibles en cada uno
│
├── Activar/desactivar slots globalmente
│   └── PUT /api/admin/availability
│       Nota: desactivar un slot lo oculta para todos los clientes,
│             aunque haya empresas disponibles en él
│
├── Bloquear fechas completas
│   └── POST /api/admin/availability/block
│       (ej. días festivos, vacaciones del negocio)
│
└── Desbloquear fechas
    └── DELETE /api/admin/availability/block
```

---

## 7. Reportes

El admin consulta métricas del negocio para tomar decisiones.

### 7.1 Ingresos

```
Pantalla: Ingresos
│
├── Al entrar (default: mes actual)
│   └── GET /api/admin/reports/revenue?period=month
│       → Muestra: ingresos totales, por membresías, por citas individuales,
│         ticket promedio, citas completadas vs canceladas,
│         gráfica de ingresos por día
│
└── Filtros de período
    ├── Hoy        → GET /api/admin/reports/revenue?period=day&date=YYYY-MM-DD
    ├── Esta semana → GET /api/admin/reports/revenue?period=week
    ├── Este mes   → GET /api/admin/reports/revenue?period=month
    └── Rango custom → GET /api/admin/reports/revenue?period=custom&dateFrom=X&dateTo=Y
```

### 7.2 Citas

```
Pantalla: Reporte de citas
│
└── GET /api/admin/reports/bookings?dateFrom=X&dateTo=Y
    → Muestra: total de citas, desglose por estado,
      tasa de cancelación, tasa de completado,
      gráfica de citas por día
```

### 7.3 Servicios más solicitados

```
Pantalla: Reporte de servicios
│
└── GET /api/admin/reports/services?dateFrom=X&dateTo=Y
    → Muestra: tipos de lavado más pedidos (con porcentaje),
      add-ons más usados, distribución por tamaño de vehículo
```

### 7.4 Membresías

```
Pantalla: Reporte de membresías
│
└── GET /api/admin/reports/memberships?dateFrom=X&dateTo=Y
    → Muestra: membresías vendidas, ingresos por membresías,
      activas actualmente, desglose por paquete y por duración
```

---

## 8. Clientes

El admin puede consultar el historial y perfil de cualquier cliente registrado.

### 8.1 Listado de clientes

```
Pantalla: Clientes
│
├── Al entrar
│   └── GET /api/admin/clients
│       → Lista de clientes con: nombre, teléfono, email,
│         total de citas, membresías activas, dinero gastado
│
├── Búsqueda por nombre, email o teléfono
│   └── GET /api/admin/clients?search=...
│
└── Al tocar un cliente
    └── → flujo 8.2
```

### 8.2 Perfil de cliente

```
Pantalla: Perfil de cliente
│
├── Al entrar
│   └── GET /api/admin/clients/:userId
│       → Muestra: datos del cliente, estadísticas,
│         vehículos guardados, direcciones, membresías,
│         citas recientes
│
├── Ver historial completo de citas del cliente
│   └── GET /api/admin/clients/:userId/bookings?status=X&page=N
│
├── Ver membresías del cliente
│   └── GET /api/admin/clients/:userId/memberships
│
└── Al tocar una cita del historial
    └── → flujo 3 (detalle de cita)
```

---

## Resumen: pantallas y sus endpoints principales

| Pantalla                   | Endpoints que consume                                                        |
|----------------------------|------------------------------------------------------------------------------|
| Login                      | `POST /api/auth/login`, `GET /api/auth/me`                                  |
| Agenda del día             | `GET /api/admin/agenda`, acciones de cita (accept/start/complete/cancel/reassign) |
| Detalle de cita            | `GET /api/admin/bookings/:id`, acciones de cita                              |
| Listado de citas           | `GET /api/admin/bookings` (con filtros y paginación)                        |
| Listado de empresas        | `GET /api/admin/companies`                                                   |
| Crear empresa              | `POST /api/admin/companies`                                                  |
| Detalle de empresa         | `GET /api/admin/companies/:id`, `PUT /api/admin/companies/:id`, `GET/PUT availability` |
| Catálogo — Paquetes        | `GET /api/admin/catalog/packages`, `PUT /api/admin/catalog/packages/:id`    |
| Catálogo — Servicios       | `GET /api/admin/catalog/services`, `PUT` de precios y servicios             |
| Catálogo — Zonas           | `GET /api/admin/catalog/zones`, `PUT /api/admin/catalog/zones`              |
| Catálogo — Horarios globales | `GET/PUT /api/admin/availability`, `POST/DELETE /api/admin/availability/block` |
| Reportes — Ingresos        | `GET /api/admin/reports/revenue`                                             |
| Reportes — Citas           | `GET /api/admin/reports/bookings`                                            |
| Reportes — Servicios       | `GET /api/admin/reports/services`                                            |
| Reportes — Membresías      | `GET /api/admin/reports/memberships`                                         |
| Listado de clientes        | `GET /api/admin/clients`                                                     |
| Perfil de cliente          | `GET /api/admin/clients/:id`, `GET /api/admin/clients/:id/bookings`, `GET /api/admin/clients/:id/memberships` |
