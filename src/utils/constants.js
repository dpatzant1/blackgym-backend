// Constantes para la aplicación

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 250,
  MIN_LIMIT: 1
};

// Estados de órdenes
export const ORDER_STATUS = {
  PENDING: 'pendiente',
  PAID: 'pagado',
  SHIPPED: 'enviado',
  COMPLETED: 'completado',
  CANCELLED: 'cancelado'
};

// Tipos de errores personalizados
export const ERROR_TYPES = {
  VALIDATION: 'ValidationError',
  NOT_FOUND: 'NotFoundError',
  UNAUTHORIZED: 'UnauthorizedError',
  FORBIDDEN: 'ForbiddenError',
  CONFLICT: 'ConflictError',
  DATABASE: 'DatabaseError'
};

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: (field) => `El campo ${field} es requerido`,
  INVALID_FORMAT: (field) => `El formato del campo ${field} es inválido`,
  NOT_FOUND: (resource) => `${resource} no encontrado`,
  ALREADY_EXISTS: (resource) => `${resource} ya existe`,
  INSUFFICIENT_STOCK: 'Stock insuficiente para el producto',
  INVALID_QUANTITY: 'La cantidad debe ser un número positivo',
  INVALID_PRICE: 'El precio debe ser un número positivo',
  DATABASE_CONNECTION: 'Error de conexión con la base de datos',
  INTERNAL_SERVER: 'Error interno del servidor',
  // Errores de autenticación
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  UNAUTHORIZED_ACCESS: 'Acceso no autorizado',
  MISSING_AUTH_HEADERS: 'Headers de autenticación requeridos',
  // Errores de archivos
  INVALID_FILE_TYPE: 'Tipo de archivo no permitido',
  FILE_TOO_LARGE: 'El archivo es demasiado grande',
  UPLOAD_ERROR: 'Error al subir el archivo'
};

// Códigos de respuesta HTTP
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501
};

// Configuración de búsqueda
export const SEARCH_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_LENGTH: 100,
  DEFAULT_SEARCH_COLUMNS: {
    productos: ['nombre', 'descripcion'],
    categorias: ['nombre', 'descripcion'],
    ordenes: ['cliente', 'telefono']
  }
};

// Validaciones
export const VALIDATION_RULES = {
  nombre: {
    minLength: 2,
    maxLength: 100
  },
  descripcion: {
    maxLength: 500
  },
  precio: {
    min: 0.01,
    max: 999999.99
  },
  stock: {
    min: 0,
    max: 999999
  },
  telefono: {
    minLength: 10,
    maxLength: 15
  },
  direccion: {
    minLength: 10,
    maxLength: 200
  }
};

// Configuración de archivos (para futuras implementaciones)
export const FILE_CONFIG = {
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  STORAGE_BUCKET: 'product-images',
  MIME_TYPE_EXTENSIONS: {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg', 
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif'
  }
};

// Configuración de caché (para futuras implementaciones)
export const CACHE_CONFIG = {
  DEFAULT_TTL: 300, // 5 minutos
  PRODUCTS_TTL: 600, // 10 minutos
  CATEGORIES_TTL: 1800, // 30 minutos
  STATS_TTL: 900 // 15 minutos
};

// Límites de rate limiting (para futuras implementaciones)
export const RATE_LIMITS = {
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // máximo 100 requests por ventana por IP
  },
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50 // máximo 50 requests por ventana por IP
  },
  ORDERS: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5 // máximo 5 órdenes por hora por IP
  }
};

// Configuraciones de logging
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

// Tablas de la base de datos
export const TABLES = {
  PRODUCTOS: 'productos',
  CATEGORIAS: 'categorias',
  ORDENES: 'ordenes',
  DETALLE_ORDEN: 'detalle_orden',
  PRODUCTO_CATEGORIA: 'producto_categoria',
  ADMINISTRADORES: 'administradores',
  BITACORA: 'bitacora',
  ROLES: 'roles'
};

