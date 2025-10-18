import RecomendacionModel from '../models/recomendaciones.js';
import { UsuarioModel } from '../models/usuarios.js';
import { supabase } from '../config/supabase.js';
import { generarRecomendaciones } from '../utils/gemini.js';

/**
 * Controlador para gestión de recomendaciones de productos con IA
 * Implementa lógica de cache para evitar consumir API en cada request
 */
const RecomendacionController = {
  /**
   * Obtener productos recomendados para el usuario autenticado
   * GET /api/recomendaciones
   * Si no hay recomendaciones o son antiguas (>7 días), genera nuevas automáticamente
   * Query params: ?limite=10&soloNoVistas=true
   */
  async obtener(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const limite = parseInt(req.query.limite) || 10;
      const soloNoVistas = req.query.soloNoVistas === 'true';

      // Verificar si tiene recomendaciones recientes
      const resultadoRecientes = await RecomendacionModel.tieneRecomendacionesRecientes(usuarioId);

      // Si no tiene recomendaciones recientes, generar automáticamente
      if (!resultadoRecientes.success || !resultadoRecientes.data.tiene_recientes) {
        console.log(`Usuario ${usuarioId} no tiene recomendaciones recientes, generando...`);
        
        // Intentar generar nuevas recomendaciones
        const resultadoGeneracion = await RecomendacionController._generarRecomendacionesInternas(usuarioId);
        
        if (!resultadoGeneracion.success) {
          // Si falla la generación, intentar obtener las antiguas que tenga
          const resultadoAntiguas = await RecomendacionModel.obtenerPorUsuario(
            usuarioId, 
            limite,
            { soloNoVistas }
          );

          if (resultadoAntiguas.success && resultadoAntiguas.data.length > 0) {
            return res.status(200).json({
              success: true,
              message: 'Se obtuvieron recomendaciones antiguas (no se pudieron generar nuevas)',
              data: resultadoAntiguas.data,
              advertencia: 'No se pudieron generar recomendaciones nuevas con IA',
              total: resultadoAntiguas.data.length
            });
          }

          // Si no hay ninguna recomendación, retornar error
          return res.status(500).json({
            error: 'ERROR_GENERACION',
            message: 'No se pudieron generar recomendaciones y no hay recomendaciones previas',
            detalle: resultadoGeneracion.error
          });
        }
      }

      // Obtener recomendaciones (ya sean recientes o recién generadas)
      const filtros = {};
      if (soloNoVistas) {
        filtros.soloNoVistas = true;
      }

      const resultado = await RecomendacionModel.obtenerPorUsuario(usuarioId, limite, filtros);

      if (!resultado.success) {
        return res.status(500).json({
          error: resultado.error,
          message: resultado.message
        });
      }

      return res.status(200).json({
        success: true,
        message: resultado.message,
        data: resultado.data,
        total: resultado.data.length,
        cache: resultadoRecientes.data.tiene_recientes
      });

    } catch (error) {
      console.error('Error al obtener recomendaciones:', error);
      return res.status(500).json({
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor al obtener recomendaciones'
      });
    }
  },

  /**
   * Forzar generación de nuevas recomendaciones
   * POST /api/recomendaciones/generar
   * Elimina recomendaciones anteriores y genera nuevas con IA
   */
  async generar(req, res) {
    try {
      const usuarioId = req.usuario.id;

      // Generar nuevas recomendaciones
      const resultado = await RecomendacionController._generarRecomendacionesInternas(usuarioId);

      if (!resultado.success) {
        return res.status(500).json({
          error: resultado.error,
          message: resultado.message,
          detalle: resultado.detalle
        });
      }

      // Obtener las recomendaciones recién generadas
      const resultadoRecomendaciones = await RecomendacionModel.obtenerPorUsuario(usuarioId, 10);

      return res.status(201).json({
        success: true,
        message: 'Recomendaciones generadas exitosamente con IA',
        data: resultadoRecomendaciones.data,
        total: resultadoRecomendaciones.data.length,
        generadas: resultado.data.generadas,
        guardadas: resultado.data.guardadas
      });

    } catch (error) {
      console.error('Error al generar recomendaciones:', error);
      return res.status(500).json({
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor al generar recomendaciones'
      });
    }
  },

  /**
   * Marcar una recomendación como vista
   * PUT /api/recomendaciones/:id/vista
   * Útil para analytics y seguimiento de engagement
   */
  async marcarVista(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const recomendacionId = parseInt(req.params.id);

      if (isNaN(recomendacionId)) {
        return res.status(400).json({
          error: 'ID_INVALIDO',
          message: 'El ID de la recomendación debe ser un número válido'
        });
      }

      const resultado = await RecomendacionModel.marcarComoVista(recomendacionId, usuarioId);

      if (!resultado.success) {
        return res.status(404).json({
          error: resultado.error,
          message: resultado.message
        });
      }

      return res.status(200).json({
        success: true,
        message: resultado.message
      });

    } catch (error) {
      console.error('Error al marcar recomendación como vista:', error);
      return res.status(500).json({
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor'
      });
    }
  },

  /**
   * Obtener estadísticas de recomendaciones del usuario
   * GET /api/recomendaciones/estadisticas
   */
  async obtenerEstadisticas(req, res) {
    try {
      const usuarioId = req.usuario.id;

      const resultado = await RecomendacionModel.obtenerEstadisticas(usuarioId);

      if (!resultado.success) {
        return res.status(500).json({
          error: resultado.error,
          message: resultado.message
        });
      }

      return res.status(200).json({
        success: true,
        message: resultado.message,
        data: resultado.data
      });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return res.status(500).json({
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor'
      });
    }
  },

  /**
   * Función interna para generar recomendaciones con IA
   * No es un endpoint, es una función auxiliar reutilizable
   * @private
   */
  async _generarRecomendacionesInternas(usuarioId) {
    try {
      // Obtener perfil completo del usuario
      const resultadoPerfil = await UsuarioModel.buscarPorId(usuarioId);
      if (!resultadoPerfil.success) {
        return {
          success: false,
          error: 'USUARIO_NO_ENCONTRADO',
          message: 'No se pudo obtener el perfil del usuario'
        };
      }

      const perfil = resultadoPerfil.data;

      // Validar que el usuario tenga datos fitness necesarios
      if (!perfil.objetivo || !perfil.peso || !perfil.altura) {
        return {
          success: false,
          error: 'PERFIL_INCOMPLETO',
          message: 'Para generar recomendaciones necesitas completar tu perfil fitness (objetivo, peso, altura)'
        };
      }

      // Obtener catálogo de productos con stock disponible usando Supabase
      const { data: productos, error: productosError } = await supabase
        .from('productos')
        .select('id, nombre, descripcion, precio, stock, imagen_url')
        .gt('stock', 0)
        .limit(50);

      if (productosError) {
        console.error('Error al obtener productos:', productosError);
        return {
          success: false,
          error: 'ERROR_PRODUCTOS',
          message: 'Error al obtener el catálogo de productos',
          detalle: productosError.message
        };
      }

      if (!productos || productos.length === 0) {
        return {
          success: false,
          error: 'SIN_PRODUCTOS',
          message: 'No hay productos disponibles en el catálogo'
        };
      }

      // Generar recomendaciones con IA
      const resultadoIA = await generarRecomendaciones({
        nombre: perfil.nombre,
        objetivo: perfil.objetivo,
        peso: perfil.peso,
        altura: perfil.altura,
        edad: perfil.edad || null
      }, productos);

      if (!resultadoIA.success) {
        return {
          success: false,
          error: 'ERROR_IA',
          message: 'Error al generar recomendaciones con IA',
          detalle: resultadoIA.error
        };
      }

      const recomendaciones = resultadoIA.data;

      if (!Array.isArray(recomendaciones) || recomendaciones.length === 0) {
        return {
          success: false,
          error: 'SIN_RECOMENDACIONES',
          message: 'La IA no generó recomendaciones'
        };
      }

      // Eliminar recomendaciones anteriores del usuario
      await RecomendacionModel.eliminarTodasPorUsuario(usuarioId);

      // Guardar nuevas recomendaciones en la base de datos
      let guardadas = 0;
      for (const rec of recomendaciones) {
        const resultado = await RecomendacionModel.crear(
          usuarioId,
          rec.productoId,
          rec.motivo,
          'IA'  // Todas las recomendaciones de este flujo son generadas por IA
        );

        if (resultado.success) {
          guardadas++;
        } else {
          console.error(`Error al guardar recomendación para producto ${rec.productoId}:`, resultado.message);
        }
      }

      return {
        success: true,
        data: {
          generadas: recomendaciones.length,
          guardadas: guardadas
        },
        message: `${guardadas} recomendación(es) generada(s) y guardada(s) exitosamente`
      };

    } catch (error) {
      console.error('Error interno al generar recomendaciones:', error);
      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error interno al generar recomendaciones',
        detalle: error.message
      };
    }
  }
};

export default RecomendacionController;
