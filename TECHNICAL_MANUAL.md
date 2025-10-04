# Manual Técnico - Black Gym Backend

Última actualización: 12 de septiembre de 2025

## Visión general

Black Gym Backend es la API REST del ecommerce del gimnasio "Black Gym". Está implementado en Node.js con Express y utiliza Supabase como base de datos (Postgres) y proveedor de almacenamiento (Storage) para imágenes. Proporciona CRUD para productos, categorías y órdenes, autenticación para administradores (mediante headers personalizados), y funcionalidades de upload de imágenes.

El servidor está diseñado para ser ligero y sin sesiones de servidor (auth basada en verificación en cada request). Los endpoints públicos permiten listar y buscar productos, crear órdenes, y consultar categorías; las operaciones de escritura (crear/actualizar/eliminar) para recursos sensibles están protegidas mediante autenticación de administrador.

## Estructura del proyecto

- `server.js` - punto de entrada. Configura middlewares (CORS, logging, parsing), rutas y endpoints de salud / info, y arranque del servidor.
- `package.json` - dependencias y scripts (`start`, `dev`).
- `.env` - variables de entorno (URL y key de Supabase, puerto, CORS_ORIGIN, etc.).
- `src/config/` - configuración y helpers para Supabase y consultas (helpers de paginación, búsquedas y operaciones genéricas).
- `src/controllers/` - controladores que implementan la lógica de negocio por recurso: productos, categorías, órdenes, administradores y uploads.
- `src/routes/` - definiciones de rutas Express para cada módulo.
- `src/middleware/` - middlewares para autenticación de administradores, manejo de uploads (multer), manejo de errores y logging.
- `src/models/` - modelos (POJOs) para validar y transformar los datos que entran/salen de la DB: `ProductoModel`, `CategoriaModel`, `OrdenModel`, `DetalleOrdenModel`, `ProductoCategoriaModel` y `AdministradorModel`.
- `src/utils/` - utilidades: `auth` (bcrypt y extracción de headers), `constants` (códigos, tablas, reglas de validación), `storage` (subida a Supabase Storage), `validators` (validaciones y helpers de respuesta).

## Requisitos

- Node.js >= 18 recomendado (proyecto usa modules ES). En `package.json` no se especifica engine.
- npm o yarn para instalar dependencias.
- Cuenta y proyecto en Supabase con las tablas: `productos`, `categorias`, `ordenes`, `detalle_orden`, `producto_categoria`, `administradores`, y un bucket de Storage (por defecto `product-images`).

Dependencias principales:
- express
- @supabase/supabase-js
- dotenv
- bcrypt
- multer
- cors

## Instalación local (rápida)

1. Clonar repo y entrar a la carpeta:

```powershell
cd c:\Users\patza\Documents\Black_Gym_Backend
npm install
```

2. Copiar `.env.example` o crear `.env` con las variables necesarias (ver sección "Variables de entorno").
3. Ejecutar en modo desarrollo:

```powershell
npm run dev
```

4. Acceder a: `http://localhost:3000` (o el puerto configurado por `PORT`).

## Variables de entorno

Variables esperadas en `.env`:

- SUPABASE_URL - URL del proyecto Supabase.
- SUPABASE_ANON_KEY - API key pública/anon para Supabase (usado aquí para server-side en este proyecto).
- PORT - puerto donde corre el servidor (default 3000).
- NODE_ENV - environment.
- CORS_ORIGIN - orígenes permitidos (coma-separados).

Ejemplo (ya presente en `.env` del repositorio):

SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://blackgym.fit,https://admin.blackgym.fit,http://localhost:5173

Nota: por seguridad, NO comprometas keys reales en repositorios públicos. Usar secretos en el entorno de despliegue.

## Arquitectura y flujo de petición

- El servidor arranca `server.js`, carga dotenv y crea el cliente de Supabase (`src/config/supabase.js`).
- Middlewares globales: CORS (configurable), body parsers (`express.json`, `express.urlencoded`) y `requestLogger`.
- Rutas montadas en `/api/*` para recursos principales. Endpoints de salud `/health` y `/database-info` en la raíz.
- Para operaciones administrativas se usa un middleware `requireAdminAuth` que extrae `x-admin-user` y `x-admin-password` de los headers y adjunta `req.adminCredentials` para verificaciones posteriores por los controladores o por el `AdministradorModel`.
- El acceso a Supabase se realiza a través del cliente `supabase` desde `src/config/supabase.js` y helpers en `src/config/database.js` que encapsulan operaciones comunes (paginación, búsquedas, transacciones básicas).
- Uploads de imágenes usan `multer` (almacenamiento en memoria) y `supabase.storage` para subir archivos al bucket configurado.

## Endpoints (resumen y detalles)

Nota: todas las rutas van prefijadas con `/api` según `server.js`.

Rutas principales:

