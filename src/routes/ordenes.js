import express from 'express';
import {
  getAllOrdenes,
  getOrdenById,
  createOrden,
  updateOrden,
  getDetalleOrden,
  cancelOrden,
  getOrdenesStats,
  cambiarEstadoOrden
} from '../controllers/ordenes.js';
import { requireAdminAuth, logAdminAction } from '../middleware/auth.js';
import { requireRole, requireAdmin } from '../middleware/roles.js';

const router = express.Router();

/**
 * Rutas de Órdenes
 * 
 * Protección de roles:
 * - Ver órdenes: Administrador, Gerente, Asesor de Ventas
 * - Cambiar estado: Administrador, Gerente
 * - Editar: Administrador, Gerente
 * - Cancelar: Solo Administrador
 * - Estadísticas: Administrador, Gerente, Asesor de Ventas
 */

// ==================== RUTAS PROTEGIDAS CON ROLES ====================

// GET /api/ordenes/stats - Estadísticas de órdenes
// Acceso: Administrador, Gerente, Asesor de Ventas
router.get('/stats', 
  requireAdminAuth,
  requireRole(['administrador', 'gerente', 'asesor de ventas']),
  logAdminAction,
  getOrdenesStats
);

// GET /api/ordenes - Listar todas las órdenes
// Query params: page, limit, include_details
// Acceso: Administrador, Gerente, Asesor de Ventas
router.get('/', 
  requireAdminAuth,
  requireRole(['administrador', 'gerente', 'asesor de ventas']),
  getAllOrdenes
);

// GET /api/ordenes/:id - Obtener orden por ID
// Query params: include_details
// Acceso: Administrador, Gerente, Asesor de Ventas
router.get('/:id', 
  requireAdminAuth,
  requireRole(['administrador', 'gerente', 'asesor de ventas']),
  getOrdenById
);

// GET /api/ordenes/:id/detalle - Obtener detalle completo de orden
// Acceso: Administrador, Gerente, Asesor de Ventas
router.get('/:id/detalle', 
  requireAdminAuth,
  requireRole(['administrador', 'gerente', 'asesor de ventas']),
  getDetalleOrden
);

// POST /api/ordenes - Crear nueva orden
// Body: { cliente, telefono, direccion, productos: [{ producto_id, cantidad, precio }] }
// Acceso: Administrador, Gerente, Asesor de Ventas
router.post('/', 
  requireAdminAuth,
  requireRole(['administrador', 'gerente', 'asesor de ventas']),
  logAdminAction,
  createOrden
);

// PUT /api/ordenes/:id/estado - Cambiar estado de orden
// Body: { nuevoEstado }
// Acceso: Administrador, Gerente
// Bitácora: CAMBIAR_ESTADO_ORDEN (registrada en controlador)
router.put('/:id/estado', 
  requireAdminAuth,
  requireRole(['administrador', 'gerente']),
  logAdminAction,
  cambiarEstadoOrden
);

// PUT /api/ordenes/:id - Actualizar orden
// Body: { cliente?, telefono?, direccion? }
// Acceso: Administrador, Gerente
// Bitácora: EDITAR_ORDEN (registrada en controlador)
router.put('/:id', 
  requireAdminAuth,
  requireRole(['administrador', 'gerente']),
  logAdminAction,
  updateOrden
);

// DELETE /api/ordenes/:id - Cancelar orden (restaura stock)
// Acceso: Solo Administrador
// Bitácora: CANCELAR_ORDEN (registrada en controlador)
router.delete('/:id', 
  requireAdminAuth,
  requireAdmin(),
  logAdminAction,
  cancelOrden
);

export default router;
