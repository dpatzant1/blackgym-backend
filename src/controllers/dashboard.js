import { supabase, logQuery } from '../config/supabase.js';
import { sendResponse, sendError } from '../utils/validators.js';
import { HTTP_STATUS, TABLES, DASHBOARD } from '../utils/constants.js';

/**
 * Controlador para el Dashboard de Ventas
 * Todos los endpoints utilizan la estructura de BD existente
 * SIN modificaciones a la base de datos
 * 
 * Endpoints disponibles:
 * - getDashboardGeneral: Métricas principales (ventas, producto top, categoría top)
 * - getVentasPorPeriodo: Evolución mensual y diaria de ventas
 * - getTopProductos: Top N productos más vendidos con análisis Pareto
 * - getAnalisisCategorias: Distribución de ventas por categoría
 * - getComparativaAnual: Comparación de ventas entre años
 * - exportarDashboardCSV: Exportar datos del dashboard a CSV
 */

// ============================================================================
// FUNCIONES AUXILIARES - Fase 2
// ============================================================================

/**
 * Obtener ventas totales en un periodo
 * @param {number} year - Año a consultar
 * @param {number|null} month - Mes a consultar (null = todos los meses)
 * @returns {Promise<Object>}
 */
export const getVentasTotales = async (year, month = null) => {
  try {
    let query = supabase
      .from('ordenes')
      .select('total, fecha')
      .in('estado', DASHBOARD.ESTADOS_VALIDOS_PARA_VENTAS)
      .gte('fecha', `${year}-01-01`)
      .lte('fecha', `${year}-12-31`);

    if (month !== null) {
      const monthStr = String(month).padStart(2, '0');
      const diasEnMes = new Date(year, month, 0).getDate();
      query = query
        .gte('fecha', `${year}-${monthStr}-01`)
        .lte('fecha', `${year}-${monthStr}-${diasEnMes}`);
    }

    const { data, error } = await query;
    
    if (error) throw error;

    const totalVentas = data.reduce((sum, orden) => sum + parseFloat(orden.total), 0);
    const totalOrdenes = data.length;
    const promedioOrden = totalOrdenes > 0 ? totalVentas / totalOrdenes : 0;

    return {
      totalVentas: parseFloat(totalVentas.toFixed(2)),
      totalOrdenes,
      promedioOrden: parseFloat(promedioOrden.toFixed(2))
    };
  } catch (error) {
    console.error('Error en getVentasTotales:', error);
    throw error;
  }
};

/**
 * Obtener el producto más vendido en un periodo
 * @param {number} year - Año a consultar
 * @param {number|null} month - Mes a consultar
 * @returns {Promise<Object>}
 */
export const getProductoTop = async (year, month = null) => {
  try {
    let query = supabase
      .from('detalle_orden')
      .select(`
        producto_id,
        cantidad,
        precio_unitario,
        ordenes!inner (
          fecha,
          estado
        ),
        productos (
          id,
          nombre,
          imagen_url
        )
      `)
      .in('ordenes.estado', DASHBOARD.ESTADOS_VALIDOS_PARA_VENTAS)
      .gte('ordenes.fecha', `${year}-01-01`)
      .lte('ordenes.fecha', `${year}-12-31`);

    if (month !== null) {
      const monthStr = String(month).padStart(2, '0');
      const diasEnMes = new Date(year, month, 0).getDate();
      query = query
        .gte('ordenes.fecha', `${year}-${monthStr}-01`)
        .lte('ordenes.fecha', `${year}-${monthStr}-${diasEnMes}`);
    }

    const { data: detalles, error: detallesError } = await query;
    
    if (detallesError) throw detallesError;

    if (!detalles || detalles.length === 0) {
      return null;
    }

    // Agrupar por producto
    const productosMap = {};
    
    detalles.forEach(detalle => {
      const productoId = detalle.producto_id;
      if (!productosMap[productoId]) {
        productosMap[productoId] = {
          id: detalle.productos.id,
          nombre: detalle.productos.nombre,
          imagen_url: detalle.productos.imagen_url,
          totalVentas: 0,
          unidadesVendidas: 0
        };
      }
      
      productosMap[productoId].totalVentas += detalle.cantidad * detalle.precio_unitario;
      productosMap[productoId].unidadesVendidas += detalle.cantidad;
    });

    // Encontrar el producto con más ventas
    const productos = Object.values(productosMap);
    const productoTop = productos.reduce((max, producto) => 
      producto.totalVentas > max.totalVentas ? producto : max
    , productos[0]);

    return {
      id: productoTop.id,
      nombre: productoTop.nombre,
      imagen_url: productoTop.imagen_url,
      totalVentas: parseFloat(productoTop.totalVentas.toFixed(2)),
      unidadesVendidas: productoTop.unidadesVendidas
    };
  } catch (error) {
    console.error('Error en getProductoTop:', error);
    throw error;
  }
};

