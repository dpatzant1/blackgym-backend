import express from 'express';
import RecomendacionController from '../controllers/recomendaciones.js';
import { requireUserAuth, logUserAction } from '../middleware/authUsuarios.js';

const router = express.Router();

/**
 * Rutas para gestión de recomendaciones de productos con IA
 * Todas las rutas requieren autenticación de usuario (JWT)
 */

/**
 * @route   GET /api/recomendaciones/estadisticas
 * @desc    Obtener estadísticas de recomendaciones del usuario
 * @access  Protegido (requiere autenticación de usuario)
 * @returns { data: object } - Total, vistas, no vistas, relevancia promedio
 * @note    Debe ir antes de '/:id' para evitar conflictos de rutas
 */
router.get(
  '/estadisticas',
  requireUserAuth,
  RecomendacionController.obtenerEstadisticas
);

/**
 * @route   GET /api/recomendaciones
 * @desc    Obtener productos recomendados para el usuario autenticado
 * @access  Protegido (requiere autenticación de usuario)
 * @query   ?limite=10&soloNoVistas=true
 * @returns { data: array, cache: boolean } - Array de recomendaciones con info de productos
 * @note    Si no hay recomendaciones o son antiguas (>7 días), genera automáticamente con IA
 */
router.get(
  '/',
  requireUserAuth,
  RecomendacionController.obtener
);

/**
 * @route   POST /api/recomendaciones/generar
 * @desc    Forzar generación de nuevas recomendaciones con IA
 * @access  Protegido (requiere autenticación de usuario)
 * @returns { data: array } - Nuevas recomendaciones generadas
 * @note    Elimina recomendaciones anteriores y genera nuevas
 */
router.post(
  '/generar',
  requireUserAuth,
  logUserAction('Generar recomendaciones con IA'),
  RecomendacionController.generar
);

/**
 * @route   PUT /api/recomendaciones/:id/vista
 * @desc    Marcar una recomendación como vista por el usuario
 * @access  Protegido (requiere autenticación de usuario)
 * @params  id - ID de la recomendación
 * @returns { success: boolean, message: string }
 * @note    Útil para analytics y seguimiento de engagement
 */
router.put(
  '/:id/vista',
  requireUserAuth,
  RecomendacionController.marcarVista
);

export default router;
