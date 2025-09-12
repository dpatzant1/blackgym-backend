# 🛍️ Guía Completa - Backend Tienda Online Black Gym

## 📋 Información del Proyecto
- **Backend**: Node.js + Express
- **Base de Datos**: PostgreSQL + Supabase
- **Frontend**: Astro + React + Tailwind
- **Fecha de creación**: 8 de septiembre de 2025

---

## 🗃️ Estructura de Base de Datos
```sql
-- Productos
create table productos (
  id serial primary key,
  nombre text not null,
  descripcion text,
  precio numeric not null,
  stock int not null,
  imagen_url text
);

-- Órdenes
create table ordenes (
  id serial primary key,
  cliente text not null,
  telefono text not null,
  direccion text not null,
  total numeric not null,
  fecha timestamp default now()
);

-- Detalle de orden
create table detalle_orden (
  id serial primary key,
  orden_id int references ordenes(id) on delete cascade,
  producto_id int references productos(id),
  cantidad int not null,
  precio_unitario numeric not null
);

-- Categorías
create table categorias (
  id serial primary key,
  nombre text not null,
  descripcion text,
  imagen_url text
);

-- Relación muchos a muchos entre productos y categorías
create table producto_categoria (
  id serial primary key,
  producto_id int references productos(id) on delete cascade,
  categoria_id int references categorias(id) on delete cascade
);
```

---

## 🏗️ Guía de Desarrollo por Fases

### ✅ **Fase 1: Configuración Inicial del Proyecto** - COMPLETADA
**Objetivos:**
- [x] Inicializar proyecto Node.js con npm
- [x] Configurar estructura de carpetas (MVC)
- [x] Instalar dependencias principales
- [x] Configurar variables de entorno para Supabase
- [x] Crear servidor básico de Express
- [x] Implementar middleware básico
- [x] Verificar conexión con Supabase

### ✅ **Fase 2: Conexión completa con Supabase** - COMPLETADA
**Objetivos:**
- [x] Optimizar configuración del cliente de Supabase
- [x] Crear funciones helper para consultas comunes
- [x] Implementar manejo avanzado de errores de Supabase
- [x] Crear modelos de datos con validaciones
- [x] Implementar constantes y configuraciones
- [x] Mejorar sistema de logging y testing

### 🔄 **Fase 3: Modelos y Validaciones** - ✅ INTEGRADA EN FASE 2
**Objetivos:**
- [x] Crear modelos para cada tabla
- [x] Implementar validaciones específicas por modelo
- [x] Crear funciones de mapeo de datos
- [x] Implementar constantes y enums

---

### ✅ **Fase 4: Rutas y Controladores - Productos** - COMPLETADA
**Objetivos:**
- [x] CRUD completo para productos
- [x] Filtros por categoría y búsqueda
- [x] Paginación automática
- [x] Manejo de stock avanzado
- [x] Validaciones robustas
- [x] Endpoints especializados

**Endpoints implementados:**
```
✅ GET    /api/productos                    - Listar todos (con filtros y paginación)
✅ GET    /api/productos/search             - Búsqueda avanzada
✅ GET    /api/productos/:id               - Obtener por ID
✅ POST   /api/productos                   - Crear producto
✅ PUT    /api/productos/:id               - Actualizar producto
✅ PATCH  /api/productos/:id/stock         - Actualizar solo stock
✅ DELETE /api/productos/:id               - Eliminar producto
✅ POST   /api/productos/check-stock       - Verificar stock múltiple
```

**Funcionalidades implementadas:**
- ✅ CRUD completo con validaciones exhaustivas
- ✅ Búsqueda por nombre y descripción
- ✅ Paginación automática con límites configurables
- ✅ Filtros por categoría (usando relación muchos-a-muchos)
- ✅ Verificación de stock para múltiples productos
- ✅ Operaciones de stock avanzadas (set, add, subtract)
- ✅ Sanitización automática de datos de entrada
- ✅ Manejo específico de errores por endpoint
- ✅ Logging de consultas para debugging
- ✅ Respuestas estandarizadas con paginación

**Archivos creados:**
```
src/
├── controllers/
│   └── productos.js ✅ - Controlador completo con 8 endpoints
├── routes/
│   └── productos.js ✅ - Rutas organizadas y documentadas
└── utils/
    ├── seedData.js ✅ - Datos de prueba para gimnasio
    └── TESTING_PRODUCTOS.md ✅ - Guía de testing manual
```

