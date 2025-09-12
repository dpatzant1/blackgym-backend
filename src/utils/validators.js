import { VALIDATION_RULES, ERROR_MESSAGES, HTTP_STATUS } from './constants.js';

// Función para respuestas estandarizadas
export const sendResponse = (res, statusCode, data, message = null) => {
  const response = {
    success: statusCode < 400,
    data: data || null,
    message: message || null
  };

  res.status(statusCode).json(response);
};

// Función para respuestas de error
export const sendError = (res, statusCode, message, error = null) => {
  const response = {
    success: false,
    error: message,
    details: error || null
  };

  res.status(statusCode).json(response);
};

// Validaciones básicas mejoradas
export const validators = {
  // Validar que un campo sea requerido
  required: (value, fieldName) => {
    if (!value || value.toString().trim() === '') {
      throw new Error(ERROR_MESSAGES.REQUIRED_FIELD(fieldName));
    }
  },

  // Validar longitud de string
  stringLength: (value, fieldName, min = 0, max = Infinity) => {
    const str = value?.toString().trim() || '';
    if (str.length < min || str.length > max) {
      throw new Error(`El campo ${fieldName} debe tener entre ${min} y ${max} caracteres`);
    }
  },

  // Validar que un número sea positivo
  positiveNumber: (value, fieldName) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      throw new Error(`El campo ${fieldName} debe ser un número positivo`);
    }
  },

  // Validar que un número esté en un rango
  numberRange: (value, fieldName, min = 0, max = Infinity) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < min || num > max) {
      throw new Error(`El campo ${fieldName} debe estar entre ${min} y ${max}`);
    }
  },

  // Validar que un número sea entero
  integer: (value, fieldName) => {
    const num = parseInt(value);
    if (!Number.isInteger(num)) {
      throw new Error(`El campo ${fieldName} debe ser un número entero`);
    }
  },

  // Validar email básico
  email: (value, fieldName) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error(`El campo ${fieldName} debe ser un email válido`);
    }
  },

  // Validar teléfono
  phone: (value, fieldName) => {
    const phoneRegex = /^[0-9+\-\s()]{8,15}$/;
    if (!phoneRegex.test(value)) {
      throw new Error(`El campo ${fieldName} debe ser un teléfono válido`);
    }
  },

  // Validar URL
  url: (value, fieldName) => {
    try {
      new URL(value);
    } catch {
      throw new Error(`El campo ${fieldName} debe ser una URL válida`);
    }
  }
};

// Validación completa de datos de producto
export const validateProductData = (data) => {
  const errors = [];

  try {
    validators.required(data.nombre, 'nombre');
    validators.stringLength(
      data.nombre, 
      'nombre', 
      VALIDATION_RULES.nombre.minLength, 
      VALIDATION_RULES.nombre.maxLength
    );
  } catch (error) {
    errors.push(error.message);
  }

  try {
    validators.required(data.precio, 'precio');
    validators.numberRange(
      data.precio, 
      'precio', 
      VALIDATION_RULES.precio.min, 
      VALIDATION_RULES.precio.max
    );
  } catch (error) {
    errors.push(error.message);
  }

  try {
    validators.required(data.stock, 'stock');
    validators.integer(data.stock, 'stock');
    validators.numberRange(
      data.stock, 
      'stock', 
      VALIDATION_RULES.stock.min, 
      VALIDATION_RULES.stock.max
    );
  } catch (error) {
    errors.push(error.message);
  }

  // Validar descripción si se proporciona
  if (data.descripcion) {
    try {
      validators.stringLength(
        data.descripcion, 
        'descripcion', 
        0, 
        VALIDATION_RULES.descripcion.maxLength
      );
    } catch (error) {
      errors.push(error.message);
    }
  }

  // Validar imagen_url si se proporciona
  if (data.imagen_url) {
    try {
      validators.url(data.imagen_url, 'imagen_url');
    } catch (error) {
      errors.push(error.message);
    }
  }

  if (errors.length > 0) {
    const validationError = new Error('Errores de validación');
    validationError.name = 'ValidationError';
    validationError.details = errors;
    throw validationError;
  }

  return true;
};

