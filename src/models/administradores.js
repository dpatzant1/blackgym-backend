  import { supabase } from '../config/supabase.js';
import { hashPassword, verifyPassword } from '../utils/auth.js';
import { TABLES, ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Modelo para manejo de administradores
 */
export const AdministradorModel = {
  
  /**
   * Crear un nuevo administrador
   * @param {Object} data - Datos del administrador {usuario, password, rol_id}
   * @returns {Promise<Object>} - {success, data, error}
   */
  async crear(data) {
    try {
      const { usuario, password, rol_id } = data;
      
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
      
      // Preparar datos de inserción
      const insertData = {
        usuario,
        password_hash: passwordHash
      };
      
      // Agregar rol_id si se proporciona
      if (rol_id !== undefined && rol_id !== null) {
        insertData.rol_id = rol_id;
      }
      
      // Insertar en la base de datos
      const { data: adminData, error } = await supabase
        .from(TABLES.ADMINISTRADORES)
        .insert([insertData])
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
        .select('id, usuario, rol_id, creado_en')
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
        .select('id, usuario, rol_id, creado_en')
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
   * Listar todos los administradores (sin passwords) con información de roles
   * @returns {Promise<Object>} - {success, data, error}
   */
  async listarTodos() {
    try {
      const { data, error } = await supabase
        .from(TABLES.ADMINISTRADORES)
        .select(`
          id, 
          usuario, 
          rol_id,
          creado_en,
          roles:rol_id (
            id,
            nombre,
            descripcion
          )
        `)
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
  },

  /**
   * Asignar un rol a un administrador
   * @param {number} adminId - ID del administrador
   * @param {number} rolId - ID del rol a asignar
   * @returns {Promise<Object>} - {success, data, error}
   */
  async asignarRol(adminId, rolId) {
    try {
      // Validar que adminId es un número válido
      if (!adminId || isNaN(adminId)) {
        return {
          success: false,
          error: 'ID de administrador inválido'
        };
      }

      // Verificar que el administrador existe
      const adminExiste = await this.buscarPorId(adminId);
      if (!adminExiste.success || !adminExiste.data) {
        return {
          success: false,
          error: ERROR_MESSAGES.NOT_FOUND('Administrador')
        };
      }

      // Si rolId es null, se puede desasignar el rol
      if (rolId !== null) {
        // Validar que el rol existe (importar RolModel si es necesario)
        // Por ahora verificamos que sea un número válido
        if (isNaN(rolId)) {
          return {
            success: false,
            error: 'ID de rol inválido'
          };
        }

        // Verificar que el rol existe en la base de datos
        const { data: rolData, error: rolError } = await supabase
          .from(TABLES.ROLES)
          .select('id')
          .eq('id', rolId)
          .single();

        if (rolError || !rolData) {
          return {
            success: false,
            error: ERROR_MESSAGES.NOT_FOUND('Rol')
          };
        }
      }

      // Actualizar rol_id del administrador
      const { data, error } = await supabase
        .from(TABLES.ADMINISTRADORES)
        .update({ rol_id: rolId })
        .eq('id', adminId)
        .select(`
          id,
          usuario,
          rol_id,
          creado_en,
          roles:rol_id (
            id,
            nombre,
            descripcion
          )
        `)
        .single();

      if (error) {
        return {
          success: false,
          error: `Error al asignar rol: ${error.message}`
        };
      }

      return {
        success: true,
        data,
        message: rolId === null ? 'Rol desasignado correctamente' : 'Rol asignado correctamente'
      };

    } catch (error) {
      return {
        success: false,
        error: `Error interno al asignar rol: ${error.message}`
      };
    }
  },

  /**
   * Obtener administrador con información completa del rol
   * @param {number} adminId - ID del administrador
   * @returns {Promise<Object>} - {success, data, error}
   */
  async obtenerAdminConRol(adminId) {
    try {
      // Validar que adminId es un número válido
      if (!adminId || isNaN(adminId)) {
        return {
          success: false,
          error: 'ID de administrador inválido'
        };
      }

      const { data, error } = await supabase
        .from(TABLES.ADMINISTRADORES)
        .select(`
          id,
          usuario,
          rol_id,
          creado_en,
          roles:rol_id (
            id,
            nombre,
            descripcion
          )
        `)
        .eq('id', adminId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: ERROR_MESSAGES.NOT_FOUND('Administrador')
          };
        }
        
        return {
          success: false,
          error: `Error al obtener administrador: ${error.message}`
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      return {
        success: false,
        error: `Error interno al obtener administrador: ${error.message}`
      };
    }
  },

  /**
   * Obtener administrador por usuario con información de rol
   * @param {string} usuario - Nombre de usuario
   * @returns {Promise<Object>} - {success, data, error}
   */
  async obtenerPorUsuarioConRol(usuario) {
    try {
      if (!usuario) {
        return {
          success: false,
          error: 'Usuario es requerido'
        };
      }

      const { data, error } = await supabase
        .from(TABLES.ADMINISTRADORES)
        .select(`
          id,
          usuario,
          rol_id,
          creado_en,
          roles:rol_id (
            id,
            nombre,
            descripcion
          )
        `)
        .eq('usuario', usuario)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: true,
            data: null
          };
        }
        
        return {
          success: false,
          error: `Error al obtener administrador: ${error.message}`
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      return {
        success: false,
        error: `Error interno al obtener administrador: ${error.message}`
      };
    }
  },

  /**
   * Listar administradores por rol
   * @param {number} rolId - ID del rol
   * @returns {Promise<Object>} - {success, data, error}
   */
  async listarPorRol(rolId) {
    try {
      if (!rolId || isNaN(rolId)) {
        return {
          success: false,
          error: 'ID de rol inválido'
        };
      }

      const { data, error } = await supabase
        .from(TABLES.ADMINISTRADORES)
        .select(`
          id,
          usuario,
          rol_id,
          creado_en,
          roles:rol_id (
            id,
            nombre,
            descripcion
          )
        `)
        .eq('rol_id', rolId)
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
   * Listar administradores sin rol asignado
   * @returns {Promise<Object>} - {success, data, error}
   */
  async listarSinRol() {
    try {
      const { data, error } = await supabase
        .from(TABLES.ADMINISTRADORES)
        .select('id, usuario, rol_id, creado_en')
        .is('rol_id', null)
        .order('creado_en', { ascending: false });

      if (error) {
        return {
          success: false,
          error: `Error al listar administradores sin rol: ${error.message}`
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      return {
        success: false,
        error: `Error interno al listar administradores sin rol: ${error.message}`
      };
    }
  },

  /**
   * Obtener estadísticas de administradores
   * @returns {Promise<Object>} - {success, data, error}
   */
  async obtenerEstadisticas() {
    try {
      // Contar total de administradores
      const { data: admins, error: errorTotal } = await supabase
        .from(TABLES.ADMINISTRADORES)
        .select('id, rol_id');

      if (errorTotal) {
        return {
          success: false,
          error: `Error al obtener estadísticas: ${errorTotal.message}`
        };
      }

      const total = admins.length;
      const conRol = admins.filter(a => a.rol_id !== null).length;
      const sinRol = total - conRol;

      // Contar por rol
      const porRol = {};
      admins.forEach(admin => {
        if (admin.rol_id !== null) {
          porRol[admin.rol_id] = (porRol[admin.rol_id] || 0) + 1;
        }
      });

      return {
        success: true,
        data: {
          total,
          conRol,
          sinRol,
          distribucionPorRol: porRol
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Error interno al obtener estadísticas: ${error.message}`
      };
    }
  }
};