import { BitacoraModel } from '../models/bitacora.js';
import { sendResponse, sendError, validatePaginationParams } from '../utils/validators.js';
import { HTTP_STATUS, PAGINATION } from '../utils/constants.js';

/**
 * Controlador de Bitácora
 * Gestiona endpoints para consultar y exportar registros de auditoría
 */

/**
 * Listar bitácora con paginación y filtros opcionales
 * GET /api/bitacora
 * Query params: page, limit, adminId, accion, fechaInicio, fechaFin
 * 
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
export const listarBitacora = async (req, res, next) => {
  try {
    // Obtener parámetros de paginación
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );

    // Validar parámetros de paginación
    validatePaginationParams(page, limit);

    // Obtener parámetros de filtro opcionales
    const { adminId, accion, fechaInicio, fechaFin } = req.query;

    let result;

    // Si hay filtros, usar búsqueda avanzada
    if (adminId || accion || fechaInicio || fechaFin) {
      const filtros = {};
      
      if (adminId) {
        filtros.adminId = parseInt(adminId);
        if (isNaN(filtros.adminId)) {
          return sendError(
            res,
            HTTP_STATUS.BAD_REQUEST,
            'adminId debe ser un número válido'
          );
        }
      }
      
      if (accion) {
        filtros.accion = accion;
      }
      
      if (fechaInicio) {
        filtros.fechaInicio = fechaInicio;
      }
      
      if (fechaFin) {
        filtros.fechaFin = fechaFin;
      }

      result = await BitacoraModel.buscar(filtros, page, limit);
    } else {
      // Sin filtros, listar todo
      result = await BitacoraModel.listar(page, limit);
    }

    if (!result.success) {
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error al obtener registros de bitácora',
        result.error
      );
    }

    sendResponse(res, HTTP_STATUS.OK, {
      registros: result.data,
      pagination: result.pagination
    }, 'Registros de bitácora obtenidos exitosamente');

  } catch (error) {
    console.error('[Bitácora Controller] Error en listarBitacora:', error);
    next(error);
  }
};

/**
 * Obtener registros de bitácora de un administrador específico
 * GET /api/bitacora/admin/:adminId
 * Query params: page, limit
 * 
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
export const obtenerPorAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    
    // Validar adminId
    const adminIdNum = parseInt(adminId);
    if (isNaN(adminIdNum) || adminIdNum <= 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'ID de administrador inválido'
      );
    }

    // Obtener parámetros de paginación
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );

    // Validar parámetros de paginación
    validatePaginationParams(page, limit);

    // Obtener registros del administrador
    const result = await BitacoraModel.listarPorAdmin(adminIdNum, page, limit);

    if (!result.success) {
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error al obtener registros del administrador',
        result.error
      );
    }

    sendResponse(res, HTTP_STATUS.OK, {
      adminId: adminIdNum,
      registros: result.data,
      pagination: result.pagination
    }, `Registros de bitácora del administrador ${adminIdNum} obtenidos exitosamente`);

  } catch (error) {
    console.error('[Bitácora Controller] Error en obtenerPorAdmin:', error);
    next(error);
  }
};

/**
 * Obtener registros de bitácora por tipo de acción
 * GET /api/bitacora/accion/:accion
 * Query params: page, limit
 * 
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
export const obtenerPorAccion = async (req, res, next) => {
  try {
    const { accion } = req.params;
    
    // Validar acción
    if (!accion || typeof accion !== 'string') {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Acción inválida'
      );
    }

    // Obtener parámetros de paginación
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );

    // Validar parámetros de paginación
    validatePaginationParams(page, limit);

    // Obtener registros por acción
    const result = await BitacoraModel.listarPorAccion(accion, page, limit);

    if (!result.success) {
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error al obtener registros por acción',
        result.error
      );
    }

    sendResponse(res, HTTP_STATUS.OK, {
      accion: accion,
      registros: result.data,
      pagination: result.pagination
    }, `Registros de bitácora con acción "${accion}" obtenidos exitosamente`);

  } catch (error) {
    console.error('[Bitácora Controller] Error en obtenerPorAccion:', error);
    next(error);
  }
};

/**
 * Obtener estadísticas de la bitácora
 * GET /api/bitacora/stats
 * 
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
export const obtenerEstadisticas = async (req, res, next) => {
  try {
    // Obtener estadísticas
    const result = await BitacoraModel.obtenerEstadisticas();

    if (!result.success) {
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error al obtener estadísticas de bitácora',
        result.error
      );
    }

    sendResponse(
      res, 
      HTTP_STATUS.OK, 
      result.data, 
      'Estadísticas de bitácora obtenidas exitosamente'
    );

  } catch (error) {
    console.error('[Bitácora Controller] Error en obtenerEstadisticas:', error);
    next(error);
  }
};

/**
 * Exportar registros de bitácora en formato CSV o JSON
 * GET /api/bitacora/export
 * Query params: formato (csv|json), adminId, accion, fechaInicio, fechaFin, limit
 * 
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
export const exportarBitacora = async (req, res, next) => {
  try {
    // Obtener formato de exportación (por defecto JSON)
    const formato = (req.query.formato || 'json').toLowerCase();
    
    if (!['csv', 'json'].includes(formato)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Formato inválido. Use "csv" o "json"'
      );
    }

    // Obtener parámetros de filtro
    const { adminId, accion, fechaInicio, fechaFin } = req.query;
    
    // Límite máximo para exportación (por defecto 1000, máximo 5000)
    const limit = Math.min(
      parseInt(req.query.limit) || 1000,
      5000
    );

    let result;

    // Si hay filtros, usar búsqueda avanzada
    if (adminId || accion || fechaInicio || fechaFin) {
      const filtros = {};
      
      if (adminId) {
        filtros.adminId = parseInt(adminId);
        if (isNaN(filtros.adminId)) {
          return sendError(
            res,
            HTTP_STATUS.BAD_REQUEST,
            'adminId debe ser un número válido'
          );
        }
      }
      
      if (accion) {
        filtros.accion = accion;
      }
      
      if (fechaInicio) {
        filtros.fechaInicio = fechaInicio;
      }
      
      if (fechaFin) {
        filtros.fechaFin = fechaFin;
      }

      result = await BitacoraModel.buscar(filtros, 1, limit);
    } else {
      // Sin filtros, obtener últimos registros
      result = await BitacoraModel.listar(1, limit);
    }

    if (!result.success) {
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error al exportar registros de bitácora',
        result.error
      );
    }

    const registros = result.data;

    if (formato === 'csv') {
      // Exportar como CSV
      const csv = convertirACSV(registros);
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="bitacora_${Date.now()}.csv"`);
      res.status(HTTP_STATUS.OK).send(csv);
    } else {
      // Exportar como JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="bitacora_${Date.now()}.json"`);
      
      sendResponse(res, HTTP_STATUS.OK, {
        exportacion: {
          fecha: new Date().toISOString(),
          formato: 'json',
          totalRegistros: registros.length,
          filtros: { adminId, accion, fechaInicio, fechaFin }
        },
        registros: registros
      }, 'Exportación completada exitosamente');
    }

  } catch (error) {
    console.error('[Bitácora Controller] Error en exportarBitacora:', error);
    next(error);
  }
};

/**
 * Convertir registros de bitácora a formato CSV
 * @param {Array} registros - Array de registros de bitácora
 * @returns {string} - String CSV
 */
