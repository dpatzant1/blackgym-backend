# 📱 Plan de Implementación - App Móvil Black Gym

## 🎯 Objetivo
Extender el backend existente para soportar la aplicación móvil Flutter con funcionalidades de tienda online y características potenciadas por IA (generación de rutinas y recomendaciones de productos).

---

## 📊 Estado del Proyecto

- [x] Análisis de requerimientos
- [x] Fase 1: Base de Datos y Configuración
- [x] Fase 2: Autenticación de Usuarios
- [x] Fase 3: Gestión de Usuarios
- [x] Fase 4: Sistema de Rutinas con IA ✅
- [x] Fase 5: Sistema de Recomendaciones con IA ✅
- [x] Fase 6: Progreso y Entrenamientos ✅
- [x] Fase 7: Integración con Tienda Existente ✅
- [ ] Fase 8: Documentación y Testing

---

## 🗂️ FASE 1: Base de Datos y Configuración

### 1.1 Script de Migración SQL
- [ ] Crear `migrations/app_movil_tables.sql`
- [ ] Tabla `usuarios` (clientes de la app)
- [ ] Tabla `rutinas` (rutinas generadas)
- [ ] Tabla `recomendaciones` (productos recomendados por IA)
- [ ] Tabla `progreso_usuario` (tracking de progreso físico)
- [ ] Tabla `historial_entrenamientos` (registro de entrenamientos)
- [ ] Tabla `rutina_detalles` (detalles de ejercicios en rutinas)
- [ ] Índices y constraints necesarios

### 1.2 Configuración de Gemini AI
- [ ] Agregar `GEMINI_API_KEY` al archivo `.env`
- [ ] Crear `src/config/gemini.js` con configuración
- [ ] Documentar uso de la API key

---

## 🔐 FASE 2: Autenticación de Usuarios

### 2.1 Middleware de Autenticación
- [x] Crear `src/middleware/authUsuarios.js`
  - [x] Función `verificarTokenUsuario()` - Verificar JWT de usuarios finales
  - [x] Función `generarTokenUsuario()` - Generar JWT para usuarios
  - [x] Separar lógica de administradores y usuarios
  - [x] Middleware `requireUserAuth()` - Proteger rutas
  - [x] Middleware `optionalUserAuth()` - Auth opcional
  - [x] Middleware `logUserAction()` - Logging

### 2.2 Utilidades de Autenticación
- [x] `src/utils/auth.js` ya tiene las funciones necesarias
  - [x] Función `hashPassword()` - Hash de contraseñas con bcrypt (ya existe)
  - [x] Función `verifyPassword()` - Comparar contraseñas (ya existe)
  - [x] JWT_SECRET agregado a `.env`

---

## 👤 FASE 3: Gestión de Usuarios

### 3.1 Modelo de Usuarios
- [x] Crear `src/models/usuarios.js`
  - [x] `crear(datos)` - Crear nuevo usuario
  - [x] `buscarPorEmail(email)` - Buscar por email
  - [x] `buscarPorId(id)` - Buscar por ID
  - [x] `actualizar(id, datos)` - Actualizar perfil
  - [x] `actualizarObjetivo(id, objetivo, peso, altura)` - Actualizar datos fitness
  - [x] `eliminar(id)` - Eliminar cuenta (soft delete)
  - [x] `verificarCredenciales(email, password)` - Para login
  - [x] `cambiarPassword(id, actual, nueva)` - Cambiar contraseña
  - [x] `obtenerEstadisticas(id)` - Estadísticas del usuario

### 3.2 Controlador de Usuarios
- [x] Crear `src/controllers/usuarios.js`
  - [x] `registro()` - POST - Registrar nuevo usuario
  - [x] `login()` - POST - Iniciar sesión
  - [x] `obtenerPerfil()` - GET - Obtener perfil del usuario autenticado
  - [x] `actualizarPerfil()` - PUT - Actualizar datos personales
  - [x] `actualizarDatosFitness()` - PUT - Actualizar objetivo/peso/altura
  - [x] `cambiarPassword()` - PUT - Cambiar contraseña
  - [x] `eliminarCuenta()` - DELETE - Eliminar cuenta (bonus)

