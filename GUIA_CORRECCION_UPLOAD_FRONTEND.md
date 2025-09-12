# 🔧 Guía de Corrección - Upload de Imágenes al Backend

## 🚨 **Problema Actual**
El frontend está enviando requests a `POST /api/uploads/image` pero el backend responde con `400 Bad Request: "No se proporcionó ningún archivo"`.

## 📋 **Especificaciones del Backend (OBLIGATORIAS)**

### **Endpoint**: `POST http://localhost:3000/api/uploads/image`

### **Headers requeridos**:
```javascript
{
  'x-admin-user': 'admin',
  'x-admin-password': 'Admin123!'
  // NO incluir 'Content-Type' - se establece automáticamente para FormData
}
```

### **Campo FormData**: 
- **Nombre del campo**: `'image'` (exactamente este nombre)
- **Tipo**: File object válido

### **Formato de Request**:
```javascript
const formData = new FormData();
formData.append('image', fileObject); // ← Campo DEBE llamarse 'image'
```

---

## 🔍 **Puntos de Verificación OBLIGATORIOS**

### **1. Verificar el input file**
```html
<!-- ✅ CORRECTO -->
<input 
  type="file" 
  accept="image/jpeg,image/png,image/webp"
  onChange={handleFileSelect}
/>
```

```javascript
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  console.log('Archivo seleccionado:', file); // ← AGREGAR ESTE LOG
  
  if (file) {
    // Verificar que es un archivo válido
    console.log('Tipo:', file.type);
    console.log('Tamaño:', file.size);
    console.log('Nombre:', file.name);
    
    uploadImage(file);
  }
};
```

### **2. Verificar la función uploadImage**
```javascript
const uploadImage = async (file) => {
  try {
    // ✅ VERIFICACIÓN CRÍTICA
    if (!file) {
      console.error('❌ No hay archivo para subir');
      throw new Error('No hay archivo seleccionado');
    }

    if (!(file instanceof File)) {
      console.error('❌ El objeto no es un File:', typeof file, file);
      throw new Error('El objeto proporcionado no es un archivo válido');
    }

    console.log('📤 Subiendo archivo:', file.name);

    // ✅ FORMDATA CORRECTO
    const formData = new FormData();
    formData.append('image', file); // ← CAMPO DEBE SER 'image'

    // ✅ LOG PARA VERIFICAR FORMDATA
    console.log('FormData creado:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    // ✅ REQUEST CORRECTO
    const response = await fetch('http://localhost:3000/api/uploads/image', {
      method: 'POST',
      headers: {
        'x-admin-user': 'admin',
        'x-admin-password': 'Admin123!'
        // NO incluir Content-Type aquí
      },
      body: formData
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error del servidor:', errorData);
      throw new Error(errorData.error || `HTTP Error ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Upload exitoso:', result);
    return result;

  } catch (error) {
    console.error('❌ Error completo en uploadImage:', error);
    throw error;
  }
};
```

### **3. Verificar el estado del archivo**
```javascript
// ✅ AGREGAR ESTOS LOGS ANTES DEL UPLOAD
const debugFileInfo = (file) => {
  console.log('=== DEBUG FILE INFO ===');
  console.log('File object:', file);
  console.log('File type:', file.type);
  console.log('File size:', file.size);
  console.log('File name:', file.name);
  console.log('File lastModified:', file.lastModified);
  console.log('Is File instance:', file instanceof File);
  console.log('Is Blob instance:', file instanceof Blob);
  console.log('========================');
};

// Llamar antes del upload
debugFileInfo(selectedFile);
```

---

## 🚫 **Errores COMUNES a EVITAR**

### **❌ Error 1: Campo FormData incorrecto**
```javascript
// ❌ INCORRECTO
formData.append('file', file);
formData.append('imagen', file);
formData.append('upload', file);

// ✅ CORRECTO
formData.append('image', file);
```

### **❌ Error 2: Content-Type manual**
```javascript
// ❌ INCORRECTO
headers: {
  'Content-Type': 'multipart/form-data', // ← ELIMINAR ESTA LÍNEA
  'x-admin-user': 'admin',
  'x-admin-password': 'Admin123!'
}

// ✅ CORRECTO
headers: {
  'x-admin-user': 'admin',
  'x-admin-password': 'Admin123!'
}
```

### **❌ Error 3: Archivo undefined**
```javascript
// ❌ PROBLEMA COMÚN
const file = event.target.files[0]; // ← Puede ser undefined
uploadImage(file); // ← Envía undefined

