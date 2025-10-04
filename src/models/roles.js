import { supabase } from '../config/supabase.js';
import { TABLES, ERROR_MESSAGES, ROLES_SISTEMA, PERMISOS_POR_ROL } from '../utils/constants.js';

/**
 * Modelo para manejo de roles
 */
export const RolModel = {
  
  /**
   * Listar todos los roles disponibles
   * @returns {Promise<Object>} - {success, data, error}
   */
  async listarTodos() {
    try {
      const { data: roles, error } = await supabase
        .from(TABLES.ROLES)
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        return {
          success: false,
          error: `Error al listar roles: ${error.message}`
        };
      }

      return {
        success: true,
        data: roles
      };

    } catch (error) {
      return {
        success: false,
        error: `Error interno al listar roles: ${error.message}`
      };
    }
  },

  /**
   * Buscar rol por ID
   * @param {number} id - ID del rol
   * @returns {Promise<Object>} - {success, data, error}
   */
  async buscarPorId(id) {
    try {
      if (!id) {
        return {
          success: false,
          error: ERROR_MESSAGES.REQUIRED_FIELD('ID del rol')
        };
      }

      const { data: rol, error } = await supabase
        .from(TABLES.ROLES)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: ERROR_MESSAGES.NOT_FOUND('Rol')
          };
        }
        return {
          success: false,
          error: `Error al buscar rol: ${error.message}`
        };
      }

      return {
        success: true,
        data: rol
      };

    } catch (error) {
      return {
        success: false,
        error: `Error interno al buscar rol: ${error.message}`
      };
    }
  },

  /**
   * Buscar rol por nombre
   * @param {string} nombre - Nombre del rol
   * @returns {Promise<Object>} - {success, data, error}
   */
  async buscarPorNombre(nombre) {
    try {
      if (!nombre) {
        return {
          success: false,
          error: ERROR_MESSAGES.REQUIRED_FIELD('nombre del rol')
        };
      }

      const { data: rol, error } = await supabase
        .from(TABLES.ROLES)
        .select('*')
        .eq('nombre', nombre.toLowerCase().trim())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: ERROR_MESSAGES.NOT_FOUND('Rol')
          };
        }
        return {
          success: false,
          error: `Error al buscar rol por nombre: ${error.message}`
        };
      }

      return {
        success: true,
        data: rol
      };

    } catch (error) {
      return {
        success: false,
        error: `Error interno al buscar rol por nombre: ${error.message}`
      };
    }
  },

  /**
   * Obtener permisos de un rol específico
   * @param {number} rolId - ID del rol
   * @returns {Promise<Object>} - {success, data: {rol, permisos}, error}
   */
  async obtenerPermisos(rolId) {
    try {
      // Buscar el rol primero
      const rolResult = await this.buscarPorId(rolId);
      
      if (!rolResult.success) {
        return rolResult;
      }

      const rol = rolResult.data;
      
      // Obtener permisos desde las constantes
      const permisos = PERMISOS_POR_ROL[rol.nombre] || [];

      return {
        success: true,
        data: {
          rol: {
            id: rol.id,
            nombre: rol.nombre,
            descripcion: rol.descripcion
          },
          permisos: permisos,
          totalPermisos: permisos.length,
          tieneAccesoTotal: permisos.includes('*')
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Error interno al obtener permisos: ${error.message}`
      };
    }
  },

  /**
   * Obtener permisos de un rol por nombre
   * @param {string} nombreRol - Nombre del rol
   * @returns {Promise<Object>} - {success, data: {rol, permisos}, error}
   */
  async obtenerPermisosPorNombre(nombreRol) {
    try {
      if (!nombreRol) {
        return {
          success: false,
          error: ERROR_MESSAGES.REQUIRED_FIELD('nombre del rol')
        };
      }

      // Buscar el rol
      const rolResult = await this.buscarPorNombre(nombreRol);
      
      if (!rolResult.success) {
        return rolResult;
      }

      const rol = rolResult.data;
      
      // Obtener permisos desde las constantes
      const permisos = PERMISOS_POR_ROL[rol.nombre] || [];

      return {
        success: true,
        data: {
          rol: {
            id: rol.id,
            nombre: rol.nombre,
            descripcion: rol.descripcion
          },
          permisos: permisos,
          totalPermisos: permisos.length,
          tieneAccesoTotal: permisos.includes('*')
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Error interno al obtener permisos por nombre: ${error.message}`
      };
    }
  },

  /**
   * Verificar si un rol existe
   * @param {number} rolId - ID del rol
   * @returns {Promise<Object>} - {success, data: {existe: boolean}, error}
   */
  async existe(rolId) {
    try {
      const result = await this.buscarPorId(rolId);
      
      return {
        success: true,
        data: {
          existe: result.success && result.data !== null
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Error al verificar existencia del rol: ${error.message}`
      };
    }
  },

  /**
   * Verificar si un rol tiene un permiso específico
   * @param {number} rolId - ID del rol
   * @param {string} permiso - Permiso a verificar
   * @returns {Promise<Object>} - {success, data: {tienePermiso: boolean}, error}
   */
  async tienePermiso(rolId, permiso) {
    try {
      if (!permiso) {
        return {
          success: false,
          error: ERROR_MESSAGES.REQUIRED_FIELD('permiso')
        };
      }

      // Obtener permisos del rol
      const permisosResult = await this.obtenerPermisos(rolId);
      
      if (!permisosResult.success) {
        return permisosResult;
      }

      const { permisos, tieneAccesoTotal } = permisosResult.data;

      // Si tiene acceso total (*), tiene todos los permisos
      if (tieneAccesoTotal) {
        return {
          success: true,
          data: {
            tienePermiso: true,
            razon: 'Acceso total al sistema'
          }
        };
      }

      // Verificar si el permiso específico está en la lista
      const tienePermisoEspecifico = permisos.includes(permiso);

      // Verificar si tiene permiso mediante wildcard (ej: productos.* incluye productos.crear)
      const tienePermisoWildcard = permisos.some(p => {
        if (p.endsWith('.*')) {
          const categoria = p.replace('.*', '');
          return permiso.startsWith(categoria + '.');
        }
        return false;
      });

      return {
        success: true,
        data: {
          tienePermiso: tienePermisoEspecifico || tienePermisoWildcard,
          razon: tienePermisoEspecifico ? 'Permiso específico' : 
                 tienePermisoWildcard ? 'Permiso por categoría' : 
                 'Sin permiso'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Error al verificar permiso: ${error.message}`
      };
    }
  },

  /**
   * Contar administradores por rol
   * @param {number} rolId - ID del rol
   * @returns {Promise<Object>} - {success, data: {total: number}, error}
   */
  async contarAdministradores(rolId) {
    try {
      if (!rolId) {
        return {
          success: false,
          error: ERROR_MESSAGES.REQUIRED_FIELD('ID del rol')
        };
      }

      const { count, error } = await supabase
        .from(TABLES.ADMINISTRADORES)
        .select('*', { count: 'exact', head: true })
        .eq('rol_id', rolId);

      if (error) {
        return {
          success: false,
          error: `Error al contar administradores: ${error.message}`
        };
      }

      return {
        success: true,
        data: {
          total: count || 0
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Error interno al contar administradores: ${error.message}`
      };
    }
  },

  /**
   * Obtener estadísticas de uso de roles
   * @returns {Promise<Object>} - {success, data, error}
   */
  async obtenerEstadisticas() {
    try {
      // Obtener todos los roles
      const rolesResult = await this.listarTodos();
      
      if (!rolesResult.success) {
        return rolesResult;
      }

      const roles = rolesResult.data;

      // Contar administradores por cada rol
      const estadisticasPorRol = await Promise.all(
        roles.map(async (rol) => {
          const countResult = await this.contarAdministradores(rol.id);
          const permisosResult = await this.obtenerPermisos(rol.id);
          
          return {
            id: rol.id,
            nombre: rol.nombre,
            descripcion: rol.descripcion,
            totalAdministradores: countResult.success ? countResult.data.total : 0,
            totalPermisos: permisosResult.success ? permisosResult.data.totalPermisos : 0,
            tieneAccesoTotal: permisosResult.success ? permisosResult.data.tieneAccesoTotal : false
          };
        })
      );

      // Calcular totales
      const totalRoles = roles.length;
      const totalAdministradoresAsignados = estadisticasPorRol.reduce(
        (sum, rol) => sum + rol.totalAdministradores, 
        0
      );

      // Obtener total de administradores sin rol
      const { count: sinRol, error: errorSinRol } = await supabase
        .from(TABLES.ADMINISTRADORES)
        .select('*', { count: 'exact', head: true })
        .is('rol_id', null);

      if (errorSinRol) {
        console.warn('Error al contar administradores sin rol:', errorSinRol);
      }

      // Rol más usado
      const rolMasUsado = estadisticasPorRol.length > 0
        ? estadisticasPorRol.reduce((prev, current) => 
            (prev.totalAdministradores > current.totalAdministradores) ? prev : current
          )
        : null;

      return {
        success: true,
        data: {
          totalRoles,
          rolesDisponibles: estadisticasPorRol,
          totalAdministradoresAsignados,
          totalAdministradoresSinRol: sinRol || 0,
          rolMasUsado: rolMasUsado ? {
            nombre: rolMasUsado.nombre,
            totalAdministradores: rolMasUsado.totalAdministradores
          } : null
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Error interno al obtener estadísticas: ${error.message}`
      };
    }
  },

  /**
   * Validar que un rol ID sea válido
   * @param {number} rolId - ID del rol a validar
   * @returns {Promise<Object>} - {success, data: {valido: boolean, rol?}, error}
   */
  async validarRolId(rolId) {
    try {
      if (!rolId) {
        return {
          success: true,
          data: {
            valido: false,
            razon: 'ID de rol no proporcionado'
          }
        };
      }

      // Verificar que sea un número
      const rolIdNum = parseInt(rolId);
      if (isNaN(rolIdNum)) {
        return {
          success: true,
          data: {
            valido: false,
            razon: 'ID de rol debe ser un número'
          }
        };
      }

      // Buscar el rol
      const rolResult = await this.buscarPorId(rolIdNum);
      
      if (!rolResult.success) {
        return {
          success: true,
          data: {
            valido: false,
            razon: 'Rol no encontrado'
          }
        };
      }

      return {
        success: true,
        data: {
          valido: true,
          rol: rolResult.data
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Error al validar rol ID: ${error.message}`
      };
    }
  },

  /**
   * Verificar si un rol es de tipo administrador
   * @param {number} rolId - ID del rol
   * @returns {Promise<Object>} - {success, data: {esAdministrador: boolean}, error}
   */
  async esAdministrador(rolId) {
    try {
      const rolResult = await this.buscarPorId(rolId);
      
      if (!rolResult.success) {
        return {
          success: false,
          error: rolResult.error
        };
      }

      const esAdmin = rolResult.data.nombre === ROLES_SISTEMA.ADMINISTRADOR;

      return {
        success: true,
        data: {
          esAdministrador: esAdmin,
          nombreRol: rolResult.data.nombre
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Error al verificar si es administrador: ${error.message}`
      };
    }
  }
};
