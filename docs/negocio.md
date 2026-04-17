# Documentación de Negocio — App de Car Wash

> Este documento describe todas las funcionalidades, flujos y reglas de negocio de la aplicación de lavado de autos. Está pensado como guía de referencia para el desarrollo del panel administrador.

---

## 1. Contexto General

La aplicación permite a clientes en Tlajomulco de Zúñiga, Jalisco, reservar servicios de lavado de autos a domicilio. El cliente gestiona sus vehículos, direcciones y membresías/paquetes desde la app móvil. El administrador (panel que aún no existe) debe poder ver, aceptar o cancelar las citas que llegan, y tener visibilidad de los ingresos y el negocio en general.

---

## 2. Zonas de Servicio

El servicio solo está disponible en las siguientes ubicaciones:

| Campo    | Valores disponibles                        |
|----------|--------------------------------------------|
| Estado   | Jalisco                                    |
| Ciudad   | Tlajomulco de Zúñiga                       |
| Colonias | Villa California, Casa Fuerte, Adamar      |

La app valida esto al momento de guardar una dirección. No se pueden registrar direcciones fuera de estas colonias.

---

## 3. Catálogo de Servicios

### 3.1 Tipos de lavado (Wash Types)

El cliente elige uno de estos tipos de lavado base. Cada tipo tiene un costo adicional sobre el precio base del vehículo:

| Tipo       | Código       | Costo adicional | Descripción corta                        |
|------------|--------------|-----------------|------------------------------------------|
| Básico     | `basic`      | $0              | Exterior + Aspirado                      |
| Completo   | `complete`   | $80             | Exterior + Interior + Vidrios            |
| Premium    | `premium`    | $150            | Completo + Rines                         |
| Detallado  | `detail`     | $250            | Premium + Motor + Cera                   |
| Full       | `full`       | $380            | Todo incluido                            |

### 3.2 Servicios individuales (ALL_SERVICES)

Cada tipo de lavado incluye automáticamente ciertos servicios. Los demás pueden agregarse como add-on con costo extra:

| Servicio                | ID           | Precio extra | Incluido en                                  | Tiempo est.     |
|-------------------------|--------------|--------------|----------------------------------------------|-----------------|
| Lavado Exterior         | `exterior`   | $0           | basic, complete, premium, detail, full       | 15–20 min       |
| Aspirado                | `aspirado`   | $0           | basic, complete, premium, detail, full       | 10–15 min       |
| Interior Completo       | `interior`   | $100         | complete, premium, detail, full              | 15–25 min       |
| Limpieza de Vidrios     | `vidrios`    | $0           | complete, premium, detail, full              | 5–10 min        |
| Detallado de Rines      | `rines`      | $50          | premium, detail, full                        | 10–15 min       |
| Lavado de Motor         | `motor`      | $70          | detail, full                                 | 15–20 min       |
| Encerado Premium        | `cera`       | $80          | detail, full                                 | 15–25 min       |
| Limpieza de Tapicería   | `tapiceria`  | $120         | full                                         | 20–30 min       |

### 3.3 Precios base por tamaño de vehículo

| Tamaño      | Código    | Precio base |
|-------------|-----------|-------------|
| Pequeño     | `small`   | $150        |
| Camioneta   | `suv`     | $200        |
| Grande      | `large`   | $250        |

### 3.4 Fórmula de precio total

```
Precio total = Precio base (tamaño) + Costo lavado (tipo) + Suma de add-ons no incluidos
```

Ejemplo: Camioneta (`$200`) + Completo (`$80`) + Rines add-on (`$50`) = **$330**

### 3.5 Tiempo estimado del servicio

Se calcula sumando los minutos mínimos y máximos de cada servicio seleccionado (incluidos y add-ons). Se muestra al cliente como rango, por ejemplo: "25–40 min".

---

## 4. Gestión de Vehículos

El usuario puede guardar múltiples vehículos con los siguientes datos:

| Campo    | Tipo     | Requerido |
|----------|----------|-----------|
| Marca    | texto    | Sí        |
| Modelo   | texto    | Sí        |
| Color    | texto    | Sí        |
| Tamaño   | enum     | Sí (small / suv / large) |
| Placa    | texto    | No        |

Operaciones disponibles: **agregar**, **ver lista**, **eliminar**.

---

## 5. Gestión de Direcciones

El usuario puede guardar múltiples direcciones. Campos:

