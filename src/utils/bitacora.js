import { BitacoraModel } from '../models/bitacora.js';
import { ACCIONES_BITACORA } from './constants.js';

/**
 * Utilidades para registro en bitácora
 * Estas funciones facilitan el registro de acciones administrativas
 * con manejo de errores silencioso para no interrumpir operaciones principales
 */

/**
 * Registrar una acción en la bitácora
 * @param {number} adminId - ID del administrador que realiza la acción
 * @param {string} accion - Código de la acción (debe estar en ACCIONES_BITACORA)
 * @param {string} descripcion - Descripción detallada de la acción
 * @returns {Promise<Object>} - {success, data, error}
 */
export async function registrarAccion(adminId, accion, descripcion) {
  try {
    // Validar parámetros básicos
    if (!accion) {
      console.warn('[Bitácora] Advertencia: Acción no especificada');
      return {
        success: false,
        error: 'Acción es requerida'
      };
    }

    // Verificar que la acción sea válida
    const accionesValidas = Object.values(ACCIONES_BITACORA);
    if (!accionesValidas.includes(accion)) {
      console.warn(`[Bitácora] Advertencia: Acción no reconocida: ${accion}`);
      // Aún así registramos, pero advertimos
    }

    // Preparar datos para bitácora
    const datosBitacora = {
      admin_id: adminId || null, // Permitir null para acciones del sistema
      accion: accion,
      descripcion: descripcion || `Acción ${accion} ejecutada`
    };

    // Registrar en la base de datos
    const resultado = await BitacoraModel.crear(datosBitacora);

    if (!resultado.success) {
      console.error('[Bitácora] Error al registrar:', resultado.error);
    }

    return resultado;

  } catch (error) {
    // Manejo de errores silencioso - no debe interrumpir operaciones principales
    console.error('[Bitácora] Error inesperado al registrar acción:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generar descripción detallada según el tipo de acción y datos proporcionados
 * @param {string} accion - Código de la acción
 * @param {Object} datos - Datos relevantes para la descripción
 * @returns {string} - Descripción formateada
 */
export function generarDescripcion(accion, datos = {}) {
  try {
    switch (accion) {
      // Autenticación
      case ACCIONES_BITACORA.LOGIN:
        return `Usuario "${datos.usuario || 'desconocido'}" inició sesión${datos.ip ? ` desde IP ${datos.ip}` : ''}`;

      case ACCIONES_BITACORA.LOGOUT:
        return `Usuario "${datos.usuario || 'desconocido'}" cerró sesión`;

      case ACCIONES_BITACORA.CAMBIAR_PASSWORD:
        return `Usuario "${datos.usuario || 'desconocido'}" cambió su contraseña`;

      // Productos
      case ACCIONES_BITACORA.CREAR_PRODUCTO:
        return `Producto creado: ID=${datos.id}, Nombre="${datos.nombre}"${datos.precio ? `, Precio=$${datos.precio}` : ''}${datos.stock !== undefined ? `, Stock=${datos.stock}` : ''}`;

      case ACCIONES_BITACORA.EDITAR_PRODUCTO:
        let cambiosProducto = [`Producto ID=${datos.id} actualizado`];
        if (datos.nombre) cambiosProducto.push(`Nombre="${datos.nombre}"`);
        if (datos.precioAnterior && datos.precioNuevo) {
          cambiosProducto.push(`Precio: $${datos.precioAnterior} → $${datos.precioNuevo}`);
        }
        if (datos.stockAnterior !== undefined && datos.stockNuevo !== undefined) {
          cambiosProducto.push(`Stock: ${datos.stockAnterior} → ${datos.stockNuevo}`);
        }
        return cambiosProducto.join('\n- ');

      case ACCIONES_BITACORA.ELIMINAR_PRODUCTO:
        return `Producto eliminado: ID=${datos.id}${datos.nombre ? `, Nombre="${datos.nombre}"` : ''}`;

      case ACCIONES_BITACORA.ACTUALIZAR_STOCK:
        return `Stock actualizado para Producto ID=${datos.id}${datos.nombre ? ` "${datos.nombre}"` : ''}: ${datos.stockAnterior} → ${datos.stockNuevo} (${datos.stockNuevo > datos.stockAnterior ? '+' : ''}${datos.stockNuevo - datos.stockAnterior})`;

      // Categorías
      case ACCIONES_BITACORA.CREAR_CATEGORIA:
        return `Categoría creada: ID=${datos.id}, Nombre="${datos.nombre}"${datos.descripcion ? `, Descripción="${datos.descripcion}"` : ''}`;

      case ACCIONES_BITACORA.EDITAR_CATEGORIA:
        let cambiosCategoria = [`Categoría ID=${datos.id} actualizada`];
        if (datos.nombreAnterior && datos.nombreNuevo) {
          cambiosCategoria.push(`Nombre: "${datos.nombreAnterior}" → "${datos.nombreNuevo}"`);
        } else if (datos.nombre) {
          cambiosCategoria.push(`Nombre="${datos.nombre}"`);
        }
        return cambiosCategoria.join('\n- ');

      case ACCIONES_BITACORA.ELIMINAR_CATEGORIA:
        return `Categoría eliminada: ID=${datos.id}${datos.nombre ? `, Nombre="${datos.nombre}"` : ''}`;

      case ACCIONES_BITACORA.ASIGNAR_CATEGORIAS:
        return `Categorías asignadas a Producto ID=${datos.productoId}${datos.productoNombre ? ` "${datos.productoNombre}"` : ''}: ${datos.categorias ? datos.categorias.join(', ') : 'N/A'}`;

      // Órdenes
      case ACCIONES_BITACORA.CREAR_ORDEN:
        return `Orden creada: ID=${datos.id}, Cliente="${datos.cliente}"${datos.total ? `, Total=$${datos.total}` : ''}${datos.estado ? `, Estado=${datos.estado}` : ''}`;

      case ACCIONES_BITACORA.EDITAR_ORDEN:
        return `Orden ID=${datos.id} editada, Cliente="${datos.cliente}"${datos.total ? `, Total=$${datos.total}` : ''}`;

      case ACCIONES_BITACORA.CANCELAR_ORDEN:
        return `Orden ID=${datos.id} cancelada\n- Cliente: ${datos.cliente}\n- Total: $${datos.total}${datos.razon ? `\n- Razón: ${datos.razon}` : ''}`;

      case ACCIONES_BITACORA.CAMBIAR_ESTADO_ORDEN:
        return `Orden ID=${datos.id} cambió de estado\n- Estado anterior: ${datos.estadoAnterior}\n- Estado nuevo: ${datos.estadoNuevo}\n- Cliente: ${datos.cliente}\n- Total: $${datos.total}`;

      // Administradores
      case ACCIONES_BITACORA.CREAR_ADMIN:
        return `Administrador creado: ID=${datos.id}, Usuario="${datos.usuario}"${datos.rol ? `, Rol="${datos.rol}"` : ''}`;

      case ACCIONES_BITACORA.ASIGNAR_ROL:
        return `Rol asignado a Administrador ID=${datos.adminId}${datos.usuario ? ` "${datos.usuario}"` : ''}\n- Rol anterior: ${datos.rolAnterior || 'Sin rol'}\n- Rol nuevo: ${datos.rolNuevo}`;

      // Uploads
      case ACCIONES_BITACORA.SUBIR_IMAGEN:
        return `Imagen subida: ${datos.nombre || 'archivo'}${datos.url ? `\n- URL: ${datos.url}` : ''}${datos.tamano ? `\n- Tamaño: ${datos.tamano}` : ''}`;

      case ACCIONES_BITACORA.ELIMINAR_IMAGEN:
        return `Imagen eliminada: ${datos.nombre || datos.url || 'archivo'}`;

      // Default
      default:
        // Si no hay template específico, generar descripción genérica
        let descripcionGenerica = `Acción ${accion} ejecutada`;
        if (Object.keys(datos).length > 0) {
          const detalles = Object.entries(datos)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          descripcionGenerica += `\n- Detalles: ${detalles}`;
        }
        return descripcionGenerica;
    }
  } catch (error) {
    console.error('[Bitácora] Error al generar descripción:', error.message);
    return `Acción ${accion} ejecutada (Error al generar descripción detallada)`;
  }
}

/**
 * Extraer ID del administrador desde el objeto request
 * @param {Object} req - Objeto request de Express
 * @returns {number|null} - ID del administrador o null
 */
export function obtenerAdminIdDeRequest(req) {
  try {
    // Intentar obtener de diferentes posibles ubicaciones
    return req.adminId || req.admin?.id || req.user?.id || null;
  } catch (error) {
    console.error('[Bitácora] Error al obtener admin ID del request:', error.message);
    return null;
  }
}

/**
 * Registrar acción con generación automática de descripción
 * Función de conveniencia que combina generarDescripcion y registrarAccion
 * @param {number} adminId - ID del administrador
 * @param {string} accion - Código de la acción
 * @param {Object} datos - Datos para generar descripción
 * @returns {Promise<Object>} - Resultado del registro
 */
export async function registrarAccionConDatos(adminId, accion, datos = {}) {
  try {
    const descripcion = generarDescripcion(accion, datos);
    return await registrarAccion(adminId, accion, descripcion);
  } catch (error) {
    console.error('[Bitácora] Error en registrarAccionConDatos:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Registrar acción desde un request (helper combinado)
 * @param {Object} req - Objeto request de Express
 * @param {string} accion - Código de la acción
 * @param {string|Object} descripcionODatos - Descripción directa o datos para generar
 * @returns {Promise<Object>} - Resultado del registro
 */
export async function registrarDesdeRequest(req, accion, descripcionODatos) {
  try {
    const adminId = obtenerAdminIdDeRequest(req);

    if (!adminId) {
      console.warn('[Bitácora] Advertencia: No se pudo obtener admin ID del request');
    }

    // Si es string, usar como descripción directa
    if (typeof descripcionODatos === 'string') {
      return await registrarAccion(adminId, accion, descripcionODatos);
    }

    // Si es objeto, generar descripción
    if (typeof descripcionODatos === 'object') {
      return await registrarAccionConDatos(adminId, accion, descripcionODatos);
    }

    // Si no se proporciona nada, usar descripción básica
    return await registrarAccion(adminId, accion, `Acción ${accion} ejecutada`);

  } catch (error) {
    console.error('[Bitácora] Error en registrarDesdeRequest:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Wrapper para ejecutar función con registro automático en bitácora
 * Útil para envolver operaciones y registrarlas automáticamente
 * @param {Function} fn - Función a ejecutar
 * @param {Object} options - Opciones { adminId, accion, datos, onError }
 * @returns {Promise<any>} - Resultado de la función
 */
export async function conRegistroBitacora(fn, options = {}) {
  const { adminId, accion, datos = {}, onError = null } = options;

  try {
    // Ejecutar función principal
    const resultado = await fn();

    // Registrar en bitácora si hay acción definida
    if (accion) {
      await registrarAccionConDatos(adminId, accion, datos).catch(err => {
        console.error('[Bitácora] Error al registrar (no crítico):', err.message);
      });
    }

    return resultado;

  } catch (error) {
    // Registrar error si se proporciona callback
    if (onError && typeof onError === 'function') {
      onError(error);
    }

    // Registrar intento fallido en bitácora
    if (accion) {
      const descripcionError = generarDescripcion(accion, {
        ...datos,
        error: error.message,
        exitoso: false
      });

      await registrarAccion(adminId, accion, `ERROR: ${descripcionError}`).catch(err => {
        console.error('[Bitácora] Error al registrar fallo:', err.message);
      });
    }

    // Re-lanzar el error para que la operación principal lo maneje
    throw error;
  }
}

// Exportar objeto con todas las funciones para importación alternativa
export default {
  registrarAccion,
  generarDescripcion,
  obtenerAdminIdDeRequest,
  registrarAccionConDatos,
  registrarDesdeRequest,
  conRegistroBitacora
};
