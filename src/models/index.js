// Modelo para la tabla productos
export class ProductoModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nombre = data.nombre || '';
    this.descripcion = data.descripcion || '';
    this.precio = data.precio || 0;
    this.stock = data.stock || 0;
    this.imagen_url = data.imagen_url || '';
  }

  // Validar datos del producto
  validate() {
    const errors = [];

    if (!this.nombre || this.nombre.trim() === '') {
      errors.push('El nombre es requerido');
    }

    if (!this.precio || this.precio <= 0) {
      errors.push('El precio debe ser mayor a 0');
    }

    if (this.stock < 0) {
      errors.push('El stock no puede ser negativo');
    }

    return errors;
  }

  // Convertir a objeto para insertar en base de datos
  toDatabase() {
    return {
      nombre: this.nombre.trim(),
      descripcion: this.descripcion.trim(),
      precio: parseFloat(this.precio),
      stock: parseInt(this.stock),
      imagen_url: this.imagen_url.trim()
    };
  }

  // Crear desde datos de base de datos
  static fromDatabase(data) {
    return new ProductoModel(data);
  }
}

// Modelo para la tabla categorias
export class CategoriaModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nombre = data.nombre || '';
    this.descripcion = data.descripcion || '';
    // Comentado: imagen_url no existe en la tabla
    // this.imagen_url = data.imagen_url || '';
  }

  validate() {
    const errors = [];

    if (!this.nombre || this.nombre.trim() === '') {
      errors.push('El nombre es requerido');
    }

    return errors;
  }

  toDatabase() {
    return {
      nombre: this.nombre.trim(),
      descripcion: this.descripcion.trim()
      // Comentado: imagen_url no existe en la tabla
      // imagen_url: this.imagen_url.trim()
    };
  }

  static fromDatabase(data) {
    return new CategoriaModel(data);
  }
}

// Modelo para la tabla ordenes
export class OrdenModel {
  // Estados permitidos para órdenes
  static ESTADOS_PERMITIDOS = ['pendiente', 'pagado', 'enviado', 'completado', 'cancelado'];
  
  // Transiciones válidas de estado
  static TRANSICIONES_PERMITIDAS = {
    'pendiente': ['pagado', 'cancelado'],
    'pagado': ['enviado', 'cancelado'],
    'enviado': ['completado'],
    'completado': [],
    'cancelado': []
  };

  constructor(data = {}) {
    this.id = data.id || null;
    this.cliente = data.cliente || '';
    this.telefono = data.telefono || '';
    this.direccion = data.direccion || '';
    this.total = data.total || 0;
    this.estado = data.estado || 'pendiente'; // Estado por defecto
    this.fecha = data.fecha || new Date();
    this.usuario_id = data.usuario_id || null; // ID del usuario (null para órdenes anónimas)
  }

  validate() {
    const errors = [];

    if (!this.cliente || this.cliente.trim() === '') {
      errors.push('El nombre del cliente es requerido');
    }

    if (!this.telefono || this.telefono.trim() === '') {
      errors.push('El teléfono es requerido');
    }

    if (!this.direccion || this.direccion.trim() === '') {
      errors.push('La dirección es requerida');
    }

    if (!this.total || this.total <= 0) {
      errors.push('El total debe ser mayor a 0');
    }

    // Validar estado
    if (this.estado && !OrdenModel.esEstadoValido(this.estado)) {
      errors.push(`Estado inválido. Estados permitidos: ${OrdenModel.ESTADOS_PERMITIDOS.join(', ')}`);
    }

    return errors;
  }

  toDatabase() {
    const data = {
      cliente: this.cliente.trim(),
      telefono: this.telefono.trim(),
      direccion: this.direccion.trim(),
      total: parseFloat(this.total),
      estado: this.estado || 'pendiente'
    };
    
    // Solo incluir usuario_id si está presente
    if (this.usuario_id) {
      data.usuario_id = this.usuario_id;
    }
    
    return data;
  }

  static fromDatabase(data) {
    return new OrdenModel(data);
  }

  /**
   * Validar si un estado es válido
   * @param {string} estado - Estado a validar
   * @returns {boolean}
   */
  static esEstadoValido(estado) {
    return OrdenModel.ESTADOS_PERMITIDOS.includes(estado);
  }

