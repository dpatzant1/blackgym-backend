import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection, verifyTables, getDatabaseInfo } from './src/config/supabase.js';
import { errorHandler, notFound, requestLogger } from './src/middleware/errorHandler.js';
import { CORS_CONFIG } from './src/utils/constants.js';

// Importar rutas
import productosRoutes from './src/routes/productos.js';
import categoriasRoutes from './src/routes/categorias.js';
import ordenesRoutes from './src/routes/ordenes.js';
import administradoresRoutes from './src/routes/administradores.js';
import uploadsRoutes from './src/routes/uploads.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : CORS_CONFIG.ALLOWED_ORIGINS,
  credentials: true,
  methods: CORS_CONFIG.ALLOWED_METHODS,
  allowedHeaders: CORS_CONFIG.ALLOWED_HEADERS
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Ruta de información de la base de datos
app.get('/database-info', async (req, res) => {
  try {
    const dbInfo = await getDatabaseInfo();
    res.json({
      success: true,
      data: dbInfo,
      message: 'Información de base de datos obtenida'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener información de base de datos',
      message: error.message
    });
  }
});

// Ruta de salud del servidor mejorada
app.get('/health', async (req, res) => {
  try {
    const isDbConnected = await testConnection();
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: isDbConnected,
        url: process.env.SUPABASE_URL ? 'configured' : 'not configured'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };

    const statusCode = isDbConnected ? 200 : 503;
    
    res.status(statusCode).json({
      success: isDbConnected,
      data: health,
      message: isDbConnected ? 'Servidor funcionando correctamente' : 'Problemas de conectividad con la base de datos'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al verificar salud del servidor',
      message: error.message
    });
  }
});

// Ruta principal mejorada
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenido al API de Black Gym - Tienda Online con Panel de Administración',
    version: '1.0.0',
    current_phase: 'Panel de Administración con Autenticación y Upload de Imágenes',
    documentation: {
      health: 'GET /health - Estado del servidor',
      database: 'GET /database-info - Información de base de datos',
      api: 'GET /api - Rutas de la API'
    },
    authentication: {
      method: 'Headers personalizados (sin tokens/sesiones)',
      headers: ['x-admin-user', 'x-admin-password'],
      note: 'Credenciales verificadas en tiempo real con bcrypt'
    },
    features: [
      '✅ Sistema completo de productos, categorías y órdenes',
      '✅ Panel de administración con autenticación',
      '✅ Upload de imágenes a Supabase Storage',
      '✅ Middleware de protección para rutas administrativas',
      '✅ Validación de archivos (5MB máx, jpg/png/webp)',
      '✅ Logging de acciones administrativas'
    ]
  });
});

