import express from 'express';
import {
  registro,
  login,
  obtenerPerfil,
  actualizarPerfil,
  actualizarDatosFitness,
  cambiarPassword,
  eliminarCuenta,
  obtenerEstadisticas
} from '../controllers/usuarios.js';
import { requireUserAuth, logUserAction } from '../middleware/authUsuarios.js';

const router = express.Router();

// DEBUG: Log para verificar que las rutas de usuarios se están ejecutando
router.use((req, res, next) => {
  console.log('🔵 [ROUTER usuarios.js] Ruta recibida:', req.method, req.url);
  console.log('🔵 [ROUTER usuarios.js] Path completo:', req.originalUrl);
  next();
});

/**
 * Rutas de Usuarios (Clientes de la App Móvil)
 * 
 * Autenticación:
 * - Rutas públicas: registro, login
 * - Rutas protegidas: requieren token JWT (Authorization: Bearer <token>)
 * 
 * Diferencia con administradores:
 * - Administradores usan headers personalizados (x-admin-user, x-admin-password)
 * - Usuarios usan JWT en header Authorization
 */

// ==================== RUTAS PÚBLICAS (sin autenticación) ====================

/**
 * POST /api/usuarios/registro
 * Registrar nuevo usuario
 * 
 * Body:
 * {
 *   "nombre": "Juan Pérez",
 *   "email": "juan@example.com",
 *   "password": "Password123!",
 *   "objetivo": "ganar masa muscular", // opcional
 *   "peso": 75.5,                      // opcional
 *   "altura": 175                      // opcional
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "usuario": { id, nombre, email, objetivo, peso, altura, fecha_registro, activo },
 *     "token": "eyJhbGciOiJIUzI1NiIs..."
 *   },
 *   "message": "Usuario registrado exitosamente"
 * }
 */
router.post('/registro', registro);

/**
 * POST /api/usuarios/login
 * Iniciar sesión
 * 
 * Body:
 * {
 *   "email": "juan@example.com",
 *   "password": "Password123!"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "usuario": { id, nombre, email, objetivo, peso, altura, fecha_registro, activo },
 *     "token": "eyJhbGciOiJIUzI1NiIs..."
 *   },
 *   "message": "Login exitoso"
 * }
 */
router.post('/login', login);

/**
 * GET /api/usuarios/validar-token
 * Validar si el token JWT es válido (no expirado)
 * 
 * Headers:
 * {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
 * }
 * 
 * Response (token válido):
 * {
 *   "success": true,
 *   "data": { "valido": true, "usuario": { id, email, nombre } },
 *   "message": "Token válido"
 * }
 * 
 * Response (token inválido/expirado):
 * {
 *   "success": false,
 *   "error": "Token expirado" | "Token inválido"
 * }
 */
router.get('/validar-token', requireUserAuth, (req, res) => {
  // Si llegamos aquí, el token es válido (requireUserAuth lo validó)
  res.json({
    success: true,
    data: {
      valido: true,
      usuario: req.usuario
    },
    message: 'Token válido'
  });
});

// ==================== RUTAS PROTEGIDAS (requieren autenticación) ====================

/**
 * GET /api/usuarios/perfil
 * Obtener perfil del usuario autenticado
 * 
 * Headers:
 * {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
 * }
 * 
 * Query Params (opcionales):
 * - includeStats=true : Incluir estadísticas (más lento)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "usuario": { id, nombre, email, objetivo, peso, altura, fecha_registro, activo },
 *     "estadisticas": { ... } // Solo si includeStats=true
 *   },
 *   "message": "Perfil obtenido exitosamente"
 * }
 */
router.get('/perfil', 
  requireUserAuth,
  logUserAction,
  obtenerPerfil
);

/**
 * GET /api/usuarios/estadisticas
 * Obtener estadísticas del usuario autenticado
 * 
 * Headers:
 * {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "totalRutinas": 3,
 *     "totalEntrenamientos": 15,
 *     "ultimoProgreso": { peso: 74.2, fecha_medicion: "2025-10-08" }
 *   },
 *   "message": "Estadísticas obtenidas exitosamente"
 * }
 */
router.get('/estadisticas',
  requireUserAuth,
  logUserAction,
  obtenerEstadisticas
);

/**
 * PUT /api/usuarios/perfil
 * Actualizar datos personales del usuario
 * 
 * Headers:
 * {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
 * }
 * 
 * Body (al menos un campo):
 * {
 *   "nombre": "Juan Carlos Pérez", // opcional
 *   "email": "nuevoemail@example.com" // opcional
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": { id, nombre, email, objetivo, peso, altura, fecha_registro, activo },
 *   "message": "Perfil actualizado exitosamente"
 * }
 */
router.put('/perfil',
  requireUserAuth,
  logUserAction,
  actualizarPerfil
);

/**
 * PUT /api/usuarios/datos-fitness
 * Actualizar datos fitness del usuario (objetivo, peso, altura)
 * 
 * Headers:
 * {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
 * }
 * 
 * Body (al menos un campo):
 * {
 *   "objetivo": "perder grasa",  // opcional
 *   "peso": 73.5,                // opcional (kg)
 *   "altura": 176                // opcional (cm)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": { id, nombre, email, objetivo, peso, altura, fecha_registro, activo },
 *   "message": "Datos fitness actualizados exitosamente"
 * }
 */
router.put('/datos-fitness',
  requireUserAuth,
  logUserAction,
  actualizarDatosFitness
);

/**
 * PUT /api/usuarios/cambiar-password
 * Cambiar contraseña del usuario
 * 
 * Headers:
 * {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
 * }
 * 
 * Body:
 * {
 *   "passwordActual": "Password123!",
 *   "passwordNueva": "NewPassword456!"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": { "mensaje": "Contraseña actualizada correctamente" },
 *   "message": "Contraseña actualizada exitosamente"
 * }
 */
router.put('/cambiar-password',
  requireUserAuth,
  logUserAction,
  cambiarPassword
);

/**
 * DELETE /api/usuarios/cuenta
 * Eliminar cuenta del usuario (soft delete)
 * 
 * Headers:
 * {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
 * }
 * 
 * Body:
 * {
 *   "password": "Password123!" // Requerido para confirmar
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": { "mensaje": "Cuenta eliminada correctamente" },
 *   "message": "Cuenta eliminada exitosamente"
 * }
 */
router.delete('/cuenta',
  requireUserAuth,
  logUserAction,
  eliminarCuenta
);

export default router;
