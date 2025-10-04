# 📊 GUÍA DE IMPLEMENTACIÓN: DASHBOARD DE VENTAS

**Proyecto:** Black Gym Backend  
**Fecha de Creación:** 3 de octubre de 2025  
**Objetivo:** Implementar endpoints para el dashboard de ventas utilizando ÚNICAMENTE la estructura de base de datos existente, SIN modificaciones.

---

## 📋 TABLA DE CONTENIDO

1. [Alcance del Proyecto](#alcance-del-proyecto)
2. [Gráficas Implementables](#gráficas-implementables)
3. [Fase 1: Preparación](#fase-1-preparación)
4. [Fase 2: Endpoints de Métricas Básicas](#fase-2-endpoints-de-métricas-básicas)
5. [Fase 3: Endpoints de Análisis Temporal](#fase-3-endpoints-de-análisis-temporal)
6. [Fase 4: Endpoints de Análisis por Categoría y Producto](#fase-4-endpoints-de-análisis-por-categoría-y-producto)
7. [Fase 5: Testing y Optimización](#fase-5-testing-y-optimización)
8. [Fase 6: Documentación Final](#fase-6-documentación-final)

---

## 🎯 ALCANCE DEL PROYECTO

### ✅ Gráficas que SÍ podemos implementar (SIN modificar BD):

1. **Ventas Totales** - Suma total de ventas en el periodo
2. **Producto Top** - Producto más vendido con su total
3. **Categoría Top** - Categoría con más ventas
4. **Evolución Mensual** - Gráfico de ventas por mes (solo ventas, no ganancias)
5. **Evolución Diaria** - Ventas por día del mes seleccionado
6. **Comparativa Anual** - Comparación de ventas año actual vs anterior
7. **Distribución por Categoría** - Pie chart con ventas por categoría
8. **Top 5 Productos Más Vendidos** - Con análisis Pareto
9. **Análisis de Crecimiento** - Porcentajes de crecimiento mensual

### ❌ Gráficas que NO podemos implementar (Requieren modificar BD):

1. **Ganancia Total y %** - Requiere campo `costo` en productos
2. **Tipo de Venta (Online/Local)** - Requiere campo `tipo_venta` en ordenes
3. **Tipo de Pago (Transferencia/Efectivo)** - Requiere campo `tipo_pago` en ordenes
4. **Mapa de Calor por Rendimiento** - Requiere métricas de ganancia

---

## 📊 GRÁFICAS IMPLEMENTABLES

### Dashboard Principal:
```
┌─────────────────────────────────────────────────────────┐
│  DASHBOARD DE VENTAS - TU NEGOCIO                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Año: 2025 ▼]  [Mes: Todos ▼]  [Exportar CSV] [📷]   │
│                                                          │
├──────────────┬──────────────┬──────────────────────────┤
│ VENTAS       │ PRODUCTO     │ CATEGORÍA TOP            │
│ TOTALES      │ TOP          │                          │
│ Q 1,298,978  │ Omega 3...   │ Creatinas                │
│              │ Q 4,496      │ Q 140,651                │
├──────────────┴──────────────┴──────────────────────────┤
│                                                          │
│  📈 EVOLUCIÓN MENSUAL (Ventas)                          │
│  [Gráfico de barras por mes]                           │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  📊 EVOLUCIÓN DIARIA                                     │
│  [Gráfico de líneas por día del mes]                   │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  📈 COMPARATIVA ANUAL                                    │
│  2025 vs 2024 | +23.08% crecimiento                    │
│                                                          │
├─────────────────────┬────────────────────────────────────┤
│ 🍩 DISTRIBUCIÓN     │ 📊 TOP 5 PRODUCTOS                │
│    POR CATEGORÍA    │    MÁS VENDIDOS                   │
│                     │                                    │
└─────────────────────┴────────────────────────────────────┘
```

---

## 🚀 FASE 1: PREPARACIÓN ✅

**Objetivo:** Configurar la estructura base para los endpoints del dashboard.

### Checklist:

- [x] **1.1** Crear archivo `src/controllers/dashboard.js`
- [x] **1.2** Crear archivo `src/routes/dashboard.js`
- [x] **1.3** Registrar rutas de dashboard en `server.js`
- [x] **1.4** Agregar constantes para dashboard en `src/utils/constants.js`
- [x] **1.5** Crear funciones helper en `src/config/database.js` para queries complejas

### 1.1 - Crear Controller de Dashboard

**Archivo:** `src/controllers/dashboard.js`

```javascript
import { supabase, logQuery } from '../config/supabase.js';
import { sendResponse, sendError } from '../utils/validators.js';
import { HTTP_STATUS, TABLES } from '../utils/constants.js';

/**
 * Controlador para el Dashboard de Ventas
 * Todos los endpoints utilizan la estructura de BD existente
 * SIN modificaciones
 */

// Exportar funciones (se implementarán en fases siguientes)
export const getDashboardGeneral = async (req, res, next) => {
  // TODO: Implementar en Fase 2
};

export const getVentasPorPeriodo = async (req, res, next) => {
  // TODO: Implementar en Fase 3
};

export const getTopProductos = async (req, res, next) => {
  // TODO: Implementar en Fase 4
};

export const getAnalisisCategorias = async (req, res, next) => {
  // TODO: Implementar en Fase 4
};

export const getComparativaAnual = async (req, res, next) => {
  // TODO: Implementar en Fase 3
};

export const exportarDashboardCSV = async (req, res, next) => {
  // TODO: Implementar en Fase 5
};
```

### 1.2 - Crear Routes de Dashboard

**Archivo:** `src/routes/dashboard.js`

```javascript
import express from 'express';
import {
  getDashboardGeneral,
  getVentasPorPeriodo,
  getTopProductos,
  getAnalisisCategorias,
  getComparativaAnual,
  exportarDashboardCSV
} from '../controllers/dashboard.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

/**
 * Rutas del Dashboard de Ventas
 * Acceso: Administrador, Gerente, Asesor de Ventas
 */

// Todas las rutas requieren autenticación y roles específicos
const dashboardAuth = [
  requireAdminAuth,
  requireRole(['administrador', 'gerente', 'asesor de ventas'])
];

// GET /api/dashboard/general - Dashboard completo con todas las métricas
router.get('/general', ...dashboardAuth, getDashboardGeneral);

// GET /api/dashboard/ventas-periodo - Ventas en periodo específico
router.get('/ventas-periodo', ...dashboardAuth, getVentasPorPeriodo);

// GET /api/dashboard/top-productos - Top productos más vendidos
router.get('/top-productos', ...dashboardAuth, getTopProductos);

// GET /api/dashboard/analisis-categorias - Análisis de ventas por categoría
router.get('/analisis-categorias', ...dashboardAuth, getAnalisisCategorias);

// GET /api/dashboard/comparativa-anual - Comparar ventas entre años
router.get('/comparativa-anual', ...dashboardAuth, getComparativaAnual);

// GET /api/dashboard/exportar-csv - Exportar datos a CSV
router.get('/exportar-csv', ...dashboardAuth, exportarDashboardCSV);

export default router;
```

### 1.3 - Registrar rutas en server.js

**Archivo:** `server.js`

```javascript
// Agregar import
import dashboardRoutes from './src/routes/dashboard.js';

// Agregar ruta (después de las otras rutas)
app.use('/api/dashboard', dashboardRoutes);
```

### 1.4 - Agregar constantes

**Archivo:** `src/utils/constants.js`

```javascript
// Agregar al final del archivo:

export const DASHBOARD = {
  MESES: [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ],
  MESES_ABREVIADOS: [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
  ],
  ESTADOS_VALIDOS_PARA_VENTAS: ['pagado', 'enviado', 'completado'],
  LIMITE_TOP_PRODUCTOS: 10,
  LIMITE_TOP_CATEGORIAS: 10
};
```

---

## 📊 FASE 2: ENDPOINTS DE MÉTRICAS BÁSICAS ✅

**Objetivo:** Implementar métricas principales del dashboard.

### Checklist:

- [x] **2.1** Implementar función para obtener ventas totales
- [x] **2.2** Implementar función para obtener producto top
- [x] **2.3** Implementar función para obtener categoría top
- [x] **2.4** Implementar función para contar órdenes totales
- [x] **2.5** Implementar endpoint `getDashboardGeneral` que combine todas las métricas
- [x] **2.6** Probar endpoint con Postman/Thunder Client

### 2.1 - Función: Ventas Totales

**Agregar a:** `src/controllers/dashboard.js`

```javascript
/**
 * Obtener ventas totales en un periodo
 * @param {number} year - Año a consultar
 * @param {number|null} month - Mes a consultar (null = todos los meses)
 * @returns {Promise<Object>}
 */
export const getVentasTotales = async (year, month = null) => {
  try {
    let query = supabase
      .from('ordenes')
      .select('total, fecha')
      .in('estado', ['pagado', 'enviado', 'completado'])
      .gte('fecha', `${year}-01-01`)
      .lte('fecha', `${year}-12-31`);

    if (month !== null) {
      const monthStr = String(month).padStart(2, '0');
      query = query
        .gte('fecha', `${year}-${monthStr}-01`)
        .lt('fecha', `${year}-${monthStr}-31`);
    }

    const { data, error } = await query;
    
    if (error) throw error;

    const totalVentas = data.reduce((sum, orden) => sum + parseFloat(orden.total), 0);
    const totalOrdenes = data.length;
    const promedioOrden = totalOrdenes > 0 ? totalVentas / totalOrdenes : 0;

    return {
      totalVentas: parseFloat(totalVentas.toFixed(2)),
      totalOrdenes,
      promedioOrden: parseFloat(promedioOrden.toFixed(2))
    };
  } catch (error) {
    console.error('Error en getVentasTotales:', error);
    throw error;
  }
};
```

### 2.2 - Función: Producto Top

```javascript
/**
 * Obtener el producto más vendido en un periodo
 * @param {number} year - Año a consultar
 * @param {number|null} month - Mes a consultar
 * @returns {Promise<Object>}
 */
export const getProductoTop = async (year, month = null) => {
  try {
    // Query para obtener producto más vendido
    const { data, error } = await supabase
      .rpc('get_producto_top', { 
        p_year: year, 
        p_month: month 
      });

    if (error && error.code === '42883') {
      // Si la función no existe, hacer query manual
      let query = supabase
        .from('detalle_orden')
        .select(`
          producto_id,
          cantidad,
          precio_unitario,
          ordenes!inner (
            fecha,
            estado
          ),
          productos (
            id,
            nombre,
            imagen_url
          )
        `)
        .in('ordenes.estado', ['pagado', 'enviado', 'completado'])
        .gte('ordenes.fecha', `${year}-01-01`)
        .lte('ordenes.fecha', `${year}-12-31`);

      if (month !== null) {
        const monthStr = String(month).padStart(2, '0');
        query = query
          .gte('ordenes.fecha', `${year}-${monthStr}-01`)
          .lt('ordenes.fecha', `${year}-${monthStr}-31`);
      }

      const { data: detalles, error: detallesError } = await query;
      
      if (detallesError) throw detallesError;

      // Agrupar por producto
      const productosMap = {};
      
      detalles.forEach(detalle => {
        const productoId = detalle.producto_id;
        if (!productosMap[productoId]) {
          productosMap[productoId] = {
            id: detalle.productos.id,
            nombre: detalle.productos.nombre,
            imagen_url: detalle.productos.imagen_url,
            totalVentas: 0,
            unidadesVendidas: 0
          };
        }
        
        productosMap[productoId].totalVentas += detalle.cantidad * detalle.precio_unitario;
        productosMap[productoId].unidadesVendidas += detalle.cantidad;
      });

      // Encontrar el producto con más ventas
      const productos = Object.values(productosMap);
      const productoTop = productos.reduce((max, producto) => 
        producto.totalVentas > max.totalVentas ? producto : max
      , productos[0] || { totalVentas: 0 });

      return {
        id: productoTop.id,
        nombre: productoTop.nombre,
        imagen_url: productoTop.imagen_url,
        totalVentas: parseFloat(productoTop.totalVentas.toFixed(2)),
        unidadesVendidas: productoTop.unidadesVendidas
      };
    }

    if (error) throw error;

    return data[0] || null;
  } catch (error) {
    console.error('Error en getProductoTop:', error);
    throw error;
  }
};
```

### 2.3 - Función: Categoría Top

```javascript
/**
 * Obtener la categoría más vendida en un periodo
 * @param {number} year - Año a consultar
 * @param {number|null} month - Mes a consultar
 * @returns {Promise<Object>}
 */
export const getCategoriaTop = async (year, month = null) => {
  try {
    let query = supabase
      .from('detalle_orden')
      .select(`
        producto_id,
        cantidad,
        precio_unitario,
        ordenes!inner (
          fecha,
          estado
        )
      `)
      .in('ordenes.estado', ['pagado', 'enviado', 'completado'])
      .gte('ordenes.fecha', `${year}-01-01`)
      .lte('ordenes.fecha', `${year}-12-31`);

    if (month !== null) {
      const monthStr = String(month).padStart(2, '0');
      query = query
        .gte('ordenes.fecha', `${year}-${monthStr}-01`)
        .lt('ordenes.fecha', `${year}-${monthStr}-31`);
    }

    const { data: detalles, error: detallesError } = await query;
    
    if (detallesError) throw detallesError;

    // Obtener productos con sus categorías
    const productoIds = [...new Set(detalles.map(d => d.producto_id))];
    
    const { data: productosCategorias, error: pcError } = await supabase
      .from('producto_categoria')
      .select(`
        producto_id,
        categorias (
          id,
          nombre
        )
      `)
      .in('producto_id', productoIds);

    if (pcError) throw pcError;

    // Mapear ventas por categoría
    const categoriasMap = {};
    
    detalles.forEach(detalle => {
      const categoriasDelProducto = productosCategorias.filter(
        pc => pc.producto_id === detalle.producto_id
      );

      categoriasDelProducto.forEach(pc => {
        const catId = pc.categorias.id;
        const catNombre = pc.categorias.nombre;
        
        if (!categoriasMap[catId]) {
          categoriasMap[catId] = {
            id: catId,
            nombre: catNombre,
            totalVentas: 0
          };
        }
        
        categoriasMap[catId].totalVentas += detalle.cantidad * detalle.precio_unitario;
      });
    });

    // Encontrar categoría con más ventas
    const categorias = Object.values(categoriasMap);
    const categoriaTop = categorias.reduce((max, cat) => 
      cat.totalVentas > max.totalVentas ? cat : max
    , categorias[0] || { totalVentas: 0 });

    return {
      id: categoriaTop.id,
      nombre: categoriaTop.nombre,
      totalVentas: parseFloat(categoriaTop.totalVentas.toFixed(2))
    };
  } catch (error) {
    console.error('Error en getCategoriaTop:', error);
    throw error;
  }
};
```

### 2.5 - Endpoint: Dashboard General

```javascript
/**
 * GET /api/dashboard/general
 * Obtiene todas las métricas principales del dashboard
 * Query params: year (requerido), month (opcional)
 */
export const getDashboardGeneral = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year);
    const month = req.query.month ? parseInt(req.query.month) : null;

    if (!year || isNaN(year)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El año es requerido y debe ser válido');
    }

    if (month !== null && (isNaN(month) || month < 1 || month > 12)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El mes debe estar entre 1 y 12');
    }

    logQuery('dashboard', 'get_general', { year, month });

    // Obtener todas las métricas en paralelo
    const [ventasTotales, productoTop, categoriaTop] = await Promise.all([
      getVentasTotales(year, month),
      getProductoTop(year, month),
      getCategoriaTop(year, month)
    ]);

    const dashboard = {
      periodo: {
        year,
        month: month || 'todos',
        mesNombre: month ? DASHBOARD.MESES[month - 1] : 'Todos los meses'
      },
      metricas: {
        ventasTotales: ventasTotales.totalVentas,
        totalOrdenes: ventasTotales.totalOrdenes,
        promedioOrden: ventasTotales.promedioOrden,
        productoTop: productoTop,
        categoriaTop: categoriaTop
      }
    };

    sendResponse(res, HTTP_STATUS.OK, dashboard, 'Dashboard obtenido exitosamente');

  } catch (error) {
    next(error);
  }
};
```

### 2.6 - Ejemplo de Respuesta

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
      "ventasTotales": 1298978.00,
      "totalOrdenes": 458,
      "promedioOrden": 2835.73,
      "productoTop": {
        "id": 15,
        "nombre": "Omega 3 Fish Oil",
        "imagen_url": "https://...",
        "totalVentas": 4496.00,
        "unidadesVendidas": 234
      },
      "categoriaTop": {
        "id": 3,
        "nombre": "Creatinas",
        "totalVentas": 140651.00
      }
    }
  }
}
```

---

## 📈 FASE 3: ENDPOINTS DE ANÁLISIS TEMPORAL

**Objetivo:** Implementar análisis de ventas por tiempo (mensual, diario, comparativas).

### Checklist:

- [x] **3.1** Implementar función para evolución mensual
- [x] **3.2** Implementar función para evolución diaria
- [x] **3.3** Implementar función para comparativa anual
- [x] **3.4** Implementar función para análisis de crecimiento
- [x] **3.5** Implementar endpoint `getVentasPorPeriodo`
- [x] **3.6** Implementar endpoint `getComparativaAnual`
- [x] **3.7** Probar endpoints con diferentes rangos de fechas

### 3.1 - Función: Evolución Mensual

```javascript
/**
 * Obtener ventas por mes en un año
 * @param {number} year - Año a consultar
 * @returns {Promise<Array>}
 */
export const getEvolucionMensual = async (year) => {
  try {
    const { data, error } = await supabase
      .from('ordenes')
      .select('total, fecha')
      .in('estado', ['pagado', 'enviado', 'completado'])
      .gte('fecha', `${year}-01-01`)
      .lte('fecha', `${year}-12-31`)
      .order('fecha');

    if (error) throw error;

    // Agrupar por mes
    const mesesMap = {};
    
    // Inicializar todos los meses en 0
    for (let i = 1; i <= 12; i++) {
      mesesMap[i] = {
        mes: i,
        mesNombre: DASHBOARD.MESES[i - 1],
        mesAbreviado: DASHBOARD.MESES_ABREVIADOS[i - 1],
        ventas: 0,
        ordenes: 0
      };
    }

    // Sumar ventas por mes
    data.forEach(orden => {
      const fecha = new Date(orden.fecha);
      const mes = fecha.getMonth() + 1; // 1-12
      
      mesesMap[mes].ventas += parseFloat(orden.total);
      mesesMap[mes].ordenes += 1;
    });

    // Convertir a array y calcular promedios
    const evolucion = Object.values(mesesMap).map(mes => ({
      ...mes,
      ventas: parseFloat(mes.ventas.toFixed(2)),
      promedioOrden: mes.ordenes > 0 ? parseFloat((mes.ventas / mes.ordenes).toFixed(2)) : 0
    }));

    return evolucion;
  } catch (error) {
    console.error('Error en getEvolucionMensual:', error);
    throw error;
  }
};
```

### 3.2 - Función: Evolución Diaria

```javascript
/**
 * Obtener ventas por día en un mes específico
 * @param {number} year - Año a consultar
 * @param {number} month - Mes a consultar (1-12)
 * @returns {Promise<Array>}
 */
export const getEvolucionDiaria = async (year, month) => {
  try {
    const monthStr = String(month).padStart(2, '0');
    const diasEnMes = new Date(year, month, 0).getDate();

    const { data, error } = await supabase
      .from('ordenes')
      .select('total, fecha')
      .in('estado', ['pagado', 'enviado', 'completado'])
      .gte('fecha', `${year}-${monthStr}-01`)
      .lte('fecha', `${year}-${monthStr}-${diasEnMes}`)
      .order('fecha');

    if (error) throw error;

    // Inicializar todos los días
    const diasMap = {};
    for (let i = 1; i <= diasEnMes; i++) {
      diasMap[i] = {
        dia: i,
        fecha: `${year}-${monthStr}-${String(i).padStart(2, '0')}`,
        ventas: 0,
        ordenes: 0
      };
    }

    // Sumar ventas por día
    data.forEach(orden => {
      const fecha = new Date(orden.fecha);
      const dia = fecha.getDate();
      
      diasMap[dia].ventas += parseFloat(orden.total);
      diasMap[dia].ordenes += 1;
    });

    const evolucion = Object.values(diasMap).map(dia => ({
      ...dia,
      ventas: parseFloat(dia.ventas.toFixed(2))
    }));

    return evolucion;
  } catch (error) {
    console.error('Error en getEvolucionDiaria:', error);
    throw error;
  }
};
```

### 3.3 - Función: Comparativa Anual

```javascript
/**
 * Comparar ventas entre dos años
 * @param {number} year1 - Primer año
 * @param {number} year2 - Segundo año
 * @returns {Promise<Object>}
 */
export const getComparativaAnualData = async (year1, year2) => {
  try {
    // Obtener evolución mensual de ambos años en paralelo
    const [evolucionYear1, evolucionYear2] = await Promise.all([
      getEvolucionMensual(year1),
      getEvolucionMensual(year2)
    ]);

    // Calcular totales
    const totalYear1 = evolucionYear1.reduce((sum, mes) => sum + mes.ventas, 0);
    const totalYear2 = evolucionYear2.reduce((sum, mes) => sum + mes.ventas, 0);

    // Calcular crecimiento
    const crecimiento = totalYear1 > 0 
      ? ((totalYear2 - totalYear1) / totalYear1) * 100 
      : 0;

    // Análisis mensual de crecimiento
    const analisisMensual = evolucionYear1.map((mes, index) => {
      const ventasYear1 = mes.ventas;
      const ventasYear2 = evolucionYear2[index].ventas;
      const crecimientoMes = ventasYear1 > 0 
        ? ((ventasYear2 - ventasYear1) / ventasYear1) * 100 
        : 0;

      return {
        mes: mes.mes,
        mesNombre: mes.mesNombre,
        mesAbreviado: mes.mesAbreviado,
        ventasYear1,
        ventasYear2,
        diferencia: parseFloat((ventasYear2 - ventasYear1).toFixed(2)),
        crecimientoMes: parseFloat(crecimientoMes.toFixed(2))
      };
    });

    return {
      year1,
      year2,
      totalYear1: parseFloat(totalYear1.toFixed(2)),
      totalYear2: parseFloat(totalYear2.toFixed(2)),
      diferencia: parseFloat((totalYear2 - totalYear1).toFixed(2)),
      crecimiento: parseFloat(crecimiento.toFixed(2)),
      evolucionYear1,
      evolucionYear2,
      analisisMensual
    };
  } catch (error) {
    console.error('Error en getComparativaAnualData:', error);
    throw error;
  }
};
```

### 3.5 - Endpoint: Ventas por Periodo

```javascript
/**
 * GET /api/dashboard/ventas-periodo
 * Obtiene ventas en un periodo específico con evolución
 * Query params: year, month (opcional), tipo (mensual|diario)
 */
export const getVentasPorPeriodo = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year);
    const month = req.query.month ? parseInt(req.query.month) : null;
    const tipo = req.query.tipo || 'mensual'; // mensual o diario

    if (!year || isNaN(year)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El año es requerido');
    }

    logQuery('dashboard', 'ventas_periodo', { year, month, tipo });

    let evolucion;
    
    if (tipo === 'diario') {
      if (!month) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El mes es requerido para evolución diaria');
      }
      evolucion = await getEvolucionDiaria(year, month);
    } else {
      evolucion = await getEvolucionMensual(year);
    }

    const totalVentas = evolucion.reduce((sum, item) => sum + item.ventas, 0);
    const totalOrdenes = evolucion.reduce((sum, item) => sum + (item.ordenes || 0), 0);

    const resultado = {
      periodo: {
        year,
        month: month || 'todos',
        tipo
      },
      resumen: {
        totalVentas: parseFloat(totalVentas.toFixed(2)),
        totalOrdenes,
        promedioOrden: totalOrdenes > 0 ? parseFloat((totalVentas / totalOrdenes).toFixed(2)) : 0
      },
      evolucion
    };

    sendResponse(res, HTTP_STATUS.OK, resultado, 'Evolución de ventas obtenida exitosamente');

  } catch (error) {
    next(error);
  }
};
```

### 3.6 - Endpoint: Comparativa Anual

```javascript
/**
 * GET /api/dashboard/comparativa-anual
 * Compara ventas entre dos años
 * Query params: year1, year2 (opcional, por defecto año anterior)
 */
export const getComparativaAnual = async (req, res, next) => {
  try {
    const year2 = parseInt(req.query.year) || new Date().getFullYear();
    const year1 = parseInt(req.query.year_comparacion) || (year2 - 1);

    if (isNaN(year1) || isNaN(year2)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Los años deben ser válidos');
    }

    if (year1 >= year2) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El año de comparación debe ser anterior');
    }

    logQuery('dashboard', 'comparativa_anual', { year1, year2 });

    const comparativa = await getComparativaAnualData(year1, year2);

    sendResponse(res, HTTP_STATUS.OK, comparativa, 'Comparativa anual obtenida exitosamente');

  } catch (error) {
    next(error);
  }
};
```

---

## 🏆 FASE 4: ENDPOINTS DE ANÁLISIS POR CATEGORÍA Y PRODUCTO

**Objetivo:** Implementar análisis detallado de productos y categorías.

### Checklist:

- [x] **4.1** Implementar función para top N productos
- [x] **4.2** Implementar análisis Pareto para productos
- [x] **4.3** Implementar función para distribución por categorías
- [x] **4.4** Implementar función para productos por categoría
- [x] **4.5** Implementar endpoint `getTopProductos`
- [x] **4.6** Implementar endpoint `getAnalisisCategorias`
- [x] **4.7** Probar con diferentes límites y filtros

### 4.1 - Función: Top N Productos

```javascript
/**
 * Obtener los N productos más vendidos
 * @param {number} year - Año a consultar
 * @param {number|null} month - Mes a consultar
 * @param {number} limit - Cantidad de productos a retornar
 * @returns {Promise<Array>}
 */
