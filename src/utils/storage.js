import { supabase } from '../config/supabase.js';
import { FILE_CONFIG } from './constants.js';

/**
 * Sube un archivo al bucket de Supabase Storage
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @param {string} fileName - Nombre del archivo (incluye extensión)
 * @param {string} mimeType - Tipo MIME del archivo
 * @returns {Promise<Object>} - {success, data, error}
 */
export const uploadFileToStorage = async (fileBuffer, fileName, mimeType) => {
  try {
    // Generar nombre único para evitar conflictos
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;
    
    const { data, error } = await supabase.storage
      .from(FILE_CONFIG.STORAGE_BUCKET)
      .upload(uniqueFileName, fileBuffer, {
        contentType: mimeType,
        upsert: false
      });

    if (error) {
      return {
        success: false,
        error: `Error al subir archivo: ${error.message}`
      };
    }

    // Obtener URL pública del archivo
    const { data: publicUrlData } = supabase.storage
      .from(FILE_CONFIG.STORAGE_BUCKET)
      .getPublicUrl(uniqueFileName);

    return {
      success: true,
      data: {
        fileName: uniqueFileName,
        publicUrl: publicUrlData.publicUrl,
        path: data.path
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Error interno al subir archivo: ${error.message}`
    };
  }
};

/**
 * Valida si un tipo de archivo está permitido
 * @param {string} mimeType - Tipo MIME del archivo
 * @returns {boolean} - true si está permitido, false si no
 */
export const isValidFileType = (mimeType) => {
  return FILE_CONFIG.ALLOWED_IMAGE_TYPES.includes(mimeType);
};

/**
 * Valida si el tamaño del archivo está dentro del límite
 * @param {number} fileSize - Tamaño del archivo en bytes
 * @returns {boolean} - true si está dentro del límite, false si no
 */
export const isValidFileSize = (fileSize) => {
  return fileSize <= FILE_CONFIG.MAX_FILE_SIZE;
};

/**
 * Obtiene la extensión de archivo basada en el tipo MIME
 * @param {string} mimeType - Tipo MIME del archivo
 * @returns {string} - Extensión del archivo (ej: '.jpg', '.png')
 */
export const getFileExtension = (mimeType) => {
  return FILE_CONFIG.MIME_TYPE_EXTENSIONS[mimeType] || '.bin';
};

/**
 * Valida completamente un archivo antes de subirlo
 * @param {Object} file - Objeto de archivo de multer
 * @returns {Object} - {isValid, errors}
 */
export const validateFile = (file) => {
  const errors = [];
  
  if (!file) {
    errors.push('No se proporcionó ningún archivo');
    return { isValid: false, errors };
  }
  
  if (!isValidFileType(file.mimetype)) {
    errors.push(`Tipo de archivo no permitido. Tipos válidos: ${FILE_CONFIG.ALLOWED_IMAGE_TYPES.join(', ')}`);
  }
  
  if (!isValidFileSize(file.size)) {
    const maxSizeMB = (FILE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)).toFixed(1);
    errors.push(`El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};