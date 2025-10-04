import { sendError } from '../utils/validators.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import { AdministradorModel } from '../models/administradores.js';
import { RolModel } from '../models/roles.js';
import { 
  verificarPermiso, 
  esAdministrador as esAdminRol,
  existeRol 
} from '../utils/permissions.js';

/**
 * Middleware de Roles y Permisos
 * Proporciona control de acceso basado en roles (RBAC)
 */

/**
 * Middleware para requerir un permiso específico
 * Verifica que el usuario autenticado tenga el permiso necesario
 * 
 * @param {string} permiso - Permiso requerido (ej: 'productos.crear')
 * @returns {Function} Middleware function
 * 
 * @example
 * router.delete('/:id', 
 *   requireAdminAuth,
 *   requirePermission('productos.eliminar'),
 *   deleteProducto
 * );
 */
export function requirePermission(permiso) {
  return async (req, res, next) => {
    try {
      // Verificar que el permiso sea válido
      if (!permiso || typeof permiso !== 'string') {
        console.error('[Roles] Permiso inválido proporcionado al middleware:', permiso);
        return sendError(
          res,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          'Configuración de permisos incorrecta'
        );
      }

      // Verificar que el usuario esté autenticado
      if (!req.adminCredentials) {
        return sendError(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_MESSAGES.MISSING_AUTH_HEADERS
        );
      }

      // Obtener información del administrador con su rol
      const { usuario } = req.adminCredentials;
      const adminResult = await AdministradorModel.obtenerPorUsuarioConRol(usuario);

      if (!adminResult.success || !adminResult.data) {
        return sendError(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          'Administrador no encontrado'
        );
      }

      const admin = adminResult.data;

      // Normalizar: Supabase retorna 'roles' (plural), necesitamos 'rol' (singular)
      const rolData = admin.roles || admin.rol;

      // Verificar que tenga un rol asignado
      if (!admin.rol_id || !rolData) {
        return sendError(
          res,
          HTTP_STATUS.FORBIDDEN,
          'No tiene un rol asignado. Contacte al administrador del sistema.'
        );
      }

      // Agregar información del admin y rol al request
      req.adminId = admin.id;
      req.adminRole = rolData.nombre;
      req.admin = { ...admin, rol: rolData };

      // Verificar si tiene el permiso requerido
      const tienePermiso = verificarPermiso(rolData.nombre, permiso);

      if (!tienePermiso) {
        console.warn(
          `[Roles] Acceso denegado: Usuario "${usuario}" (rol: ${rolData.nombre}) intentó acceder a recurso con permiso "${permiso}"`
        );
        
        return sendError(
          res,
          HTTP_STATUS.FORBIDDEN,
          `No tiene permisos para realizar esta acción. Permiso requerido: ${permiso}`
        );
      }

      // Permiso concedido, continuar
      next();

    } catch (error) {
      console.error('[Roles] Error en requirePermission:', error.message);
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.INTERNAL_SERVER,
        error.message
      );
    }
  };
}

/**
 * Middleware para requerir uno de múltiples roles
 * Verifica que el usuario tenga uno de los roles permitidos
 * 
 * @param {Array<string>|string} rolesPermitidos - Rol o array de roles permitidos
 * @returns {Function} Middleware function
 * 
 * @example
 * // Un solo rol
 * router.get('/stats', requireAdminAuth, requireRole('administrador'), getStats);
 * 
 * // Múltiples roles
 * router.put('/:id', 
 *   requireAdminAuth,
 *   requireRole(['administrador', 'gerente']),
 *   updateProducto
 * );
 */
export function requireRole(rolesPermitidos) {
  return async (req, res, next) => {
    try {
      // Normalizar a array
      const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];

      // Validar que se proporcionaron roles
      if (roles.length === 0) {
        console.error('[Roles] No se proporcionaron roles al middleware');
        return sendError(
          res,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          'Configuración de roles incorrecta'
        );
      }

      // Verificar que el usuario esté autenticado
      if (!req.adminCredentials) {
        return sendError(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_MESSAGES.MISSING_AUTH_HEADERS
        );
      }

      // Obtener información del administrador con su rol
      const { usuario } = req.adminCredentials;
      const adminResult = await AdministradorModel.obtenerPorUsuarioConRol(usuario);

      if (!adminResult.success || !adminResult.data) {
        return sendError(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          'Administrador no encontrado'
        );
      }

      const admin = adminResult.data;

      // Normalizar: Supabase retorna 'roles' (plural), necesitamos 'rol' (singular)
      const rolData = admin.roles || admin.rol;

      // Verificar que tenga un rol asignado
      if (!admin.rol_id || !rolData) {
        return sendError(
          res,
          HTTP_STATUS.FORBIDDEN,
          'No tiene un rol asignado. Contacte al administrador del sistema.'
        );
      }

      // Agregar información del admin y rol al request
      req.adminId = admin.id;
      req.adminRole = rolData.nombre;
      req.admin = { ...admin, rol: rolData };

      // Verificar si el rol del usuario está en la lista de roles permitidos
      const rolNormalizado = rolData.nombre.toLowerCase().trim();
      const tieneRol = roles.some(rol => rol.toLowerCase().trim() === rolNormalizado);

      if (!tieneRol) {
        console.warn(
          `[Roles] Acceso denegado: Usuario "${usuario}" (rol: ${rolData.nombre}) intentó acceder a recurso que requiere roles: ${roles.join(', ')}`
        );
        
        return sendError(
          res,
          HTTP_STATUS.FORBIDDEN,
          `No tiene permisos para realizar esta acción. Roles permitidos: ${roles.join(', ')}`
        );
      }

      // Rol válido, continuar
      next();

    } catch (error) {
      console.error('[Roles] Error en requireRole:', error.message);
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.INTERNAL_SERVER,
        error.message
      );
    }
  };
}