### 3.3 Rutas de Usuarios
- [x] Crear `src/routes/usuarios.js`
  - [x] POST `/api/usuarios/registro` - Registro (público)
  - [x] POST `/api/usuarios/login` - Login (público)
  - [x] GET `/api/usuarios/perfil` - Perfil (autenticado)
  - [x] PUT `/api/usuarios/perfil` - Actualizar perfil (autenticado)
  - [x] PUT `/api/usuarios/datos-fitness` - Actualizar datos fitness (autenticado)
  - [x] PUT `/api/usuarios/cambiar-password` - Cambiar contraseña (autenticado)
  - [x] DELETE `/api/usuarios/cuenta` - Eliminar cuenta (bonus)

---

## 💪 FASE 4: Sistema de Rutinas con IA

### 4.1 Utilidades de IA - Gemini
- [x] Crear `src/utils/gemini.js`
  - [x] `generarRutina(perfilUsuario)` - Generar rutina con IA
  - [x] `generarRecomendaciones(perfilUsuario, productos)` - Recomendar productos
  - [x] Función auxiliar `hacerRequestGemini()` - Hacer requests a Gemini API
  - [x] Manejo de errores y rate limiting
  - [x] `conRateLimiting()` - Wrapper con rate limiting
  - [x] `obtenerEstadisticasRateLimit()` - Estadísticas de uso
  - [x] Parsing inteligente de respuestas JSON
  - [x] Validación de estructura de datos

### 4.2 Modelo de Rutinas
- [x] Crear `src/models/rutinas.js`
  - [x] `crear(usuarioId, datos)` - Crear rutina
  - [x] `obtenerPorUsuario(usuarioId)` - Listar rutinas del usuario
  - [x] `obtenerPorId(id, usuarioId)` - Obtener una rutina específica
  - [x] `actualizar(id, usuarioId, datos)` - Actualizar rutina
  - [x] `eliminar(id, usuarioId)` - Eliminar rutina (soft delete)
  - [x] `guardarDetalles(rutinaId, usuarioId, ejercicios)` - Guardar ejercicios de la rutina
  - [x] Validaciones completas en todas las funciones
  - [x] Filtros opcionales en obtenerPorUsuario (activas, nivel)
  - [x] Agrupación de ejercicios por día en obtenerPorId
  - [x] Transacciones para operaciones críticas
  - [x] Seguridad: Validación de propiedad del usuario en todas las operaciones

### 4.3 Controlador de Rutinas
- [x] Crear `src/controllers/rutinas.js`
  - [x] `generarConIA()` - POST - Generar rutina con IA basada en perfil
  - [x] `listar()` - GET - Listar rutinas del usuario
  - [x] `obtener()` - GET - Obtener una rutina específica
  - [x] `crear()` - POST - Crear rutina manual
  - [x] `actualizar()` - PUT - Actualizar rutina
  - [x] `eliminar()` - DELETE - Eliminar rutina (soft delete)
  - [x] `guardarGenerada()` - POST - Guardar rutina generada por IA en perfil
  - [x] Validación de perfil completo antes de generar con IA
  - [x] Manejo de transacciones (rollback si falla guardar ejercicios)
  - [x] Soporte para query params en listar (filtros)
  - [x] Validaciones completas de datos de entrada
  - [x] Mensajes de error descriptivos

