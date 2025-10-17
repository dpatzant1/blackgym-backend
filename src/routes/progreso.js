import express from 'express';
import ProgresoController from '../controllers/progreso.js';
import { requireUserAuth, logUserAction } from '../middleware/authUsuarios.js';

const router = express.Router();

/**
 * @route   POST /api/progreso
 * @desc    Registrar una nueva medición de progreso físico
 * @access  Privado (Usuario autenticado)
 * @body    {peso?, altura?, porcentaje_grasa?, masa_muscular?, cintura?, pecho?, brazos?, piernas?, notas?}
 * @returns {success, data: {id, usuario_id, peso, altura, imc, ...}, message}
 */
router.post(
  '/',
  requireUserAuth,
  logUserAction('REGISTRAR_PROGRESO'),
  ProgresoController.registrar
);

/**
 * @route   GET /api/progreso
 * @desc    Obtener historial de mediciones con filtros opcionales
 * @access  Privado (Usuario autenticado)
 * @query   {limite?, fechaDesde?, fechaHasta?}
 * @returns {success, data: Array, total, message}
 */
router.get(
  '/',
  requireUserAuth,
  ProgresoController.obtenerHistorial
);

/**
 * @route   GET /api/progreso/estadisticas
 * @desc    Obtener estadísticas completas del progreso físico
 * @access  Privado (Usuario autenticado)
 * @returns {success, data: {total_mediciones, inicial, actual, diferencias, promedios, ...}, message}
 */
router.get(
  '/estadisticas',
  requireUserAuth,
  ProgresoController.obtenerEstadisticas
);

/**
 * @route   GET /api/progreso/ultimo
 * @desc    Obtener la última medición registrada
 * @access  Privado (Usuario autenticado)
 * @returns {success, data: {id, peso, altura, imc, ...}, message}
 */
router.get(
  '/ultimo',
  requireUserAuth,
  ProgresoController.obtenerUltimo
);

/**
 * @route   DELETE /api/progreso/:id
 * @desc    Eliminar una medición específica
 * @access  Privado (Usuario autenticado)
 * @param   {id} - ID de la medición
 * @returns {success, message}
 */
router.delete(
  '/:id',
  requireUserAuth,
  logUserAction('ELIMINAR_PROGRESO'),
  ProgresoController.eliminar
);

export default router;
