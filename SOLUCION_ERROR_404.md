# 🔧 SOLUCIÓN: Error 404 en Dashboard Frontend

## ❌ El Problema

Tu frontend está llamando a:
```
http://localhost:3000/dashboard/analisis-categorias
```

Pero los endpoints del backend están en:
```
http://localhost:3000/api/dashboard/analisis-categorias
```

**Falta el `/api/` en todas las URLs.**

---

## ✅ La Solución

### Opción 1: Corregir tu archivo `dashboardService.ts`

Busca en tu código donde defines las URLs base y cambia:

**❌ INCORRECTO:**
```typescript
const API_BASE_URL = 'http://localhost:3000/dashboard';
```

**✅ CORRECTO:**
```typescript
const API_BASE_URL = 'http://localhost:3000/api/dashboard';
```

### Opción 2: Si usas axios

Si tu `dashboardService.ts` usa axios, busca esto:

**❌ INCORRECTO:**
```typescript
axios.get(`${API_BASE_URL}/analisis-categorias`, ...)
// Genera: http://localhost:3000/dashboard/analisis-categorias
```

**✅ CORRECTO:**
```typescript
axios.get(`${API_BASE_URL}/api/dashboard/analisis-categorias`, ...)
// Genera: http://localhost:3000/api/dashboard/analisis-categorias
```

O mejor aún, define correctamente la base:
```typescript
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api/dashboard', // ← Incluye /api/
  headers: {
    'Content-Type': 'application/json',
    'x-admin-user': import.meta.env.VITE_ADMIN_USER,
    'x-admin-password': import.meta.env.VITE_ADMIN_PASSWORD,
  },
});

// Luego las llamadas son más simples:
apiClient.get('/analisis-categorias?year=2025')
// Genera: http://localhost:3000/api/dashboard/analisis-categorias?year=2025
```

---

## 🔍 Cómo Identificar el Problema

En la consola del navegador ves:
```
GET http://localhost:3000/dashboard/analisis-categorias?year=2025 404 (Not Found)
                          ↑
                    Falta /api/ aquí
```

Debería ser:
```
GET http://localhost:3000/api/dashboard/analisis-categorias?year=2025 200 (OK)
                          ↑
                    /api/ presente
```

---

## 📝 Todas las URLs Correctas del Backend

Asegúrate de que tu frontend use estas rutas exactas:

| Endpoint                                  | URL Completa                                        |
|-------------------------------------------|-----------------------------------------------------|
| Dashboard General                         | `http://localhost:3000/api/dashboard/general`       |
| Ventas por Periodo (Mensual)             | `http://localhost:3000/api/dashboard/ventas-periodo?year=2025&tipo=mensual` |
| Ventas por Periodo (Diario)              | `http://localhost:3000/api/dashboard/ventas-periodo?year=2025&month=10&tipo=diario` |
| Comparativa Anual                         | `http://localhost:3000/api/dashboard/comparativa-anual?year=2025&year_comparacion=2024` |
| Top Productos                             | `http://localhost:3000/api/dashboard/top-productos?year=2025&limit=10` |
| Análisis de Categorías                    | `http://localhost:3000/api/dashboard/analisis-categorias?year=2025` |

---

## 🧪 Cómo Probar los Endpoints

### Desde PowerShell (Windows):

```powershell
# 1. Dashboard General
Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard/general?year=2025" -Method Get -Headers @{"x-admin-user"="admin"; "x-admin-password"="admin123"}

# 2. Evolución Mensual
Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard/ventas-periodo?year=2025&tipo=mensual" -Method Get -Headers @{"x-admin-user"="admin"; "x-admin-password"="admin123"}

# 3. Evolución Diaria (Octubre)
Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard/ventas-periodo?year=2025&month=10&tipo=diario" -Method Get -Headers @{"x-admin-user"="admin"; "x-admin-password"="admin123"}

# 4. Comparativa Anual
Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard/comparativa-anual?year=2025&year_comparacion=2024" -Method Get -Headers @{"x-admin-user"="admin"; "x-admin-password"="admin123"}

# 5. Top 10 Productos
Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard/top-productos?year=2025&limit=10" -Method Get -Headers @{"x-admin-user"="admin"; "x-admin-password"="admin123"}

# 6. Análisis de Categorías
Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard/analisis-categorias?year=2025" -Method Get -Headers @{"x-admin-user"="admin"; "x-admin-password"="admin123"}
```

