import { obtenerUrlCompleta, obtenerHeaders } from '../config/gemini.js';

/**
 * Utilidades para interactuar con Gemini AI
 * Genera rutinas de entrenamiento y recomendaciones de productos
 */

/**
 * Realiza un request a la API de Gemini
 * @param {string} prompt - Prompt para enviar a Gemini
 * @returns {Promise<string>} - Respuesta de Gemini
 */
async function hacerRequestGemini(prompt) {
  try {
    const url = obtenerUrlCompleta();
    const headers = obtenerHeaders();

    const body = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Error de Gemini API: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();

    // Extraer el texto de la respuesta
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text;
      }
    }

    throw new Error('Respuesta de Gemini en formato inesperado');

  } catch (error) {
    console.error('[Gemini] Error en request:', error.message);
    throw error;
  }
}

/**
 * Generar rutina de entrenamiento personalizada con IA
 * @param {Object} perfilUsuario - Perfil del usuario
 * @param {string} perfilUsuario.nombre - Nombre del usuario
 * @param {string} perfilUsuario.objetivo - Objetivo fitness (ej: "ganar masa muscular")
 * @param {number} perfilUsuario.peso - Peso en kg
 * @param {number} perfilUsuario.altura - Altura en cm
 * @returns {Promise<Object>} - Rutina generada {nombre, descripcion, ejercicios}
 */
