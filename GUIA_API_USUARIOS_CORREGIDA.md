# 📋 API de Usuarios - Estructura Correcta

## ⚠️ IMPORTANTE: Estructura de Base de Datos

Esta documentación refleja la estructura **REAL** de la base de datos definida en `Base de datos.txt`.

### Tabla `usuarios` - Campos disponibles:
```sql
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  objetivo TEXT,
  peso NUMERIC(5,2),
  altura NUMERIC(5,2),
  fecha_registro TIMESTAMP DEFAULT NOW(),
  activo BOOLEAN DEFAULT TRUE
);
```

**NOTA:** NO existe el campo `fecha_ultima_actualizacion` en la base de datos real.

---

## 🔐 Autenticación

Todos los endpoints (excepto registro y login) requieren:

```
Authorization: Bearer <token_jwt>
```

---

## 📍 Endpoints Disponibles

### 1. **Registro de Usuario**
```
POST /api/usuarios/registro
```

#### Body:
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "Password123!",
  "objetivo": "ganar masa muscular",  // opcional
  "peso": 75.5,                       // opcional
  "altura": 175                       // opcional
}
```

#### Respuesta (201):
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": 1,
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "objetivo": "ganar masa muscular",
      "peso": 75.5,
      "altura": 175,
      "fecha_registro": "2025-10-15T10:30:00.000Z",
      "activo": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Usuario registrado exitosamente"
}
```

---

### 2. **Login**
```
POST /api/usuarios/login
```

#### Body:
```json
{
  "email": "juan@example.com",
  "password": "Password123!"
}
```

#### Respuesta (200):
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": 1,
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "objetivo": "ganar masa muscular",
      "peso": 75.5,
      "altura": 175,
      "fecha_registro": "2025-10-15T10:30:00.000Z",
      "activo": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login exitoso"
}
```

---

### 3. **Obtener Perfil** 🔒
```
GET /api/usuarios/perfil
```

#### Headers:
```
Authorization: Bearer <token>
```

#### Respuesta (200):
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": 1,
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "objetivo": "ganar masa muscular",
      "peso": 75.5,
      "altura": 175,
      "fecha_registro": "2025-10-15T10:30:00.000Z",
      "activo": true
    },
    "estadisticas": {
      "totalRutinas": 3,
      "totalEntrenamientos": 15,
      "ultimoProgreso": {
        "peso": 74.2,
        "fecha_medicion": "2025-10-08T00:00:00.000Z"
      }
    }
  },
  "message": "Perfil obtenido exitosamente"
}
```

---

### 4. **Actualizar Perfil** 🔒 (Nombre y Email)
```
PUT /api/usuarios/perfil
```

#### Headers:
```
Authorization: Bearer <token>
```

#### Body (al menos uno):
```json
{
  "nombre": "Juan Carlos Pérez",
  "email": "nuevoemail@example.com"
}
```

#### Respuesta (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Juan Carlos Pérez",
    "email": "nuevoemail@example.com",
    "objetivo": "ganar masa muscular",
    "peso": 75.5,
    "altura": 175,
    "fecha_registro": "2025-10-15T10:30:00.000Z",
    "activo": true
  },
  "message": "Perfil actualizado exitosamente"
}
```

#### Validaciones:
- `nombre`: mínimo 2 caracteres
- `email`: formato válido y único en la base de datos

---

### 5. **Actualizar Datos Fitness** 🔒 (Objetivo, Peso, Altura)
```
PUT /api/usuarios/datos-fitness
```

#### Headers:
```
Authorization: Bearer <token>
```

#### Body (al menos uno):
```json
{
  "objetivo": "perder grasa",
  "peso": 73.5,
  "altura": 176
}
```

#### Respuesta (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "objetivo": "perder grasa",
    "peso": 73.5,
    "altura": 176,
    "fecha_registro": "2025-10-15T10:30:00.000Z",
    "activo": true
  },
  "message": "Datos fitness actualizados exitosamente"
}
```