/**
 * Obtener la categoría más vendida en un periodo
 * @param {number} year - Año a consultar
 * @param {number|null} month - Mes a consultar
 * @returns {Promise<Object>}
 */
export const getCategoriaTop = async (year, month = null) => {
  try {
    let query = supabase
      .from('detalle_orden')
      .select(`
        producto_id,
        cantidad,
        precio_unitario,
        ordenes!inner (
          fecha,
          estado
        )
      `)
      .in('ordenes.estado', DASHBOARD.ESTADOS_VALIDOS_PARA_VENTAS)
      .gte('ordenes.fecha', `${year}-01-01`)
      .lte('ordenes.fecha', `${year}-12-31`);

    if (month !== null) {
      const monthStr = String(month).padStart(2, '0');
      const diasEnMes = new Date(year, month, 0).getDate();
      query = query
        .gte('ordenes.fecha', `${year}-${monthStr}-01`)
        .lte('ordenes.fecha', `${year}-${monthStr}-${diasEnMes}`);
    }

    const { data: detalles, error: detallesError } = await query;
    
    if (detallesError) throw detallesError;

    if (!detalles || detalles.length === 0) {
      return null;
    }

    // Obtener productos con sus categorías
    const productoIds = [...new Set(detalles.map(d => d.producto_id))];
    
    const { data: productosCategorias, error: pcError } = await supabase
      .from('producto_categoria')
      .select(`
        producto_id,
        categorias (
          id,
          nombre
        )
      `)
      .in('producto_id', productoIds);

    if (pcError) throw pcError;

    // Mapear ventas por categoría
    const categoriasMap = {};
    
    detalles.forEach(detalle => {
      const categoriasDelProducto = productosCategorias.filter(
        pc => pc.producto_id === detalle.producto_id
      );

      categoriasDelProducto.forEach(pc => {
        const catId = pc.categorias.id;
        const catNombre = pc.categorias.nombre;
        
        if (!categoriasMap[catId]) {
          categoriasMap[catId] = {
            id: catId,
            nombre: catNombre,
            totalVentas: 0
          };
        }
        
        categoriasMap[catId].totalVentas += detalle.cantidad * detalle.precio_unitario;
      });
    });

    // Encontrar categoría con más ventas
    const categorias = Object.values(categoriasMap);
    
    if (categorias.length === 0) {
      return null;
    }

    const categoriaTop = categorias.reduce((max, cat) => 
      cat.totalVentas > max.totalVentas ? cat : max
    , categorias[0]);

    return {
      id: categoriaTop.id,
      nombre: categoriaTop.nombre,
      totalVentas: parseFloat(categoriaTop.totalVentas.toFixed(2))
    };
  } catch (error) {
    console.error('Error en getCategoriaTop:', error);
    throw error;
  }
};

// ============================================================================
// FUNCIONES AUXILIARES - Fase 3
// ============================================================================

/**
 * Obtener ventas por mes en un año
 * @param {number} year - Año a consultar
 * @returns {Promise<Array>}
 */
