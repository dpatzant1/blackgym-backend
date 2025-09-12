# 🔄 Cambios Realizados en el Backend - Gestión de Categorías en Productos

## 📋 **Resumen General**
Se implementó el manejo completo de la relación **muchos a muchos** entre productos y categorías. Ahora al crear o actualizar productos, se pueden asignar múltiples categorías que se guardan correctamente en la tabla `producto_categoria`.

---

## 🔧 **Cambios Implementados**

### **1. Nuevas Funciones Helper en `src/config/database.js`**

#### **`assignCategoriasToProducto(productoId, categoriaIds)`**
- **Función**: Asigna categorías a un producto
- **Comportamiento**: 
  - Elimina todas las categorías existentes del producto
  - Inserta las nuevas relaciones en `producto_categoria`
- **Parámetros**: 
  - `productoId`: ID del producto
  - `categoriaIds`: Array de IDs de categorías `[1, 2, 3]`

#### **`getCategoriasDeProducto(productoId)`**
- **Función**: Obtiene todas las categorías de un producto específico
- **Retorna**: Array de objetos categoría con `id`, `nombre`, `descripcion`

#### **`removeAllCategoriasFromProducto(productoId)`**
- **Función**: Elimina todas las categorías de un producto
- **Uso**: Cuando se envía un array vacío de categorías

---

### **2. Controlador `createProducto()` Actualizado**

#### **Comportamiento anterior:**
```javascript
// Solo creaba el producto
const newProducto = await create(TABLES.PRODUCTOS, productData);
sendResponse(res, HTTP_STATUS.CREATED, ProductoModel.fromDatabase(newProducto));
```

#### **Comportamiento actual:**
```javascript
// 1. Crea el producto
const newProducto = await create(TABLES.PRODUCTOS, productDataForDb);

// 2. Si se enviaron categorías, las asigna
if (categorias && Array.isArray(categorias) && categorias.length > 0) {
  await assignCategoriasToProducto(newProducto.id, categorias);
}

// 3. Devuelve el producto CON sus categorías
const productoCompleto = await getProductoWithCategorias(newProducto.id);
sendResponse(res, HTTP_STATUS.CREATED, productoCompleto);
```

---

### **3. Controlador `updateProducto()` Actualizado**

#### **Comportamiento anterior:**
```javascript
// Solo actualizaba los campos del producto
const updatedProducto = await update(TABLES.PRODUCTOS, id, productData);
sendResponse(res, HTTP_STATUS.OK, ProductoModel.fromDatabase(updatedProducto));
```

#### **Comportamiento actual:**
```javascript
// 1. Actualiza los campos del producto
const updatedProducto = await update(TABLES.PRODUCTOS, id, productDataForDb);

// 2. Maneja las categorías según el caso:
if (categorias !== undefined) {
  if (Array.isArray(categorias) && categorias.length > 0) {
    // Asigna las nuevas categorías
    await assignCategoriasToProducto(id, categorias);
  } else {
    // Array vacío = elimina todas las categorías
    await removeAllCategoriasFromProducto(id);
  }
}

// 3. Devuelve el producto CON sus categorías actualizadas
const productoCompleto = await getProductoWithCategorias(id);
sendResponse(res, HTTP_STATUS.OK, productoCompleto);
```

---

## 📥 **Formato de Request desde Frontend**

### **Crear Producto con Categorías:**
```javascript
const nuevoProducto = {
  "nombre": "Proteína Whey",
  "descripcion": "Proteína de alta calidad",
  "precio": 29.99,
  "stock": 100,
  "imagen_url": "https://example.com/imagen.jpg",
  "categorias": [1, 2, 3]  // ← NUEVO: Array de IDs de categorías
};

// POST /api/productos
fetch('/api/productos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-user': 'admin',
    'x-admin-password': 'Admin123!'
  },
  body: JSON.stringify(nuevoProducto)
});
```

