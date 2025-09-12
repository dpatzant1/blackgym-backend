import { extractAdminCredentials } from '../utils/auth.js';
import { sendError } from '../utils/validators.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Middleware para verificar credenciales de administrador
 * Extrae las credenciales de los headers personalizados
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