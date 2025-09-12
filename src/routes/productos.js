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

const router = express.Router();

// Rutas para productos

// GET /api/productos - Obtener todos los productos con paginación y filtros
// Query params: page, limit, categoria, include_categories
router.get('/', getAllProductos);

// GET /api/productos/search - Búsqueda de productos (con paginación)
// Query params: q (término de búsqueda), page, limit
router.get('/search', searchProductosController);

// GET /api/productos/search/global - Búsqueda GLOBAL (sin paginación)
// Query params: q (término de búsqueda), max (límite de resultados, default: 50)
router.get('/search/global', searchProductosGlobal);

// GET /api/productos/search/advanced - Búsqueda AVANZADA (incluye categorías)
// Query params: q (término de búsqueda), page, limit
router.get('/search/advanced', searchProductosAvanzado);

// POST /api/productos/check-stock - Verificar stock de múltiples productos
// Body: { productos: [{ id, cantidad }] }
router.post('/check-stock', checkProductStock);

// GET /api/productos/:id - Obtener producto por ID
router.get('/:id', getProductoById);

// POST /api/productos - Crear nuevo producto (PROTEGIDO)
// Body: { nombre, descripcion?, precio, stock, imagen_url? }
router.post('/', 
  requireAdminAuth,
  logAdminAction,
  createProducto
);

// PUT /api/productos/:id - Actualizar producto completo (PROTEGIDO)
// Body: { nombre?, descripcion?, precio?, stock?, imagen_url? }
router.put('/:id', 
  requireAdminAuth,
  logAdminAction,
  updateProducto
);

// PATCH /api/productos/:id/stock - Actualizar solo el stock
// Body: { stock, operation?: 'set'|'add'|'subtract' }
router.patch('/:id/stock', updateProductStock);

// DELETE /api/productos/:id - Eliminar producto (PROTEGIDO)
router.delete('/:id', 
  requireAdminAuth,
  logAdminAction,
  deleteProducto
);

export default router;
