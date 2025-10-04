import express from 'express';
import rolesController from '../controllers/roles.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

const router = express.Router();

/**
 * Rutas de Roles
 * Sistema de gestión de roles y permisos
 * 
 * Protección:
 * - Todas las rutas: Solo Administradores
 * 
 * Nota: asignarRolAAdmin está en /api/administradores/:id/rol
 */

// GET /api/roles - Listar todos los roles
// Query params: include_permisos (true|false)
// Acceso: Solo Administradores
router.get('/',
  requireAdminAuth,
  requireAdmin(),
  rolesController.listarRoles
);

// GET /api/roles/stats - Obtener estadísticas de roles
// Acceso: Solo Administradores
router.get('/stats',
  requireAdminAuth,
  requireAdmin(),
  rolesController.obtenerEstadisticasRoles
);

// GET /api/roles/nombre/:nombre - Obtener rol por nombre
// Params: nombre
// Acceso: Solo Administradores
router.get('/nombre/:nombre',
  requireAdminAuth,
  requireAdmin(),
  rolesController.obtenerRolPorNombre
);

// GET /api/roles/:id - Obtener rol específico por ID
// Params: id
// Acceso: Solo Administradores
router.get('/:id',
  requireAdminAuth,
  requireAdmin(),
  rolesController.obtenerRol
);

// GET /api/roles/:id/permisos - Obtener permisos de un rol
// Params: id
// Query params: expandir (true|false)
// Acceso: Solo Administradores
router.get('/:id/permisos',
  requireAdminAuth,
  requireAdmin(),
  rolesController.obtenerPermisosDeRol
);

// GET /api/roles/:id/administradores - Listar administradores con un rol específico
// Params: id
// Acceso: Solo Administradores
router.get('/:id/administradores',
  requireAdminAuth,
  requireAdmin(),
  rolesController.obtenerAdministradoresPorRol
);

export default router;