/**
 * Middleware que solo permite acceso a administradores
 * Shorthand para requireRole('administrador')
 * 
 * @returns {Function} Middleware function
 * 
 * @example
 * router.delete('/all', requireAdminAuth, requireAdmin(), deleteAll);
 */
export function requireAdmin() {
  return requireRole('administrador');
}

/**
 * Helper para verificar si el usuario actual es administrador
 * Debe usarse después de requireAdminAuth o requirePermission/requireRole
 * 
 * @param {Object} req - Objeto de petición
 * @returns {boolean} - true si es administrador
 * 
 * @example
 * // Dentro de un controlador
 * export const someController = async (req, res, next) => {
 *   if (isAdmin(req)) {
 *     // Lógica especial para administradores
 *   }
 * };
 */
export function isAdmin(req) {
  try {
    // Verificar si ya se cargó el rol
    if (req.adminRole) {
      return esAdminRol(req.adminRole);
    }

    // Si no está en req, no se puede verificar
    console.warn('[Roles] isAdmin llamado sin información de rol en request');
    return false;

  } catch (error) {
    console.error('[Roles] Error en isAdmin:', error.message);
    return false;
  }
}

/**
 * Middleware que carga información de rol sin verificar permisos
 * Útil para rutas que necesitan información del rol pero no restricciones
 * 
 * @returns {Function} Middleware function
 * 
 * @example
 * router.get('/profile', requireAdminAuth, loadRole(), getProfile);
 */
export function loadRole() {
  return async (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.adminCredentials) {
        return sendError(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_MESSAGES.MISSING_AUTH_HEADERS
        );
      }

      // Obtener información del administrador con su rol
      const { usuario } = req.adminCredentials;
      const adminResult = await AdministradorModel.obtenerPorUsuarioConRol(usuario);

      if (!adminResult.success || !adminResult.data) {
        return sendError(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          'Administrador no encontrado'
        );
      }

      const admin = adminResult.data;

      // Agregar información del admin y rol al request (incluso si no tiene rol)
      req.adminId = admin.id;
      req.adminRole = admin.rol ? admin.rol.nombre : null;
      req.admin = admin;

      // Continuar sin verificar permisos
      next();

    } catch (error) {
      console.error('[Roles] Error en loadRole:', error.message);
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.INTERNAL_SERVER,
        error.message
      );
    }
  };
}

/**
 * Middleware que verifica múltiples permisos (AND lógico)
 * El usuario debe tener TODOS los permisos especificados
 * 
 * @param {Array<string>} permisos - Array de permisos requeridos
 * @returns {Function} Middleware function
 * 
 * @example
 * router.post('/complex-action',
 *   requireAdminAuth,
 *   requireAllPermissions(['productos.crear', 'categorias.editar']),
 *   complexAction
 * );
 */
export function requireAllPermissions(permisos) {
  return async (req, res, next) => {
    try {
      // Validar parámetros
      if (!Array.isArray(permisos) || permisos.length === 0) {
        console.error('[Roles] Array de permisos inválido:', permisos);
        return sendError(
          res,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          'Configuración de permisos incorrecta'
        );
      }

      // Verificar que el usuario esté autenticado
      if (!req.adminCredentials) {
        return sendError(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_MESSAGES.MISSING_AUTH_HEADERS
        );
      }

      // Obtener información del administrador con su rol
      const { usuario } = req.adminCredentials;
      const adminResult = await AdministradorModel.obtenerPorUsuarioConRol(usuario);

      if (!adminResult.success || !adminResult.data) {
        return sendError(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          'Administrador no encontrado'
        );
      }

      const admin = adminResult.data;

      // Normalizar: Supabase retorna 'roles' (plural), necesitamos 'rol' (singular)
      const rolData = admin.roles || admin.rol;

      // Verificar que tenga un rol asignado
      if (!admin.rol_id || !rolData) {
        return sendError(
          res,
          HTTP_STATUS.FORBIDDEN,
          'No tiene un rol asignado. Contacte al administrador del sistema.'
        );
      }

      // Agregar información del admin y rol al request
      req.adminId = admin.id;
      req.adminRole = rolData.nombre;
      req.admin = { ...admin, rol: rolData };

      // Verificar cada permiso
      const permisosFaltantes = [];
      for (const permiso of permisos) {
        const tienePermiso = verificarPermiso(rolData.nombre, permiso);
        if (!tienePermiso) {
          permisosFaltantes.push(permiso);
        }
      }

      if (permisosFaltantes.length > 0) {
        console.warn(
          `[Roles] Acceso denegado: Usuario "${usuario}" (rol: ${rolData.nombre}) no tiene permisos: ${permisosFaltantes.join(', ')}`
        );
        
        return sendError(
          res,
          HTTP_STATUS.FORBIDDEN,
          `No tiene todos los permisos necesarios. Permisos faltantes: ${permisosFaltantes.join(', ')}`
        );
      }

      // Tiene todos los permisos, continuar
      next();

    } catch (error) {
      console.error('[Roles] Error en requireAllPermissions:', error.message);
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.INTERNAL_SERVER,
        error.message
      );
    }
  };
}

