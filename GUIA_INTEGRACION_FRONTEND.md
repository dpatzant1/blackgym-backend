# 🎨 GUÍA DE INTEGRACIÓN: FRONTEND + BACKEND DASHBOARD

**Proyecto:** Black Gym - Dashboard de Ventas  
**Fecha:** 4 de octubre de 2025  
**Objetivo:** Conectar el frontend del dashboard con los endpoints del backend

---

## 📋 Tabla de Contenido

1. [Resumen de Endpoints Disponibles](#resumen-de-endpoints-disponibles)
2. [Configuración Inicial del Frontend](#configuración-inicial-del-frontend)
3. [Servicio de API (Fetch)](#servicio-de-api)
4. [Implementación por Gráfica](#implementación-por-gráfica)
   - [Gráfica: Evolución Diaria](#gráfica-evolución-diaria)
   - [Gráfica: Evolución Mensual](#gráfica-evolución-mensual)
   - [Gráfica: Comparativa Anual](#gráfica-comparativa-anual)
   - [Gráfica: Top Productos (Pareto)](#gráfica-top-productos-pareto)
   - [Gráfica: Distribución por Categoría](#gráfica-distribución-por-categoría)
5. [Componentes de React](#componentes-de-react)
6. [Manejo de Estados y Errores](#manejo-de-estados-y-errores)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Resumen de Endpoints Disponibles

### Base URL
```
http://localhost:3000/api/dashboard
```

### Endpoints Implementados

| Endpoint                    | Método | Descripción                          | Para qué gráfica        |
|-----------------------------|--------|--------------------------------------|-------------------------|
| `/general`                  | GET    | Métricas generales (KPIs)            | Cards principales       |
| `/ventas-periodo`           | GET    | Evolución mensual o diaria           | Gráficos de líneas/barras |
| `/comparativa-anual`        | GET    | Comparación entre 2 años             | Gráfico comparativo     |
| `/top-productos`            | GET    | Top N productos con Pareto           | Gráfico de barras + Pareto |
| `/analisis-categorias`      | GET    | Distribución de ventas por categoría | Gráfico de pastel (pie) |

---

## ⚙️ Configuración Inicial del Frontend

### 1. Variables de Entorno

Crea un archivo `.env` en tu proyecto frontend:

```env
# .env (React, Next.js, Astro)
VITE_API_BASE_URL=http://localhost:3000
VITE_ADMIN_USER=tu_usuario_admin
VITE_ADMIN_PASSWORD=tu_password_admin

# Para Next.js usa NEXT_PUBLIC_
# NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

⚠️ **IMPORTANTE:** Nunca subas el archivo `.env` a Git. Agrégalo al `.gitignore`.

### 2. Estructura de Carpetas Sugerida

```
src/
├── services/
│   └── dashboardApi.js      # Llamadas a la API
├── components/
│   ├── dashboard/
│   │   ├── KPICards.jsx
│   │   ├── EvolucionDiaria.jsx
│   │   ├── EvolucionMensual.jsx
│   │   ├── ComparativaAnual.jsx
│   │   ├── TopProductos.jsx
│   │   └── DistribucionCategorias.jsx
│   └── common/
│       ├── Loading.jsx
│       └── ErrorMessage.jsx
├── hooks/
│   └── useDashboard.js      # Custom hooks
└── utils/
    └── formatters.js         # Funciones de formato
```

---

## 🔌 Servicio de API

### Archivo: `src/services/dashboardApi.js`

```javascript
/**
 * Servicio para comunicación con la API del Dashboard
 * Backend: Black Gym - Node.js/Express/Supabase
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const ADMIN_USER = import.meta.env.VITE_ADMIN_USER;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

/**
 * Headers de autenticación requeridos por el backend
 */
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'x-admin-user': ADMIN_USER,
  'x-admin-password': ADMIN_PASSWORD
});

/**
 * Manejo de errores estandarizado
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data; // El backend envuelve los datos en { success, message, data }
};

/**
 * API del Dashboard
 */
export const dashboardApi = {
  
  /**
   * Obtener métricas generales del dashboard
   * @param {number} year - Año a consultar
   * @param {number|null} month - Mes opcional (1-12)
   * @returns {Promise<Object>}
   */
  async getGeneral(year, month = null) {
    const params = new URLSearchParams({ year: year.toString() });
    if (month) params.append('month', month.toString());
    
    const response = await fetch(
      `${API_BASE_URL}/api/dashboard/general?${params}`,
      { headers: getAuthHeaders() }
    );
    
    return handleResponse(response);
  },

  /**
   * Obtener evolución de ventas por periodo
   * @param {number} year - Año a consultar
   * @param {string} tipo - 'mensual' o 'diario'
   * @param {number|null} month - Mes (requerido si tipo='diario')
   * @returns {Promise<Object>}
   */
  async getVentasPorPeriodo(year, tipo = 'mensual', month = null) {
    const params = new URLSearchParams({ 
      year: year.toString(),
      tipo 
    });
    if (month) params.append('month', month.toString());
    
    const response = await fetch(
      `${API_BASE_URL}/api/dashboard/ventas-periodo?${params}`,
      { headers: getAuthHeaders() }
    );
    
    return handleResponse(response);
  },

  /**
   * Obtener comparativa entre dos años
   * @param {number} yearBase - Año base (anterior)
   * @param {number} yearComparacion - Año a comparar (actual)
   * @returns {Promise<Object>}
   */
  async getComparativaAnual(yearBase, yearComparacion) {
    const params = new URLSearchParams({ 
      year: yearComparacion.toString(),
      year_comparacion: yearBase.toString()
    });
    
    const response = await fetch(
      `${API_BASE_URL}/api/dashboard/comparativa-anual?${params}`,
      { headers: getAuthHeaders() }
    );
    
    return handleResponse(response);
  },

  /**
   * Obtener top productos más vendidos
   * @param {number} year - Año a consultar
   * @param {number} limit - Cantidad de productos (default: 10, max: 50)
   * @param {number|null} month - Mes opcional
   * @returns {Promise<Object>}
   */
  async getTopProductos(year, limit = 10, month = null) {
    const params = new URLSearchParams({ 
      year: year.toString(),
      limit: limit.toString()
    });
    if (month) params.append('month', month.toString());
    
    const response = await fetch(
      `${API_BASE_URL}/api/dashboard/top-productos?${params}`,
      { headers: getAuthHeaders() }
    );
    
    return handleResponse(response);
  },

  /**
   * Obtener análisis de ventas por categoría
   * @param {number} year - Año a consultar
   * @param {number|null} month - Mes opcional
   * @returns {Promise<Object>}
   */
  async getAnalisisCategorias(year, month = null) {
    const params = new URLSearchParams({ year: year.toString() });
    if (month) params.append('month', month.toString());
    
    const response = await fetch(
      `${API_BASE_URL}/api/dashboard/analisis-categorias?${params}`,
      { headers: getAuthHeaders() }
    );
    
    return handleResponse(response);
  }
};

export default dashboardApi;
```

---

## 📊 Implementación por Gráfica

### 🔵 Gráfica: Evolución Diaria

**Endpoint:** `GET /api/dashboard/ventas-periodo?year=2025&month=3&tipo=diario`

#### Componente React + Chart.js

```jsx
// components/dashboard/EvolucionDiaria.jsx
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import dashboardApi from '../../services/dashboardApi';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function EvolucionDiaria({ year, month }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Llamar al endpoint
        const response = await dashboardApi.getVentasPorPeriodo(year, 'diario', month);
        
        setData(response);
      } catch (err) {
        console.error('Error al cargar evolución diaria:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (year && month) {
      fetchData();
    }
  }, [year, month]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!data || !data.evolucion || data.evolucion.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No hay datos disponibles para este periodo
      </div>
    );
  }

  // Preparar datos para Chart.js
  const chartData = {
    labels: data.evolucion.map(item => `Día ${item.dia}`),
    datasets: [
      {
        label: 'Ventas',
        data: data.evolucion.map(item => item.ventas),
        borderColor: 'rgb(59, 130, 246)', // Azul
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4, // Curva suave
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: `Evolución Diaria - ${data.periodo.mesNombre} ${year}`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const item = data.evolucion[context.dataIndex];
            return [
              `Ventas: Q ${item.ventas.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`,
              `Órdenes: ${item.ordenes}`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return 'Q ' + value.toLocaleString('es-GT');
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">📊 Evolución Diaria</h3>
        <p className="text-sm text-gray-500">
          Total: Q {data.resumen.totalVentas.toLocaleString('es-GT', { minimumFractionDigits: 2 })} 
          {' '}en {data.resumen.totalOrdenes} órdenes
        </p>
      </div>
      
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
```

#### Instalación de Chart.js

```bash
npm install chart.js react-chartjs-2
```

---

### 📈 Gráfica: Evolución Mensual

**Endpoint:** `GET /api/dashboard/ventas-periodo?year=2025&tipo=mensual`

```jsx
// components/dashboard/EvolucionMensual.jsx
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import dashboardApi from '../../services/dashboardApi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function EvolucionMensual({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await dashboardApi.getVentasPorPeriodo(year, 'mensual');
        setData(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (year) {
      fetchData();
    }
  }, [year]);

  if (loading) return <div className="text-center py-8">Cargando...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!data) return null;

  const chartData = {
    labels: data.evolucion.map(item => item.mesAbreviado),
    datasets: [
      {
        label: 'Ventas',
        data: data.evolucion.map(item => item.ventas),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: `Evolución Mensual ${year}`,
        font: { size: 16, weight: 'bold' }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Ventas: Q ${context.parsed.y.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => 'Q ' + value.toLocaleString('es-GT')
        }
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">📈 Evolución Mensual</h3>
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
```

---

### 🔄 Gráfica: Comparativa Anual

**Endpoint:** `GET /api/dashboard/comparativa-anual?year=2025&year_comparacion=2024`

```jsx
// components/dashboard/ComparativaAnual.jsx
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import dashboardApi from '../../services/dashboardApi';

export default function ComparativaAnual({ year1, year2 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await dashboardApi.getComparativaAnual(year1, year2);
        setData(response);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (year1 && year2) {
      fetchData();
    }
  }, [year1, year2]);

  if (loading || !data) return <div>Cargando...</div>;

  const chartData = {
    labels: data.evolucionYear1.map(item => item.mesAbreviado),
    datasets: [
      {
        label: `${year1}`,
        data: data.evolucionYear1.map(item => item.ventas),
        borderColor: 'rgb(156, 163, 175)', // Gris
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        tension: 0.4
      },
      {
        label: `${year2}`,
        data: data.evolucionYear2.map(item => item.ventas),
        borderColor: 'rgb(59, 130, 246)', // Azul
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: `Comparativa ${year1} vs ${year2} (+${data.resumen.crecimiento.toFixed(2)}%)`,
        font: { size: 16, weight: 'bold' }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: Q ${context.parsed.y.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => 'Q ' + value.toLocaleString('es-GT')
        }
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">📈 Comparativa Anual</h3>
        <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">{year1}</p>
            <p className="font-semibold">Q {data.resumen.ventasYear1.toLocaleString('es-GT')}</p>
          </div>
          <div>
            <p className="text-gray-500">{year2}</p>
            <p className="font-semibold">Q {data.resumen.ventasYear2.toLocaleString('es-GT')}</p>
          </div>
          <div>
            <p className="text-gray-500">Crecimiento</p>
            <p className={`font-semibold ${data.resumen.crecimiento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.resumen.crecimiento >= 0 ? '+' : ''}{data.resumen.crecimiento.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
```

---

### 🏆 Gráfica: Top Productos (Pareto)

**Endpoint:** `GET /api/dashboard/top-productos?year=2025&limit=10`

```jsx
// components/dashboard/TopProductos.jsx
import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import dashboardApi from '../../services/dashboardApi';

export default function TopProductos({ year, month = null, limit = 10 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await dashboardApi.getTopProductos(year, limit, month);
        setData(response);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (year) {
      fetchData();
    }
  }, [year, month, limit]);

  if (loading || !data) return <div>Cargando...</div>;

  // Gráfico combinado: Barras (ventas) + Línea (Pareto acumulado)
  const chartData = {
    labels: data.productos.map(p => p.nombre.substring(0, 20) + '...'),
    datasets: [
      {
        type: 'bar',
        label: 'Ventas',
        data: data.productos.map(p => p.totalVentas),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: '% Acumulado (Pareto)',
        data: data.productos.map(p => p.porcentajeAcumulado),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        yAxisID: 'y1',
        pointRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: `Top ${limit} Productos - Análisis Pareto`,
        font: { size: 16, weight: 'bold' }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (context.dataset.label === 'Ventas') {
              return `Ventas: Q ${context.parsed.y.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
            } else {
              return `Acumulado: ${context.parsed.y.toFixed(2)}%`;
            }
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        ticks: {
          callback: value => 'Q ' + value.toLocaleString('es-GT')
        }
      },
      y1: {
        type: 'linear',
        position: 'right',
        min: 0,
        max: 100,
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          callback: value => value + '%'
        }
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">🏆 Top Productos</h3>
        <p className="text-sm text-gray-500">
          Total: Q {data.resumen.totalVentas.toLocaleString('es-GT', { minimumFractionDigits: 2 })} 
          {' '}({data.resumen.totalUnidades} unidades)
        </p>
      </div>
      <div className="h-96">
        <Bar data={chartData} options={options} />
      </div>
      
      {/* Tabla de productos */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ventas</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unidades</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">% Total</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">% Acum.</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.productos.map((producto) => (
              <tr key={producto.id} className={producto.porcentajeAcumulado <= 80 ? 'bg-blue-50' : ''}>
                <td className="px-4 py-2 text-sm">{producto.posicion}</td>
                <td className="px-4 py-2 text-sm font-medium">{producto.nombre}</td>
                <td className="px-4 py-2 text-sm text-right">
                  Q {producto.totalVentas.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-2 text-sm text-right">{producto.unidadesVendidas}</td>
                <td className="px-4 py-2 text-sm text-right">{producto.porcentajeDelTotal}%</td>
                <td className="px-4 py-2 text-sm text-right font-semibold">{producto.porcentajeAcumulado}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-gray-500">
          <span className="inline-block w-3 h-3 bg-blue-50 border border-blue-200 mr-1"></span>
          Productos que generan el 80% de las ventas (Regla de Pareto)
        </p>
      </div>
    </div>
  );
}
```

---

### 🍩 Gráfica: Distribución por Categoría

**Endpoint:** `GET /api/dashboard/analisis-categorias?year=2025`

```jsx
// components/dashboard/DistribucionCategorias.jsx
import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import dashboardApi from '../../services/dashboardApi';

ChartJS.register(ArcElement, Tooltip, Legend);

// Paleta de colores vibrantes
const COLORES = [
  'rgb(59, 130, 246)',   // Azul
  'rgb(16, 185, 129)',   // Verde
  'rgb(245, 158, 11)',   // Amarillo
  'rgb(239, 68, 68)',    // Rojo
  'rgb(139, 92, 246)',   // Violeta
  'rgb(236, 72, 153)',   // Rosa
  'rgb(20, 184, 166)',   // Teal
  'rgb(251, 146, 60)',   // Naranja
];

export default function DistribucionCategorias({ year, month = null }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await dashboardApi.getAnalisisCategorias(year, month);
        setData(response);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (year) {
      fetchData();
    }
  }, [year, month]);

  if (loading || !data) return <div>Cargando...</div>;

  const chartData = {
    labels: data.categorias.map(cat => cat.nombre),
    datasets: [
      {
        label: 'Ventas por Categoría',
        data: data.categorias.map(cat => cat.totalVentas),
        backgroundColor: COLORES.slice(0, data.categorias.length),
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right'
      },
      title: {
        display: true,
        text: `Distribución por Categoría ${year}`,
        font: { size: 16, weight: 'bold' }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const categoria = data.categorias[context.dataIndex];
            return [
              `${categoria.nombre}`,
              `Q ${categoria.totalVentas.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`,
              `${categoria.porcentaje}% del total`,
              `${categoria.productosUnicos} productos`
            ];
          }
        }
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">🍩 Distribución por Categoría</h3>
      <div className="h-80">
        <Pie data={chartData} options={options} />
      </div>
      
      {/* Lista de categorías */}
      <div className="mt-6 space-y-2">
        {data.categorias.map((categoria, index) => (
          <div key={categoria.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: COLORES[index] }}
              ></div>
              <span className="text-sm font-medium">{categoria.nombre}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">
                Q {categoria.totalVentas.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">{categoria.porcentaje}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎛️ Componente Principal del Dashboard

```jsx
// pages/Dashboard.jsx o components/Dashboard.jsx
import React, { useState } from 'react';
import EvolucionDiaria from './dashboard/EvolucionDiaria';
import EvolucionMensual from './dashboard/EvolucionMensual';
import ComparativaAnual from './dashboard/ComparativaAnual';
import TopProductos from './dashboard/TopProductos';
import DistribucionCategorias from './dashboard/DistribucionCategorias';

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Ventas</h1>
          <p className="text-gray-600">Black Gym - Análisis en tiempo real</p>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Año
            </label>
            <select 
              value={year} 
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2"
            >
              {[2023, 2024, 2025].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mes
            </label>
            <select 
              value={month} 
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>
                  {new Date(2025, m - 1).toLocaleString('es-GT', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid de Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Evolución Diaria */}
          <div className="col-span-1 lg:col-span-2">
            <EvolucionDiaria year={year} month={month} />
          </div>

          {/* Evolución Mensual */}
          <div>
            <EvolucionMensual year={year} />
          </div>

          {/* Comparativa Anual */}
          <div>
            <ComparativaAnual year1={year - 1} year2={year} />
          </div>

          {/* Top Productos */}
          <div className="col-span-1 lg:col-span-2">
            <TopProductos year={year} month={null} limit={10} />
          </div>

          {/* Distribución por Categoría */}
          <div>
            <DistribucionCategorias year={year} month={null} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Problema: "No se muestran datos en las gráficas"

**Solución:**

1. **Verificar que el backend esté corriendo:**
```bash
# En la carpeta del backend
node server.js
# Debe mostrar: "Servidor corriendo en puerto 3000"
```

2. **Verificar las credenciales en .env:**
```env
VITE_ADMIN_USER=tu_usuario_admin
VITE_ADMIN_PASSWORD=tu_password_admin
```

3. **Verificar en consola del navegador:**
```javascript
// Abrir DevTools (F12) y verificar errores
// Debería ver peticiones a http://localhost:3000/api/dashboard/*
```

4. **Probar endpoint directamente:**
```bash
curl -X GET "http://localhost:3000/api/dashboard/ventas-periodo?year=2025&tipo=mensual" \
  -H "x-admin-user: tu_usuario" \
  -H "x-admin-password: tu_password"
```

### Problema: Error 401 Unauthorized

**Causas comunes:**
- Headers mal configurados
- Usuario/contraseña incorrectos
- Headers no se están enviando

**Solución:**
```javascript
// Verificar que getAuthHeaders() esté funcionando
console.log(getAuthHeaders());
// Debe mostrar: { 'x-admin-user': '...', 'x-admin-password': '...' }
```

### Problema: Error CORS

**Solución en el backend (`server.js`):**
```javascript
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:5173', // Tu puerto de Vite/React
  credentials: true
}));
```

### Problema: Gráfica se ve cortada

**Solución:**
```jsx
// Asegurarse de que el contenedor tenga altura definida
<div className="h-80"> {/* h-80 = 320px */}
  <Line data={chartData} options={options} />
</div>
```

---

## ✅ Checklist de Integración

- [ ] Backend corriendo en puerto 3000
- [ ] Variables de entorno configuradas (.env)
- [ ] Chart.js instalado (`npm install chart.js react-chartjs-2`)
- [ ] Servicio dashboardApi.js creado
- [ ] Componentes de gráficas creados
- [ ] Probar cada endpoint individualmente
- [ ] Verificar datos en consola antes de graficar
- [ ] Manejo de errores implementado
- [ ] Loading states agregados
- [ ] Formato de moneda (Q) aplicado

---

## 📞 Soporte Adicional

Si necesitas ayuda específica con alguna gráfica o tienes un error particular, comparte:

1. El mensaje de error completo
2. La respuesta del endpoint (desde Network tab)
3. El código del componente que está fallando

---

**Última Actualización:** 4 de octubre de 2025  
**Versión:** 1.0.0  
**Compatibilidad:** React 18+, Chart.js 4+
