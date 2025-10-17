import jwt from 'jsonwebtoken';
import { sendError } from '../utils/validators.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Configuración de JWT para usuarios finales
 */
const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'blackgym_secret_key_2024_usuarios',
  EXPIRES_IN: '30d', // Token válido por 30 días
  ISSUER: 'blackgym-api',
  AUDIENCE: 'blackgym-app'
};

/**
 * Genera un token JWT para un usuario final
 * @param {Object} usuario - Datos del usuario
 * @param {number} usuario.id - ID del usuario
 * @param {string} usuario.email - Email del usuario
 * @param {string} usuario.nombre - Nombre del usuario
 * @returns {string} - Token JWT firmado
 */
export const generarTokenUsuario = (usuario) => {
  try {
    const payload = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      tipo: 'usuario' // Diferenciador de tokens de admin
    };

    const token = jwt.sign(payload, JWT_CONFIG.SECRET, {
      expiresIn: JWT_CONFIG.EXPIRES_IN,
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE
    });

    return token;
  } catch (error) {
    console.error('[Auth Usuarios] Error al generar token:', error.message);
    throw new Error('Error al generar token de autenticación');
  }
};

/**
 * Verifica y decodifica un token JWT de usuario
 * @param {string} token - Token JWT a verificar
 * @returns {Object} - Payload del token decodificado
 * @throws {Error} - Si el token es inválido o ha expirado
 */
export const verificarTokenUsuario = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE
    });

    // Verificar que sea un token de usuario (no de admin)
    if (decoded.tipo !== 'usuario') {
      throw new Error('Token inválido: no es un token de usuario');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token inválido');
    } else {
      throw error;
    }
  }
};

/**
 * Middleware para requerir autenticación de usuario
 * Verifica el token JWT en el header Authorization
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
export const requireUserAuth = async (req, res, next) => {
  try {
    // Extraer token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Token de autenticación requerido'
      );
    }

    // El formato debe ser: "Bearer <token>"
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Formato de token inválido. Use: Bearer <token>'
      );
    }

    const token = parts[1];

    // Verificar y decodificar el token
    try {
      const decoded = verificarTokenUsuario(token);
      
      // Agregar información del usuario al request
      req.usuario = {
        id: decoded.id,
        email: decoded.email,
        nombre: decoded.nombre
      };
      
      req.usuarioId = decoded.id; // Atajo para acceso rápido
      
      next();
    } catch (error) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        error.message
      );
    }
  } catch (error) {
    console.error('[Auth Usuarios] Error en middleware:', error.message);
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.INTERNAL_SERVER,
      error.message
    );
  }
};

/**
 * Middleware para logging de acciones de usuarios
 * Puede ser usado de dos formas:
 * 1. Como middleware directo: router.put('/perfil', requireUserAuth, logUserAction, controller)
 * 2. Como función que retorna middleware: router.post('/usuario', requireUserAuth, logUserAction('CREAR_ORDEN'), controller)
 * 
 * @param {string|Object} actionOrReq - Acción a loggear (string) o req (object)
 * @param {Object} res - Objeto de respuesta (solo si es middleware directo)
 * @param {Function} next - Función next (solo si es middleware directo)
 */
export const logUserAction = (actionOrReq, res, next) => {
  // Caso 1: Middleware directo - (req, res, next)
  if (typeof actionOrReq === 'object' && actionOrReq.method && typeof res === 'object' && typeof next === 'function') {
    const req = actionOrReq;
    const { method, originalUrl } = req;
    const usuario = req.usuario?.email || 'unknown';
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] USER ACTION: ${usuario} - ${method} ${originalUrl}`);
    
    next();
    return;
  }
  
  // Caso 2: Función que retorna middleware - logUserAction('ACCION')
  const action = actionOrReq;
  return (req, res, next) => {
    const { method, originalUrl } = req;
    const usuario = req.usuario?.email || 'unknown';
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] USER ACTION: ${usuario} - ${action} (${method} ${originalUrl})`);
    
    next();
  };
};

/**
 * Middleware opcional: permite acceso con o sin autenticación
 * Si hay token válido, agrega la info del usuario al request
 * Si no hay token o es inválido, continúa sin usuario
 * Útil para endpoints que funcionan diferente si el usuario está autenticado
 */
export const optionalUserAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // No hay token, continuar sin usuario
      req.usuario = null;
      req.usuarioId = null;
      return next();
    }

    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // Token mal formado, continuar sin usuario
      req.usuario = null;
      req.usuarioId = null;
      return next();
    }

    const token = parts[1];

    try {
      const decoded = verificarTokenUsuario(token);
      
      // Agregar información del usuario al request
      req.usuario = {
        id: decoded.id,
        email: decoded.email,
        nombre: decoded.nombre
      };
      
      req.usuarioId = decoded.id;
      
      next();
    } catch (error) {
      // Token inválido o expirado, continuar sin usuario
      req.usuario = null;
      req.usuarioId = null;
      next();
    }
  } catch (error) {
    // Error inesperado, continuar sin usuario
    console.error('[Auth Usuarios] Error en optionalUserAuth:', error.message);
    req.usuario = null;
    req.usuarioId = null;
    next();
  }
};
