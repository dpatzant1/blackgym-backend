import { supabase } from '../config/supabase.js';
import { TABLES, ERROR_MESSAGES, PAGINATION, ACCIONES_BITACORA } from '../utils/constants.js';

/**
 * Modelo para manejo de bitácora (auditoría)
 */
export const BitacoraModel = {
  
  /**
   * Crear una nueva entrada en la bitácora
   * @param {Object} data - Datos de la entrada {admin_id, accion, descripcion}
   * @returns {Promise<Object>} - {success, data, error}
   */
  async crear(data) {
    try {
      // Validar datos requeridos
      if (!data.accion) {
        return {
          success: false,
          error: ERROR_MESSAGES.REQUIRED_FIELD('acción')
        };
      }

      // Validar que la acción sea válida (opcional pero recomendado)
      const accionesValidas = Object.values(ACCIONES_BITACORA);
      if (!accionesValidas.includes(data.accion)) {
        console.warn(`Advertencia: Acción "${data.accion}" no está en la lista de acciones estándar`);
      }

      // Preparar datos para insertar
      const bitacoraData = {
        admin_id: data.admin_id || null, // Puede ser null para acciones del sistema
        accion: data.accion.trim(),
        descripcion: data.descripcion ? data.descripcion.trim() : null,
        fecha: new Date().toISOString()
      };

      // Insertar en la base de datos
      const { data: registro, error } = await supabase
        .from(TABLES.BITACORA)
        .insert([bitacoraData])
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Error al crear entrada en bitácora: ${error.message}`
        };
      }

      return {
        success: true,
        data: registro
      };

    } catch (error) {
      return {
        success: false,
        error: `Error interno al crear entrada en bitácora: ${error.message}`
      };
    }
  },

  /**
   * Listar registros de bitácora con paginación
   * @param {number} page - Número de página
   * @param {number} limit - Registros por página
   * @returns {Promise<Object>} - {success, data, pagination, error}
   */
  async listar(page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT) {
    try {
      // Validar parámetros
      const validPage = Math.max(1, parseInt(page) || 1);
      const validLimit = Math.min(
        Math.max(1, parseInt(limit) || PAGINATION.DEFAULT_LIMIT),
        PAGINATION.MAX_LIMIT
      );

      const from = (validPage - 1) * validLimit;
      const to = from + validLimit - 1;

      // Obtener total de registros
      const { count, error: countError } = await supabase
        .from(TABLES.BITACORA)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        return {
          success: false,
          error: `Error al contar registros: ${countError.message}`
        };
      }

      // Obtener registros con información del administrador
      const { data: registros, error } = await supabase
        .from(TABLES.BITACORA)
        .select(`
          id,
          admin_id,
          accion,
          descripcion,
          fecha,
          administradores (
            id,
            usuario
          )
        `)
        .order('fecha', { ascending: false })
        .range(from, to);

      if (error) {
        return {
          success: false,
          error: `Error al listar bitácora: ${error.message}`
        };
      }

      return {
        success: true,
        data: registros,
        pagination: {
          page: validPage,
          limit: validLimit,
          total: count,
          totalPages: Math.ceil(count / validLimit),
          hasNext: to < count - 1,
          hasPrev: validPage > 1
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Error interno al listar bitácora: ${error.message}`
      };
    }
  },

  /**
   * Obtener registros de bitácora por administrador
   * @param {number} adminId - ID del administrador
   * @param {number} page - Número de página
   * @param {number} limit - Registros por página
   * @returns {Promise<Object>} - {success, data, pagination, error}
   */
  async listarPorAdmin(adminId, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT) {
    try {
      if (!adminId) {
        return {
          success: false,
          error: ERROR_MESSAGES.REQUIRED_FIELD('ID de administrador')
        };
      }

      // Validar parámetros
      const validPage = Math.max(1, parseInt(page) || 1);
      const validLimit = Math.min(
        Math.max(1, parseInt(limit) || PAGINATION.DEFAULT_LIMIT),
        PAGINATION.MAX_LIMIT
      );

      const from = (validPage - 1) * validLimit;
      const to = from + validLimit - 1;

      // Obtener total de registros para este admin
      const { count, error: countError } = await supabase
        .from(TABLES.BITACORA)
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', adminId);

      if (countError) {
        return {
          success: false,
          error: `Error al contar registros: ${countError.message}`
        };
      }

      // Obtener registros
      const { data: registros, error } = await supabase
        .from(TABLES.BITACORA)
        .select(`
          id,
          admin_id,
          accion,
          descripcion,
          fecha,
          administradores (
            id,
            usuario
          )
        `)
        .eq('admin_id', adminId)
        .order('fecha', { ascending: false })
        .range(from, to);

      if (error) {
        return {
          success: false,
          error: `Error al listar bitácora por administrador: ${error.message}`
        };
      }

      return {
        success: true,
        data: registros,
        pagination: {
          page: validPage,
          limit: validLimit,
          total: count,
          totalPages: Math.ceil(count / validLimit),
          hasNext: to < count - 1,
          hasPrev: validPage > 1
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Error interno al listar bitácora por administrador: ${error.message}`
      };
    }
  },

  /**
   * Obtener registros de bitácora por tipo de acción
   * @param {string} accion - Tipo de acción
   * @param {number} page - Número de página
   * @param {number} limit - Registros por página
   * @returns {Promise<Object>} - {success, data, pagination, error}
   */
  async listarPorAccion(accion, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT) {
    try {
      if (!accion) {
        return {
          success: false,
          error: ERROR_MESSAGES.REQUIRED_FIELD('acción')
        };
      }

      // Validar parámetros
      const validPage = Math.max(1, parseInt(page) || 1);
      const validLimit = Math.min(
        Math.max(1, parseInt(limit) || PAGINATION.DEFAULT_LIMIT),
        PAGINATION.MAX_LIMIT
      );

      const from = (validPage - 1) * validLimit;
      const to = from + validLimit - 1;

      // Obtener total de registros para esta acción
      const { count, error: countError } = await supabase
        .from(TABLES.BITACORA)
        .select('*', { count: 'exact', head: true })
        .eq('accion', accion);

      if (countError) {
        return {
          success: false,
          error: `Error al contar registros: ${countError.message}`
        };
      }

      // Obtener registros
      const { data: registros, error } = await supabase
        .from(TABLES.BITACORA)
        .select(`
          id,
          admin_id,
          accion,
          descripcion,
          fecha,
          administradores (
            id,
            usuario
          )
        `)
        .eq('accion', accion)
        .order('fecha', { ascending: false })
        .range(from, to);

      if (error) {
        return {
          success: false,
          error: `Error al listar bitácora por acción: ${error.message}`
        };
      }

      return {
        success: true,
        data: registros,
        pagination: {
          page: validPage,
          limit: validLimit,
          total: count,
          totalPages: Math.ceil(count / validLimit),
          hasNext: to < count - 1,
          hasPrev: validPage > 1
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Error interno al listar bitácora por acción: ${error.message}`
      };
    }
  },

  /**
   * Obtener registros de bitácora por rango de fechas
   * @param {string} fechaInicio - Fecha de inicio (ISO string)
   * @param {string} fechaFin - Fecha de fin (ISO string)
   * @param {number} page - Número de página
   * @param {number} limit - Registros por página
   * @returns {Promise<Object>} - {success, data, pagination, error}
   */
  async listarPorFecha(fechaInicio, fechaFin, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT) {
    try {
      if (!fechaInicio || !fechaFin) {
        return {
          success: false,
          error: 'Se requieren fecha de inicio y fecha de fin'
        };
      }

      // Validar parámetros
      const validPage = Math.max(1, parseInt(page) || 1);
      const validLimit = Math.min(
        Math.max(1, parseInt(limit) || PAGINATION.DEFAULT_LIMIT),
        PAGINATION.MAX_LIMIT
      );

      const from = (validPage - 1) * validLimit;
      const to = from + validLimit - 1;

      // Obtener total de registros en el rango de fechas
      const { count, error: countError } = await supabase
        .from(TABLES.BITACORA)
        .select('*', { count: 'exact', head: true })
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin);

      if (countError) {
        return {
          success: false,
          error: `Error al contar registros: ${countError.message}`
        };
      }

      // Obtener registros
      const { data: registros, error } = await supabase
        .from(TABLES.BITACORA)
        .select(`
          id,
          admin_id,
          accion,
          descripcion,
          fecha,
          administradores (
            id,
            usuario
          )
        `)
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .order('fecha', { ascending: false })
        .range(from, to);

      if (error) {
        return {
          success: false,
          error: `Error al listar bitácora por fecha: ${error.message}`
        };
      }

      return {
        success: true,
        data: registros,
        pagination: {
          page: validPage,
          limit: validLimit,
          total: count,
          totalPages: Math.ceil(count / validLimit),
          hasNext: to < count - 1,
          hasPrev: validPage > 1
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Error interno al listar bitácora por fecha: ${error.message}`
      };
    }
  },

  /**
   * Obtener estadísticas generales de la bitácora
   * @returns {Promise<Object>} - {success, data, error}
   */
  async obtenerEstadisticas() {
    try {
      // Obtener total de registros
      const { count: totalRegistros, error: errorTotal } = await supabase
        .from(TABLES.BITACORA)
        .select('*', { count: 'exact', head: true });

      if (errorTotal) {
        return {
          success: false,
          error: `Error al obtener total de registros: ${errorTotal.message}`
        };
      }

      // Obtener conteo por acción
      const { data: accionesList, error: errorAcciones } = await supabase
        .from(TABLES.BITACORA)
        .select('accion');

      if (errorAcciones) {
        return {
          success: false,
          error: `Error al obtener acciones: ${errorAcciones.message}`
        };
      }

      // Contar acciones manualmente
      const accionesPorTipo = {};
      accionesList.forEach(registro => {
        const accion = registro.accion;
        accionesPorTipo[accion] = (accionesPorTipo[accion] || 0) + 1;
      });

      // Obtener conteo por administrador
      const { data: adminsList, error: errorAdmins } = await supabase
        .from(TABLES.BITACORA)
        .select(`
          admin_id,
          administradores (
            usuario
          )
        `)
        .not('admin_id', 'is', null);

      if (errorAdmins) {
        return {
          success: false,
          error: `Error al obtener administradores: ${errorAdmins.message}`
        };
      }

      // Contar por administrador
      const accionesPorAdmin = {};
      adminsList.forEach(registro => {
        const usuario = registro.administradores?.usuario || 'desconocido';
        accionesPorAdmin[usuario] = (accionesPorAdmin[usuario] || 0) + 1;
      });

      // Obtener registros de hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const { count: registrosHoy, error: errorHoy } = await supabase
        .from(TABLES.BITACORA)
        .select('*', { count: 'exact', head: true })
        .gte('fecha', hoy.toISOString());

      if (errorHoy) {
        return {
          success: false,
          error: `Error al obtener registros de hoy: ${errorHoy.message}`
        };
      }

      // Obtener registros de esta semana
      const inicioSemana = new Date();
      inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
      inicioSemana.setHours(0, 0, 0, 0);
      const { count: registrosSemana, error: errorSemana } = await supabase
        .from(TABLES.BITACORA)
        .select('*', { count: 'exact', head: true })
        .gte('fecha', inicioSemana.toISOString());

      if (errorSemana) {
        return {
          success: false,
          error: `Error al obtener registros de la semana: ${errorSemana.message}`
        };
      }

      // Obtener registros de este mes
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      const { count: registrosMes, error: errorMes } = await supabase
        .from(TABLES.BITACORA)
        .select('*', { count: 'exact', head: true })
        .gte('fecha', inicioMes.toISOString());

      if (errorMes) {
        return {
          success: false,
          error: `Error al obtener registros del mes: ${errorMes.message}`
        };
      }

      return {
        success: true,
        data: {
          totalRegistros,
          accionesPorTipo,
          accionesPorAdmin,
          registrosHoy,
          registrosSemana,
          registrosMes,
          accionMasComun: Object.keys(accionesPorTipo).length > 0 
            ? Object.entries(accionesPorTipo).sort((a, b) => b[1] - a[1])[0][0]
            : null,
          adminMasActivo: Object.keys(accionesPorAdmin).length > 0
            ? Object.entries(accionesPorAdmin).sort((a, b) => b[1] - a[1])[0][0]
            : null
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Error interno al obtener estadísticas: ${error.message}`
      };
    }
  },

  /**
   * Buscar registros con múltiples filtros
   * @param {Object} filtros - {admin_id?, accion?, fechaInicio?, fechaFin?, busqueda?}
   * @param {number} page - Número de página
   * @param {number} limit - Registros por página
   * @returns {Promise<Object>} - {success, data, pagination, error}
   */
  async buscar(filtros = {}, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT) {
    try {
      const validPage = Math.max(1, parseInt(page) || 1);
      const validLimit = Math.min(
        Math.max(1, parseInt(limit) || PAGINATION.DEFAULT_LIMIT),
        PAGINATION.MAX_LIMIT
      );

      const from = (validPage - 1) * validLimit;
      const to = from + validLimit - 1;

      // Construir query
      let query = supabase
        .from(TABLES.BITACORA)
        .select(`
          id,
          admin_id,
          accion,
          descripcion,
          fecha,
          administradores (
            id,
            usuario
          )
        `, { count: 'exact' });

      // Aplicar filtros
      if (filtros.admin_id) {
        query = query.eq('admin_id', filtros.admin_id);
      }

      if (filtros.accion) {
        query = query.eq('accion', filtros.accion);
      }

      if (filtros.fechaInicio) {
        query = query.gte('fecha', filtros.fechaInicio);
      }

      if (filtros.fechaFin) {
        query = query.lte('fecha', filtros.fechaFin);
      }

      if (filtros.busqueda) {
        query = query.ilike('descripcion', `%${filtros.busqueda}%`);
      }

      // Aplicar ordenamiento y paginación
      const { data: registros, count, error } = await query
        .order('fecha', { ascending: false })
        .range(from, to);

      if (error) {
        return {
          success: false,
          error: `Error al buscar en bitácora: ${error.message}`
        };
      }

      return {
        success: true,
        data: registros,
        pagination: {
          page: validPage,
          limit: validLimit,
          total: count,
          totalPages: Math.ceil(count / validLimit),
          hasNext: to < count - 1,
          hasPrev: validPage > 1
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Error interno al buscar en bitácora: ${error.message}`
      };
    }
  }
};