export const getTopNProductos = async (year, month = null, limit = 10) => {
  try {
    let query = supabase
      .from('detalle_orden')
      .select(`
        producto_id,
        cantidad,
        precio_unitario,
        ordenes!inner (
          fecha,
          estado
        ),
        productos (
          id,
          nombre,
          imagen_url,
          precio
        )
      `)
      .in('ordenes.estado', ['pagado', 'enviado', 'completado'])
      .gte('ordenes.fecha', `${year}-01-01`)
      .lte('ordenes.fecha', `${year}-12-31`);

    if (month !== null) {
      const monthStr = String(month).padStart(2, '0');
      query = query
        .gte('ordenes.fecha', `${year}-${monthStr}-01`)
        .lt('ordenes.fecha', `${year}-${monthStr}-31`);
    }

    const { data, error } = await query;
    
    if (error) throw error;

    // Agrupar por producto
    const productosMap = {};
    
    data.forEach(detalle => {
      const productoId = detalle.producto_id;
      
      if (!productosMap[productoId]) {
        productosMap[productoId] = {
          id: detalle.productos.id,
          nombre: detalle.productos.nombre,
          imagen_url: detalle.productos.imagen_url,
          precioActual: detalle.productos.precio,
          totalVentas: 0,
          unidadesVendidas: 0
        };
      }
      
      productosMap[productoId].totalVentas += detalle.cantidad * detalle.precio_unitario;
      productosMap[productoId].unidadesVendidas += detalle.cantidad;
    });

    // Convertir a array y ordenar por ventas
    const productos = Object.values(productosMap)
      .map(p => ({
        ...p,
        totalVentas: parseFloat(p.totalVentas.toFixed(2)),
        precioPromedio: p.unidadesVendidas > 0 
          ? parseFloat((p.totalVentas / p.unidadesVendidas).toFixed(2)) 
          : 0
      }))
      .sort((a, b) => b.totalVentas - a.totalVentas)
      .slice(0, limit);

    return productos;
  } catch (error) {
    console.error('Error en getTopNProductos:', error);
    throw error;
  }
};
```

### 4.2 - Función: Análisis Pareto

```javascript
/**
 * Calcular análisis Pareto para productos
 * Agrega porcentaje acumulado de ventas
 * @param {Array} productos - Array de productos con totalVentas
 * @returns {Array}
 */
