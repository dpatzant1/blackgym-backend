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
 * 
 * PROTECCIÓN:
 * - Todas las rutas requieren autenticación (requireAdminAuth)
 * - Roles permitidos: Administrador, Gerente, Asesor de Ventas
 * 
 * ENDPOINTS:
 * 1. GET /api/dashboard/general - Dashboard completo con métricas principales
 * 2. GET /api/dashboard/ventas-periodo - Evolución temporal de ventas
 * 3. GET /api/dashboard/top-productos - Top N productos más vendidos
 * 4. GET /api/dashboard/analisis-categorias - Análisis de ventas por categoría
 * 5. GET /api/dashboard/comparativa-anual - Comparación entre años
 * 6. GET /api/dashboard/exportar-csv - Exportar datos a CSV
 */

// Middleware de autenticación y autorización para todas las rutas
const dashboardAuth = [
  requireAdminAuth,
  requireRole(['administrador', 'gerente', 'asesor de ventas'])
];

// ============================================================================
// RUTAS DEL DASHBOARD
// ============================================================================

/**
 * GET /api/dashboard/general
 * Dashboard completo con todas las métricas principales
 * 
 * Query Parameters:
 * - year (requerido): Año a consultar (ej: 2025)
 * - month (opcional): Mes a consultar (1-12)
 * 
 * Retorna:
 * - Ventas totales del periodo
 * - Total de órdenes
 * - Promedio por orden
 * - Producto más vendido
 * - Categoría más vendida
 */
router.get('/general', ...dashboardAuth, getDashboardGeneral);

/**
 * GET /api/dashboard/ventas-periodo
 * Ventas en periodo específico con evolución temporal
 * 
 * Query Parameters:
 * - year (requerido): Año a consultar
 * - month (opcional): Mes a consultar (requerido si tipo=diario)
 * - tipo (opcional): 'mensual' o 'diario' (default: mensual)
 * 
 * Retorna:
 * - Evolución mensual: Ventas de cada mes del año
 * - Evolución diaria: Ventas de cada día del mes
 */
router.get('/ventas-periodo', ...dashboardAuth, getVentasPorPeriodo);

/**
 * GET /api/dashboard/top-productos
 * Top N productos más vendidos con análisis Pareto
 * 
 * Query Parameters:
 * - year (requerido): Año a consultar
 * - month (opcional): Mes a consultar
 * - limit (opcional): Cantidad de productos (default: 10, max: 50)
 * 
 * Retorna:
 * - Lista de productos ordenados por ventas
 * - Análisis Pareto (% acumulado)
 * - Unidades vendidas por producto
 */
router.get('/top-productos', ...dashboardAuth, getTopProductos);

/**
 * GET /api/dashboard/analisis-categorias
 * Análisis detallado de ventas por categoría
 * 
 * Query Parameters:
 * - year (requerido): Año a consultar
 * - month (opcional): Mes a consultar
 * 
 * Retorna:
 * - Distribución de ventas por categoría
 * - Porcentaje de cada categoría
 * - Productos únicos por categoría
 */
router.get('/analisis-categorias', ...dashboardAuth, getAnalisisCategorias);

/**
 * GET /api/dashboard/comparativa-anual
 * Comparar ventas entre dos años
 * 
 * Query Parameters:
 * - year (opcional): Año principal (default: año actual)
 * - year_comparacion (opcional): Año a comparar (default: año anterior)
 * 
 * Retorna:
 * - Ventas totales de ambos años
 * - Crecimiento porcentual
 * - Análisis mensual de crecimiento
 * - Evolución comparada mes a mes
 */
router.get('/comparativa-anual', ...dashboardAuth, getComparativaAnual);

/**
 * GET /api/dashboard/exportar-csv
 * Exportar datos del dashboard a formato CSV
 * 
 * Query Parameters:
 * - year (requerido): Año a exportar
 * - month (opcional): Mes a exportar
 * 
 * Retorna:
 * - Archivo CSV con datos del dashboard
 */
router.get('/exportar-csv', ...dashboardAuth, exportarDashboardCSV);

export default router;
