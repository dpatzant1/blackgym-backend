# 📋 Guía Completa - CRUD de Administradores

## ✅ Endpoints Implementados

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| POST | `/api/administradores` | Crear administrador | ✅ | Solo Admin |
| GET | `/api/administradores/:id` | Obtener administrador por ID | ✅ | Solo Admin |
| PUT | `/api/administradores/:id` | Actualizar administrador | ✅ | Solo Admin |
| DELETE | `/api/administradores/:id` | Eliminar administrador | ✅ | Solo Admin |
| GET | `/api/administradores/admins` | Listar todos los administradores | ✅ | Solo Admin |
| PUT | `/api/administradores/:id/rol` | Asignar rol | ✅ | Solo Admin |

---

## 🔑 Headers Requeridos

Todos los endpoints (excepto los públicos) requieren:

```javascript
{
  "x-admin-user": "admin",
  "x-admin-password": "Admin123!",
  "Content-Type": "application/json"
}
```

---

## 1️⃣ Crear Administrador

### **POST /api/administradores**

**Headers:**
- `x-admin-user`: Usuario administrador
- `x-admin-password`: Contraseña administrador
- `Content-Type`: application/json

**Body:**
```json
{
  "usuario": "nuevo_admin",
  "password": "Password123!",
  "rol_id": 2
}
```

**Campos:**
- `usuario` (string, requerido): 3-50 caracteres
- `password` (string, requerido): 8-100 caracteres, debe incluir mayúscula, minúscula, número y símbolo
- `rol_id` (number, opcional): ID del rol (1=administrador, 2=gerente, 3=asesor de ventas)

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": 2,
      "usuario": "nuevo_admin",
      "rol_id": 2,
      "creado_en": "2025-10-02T15:30:45.123456",
      "rol": {
        "id": 2,
        "nombre": "gerente",
        "descripcion": "Gestión de productos, categorías y órdenes"
      }
    }
  },
  "message": "Administrador creado exitosamente"
}
```

**Errores Posibles:**
- `400`: Datos de validación incorrectos
- `400`: Usuario ya existe
- `400`: Contraseña no cumple requisitos de seguridad
- `401`: No autenticado
- `403`: No tiene permisos (no es administrador)

---

## 2️⃣ Obtener Administrador por ID

### **GET /api/administradores/:id**

**Headers:**
- `x-admin-user`: Usuario administrador
- `x-admin-password`: Contraseña administrador

**Parámetros:**
- `id` (number): ID del administrador

**Ejemplo:**
```
GET /api/administradores/2
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": 2,
      "usuario": "nuevo_admin",
      "rol_id": 2,
      "creado_en": "2025-10-02T15:30:45.123456",
      "rol": {
        "id": 2,
        "nombre": "gerente",
        "descripcion": "Gestión de productos, categorías y órdenes"
      }
    }
  },
  "message": "Administrador obtenido exitosamente"
}
```

**Errores Posibles:**
- `400`: ID inválido
- `404`: Administrador no encontrado
- `401`: No autenticado
- `403`: No tiene permisos

---

## 3️⃣ Actualizar Administrador

### **PUT /api/administradores/:id**

**Headers:**
- `x-admin-user`: Usuario administrador
- `x-admin-password`: Contraseña administrador
- `Content-Type`: application/json

**Parámetros:**
- `id` (number): ID del administrador a actualizar

**Body (todos los campos son opcionales):**
```json
{
  "usuario": "admin_actualizado",
  "rol_id": 1
}
```

**Campos Opcionales:**
- `usuario` (string): Nuevo nombre de usuario (3-50 caracteres)
- `rol_id` (number): Nuevo rol (1, 2 o 3)

**Nota:** Debe proporcionar al menos un campo para actualizar.

**Ejemplo:**
```
PUT /api/administradores/2
Body: {
  "usuario": "gerente_principal",
  "rol_id": 2
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": 2,
      "usuario": "gerente_principal",
      "rol_id": 2,
      "creado_en": "2025-10-02T15:30:45.123456",
      "rol": {
        "id": 2,
        "nombre": "gerente",
        "descripcion": "Gestión de productos, categorías y órdenes"
      }
    },
    "cambios": {
      "usuario": {
        "anterior": "nuevo_admin",
        "nuevo": "gerente_principal"
      },
      "rol_id": {
        "anterior": 2,
        "nuevo": 2
      }
    }
  },
  "message": "Administrador actualizado exitosamente"
}
```

**Errores Posibles:**
- `400`: ID inválido
- `400`: Datos de validación incorrectos
- `400`: Usuario ya está en uso
- `404`: Administrador no encontrado
- `404`: Rol no encontrado
- `401`: No autenticado
- `403`: No tiene permisos

---

## 4️⃣ Eliminar Administrador

### **DELETE /api/administradores/:id**

**Headers:**
- `x-admin-user`: Usuario administrador
- `x-admin-password`: Contraseña administrador

**Parámetros:**
- `id` (number): ID del administrador a eliminar

**Ejemplo:**
```
DELETE /api/administradores/2
```

**Restricciones:**
- ❌ No puedes eliminar tu propia cuenta
- ❌ No se puede eliminar el último administrador del sistema

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "usuario": "nuevo_admin"
  },
  "message": "Administrador eliminado exitosamente"
}
```

