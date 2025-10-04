import express from 'express';
import {
  getAllProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  searchProductos as searchProductosController,
  searchProductosGlobal,
  searchProductosAvanzado,
  checkProductStock,
  updateProductStock
} from '../controllers/productos.js';
import { requireAdminAuth, logAdminAction } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

/**
 * Rutas de Productos
 * 
 * Protección de roles:
 * - Crear/Editar/Eliminar: Administrador, Gerente
 * - Leer: Todos (público)
 * - Stock: Administrador, Gerente
 */

// ==================== RUTAS PÚBLICAS (sin autenticación) ====================

// GET /api/productos - Obtener todos los productos con paginación y filtros
// Query params: page, limit, categoria, include_categories
// Acceso: Público
router.get('/', getAllProductos);

// GET /api/productos/search - Búsqueda de productos (con paginación)
// Query params: q (término de búsqueda), page, limit
// Acceso: Público
router.get('/search', searchProductosController);

// GET /api/productos/search/global - Búsqueda GLOBAL (sin paginación)
// Query params: q (término de búsqueda), max (límite de resultados, default: 50)
// Acceso: Público
router.get('/search/global', searchProductosGlobal);

// GET /api/productos/search/advanced - Búsqueda AVANZADA (incluye categorías)
// Query params: q (término de búsqueda), page, limit
// Acceso: Público
router.get('/search/advanced', searchProductosAvanzado);

// POST /api/productos/check-stock - Verificar stock de múltiples productos
// Body: { productos: [{ id, cantidad }] }
// Acceso: Público
router.post('/check-stock', checkProductStock);

// GET /api/productos/:id - Obtener producto por ID
// Acceso: Público
router.get('/:id', getProductoById);

// ==================== RUTAS PROTEGIDAS ====================

// POST /api/productos - Crear nuevo producto
// Body: { nombre, descripcion?, precio, stock, imagen_url? }
// Acceso: Administrador, Gerente
// Bitácora: CREAR_PRODUCTO (registrada en controlador)
router.post('/', 
  requireAdminAuth,
  requireRole(['administrador', 'gerente']),
  logAdminAction,
  createProducto
);

// PUT /api/productos/:id - Actualizar producto completo
// Body: { nombre?, descripcion?, precio?, stock?, imagen_url? }
// Acceso: Administrador, Gerente
// Bitácora: EDITAR_PRODUCTO (registrada en controlador)
router.put('/:id', 
  requireAdminAuth,
  requireRole(['administrador', 'gerente']),
  logAdminAction,
  updateProducto
);

// PATCH /api/productos/:id/stock - Actualizar solo el stock
// Body: { stock, operation?: 'set'|'add'|'subtract' }
// Acceso: Administrador, Gerente
// Bitácora: ACTUALIZAR_STOCK (registrada en controlador)
router.patch('/:id/stock',
  requireAdminAuth,
  requireRole(['administrador', 'gerente']),
  logAdminAction,
  updateProductStock
);

// DELETE /api/productos/:id - Eliminar producto
// Acceso: Administrador, Gerente
// Bitácora: ELIMINAR_PRODUCTO (registrada en controlador)
router.delete('/:id', 
  requireAdminAuth,
  requireRole(['administrador', 'gerente']),
  logAdminAction,
  deleteProducto
);

export default router;
