import { 
  getAllWithPagination, 
  getById, 
  create, 
  update, 
  deleteRecord,
  getProductosWithCategorias,
  getProductoWithCategorias,
  getProductosByCategoria,
  searchProductos as searchProductosHelper,
  searchProductosGlobal as searchProductosGlobalHelper,
  searchProductosAvanzado as searchProductosAvanzadoHelper,
  checkStock,
  assignCategoriasToProducto,
  getCategoriasDeProducto,
  removeAllCategoriasFromProducto
} from '../config/database.js';
import { ProductoModel } from '../models/index.js';
import { validateProductData, sendResponse, sendError, validatePaginationParams, sanitizeData } from '../utils/validators.js';
import { HTTP_STATUS, TABLES, PAGINATION } from '../utils/constants.js';
import { logQuery } from '../config/supabase.js';

// Obtener todos los productos con paginación y filtros
export const getAllProductos = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const categoria = req.query.categoria;
    const includeCategories = req.query.include_categories === 'true';

    // Validar parámetros de paginación
    validatePaginationParams(page, limit);

    logQuery(TABLES.PRODUCTOS, 'get_all', { page, limit, categoria, includeCategories });

    let result;

    if (categoria) {
      // Filtrar por categoría específica - ahora incluye todas las categorías de cada producto
      result = await getProductosByCategoria(categoria, page, limit);
    } else if (includeCategories) {
      // Incluir información de categorías
      result = await getProductosWithCategorias(page, limit);
    } else {
      // Obtener productos sin categorías
      result = await getAllWithPagination(TABLES.PRODUCTOS, page, limit, 'id');
    }

    sendResponse(res, HTTP_STATUS.OK, {
      productos: result.data,
      pagination: result.pagination
    }, 'Productos obtenidos exitosamente');

  } catch (error) {
    next(error);
  }
};

// Obtener producto por ID
export const getProductoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'ID de producto inválido');
    }

    logQuery(TABLES.PRODUCTOS, 'get_by_id', { id });

    // Usar la función que incluye categorías
    const producto = await getProductoWithCategorias(id);

    if (!producto) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Producto no encontrado');
    }

    sendResponse(res, HTTP_STATUS.OK, producto, 'Producto obtenido exitosamente');

  } catch (error) {
    next(error);
  }
};

// Crear nuevo producto
export const createProducto = async (req, res, next) => {
  try {
    const data = sanitizeData(req.body);
    
    // Extraer categorías del request
    const { categorias, ...productData } = data;
    
    // Validar datos del producto
    validateProductData(productData);

    // Crear modelo del producto
    const producto = new ProductoModel(productData);
    const productDataForDb = producto.toDatabase();

    logQuery(TABLES.PRODUCTOS, 'create', productDataForDb);

    // Crear producto en la base de datos
    const newProducto = await create(TABLES.PRODUCTOS, productDataForDb);

    // Si se proporcionaron categorías, asignarlas
    if (categorias && Array.isArray(categorias) && categorias.length > 0) {
      console.log(`[${new Date().toISOString()}] Asignando categorías [${categorias.join(', ')}] al producto ${newProducto.id}`);
      
      await assignCategoriasToProducto(newProducto.id, categorias);
    }

    // Obtener el producto con sus categorías para la respuesta
    const productoCompleto = await getProductoWithCategorias(newProducto.id);

    sendResponse(res, HTTP_STATUS.CREATED, productoCompleto, 'Producto creado exitosamente');

  } catch (error) {
    console.error('Error en createProducto:', error);
    next(error);
  }
};

// Actualizar producto
export const updateProducto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = sanitizeData(req.body);

    if (!id || isNaN(parseInt(id))) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'ID de producto inválido');
    }

    // Verificar que el producto existe
    const existingProducto = await getById(TABLES.PRODUCTOS, id);
    if (!existingProducto) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Producto no encontrado');
    }

    // Extraer categorías del request
    const { categorias, ...productData } = data;

    // Validar datos de actualización (permitir campos parciales)
    const updateData = { ...existingProducto, ...productData };
    validateProductData(updateData);

    // Crear modelo y obtener datos para actualizar
    const producto = new ProductoModel(updateData);
    const productDataForDb = producto.toDatabase();

    logQuery(TABLES.PRODUCTOS, 'update', { id, data: productDataForDb });

    // Actualizar producto
    const updatedProducto = await update(TABLES.PRODUCTOS, id, productDataForDb);

    if (!updatedProducto) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Producto no encontrado');
    }

    // Si se proporcionaron categorías, actualizarlas
    if (categorias !== undefined) {
      if (Array.isArray(categorias) && categorias.length > 0) {
        console.log(`[${new Date().toISOString()}] Actualizando categorías [${categorias.join(', ')}] del producto ${id}`);
        await assignCategoriasToProducto(id, categorias);
      } else {
        // Si se envía un array vacío, eliminar todas las categorías
        console.log(`[${new Date().toISOString()}] Eliminando todas las categorías del producto ${id}`);
        await removeAllCategoriasFromProducto(id);
      }
    }

    // Obtener el producto actualizado con sus categorías para la respuesta
    const productoCompleto = await getProductoWithCategorias(id);

    sendResponse(res, HTTP_STATUS.OK, productoCompleto, 'Producto actualizado exitosamente');

  } catch (error) {
    console.error('Error en updateProducto:', error);
    next(error);
  }
};

