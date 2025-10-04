import { registrarAccion, obtenerAdminIdDeRequest, generarDescripcion } from '../utils/bitacora.js';

/**
 * Middleware de Bitácora
 * Permite registrar acciones administrativas automáticamente en las rutas
 * con manejo de errores que no interrumpe el flujo principal
 */

/**
 * Middleware para registrar acciones en bitácora
 * Se ejecuta después de que el controlador termine exitosamente
 * 
 * Uso:
 * router.post('/', requireAdminAuth, registrarEnBitacora('CREAR_PRODUCTO'), createProducto);
 * 
 * @param {string} accion - Código de la acción a registrar
 * @param {Function|Object} opcionesOGenerador - Opciones o función generadora de descripción
 * @returns {Function} - Middleware de Express
 */
export function registrarEnBitacora(accion, opcionesOGenerador = {}) {
  return async (req, res, next) => {
    // Guardar el método send original
    const originalSend = res.send;
    const originalJson = res.json;

    // Variable para guardar la respuesta
    let respuestaEnviada = false;
    let statusCode = 200;

    // Interceptar res.send
    res.send = function (data) {
      respuestaEnviada = true;
      statusCode = res.statusCode;
      res.send = originalSend;
      return originalSend.call(this, data);
    };

    // Interceptar res.json
    res.json = function (data) {
      respuestaEnviada = true;
      statusCode = res.statusCode;
      res.json = originalJson;
      return originalJson.call(this, data);
    };

    // Guardar hook para registrar después del response
    res.on('finish', async () => {
      try {
        // Solo registrar si la respuesta fue exitosa (2xx)
        if (statusCode >= 200 && statusCode < 300) {
          const adminId = obtenerAdminIdDeRequest(req);

          let descripcion;

          // Si se proporciona función generadora
          if (typeof opcionesOGenerador === 'function') {
            descripcion = opcionesOGenerador(req, res);
          }
          // Si se proporcionan opciones con generador de descripción
          else if (opcionesOGenerador.descripcion && typeof opcionesOGenerador.descripcion === 'function') {
            descripcion = opcionesOGenerador.descripcion(req, res);
          }
          // Si se proporcionan datos para generar descripción
          else if (opcionesOGenerador.datos) {
            descripcion = generarDescripcion(accion, opcionesOGenerador.datos);
          }
          // Descripción por defecto
          else {
            descripcion = `Acción ${accion} ejecutada - ${req.method} ${req.path}`;
          }

          // Registrar en bitácora (no debe interrumpir)
          await registrarAccion(adminId, accion, descripcion).catch(error => {
            console.error('[Middleware Bitácora] Error al registrar:', error.message);
          });
        }
      } catch (error) {
        // Error silencioso - no interrumpir
        console.error('[Middleware Bitácora] Error inesperado:', error.message);
      }
    });

    // Continuar con el siguiente middleware/controlador
    next();
  };
}

/**
 * Wrapper para envolver controladores con registro automático en bitácora
 * Permite agregar lógica de bitácora sin modificar el controlador original
 * 
 * Uso:
 * const createProductoConBitacora = bitacoraWrapper(
 *   createProducto,
 *   'CREAR_PRODUCTO',
 *   (req, resultado) => ({
 *     id: resultado.data.id,
 *     nombre: resultado.data.nombre,
 *     precio: resultado.data.precio
 *   })
 * );
 * 
 * @param {Function} controlador - Función del controlador a envolver
 * @param {string} accion - Código de la acción
 * @param {Function} extractorDatos - Función para extraer datos del resultado (opcional)
 * @returns {Function} - Controlador envuelto
 */
export function bitacoraWrapper(controlador, accion, extractorDatos = null) {
  return async (req, res, next) => {
    try {
      // Guardar el método send/json original para interceptar
      const originalJson = res.json;
      const originalSend = res.send;
      let dataEnviada = null;

      // Interceptar res.json para capturar datos
      res.json = function (data) {
        dataEnviada = data;
        res.json = originalJson;
        return originalJson.call(this, data);
      };

      // Interceptar res.send para capturar datos
      res.send = function (data) {
        dataEnviada = data;
        res.send = originalSend;
        return originalSend.call(this, data);
      };

      // Ejecutar controlador original
      await controlador(req, res, next);

      // Si el controlador completó exitosamente, registrar en bitácora
      // Esto se ejecuta después de que el controlador envíe la respuesta
      setImmediate(async () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const adminId = obtenerAdminIdDeRequest(req);
            
            let descripcion;
            
            // Si hay extractor de datos personalizado
            if (extractorDatos && typeof extractorDatos === 'function') {
              const datos = extractorDatos(req, dataEnviada);
              descripcion = generarDescripcion(accion, datos);
            }
            // Descripción básica
            else {
              descripcion = `Acción ${accion} ejecutada - ${req.method} ${req.path}`;
            }

            // Registrar (no debe interrumpir)
            await registrarAccion(adminId, accion, descripcion).catch(error => {
              console.error('[Bitácora Wrapper] Error al registrar:', error.message);
            });
          }
        } catch (error) {
          console.error('[Bitácora Wrapper] Error inesperado:', error.message);
        }
      });

    } catch (error) {
      // Si hay error en el controlador, pasar al error handler
      next(error);
    }
  };
}