// ✅ CORRECCIÓN
const file = event.target.files[0];
if (file) {
  uploadImage(file);
} else {
  console.error('No se seleccionó ningún archivo');
}
```

### **❌ Error 4: URL incorrecta**
```javascript
// ❌ VERIFICAR QUE LA URL SEA CORRECTA
const url = 'http://localhost:3000/api/uploads/image'; // ← Puerto y path correctos
```

---

## 🧪 **Test de Depuración**

### **Agregar este código temporal para debug:**
```javascript
const testUpload = async () => {
  console.log('🔬 INICIANDO TEST DE UPLOAD');
  
  // Crear un archivo de prueba
  const testContent = 'test image content';
  const testFile = new File([testContent], 'test.jpg', { type: 'image/jpeg' });
  
  console.log('📁 Archivo de prueba creado:', testFile);
  
  try {
    const result = await uploadImage(testFile);
    console.log('✅ Test exitoso:', result);
  } catch (error) {
    console.error('❌ Test falló:', error);
  }
};

// Llamar para probar
testUpload();
```

---

## 📱 **Validaciones del Frontend**

### **Antes de hacer el upload, verificar:**
```javascript
const validateBeforeUpload = (file) => {
  const validations = [];

  // 1. Archivo existe
  if (!file) {
    validations.push('❌ No hay archivo seleccionado');
  }

  // 2. Es instancia de File
  if (!(file instanceof File)) {
    validations.push('❌ No es un objeto File válido');
  }

  // 3. Tipo MIME válido
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    validations.push(`❌ Tipo no permitido: ${file.type}`);
  }

  // 4. Tamaño válido (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    validations.push(`❌ Archivo muy grande: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  // 5. Tamaño mínimo
  if (file.size < 100) {
    validations.push(`❌ Archivo muy pequeño: ${file.size} bytes`);
  }

  return {
    isValid: validations.length === 0,
    errors: validations
  };
};

// Usar antes del upload
const validation = validateBeforeUpload(selectedFile);
if (!validation.isValid) {
  console.error('Validación falló:', validation.errors);
  return;
}
```

---

## 🎯 **Ejemplo Completo FUNCIONAL**

```javascript
import React, { useState } from 'react';

const ImageUploader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    console.log('📁 Archivo seleccionado:', file);
    
    if (file) {
      setSelectedFile(file);
      // Upload inmediato al seleccionar
      handleUpload(file);
    }
  };

  const handleUpload = async (file) => {
    setUploading(true);
    setUploadResult(null);

    try {
      // Validar archivo
      if (!file || !(file instanceof File)) {
        throw new Error('Archivo inválido');
      }

      console.log('📤 Iniciando upload de:', file.name);

      // Crear FormData
      const formData = new FormData();
      formData.append('image', file); // ← CRÍTICO: campo 'image'

      // Debug FormData
      for (let [key, value] of formData.entries()) {
        console.log(`FormData ${key}:`, value);
      }

      // Hacer request
      const response = await fetch('http://localhost:3000/api/uploads/image', {
        method: 'POST',
        headers: {
          'x-admin-user': 'admin',
          'x-admin-password': 'Admin123!'
          // NO Content-Type
        },
        body: formData
      });

      console.log('📡 Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en upload');
      }

      const result = await response.json();
      console.log('✅ Upload exitoso:', result);
      setUploadResult(result);

    } catch (error) {
      console.error('❌ Error en upload:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      
      {uploading && <p>Subiendo...</p>}
      
      {uploadResult && (
        <div>
          <p>✅ Imagen subida exitosamente</p>
          <img 
            src={uploadResult.data.image.publicUrl} 
            alt="Uploaded" 
            style={{ maxWidth: 200 }} 
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
```

---

## 🚀 **Checklist Final**

- [ ] Input file con `accept="image/*"`
- [ ] handleFileSelect obtiene `event.target.files[0]`
- [ ] Verificar que `file instanceof File` es `true`
- [ ] FormData con campo exacto `'image'`
- [ ] Headers con `x-admin-user` y `x-admin-password`
- [ ] NO incluir `Content-Type` en headers
- [ ] URL correcta: `http://localhost:3000/api/uploads/image`
- [ ] Manejar respuesta 400/500 correctamente
- [ ] Logs de debug en cada paso

---

## 🎯 **Si sigue fallando...**

**Agregar este log en el request para debug completo:**

```javascript
console.log('=== REQUEST DEBUG ===');
console.log('URL:', 'http://localhost:3000/api/uploads/image');
console.log('Method:', 'POST');
console.log('Headers:', {
  'x-admin-user': 'admin',
  'x-admin-password': 'Admin123!'
});
console.log('Body (FormData entries):');
for (let [key, value] of formData.entries()) {
  console.log(`  ${key}:`, value, typeof value);
}
console.log('====================');
```

**El backend está configurado correctamente y espera exactamente estos parámetros. El problema está en cómo se construye o envía el FormData desde el frontend.**