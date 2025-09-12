import { AdministradorModel } from '../models/administradores.js';
import { sendResponse, sendError, validateAdminCredentials, validatePasswordChange } from '../utils/validators.js';
import { validatePasswordStrength } from '../utils/auth.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Controlador para manejo de administradores
 */
export const administradorController = {

  /**
   * Verificar credenciales de administrador
   * POST /api/auth/verify
   * @param {Object} req - Objeto de petición
   * @param {Object} res - Objeto de respuesta
   */
  async verificarCredenciales(req, res) {
    try {
      // Validar datos de entrada
      validateAdminCredentials(req.body);
      
      const { usuario, password } = req.body;

      // Verificar credenciales usando el modelo
      const result = await AdministradorModel.verificarCredenciales(usuario, password);

      if (!result.success) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, result.error);
      }

      // Respuesta exitosa
      return sendResponse(
        res, 
        HTTP_STATUS.OK, 
        {
          admin: result.data,
          authenticated: true
        }, 
        'Credenciales válidas'
      );

    } catch (error) {
      if (error.name === 'ValidationError') {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, error.message, error.details);
      }
      
      console.error('Error en verificarCredenciales:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER);
    }
  },

  /**
   * Cambiar contraseña de administrador
   * PUT /api/auth/change-password
   * Requiere autenticación previa
   * @param {Object} req - Objeto de petición
   * @param {Object} res - Objeto de respuesta
   */
  async cambiarPassword(req, res) {
    try {
      // Validar datos de entrada
      validatePasswordChange(req.body);
      
      const { currentPassword, newPassword } = req.body;
      
      // Obtener credenciales del middleware de autenticación
      const { usuario } = req.adminCredentials;

      // Verificar contraseña actual
      const verificacionResult = await AdministradorModel.verificarCredenciales(usuario, currentPassword);
      
      if (!verificacionResult.success) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Contraseña actual incorrecta');
      }

      // Validar fuerza de la nueva contraseña
      if (!validatePasswordStrength(newPassword)) {
        return sendError(
          res, 
          HTTP_STATUS.BAD_REQUEST, 
          'La nueva contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula, número y símbolo'
        );
      }

      // Verificar que la nueva contraseña sea diferente a la actual
      const mismPassword = await AdministradorModel.verificarCredenciales(usuario, newPassword);
      if (mismPassword.success) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'La nueva contraseña debe ser diferente a la actual');
      }

      // Actualizar contraseña
      const updateResult = await AdministradorModel.actualizarPassword(usuario, newPassword);

      if (!updateResult.success) {
        return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, updateResult.error);
      }

      // Respuesta exitosa
      return sendResponse(
        res, 
        HTTP_STATUS.OK, 
        {
          admin: updateResult.data,
          updated: true
        }, 
        'Contraseña actualizada correctamente'
      );

    } catch (error) {
      if (error.name === 'ValidationError') {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, error.message, error.details);
      }
      
      console.error('Error en cambiarPassword:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER);
    }
  },

  /**
   * Obtener información del administrador actual
   * GET /api/auth/profile
   * Requiere autenticación previa
   * @param {Object} req - Objeto de petición
   * @param {Object} res - Objeto de respuesta
   */
  async obtenerPerfil(req, res) {
    try {
      // Obtener usuario del middleware de autenticación
      const { usuario } = req.adminCredentials;

      // Buscar información del administrador
      const result = await AdministradorModel.buscarPorUsuario(usuario);

      if (!result.success || !result.data) {
        return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND('Administrador'));
      }

      // Remover password_hash de la respuesta
      const { password_hash, ...adminSinPassword } = result.data;

      // Respuesta exitosa
      return sendResponse(
        res, 
        HTTP_STATUS.OK, 
        {
          admin: adminSinPassword
        }, 
        'Perfil obtenido correctamente'
      );

    } catch (error) {
      console.error('Error en obtenerPerfil:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER);
    }
  },

  /**
   * Listar todos los administradores (solo para administradores)
   * GET /api/auth/admins
   * Requiere autenticación previa
   * @param {Object} req - Objeto de petición
   * @param {Object} res - Objeto de respuesta
   */
  async listarAdministradores(req, res) {
    try {
      // Obtener lista de administradores
      const result = await AdministradorModel.listarTodos();

      if (!result.success) {
        return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, result.error);
      }

      // Respuesta exitosa
      return sendResponse(
        res, 
        HTTP_STATUS.OK, 
        {
          administradores: result.data,
          total: result.data.length
        }, 
        'Lista de administradores obtenida correctamente'
      );

    } catch (error) {
      console.error('Error en listarAdministradores:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER);
    }
  },

  /**
   * Verificar estado del sistema de administración
   * GET /api/auth/status
   * No requiere autenticación
   * @param {Object} req - Objeto de petición
   * @param {Object} res - Objeto de respuesta
   */
  async verificarEstado(req, res) {
    try {
      // Verificar si existe al menos un administrador
      const result = await AdministradorModel.existeAdmin();

      if (!result.success) {
        return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, result.error);
      }

      // Respuesta exitosa
      return sendResponse(
        res, 
        HTTP_STATUS.OK, 
        {
          systemInitialized: result.data.existe,
          authRequired: true,
          message: result.data.existe 
            ? 'Sistema de administración configurado' 
            : 'Sistema requiere configuración inicial'
        }, 
        'Estado del sistema verificado'
      );

    } catch (error) {
      console.error('Error en verificarEstado:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER);
    }
  }
};