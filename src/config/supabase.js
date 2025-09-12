import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan las variables de entorno de Supabase');
}

// Crear cliente de Supabase con configuración optimizada
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false // No necesitamos sesiones para este proyecto
  },
  db: {
    schema: 'public'
  }
});

// Función para verificar la conexión
export const testConnection = async () => {
  try {
    console.log('🔄 Probando conexión con Supabase...');
    
    // Probar conexión básica
    const { data, error } = await supabase
      .from('productos')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Error al conectar con Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Conexión exitosa con Supabase');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
};

// Función para verificar que todas las tablas existan
export const verifyTables = async () => {
  const tables = ['productos', 'categorias', 'ordenes', 'detalle_orden', 'producto_categoria'];
  const results = {};
  
  console.log('🔍 Verificando estructura de base de datos...');
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Error en tabla ${table}:`, error.message);
        results[table] = false;
      } else {
        console.log(`✅ Tabla ${table} verificada`);
        results[table] = true;
      }
    } catch (error) {
      console.error(`❌ Error al verificar tabla ${table}:`, error.message);
      results[table] = false;
    }
  }
  
  const allTablesValid = Object.values(results).every(result => result === true);
  
  if (allTablesValid) {
    console.log('✅ Todas las tablas están disponibles');
  } else {
    console.warn('⚠️ Algunas tablas no están disponibles');
  }
  
  return { allTablesValid, tables: results };
};

// Función para obtener información de la base de datos
export const getDatabaseInfo = async () => {
  try {
    const info = {
      url: supabaseUrl,
      connected: false,
      tables: {},
      timestamp: new Date().toISOString()
    };

    // Verificar conexión
    info.connected = await testConnection();
    
    if (info.connected) {
      // Verificar tablas
      const tablesInfo = await verifyTables();
      info.tables = tablesInfo.tables;
    }

    return info;
  } catch (error) {
    console.error('Error al obtener información de la base de datos:', error);
    return {
      url: supabaseUrl,
      connected: false,
      tables: {},
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Función para logging de consultas (solo en desarrollo)
export const logQuery = (table, operation, params = {}) => {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] DB Query: ${operation.toUpperCase()} on ${table}`, params);
  }
};