### 4.4 Rutas de Rutinas
- [x] Crear `src/routes/rutinas.js`
  - [x] POST `/api/rutinas/generar-ia` - Generar con IA (autenticado)
  - [x] POST `/api/rutinas/guardar-generada` - Guardar rutina generada por IA (bonus)
  - [x] POST `/api/rutinas` - Crear manual (autenticado)
  - [x] GET `/api/rutinas` - Listar mis rutinas (autenticado)
  - [x] GET `/api/rutinas/:id` - Obtener una rutina (autenticado)
  - [x] PUT `/api/rutinas/:id` - Actualizar (autenticado)
  - [x] DELETE `/api/rutinas/:id` - Eliminar (autenticado)
  - [x] Registrado en `server.js`
  - [x] Middleware requireUserAuth en todas las rutas
  - [x] Middleware logUserAction en operaciones de escritura
  - [x] Documentación JSDoc completa en cada endpoint

---

## 🎯 FASE 5: Sistema de Recomendaciones con IA

### 5.1 Modelo de Recomendaciones
- [x] Crear `src/models/recomendaciones.js`
  - [x] `crear(usuarioId, productoId, motivo, relevancia)` - Guardar recomendación
  - [x] `obtenerPorUsuario(usuarioId, limite, filtros)` - Obtener recomendaciones con detalles de productos
  - [x] `marcarComoVista(id, usuarioId)` - Marcar como vista
  - [x] `eliminarAntiguasPorUsuario(usuarioId, diasAntiguedad)` - Limpiar recomendaciones antiguas
  - [x] `tieneRecomendacionesRecientes(usuarioId)` - Verificar si tiene recomendaciones recientes (<7 días)
  - [x] `obtenerEstadisticas(usuarioId)` - Estadísticas de recomendaciones del usuario
  - [x] `eliminarTodasPorUsuario(usuarioId)` - Eliminar todas (útil al regenerar)
  - [x] Validación de producto existente y activo
  - [x] Prevención de duplicados recientes (7 días)
  - [x] JOIN con tabla productos para datos completos
  - [x] Filtros avanzados (soloNoVistas, minRelevancia)
  - [x] Validación de propiedad en operaciones sensibles

### 5.2 Controlador de Recomendaciones
- [x] Crear `src/controllers/recomendaciones.js`
  - [x] `obtener()` - GET - Obtener productos recomendados para el usuario
  - [x] `generar()` - POST - Forzar generación de nuevas recomendaciones
  - [x] `marcarVista()` - PUT - Marcar recomendación como vista (bonus)
  - [x] `obtenerEstadisticas()` - GET - Estadísticas de recomendaciones (bonus)
  - [x] `_generarRecomendacionesInternas()` - Función auxiliar privada
  - [x] Lógica inteligente de cache: genera automáticamente si no hay o son antiguas (>7 días)
  - [x] Integración completa con catálogo de productos existente (query a tabla productos)
  - [x] Validación de perfil completo antes de generar
  - [x] Manejo de fallback: retorna recomendaciones antiguas si falla generación
  - [x] Eliminación de recomendaciones anteriores al regenerar
  - [x] Query optimizado: solo productos activos y con stock

### 5.3 Rutas de Recomendaciones
- [x] Crear `src/routes/recomendaciones.js`
  - [x] GET `/api/recomendaciones` - Obtener recomendaciones (autenticado)
  - [x] GET `/api/recomendaciones/estadisticas` - Estadísticas (autenticado) (bonus)
  - [x] POST `/api/recomendaciones/generar` - Generar nuevas (autenticado)
  - [x] PUT `/api/recomendaciones/:id/vista` - Marcar como vista (bonus)
  - [x] Registrado en `server.js`
  - [x] Middleware requireUserAuth en todas las rutas
  - [x] Middleware logUserAction en operaciones de escritura
  - [x] Documentación JSDoc completa en cada endpoint
  - [x] Orden correcto de rutas (estadisticas antes de :id)

---

## 📈 FASE 6: Progreso y Entrenamientos

