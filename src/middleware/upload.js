import multer from 'multer';
import { FILE_CONFIG } from '../utils/constants.js';

// Configuración de almacenamiento en memoria
const storage = multer.memoryStorage();

// Filtro de archivos para validar tipos permitidos
const fileFilter = (req, file, cb) => {
  if (FILE_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido. Tipos válidos: ${FILE_CONFIG.ALLOWED_IMAGE_TYPES.join(', ')}`), false);
  }
};

// Configuración principal de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: FILE_CONFIG.MAX_FILE_SIZE,
    files: 1 // Solo un archivo a la vez
  }
});

/**
 * Middleware para subir una sola imagen
 * Campo esperado: 'image'
 */
export const uploadSingleImage = upload.single('image');

/**
 * Middleware para manejar errores de multer
 * @param {Error} error - Error de multer
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'Error al subir archivo';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        const maxSizeMB = (FILE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)).toFixed(1);
        message = `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Solo se permite subir un archivo a la vez';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Campo de archivo inesperado. Use el campo "image"';
        break;
      default:
        message = `Error de multer: ${error.message}`;
    }
    
    return res.status(400).json({
      success: false,
      error: message
    });
  }
  
  if (error.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  next(error);
};