### **Actualizar Producto con Categorías:**
```javascript
const productoActualizado = {
  "nombre": "Producto actualizado",
  "precio": 35.99,
  "stock": 75,
  "categorias": [1, 3]  // ← Reemplaza todas las categorías existentes
};

// PUT /api/productos/:id
fetch('/api/productos/16', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-user': 'admin',
    'x-admin-password': 'Admin123!'
  },
  body: JSON.stringify(productoActualizado)
});
```

---

## 📤 **Formato de Response del Backend**

### **Respuesta con Categorías:**
```json
{
  "success": true,
  "data": {
    "id": 16,
    "nombre": "Producto de Prueba",
    "descripcion": "Descripción del producto",
    "precio": 29.99,
    "stock": 100,
    "imagen_url": "https://example.com/imagen.jpg",
    "categorias": [
      {
        "id": 1,
        "nombre": "Suplementos"
      },
      {
        "id": 2,
        "nombre": "Proteínas"
      }
    ]
  },
  "message": "Producto creado exitosamente"
}
```

---

## 🔄 **Casos de Uso Soportados**

### **1. Crear producto SIN categorías:**
```javascript
{
  "nombre": "Producto sin categorías",
  "precio": 20.00,
  "stock": 50
  // No incluir campo "categorias"
}
```
**Resultado**: Producto creado sin categorías asignadas.

### **2. Crear producto CON categorías:**
```javascript
{
  "nombre": "Producto con categorías",
  "precio": 25.00,
  "stock": 30,
  "categorias": [1, 2, 3]
}
```
**Resultado**: Producto creado con las 3 categorías asignadas.

### **3. Actualizar SOLO categorías:**
```javascript
{
  "categorias": [4, 5]
}
```
**Resultado**: Solo se actualizan las categorías, otros campos se mantienen.

### **4. Eliminar TODAS las categorías:**
```javascript
{
  "categorias": []
}
```
**Resultado**: Se eliminan todas las categorías del producto.

### **5. Actualizar producto SIN tocar categorías:**
```javascript
{
  "nombre": "Nuevo nombre",
  "precio": 30.00
  // No incluir campo "categorias"
}
```
**Resultado**: Se actualiza el producto, las categorías se mantienen intactas.

---

## 🧪 **Logs del Backend**

El backend ahora muestra logs cuando maneja categorías:

```
[2025-09-11T23:24:58.345Z] Asignando categorías [1, 2] al producto 16
[2025-09-11T23:25:10.123Z] Actualizando categorías [1, 3] del producto 16
[2025-09-11T23:25:25.678Z] Eliminando todas las categorías del producto 16
```

---

## ✅ **Endpoints Afectados**

### **✅ Funcionando correctamente:**
- `POST /api/productos` - Crear producto con/sin categorías
- `PUT /api/productos/:id` - Actualizar producto con/sin categorías  
- `GET /api/productos/:id` - Obtener producto con sus categorías
- `GET /api/productos` - Listar productos (cada uno con sus categorías)
- `GET /api/productos?categoria=1` - Filtrar por categoría (productos con todas sus categorías)

### **📋 Campo opcional en requests:**
El campo `categorias` es **completamente opcional** en los requests:
- Si no se incluye: No se tocan las categorías existentes
- Si se incluye: Se reemplazan todas las categorías
- Si es array vacío `[]`: Se eliminan todas las categorías

---

## 🎯 **Para el Frontend**

### **Formularios de Producto:**
- El campo `categorias` debe enviarse como **array de números** (IDs)
- Ejemplo: `categorias: [1, 2, 3]` no `categorias: ["1", "2", "3"]`

### **Checkbox/Select de Categorías:**
- Recopilar los IDs seleccionados en un array
- Enviar en el campo `categorias` del JSON

### **Respuestas del Backend:**
- Todos los productos ahora incluyen su array `categorias`
- Cada categoría tiene `id` y `nombre`
- Usar para mostrar tags/etiquetas en la interfaz

---

## 🚀 **Estado Actual**

✅ **Sistema completamente funcional**  
✅ **Relaciones producto-categoría implementadas**  
✅ **Compatibilidad hacia atrás mantenida**  
✅ **Logs informativos añadidos**  
✅ **Validaciones incluidas**

**El frontend puede empezar a usar inmediatamente el campo `categorias` en los formularios de productos.**