export const getEvolucionMensual = async (year) => {
  try {
    const { data, error } = await supabase
      .from('ordenes')
      .select('total, fecha')
      .in('estado', DASHBOARD.ESTADOS_VALIDOS_PARA_VENTAS)
      .gte('fecha', `${year}-01-01`)
      .lte('fecha', `${year}-12-31`)
      .order('fecha');

    if (error) throw error;

    // Agrupar por mes
    const mesesMap = {};
    
    // Inicializar todos los meses en 0
    for (let i = 1; i <= 12; i++) {
      mesesMap[i] = {
        mes: i,
        mesNombre: DASHBOARD.MESES[i - 1],
        mesAbreviado: DASHBOARD.MESES_ABREVIADOS[i - 1],
        ventas: 0,
        ordenes: 0
      };
    }

    // Sumar ventas por mes
    data.forEach(orden => {
      const fecha = new Date(orden.fecha);
      const mes = fecha.getMonth() + 1; // 1-12
      
      mesesMap[mes].ventas += parseFloat(orden.total);
      mesesMap[mes].ordenes += 1;
    });

    // Convertir a array y calcular promedios
    const evolucion = Object.values(mesesMap).map(mes => ({
      ...mes,
      ventas: parseFloat(mes.ventas.toFixed(2)),
      promedioOrden: mes.ordenes > 0 ? parseFloat((mes.ventas / mes.ordenes).toFixed(2)) : 0
    }));

    return evolucion;
  } catch (error) {
    console.error('Error en getEvolucionMensual:', error);
    throw error;
  }
};

/**
 * Obtener ventas por día en un mes específico
 * @param {number} year - Año a consultar
 * @param {number} month - Mes a consultar (1-12)
 * @returns {Promise<Array>}
 */
export const getEvolucionDiaria = async (year, month) => {
  try {
    const monthStr = String(month).padStart(2, '0');
    const diasEnMes = new Date(year, month, 0).getDate();

    const { data, error } = await supabase
      .from('ordenes')
      .select('total, fecha')
      .in('estado', DASHBOARD.ESTADOS_VALIDOS_PARA_VENTAS)
      .gte('fecha', `${year}-${monthStr}-01`)
      .lte('fecha', `${year}-${monthStr}-${diasEnMes}`)
      .order('fecha');

    if (error) throw error;

    // Inicializar todos los días
    const diasMap = {};
    for (let i = 1; i <= diasEnMes; i++) {
      diasMap[i] = {
        dia: i,
        fecha: `${year}-${monthStr}-${String(i).padStart(2, '0')}`,
        ventas: 0,
        ordenes: 0
      };
    }

    // Sumar ventas por día
    data.forEach(orden => {
      const fecha = new Date(orden.fecha);
      const dia = fecha.getDate();
      
      diasMap[dia].ventas += parseFloat(orden.total);
      diasMap[dia].ordenes += 1;
    });

    const evolucion = Object.values(diasMap).map(dia => ({
      ...dia,
      ventas: parseFloat(dia.ventas.toFixed(2))
    }));

    return evolucion;
  } catch (error) {
    console.error('Error en getEvolucionDiaria:', error);
    throw error;
  }
};

/**
 * Comparar ventas entre dos años
 * @param {number} year1 - Primer año
 * @param {number} year2 - Segundo año
 * @returns {Promise<Object>}
 */
