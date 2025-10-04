import express from 'express';
import {
  getAllCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getProductosByCategoria,
  assignCategoriasToProducto,
  removeProductoFromCategoria
} from '../controllers/categorias.js';
import { requireAdminAuth, logAdminAction } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

/**
 * Rutas de Categorías
 * 
 * Protección de roles:
 * - Crear/Editar/Eliminar: Administrador, Gerente
 * - Leer: Todos (público)
 * - Asignar categorías: Administrador, Gerente
 */

// ==================== RUTAS PÚBLICAS (sin autenticación) ====================

// GET /api/categorias - Obtener todas las categorías con paginación
// Query params: page, limit, include_products
// Acceso: Público
router.get('/', getAllCategorias);

// GET /api/categorias/:id - Obtener categoría por ID
// Query params: include_products
// Acceso: Público
router.get('/:id', getCategoriaById);

// GET /api/categorias/:id/productos - Obtener productos por categoría
// Query params: page, limit
// Acceso: Público
router.get('/:id/productos', getProductosByCategoria);

// ==================== RUTAS PROTEGIDAS ====================

// POST /api/categorias - Crear nueva categoría
// Body: { nombre, descripcion? }
// Acceso: Administrador, Gerente
// Bitácora: CREAR_CATEGORIA (registrada en controlador)
router.post('/', 
  requireAdminAuth,
  requireRole(['administrador', 'gerente']),
  logAdminAction,
  createCategoria
);

// PUT /api/categorias/:id - Actualizar categoría completa
// Body: { nombre?, descripcion? }
// Acceso: Administrador, Gerente
// Bitácora: EDITAR_CATEGORIA (registrada en controlador)
router.put('/:id', 
  requireAdminAuth,
  requireRole(['administrador', 'gerente']),
  logAdminAction,
  updateCategoria
);

// DELETE /api/categorias/:id - Eliminar categoría
// Acceso: Administrador, Gerente
// Bitácora: ELIMINAR_CATEGORIA (registrada en controlador)
router.delete('/:id', 
  requireAdminAuth,
  requireRole(['administrador', 'gerente']),
  logAdminAction,
  deleteCategoria
);

// POST /api/categorias/productos/:id/assign - Asignar categorías a producto
// Body: { categorias: [categoria_id, ...] }
// Acceso: Administrador, Gerente
// Bitácora: ASIGNAR_CATEGORIAS (registrada en controlador)
router.post('/productos/:id/assign', 
  requireAdminAuth,
  requireRole(['administrador', 'gerente']),
  logAdminAction,
  assignCategoriasToProducto
);

// DELETE /api/categorias/:id/productos/:productoId - Remover producto de categoría
// Acceso: Administrador, Gerente
router.delete('/:id/productos/:productoId', 
  requireAdminAuth,
  requireRole(['administrador', 'gerente']),
  logAdminAction,
  removeProductoFromCategoria
);

export default router;
