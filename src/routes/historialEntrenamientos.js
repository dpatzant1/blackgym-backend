import express from 'express';
import HistorialEntrenamientosController from '../controllers/historialEntrenamientos.js';
import { requireUserAuth, logUserAction } from '../middleware/authUsuarios.js';

const router = express.Router();

/**
 * @route   POST /api/entrenamientos
 * @desc    Registrar un entrenamiento completado
 * @access  Privado (Usuario autenticado)
 * @body    {rutina_id?, duracion_minutos, calorias_quemadas?, intensidad?, notas?, ejercicios?}
 * @returns {success, data: {id, usuario_id, rutina_id, duracion_minutos, ...}, message}
 */
router.post(
  '/',
  requireUserAuth,
  logUserAction('REGISTRAR_ENTRENAMIENTO'),
  HistorialEntrenamientosController.registrar
);

/**
 * @route   GET /api/entrenamientos
 * @desc    Obtener historial de entrenamientos con filtros
 * @access  Privado (Usuario autenticado)
 * @query   {limite?, fechaDesde?, fechaHasta?, rutinaId?, intensidad?}
 * @returns {success, data: Array, total, filtros_aplicados, message}
 */
router.get(
  '/',
  requireUserAuth,
  HistorialEntrenamientosController.obtenerHistorial
);

/**
 * @route   GET /api/entrenamientos/estadisticas
 * @desc    Obtener estadísticas de entrenamientos por periodo
 * @access  Privado (Usuario autenticado)
 * @query   {periodo?} - semana, mes, año, total (por defecto: mes)
 * @returns {success, data: {periodo, resumen, por_intensidad, rutinas_mas_usadas, fechas}, message}
 */
router.get(
  '/estadisticas',
  requireUserAuth,
  HistorialEntrenamientosController.obtenerEstadisticas
);

/**
 * @route   PUT /api/entrenamientos/:id
 * @desc    Actualizar un entrenamiento existente
 * @access  Privado (Usuario autenticado)
 * @param   {id} - ID del entrenamiento
 * @body    {duracion_minutos?, calorias_quemadas?, intensidad?, notas?}
 * @returns {success, data: {id, usuario_id, duracion_minutos, ...}, message}
 */
router.put(
  '/:id',
  requireUserAuth,
  logUserAction('ACTUALIZAR_ENTRENAMIENTO'),
  HistorialEntrenamientosController.actualizar
);

/**
 * @route   DELETE /api/entrenamientos/:id
 * @desc    Eliminar un entrenamiento
 * @access  Privado (Usuario autenticado)
 * @param   {id} - ID del entrenamiento
 * @returns {success, message}
 */
router.delete(
  '/:id',
  requireUserAuth,
  logUserAction('ELIMINAR_ENTRENAMIENTO'),
  HistorialEntrenamientosController.eliminar
);

export default router;
