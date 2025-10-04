import { RolModel } from '../models/roles.js';
import { AdministradorModel } from '../models/administradores.js';
import { sendResponse, sendError } from '../utils/validators.js';
import { HTTP_STATUS, ACCIONES_BITACORA } from '../utils/constants.js';
import { obtenerPermisosDeRol, expandirPermisos, obtenerInfoRol } from '../utils/permissions.js';
import { registrarAccion } from '../utils/bitacora.js';

/**
 * Controlador de Roles
 * Gestiona endpoints para consultar roles y asignar roles a administradores
 */

/**
 * Listar todos los roles disponibles
 * GET /api/roles
 * 
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
export const listarRoles = async (req, res, next) => {
  try {
    // Obtener todos los roles
    const result = await RolModel.listarTodos();

    if (!result.success) {
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error al obtener roles',
        result.error
      );
    }

    // Enriquecer con información de permisos si se solicita
    const includePermisos = req.query.include_permisos === 'true';
    
    let roles = result.data;

    if (includePermisos) {
      // Agregar información de permisos a cada rol
      roles = roles.map(rol => {
        const permisos = obtenerPermisosDeRol(rol.nombre);
        const permisosExpandidos = expandirPermisos(permisos);
        
        return {
          ...rol,
          permisos: permisos,
          permisosExpandidos: permisosExpandidos,
          totalPermisos: permisosExpandidos.length
        };
      });
    }

    sendResponse(
      res, 
      HTTP_STATUS.OK, 
      { roles }, 
      'Roles obtenidos exitosamente'
    );

  } catch (error) {
    console.error('[Roles Controller] Error en listarRoles:', error);
    next(error);
  }
};

/**
 * Obtener un rol específico por ID
 * GET /api/roles/:id
 * 
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
export const obtenerRol = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    const rolId = parseInt(id);
    if (isNaN(rolId) || rolId <= 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'ID de rol inválido'
      );
    }

    // Buscar rol por ID
    const result = await RolModel.buscarPorId(rolId);

    if (!result.success) {
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error al obtener rol',
        result.error
      );
    }

    if (!result.data) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        `Rol con ID ${rolId} no encontrado`
      );
    }

    const rol = result.data;

    // Obtener información completa del rol (permisos, etc.)
    const infoRol = obtenerInfoRol(rol.nombre);

    // Contar administradores con este rol
    const countResult = await RolModel.contarAdministradores(rolId);
    const totalAdmins = countResult.success ? countResult.data : 0;

    sendResponse(res, HTTP_STATUS.OK, {
      rol: {
        ...rol,
        permisos: infoRol.permisos,
        permisosExpandidos: infoRol.permisosExpandidos,
        totalPermisos: infoRol.totalPermisos,
        totalAdministradores: totalAdmins,
        descripcionesPermisos: infoRol.descripcionesPermisos
      }
    }, 'Rol obtenido exitosamente');

  } catch (error) {
    console.error('[Roles Controller] Error en obtenerRol:', error);
    next(error);
  }
};

/**
 * Asignar rol a un administrador
 * PUT /api/administradores/:id/rol
 * Body: { rol_id: number }
 * 
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
export const asignarRolAAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rol_id } = req.body;

    // Validar ID del administrador
    const adminId = parseInt(id);
    if (isNaN(adminId) || adminId <= 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'ID de administrador inválido'
      );
    }

    // Validar que se proporcionó rol_id
    if (rol_id === undefined || rol_id === null) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'El campo rol_id es requerido'
      );
    }

    // Validar rol_id
    const rolId = parseInt(rol_id);
    if (isNaN(rolId) || rolId <= 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'rol_id debe ser un número válido mayor a 0'
      );
    }

    // Verificar que el administrador existe
    const adminResult = await AdministradorModel.obtenerAdminConRol(adminId);
    if (!adminResult.success || !adminResult.data) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        `Administrador con ID ${adminId} no encontrado`
      );
    }

    const adminActual = adminResult.data;
    const rolAnterior = adminActual.rol ? adminActual.rol.nombre : 'Sin rol';

    // Verificar que el rol existe
    const rolResult = await RolModel.buscarPorId(rolId);
    if (!rolResult.success || !rolResult.data) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        `Rol con ID ${rolId} no encontrado`
      );
    }

    const rolNuevo = rolResult.data;

    // Asignar rol al administrador
    const asignarResult = await AdministradorModel.asignarRol(adminId, rolId);

    if (!asignarResult.success) {
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error al asignar rol',
        asignarResult.error
      );
    }

    // Obtener información actualizada del administrador
    const adminActualizadoResult = await AdministradorModel.obtenerAdminConRol(adminId);
    const adminActualizado = adminActualizadoResult.success 
      ? adminActualizadoResult.data 
      : asignarResult.data;

    // Registrar en bitácora
    try {
      await registrarAccion(
        req.adminId,
        ACCIONES_BITACORA.ASIGNAR_ROL,
        `Rol asignado a administrador: Usuario="${adminActual.usuario}", Rol anterior="${rolAnterior}", Rol nuevo="${rolNuevo.nombre}"`
      );
    } catch (bitacoraError) {
      console.error('[Roles Controller] Error al registrar en bitácora:', bitacoraError.message);
    }

    sendResponse(res, HTTP_STATUS.OK, {
      admin: adminActualizado,
      cambio: {
        rolAnterior: rolAnterior,
        rolNuevo: rolNuevo.nombre
      }
    }, 'Rol asignado correctamente');

  } catch (error) {
    console.error('[Roles Controller] Error en asignarRolAAdmin:', error);
    next(error);
  }
};

/**
 * Obtener permisos de un rol específico
 * GET /api/roles/:id/permisos
 * Query params: expandir (true|false)
 * 
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
export const obtenerPermisosDeRolController = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    const rolId = parseInt(id);
    if (isNaN(rolId) || rolId <= 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'ID de rol inválido'
      );
    }

    // Buscar rol por ID
    const result = await RolModel.buscarPorId(rolId);

    if (!result.success) {
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error al obtener rol',
        result.error
      );
    }

    if (!result.data) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        `Rol con ID ${rolId} no encontrado`
      );
    }

    const rol = result.data;

    // Obtener permisos del rol
    const permisos = obtenerPermisosDeRol(rol.nombre);
    
    // Determinar si se deben expandir los permisos
    const expandir = req.query.expandir === 'true';
    
    let respuesta = {
      rol: {
        id: rol.id,
        nombre: rol.nombre,
        descripcion: rol.descripcion
      },
      permisos: permisos
    };

    if (expandir) {
      // Expandir wildcards a permisos específicos
      const permisosExpandidos = expandirPermisos(permisos);
      const infoRol = obtenerInfoRol(rol.nombre);
      
      respuesta.permisosExpandidos = permisosExpandidos;
      respuesta.totalPermisos = permisosExpandidos.length;
      respuesta.descripcionesPermisos = infoRol.descripcionesPermisos;
    }

    sendResponse(
      res, 
      HTTP_STATUS.OK, 
      respuesta, 
      'Permisos del rol obtenidos exitosamente'
    );

  } catch (error) {
    console.error('[Roles Controller] Error en obtenerPermisosDeRol:', error);
    next(error);
  }
};

/**
 * Obtener estadísticas de roles
 * GET /api/roles/stats
 * 
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
export const obtenerEstadisticasRoles = async (req, res, next) => {
  try {
    // Obtener estadísticas desde el modelo
    const result = await RolModel.obtenerEstadisticas();

    if (!result.success) {
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error al obtener estadísticas de roles',
        result.error
      );
    }

    sendResponse(
      res, 
      HTTP_STATUS.OK, 
      result.data, 
      'Estadísticas de roles obtenidas exitosamente'
    );

  } catch (error) {
    console.error('[Roles Controller] Error en obtenerEstadisticasRoles:', error);
    next(error);
  }
};

/**
 * Obtener administradores por rol
 * GET /api/roles/:id/administradores
 * 
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
export const obtenerAdministradoresPorRol = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    const rolId = parseInt(id);
    if (isNaN(rolId) || rolId <= 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'ID de rol inválido'
      );
    }

    // Verificar que el rol existe
    const rolResult = await RolModel.buscarPorId(rolId);
    if (!rolResult.success || !rolResult.data) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        `Rol con ID ${rolId} no encontrado`
      );
    }

    const rol = rolResult.data;

    // Obtener administradores con este rol
    const adminsResult = await AdministradorModel.listarPorRol(rolId);

    if (!adminsResult.success) {
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error al obtener administradores',
        adminsResult.error
      );
    }

    sendResponse(res, HTTP_STATUS.OK, {
      rol: {
        id: rol.id,
        nombre: rol.nombre,
        descripcion: rol.descripcion
      },
      administradores: adminsResult.data,
      total: adminsResult.data.length
    }, 'Administradores obtenidos exitosamente');

  } catch (error) {
    console.error('[Roles Controller] Error en obtenerAdministradoresPorRol:', error);
    next(error);
  }
};

/**
 * Obtener rol por nombre
 * GET /api/roles/nombre/:nombre
 * 
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
export const obtenerRolPorNombre = async (req, res, next) => {
  try {
    const { nombre } = req.params;
    
    // Validar nombre
    if (!nombre || typeof nombre !== 'string') {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Nombre de rol inválido'
      );
    }

    // Buscar rol por nombre
    const result = await RolModel.buscarPorNombre(nombre);

    if (!result.success) {
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error al obtener rol',
        result.error
      );
    }

    if (!result.data) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        `Rol "${nombre}" no encontrado`
      );
    }

    const rol = result.data;

    // Obtener información completa del rol
    const infoRol = obtenerInfoRol(rol.nombre);

    sendResponse(res, HTTP_STATUS.OK, {
      rol: {
        ...rol,
        permisos: infoRol.permisos,
        permisosExpandidos: infoRol.permisosExpandidos,
        totalPermisos: infoRol.totalPermisos
      }
    }, 'Rol obtenido exitosamente');

  } catch (error) {
    console.error('[Roles Controller] Error en obtenerRolPorNombre:', error);
    next(error);
  }
};

// Exportar controladores
export default {
  listarRoles,
  obtenerRol,
  asignarRolAAdmin,
  obtenerPermisosDeRol: obtenerPermisosDeRolController,
  obtenerEstadisticasRoles,
  obtenerAdministradoresPorRol,
  obtenerRolPorNombre
};