| Campo            | Tipo   | Requerido |
|------------------|--------|-----------|
| Alias            | texto  | Sí        |
| Estado           | enum   | Sí (solo Jalisco) |
| Ciudad           | enum   | Sí (solo Tlajomulco de Zúñiga) |
| Colonia          | enum   | Sí (Villa California, Casa Fuerte, Adamar) |
| Coto / Fraccionamiento | texto | No  |
| Calle            | texto  | Sí        |
| Número exterior  | texto  | Sí        |
| Número interior  | texto  | No        |
| Referencia       | texto  | No        |

Operaciones disponibles: **agregar**, **ver lista**, **eliminar**.

---

## 6. Flujo de Reserva de Cita (Booking Flow)

Este es el flujo principal que sigue el cliente cuando quiere agendar un lavado.

### Paso 1 — Selección de vehículo (`VehicleSelectionScreen`)

- El usuario puede seleccionar un vehículo guardado previamente.
- O puede indicar el tamaño directamente (pequeño, camioneta, grande) sin vehículo guardado.
- También elige la dirección donde quiere el servicio.
- Campos que pasan al siguiente paso: `vehicleSize`, `addressLabel`, `vehicleBrand`, `vehicleModel`, `vehicleColor`, `vehiclePlate`.

### Paso 2 — Verificación de paquete activo (`BookingPackageOptionScreen`)

- El sistema verifica si el usuario tiene **membresías activas** compatibles con el tamaño de vehículo seleccionado.
- **Si no tiene membresía compatible:** se salta automáticamente al Paso 3.
- **Si tiene membresía(s) compatibles:** se muestra la pantalla con dos opciones:
  - **Usar paquete:** se selecciona la membresía → se salta la personalización de servicios → se va directo a elegir horario con precio `$0` y los servicios incluidos en el paquete.
  - **Continuar sin paquete:** se procede al Paso 3 normalmente.

### Paso 3 — Personalización de servicio (`ServiceCustomizationScreen`)

- El usuario elige el **tipo de lavado** (Básico, Completo, Premium, Detallado, Full).
- Los servicios incluidos en el tipo elegido se muestran como **incluidos** (no tienen costo adicional y no se pueden desmarcar).
- El usuario puede agregar **add-ons opcionales** (servicios no incluidos en el tipo elegido).
- Se muestra el precio total en tiempo real conforme se seleccionan opciones.
- El usuario puede agregar **comentarios o indicaciones especiales** (texto libre), por ejemplo: "El carro tiene una abolladura, tener cuidado".
- Al continuar, pasa al Paso 4.

### Paso 4 — Selección de horario (`ScheduleSelectionScreen`)

- Se muestra un calendario para elegir fecha.
- Se muestran horarios disponibles para la fecha seleccionada.
- Al confirmar, se crea una **reserva temporal** con un tiempo límite (`reservationExpiry`) para completar el pago.
- Pasa al Paso 5.

### Paso 5 — Pago (`PaymentScreen`)

- Se muestra un resumen completo de la cita:
  - Vehículo (imagen por tamaño, marca/modelo/color/placa si aplica)
  - Tipo de lavado y servicios seleccionados
  - Fecha y hora
  - Dirección
  - Precio total (o $0 si usa membresía)
- Hay un **contador regresivo** visible si hay tiempo límite de reserva.
- Se elige el método de pago (componente `PaymentMethodSelector`).
- Al confirmar pago:
  - Se guarda la reserva con `status: "upcoming"`.
  - Si se usó membresía, se descuenta una lavada (`washesRemaining - 1`).
  - Se navega a la pantalla de confirmación.

### Paso 6 — Confirmación (`ConfirmationScreen`)

- Se muestra un resumen de la cita confirmada.
- Opciones: ver detalle de la cita o regresar al inicio.

---

## 7. Modelo de Datos de una Cita (Booking)

