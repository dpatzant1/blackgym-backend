import { PERMISOS, PERMISOS_POR_ROL, ROLES_SISTEMA } from './constants.js';

/**
 * Utilidades para gestión de permisos y roles
 * Proporciona funciones para verificar permisos, obtener listas de permisos por rol
 * y validar accesos basados en el sistema de roles
 */

/**
 * Verificar si un rol tiene un permiso específico
 * Soporta wildcards:
 * - '*' = todos los permisos
 * - 'modulo.*' = todos los permisos del módulo
 * - 'modulo.accion' = permiso específico
 * 
 * @param {string} rol - Nombre del rol (ej: 'administrador', 'gerente')
 * @param {string} permiso - Permiso a verificar (ej: 'productos.crear')
 * @returns {boolean} - true si el rol tiene el permiso
 */
export function verificarPermiso(rol, permiso) {
  try {
    // Validar parámetros
    if (!rol || typeof rol !== 'string') {
      console.warn('[Permisos] Rol inválido:', rol);
      return false;
    }

    if (!permiso || typeof permiso !== 'string') {
      console.warn('[Permisos] Permiso inválido:', permiso);
      return false;
    }

    // Normalizar rol (convertir a minúsculas y trimear)
    const rolNormalizado = rol.toLowerCase().trim();

    // Obtener permisos del rol
    const permisosDelRol = PERMISOS_POR_ROL[rolNormalizado];

    if (!permisosDelRol || !Array.isArray(permisosDelRol)) {
      console.warn(`[Permisos] Rol no encontrado: ${rolNormalizado}`);
      return false;
    }

    // Verificar wildcard total
    if (permisosDelRol.includes('*')) {
      return true;
    }

    // Normalizar permiso
    const permisoNormalizado = permiso.toLowerCase().trim();

    // Verificar permiso exacto
    if (permisosDelRol.includes(permisoNormalizado)) {
      return true;
    }

    // Verificar wildcard de módulo (ej: 'productos.*' cubre 'productos.crear')
    const [modulo] = permisoNormalizado.split('.');
    const wildcardModulo = `${modulo}.*`;
    
    if (permisosDelRol.includes(wildcardModulo)) {
      return true;
    }

    // No tiene el permiso
    return false;

  } catch (error) {
    console.error('[Permisos] Error al verificar permiso:', error.message);
    return false;
  }
}

/**
 * Obtener lista de permisos de un rol
 * @param {string} rol - Nombre del rol
 * @returns {Array<string>} - Lista de permisos del rol
 */
export function obtenerPermisosDeRol(rol) {
  try {
    // Validar parámetro
    if (!rol || typeof rol !== 'string') {
      console.warn('[Permisos] Rol inválido:', rol);
      return [];
    }

    // Normalizar rol
    const rolNormalizado = rol.toLowerCase().trim();

    // Obtener permisos
    const permisos = PERMISOS_POR_ROL[rolNormalizado];

    if (!permisos || !Array.isArray(permisos)) {
      console.warn(`[Permisos] Rol no encontrado: ${rolNormalizado}`);
      return [];
    }

    // Si tiene wildcard total, expandir todos los permisos
    if (permisos.includes('*')) {
      return Object.values(PERMISOS);
    }

    // Retornar copia del array
    return [...permisos];

  } catch (error) {
    console.error('[Permisos] Error al obtener permisos:', error.message);
    return [];
  }
}

/**
 * Verificar si un rol tiene múltiples permisos (AND lógico)
 * @param {string} rol - Nombre del rol
 * @param {Array<string>} permisos - Lista de permisos a verificar
 * @returns {boolean} - true si tiene TODOS los permisos
 */
export function tienePermisosMultiples(rol, permisos) {
  try {
    if (!Array.isArray(permisos) || permisos.length === 0) {
      return false;
    }

    return permisos.every(permiso => verificarPermiso(rol, permiso));

  } catch (error) {
    console.error('[Permisos] Error al verificar permisos múltiples:', error.message);
    return false;
  }
}

/**
 * Verificar si un rol tiene al menos uno de los permisos (OR lógico)
 * @param {string} rol - Nombre del rol
 * @param {Array<string>} permisos - Lista de permisos a verificar
 * @returns {boolean} - true si tiene AL MENOS UNO de los permisos
 */