// Configuración de autenticación
export const AUTH_CONFIG = {
  BCRYPT_SALT_ROUNDS: 12,
  ADMIN_HEADERS: {
    USER: 'x-admin-user',
    PASSWORD: 'x-admin-password'
  },
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

// Acciones de bitácora para auditoría
export const ACCIONES_BITACORA = {
  // Autenticación
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CAMBIAR_PASSWORD: 'CAMBIAR_PASSWORD',
  
  // Productos
  CREAR_PRODUCTO: 'CREAR_PRODUCTO',
  EDITAR_PRODUCTO: 'EDITAR_PRODUCTO',
  ELIMINAR_PRODUCTO: 'ELIMINAR_PRODUCTO',
  ACTUALIZAR_STOCK: 'ACTUALIZAR_STOCK',
  
  // Categorías
  CREAR_CATEGORIA: 'CREAR_CATEGORIA',
  EDITAR_CATEGORIA: 'EDITAR_CATEGORIA',
  ELIMINAR_CATEGORIA: 'ELIMINAR_CATEGORIA',
  ASIGNAR_CATEGORIAS: 'ASIGNAR_CATEGORIAS',
  REMOVER_CATEGORIA: 'REMOVER_CATEGORIA',
  
  // Órdenes
  CREAR_ORDEN: 'CREAR_ORDEN',
  EDITAR_ORDEN: 'EDITAR_ORDEN',
  CANCELAR_ORDEN: 'CANCELAR_ORDEN',
  CAMBIAR_ESTADO_ORDEN: 'CAMBIAR_ESTADO_ORDEN',
  
  // Administradores
  CREAR_ADMIN: 'CREAR_ADMIN',
  ASIGNAR_ROL: 'ASIGNAR_ROL',
  
  // Uploads
  SUBIR_IMAGEN: 'SUBIR_IMAGEN',
  ELIMINAR_IMAGEN: 'ELIMINAR_IMAGEN',
  
  // Administradores
  CREAR_ADMIN: 'CREAR_ADMIN',
  EDITAR_ADMIN: 'EDITAR_ADMIN',
  ELIMINAR_ADMIN: 'ELIMINAR_ADMIN'
};

// Roles del sistema
export const ROLES_SISTEMA = {
  ADMINISTRADOR: 'administrador',
  GERENTE: 'gerente',
  ASESOR_VENTAS: 'asesor de ventas'
};

// Permisos del sistema
export const PERMISOS = {
  // Productos
  PRODUCTOS_LEER: 'productos.leer',
  PRODUCTOS_CREAR: 'productos.crear',
  PRODUCTOS_EDITAR: 'productos.editar',
  PRODUCTOS_ELIMINAR: 'productos.eliminar',
  
  // Categorías
  CATEGORIAS_LEER: 'categorias.leer',
  CATEGORIAS_CREAR: 'categorias.crear',
  CATEGORIAS_EDITAR: 'categorias.editar',
  CATEGORIAS_ELIMINAR: 'categorias.eliminar',
  
  // Órdenes
  ORDENES_LEER: 'ordenes.leer',
  ORDENES_CREAR: 'ordenes.crear',
  ORDENES_EDITAR: 'ordenes.editar',
  ORDENES_CANCELAR: 'ordenes.cancelar',
  ORDENES_CAMBIAR_ESTADO: 'ordenes.cambiar_estado',
  
  // Bitácora
  BITACORA_LEER: 'bitacora.leer',
  BITACORA_EXPORTAR: 'bitacora.exportar',
  
  // Administradores
  ADMINS_LEER: 'admins.leer',
  ADMINS_GESTIONAR: 'admins.gestionar',
  
  // Roles
  ROLES_LEER: 'roles.leer',
  ROLES_ASIGNAR: 'roles.asignar',
  
  // Uploads
  UPLOADS_SUBIR: 'uploads.subir',
  UPLOADS_ELIMINAR: 'uploads.eliminar'
};

// Permisos por rol
export const PERMISOS_POR_ROL = {
  [ROLES_SISTEMA.ADMINISTRADOR]: ['*'], // Wildcard = todos los permisos
  
  [ROLES_SISTEMA.GERENTE]: [
    PERMISOS.PRODUCTOS_LEER,
    PERMISOS.PRODUCTOS_CREAR,
    PERMISOS.PRODUCTOS_EDITAR,
    PERMISOS.PRODUCTOS_ELIMINAR,
    PERMISOS.CATEGORIAS_LEER,
    PERMISOS.CATEGORIAS_CREAR,
    PERMISOS.CATEGORIAS_EDITAR,
    PERMISOS.CATEGORIAS_ELIMINAR,
    PERMISOS.ORDENES_LEER,
    PERMISOS.ORDENES_EDITAR,
    PERMISOS.ORDENES_CAMBIAR_ESTADO,
    PERMISOS.BITACORA_LEER,
    PERMISOS.UPLOADS_SUBIR
  ],
  
  [ROLES_SISTEMA.ASESOR_VENTAS]: [
    PERMISOS.PRODUCTOS_LEER,
    PERMISOS.CATEGORIAS_LEER,
    PERMISOS.ORDENES_LEER,
    PERMISOS.ORDENES_CREAR
  ]
};

// Headers CORS permitidos
export const CORS_CONFIG = {
  ALLOWED_ORIGINS: [
    'http://localhost:4321', // Astro dev
    'http://localhost:3000', // React dev
    'http://localhost:3001', // React dev (puerto alternativo)
    'http://localhost:5173', // Vite dev
    'https://blackgym.fit', // Producción web
    'https://admin.blackgym.fit', // Panel admin
    'https://api.blackgym.fit', // API
    // Orígenes para apps móviles
    'capacitor://localhost', // Capacitor iOS
    'ionic://localhost', // Ionic
    'http://localhost', // Apps móviles Android en desarrollo
    null // Permitir peticiones sin origen (apps móviles nativas)
  ],
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  ALLOWED_HEADERS: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'x-admin-user', 
    'x-admin-password',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ]
};

// Configuración del Dashboard de Ventas
export const DASHBOARD = {
  // Nombres de meses en español (completos)
  MESES: [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ],
  
  // Nombres de meses abreviados (para gráficas)
  MESES_ABREVIADOS: [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
  ],
  
  // Estados de órdenes que cuentan como ventas válidas
  // (excluye 'pendiente' y 'cancelado')
  ESTADOS_VALIDOS_PARA_VENTAS: ['pagado', 'enviado', 'completado'],
  
  // Límites por defecto para consultas
  LIMITE_TOP_PRODUCTOS: 10,
  LIMITE_TOP_CATEGORIAS: 10,
  MAX_TOP_PRODUCTOS: 50,
  
  // Configuración de caché para dashboard (en milisegundos)
  CACHE_TTL: {
    GENERAL: 300000,        // 5 minutos
    VENTAS_PERIODO: 300000, // 5 minutos
    TOP_PRODUCTOS: 600000,  // 10 minutos
    CATEGORIAS: 600000,     // 10 minutos
    COMPARATIVA: 900000     // 15 minutos
  }
};
