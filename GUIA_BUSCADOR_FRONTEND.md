# 🔍 Guía de Implementación - Buscador Avanzado Frontend

## 📋 Nuevos Endpoints Disponibles

### 1. **Búsqueda Básica** (Original con mejoras)
```
GET /api/productos/search?q=termino&page=1&limit=10
```
- ✅ Busca en `nombre` y `descripcion`
- ✅ Incluye categorías en la respuesta
- ✅ Paginación incluida

### 2. **Búsqueda Global** (NUEVO - Sin paginación)
```
GET /api/productos/search/global?q=termino&max=50
```
- ✅ Busca en TODA la base de datos
- ✅ Sin paginación (perfecto para autocompletado)
- ✅ Límite máximo configurable (default: 50, máx: 100)
- ✅ Incluye categorías

### 3. **Búsqueda Avanzada** (NUEVO - Incluye categorías)
```
GET /api/productos/search/advanced?q=termino&page=1&limit=10
```
- ✅ Busca en `nombre`, `descripcion` Y `categorías`
- ✅ Paginación incluida
- ✅ Más completa

## 📦 Estructura de Respuesta

### Búsqueda Básica y Avanzada
```json
{
  "success": true,
  "message": "X productos encontrados",
  "productos": [
    {
      "id": 1,
      "nombre": "Proteína Whey",
      "descripcion": "...",
      "precio": 299.99,
      "stock": 50,
      "imagen_url": "...",
      "categorias": [
        {
          "id": 1,
          "nombre": "Suplementos"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "searchTerm": "proteina"
}
```

### Búsqueda Global
```json
{
  "success": true,
  "message": "X productos encontrados",
  "productos": [...],
  "total": 25,
  "searchTerm": "proteina",
  "maxResults": 50
}
```

## 🚀 Casos de Uso Recomendados

### 1. **Autocompletado / Sugerencias**
```javascript
// Usar búsqueda GLOBAL para autocompletado
const getSugerencias = async (termino) => {
  const response = await fetch(
    `/api/productos/search/global?q=${termino}&max=10`
  );
  return response.json();
};
```

### 2. **Búsqueda con Paginación**
```javascript
// Usar búsqueda BÁSICA para resultados paginados
const buscarProductos = async (termino, pagina = 1) => {
  const response = await fetch(
    `/api/productos/search?q=${termino}&page=${pagina}&limit=12`
  );
  return response.json();
};
```

### 3. **Búsqueda Completa (incluye categorías)**
```javascript
// Usar búsqueda AVANZADA cuando quieras buscar también por categorías
const busquedaCompleta = async (termino, pagina = 1) => {
  const response = await fetch(
    `/api/productos/search/advanced?q=${termino}&page=${pagina}&limit=12`
  );
  return response.json();
};
```

## 💡 Implementación Frontend

### Componente Buscador Básico
```javascript
const [termino, setTermino] = useState('');
const [productos, setProductos] = useState([]);
const [sugerencias, setSugerencias] = useState([]);

// Autocompletado en tiempo real
useEffect(() => {
  if (termino.length >= 2) {
    getSugerencias(termino).then(data => {
      setSugerencias(data.productos);
    });
  }
}, [termino]);

// Búsqueda principal
const handleSearch = async () => {
  const data = await buscarProductos(termino);
  setProductos(data.productos);
};
```

### Estados de Carga
```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const buscar = async (termino) => {
  setLoading(true);
  setError(null);
  try {
    const data = await buscarProductos(termino);
    setProductos(data.productos);
  } catch (err) {
    setError('Error al buscar productos');
  } finally {
    setLoading(false);
  }
};
```

## 🎯 Recomendaciones

### ✅ **Para Autocompletado**
- Usar `/search/global` con `max=10`
- Debounce de 300ms
- Mostrar solo nombre + imagen

### ✅ **Para Resultados de Búsqueda**
- Usar `/search` o `/search/advanced`
- Paginación con `limit=12` o `limit=16`
- Mostrar información completa + categorías

### ✅ **Para Filtros Avanzados**
- Usar `/search/advanced` cuando busques por categorías
- Combinar con filtros de precio, stock, etc.

## 🔧 Validaciones Frontend

```javascript
// Validar término de búsqueda
if (!termino || termino.trim().length < 2) {
  setError('Ingresa al menos 2 caracteres');
  return;
}

// Limpiar término
const terminoLimpio = termino.trim().toLowerCase();
```

## 📱 UI/UX Sugerencias

1. **Barra de búsqueda** con autocompletado usando `/global`
2. **Página de resultados** con paginación usando `/search`
3. **Filtro "Buscar en categorías"** usando `/advanced`
4. **Indicador de resultados**: "X productos encontrados para 'término'"
5. **Estado vacío**: "No se encontraron productos para 'término'"

---

## 🚀 Servidor Backend ya configurado en: `http://localhost:3000`

¡Todo listo para implementar! 🎉