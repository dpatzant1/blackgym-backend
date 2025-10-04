import { 
  getAllWithPagination, 
  getById, 
  create, 
  update, 
  deleteRecord,
  getProductosByCategoria as getProductosByCategoriaHelper
} from '../config/database.js';
import { CategoriaModel } from '../models/index.js';
import { validateCategoryData, sendResponse, sendError, validatePaginationParams, sanitizeData } from '../utils/validators.js';
import { HTTP_STATUS, TABLES, PAGINATION, ACCIONES_BITACORA } from '../utils/constants.js';
import { logQuery, supabase } from '../config/supabase.js';
import { registrarAccion } from '../utils/bitacora.js';

// Obtener todas las categorías con paginación
export const getAllCategorias = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const includeProducts = req.query.include_products === 'true';

    // Validar parámetros de paginación
    validatePaginationParams(page, limit);

    logQuery(TABLES.CATEGORIAS, 'get_all', { page, limit, includeProducts });

    let result;

    if (includeProducts) {
      // Incluir información de productos por categoría
      const { from, to } = { from: (page - 1) * limit, to: page * limit - 1 };
      
      const { data, error, count } = await supabase
        .from('categorias')
        .select(`
          *,
          producto_categoria (
            productos (
              id,
              nombre,
              precio,
              stock
            )
          )
        `, { count: 'exact' })
        .order('id')
        .range(from, to);

      if (error) throw error;

      // Transformar datos para facilitar el uso
      const categoriasConProductos = data.map(categoria => ({
        ...categoria,
        productos: categoria.producto_categoria.map(pc => pc.productos),
        totalProductos: categoria.producto_categoria.length
      }));

      result = {
        data: categoriasConProductos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
          hasNext: to < count - 1,
          hasPrev: page > 1
        }
      };
    } else {
      // Obtener categorías sin productos
      result = await getAllWithPagination(TABLES.CATEGORIAS, page, limit, 'id');
    }

    sendResponse(res, HTTP_STATUS.OK, {
      categorias: result.data,
      pagination: result.pagination
    }, 'Categorías obtenidas exitosamente');

  } catch (error) {
    next(error);
  }
};