/**
 * Middleware para registrar con datos dinámicos del request
 * Útil cuando los datos a registrar están en el request body o params
 * 
 * Uso:
 * router.post('/',
 *   requireAdminAuth,
 *   registrarConDatos('CREAR_PRODUCTO', (req) => ({
 *     nombre: req.body.nombre,
 *     precio: req.body.precio
 *   })),
 *   createProducto
 * );
 * 
 * @param {string} accion - Código de la acción
 * @param {Function} extractorDatos - Función que extrae datos del request
 * @returns {Function} - Middleware
 */
export function registrarConDatos(accion, extractorDatos) {
  return registrarEnBitacora(accion, {
    descripcion: (req) => {
      const datos = extractorDatos(req);
      return generarDescripcion(accion, datos);
    }
  });
}

/**
 * Middleware para registrar solo si la condición se cumple
 * Útil para registrar condicionalmente
 * 
 * Uso:
 * router.put('/:id',
 *   requireAdminAuth,
 *   registrarSi(
 *     'EDITAR_PRODUCTO',
 *     (req) => req.body.precio !== undefined, // Solo si cambia el precio
 *     (req) => ({ id: req.params.id, precio: req.body.precio })
 *   ),
 *   updateProducto
 * );
 * 
 * @param {string} accion - Código de la acción
 * @param {Function} condicion - Función que retorna boolean
 * @param {Function} extractorDatos - Función para extraer datos
 * @returns {Function} - Middleware
 */
export function registrarSi(accion, condicion, extractorDatos) {
  return async (req, res, next) => {
    // Evaluar condición
    const debeRegistrar = await Promise.resolve(condicion(req));

    if (debeRegistrar) {
      // Usar el middleware normal si cumple la condición
      return registrarConDatos(accion, extractorDatos)(req, res, next);
    } else {
      // Si no cumple, solo pasar al siguiente
      next();
    }
  };
}

/**
 * Helper para crear descripción desde resultado de respuesta
 * Útil para extraer datos después de que el controlador haya procesado
 * 
 * @param {Object} res - Objeto response
 * @param {Function} extractor - Función extractora
 * @returns {any} - Datos extraídos
 */
export function extraerDeRespuesta(res, extractor) {
  return extractor(res.locals.resultado || {});
}

/**
 * Middleware para guardar resultado en res.locals para uso posterior
 * Útil cuando necesitas los datos del resultado para la bitácora
 * 
 * @param {Function} controlador - Controlador original
 * @returns {Function} - Controlador modificado
 */
export function guardarResultado(controlador) {
  return async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function (data) {
      res.locals.resultado = data;
      res.json = originalJson;
      return originalJson.call(this, data);
    };

    return controlador(req, res, next);
  };
}

/**
 * Factory para crear middleware de bitácora específico para un módulo
 * Facilita la creación de middlewares personalizados por módulo
 * 
 * Uso:
 * const bitacoraProductos = crearBitacoraModule('productos');
 * router.post('/', requireAdminAuth, bitacoraProductos.crear(), createProducto);
 * 
 * @param {string} modulo - Nombre del módulo (productos, categorias, etc)
 * @returns {Object} - Objeto con métodos helper
 */
export function crearBitacoraModule(modulo) {
  const MODULO_UPPER = modulo.toUpperCase();

  return {
    crear: (extractorDatos) => 
      registrarConDatos(`CREAR_${MODULO_UPPER}`, extractorDatos),
    
    editar: (extractorDatos) => 
      registrarConDatos(`EDITAR_${MODULO_UPPER}`, extractorDatos),
    
    eliminar: (extractorDatos) => 
      registrarConDatos(`ELIMINAR_${MODULO_UPPER}`, extractorDatos),
    
    accion: (accion, extractorDatos) => 
      registrarConDatos(accion, extractorDatos)
  };
}

// Exportar todo como objeto también para importación alternativa
export default {
  registrarEnBitacora,
  bitacoraWrapper,
  registrarConDatos,
  registrarSi,
  extraerDeRespuesta,
  guardarResultado,
  crearBitacoraModule
};