### 6.1 Modelo de Progreso
- [x] Crear `src/models/progreso.js`
  - [x] `registrar(usuarioId, datos)` - Registrar medición con cálculo automático de IMC
  - [x] `obtenerHistorial(usuarioId, limite, filtros)` - Obtener historial con filtros de fecha
  - [x] `obtenerUltimo(usuarioId)` - Obtener última medición
  - [x] `obtenerEstadisticas(usuarioId)` - Calcular estadísticas completas con comparación inicial vs actual
  - [x] `eliminar(id, usuarioId)` - Eliminar registro con validación de propiedad (bonus)
  - [x] Validaciones completas (rangos de peso 20-300kg, altura 100-250cm, porcentaje grasa 0-100%)
  - [x] Cálculo automático de IMC cuando se proporciona altura
  - [x] Soporte para múltiples medidas: peso, altura, grasa, masa muscular, cintura, pecho, brazos, piernas
  - [x] Comparación de progreso: inicial vs actual con diferencias calculadas
  - [x] Estadísticas avanzadas: promedios, mínimos, máximos, días de seguimiento, frecuencia de registro

### 6.2 Modelo de Historial de Entrenamientos
- [x] Crear `src/models/historialEntrenamientos.js`
  - [x] `registrar(usuarioId, rutinaId, datos)` - Registrar entrenamiento con validación de rutina
  - [x] `obtenerHistorial(usuarioId, filtros)` - Obtener historial con filtros avanzados (fecha, rutina, intensidad)
  - [x] `obtenerEstadisticas(usuarioId, filtros)` - Estadísticas completas con periodos, racha actual, frecuencia
  - [x] `actualizar(id, usuarioId, datos)` - Actualizar entrenamiento con validación de propiedad
  - [x] `eliminar(id, usuarioId)` - Eliminar entrenamiento (bonus)
  - [x] Validaciones completas: duración (1-600 min), calorías (0-5000), intensidad (baja/media/alta)
  - [x] Soporte para registro de ejercicios realizados en notas estructuradas
  - [x] Vinculación con rutinas existentes del usuario
  - [x] Estadísticas avanzadas: total entrenamientos, horas/minutos, calorías, días activos, racha, frecuencia semanal
  - [x] Análisis por intensidad y rutinas más usadas
  - [x] Filtros múltiples: fecha desde/hasta, rutina específica, intensidad, límite de registros

### 6.3 Controladores de Progreso y Entrenamientos
- [x] Crear `src/controllers/progreso.js`
  - [x] `registrar()` - POST - Registrar nuevo progreso con validaciones completas
  - [x] `obtenerHistorial()` - GET - Obtener historial con filtros (limite, fechaDesde, fechaHasta)
  - [x] `obtenerEstadisticas()` - GET - Obtener estadísticas completas del progreso
  - [x] `obtenerUltimo()` - GET - Obtener última medición (bonus)
  - [x] `eliminar()` - DELETE - Eliminar medición específica (bonus)
  - [x] Validaciones de fechas y límites en query params
  - [x] Manejo de errores completo con códigos HTTP apropiados
  - [x] Mensajes amigables cuando no hay datos

- [x] Crear `src/controllers/historialEntrenamientos.js`
  - [x] `registrar()` - POST - Registrar entrenamiento con soporte para ejercicios
  - [x] `obtenerHistorial()` - GET - Obtener historial con filtros múltiples (fecha, rutina, intensidad)
  - [x] `obtenerEstadisticas()` - GET - Estadísticas con periodos (semana/mes/año/total)
  - [x] `actualizar()` - PUT - Actualizar entrenamiento con validaciones
  - [x] `eliminar()` - DELETE - Eliminar entrenamiento (bonus)
  - [x] Validaciones completas de todos los parámetros
  - [x] Límite máximo de 100 registros por consulta
  - [x] Respuestas con filtros aplicados para transparencia
  - [x] Mensajes motivacionales para usuarios sin datos

### 6.4 Rutas de Progreso y Entrenamientos
- [x] Crear `src/routes/progreso.js`
  - [x] POST `/api/progreso` - Registrar progreso (autenticado)
  - [x] GET `/api/progreso` - Obtener historial (autenticado)
  - [x] GET `/api/progreso/estadisticas` - Obtener estadísticas (autenticado)
  - [x] GET `/api/progreso/ultimo` - Obtener última medición (bonus)
  - [x] DELETE `/api/progreso/:id` - Eliminar medición (bonus)
  - [x] Middleware requireUserAuth en todas las rutas
  - [x] Middleware logUserAction en operaciones de escritura
  - [x] Documentación JSDoc completa en cada endpoint

