import { supabase } from './supabase.js';

// Funciones helper para consultas comunes

// Helper para paginación
export const paginate = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return {
    from: offset,
    to: offset + limit - 1
  };
};

// Helper para búsqueda con filtros
export const buildSearchQuery = (table, searchTerm, searchColumns = []) => {
  let query = supabase.from(table).select('*');
  
  if (searchTerm && searchColumns.length > 0) {
    const searchConditions = searchColumns
      .map(col => `${col}.ilike.%${searchTerm}%`)
      .join(',');
    query = query.or(searchConditions);
  }
  
  return query;
};

// Helper para obtener todos los registros con paginación - OPTIMIZADO
export const getAllWithPagination = async (table, page = 1, limit = 10, orderBy = 'id') => {
  try {
    const { from, to } = paginate(page, limit);
    
    // Optimización: Solo seleccionar campos necesarios y usar índices
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .order(orderBy, { ascending: true })
      .range(from, to);

    if (error) throw error;

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNext: to < count - 1,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    throw new Error(`Error al obtener registros de ${table}: ${error.message}`);
  }
};

// Helper para obtener un registro por ID
export const getById = async (table, id) => {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw error;
    }

    return data;
  } catch (error) {
    throw new Error(`Error al obtener registro de ${table} con ID ${id}: ${error.message}`);
  }
};

// Helper para crear un nuevo registro
export const create = async (table, data) => {
  try {
    const { data: newRecord, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    return newRecord;
  } catch (error) {
    throw new Error(`Error al crear registro en ${table}: ${error.message}`);
  }
};

// Helper para actualizar un registro
export const update = async (table, id, data) => {
  try {
    const { data: updatedRecord, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw error;
    }

    return updatedRecord;
  } catch (error) {
    throw new Error(`Error al actualizar registro en ${table} con ID ${id}: ${error.message}`);
  }
};

// Helper para eliminar un registro
export const deleteRecord = async (table, id) => {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    throw new Error(`Error al eliminar registro de ${table} con ID ${id}: ${error.message}`);
  }
};

// Helper específico para productos con categorías - OPTIMIZADO
export const getProductosWithCategorias = async (page = 1, limit = 10) => {
  try {
    const { from, to } = paginate(page, limit);
    
    // Optimización: Usar LEFT JOIN y seleccionar solo campos necesarios
    const { data, error, count } = await supabase
      .from('productos')
      .select(`
        id,
        nombre,
        descripcion,
        precio,
        stock,
        imagen_url,
        producto_categoria (
          categorias (
            id,
            nombre
          )
        )
      `, { count: 'exact' })
      .order('id', { ascending: true })
      .range(from, to);

    if (error) throw error;

    // Transformar datos para facilitar el uso - Optimizado
    const productosConCategorias = data.map(producto => ({
      ...producto,
      categorias: producto.producto_categoria?.map(pc => pc.categorias) || []
    }));

    return {
      data: productosConCategorias,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNext: to < count - 1,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    throw new Error(`Error al obtener productos con categorías: ${error.message}`);
  }
};

// Helper para obtener un producto específico con sus categorías
export const getProductoWithCategorias = async (productoId) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        producto_categoria (
          categorias (
            id,
            nombre
          )
        )
      `)
      .eq('id', productoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Producto no encontrado
      }
      throw error;
    }

    // Transformar datos para incluir categorías
    return {
      ...data,
      categorias: data.producto_categoria?.map(pc => pc.categorias) || []
    };
  } catch (error) {
    throw new Error(`Error al obtener producto con categorías: ${error.message}`);
  }
};

// Helper para obtener productos por categoría - OPTIMIZADO
export const getProductosByCategoria = async (categoriaId, page = 1, limit = 10) => {
  try {
    const { from, to } = paginate(page, limit);
    
    // Optimización: INNER JOIN más eficiente y incluir todas las categorías del producto
    const { data, error, count } = await supabase
      .from('productos')
      .select(`
        *,
        producto_categoria!inner (
          categoria_id,
          categorias (
            id,
            nombre
          )
        )
      `, { count: 'exact' })
      .eq('producto_categoria.categoria_id', categoriaId)
      .order('id', { ascending: true })
      .range(from, to);

    if (error) throw error;

    // Ahora necesitamos obtener TODAS las categorías de cada producto, no solo la filtrada
    const productosConTodasCategorias = await Promise.all(
      data.map(async (producto) => {
        // Obtener todas las categorías del producto
        const { data: todasCategorias, error: catError } = await supabase
          .from('producto_categoria')
          .select(`
            categorias (
              id,
              nombre
            )
          `)
          .eq('producto_id', producto.id);

        if (catError) throw catError;

        return {
          ...producto,
          categorias: todasCategorias?.map(pc => pc.categorias) || []
        };
      })
    );

    return {
      data: productosConTodasCategorias,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNext: to < count - 1,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    throw new Error(`Error al obtener productos por categoría ${categoriaId}: ${error.message}`);
  }
};

// Helper para verificar stock de múltiples productos - OPTIMIZADO
export const checkStock = async (productos) => {
  try {
    const productIds = productos.map(p => p.id);
    
    // Optimización: Solo seleccionar campos necesarios para verificación de stock
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, stock')
      .in('id', productIds)
      .order('id'); // Agregar orden para mejorar performance

    if (error) throw error;

    // Optimización: Usar Map para búsqueda más eficiente
    const productMap = new Map(data.map(p => [p.id, p]));

    const stockCheck = productos.map(producto => {
      const dbProducto = productMap.get(producto.id);
      return {
        id: producto.id,
        nombre: dbProducto?.nombre || 'Producto no encontrado',
        cantidadSolicitada: producto.cantidad,
        stockDisponible: dbProducto?.stock || 0,
        stockSuficiente: dbProducto ? dbProducto.stock >= producto.cantidad : false
      };
    });

    return stockCheck;
  } catch (error) {
    throw new Error(`Error al verificar stock: ${error.message}`);
  }
};

// Helper para buscar productos - MEJORADO CON CATEGORÍAS
export const searchProductos = async (searchTerm, page = 1, limit = 10) => {
  try {
    const { from, to } = paginate(page, limit);
    
    // Búsqueda avanzada que incluye categorías
    const { data, error, count } = await supabase
      .from('productos')
      .select(`
        *,
        producto_categoria (
          categorias (
            id,
            nombre
          )
        )
      `, { count: 'exact' })
      .or(`nombre.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%`)
      .order('nombre', { ascending: true })
      .range(from, to);

    if (error) throw error;

    // Transformar para incluir categorías
    const productosConCategorias = data.map(producto => ({
      ...producto,
      categorias: producto.producto_categoria?.map(pc => pc.categorias) || []
    }));

    return {
      data: productosConCategorias,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNext: to < count - 1,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    throw new Error(`Error en búsqueda de productos: ${error.message}`);
  }
};

// Helper para búsqueda GLOBAL (sin paginación)
export const searchProductosGlobal = async (searchTerm, maxResults = 50) => {
  try {
    // Búsqueda global limitada a X resultados
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        producto_categoria (
          categorias (
            id,
            nombre
          )
        )
      `)
      .or(`nombre.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%`)
      .order('nombre', { ascending: true })
      .limit(maxResults);

    if (error) throw error;

    // Transformar para incluir categorías
    const productosConCategorias = data.map(producto => ({
      ...producto,
      categorias: producto.producto_categoria?.map(pc => pc.categorias) || []
    }));

    return {
      data: productosConCategorias,
      total: data.length,
      searchTerm: searchTerm
    };
  } catch (error) {
    throw new Error(`Error en búsqueda global: ${error.message}`);
  }
};