| Campo               | Tipo                          | Descripción                                        |
|---------------------|-------------------------------|----------------------------------------------------|
| `id`                | string                        | Identificador único                                |
| `vehicleSize`       | `small` / `suv` / `large`    | Tamaño del vehículo                                |
| `washType`          | `basic`/`complete`/etc.       | Tipo de lavado                                     |
| `addOns`            | string[]                      | IDs de servicios seleccionados (incluidos + extra) |
| `date`              | string (ISO)                  | Fecha del servicio                                 |
| `time`              | string (ej. "10:00 AM")       | Hora del servicio                                  |
| `totalPrice`        | number                        | Precio total en MXN                                |
| `status`            | `upcoming`/`completed`/`cancelled` | Estado de la cita                            |
| `createdAt`         | string (ISO)                  | Fecha/hora de creación                             |
| `usedMembership`    | boolean (opcional)            | Si se usó una membresía/paquete                    |
| `pendingReschedule` | boolean (opcional)            | Si tiene reagendamiento pendiente                  |
| `rescheduleDeadline`| string (opcional)             | Límite para reagendar                              |
| `vehicleBrand`      | string (opcional)             | Marca del vehículo                                 |
| `vehicleModel`      | string (opcional)             | Modelo del vehículo                                |
| `vehicleColor`      | string (opcional)             | Color del vehículo                                 |
| `vehiclePlate`      | string (opcional)             | Placa del vehículo                                 |
| `addressLabel`      | string (opcional)             | Alias/etiqueta de la dirección                     |
| `comments`          | string (opcional)             | Indicaciones especiales del cliente                |
| `feedbackRating`    | number 1–5 (opcional)         | Calificación general                               |
| `feedbackCleanliness`| string (opcional)            | Calificación de limpieza                           |
| `feedbackPunctuality`| string (opcional)            | Calificación de puntualidad                        |
| `feedbackExtras`    | string[] (opcional)           | Aspectos positivos seleccionados                   |
| `feedbackComment`   | string (opcional)             | Comentario libre del feedback                      |

---

## 8. Gestión de Citas (pantalla Citas)

- Muestra todas las citas del usuario con estado **upcoming** (próximas).
- También muestra historial de citas **completadas** y **canceladas**.
- El usuario puede tocar una cita para ver su detalle.

### Detalle de Cita (`AppointmentDetailScreen`)

Desde aquí el usuario puede:
- **Cancelar la cita** (cambia `status` a `"cancelled"`).
- **Reagendar la cita** (abre modal con calendario/horario → actualiza `date` y `time`).
- **Dejar feedback** (solo disponible para citas completadas, sin feedback previo).
- Ver todos los detalles: vehículo, servicios, fecha/hora, precio, dirección, comentarios.

---

## 9. Sistema de Paquetes / Membresías

### 9.1 Paquetes disponibles

Hay 3 tipos de paquetes:

#### Básico (color: azul `#3B82F6`)
- Lavado tipo: **Básico** (exterior + aspirado)
- Add-ons incluidos: ninguno
- Beneficios: Lavado exterior, Aspirado interior, Prioridad en citas

| Duración | Lavadas | Precio Pequeño | Precio Camioneta | Precio Grande |
|----------|---------|----------------|------------------|---------------|
| 1 Semana | 2       | $269            | $359             | $449          |
| 1 Mes    | 4       | $479            | $639             | $799          |
| 3 Meses  | 12      | $1,249          | $1,679           | $2,099        |

#### Completo (color: morado `#8B5CF6`) — *Popular*
- Lavado tipo: **Completo** (exterior + interior + vidrios)
- Add-ons incluidos: Interior Completo (2 usos)
- Beneficios: Lavado exterior, Interior completo, Limpieza de vidrios, Aspirado interior

| Duración | Lavadas | Precio Pequeño | Precio Camioneta | Precio Grande |
|----------|---------|----------------|------------------|---------------|
| 1 Semana | 2       | $409            | $499             | $589          |
| 1 Mes    | 4       | $729            | $899             | $1,049        |
| 3 Meses  | 12      | $1,929          | $2,349           | $2,769        |

#### Premium (color: ámbar `#F59E0B`)
- Lavado tipo: **Premium** (exterior + interior + vidrios + rines)
- Add-ons incluidos: Interior Completo (4 usos), Detallado de Rines (4 usos), Encerado Premium (2 usos)
- Beneficios: Lavado exterior, Interior completo, Detallado de rines, Encerado premium, Limpieza de vidrios

| Duración | Lavadas | Precio Pequeño | Precio Camioneta | Precio Grande |
|----------|---------|----------------|------------------|---------------|
| 1 Semana | 2       | $539            | $629             | $719          |
| 1 Mes    | 4       | $959            | $1,119           | $1,279        |
| 3 Meses  | 12      | $2,499          | $2,929           | $3,359        |

### 9.2 Modelo de datos de una Membresía

