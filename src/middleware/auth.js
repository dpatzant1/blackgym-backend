import { extractAdminCredentials } from '../utils/auth.js';
import { sendError } from '../utils/validators.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import { AdministradorModel } from '../models/administradores.js';
import { obtenerPermisosDeRol, expandirPermisos } from '../utils/permissions.js';

/**
 * Middleware para verificar credenciales de administrador
 * Extrae las credenciales de los headers personalizados y carga información de rol
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
export const requireAdminAuth = async (req, res, next) => {
  try {
    // Extraer credenciales de los headers
    const credentials = extractAdminCredentials(req.headers);
    
    if (!credentials) {
      return sendError(
        res, 
        HTTP_STATUS.UNAUTHORIZED, 
        ERROR_MESSAGES.MISSING_AUTH_HEADERS
      );
    }

    // Agregar credenciales al objeto req para uso posterior
    req.adminCredentials = credentials;

    // Obtener información del administrador con su rol
    try {
      const adminResult = await AdministradorModel.obtenerPorUsuarioConRol(credentials.usuario);
      
      if (adminResult.success && adminResult.data) {
        const admin = adminResult.data;
        
        // Agregar información del administrador al request
        req.adminId = admin.id;
        req.admin = admin;
        
        // Agregar información del rol si existe
        if (admin.rol && admin.rol.nombre) {
          req.adminRole = admin.rol.nombre;
          
          // Obtener y expandir permisos del rol
          const permisos = obtenerPermisosDeRol(admin.rol.nombre);
          req.adminPermissions = expandirPermisos(permisos);
        } else {
          // Sin rol asignado
          req.adminRole = null;
          req.adminPermissions = [];
          
          console.warn(
            `[Auth] Usuario "${credentials.usuario}" autenticado pero sin rol asignado`
          );
        }
      } else {
        // Usuario no encontrado en base de datos
        console.warn(
          `[Auth] Usuario "${credentials.usuario}" no encontrado en base de datos`
        );
        
        // Agregar valores por defecto
        req.adminId = null;
        req.adminRole = null;
        req.adminPermissions = [];
      }
    } catch (dbError) {
      // Error al consultar la base de datos
      console.error('[Auth] Error al cargar información de rol:', dbError.message);
      
      // Continuar sin información de rol (compatibilidad con sistema anterior)
      req.adminId = null;
      req.adminRole = null;
      req.adminPermissions = [];
    }
    
    next();
  } catch (error) {
    return sendError(
      res, 
      HTTP_STATUS.INTERNAL_SERVER_ERROR, 
      ERROR_MESSAGES.INTERNAL_SERVER,
      error.message
    );
  }
};

/**
 * Middleware para logging de peticiones administrativas
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
export const logAdminAction = (req, res, next) => {
  const { method, originalUrl } = req;
  const usuario = req.adminCredentials?.usuario || 'unknown';
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] ADMIN ACTION: ${usuario} - ${method} ${originalUrl}`);
  
  next();
};