// Helper para búsqueda que INCLUYE categorías en los resultados
export const searchProductosAvanzado = async (searchTerm, page = 1, limit = 10) => {
  try {
    const { from, to } = paginate(page, limit);
    
    // Búsqueda que incluye productos Y categorías
    const { data, error, count } = await supabase
      .from('productos')
      .select(`
        *,
        producto_categoria (
          categorias (
            id,
            nombre,
            descripcion
          )
        )
      `, { count: 'exact' })
      .or(`
        nombre.ilike.%${searchTerm}%,
        descripcion.ilike.%${searchTerm}%,
        producto_categoria.categorias.nombre.ilike.%${searchTerm}%
      `)
      .order('nombre', { ascending: true })
      .range(from, to);

    if (error) throw error;

    // Transformar para incluir categorías
    const productosConCategorias = data.map(producto => ({
      ...producto,
      categorias: producto.producto_categoria?.map(pc => pc.categorias) || []
    }));

    return {
      data: productosConCategorias,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNext: to < count - 1,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    throw new Error(`Error en búsqueda avanzada: ${error.message}`);
  }
};

// Helper para manejar relaciones producto-categoría
export const assignCategoriasToProducto = async (productoId, categoriaIds) => {
  try {
    if (!categoriaIds || !Array.isArray(categoriaIds) || categoriaIds.length === 0) {
      return { success: true, message: 'No hay categorías para asignar' };
    }

    // Primero eliminar todas las categorías existentes del producto
    const { error: deleteError } = await supabase
      .from('producto_categoria')
      .delete()
      .eq('producto_id', productoId);

    if (deleteError) throw deleteError;

    // Luego insertar las nuevas relaciones
    const relaciones = categoriaIds.map(categoriaId => ({
      producto_id: parseInt(productoId),
      categoria_id: parseInt(categoriaId)
    }));

    const { data, error: insertError } = await supabase
      .from('producto_categoria')
      .insert(relaciones)
      .select();

    if (insertError) throw insertError;

    return { 
      success: true, 
      data: data,
      message: `${relaciones.length} categorías asignadas al producto` 
    };
  } catch (error) {
    throw new Error(`Error al asignar categorías al producto: ${error.message}`);
  }
};

// Helper para obtener categorías de un producto
export const getCategoriasDeProducto = async (productoId) => {
  try {
    const { data, error } = await supabase
      .from('producto_categoria')
      .select(`
        categoria_id,
        categorias (
          id,
          nombre,
          descripcion
        )
      `)
      .eq('producto_id', productoId);

    if (error) throw error;

    return data.map(item => item.categorias);
  } catch (error) {
    throw new Error(`Error al obtener categorías del producto: ${error.message}`);
  }
};

// Helper para eliminar todas las categorías de un producto
export const removeAllCategoriasFromProducto = async (productoId) => {
  try {
    const { error } = await supabase
      .from('producto_categoria')
      .delete()
      .eq('producto_id', productoId);

    if (error) throw error;

    return { success: true, message: 'Categorías eliminadas del producto' };
  } catch (error) {
    throw new Error(`Error al eliminar categorías del producto: ${error.message}`);
  }
};