| Campo            | Tipo                       | Descripción                                        |
|------------------|----------------------------|----------------------------------------------------|
| `id`             | string                     | ID único                                           |
| `packageId`      | `basico`/`completo`/`premium` | Paquete al que pertenece                        |
| `durationId`     | `1semana`/`1mes`/`3meses` | Duración elegida                                   |
| `vehicleSize`    | `small`/`suv`/`large`      | Tamaño de vehículo asociado (no se puede cambiar) |
| `activatedAt`    | string (ISO)               | Fecha de activación                                |
| `expirationDate` | string (ISO)               | Fecha de vencimiento (activatedAt + días)          |
| `washesRemaining`| number                     | Lavadas restantes                                  |
| `addOnUsage`     | `{ [addOnId]: number }`    | Usos restantes de add-ons incluidos                |

### 9.3 Reglas de negocio de membresías

- Una membresía es válida si: `expirationDate > now` **Y** `washesRemaining > 0`.
- Una membresía es **específica para un tamaño de vehículo** — no se puede usar en otro tamaño.
- Al usar una lavada: `washesRemaining` se decrementa en 1.
- Al usar un add-on incluido: `addOnUsage[addOnId]` se decrementa en 1.
- Un usuario puede tener **múltiples membresías activas** simultáneamente.
- Se pueden **cancelar** membresías (se eliminan del perfil).

### 9.4 Flujo de compra de paquete

1. El usuario va a la pestaña "Paquetes".
2. Selecciona el tamaño de vehículo (`PackageVehicleSelectionScreen`).
3. Ve los 3 paquetes disponibles con sus precios para ese tamaño (`PackagesScreen`).
4. Selecciona un paquete y elige la duración (`PackagePurchaseScreen`).
5. Confirma la compra → se activa la membresía en su perfil.

---

## 10. Sistema de Feedback Post-Servicio

Después de que una cita queda en estado **completed**, el cliente puede calificar el servicio (`ServiceFeedbackScreen`).

Campos del feedback:

| Campo               | Opciones                                                                 |
|---------------------|--------------------------------------------------------------------------|
| Calificación general| 1, 2, 3, 4, 5 estrellas                                                 |
| Limpieza            | Excelente / Buena / Regular / Mala                                       |
| Puntualidad         | A tiempo / Leve retraso / Con retraso                                    |
| Aspectos positivos  | Amabilidad del personal, Buenos productos, Rapidez, Trabajo detallado, Lo recomendaría |
| Comentario libre    | Texto abierto                                                            |

El feedback se almacena directamente en el objeto `Booking`.

---

## 11. Pantalla de Inicio (Home)

La pantalla principal muestra:

1. **Membresía activa** (si existe): nombre del paquete, lavadas restantes/totales, barra de progreso, días restantes. Toca para ir a la sección de paquetes.
2. **Botón "Reservar Lavado"**: inicia el flujo de reserva.
3. **Próximas citas**: lista de hasta 3 citas con status `upcoming`. Muestra vehículo, tipo de lavado, fecha, hora y precio (o "Paquete" si se usó membresía).

Se actualiza al hacer pull-to-refresh y al volver a enfocar la pantalla.

---

## 12. Menú del Usuario

La pestaña "Menú" da acceso a:

- **Perfil**: nombre, teléfono, email.
- **Mis Vehículos**: gestión de vehículos guardados.
- **Mis Direcciones**: gestión de direcciones guardadas.
- **Historial**: citas pasadas (completadas y canceladas).

---

## 13. Almacenamiento de Datos (Estado actual)

Actualmente toda la información se guarda en **AsyncStorage** (almacenamiento local del dispositivo):

- `@carwash_bookings` — lista de todas las citas.
- `@carwash_user` — datos del usuario: perfil, vehículos, direcciones, membresías.

El backend (Express + PostgreSQL con Drizzle ORM) existe pero aún no está integrado con el flujo de la app. Las operaciones de negocio las maneja completamente el cliente.

---

## 14. Lo que debe tener el Panel Administrador

Con base en todo lo anterior, el panel administrador necesita cubrir:

### 14.1 Gestión de Citas

| Funcionalidad                   | Descripción                                                                                 |
|---------------------------------|---------------------------------------------------------------------------------------------|
| **Ver todas las citas**         | Lista de citas con filtros por estado (pendiente, aceptada, en curso, completada, cancelada)|
| **Detalle de cita**             | Ver todos los campos: cliente, vehículo, servicios, fecha/hora, dirección, comentarios, precio |
| **Aceptar cita**                | El admin confirma que puede atender la cita en ese horario                                  |
| **Cancelar cita**               | El admin cancela la cita (debe notificar al cliente y gestionar reembolso si aplica)        |
| **Marcar como en curso**        | Cuando el servicio ha comenzado                                                             |
| **Marcar como completada**      | Cuando el servicio ha terminado                                                             |
| **Ver comentarios del cliente** | Indicaciones especiales que el cliente dejó al reservar                                     |
| **Ver si usó membresía**        | Identificar si la cita fue pagada con paquete o de forma individual                        |