export const calcularPareto = (productos) => {
  const totalGeneral = productos.reduce((sum, p) => sum + p.totalVentas, 0);
  
  let acumulado = 0;
  
  return productos.map((producto, index) => {
    const porcentaje = totalGeneral > 0 
      ? (producto.totalVentas / totalGeneral) * 100 
      : 0;
    
    acumulado += porcentaje;
    
    return {
      ...producto,
      porcentajeDelTotal: parseFloat(porcentaje.toFixed(2)),
      porcentajeAcumulado: parseFloat(acumulado.toFixed(2)),
      posicion: index + 1
    };
  });
};
```

### 4.3 - Función: Distribución por Categorías

```javascript
/**
 * Obtener distribución de ventas por categoría
 * @param {number} year - Año a consultar
 * @param {number|null} month - Mes a consultar
 * @returns {Promise<Array>}
 */
export const getDistribucionCategorias = async (year, month = null) => {
  try {
    // Obtener todas las órdenes del periodo
    let query = supabase
      .from('detalle_orden')
      .select(`
        producto_id,
        cantidad,
        precio_unitario,
        ordenes!inner (
          fecha,
          estado
        )
      `)
      .in('ordenes.estado', ['pagado', 'enviado', 'completado'])
      .gte('ordenes.fecha', `${year}-01-01`)
      .lte('ordenes.fecha', `${year}-12-31`);

    if (month !== null) {
      const monthStr = String(month).padStart(2, '0');
      query = query
        .gte('ordenes.fecha', `${year}-${monthStr}-01`)
        .lt('ordenes.fecha', `${year}-${monthStr}-31`);
    }

    const { data: detalles, error } = await query;
    
    if (error) throw error;

    // Obtener todas las categorías
    const { data: todasCategorias, error: catError } = await supabase
      .from('categorias')
      .select('id, nombre')
      .order('nombre');

    if (catError) throw catError;

    // Obtener relación producto-categoría
    const productoIds = [...new Set(detalles.map(d => d.producto_id))];
    
    const { data: productosCategorias, error: pcError } = await supabase
      .from('producto_categoria')
      .select(`
        producto_id,
        categoria_id,
        categorias (
          id,
          nombre
        )
      `)
      .in('producto_id', productoIds);

    if (pcError) throw pcError;

    // Calcular ventas por categoría
    const categoriasMap = {};
    
    // Inicializar todas las categorías en 0
    todasCategorias.forEach(cat => {
      categoriasMap[cat.id] = {
        id: cat.id,
        nombre: cat.nombre,
        totalVentas: 0,
        productosUnicos: new Set()
      };
    });

    // Sumar ventas
    detalles.forEach(detalle => {
      const categoriasDelProducto = productosCategorias.filter(
        pc => pc.producto_id === detalle.producto_id
      );

      categoriasDelProducto.forEach(pc => {
        const catId = pc.categoria_id;
        const ventaDetalle = detalle.cantidad * detalle.precio_unitario;
        
        categoriasMap[catId].totalVentas += ventaDetalle;
        categoriasMap[catId].productosUnicos.add(detalle.producto_id);
      });
    });

    // Calcular total y porcentajes
    const categorias = Object.values(categoriasMap)
      .map(cat => ({
        id: cat.id,
        nombre: cat.nombre,
        totalVentas: parseFloat(cat.totalVentas.toFixed(2)),
        productosUnicos: cat.productosUnicos.size
      }))
      .filter(cat => cat.totalVentas > 0) // Solo categorías con ventas
      .sort((a, b) => b.totalVentas - a.totalVentas);

    const totalGeneral = categorias.reduce((sum, cat) => sum + cat.totalVentas, 0);

    const resultado = categorias.map(cat => ({
      ...cat,
      porcentaje: totalGeneral > 0 
        ? parseFloat(((cat.totalVentas / totalGeneral) * 100).toFixed(2)) 
        : 0
    }));

    return resultado;
  } catch (error) {
    console.error('Error en getDistribucionCategorias:', error);
    throw error;
  }
};
```

### 4.5 - Endpoint: Top Productos

```javascript
/**
 * GET /api/dashboard/top-productos
 * Obtiene los productos más vendidos con análisis Pareto
 * Query params: year, month (opcional), limit (default: 10)
 */