export async function generarRutina(perfilUsuario) {
  try {
    const { nombre, objetivo, peso, altura } = perfilUsuario;

    // Construir prompt para Gemini
    const prompt = `
Eres un entrenador personal experto. Genera una rutina de entrenamiento personalizada para:

**Perfil del usuario:**
- Nombre: ${nombre || 'Usuario'}
- Objetivo: ${objetivo || 'mantenerse en forma'}
- Peso: ${peso ? `${peso} kg` : 'no especificado'}
- Altura: ${altura ? `${altura} cm` : 'no especificada'}

**Instrucciones:**
1. Crea una rutina de 3-5 días a la semana
2. Incluye ejercicios específicos con series y repeticiones
3. Adapta la rutina al objetivo del usuario
4. Proporciona la respuesta en formato JSON válido con esta estructura exacta:

{
  "nombre": "Nombre descriptivo de la rutina",
  "descripcion": "Descripción breve de la rutina y su enfoque",
  "nivelDificultad": "principiante|intermedio|avanzado",
  "duracionEstimada": número_de_minutos_por_sesion,
  "diasSemana": ["lunes", "miércoles", "viernes"],
  "ejercicios": [
    {
      "dia": "lunes",
      "orden": 1,
      "ejercicio": "Nombre del ejercicio",
      "series": 3,
      "repeticiones": "12",
      "descanso": 60,
      "notas": "Consejos de forma o técnica",
      "grupoMuscular": "pecho|espalda|piernas|brazos|hombros|core"
    }
  ]
}

**IMPORTANTE:** 
- Responde ÚNICAMENTE con el JSON, sin texto adicional antes o después
- Asegúrate de que el JSON sea válido
- Incluye al menos 3-5 ejercicios por día de entrenamiento
- Varía los grupos musculares según el objetivo
`;

    console.log('[Gemini] Generando rutina para:', nombre, '-', objetivo);

    // Hacer request a Gemini
    const respuesta = await hacerRequestGemini(prompt);

    // Intentar extraer JSON de la respuesta
    let rutinaJSON;
    try {
      // Buscar JSON en la respuesta (puede estar entre ```json o simplemente el JSON)
      const jsonMatch = respuesta.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        rutinaJSON = JSON.parse(jsonMatch[0]);
      } else {
        rutinaJSON = JSON.parse(respuesta);
      }
    } catch (parseError) {
      console.error('[Gemini] Error al parsear respuesta JSON:', parseError);
      console.error('[Gemini] Respuesta recibida:', respuesta);
      throw new Error('La IA generó una respuesta en formato incorrecto');
    }

    // Validar estructura mínima
    if (!rutinaJSON.nombre || !rutinaJSON.ejercicios || !Array.isArray(rutinaJSON.ejercicios)) {
      throw new Error('La rutina generada no tiene la estructura esperada');
    }

    console.log('[Gemini] Rutina generada exitosamente:', rutinaJSON.nombre);

    return {
      success: true,
      data: rutinaJSON
    };

  } catch (error) {
    console.error('[Gemini] Error al generar rutina:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generar recomendaciones de productos basadas en perfil del usuario
 * @param {Object} perfilUsuario - Perfil del usuario
 * @param {string} perfilUsuario.nombre - Nombre del usuario
 * @param {string} perfilUsuario.objetivo - Objetivo fitness
 * @param {number} perfilUsuario.peso - Peso en kg
 * @param {number} perfilUsuario.altura - Altura en cm
 * @param {Array} productos - Lista de productos disponibles
 * @returns {Promise<Object>} - Recomendaciones {productos: [{id, motivo, relevancia}]}
 */
export async function generarRecomendaciones(perfilUsuario, productos) {
  try {
    const { nombre, objetivo, peso, altura } = perfilUsuario;

    // Limitar productos para no exceder límite de tokens
    const productosResumen = productos.slice(0, 50).map(p => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      precio: p.precio
    }));

    // Construir prompt para Gemini
    const prompt = `
Eres un nutricionista y entrenador personal experto. Analiza el perfil del usuario y recomienda productos relevantes:

**Perfil del usuario:**
- Nombre: ${nombre || 'Usuario'}
- Objetivo: ${objetivo || 'mantenerse en forma'}
- Peso: ${peso ? `${peso} kg` : 'no especificado'}
- Altura: ${altura ? `${altura} cm` : 'no especificada'}

**Productos disponibles:**
${JSON.stringify(productosResumen, null, 2)}

**Instrucciones:**
1. Selecciona los 5-8 productos MÁS relevantes para el objetivo del usuario
2. Explica por qué cada producto es beneficioso
3. Ordena por relevancia (más relevante primero)
4. Proporciona la respuesta en formato JSON válido con esta estructura exacta:

{
  "recomendaciones": [
    {
      "productoId": id_del_producto,
      "motivo": "Explicación clara y concisa de por qué es recomendado para este usuario",
      "relevancia": numero_entre_0_y_1
    }
  ]
}

**IMPORTANTE:**
- Responde ÚNICAMENTE con el JSON, sin texto adicional
- Asegúrate de que el JSON sea válido
- Solo recomienda productos que realmente ayuden con el objetivo
- El campo "relevancia" debe ser un número decimal entre 0.0 y 1.0
- Máximo 8 recomendaciones
`;

    console.log('[Gemini] Generando recomendaciones para:', nombre, '-', objetivo);

    // Hacer request a Gemini
    const respuesta = await hacerRequestGemini(prompt);

    // Intentar extraer JSON de la respuesta
    let recomendacionesJSON;
    try {
      const jsonMatch = respuesta.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recomendacionesJSON = JSON.parse(jsonMatch[0]);
      } else {
        recomendacionesJSON = JSON.parse(respuesta);
      }
    } catch (parseError) {
      console.error('[Gemini] Error al parsear respuesta JSON:', parseError);
      console.error('[Gemini] Respuesta recibida:', respuesta);
      throw new Error('La IA generó una respuesta en formato incorrecto');
    }

    // Validar estructura mínima
    if (!recomendacionesJSON.recomendaciones || !Array.isArray(recomendacionesJSON.recomendaciones)) {
      throw new Error('Las recomendaciones generadas no tienen la estructura esperada');
    }

    // Filtrar recomendaciones válidas (que el producto exista)
    const productosIds = new Set(productos.map(p => p.id));
    const recomendacionesValidas = recomendacionesJSON.recomendaciones.filter(rec => 
      productosIds.has(rec.productoId)
    );

    console.log(
      `[Gemini] Recomendaciones generadas: ${recomendacionesValidas.length} productos`
    );

    return {
      success: true,
      data: recomendacionesValidas
    };

  } catch (error) {
    console.error('[Gemini] Error al generar recomendaciones:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Rate limiting simple para evitar exceder límites de API
 * Mantiene un contador de requests por minuto
 */
const rateLimiter = {
  requests: [],
  maxRequestsPerMinute: 15, // Límite de la API de Gemini

  /**
   * Verifica si se puede hacer un request
   * @returns {boolean}
   */
  puedeHacerRequest() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Limpiar requests antiguos
    this.requests = this.requests.filter(timestamp => timestamp > oneMinuteAgo);

    // Verificar límite
    if (this.requests.length >= this.maxRequestsPerMinute) {
      return false;
    }

    // Registrar nuevo request
    this.requests.push(now);
    return true;
  },

  /**
   * Obtiene el tiempo de espera sugerido en milisegundos
   * @returns {number}
   */
  tiempoEsperaSugerido() {
    if (this.requests.length === 0) return 0;

    const now = Date.now();
    const oldestRequest = Math.min(...this.requests);
    const tiempoDesdeOldest = now - oldestRequest;
    const tiempoRestante = 60000 - tiempoDesdeOldest;

    return Math.max(0, tiempoRestante);
  }
};

/**
 * Wrapper para funciones que usan Gemini con rate limiting
 * @param {Function} fn - Función a ejecutar
 * @returns {Promise<any>}
 */
export async function conRateLimiting(fn) {
  if (!rateLimiter.puedeHacerRequest()) {
    const tiempoEspera = rateLimiter.tiempoEsperaSugerido();
    throw new Error(
      `Límite de requests excedido. Intenta nuevamente en ${Math.ceil(tiempoEspera / 1000)} segundos.`
    );
  }

  return await fn();
}

/**
 * Obtener estadísticas de uso de rate limiter
 * @returns {Object}
 */
export function obtenerEstadisticasRateLimit() {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const requestsEnUltimoMinuto = rateLimiter.requests.filter(t => t > oneMinuteAgo).length;

  return {
    requestsEnUltimoMinuto,
    limiteMaximo: rateLimiter.maxRequestsPerMinute,
    disponibles: rateLimiter.maxRequestsPerMinute - requestsEnUltimoMinuto,
    tiempoEsperaSugerido: rateLimiter.tiempoEsperaSugerido()
  };
}
