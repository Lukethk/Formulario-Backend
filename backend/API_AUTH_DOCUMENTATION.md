# 🔐 API de Autenticación - Sistema de Bomberos

## 📋 Descripción General

Esta API proporciona un sistema completo de autenticación y autorización para el sistema de formularios de bomberos, incluyendo registro, login, gestión de sesiones y control de acceso basado en roles.

## 🚀 Endpoints Disponibles

### Base URL
```
http://localhost:3000/api/auth
```

## 📝 Endpoints de Autenticación

### 1. Registro de Usuario
**POST** `/register`

Registra un nuevo usuario en el sistema.

#### Headers
```
Content-Type: application/json
```

#### Body
```json
{
  "nombre": "Juan Pérez",
  "email": "juan.perez@bomberos.com",
  "password": "contraseña123",
  "rol": "bombero",
  "brigada_id": "uuid-de-la-brigada",
  "numero_legajo": "BP001",
  "telefono": "+54 9 11 1234-5678",
  "activo": true
}
```

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": "uuid-del-usuario",
      "nombre": "Juan Pérez",
      "email": "juan.perez@bomberos.com",
      "rol": "bombero",
      "brigada_id": "uuid-de-la-brigada",
      "numero_legajo": "BP001",
      "telefono": "+54 9 11 1234-5678",
      "activo": true,
      "created_at": "2024-01-15T10:30:00Z"
    },
    "token": "jwt-token-generado"
  }
}
```

#### Respuesta de Error (400)
```json
{
  "success": false,
  "message": "Datos de entrada inválidos",
  "errors": [
    {
      "field": "email",
      "message": "Email inválido"
    }
  ]
}
```

---

### 2. Login de Usuario
**POST** `/login`

Autentica un usuario y genera un token JWT.

#### Headers
```
Content-Type: application/json
```

#### Body
```json
{
  "email": "juan.perez@bomberos.com",
  "password": "contraseña123"
}
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": "uuid-del-usuario",
      "nombre": "Juan Pérez",
      "email": "juan.perez@bomberos.com",
      "rol": "bombero",
      "brigada_id": "uuid-de-la-brigada",
      "brigada_nombre": "Brigada Central",
      "numero_legajo": "BP001",
      "telefono": "+54 9 11 1234-5678",
      "activo": true
    },
    "token": "jwt-token-generado"
  }
}
```

#### Respuesta de Error (401)
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

---

### 3. Verificación de Token
**GET** `/verify`

Verifica la validez de un token JWT y retorna información del usuario.

#### Headers
```
Authorization: Bearer <token>
```
o
```
X-Access-Token: <token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Token válido",
  "data": {
    "user": {
      "id": "uuid-del-usuario",
      "nombre": "Juan Pérez",
      "email": "juan.perez@bomberos.com",
      "rol": "bombero",
      "brigada_id": "uuid-de-la-brigada",
      "brigada_nombre": "Brigada Central",
      "numero_legajo": "BP001",
      "telefono": "+54 9 11 1234-5678",
      "activo": true
    }
  }
}
```

#### Respuesta de Error (401)
```json
{
  "success": false,
  "message": "Token requerido"
}
```

---

### 4. Cambio de Contraseña
**POST** `/change-password`

Permite al usuario cambiar su contraseña.

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Body
```json
{
  "currentPassword": "contraseña_actual",
  "newPassword": "nueva_contraseña123"
}
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

#### Respuesta de Error (400)
```json
{
  "success": false,
  "message": "Contraseña actual incorrecta"
}
```

---

## 🔑 Sistema de Roles

### Roles Disponibles
- **`bombero`**: Usuario básico, puede crear y ver sus propios formularios
- **`comandante`**: Usuario intermedio, puede gestionar su brigada
- **`admin`**: Usuario administrador, acceso completo al sistema

### Permisos por Rol

#### Bombero
- ✅ Crear formularios para su brigada
- ✅ Ver sus propios formularios
- ✅ Ver estado de sus formularios
- ❌ Ver formularios de otros usuarios
- ❌ Modificar formularios existentes

#### Comandante
- ✅ Todas las funcionalidades de bombero
- ✅ Ver formularios de su brigada
- ✅ Aprobar/rechazar formularios de su brigada
- ✅ Gestionar usuarios de su brigada
- ❌ Acceso a otras brigadas

#### Admin
- ✅ Acceso completo al sistema
- ✅ Gestionar todas las brigadas
- ✅ Gestionar todos los usuarios
- ✅ Ver todos los formularios
- ✅ Configuración del sistema

---

## 🛡️ Seguridad

### JWT (JSON Web Tokens)
- **Algoritmo**: HS256
- **Expiración**: 7 días (configurable)
- **Secreto**: Configurable via variable de entorno

### Encriptación de Contraseñas
- **Algoritmo**: bcrypt
- **Salt Rounds**: 12
- **Hash**: 255 caracteres

### Protecciones Implementadas
- ✅ Validación de entrada con express-validator
- ✅ Sanitización de datos
- ✅ Rate limiting (configurable)
- ✅ Protección contra SQL injection
- ✅ Headers de seguridad con helmet
- ✅ CORS configurado

---

## 📊 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

---

## 🔧 Configuración

### Variables de Entorno
```env
# Configuración JWT
JWT_SECRET=tu_secreto_super_seguro_para_bomberos_2024
JWT_EXPIRES_IN=7d

# Configuración de Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=formulario
DB_USER=tu_usuario
DB_PASSWORD=tu_password

# Configuración del Servidor
PORT=3000
NODE_ENV=development
```

---

## 📱 Uso en Frontend

### Ejemplo de Login
```javascript
const login = async (email, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Guardar token en localStorage
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      // Redirigir al dashboard
      window.location.href = '/dashboard';
    }
  } catch (error) {
    console.error('Error en login:', error);
  }
};
```

### Ejemplo de Petición Autenticada
```javascript
const getMisFormularios = async () => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch('/api/formularios-necesidades/mis-formularios', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data.formularios;
    }
  } catch (error) {
    console.error('Error al obtener formularios:', error);
  }
};
```

---

## 🚨 Consideraciones de Seguridad

### En Producción
1. **Cambiar JWT_SECRET** por uno seguro y único
2. **Configurar HTTPS** obligatorio
3. **Implementar rate limiting** más estricto
4. **Configurar CORS** solo para dominios permitidos
5. **Habilitar logging** de auditoría
6. **Implementar backup** de base de datos
7. **Configurar firewall** y seguridad de red

### Monitoreo
- Revisar logs de autenticación regularmente
- Monitorear intentos de login fallidos
- Verificar tokens expirados
- Revisar accesos sospechosos

---

## 📞 Soporte

Para soporte técnico o consultas sobre la API de autenticación:

- **Email**: soporte@bomberosapp.com
- **Documentación**: Esta API está integrada con el sistema principal
- **Issues**: Reportar problemas en el repositorio del proyecto

---

## 🔄 Versiones

- **v1.0.0**: Implementación inicial con JWT y roles básicos
- **Próximas**: Recuperación de contraseñas, 2FA, OAuth

---

*Última actualización: Enero 2024*