### 14.2 Finanzas / Ingresos

| Funcionalidad                        | Descripción                                                          |
|--------------------------------------|----------------------------------------------------------------------|
| **Ingresos del día / semana / mes**  | Suma de `totalPrice` de citas completadas en el período             |
| **Citas por día**                    | Conteo de citas atendidas                                            |
| **Desglose por tipo de servicio**    | Cuántos lavados básicos, completos, premium, etc. se hicieron        |
| **Citas con membresía vs pagadas**   | Diferenciación de revenue: membresías vendidas vs cobros unitarios   |
| **Historial de pagos**               | Lista de transacciones completadas                                   |

### 14.3 Clientes

| Funcionalidad              | Descripción                                               |
|----------------------------|-----------------------------------------------------------|
| **Ver clientes registrados**| Lista de usuarios con su historial de citas              |
| **Historial por cliente**  | Todas las citas de un cliente específico                  |
| **Membresías activas**     | Ver qué clientes tienen membresía activa y cuál           |

### 14.4 Disponibilidad / Agenda

| Funcionalidad                    | Descripción                                                      |
|----------------------------------|------------------------------------------------------------------|
| **Configurar horarios disponibles** | Definir en qué horarios se puede agendar                      |
| **Bloquear fechas/horarios**     | Marcar días o horas como no disponibles                          |
| **Capacidad por horario**        | Cuántas citas simultáneas se pueden atender                      |
| **Vista de agenda del día**      | Ver todas las citas de un día ordenadas por hora                 |

### 14.5 Notificaciones (a futuro)

- Notificar al cliente cuando su cita es aceptada.
- Notificar al cliente cuando el servicio está en camino.
- Notificar al cliente cuando el servicio está completo.
- Recordatorio de cita próxima.

---

## 15. Estados de una Cita

Para el panel administrador se sugiere manejar los siguientes estados (la app actual solo tiene 3):

| Estado actual (app) | Estados sugeridos (admin)             | Descripción                                         |
|---------------------|---------------------------------------|-----------------------------------------------------|
| `upcoming`          | `pending` → esperando aceptación      | Cita recién creada, no revisada por el admin        |
| `upcoming`          | `accepted` → aceptada                 | Admin confirmó que puede atender                    |
| `upcoming`          | `in_progress` → en curso              | El servicio ha comenzado                            |
| `completed`         | `completed` → completada              | Servicio terminado                                  |
| `cancelled`         | `cancelled` → cancelada               | Cancelada por el cliente o por el admin             |

---

## 16. Flujo de negocio esperado (extremo a extremo)

```
Cliente reserva cita
        ↓
Cita aparece en panel admin con estado "Pendiente"
        ↓
Admin revisa: vehículo, servicios, fecha/hora, dirección, comentarios
        ↓
Admin ACEPTA  ──────────────────  Admin CANCELA
        ↓                                ↓
Cliente recibe confirmación       Cliente recibe cancelación
        ↓                          (reembolso si aplica)
Llega el día del servicio
        ↓
Admin marca "En curso"
        ↓
Servicio terminado
        ↓
Admin marca "Completada"
        ↓
Cliente puede dejar feedback
        ↓
Ingreso se registra en finanzas
```

---

## 17. Glosario

| Término          | Significado                                                              |
|------------------|--------------------------------------------------------------------------|
| Booking / Cita   | Una reserva de servicio de lavado                                        |
| Membership       | Paquete/suscripción activo que incluye lavadas prepagadas                |
| WashType         | Tipo de lavado (Básico, Completo, Premium, Detallado, Full)              |
| VehicleSize      | Tamaño del vehículo: small (pequeño), suv (camioneta), large (grande)    |
| AddOn            | Servicio extra que no está incluido en el tipo de lavado elegido         |
| washesRemaining  | Lavadas restantes en una membresía activa                                |
| addOnUsage       | Usos restantes de add-ons incluidos en una membresía                     |
| status           | Estado de la cita: upcoming / completed / cancelled                      |
| usedMembership   | Indica que la cita fue cubierta por una membresía (precio $0)            |
