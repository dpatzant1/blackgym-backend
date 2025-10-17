import { supabase } from '../config/supabase.js';

/**
 * Modelo para gestión de rutinas de entrenamiento
 * Maneja las operaciones CRUD de rutinas generadas por IA o creadas manualmente
 */
const RutinaModel = {
  /**
   * Crear una nueva rutina
   * @param {number} usuarioId - ID del usuario propietario
   * @param {object} datos - Datos de la rutina
   * @param {string} datos.nombre - Nombre de la rutina
   * @param {string} datos.descripcion - Descripción
   * @param {string} datos.generada_por - Generada por: MANUAL, IA, etc
   * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
   */
  async crear(usuarioId, datos) {
    try {
      const {
        nombre,
        descripcion,
        generada_por = 'MANUAL',
        nivel_dificultad,
        duracion_estimada,
        dias_semana
      } = datos;

      // Validaciones básicas
      if (!nombre || nombre.trim().length === 0) {
        return {
          success: false,
          error: 'NOMBRE_REQUERIDO',
          message: 'El nombre de la rutina es obligatorio'
        };
      }

      const insertData = {
        usuario_id: usuarioId,
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || '',
        generada_por: generada_por.toUpperCase(),
        activa: true
      };

      // Agregar campos opcionales solo si se proporcionan
      if (nivel_dificultad) {
        insertData.nivel_dificultad = nivel_dificultad;
      }
      if (duracion_estimada) {
        insertData.duracion_estimada = duracion_estimada;
      }
      if (dias_semana) {
        insertData.dias_semana = Array.isArray(dias_semana) ? dias_semana : [dias_semana];
      }

      const { data, error } = await supabase
        .from('rutinas')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data,
        message: 'Rutina creada exitosamente'
      };

    } catch (error) {
      console.error('Error al crear rutina:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al crear la rutina en la base de datos'
      };
    }
  },

  /**
   * Obtener todas las rutinas de un usuario
   * @param {number} usuarioId - ID del usuario
   * @param {object} filtros - Filtros opcionales
   * @param {boolean} filtros.activas - Filtrar solo rutinas activas
   * @returns {Promise<{success: boolean, data?: array, error?: string, message?: string}>}
   */
  async obtenerPorUsuario(usuarioId, filtros = {}) {
    try {
      let query = supabase
        .from('rutinas')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('fecha_creacion', { ascending: false });

      // Aplicar filtros opcionales
      if (filtros.activas !== undefined) {
        query = query.eq('activa', filtros.activas);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data,
        message: `Se encontraron ${data.length} rutina(s)`
      };

    } catch (error) {
      console.error('Error al obtener rutinas del usuario:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al obtener las rutinas'
      };
    }
  },

  /**
   * Obtener una rutina específica
   * @param {number} id - ID de la rutina
   * @param {number} usuarioId - ID del usuario (para validar propiedad)
   * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
   */
  async obtenerPorId(id, usuarioId) {
    try {
      // Obtener datos de la rutina
      const { data: rutina, error: rutinaError } = await supabase
        .from('rutinas')
        .select('*')
        .eq('id', id)
        .eq('usuario_id', usuarioId)
        .single();

      if (rutinaError || !rutina) {
        return {
          success: false,
          error: 'RUTINA_NO_ENCONTRADA',
          message: 'Rutina no encontrada o no tienes permiso para verla'
        };
      }

      // Obtener ejercicios (detalles) de la rutina
      const { data: ejercicios, error: ejerciciosError } = await supabase
        .from('rutina_detalles')
        .select('*')
        .eq('rutina_id', id)
        .order('orden', { ascending: true });

      if (ejerciciosError) {
        console.error('Error al obtener ejercicios:', ejerciciosError);
        // No fallar si no hay ejercicios, solo retornar array vacío
      }

      // Agrupar ejercicios por día
      const ejerciciosPorDia = {};
      if (ejercicios && ejercicios.length > 0) {
        ejercicios.forEach(ejercicio => {
          const dia = ejercicio.dia || 'Sin día';
          if (!ejerciciosPorDia[dia]) {
            ejerciciosPorDia[dia] = [];
          }
          ejerciciosPorDia[dia].push(ejercicio);
        });
      }

      return {
        success: true,
        data: {
          ...rutina,
          ejercicios: ejercicios || [],
          ejercicios_por_dia: ejerciciosPorDia
        },
        message: 'Rutina obtenida exitosamente'
      };

    } catch (error) {
      console.error('Error al obtener rutina:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al obtener la rutina'
      };
    }
  },

  /**
   * Actualizar una rutina
   * @param {number} id - ID de la rutina
   * @param {number} usuarioId - ID del usuario (para validar propiedad)
   * @param {object} datos - Datos a actualizar
   * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
   */
  async actualizar(id, usuarioId, datos) {
    try {
      // Verificar que la rutina existe y pertenece al usuario
      const verificacion = await this.obtenerPorId(id, usuarioId);
      if (!verificacion.success) {
        return verificacion;
      }

      // Preparar datos para actualizar
      const camposPermitidos = [
        'nombre',
        'descripcion',
        'activa',
        'nivel_dificultad',
        'duracion_estimada',
        'dias_semana'
      ];

      const datosActualizar = {};
      let tieneActualizaciones = false;

      Object.keys(datos).forEach(campo => {
        if (camposPermitidos.includes(campo) && datos[campo] !== undefined) {
          if (campo === 'dias_semana' && datos[campo]) {
            datosActualizar[campo] = Array.isArray(datos[campo]) ? datos[campo] : [datos[campo]];
          } else {
            datosActualizar[campo] = typeof datos[campo] === 'string' ? datos[campo].trim() : datos[campo];
          }
          tieneActualizaciones = true;
        }
      });

      if (!tieneActualizaciones) {
        return {
          success: false,
          error: 'SIN_CAMBIOS',
          message: 'No hay campos válidos para actualizar'
        };
      }

      const { data, error } = await supabase
        .from('rutinas')
        .update(datosActualizar)
        .eq('id', id)
        .eq('usuario_id', usuarioId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data,
        message: 'Rutina actualizada exitosamente'
      };

    } catch (error) {
      console.error('Error al actualizar rutina:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al actualizar la rutina'
      };
    }
  },

  /**
   * Eliminar una rutina (soft delete)
   * @param {number} id - ID de la rutina
   * @param {number} usuarioId - ID del usuario (para validar propiedad)
   * @returns {Promise<{success: boolean, error?: string, message?: string}>}
   */
  async eliminar(id, usuarioId) {
    try {
      // Verificar que la rutina existe y pertenece al usuario
      const verificacion = await this.obtenerPorId(id, usuarioId);
      if (!verificacion.success) {
        return verificacion;
      }

      // Soft delete: marcar como inactiva
      const { error } = await supabase
        .from('rutinas')
        .update({ activa: false })
        .eq('id', id)
        .eq('usuario_id', usuarioId);

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Rutina eliminada exitosamente'
      };

    } catch (error) {
      console.error('Error al eliminar rutina:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al eliminar la rutina'
      };
    }
  },

  /**
   * Guardar ejercicios (detalles) de una rutina
   * @param {number} rutinaId - ID de la rutina
   * @param {number} usuarioId - ID del usuario (para validar propiedad)
   * @param {array} ejercicios - Array de ejercicios
   * @returns {Promise<{success: boolean, data?: array, error?: string, message?: string}>}
   */
  async guardarDetalles(rutinaId, usuarioId, ejercicios) {
    try {
      // Verificar que la rutina existe y pertenece al usuario
      const verificacion = await this.obtenerPorId(rutinaId, usuarioId);
      if (!verificacion.success) {
        return verificacion;
      }

      // Validar que se proporcionaron ejercicios
      if (!ejercicios || !Array.isArray(ejercicios) || ejercicios.length === 0) {
        return {
          success: false,
          error: 'EJERCICIOS_REQUERIDOS',
          message: 'Debe proporcionar al menos un ejercicio'
        };
      }

      // Preparar datos de ejercicios para inserción
      const ejerciciosParaInsertar = ejercicios.map((ejercicio, index) => ({
        rutina_id: rutinaId,
        dia: ejercicio.dia || '',
        orden: ejercicio.orden || index + 1,
        ejercicio: ejercicio.ejercicio || ejercicio.nombre || '',
        series: ejercicio.series || null,
        repeticiones: ejercicio.repeticiones || null,
        peso_sugerido: ejercicio.peso_sugerido || ejercicio.pesoSugerido || null,
        descanso: ejercicio.descanso || null,
        notas: ejercicio.notas || null,
        grupo_muscular: ejercicio.grupo_muscular || ejercicio.grupoMuscular || null
      }));

      // Insertar ejercicios en la tabla rutina_detalles
      const { data, error } = await supabase
        .from('rutina_detalles')
        .insert(ejerciciosParaInsertar)
        .select();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data,
        message: `${data.length} ejercicio(s) guardado(s) exitosamente`
      };

    } catch (error) {
      console.error('Error al guardar ejercicios de rutina:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al guardar los ejercicios de la rutina'
      };
    }
  }
};

export default RutinaModel;
