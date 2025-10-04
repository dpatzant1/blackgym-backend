# Guía de Implementación - Bitácora, Roles y Estados de Órdenes

**Proyecto:** Black Gym Backend API  
**Fecha de creación:** 30 de septiembre de 2025  
**Versión:** 1.0  
**Autor:** Equipo de Desarrollo

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Cambios en la Base de Datos](#cambios-en-la-base-de-datos)
3. [Estructura de Fases](#estructura-de-fases)
4. [Detalles de Implementación](#detalles-de-implementación)
5. [Guía de Buenas Prácticas](#guía-de-buenas-prácticas)
6. [Testing y Validación](#testing-y-validación)

---

## 🎯 Visión General

### Resumen de Nuevas Funcionalidades

Este documento describe la implementación de tres nuevas funcionalidades críticas para el backend de Black Gym:

1. **Sistema de Bitácora (Auditoría)**: Registro detallado de todas las acciones administrativas
2. **Sistema de Roles**: Control de acceso basado en roles (Administrador, Gerente, Asesor de Ventas)
3. **Estados de Órdenes**: Gestión del ciclo de vida de las órdenes (pendiente → pagado → enviado → completado)

### Objetivos

- ✅ Trazabilidad completa de acciones administrativas
- ✅ Control de acceso granular basado en roles
- ✅ Gestión profesional del flujo de órdenes
- ✅ Cumplimiento con mejores prácticas de auditoría
- ✅ Escalabilidad para futuros módulos

---

## 🗄️ Cambios en la Base de Datos

### Nuevas Tablas

#### 1. Tabla `bitacora`
```sql
create table bitacora (
  id serial primary key,
  admin_id int references administradores(id) on delete set null,
  accion text not null,
  descripcion text,
  fecha timestamp default now()
);
```

**Campos:**
- `id`: Identificador único del registro
- `admin_id`: Referencia al administrador que realizó la acción (nullable para permitir registros de sistema)
- `accion`: Código estandarizado de la acción (ej: 'LOGIN', 'CREAR_PRODUCTO')
- `descripcion`: Detalle amplio de la acción con información relevante
- `fecha`: Timestamp automático de cuándo ocurrió la acción

#### 2. Tabla `roles`
```sql
create table roles (
  id serial primary key,
  nombre text unique not null,
  descripcion text
);

-- Datos iniciales
insert into roles (nombre, descripcion) values
('administrador', 'Acceso total al sistema'),
('gerente', 'Gestión de productos, categorías y órdenes'),
('asesor de ventas', 'Acceso limitado a inventario y órdenes');
```

**Campos:**
- `id`: Identificador único del rol
- `nombre`: Nombre único del rol
- `descripcion`: Descripción detallada de los permisos del rol

### Modificaciones a Tablas Existentes

#### 1. Tabla `ordenes` - Campo `estado`
```sql
alter table ordenes
add column estado text default 'pendiente';
```

**Valores permitidos:**
- `pendiente`: Orden creada, esperando confirmación de pago
- `pagado`: Pago confirmado, esperando procesamiento
- `enviado`: Orden enviada al cliente
- `completado`: Orden finalizada exitosamente
- `cancelado`: Orden cancelada

#### 2. Tabla `administradores` - Campo `rol_id`
```sql
alter table administradores
add column rol_id int references roles(id) on delete set null;
```

---

## 📊 Estructura de Fases

### FASE 1: Actualización de Constantes y Configuración ✅
**Objetivo:** Preparar el sistema con las nuevas constantes y configuraciones necesarias

#### 1.1 Actualizar `src/utils/constants.js` ✅
- [x] Agregar tabla `BITACORA` a `TABLES`
- [x] Agregar tabla `ROLES` a `TABLES`
- [x] Crear constante `ACCIONES_BITACORA` con todas las acciones estándar
- [x] Crear constante `ROLES_SISTEMA` con los roles disponibles
- [x] Actualizar `ORDER_STATUS` con todos los estados
- [x] Agregar constantes de permisos por rol

**Tiempo estimado:** 1 hora  
**Estado:** ✅ COMPLETADA

---

### FASE 2: Modelos de Datos ✅
**Objetivo:** Crear modelos para las nuevas tablas y actualizar los existentes  
**Estado:** ✅ COMPLETADA

#### 2.1 Crear Modelo de Bitácora ✅
- [x] Crear `src/models/bitacora.js`
- [x] Implementar `BitacoraModel` con métodos:
  - `crear(data)`: Registrar nueva entrada en bitácora
  - `listar(page, limit)`: Listar todos los registros con paginación
  - `listarPorAdmin(adminId, page, limit)`: Obtener registros por administrador
  - `listarPorAccion(accion, page, limit)`: Obtener registros por tipo de acción
  - `listarPorFecha(fechaInicio, fechaFin, page, limit)`: Obtener registros por rango de fechas
  - `obtenerEstadisticas()`: Estadísticas generales de acciones
  - `buscar(filtros, page, limit)`: Búsqueda con múltiples filtros (BONUS)
- [x] Validaciones apropiadas para cada campo
- [x] Inclusión de datos del administrador en queries (JOIN con tabla administradores)
- [x] Manejo robusto de errores

#### 2.2 Crear Modelo de Roles ✅
- [x] Crear `src/models/roles.js`
- [x] Implementar `RolModel` con métodos:
  - `listarTodos()`: Obtener todos los roles
  - `buscarPorId(id)`: Buscar rol por ID
  - `buscarPorNombre(nombre)`: Buscar rol por nombre
  - `obtenerPermisos(rolId)`: Obtener permisos del rol
  - `obtenerPermisosPorNombre(nombreRol)`: Obtener permisos por nombre del rol (BONUS)
  - `existe(rolId)`: Verificar si un rol existe (BONUS)
  - `tienePermiso(rolId, permiso)`: Verificar si un rol tiene un permiso específico (BONUS)
  - `contarAdministradores(rolId)`: Contar administradores por rol (BONUS)
  - `obtenerEstadisticas()`: Estadísticas de uso de roles (BONUS)
  - `validarRolId(rolId)`: Validar que un rol ID sea válido (BONUS)
  - `esAdministrador(rolId)`: Verificar si un rol es de tipo administrador (BONUS)
- [x] Validaciones de permisos completas con soporte para wildcards
- [x] Manejo robusto de errores

#### 2.3 Actualizar Modelo de Administradores ✅
- [x] Modificar `src/models/administradores.js`
- [x] Agregar campo `rol_id` en todas las operaciones
- [x] Agregar método `asignarRol(adminId, rolId)` - Incluye validaciones de admin y rol
- [x] Agregar método `obtenerAdminConRol(adminId)` que incluya información del rol
- [x] Actualizar `listarTodos()` para incluir información de roles con JOIN
- [x] **BONUS:** Método `obtenerPorUsuarioConRol(usuario)` - Obtener admin por usuario con rol
- [x] **BONUS:** Método `listarPorRol(rolId)` - Listar admins filtrados por rol
- [x] **BONUS:** Método `listarSinRol()` - Identificar admins sin rol asignado
- [x] **BONUS:** Método `obtenerEstadisticas()` - Estadísticas de distribución de roles

#### 2.4 Actualizar Modelo de Órdenes ✅
- [x] Modificar `src/models/index.js` - `OrdenModel`
- [x] Agregar campo `estado` con valor por defecto 'pendiente'
- [x] Agregar validación de estados permitidos
- [x] Agregar método `cambiarEstado(nuevoEstado)` - Método de instancia para cambiar estado
- [x] **BONUS:** Constante estática `ESTADOS_PERMITIDOS` - Array con todos los estados válidos
- [x] **BONUS:** Constante estática `TRANSICIONES_PERMITIDAS` - Mapa de transiciones válidas
- [x] **BONUS:** Método estático `esEstadoValido(estado)` - Validar si un estado existe
- [x] **BONUS:** Método estático `validarTransicion(estadoActual, nuevoEstado)` - Validar transición completa con mensajes de error
- [x] **BONUS:** Método estático `obtenerEstadosPermitidos(estadoActual)` - Obtener siguientes estados posibles
- [x] **BONUS:** Método estático `esEstadoFinal(estado)` - Verificar si es estado terminal
- [x] **BONUS:** Actualizado `validate()` para incluir validación de estado
- [x] **BONUS:** Actualizado `toDatabase()` para incluir campo estado

#### 2.5 Actualizar `src/models/index.js` ✅
- [x] Exportar `BitacoraModel` desde `./bitacora.js`
- [x] Exportar `RolModel` desde `./roles.js`
- [x] **BONUS:** Exportar `AdministradorModel` desde `./administradores.js` para mejor organización

**Tiempo estimado:** 4-5 horas  
**Estado:** ✅ COMPLETADA

---

### FASE 3: Utilidades y Middleware para Bitácora ✅
**Objetivo:** Crear utilidades centralizadas para el registro en bitácora  
**Estado:** ✅ COMPLETADA

#### 3.1 Crear Utilidad de Bitácora ✅
- [x] Crear `src/utils/bitacora.js`
- [x] Implementar funciones requeridas:
  - `registrarAccion(adminId, accion, descripcion)`: Registrar acción en bitácora con validaciones
  - `generarDescripcion(accion, datos)`: Generar descripción detallada con templates para todas las acciones
  - `obtenerAdminIdDeRequest(req)`: Extraer ID del admin desde múltiples ubicaciones posibles
- [x] Manejo de errores silencioso con try-catch y console.warn/error
- [x] **BONUS:** Función `registrarAccionConDatos(adminId, accion, datos)` - Combina generación y registro
- [x] **BONUS:** Función `registrarDesdeRequest(req, accion, descripcionODatos)` - Helper todo-en-uno
- [x] **BONUS:** Función `conRegistroBitacora(fn, options)` - Wrapper para ejecutar funciones con registro automático
- [x] **BONUS:** Templates de descripción para todas las 17 acciones de bitácora
- [x] **BONUS:** Validación de acciones contra ACCIONES_BITACORA con advertencias
- [x] **BONUS:** Soporte para acciones del sistema (adminId null)

#### 3.2 Crear Middleware de Bitácora ✅
- [x] Crear `src/middleware/bitacora.js`
- [x] Implementar `registrarEnBitacora` middleware que:
  - Captura información de la petición mediante interceptación de res.send/json
  - Extrae ID del administrador autenticado con obtenerAdminIdDeRequest
  - Registra la acción después de que se complete exitosamente (evento 'finish')
  - Maneja errores sin interrumpir el flujo (try-catch silencioso)
- [x] Implementar `bitacoraWrapper` para envolver controladores con registro automático
- [x] **BONUS:** Función `registrarConDatos(accion, extractorDatos)` - Middleware con extracción dinámica de datos del request
- [x] **BONUS:** Función `registrarSi(accion, condicion, extractorDatos)` - Registro condicional
- [x] **BONUS:** Función `guardarResultado(controlador)` - Guarda resultado en res.locals para uso posterior
- [x] **BONUS:** Función `extraerDeRespuesta(res, extractor)` - Helper para extraer datos de respuesta
- [x] **BONUS:** Función `crearBitacoraModule(modulo)` - Factory para crear middleware específico por módulo
- [x] **BONUS:** Soporte para funciones generadoras de descripción personalizadas
- [x] **BONUS:** Interceptación inteligente de respuestas (solo registra en éxito 2xx)

**Tiempo estimado:** 2-3 horas  
**Estado:** ✅ COMPLETADA

---

### FASE 4: Sistema de Permisos y Roles ✅
**Objetivo:** Implementar control de acceso basado en roles  
**Estado:** ✅ COMPLETADA

#### 4.1 Crear Utilidad de Permisos ✅
**COMPLETADO** - Archivo `src/utils/permissions.js` creado con 12 funciones:
- ✅ Crear `src/utils/permissions.js`
- ✅ Definir permisos por rol (importados desde constants.js)
- ✅ `verificarPermiso(rol, permiso)` - Verificación con wildcards (*, module.*)
- ✅ `obtenerPermisosDeRol(rol)` - Lista de permisos del rol
- ✅ `tienePermisosMultiples(rol, permisos)` - Verificación AND lógico
- ✅ `tieneAlgunPermiso(rol, permisos)` - Verificación OR lógico
- ✅ `esAdministrador(rol)` - Verificar si es admin
- ✅ `obtenerRolesDisponibles()` - Listar todos los roles
- ✅ `existeRol(rol)` - Validar existencia de rol
- ✅ `expandirPermisos(permisos)` - Expandir wildcards a permisos específicos
- ✅ `obtenerMapaPermisosExpandidos()` - Mapa completo de permisos por rol
- ✅ `compararRoles(rol1, rol2)` - Comparar permisos entre roles
- ✅ `obtenerDescripcionPermiso(permiso)` - Descripción legible del permiso
- ✅ `obtenerInfoRol(rol)` - Información completa del rol

#### 4.2 Crear Middleware de Roles ✅
**COMPLETADO** - Archivo `src/middleware/roles.js` creado con 9 funciones:
- ✅ Crear `src/middleware/roles.js`
- ✅ `requirePermission(permiso)` - Middleware para requerir permiso específico
  - ✅ Verifica autenticación (req.adminCredentials)
  - ✅ Obtiene rol del usuario con obtenerPorUsuarioConRol
  - ✅ Verifica permiso con verificarPermiso()
  - ✅ Retorna 403 Forbidden si no tiene permiso
  - ✅ Agrega req.adminId, req.adminRole, req.admin al request
- ✅ `requireRole(rolesPermitidos)` - Middleware para roles específicos (string o array)
- ✅ `isAdmin(req)` - Helper para verificar si es administrador
- ✅ `requireAdmin()` - Middleware shorthand para solo administradores
- ✅ `loadRole()` - Carga información de rol sin verificar permisos
- ✅ `requireAllPermissions(permisos)` - Verificación AND lógico (todos los permisos)
- ✅ `requireAnyPermission(permisos)` - Verificación OR lógico (al menos uno)
- ✅ `getRoleInfo(req)` - Helper para obtener info del rol actual
- ✅ `hasPermission(req, permiso)` - Helper para verificar permiso en controladores

#### 4.3 Actualizar Middleware de Autenticación ✅
**COMPLETADO** - Archivo `src/middleware/auth.js` actualizado:
- ✅ Modificar `src/middleware/auth.js`
- ✅ `requireAdminAuth` actualizado para cargar información de rol
  - ✅ Llama a `obtenerPorUsuarioConRol(usuario)` automáticamente
  - ✅ Manejo de errores sin interrumpir flujo (compatibilidad)
- ✅ `req.adminId` agregado al objeto request (ID del administrador)
- ✅ `req.admin` agregado al objeto request (objeto completo del admin)
- ✅ `req.adminRole` agregado al objeto request (nombre del rol o null)
- ✅ `req.adminPermissions` agregado al objeto request (array de permisos expandidos)
- ✅ Logging de advertencias cuando usuario no tiene rol asignado
- ✅ Compatibilidad con sistema anterior si falla carga de rol

**Tiempo estimado:** 3-4 horas

---

### FASE 5: Controladores de Bitácora y Roles ✅
**Objetivo:** Crear endpoints para gestionar bitácora y roles  
**Estado:** ✅ COMPLETADA

#### 5.1 Crear Controlador de Bitácora ✅
**COMPLETADO** - Archivo `src/controllers/bitacora.js` creado con 6 endpoints:
- ✅ Crear `src/controllers/bitacora.js`
- ✅ `listarBitacora(req, res)` - GET /api/bitacora
  - ✅ Lista paginada con paginación (page, limit)
  - ✅ Filtros opcionales: adminId, accion, fechaInicio, fechaFin
  - ✅ Usa búsqueda avanzada si hay filtros, listar simple si no
- ✅ `obtenerPorAdmin(req, res)` - GET /api/bitacora/admin/:adminId
  - ✅ Filtra registros por administrador específico
  - ✅ Validación de adminId numérico
  - ✅ Paginación incluida
- ✅ `obtenerPorAccion(req, res)` - GET /api/bitacora/accion/:accion
  - ✅ Filtra registros por tipo de acción
  - ✅ Validación de acción string
  - ✅ Paginación incluida
- ✅ `obtenerEstadisticas(req, res)` - GET /api/bitacora/stats
  - ✅ Estadísticas completas de bitácora
  - ✅ Sin paginación (datos agregados)
- ✅ `exportarBitacora(req, res)` - GET /api/bitacora/export
  - ✅ Exportación en formato CSV o JSON (query param: formato)
  - ✅ Filtros opcionales: adminId, accion, fechaInicio, fechaFin
  - ✅ Límite de exportación: 1000 por defecto, máximo 5000
  - ✅ Headers de descarga automática
  - ✅ Función convertirACSV() con escape de caracteres especiales
- ✅ **BONUS:** `obtenerPorFecha(req, res)` - GET /api/bitacora/fecha
  - ✅ Filtra por rango de fechas (fechaInicio, fechaFin)
  - ✅ Validación de formato ISO 8601
  - ✅ Validación de orden de fechas
- ✅ Validaciones completas en todos los endpoints
- ✅ Manejo de errores robusto con try-catch y next(error)
- ✅ Límites de paginación respetados (MAX_LIMIT)

#### 5.2 Crear Controlador de Roles ✅
**COMPLETADO** - Archivo `src/controllers/roles.js` creado con 7 endpoints:
- ✅ Crear `src/controllers/roles.js`
- ✅ `listarRoles(req, res)` - GET /api/roles
  - ✅ Lista todos los roles disponibles
  - ✅ Query param opcional: include_permisos=true para incluir permisos
  - ✅ Enriquece con permisos expandidos si se solicita
- ✅ `obtenerRol(req, res)` - GET /api/roles/:id
  - ✅ Obtiene rol específico por ID
  - ✅ Validación de ID numérico
  - ✅ Incluye información completa: permisos, permisos expandidos, total de admins
  - ✅ Descripciones legibles de permisos
- ✅ `asignarRolAAdmin(req, res)` - PUT /api/administradores/:id/rol
  - ✅ Asigna rol a administrador
  - ✅ Validaciones: admin existe, rol existe, rol_id válido
  - ✅ Registra acción en bitácora (ASIGNAR_ROL)
  - ✅ Retorna información del cambio (rol anterior → rol nuevo)
- ✅ `obtenerPermisosDeRol(req, res)` - GET /api/roles/:id/permisos
  - ✅ Obtiene permisos de un rol específico
  - ✅ Query param opcional: expandir=true para expandir wildcards
  - ✅ Incluye descripciones de permisos si se expanden
- ✅ **BONUS:** `obtenerEstadisticasRoles(req, res)` - GET /api/roles/stats
  - ✅ Estadísticas completas de roles y distribución
- ✅ **BONUS:** `obtenerAdministradoresPorRol(req, res)` - GET /api/roles/:id/administradores
  - ✅ Lista administradores con un rol específico
- ✅ **BONUS:** `obtenerRolPorNombre(req, res)` - GET /api/roles/nombre/:nombre
  - ✅ Busca rol por nombre en lugar de ID
- ✅ Validaciones completas en todos los endpoints
- ✅ Manejo de errores robusto con try-catch
- ✅ Integración con bitácora para asignación de roles

**Tiempo estimado:** 3-4 horas

---

### FASE 6: Actualizar Controladores Existentes ✅
**Objetivo:** Integrar bitácora y roles en controladores existentes  
**Estado:** ✅ COMPLETADA

#### 6.1 Actualizar Controlador de Productos ✅
- [x] Modificar `src/controllers/productos.js`
- [x] Agregar registro en bitácora para:
  - [x] `createProducto`: Acción 'CREAR_PRODUCTO'
    - Incluye ID, nombre, precio, stock y categorías asignadas
  - [x] `updateProducto`: Acción 'EDITAR_PRODUCTO'
    - Incluye lista detallada de cambios (nombre, precio, stock, descripción, categorías)
    - Muestra valores anteriores → valores nuevos
  - [x] `deleteProducto`: Acción 'ELIMINAR_PRODUCTO'
    - Incluye toda la información del producto eliminado
  - [x] `updateProductStock`: Acción 'ACTUALIZAR_STOCK'
    - Incluye nombre, stock anterior, stock nuevo y operación realizada (set/add/subtract)
- [x] Incluir información relevante en descripción (ID producto, nombre, cambios)
- [x] Manejo de errores silencioso (no interrumpe operación si falla bitácora)
- [x] Extracción de adminId desde req.adminId o req.admin.id

#### 6.2 Actualizar Controlador de Categorías ✅
- [x] Modificar `src/controllers/categorias.js`
- [x] Agregar registro en bitácora para:
  - [x] `createCategoria`: Acción 'CREAR_CATEGORIA'
    - Incluye ID y nombre de la categoría creada
  - [x] `updateCategoria`: Acción 'EDITAR_CATEGORIA'
    - Incluye lista detallada de cambios (nombre, descripción)
    - Muestra valores anteriores → valores nuevos
  - [x] `deleteCategoria`: Acción 'ELIMINAR_CATEGORIA'
    - Incluye ID y nombre de la categoría eliminada
  - [x] `assignCategoriasToProducto`: Acción 'ASIGNAR_CATEGORIAS'
    - Incluye ID y nombre del producto
    - Lista de IDs de categorías asignadas
    - Total de categorías asignadas
- [x] Manejo de errores silencioso (no interrumpe operación si falla bitácora)
- [x] Extracción de adminId desde req.adminId o req.admin.id

#### 6.3 Actualizar Controlador de Órdenes ✅
- [x] Modificar `src/controllers/ordenes.js`
- [x] Agregar campo `estado` en todas las operaciones
  - [x] getAllOrdenes con include_details
  - [x] getOrdenById con include_details
  - [x] createOrden al retornar orden completa
- [x] Implementar `cambiarEstadoOrden(req, res)`: PUT /api/ordenes/:id/estado
  - [x] Validación de ID y nuevoEstado
  - [x] Verificación de orden existente
  - [x] Validación de estado válido usando OrdenModel.esEstadoValido()
  - [x] Validación de transición usando OrdenModel.validarTransicion()
  - [x] Actualización de estado en base de datos
  - [x] Retorna estados permitidos siguientes
  - [x] Información completa del cambio (estadoAnterior → estadoNuevo)
- [x] Validar transiciones de estado permitidas
  - [x] Usa OrdenModel.validarTransicion() del modelo
  - [x] Mensajes de error descriptivos
  - [x] Retorna estados permitidos en caso de error
- [x] Agregar registro en bitácora para:
  - [x] `updateOrden`: Acción 'EDITAR_ORDEN'
    - Incluye lista detallada de cambios (cliente, teléfono, dirección)
    - Muestra valores anteriores → valores nuevos
  - [x] `cancelOrden`: Acción 'CANCELAR_ORDEN'
    - Incluye cliente, total y cantidad de productos restaurados
    - Confirma restauración de stock
  - [x] `cambiarEstadoOrden`: Acción 'CAMBIAR_ESTADO_ORDEN'
    - Incluye estado anterior → estado nuevo
    - Incluye cliente y total de la orden
- [x] Incluir estado anterior y nuevo en descripción
- [x] Manejo de errores silencioso (no interrumpe operación si falla bitácora)
- [x] Extracción de adminId desde req.adminId o req.admin.id

#### 6.4 Actualizar Controlador de Administradores ✅
- [x] Modificar `src/controllers/administradores.js`
- [x] Agregar registro en bitácora para:
  - [x] `verificarCredenciales`: Acción 'LOGIN'
    - Registra inicio de sesión exitoso con usuario
    - Se ejecuta después de validación exitosa
  - [x] `cambiarPassword`: Acción 'CAMBIAR_PASSWORD'
    - Registra cambio de contraseña con usuario
    - Se ejecuta después de actualización exitosa
- [x] Agregar endpoint para asignar rol
  - [x] Nuevo método `asignarRol(req, res)` - PUT /api/administradores/:id/rol
  - [x] Validación de ID de administrador y rol_id
  - [x] Verificación de existencia de administrador y rol
  - [x] Obtiene rol anterior antes del cambio
  - [x] Asigna nuevo rol usando AdministradorModel.asignarRol()
  - [x] Registra en bitácora con ASIGNAR_ROL
  - [x] Retorna información del cambio (rolAnterior → rolNuevo)
  - [x] Incluye información completa del admin actualizado con rol
- [x] Incluir información de rol en respuestas
  - [x] `obtenerPerfil`: Actualizado para usar obtenerPorUsuarioConRol()
  - [x] Incluye información de rol en respuesta del perfil
  - [x] `asignarRol`: Retorna admin completo con información de rol
- [x] Manejo de errores silencioso (no interrumpe operación si falla bitácora)
- [x] Extracción de adminId desde múltiples ubicaciones posibles

#### 6.5 Actualizar Controlador de Uploads ✅
- [x] Modificar `src/controllers/uploads.js`
- [x] Agregar registro en bitácora para:
  - [x] `subirImagen`: Acción 'SUBIR_IMAGEN'
    - Incluye nombre del archivo original
    - Incluye nombre generado del archivo
    - Incluye tamaño del archivo en MB
    - Incluye URL pública completa de Supabase Storage
    - Se ejecuta después de subida exitosa
- [x] Incluir nombre del archivo y URL en descripción
- [x] Manejo de errores silencioso (no interrumpe operación si falla bitácora)
- [x] Extracción de adminId desde múltiples ubicaciones (req.adminId, req.admin?.id, authResult.data.id)

**Tiempo estimado:** 4-5 horas

---

### FASE 7: Rutas y Protección con Roles
**Objetivo:** Crear nuevas rutas y aplicar control de acceso basado en roles

#### 7.1 Crear Rutas de Bitácora ✅
- [x] Crear `src/routes/bitacora.js`
- [x] Configurar todas las rutas de bitácora (6 rutas)
  - [x] GET / - Listar bitácora con paginación y filtros
  - [x] GET /stats - Estadísticas de bitácora
  - [x] GET /export - Exportar en CSV o JSON
  - [x] GET /fecha - Filtrar por rango de fechas
  - [x] GET /admin/:adminId - Registros de administrador específico
  - [x] GET /accion/:accion - Registros por tipo de acción
- [x] Aplicar protección: Solo administradores y gerentes pueden ver bitácora
  - [x] requireRole(['administrador', 'gerente']) en rutas de consulta
- [x] Exportar estadísticas solo para administradores
  - [x] requireAdmin() en /stats y /export

#### 7.2 Crear Rutas de Roles ✅
- [x] Crear `src/routes/roles.js`
- [x] Configurar todas las rutas de roles (6 rutas)
  - [x] GET / - Listar todos los roles
  - [x] GET /stats - Estadísticas de roles
  - [x] GET /nombre/:nombre - Obtener rol por nombre
  - [x] GET /:id - Obtener rol específico por ID
  - [x] GET /:id/permisos - Obtener permisos de un rol
  - [x] GET /:id/administradores - Listar administradores por rol
- [x] Aplicar protección: Solo administradores pueden gestionar roles
  - [x] requireAdmin() en todas las rutas
- [x] Nota: asignarRolAAdmin está en rutas de administradores (PUT /api/administradores/:id/rol)

#### 7.3 Actualizar Rutas de Productos ✅
- [x] Modificar `src/routes/productos.js`
- [x] Aplicar control de roles:
  - [x] Crear/Editar/Eliminar: Administrador, Gerente
    - [x] POST / - Crear producto (requireRole(['administrador', 'gerente']))
    - [x] PUT /:id - Actualizar producto (requireRole(['administrador', 'gerente']))
    - [x] PATCH /:id/stock - Actualizar stock (requireRole(['administrador', 'gerente']))
    - [x] DELETE /:id - Eliminar producto (requireRole(['administrador', 'gerente']))
  - [x] Leer: Todos (público)
    - [x] GET / - Listar productos (sin autenticación)
    - [x] GET /:id - Obtener producto (sin autenticación)
    - [x] GET /search - Buscar productos (sin autenticación)
    - [x] GET /search/global - Búsqueda global (sin autenticación)
    - [x] GET /search/advanced - Búsqueda avanzada (sin autenticación)
    - [x] POST /check-stock - Verificar stock (sin autenticación)
- [x] Agregar middleware de bitácora en rutas protegidas
  - [x] logAdminAction en todas las rutas de escritura
  - [x] Bitácora registrada en controlador (CREAR_PRODUCTO, EDITAR_PRODUCTO, ACTUALIZAR_STOCK, ELIMINAR_PRODUCTO)

#### 7.4 Actualizar Rutas de Categorías ✅
- [x] Modificar `src/routes/categorias.js`
- [x] Aplicar control de roles:
  - [x] Crear/Editar/Eliminar: Administrador, Gerente
    - [x] POST / - Crear categoría (requireRole(['administrador', 'gerente']))
    - [x] PUT /:id - Actualizar categoría (requireRole(['administrador', 'gerente']))
    - [x] DELETE /:id - Eliminar categoría (requireRole(['administrador', 'gerente']))
    - [x] POST /productos/:id/assign - Asignar categorías a producto (requireRole(['administrador', 'gerente']))
    - [x] DELETE /:id/productos/:productoId - Remover producto de categoría (requireRole(['administrador', 'gerente']))
  - [x] Leer: Todos (público)
    - [x] GET / - Listar categorías (sin autenticación)
    - [x] GET /:id - Obtener categoría por ID (sin autenticación)
    - [x] GET /:id/productos - Obtener productos por categoría (sin autenticación)
- [x] Agregar middleware de bitácora en rutas protegidas
  - [x] logAdminAction en todas las rutas de escritura
  - [x] Bitácora registrada en controlador (CREAR_CATEGORIA, EDITAR_CATEGORIA, ELIMINAR_CATEGORIA, ASIGNAR_CATEGORIAS)
- [x] Limpieza de código: eliminadas rutas duplicadas del archivo original

#### 7.5 Actualizar Rutas de Órdenes ✅
- [x] Modificar `src/routes/ordenes.js`
- [x] Agregar ruta para cambiar estado: PUT /api/ordenes/:id/estado
  - [x] Implementada con requireRole(['administrador', 'gerente'])
  - [x] Bitácora: CAMBIAR_ESTADO_ORDEN (registrada en controlador)
- [x] Aplicar control de roles:
  - [x] Ver todas las órdenes: Administrador, Gerente, Asesor de Ventas
    - [x] GET / - Listar órdenes (requireRole(['administrador', 'gerente', 'asesor de ventas']))
    - [x] GET /:id - Obtener orden por ID (requireRole(['administrador', 'gerente', 'asesor de ventas']))
    - [x] GET /:id/detalle - Detalle completo (requireRole(['administrador', 'gerente', 'asesor de ventas']))
    - [x] GET /stats - Estadísticas (requireRole(['administrador', 'gerente', 'asesor de ventas']))
    - [x] POST / - Crear orden (requireRole(['administrador', 'gerente', 'asesor de ventas']))
  - [x] Cambiar estado: Administrador, Gerente
    - [x] PUT /:id/estado - Cambiar estado (requireRole(['administrador', 'gerente']))
  - [x] Editar: Administrador, Gerente
    - [x] PUT /:id - Actualizar orden (requireRole(['administrador', 'gerente']))
  - [x] Cancelar: Solo Administrador
    - [x] DELETE /:id - Cancelar orden (requireAdmin())
- [x] Agregar middleware de bitácora
  - [x] logAdminAction en todas las rutas de escritura
  - [x] Bitácora registrada en controlador (EDITAR_ORDEN, CANCELAR_ORDEN, CAMBIAR_ESTADO_ORDEN)

#### 7.6 Actualizar Rutas de Administradores ✅
- [x] Modificar `src/routes/administradores.js`
- [x] Agregar ruta para asignar rol: PUT /api/auth/:id/rol
  - [x] Importado `requireAdmin` desde middleware de roles
  - [x] Protección: requireAdminAuth → requireAdmin() → logAdminAction
  - [x] Bit controlador: administradorController.asignarRol
  - [x] Bitácora: ASIGNAR_ROL (registrada en controlador)
- [x] Solo administradores pueden ver lista de admins y asignar roles
  - [x] GET /admins: Agregado requireAdmin() middleware
  - [x] PUT /:id/rol: Solo administradores con requireAdmin()
- [x] Actualizada documentación del endpoint raíz con nueva ruta

#### 7.7 Actualizar `server.js` ✅
- [x] Importar nuevas rutas (bitacora, roles)
  - [x] Importado `bitacoraRoutes` desde './src/routes/bitacora.js'
  - [x] Importado `rolesRoutes` desde './src/routes/roles.js'
- [x] Montar rutas: `/api/bitacora`, `/api/roles`
  - [x] app.use('/api/bitacora', bitacoraRoutes)
  - [x] app.use('/api/roles', rolesRoutes)
- [x] Actualizar documentación de endpoints en ruta raíz
  - [x] Actualizada fase actual a 'Sistema de Bitácora, Roles y Estados de Órdenes'
  - [x] Agregadas nuevas features al array de características

**Tiempo estimado:** 3-4 horas

---

### FASE 8: Validaciones y Helpers ✅
**Objetivo:** Agregar validaciones específicas para nuevas funcionalidades  
**Estado:** ✅ COMPLETADA

#### 8.1 Actualizar Validadores ✅
- [x] Modificar `src/utils/validators.js`
- [x] Agregar `validateEstadoOrden(estado)`: Validar estados de orden
  - Valida que el estado sea string y exista en ORDER_STATUS
  - Usa OrdenModel.esEstadoValido() para verificación
  - Retorna error con lista de estados permitidos si no es válido
- [x] Agregar `validateTransicionEstado(estadoActual, estadoNuevo)`: Validar transiciones válidas
  - Valida que ambos estados existan y sean strings
  - Normaliza estados a lowercase
  - Usa OrdenModel.validarTransicion() para verificar transición
  - Retorna error detallado con estados permitidos y mensaje descriptivo
- [x] Agregar `validateRolId(rolId)`: Validar que el rol existe
  - Valida que rolId sea número entero positivo
  - Verifica existencia en base de datos con RolModel.existe()
  - Función asíncrona (retorna Promise)
  - Manejo de errores de base de datos
- [x] Agregar `validateAccionBitacora(accion)`: Validar acciones de bitácora
  - Valida que la acción sea string
  - Normaliza a uppercase para comparación
  - Verifica contra ACCIONES_BITACORA constante
  - Retorna error con lista de acciones permitidas si no es válida

#### 8.2 Crear Helpers de Estado de Órdenes ✅
- [x] Crear `src/utils/ordenEstados.js`
- [x] Definir flujo de estados permitidos:
  ```javascript
  TRANSICIONES_PERMITIDAS = {
    'pendiente': ['pagado', 'cancelado'],
    'pagado': ['enviado', 'cancelado'],
    'enviado': ['completado'],
    'completado': [],
    'cancelado': []
  }
  ```
- [x] Implementar `puedeTransicionar(estadoActual, estadoNuevo)`
  - Normaliza estados a lowercase
  - Valida que ambos estados existan y sean válidos
  - Verifica si la transición está en TRANSICIONES_PERMITIDAS
  - Retorna boolean
- [x] Implementar `obtenerSiguientesEstadosPermitidos(estadoActual)`
  - Normaliza estado a lowercase
  - Valida que el estado actual sea válido
  - Retorna array de estados permitidos desde ese estado
  - Retorna array vacío si el estado no es válido
- [x] **BONUS:** Implementar `esEstadoFinal(estado)`
  - Verifica si un estado no permite más transiciones
  - Útil para validar si una orden puede ser modificada
- [x] **BONUS:** Implementar `obtenerInfoEstado(estado)`
  - Retorna información completa del estado
  - Incluye: validez, descripción, siguientes estados, si es final
  - Descripciones amigables para UI
- [x] **BONUS:** Implementar `validarYObtenerMensaje(estadoActual, estadoNuevo)`
  - Validación completa con mensajes descriptivos
  - Retorna objeto con: valida (boolean), mensaje, estadosPermitidos
  - Maneja casos especiales (estados finales, estados inválidos)
- [x] **BONUS:** Implementar `obtenerFlujoCompleto()`
  - Retorna estructura completa del flujo de estados
  - Incluye: estados, transiciones, descripciones, estados finales, estado inicial
  - Útil para documentación y construcción de UI
- [x] **BONUS:** Implementar `obtenerCaminoEntreEstados(estadoOrigen, estadoDestino)`
  - Algoritmo BFS para encontrar camino más corto entre estados
  - Retorna array con la secuencia de estados o null si no hay camino
  - Útil para validar si es posible llegar de un estado a otro

**Tiempo estimado:** 2 horas

---

### FASE 9: Testing y Validación
**Objetivo:** Probar todas las nuevas funcionalidades

#### 9.1 Testing de Bitácora
- [ ] Crear registros de prueba en bitácora
- [ ] Verificar que todas las acciones se registran correctamente
- [ ] Probar filtros (por admin, por acción, por fecha)
- [ ] Verificar que la descripción contiene información útil
- [ ] Probar que no interrumpe operaciones si falla

#### 9.2 Testing de Roles y Permisos
- [ ] Crear administradores de prueba con diferentes roles
- [ ] Verificar permisos de cada rol
- [ ] Probar acceso denegado (403) cuando no tiene permisos
- [ ] Verificar que administrador tiene acceso total

#### 9.3 Testing de Estados de Órdenes
- [ ] Crear órdenes de prueba
- [ ] Probar cambios de estado válidos
- [ ] Probar cambios de estado inválidos (deben fallar)
- [ ] Verificar que se registra en bitácora
- [ ] Probar flujo completo: pendiente → pagado → enviado → completado

#### 9.4 Testing de Integración
- [ ] Probar flujo completo con bitácora activa
- [ ] Verificar rendimiento con bitácora (no debe afectar significativamente)
- [ ] Probar concurrencia de roles
- [ ] Verificar que las transacciones se completan correctamente

#### 9.5 Testing de Endpoints
- [ ] Probar todos los endpoints nuevos con Postman/Insomnia
- [ ] Verificar respuestas correctas
- [ ] Verificar manejo de errores
- [ ] Documentar ejemplos de peticiones

**Tiempo estimado:** 4-5 horas

---

### FASE 10: Documentación y Despliegue
**Objetivo:** Documentar cambios y preparar para producción

#### 10.1 Actualizar Documentación
- [ ] Actualizar `TECHNICAL_MANUAL.md` con nuevas funcionalidades
- [ ] Documentar todas las nuevas constantes
- [ ] Documentar estructura de bitácora
- [ ] Documentar sistema de roles y permisos
- [ ] Documentar flujo de estados de órdenes
- [ ] Crear diagramas de flujo si es necesario

#### 10.2 Crear Documentación de API
- [ ] Documentar endpoints de bitácora con ejemplos
- [ ] Documentar endpoints de roles con ejemplos
- [ ] Documentar cambio de estado de órdenes
- [ ] Actualizar colección de Postman/Insomnia

#### 10.3 Scripts de Migración
- [ ] Crear script para insertar roles iniciales
- [ ] Crear script para asignar rol por defecto a admins existentes
- [ ] Crear script para actualizar órdenes existentes con estado 'pendiente'

#### 10.4 Configuración de Producción
- [ ] Verificar índices en base de datos (bitacora.admin_id, bitacora.accion, bitacora.fecha)
- [ ] Configurar limpieza automática de bitácora antigua (opcional)
- [ ] Revisar permisos de base de datos

**Tiempo estimado:** 3-4 horas

---

## 🔧 Detalles de Implementación

### 1. Sistema de Bitácora

#### Acciones Estándar para Bitácora

```javascript
// src/utils/constants.js
export const ACCIONES_BITACORA = {
  // Autenticación
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CAMBIAR_PASSWORD: 'CAMBIAR_PASSWORD',
  
  // Productos
  CREAR_PRODUCTO: 'CREAR_PRODUCTO',
  EDITAR_PRODUCTO: 'EDITAR_PRODUCTO',
  ELIMINAR_PRODUCTO: 'ELIMINAR_PRODUCTO',
  ACTUALIZAR_STOCK: 'ACTUALIZAR_STOCK',
  
  // Categorías
  CREAR_CATEGORIA: 'CREAR_CATEGORIA',
  EDITAR_CATEGORIA: 'EDITAR_CATEGORIA',
  ELIMINAR_CATEGORIA: 'ELIMINAR_CATEGORIA',
  ASIGNAR_CATEGORIAS: 'ASIGNAR_CATEGORIAS',
  
  // Órdenes
  CREAR_ORDEN: 'CREAR_ORDEN',
  EDITAR_ORDEN: 'EDITAR_ORDEN',
  CANCELAR_ORDEN: 'CANCELAR_ORDEN',
  CAMBIAR_ESTADO_ORDEN: 'CAMBIAR_ESTADO_ORDEN',
  
  // Administradores
  CREAR_ADMIN: 'CREAR_ADMIN',
  ASIGNAR_ROL: 'ASIGNAR_ROL',
  
  // Uploads
  SUBIR_IMAGEN: 'SUBIR_IMAGEN',
  ELIMINAR_IMAGEN: 'ELIMINAR_IMAGEN'
};
```

#### Ejemplo de Registro en Bitácora

```javascript
// En un controlador después de una acción exitosa
import { registrarAccion } from '../utils/bitacora.js';
import { ACCIONES_BITACORA } from '../utils/constants.js';

// Después de crear un producto
const nuevoProducto = await create(TABLES.PRODUCTOS, productoData);

await registrarAccion(
  req.adminId, // ID del admin autenticado
  ACCIONES_BITACORA.CREAR_PRODUCTO,
  `Producto creado: ID=${nuevoProducto.id}, Nombre="${nuevoProducto.nombre}", Precio=${nuevoProducto.precio}`
);
```

#### Estructura de Descripción

Las descripciones deben seguir este formato estándar:

```
Acción realizada: [Detalles clave]
- Campo1: valor1
- Campo2: valor2
- Campo afectado: valor anterior → valor nuevo
```

Ejemplos:
```
LOGIN: Usuario administrador inició sesión desde IP 192.168.1.100

EDITAR_PRODUCTO: Producto ID=5 actualizado
- Nombre: "Proteína X" → "Proteína X Premium"
- Precio: 45.00 → 52.00
- Stock: 100 → 150

CAMBIAR_ESTADO_ORDEN: Orden ID=123 cambió de estado
- Estado anterior: pendiente
- Estado nuevo: pagado
- Cliente: Juan Pérez
- Total: $250.00

CANCELAR_ORDEN: Orden ID=456 cancelada
- Cliente: María García
- Total: $180.00
- Razón: Solicitud del cliente
- Productos restaurados al stock
```

### 2. Sistema de Roles

#### Estructura de Permisos

```javascript
// src/utils/permissions.js
export const PERMISOS = {
  // Productos
  PRODUCTOS_LEER: 'productos.leer',
  PRODUCTOS_CREAR: 'productos.crear',
  PRODUCTOS_EDITAR: 'productos.editar',
  PRODUCTOS_ELIMINAR: 'productos.eliminar',
  
  // Categorías
  CATEGORIAS_LEER: 'categorias.leer',
  CATEGORIAS_CREAR: 'categorias.crear',
  CATEGORIAS_EDITAR: 'categorias.editar',
  CATEGORIAS_ELIMINAR: 'categorias.eliminar',
  
  // Órdenes
  ORDENES_LEER: 'ordenes.leer',
  ORDENES_CREAR: 'ordenes.crear',
  ORDENES_EDITAR: 'ordenes.editar',
  ORDENES_CANCELAR: 'ordenes.cancelar',
  ORDENES_CAMBIAR_ESTADO: 'ordenes.cambiar_estado',
  
  // Bitácora
  BITACORA_LEER: 'bitacora.leer',
  BITACORA_EXPORTAR: 'bitacora.exportar',
  
  // Administradores
  ADMINS_LEER: 'admins.leer',
  ADMINS_GESTIONAR: 'admins.gestionar',
  
  // Roles
  ROLES_LEER: 'roles.leer',
  ROLES_ASIGNAR: 'roles.asignar',
  
  // Uploads
  UPLOADS_SUBIR: 'uploads.subir',
  UPLOADS_ELIMINAR: 'uploads.eliminar'
};

export const PERMISOS_POR_ROL = {
  'administrador': ['*'], // Wildcard = todos los permisos
  
  'gerente': [
    PERMISOS.PRODUCTOS_LEER,
    PERMISOS.PRODUCTOS_CREAR,
    PERMISOS.PRODUCTOS_EDITAR,
    PERMISOS.PRODUCTOS_ELIMINAR,
    PERMISOS.CATEGORIAS_LEER,
    PERMISOS.CATEGORIAS_CREAR,
    PERMISOS.CATEGORIAS_EDITAR,
    PERMISOS.CATEGORIAS_ELIMINAR,
    PERMISOS.ORDENES_LEER,
    PERMISOS.ORDENES_EDITAR,
    PERMISOS.ORDENES_CAMBIAR_ESTADO,
    PERMISOS.BITACORA_LEER,
    PERMISOS.UPLOADS_SUBIR
  ],
  
  'asesor de ventas': [
    PERMISOS.PRODUCTOS_LEER,
    PERMISOS.ORDENES_LEER,
    PERMISOS.ORDENES_CREAR,
    PERMISOS.CATEGORIAS_LEER
  ]
};
```

#### Uso de Middleware de Permisos

```javascript
// En las rutas
import { requirePermission } from '../middleware/roles.js';
import { PERMISOS } from '../utils/permissions.js';

// Solo usuarios con permiso de eliminar productos pueden acceder
router.delete('/:id', 
  requireAdminAuth,
  requirePermission(PERMISOS.PRODUCTOS_ELIMINAR),
  logAdminAction,
  deleteProducto
);

// Múltiples roles permitidos
router.put('/:id', 
  requireAdminAuth,
  requireRole(['administrador', 'gerente']),
  logAdminAction,
  updateProducto
);
```

### 3. Estados de Órdenes

#### Flujo de Estados

```
[Orden creada]
      ↓
  pendiente ──────────→ cancelado
      ↓                     ↑
    pagado ────────────────┘
      ↓
   enviado
      ↓
  completado
```

#### Transiciones Permitidas

```javascript
// src/utils/ordenEstados.js
export const TRANSICIONES_ESTADOS = {
  'pendiente': {
    permitidos: ['pagado', 'cancelado'],
    requierePermiso: 'ordenes.cambiar_estado'
  },
  'pagado': {
    permitidos: ['enviado', 'cancelado'],
    requierePermiso: 'ordenes.cambiar_estado'
  },
  'enviado': {
    permitidos: ['completado'],
    requierePermiso: 'ordenes.cambiar_estado'
  },
  'completado': {
    permitidos: [],
    requierePermiso: null // Estado final
  },
  'cancelado': {
    permitidos: [],
    requierePermiso: null // Estado final
  }
};
```

#### Validación de Transiciones

```javascript
// Ejemplo en el controlador
export const cambiarEstadoOrden = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nuevoEstado } = req.body;
    
    // Obtener orden actual
    const orden = await getById(TABLES.ORDENES, id);
    if (!orden) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Orden no encontrada');
    }
    
    // Validar transición
    const transicion = TRANSICIONES_ESTADOS[orden.estado];
    if (!transicion.permitidos.includes(nuevoEstado)) {
      return sendError(
        res, 
        HTTP_STATUS.BAD_REQUEST, 
        `No se puede cambiar de estado "${orden.estado}" a "${nuevoEstado}". Estados permitidos: ${transicion.permitidos.join(', ')}`
      );
    }
    
    // Actualizar estado
    const ordenActualizada = await update(TABLES.ORDENES, id, { estado: nuevoEstado });
    
    // Registrar en bitácora
    await registrarAccion(
      req.adminId,
      ACCIONES_BITACORA.CAMBIAR_ESTADO_ORDEN,
      `Orden ID=${id} cambió de estado: ${orden.estado} → ${nuevoEstado}. Cliente: ${orden.cliente}, Total: ${orden.total}`
    );
    
    sendResponse(res, HTTP_STATUS.OK, ordenActualizada, 'Estado actualizado correctamente');
  } catch (error) {
    next(error);
  }
};
```

---

## ✅ Guía de Buenas Prácticas

### Registro en Bitácora

1. **Siempre registrar el admin_id**: Permite trazabilidad de quién hizo qué
2. **Usar acciones estandarizadas**: No inventar nuevas acciones sin agregarlas a las constantes
3. **Descripciones detalladas pero concisas**: Incluir datos clave sin exceso de información
4. **No interrumpir el flujo principal**: Si falla el registro en bitácora, no debe fallar la operación principal
5. **Usar transacciones cuando sea crítico**: Para operaciones sensibles, incluir el registro en la transacción
6. **Registrar tanto éxitos como intentos fallidos**: Útil para detectar intentos de acceso no autorizado

### Ejemplo de Registro con Manejo de Errores

```javascript
// Operación principal
const producto = await deleteRecord(TABLES.PRODUCTOS, id);

// Registro en bitácora sin interrumpir flujo
try {
  await registrarAccion(
    req.adminId,
    ACCIONES_BITACORA.ELIMINAR_PRODUCTO,
    `Producto eliminado: ID=${id}, Nombre="${producto.nombre}"`
  );
} catch (bitacoraError) {
  // Log del error pero no interrumpir
  console.error('Error al registrar en bitácora:', bitacoraError);
}
```

### Gestión de Roles

1. **Principio de menor privilegio**: Asignar solo los permisos necesarios
2. **No hardcodear roles**: Siempre usar constantes y verificaciones dinámicas
3. **Validar rol en backend**: Nunca confiar solo en validación de frontend
4. **Cachear permisos**: Los permisos de roles no cambian frecuentemente, pueden cachearse
5. **Auditar cambios de roles**: Siempre registrar en bitácora cuando se asigna/cambia un rol

### Estados de Órdenes

1. **Validar transiciones**: No permitir saltos arbitrarios entre estados
2. **Usar transacciones**: Cambios de estado pueden implicar múltiples operaciones (ej: cancelar = restaurar stock)
3. **Notificaciones**: Considerar notificar al cliente cuando cambia el estado
4. **Registrar razones**: Especialmente para cancelaciones, registrar el motivo
5. **Estados finales**: `completado` y `cancelado` no deben permitir cambios posteriores

---

## 🧪 Testing y Validación

### Checklist de Testing

#### Bitácora
- [ ] Se registran todas las acciones administrativas
- [ ] Descripciones contienen información útil y completa
- [ ] Filtros funcionan correctamente (por admin, acción, fecha)
- [ ] Paginación funciona en listados de bitácora
- [ ] Estadísticas se calculan correctamente
- [ ] Exportación genera archivos válidos
- [ ] No se interrumpe flujo si falla registro

#### Roles y Permisos
- [ ] Administrador tiene acceso a todo
- [ ] Gerente tiene accesos apropiados
- [ ] Asesor de ventas solo puede leer y crear órdenes
- [ ] Permisos se verifican en backend
- [ ] Respuestas 403 Forbidden para acceso denegado
- [ ] Información de rol se incluye en respuestas de auth
- [ ] Asignación de rol se registra en bitácora

#### Estados de Órdenes
- [ ] Estado por defecto es 'pendiente'
- [ ] Transiciones válidas funcionan
- [ ] Transiciones inválidas son rechazadas
- [ ] Cambios de estado se registran en bitácora
- [ ] Estados finales no permiten cambios
- [ ] Cancelación restaura stock correctamente

#### Integración
- [ ] Flujo completo funciona sin errores
- [ ] Rendimiento aceptable con bitácora activa
- [ ] Múltiples usuarios con diferentes roles funcionan concurrentemente
- [ ] Transacciones completas sin corrupción de datos

---

## 📝 Ejemplos de Peticiones HTTP

### Bitácora

#### Listar bitácora (paginado)
```http
GET /api/bitacora?page=1&limit=20
Headers:
  x-admin-user: admin_usuario
  x-admin-password: admin_password

Response:
{
  "success": true,
  "data": {
    "registros": [
      {
        "id": 1,
        "admin_id": 1,
        "accion": "CREAR_PRODUCTO",
        "descripcion": "Producto creado: ID=5, Nombre=\"Proteína Whey\", Precio=45.00",
        "fecha": "2025-09-30T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

#### Filtrar por acción
```http
GET /api/bitacora?accion=LOGIN&page=1&limit=10
```

#### Estadísticas de bitácora
```http
GET /api/bitacora/stats
Headers:
  x-admin-user: admin_usuario
  x-admin-password: admin_password

Response:
{
  "success": true,
  "data": {
    "totalAcciones": 1543,
    "accionesPorTipo": {
      "LOGIN": 234,
      "CREAR_PRODUCTO": 45,
      "EDITAR_PRODUCTO": 89,
      "ELIMINAR_PRODUCTO": 12
    },
    "accionesPorAdmin": {
      "admin1": 890,
      "gerente1": 453
    },
    "accionesHoy": 34,
    "accionesEstaSemana": 189
  }
}
```

### Roles

#### Listar roles disponibles
```http
GET /api/roles

Response:
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": 1,
        "nombre": "administrador",
        "descripcion": "Acceso total al sistema"
      },
      {
        "id": 2,
        "nombre": "gerente",
        "descripcion": "Gestión de productos, categorías y órdenes"
      },
      {
        "id": 3,
        "nombre": "asesor de ventas",
        "descripcion": "Acceso limitado a inventario y órdenes"
      }
    ]
  }
}
```

#### Asignar rol a administrador
```http
PUT /api/administradores/2/rol
Headers:
  x-admin-user: admin_usuario
  x-admin-password: admin_password
Content-Type: application/json

Body:
{
  "rol_id": 2
}

Response:
{
  "success": true,
  "data": {
    "admin": {
      "id": 2,
      "usuario": "gerente1",
      "rol_id": 2,
      "rol": {
        "id": 2,
        "nombre": "gerente"
      }
    }
  },
  "message": "Rol asignado correctamente"
}
```

#### Obtener permisos de un rol
```http
GET /api/roles/2/permisos

Response:
{
  "success": true,
  "data": {
    "rol": "gerente",
    "permisos": [
      "productos.leer",
      "productos.crear",
      "productos.editar",
      "productos.eliminar",
      "categorias.*",
      "ordenes.leer",
      "ordenes.editar",
      "ordenes.cambiar_estado",
      "bitacora.leer",
      "uploads.subir"
    ]
  }
}
```

### Estados de Órdenes

#### Cambiar estado de orden
```http
PUT /api/ordenes/123/estado
Headers:
  x-admin-user: admin_usuario
  x-admin-password: admin_password
Content-Type: application/json

Body:
{
  "nuevoEstado": "pagado"
}

Response:
{
  "success": true,
  "data": {
    "id": 123,
    "cliente": "Juan Pérez",
    "telefono": "555-1234",
    "direccion": "Calle Principal 123",
    "total": 250.00,
    "estado": "pagado",
    "estadoAnterior": "pendiente",
    "fecha": "2025-09-30T08:00:00Z"
  },
  "message": "Estado actualizado correctamente"
}
```

#### Intentar transición inválida
```http
PUT /api/ordenes/123/estado
Body:
{
  "nuevoEstado": "completado"
}

Response (400):
{
  "success": false,
  "error": "No se puede cambiar de estado \"pagado\" a \"completado\". Estados permitidos: enviado, cancelado"
}
```

#### Obtener estados permitidos
```http
GET /api/ordenes/123/estados-permitidos

Response:
{
  "success": true,
  "data": {
    "estadoActual": "pagado",
    "estadosPermitidos": ["enviado", "cancelado"]
  }
}
```

---

## 📊 Índices Recomendados en Base de Datos

Para mejorar el rendimiento, agregar estos índices:

```sql
-- Índices para bitacora
CREATE INDEX idx_bitacora_admin_id ON bitacora(admin_id);
CREATE INDEX idx_bitacora_accion ON bitacora(accion);
CREATE INDEX idx_bitacora_fecha ON bitacora(fecha DESC);
CREATE INDEX idx_bitacora_admin_fecha ON bitacora(admin_id, fecha DESC);

-- Índices para administradores
CREATE INDEX idx_administradores_rol_id ON administradores(rol_id);

-- Índices para ordenes
CREATE INDEX idx_ordenes_estado ON ordenes(estado);
CREATE INDEX idx_ordenes_fecha ON ordenes(fecha DESC);
CREATE INDEX idx_ordenes_estado_fecha ON ordenes(estado, fecha DESC);
```

---

## 🎯 Resumen de Tiempo Estimado

| Fase | Descripción | Tiempo Estimado |
|------|-------------|-----------------|
| 1 | Actualización de constantes | 1 hora |
| 2 | Modelos de datos | 4-5 horas |
| 3 | Utilidades y middleware de bitácora | 2-3 horas |
| 4 | Sistema de permisos y roles | 3-4 horas |
| 5 | Controladores de bitácora y roles | 3-4 horas |
| 6 | Actualizar controladores existentes | 4-5 horas |
| 7 | Rutas y protección con roles | 3-4 horas |
| 8 | Validaciones y helpers | 2 horas |
| 9 | Testing y validación | 4-5 horas |
| 10 | Documentación y despliegue | 3-4 horas |
| **TOTAL** | | **29-39 horas** |

---

## 🚀 Orden de Implementación Recomendado

Para minimizar conflictos y facilitar el desarrollo incremental:

1. **Día 1-2**: Fases 1-2 (Constantes y Modelos)
2. **Día 3**: Fase 3 (Bitácora básica)
3. **Día 4**: Fase 4 (Roles y permisos)
4. **Día 5-6**: Fases 5-6 (Controladores)
5. **Día 7**: Fase 7 (Rutas)
6. **Día 8**: Fase 8 (Validaciones)
7. **Día 9**: Fase 9 (Testing)
8. **Día 10**: Fase 10 (Documentación)

**Total: 8-10 días de desarrollo**

---

## ⚠️ Consideraciones Importantes

### Seguridad
- Las credenciales de administrador se siguen enviando en headers en cada request
- Considerar migración a JWT para mejor seguridad (futura mejora)
- Validar siempre rol en backend, nunca confiar en frontend
- Logs de bitácora pueden contener información sensible, proteger acceso

### Rendimiento
- Bitácora crece rápido: considerar política de retención (ej: 90 días)
- Cachear permisos de roles para evitar consultas repetidas
- Índices en bitácora son críticos para búsquedas
- Considerar archivado de bitácora antigua

### Escalabilidad
- Sistema de permisos puede extenderse con más granularidad
- Estados de órdenes pueden ampliarse según necesidades del negocio
- Bitácora podría migrarse a servicio externo si crece mucho

---

## 📞 Contacto y Soporte

Para dudas o problemas durante la implementación, consultar:
- Manual Técnico actualizado
- Documentación de Supabase
- Equipo de desarrollo

---

**Última actualización:** 30 de septiembre de 2025  
**Versión del documento:** 1.0  
**Estado:** ✅ Listo para implementación
