import { 
  getAllWithPagination, 
  getById, 
  create, 
  update, 
  deleteRecord,
  checkStock
} from '../config/database.js';
import { OrdenModel, DetalleOrdenModel } from '../models/index.js';
import { validateOrderData, sendResponse, sendError, validatePaginationParams, sanitizeData } from '../utils/validators.js';
import { HTTP_STATUS, TABLES, PAGINATION, ORDER_STATUS } from '../utils/constants.js';
import { logQuery, supabase } from '../config/supabase.js';

// Obtener todas las órdenes con paginación
export const getAllOrdenes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const includeDetails = req.query.include_details === 'true';

    // Validar parámetros de paginación
    validatePaginationParams(page, limit);

    logQuery(TABLES.ORDENES, 'get_all', { page, limit, includeDetails });

    let result;

    if (includeDetails) {
      // Incluir detalles de la orden
      const { from, to } = { from: (page - 1) * limit, to: page * limit - 1 };
      
      // Optimización: Seleccionar solo campos necesarios para mejorar performance
      const { data, error, count } = await supabase
        .from('ordenes')
        .select(`
          id,
          cliente,
          telefono,
          direccion,
          total,
          fecha,
          detalle_orden (
            id,
            cantidad,
            precio_unitario,
            productos (
              id,
              nombre,
              precio,
              imagen_url
            )
          )
        `, { count: 'exact' })
        .order('fecha', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Optimización: Reducir transformaciones y cálculos innecesarios
      const ordenesConDetalles = data.map(orden => {
        const detalles = orden.detalle_orden || [];
        return {
          ...orden,
          detalles,
          totalItems: detalles.reduce((sum, detalle) => sum + detalle.cantidad, 0),
          productosUnicos: detalles.length
        };
      });

      result = {
        data: ordenesConDetalles,
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
      // Obtener órdenes sin detalles
      result = await getAllWithPagination(TABLES.ORDENES, page, limit, 'fecha');
    }

    sendResponse(res, HTTP_STATUS.OK, {
      ordenes: result.data,
      pagination: result.pagination
    }, 'Órdenes obtenidas exitosamente');

  } catch (error) {
    next(error);
  }
};