// Eliminar producto
export const deleteProducto = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'ID de producto inválido');
    }

    // Verificar que el producto existe
    const existingProducto = await getById(TABLES.PRODUCTOS, id);
    if (!existingProducto) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Producto no encontrado');
    }

    logQuery(TABLES.PRODUCTOS, 'delete', { id });

    // Eliminar producto
    await deleteRecord(TABLES.PRODUCTOS, id);

    sendResponse(res, HTTP_STATUS.OK, null, 'Producto eliminado exitosamente');

  } catch (error) {
    next(error);
  }
};

// Búsqueda avanzada de productos
export const searchProductos = async (req, res, next) => {
  try {
    const { q: searchTerm } = req.query;
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

    if (!searchTerm || searchTerm.trim().length < 2) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El término de búsqueda debe tener al menos 2 caracteres');
    }

    // Validar parámetros de paginación
    validatePaginationParams(page, limit);

    logQuery(TABLES.PRODUCTOS, 'search', { searchTerm, page, limit });

    const result = await searchProductosHelper(searchTerm.trim(), page, limit);

    sendResponse(res, HTTP_STATUS.OK, {
      productos: result.data,
      pagination: result.pagination,
      searchTerm: searchTerm.trim()
    }, `Búsqueda completada. ${result.data.length} productos encontrados`);

  } catch (error) {
    next(error);
  }
};

// Verificar stock de productos
export const checkProductStock = async (req, res, next) => {
  try {
    const { productos } = req.body;

    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Se requiere un array de productos con id y cantidad');
    }

    // Validar formato de productos
    for (const producto of productos) {
      if (!producto.id || !producto.cantidad || producto.cantidad <= 0) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Cada producto debe tener id y cantidad válidos');
      }
    }

    logQuery(TABLES.PRODUCTOS, 'check_stock', { productos });

    const stockCheck = await checkStock(productos);

    const allStockSufficient = stockCheck.every(item => item.stockSuficiente);

    sendResponse(res, HTTP_STATUS.OK, {
      stockCheck,
      allStockSufficient,
      summary: {
        totalProductos: stockCheck.length,
        conStockSuficiente: stockCheck.filter(item => item.stockSuficiente).length,
        sinStockSuficiente: stockCheck.filter(item => !item.stockSuficiente).length
      }
    }, 'Verificación de stock completada');

  } catch (error) {
    next(error);
  }
};

// Actualizar stock de un producto
export const updateProductStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock, operation = 'set' } = req.body; // 'set', 'add', 'subtract'

    if (!id || isNaN(parseInt(id))) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'ID de producto inválido');
    }

    if (stock === undefined || stock < 0) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Stock debe ser un número no negativo');
    }

    if (!['set', 'add', 'subtract'].includes(operation)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Operación debe ser: set, add, o subtract');
    }

    // Obtener producto actual
    const existingProducto = await getById(TABLES.PRODUCTOS, id);
    if (!existingProducto) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Producto no encontrado');
    }

    let newStock;
    switch (operation) {
      case 'set':
        newStock = parseInt(stock);
        break;
      case 'add':
        newStock = existingProducto.stock + parseInt(stock);
        break;
      case 'subtract':
        newStock = existingProducto.stock - parseInt(stock);
        break;
    }

    if (newStock < 0) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El stock no puede ser negativo');
    }

    logQuery(TABLES.PRODUCTOS, 'update_stock', { id, oldStock: existingProducto.stock, newStock, operation });

    // Actualizar solo el stock
    const updatedProducto = await update(TABLES.PRODUCTOS, id, { stock: newStock });

    sendResponse(res, HTTP_STATUS.OK, {
      id: parseInt(id),
      stockAnterior: existingProducto.stock,
      stockNuevo: newStock,
      operacion: operation,
      producto: ProductoModel.fromDatabase(updatedProducto)
    }, 'Stock actualizado exitosamente');

  } catch (error) {
    next(error);
  }
};

// Búsqueda GLOBAL de productos (sin paginación)
export const searchProductosGlobal = async (req, res, next) => {
  try {
    const { q: searchTerm } = req.query;
    const maxResults = Math.min(parseInt(req.query.max) || 50, 250); // Límite máximo de 100

    if (!searchTerm || searchTerm.trim().length < 2) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El término de búsqueda debe tener al menos 2 caracteres');
    }

    logQuery(TABLES.PRODUCTOS, 'search_global', { searchTerm, maxResults });

    const result = await searchProductosGlobalHelper(searchTerm.trim(), maxResults);

    sendResponse(res, HTTP_STATUS.OK, {
      productos: result.data,
      total: result.total,
      searchTerm: result.searchTerm,
      maxResults: maxResults
    }, `Búsqueda global completada. ${result.total} productos encontrados`);

  } catch (error) {
    next(error);
  }
};

// Búsqueda AVANZADA de productos (incluye categorías en la búsqueda)
export const searchProductosAvanzado = async (req, res, next) => {
  try {
    const { q: searchTerm } = req.query;
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

    if (!searchTerm || searchTerm.trim().length < 2) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El término de búsqueda debe tener al menos 2 caracteres');
    }

    // Validar parámetros de paginación
    validatePaginationParams(page, limit);

    logQuery(TABLES.PRODUCTOS, 'search_advanced', { searchTerm, page, limit });

    const result = await searchProductosAvanzadoHelper(searchTerm.trim(), page, limit);

    sendResponse(res, HTTP_STATUS.OK, {
      productos: result.data,
      pagination: result.pagination,
      searchTerm: searchTerm.trim()
    }, `Búsqueda avanzada completada. ${result.data.length} productos encontrados (incluye búsqueda en categorías)`);

  } catch (error) {
    next(error);
  }
};