  /**
   * Validar si una transición de estado es permitida
   * @param {string} estadoActual - Estado actual de la orden
   * @param {string} nuevoEstado - Nuevo estado deseado
   * @returns {Object} - {valido: boolean, error: string}
   */
  static validarTransicion(estadoActual, nuevoEstado) {
    // Validar que ambos estados sean válidos
    if (!OrdenModel.esEstadoValido(estadoActual)) {
      return {
        valido: false,
        error: `Estado actual inválido: ${estadoActual}`
      };
    }

    if (!OrdenModel.esEstadoValido(nuevoEstado)) {
      return {
        valido: false,
        error: `Nuevo estado inválido: ${nuevoEstado}`
      };
    }

    // No permitir transición al mismo estado
    if (estadoActual === nuevoEstado) {
      return {
        valido: false,
        error: `La orden ya se encuentra en estado "${estadoActual}"`
      };
    }

    // Verificar si la transición está permitida
    const transicionesPermitidas = OrdenModel.TRANSICIONES_PERMITIDAS[estadoActual];
    
    if (!transicionesPermitidas || transicionesPermitidas.length === 0) {
      return {
        valido: false,
        error: `El estado "${estadoActual}" es final y no permite cambios`
      };
    }

    if (!transicionesPermitidas.includes(nuevoEstado)) {
      return {
        valido: false,
        error: `No se puede cambiar de "${estadoActual}" a "${nuevoEstado}". Estados permitidos: ${transicionesPermitidas.join(', ')}`
      };
    }

    return {
      valido: true,
      error: null
    };
  }

  /**
   * Obtener estados siguientes permitidos desde un estado actual
   * @param {string} estadoActual - Estado actual
   * @returns {Array<string>} - Lista de estados permitidos
   */
  static obtenerEstadosPermitidos(estadoActual) {
    if (!OrdenModel.esEstadoValido(estadoActual)) {
      return [];
    }
    return OrdenModel.TRANSICIONES_PERMITIDAS[estadoActual] || [];
  }

  /**
   * Verificar si un estado es final (no permite más cambios)
   * @param {string} estado - Estado a verificar
   * @returns {boolean}
   */
  static esEstadoFinal(estado) {
    const permitidos = OrdenModel.TRANSICIONES_PERMITIDAS[estado];
    return permitidos && permitidos.length === 0;
  }

  /**
   * Cambiar el estado de la orden (método de instancia)
   * @param {string} nuevoEstado - Nuevo estado
   * @returns {Object} - {success: boolean, error: string}
   */
  cambiarEstado(nuevoEstado) {
    const validacion = OrdenModel.validarTransicion(this.estado, nuevoEstado);
    
    if (!validacion.valido) {
      return {
        success: false,
        error: validacion.error
      };
    }

    const estadoAnterior = this.estado;
    this.estado = nuevoEstado;

    return {
      success: true,
      estadoAnterior,
      estadoNuevo: nuevoEstado
    };
  }
}

// Modelo para la tabla detalle_orden
export class DetalleOrdenModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.orden_id = data.orden_id || null;
    this.producto_id = data.producto_id || null;
    this.cantidad = data.cantidad || 0;
    this.precio_unitario = data.precio_unitario || 0;
  }

  validate() {
    const errors = [];

    if (!this.orden_id) {
      errors.push('El ID de la orden es requerido');
    }

    if (!this.producto_id) {
      errors.push('El ID del producto es requerido');
    }

    if (!this.cantidad || this.cantidad <= 0) {
      errors.push('La cantidad debe ser mayor a 0');
    }

    if (!this.precio_unitario || this.precio_unitario <= 0) {
      errors.push('El precio unitario debe ser mayor a 0');
    }

    return errors;
  }

  toDatabase() {
    return {
      orden_id: parseInt(this.orden_id),
      producto_id: parseInt(this.producto_id),
      cantidad: parseInt(this.cantidad),
      precio_unitario: parseFloat(this.precio_unitario)
    };
  }

  static fromDatabase(data) {
    return new DetalleOrdenModel(data);
  }
}

// Modelo para la tabla producto_categoria (relación muchos a muchos)
export class ProductoCategoriaModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.producto_id = data.producto_id || null;
    this.categoria_id = data.categoria_id || null;
  }

  validate() {
    const errors = [];

    if (!this.producto_id) {
      errors.push('El ID del producto es requerido');
    }

    if (!this.categoria_id) {
      errors.push('El ID de la categoría es requerido');
    }

    return errors;
  }

  toDatabase() {
    return {
      producto_id: parseInt(this.producto_id),
      categoria_id: parseInt(this.categoria_id)
    };
  }

  static fromDatabase(data) {
    return new ProductoCategoriaModel(data);
  }
}

// Exportar modelos adicionales
export { BitacoraModel } from './bitacora.js';
export { RolModel } from './roles.js';
export { AdministradorModel } from './administradores.js';
