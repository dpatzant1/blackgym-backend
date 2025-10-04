import { ORDER_STATUS } from './constants.js';

/**
 * Definición de transiciones permitidas entre estados de órdenes
 * Cada estado tiene un array de estados a los que puede transicionar
 */
export const TRANSICIONES_PERMITIDAS = {
  'pendiente': ['pagado', 'cancelado'],
  'pagado': ['enviado', 'cancelado'],
  'enviado': ['completado'],
  'completado': [],
  'cancelado': []
};

/**
 * Verificar si una transición de estado es permitida
 * @param {string} estadoActual - Estado actual de la orden
 * @param {string} estadoNuevo - Estado nuevo propuesto
 * @returns {boolean} true si la transición es permitida
 */
export const puedeTransicionar = (estadoActual, estadoNuevo) => {
  // Normalizar estados a lowercase
  const estadoActualNorm = estadoActual?.toString().trim().toLowerCase();
  const estadoNuevoNorm = estadoNuevo?.toString().trim().toLowerCase();

  // Validar que ambos estados existan
  if (!estadoActualNorm || !estadoNuevoNorm) {
    return false;
  }

  // Validar que el estado actual sea válido
  if (!TRANSICIONES_PERMITIDAS.hasOwnProperty(estadoActualNorm)) {
    return false;
  }

  // Validar que el estado nuevo sea válido
  const estadosValidos = Object.values(ORDER_STATUS);
  if (!estadosValidos.includes(estadoNuevoNorm)) {
    return false;
  }

  // Verificar si la transición está permitida
  const transicionesPermitidas = TRANSICIONES_PERMITIDAS[estadoActualNorm];
  return transicionesPermitidas.includes(estadoNuevoNorm);
};

/**
 * Obtener los siguientes estados permitidos desde un estado actual
 * @param {string} estadoActual - Estado actual de la orden
 * @returns {Array<string>} Array de estados permitidos
 */
export const obtenerSiguientesEstadosPermitidos = (estadoActual) => {
  // Normalizar estado a lowercase
  const estadoActualNorm = estadoActual?.toString().trim().toLowerCase();

  // Validar que el estado actual exista
  if (!estadoActualNorm) {
    return [];
  }

  // Validar que el estado actual sea válido
  if (!TRANSICIONES_PERMITIDAS.hasOwnProperty(estadoActualNorm)) {
    return [];
  }

  // Retornar array de estados permitidos
  return TRANSICIONES_PERMITIDAS[estadoActualNorm];
};

/**
 * Verificar si un estado es final (no permite más transiciones)
 * @param {string} estado - Estado a verificar
 * @returns {boolean} true si es un estado final
 */
export const esEstadoFinal = (estado) => {
  const estadoNorm = estado?.toString().trim().toLowerCase();
  
  if (!estadoNorm || !TRANSICIONES_PERMITIDAS.hasOwnProperty(estadoNorm)) {
    return false;
  }

  return TRANSICIONES_PERMITIDAS[estadoNorm].length === 0;
};

/**
 * Obtener información detallada de un estado
 * @param {string} estado - Estado a consultar
 * @returns {Object} Información del estado
 */
export const obtenerInfoEstado = (estado) => {
  const estadoNorm = estado?.toString().trim().toLowerCase();

  if (!estadoNorm || !TRANSICIONES_PERMITIDAS.hasOwnProperty(estadoNorm)) {
    return {
      valido: false,
      estado: estado,
      mensaje: 'Estado no válido'
    };
  }

  const siguientesEstados = TRANSICIONES_PERMITIDAS[estadoNorm];
  const esFinal = siguientesEstados.length === 0;

  // Descripciones amigables de estados
  const descripciones = {
    'pendiente': 'Orden creada, esperando confirmación de pago',
    'pagado': 'Pago confirmado, esperando procesamiento',
    'enviado': 'Orden enviada al cliente',
    'completado': 'Orden finalizada exitosamente',
    'cancelado': 'Orden cancelada'
  };

  return {
    valido: true,
    estado: estadoNorm,
    descripcion: descripciones[estadoNorm] || 'Sin descripción',
    siguientesEstados: siguientesEstados,
    esEstadoFinal: esFinal,
    permiteTransiciones: !esFinal
  };
};

/**
 * Validar y obtener mensaje de error para una transición inválida
 * @param {string} estadoActual - Estado actual
 * @param {string} estadoNuevo - Estado nuevo propuesto
 * @returns {Object} Resultado de validación con mensaje
 */