export const getComparativaAnualData = async (year1, year2) => {
  try {
    // Obtener evolución mensual de ambos años en paralelo
    const [evolucionYear1, evolucionYear2] = await Promise.all([
      getEvolucionMensual(year1),
      getEvolucionMensual(year2)
    ]);

    // Calcular totales
    const totalYear1 = evolucionYear1.reduce((sum, mes) => sum + mes.ventas, 0);
    const totalYear2 = evolucionYear2.reduce((sum, mes) => sum + mes.ventas, 0);

    // Calcular crecimiento
    const crecimiento = totalYear1 > 0 
      ? ((totalYear2 - totalYear1) / totalYear1) * 100 
      : 0;

    // Análisis mensual de crecimiento
    const analisisMensual = evolucionYear1.map((mes, index) => {
      const ventasYear1 = mes.ventas;
      const ventasYear2 = evolucionYear2[index].ventas;
      const crecimientoMes = ventasYear1 > 0 
        ? ((ventasYear2 - ventasYear1) / ventasYear1) * 100 
        : 0;

      return {
        mes: mes.mes,
        mesNombre: mes.mesNombre,
        mesAbreviado: mes.mesAbreviado,
        ventasYear1,
        ventasYear2,
        diferencia: parseFloat((ventasYear2 - ventasYear1).toFixed(2)),
        crecimientoMes: parseFloat(crecimientoMes.toFixed(2))
      };
    });

    return {
      year1,
      year2,
      totalYear1: parseFloat(totalYear1.toFixed(2)),
      totalYear2: parseFloat(totalYear2.toFixed(2)),
      diferencia: parseFloat((totalYear2 - totalYear1).toFixed(2)),
      crecimiento: parseFloat(crecimiento.toFixed(2)),
      evolucionYear1,
      evolucionYear2,
      analisisMensual
    };
  } catch (error) {
    console.error('Error en getComparativaAnualData:', error);
    throw error;
  }
};

// ============================================================================
// FUNCIONES AUXILIARES - Fase 4
// ============================================================================

/**
 * Obtener los N productos más vendidos
 * @param {number} year - Año a consultar
 * @param {number|null} month - Mes a consultar
 * @param {number} limit - Cantidad de productos a retornar
 * @returns {Promise<Array>}
 */
export const getTopNProductos = async (year, month = null, limit = 10) => {
  try {
    let query = supabase
      .from('detalle_orden')
      .select(`
        producto_id,
        cantidad,
        precio_unitario,
        ordenes!inner (
          fecha,
          estado
        ),
        productos (
          id,
          nombre,
          imagen_url,
          precio
        )
      `)
      .in('ordenes.estado', DASHBOARD.ESTADOS_VALIDOS_PARA_VENTAS)
      .gte('ordenes.fecha', `${year}-01-01`)
      .lte('ordenes.fecha', `${year}-12-31`);

    if (month !== null) {
      const monthStr = String(month).padStart(2, '0');
      const diasEnMes = new Date(year, month, 0).getDate();
      query = query
        .gte('ordenes.fecha', `${year}-${monthStr}-01`)
        .lte('ordenes.fecha', `${year}-${monthStr}-${diasEnMes}`);
    }

    const { data, error } = await query;
    
    if (error) throw error;

    // Agrupar por producto
    const productosMap = {};
    
    data.forEach(detalle => {
      const productoId = detalle.producto_id;
      
      if (!productosMap[productoId]) {
        productosMap[productoId] = {
          id: detalle.productos.id,
          nombre: detalle.productos.nombre,
          imagen_url: detalle.productos.imagen_url,
          precioActual: parseFloat(detalle.productos.precio),
          totalVentas: 0,
          unidadesVendidas: 0
        };
      }
      
      productosMap[productoId].totalVentas += detalle.cantidad * detalle.precio_unitario;
      productosMap[productoId].unidadesVendidas += detalle.cantidad;
    });

    // Convertir a array y ordenar por ventas
    const productos = Object.values(productosMap)
      .map(p => ({
        ...p,
        totalVentas: parseFloat(p.totalVentas.toFixed(2)),
        precioPromedio: p.unidadesVendidas > 0 
          ? parseFloat((p.totalVentas / p.unidadesVendidas).toFixed(2)) 
          : 0
      }))
      .sort((a, b) => b.totalVentas - a.totalVentas)
      .slice(0, limit);

    return productos;
  } catch (error) {
    console.error('Error en getTopNProductos:', error);
    throw error;
  }
};

/**
 * Calcular análisis Pareto para productos
 * Agrega porcentaje acumulado de ventas
 * @param {Array} productos - Array de productos con totalVentas
 * @returns {Array}
 */
