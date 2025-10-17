/**
 * Configuración de Gemini AI
 * 
 * Este archivo centraliza la configuración para la API de Google Gemini.
 * Se utiliza para generar rutinas de entrenamiento personalizadas y
 * recomendaciones de productos basadas en el perfil del usuario.
 */

const GEMINI_CONFIG = {
  // URL base de la API de Gemini
  apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
  
  // Modelo a utilizar
  model: 'gemini-2.5-flash',
  
  // API Key (desde variables de entorno)
  apiKey: process.env.GEMINI_API_KEY,
  
  // Configuración de generación
  generationConfig: {
    temperature: 0.7, // 0.0 = más determinista, 1.0 = más creativo
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  },
  
  // Safety settings
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ],
  
  // Rate limiting
  rateLimit: {
    requestsPerMinute: 15, // Límite de requests por minuto
    requestsPerDay: 1500   // Límite de requests por día
  }
};

/**
 * Valida que la configuración de Gemini esté correcta
 */
export function validarConfiguracion() {
  if (!GEMINI_CONFIG.apiKey) {
    throw new Error(
      'GEMINI_API_KEY no está configurada. ' +
      'Por favor, agrégala al archivo .env'
    );
  }
  
  if (GEMINI_CONFIG.apiKey.length < 30) {
    throw new Error('GEMINI_API_KEY parece ser inválida');
  }
  
  return true;
}

/**
 * Obtiene la URL completa para hacer requests a Gemini
 */
export function obtenerUrlCompleta() {
  validarConfiguracion();
  return `${GEMINI_CONFIG.apiUrl}/${GEMINI_CONFIG.model}:generateContent`;
}

/**
 * Obtiene los headers necesarios para las peticiones
 */
export function obtenerHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-goog-api-key': GEMINI_CONFIG.apiKey
  };
}

export { GEMINI_CONFIG };