export const getTopProductos = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year);
    const month = req.query.month ? parseInt(req.query.month) : null;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Máximo 50

    if (!year || isNaN(year)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El año es requerido');
    }

    logQuery('dashboard', 'top_productos', { year, month, limit });

    const topProductos = await getTopNProductos(year, month, limit);
    const productosConPareto = calcularPareto(topProductos);

    const totalVentas = topProductos.reduce((sum, p) => sum + p.totalVentas, 0);
    const totalUnidades = topProductos.reduce((sum, p) => sum + p.unidadesVendidas, 0);

    const resultado = {
      periodo: {
        year,
        month: month || 'todos'
      },
      resumen: {
        totalVentas: parseFloat(totalVentas.toFixed(2)),
        totalUnidades,
        productosAnalizados: topProductos.length
      },
      productos: productosConPareto
    };

    sendResponse(res, HTTP_STATUS.OK, resultado, 'Top productos obtenido exitosamente');

  } catch (error) {
    next(error);
  }
};
```

### 4.6 - Endpoint: Análisis de Categorías

```javascript
/**
 * GET /api/dashboard/analisis-categorias
 * Obtiene análisis detallado de ventas por categoría
 * Query params: year, month (opcional)
 */
export const getAnalisisCategorias = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year);
    const month = req.query.month ? parseInt(req.query.month) : null;

    if (!year || isNaN(year)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El año es requerido');
    }

    logQuery('dashboard', 'analisis_categorias', { year, month });

    const distribucion = await getDistribucionCategorias(year, month);

    const totalVentas = distribucion.reduce((sum, cat) => sum + cat.totalVentas, 0);
    const totalProductosUnicos = distribucion.reduce((sum, cat) => sum + cat.productosUnicos, 0);

    const resultado = {
      periodo: {
        year,
        month: month || 'todos'
      },
      resumen: {
        totalVentas: parseFloat(totalVentas.toFixed(2)),
        categoriasConVentas: distribucion.length,
        totalProductosUnicos
      },
      categorias: distribucion
    };

    sendResponse(res, HTTP_STATUS.OK, resultado, 'Análisis de categorías obtenido exitosamente');

  } catch (error) {
    next(error);
  }
};
```

---

## ✅ FASE 5: TESTING Y OPTIMIZACIÓN

**Objetivo:** Probar todos los endpoints y optimizar performance.

### Checklist:

- [ ] **5.1** Crear colección de Postman/Thunder Client con todos los endpoints
- [ ] **5.2** Probar endpoint `/api/dashboard/general` con diferentes parámetros
- [ ] **5.3** Probar endpoint `/api/dashboard/ventas-periodo` (mensual y diario)
- [ ] **5.4** Probar endpoint `/api/dashboard/comparativa-anual`
- [ ] **5.5** Probar endpoint `/api/dashboard/top-productos`
- [ ] **5.6** Probar endpoint `/api/dashboard/analisis-categorias`
- [ ] **5.7** Medir tiempos de respuesta y optimizar queries lentas
- [ ] **5.8** Implementar caché para datos que no cambian frecuentemente
- [ ] **5.9** Agregar manejo de errores robusto
- [ ] **5.10** Validar que funcione con datos de diferentes años

### 5.1 - Casos de Prueba

**Test 1: Dashboard General - Año Completo**
```bash
GET /api/dashboard/general?year=2025
```

**Test 2: Dashboard General - Mes Específico**
```bash
GET /api/dashboard/general?year=2025&month=1
```

**Test 3: Evolución Mensual**
```bash
GET /api/dashboard/ventas-periodo?year=2025&tipo=mensual
```

**Test 4: Evolución Diaria**
```bash
GET /api/dashboard/ventas-periodo?year=2025&month=1&tipo=diario
```

**Test 5: Comparativa Anual**
```bash
GET /api/dashboard/comparativa-anual?year=2025&year_comparacion=2024
```

**Test 6: Top 5 Productos**
```bash
GET /api/dashboard/top-productos?year=2025&limit=5
```

**Test 7: Análisis de Categorías**
```bash
GET /api/dashboard/analisis-categorias?year=2025
```

### 5.7 - Optimización de Performance

**Agregar índices en la base de datos (recomendado):**

```sql
-- Si no existen, crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha ON ordenes(fecha);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes(estado);
CREATE INDEX IF NOT EXISTS idx_detalle_orden_producto_id ON detalle_orden(producto_id);
CREATE INDEX IF NOT EXISTS idx_detalle_orden_orden_id ON detalle_orden(orden_id);
CREATE INDEX IF NOT EXISTS idx_producto_categoria_producto_id ON producto_categoria(producto_id);
CREATE INDEX IF NOT EXISTS idx_producto_categoria_categoria_id ON producto_categoria(categoria_id);
```

**Tiempos esperados:**
- Dashboard general: < 500ms
- Evolución mensual: < 300ms
- Evolución diaria: < 200ms
- Top productos: < 400ms
- Análisis categorías: < 500ms

### 5.8 - Implementar Caché Simple (Opcional)

```javascript
// Agregar al inicio de dashboard.js
const cache = {
  data: {},
  set: (key, value, ttl = 300000) => { // TTL 5 minutos
    cache.data[key] = {
      value,
      expiry: Date.now() + ttl
    };
  },
  get: (key) => {
    const item = cache.data[key];
    if (!item) return null;
    if (Date.now() > item.expiry) {
      delete cache.data[key];
      return null;
    }
    return item.value;
  },
  clear: () => {
    cache.data = {};
  }
};

