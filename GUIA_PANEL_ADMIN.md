# Guía de Implementación - Panel de Administración + Subida de Imágenes

## Resumen del Proyecto
Implementar un sistema básico de autenticación para administradores sin tokens ni sesiones, utilizando verificación directa de credenciales y encriptación de contraseñas con bcrypt. Además, agregar funcionalidad de subida de imágenes a Supabase Storage para productos.

## Estructura de Fases

### **FASE 1: Configuración Base de Autenticación**

#### 1.1 Dependencias y Configuración
- [x] Instalar bcrypt para encriptación de contraseñas
- [x] Instalar multer para manejo de archivos
- [x] Actualizar constantes con configuraciones de autenticación y archivos

#### 1.2 Utilidades de Autenticación y Storage
- [x] Crear utilidades para hash/verificación de contraseñas
- [x] Crear utilidades para Supabase Storage
- [x] Crear validadores específicos para datos de administrador y archivos
- [x] Agregar middleware de verificación de credenciales
- [x] Configurar middleware de multer para archivos

---

### **FASE 2: Modelo y Controlador de Administradores**

#### 2.1 Modelo de Administradores
- [x] Crear modelo de administradores en `src/models/administradores.js`
- [x] Funciones CRUD básicas (crear, buscar por usuario, actualizar contraseña)
- [x] Función para verificar credenciales

#### 2.2 Controlador de Administradores
- [x] Crear controlador en `src/controllers/administradores.js`
- [x] Endpoint de verificación de credenciales (POST /verify)
- [x] Endpoint para cambiar contraseña (PUT /change-password)

---

### **FASE 3: Sistema de Subida de Imágenes**

#### 3.1 Controlador de Uploads
- [x] Crear controlador en `src/controllers/uploads.js`
- [x] Endpoint para subir imagen (POST /upload-image)
- [x] Validación de tipos de archivo permitidos
- [x] Integración con Supabase Storage

#### 3.2 Rutas de Uploads
- [x] Crear rutas en `src/routes/uploads.js`
- [x] Configurar middleware de multer
- [x] Proteger rutas con middleware de administrador

---

### **FASE 4: Rutas y Middleware de Protección**

#### 4.1 Rutas de Autenticación
- [x] Crear rutas en `src/routes/administradores.js`
- [x] Configurar todas las rutas de autenticación

#### 4.2 Middleware de Protección
- [x] Middleware para verificar credenciales en rutas administrativas
- [x] Aplicar protección a rutas existentes de productos y categorías
- [x] Aplicar protección a rutas de subida de imágenes

---

### **FASE 5: Integración con el Servidor Principal**

#### 5.1 Rutas Protegidas
- [x] Integrar rutas de administradores
- [x] Integrar rutas de uploads
- [x] Proteger endpoints administrativos existentes:
  - POST, PUT, DELETE de productos
  - POST, PUT, DELETE de categorías
  - PUT, DELETE de órdenes

#### 5.2 Endpoint de Información
- [x] Actualizar endpoint `/api` con nueva información de administración y uploads

---

### **FASE 6: Script de Inicialización (Opcional)**

#### 6.1 Utilidad de Setup
- [ ] Script para crear administrador inicial
- [x] Verificación de usuario admin existente
- [ ] Actualización de contraseña de admin existente a formato correcto

---

## Detalles Técnicos

### Tecnologías a Usar:
- **bcrypt**: Para hash y verificación de contraseñas
- **multer**: Para manejo de archivos multipart/form-data
- **Supabase Storage**: Para almacenamiento de imágenes
- **Validaciones**: Reutilizar sistema existente de validators.js
- **Headers de autenticación**: Usuario y contraseña en headers personalizados

### Estructura de Archivos Nuevos:
```
src/
├── controllers/
│   ├── administradores.js        (NUEVO)
│   └── uploads.js                (NUEVO)
├── models/
│   └── administradores.js        (NUEVO)
├── routes/
│   ├── administradores.js        (NUEVO)
│   └── uploads.js                (NUEVO)
├── middleware/
│   ├── auth.js                   (NUEVO)
│   └── upload.js                 (NUEVO)
└── utils/
    ├── auth.js                   (NUEVO)
    └── storage.js                (NUEVO)
```

### Archivos a Modificar:
- `server.js` (agregar rutas de administradores y uploads)
- `src/utils/constants.js` (nuevas constantes y configuración de archivos)
- `src/utils/validators.js` (validaciones de admin y archivos)
- Rutas existentes (agregar middleware de protección)

### Endpoints Nuevos:
```
Autenticación:
POST   /api/auth/verify          - Verificar credenciales de administrador
PUT    /api/auth/change-password - Cambiar contraseña

Subida de Imágenes:
POST   /api/uploads/image        - Subir imagen al storage (requiere auth admin)
```

### Características de Seguridad:
- Contraseñas hasheadas con bcrypt (salt rounds: 12)
- Verificación de credenciales en tiempo real
- Headers personalizados para autenticación (x-admin-user, x-admin-password)
- Validación de fuerza de contraseña
- Validación de tipos de archivo (jpeg, jpg, png, webp, gif)
- Límite de tamaño de archivo (5MB)
- Rutas de subida protegidas con autenticación de admin
- Rate limiting en endpoints de autenticación

### Sin Implementar (Manteniendo Simplicidad):
- ❌ JWT tokens
- ❌ Refresh tokens  
- ❌ Sesiones del servidor
- ❌ Cookies de autenticación
- ❌ Roles y permisos complejos
- ❌ OAuth/2FA
- ❌ Reset de contraseña por email
- ❌ Registro abierto de administradores
- ❌ Redimensionamiento automático de imágenes
- ❌ Eliminación automática de imágenes anteriores
- ❌ Organización en carpetas del storage

## Notas Importantes

1. **Sin Estado de Sesión**: No hay cookies ni sesiones del servidor
2. **Un Solo Rol**: Solo "administrador", sin sistema de permisos complejos
3. **Protección Básica**: Middleware que verifica credenciales en cada petición administrativa
4. **Contraseña Actual**: Se mantendrá el admin existente, solo actualizaremos el hash si es necesario
5. **Headers Personalizados**: El frontend enviará `x-admin-user` y `x-admin-password` en peticiones administrativas
6. **Storage Simple**: Imágenes se guardan directamente en bucket `product-images` sin carpetas
7. **Archivos Permitidos**: jpeg, jpg, png, webp, gif (máximo 5MB)
8. **No Optimización**: Las imágenes se suben tal como las envía el usuario

## Flujo de Funcionamiento

### Autenticación:
1. **Frontend**: Guarda usuario/contraseña en localStorage tras verificación inicial
2. **Peticiones Admin**: Frontend envía credenciales en headers personalizados
3. **Backend**: Middleware verifica credenciales en tiempo real para cada operación administrativa
4. **Sin Estado**: No se mantiene información de sesión en el servidor

### Subida de Imágenes:
1. **Frontend**: Usuario selecciona/arrastra imagen
2. **Validación**: Frontend valida tipo y tamaño antes de enviar
3. **Envío**: FormData con imagen + headers de autenticación
4. **Backend**: Valida credenciales admin → valida archivo → sube a Supabase Storage
5. **Respuesta**: URL pública de la imagen para usar en productos

¿Te parece bien esta estructura? ¿Hay algo que quieras modificar o quitar antes de comenzar la implementación?