export const calcularPareto = (productos) => {
  if (!productos || productos.length === 0) {
    return [];
  }

  const totalGeneral = productos.reduce((sum, p) => sum + p.totalVentas, 0);
  
  let acumulado = 0;
  
  return productos.map((producto, index) => {
    const porcentaje = totalGeneral > 0 
      ? (producto.totalVentas / totalGeneral) * 100 
      : 0;
    
    acumulado += porcentaje;
    
    return {
      ...producto,
      porcentajeDelTotal: parseFloat(porcentaje.toFixed(2)),
      porcentajeAcumulado: parseFloat(acumulado.toFixed(2)),
      posicion: index + 1
    };
  });
};

/**
 * Obtener distribución de ventas por categoría
 * @param {number} year - Año a consultar
 * @param {number|null} month - Mes a consultar
 * @returns {Promise<Array>}
 */
export const getDistribucionCategorias = async (year, month = null) => {
  try {
    // Obtener todas las órdenes del periodo
    let query = supabase
      .from('detalle_orden')
      .select(`
        producto_id,
        cantidad,
        precio_unitario,
        ordenes!inner (
          fecha,
          estado
        )
      `)
      .in('ordenes.estado', DASHBOARD.ESTADOS_VALIDOS_PARA_VENTAS)
      .gte('ordenes.fecha', `${year}-01-01`)
      .lte('ordenes.fecha', `${year}-12-31`);

    if (month !== null) {
      const monthStr = String(month).padStart(2, '0');
      const diasEnMes = new Date(year, month, 0).getDate();
      query = query
        .gte('ordenes.fecha', `${year}-${monthStr}-01`)
        .lte('ordenes.fecha', `${year}-${monthStr}-${diasEnMes}`);
    }

    const { data: detalles, error } = await query;
    
    if (error) throw error;

    if (detalles.length === 0) {
      return [];
    }

    // Obtener todas las categorías
    const { data: todasCategorias, error: catError } = await supabase
      .from('categorias')
      .select('id, nombre')
      .order('nombre');

    if (catError) throw catError;

    // Obtener relación producto-categoría
    const productoIds = [...new Set(detalles.map(d => d.producto_id))];
    
    const { data: productosCategorias, error: pcError } = await supabase
      .from('producto_categoria')
      .select(`
        producto_id,
        categoria_id,
        categorias (
          id,
          nombre
        )
      `)
      .in('producto_id', productoIds);

    if (pcError) throw pcError;

    // Calcular ventas por categoría
    const categoriasMap = {};
    
    // Inicializar todas las categorías en 0
    todasCategorias.forEach(cat => {
      categoriasMap[cat.id] = {
        id: cat.id,
        nombre: cat.nombre,
        totalVentas: 0,
        productosUnicos: new Set()
      };
    });

    // Sumar ventas
    detalles.forEach(detalle => {
      const categoriasDelProducto = productosCategorias.filter(
        pc => pc.producto_id === detalle.producto_id
      );

      categoriasDelProducto.forEach(pc => {
        const catId = pc.categoria_id;
        const ventaDetalle = detalle.cantidad * detalle.precio_unitario;
        
        if (categoriasMap[catId]) {
          categoriasMap[catId].totalVentas += ventaDetalle;
          categoriasMap[catId].productosUnicos.add(detalle.producto_id);
        }
      });
    });

    // Calcular total y porcentajes
    const categorias = Object.values(categoriasMap)
      .map(cat => ({
        id: cat.id,
        nombre: cat.nombre,
        totalVentas: parseFloat(cat.totalVentas.toFixed(2)),
        productosUnicos: cat.productosUnicos.size
      }))
      .filter(cat => cat.totalVentas > 0) // Solo categorías con ventas
      .sort((a, b) => b.totalVentas - a.totalVentas);

    const totalGeneral = categorias.reduce((sum, cat) => sum + cat.totalVentas, 0);

    const resultado = categorias.map(cat => ({
      ...cat,
      porcentaje: totalGeneral > 0 
        ? parseFloat(((cat.totalVentas / totalGeneral) * 100).toFixed(2)) 
        : 0
    }));

    return resultado;
  } catch (error) {
    console.error('Error en getDistribucionCategorias:', error);
    throw error;
  }
};

