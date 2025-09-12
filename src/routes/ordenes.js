import express from 'express';
import {
  getAllOrdenes,
  getOrdenById,
  createOrden,
  updateOrden,
  getDetalleOrden,
  cancelOrden,
  getOrdenesStats
} from '../controllers/ordenes.js';
import { requireAdminAuth, logAdminAction } from '../middleware/auth.js';

const router = express.Router();

// Rutas de estadísticas (PROTEGIDO - solo admins)
router.get('/stats', 
  requireAdminAuth,
  logAdminAction,
  getOrdenesStats
);

// Rutas principales de órdenes
router.get('/', getAllOrdenes);
router.get('/:id', getOrdenById);
router.post('/', createOrden);

// PUT y DELETE protegidos para administradores
router.put('/:id', 
  requireAdminAuth,
  logAdminAction,
  updateOrden
);

router.delete('/:id', 
  requireAdminAuth,
  logAdminAction,
  cancelOrden
);

// Rutas específicas para detalles
router.get('/:id/detalle', getDetalleOrden);

export default router;