/**
 * Middleware que verifica si tiene al menos uno de los permisos (OR lógico)
 * El usuario debe tener AL MENOS UNO de los permisos especificados
 * 
 * @param {Array<string>} permisos - Array de permisos (se requiere al menos uno)
 * @returns {Function} Middleware function
 * 
 * @example
 * router.get('/reports',
 *   requireAdminAuth,
 *   requireAnyPermission(['bitacora.leer', 'bitacora.exportar']),
 *   getReports
 * );
 */
export function requireAnyPermission(permisos) {
  return async (req, res, next) => {
    try {
      // Validar parámetros
      if (!Array.isArray(permisos) || permisos.length === 0) {
        console.error('[Roles] Array de permisos inválido:', permisos);
        return sendError(
          res,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          'Configuración de permisos incorrecta'
        );
      }

      // Verificar que el usuario esté autenticado
      if (!req.adminCredentials) {
        return sendError(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_MESSAGES.MISSING_AUTH_HEADERS
        );
      }

      // Obtener información del administrador con su rol
      const { usuario } = req.adminCredentials;
      const adminResult = await AdministradorModel.obtenerPorUsuarioConRol(usuario);

      if (!adminResult.success || !adminResult.data) {
        return sendError(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          'Administrador no encontrado'
        );
      }

      const admin = adminResult.data;

      // Normalizar: Supabase retorna 'roles' (plural), necesitamos 'rol' (singular)
      const rolData = admin.roles || admin.rol;

      // Verificar que tenga un rol asignado
      if (!admin.rol_id || !rolData) {
        return sendError(
          res,
          HTTP_STATUS.FORBIDDEN,
          'No tiene un rol asignado. Contacte al administrador del sistema.'
        );
      }

      // Agregar información del admin y rol al request
      req.adminId = admin.id;
      req.adminRole = rolData.nombre;
      req.admin = { ...admin, rol: rolData };

      // Verificar si tiene al menos uno de los permisos
      const tieneAlgunPermiso = permisos.some(permiso => 
        verificarPermiso(rolData.nombre, permiso)
      );

      if (!tieneAlgunPermiso) {
        console.warn(
          `[Roles] Acceso denegado: Usuario "${usuario}" (rol: ${rolData.nombre}) no tiene ninguno de los permisos: ${permisos.join(', ')}`
        );
        
        return sendError(
          res,
          HTTP_STATUS.FORBIDDEN,
          `No tiene permisos para realizar esta acción. Se requiere al menos uno de: ${permisos.join(', ')}`
        );
      }

      // Tiene al menos un permiso, continuar
      next();

    } catch (error) {
      console.error('[Roles] Error en requireAnyPermission:', error.message);
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.INTERNAL_SERVER,
        error.message
      );
    }
  };
}

/**
 * Obtener información del rol del usuario actual
 * Helper para usar en controladores
 * 
 * @param {Object} req - Objeto de petición
 * @returns {Object|null} - Información del rol o null
 */
export function getRoleInfo(req) {
  try {
    if (!req.admin || !req.admin.rol) {
      return null;
    }

    return {
      id: req.admin.rol.id,
      nombre: req.admin.rol.nombre,
      descripcion: req.admin.rol.descripcion
    };

  } catch (error) {
    console.error('[Roles] Error en getRoleInfo:', error.message);
    return null;
  }
}

/**
 * Verificar si el usuario actual tiene un permiso específico
 * Helper para lógica condicional en controladores
 * 
 * @param {Object} req - Objeto de petición
 * @param {string} permiso - Permiso a verificar
 * @returns {boolean} - true si tiene el permiso
 */
export function hasPermission(req, permiso) {
  try {
    if (!req.adminRole) {
      return false;
    }

    return verificarPermiso(req.adminRole, permiso);

  } catch (error) {
    console.error('[Roles] Error en hasPermission:', error.message);
    return false;
  }
}

// Exportar todo
export default {
  requirePermission,
  requireRole,
  requireAdmin,
  isAdmin,
  loadRole,
  requireAllPermissions,
  requireAnyPermission,
  getRoleInfo,
  hasPermission
};
