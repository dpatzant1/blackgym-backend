import ProgresoModel from '../models/progreso.js';

/**
 * Controlador para gestión del progreso físico de usuarios
 * Maneja el tracking de mediciones corporales y estadísticas
 */
const ProgresoController = {
  /**
   * POST /api/progreso
   * Registrar una nueva medición de progreso físico
   * SOLO CAMPOS DISPONIBLES EN BD: peso, notas
   * @body {peso, notas}
   */
  async registrar(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { peso, notas } = req.body;

      // Validar que el peso esté presente (campo obligatorio)
      if (!peso) {
        return res.status(400).json({
          success: false,
          error: 'PESO_REQUERIDO',
          message: 'El peso es obligatorio para registrar progreso'
        });
      }

      const datos = {
        peso,
        notas: notas || null
      };

      // Registrar medición
      const resultado = await ProgresoModel.registrar(usuarioId, datos);

      if (!resultado.success) {
        return res.status(400).json(resultado);
      }

      return res.status(201).json({
        success: true,
        data: resultado.data,
        message: 'Medición registrada exitosamente'
      });

    } catch (error) {
      console.error('Error al registrar progreso:', error);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor al registrar progreso'
      });
    }
  },

  /**
   * GET /api/progreso
   * Obtener historial de mediciones con filtros opcionales
   * @query {limite, fechaDesde, fechaHasta}
   */
  async obtenerHistorial(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { limite, fechaDesde, fechaHasta } = req.query;

      const filtros = {};

      if (limite) {
        const limiteNum = parseInt(limite);
        if (isNaN(limiteNum) || limiteNum < 1) {
          return res.status(400).json({
            success: false,
            error: 'LIMITE_INVALIDO',
            message: 'El límite debe ser un número mayor a 0'
          });
        }
        filtros.limite = limiteNum;
      }

      if (fechaDesde) {
        // Validar formato de fecha
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

      const resultado = await ProgresoModel.obtenerHistorial(usuarioId, filtros.limite, filtros);

      if (!resultado.success) {
        return res.status(400).json(resultado);
      }

      return res.status(200).json({
        success: true,
        data: resultado.data,
        total: resultado.data.length,
        message: resultado.message
      });

    } catch (error) {
      console.error('Error al obtener historial de progreso:', error);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor al obtener historial'
      });
    }
  },

  /**
   * GET /api/progreso/estadisticas
   * Obtener estadísticas completas del progreso físico
   */
  async obtenerEstadisticas(req, res) {
    try {
      const usuarioId = req.usuario.id;

      const resultado = await ProgresoModel.obtenerEstadisticas(usuarioId);

      if (!resultado.success) {
        return res.status(400).json(resultado);
      }

      // Si no hay datos, retornar mensaje amigable
      if (!resultado.data || resultado.data.total_mediciones === 0) {
        return res.status(200).json({
          success: true,
          data: null,
          message: 'No hay mediciones registradas aún. ¡Registra tu primera medición para comenzar a hacer seguimiento!'
        });
      }

      return res.status(200).json({
        success: true,
        data: resultado.data,
        message: 'Estadísticas calculadas exitosamente'
      });

    } catch (error) {
      console.error('Error al obtener estadísticas de progreso:', error);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor al calcular estadísticas'
      });
    }
  },

  /**
   * GET /api/progreso/ultimo
   * Obtener la última medición registrada
   */
  async obtenerUltimo(req, res) {
    try {
      const usuarioId = req.usuario.id;

      const resultado = await ProgresoModel.obtenerUltimo(usuarioId);

      if (!resultado.success) {
        return res.status(400).json(resultado);
      }

      if (!resultado.data) {
        return res.status(200).json({
          success: true,
          data: null,
          message: 'No hay mediciones registradas'
        });
      }

      return res.status(200).json({
        success: true,
        data: resultado.data,
        message: 'Última medición obtenida exitosamente'
      });

    } catch (error) {
      console.error('Error al obtener última medición:', error);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor'
      });
    }
  },

  /**
   * DELETE /api/progreso/:id
   * Eliminar una medición específica
   */
  async eliminar(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID_REQUERIDO',
          message: 'El ID de la medición es obligatorio'
        });
      }

      const resultado = await ProgresoModel.eliminar(id, usuarioId);

      if (!resultado.success) {
        if (resultado.error === 'MEDICION_NO_ENCONTRADA') {
          return res.status(404).json(resultado);
        }
        return res.status(400).json(resultado);
      }

      return res.status(200).json({
        success: true,
        message: 'Medición eliminada exitosamente'
      });

    } catch (error) {
      console.error('Error al eliminar medición:', error);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor al eliminar medición'
      });
    }
  }
};

export default ProgresoController;