// ============================================================================
// ENDPOINTS PRINCIPALES
// ============================================================================

/**
 * GET /api/dashboard/general
 * Obtiene todas las métricas principales del dashboard
 * Query params: year (requerido), month (opcional)
 */
export const getDashboardGeneral = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year);
    const month = req.query.month ? parseInt(req.query.month) : null;

    if (!year || isNaN(year)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El año es requerido y debe ser válido');
    }

    if (month !== null && (isNaN(month) || month < 1 || month > 12)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El mes debe estar entre 1 y 12');
    }

    logQuery('dashboard', 'get_general', { year, month });

    // Obtener todas las métricas en paralelo
    const [ventasTotales, productoTop, categoriaTop] = await Promise.all([
      getVentasTotales(year, month),
      getProductoTop(year, month),
      getCategoriaTop(year, month)
    ]);

    const dashboard = {
      periodo: {
        year,
        month: month || 'todos',
        mesNombre: month ? DASHBOARD.MESES[month - 1] : 'Todos los meses'
      },
      metricas: {
        ventasTotales: ventasTotales.totalVentas,
        totalOrdenes: ventasTotales.totalOrdenes,
        promedioOrden: ventasTotales.promedioOrden,
        productoTop: productoTop,
        categoriaTop: categoriaTop
      }
    };

    sendResponse(res, HTTP_STATUS.OK, dashboard, 'Dashboard obtenido exitosamente');

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/ventas-periodo
 * Obtiene ventas en un periodo específico con evolución
 * Query params: year, month (opcional), tipo (mensual|diario)
 */
export const getVentasPorPeriodo = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year);
    const month = req.query.month ? parseInt(req.query.month) : null;
    const tipo = req.query.tipo || 'mensual'; // mensual o diario

    if (!year || isNaN(year)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El año es requerido');
    }

    if (tipo !== 'mensual' && tipo !== 'diario') {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El tipo debe ser "mensual" o "diario"');
    }

    logQuery('dashboard', 'ventas_periodo', { year, month, tipo });

    let evolucion;
    
    if (tipo === 'diario') {
      if (!month) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El mes es requerido para evolución diaria');
      }
      if (month < 1 || month > 12) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El mes debe estar entre 1 y 12');
      }
      evolucion = await getEvolucionDiaria(year, month);
    } else {
      evolucion = await getEvolucionMensual(year);
    }

    const totalVentas = evolucion.reduce((sum, item) => sum + item.ventas, 0);
    const totalOrdenes = evolucion.reduce((sum, item) => sum + (item.ordenes || 0), 0);

    const resultado = {
      periodo: {
        year,
        month: month || 'todos',
        tipo,
        mesNombre: month ? DASHBOARD.MESES[month - 1] : null
      },
      resumen: {
        totalVentas: parseFloat(totalVentas.toFixed(2)),
        totalOrdenes,
        promedioOrden: totalOrdenes > 0 ? parseFloat((totalVentas / totalOrdenes).toFixed(2)) : 0
      },
      evolucion
    };

    sendResponse(res, HTTP_STATUS.OK, resultado, 'Evolución de ventas obtenida exitosamente');

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/top-productos
 * Obtiene los productos más vendidos con análisis Pareto
 * Query params: year, month (opcional), limit (default: 10)
 */