#### Validaciones:
- `peso`: entre 0 y 500 kg
- `altura`: entre 0 y 300 cm
- `objetivo`: cualquier texto o null

---

### 6. **Cambiar Contraseña** 🔒
```
PUT /api/usuarios/cambiar-password
```

#### Headers:
```
Authorization: Bearer <token>
```

#### Body:
```json
{
  "passwordActual": "Password123!",
  "passwordNueva": "NewPassword456!"
}
```

#### Respuesta (200):
```json
{
  "success": true,
  "data": {
    "mensaje": "Contraseña actualizada correctamente"
  },
  "message": "Contraseña actualizada exitosamente"
}
```

#### Validaciones:
- La contraseña nueva debe ser diferente a la actual
- Mínimo 8 caracteres
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número
- Al menos un carácter especial

---

### 7. **Eliminar Cuenta** 🔒 (Soft Delete)
```
DELETE /api/usuarios/cuenta
```

#### Headers:
```
Authorization: Bearer <token>
```

#### Body:
```json
{
  "password": "Password123!"
}
```

#### Respuesta (200):
```json
{
  "success": true,
  "data": {
    "mensaje": "Cuenta eliminada correctamente"
  },
  "message": "Cuenta eliminada exitosamente"
}
```

#### Nota:
- Marca `activo: false` en la base de datos
- El usuario NO podrá volver a hacer login
- Los datos no se eliminan físicamente

---

## ❌ Respuestas de Error Comunes

### 400 - Bad Request
```json
{
  "success": false,
  "error": "Debe proporcionar al menos un campo para actualizar"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "error": "Token inválido o expirado"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "error": "Usuario no encontrado"
}
```

---

## 📊 Campos Devueltos por el Backend

### Objeto Usuario Completo:
```typescript
{
  id: number,
  nombre: string,
  email: string,
  objetivo: string | null,
  peso: number | null,
  altura: number | null,
  fecha_registro: string (ISO 8601),
  activo: boolean
}
```

**IMPORTANTE:** El campo `password_hash` NUNCA se incluye en las respuestas por seguridad.

---

## 🔄 Ejemplos de Integración Frontend

### Login y Guardar Token:
```javascript
const response = await fetch('/api/usuarios/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'juan@example.com',
    password: 'Password123!'
  })
});

const data = await response.json();
if (data.success) {
  localStorage.setItem('token', data.data.token);
  localStorage.setItem('usuario', JSON.stringify(data.data.usuario));
}
```

### Actualizar Perfil:
```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/usuarios/perfil', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    nombre: 'Nuevo Nombre',
    email: 'nuevoemail@example.com'
  })
});

const data = await response.json();
if (data.success) {
  // Actualizar datos del usuario en localStorage
  localStorage.setItem('usuario', JSON.stringify(data.data));
}
```

### Actualizar Datos Fitness:
```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/usuarios/datos-fitness', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    peso: 75.5,
    altura: 175,
    objetivo: 'ganar masa muscular'
  })
});

const data = await response.json();
if (data.success) {
  localStorage.setItem('usuario', JSON.stringify(data.data));
}
```

---

## ✅ Checklist de Integración Frontend

- [ ] Usar SOLO los campos que existen en la base de datos
- [ ] NO esperar `fecha_ultima_actualizacion` en las respuestas
- [ ] Campos disponibles: `id, nombre, email, objetivo, peso, altura, fecha_registro, activo`
- [ ] Siempre enviar token JWT en header `Authorization: Bearer <token>`
- [ ] Manejar errores 400, 401, 404 apropiadamente
- [ ] Validar contraseñas en el frontend antes de enviar

---

## 📝 Notas Finales

1. La base de datos usa la estructura definida en `Base de datos.txt`
2. NO usar la estructura de `app_movil_tables.sql` (esa tiene campos adicionales que no existen)
3. El backend devuelve exactamente los campos que están en la tabla `usuarios`
4. Todos los endpoints están probados y funcionan con esta estructura