export function tieneAlgunPermiso(rol, permisos) {
  try {
    if (!Array.isArray(permisos) || permisos.length === 0) {
      return false;
    }

    return permisos.some(permiso => verificarPermiso(rol, permiso));

  } catch (error) {
    console.error('[Permisos] Error al verificar algún permiso:', error.message);
    return false;
  }
}

/**
 * Verificar si un rol es administrador (tiene acceso total)
 * @param {string} rol - Nombre del rol
 * @returns {boolean} - true si es administrador
 */
export function esAdministrador(rol) {
  try {
    if (!rol || typeof rol !== 'string') {
      return false;
    }

    const rolNormalizado = rol.toLowerCase().trim();
    
    // Verificar nombre directo
    if (rolNormalizado === ROLES_SISTEMA.ADMINISTRADOR.toLowerCase()) {
      return true;
    }

    // Verificar si tiene wildcard total
    const permisos = PERMISOS_POR_ROL[rolNormalizado];
    return permisos && permisos.includes('*');

  } catch (error) {
    console.error('[Permisos] Error al verificar administrador:', error.message);
    return false;
  }
}

/**
 * Obtener todos los roles disponibles
 * @returns {Array<string>} - Lista de roles disponibles
 */
export function obtenerRolesDisponibles() {
  return Object.keys(PERMISOS_POR_ROL);
}

/**
 * Validar si un rol existe en el sistema
 * @param {string} rol - Nombre del rol
 * @returns {boolean} - true si el rol existe
 */
export function existeRol(rol) {
  try {
    if (!rol || typeof rol !== 'string') {
      return false;
    }

    const rolNormalizado = rol.toLowerCase().trim();
    return Object.keys(PERMISOS_POR_ROL).includes(rolNormalizado);

  } catch (error) {
    console.error('[Permisos] Error al validar existencia de rol:', error.message);
    return false;
  }
}

/**
 * Expandir wildcards de permisos a permisos específicos
 * Útil para mostrar todos los permisos reales de un rol
 * @param {Array<string>} permisos - Lista de permisos con posibles wildcards
 * @returns {Array<string>} - Lista expandida de permisos específicos
 */
export function expandirPermisos(permisos) {
  try {
    if (!Array.isArray(permisos)) {
      return [];
    }

    const permisosExpandidos = new Set();
    const todosLosPermisos = Object.values(PERMISOS);

    for (const permiso of permisos) {
      // Wildcard total
      if (permiso === '*') {
        return todosLosPermisos;
      }

      // Wildcard de módulo
      if (permiso.endsWith('.*')) {
        const modulo = permiso.slice(0, -2);
        const permisosDelModulo = todosLosPermisos.filter(p => p.startsWith(`${modulo}.`));
        permisosDelModulo.forEach(p => permisosExpandidos.add(p));
      } else {
        // Permiso específico
        permisosExpandidos.add(permiso);
      }
    }

    return Array.from(permisosExpandidos);

  } catch (error) {
    console.error('[Permisos] Error al expandir permisos:', error.message);
    return [];
  }
}

/**
 * Obtener mapa completo de permisos expandidos por rol
 * @returns {Object} - Objeto con roles como keys y arrays de permisos expandidos como values
 */
export function obtenerMapaPermisosExpandidos() {
  try {
    const mapa = {};

    for (const [rol, permisos] of Object.entries(PERMISOS_POR_ROL)) {
      mapa[rol] = expandirPermisos(permisos);
    }

    return mapa;

  } catch (error) {
    console.error('[Permisos] Error al obtener mapa de permisos:', error.message);
    return {};
  }
}

/**
 * Comparar permisos entre dos roles
 * @param {string} rol1 - Primer rol
 * @param {string} rol2 - Segundo rol
 * @returns {Object} - Objeto con permisos comunes, solo en rol1, solo en rol2
 */