// Obtener categoría por ID
export const getCategoriaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const includeProducts = req.query.include_products === 'true';
    
    if (!id || isNaN(parseInt(id))) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'ID de categoría inválido');
    }

    logQuery(TABLES.CATEGORIAS, 'get_by_id', { id, includeProducts });

    let categoria;

    if (includeProducts) {
      // Obtener categoría con productos
      const { data, error } = await supabase
        .from('categorias')
        .select(`
          *,
          producto_categoria (
            productos (
              id,
              nombre,
              descripcion,
              precio,
              stock,
              imagen_url
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return sendError(res, HTTP_STATUS.NOT_FOUND, 'Categoría no encontrada');
        }
        throw error;
      }

      categoria = {
        ...data,
        productos: data.producto_categoria.map(pc => pc.productos),
        totalProductos: data.producto_categoria.length
      };
    } else {
      categoria = await getById(TABLES.CATEGORIAS, id);
      if (!categoria) {
        return sendError(res, HTTP_STATUS.NOT_FOUND, 'Categoría no encontrada');
      }
    }

    sendResponse(res, HTTP_STATUS.OK, CategoriaModel.fromDatabase(categoria), 'Categoría obtenida exitosamente');

  } catch (error) {
    next(error);
  }
};

// Crear nueva categoría
export const createCategoria = async (req, res, next) => {
  try {
    const data = sanitizeData(req.body);
    
    // Validar datos
    validateCategoryData(data);

    // Crear modelo de la categoría
    const categoria = new CategoriaModel(data);
    const categoryData = categoria.toDatabase();

    logQuery(TABLES.CATEGORIAS, 'create', categoryData);

    // Crear categoría en la base de datos
    const newCategoria = await create(TABLES.CATEGORIAS, categoryData);

    // Registrar en bitácora
    try {
      const adminId = req.adminId || req.admin?.id;
      await registrarAccion(
        adminId,
        ACCIONES_BITACORA.CREAR_CATEGORIA,
        `Categoría creada: ID=${newCategoria.id}, Nombre="${newCategoria.nombre}"`
      );
    } catch (bitacoraError) {
      console.error('Error al registrar en bitácora:', bitacoraError);
    }

    sendResponse(res, HTTP_STATUS.CREATED, CategoriaModel.fromDatabase(newCategoria), 'Categoría creada exitosamente');

  } catch (error) {
    next(error);
  }
};

// Actualizar categoría
export const updateCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = sanitizeData(req.body);

    if (!id || isNaN(parseInt(id))) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'ID de categoría inválido');
    }

    // Verificar que la categoría existe
    const existingCategoria = await getById(TABLES.CATEGORIAS, id);
    if (!existingCategoria) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Categoría no encontrada');
    }

    // Validar datos de actualización (permitir campos parciales)
    const updateData = { ...existingCategoria, ...data };
    validateCategoryData(updateData);

    // Crear modelo y obtener datos para actualizar
    const categoria = new CategoriaModel(updateData);
    const categoryData = categoria.toDatabase();

    logQuery(TABLES.CATEGORIAS, 'update', { id, data: categoryData });

    // Actualizar categoría
    const updatedCategoria = await update(TABLES.CATEGORIAS, id, categoryData);

    if (!updatedCategoria) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Categoría no encontrada');
    }

    // Registrar en bitácora
    try {
      const adminId = req.adminId || req.admin?.id;
      const cambios = [];
      
      if (data.nombre && data.nombre !== existingCategoria.nombre) {
        cambios.push(`Nombre: "${existingCategoria.nombre}" → "${data.nombre}"`);
      }
      if (data.descripcion && data.descripcion !== existingCategoria.descripcion) {
        cambios.push(`Descripción actualizada`);
      }

      const cambiosTexto = cambios.length > 0 ? `\n- ${cambios.join('\n- ')}` : '';
      await registrarAccion(
        adminId,
        ACCIONES_BITACORA.EDITAR_CATEGORIA,
        `Categoría ID=${id} actualizada: Nombre="${updatedCategoria.nombre}"${cambiosTexto}`
      );
    } catch (bitacoraError) {
      console.error('Error al registrar en bitácora:', bitacoraError);
    }

    sendResponse(res, HTTP_STATUS.OK, CategoriaModel.fromDatabase(updatedCategoria), 'Categoría actualizada exitosamente');

  } catch (error) {
    next(error);
  }
};

// Eliminar categoría
export const deleteCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'ID de categoría inválido');
    }

    // Verificar que la categoría existe
    const existingCategoria = await getById(TABLES.CATEGORIAS, id);
    if (!existingCategoria) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Categoría no encontrada');
    }

    // Verificar si la categoría tiene productos asociados
    const { data: productosAsociados, error } = await supabase
      .from('producto_categoria')
      .select('id')
      .eq('categoria_id', id)
      .limit(1);

    if (error) throw error;

    if (productosAsociados && productosAsociados.length > 0) {
      return sendError(res, HTTP_STATUS.CONFLICT, 'No se puede eliminar la categoría porque tiene productos asociados');
    }

    logQuery(TABLES.CATEGORIAS, 'delete', { id });

    // Eliminar categoría
    await deleteRecord(TABLES.CATEGORIAS, id);

    // Registrar en bitácora
    try {
      const adminId = req.adminId || req.admin?.id;
      await registrarAccion(
        adminId,
        ACCIONES_BITACORA.ELIMINAR_CATEGORIA,
        `Categoría eliminada: ID=${id}, Nombre="${existingCategoria.nombre}"`
      );
    } catch (bitacoraError) {
      console.error('Error al registrar en bitácora:', bitacoraError);
    }

    sendResponse(res, HTTP_STATUS.OK, null, 'Categoría eliminada exitosamente');

  } catch (error) {
    next(error);
  }
};

// Obtener productos de una categoría específica
export const getProductosByCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

    if (!id || isNaN(parseInt(id))) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'ID de categoría inválido');
    }

    // Verificar que la categoría existe
    const categoria = await getById(TABLES.CATEGORIAS, id);
    if (!categoria) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Categoría no encontrada');
    }

    // Validar parámetros de paginación
    validatePaginationParams(page, limit);

    logQuery(TABLES.CATEGORIAS, 'get_productos', { id, page, limit });

    const result = await getProductosByCategoriaHelper(id, page, limit);

    sendResponse(res, HTTP_STATUS.OK, {
      categoria: CategoriaModel.fromDatabase(categoria),
      productos: result.data,
      pagination: result.pagination
    }, `Productos de la categoría "${categoria.nombre}" obtenidos exitosamente`);

  } catch (error) {
    next(error);
  }
};

// Asignar categorías a un producto
export const assignCategoriasToProducto = async (req, res, next) => {
  try {
    const { id } = req.params; // ID del producto
    const { categorias } = req.body; // Array de IDs de categorías

    if (!id || isNaN(parseInt(id))) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'ID de producto inválido');
    }

    if (!categorias || !Array.isArray(categorias) || categorias.length === 0) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Se requiere un array de IDs de categorías');
    }

    // Verificar que el producto existe
    const producto = await getById(TABLES.PRODUCTOS, id);
    if (!producto) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Producto no encontrado');
    }

    // Verificar que todas las categorías existen
    const { data: categoriasExistentes, error: categoriesError } = await supabase
      .from('categorias')
      .select('id')
      .in('id', categorias);

    if (categoriesError) throw categoriesError;

    if (categoriasExistentes.length !== categorias.length) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Una o más categorías no existen');
    }

    logQuery(TABLES.PRODUCTO_CATEGORIA, 'assign_categories', { productoId: id, categorias });

    // Eliminar relaciones existentes
    const { error: deleteError } = await supabase
      .from('producto_categoria')
      .delete()
      .eq('producto_id', id);

    if (deleteError) throw deleteError;

    // Crear nuevas relaciones
    const relaciones = categorias.map(categoriaId => ({
      producto_id: parseInt(id),
      categoria_id: parseInt(categoriaId)
    }));

    const { data: nuevasRelaciones, error: insertError } = await supabase
      .from('producto_categoria')
      .insert(relaciones)
      .select();

    if (insertError) throw insertError;

    // Registrar en bitácora
    try {
      const adminId = req.adminId || req.admin?.id;
      const nombresCategories = categoriasExistentes.map(c => c.id).join(', ');
      await registrarAccion(
        adminId,
        ACCIONES_BITACORA.ASIGNAR_CATEGORIAS,
        `Categorías asignadas a producto: Producto ID=${id}, Nombre="${producto.nombre}", Categorías=[${nombresCategories}], Total=${categorias.length}`
      );
    } catch (bitacoraError) {
      console.error('Error al registrar en bitácora:', bitacoraError);
    }

    sendResponse(res, HTTP_STATUS.OK, {
      producto: { id: parseInt(id), nombre: producto.nombre },
      categorias: categoriasExistentes,
      relaciones: nuevasRelaciones.length
    }, 'Categorías asignadas al producto exitosamente');

  } catch (error) {
    next(error);
  }
};

// Remover categoría de un producto
export const removeProductoFromCategoria = async (req, res, next) => {
  try {
    const { id, productoId } = req.params; // ID de categoría y ID de producto

    if (!id || isNaN(parseInt(id)) || !productoId || isNaN(parseInt(productoId))) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'IDs de categoría y producto inválidos');
    }

    // Verificar que la relación existe
    const { data: relacion, error: relationError } = await supabase
      .from('producto_categoria')
      .select('id')
      .eq('categoria_id', id)
      .eq('producto_id', productoId)
      .single();

    if (relationError && relationError.code === 'PGRST116') {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'La relación producto-categoría no existe');
    }

    if (relationError) throw relationError;

    logQuery(TABLES.PRODUCTO_CATEGORIA, 'remove_relation', { categoriaId: id, productoId });

    // Eliminar relación
    const { error: deleteError } = await supabase
      .from('producto_categoria')
      .delete()
      .eq('categoria_id', id)
      .eq('producto_id', productoId);

    if (deleteError) throw deleteError;

    sendResponse(res, HTTP_STATUS.OK, null, 'Producto removido de la categoría exitosamente');

  } catch (error) {
    next(error);
  }
};
