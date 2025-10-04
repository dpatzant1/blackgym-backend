import { uploadFileToStorage, validateFile } from '../utils/storage.js';
import { AdministradorModel } from '../models/administradores.js';
import { sendResponse, sendError } from '../utils/validators.js';
import { HTTP_STATUS, ERROR_MESSAGES, ACCIONES_BITACORA } from '../utils/constants.js';
import { registrarAccion } from '../utils/bitacora.js';

/**
 * Controlador para manejo de uploads de archivos
 */
export const uploadsController = {

  /**
   * Subir imagen al storage
   * POST /api/uploads/image
   * Requiere autenticación de administrador
   * @param {Object} req - Objeto de petición
   * @param {Object} res - Objeto de respuesta
   */
  async subirImagen(req, res) {
    try {
      // Verificar que el administrador está autenticado
      const { usuario, password } = req.adminCredentials;
      
      // Verificar credenciales en tiempo real
      const authResult = await AdministradorModel.verificarCredenciales(usuario, password);
      if (!authResult.success) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      // Verificar que se subió un archivo
      if (!req.file) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'No se proporcionó ningún archivo');
      }

      // Validar el archivo usando las utilidades de storage
      const fileValidation = validateFile(req.file);
      if (!fileValidation.isValid) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Archivo inválido', fileValidation.errors);
      }

      // Información del archivo
      const { buffer, originalname, mimetype, size } = req.file;

      // Subir archivo a Supabase Storage
      const uploadResult = await uploadFileToStorage(buffer, originalname, mimetype);

      if (!uploadResult.success) {
        return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, uploadResult.error);
      }

      // Log de la acción realizada
      console.log(`[UPLOAD] Admin "${usuario}" subió imagen: ${uploadResult.data.fileName}`);

      // Registrar en bitácora
      try {
        const adminId = req.adminId || req.admin?.id || authResult.data.id;
        const sizeMB = (size / (1024 * 1024)).toFixed(2);
        await registrarAccion(
          adminId,
          ACCIONES_BITACORA.SUBIR_IMAGEN,
          `Imagen subida: Archivo="${originalname}", Nombre generado="${uploadResult.data.fileName}", Tamaño=${sizeMB}MB, URL="${uploadResult.data.publicUrl}"`
        );
      } catch (bitacoraError) {
        console.error('Error al registrar en bitácora:', bitacoraError);
      }

      // Respuesta exitosa
      return sendResponse(
        res,
        HTTP_STATUS.CREATED,
        {
          image: {
            fileName: uploadResult.data.fileName,
            originalName: originalname,
            publicUrl: uploadResult.data.publicUrl,
            size: size,
            mimeType: mimetype
          },
          uploadedBy: usuario,
          uploadedAt: new Date().toISOString()
        },
        'Imagen subida correctamente'
      );

    } catch (error) {
      console.error('Error en subirImagen:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER);
    }
  },

  /**
   * Obtener información sobre límites y tipos de archivo permitidos
   * GET /api/uploads/info
   * No requiere autenticación (información pública)
   * @param {Object} req - Objeto de petición
   * @param {Object} res - Objeto de respuesta
   */
  async obtenerInfo(req, res) {
    try {
      const { FILE_CONFIG } = await import('../utils/constants.js');
      
      const info = {
        allowedTypes: FILE_CONFIG.ALLOWED_IMAGE_TYPES,
        maxFileSize: FILE_CONFIG.MAX_FILE_SIZE,
        maxFileSizeMB: (FILE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)).toFixed(1),
        bucket: FILE_CONFIG.STORAGE_BUCKET,
        extensions: Object.values(FILE_CONFIG.MIME_TYPE_EXTENSIONS)
      };

      return sendResponse(
        res,
        HTTP_STATUS.OK,
        info,
        'Información de uploads obtenida correctamente'
      );

    } catch (error) {
      console.error('Error en obtenerInfo:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER);
    }
  },

  /**
   * Validar archivo antes de subir (sin subirlo)
   * POST /api/uploads/validate
   * Útil para validación en el frontend antes del upload real
   * @param {Object} req - Objeto de petición
   * @param {Object} res - Objeto de respuesta
   */
  async validarArchivo(req, res) {
    try {
      // Verificar que se proporcionó un archivo
      if (!req.file) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'No se proporcionó ningún archivo');
      }

      // Validar el archivo
      const fileValidation = validateFile(req.file);
      
      const { originalname, mimetype, size } = req.file;

      if (!fileValidation.isValid) {
        return sendResponse(
          res,
          HTTP_STATUS.OK,
          {
            valid: false,
            errors: fileValidation.errors,
            file: {
              originalName: originalname,
              mimeType: mimetype,
              size: size,
              sizeMB: (size / (1024 * 1024)).toFixed(2)
            }
          },
          'Archivo validado'
        );
      }

      // Archivo válido
      return sendResponse(
        res,
        HTTP_STATUS.OK,
        {
          valid: true,
          file: {
            originalName: originalname,
            mimeType: mimetype,
            size: size,
            sizeMB: (size / (1024 * 1024)).toFixed(2)
          }
        },
        'Archivo válido para subir'
      );

    } catch (error) {
      console.error('Error en validarArchivo:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER);
    }
  },

  /**
   * Obtener estadísticas de uploads (para administradores)
   * GET /api/uploads/stats
   * Requiere autenticación de administrador
   * @param {Object} req - Objeto de petición
   * @param {Object} res - Objeto de respuesta
   */
  async obtenerEstadisticas(req, res) {
    try {
      // Verificar que el administrador está autenticado
      const { usuario, password } = req.adminCredentials;
      
      // Verificar credenciales en tiempo real
      const authResult = await AdministradorModel.verificarCredenciales(usuario, password);
      if (!authResult.success) {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      // Por ahora, devolver estadísticas básicas
      // En el futuro se podría implementar un tracking más detallado
      const stats = {
        uploadService: 'Supabase Storage',
        bucket: 'product-images',
        maxFileSize: '5MB',
        allowedTypes: ['jpeg', 'jpg', 'png', 'webp', 'gif'],
        lastChecked: new Date().toISOString(),
        serviceStatus: 'active'
      };

      return sendResponse(
        res,
        HTTP_STATUS.OK,
        stats,
        'Estadísticas de uploads obtenidas correctamente'
      );

    } catch (error) {
      console.error('Error en obtenerEstadisticas:', error);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_SERVER);
    }
  }
};