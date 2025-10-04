import express from 'express';
import {
  listarBitacora,
  obtenerPorAdmin,
  obtenerPorAccion,
  obtenerEstadisticas,
  exportarBitacora,
  obtenerPorFecha
} from '../controllers/bitacora.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { requireRole, requireAdmin } from '../middleware/roles.js';

const router = express.Router();

/**
 * Rutas de Bitácora
 * Sistema de auditoría y registro de acciones administrativas
 * 
 * Protección:
 * - Listar/Ver bitácora: Administradores y Gerentes
 * - Exportar/Estadísticas: Solo Administradores
 */

// GET /api/bitacora - Listar bitácora con paginación y filtros
// Query params: page, limit, adminId, accion, fechaInicio, fechaFin
// Acceso: Administradores y Gerentes
router.get('/',
  requireAdminAuth,
  requireRole(['administrador', 'gerente']),
  listarBitacora
);

// GET /api/bitacora/stats - Obtener estadísticas de la bitácora
// Acceso: Solo Administradores
router.get('/stats',
  requireAdminAuth,
  requireAdmin(),
  obtenerEstadisticas
);

// GET /api/bitacora/export - Exportar registros de bitácora (CSV o JSON)
// Query params: formato (csv|json), adminId, accion, fechaInicio, fechaFin, limit
// Acceso: Solo Administradores
router.get('/export',
  requireAdminAuth,
  requireAdmin(),
  exportarBitacora
);

// GET /api/bitacora/fecha - Obtener registros por rango de fechas
// Query params: fechaInicio, fechaFin, page, limit
// Acceso: Administradores y Gerentes
router.get('/fecha',
  requireAdminAuth,
  requireRole(['administrador', 'gerente']),
  obtenerPorFecha
);

// GET /api/bitacora/admin/:adminId - Obtener registros de un administrador específico
// Params: adminId
// Query params: page, limit
// Acceso: Administradores y Gerentes
router.get('/admin/:adminId',
  requireAdminAuth,
  requireRole(['administrador', 'gerente']),
  obtenerPorAdmin
);

// GET /api/bitacora/accion/:accion - Obtener registros por tipo de acción
// Params: accion
// Query params: page, limit
// Acceso: Administradores y Gerentes
router.get('/accion/:accion',
  requireAdminAuth,
  requireRole(['administrador', 'gerente']),
  obtenerPorAccion
);

export default router;
