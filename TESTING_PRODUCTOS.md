# Testing Manual de la API - Productos

Este archivo contiene ejemplos de cómo probar todos los endpoints de productos usando herramientas como Postman, Insomnia, Thunder Client o curl.

## Base URL
```
http://localhost:3000
```

## 📦 Endpoints de Productos

### 1. Listar todos los productos
```http
GET /api/productos
```

**Query Parameters (opcionales):**
- `page`: número de página (default: 1)
- `limit`: productos por página (default: 10, max: 100)
- `categoria`: ID de categoría para filtrar
- `include_categories`: "true" para incluir información de categorías

**Ejemplos:**
```
GET /api/productos
GET /api/productos?page=2&limit=5
GET /api/productos?include_categories=true
GET /api/productos?categoria=1
```

---

### 2. Buscar productos
```http
GET /api/productos/search?q=proteína
```

**Query Parameters:**
- `q`: término de búsqueda (mínimo 2 caracteres)
- `page`: número de página (opcional)
- `limit`: productos por página (opcional)

**Ejemplos:**
```
GET /api/productos/search?q=proteína
GET /api/productos/search?q=creatina&page=1&limit=5
```

---

### 3. Obtener producto por ID
```http
GET /api/productos/1
```

---

### 4. Crear nuevo producto
```http
POST /api/productos
Content-Type: application/json

{
  "nombre": "Proteína Whey Gold Standard",
  "descripcion": "Proteína de suero de leche de alta calidad",
  "precio": 89.99,
  "stock": 25,
  "imagen_url": "https://example.com/images/whey-protein.jpg"
}
```

**Campos requeridos:**
- `nombre`: string (2-100 caracteres)
- `precio`: number (mayor a 0)
- `stock`: integer (mayor o igual a 0)

**Campos opcionales:**
- `descripcion`: string (max 500 caracteres)
- `imagen_url`: string (URL válida)

---

### 5. Actualizar producto completo
```http
PUT /api/productos/1
Content-Type: application/json

{
  "nombre": "Proteína Whey Gold Standard Updated",
  "descripcion": "Proteína de suero de leche de alta calidad - Edición actualizada",
  "precio": 94.99,
  "stock": 30,
  "imagen_url": "https://example.com/images/whey-protein-updated.jpg"
}
```

---

### 6. Actualizar solo el stock
```http
PATCH /api/productos/1/stock
Content-Type: application/json

{
  "stock": 50,
  "operation": "set"
}
```

**Operaciones disponibles:**
- `"set"`: establecer stock exacto
- `"add"`: agregar al stock actual
- `"subtract"`: restar del stock actual

**Ejemplos:**
```json
{ "stock": 100, "operation": "set" }
{ "stock": 10, "operation": "add" }
{ "stock": 5, "operation": "subtract" }
```

---

### 7. Eliminar producto
```http
DELETE /api/productos/1
```

---

### 8. Verificar stock de múltiples productos
```http
POST /api/productos/check-stock
Content-Type: application/json

{
  "productos": [
    { "id": 1, "cantidad": 2 },
    { "id": 2, "cantidad": 5 },
    { "id": 3, "cantidad": 1 }
  ]
}
```

---

## 🧪 Ejemplos de Pruebas Completas

### Crear producto de prueba:
```bash
curl -X POST http://localhost:3000/api/productos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Creatina Monohidrato",
    "descripcion": "Suplemento de creatina pura para mejor rendimiento",
    "precio": 34.50,
    "stock": 40
  }'
```

### Buscar productos:
```bash
curl "http://localhost:3000/api/productos/search?q=creatina"
```

### Verificar stock:
```bash
curl -X POST http://localhost:3000/api/productos/check-stock \
  -H "Content-Type: application/json" \
  -d '{
    "productos": [
      { "id": 1, "cantidad": 2 }
    ]
  }'
```

---

## 📊 Respuestas Esperadas

### Respuesta exitosa:
```json
{
  "success": true,
  "data": { /* datos del resultado */ },
  "message": "Mensaje descriptivo"
}
```

### Respuesta con paginación:
```json
{
  "success": true,
  "data": {
    "productos": [ /* array de productos */ ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Productos obtenidos exitosamente"
}
```

### Respuesta de error:
```json
{
  "success": false,
  "error": "Descripción del error",
  "details": [ /* detalles adicionales si los hay */ ]
}
```

---

## 🔍 Códigos de Estado HTTP

- `200` - OK (operación exitosa)
- `201` - Created (producto creado)
- `400` - Bad Request (datos inválidos)
- `404` - Not Found (producto no encontrado)
- `500` - Internal Server Error (error del servidor)