- Productos (`/api/productos`)
  - GET /api/productos
    - Query params: `page`, `limit`, `categoria`, `include_categories`.
    - Público. Devuelve paginación y lista de productos. Si `include_categories=true` incluye categorías por producto.
  - GET /api/productos/search?q=...&page=&limit=
    - Búsqueda con paginación. Requiere mínimo 2 caracteres.
  - GET /api/productos/search/global?q=...&max=
    - Búsqueda global sin paginación (máximo por defecto 50, tope 250).
  - GET /api/productos/search/advanced?q=...&page=&limit=
    - Búsqueda avanzada que incluye búsqueda por categorías.
  - POST /api/productos (PROTEGIDO)
    - Crear producto. Requiere headers `x-admin-user`, `x-admin-password`.
    - Body: { nombre, descripcion?, precio, stock, imagen_url?, categorias?: [id,...] }
  - PUT /api/productos/:id (PROTEGIDO)
    - Actualiza producto (campos parciales permitidos). También puede actualizar relaciones de categorías.
  - PATCH /api/productos/:id/stock
    - Actualiza stock: Body { stock, operation } donde operation ∈ {set, add, subtract}.
  - DELETE /api/productos/:id (PROTEGIDO)

- Categorías (`/api/categorias`)
  - GET /api/categorias
    - Query params: `page`, `limit`, `include_products`.
  - GET /api/categorias/:id
    - `include_products` opcional.
  - GET /api/categorias/:id/productos
    - Productos paginados de la categoría.
  - POST /api/categorias (PROTEGIDO)
  - PUT /api/categorias/:id (PROTEGIDO)
  - DELETE /api/categorias/:id
    - No permite eliminar si hay productos asociados (409 Conflict).
  - POST /api/categorias/productos/:id/assign (PROTEGIDO)
    - Asigna múltiples categorías a un producto. Body: { categorias: [ids] }
  - DELETE /api/categorias/:id/productos/:productoId (PROTEGIDO)

- Órdenes (`/api/ordenes`)
  - GET /api/ordenes
    - Paginado. `include_details=true` para detalles.
  - GET /api/ordenes/:id
    - Por defecto incluye detalles.
  - POST /api/ordenes
    - Crear orden con detalles. Body: { cliente, telefono, direccion, total, productos: [{id, cantidad}] }
    - Validaciones: stock suficiente, total calculado coincide.
  - PUT /api/ordenes/:id (PROTEGIDO) - actualizar campos básicos (cliente, telefono, direccion)
  - DELETE /api/ordenes/:id (PROTEGIDO) - cancelar orden y restaurar stock
  - GET /api/ordenes/:id/detalle - obtener detalle de la orden
  - GET /api/ordenes/stats (PROTEGIDO) - estadísticas (intenta RPC `get_ordenes_stats`, si no existe calcula localmente)

- Administradores (`/api/administradores`)
  - POST /api/administradores/verify
    - Verifica credenciales. Body: { usuario, password }.
    - Respuesta: información del admin sin password.
  - PUT /api/administradores/change-password (PROTEGIDO)
    - Body: { currentPassword, newPassword }.
    - Verifica fuerza de password y que nueva ≠ actual.
  - GET /api/administradores/profile (PROTEGIDO)
  - GET /api/administradores/admins (PROTEGIDO)
  - GET /api/administradores/status - informa si existe al menos un admin.

- Uploads (`/api/uploads`)
  - POST /api/uploads/image (PROTEGIDO)
    - multipart/form-data field `image`. Usa `multer` en memoria, valida tipo y tamaño, sube a Supabase Storage.
  - POST /api/uploads/validate - valida archivo sin subirlo.
  - GET /api/uploads/info - devuelve límites y tipos permitidos.
  - GET /api/uploads/stats (PROTEGIDO)

## Modelos de datos (esquema esperado)

NOTA: El repo opera con Supabase/Postgres. Aquí están los campos más importantes que el backend asume:

- productos
  - id (int PK)
  - nombre (text)
  - descripcion (text)
  - precio (numeric)
  - stock (int)
  - imagen_url (text)

- categorias
  - id
  - nombre
  - descripcion

- producto_categoria (relación many-to-many)
  - id
  - producto_id
  - categoria_id

- ordenes
  - id
  - cliente
  - telefono
  - direccion
  - total
  - fecha (timestamp)

- detalle_orden
  - id
  - orden_id
  - producto_id
  - cantidad
  - precio_unitario

- administradores
  - id
  - usuario
  - password_hash
  - creado_en

Las clases/POJOs en `src/models` implementan validaciones y transformaciones: `toDatabase()` y `fromDatabase()`.

## Validaciones y reglas de negocio

