# 📋 Estructura del Endpoint de Perfil de Administrador

## ⚠️ ENDPOINT CORRECTO

```
GET /api/administradores/profile
```

**NO es:** ~~`/api/auth/profile`~~ ❌

---

## 🔑 Headers Requeridos

```javascript
{
  "x-admin-user": "admin",
  "x-admin-password": "Admin123!"
}
```

---

## ✅ Respuesta del Endpoint

### Estructura EXACTA de la Respuesta Exitosa (200):

```javascript
{
  "success": true,
  "data": {
    "admin": {
      "id": 1,
      "usuario": "admin",
      "rol_id": 1,
      "creado_en": "2025-01-08T10:30:00.000Z",
      "rol": {
        "id": 1,
        "nombre": "administrador",
        "descripcion": "Acceso total al sistema"
      }
    }
  },
  "message": "Perfil obtenido correctamente"
}
```

---

## 🎯 Respuestas a las Preguntas

### 1. ¿La respuesta viene en `data.data.admin` o `data.admin` o solo `data`?

**Respuesta:** ✅ **`data.data.admin`**

```typescript
// ✅ CORRECTO
const admin = response.data.admin;

// ❌ INCORRECTO
const admin = response.admin;       // undefined
const admin = response.data;        // { admin: {...} }
```

### 2. ¿El endpoint retorna el objeto del administrador directamente o envuelto?

**Respuesta:** ✅ **Envuelto en una estructura estándar con `success`, `data` y `message`**

---

## 💻 Cómo Acceder en el Frontend

```typescript
// URL CORRECTA DEL ENDPOINT
const response = await fetch('http://localhost:3000/api/administradores/profile', {
  method: 'GET',
  headers: {
    'x-admin-user': 'admin',
    'x-admin-password': 'Admin123!'
  }
});

const result = await response.json();

// ✅ CORRECTO - Acceder a la estructura anidada
const admin = result.data.admin;

// ❌ INCORRECTO
const admin = result.admin;      // undefined
const admin = result.data;       // { admin: {...} }
```

---

## 📦 Estructura Completa

```
result                          // Objeto raíz
├── success: boolean            // true si exitoso
├── data                        // Contenedor de datos
│   └── admin                   // ← Objeto del administrador AQUÍ
│       ├── id: number
│       ├── usuario: string
│       ├── rol_id: number
│       ├── creado_en: string
│       └── rol: object
│           ├── id: number
│           ├── nombre: string
│           └── descripcion: string
└── message: string             // Mensaje descriptivo
```

---

## 🔑 Resumen Rápido

| Pregunta | Respuesta |
|----------|-----------|
| **Endpoint correcto** | `/api/administradores/profile` |
| **Estructura de acceso** | `result.data.admin` |
| **¿Envuelto?** | ✅ Sí, en `{ success, data, message }` |
| **¿Directamente?** | ❌ No, está dentro de `data.admin` |
| **Path completo** | `response.data.admin` |

---

## 📍 Todos los Endpoints de Administradores

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/administradores/verify` | Verificar credenciales (login) | ❌ No |
| GET | `/api/administradores/profile` | Obtener perfil del admin autenticado | ✅ Sí |
| PUT | `/api/administradores/change-password` | Cambiar contraseña | ✅ Sí |
| GET | `/api/administradores/admins` | Listar todos los admins | ✅ Sí (Solo Admin) |
| PUT | `/api/administradores/:id/rol` | Asignar rol a un admin | ✅ Sí (Solo Admin) |
| GET | `/api/administradores/status` | Estado del sistema | ❌ No |

---

## ⚠️ Respuestas de Error

### Error 401 (No autorizado):
```javascript
{
  "success": false,
  "message": "Credenciales incorrectas"
}
```

### Error 404 (No encontrado):
```javascript
{
  "success": false,
  "message": "Administrador no encontrado"
}
```

---

## 🔄 Ejemplo Completo de Login + Obtener Perfil

```typescript
// 1. Primero verificar credenciales (LOGIN)
const loginResponse = await fetch('http://localhost:3000/api/administradores/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    usuario: 'admin',
    password: 'Admin123!'
  })
});

const loginResult = await loginResponse.json();

if (loginResult.success) {
  // loginResult.data.admin contiene la info básica
  const adminBasico = loginResult.data.admin;
  
  // 2. Obtener perfil completo con rol detallado
  const perfilResponse = await fetch('http://localhost:3000/api/administradores/profile', {
    method: 'GET',
    headers: {
      'x-admin-user': 'admin',
      'x-admin-password': 'Admin123!'
    }
  });
  
  const perfilResult = await perfilResponse.json();
  
  if (perfilResult.success) {
    // perfilResult.data.admin contiene toda la info con rol completo
    const adminCompleto = perfilResult.data.admin;
    console.log('Perfil completo:', adminCompleto);
  }
}
```
