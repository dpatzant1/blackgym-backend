import bcrypt from 'bcrypt';
import { AUTH_CONFIG } from './constants.js';

/**
 * Genera un hash de la contraseña usando bcrypt
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} - Hash de la contraseña
 */
export const hashPassword = async (password) => {
  try {
    const saltRounds = AUTH_CONFIG.BCRYPT_SALT_ROUNDS;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    throw new Error('Error al encriptar la contraseña');
  }
};

/**
 * Verifica si una contraseña coincide con su hash
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash almacenado en la base de datos
 * @returns {Promise<boolean>} - true si coincide, false si no
 */
export const verifyPassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error('Error al verificar la contraseña');
  }
};

/**
 * Valida la fuerza de una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {boolean} - true si cumple los requisitos, false si no
 */
export const validatePasswordStrength = (password) => {
  if (!password || password.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
    return false;
  }
  
  return AUTH_CONFIG.PASSWORD_REGEX.test(password);
};

/**
 * Extrae las credenciales de administrador de los headers
 * @param {Object} headers - Headers de la petición HTTP
 * @returns {Object|null} - {usuario, password} o null si no están presentes
 */
export const extractAdminCredentials = (headers) => {
  const usuario = headers[AUTH_CONFIG.ADMIN_HEADERS.USER];
  const password = headers[AUTH_CONFIG.ADMIN_HEADERS.PASSWORD];
  
  if (!usuario || !password) {
    return null;
  }
  
  return { usuario, password };
};