# 🚒 Sistema de Gestión de Necesidades de Brigadas de Bomberos Forestales

## 📋 Descripción

Sistema completo de gestión de necesidades de equipamiento, suministros y recursos para brigadas de bomberos forestales. Permite a las brigadas registrar sus necesidades y a los administradores gestionar y aprobar estas solicitudes de manera eficiente.

## ✨ Características Principales

- **Gestión Completa de Brigadas**: Crear, editar, eliminar y consultar brigadas
- **Formularios de Necesidades**: Sistema completo de solicitudes con múltiples categorías
- **Flujo de Estados**: Gestión de aprobaciones con transiciones controladas
- **Reportes y Estadísticas**: Análisis detallado del sistema
- **API REST**: Interfaz completa y documentada
- **Base de Datos PostgreSQL**: Almacenamiento robusto y escalable
- **Validación de Datos**: Verificación automática de entradas
- **Historial de Cambios**: Auditoría completa de modificaciones

## 🏗️ Arquitectura del Sistema

### Backend
- **Node.js** con **Express.js**
- **PostgreSQL** como base de datos
- **Validación** con express-validator
- **Seguridad** con helmet y CORS
- **Logging** con morgan

### Base de Datos
- **Tablas principales**: brigadas, formularios_necesidades, estados_formulario
- **Campos JSONB** para flexibilidad en categorías de necesidades
- **Triggers** para actualización automática de timestamps
- **Índices** para optimización de consultas

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (v16 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd formulariobombero
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp env.example .env
```

Editar `.env` con tus credenciales:
```env
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=formulario
DB_USER=postgres
DB_PASSWORD=tu_password
NODE_ENV=development
PORT=3000
```

### 4. Configurar base de datos
```bash
# Conectar a PostgreSQL
psql -U postgres

# Ejecutar script de creación
\i script.sql
```

### 5. Iniciar el servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📚 Uso de la API

### Endpoints Principales

#### Brigadas
- `POST /api/brigadas` - Crear brigada
- `GET /api/brigadas` - Listar brigadas
- `GET /api/brigadas/:id` - Obtener brigada
- `PUT /api/brigadas/:id` - Actualizar brigada
- `DELETE /api/brigadas/:id` - Eliminar brigada

#### Formularios de Necesidades
- `POST /api/formularios-necesidades` - Crear formulario
- `GET /api/formularios-necesidades` - Listar formularios
- `GET /api/formularios-necesidades/:id` - Obtener formulario
- `PUT /api/formularios-necesidades/:id` - Actualizar formulario
- `PATCH /api/formularios-necesidades/:id/estado` - Cambiar estado
- `POST /api/formularios-necesidades/:id/transicion` - Transición de estado

#### Estados
- `GET /api/estados-formulario` - Listar estados
- `POST /api/estados-formulario` - Crear estado
- `PUT /api/estados-formulario/:id` - Actualizar estado

#### Reportes
- `GET /api/reportes/resumen` - Resumen general
- `GET /api/reportes/brigada/:id` - Reporte por brigada
- `GET /api/reportes/estadisticas` - Estadísticas detalladas
- `GET /api/reportes/exportar` - Exportar reportes

### Ejemplo de Uso

```bash
# Crear una brigada
curl -X POST http://localhost:3000/api/brigadas \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Brigada Forestal Norte",
    "cantidad_bomberos_activos": 25,
    "region": "Norte",
    "contacto_comandante": "+56 9 1234 5678"
  }'

# Crear formulario de necesidades
curl -X POST http://localhost:3000/api/formularios-necesidades \
  -H "Content-Type: application/json" \
  -d '{
    "brigada_id": "uuid-de-brigada",
    "epp_ropa": {
      "camisaForestal": {
        "xs": 5, "s": 8, "m": 10, "l": 12, "xl": 8,
        "observaciones": "Prioridad alta"
      }
    }
  }'
```

## 🧪 Pruebas

### Ejecutar Pruebas Automáticas
```bash
node test-api.js
```

### Pruebas Manuales
```bash
# Verificar estado del servidor
curl http://localhost:3000/

