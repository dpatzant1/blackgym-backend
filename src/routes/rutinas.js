import express from 'express';
import RutinaController from '../controllers/rutinas.js';
import { requireUserAuth, logUserAction } from '../middleware/authUsuarios.js';

const router = express.Router();

/**
 * Rutas para gestión de rutinas de entrenamiento
 * Todas las rutas requieren autenticación de usuario (JWT)
 */

/**
 * @route   POST /api/rutinas/generar-ia
 * @desc    Generar rutina personalizada con IA basada en el perfil del usuario
 * @access  Protegido (requiere autenticación de usuario)
 * @body    { experiencia?: string } - Nivel de experiencia opcional
 * @returns { rutina: object } - Rutina generada (sin guardar)
 */
router.post(
  '/generar-ia',
  requireUserAuth,
  logUserAction('Generar rutina con IA'),
  RutinaController.generarConIA
);

/**
 * @route   POST /api/rutinas/guardar-generada
 * @desc    Guardar en la base de datos una rutina generada por IA
 * @access  Protegido (requiere autenticación de usuario)
 * @body    { rutina: object, ejercicios: array }
 * @returns { data: object } - Rutina guardada con todos los ejercicios
 */
router.post(
  '/guardar-generada',
  requireUserAuth,
  logUserAction('Guardar rutina generada por IA'),
  RutinaController.guardarGenerada
);

/**
 * @route   GET /api/rutinas
 * @desc    Listar todas las rutinas del usuario autenticado
 * @access  Protegido (requiere autenticación de usuario)
 * @query   ?activas=true&nivel=intermedio
 * @returns { data: array } - Array de rutinas con contador de ejercicios
 */
router.get(
  '/',
  requireUserAuth,
  RutinaController.listar
);

/**
 * @route   GET /api/rutinas/:id
 * @desc    Obtener una rutina específica con todos sus ejercicios
 * @access  Protegido (requiere autenticación de usuario)
 * @params  id - ID de la rutina
 * @returns { data: object } - Rutina completa con ejercicios agrupados por día
 */
router.get(
  '/:id',
  requireUserAuth,
  RutinaController.obtener
);

/**
 * @route   POST /api/rutinas
 * @desc    Crear una rutina manualmente (sin IA)
 * @access  Protegido (requiere autenticación de usuario)
 * @body    { nombre, descripcion, nivel_dificultad, dias_semana, objetivo, duracion_semanas, ejercicios? }
 * @returns { data: object } - Rutina creada (con ejercicios si se proporcionaron)
 */
router.post(
  '/',
  requireUserAuth,
  logUserAction('Crear rutina manual'),
  RutinaController.crear
);

/**
 * @route   PUT /api/rutinas/:id
 * @desc    Actualizar una rutina existente
 * @access  Protegido (requiere autenticación de usuario)
 * @params  id - ID de la rutina
 * @body    { nombre?, descripcion?, nivel_dificultad?, dias_semana?, objetivo?, duracion_semanas?, activa?, ejercicios? }
 * @returns { data: object } - Rutina actualizada completa
 */
router.put(
  '/:id',
  requireUserAuth,
  logUserAction('Actualizar rutina'),
  RutinaController.actualizar
);

/**
 * @route   DELETE /api/rutinas/:id
 * @desc    Eliminar (desactivar) una rutina
 * @access  Protegido (requiere autenticación de usuario)
 * @params  id - ID de la rutina
 * @returns { success: boolean, message: string }
 */
router.delete(
  '/:id',
  requireUserAuth,
  logUserAction('Eliminar rutina'),
  RutinaController.eliminar
);

export default router;