**Errores Posibles:**
- `400`: ID inválido
- `400`: No puedes eliminar tu propia cuenta
- `400`: No se puede eliminar el último administrador
- `404`: Administrador no encontrado
- `401`: No autenticado
- `403`: No tiene permisos

---

## 5️⃣ Listar Todos los Administradores

### **GET /api/administradores/admins**

**Headers:**
- `x-admin-user`: Usuario administrador
- `x-admin-password`: Contraseña administrador

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "administradores": [
      {
        "id": 1,
        "usuario": "admin",
        "rol_id": 1,
        "creado_en": "2025-09-11T03:39:48.468956",
        "rol": {
          "id": 1,
          "nombre": "administrador",
          "descripcion": "Acceso total al sistema"
        }
      },
      {
        "id": 2,
        "usuario": "gerente_principal",
        "rol_id": 2,
        "creado_en": "2025-10-02T15:30:45.123456",
        "rol": {
          "id": 2,
          "nombre": "gerente",
          "descripcion": "Gestión de productos, categorías y órdenes"
        }
      }
    ],
    "total": 2
  },
  "message": "Lista de administradores obtenida correctamente"
}
```

---

## 6️⃣ Asignar Rol a Administrador

### **PUT /api/administradores/:id/rol**

**Headers:**
- `x-admin-user`: Usuario administrador
- `x-admin-password`: Contraseña administrador
- `Content-Type`: application/json

**Parámetros:**
- `id` (number): ID del administrador

**Body:**
```json
{
  "rol_id": 3
}
```

**Roles Disponibles:**
- `1`: Administrador (acceso total)
- `2`: Gerente (gestión de productos, categorías, órdenes)
- `3`: Asesor de Ventas (acceso limitado)

**Ejemplo:**
```
PUT /api/administradores/2/rol
Body: {
  "rol_id": 3
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": 2,
      "usuario": "gerente_principal",
      "rol_id": 3,
      "creado_en": "2025-10-02T15:30:45.123456",
      "rol": {
        "id": 3,
        "nombre": "asesor de ventas",
        "descripcion": "Acceso limitado a inventario y órdenes"
      }
    },
    "cambio": {
      "rolAnterior": "gerente",
      "rolNuevo": "asesor de ventas"
    }
  },
  "message": "Rol asignado correctamente"
}
```

---

## 🔐 Requisitos de Contraseña

Al crear un administrador, la contraseña debe cumplir:

- ✅ Mínimo 8 caracteres
- ✅ Al menos una letra mayúscula
- ✅ Al menos una letra minúscula
- ✅ Al menos un número
- ✅ Al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)

**Ejemplos Válidos:**
- `Admin123!`
- `Password@123`
- `Secure#Pass1`

