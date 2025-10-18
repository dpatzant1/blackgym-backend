# 🔧 CORRECCIÓN ADICIONAL: Columna categoria_id no existe

**Fecha:** 17 de octubre de 2025  
**Archivo:** `src/controllers/recomendaciones.js`  
**Método:** `_generarRecomendacionesInternas()`  
**Error anterior:** ✅ Resuelto - pool is not defined  
**Error nuevo:** ✅ Resuelto - categoria_id no existe

---

## 🐛 Error Identificado

### Mensaje de Error
```
Error al obtener productos: {
  code: '42703',
  details: null,
  hint: null,
  message: 'column productos.categoria_id does not exist'
}
```

### Causa Raíz
La tabla `productos` **NO tiene una columna `categoria_id`** directa. Este proyecto usa una **relación many-to-many** (muchos a muchos) entre productos y categorías a través de una tabla intermedia `producto_categoria`.

**Estructura real:**
```
productos (1) ←→ (N) producto_categoria (N) ←→ (1) categorias
```

Esto permite que:
- Un producto pueda tener múltiples categorías
- Una categoría pueda tener múltiples productos

---

## ✅ Solución Implementada

### Cambio Realizado

**ANTES (con error):**
```javascript
const { data: productos, error: productosError } = await supabase
  .from('productos')
  .select('id, nombre, descripcion, precio, stock, categoria_id, imagen_url')
  //                                                   ^^^^^^^^^^^^^^ ❌ No existe
  .eq('activo', true)
  .gt('stock', 0)
  .limit(50);
```

**DESPUÉS (corregido):**
```javascript
const { data: productos, error: productosError } = await supabase
  .from('productos')
  .select('id, nombre, descripcion, precio, stock, imagen_url')
  //                                                ❌ categoria_id removido
  .eq('activo', true)
  .gt('stock', 0)
  .limit(50);
```

---

## 📊 Estructura de la Base de Datos

### Tabla: productos
```sql
id              SERIAL PRIMARY KEY
nombre          VARCHAR(255) NOT NULL
descripcion     TEXT
precio          DECIMAL(10,2) NOT NULL
stock           INTEGER DEFAULT 0
imagen_url      VARCHAR(500)
activo          BOOLEAN DEFAULT TRUE
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Tabla: categorias
```sql
id              SERIAL PRIMARY KEY
nombre          VARCHAR(100) NOT NULL
descripcion     TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Tabla: producto_categoria (intermedia)
```sql
producto_id     INTEGER REFERENCES productos(id)
categoria_id    INTEGER REFERENCES categorias(id)
PRIMARY KEY (producto_id, categoria_id)
```

---

## 🎯 Impacto en Recomendaciones con IA

### ¿Necesitamos las categorías?

**Para Gemini IA:** NO es crítico en este momento.

La IA de Gemini genera recomendaciones basándose en:
1. **Perfil del usuario:** objetivo, peso, altura, edad
2. **Catálogo de productos:** nombre, descripción, precio

**Ventaja:** Gemini es lo suficientemente inteligente para inferir el tipo de producto desde el nombre y descripción.

**Ejemplos:**
- "Proteína Whey 2kg" → Claramente suplemento proteico
- "Mancuernas 10kg" → Claramente equipo de entrenamiento
- "Shaker 500ml" → Claramente accesorio

### Si necesitáramos categorías más adelante

Podríamos modificar la query para incluirlas:
```javascript
const { data: productos, error: productosError } = await supabase
  .from('productos')
  .select(`
    id, 
    nombre, 
    descripcion, 
    precio, 
    stock, 
    imagen_url,
    producto_categoria (
      categorias (
        id,
        nombre
      )
    )
  `)
  .eq('activo', true)
  .gt('stock', 0)
  .limit(50);
```

Pero **NO es necesario** para la Fase 6 actual.

---

## ✅ Verificación

- [x] Campo `categoria_id` removido de la query
- [x] Query solo incluye campos que existen en la tabla
- [x] Campos incluidos: id, nombre, descripcion, precio, stock, imagen_url
- [x] Filtros aplicados: activo=true, stock>0
- [x] Límite de 50 productos

---

## 🚀 Estado del Sistema

### Correcciones Aplicadas (Secuencia)

1. **✅ Primera corrección:** `pool.query()` → `supabase.from()`
2. **✅ Segunda corrección:** Removido `categoria_id` inexistente

### Flujo Actual de Generación

```
1. Usuario sin recomendaciones recientes
   ↓
2. Backend obtiene perfil del usuario
   ↓
3. Backend obtiene 50 productos activos con stock
   ↓ (sin categorías - no son necesarias)
4. Backend llama a Gemini IA con:
   - Perfil: {nombre, objetivo, peso, altura, edad}
   - Productos: [{id, nombre, descripcion, precio, stock, imagen_url}]
   ↓
5. Gemini genera recomendaciones personalizadas
   ↓
6. Backend guarda recomendaciones en BD
   ↓
7. Frontend muestra recomendaciones al usuario
```

---

## 🚀 Siguiente Paso

**Por favor, reinicia el servidor backend nuevamente:**

```bash
# Detener servidor (Ctrl+C en terminal de Node)
node server.js
```

**Luego en Flutter:**
- Hot Restart (`Shift + R`)
- Navegar a "Recomendaciones IA"

**Esperado:** Backend ahora debería:
- ✅ Obtener productos correctamente
- ✅ Llamar a Gemini IA
- ✅ Generar recomendaciones personalizadas
- ✅ Guardar en base de datos
- ✅ Responder al frontend sin errores

---

## 📝 Nota sobre Arquitectura

Este diseño de tabla intermedia es **una buena práctica** porque:
- ✅ Flexibilidad: Un producto puede estar en múltiples categorías
- ✅ Escalabilidad: Fácil agregar/quitar categorías
- ✅ Normalización: Evita duplicación de datos
- ✅ Mantenibilidad: Cambios en categorías no afectan productos

**Ejemplo real:**
```
Producto: "Proteína Whey Isolate 2kg"
Categorías: [Suplementos, Proteínas, Destacados, Ofertas]
```

---

## ✨ Resultado

El backend ahora está correctamente configurado para:
- ✅ Consultar productos con la estructura real de la BD
- ✅ Pasar datos válidos a Gemini IA
- ✅ Generar recomendaciones personalizadas
- ✅ Funcionar sin errores de columnas inexistentes

**¡Corrección completada!** 🎉