// Ejemplo de uso en getDashboardGeneral
export const getDashboardGeneral = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year);
    const month = req.query.month ? parseInt(req.query.month) : null;
    
    // Intentar obtener de caché
    const cacheKey = `dashboard_${year}_${month}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return sendResponse(res, HTTP_STATUS.OK, cached, 'Dashboard obtenido desde caché');
    }

    // ... resto del código ...

    // Guardar en caché antes de responder
    cache.set(cacheKey, dashboard);

    sendResponse(res, HTTP_STATUS.OK, dashboard, 'Dashboard obtenido exitosamente');
  } catch (error) {
    next(error);
  }
};
```

---

## 📄 FASE 6: DOCUMENTACIÓN FINAL

**Objetivo:** Documentar todos los endpoints y crear ejemplos de uso.

### Checklist:

- [x] **6.1** Crear archivo `DASHBOARD_API.md` con documentación de endpoints
- [x] **6.2** Documentar parámetros de cada endpoint
- [x] **6.3** Incluir ejemplos de respuestas exitosas
- [x] **6.4** Incluir ejemplos de errores comunes
- [x] **6.5** Crear diagrama de flujo de datos
- [x] **6.6** Agregar notas de optimización y mejores prácticas
- [ ] **6.7** Actualizar `TECHNICAL_MANUAL.md` con nueva funcionalidad