function convertirACSV(registros) {
  if (!registros || registros.length === 0) {
    return 'ID,Admin ID,Usuario Admin,Acción,Descripción,Fecha\n';
  }

  // Header del CSV
  const headers = ['ID', 'Admin ID', 'Usuario Admin', 'Acción', 'Descripción', 'Fecha'];
  let csv = headers.join(',') + '\n';

  // Procesar cada registro
  registros.forEach(registro => {
    const row = [
      registro.id || '',
      registro.admin_id || 'Sistema',
      registro.admin_usuario ? `"${escaparCSV(registro.admin_usuario)}"` : 'Sistema',
      registro.accion ? `"${escaparCSV(registro.accion)}"` : '',
      registro.descripcion ? `"${escaparCSV(registro.descripcion)}"` : '',
      registro.fecha || ''
    ];
    csv += row.join(',') + '\n';
  });

  return csv;
}

/**
 * Escapar caracteres especiales para CSV
 * @param {string} str - String a escapar
 * @returns {string} - String escapado
 */
function escaparCSV(str) {
  if (!str) return '';
  // Reemplazar comillas dobles con dobles comillas dobles (escape CSV)
  return str.toString().replace(/"/g, '""');
}

/**
 * Obtener registros de bitácora por rango de fechas
 * GET /api/bitacora/fecha
 * Query params: fechaInicio, fechaFin, page, limit
 * 
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
export const obtenerPorFecha = async (req, res, next) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    // Validar que se proporcionaron ambas fechas
    if (!fechaInicio || !fechaFin) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Se requieren fechaInicio y fechaFin'
      );
    }

    // Validar formato de fechas (ISO 8601)
    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);

    if (isNaN(fechaInicioDate.getTime()) || isNaN(fechaFinDate.getTime())) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Formato de fecha inválido. Use formato ISO 8601 (YYYY-MM-DD)'
      );
    }

    // Validar que fechaInicio sea anterior a fechaFin
    if (fechaInicioDate > fechaFinDate) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'fechaInicio debe ser anterior a fechaFin'
      );
    }

    // Obtener parámetros de paginación
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );

    // Validar parámetros de paginación
    validatePaginationParams(page, limit);

    // Obtener registros por rango de fechas
    const result = await BitacoraModel.listarPorFecha(
      fechaInicio,
      fechaFin,
      page,
      limit
    );

    if (!result.success) {
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error al obtener registros por fecha',
        result.error
      );
    }

    sendResponse(res, HTTP_STATUS.OK, {
      rangoFechas: {
        inicio: fechaInicio,
        fin: fechaFin
      },
      registros: result.data,
      pagination: result.pagination
    }, 'Registros de bitácora obtenidos exitosamente');

  } catch (error) {
    console.error('[Bitácora Controller] Error en obtenerPorFecha:', error);
    next(error);
  }
};

// Exportar controladores
export default {
  listarBitacora,
  obtenerPorAdmin,
  obtenerPorAccion,
  obtenerEstadisticas,
  exportarBitacora,
  obtenerPorFecha
};