export function compararRoles(rol1, rol2) {
  try {
    const permisos1 = new Set(expandirPermisos(obtenerPermisosDeRol(rol1)));
    const permisos2 = new Set(expandirPermisos(obtenerPermisosDeRol(rol2)));

    const comunes = [...permisos1].filter(p => permisos2.has(p));
    const soloRol1 = [...permisos1].filter(p => !permisos2.has(p));
    const soloRol2 = [...permisos2].filter(p => !permisos1.has(p));

    return {
      comunes,
      soloRol1,
      soloRol2,
      totalRol1: permisos1.size,
      totalRol2: permisos2.size
    };

  } catch (error) {
    console.error('[Permisos] Error al comparar roles:', error.message);
    return {
      comunes: [],
      soloRol1: [],
      soloRol2: [],
      totalRol1: 0,
      totalRol2: 0
    };
  }
}

/**
 * Obtener descripción legible de un permiso
 * @param {string} permiso - Permiso en formato 'modulo.accion'
 * @returns {string} - Descripción legible
 */
export function obtenerDescripcionPermiso(permiso) {
  const descripciones = {
    // Productos
    'productos.leer': 'Ver productos',
    'productos.crear': 'Crear productos',
    'productos.editar': 'Editar productos',
    'productos.eliminar': 'Eliminar productos',
    
    // Categorías
    'categorias.leer': 'Ver categorías',
    'categorias.crear': 'Crear categorías',
    'categorias.editar': 'Editar categorías',
    'categorias.eliminar': 'Eliminar categorías',
    
    // Órdenes
    'ordenes.leer': 'Ver órdenes',
    'ordenes.crear': 'Crear órdenes',
    'ordenes.editar': 'Editar órdenes',
    'ordenes.cancelar': 'Cancelar órdenes',
    'ordenes.cambiar_estado': 'Cambiar estado de órdenes',
    
    // Bitácora
    'bitacora.leer': 'Ver bitácora',
    'bitacora.exportar': 'Exportar bitácora',
    
    // Administradores
    'admins.leer': 'Ver administradores',
    'admins.gestionar': 'Gestionar administradores',
    
    // Roles
    'roles.leer': 'Ver roles',
    'roles.asignar': 'Asignar roles',
    
    // Uploads
    'uploads.subir': 'Subir archivos',
    'uploads.eliminar': 'Eliminar archivos',
    
    // Wildcards
    '*': 'Acceso total (todos los permisos)',
    'productos.*': 'Todos los permisos de productos',
    'categorias.*': 'Todos los permisos de categorías',
    'ordenes.*': 'Todos los permisos de órdenes',
    'admins.*': 'Todos los permisos de administradores',
    'roles.*': 'Todos los permisos de roles',
    'uploads.*': 'Todos los permisos de uploads'
  };

  return descripciones[permiso] || permiso;
}

/**
 * Obtener información completa de un rol
 * @param {string} rol - Nombre del rol
 * @returns {Object} - Información detallada del rol
 */
export function obtenerInfoRol(rol) {
  try {
    if (!existeRol(rol)) {
      return {
        existe: false,
        rol: null,
        permisos: [],
        permisosExpandidos: [],
        esAdmin: false,
        totalPermisos: 0
      };
    }

    const permisos = obtenerPermisosDeRol(rol);
    const permisosExpandidos = expandirPermisos(permisos);

    return {
      existe: true,
      rol: rol,
      permisos: permisos,
      permisosExpandidos: permisosExpandidos,
      esAdmin: esAdministrador(rol),
      totalPermisos: permisosExpandidos.length,
      descripcionesPermisos: permisosExpandidos.map(p => ({
        permiso: p,
        descripcion: obtenerDescripcionPermiso(p)
      }))
    };

  } catch (error) {
    console.error('[Permisos] Error al obtener info de rol:', error.message);
    return {
      existe: false,
      rol: null,
      permisos: [],
      permisosExpandidos: [],
      esAdmin: false,
      totalPermisos: 0
    };
  }
}

// Exportar todo como objeto también para importación alternativa
export default {
  verificarPermiso,
  obtenerPermisosDeRol,
  tienePermisosMultiples,
  tieneAlgunPermiso,
  esAdministrador,
  obtenerRolesDisponibles,
  existeRol,
  expandirPermisos,
  obtenerMapaPermisosExpandidos,
  compararRoles,
  obtenerDescripcionPermiso,
  obtenerInfoRol,
  
  // Re-exportar constantes para conveniencia
  PERMISOS,
  PERMISOS_POR_ROL,
  ROLES_SISTEMA
};