// Obtener orden por ID
export const getOrdenById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const includeDetails = req.query.include_details !== 'false'; // Por defecto incluir detalles
    
    if (!id || isNaN(parseInt(id))) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'ID de orden inválido');
    }

    logQuery(TABLES.ORDENES, 'get_by_id', { id, includeDetails });

    let orden;

    if (includeDetails) {
      // Optimización: Obtener orden con detalles usando campos específicos
      const { data, error } = await supabase
        .from('ordenes')
        .select(`
          id,
          cliente,
          telefono,
          direccion,
          total,
          fecha,
          detalle_orden (
            id,
            cantidad,
            precio_unitario,
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
          return sendError(res, HTTP_STATUS.NOT_FOUND, 'Orden no encontrada');
        }
        throw error;
      }

      orden = {
        ...data,
        detalles: data.detalle_orden,
        totalItems: data.detalle_orden.reduce((sum, detalle) => sum + detalle.cantidad, 0),
        productosUnicos: data.detalle_orden.length,
        subtotal: data.detalle_orden.reduce((sum, detalle) => sum + (detalle.cantidad * detalle.precio_unitario), 0)
      };
    } else {
      orden = await getById(TABLES.ORDENES, id);
      if (!orden) {
        return sendError(res, HTTP_STATUS.NOT_FOUND, 'Orden no encontrada');
      }
    }

    sendResponse(res, HTTP_STATUS.OK, OrdenModel.fromDatabase(orden), 'Orden obtenida exitosamente');

  } catch (error) {
    next(error);
  }
};

// Crear nueva orden con detalles
export const createOrden = async (req, res, next) => {
  try {
    const data = sanitizeData(req.body);
    const { productos, ...ordenData } = data;

    // Validar datos básicos de la orden
    validateOrderData(ordenData);

    // Validar que se incluyan productos
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Se requiere al menos un producto en la orden');
    }

    // Validar estructura de productos
    for (const producto of productos) {
      if (!producto.id || !producto.cantidad || producto.cantidad <= 0) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Cada producto debe tener id y cantidad válidos');
      }
    }

    logQuery(TABLES.ORDENES, 'create_with_details', { orden: ordenData, productos });

    // Verificar stock disponible
    const stockCheck = await checkStock(productos);
    const stockInsuficiente = stockCheck.filter(item => !item.stockSuficiente);

    if (stockInsuficiente.length > 0) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Stock insuficiente para algunos productos', {
        productosConStockInsuficiente: stockInsuficiente
      });
    }

    // Optimización: Obtener precios usando solo campos necesarios y ordenar por ID
    const productIds = productos.map(p => p.id);
    const { data: productosDB, error: productosError } = await supabase
      .from('productos')
      .select('id, nombre, precio, stock')
      .in('id', productIds)
      .order('id');

    if (productosError) throw productosError;

    if (productosDB.length !== productos.length) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Uno o más productos no existen');
    }

    // Optimización: Usar Map para búsquedas O(1) en lugar de find O(n)
    const productMap = new Map(productosDB.map(p => [p.id, p]));
    
    // Calcular total con optimización
    let totalCalculado = 0;
    const detallesParaCrear = productos.map(producto => {
      const productoDB = productMap.get(producto.id);
      const subtotal = productoDB.precio * producto.cantidad;
      totalCalculado += subtotal;

      return {
        producto_id: producto.id,
        cantidad: producto.cantidad,
        precio_unitario: productoDB.precio
      };
    });

    // Validar que el total enviado coincida con el calculado (con tolerancia de 0.01)
    if (Math.abs(ordenData.total - totalCalculado) > 0.01) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 
        `El total enviado (${ordenData.total}) no coincide con el total calculado (${totalCalculado})`);
    }

    // Iniciar transacción - crear orden
    const orden = new OrdenModel(ordenData);
    const orderData = orden.toDatabase();

    const nuevaOrden = await create(TABLES.ORDENES, orderData);

    // Crear detalles de la orden
    const detallesConOrdenId = detallesParaCrear.map(detalle => ({
      ...detalle,
      orden_id: nuevaOrden.id
    }));

    const { data: detallesCreados, error: detallesError } = await supabase
      .from('detalle_orden')
      .insert(detallesConOrdenId)
      .select();

    if (detallesError) {
      // Si falla la creación de detalles, eliminar la orden
      await deleteRecord(TABLES.ORDENES, nuevaOrden.id);
      throw detallesError;
    }

    // Optimización: Actualizar stock usando Map y batch updates más eficientes
    const updatePromises = productos.map(async (producto) => {
      const productoDB = productMap.get(producto.id);
      const nuevoStock = productoDB.stock - producto.cantidad;
      
      return supabase
        .from('productos')
        .update({ stock: nuevoStock })
        .eq('id', producto.id)
        .select('id'); // Solo retornar ID para confirmar
    });

    const stockUpdateResults = await Promise.all(updatePromises);
    const stockErrors = stockUpdateResults.filter(result => result.error);

    if (stockErrors.length > 0) {
      // Si falla la actualización de stock, eliminar orden y detalles
      await deleteRecord(TABLES.ORDENES, nuevaOrden.id);
      throw new Error('Error al actualizar stock de productos');
    }

    // Optimización: Obtener orden completa usando campos específicos
    const { data: ordenCompleta, error: ordenCompletaError } = await supabase
      .from('ordenes')
      .select(`
        id,
        cliente,
        telefono,
        direccion,
        total,
        fecha,
        detalle_orden (
          id,
          cantidad,
          precio_unitario,
          productos (
            id,
            nombre,
            precio,
            imagen_url
          )
        )
      `)
      .eq('id', nuevaOrden.id)
      .single();

    if (ordenCompletaError) throw ordenCompletaError;

    // Optimización: Usar desestructuración y cálculos eficientes
    const { detalle_orden: detalles, ...ordenBase } = ordenCompleta;
    const resultado = {
      ...ordenBase,
      detalles,
      totalItems: detalles.reduce((sum, detalle) => sum + detalle.cantidad, 0),
      productosUnicos: detalles.length
    };

    sendResponse(res, HTTP_STATUS.CREATED, OrdenModel.fromDatabase(resultado), 'Orden creada exitosamente');

  } catch (error) {
    next(error);
  }
};

// Actualizar estado de orden
export const updateOrden = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = sanitizeData(req.body);

    if (!id || isNaN(parseInt(id))) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'ID de orden inválido');
    }

    // Verificar que la orden existe
    const existingOrden = await getById(TABLES.ORDENES, id);
    if (!existingOrden) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Orden no encontrada');
    }

    // Solo permitir actualización de campos específicos (no productos)
    const allowedFields = ['cliente', 'telefono', 'direccion'];
    const updateData = {};
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'No hay campos válidos para actualizar');
    }

    // Validar datos de actualización
    const dataToValidate = { ...existingOrden, ...updateData };
    validateOrderData(dataToValidate);

    logQuery(TABLES.ORDENES, 'update', { id, data: updateData });

    // Actualizar orden
    const updatedOrden = await update(TABLES.ORDENES, id, updateData);

    if (!updatedOrden) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Orden no encontrada');
    }

    sendResponse(res, HTTP_STATUS.OK, OrdenModel.fromDatabase(updatedOrden), 'Orden actualizada exitosamente');

  } catch (error) {
    next(error);
  }
};

// Obtener detalles de una orden específica
export const getDetalleOrden = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'ID de orden inválido');
    }

    // Verificar que la orden existe
    const orden = await getById(TABLES.ORDENES, id);
    if (!orden) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Orden no encontrada');
    }

    logQuery(TABLES.DETALLE_ORDEN, 'get_by_orden', { ordenId: id });

    // Obtener detalles con información de productos
    const { data, error } = await supabase
      .from('detalle_orden')
      .select(`
        *,
        productos (
          id,
          nombre,
          descripcion,
          precio,
          stock,
          imagen_url
        )
      `)
      .eq('orden_id', id)
      .order('id');

    if (error) throw error;

    const resumen = {
      orden: OrdenModel.fromDatabase(orden),
      detalles: data,
      resumen: {
        totalItems: data.reduce((sum, detalle) => sum + detalle.cantidad, 0),
        productosUnicos: data.length,
        subtotal: data.reduce((sum, detalle) => sum + (detalle.cantidad * detalle.precio_unitario), 0)
      }
    };

    sendResponse(res, HTTP_STATUS.OK, resumen, 'Detalle de orden obtenido exitosamente');

  } catch (error) {
    next(error);
  }
};

// Cancelar orden (solo si no ha sido procesada)
export const cancelOrden = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'ID de orden inválido');
    }

    // Verificar que la orden existe
    const orden = await getById(TABLES.ORDENES, id);
    if (!orden) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Orden no encontrada');
    }

    // Obtener detalles de la orden para restaurar stock
    const { data: detalles, error: detallesError } = await supabase
      .from('detalle_orden')
      .select('*')
      .eq('orden_id', id);

    if (detallesError) throw detallesError;

    logQuery(TABLES.ORDENES, 'cancel', { id });

    // Restaurar stock de productos
    const restorePromises = detalles.map(async (detalle) => {
      const { data: producto, error: productoError } = await supabase
        .from('productos')
        .select('stock')
        .eq('id', detalle.producto_id)
        .single();

      if (productoError) throw productoError;

      const nuevoStock = producto.stock + detalle.cantidad;
      
      return supabase
        .from('productos')
        .update({ stock: nuevoStock })
        .eq('id', detalle.producto_id);
    });

    const restoreResults = await Promise.all(restorePromises);
    const restoreErrors = restoreResults.filter(result => result.error);

    if (restoreErrors.length > 0) {
      throw new Error('Error al restaurar stock de productos');
    }

    // Eliminar orden (esto eliminará automáticamente los detalles por CASCADE)
    await deleteRecord(TABLES.ORDENES, id);

    sendResponse(res, HTTP_STATUS.OK, null, 'Orden cancelada exitosamente y stock restaurado');

  } catch (error) {
    next(error);
  }
};

// Obtener estadísticas básicas de órdenes
export const getOrdenesStats = async (req, res, next) => {
  try {
    logQuery(TABLES.ORDENES, 'stats', {});

    // Obtener estadísticas básicas
    const { data: stats, error: statsError } = await supabase
      .rpc('get_ordenes_stats');

    if (statsError && statsError.code !== '42883') { // Función no existe
      throw statsError;
    }

    // Si la función RPC no existe, calcular estadísticas manualmente
    const { data: ordenes, error: ordenesError } = await supabase
      .from('ordenes')
      .select('total, fecha');

    if (ordenesError) throw ordenesError;

    const totalOrdenes = ordenes.length;
    const ventasTotal = ordenes.reduce((sum, orden) => sum + parseFloat(orden.total), 0);
    const promedioOrden = totalOrdenes > 0 ? ventasTotal / totalOrdenes : 0;

    // Órdenes por mes (últimos 6 meses)
    const hoy = new Date();
    const seiseMesesAtras = new Date(hoy.getFullYear(), hoy.getMonth() - 6, 1);
    
    const ordenesRecientes = ordenes.filter(orden => 
      new Date(orden.fecha) >= seiseMesesAtras
    );

    const estadisticas = {
      totalOrdenes,
      ventasTotal: parseFloat(ventasTotal.toFixed(2)),
      promedioOrden: parseFloat(promedioOrden.toFixed(2)),
      ordenesUltimos6Meses: ordenesRecientes.length,
      ventasUltimos6Meses: parseFloat(
        ordenesRecientes.reduce((sum, orden) => sum + parseFloat(orden.total), 0).toFixed(2)
      )
    };

    sendResponse(res, HTTP_STATUS.OK, estadisticas, 'Estadísticas de órdenes obtenidas exitosamente');

  } catch (error) {
    next(error);
  }
};
