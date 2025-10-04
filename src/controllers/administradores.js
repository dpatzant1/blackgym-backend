import { AdministradorModel } from '../models/administradores.js';
import { RolModel } from '../models/roles.js';
import { sendResponse, sendError, validateAdminCredentials, validatePasswordChange, validateCreateAdmin, validateUpdateAdmin } from '../utils/validators.js';
import { validatePasswordStrength } from '../utils/auth.js';
import { HTTP_STATUS, ERROR_MESSAGES, ACCIONES_BITACORA } from '../utils/constants.js';
import { registrarAccion } from '../utils/bitacora.js';

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

      // Registrar en bitácora
      try {
        await registrarAccion(
          result.data.id,
          ACCIONES_BITACORA.LOGIN,
          `Usuario "${usuario}" inició sesión exitosamente`
        );
      } catch (bitacoraError) {
        console.error('Error al registrar en bitácora:', bitacoraError);
      }

      // Normalizar roles → rol (si existe)
      const adminData = { ...result.data };
      if (adminData.roles) {
        adminData.rol = adminData.roles;
        delete adminData.roles;
      }

      // Respuesta exitosa
      return sendResponse(
        res, 
        HTTP_STATUS.OK, 
        {
          admin: adminData,
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

      // Registrar en bitácora
      try {
        const adminId = req.adminId || req.admin?.id || verificacionResult.data.id;
        await registrarAccion(
          adminId,
          ACCIONES_BITACORA.CAMBIAR_PASSWORD,
          `Usuario "${usuario}" cambió su contraseña`
        );
      } catch (bitacoraError) {
        console.error('Error al registrar en bitácora:', bitacoraError);
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

      // Buscar información del administrador con rol
      const result = await AdministradorModel.obtenerPorUsuarioConRol(usuario);

      if (!result.success || !result.data) {
        return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND('Administrador'));
      }

      // Remover password_hash de la respuesta y normalizar roles → rol
      const { password_hash, roles, ...adminSinPassword } = result.data;

      // Normalizar: roles → rol (para consistencia)
      const adminNormalizado = {
        ...adminSinPassword,
        rol: roles || null // Renombrar roles a rol
      };

      // Respuesta exitosa
      return sendResponse(
        res, 
        HTTP_STATUS.OK, 
        {
          admin: adminNormalizado
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

      // Normalizar roles → rol en cada administrador
      const administradoresNormalizados = result.data.map(admin => {
        const { roles, ...rest } = admin;
        return {
          ...rest,
          rol: roles || null
        };
      });

      // Respuesta exitosa
      return sendResponse(
        res, 
        HTTP_STATUS.OK, 
        {
          administradores: administradoresNormalizados,
          total: administradoresNormalizados.length
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
  },

  /**
   * Asignar rol a un administrador
   * PUT /api/administradores/:id/rol
   * Requiere autenticación previa y permisos de administrador
   * @param {Object} req - Objeto de petición
   * @param {Object} res - Objeto de respuesta
   */
  async asignarRol(req, res) {
    try {
      const { id } = req.params;
      const { rol_id } = req.body;

      // Validar ID de administrador
      if (!id || isNaN(parseInt(id))) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'ID de administrador inválido');
      }

      // Validar que se proporcione rol_id
      if (!rol_id || isNaN(parseInt(rol_id))) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Se requiere un rol_id válido');
      }

      // Verificar que el administrador existe
      const adminExiste = await AdministradorModel.obtenerAdminConRol(parseInt(id));
      if (!adminExiste.success || !adminExiste.data) {
        return sendError(res, HTTP_STATUS.NOT_FOUND, 'Administrador no encontrado');
      }

      const adminActual = adminExiste.data;
      const rolAnterior = adminActual.rol ? adminActual.rol.nombre : 'sin rol';

      // Verificar que el rol existe
      const rolExiste = await RolModel.buscarPorId(parseInt(rol_id));
      if (!rolExiste.success || !rolExiste.data) {
        return sendError(res, HTTP_STATUS.NOT_FOUND, 'Rol no encontrado');
      }

      const rolNuevo = rolExiste.data.nombre;

      // Asignar rol
      const result = await AdministradorModel.asignarRol(parseInt(id), parseInt(rol_id));

      if (!result.success) {
        return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, result.error);
      }

      // Registrar en bitácora
      try {
        const adminId = req.adminId || req.admin?.id;
        await registrarAccion(
          adminId,
          ACCIONES_BITACORA.ASIGNAR_ROL,
          `Rol asignado a administrador: Usuario="${adminActual.usuario}", Rol anterior="${rolAnterior}", Rol nuevo="${rolNuevo}"`
        );
      } catch (bitacoraError) {
        console.error('Error al registrar en bitácora:', bitacoraError);
      }

      // Obtener información actualizada con rol
      const adminActualizado = await AdministradorModel.obtenerAdminConRol(parseInt(id));

      // Normalizar roles → rol
      const { roles, ...adminData } = adminActualizado.data;
      const adminNormalizado = {
        ...adminData,
        rol: roles || null
      };

      // Respuesta exitosa
      return sendResponse(
        res, 
        HTTP_STATUS.OK, 
        {
          admin: adminNormalizado,
          cambio: {
            rolAnterior,
            rolNuevo
          }
        }, 
        'Rol asignado correctamente'
      );

    } catch (error) {
      console.error('Error en asignarRol:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER);
    }
  },

  /**
   * Crear un nuevo administrador
   * POST /api/administradores
   * Requiere autenticación previa y permisos de administrador
   * @param {Object} req - Objeto de petición
   * @param {Object} res - Objeto de respuesta
   */
  async crearAdministrador(req, res) {
    try {
      // Validar datos de entrada
      validateCreateAdmin(req.body);
      
      const { usuario, password, rol_id } = req.body;

      // Validar fuerza de la contraseña
      if (!validatePasswordStrength(password)) {
        return sendError(
          res, 
          HTTP_STATUS.BAD_REQUEST, 
          'La contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula, número y símbolo'
        );
      }

      // Crear administrador usando el modelo
      const result = await AdministradorModel.crear({ usuario, password, rol_id });

      if (!result.success) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, result.error);
      }

      // Obtener información completa con rol (si tiene)
      let adminCompleto = result.data;
      
      if (result.data.id) {
        const adminConRolResult = await AdministradorModel.obtenerAdminConRol(result.data.id);
        if (adminConRolResult.success && adminConRolResult.data) {
          // Normalizar roles → rol
          const { roles, ...adminData } = adminConRolResult.data;
          adminCompleto = {
            ...adminData,
            rol: roles || null
          };
        }
      }

      // Registrar en bitácora
      try {
        const adminId = req.adminId || req.admin?.id;
        await registrarAccion(
          adminId,
          ACCIONES_BITACORA.CREAR_ADMIN || 'CREAR_ADMIN',
          `Nuevo administrador creado: "${usuario}"${rol_id ? ` con rol_id: ${rol_id}` : ' sin rol asignado'}`
        );
      } catch (bitacoraError) {
        console.error('Error al registrar en bitácora:', bitacoraError);
      }

      // Respuesta exitosa
      return sendResponse(
        res, 
        HTTP_STATUS.CREATED, 
        {
          admin: adminCompleto
        }, 
        'Administrador creado exitosamente'
      );

    } catch (error) {
      if (error.name === 'ValidationError') {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, error.message, error.details);
      }
      
      console.error('Error en crearAdministrador:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER);
    }
  },

  /**
   * Actualizar un administrador existente
   * PUT /api/administradores/:id
   * Requiere autenticación previa y permisos de administrador
   * @param {Object} req - Objeto de petición
   * @param {Object} res - Objeto de respuesta
   */
  async actualizarAdministrador(req, res) {
    try {
      const { id } = req.params;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'ID de administrador inválido');
      }

      // Validar datos de entrada
      validateUpdateAdmin(req.body);

      const { usuario, rol_id } = req.body;

      // Verificar que el administrador existe
      const adminExiste = await AdministradorModel.buscarPorId(parseInt(id));
      if (!adminExiste.success || !adminExiste.data) {
        return sendError(res, HTTP_STATUS.NOT_FOUND, 'Administrador no encontrado');
      }

      const adminAnterior = adminExiste.data;

      // Preparar datos de actualización
      const updateData = {};
      if (usuario) updateData.usuario = usuario;
      if (rol_id !== undefined) updateData.rol_id = rol_id;

      // Verificar que el nuevo usuario no esté en uso (si se está actualizando)
      if (usuario && usuario !== adminAnterior.usuario) {
        const usuarioExiste = await AdministradorModel.buscarPorUsuario(usuario);
        if (usuarioExiste.success && usuarioExiste.data) {
          return sendError(res, HTTP_STATUS.BAD_REQUEST, 'El nombre de usuario ya está en uso');
        }
      }

      // Verificar que el rol existe (si se está actualizando)
      if (rol_id !== undefined && rol_id !== null) {
        const rolExiste = await RolModel.buscarPorId(parseInt(rol_id));
        if (!rolExiste.success || !rolExiste.data) {
          return sendError(res, HTTP_STATUS.NOT_FOUND, 'Rol no encontrado');
        }
      }

      // Actualizar en la base de datos usando el modelo de asignarRol si solo es rol
      let result;
      
      if (usuario && rol_id !== undefined) {
        // Actualizar ambos campos manualmente
        const { supabase } = await import('../config/supabase.js');
        const { TABLES } = await import('../utils/constants.js');
        
        const { data, error } = await supabase
          .from(TABLES.ADMINISTRADORES)
          .update(updateData)
          .eq('id', parseInt(id))
          .select('id, usuario, rol_id, creado_en')
          .single();

        if (error) {
          return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, `Error al actualizar: ${error.message}`);
        }

        result = { success: true, data };
      } else if (rol_id !== undefined) {
        // Solo actualizar rol usando el método existente
        result = await AdministradorModel.asignarRol(parseInt(id), rol_id);
      } else {
        // Solo actualizar usuario
        const { supabase } = await import('../config/supabase.js');
        const { TABLES } = await import('../utils/constants.js');
        
        const { data, error } = await supabase
          .from(TABLES.ADMINISTRADORES)
          .update({ usuario })
          .eq('id', parseInt(id))
          .select('id, usuario, rol_id, creado_en')
          .single();

        if (error) {
          return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, `Error al actualizar: ${error.message}`);
        }

        result = { success: true, data };
      }

      if (!result.success) {
        return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, result.error);
      }

      // Obtener información actualizada completa con rol
      const adminActualizado = await AdministradorModel.obtenerAdminConRol(parseInt(id));
      
      // Normalizar roles → rol
      const { roles, ...adminData } = adminActualizado.data;
      const adminNormalizado = {
        ...adminData,
        rol: roles || null
      };

      // Registrar en bitácora
      try {
        const adminId = req.adminId || req.admin?.id;
        const cambios = [];
        if (usuario && usuario !== adminAnterior.usuario) {
          cambios.push(`Usuario: "${adminAnterior.usuario}" → "${usuario}"`);
        }
        if (rol_id !== undefined) {
          cambios.push(`Rol: ${adminAnterior.rol_id || 'sin rol'} → ${rol_id || 'sin rol'}`);
        }

        await registrarAccion(
          adminId,
          ACCIONES_BITACORA.EDITAR_ADMIN || 'EDITAR_ADMIN',
          `Administrador ID ${id} actualizado. Cambios: ${cambios.join(', ')}`
        );
      } catch (bitacoraError) {
        console.error('Error al registrar en bitácora:', bitacoraError);
      }

      // Respuesta exitosa
      return sendResponse(
        res, 
        HTTP_STATUS.OK, 
        {
          admin: adminNormalizado,
          cambios: {
            usuario: usuario ? { anterior: adminAnterior.usuario, nuevo: usuario } : undefined,
            rol_id: rol_id !== undefined ? { anterior: adminAnterior.rol_id, nuevo: rol_id } : undefined
          }
        }, 
        'Administrador actualizado exitosamente'
      );

    } catch (error) {
      if (error.name === 'ValidationError') {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, error.message, error.details);
      }
      
      console.error('Error en actualizarAdministrador:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER);
    }
  },

  /**
   * Eliminar un administrador
   * DELETE /api/administradores/:id
   * Requiere autenticación previa y permisos de administrador
   * @param {Object} req - Objeto de petición
   * @param {Object} res - Objeto de respuesta
   */
  async eliminarAdministrador(req, res) {
    try {
      const { id } = req.params;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'ID de administrador inválido');
      }

      // Verificar que el administrador existe
      const adminExiste = await AdministradorModel.buscarPorId(parseInt(id));
      if (!adminExiste.success || !adminExiste.data) {
        return sendError(res, HTTP_STATUS.NOT_FOUND, 'Administrador no encontrado');
      }

      const adminAEliminar = adminExiste.data;

      // Prevenir auto-eliminación
      const adminIdActual = req.adminId || req.admin?.id;
      if (parseInt(id) === adminIdActual) {
        return sendError(
          res, 
          HTTP_STATUS.BAD_REQUEST, 
          'No puedes eliminar tu propia cuenta de administrador'
        );
      }

      // Verificar que no sea el único administrador
      const { supabase } = await import('../config/supabase.js');
      const { TABLES } = await import('../utils/constants.js');
      
      const { data: admins, error: countError } = await supabase
        .from(TABLES.ADMINISTRADORES)
        .select('id');

      if (countError) {
        return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error al verificar administradores');
      }

      if (admins.length <= 1) {
        return sendError(
          res, 
          HTTP_STATUS.BAD_REQUEST, 
          'No se puede eliminar el último administrador del sistema'
        );
      }

      // Eliminar administrador
      const { error: deleteError } = await supabase
        .from(TABLES.ADMINISTRADORES)
        .delete()
        .eq('id', parseInt(id));

      if (deleteError) {
        return sendError(
          res, 
          HTTP_STATUS.INTERNAL_SERVER_ERROR, 
          `Error al eliminar administrador: ${deleteError.message}`
        );
      }

      // Registrar en bitácora
      try {
        await registrarAccion(
          adminIdActual,
          ACCIONES_BITACORA.ELIMINAR_ADMIN || 'ELIMINAR_ADMIN',
          `Administrador eliminado: ID ${id}, Usuario "${adminAEliminar.usuario}"`
        );
      } catch (bitacoraError) {
        console.error('Error al registrar en bitácora:', bitacoraError);
      }

      // Respuesta exitosa
      return sendResponse(
        res, 
        HTTP_STATUS.OK, 
        {
          id: parseInt(id),
          usuario: adminAEliminar.usuario
        }, 
        'Administrador eliminado exitosamente'
      );

    } catch (error) {
      console.error('Error en eliminarAdministrador:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER);
    }
  },

  /**
   * Obtener un administrador por ID
   * GET /api/administradores/:id
   * Requiere autenticación previa y permisos de administrador
   * @param {Object} req - Objeto de petición
   * @param {Object} res - Objeto de respuesta
   */
  async obtenerAdministradorPorId(req, res) {
    try {
      const { id } = req.params;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'ID de administrador inválido');
      }

      // Obtener administrador con rol
      const result = await AdministradorModel.obtenerAdminConRol(parseInt(id));

      if (!result.success || !result.data) {
        return sendError(res, HTTP_STATUS.NOT_FOUND, 'Administrador no encontrado');
      }

      // Normalizar roles → rol
      const { roles, password_hash, ...adminData } = result.data;
      const adminNormalizado = {
        ...adminData,
        rol: roles || null
      };

      // Respuesta exitosa
      return sendResponse(
        res, 
        HTTP_STATUS.OK, 
        {
          admin: adminNormalizado
        }, 
        'Administrador obtenido exitosamente'
      );

    } catch (error) {
      console.error('Error en obtenerAdministradorPorId:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER);
    }
  }
};