export const getTopProductos = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year);
    const month = req.query.month ? parseInt(req.query.month) : null;
    const limit = Math.min(parseInt(req.query.limit) || DASHBOARD.LIMITE_TOP_PRODUCTOS, DASHBOARD.MAX_TOP_PRODUCTOS);

    if (!year || isNaN(year)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El año es requerido');
    }

    if (month !== null && (isNaN(month) || month < 1 || month > 12)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El mes debe estar entre 1 y 12');
    }

    logQuery('dashboard', 'top_productos', { year, month, limit });

    const topProductos = await getTopNProductos(year, month, limit);
    const productosConPareto = calcularPareto(topProductos);

    const totalVentas = topProductos.reduce((sum, p) => sum + p.totalVentas, 0);
    const totalUnidades = topProductos.reduce((sum, p) => sum + p.unidadesVendidas, 0);

    const resultado = {
      periodo: {
        year,
        month: month || 'todos',
        mesNombre: month ? DASHBOARD.MESES[month - 1] : 'Todos los meses'
      },
      resumen: {
        totalVentas: parseFloat(totalVentas.toFixed(2)),
        totalUnidades,
        productosAnalizados: topProductos.length,
        limite: limit
      },
      productos: productosConPareto
    };

    sendResponse(res, HTTP_STATUS.OK, resultado, 'Top productos obtenido exitosamente');

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/analisis-categorias
 * Obtiene análisis detallado de ventas por categoría
 * Query params: year, month (opcional)
 */
export const getAnalisisCategorias = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year);
    const month = req.query.month ? parseInt(req.query.month) : null;

    if (!year || isNaN(year)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El año es requerido');
    }

    if (month !== null && (isNaN(month) || month < 1 || month > 12)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El mes debe estar entre 1 y 12');
    }

    logQuery('dashboard', 'analisis_categorias', { year, month });

    const distribucion = await getDistribucionCategorias(year, month);

    const totalVentas = distribucion.reduce((sum, cat) => sum + cat.totalVentas, 0);
    const totalProductosUnicos = distribucion.reduce((sum, cat) => sum + cat.productosUnicos, 0);

    const resultado = {
      periodo: {
        year,
        month: month || 'todos',
        mesNombre: month ? DASHBOARD.MESES[month - 1] : 'Todos los meses'
      },
      resumen: {
        totalVentas: parseFloat(totalVentas.toFixed(2)),
        categoriasConVentas: distribucion.length,
        totalProductosUnicos
      },
      categorias: distribucion
    };

    sendResponse(res, HTTP_STATUS.OK, resultado, 'Análisis de categorías obtenido exitosamente');

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/comparativa-anual
 * Compara ventas entre dos años
 * Query params: year, year_comparacion (opcional, por defecto año anterior)
 */
export const getComparativaAnual = async (req, res, next) => {
  try {
    const year1 = parseInt(req.query.year);
    const year2 = parseInt(req.query.year_comparacion);

    if (!year1 || isNaN(year1)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El año es requerido');
    }

    if (!year2 || isNaN(year2)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El año de comparación es requerido');
    }

    if (year1 >= year2) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El año de comparación debe ser mayor al año base');
    }

    logQuery('dashboard', 'comparativa_anual', { year1, year2 });

    const comparativa = await getComparativaAnualData(year1, year2);

    const resultado = {
      periodo: {
        yearBase: year1,
        yearComparacion: year2
      },
      resumen: {
        ventasYear1: comparativa.totalYear1,
        ventasYear2: comparativa.totalYear2,
        crecimiento: comparativa.crecimiento,
        diferencia: parseFloat((comparativa.totalYear2 - comparativa.totalYear1).toFixed(2))
      },
      evolucionYear1: comparativa.evolucionYear1,
      evolucionYear2: comparativa.evolucionYear2,
      analisisMensual: comparativa.analisisMensual
    };

    sendResponse(res, HTTP_STATUS.OK, resultado, 'Comparativa anual obtenida exitosamente');

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/exportar-csv
 * Exporta datos del dashboard a formato CSV
 * Query params: year, month (opcional)
 */
export const exportarDashboardCSV = async (req, res, next) => {
  try {
    // TODO: Implementar en Fase 5
    return sendError(res, HTTP_STATUS.NOT_IMPLEMENTED, 'Endpoint pendiente de implementación - Fase 5');
  } catch (error) {
    next(error);
  }
};
