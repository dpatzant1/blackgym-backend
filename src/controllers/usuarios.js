import { UsuarioModel } from '../models/usuarios.js';
import { generarTokenUsuario } from '../middleware/authUsuarios.js';
import { sendResponse, sendError } from '../utils/validators.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { validatePasswordStrength } from '../utils/auth.js';

/**
 * Controlador para registro de nuevo usuario
 * POST /api/usuarios/registro
 * Público (sin autenticación)
 */
export const registro = async (req, res, next) => {
  try {
    const { nombre, email, password, objetivo, peso, altura } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !password) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Nombre, email y password son requeridos'
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Formato de email inválido'
      );
    }

    // Validar fortaleza de contraseña
    if (!validatePasswordStrength(password)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales'
      );
    }

    // Crear usuario
    const resultado = await UsuarioModel.crear({
      nombre: nombre.trim(),
      email: email.trim(),
      password,
      objetivo: objetivo || null,
      peso: peso || null,
      altura: altura || null
    });

    if (!resultado.success) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        resultado.error
      );
    }

    // Generar token JWT
    const token = generarTokenUsuario(resultado.data);

    // Respuesta exitosa
    sendResponse(
      res,
      HTTP_STATUS.CREATED,
      {
        usuario: resultado.data,
        token
      },
      'Usuario registrado exitosamente'
    );

    console.log(`[Usuarios] Nuevo registro: ${email}`);

  } catch (error) {
    console.error('[Usuarios] Error en registro:', error);
    next(error);
  }
};

/**
 * Controlador para login de usuario
 * POST /api/usuarios/login
 * Público (sin autenticación)
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Email y password son requeridos'
      );
    }

    // Verificar credenciales
    const resultado = await UsuarioModel.verificarCredenciales(
      email.trim(),
      password
    );

    if (!resultado.success) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        resultado.error
      );
    }

    // Generar token JWT
    const token = generarTokenUsuario(resultado.data);

    // Respuesta exitosa
    sendResponse(
      res,
      HTTP_STATUS.OK,
      {
        usuario: resultado.data,
        token
      },
      'Login exitoso'
    );

    console.log(`[Usuarios] Login exitoso: ${email}`);

  } catch (error) {
    console.error('[Usuarios] Error en login:', error);
    next(error);
  }
};

/**
 * Controlador para obtener perfil del usuario autenticado
 * GET /api/usuarios/perfil
 * Requiere autenticación (middleware requireUserAuth)
 * 
 * Query params opcionales:
 * - includeStats=true: Incluir estadísticas (más lento)
 */
export const obtenerPerfil = async (req, res, next) => {
  try {
    // El usuario viene del middleware de autenticación
    const usuarioId = req.usuarioId;
    const includeStats = req.query.includeStats === 'true';

    // Obtener datos completos del usuario
    const resultado = await UsuarioModel.buscarPorId(usuarioId);

    if (!resultado.success || !resultado.data) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Usuario no encontrado'
      );
    }

    // Preparar respuesta
    const respuesta = {
      usuario: resultado.data
    };

    // Obtener estadísticas solo si se solicitan explícitamente
    if (includeStats) {
      const estadisticas = await UsuarioModel.obtenerEstadisticas(usuarioId);
      respuesta.estadisticas = estadisticas.success ? estadisticas.data : null;
    }

    // Respuesta exitosa
    sendResponse(
      res,
      HTTP_STATUS.OK,
      respuesta,
      'Perfil obtenido exitosamente'
    );

  } catch (error) {
    console.error('[Usuarios] Error al obtener perfil:', error);
    next(error);
  }
};

/**
 * Controlador para actualizar perfil del usuario
 * PUT /api/usuarios/perfil
 * Requiere autenticación (middleware requireUserAuth)
 */
