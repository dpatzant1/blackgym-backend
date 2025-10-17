import RutinaModel from '../models/rutinas.js';
import { UsuarioModel } from '../models/usuarios.js';
import { generarRutina } from '../utils/gemini.js';

/**
 * Controlador para gestión de rutinas de entrenamiento
 * Integra generación con IA y operaciones CRUD
 */
const RutinaController = {
  /**
   * Generar rutina con IA basada en el perfil del usuario
   * POST /api/rutinas/generar-ia
   * Requiere autenticación
   */
  async generarConIA(req, res) {
    try {
      const usuarioId = req.usuario.id;

      // Obtener perfil completo del usuario
      const resultadoPerfil = await UsuarioModel.buscarPorId(usuarioId);
      if (!resultadoPerfil.success) {
        return res.status(404).json({
          error: 'USUARIO_NO_ENCONTRADO',
          message: 'No se pudo obtener el perfil del usuario'
        });
      }

      const perfil = resultadoPerfil.data;

      // Validar que el usuario tenga datos fitness necesarios
      if (!perfil.objetivo || !perfil.peso || !perfil.altura) {
        return res.status(400).json({
          error: 'PERFIL_INCOMPLETO',
          message: 'Para generar una rutina con IA necesitas completar tu perfil fitness (objetivo, peso, altura)'
        });
      }

      // Generar rutina con IA
      const resultadoIA = await generarRutina({
        nombre: perfil.nombre,
        objetivo: perfil.objetivo,
        peso: perfil.peso,
        altura: perfil.altura,
        edad: perfil.edad || null,
        experiencia: req.body.experiencia || 'principiante'
      });

      if (!resultadoIA.success) {
        return res.status(500).json({
          error: 'ERROR_GENERACION_IA',
          message: 'No se pudo generar la rutina con IA. Intenta nuevamente.',
          detalle: resultadoIA.error
        });
      }

      // Retornar rutina generada (sin guardar aún)
      return res.status(200).json({
        success: true,
        message: 'Rutina generada exitosamente con IA',
        data: {
          rutina: resultadoIA.data,
          nota: 'Esta rutina aún no está guardada. Usa el endpoint /api/rutinas/guardar-generada para guardarla en tu perfil.'
        }
      });

    } catch (error) {
      console.error('Error al generar rutina con IA:', error);
      return res.status(500).json({
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor al generar rutina'
      });
    }
  },

  /**
   * Guardar rutina generada por IA en el perfil del usuario
   * POST /api/rutinas/guardar-generada
   * Requiere autenticación
   */
  async guardarGenerada(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { rutina, ejercicios } = req.body;

      // Validar datos recibidos
      if (!rutina || !rutina.nombre) {
        return res.status(400).json({
          error: 'DATOS_INVALIDOS',
          message: 'Debe proporcionar los datos completos de la rutina'
        });
      }

      if (!ejercicios || !Array.isArray(ejercicios) || ejercicios.length === 0) {
        return res.status(400).json({
          error: 'EJERCICIOS_REQUERIDOS',
          message: 'Debe proporcionar al menos un ejercicio'
        });
      }

      // Crear la rutina
      const datosRutina = {
        nombre: rutina.nombre,
        descripcion: rutina.descripcion || '',
        nivel_dificultad: rutina.nivelDificultad || rutina.nivel_dificultad || 'intermedio',
        duracion_estimada: rutina.duracionEstimada || rutina.duracion_estimada || 60,
        dias_semana: rutina.diasSemana || rutina.dias_semana || ['lunes', 'miercoles', 'viernes'],
        generada_por: 'IA'
      };

      const resultadoRutina = await RutinaModel.crear(usuarioId, datosRutina);

      if (!resultadoRutina.success) {
        return res.status(400).json({
          error: resultadoRutina.error,
          message: resultadoRutina.message
        });
      }

      const rutinaId = resultadoRutina.data.id;

      // Guardar ejercicios
      const resultadoEjercicios = await RutinaModel.guardarDetalles(
        rutinaId,
        usuarioId,
        ejercicios
      );

      if (!resultadoEjercicios.success) {
        // Si falla guardar ejercicios, eliminar la rutina creada
        await RutinaModel.eliminar(rutinaId, usuarioId);
        return res.status(400).json({
          error: resultadoEjercicios.error,
          message: resultadoEjercicios.message
        });
      }

      // Obtener rutina completa con ejercicios
      const rutinaCompleta = await RutinaModel.obtenerPorId(rutinaId, usuarioId);

      return res.status(201).json({
        success: true,
        message: 'Rutina guardada exitosamente en tu perfil',
        data: rutinaCompleta.data
      });

    } catch (error) {
      console.error('Error al guardar rutina generada:', error);
      return res.status(500).json({
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor al guardar rutina'
      });
    }
  },

  /**
   * Listar rutinas del usuario autenticado
   * GET /api/rutinas
   * Query params: ?activas=true&nivel=intermedio
   */
  async listar(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { activas, nivel } = req.query;

      // Construir filtros
      const filtros = {};
      if (activas !== undefined) {
        filtros.activas = activas === 'true' || activas === '1';
      }
      if (nivel) {
        filtros.nivel = nivel;
      }

      const resultado = await RutinaModel.obtenerPorUsuario(usuarioId, filtros);

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
        total: resultado.data.length
      });

    } catch (error) {
      console.error('Error al listar rutinas:', error);
      return res.status(500).json({
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor al listar rutinas'
      });
    }
  },

  /**
   * Obtener una rutina específica con todos sus ejercicios
   * GET /api/rutinas/:id
   */
  async obtener(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const rutinaId = parseInt(req.params.id);

      if (isNaN(rutinaId)) {
        return res.status(400).json({
          error: 'ID_INVALIDO',
          message: 'El ID de la rutina debe ser un número válido'
        });
      }

      const resultado = await RutinaModel.obtenerPorId(rutinaId, usuarioId);

      if (!resultado.success) {
        return res.status(404).json({
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
      console.error('Error al obtener rutina:', error);
      return res.status(500).json({
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor al obtener rutina'
      });
    }
  },

  /**
   * Crear una rutina manual
   * POST /api/rutinas
   * Body: { nombre, descripcion, nivel_dificultad, dias_semana, objetivo, duracion_semanas, ejercicios }
   */
  async crear(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { ejercicios, ...datosRutina } = req.body;

      // Validar datos básicos
      if (!datosRutina.nombre) {
        return res.status(400).json({
          error: 'NOMBRE_REQUERIDO',
          message: 'El nombre de la rutina es obligatorio'
        });
      }

      if (!datosRutina.nivel_dificultad) {
        return res.status(400).json({
          error: 'NIVEL_REQUERIDO',
          message: 'El nivel de dificultad es obligatorio'
        });
      }

      if (!datosRutina.dias_semana) {
        return res.status(400).json({
          error: 'DIAS_REQUERIDOS',
          message: 'Los días por semana son obligatorios'
        });
      }

      if (!datosRutina.objetivo) {
        return res.status(400).json({
          error: 'OBJETIVO_REQUERIDO',
          message: 'El objetivo de la rutina es obligatorio'
        });
      }

      // Asegurar que no se marque como generada por IA
      datosRutina.generada_ia = false;

      // Crear la rutina
      const resultadoRutina = await RutinaModel.crear(usuarioId, datosRutina);

      if (!resultadoRutina.success) {
        return res.status(400).json({
          error: resultadoRutina.error,
          message: resultadoRutina.message
        });
      }

      const rutinaId = resultadoRutina.data.id;

      // Si se proporcionaron ejercicios, guardarlos
      if (ejercicios && Array.isArray(ejercicios) && ejercicios.length > 0) {
        const resultadoEjercicios = await RutinaModel.guardarDetalles(
          rutinaId,
          usuarioId,
          ejercicios
        );

        if (!resultadoEjercicios.success) {
          // Si falla guardar ejercicios, eliminar la rutina creada
          await RutinaModel.eliminar(rutinaId, usuarioId);
          return res.status(400).json({
            error: resultadoEjercicios.error,
            message: resultadoEjercicios.message
          });
        }

        // Obtener rutina completa con ejercicios
        const rutinaCompleta = await RutinaModel.obtenerPorId(rutinaId, usuarioId);
        return res.status(201).json({
          success: true,
          message: 'Rutina creada exitosamente con ejercicios',
          data: rutinaCompleta.data
        });
      }

      // Si no hay ejercicios, retornar solo la rutina
      return res.status(201).json({
        success: true,
        message: 'Rutina creada exitosamente. Puedes agregar ejercicios después.',
        data: resultadoRutina.data
      });

    } catch (error) {
      console.error('Error al crear rutina:', error);
      return res.status(500).json({
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor al crear rutina'
      });
    }
  },

  /**
   * Actualizar una rutina existente
   * PUT /api/rutinas/:id
   * Body: { nombre?, descripcion?, nivel_dificultad?, dias_semana?, objetivo?, duracion_semanas?, activa?, ejercicios? }
   */
  async actualizar(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const rutinaId = parseInt(req.params.id);

      if (isNaN(rutinaId)) {
        return res.status(400).json({
          error: 'ID_INVALIDO',
          message: 'El ID de la rutina debe ser un número válido'
        });
      }

      const { ejercicios, ...datosActualizar } = req.body;

      // Actualizar datos de la rutina
      if (Object.keys(datosActualizar).length > 0) {
        const resultadoRutina = await RutinaModel.actualizar(
          rutinaId,
          usuarioId,
          datosActualizar
        );

        if (!resultadoRutina.success) {
          return res.status(400).json({
            error: resultadoRutina.error,
            message: resultadoRutina.message
          });
        }
      }

      // Si se proporcionaron ejercicios, actualizarlos
      if (ejercicios && Array.isArray(ejercicios)) {
        const resultadoEjercicios = await RutinaModel.guardarDetalles(
          rutinaId,
          usuarioId,
          ejercicios
        );

        if (!resultadoEjercicios.success) {
          return res.status(400).json({
            error: resultadoEjercicios.error,
            message: resultadoEjercicios.message
          });
        }
      }

      // Obtener rutina actualizada completa
      const rutinaCompleta = await RutinaModel.obtenerPorId(rutinaId, usuarioId);

      return res.status(200).json({
        success: true,
        message: 'Rutina actualizada exitosamente',
        data: rutinaCompleta.data
      });

    } catch (error) {
      console.error('Error al actualizar rutina:', error);
      return res.status(500).json({
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor al actualizar rutina'
      });
    }
  },

  /**
   * Eliminar una rutina (soft delete)
   * DELETE /api/rutinas/:id
   */
  async eliminar(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const rutinaId = parseInt(req.params.id);

      if (isNaN(rutinaId)) {
        return res.status(400).json({
          error: 'ID_INVALIDO',
          message: 'El ID de la rutina debe ser un número válido'
        });
      }

      const resultado = await RutinaModel.eliminar(rutinaId, usuarioId);

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
      console.error('Error al eliminar rutina:', error);
      return res.status(500).json({
        error: 'SERVER_ERROR',
        message: 'Error interno del servidor al eliminar rutina'
      });
    }
  }
};

export default RutinaController;