---

### ✅ **Fase 5: Rutas y Controladores - Categorías** - COMPLETADA
**Objetivos:**
- [x] CRUD completo para categorías
- [x] Endpoint para productos por categoría
- [x] Manejo de relaciones producto-categoría
- [x] Validación de integridad referencial
- [x] Asignación múltiple de categorías
- [x] Protección contra eliminación de categorías con productos

**Endpoints implementados:**
```
✅ GET    /api/categorias                           - Listar todas (con paginación)
✅ GET    /api/categorias/:id                       - Obtener por ID
✅ POST   /api/categorias                           - Crear categoría
✅ PUT    /api/categorias/:id                       - Actualizar categoría
✅ DELETE /api/categorias/:id                       - Eliminar categoría
✅ GET    /api/categorias/:id/productos             - Productos por categoría
✅ POST   /api/categorias/productos/:id/assign      - Asignar categorías a producto
✅ DELETE /api/categorias/:id/productos/:productoId - Remover producto de categoría
```

**Funcionalidades implementadas:**
- ✅ CRUD completo con validaciones exhaustivas
- ✅ Incluir productos al obtener categorías (opcional)
- ✅ Paginación automática con límites configurables
- ✅ Listado de productos por categoría específica
- ✅ Asignación múltiple de categorías a productos
- ✅ Remoción individual de relaciones producto-categoría
- ✅ Validación de integridad referencial
- ✅ Protección contra eliminación de categorías con productos
- ✅ Sanitización automática de datos de entrada
- ✅ Manejo específico de errores por endpoint
- ✅ Logging de consultas para debugging
- ✅ Respuestas estandarizadas con información completa

**Archivos creados:**
```
src/
├── controllers/
│   └── categorias.js ✅ - Controlador completo con 8 endpoints
└── routes/
    └── categorias.js ✅ - Rutas organizadas y documentadas
```

---

### ✅ **Fase 6: Sistema de Órdenes** - COMPLETADA
**Objetivos:**
- [x] Rutas para órdenes
- [x] Manejo de transacciones para crear orden + detalles
- [x] Validación de stock disponible
- [x] Actualización automática de inventario
- [x] Cancelación de órdenes con restauración de stock
- [x] Estadísticas básicas de órdenes

**Endpoints implementados:**
```
✅ GET    /api/ordenes                  - Listar órdenes (con paginación y detalles)
✅ GET    /api/ordenes/stats           - Estadísticas de órdenes
✅ GET    /api/ordenes/:id             - Obtener orden por ID
✅ POST   /api/ordenes                 - Crear orden con productos
✅ PUT    /api/ordenes/:id             - Actualizar datos de orden
✅ DELETE /api/ordenes/:id             - Cancelar orden (restaura stock)
✅ GET    /api/ordenes/:id/detalle     - Detalle completo de orden
```

**Funcionalidades implementadas:**
- ✅ Transacciones completas para crear órdenes con detalles
- ✅ Validación automática de stock disponible antes de crear orden
- ✅ Actualización automática de inventario al confirmar orden
- ✅ Cálculo y validación de totales automática
- ✅ Cancelación de órdenes con restauración completa de stock
- ✅ Obtener órdenes con detalles de productos incluidos
- ✅ Paginación automática para listado de órdenes
- ✅ Estadísticas básicas de ventas y órdenes
- ✅ Validación de integridad referencial de productos
- ✅ Manejo de errores específicos para transacciones
- ✅ Logging completo de operaciones de órdenes
- ✅ Validación de datos de cliente y dirección
- ✅ Verificación de consistencia de precios
- ✅ Protección contra creación de órdenes inválidas

**Archivos creados:**
```
src/
├── controllers/
│   └── ordenes.js ✅ - Controlador completo con 7 endpoints
├── routes/
│   └── ordenes.js ✅ - Rutas organizadas para órdenes
└── utils/
    └── orderTestData.js ✅ - Datos de prueba para testing
```