- Búsquedas: mínimo 2 caracteres.
- Paginación: `page` >= 1, `limit` entre 1 y 250 (default 10).
- Productos: `nombre` requerido (2-100 chars), `precio` > 0, `stock` >= 0.
- Categorías: `nombre` requerido (2-100 chars).
- Órdenes: `cliente`, `telefono`, `direccion` requeridos; `total` > 0. Al crear orden se verifica stock y se calcula total desde la DB; si no coincide, se rechaza.
- Uploads: tipos permitidos (jpeg, jpg, png, webp, gif), máximo 5MB; multer limita a un archivo.
- Autenticación admin: headers `x-admin-user`, `x-admin-password`. Se verifican en cada request con bcrypt contra `administradores.password_hash`.

## Seguridad

- Passwords: almacenadas como `password_hash` usando bcrypt. Salt rounds: 12.
- No se manejan sesiones ni JWT: autenticación basada en verificación en cada request (sessionless). Esto simplifica la arquitectura pero implica enviar credenciales en cada request administrativo; se recomienda usar HTTPS obligatorio en producción.
- Recomendación: migrar a JWT o sesiones con refresh tokens para escalabilidad; usar roles si se añaden más tipos de usuarios.
- Validaciones de inputs robustas en `src/utils/validators.js`.
- Manejo de errores consistente y centralizado en `src/middleware/errorHandler.js`.

## Manejo de errores y logging

- Los errores de Supabase se traducen a respuestas HTTP amigables (codes PGRST116 → 404, 23505 → 409, etc.).
- `requestLogger` imprime método, ruta e IP. `logAdminAction` registra acciones administrativas con timestamp y usuario.
- En `server.js` hay rutas `/health` y `/database-info` para monitoreo y verificación de tablas.

## Consideraciones de rendimiento

- Helpers en `src/config/database.js` usan rangos y consultas con `select('*', { count: 'exact' })` para paginación; algunos select tienen optimizaciones para elegir campos necesarios.
- En varias funciones se usa Map para optimizar búsquedas en memoria (por ejemplo, checkStock y creación de órdenes).
- Recomendaciones: cachear resultados de consultas públicas (productos, categorías) con Redis o similar. Añadir índices en columnas buscadas (nombre, descripcion) y en joins.

## Despliegue

1. Configurar variables de entorno en el servicio de hosting (Heroku, Vercel serverless, Railway, DigitalOcean, etc.).
2. Asegurar HTTPS y que las keys de Supabase sean secretas.
3. Ejecutar `npm ci --production` y `npm start` o usar PM2 para procesos persistentes.
4. Hacer backups periódicos de la base de datos y revisar reglas de seguridad del bucket de Storage.

## Tests y QA

Actualmente no hay tests automatizados incluidos. Recomendación:
- Añadir tests unitarios para utilidades y modelos (Jest).
- Añadir tests de integración para endpoints críticos (crear orden, verificar stock, uploads).

## Mejoras propuestas (priorizadas)

1. Migrar autenticación a JWT o sessions y reducir envío de credenciales en cada request.
2. Añadir paginación cursor-based para grandes tablas.
3. Implementar cache (Redis) para endpoints públicos y estadísticas.
4. Implementar rate-limiting por IP (express-rate-limit) y protección contra bruteforce en endpoint de admin.
5. Añadir tests automatizados (unitarios + integración) y CI.
6. Mover validaciones a un esquema compartido (ej: Zod) para tipado y mejor mantenimiento.
7. Mejorar manejo de errores y métricas (Sentry, Prometheus).
8. Usar keys de servicio (SERVICE_ROLE) en operaciones de administración crítica si se requiere mayor privilegio, y separar roles.

## Tips de desarrollo y debugging

- Para ver errores de Supabase en detalle, arrancar con `NODE_ENV=development`.
- Revisar logs de `server.js` al iniciar: el middleware `verifyTables` indicará si faltan tablas.
- Para subir imágenes desde Postman: usar `form-data` y campo `image`.
- Para probar autenticación admin, agregar headers `x-admin-user` y `x-admin-password` con credenciales válidas (desde la tabla `administradores`).

## Verificación rápida después de clonar

1. Instala dependencias: `npm install`.
2. Configura `.env` con `SUPABASE_URL` y `SUPABASE_ANON_KEY` y `PORT`.
3. Ejecuta `npm run dev`.
4. Comprueba `GET /health` y `GET /database-info`.

## Archivos relevantes (mapa rápido)

- `server.js` - arranque y rutas.
- `src/config/supabase.js` - cliente supabase y helpers de conexión.
- `src/config/database.js` - helpers DB (paginación, búsquedas, CRUD genérico).
- `src/controllers/` - `productos.js`, `categorias.js`, `ordenes.js`, `administradores.js`, `uploads.js`.
- `src/routes/` - rutas por recurso.
- `src/middleware/` - `auth.js`, `upload.js`, `errorHandler.js`.
- `src/models/` - modelos y validaciones.
- `src/utils/` - `auth.js`, `constants.js`, `storage.js`, `validators.js`.
