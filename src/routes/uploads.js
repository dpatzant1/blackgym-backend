import express from 'express';
import { uploadsController } from '../controllers/uploads.js';
import { uploadSingleImage, handleUploadError } from '../middleware/upload.js';
import { requireAdminAuth, logAdminAction } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/uploads/image
 * Subir imagen al storage
 * Requiere autenticación de administrador
 * Proceso: multer → auth → controlador
 */
router.post('/image', 
  uploadSingleImage,           // 1. Procesar archivo con multer
  handleUploadError,           // 2. Manejar errores de multer
  requireAdminAuth,            // 3. Verificar autenticación admin
  logAdminAction,              // 4. Log de la acción administrativa
  uploadsController.subirImagen // 5. Ejecutar controlador
);

/**
 * GET /api/uploads/info
 * Obtener información sobre límites y tipos permitidos
 * No requiere autenticación (información pública)
 */
router.get('/info', 
  uploadsController.obtenerInfo
);

/**
 * POST /api/uploads/validate
 * Validar archivo sin subirlo (útil para frontend)
 * No requiere autenticación de admin, solo validación
 */
router.post('/validate',
  uploadSingleImage,              // 1. Procesar archivo con multer
  handleUploadError,              // 2. Manejar errores de multer
  uploadsController.validarArchivo // 3. Validar sin subir
);

/**
 * GET /api/uploads/stats
 * Obtener estadísticas de uploads
 * Requiere autenticación de administrador
 */
router.get('/stats',
  requireAdminAuth,                    // 1. Verificar autenticación admin
  logAdminAction,                      // 2. Log de la acción administrativa
  uploadsController.obtenerEstadisticas // 3. Ejecutar controlador
);

/**
 * Ruta de información general del módulo de uploads
 * GET /api/uploads/
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Uploads - Black Gym Backend',
    module: 'uploads',
    endpoints: {
      'POST /image': {
        description: 'Subir imagen al storage',
        authentication: 'required (admin)',
        contentType: 'multipart/form-data',
        field: 'image',
        maxSize: '5MB',
        allowedTypes: ['jpeg', 'jpg', 'png', 'webp', 'gif']
      },
      'GET /info': {
        description: 'Información sobre límites y tipos permitidos',
        authentication: 'none'
      },
      'POST /validate': {
        description: 'Validar archivo sin subirlo',
        authentication: 'none',
        contentType: 'multipart/form-data',
        field: 'image'
      },
      'GET /stats': {
        description: 'Estadísticas de uploads',
        authentication: 'required (admin)'
      }
    },
    security: {
      adminAuth: 'Headers: x-admin-user, x-admin-password',
      fileValidation: 'Tipo y tamaño de archivo',
      storageProvider: 'Supabase Storage'
    }
  });
});

export default router;