**Flujo de creación de orden:**
1. Validar datos básicos de la orden (cliente, teléfono, dirección, total)
2. Validar estructura y datos de productos
3. Verificar stock disponible para todos los productos
4. Obtener precios actuales de la base de datos
5. Calcular total y validar consistencia
6. Crear orden en transacción
7. Crear detalles de orden
8. Actualizar stock de productos
9. Retornar orden completa con detalles

**Características destacadas:**
- ✅ **Transacciones atómicas**: Si falla cualquier paso, se revierten todos los cambios
- ✅ **Validación de stock en tiempo real**: Previene overselling
- ✅ **Cálculo automático de totales**: Previene manipulación de precios
- ✅ **Restauración de stock**: Al cancelar órdenes se restaura el inventario
- ✅ **Datos enriquecidos**: Incluye información completa de productos en respuestas
- ✅ **Estadísticas integradas**: Métricas básicas de ventas disponibles

---

### 🔄 **Fase 7: Funcionalidades Avanzadas** - PARCIALMENTE COMPLETADA
**Objetivos:**
- [ ] Manejo inteligente de inventario
- [ ] Validaciones de negocio avanzadas
- [ ] Endpoints de estadísticas y reportes
- [ ] Sistema de búsqueda avanzada
- [x] **Optimización de consultas** ✅

**Optimizaciones implementadas:**
- ✅ **Consultas con campos específicos**: Reemplazado `SELECT *` por campos necesarios
- ✅ **Índices mejorados**: Agregado `order` explícito para usar índices de base de datos
- ✅ **JOINs optimizados**: Uso de INNER/LEFT JOIN más eficientes
- ✅ **Búsquedas O(1)**: Uso de Map en lugar de find() para búsquedas de productos
- ✅ **Reducción de datos transferidos**: Solo campos necesarios en respuestas
- ✅ **Cálculos eficientes**: Optimización de transformaciones de datos
- ✅ **Batch operations**: Mejora en operaciones de actualización múltiple

**Mejoras de rendimiento aplicadas:**
```javascript
// ANTES: SELECT * (todos los campos)
.select('*')

// DESPUÉS: Solo campos necesarios
.select('id, nombre, precio, stock, imagen_url')

// ANTES: Búsqueda O(n)
productosDB.find(p => p.id === producto.id)

// DESPUÉS: Búsqueda O(1) con Map
const productMap = new Map(productosDB.map(p => [p.id, p]));
productMap.get(producto.id)
```

---

### 🔄 **Fase 8: Optimización y Testing** - PENDIENTE
**Objetivos:**
- [ ] Implementar caché básico
- [ ] Optimizar consultas a la base de datos
- [ ] Agregar logging avanzado
- [ ] Pruebas unitarias con Jest
- [ ] Documentación detallada de API

---

### 🔄 **Fase 9: Preparación para Producción** - PENDIENTE
**Objetivos:**
- [ ] Configurar variables de entorno para producción
- [ ] Implementar rate limiting
- [ ] Configurar HTTPS
- [ ] Preparar para deploy (Vercel, Railway, Heroku)
- [ ] Monitoreo y alertas básicas

---

## 🔧 Configuración Actual

### Variables de Entorno (.env)
```env
# Configuración de Supabase
SUPABASE_URL=https://lyzzyejvkyxcyfrbmtqo.supabase.co
SUPABASE_ANON_KEY=[clave_configurada]

# Configuración del servidor
PORT=3000
NODE_ENV=development

# CORS - Permitir requests desde el frontend Astro
CORS_ORIGIN=http://localhost:4321
```

### Comandos Útiles
```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Ejecutar en producción
npm start

# Probar endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api
```

---

## 📝 Notas Importantes

1. **Conexión verificada** ✅ - El servidor se conecta exitosamente a Supabase
2. **Estructura modular** ✅ - Código organizado por responsabilidades
3. **Manejo de errores** ✅ - Middleware implementado para errores y logging
4. **CORS configurado** ✅ - Preparado para trabajar con Astro en puerto 4321
5. **Variables de entorno** ✅ - Configuración segura y flexible

---

## 🚀 Siguiente Paso
Una vez completada la **Fase 1**, el siguiente paso es continuar con la **Fase 2** para establecer la conexión completa con Supabase y preparar los modelos de datos.

---

**Estado actual**: ✅ Fase 6 completada + Optimización de consultas implementada
**Próximo paso**: 🔄 Fase 8 - Testing y documentación OR Conectar con frontend
