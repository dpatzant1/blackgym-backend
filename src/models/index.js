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
  constructor(data = {}) {
    this.id = data.id || null;
    this.cliente = data.cliente || '';
    this.telefono = data.telefono || '';
    this.direccion = data.direccion || '';
    this.total = data.total || 0;
    this.fecha = data.fecha || new Date();
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

    return errors;
  }

  toDatabase() {
    return {
      cliente: this.cliente.trim(),
      telefono: this.telefono.trim(),
      direccion: this.direccion.trim(),
      total: parseFloat(this.total)
    };
  }

  static fromDatabase(data) {
    return new OrdenModel(data);
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
