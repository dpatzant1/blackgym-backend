import { supabase } from '../config/supabase.js';
import { hashPassword, verifyPassword } from '../utils/auth.js';
import { ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Nombre de la tabla en Supabase
 */
const TABLE_NAME = 'usuarios';

/**
 * Modelo para manejo de usuarios finales (clientes de la app)
 */
export const UsuarioModel = {
  
  /**
   * Crear un nuevo usuario
   * @param {Object} data - Datos del usuario {nombre, email, password, objetivo, peso, altura}
   * @returns {Promise<Object>} - {success, data, error}
   */
  async crear(data) {
    try {
      const { nombre, email, password, objetivo, peso, altura } = data;
      
      // Validar campos requeridos
      if (!nombre || !email || !password) {
        return {
          success: false,
          error: 'Nombre, email y password son requeridos'
        };
      }

      // Verificar si el email ya existe
      const existingUser = await this.buscarPorEmail(email);
      if (existingUser.success && existingUser.data) {
        return {
          success: false,
          error: 'El email ya está registrado'
        };
      }
      
      // Encriptar contraseña
      const passwordHash = await hashPassword(password);
      
      // Preparar datos de inserción
      const insertData = {
        nombre,
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        objetivo: objetivo || null,
        peso: peso || null,
        altura: altura || null,
        activo: true
      };
      
      // Insertar en la base de datos
      const { data: userData, error } = await supabase
        .from(TABLE_NAME)
        .insert([insertData])
        .select('id, nombre, email, objetivo, peso, altura, fecha_registro, activo')
        .single();

      if (error) {
        console.error('[UsuarioModel] Error al crear usuario:', error);
        return {
          success: false,
          error: `Error al crear usuario: ${error.message}`
        };
      }

      return {
        success: true,
        data: userData,
        message: 'Usuario creado correctamente'
      };
      
    } catch (error) {
      console.error('[UsuarioModel] Error interno al crear usuario:', error);
      return {
        success: false,
        error: `Error interno al crear usuario: ${error.message}`
      };
    }
  },

  /**
   * Buscar usuario por email
   * @param {string} email - Email del usuario
   * @returns {Promise<Object>} - {success, data, error}
   */
  async buscarPorEmail(email) {
    try {
      if (!email) {
        return {
          success: false,
          error: 'Email es requerido'
        };
      }

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('email', email.toLowerCase().trim())
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
          error: `Error al buscar usuario: ${error.message}`
        };
      }

      return {
        success: true,
        data
      };
      
    } catch (error) {
      console.error('[UsuarioModel] Error al buscar por email:', error);
      return {
        success: false,
        error: `Error interno al buscar usuario: ${error.message}`
      };
    }
  },

  /**
   * Buscar usuario por ID
   * @param {number} id - ID del usuario
   * @returns {Promise<Object>} - {success, data, error}
   */
  async buscarPorId(id) {
    try {
      if (!id || isNaN(id)) {
        return {
          success: false,
          error: 'ID de usuario inválido'
        };
      }

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('id, nombre, email, objetivo, peso, altura, fecha_registro, activo')
        .eq('id', id)
        .eq('activo', true)
        .maybeSingle(); // Usar maybeSingle() en lugar de single()

      if (error) {
        console.error('[UsuarioModel] Error al buscar por ID:', error);
        return {
          success: false,
          error: `Error al buscar usuario: ${error.message}`
        };
      }

      // Si no se encontró el usuario
      if (!data) {
        return {
          success: false,
          error: ERROR_MESSAGES.NOT_FOUND('Usuario')
        };
      }

      return {
        success: true,
        data
      };
      
    } catch (error) {
      console.error('[UsuarioModel] Error al buscar por ID:', error);
      return {
        success: false,
        error: `Error interno al buscar usuario: ${error.message}`
      };
    }
  },

  /**
   * Actualizar perfil de usuario
   * @param {number} id - ID del usuario
   * @param {Object} datos - Datos a actualizar {nombre, email}
   * @returns {Promise<Object>} - {success, data, error}
   */
  async actualizar(id, datos) {
    try {
      console.log(`[UsuarioModel] Actualizando usuario ID: ${id}, datos:`, datos);
      
      if (!id || isNaN(id)) {
        return {
          success: false,
          error: 'ID de usuario inválido'
        };
      }

      // Verificar que el usuario existe
      console.log(`[UsuarioModel] Verificando existencia del usuario ${id}...`);
      const usuarioExiste = await this.buscarPorId(id);
      console.log(`[UsuarioModel] Resultado buscarPorId:`, usuarioExiste);
      
      if (!usuarioExiste.success || !usuarioExiste.data) {
        console.log(`[UsuarioModel] Usuario ${id} no encontrado`);
        return {
          success: false,
          error: ERROR_MESSAGES.NOT_FOUND('Usuario')
        };
      }

      // Preparar datos para actualizar (solo nombre y email)
      const updateData = {};
      
      if (datos.nombre !== undefined) {
        updateData.nombre = datos.nombre;
      }
      
      if (datos.email !== undefined) {
        const emailNormalizado = datos.email.toLowerCase().trim();
        
        console.log(`[UsuarioModel] Verificando disponibilidad de email: ${emailNormalizado}`);
        
        // Verificar que el nuevo email no esté en uso por otro usuario
        const { data: emailEnUso, error: emailError } = await supabase
          .from(TABLE_NAME)
          .select('id')
          .eq('email', emailNormalizado)
          .neq('id', id)
          .maybeSingle(); // Usar maybeSingle() en lugar de single()

        console.log(`[UsuarioModel] Resultado verificación email:`, { emailEnUso, emailError });

        // Si hay error en la consulta (no por falta de resultados)
        if (emailError && emailError.code !== 'PGRST116') {
          console.error('[UsuarioModel] Error al verificar email:', emailError);
          return {
            success: false,
            error: 'Error al verificar disponibilidad del email'
          };
        }

        if (emailEnUso) {
          console.log(`[UsuarioModel] Email ${emailNormalizado} ya está en uso`);
          return {
            success: false,
            error: 'El email ya está en uso por otro usuario'
          };
        }
        
        updateData.email = emailNormalizado;
      }

      // Si no hay nada que actualizar
      if (Object.keys(updateData).length === 0) {
        console.log(`[UsuarioModel] No hay datos para actualizar`);
        return {
          success: false,
          error: 'No hay datos para actualizar'
        };
      }

      console.log(`[UsuarioModel] Ejecutando UPDATE con datos:`, updateData);
      
      // Actualizar en la base de datos
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updateData)
        .eq('id', id)
        .select('id, nombre, email, objetivo, peso, altura, fecha_registro, activo')
        .single();

      console.log(`[UsuarioModel] Resultado UPDATE:`, { data, error });

      if (error) {
        console.error('[UsuarioModel] Error en UPDATE:', error);
        return {
          success: false,
          error: `Error al actualizar usuario: ${error.message}`
        };
      }

      console.log(`[UsuarioModel] Usuario ${id} actualizado exitosamente`);
      
      return {
        success: true,
        data,
        message: 'Perfil actualizado correctamente'
      };
      
    } catch (error) {
      console.error('[UsuarioModel] Error al actualizar:', error);
      return {
        success: false,
        error: `Error interno al actualizar usuario: ${error.message}`
      };
    }
  },

  /**
   * Actualizar datos fitness del usuario (objetivo, peso, altura)
   * @param {number} id - ID del usuario
   * @param {Object} datos - {objetivo, peso, altura}
   * @returns {Promise<Object>} - {success, data, error}
   */
  async actualizarObjetivo(id, datos) {
    try {
      if (!id || isNaN(id)) {
        return {
          success: false,
          error: 'ID de usuario inválido'
        };
      }

      // Verificar que el usuario existe
      const usuarioExiste = await this.buscarPorId(id);
      if (!usuarioExiste.success || !usuarioExiste.data) {
        return {
          success: false,
          error: ERROR_MESSAGES.NOT_FOUND('Usuario')
        };
      }

      // Preparar datos para actualizar
      const updateData = {};
      
      if (datos.objetivo !== undefined) {
        updateData.objetivo = datos.objetivo;
      }
      
      if (datos.peso !== undefined) {
        updateData.peso = datos.peso;
      }
      
      if (datos.altura !== undefined) {
        updateData.altura = datos.altura;
      }

      // Si no hay nada que actualizar
      if (Object.keys(updateData).length === 0) {
        return {
          success: false,
          error: 'No hay datos fitness para actualizar'
        };
      }

      // Actualizar en la base de datos
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updateData)
        .eq('id', id)
        .select('id, nombre, email, objetivo, peso, altura, fecha_registro, activo')
        .single();

      if (error) {
        return {
          success: false,
          error: `Error al actualizar datos fitness: ${error.message}`
        };
      }

      return {
        success: true,
        data,
        message: 'Datos fitness actualizados correctamente'
      };
      
    } catch (error) {
      console.error('[UsuarioModel] Error al actualizar objetivo:', error);
      return {
        success: false,
        error: `Error interno al actualizar datos fitness: ${error.message}`
      };
    }
  },

  /**
   * Eliminar cuenta de usuario (soft delete)
   * @param {number} id - ID del usuario
   * @returns {Promise<Object>} - {success, data, error}
   */
  async eliminar(id) {
    try {
      if (!id || isNaN(id)) {
        return {
          success: false,
          error: 'ID de usuario inválido'
        };
      }

      // Verificar que el usuario existe
      const usuarioExiste = await this.buscarPorId(id);
      if (!usuarioExiste.success || !usuarioExiste.data) {
        return {
          success: false,
          error: ERROR_MESSAGES.NOT_FOUND('Usuario')
        };
      }

      // Soft delete: marcar como inactivo
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({ activo: false })
        .eq('id', id)
        .select('id, nombre, email, activo')
        .single();

      if (error) {
        return {
          success: false,
          error: `Error al eliminar usuario: ${error.message}`
        };
      }

      return {
        success: true,
        data,
        message: 'Cuenta eliminada correctamente'
      };
      
    } catch (error) {
      console.error('[UsuarioModel] Error al eliminar:', error);
      return {
        success: false,
        error: `Error interno al eliminar usuario: ${error.message}`
      };
    }
  },

  /**
   * Verificar credenciales de usuario (para login)
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña en texto plano
   * @returns {Promise<Object>} - {success, data, error}
   */
  async verificarCredenciales(email, password) {
    try {
      if (!email || !password) {
        return {
          success: false,
          error: 'Email y password son requeridos'
        };
      }

      // Buscar usuario
      const usuarioResult = await this.buscarPorEmail(email);
      
      if (!usuarioResult.success) {
        return usuarioResult;
      }

      if (!usuarioResult.data) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      const usuario = usuarioResult.data;
      
      // Verificar que el usuario esté activo
      if (!usuario.activo) {
        return {
          success: false,
          error: 'Esta cuenta ha sido desactivada'
        };
      }
      
      // Verificar contraseña
      const passwordMatch = await verifyPassword(password, usuario.password_hash);
      
      if (!passwordMatch) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      // Retornar datos sin password_hash
      const { password_hash, ...usuarioSinPassword } = usuario;
      
      return {
        success: true,
        data: usuarioSinPassword,
        message: 'Credenciales válidas'
      };
      
    } catch (error) {
      console.error('[UsuarioModel] Error al verificar credenciales:', error);
      return {
        success: false,
        error: `Error interno al verificar credenciales: ${error.message}`
      };
    }
  },

  /**
   * Actualizar contraseña de usuario
   * @param {number} id - ID del usuario
   * @param {string} passwordActual - Contraseña actual
   * @param {string} passwordNueva - Nueva contraseña
   * @returns {Promise<Object>} - {success, data, error}
   */
  async cambiarPassword(id, passwordActual, passwordNueva) {
    try {
      if (!id || isNaN(id)) {
        return {
          success: false,
          error: 'ID de usuario inválido'
        };
      }

      if (!passwordActual || !passwordNueva) {
        return {
          success: false,
          error: 'Contraseña actual y nueva son requeridas'
        };
      }

      // Obtener usuario con password_hash
      const { data: usuario, error: errorBuscar } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', id)
        .eq('activo', true)
        .single();

      if (errorBuscar || !usuario) {
        return {
          success: false,
          error: ERROR_MESSAGES.NOT_FOUND('Usuario')
        };
      }

      // Verificar contraseña actual
      const passwordMatch = await verifyPassword(passwordActual, usuario.password_hash);
      
      if (!passwordMatch) {
        return {
          success: false,
          error: 'La contraseña actual es incorrecta'
        };
      }

      // Encriptar nueva contraseña
      const passwordHash = await hashPassword(passwordNueva);
      
      // Actualizar en la base de datos
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({ password_hash: passwordHash })
        .eq('id', id)
        .select('id, nombre, email')
        .single();

      if (error) {
        return {
          success: false,
          error: `Error al cambiar contraseña: ${error.message}`
        };
      }

      return {
        success: true,
        data,
        message: 'Contraseña actualizada correctamente'
      };
      
    } catch (error) {
      console.error('[UsuarioModel] Error al cambiar password:', error);
      return {
        success: false,
        error: `Error interno al cambiar contraseña: ${error.message}`
      };
    }
  },

  /**
   * Obtener estadísticas del usuario
   * @param {number} id - ID del usuario
   * @returns {Promise<Object>} - {success, data, error}
   */
  async obtenerEstadisticas(id) {
    try {
      if (!id || isNaN(id)) {
        return {
          success: false,
          error: 'ID de usuario inválido'
        };
      }

      // Contar rutinas del usuario
      const { count: totalRutinas } = await supabase
        .from('rutinas')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', id)
        .eq('activa', true);

      // Contar entrenamientos
      const { count: totalEntrenamientos } = await supabase
        .from('historial_entrenamientos')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', id)
        .eq('completado', true);

      // Contar órdenes del usuario
      const { count: totalOrdenes } = await supabase
        .from('ordenes')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', id);

      // Obtener última medición de progreso
      const { data: ultimoProgreso } = await supabase
        .from('progreso_usuario')
        .select('peso, fecha_medicion')
        .eq('usuario_id', id)
        .order('fecha_medicion', { ascending: false })
        .limit(1)
        .single();

      return {
        success: true,
        data: {
          totalRutinas: totalRutinas || 0,
          totalEntrenamientos: totalEntrenamientos || 0,
          totalOrdenes: totalOrdenes || 0,
          ultimoProgreso: ultimoProgreso || null
        }
      };

    } catch (error) {
      console.error('[UsuarioModel] Error al obtener estadísticas:', error);
      return {
        success: false,
        error: `Error interno al obtener estadísticas: ${error.message}`
      };
    }
  }
};
