import { supabase } from '../config/supabase.js';

/**
 * Modelo para gestión del historial de entrenamientos
 * Maneja el registro y seguimiento de sesiones de entrenamiento completadas
 */
const HistorialEntrenamientoModel = {
  /**
   * Registrar un entrenamiento completado
   * SOLO CAMPOS DISPONIBLES EN BD: duracion_minutos, notas, completado
   * @param {number} usuarioId - ID del usuario
   * @param {number} rutinaId - ID de la rutina seguida (opcional)
   * @param {object} datos - Datos del entrenamiento
   * @param {number} datos.duracion_minutos - Duración en minutos
   * @param {string} datos.notas - Notas del entrenamiento (opcional)
   * @param {boolean} datos.completado - Si fue completado (por defecto true)
   * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
   */
  async registrar(usuarioId, rutinaId, datos) {
    try {
      const {
        duracion_minutos,
        notas,
        completado = true
      } = datos;

      // Validaciones básicas
      if (!usuarioId) {
        return {
          success: false,
          error: 'USUARIO_REQUERIDO',
          message: 'El ID del usuario es obligatorio'
        };
      }

      if (!duracion_minutos || duracion_minutos <= 0) {
        return {
          success: false,
          error: 'DURACION_INVALIDA',
          message: 'La duración debe ser mayor a 0 minutos'
        };
      }

      if (duracion_minutos > 600) {
        return {
          success: false,
          error: 'DURACION_EXCESIVA',
          message: 'La duración no puede ser mayor a 600 minutos (10 horas)'
        };
      }

      // Si se proporciona rutinaId, verificar que existe y pertenece al usuario
      if (rutinaId) {
        const { data: rutina, error: errorRutina } = await supabase
          .from('rutinas')
          .select('id, nombre')
          .eq('id', rutinaId)
          .eq('usuario_id', usuarioId)
          .eq('activa', true)
          .maybeSingle();

        if (errorRutina) throw errorRutina;

        if (!rutina) {
          return {
            success: false,
            error: 'RUTINA_NO_ENCONTRADA',
            message: 'La rutina especificada no existe o no pertenece al usuario'
          };
        }
      }

      // SOLO insertar campos que existen en la BD
      const { data: entrenamiento, error } = await supabase
        .from('historial_entrenamientos')
        .insert({
          usuario_id: usuarioId,
          rutina_id: rutinaId || null,
          duracion_minutos: duracion_minutos,
          notas: notas?.trim() || null,
          completado: completado
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: entrenamiento,
        message: 'Entrenamiento registrado exitosamente'
      };

    } catch (error) {
      console.error('Error al registrar entrenamiento:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al registrar el entrenamiento en la base de datos'
      };
    }
  },

  /**
   * Obtener historial de entrenamientos con filtros
   * @param {number} usuarioId - ID del usuario
   * @param {object} filtros - Filtros opcionales
   * @param {number} filtros.limite - Límite de registros (por defecto 30)
   * @param {string} filtros.fechaDesde - Fecha desde (YYYY-MM-DD)
   * @param {string} filtros.fechaHasta - Fecha hasta (YYYY-MM-DD)
   * @param {number} filtros.rutinaId - Filtrar por rutina específica
   * @param {string} filtros.intensidad - Filtrar por intensidad
   * @returns {Promise<{success: boolean, data?: array, error?: string, message?: string}>}
   */
  async obtenerHistorial(usuarioId, filtros = {}) {
    try {
      if (!usuarioId) {
        return {
          success: false,
          error: 'USUARIO_REQUERIDO',
          message: 'El ID del usuario es obligatorio'
        };
      }

      const limite = filtros.limite || 30;

      // Construir query con Supabase
      let query = supabase
        .from('historial_entrenamientos')
        .select(`
          id,
          usuario_id,
          rutina_id,
          duracion_minutos,
          notas,
          fecha_entrenamiento,
          completado,
          rutinas:rutina_id (
            nombre,
            descripcion
          )
        `)
        .eq('usuario_id', usuarioId);

      // Aplicar filtros opcionales
      if (filtros.fechaDesde) {
        query = query.gte('fecha_entrenamiento', filtros.fechaDesde);
      }

      if (filtros.fechaHasta) {
        query = query.lte('fecha_entrenamiento', filtros.fechaHasta);
      }

      if (filtros.rutinaId) {
        query = query.eq('rutina_id', filtros.rutinaId);
      }

      query = query
        .order('fecha_entrenamiento', { ascending: false })
        .limit(limite);

      const { data, error } = await query;

      if (error) throw error;

      // Transformar los datos para mantener la estructura esperada
      const transformedData = data.map(item => ({
        id: item.id,
        usuario_id: item.usuario_id,
        rutina_id: item.rutina_id,
        duracion_minutos: item.duracion_minutos,
        notas: item.notas,
        fecha_entrenamiento: item.fecha_entrenamiento,
        completado: item.completado,
        rutina_nombre: item.rutinas?.nombre || null,
        rutina_descripcion: item.rutinas?.descripcion || null
      }));

      return {
        success: true,
        data: transformedData,
        message: `Se encontraron ${transformedData.length} entrenamiento(s)`
      };

    } catch (error) {
      console.error('Error al obtener historial de entrenamientos:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al obtener el historial de entrenamientos'
      };
    }
  },

  /**
   * Obtener estadísticas de entrenamientos del usuario
   * @param {number} usuarioId - ID del usuario
   * @param {object} filtros - Filtros opcionales
   * @param {string} filtros.periodo - Periodo: semana, mes, año, total (por defecto: mes)
   * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
   */
  async obtenerEstadisticas(usuarioId, filtros = {}) {
    try {
      if (!usuarioId) {
        return {
          success: false,
          error: 'USUARIO_REQUERIDO',
          message: 'El ID del usuario es obligatorio'
        };
      }

      const periodo = filtros.periodo || 'mes';
      let fechaDesde = new Date();

      // Calcular fecha de inicio según el periodo
      switch (periodo.toLowerCase()) {
        case 'semana':
          fechaDesde.setDate(fechaDesde.getDate() - 7);
          break;
        case 'mes':
          fechaDesde.setDate(fechaDesde.getDate() - 30);
          break;
        case 'año':
          fechaDesde.setFullYear(fechaDesde.getFullYear() - 1);
          break;
        case 'total':
          fechaDesde = new Date('1970-01-01');
          break;
        default:
          fechaDesde.setDate(fechaDesde.getDate() - 30);
      }

      // Obtener todos los entrenamientos del periodo
      const { data: entrenamientos, error: errorEntrenamientos } = await supabase
        .from('historial_entrenamientos')
        .select('*')
        .eq('usuario_id', usuarioId)
        .gte('fecha_entrenamiento', fechaDesde.toISOString());

      if (errorEntrenamientos) throw errorEntrenamientos;

      // Calcular estadísticas generales manualmente
      const stats = {
        total_entrenamientos: entrenamientos.length,
        total_minutos: entrenamientos.reduce((sum, e) => sum + (e.duracion_minutos || 0), 0),
        duracion_promedio: 0,
        entrenamientos_completados: entrenamientos.filter(e => e.completado === true).length,
        entrenamientos_incompletos: entrenamientos.filter(e => e.completado === false).length,
        primer_entrenamiento: entrenamientos.length > 0 
          ? entrenamientos.reduce((min, e) => e.fecha_entrenamiento < min ? e.fecha_entrenamiento : min, entrenamientos[0].fecha_entrenamiento)
          : null,
        ultimo_entrenamiento: entrenamientos.length > 0
          ? entrenamientos.reduce((max, e) => e.fecha_entrenamiento > max ? e.fecha_entrenamiento : max, entrenamientos[0].fecha_entrenamiento)
          : null
      };

      if (stats.total_entrenamientos > 0) {
        stats.duracion_promedio = stats.total_minutos / stats.total_entrenamientos;
      }

      // Obtener rutinas con JOIN
      const { data: rutinaData, error: errorRutinas } = await supabase
        .from('historial_entrenamientos')
        .select(`
          rutina_id,
          duracion_minutos,
          rutinas:rutina_id (
            id,
            nombre
          )
        `)
        .eq('usuario_id', usuarioId)
        .gte('fecha_entrenamiento', fechaDesde.toISOString())
        .not('rutina_id', 'is', null);

      if (errorRutinas) throw errorRutinas;

      // Agrupar y calcular rutinas más usadas
      const rutinaMap = {};
      rutinaData.forEach(item => {
        if (item.rutinas) {
          const id = item.rutinas.id;
          if (!rutinaMap[id]) {
            rutinaMap[id] = {
              id: id,
              nombre: item.rutinas.nombre,
              veces_realizada: 0,
              duraciones: []
            };
          }
          rutinaMap[id].veces_realizada++;
          rutinaMap[id].duraciones.push(item.duracion_minutos || 0);
        }
      });

      const resultRutinas = Object.values(rutinaMap)
        .map(r => ({
          ...r,
          duracion_promedio: r.duraciones.reduce((a, b) => a + b, 0) / r.duraciones.length
        }))
        .sort((a, b) => b.veces_realizada - a.veces_realizada)
        .slice(0, 5);

      // Calcular días activos
      const diasUnicos = new Set(
        entrenamientos.map(e => new Date(e.fecha_entrenamiento).toDateString())
      );
      const dias_activos = diasUnicos.size;

      // Calcular racha actual (días consecutivos)
      const diasOrdenados = Array.from(diasUnicos)
        .map(d => new Date(d))
        .sort((a, b) => b - a);

      let racha_actual = 0;
      if (diasOrdenados.length > 0) {
        racha_actual = 1;
        for (let i = 0; i < diasOrdenados.length - 1; i++) {
          const diffDays = Math.floor((diasOrdenados[i] - diasOrdenados[i + 1]) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            racha_actual++;
          } else {
            break;
          }
        }
      }

      // Calcular frecuencia semanal
      const totalEntrenamientos = stats.total_entrenamientos;
      const diasPeriodo = periodo === 'semana' ? 7 : periodo === 'mes' ? 30 : periodo === 'año' ? 365 : 30;
      const frecuenciaSemanal = (totalEntrenamientos / diasPeriodo) * 7;

      return {
        success: true,
        data: {
          periodo: periodo,
          resumen: {
            total_entrenamientos: totalEntrenamientos,
            total_horas: stats.total_minutos ? (stats.total_minutos / 60).toFixed(2) : 0,
            total_minutos: stats.total_minutos,
            duracion_promedio_minutos: stats.duracion_promedio ? stats.duracion_promedio.toFixed(2) : 0,
            entrenamientos_completados: stats.entrenamientos_completados,
            entrenamientos_incompletos: stats.entrenamientos_incompletos,
            dias_activos: dias_activos,
            racha_actual_dias: racha_actual,
            frecuencia_semanal: frecuenciaSemanal.toFixed(2)
          },
          rutinas_mas_usadas: resultRutinas.map(r => ({
            id: r.id,
            nombre: r.nombre,
            veces_realizada: r.veces_realizada,
            duracion_promedio: r.duracion_promedio.toFixed(2)
          })),
          fechas: {
            primer_entrenamiento: stats.primer_entrenamiento,
            ultimo_entrenamiento: stats.ultimo_entrenamiento
          }
        },
        message: 'Estadísticas calculadas exitosamente'
      };

    } catch (error) {
      console.error('Error al obtener estadísticas de entrenamientos:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al calcular estadísticas de entrenamientos'
      };
    }
  },

  /**
   * Actualizar un entrenamiento existente
   * @param {number} id - ID del entrenamiento
   * @param {number} usuarioId - ID del usuario (para validar propiedad)
   * @param {object} datos - Datos a actualizar
   * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
   */
  async actualizar(id, usuarioId, datos) {
    try {
      if (!id || !usuarioId) {
        return {
          success: false,
          error: 'DATOS_INCOMPLETOS',
          message: 'ID del entrenamiento y usuario son obligatorios'
        };
      }

      // Verificar que el entrenamiento existe y pertenece al usuario
      const { data: entrenamientoExiste, error: errorVerificar } = await supabase
        .from('historial_entrenamientos')
        .select('id')
        .eq('id', id)
        .eq('usuario_id', usuarioId)
        .maybeSingle();

      if (errorVerificar) throw errorVerificar;

      if (!entrenamientoExiste) {
        return {
          success: false,
          error: 'ENTRENAMIENTO_NO_ENCONTRADO',
          message: 'Entrenamiento no encontrado o no tienes permiso para modificarlo'
        };
      }

      // Construir objeto de actualización con campos permitidos
      // SOLO campos que existen en BD: duracion_minutos, notas, completado
      const camposPermitidos = [
        'duracion_minutos',
        'notas',
        'completado'
      ];

      const datosActualizar = {};

      Object.keys(datos).forEach(campo => {
        if (camposPermitidos.includes(campo) && datos[campo] !== undefined) {
          // Validaciones específicas
          if (campo === 'duracion_minutos') {
            if (datos[campo] <= 0 || datos[campo] > 600) {
              return;
            }
            datosActualizar[campo] = datos[campo];
          } else if (campo === 'notas') {
            datosActualizar[campo] = typeof datos[campo] === 'string' ? datos[campo].trim() : datos[campo];
          } else if (campo === 'completado') {
            datosActualizar[campo] = datos[campo];
          }
        }
      });

      if (Object.keys(datosActualizar).length === 0) {
        return {
          success: false,
          error: 'SIN_CAMBIOS',
          message: 'No hay campos válidos para actualizar'
        };
      }

      const { data: entrenamientoActualizado, error: errorActualizar } = await supabase
        .from('historial_entrenamientos')
        .update(datosActualizar)
        .eq('id', id)
        .eq('usuario_id', usuarioId)
        .select()
        .single();

      if (errorActualizar) throw errorActualizar;

      return {
        success: true,
        data: entrenamientoActualizado,
        message: 'Entrenamiento actualizado exitosamente'
      };

    } catch (error) {
      console.error('Error al actualizar entrenamiento:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al actualizar el entrenamiento'
      };
    }
  },

  /**
   * Eliminar un entrenamiento
   * @param {number} id - ID del entrenamiento
   * @param {number} usuarioId - ID del usuario (para validar propiedad)
   * @returns {Promise<{success: boolean, error?: string, message?: string}>}
   */
  async eliminar(id, usuarioId) {
    try {
      if (!id || !usuarioId) {
        return {
          success: false,
          error: 'DATOS_INCOMPLETOS',
          message: 'ID del entrenamiento y usuario son obligatorios'
        };
      }

      // Verificar que el entrenamiento existe y pertenece al usuario
      const { data: entrenamientoExiste, error: errorVerificar } = await supabase
        .from('historial_entrenamientos')
        .select('id')
        .eq('id', id)
        .eq('usuario_id', usuarioId)
        .maybeSingle();

      if (errorVerificar) throw errorVerificar;

      if (!entrenamientoExiste) {
        return {
          success: false,
          error: 'ENTRENAMIENTO_NO_ENCONTRADO',
          message: 'Entrenamiento no encontrado o no tienes permiso para eliminarlo'
        };
      }

      // Eliminar entrenamiento
      const { error: errorEliminar } = await supabase
        .from('historial_entrenamientos')
        .delete()
        .eq('id', id)
        .eq('usuario_id', usuarioId);

      if (errorEliminar) throw errorEliminar;

      return {
        success: true,
        message: 'Entrenamiento eliminado exitosamente'
      };

    } catch (error) {
      console.error('Error al eliminar entrenamiento:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al eliminar el entrenamiento'
      };
    }
  }
};

export default HistorialEntrenamientoModel;