// Rutas de la API
app.use('/api/productos', productosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/administradores', administradoresRoutes);
app.use('/api/uploads', uploadsRoutes);

// Información general de la API
app.use('/api', (req, res, next) => {
  res.json({
    success: true,
    message: 'API Routes - Black Gym Backend con Panel de Administración',
    phase: 'Panel de Administración Completo',
    authentication: {
      method: 'Headers personalizados',
      required_headers: ['x-admin-user', 'x-admin-password'],
      protected_routes: 'POST/PUT/DELETE en productos, categorías, órdenes + todas las rutas de administradores y uploads'
    },
    available_routes: {
      productos: {
        base: '/api/productos',
        endpoints: [
          'GET    /api/productos                    - Listar productos (público)',
          'GET    /api/productos/search            - Búsqueda de productos (público)', 
          'GET    /api/productos/:id               - Obtener producto por ID (público)',
          'POST   /api/productos                   - Crear producto (🔒 PROTEGIDO)',
          'PUT    /api/productos/:id               - Actualizar producto (🔒 PROTEGIDO)',
          'PATCH  /api/productos/:id/stock         - Actualizar stock (🔒 PROTEGIDO)',
          'DELETE /api/productos/:id               - Eliminar producto (🔒 PROTEGIDO)',
          'POST   /api/productos/check-stock       - Verificar stock múltiple (público)'
        ]
      },
      categorias: {
        base: '/api/categorias',
        endpoints: [
          'GET    /api/categorias                           - Listar categorías (público)',
          'GET    /api/categorias/:id                       - Obtener categoría por ID (público)',
          'POST   /api/categorias                           - Crear categoría (🔒 PROTEGIDO)',
          'PUT    /api/categorias/:id                       - Actualizar categoría (🔒 PROTEGIDO)',
          'DELETE /api/categorias/:id                       - Eliminar categoría (🔒 PROTEGIDO)',
          'GET    /api/categorias/:id/productos             - Productos por categoría (público)',
          'POST   /api/categorias/productos/:id/assign      - Asignar categorías a producto (🔒 PROTEGIDO)',
          'DELETE /api/categorias/:id/productos/:productoId - Remover producto de categoría (🔒 PROTEGIDO)'
        ]
      },
      ordenes: {
        base: '/api/ordenes',
        endpoints: [
          'GET    /api/ordenes                  - Listar órdenes (público)',
          'GET    /api/ordenes/stats           - Estadísticas de órdenes (🔒 PROTEGIDO)',
          'GET    /api/ordenes/:id             - Obtener orden por ID (público)',
          'POST   /api/ordenes                 - Crear orden con productos (público)',
          'PUT    /api/ordenes/:id             - Actualizar datos de orden (🔒 PROTEGIDO)',
          'DELETE /api/ordenes/:id             - Cancelar orden (🔒 PROTEGIDO)',
          'GET    /api/ordenes/:id/detalle     - Detalle completo de orden (público)'
        ]
      },
      administradores: {
        base: '/api/administradores',
        endpoints: [
          'POST   /api/administradores/verify          - Verificar credenciales (público)',
          'PUT    /api/administradores/change-password - Cambiar contraseña (🔒 PROTEGIDO)',
          'GET    /api/administradores/profile         - Obtener perfil (🔒 PROTEGIDO)'
        ]
      },
      uploads: {
        base: '/api/uploads',
        endpoints: [
          'POST   /api/uploads/image                   - Subir imagen a Supabase Storage (🔒 PROTEGIDO)',
        ],
        limits: {
          max_size: '5MB',
          allowed_types: ['image/jpeg', 'image/png', 'image/webp'],
          storage: 'Supabase Storage (public bucket)',
          validation: 'Tipo de archivo, tamaño, y dimensiones'
        }
      }
    },
    features_implemented: [
      '✅ Modelos de datos con validaciones',
      '✅ Helpers de base de datos con paginación', 
      '✅ Manejo avanzado de errores de Supabase',
      '✅ Constantes y configuraciones',
      '✅ Validaciones mejoradas',
      '✅ Logging y testing de conexión',
      '✅ CRUD completo para productos',
      '✅ Búsqueda avanzada de productos',
      '✅ Verificación de stock',
      '✅ Filtros por categoría',
      '✅ Paginación automática',
      '✅ CRUD completo para categorías',
      '✅ Manejo de relaciones producto-categoría',
      '✅ Validación de integridad referencial',
      '✅ Asignación múltiple de categorías',
      '✅ CRUD completo para órdenes',
      '✅ Transacciones para crear órdenes',
      '✅ Validación de stock automática',
      '✅ Actualización de inventario',
      '✅ Cancelación con restauración de stock',
      '✅ Estadísticas básicas de órdenes',
      '✅ Sistema de autenticación para administradores',
      '✅ Middleware de protección de rutas',
      '✅ Hash de contraseñas con bcrypt',
      '✅ Upload de imágenes a Supabase Storage',
      '✅ Validación avanzada de archivos',
      '✅ Logging de acciones administrativas'
    ]
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(notFound);
app.use(errorHandler);

// Función para iniciar el servidor
const startServer = async () => {
  try {
    console.log('🚀 Iniciando servidor Black Gym Backend...');
    console.log('📋 Fase 6: Sistema de Órdenes');
    console.log('');

    // Verificar conexión con Supabase
    console.log('🔄 Verificando conexión con Supabase...');
    const connectionOk = await testConnection();
    
    if (!connectionOk) {
      console.error('❌ No se pudo conectar con Supabase');
      console.error('   Verifica tus variables de entorno en .env');
      process.exit(1);
    }

    // Verificar estructura de base de datos
    console.log('');
    const tablesInfo = await verifyTables();
    
    if (!tablesInfo.allTablesValid) {
      console.warn('⚠️  Algunas tablas no están disponibles');
      console.warn('   El servidor continuará, pero algunas funcionalidades pueden fallar');
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('');
      console.log('🎉 ¡Servidor iniciado exitosamente!');
      console.log(`📍 Servidor corriendo en: http://localhost:${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ CORS configurado para: ${process.env.CORS_ORIGIN || 'múltiples orígenes'}`);
      console.log('');
      console.log('📚 Endpoints disponibles:');
      console.log('   - GET  /                         (Información general)');
      console.log('   - GET  /health                   (Estado del servidor + DB)');
      console.log('   - GET  /database-info            (Información detallada de DB)');
      console.log('   - GET  /api                      (Información de la API)');
      console.log('');
      console.log('📦 Productos API:');
      console.log('   - GET    /api/productos          (Listar productos)');
      console.log('   - GET    /api/productos/search   (Búsqueda)');
      console.log('   - GET    /api/productos/:id      (Obtener por ID)');
      console.log('   - POST   /api/productos          (Crear producto)');
      console.log('   - PUT    /api/productos/:id      (Actualizar)');
      console.log('   - PATCH  /api/productos/:id/stock (Actualizar stock)');
      console.log('   - DELETE /api/productos/:id      (Eliminar)');
      console.log('   - POST   /api/productos/check-stock (Verificar stock)');
      console.log('');
      console.log('🏷️  Categorías API:');
      console.log('   - GET    /api/categorias         (Listar categorías)');
      console.log('   - GET    /api/categorias/:id     (Obtener por ID)');
      console.log('   - POST   /api/categorias         (Crear categoría)');
      console.log('   - PUT    /api/categorias/:id     (Actualizar)');
      console.log('   - DELETE /api/categorias/:id     (Eliminar)');
      console.log('   - GET    /api/categorias/:id/productos (Productos por categoría)');
      console.log('   - POST   /api/categorias/productos/:id/assign (Asignar categorías)');
      console.log('   - DELETE /api/categorias/:id/productos/:pid (Remover relación)');
      console.log('');
      console.log('🛒 Órdenes API:');
      console.log('   - GET    /api/ordenes            (Listar órdenes)');
      console.log('   - GET    /api/ordenes/stats      (Estadísticas) 🔒');
      console.log('   - GET    /api/ordenes/:id        (Obtener por ID)');
      console.log('   - POST   /api/ordenes            (Crear orden)');
      console.log('   - PUT    /api/ordenes/:id        (Actualizar orden) 🔒');
      console.log('   - DELETE /api/ordenes/:id        (Cancelar orden) 🔒');
      console.log('   - GET    /api/ordenes/:id/detalle (Detalle de orden)');
      console.log('');
      console.log('👨‍💼 Administradores API:');
      console.log('   - POST   /api/administradores/verify          (Verificar credenciales)');
      console.log('   - PUT    /api/administradores/change-password (Cambiar contraseña) 🔒');
      console.log('   - GET    /api/administradores/profile         (Obtener perfil) 🔒');
      console.log('');
      console.log('📸 Uploads API:');
      console.log('   - POST   /api/uploads/image      (Subir imagen - máx 5MB) 🔒');
      console.log('');
      console.log('� = Requiere autenticación de administrador');
      console.log('📋 Headers requeridos: x-admin-user, x-admin-password');
      console.log('');
      console.log('✅ Panel de Administración completado');
      console.log('🚀 Sistema completo de autenticación y uploads funcionando');
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
};

// Manejar cierre graceful del servidor
process.on('SIGTERM', () => {
  console.log('🔄 Cerrando servidor gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Cerrando servidor gracefully...');
  process.exit(0);
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rechazada sin manejar:', reason);
  process.exit(1);
});

// Iniciar el servidor
startServer();
