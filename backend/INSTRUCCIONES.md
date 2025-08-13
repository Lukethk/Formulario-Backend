# 🚀 Instrucciones de Inicio Rápido - API de Bomberos

## ⚡ Inicio Inmediato

### 1. Configurar Base de Datos
```sql
-- Ejecutar este script en tu SQL Server
-- Crear la base de datos bomberos_db
CREATE DATABASE bomberos_db;
GO

USE bomberos_db;
GO

-- Tabla brigadas
CREATE TABLE brigadas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(200) NOT NULL,
    cant_bomberos_activos INT,
    contacto_comandante NVARCHAR(50),
    encargado_logistica NVARCHAR(200),
    contacto_logistica NVARCHAR(50),
    num_emergencia NVARCHAR(50),
    observaciones NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- Categorías de equipos
CREATE TABLE categorias_equipos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(150) NOT NULL UNIQUE,
    descripcion NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Equipos
CREATE TABLE equipos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    categoria_id INT NOT NULL FOREIGN KEY REFERENCES categorias_equipos(id),
    nombre NVARCHAR(200) NOT NULL,
    descripcion NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Tallas
CREATE TABLE tallas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(20) NOT NULL UNIQUE,
    tipo NVARCHAR(50),
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Relación equipos por brigada
CREATE TABLE equipos_brigada (
    id INT IDENTITY(1,1) PRIMARY KEY,
    brigada_id INT NOT NULL FOREIGN KEY REFERENCES brigadas(id) ON DELETE CASCADE,
    equipo_id INT NOT NULL FOREIGN KEY REFERENCES equipos(id),
    talla_id INT NULL FOREIGN KEY REFERENCES tallas(id),
    cantidad INT NOT NULL DEFAULT 0,
    observaciones NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT uq_brigada_equipo_talla UNIQUE (brigada_id, equipo_id, talla_id)
);
GO

-- Insertar tallas por defecto
INSERT INTO tallas (nombre, tipo) VALUES
('XS', 'ropa'),('S', 'ropa'),('M', 'ropa'),('L', 'ropa'),('XL', 'ropa'),
('36', 'calzado'),('37', 'calzado'),('38', 'calzado'),('39', 'calzado'),('40', 'calzado');
GO

-- Insertar categorías por defecto
INSERT INTO categorias_equipos (nombre, descripcion) VALUES
('Ropa', 'Camisas, pantalones, overoles, etc.'),
('Calzado', 'Botas y calzado especializado'),
('Protección Personal', 'Cascos, guantes, lentes'),
('Herramientas', 'Extintores, linternas, radios');
GO

-- Insertar equipos de ejemplo
INSERT INTO equipos (categoria_id, nombre) VALUES
(1, 'Camisa forestal'),
(1, 'Pantalón forestal'),
(2, 'Botas forestales'),
(3, 'Casco'),
(3, 'Guantes resistentes');
GO
```

### 2. Configurar Variables de Entorno
```bash
# Crear archivo .env en la raíz del proyecto
DB_SERVER=localhost
DB_DATABASE=bomberos_db
DB_USER=sa
DB_PASSWORD=TuPassword123
DB_PORT=1433
PORT=3000
NODE_ENV=development
JWT_SECRET=mi_clave_secreta_super_segura_para_produccion
```

### 3. Instalar Dependencias
```bash
npm install
```

### 4. Iniciar Servidor
```bash
# Desarrollo (con recarga automática)
npm run dev

# Producción
npm start
```

## 🧪 Probar la API

### Verificar que funciona
```bash
curl http://localhost:3000/
```

### Crear una brigada
```bash
curl -X POST http://localhost:3000/api/brigadas \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Brigada Central",
    "cant_bomberos_activos": 25,
    "contacto_comandante": "Juan Pérez"
  }'
```

### Obtener todas las brigadas
```bash
curl http://localhost:3000/api/brigadas
```

## 📱 Endpoints Principales

- **Brigadas**: `/api/brigadas`
- **Categorías**: `/api/categorias`
- **Equipos**: `/api/equipos`
- **Tallas**: `/api/tallas`
- **Equipos por Brigada**: `/api/equipos-brigada`

## 🔧 Solución de Problemas

### Error de PowerShell
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error de conexión a SQL Server
1. Verificar que SQL Server esté corriendo
2. Verificar credenciales en `.env`
3. Verificar que la base de datos exista
4. Verificar que el puerto sea correcto

### Puerto ocupado
Cambiar el puerto en `.env`:
```bash
PORT=3001
```

## 📚 Documentación Completa

Ver `README.md` para documentación detallada de todos los endpoints.

## 🚨 Importante

- **NUNCA** subir el archivo `.env` al repositorio
- Cambiar `JWT_SECRET` en producción
- Configurar CORS apropiadamente en producción
- Habilitar encriptación en SQL Server para producción
