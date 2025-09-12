import express from 'express';
import { administradorController } from '../controllers/administradores.js';
import { requireAdminAuth, logAdminAction } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/verify
 * Verificar credenciales de administrador
 * No requiere autenticación previa (es el endpoint de login)
 */
router.post('/verify', 
  administradorController.verificarCredenciales
);

/**
 * PUT /api/auth/change-password
 * Cambiar contraseña de administrador
 * Requiere autenticación previa
 */
router.put('/change-password',
  requireAdminAuth,                        // 1. Verificar autenticación admin
  logAdminAction,                          // 2. Log de la acción administrativa
  administradorController.cambiarPassword  // 3. Ejecutar controlador
);

/**
 * GET /api/auth/profile
 * Obtener información del administrador actual
 * Requiere autenticación previa
 */
router.get('/profile',
  requireAdminAuth,                      // 1. Verificar autenticación admin
  logAdminAction,                        // 2. Log de la acción administrativa
  administradorController.obtenerPerfil  // 3. Ejecutar controlador
);

/**
 * GET /api/auth/admins
 * Listar todos los administradores
 * Requiere autenticación previa
 */
router.get('/admins',
  requireAdminAuth,                            // 1. Verificar autenticación admin
  logAdminAction,                              // 2. Log de la acción administrativa
  administradorController.listarAdministradores // 3. Ejecutar controlador
);

/**
 * GET /api/auth/status
 * Verificar estado del sistema de administración
 * No requiere autenticación (información pública del sistema)
 */
router.get('/status',
  administradorController.verificarEstado
);

/**
 * Ruta de información general del módulo de autenticación
 * GET /api/auth/
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Autenticación - Black Gym Backend',
    module: 'authentication',
    version: '1.0.0',
    endpoints: {
      'POST /verify': {
        description: 'Verificar credenciales de administrador',
        authentication: 'none (endpoint de login)',
        body: {
          usuario: 'string (required)',
          password: 'string (required)'
        },
        response: 'Información del administrador si las credenciales son válidas'
      },
      'PUT /change-password': {
        description: 'Cambiar contraseña de administrador',
        authentication: 'required (admin)',
        headers: {
          'x-admin-user': 'usuario del administrador',
          'x-admin-password': 'contraseña actual del administrador'
        },
        body: {
          currentPassword: 'string (required)',
          newPassword: 'string (required, min 8 chars, strong)'
        }
      },
      'GET /profile': {
        description: 'Obtener información del administrador actual',
        authentication: 'required (admin)',
        headers: {
          'x-admin-user': 'usuario del administrador',
          'x-admin-password': 'contraseña del administrador'
        }
      },
      'GET /admins': {
        description: 'Listar todos los administradores',
        authentication: 'required (admin)',
        headers: {
          'x-admin-user': 'usuario del administrador',
          'x-admin-password': 'contraseña del administrador'
        }
      },
      'GET /status': {
        description: 'Estado del sistema de administración',
        authentication: 'none (información pública)',
        response: 'Información sobre si el sistema está configurado'
      }
    },
    security: {
      authMethod: 'Custom headers (x-admin-user, x-admin-password)',
      passwordHashing: 'bcrypt with 12 salt rounds',
      sessionless: 'No hay sesiones del servidor',
      realTimeAuth: 'Verificación de credenciales en cada petición'
    },
    passwordRequirements: {
      minLength: 8,
      required: ['uppercase', 'lowercase', 'number', 'special character'],
      pattern: 'Al menos 8 caracteres con mayúscula, minúscula, número y símbolo'
    }
  });
});

export default router;