- [x] Crear `src/routes/historialEntrenamientos.js`
  - [x] POST `/api/entrenamientos` - Registrar entrenamiento (autenticado)
  - [x] GET `/api/entrenamientos` - Obtener historial (autenticado)
  - [x] GET `/api/entrenamientos/estadisticas` - Obtener estadísticas (autenticado)
  - [x] PUT `/api/entrenamientos/:id` - Actualizar (autenticado)
  - [x] DELETE `/api/entrenamientos/:id` - Eliminar entrenamiento (bonus)
  - [x] Middleware requireUserAuth en todas las rutas
  - [x] Middleware logUserAction en operaciones de escritura
  - [x] Documentación JSDoc completa en cada endpoint
  - [x] Orden correcto de rutas (/estadisticas antes de /:id)

- [x] Registrar rutas en `server.js`
  - [x] Importar progresoRoutes y entrenamientosRoutes
  - [x] Registrar `/api/progreso` con progresoRoutes
  - [x] Registrar `/api/entrenamientos` con entrenamientosRoutes

---

## 🛒 FASE 7: Integración con Tienda Existente

### 7.1 Adaptación de Endpoints Existentes
- [x] Revisar `src/routes/productos.js` para usuarios finales
  - [x] ✅ GET `/api/productos` es público (sin autenticación)
  - [x] ✅ GET `/api/productos/:id` es público - Detalles de producto
  - [x] ✅ GET `/api/productos/search` es público - Búsqueda de productos
  - [x] ✅ POST `/api/productos/check-stock` es público - Verificar stock
  - [x] ✅ GET `/api/categorias` es público - Listar categorías
  - [x] ✅ GET `/api/categorias/:id/productos` es público - Productos por categoría
  - [x] Todos los endpoints de lectura ya son accesibles para usuarios de app móvil

### 7.2 Sistema de Órdenes para Usuarios
- [x] Adaptar `src/controllers/ordenes.js`
  - [x] `crearOrdenUsuario()` - Crear orden desde app móvil vinculada a usuario_id
  - [x] `obtenerOrdenesUsuario()` - Historial de órdenes con paginación y filtro por estado
  - [x] `obtenerDetalleOrdenUsuario()` - Detalle de orden con validación de propiedad
  - [x] Vincular órdenes con `usuario_id` del JWT
  - [x] Validación de stock antes de crear orden
  - [x] Actualización automática de inventario
  - [x] Verificación de total calculado vs enviado
  - [x] Transacciones seguras (rollback si falla algún paso)

- [x] Actualizar `src/routes/ordenes.js`
  - [x] POST `/api/ordenes/usuario` - Crear orden (autenticado)
  - [x] GET `/api/ordenes/usuario/mis-ordenes` - Historial (autenticado)
  - [x] GET `/api/ordenes/usuario/:id` - Detalle de orden (autenticado, solo propias)
  - [x] Middleware requireUserAuth en todas las rutas de usuarios
  - [x] Middleware logUserAction para auditoría
  - [x] Documentación JSDoc completa

- [x] Actualizar `src/models/index.js` (OrdenModel)
  - [x] Agregar campo `usuario_id` al modelo
  - [x] Actualizar método `toDatabase()` para incluir usuario_id
  - [x] Compatibilidad con órdenes anónimas (usuario_id = null)

### 7.3 Carrito de Compras
- [x] ✅ Carrito manejado completamente en frontend (Flutter)
- [x] No se requiere backend para carrito
- [x] API de órdenes recibe array de productos directamente

---

## 📚 FASE 8: Documentación y Testing