**Ejemplos Inválidos:**
- `admin123` (sin mayúscula ni símbolo)
- `ADMIN123!` (sin minúscula)
- `Admin!@#` (sin número)

---

## 🔄 Bitácora

Todas las operaciones de administradores se registran en la bitácora:

- `CREAR_ADMIN`: Cuando se crea un nuevo administrador
- `EDITAR_ADMIN`: Cuando se actualiza un administrador
- `ELIMINAR_ADMIN`: Cuando se elimina un administrador
- `ASIGNAR_ROL`: Cuando se asigna o cambia un rol

---

## 💻 Ejemplos de Uso en Frontend

### **Crear Administrador:**

```typescript
const crearAdministrador = async (datos: {
  usuario: string;
  password: string;
  rol_id?: number;
}) => {
  try {
    const response = await fetch('http://localhost:3000/api/administradores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-user': localStorage.getItem('adminUser') || '',
        'x-admin-password': localStorage.getItem('adminPassword') || ''
      },
      body: JSON.stringify(datos)
    });

    const result = await response.json();

    if (result.success) {
      console.log('Administrador creado:', result.data.admin);
      return result.data.admin;
    } else {
      throw new Error(result.error || 'Error al crear administrador');
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Uso
await crearAdministrador({
  usuario: 'nuevo_gerente',
  password: 'Password123!',
  rol_id: 2
});
```

### **Actualizar Administrador:**

```typescript
const actualizarAdministrador = async (
  id: number,
  datos: {
    usuario?: string;
    rol_id?: number;
  }
) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/administradores/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-user': localStorage.getItem('adminUser') || '',
          'x-admin-password': localStorage.getItem('adminPassword') || ''
        },
        body: JSON.stringify(datos)
      }
    );

    const result = await response.json();

    if (result.success) {
      console.log('Administrador actualizado:', result.data.admin);
      return result.data.admin;
    } else {
      throw new Error(result.error || 'Error al actualizar administrador');
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Uso
await actualizarAdministrador(2, {
  usuario: 'gerente_actualizado',
  rol_id: 1
});
```

### **Eliminar Administrador:**

```typescript
const eliminarAdministrador = async (id: number) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/administradores/${id}`,
      {
        method: 'DELETE',
        headers: {
          'x-admin-user': localStorage.getItem('adminUser') || '',
          'x-admin-password': localStorage.getItem('adminPassword') || ''
        }
      }
    );

    const result = await response.json();

    if (result.success) {
      console.log('Administrador eliminado:', result.data);
      return result.data;
    } else {
      throw new Error(result.error || 'Error al eliminar administrador');
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Uso
await eliminarAdministrador(2);
```

---

## ⚠️ Notas Importantes

1. **Solo administradores** pueden realizar operaciones CRUD sobre otros administradores
2. **No puedes eliminarte a ti mismo** - medida de seguridad
3. **No se puede eliminar el último administrador** - evita quedar sin acceso al sistema
4. **Las contraseñas se hashean** con bcrypt antes de almacenarlas
5. **Todas las acciones se registran en bitácora** para auditoría
6. **Los roles se normalizan** de `roles` a `rol` en las respuestas para consistencia

---

## 🎯 Resumen de Endpoints

```
POST   /api/administradores          → Crear
GET    /api/administradores/:id      → Obtener uno
PUT    /api/administradores/:id      → Actualizar
DELETE /api/administradores/:id      → Eliminar
GET    /api/administradores/admins   → Listar todos
PUT    /api/administradores/:id/rol  → Asignar rol
```

**Todos requieren autenticación y rol de administrador.** 🔒