export const actualizarPerfil = async (req, res, next) => {
  console.log('============================================');
  console.log('[Usuarios] INICIO actualizarPerfil');
  console.log('[Usuarios] usuarioId:', req.usuarioId);
  console.log('[Usuarios] Body:', req.body);
  console.log('============================================');
  
  try {
    const usuarioId = req.usuarioId;
    const { nombre, email } = req.body;

    console.log('[Usuarios] Validando campos...');

    // Validar que al menos un campo esté presente
    if (!nombre && !email) {
      console.log('[Usuarios] Error: No hay campos para actualizar');
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Debe proporcionar al menos un campo para actualizar (nombre o email)'
      );
    }

    console.log('[Usuarios] Preparando datos para actualizar...');

    // Preparar datos para actualizar
    const datosActualizar = {};
    
    if (nombre) {
      if (nombre.trim().length < 2) {
        console.log('[Usuarios] Error: Nombre demasiado corto');
        return sendError(
          res,
          HTTP_STATUS.BAD_REQUEST,
          'El nombre debe tener al menos 2 caracteres'
        );
      }
      datosActualizar.nombre = nombre.trim();
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('[Usuarios] Error: Email inválido');
        return sendError(
          res,
          HTTP_STATUS.BAD_REQUEST,
          'Formato de email inválido'
        );
      }
      datosActualizar.email = email.trim();
    }

    console.log('[Usuarios] Datos a actualizar:', datosActualizar);
    console.log('[Usuarios] Llamando a UsuarioModel.actualizar...');

    // Actualizar perfil
    const resultado = await UsuarioModel.actualizar(usuarioId, datosActualizar);

    console.log('[Usuarios] Resultado de actualizar:', resultado);

    if (!resultado.success) {
      console.log('[Usuarios] Error en resultado:', resultado.error);
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        resultado.error
      );
    }

    // Respuesta exitosa
    sendResponse(
      res,
      HTTP_STATUS.OK,
      { usuario: resultado.data },
      'Perfil actualizado exitosamente'
    );

    console.log(`[Usuarios] Perfil actualizado: Usuario ID ${usuarioId}`);

  } catch (error) {
    console.error('[Usuarios] Error al actualizar perfil:', error);
    next(error);
  }
};

/**
 * Controlador para actualizar datos fitness del usuario
 * PUT /api/usuarios/datos-fitness
 * Requiere autenticación (middleware requireUserAuth)
 */
export const actualizarDatosFitness = async (req, res, next) => {
  try {
    const usuarioId = req.usuarioId;
    const { objetivo, peso, altura } = req.body;

    // Validar que al menos un campo esté presente
    if (objetivo === undefined && peso === undefined && altura === undefined) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Debe proporcionar al menos un campo para actualizar (objetivo, peso o altura)'
      );
    }

    // Preparar datos para actualizar
    const datosActualizar = {};

    if (objetivo !== undefined) {
      datosActualizar.objetivo = objetivo;
    }

    if (peso !== undefined) {
      const pesoNum = parseFloat(peso);
      if (isNaN(pesoNum) || pesoNum <= 0 || pesoNum > 500) {
        return sendError(
          res,
          HTTP_STATUS.BAD_REQUEST,
          'El peso debe ser un número válido entre 0 y 500 kg'
        );
      }
      datosActualizar.peso = pesoNum;
    }

    if (altura !== undefined) {
      const alturaNum = parseFloat(altura);
      if (isNaN(alturaNum) || alturaNum <= 0 || alturaNum > 300) {
        return sendError(
          res,
          HTTP_STATUS.BAD_REQUEST,
          'La altura debe ser un número válido entre 0 y 300 cm'
        );
      }
      datosActualizar.altura = alturaNum;
    }

    // Actualizar datos fitness
    const resultado = await UsuarioModel.actualizarObjetivo(usuarioId, datosActualizar);

    if (!resultado.success) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        resultado.error
      );
    }

    // Respuesta exitosa
    sendResponse(
      res,
      HTTP_STATUS.OK,
      { usuario: resultado.data },
      'Datos fitness actualizados exitosamente'
    );

    console.log(`[Usuarios] Datos fitness actualizados: Usuario ID ${usuarioId}`);

  } catch (error) {
    console.error('[Usuarios] Error al actualizar datos fitness:', error);
    next(error);
  }
};