### 6.1 - Estructura de Documentación

**Archivo:** `DASHBOARD_API.md`

```markdown
# 📊 API de Dashboard de Ventas

## Endpoints Disponibles

### 1. Dashboard General
**GET** `/api/dashboard/general`

Obtiene todas las métricas principales del dashboard.

**Query Parameters:**
- `year` (requerido): Año a consultar (ej: 2025)
- `month` (opcional): Mes a consultar (1-12)

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Dashboard obtenido exitosamente",
  "data": {
    "periodo": {...},
    "metricas": {...}
  }
}
```

### 2. Ventas por Periodo
...

### 3. Comparativa Anual
...

## Códigos de Error

- `400`: Parámetros inválidos
- `401`: No autenticado
- `403`: Sin permisos
- `500`: Error del servidor
```

---

## 🎯 RESUMEN DE IMPLEMENTACIÓN

### Archivos a Crear:

1. ✅ `src/controllers/dashboard.js` - Lógica de negocio
2. ✅ `src/routes/dashboard.js` - Definición de rutas
3. ✅ `DASHBOARD_API.md` - Documentación de API

### Archivos a Modificar:

1. ✅ `server.js` - Registrar nuevas rutas
2. ✅ `src/utils/constants.js` - Agregar constantes

### Endpoints Implementados:

1. ✅ `GET /api/dashboard/general` - Dashboard completo
2. ✅ `GET /api/dashboard/ventas-periodo` - Análisis temporal
3. ✅ `GET /api/dashboard/comparativa-anual` - Comparativa años
4. ✅ `GET /api/dashboard/top-productos` - Productos más vendidos
5. ✅ `GET /api/dashboard/analisis-categorias` - Distribución por categoría

### Métricas Disponibles:

- ✅ Ventas totales
- ✅ Total de órdenes
- ✅ Promedio por orden
- ✅ Producto top
- ✅ Categoría top
- ✅ Evolución mensual
- ✅ Evolución diaria
- ✅ Comparativa anual
- ✅ Top N productos con Pareto
- ✅ Distribución por categorías

---

## 🚀 CÓMO USAR ESTA GUÍA

1. **Trabaja fase por fase** - No avances hasta completar todos los checkboxes de una fase
2. **Marca los checkboxes** - Reemplaza `[ ]` por `[x]` cuando completes cada item
3. **Prueba cada endpoint** - Antes de continuar, asegúrate que funciona correctamente
4. **Documenta problemas** - Si encuentras issues, agrégalos al final de este documento

---

## 📝 NOTAS DE IMPLEMENTACIÓN

### Limitaciones Actuales (Sin modificar BD):

- ❌ No se pueden calcular ganancias (falta campo `costo`)
- ❌ No se pueden filtrar por tipo de venta (online/local)
- ❌ No se pueden filtrar por tipo de pago (efectivo/transferencia)
- ❌ No hay mapa de calor por rendimiento

### Posibles Mejoras Futuras:

- 🔄 Implementar caché con Redis para mejor performance
- 🔄 Agregar websockets para datos en tiempo real
- 🔄 Exportar a PDF además de CSV
- 🔄 Agregar gráficos de tendencias y predicciones
- 🔄 Implementar filtros por estado de orden

---

## ✅ PROGRESO GENERAL

**Fase 1:** ✅ 5/5 completado  
**Fase 2:** ✅ 6/6 completado  
**Fase 3:** ✅ 7/7 completado  
**Fase 4:** ✅ 7/7 completado  
**Fase 5:** ⬜ 0/10 completado (saltada)  
**Fase 6:** ✅ 6/7 completado  

**TOTAL:** 31/42 tareas completadas (74%)

---

## 🐛 REGISTRO DE PROBLEMAS

_Aquí puedes anotar problemas encontrados durante la implementación_

---

## 📞 SOPORTE

Si encuentras problemas durante la implementación:

1. Revisa los logs del servidor
2. Verifica la conexión a Supabase
3. Confirma que los roles y permisos estén correctos
4. Revisa la estructura de datos retornada

---

**Última Actualización:** 3 de octubre de 2025  
**Versión:** 1.0.0  
**Estado:** Lista para implementar 🚀
