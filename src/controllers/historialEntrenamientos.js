import HistorialEntrenamientoModel from '../models/historialEntrenamientos.js';

/**
 * Controlador para gestión del historial de entrenamientos
 * Maneja el registro y seguimiento de sesiones de entrenamiento completadas
 */
const HistorialEntrenamientosController = {
  /**
   * POST /api/entrenamientos
   * Registrar un entrenamiento completado
   * SOLO CAMPOS DISPONIBLES EN BD: rutina_id, duracion_minutos, notas, completado
   * @body {rutina_id, duracion_minutos, notas, completado}
   */
  async registrar(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { rutina_id, duracion_minutos, notas, completado } = req.body;

      // Validar duración (campo obligatorio)
      if (!duracion_minutos) {
        return res.status(400).json({
          success: false,
          error: 'DURACION_REQUERIDA',
          message: 'La duración del entrenamiento es obligatoria'
        });
      }

      // SOLO campos que existen en BD
      const datos = {
        duracion_minutos,
        notas: notas || null,
        completado: completado !== undefined ? completado : true
      };

      // Registrar entrenamiento
      const resultado = await HistorialEntrenamientoModel.registrar(usuarioId, rutina_id, datos);

      if (!resultado.success) {
        return res.status(400).json(resultado);
      }

      return res.status(201).json({
        success: true,
        data: resultado.data,
        message: '¡Entrenamiento registrado! Sigue así 💪'
      });

    } catch (error) {
      console.error('Error al registrar entrenamiento:', error);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor al registrar entrenamiento'
      });
    }
  },

  /**
   * GET /api/entrenamientos
   * Obtener historial de entrenamientos con filtros
   * SOLO CAMPOS DISPONIBLES: limite, fechaDesde, fechaHasta, rutinaId
   * @query {limite, fechaDesde, fechaHasta, rutinaId}
   */
  async obtenerHistorial(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { limite, fechaDesde, fechaHasta, rutinaId } = req.query;

      const filtros = {};

      // Validar y aplicar límite
      if (limite) {
        const limiteNum = parseInt(limite);
        if (isNaN(limiteNum) || limiteNum < 1) {
          return res.status(400).json({
            success: false,
            error: 'LIMITE_INVALIDO',
            message: 'El límite debe ser un número mayor a 0'
          });
        }
        if (limiteNum > 100) {
          return res.status(400).json({
            success: false,
            error: 'LIMITE_EXCESIVO',
            message: 'El límite máximo es 100 registros'
          });
        }
        filtros.limite = limiteNum;
      }

      // Validar fechaDesde
      if (fechaDesde) {
        const fecha = new Date(fechaDesde);
        if (isNaN(fecha.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'FECHA_INVALIDA',
            message: 'Formato de fecha inválido para fechaDesde (usar YYYY-MM-DD)'
          });
        }
        filtros.fechaDesde = fechaDesde;
      }

      // Validar fechaHasta
      if (fechaHasta) {
        const fecha = new Date(fechaHasta);
        if (isNaN(fecha.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'FECHA_INVALIDA',
            message: 'Formato de fecha inválido para fechaHasta (usar YYYY-MM-DD)'
          });
        }
        filtros.fechaHasta = fechaHasta;
      }

      // Validar rutinaId
      if (rutinaId) {
        const rutinaIdNum = parseInt(rutinaId);
        if (isNaN(rutinaIdNum) || rutinaIdNum < 1) {
          return res.status(400).json({
            success: false,
            error: 'RUTINA_ID_INVALIDO',
            message: 'El ID de rutina debe ser un número válido'
          });
        }
        filtros.rutinaId = rutinaIdNum;
      }

      // NOTA: Campo intensidad eliminado - no existe en BD

      const resultado = await HistorialEntrenamientoModel.obtenerHistorial(usuarioId, filtros);

      if (!resultado.success) {
        return res.status(400).json(resultado);
      }

      return res.status(200).json({
        success: true,
        data: resultado.data,
        total: resultado.data.length,
        filtros_aplicados: {
          limite: filtros.limite || 30,
          fechaDesde: filtros.fechaDesde || 'sin filtro',
          fechaHasta: filtros.fechaHasta || 'sin filtro',
          rutinaId: filtros.rutinaId || 'todas'
        },
        message: resultado.message
      });

    } catch (error) {
      console.error('Error al obtener historial de entrenamientos:', error);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor al obtener historial'
      });
    }
  },

  /**
   * GET /api/entrenamientos/estadisticas
   * Obtener estadísticas de entrenamientos
   * @query {periodo} - semana, mes, año, total (por defecto: mes)
   */
  async obtenerEstadisticas(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { periodo } = req.query;

      const filtros = {};

      // Validar periodo
      if (periodo) {
        const periodoLower = periodo.toLowerCase();
        if (!['semana', 'mes', 'año', 'total'].includes(periodoLower)) {
          return res.status(400).json({
            success: false,
            error: 'PERIODO_INVALIDO',
            message: 'El periodo debe ser: semana, mes, año o total'
          });
        }
        filtros.periodo = periodoLower;
      }

      const resultado = await HistorialEntrenamientoModel.obtenerEstadisticas(usuarioId, filtros);

      if (!resultado.success) {
        return res.status(400).json(resultado);
      }

      // Si no hay datos, retornar mensaje amigable
      if (resultado.data && resultado.data.resumen.total_entrenamientos === 0) {
        return res.status(200).json({
          success: true,
          data: null,
          message: 'No hay entrenamientos registrados aún. ¡Registra tu primer entrenamiento para comenzar tu racha! 🔥'
        });
      }

      return res.status(200).json({
        success: true,
        data: resultado.data,
        message: 'Estadísticas calculadas exitosamente'
      });

    } catch (error) {
      console.error('Error al obtener estadísticas de entrenamientos:', error);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor al calcular estadísticas'
      });
    }
  },

  /**
   * PUT /api/entrenamientos/:id
   * Actualizar un entrenamiento existente
   * @param {id} - ID del entrenamiento
   * @body {duracion_minutos, calorias_quemadas, intensidad, notas}
   */
  async actualizar(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { id } = req.params;
      const datos = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID_REQUERIDO',
          message: 'El ID del entrenamiento es obligatorio'
        });
      }

      // Validar que al menos un campo esté presente
      const camposPermitidos = ['duracion_minutos', 'calorias_quemadas', 'intensidad', 'notas'];
      const tieneCambios = camposPermitidos.some(campo => datos[campo] !== undefined);

      if (!tieneCambios) {
        return res.status(400).json({
          success: false,
          error: 'SIN_DATOS',
          message: 'Debe proporcionar al menos un campo para actualizar'
        });
      }

      // Validar duracion_minutos si está presente
      if (datos.duracion_minutos !== undefined) {
        const duracion = parseInt(datos.duracion_minutos);
        if (isNaN(duracion) || duracion < 1 || duracion > 600) {
          return res.status(400).json({
            success: false,
            error: 'DURACION_INVALIDA',
            message: 'La duración debe ser entre 1 y 600 minutos'
          });
        }
      }

      // Validar calorias_quemadas si está presente
      if (datos.calorias_quemadas !== undefined) {
        const calorias = parseInt(datos.calorias_quemadas);
        if (isNaN(calorias) || calorias < 0 || calorias > 5000) {
          return res.status(400).json({
            success: false,
            error: 'CALORIAS_INVALIDAS',
            message: 'Las calorías deben ser entre 0 y 5000'
          });
        }
      }

      // Validar intensidad si está presente
      if (datos.intensidad !== undefined) {
        const intensidadLower = datos.intensidad.toLowerCase();
        if (!['baja', 'media', 'alta'].includes(intensidadLower)) {
          return res.status(400).json({
            success: false,
            error: 'INTENSIDAD_INVALIDA',
            message: 'La intensidad debe ser: baja, media o alta'
          });
        }
        datos.intensidad = intensidadLower;
      }

      const resultado = await HistorialEntrenamientoModel.actualizar(id, usuarioId, datos);

      if (!resultado.success) {
        if (resultado.error === 'ENTRENAMIENTO_NO_ENCONTRADO') {
          return res.status(404).json(resultado);
        }
        return res.status(400).json(resultado);
      }

      return res.status(200).json({
        success: true,
        data: resultado.data,
        message: 'Entrenamiento actualizado exitosamente'
      });

    } catch (error) {
      console.error('Error al actualizar entrenamiento:', error);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor al actualizar entrenamiento'
      });
    }
  },

  /**
   * DELETE /api/entrenamientos/:id
   * Eliminar un entrenamiento
   * @param {id} - ID del entrenamiento
   */
  async eliminar(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID_REQUERIDO',
          message: 'El ID del entrenamiento es obligatorio'
        });
      }

      const resultado = await HistorialEntrenamientoModel.eliminar(id, usuarioId);

      if (!resultado.success) {
        if (resultado.error === 'ENTRENAMIENTO_NO_ENCONTRADO') {
          return res.status(404).json(resultado);
        }
        return res.status(400).json(resultado);
      }

      return res.status(200).json({
        success: true,
        message: 'Entrenamiento eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error al eliminar entrenamiento:', error);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor al eliminar entrenamiento'
      });
    }
  }
};

export default HistorialEntrenamientosController;
