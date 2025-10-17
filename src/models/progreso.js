import { supabase } from '../config/supabase.js';

/**
 * Modelo para gestión del progreso físico de usuarios
 * Maneja el registro y seguimiento de mediciones corporales
 */
const ProgresoModel = {
  /**
   * Registrar una nueva medición de progreso
   * @param {number} usuarioId - ID del usuario
   * @param {object} datos - Datos de la medición
   * @param {number} datos.peso - Peso en kg
   * @param {string} datos.notas - Notas adicionales (opcional)
   * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
   */
  /**
   * Registrar una nueva medición de progreso
   * SOLO CAMPOS DISPONIBLES EN BD: peso, notas
   * @param {number} usuarioId - ID del usuario
   * @param {object} datos - Datos de la medición
   * @param {number} datos.peso - Peso en kg
   * @param {string} datos.notas - Notas adicionales (opcional)
   * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
   */
  async registrar(usuarioId, datos) {
    try {
      const {
        peso,
        notas
      } = datos;

      // Validaciones básicas
      if (!usuarioId) {
        return {
          success: false,
          error: 'USUARIO_REQUERIDO',
          message: 'El ID del usuario es obligatorio'
        };
      }

      if (!peso || peso <= 0) {
        return {
          success: false,
          error: 'PESO_INVALIDO',
          message: 'El peso es obligatorio y debe ser mayor a 0'
        };
      }

      if (peso < 20 || peso > 300) {
        return {
          success: false,
          error: 'PESO_FUERA_RANGO',
          message: 'El peso debe estar entre 20 y 300 kg'
        };
      }

      // SOLO insertar campos que existen en la BD
      const { data, error } = await supabase
        .from('progreso_usuario')
        .insert({
          usuario_id: usuarioId,
          peso: peso,
          notas: notas?.trim() || null
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data,
        message: 'Progreso registrado exitosamente'
      };

    } catch (error) {
      console.error('Error al registrar progreso:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al registrar el progreso en la base de datos'
      };
    }
  },

  /**
   * Obtener historial de progreso de un usuario
   * @param {number} usuarioId - ID del usuario
   * @param {number} limite - Límite de registros a retornar (por defecto 30)
   * @param {object} filtros - Filtros opcionales
   * @param {string} filtros.fechaDesde - Fecha desde (YYYY-MM-DD)
   * @param {string} filtros.fechaHasta - Fecha hasta (YYYY-MM-DD)
   * @returns {Promise<{success: boolean, data?: array, error?: string, message?: string}>}
   */
  async obtenerHistorial(usuarioId, limite = 30, filtros = {}) {
    try {
      if (!usuarioId) {
        return {
          success: false,
          error: 'USUARIO_REQUERIDO',
          message: 'El ID del usuario es obligatorio'
        };
      }

      let query = supabase
        .from('progreso_usuario')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('fecha_medicion', { ascending: false })
        .limit(limite);

      // Aplicar filtros de fecha si existen
      if (filtros.fechaDesde) {
        query = query.gte('fecha_medicion', filtros.fechaDesde);
      }

      if (filtros.fechaHasta) {
        query = query.lte('fecha_medicion', filtros.fechaHasta);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data,
        message: `Se encontraron ${data.length} registro(s) de progreso`
      };

    } catch (error) {
      console.error('Error al obtener historial de progreso:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al obtener el historial de progreso'
      };
    }
  },

  /**
   * Obtener la última medición registrada del usuario
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
   */
  async obtenerUltimo(usuarioId) {
    try {
      if (!usuarioId) {
        return {
          success: false,
          error: 'USUARIO_REQUERIDO',
          message: 'El ID del usuario es obligatorio'
        };
      }

      const { data, error } = await supabase
        .from('progreso_usuario')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('fecha_medicion', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return {
          success: false,
          error: 'SIN_REGISTROS',
          message: 'No hay registros de progreso para este usuario'
        };
      }

      return {
        success: true,
        data: data,
        message: 'Última medición obtenida exitosamente'
      };

    } catch (error) {
      console.error('Error al obtener última medición:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al obtener la última medición'
      };
    }
  },

  /**
   * Obtener estadísticas y comparación de progreso del usuario
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
   */
  async obtenerEstadisticas(usuarioId) {
    try {
      if (!usuarioId) {
        return {
          success: false,
          error: 'USUARIO_REQUERIDO',
          message: 'El ID del usuario es obligatorio'
        };
      }

      // Obtener primera medición
      const { data: primera, error: errorPrimera } = await supabase
        .from('progreso_usuario')
        .select('peso, fecha_medicion')
        .eq('usuario_id', usuarioId)
        .order('fecha_medicion', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (errorPrimera) throw errorPrimera;

      // Obtener última medición
      const { data: ultima, error: errorUltima } = await supabase
        .from('progreso_usuario')
        .select('peso, fecha_medicion')
        .eq('usuario_id', usuarioId)
        .order('fecha_medicion', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (errorUltima) throw errorUltima;

      if (!primera || !ultima) {
        return {
          success: false,
          error: 'SIN_DATOS',
          message: 'No hay suficientes datos para calcular estadísticas'
        };
      }

      const comparacion = {
        peso_inicial: primera.peso,
        fecha_inicial: primera.fecha_medicion,
        peso_actual: ultima.peso,
        fecha_actual: ultima.fecha_medicion
      };

      // Calcular diferencia de peso
      const diferenciaPeso = comparacion.peso_actual - comparacion.peso_inicial;

      // Obtener todos los registros para calcular estadísticas
      const { data: registros, error: errorRegistros } = await supabase
        .from('progreso_usuario')
        .select('peso, fecha_medicion')
        .eq('usuario_id', usuarioId);

      if (errorRegistros) throw errorRegistros;

      // Calcular estadísticas manualmente
      const pesos = registros.map(r => r.peso);
      const fechas = registros.map(r => new Date(r.fecha_medicion));

      const stats = {
        total_registros: registros.length,
        peso_promedio: pesos.reduce((a, b) => a + b, 0) / pesos.length,
        peso_minimo: Math.min(...pesos),
        peso_maximo: Math.max(...pesos),
        primer_registro: new Date(Math.min(...fechas)),
        ultimo_registro: new Date(Math.max(...fechas))
      };

      // Calcular días de seguimiento
      const diasSeguimiento = Math.floor(
        (new Date(stats.ultimo_registro) - new Date(stats.primer_registro)) / (1000 * 60 * 60 * 24)
      );

      return {
        success: true,
        data: {
          comparacion: {
            inicial: {
              peso: parseFloat(comparacion.peso_inicial),
              fecha: comparacion.fecha_inicial
            },
            actual: {
              peso: parseFloat(comparacion.peso_actual),
              fecha: comparacion.fecha_actual
            },
            diferencias: {
              peso: parseFloat(diferenciaPeso.toFixed(2))
            }
          },
          estadisticas: {
            total_registros: parseInt(stats.total_registros),
            peso_promedio: parseFloat(stats.peso_promedio.toFixed(2)),
            peso_minimo: parseFloat(stats.peso_minimo),
            peso_maximo: parseFloat(stats.peso_maximo),
            dias_seguimiento: diasSeguimiento,
            frecuencia_registro: diasSeguimiento > 0 
              ? (parseInt(stats.total_registros) / diasSeguimiento).toFixed(2) 
              : '0'
          }
        },
        message: 'Estadísticas calculadas exitosamente'
      };

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al calcular estadísticas de progreso'
      };
    }
  },

  /**
   * Eliminar un registro de progreso
   * @param {number} id - ID del registro
   * @param {number} usuarioId - ID del usuario (para validar propiedad)
   * @returns {Promise<{success: boolean, error?: string, message?: string}>}
   */
  async eliminar(id, usuarioId) {
    try {
      if (!id || !usuarioId) {
        return {
          success: false,
          error: 'DATOS_INCOMPLETOS',
          message: 'ID del registro y usuario son obligatorios'
        };
      }

      // Verificar que el registro existe y pertenece al usuario
      const { data: registro, error: errorVerificar } = await supabase
        .from('progreso_usuario')
        .select('id')
        .eq('id', id)
        .eq('usuario_id', usuarioId)
        .maybeSingle();

      if (errorVerificar) throw errorVerificar;

      if (!registro) {
        return {
          success: false,
          error: 'REGISTRO_NO_ENCONTRADO',
          message: 'Registro no encontrado o no tienes permiso para eliminarlo'
        };
      }

      // Eliminar registro
      const { error } = await supabase
        .from('progreso_usuario')
        .delete()
        .eq('id', id)
        .eq('usuario_id', usuarioId);

      if (error) throw error;

      return {
        success: true,
        message: 'Registro de progreso eliminado exitosamente'
      };

    } catch (error) {
      console.error('Error al eliminar registro de progreso:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al eliminar el registro de progreso'
      };
    }
  }
};

export default ProgresoModel;
