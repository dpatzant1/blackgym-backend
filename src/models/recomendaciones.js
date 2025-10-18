import { supabase } from '../config/supabase.js';

/**
 * Modelo para gestión de recomendaciones de productos con IA
 * Maneja el almacenamiento y consulta de productos recomendados personalizados
 */
const RecomendacionModel = {
  /**
   * Crear una nueva recomendación de producto para un usuario
   * @param {number} usuarioId - ID del usuario
   * @param {number} productoId - ID del producto recomendado
   * @param {string} motivo - Razón de la recomendación generada por IA
   * @param {string} generada_por - Generado por: IA, MANUAL, etc (por defecto IA)
   * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
   */
  async crear(usuarioId, productoId, motivo, generada_por = 'IA') {
    try {
      // Validaciones básicas
      if (!usuarioId || !productoId) {
        return {
          success: false,
          error: 'DATOS_INCOMPLETOS',
          message: 'Usuario y producto son obligatorios'
        };
      }

      if (!motivo || motivo.trim().length === 0) {
        return {
          success: false,
          error: 'MOTIVO_REQUERIDO',
          message: 'El motivo de la recomendación es obligatorio'
        };
      }

      // Verificar que el producto existe
      const { data: producto, error: productoError } = await supabase
        .from('productos')
        .select('id, nombre, precio, stock')
        .eq('id', productoId)
        .single();

      if (productoError || !producto) {
        return {
          success: false,
          error: 'PRODUCTO_NO_ENCONTRADO',
          message: 'El producto especificado no existe'
        };
      }

      // Verificar que el producto tenga stock disponible
      if (producto.stock <= 0) {
        return {
          success: false,
          error: 'PRODUCTO_SIN_STOCK',
          message: 'No se puede recomendar un producto sin stock disponible'
        };
      }

      // Verificar si ya existe esta recomendación (mismo usuario y producto)
      const { data: recomendacionesExistentes, error: existeError } = await supabase
        .from('recomendaciones')
        .select('id, vista, fecha_generacion')
        .eq('usuario_id', usuarioId)
        .eq('producto_id', productoId)
        .order('fecha_generacion', { ascending: false })
        .limit(1);

      // Si existe y fue creada hace menos de 7 días, no duplicar
      if (!existeError && recomendacionesExistentes && recomendacionesExistentes.length > 0) {
        const recomendacionExistente = recomendacionesExistentes[0];
        const diasTranscurridos = Math.floor(
          (Date.now() - new Date(recomendacionExistente.fecha_generacion).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diasTranscurridos < 7) {
          return {
            success: true,
            data: recomendacionExistente,
            message: 'Esta recomendación ya existe y es reciente'
          };
        }
      }

      // Crear nueva recomendación
      const insertData = {
        usuario_id: usuarioId,
        producto_id: productoId,
        motivo: motivo.trim(),
        generada_por: generada_por.toUpperCase(),
        vista: false
      };

      const { data, error } = await supabase
        .from('recomendaciones')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data,
        message: 'Recomendación creada exitosamente'
      };

    } catch (error) {
      console.error('Error al crear recomendación:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al crear la recomendación en la base de datos'
      };
    }
  },

  /**
   * Obtener recomendaciones de productos para un usuario
   * @param {number} usuarioId - ID del usuario
   * @param {number} limite - Límite de resultados (por defecto 10)
   * @param {object} filtros - Filtros opcionales
   * @param {boolean} filtros.soloNoVistas - Solo recomendaciones no vistas
   * @returns {Promise<{success: boolean, data?: array, error?: string, message?: string}>}
   */
  async obtenerPorUsuario(usuarioId, limite = 10, filtros = {}) {
    try {
      if (!usuarioId) {
        return {
          success: false,
          error: 'USUARIO_REQUERIDO',
          message: 'El ID del usuario es obligatorio'
        };
      }

      // Construir query con Supabase
      let query = supabase
        .from('recomendaciones')
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
        .eq('usuario_id', usuarioId)
        .order('fecha_generacion', { ascending: false })
        .limit(limite);

      // Aplicar filtros opcionales
      if (filtros.soloNoVistas) {
        query = query.eq('vista', false);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Formatear resultados
      const recomendaciones = data.map(rec => ({
        id: rec.id,
        usuario_id: rec.usuario_id,
        motivo: rec.motivo,
        generada_por: rec.generada_por,
        vista: rec.vista,
        fecha_generacion: rec.fecha_generacion,
        producto: {
          id: rec.productos.id,
          nombre: rec.productos.nombre,
          descripcion: rec.productos.descripcion,
          precio: parseFloat(rec.productos.precio),
          stock: rec.productos.stock,
          imagen_url: rec.productos.imagen_url
        }
      }));

      return {
        success: true,
        data: recomendaciones,
        message: `Se encontraron ${recomendaciones.length} recomendación(es)`
      };

    } catch (error) {
      console.error('Error al obtener recomendaciones:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al obtener las recomendaciones'
      };
    }
  },

  /**
   * Marcar una recomendación como vista por el usuario
   * @param {number} id - ID de la recomendación
   * @param {number} usuarioId - ID del usuario (para validar propiedad)
   * @returns {Promise<{success: boolean, error?: string, message?: string}>}
   */
  async marcarComoVista(id, usuarioId) {
    try {
      if (!id || !usuarioId) {
        return {
          success: false,
          error: 'DATOS_INCOMPLETOS',
          message: 'ID de recomendación y usuario son obligatorios'
        };
      }

      // Verificar que la recomendación existe y pertenece al usuario
      const { data: recomendacion, error: verificarError } = await supabase
        .from('recomendaciones')
        .select('id, vista')
        .eq('id', id)
        .eq('usuario_id', usuarioId)
        .single();

      if (verificarError || !recomendacion) {
        return {
          success: false,
          error: 'RECOMENDACION_NO_ENCONTRADA',
          message: 'Recomendación no encontrada o no tienes permiso para modificarla'
        };
      }

      // Si ya está marcada como vista, no hacer nada
      if (recomendacion.vista) {
        return {
          success: true,
          message: 'La recomendación ya estaba marcada como vista'
        };
      }

      // Marcar como vista (solo actualizar campo vista, sin fecha_vista ya que no existe en BD)
      const { error } = await supabase
        .from('recomendaciones')
        .update({ vista: true })
        .eq('id', id)
        .eq('usuario_id', usuarioId);

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Recomendación marcada como vista exitosamente'
      };

    } catch (error) {
      console.error('Error al marcar recomendación como vista:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al marcar la recomendación como vista'
      };
    }
  },

  /**
   * Eliminar recomendaciones antiguas de un usuario (más de 30 días)
   * @param {number} usuarioId - ID del usuario
   * @param {number} diasAntiguedad - Días de antigüedad (por defecto 30)
   * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
   */
  async eliminarAntiguasPorUsuario(usuarioId, diasAntiguedad = 30) {
    try {
      if (!usuarioId) {
        return {
          success: false,
          error: 'USUARIO_REQUERIDO',
          message: 'El ID del usuario es obligatorio'
        };
      }

      if (diasAntiguedad < 1) {
        return {
          success: false,
          error: 'DIAS_INVALIDOS',
          message: 'Los días de antigüedad deben ser al menos 1'
        };
      }

      // Calcular fecha límite
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);

      const { data, error, count } = await supabase
        .from('recomendaciones')
        .delete({ count: 'exact' })
        .eq('usuario_id', usuarioId)
        .lt('fecha_generacion', fechaLimite.toISOString());

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: {
          eliminadas: count || 0,
          dias_antiguedad: diasAntiguedad
        },
        message: `Se eliminaron ${count || 0} recomendación(es) antigua(s)`
      };

    } catch (error) {
      console.error('Error al eliminar recomendaciones antiguas:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al eliminar recomendaciones antiguas'
      };
    }
  },

  /**
   * Verificar si un usuario tiene recomendaciones recientes (menos de 7 días)
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
   */
  async tieneRecomendacionesRecientes(usuarioId) {
    try {
      if (!usuarioId) {
        return {
          success: false,
          error: 'USUARIO_REQUERIDO',
          message: 'El ID del usuario es obligatorio'
        };
      }

      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 7);

      const { data, error, count } = await supabase
        .from('recomendaciones')
        .select('fecha_generacion', { count: 'exact' })
        .eq('usuario_id', usuarioId)
        .gt('fecha_generacion', fechaLimite.toISOString())
        .order('fecha_generacion', { ascending: false });

      if (error) {
        throw error;
      }

      const tieneRecientes = count > 0;
      const ultimaRecomendacion = data && data.length > 0 ? data[0].fecha_generacion : null;

      return {
        success: true,
        data: {
          tiene_recientes: tieneRecientes,
          total_recientes: count || 0,
          ultima_recomendacion: ultimaRecomendacion
        },
        message: tieneRecientes 
          ? `El usuario tiene ${count} recomendación(es) reciente(s)`
          : 'El usuario no tiene recomendaciones recientes'
      };

    } catch (error) {
      console.error('Error al verificar recomendaciones recientes:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al verificar recomendaciones recientes'
      };
    }
  },

  /**
   * Obtener estadísticas de recomendaciones de un usuario
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

      const { data, error } = await supabase
        .from('recomendaciones')
        .select('vista, fecha_generacion')
        .eq('usuario_id', usuarioId);

      if (error) {
        throw error;
      }

      const vistas = data.filter(r => r.vista === true).length;
      const noVistas = data.filter(r => r.vista === false).length;
      const ultimaRecomendacion = data.length > 0 
        ? data.sort((a, b) => new Date(b.fecha_generacion) - new Date(a.fecha_generacion))[0].fecha_generacion
        : null;

      return {
        success: true,
        data: {
          total_recomendaciones: data.length,
          vistas: vistas,
          no_vistas: noVistas,
          ultima_recomendacion: ultimaRecomendacion
        },
        message: 'Estadísticas obtenidas exitosamente'
      };

    } catch (error) {
      console.error('Error al obtener estadísticas de recomendaciones:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al obtener estadísticas'
      };
    }
  },

  /**
   * Eliminar todas las recomendaciones de un usuario (útil al generar nuevas)
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
   */
  async eliminarTodasPorUsuario(usuarioId) {
    try {
      if (!usuarioId) {
        return {
          success: false,
          error: 'USUARIO_REQUERIDO',
          message: 'El ID del usuario es obligatorio'
        };
      }

      const { error, count } = await supabase
        .from('recomendaciones')
        .delete({ count: 'exact' })
        .eq('usuario_id', usuarioId);

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: {
          eliminadas: count || 0
        },
        message: `Se eliminaron ${count || 0} recomendación(es)`
      };

    } catch (error) {
      console.error('Error al eliminar todas las recomendaciones:', error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Error al eliminar recomendaciones'
      };
    }
  }
};

export default RecomendacionModel;
