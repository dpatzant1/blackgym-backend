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

const router = express.Router();

// Rutas para categorías

// GET /api/categorias - Obtener todas las categorías con paginación
// Query params: page, limit, include_products
router.get('/', getAllCategorias);

// GET /api/categorias/:id - Obtener categoría por ID
// Query params: include_products
router.get('/:id', getCategoriaById);

// GET /api/categorias/:id/productos - Obtener productos por categoría
// Query params: page, limit
router.get('/:id/productos', getProductosByCategoria);

// POST /api/categorias - Crear nueva categoría (PROTEGIDO)
// Body: { nombre, descripcion? }
router.post('/', 
  requireAdminAuth,
  logAdminAction,
  createCategoria
);

// PUT /api/categorias/:id - Actualizar categoría completa (PROTEGIDO)
// Body: { nombre?, descripcion? }
router.put('/:id', 
  requireAdminAuth,
  logAdminAction,
  updateCategoria
);

// DELETE /api/categorias/:id - Eliminar categoría (PROTEGIDO)
router.delete('/:id', 
  requireAdminAuth,
  logAdminAction,
  deleteCategoria
);

// POST /api/categorias/productos/:id/assign - Asignar categorías a producto (PROTEGIDO)
// Body: { categorias: [categoria_id, ...] }
router.post('/productos/:id/assign', 
  requireAdminAuth,
  logAdminAction,
  assignCategoriasToProducto
);

// DELETE /api/categorias/:id/productos/:productoId - Remover producto de categoría (PROTEGIDO)
router.delete('/:id/productos/:productoId', 
  requireAdminAuth,
  logAdminAction,
  removeProductoFromCategoria
);

// DELETE /api/categorias/:id - Eliminar categoría (solo si no tiene productos)
router.delete('/:id', deleteCategoria);

// GET /api/categorias/:id/productos - Obtener productos de una categoría
// Query params: page, limit
router.get('/:id/productos', getProductosByCategoria);

// POST /api/categorias/productos/:id/assign - Asignar categorías a un producto
// Body: { categorias: [1, 2, 3] }
router.post('/productos/:id/assign', assignCategoriasToProducto);

// DELETE /api/categorias/:id/productos/:productoId - Remover producto de categoría
router.delete('/:id/productos/:productoId', removeProductoFromCategoria);

export default router;
