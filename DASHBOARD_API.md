# 📊 API de Dashboard de Ventas - Black Gym Backend

**Versión:** 1.0.0  
**Fecha:** 3 de octubre de 2025  
**Base URL:** `http://localhost:3000/api/dashboard`

---

## 📋 Tabla de Contenido

1. [Descripción General](#descripción-general)
2. [Autenticación](#autenticación)
3. [Endpoints](#endpoints)
   - [Dashboard General](#1-dashboard-general)
   - [Ventas por Periodo](#2-ventas-por-periodo)
   - [Comparativa Anual](#3-comparativa-anual)
   - [Top Productos](#4-top-productos)
   - [Análisis de Categorías](#5-análisis-de-categorías)
4. [Códigos de Respuesta](#códigos-de-respuesta)
5. [Ejemplos de Errores](#ejemplos-de-errores)
6. [Diagrama de Flujo](#diagrama-de-flujo)
7. [Optimización y Mejores Prácticas](#optimización-y-mejores-prácticas)

---

## 🎯 Descripción General

La API de Dashboard de Ventas proporciona endpoints para análisis de ventas, productos y categorías. Todos los datos se calculan en tiempo real desde la base de datos de Supabase utilizando únicamente la estructura existente, sin modificaciones.

### Características Principales:

✅ **Métricas en tiempo real** - Datos actualizados sin caché  
✅ **Filtrado por periodo** - Año completo o mes específico  
✅ **Análisis Pareto** - Identificación de productos 80/20  
✅ **Comparativas anuales** - Crecimiento año sobre año  
✅ **Distribución por categoría** - Análisis de ventas por categoría  

### Estados de Órdenes Válidos:

Solo se consideran ventas las órdenes en los siguientes estados:
- `pagado`
- `enviado`
- `completado`

Se excluyen: `pendiente` y `cancelado`

---

## 🔐 Autenticación

Todos los endpoints requieren autenticación mediante headers personalizados:

```http
x-admin-user: usuario_admin
x-admin-password: password_admin
```

### Roles Autorizados:

- ✅ **Administrador** - Acceso completo
- ✅ **Gerente** - Acceso completo
- ✅ **Asesor de Ventas** - Acceso completo

---

## 📡 Endpoints

### 1. Dashboard General

Obtiene todas las métricas principales del dashboard en una sola llamada.

#### **GET** `/api/dashboard/general`

#### Query Parameters:

| Parámetro | Tipo    | Requerido | Descripción                    | Ejemplo |
|-----------|---------|-----------|--------------------------------|---------|
| `year`    | integer | ✅ Sí     | Año a consultar                | 2025    |
| `month`   | integer | ❌ No     | Mes a consultar (1-12)         | 3       |

#### Validaciones:

- `year` debe ser un número entero válido
- `month` debe estar entre 1 y 12 si se proporciona

#### Ejemplo de Solicitud:

```bash
# Dashboard del año completo
GET /api/dashboard/general?year=2025

# Dashboard de un mes específico
GET /api/dashboard/general?year=2025&month=3
```

#### Respuesta Exitosa (200):

```json
{
  "success": true,
  "message": "Dashboard obtenido exitosamente",
  "data": {
    "periodo": {
      "year": 2025,
      "month": "todos",
      "mesNombre": "Todos los meses"
    },
    "metricas": {
      "ventasTotales": 1298978.50,
      "totalOrdenes": 458,
      "promedioOrden": 2835.73,
      "productoTop": {
        "id": 15,
        "nombre": "Omega 3 Fish Oil",
        "imagen_url": "https://ejemplo.com/imagen.jpg",
        "totalVentas": 45600.00,
        "unidadesVendidas": 234
      },
      "categoriaTop": {
        "id": 3,
        "nombre": "Creatinas",
        "totalVentas": 140651.25
      }
    }
  }
}
```

#### Casos de Uso:

- **Dashboard principal** - Mostrar todas las métricas clave
- **Vista general mensual** - Analizar un mes específico
- **KPIs ejecutivos** - Números clave para reportes

---

### 2. Ventas por Periodo

Obtiene la evolución de ventas en un periodo, puede ser mensual (12 meses) o diaria (días del mes).

#### **GET** `/api/dashboard/ventas-periodo`

#### Query Parameters:

| Parámetro | Tipo    | Requerido | Descripción                           | Ejemplo   |
|-----------|---------|-----------|---------------------------------------|-----------|
| `year`    | integer | ✅ Sí     | Año a consultar                       | 2025      |
| `month`   | integer | ❌ No     | Mes a consultar (requerido si tipo=diario) | 3    |
| `tipo`    | string  | ❌ No     | Tipo de evolución: `mensual` o `diario` | mensual |

#### Validaciones:

- `year` debe ser un número válido
- `tipo` debe ser `mensual` o `diario` (default: `mensual`)
- Si `tipo=diario`, `month` es requerido y debe estar entre 1-12

#### Ejemplo de Solicitud:

```bash
# Evolución mensual del año
GET /api/dashboard/ventas-periodo?year=2025&tipo=mensual

# Evolución diaria de marzo
GET /api/dashboard/ventas-periodo?year=2025&month=3&tipo=diario
```

#### Respuesta Exitosa - Mensual (200):

```json
{
  "success": true,
  "message": "Evolución de ventas obtenida exitosamente",
  "data": {
    "periodo": {
      "year": 2025,
      "month": "todos",
      "tipo": "mensual",
      "mesNombre": null
    },
    "resumen": {
      "totalVentas": 1298978.50,
      "totalOrdenes": 458,
      "promedioOrden": 2835.73
    },
    "evolucion": [
      {
        "mes": 1,
        "mesNombre": "enero",
        "mesAbreviado": "ene",
        "ventas": 105234.50,
        "ordenes": 38,
        "promedioOrden": 2769.33
      },
      {
        "mes": 2,
        "mesNombre": "febrero",
        "mesAbreviado": "feb",
        "ventas": 98765.25,
        "ordenes": 35,
        "promedioOrden": 2821.86
      }
      // ... resto de meses
    ]
  }
}
```

#### Respuesta Exitosa - Diaria (200):

```json
{
  "success": true,
  "message": "Evolución de ventas obtenida exitosamente",
  "data": {
    "periodo": {
      "year": 2025,
      "month": 3,
      "tipo": "diario",
      "mesNombre": "marzo"
    },
    "resumen": {
      "totalVentas": 112450.75,
      "totalOrdenes": 42,
      "promedioOrden": 2677.40
    },
    "evolucion": [
      {
        "dia": 1,
        "fecha": "2025-03-01",
        "ventas": 3450.00,
        "ordenes": 2
      },
      {
        "dia": 2,
        "fecha": "2025-03-02",
        "ventas": 5670.50,
        "ordenes": 3
      }
      // ... resto de días del mes
    ]
  }
}
```

#### Casos de Uso:

- **Gráfico de barras mensual** - Visualizar ventas por mes
- **Gráfico de líneas diario** - Análisis día a día
- **Identificar tendencias** - Picos y valles de ventas

---

### 3. Comparativa Anual

Compara las ventas entre dos años con análisis de crecimiento mensual.

#### **GET** `/api/dashboard/comparativa-anual`

#### Query Parameters:

| Parámetro          | Tipo    | Requerido | Descripción                | Ejemplo |
|--------------------|---------|-----------|----------------------------|---------|
| `year`             | integer | ✅ Sí     | Año base (más reciente)    | 2025    |
| `year_comparacion` | integer | ✅ Sí     | Año a comparar (anterior)  | 2024    |

#### Validaciones:

- Ambos años deben ser números válidos
- `year` debe ser mayor que `year_comparacion`

#### Ejemplo de Solicitud:

```bash
# Comparar 2025 vs 2024
GET /api/dashboard/comparativa-anual?year=2025&year_comparacion=2024
```

#### Respuesta Exitosa (200):

```json
{
  "success": true,
  "message": "Comparativa anual obtenida exitosamente",
  "data": {
    "periodo": {
      "yearBase": 2024,
      "yearComparacion": 2025
    },
    "resumen": {
      "ventasYear1": 1055000.00,
      "ventasYear2": 1298978.50,
      "crecimiento": 23.13,
      "diferencia": 243978.50
    },
    "evolucionYear1": [
      {
        "mes": 1,
        "mesNombre": "enero",
        "mesAbreviado": "ene",
        "ventas": 87500.00,
        "ordenes": 32,
        "promedioOrden": 2734.38
      }
      // ... resto de meses 2024
    ],
    "evolucionYear2": [
      {
        "mes": 1,
        "mesNombre": "enero",
        "mesAbreviado": "ene",
        "ventas": 105234.50,
        "ordenes": 38,
        "promedioOrden": 2769.33
      }
      // ... resto de meses 2025
    ],
    "analisisMensual": [
      {
        "mes": 1,
        "mesNombre": "enero",
        "mesAbreviado": "ene",
        "ventasYear1": 87500.00,
        "ventasYear2": 105234.50,
        "diferencia": 17734.50,
        "crecimientoMes": 20.27
      }
      // ... resto de meses con crecimiento
    ]
  }
}
```

#### Casos de Uso:

- **Análisis año sobre año** - Evaluar crecimiento del negocio
- **Gráficos comparativos** - Líneas duales para visualización
- **Reportes ejecutivos** - KPIs de crecimiento

---

### 4. Top Productos

Obtiene los N productos más vendidos con análisis Pareto (80/20).

#### **GET** `/api/dashboard/top-productos`

#### Query Parameters:

| Parámetro | Tipo    | Requerido | Descripción                    | Ejemplo |
|-----------|---------|-----------|--------------------------------|---------|
| `year`    | integer | ✅ Sí     | Año a consultar                | 2025    |
| `month`   | integer | ❌ No     | Mes a consultar (1-12)         | 3       |
| `limit`   | integer | ❌ No     | Cantidad de productos (max: 50) | 10     |

#### Validaciones:

- `year` debe ser un número válido
- `month` debe estar entre 1 y 12 si se proporciona
- `limit` máximo es 50 (default: 10)

#### Ejemplo de Solicitud:

```bash
# Top 10 productos del año
GET /api/dashboard/top-productos?year=2025&limit=10

# Top 5 productos de marzo
GET /api/dashboard/top-productos?year=2025&month=3&limit=5
```

#### Respuesta Exitosa (200):

```json
{
  "success": true,
  "message": "Top productos obtenido exitosamente",
  "data": {
    "periodo": {
      "year": 2025,
      "month": "todos",
      "mesNombre": "Todos los meses"
    },
    "resumen": {
      "totalVentas": 325450.75,
      "totalUnidades": 1234,
      "productosAnalizados": 10,
      "limite": 10
    },
    "productos": [
      {
        "id": 15,
        "nombre": "Omega 3 Fish Oil",
        "imagen_url": "https://ejemplo.com/omega3.jpg",
        "precioActual": 25.00,
        "totalVentas": 45600.00,
        "unidadesVendidas": 234,
        "precioPromedio": 194.87,
        "porcentajeDelTotal": 14.01,
        "porcentajeAcumulado": 14.01,
        "posicion": 1
      },
      {
        "id": 23,
        "nombre": "Whey Protein Isolate",
        "imagen_url": "https://ejemplo.com/whey.jpg",
        "precioActual": 89.99,
        "totalVentas": 38750.50,
        "unidadesVendidas": 156,
        "precioPromedio": 248.40,
        "porcentajeDelTotal": 11.91,
        "porcentajeAcumulado": 25.92,
        "posicion": 2
      }
      // ... resto de productos hasta el límite
    ]
  }
}
```

#### Análisis Pareto:

El campo `porcentajeAcumulado` permite identificar qué productos generan el 80% de las ventas:

- Productos con `porcentajeAcumulado <= 80%` son críticos (regla 80/20)
- Útil para gestión de inventario y estrategias de marketing

#### Casos de Uso:

- **Análisis Pareto** - Identificar productos estrella
- **Gestión de inventario** - Priorizar productos clave
- **Estrategia de ventas** - Enfocar esfuerzos en top performers

---

### 5. Análisis de Categorías

Obtiene la distribución de ventas por categoría con porcentajes.

#### **GET** `/api/dashboard/analisis-categorias`

#### Query Parameters:

| Parámetro | Tipo    | Requerido | Descripción            | Ejemplo |
|-----------|---------|-----------|------------------------|---------|
| `year`    | integer | ✅ Sí     | Año a consultar        | 2025    |
| `month`   | integer | ❌ No     | Mes a consultar (1-12) | 3       |

#### Validaciones:

- `year` debe ser un número válido
- `month` debe estar entre 1 y 12 si se proporciona

#### Ejemplo de Solicitud:

```bash
# Análisis de categorías del año
GET /api/dashboard/analisis-categorias?year=2025

# Análisis de categorías de marzo
GET /api/dashboard/analisis-categorias?year=2025&month=3
```

#### Respuesta Exitosa (200):

```json
{
  "success": true,
  "message": "Análisis de categorías obtenido exitosamente",
  "data": {
    "periodo": {
      "year": 2025,
      "month": "todos",
      "mesNombre": "Todos los meses"
    },
    "resumen": {
      "totalVentas": 1298978.50,
      "categoriasConVentas": 8,
      "totalProductosUnicos": 67
    },
    "categorias": [
      {
        "id": 3,
        "nombre": "Creatinas",
        "totalVentas": 345600.25,
        "productosUnicos": 12,
        "porcentaje": 26.61
      },
      {
        "id": 1,
        "nombre": "Proteínas",
        "totalVentas": 298450.50,
        "productosUnicos": 18,
        "porcentaje": 22.98
      },
      {
        "id": 5,
        "nombre": "Pre-Entreno",
        "totalVentas": 187320.75,
        "productosUnicos": 9,
        "porcentaje": 14.42
      }
      // ... resto de categorías ordenadas por ventas
    ]
  }
}
```

#### Casos de Uso:

- **Gráfico de pastel (pie chart)** - Distribución visual
- **Análisis de categorías** - Identificar categorías fuertes/débiles
- **Planificación de compras** - Asignar presupuesto por categoría

---

## 📋 Códigos de Respuesta

| Código | Estado                | Descripción                                      |
|--------|-----------------------|--------------------------------------------------|
| 200    | OK                    | Solicitud exitosa                                |
| 400    | Bad Request           | Parámetros inválidos o faltantes                 |
| 401    | Unauthorized          | Headers de autenticación faltantes o inválidos   |
| 403    | Forbidden             | Rol sin permisos para acceder al endpoint        |
| 500    | Internal Server Error | Error interno del servidor                       |

---

## ❌ Ejemplos de Errores

### Error 400 - Parámetros Inválidos

```json
{
  "success": false,
  "message": "El año es requerido",
  "error": "Bad Request"
}
```

```json
{
  "success": false,
  "message": "El mes debe estar entre 1 y 12",
  "error": "Bad Request"
}
```

```json
{
  "success": false,
  "message": "El tipo debe ser \"mensual\" o \"diario\"",
  "error": "Bad Request"
}
```

```json
{
  "success": false,
  "message": "El año de comparación debe ser mayor al año base",
  "error": "Bad Request"
}
```

### Error 401 - No Autenticado

```json
{
  "success": false,
  "message": "Headers de autenticación requeridos",
  "error": "Unauthorized"
}
```

```json
{
  "success": false,
  "message": "Credenciales inválidas",
  "error": "Unauthorized"
}
```

### Error 403 - Sin Permisos

```json
{
  "success": false,
  "message": "No tienes permisos para acceder a este recurso",
  "error": "Forbidden"
}
```

### Error 500 - Error Interno

```json
{
  "success": false,
  "message": "Error interno del servidor",
  "error": "Internal Server Error"
}
```

---

## 📊 Diagrama de Flujo

### Arquitectura de la API de Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Frontend)                       │
│              (React, Astro, Vue, o cualquier SPA)               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │ HTTP Request
                                │ Headers: x-admin-user, x-admin-password
                                │ Query Params: year, month, tipo, limit
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS SERVER (Node.js)                  │
│                         Puerto: 3000                            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE DE AUTENTICACIÓN                  │
│                     (requireAdminAuth)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Extraer headers x-admin-user, x-admin-password       │  │
│  │ 2. Buscar administrador en BD                           │  │
│  │ 3. Verificar password con bcrypt                        │  │
│  │ 4. Adjuntar admin al request                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE DE ROLES                          │
│                      (requireRole)                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Roles Autorizados:                                       │  │
│  │ - administrador                                          │  │
│  │ - gerente                                                │  │
│  │ - asesor de ventas                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RUTAS DE DASHBOARD                           │
│                  (/api/dashboard/*)                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ GET /general              → getDashboardGeneral()        │  │
│  │ GET /ventas-periodo       → getVentasPorPeriodo()        │  │
│  │ GET /comparativa-anual    → getComparativaAnual()        │  │
│  │ GET /top-productos        → getTopProductos()            │  │
│  │ GET /analisis-categorias  → getAnalisisCategorias()      │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│               CONTROLADOR DE DASHBOARD                          │
│           (src/controllers/dashboard.js)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Validación de Parámetros:                                │  │
│  │ - year (requerido, integer)                              │  │
│  │ - month (opcional, 1-12)                                 │  │
│  │ - tipo (mensual/diario)                                  │  │
│  │ - limit (max: 50)                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Funciones Helper:                                        │  │
│  │ - getVentasTotales(year, month)                          │  │
│  │ - getProductoTop(year, month)                            │  │
│  │ - getCategoriaTop(year, month)                           │  │
│  │ - getEvolucionMensual(year)                              │  │
│  │ - getEvolucionDiaria(year, month)                        │  │
│  │ - getComparativaAnualData(year1, year2)                  │  │
│  │ - getTopNProductos(year, month, limit)                   │  │
│  │ - calcularPareto(productos)                              │  │
│  │ - getDistribucionCategorias(year, month)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE CLIENT                              │
│                  (PostgreSQL Cloud)                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Tablas Utilizadas:                                       │  │
│  │                                                          │  │
│  │ ┌────────────┐  ┌──────────────┐  ┌─────────────┐      │  │
│  │ │  ordenes   │  │detalle_orden │  │  productos  │      │  │
│  │ │------------|  │--------------|  │-------------|      │  │
│  │ │ id         │  │ id           │  │ id          │      │  │
│  │ │ cliente    │  │ orden_id  ◄──┼──┤ nombre      │      │  │
│  │ │ total      │  │ producto_id ─┼──┼►precio      │      │  │
│  │ │ estado     │  │ cantidad     │  │ imagen_url  │      │  │
│  │ │ fecha      │  │ precio_unit  │  └─────────────┘      │  │
│  │ └────────────┘  └──────────────┘                       │  │
│  │                                                          │  │
│  │ ┌─────────────┐  ┌───────────────────┐                 │  │
│  │ │ categorias  │  │producto_categoria │                 │  │
│  │ │-------------|  │-------------------|                 │  │
│  │ │ id          │◄─┤ categoria_id      │                 │  │
│  │ │ nombre      │  │ producto_id       │                 │  │
│  │ └─────────────┘  └───────────────────┘                 │  │
│  │                                                          │  │
│  │ Estados Válidos: ['pagado', 'enviado', 'completado']    │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │ Query Results
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PROCESAMIENTO DE DATOS                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ - Agrupación (GROUP BY mes, día, producto, categoría)   │  │
│  │ - Agregación (SUM, COUNT, AVG)                           │  │
│  │ - Cálculos (porcentajes, crecimientos, Pareto)          │  │
│  │ - Formateo (2 decimales para montos)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │ JSON Response
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         RESPUESTA                               │
│  {                                                              │
│    "success": true,                                             │
│    "message": "...",                                            │
│    "data": { ... }                                              │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de una Consulta Típica:

```
1. Cliente envía request → /api/dashboard/general?year=2025
2. Express recibe y pasa por middleware de autenticación
3. Middleware valida headers y verifica usuario/password
4. Middleware de roles verifica que el usuario tenga permiso
5. Controller valida parámetros (year=2025, month=null)
6. Controller ejecuta 3 queries en paralelo con Promise.all:
   - getVentasTotales(2025, null)
   - getProductoTop(2025, null)
   - getCategoriaTop(2025, null)
7. Supabase ejecuta queries con filtros de estado y fecha
8. Datos se agregan y procesan en JavaScript
9. Respuesta se formatea como JSON con sendResponse()
10. Cliente recibe datos estructurados listos para visualizar
```

---

## ⚡ Optimización y Mejores Prácticas

### 1. Índices Recomendados en Base de Datos

Para mejorar el rendimiento de las consultas, se recomienda crear los siguientes índices:

```sql
-- Índices para tabla ordenes
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha 
  ON ordenes(fecha);
  
CREATE INDEX IF NOT EXISTS idx_ordenes_estado 
  ON ordenes(estado);
  
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha_estado 
  ON ordenes(fecha, estado);

-- Índices para tabla detalle_orden
CREATE INDEX IF NOT EXISTS idx_detalle_orden_orden_id 
  ON detalle_orden(orden_id);
  
CREATE INDEX IF NOT EXISTS idx_detalle_orden_producto_id 
  ON detalle_orden(producto_id);

-- Índices para tabla producto_categoria
CREATE INDEX IF NOT EXISTS idx_producto_categoria_producto_id 
  ON producto_categoria(producto_id);
  
CREATE INDEX IF NOT EXISTS idx_producto_categoria_categoria_id 
  ON producto_categoria(categoria_id);
```

**Impacto esperado:**
- Dashboard general: 200ms → 100ms (50% más rápido)
- Evolución mensual: 150ms → 80ms
- Top productos: 300ms → 150ms

### 2. Tiempos de Respuesta Objetivo

| Endpoint              | Tiempo Objetivo | Tiempo Aceptable | Acción si Excede |
|-----------------------|-----------------|------------------|------------------|
| `/general`            | < 300ms         | < 500ms          | Revisar queries  |
| `/ventas-periodo`     | < 200ms         | < 400ms          | Agregar índices  |
| `/comparativa-anual`  | < 400ms         | < 700ms          | Optimizar JOIN   |
| `/top-productos`      | < 250ms         | < 500ms          | Limitar datos    |
| `/analisis-categorias`| < 300ms         | < 600ms          | Cachear categorías|

### 3. Estrategias de Caché (Futuro)

```javascript
// Implementación sugerida con Redis o caché en memoria

const CACHE_CONFIG = {
  // Datos que cambian poco
  categorias: 1800000,      // 30 minutos
  productos: 900000,        // 15 minutos
  
  // Datos que cambian frecuentemente
  dashboard_general: 300000, // 5 minutos
  ventas_periodo: 300000,    // 5 minutos
  
  // Datos históricos (no cambian)
  comparativa_anual: 3600000 // 1 hora
};
```

### 4. Paginación para Grandes Volúmenes

Si el sistema crece y tiene muchos productos/categorías:

```javascript
// Agregar paginación a top-productos
GET /api/dashboard/top-productos?year=2025&limit=20&offset=0

// Respuesta incluye metadata
{
  "data": {
    "productos": [...],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### 5. Compresión de Respuestas

Habilitar compresión gzip en Express:

```javascript
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    // Comprimir solo respuestas > 1KB
    return res.getHeader('Content-Length') > 1024;
  }
}));
```

**Beneficio:** Reducción de 60-80% en tamaño de respuesta para arrays grandes.

### 6. Consultas Paralelas

Ya implementado en el código mediante `Promise.all()`:

```javascript
// ✅ CORRECTO: Ejecutar en paralelo
const [ventas, productos, categorias] = await Promise.all([
  getVentasTotales(year, month),
  getProductoTop(year, month),
  getCategoriaTop(year, month)
]);

// ❌ INCORRECTO: Ejecutar en serie (más lento)
const ventas = await getVentasTotales(year, month);
const productos = await getProductoTop(year, month);
const categorias = await getCategoriaTop(year, month);
```

### 7. Monitoreo de Performance

Registrar tiempos de ejecución:

```javascript
// Ya implementado con logQuery()
logQuery('dashboard', 'general', { year, month, duration: 234 });

// Analizar logs para identificar queries lentas
// Buscar patrones: queries que toman > 500ms consistentemente
```

### 8. Límites y Throttling

Proteger el servidor de sobrecarga:

```javascript
// Configuración recomendada en constants.js
export const DASHBOARD_LIMITS = {
  MAX_YEAR_RANGE: 5,        // Máximo 5 años de diferencia
  MAX_TOP_PRODUCTOS: 50,    // Ya implementado
  MAX_REQUESTS_PER_MIN: 60  // Rate limiting futuro
};
```

### 9. Validación de Entrada

Ya implementado pero considerar agregar:

```javascript
// Validar que year no sea futuro
const currentYear = new Date().getFullYear();
if (year > currentYear + 1) {
  return sendError(res, 400, 'El año no puede ser tan futuro');
}

// Validar rangos razonables
if (year < 2020) {
  return sendError(res, 400, 'Año fuera de rango válido');
}
```

### 10. Manejo de Datos Vacíos

El código ya maneja correctamente casos sin datos:

```javascript
// Siempre inicializar estructuras completas
const mesesMap = {};
for (let i = 1; i <= 12; i++) {
  mesesMap[i] = { mes: i, ventas: 0, ordenes: 0 };
}

// Esto evita que falten meses en gráficas
```

### 11. Documentación de Queries

Agregar comentarios en queries complejas:

```javascript
// Query para obtener top productos con JOIN a ordenes
// Filtra por estado: pagado, enviado, completado
// Agrupa por producto_id para sumar ventas totales
const query = supabase
  .from('detalle_orden')
  .select(...)
  .in('ordenes.estado', ESTADOS_VALIDOS);
```

### 12. Logs Estructurados

Implementar logging estructurado para debugging:

```javascript
console.log({
  endpoint: 'dashboard/general',
  year: 2025,
  month: null,
  duration: '234ms',
  resultCount: 3,
  timestamp: new Date().toISOString()
});
```

---

## 🎯 Checklist de Optimización

- ✅ Índices creados en tablas principales
- ✅ Consultas paralelas con Promise.all()
- ✅ Validación de parámetros completa
- ✅ Manejo de casos sin datos
- ✅ Formateo consistente (2 decimales)
- ✅ Logging de queries
- ⬜ Implementar caché (futuro)
- ⬜ Agregar rate limiting (futuro)
- ⬜ Monitoreo de performance (futuro)
- ⬜ Tests de carga (futuro)

---

## 📞 Soporte

**Proyecto:** Black Gym Backend  
**Versión API:** 1.0.0  
**Documentación:** Este archivo (DASHBOARD_API.md)

**Recursos Adicionales:**
- `GUIA_DASHBOARD_VENTAS.md` - Guía de implementación completa
- `TECHNICAL_MANUAL.md` - Manual técnico general del proyecto
- `src/controllers/dashboard.js` - Código fuente del controlador

---

**Última Actualización:** 3 de octubre de 2025  
**Mantenido por:** Equipo de Desarrollo Black Gym