/**
 * Controlador para cambiar contraseña del usuario
 * PUT /api/usuarios/cambiar-password
 * Requiere autenticación (middleware requireUserAuth)
 */
export const cambiarPassword = async (req, res, next) => {
  try {
    const usuarioId = req.usuarioId;
    const { passwordActual, passwordNueva } = req.body;

    // Validar campos requeridos
    if (!passwordActual || !passwordNueva) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Contraseña actual y nueva son requeridas'
      );
    }

    // Validar que las contraseñas sean diferentes
    if (passwordActual === passwordNueva) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'La nueva contraseña debe ser diferente a la actual'
      );
    }

    // Validar fortaleza de la nueva contraseña
    if (!validatePasswordStrength(passwordNueva)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'La nueva contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales'
      );
    }

    // Cambiar contraseña
    const resultado = await UsuarioModel.cambiarPassword(
      usuarioId,
      passwordActual,
      passwordNueva
    );

    if (!resultado.success) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        resultado.error
      );
    }

    // Respuesta exitosa
    sendResponse(
      res,
      HTTP_STATUS.OK,
      { mensaje: 'Contraseña actualizada correctamente' },
      'Contraseña actualizada exitosamente'
    );

    console.log(`[Usuarios] Contraseña cambiada: Usuario ID ${usuarioId}`);

  } catch (error) {
    console.error('[Usuarios] Error al cambiar contraseña:', error);
    next(error);
  }
};

/**
 * Controlador para eliminar cuenta del usuario (soft delete)
 * DELETE /api/usuarios/cuenta
 * Requiere autenticación (middleware requireUserAuth)
 */
export const eliminarCuenta = async (req, res, next) => {
  try {
    const usuarioId = req.usuarioId;
    const { password } = req.body;

    // Validar contraseña para confirmar eliminación
    if (!password) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Debe proporcionar su contraseña para confirmar la eliminación de la cuenta'
      );
    }

    // Verificar contraseña
    const usuario = await UsuarioModel.buscarPorId(usuarioId);
    if (!usuario.success || !usuario.data) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Usuario no encontrado'
      );
    }

    const verificacion = await UsuarioModel.verificarCredenciales(
      usuario.data.email,
      password
    );

    if (!verificacion.success) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Contraseña incorrecta'
      );
    }

    // Eliminar cuenta (soft delete)
    const resultado = await UsuarioModel.eliminar(usuarioId);

    if (!resultado.success) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        resultado.error
      );
    }

    // Respuesta exitosa
    sendResponse(
      res,
      HTTP_STATUS.OK,
      { mensaje: 'Cuenta eliminada correctamente' },
      'Cuenta eliminada exitosamente'
    );

    console.log(`[Usuarios] Cuenta eliminada: Usuario ID ${usuarioId}`);

  } catch (error) {
    console.error('[Usuarios] Error al eliminar cuenta:', error);
    next(error);
  }
};

/**
 * Controlador para obtener estadísticas del usuario
 * GET /api/usuarios/estadisticas
 * Requiere autenticación (middleware requireUserAuth)
 */
export const obtenerEstadisticas = async (req, res, next) => {
  try {
    const usuarioId = req.usuarioId;

    // Obtener estadísticas
    const resultado = await UsuarioModel.obtenerEstadisticas(usuarioId);

    if (!resultado.success) {
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        resultado.error || 'Error al obtener estadísticas'
      );
    }

    // Respuesta exitosa
    sendResponse(
      res,
      HTTP_STATUS.OK,
      resultado.data,
      'Estadísticas obtenidas exitosamente'
    );

  } catch (error) {
    console.error('[Usuarios] Error al obtener estadísticas:', error);
    next(error);
  }
};