### Desde el Navegador (DevTools):

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Configurar headers
const headers = {
  'x-admin-user': 'admin',
  'x-admin-password': 'admin123',
  'Content-Type': 'application/json'
};

// Probar endpoint
fetch('http://localhost:3000/api/dashboard/general?year=2025', { headers })
  .then(res => res.json())
  .then(data => console.log('✅ Datos recibidos:', data))
  .catch(err => console.error('❌ Error:', err));
```

---

## 🔧 Código Corregido para dashboardService.ts

Reemplaza tu archivo con este código corregido:

```typescript
import axios from 'axios';

// ✅ BASE URL CORRECTA CON /api/
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_PATH = '/api/dashboard';

// Configurar cliente de axios
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_PATH}`, // http://localhost:3000/api/dashboard
  headers: {
    'Content-Type': 'application/json',
    'x-admin-user': import.meta.env.VITE_ADMIN_USER || 'admin',
    'x-admin-password': import.meta.env.VITE_ADMIN_PASSWORD || 'admin123',
  },
});

// Interceptor para logging (opcional)
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.config?.url, error.response?.status);
    return Promise.reject(error);
  }
);

// Servicios del Dashboard
export const dashboardService = {
  
  /**
   * Obtener métricas generales
   */
  async getGeneral(year: number, month?: number) {
    const params: any = { year };
    if (month) params.month = month;
    
    const response = await apiClient.get('/general', { params });
    return response.data.data; // El backend envuelve en { success, message, data }
  },

  /**
   * Obtener evolución de ventas por periodo
   */
  async getVentasPorPeriodo(year: number, tipo: 'mensual' | 'diario', month?: number) {
    const params: any = { year, tipo };
    if (month && tipo === 'diario') params.month = month;
    
    const response = await apiClient.get('/ventas-periodo', { params });
    return response.data.data;
  },

  /**
   * Obtener comparativa anual
   */
  async getDatosComparativos(year: number, year_comparacion: number) {
    const params = { year, year_comparacion };
    
    const response = await apiClient.get('/comparativa-anual', { params });
    return response.data.data;
  },

  /**
   * Obtener top productos
   */
  async getTopProductos(year: number, limit: number = 10, month?: number) {
    const params: any = { year, limit };
    if (month) params.month = month;
    
    const response = await apiClient.get('/top-productos', { params });
    return response.data.data;
  },

  /**
   * Obtener análisis de categorías
   */
  async getAnalisisCategorias(year: number, month?: number) {
    const params: any = { year };
    if (month) params.month = month;
    
    const response = await apiClient.get('/analisis-categorias', { params });
    return response.data.data;
  },
};

export default dashboardService;
```

---

## ✅ Verificación Final

Después de corregir, verifica en la consola del navegador que las URLs sean correctas:

**Antes (❌):**
```
GET http://localhost:3000/dashboard/general?year=2025 404
```

**Después (✅):**
```
GET http://localhost:3000/api/dashboard/general?year=2025 200
```

---

## 🎯 Checklist de Corrección

- [ ] Verificar que `API_BASE_URL` incluya `/api/dashboard`
- [ ] Revisar todas las llamadas a axios/fetch
- [ ] Verificar variables de entorno (`.env`)
- [ ] Probar un endpoint desde PowerShell
- [ ] Probar desde el navegador (DevTools)
- [ ] Verificar en Network tab que las URLs sean correctas
- [ ] Ver que el status code sea 200 en lugar de 404

---

**Última Actualización:** 4 de octubre de 2025  
**Problema:** Error 404 por falta de `/api/` en las URLs  
**Solución:** Agregar `/api/` al base URL del servicio