// Validación completa de datos de categoría
export const validateCategoryData = (data) => {
  const errors = [];

  try {
    validators.required(data.nombre, 'nombre');
    validators.stringLength(
      data.nombre, 
      'nombre', 
      VALIDATION_RULES.nombre.minLength, 
      VALIDATION_RULES.nombre.maxLength
    );
  } catch (error) {
    errors.push(error.message);
  }

  // Validar descripción si se proporciona
  if (data.descripcion) {
    try {
      validators.stringLength(
        data.descripcion, 
        'descripcion', 
        0, 
        VALIDATION_RULES.descripcion.maxLength
      );
    } catch (error) {
      errors.push(error.message);
    }
  }

  // Validar imagen_url si se proporciona
  if (data.imagen_url) {
    try {
      validators.url(data.imagen_url, 'imagen_url');
    } catch (error) {
      errors.push(error.message);
    }
  }

  if (errors.length > 0) {
    const validationError = new Error('Errores de validación');
    validationError.name = 'ValidationError';
    validationError.details = errors;
    throw validationError;
  }

  return true;
};

// Validación completa de datos de orden
export const validateOrderData = (data) => {
  const errors = [];

  try {
    validators.required(data.cliente, 'cliente');
    validators.stringLength(data.cliente, 'cliente', 2, 100);
  } catch (error) {
    errors.push(error.message);
  }

  try {
    validators.required(data.telefono, 'telefono');
    validators.phone(data.telefono, 'telefono');
  } catch (error) {
    errors.push(error.message);
  }

  try {
    validators.required(data.direccion, 'direccion');
    validators.stringLength(
      data.direccion, 
      'direccion', 
      VALIDATION_RULES.direccion.minLength, 
      VALIDATION_RULES.direccion.maxLength
    );
  } catch (error) {
    errors.push(error.message);
  }

  try {
    validators.required(data.total, 'total');
    validators.positiveNumber(data.total, 'total');
  } catch (error) {
    errors.push(error.message);
  }

  if (errors.length > 0) {
    const validationError = new Error('Errores de validación');
    validationError.name = 'ValidationError';
    validationError.details = errors;
    throw validationError;
  }

  return true;
};

// Validación de parámetros de paginación
export const validatePaginationParams = (page, limit) => {
  const errors = [];

  if (page && (!Number.isInteger(parseInt(page)) || parseInt(page) < 1)) {
    errors.push('La página debe ser un número entero mayor a 0');
  }

  if (limit && (!Number.isInteger(parseInt(limit)) || parseInt(limit) < 1 || parseInt(limit) > 250)) {
    errors.push('El límite debe ser un número entero entre 1 y 100');
  }

  if (errors.length > 0) {
    const validationError = new Error('Errores en parámetros de paginación');
    validationError.name = 'ValidationError';
    validationError.details = errors;
    throw validationError;
  }

  return true;
};

// Middleware de validación
export const validateRequest = (validationFunction) => {
  return (req, res, next) => {
    try {
      validationFunction(req.body);
      next();
    } catch (error) {
      if (error.name === 'ValidationError') {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, error.message, error.details);
      }
      next(error);
    }
  };
};

// Sanitizar datos de entrada
export const sanitizeData = (data) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = value.trim();
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Validaciones específicas para administradores
export const validateAdminCredentials = (data) => {
  const errors = [];

  try {
    validators.required(data.usuario, 'usuario');
    validators.stringLength(data.usuario, 'usuario', 3, 50);
  } catch (error) {
    errors.push(error.message);
  }

  try {
    validators.required(data.password, 'password');
    validators.stringLength(data.password, 'password', 8, 100);
  } catch (error) {
    errors.push(error.message);
  }

  if (errors.length > 0) {
    const validationError = new Error('Errores de validación de administrador');
    validationError.name = 'ValidationError';
    validationError.details = errors;
    throw validationError;
  }

  return true;
};

// Validación para cambio de contraseña de administrador
export const validatePasswordChange = (data) => {
  const errors = [];

  try {
    validators.required(data.currentPassword, 'contraseña actual');
  } catch (error) {
    errors.push(error.message);
  }

  try {
    validators.required(data.newPassword, 'nueva contraseña');
    validators.stringLength(data.newPassword, 'nueva contraseña', 8, 100);
  } catch (error) {
    errors.push(error.message);
  }

  if (errors.length > 0) {
    const validationError = new Error('Errores de validación de cambio de contraseña');
    validationError.name = 'ValidationError';
    validationError.details = errors;
    throw validationError;
  }

  return true;
};

// Validación específica para archivos
export const validateFileUpload = (file) => {
  const errors = [];

  if (!file) {
    errors.push('No se proporcionó ningún archivo');
  } else {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push(`Tipo de archivo no permitido. Tipos válidos: ${allowedTypes.join(', ')}`);
    }

    // Validar tamaño de archivo (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('El archivo es demasiado grande. Tamaño máximo: 5MB');
    }
  }

  if (errors.length > 0) {
    const validationError = new Error('Errores de validación de archivo');
    validationError.name = 'ValidationError';
    validationError.details = errors;
    throw validationError;
  }

  return true;
};
