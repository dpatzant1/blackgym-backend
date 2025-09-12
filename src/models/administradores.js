import { supabase } from '../config/supabase.js';
import { hashPassword, verifyPassword } from '../utils/auth.js';
import { TABLES, ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Modelo para manejo de administradores
 */
export const AdministradorModel = {
  
  /**
   * Crear un nuevo administrador
   * @param {Object} data - Datos del administrador {usuario, password}
   * @returns {Promise<Object>} - {success, data, error}
   */
  async crear(data) {
    try {
      const { usuario, password } = data;
      
      // Verificar si el usuario ya existe
      const existingUser = await this.buscarPorUsuario(usuario);
      if (existingUser.success && existingUser.data) {
        return {
          success: false,
          error: ERROR_MESSAGES.ALREADY_EXISTS('Usuario')
        };
      }
      
      // Encriptar contraseña
      const passwordHash = await hashPassword(password);
      
      // Insertar en la base de datos
      const { data: adminData, error } = await supabase
        .from(TABLES.ADMINISTRADORES)
        .insert([
          {
            usuario,
            password_hash: passwordHash
          }
        ])
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Error al crear administrador: ${error.message}`
        };
      }

      // Remover password_hash de la respuesta
      const { password_hash, ...adminSinPassword } = adminData;

      return {
        success: true,
        data: adminSinPassword
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Error interno al crear administrador: ${error.message}`
      };
    }
  },

  /**
   * Buscar administrador por usuario
   * @param {string} usuario - Nombre de usuario
   * @returns {Promise<Object>} - {success, data, error}
   */
  async buscarPorUsuario(usuario) {
    try {
      const { data, error } = await supabase
        .from(TABLES.ADMINISTRADORES)
        .select('*')
        .eq('usuario', usuario)
        .single();

      if (error) {
        // Si no se encuentra, no es un error crítico
        if (error.code === 'PGRST116') {
          return {
            success: true,
            data: null
          };
        }
        
        return {
          success: false,
          error: `Error al buscar administrador: ${error.message}`
        };
      }

      return {
        success: true,
        data
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Error interno al buscar administrador: ${error.message}`
      };
    }
  },

  /**
   * Buscar administrador por ID
   * @param {number} id - ID del administrador
   * @returns {Promise<Object>} - {success, data, error}
   */
  async buscarPorId(id) {
    try {
      const { data, error } = await supabase
        .from(TABLES.ADMINISTRADORES)
        .select('id, usuario, creado_en')
        .eq('id', id)
        .single();

      if (error) {
        return {
          success: false,
          error: `Error al buscar administrador: ${error.message}`
        };
      }

      return {
        success: true,
        data
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Error interno al buscar administrador: ${error.message}`
      };
    }
  },

  /**
   * Actualizar contraseña de un administrador
   * @param {string} usuario - Nombre de usuario
   * @param {string} nuevaPassword - Nueva contraseña
   * @returns {Promise<Object>} - {success, data, error}
   */
  async actualizarPassword(usuario, nuevaPassword) {
    try {
      // Verificar que el usuario existe
      const adminResult = await this.buscarPorUsuario(usuario);
      if (!adminResult.success || !adminResult.data) {
        return {
          success: false,
          error: ERROR_MESSAGES.NOT_FOUND('Administrador')
        };
      }

      // Encriptar nueva contraseña
      const passwordHash = await hashPassword(nuevaPassword);
      
      // Actualizar en la base de datos
      const { data, error } = await supabase
        .from(TABLES.ADMINISTRADORES)
        .update({ password_hash: passwordHash })
        .eq('usuario', usuario)
        .select('id, usuario, creado_en')
        .single();

      if (error) {
        return {
          success: false,
          error: `Error al actualizar contraseña: ${error.message}`
        };
      }

      return {
        success: true,
        data,
        message: 'Contraseña actualizada correctamente'
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Error interno al actualizar contraseña: ${error.message}`
      };
    }
  },

  /**
   * Verificar credenciales de administrador
   * @param {string} usuario - Nombre de usuario
   * @param {string} password - Contraseña en texto plano
   * @returns {Promise<Object>} - {success, data, error}
   */
  async verificarCredenciales(usuario, password) {
    try {
      // Buscar administrador
      const adminResult = await this.buscarPorUsuario(usuario);
      
      if (!adminResult.success) {
        return adminResult;
      }

      if (!adminResult.data) {
        return {
          success: false,
          error: ERROR_MESSAGES.INVALID_CREDENTIALS
        };
      }

      const admin = adminResult.data;
      
      // Verificar contraseña
      const passwordMatch = await verifyPassword(password, admin.password_hash);
      
      if (!passwordMatch) {
        return {
          success: false,
          error: ERROR_MESSAGES.INVALID_CREDENTIALS
        };
      }

      // Retornar datos sin password_hash
      const { password_hash, ...adminSinPassword } = admin;
      
      return {
        success: true,
        data: adminSinPassword,
        message: 'Credenciales válidas'
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Error interno al verificar credenciales: ${error.message}`
      };
    }
  },

  /**
   * Listar todos los administradores (sin passwords)
   * @returns {Promise<Object>} - {success, data, error}
   */
  async listarTodos() {
    try {
      const { data, error } = await supabase
        .from(TABLES.ADMINISTRADORES)
        .select('id, usuario, creado_en')
        .order('creado_en', { ascending: false });

      if (error) {
        return {
          success: false,
          error: `Error al listar administradores: ${error.message}`
        };
      }

      return {
        success: true,
        data
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Error interno al listar administradores: ${error.message}`
      };
    }
  },

  /**
   * Verificar si existe al menos un administrador
   * @returns {Promise<Object>} - {success, data, error}
   */
  async existeAdmin() {
    try {
      const { data, error } = await supabase
        .from(TABLES.ADMINISTRADORES)
        .select('id')
        .limit(1);

      if (error) {
        return {
          success: false,
          error: `Error al verificar administradores: ${error.message}`
        };
      }

      return {
        success: true,
        data: { existe: data && data.length > 0 }
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Error interno al verificar administradores: ${error.message}`
      };
    }
  }
};