### 8.1 Documentación de API
- [ ] Crear `API_APP_MOVIL.md` con:
  - [ ] Todos los endpoints disponibles
  - [ ] Request/Response examples
  - [ ] Códigos de error
  - [ ] Headers requeridos (Authorization)
  - [ ] Flujos de autenticación

### 8.2 Actualizar server.js
- [ ] Registrar todas las nuevas rutas en `server.js`
- [ ] Verificar que CORS permita la app móvil
- [ ] Validar que los middlewares estén en orden correcto

### 8.3 Testing Manual
- [ ] Probar todos los endpoints con Postman/Thunder Client
- [ ] Verificar generación de rutinas con IA
- [ ] Verificar generación de recomendaciones con IA
- [ ] Probar flujo completo: registro → login → usar app

### 8.4 Seguridad
- [ ] Validar que usuarios solo accedan a sus propios datos
- [ ] Implementar rate limiting en endpoints de IA
- [ ] Validar inputs en todos los endpoints
- [ ] Asegurar que API key de Gemini no se exponga

---

## 🎨 Estructura Final de Archivos Nuevos

```
Black_Gym_Backend/
├── migrations/
│   └── app_movil_tables.sql
├── src/
│   ├── config/
│   │   └── gemini.js
│   ├── controllers/
│   │   ├── usuarios.js
│   │   ├── rutinas.js
│   │   ├── recomendaciones.js
│   │   ├── progreso.js
│   │   └── historialEntrenamientos.js
│   ├── middleware/
│   │   └── authUsuarios.js
│   ├── models/
│   │   ├── usuarios.js
│   │   ├── rutinas.js
│   │   ├── recomendaciones.js
│   │   ├── progreso.js
│   │   └── historialEntrenamientos.js
│   ├── routes/
│   │   ├── usuarios.js
│   │   ├── rutinas.js
│   │   ├── recomendaciones.js
│   │   ├── progreso.js
│   │   └── historialEntrenamientos.js
│   └── utils/
│       └── gemini.js
├── .env (actualizado)
├── API_APP_MOVIL.md
└── PLAN_APP_MOVIL.md (este archivo)
```

---

## 📝 Notas Importantes

### Estrategia de Recomendaciones IA
- **Frecuencia**: Generar recomendaciones cada 7 días o cuando el usuario actualice su perfil fitness
- **Cache**: Guardar en tabla `recomendaciones` para no consumir API en cada request
- **Límite**: Mostrar top 5-10 productos recomendados

### Seguridad de API Keys
- ✅ Gemini API Key en `.env` (nunca en código)
- ⚠️ **IMPORTANTE**: Rotar la API key compartida después de este desarrollo
- 🔒 Nunca exponer la key en respuestas del backend

### Separación de Autenticación
- Administradores: Middleware existente `src/middleware/auth.js`
- Usuarios: Nuevo middleware `src/middleware/authUsuarios.js`
- Tokens JWT con campo `tipo: 'admin'` o `tipo: 'usuario'`

---

## 🚀 Orden de Implementación Recomendado

1. **Fase 1** → Base de datos y configuración (requisito para todo)
2. **Fase 2 + 3** → Autenticación y usuarios (base para el resto)
3. **Fase 4** → Rutinas con IA (funcionalidad core)
4. **Fase 5** → Recomendaciones con IA (funcionalidad core)
5. **Fase 6** → Progreso y entrenamientos (complementario)
6. **Fase 7** → Integración tienda (reutilizar existente)
7. **Fase 8** → Documentación y testing (cierre)

---

## ✅ Checklist de Completación

Al finalizar cada fase, verificar:
- [ ] Código implementado y funcionando
- [ ] Endpoints probados manualmente
- [ ] Documentación actualizada
- [ ] Commit realizado con mensaje descriptivo
- [ ] Sin errores en consola
- [ ] Variables de entorno configuradas

---

**Fecha de inicio**: Octubre 10, 2025  
**Última actualización**: Octubre 10, 2025  
**Estado**: 🟡 En progreso - Fase 1
