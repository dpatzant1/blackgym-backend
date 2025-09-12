// Middleware para manejo de errores
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de Supabase específicos
  if (err.code) {
    return handleSupabaseError(err, res);
  }

  // Error de base de datos genérico
  if (err.message && err.details) {
    return res.status(400).json({
      success: false,
      error: 'Error de base de datos',
      message: err.message,
      details: err.details
    });
  }

  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Error de validación',
      message: err.message
    });
  }

  // Error genérico del servidor
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
};

// Función para manejar errores específicos de Supabase
const handleSupabaseError = (err, res) => {
  const errorCode = err.code;
  
  switch (errorCode) {
    case 'PGRST116':
      return res.status(404).json({
        success: false,
        error: 'Recurso no encontrado',
        message: 'El registro solicitado no existe'
      });
      
    case '23505':
      return res.status(409).json({
        success: false,
        error: 'Conflicto de datos',
        message: 'Ya existe un registro con esos datos únicos'
      });
      
    case '23503':
      return res.status(400).json({
        success: false,
        error: 'Violación de clave foránea',
        message: 'El registro referenciado no existe'
      });
      
    case '23502':
      return res.status(400).json({
        success: false,
        error: 'Campo requerido faltante',
        message: 'Faltan campos obligatorios'
      });
      
    case '42501':
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado',
        message: 'No tienes permisos para realizar esta operación'
      });
      
    default:
      return res.status(500).json({
        success: false,
        error: 'Error de base de datos',
        message: err.message || 'Error desconocido en la base de datos',
        code: errorCode
      });
  }
};

// Middleware para rutas no encontradas
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    message: `La ruta ${req.method} ${req.path} no existe`
  });
};

// Middleware para logging de requests
export const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
};