# Listar brigadas
curl http://localhost:3000/api/brigadas

# Generar reporte
curl http://localhost:3000/api/reportes/resumen
```

## 📊 Estructura de Datos

### Brigada
```json
{
  "id": "uuid",
  "nombre": "Brigada Forestal Norte",
  "cantidad_bomberos_activos": 25,
  "region": "Norte",
  "activa": true,
  "contacto_comandante": "+56 9 1234 5678",
  "encargado_logistica": "Juan Pérez"
}
```

### Formulario de Necesidades
```json
{
  "brigada_id": "uuid",
  "estado": "pendiente",
  "epp_ropa": {
    "camisaForestal": {
      "xs": 5, "s": 8, "m": 10, "l": 12, "xl": 8,
      "observaciones": "Prioridad alta"
    }
  },
  "epp_general": {
    "cascoForestal": {
      "cantidad": 25,
      "observaciones": "Cascos certificados"
    }
  }
}
```

## 🔄 Flujo de Trabajo

1. **Crear Brigada** - Registrar nueva brigada en el sistema
2. **Crear Formulario** - Brigada envía formulario de necesidades
3. **Revisión** - Administración revisa el formulario
4. **Aprobación** - Formulario es aprobado o rechazado
5. **Proceso** - Si es aprobado, se inicia el cumplimiento
6. **Completado** - Formulario marcado como cumplido

## 📈 Reportes Disponibles

- **Resumen General**: Estadísticas del sistema completo
- **Por Brigada**: Análisis detallado de cada brigada
- **Por Región**: Distribución geográfica de necesidades
- **Temporales**: Evolución de solicitudes en el tiempo
- **Performance**: Métricas de tiempo de procesamiento

## 🔧 Configuración Avanzada

### Variables de Entorno Adicionales
```env
# Seguridad
CORS_ORIGIN=http://localhost:3000
HELMET_ENABLED=true

# Base de datos
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

# Logging
LOG_LEVEL=info
LOG_FORMAT=combined
```

### Configuración de Base de Datos
```sql
-- Crear índices adicionales
CREATE INDEX idx_formularios_fecha_estado ON formularios_necesidades(fecha_creacion, estado);
CREATE INDEX idx_brigadas_nombre_region ON brigadas(nombre, region);

-- Configurar particionamiento (para grandes volúmenes)
-- CREATE TABLE formularios_necesidades_2025 PARTITION OF formularios_necesidades
-- FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

## 🚀 Despliegue

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### PM2 (Producción)
```bash
npm install -g pm2
pm2 start server.js --name "api-bomberos"
pm2 save
pm2 startup
```

### Nginx (Proxy Reverso)
```nginx
server {
    listen 80;
    server_name api.bomberos.cl;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 Seguridad

- **Helmet.js** para headers de seguridad HTTP
- **CORS** configurado para orígenes permitidos
- **Validación** de entrada con express-validator
- **Sanitización** de datos SQL con parámetros preparados
- **Rate Limiting** (preparado para implementar)

## 📝 Logs y Monitoreo

### Logs de Aplicación
- **Morgan** para logs HTTP
- **Console** para errores y eventos importantes
- **Preparado** para integración con sistemas de logging

### Métricas de Performance
- **Tiempo de respuesta** de consultas
- **Uso de conexiones** de base de datos
- **Estadísticas** de endpoints más utilizados

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

- **Documentación**: `API_DOCUMENTATION.md`
- **Issues**: Crear issue en el repositorio
- **Contacto**: Equipo de desarrollo

## 🗺️ Roadmap

### Versión 1.1
- [ ] Autenticación JWT
- [ ] Autorización por roles
- [ ] Notificaciones por email

### Versión 1.2
- [ ] Dashboard web administrativo
- [ ] API para aplicaciones móviles
- [ ] Integración con sistemas externos

### Versión 2.0
- [ ] Machine Learning para predicción de necesidades
- [ ] Sistema de alertas inteligentes
- [ ] Integración con mapas y GPS

---

**Desarrollado con ❤️ para los Bomberos Forestales de Chile**

**Versión:** 1.0.0  
**Última actualización:** Enero 2025