export const validarYObtenerMensaje = (estadoActual, estadoNuevo) => {
  const estadoActualNorm = estadoActual?.toString().trim().toLowerCase();
  const estadoNuevoNorm = estadoNuevo?.toString().trim().toLowerCase();

  // Validar estados
  if (!estadoActualNorm) {
    return {
      valida: false,
      mensaje: 'El estado actual es requerido',
      estadosPermitidos: []
    };
  }

  if (!estadoNuevoNorm) {
    return {
      valida: false,
      mensaje: 'El estado nuevo es requerido',
      estadosPermitidos: []
    };
  }

  // Verificar si el estado actual es válido
  if (!TRANSICIONES_PERMITIDAS.hasOwnProperty(estadoActualNorm)) {
    const estadosValidos = Object.keys(TRANSICIONES_PERMITIDAS).join(', ');
    return {
      valida: false,
      mensaje: `El estado actual "${estadoActual}" no es válido. Estados válidos: ${estadosValidos}`,
      estadosPermitidos: []
    };
  }

  // Obtener estados permitidos
  const estadosPermitidos = TRANSICIONES_PERMITIDAS[estadoActualNorm];

  // Verificar si el estado nuevo es válido
  const estadosValidos = Object.values(ORDER_STATUS);
  if (!estadosValidos.includes(estadoNuevoNorm)) {
    return {
      valida: false,
      mensaje: `El estado nuevo "${estadoNuevo}" no es válido. Estados válidos: ${estadosValidos.join(', ')}`,
      estadosPermitidos: estadosPermitidos
    };
  }

  // Verificar si la transición es permitida
  if (!estadosPermitidos.includes(estadoNuevoNorm)) {
    // Verificar si es un estado final
    if (estadosPermitidos.length === 0) {
      return {
        valida: false,
        mensaje: `El estado "${estadoActual}" es final y no permite cambios`,
        estadosPermitidos: []
      };
    }

    return {
      valida: false,
      mensaje: `No se puede cambiar de estado "${estadoActual}" a "${estadoNuevo}". Estados permitidos: ${estadosPermitidos.join(', ')}`,
      estadosPermitidos: estadosPermitidos
    };
  }

  // Transición válida
  return {
    valida: true,
    mensaje: `Transición de "${estadoActual}" a "${estadoNuevo}" permitida`,
    estadosPermitidos: estadosPermitidos
  };
};

/**
 * Obtener el flujo completo de estados (para documentación o UI)
 * @returns {Object} Mapa completo de transiciones
 */
export const obtenerFlujoCompleto = () => {
  return {
    estados: Object.keys(TRANSICIONES_PERMITIDAS),
    transiciones: TRANSICIONES_PERMITIDAS,
    descripciones: {
      'pendiente': 'Orden creada, esperando confirmación de pago',
      'pagado': 'Pago confirmado, esperando procesamiento',
      'enviado': 'Orden enviada al cliente',
      'completado': 'Orden finalizada exitosamente',
      'cancelado': 'Orden cancelada'
    },
    estadosFinales: Object.keys(TRANSICIONES_PERMITIDAS).filter(
      estado => TRANSICIONES_PERMITIDAS[estado].length === 0
    ),
    estadoInicial: 'pendiente'
  };
};

/**
 * Obtener el camino más corto entre dos estados (si existe)
 * @param {string} estadoOrigen - Estado de origen
 * @param {string} estadoDestino - Estado de destino
 * @returns {Array<string>|null} Array con el camino o null si no hay camino
 */
export const obtenerCaminoEntreEstados = (estadoOrigen, estadoDestino) => {
  const origen = estadoOrigen?.toString().trim().toLowerCase();
  const destino = estadoDestino?.toString().trim().toLowerCase();

  // Validar estados
  if (!origen || !destino) {
    return null;
  }

  if (!TRANSICIONES_PERMITIDAS.hasOwnProperty(origen) || 
      !TRANSICIONES_PERMITIDAS.hasOwnProperty(destino)) {
    return null;
  }

  // Si el origen y destino son iguales
  if (origen === destino) {
    return [origen];
  }

  // BFS para encontrar el camino más corto
  const cola = [[origen]];
  const visitados = new Set([origen]);

  while (cola.length > 0) {
    const camino = cola.shift();
    const estadoActual = camino[camino.length - 1];

    // Obtener siguientes estados posibles
    const siguientes = TRANSICIONES_PERMITIDAS[estadoActual];

    for (const siguiente of siguientes) {
      if (siguiente === destino) {
        return [...camino, siguiente];
      }

      if (!visitados.has(siguiente)) {
        visitados.add(siguiente);
        cola.push([...camino, siguiente]);
      }
    }
  }

  // No hay camino
  return null;
};
