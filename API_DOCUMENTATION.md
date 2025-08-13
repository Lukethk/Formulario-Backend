# 🚒 API REST - Sistema de Gestión de Necesidades de Brigadas de Bomberos Forestales

## 📋 Descripción General

Esta API REST proporciona una interfaz completa para gestionar las necesidades de equipamiento, suministros y recursos de las brigadas de bomberos forestales. Permite a las brigadas registrar sus necesidades y a los administradores gestionar y aprobar estas solicitudes.

## 🏗️ Estructura de la API

### Base URL
```
http://localhost:3000/api
```

### Autenticación
Actualmente la API no requiere autenticación, pero está preparada para implementar JWT en futuras versiones.

## 📚 Endpoints Disponibles

### 1. 🚨 Gestión de Brigadas

#### Crear Nueva Brigada
```http
POST /api/brigadas
```

**Body:**
```json
{
  "nombre": "Brigada Forestal Norte",
  "cantidad_bomberos_activos": 25,
  "contacto_comandante": "+56 9 1234 5678",
  "encargado_logistica": "Juan Pérez",
  "contacto_logistica": "+56 9 8765 4321",
  "numero_emergencia_publico": "+56 2 2345 6789",
  "region": "Norte",
  "activa": true
}
```

#### Listar Todas las Brigadas
```http
GET /api/brigadas
```

#### Obtener Brigada Específica
```http
GET /api/brigadas/:id
```

#### Actualizar Brigada
```http
PUT /api/brigadas/:id
```

#### Eliminar Brigada
```http
DELETE /api/brigadas/:id
```

#### Buscar Brigadas por Nombre
```http
GET /api/brigadas/search/:nombre
```

### 2. 📝 Gestión de Formularios de Necesidades

#### Crear Formulario de Necesidades
```http
POST /api/formularios-necesidades
```

**Body:**
```json
{
  "brigada_id": "uuid-de-brigada",
  "epp_ropa": {
    "camisaForestal": {
      "xs": 5, "s": 8, "m": 10, "l": 12, "xl": 8,
      "observaciones": "Prioridad alta"
    },
    "pantalonForestal": {
      "xs": 5, "s": 8, "m": 10, "l": 12, "xl": 8,
      "observaciones": "Necesario para temporada"
    }
  },
  "epp_general": {
    "esclavina": { "cantidad": 25, "observaciones": "Una por bombero" },
    "linterna": { "cantidad": 30, "observaciones": "Incluir repuestos" }
  },
  "herramientas": {
    "azadon": { "cantidad": 5, "observaciones": "Para limpieza de maleza" }
  }
}
```

#### Listar Formularios (con Filtros)
```http
GET /api/formularios-necesidades?estado=pendiente&brigada_id=uuid&page=1&limit=10
```

**Parámetros de Query:**
- `estado`: Filtrar por estado (pendiente, en_revision, aprobado, rechazado, en_proceso, completado)
- `brigada_id`: Filtrar por brigada específica
- `fecha_desde`: Filtrar desde fecha (formato ISO)
- `fecha_hasta`: Filtrar hasta fecha (formato ISO)
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10)
- `sort_by`: Campo de ordenamiento (fecha_creacion, estado, brigada_id)
- `sort_order`: Orden (ASC, DESC)

#### Obtener Formulario Específico
```http
GET /api/formularios-necesidades/:id
```

#### Actualizar Formulario
```http
PUT /api/formularios-necesidades/:id
```

#### Eliminar Formulario
```http
DELETE /api/formularios-necesidades/:id
```

#### Cambiar Estado del Formulario
```http
PATCH /api/formularios-necesidades/:id/estado
```

**Body:**
```json
{
  "estado": "aprobado",
  "comentario": "Formulario aprobado por administración",
  "usuario": "admin@bomberos.cl"
}
```

#### Transición de Estado
```http
POST /api/formularios-necesidades/:id/transicion
```

**Body:**
```json
{
  "estado_destino": "en_proceso",
  "comentario": "Iniciando proceso de cumplimiento",
  "usuario": "logistica@bomberos.cl"
}
```

### 3. 🎯 Gestión de Estados

#### Listar Estados Disponibles
```http
GET /api/estados-formulario
```

#### Obtener Estado Específico
```http
GET /api/estados-formulario/:id
```

#### Crear Nuevo Estado
```http
POST /api/estados-formulario
```

**Body:**
```json
{
  "id": "nuevo_estado",
  "nombre": "Nuevo Estado",
  "color": "#ff6b6b",
  "descripcion": "Descripción del nuevo estado"
}
```

#### Actualizar Estado
```http
PUT /api/estados-formulario/:id
```

#### Eliminar Estado
```http
DELETE /api/estados-formulario/:id
```

#### Estadísticas del Estado
```http
GET /api/estados-formulario/:id/estadisticas
```

### 4. 📊 Reportes y Estadísticas

#### Resumen General del Sistema
```http
GET /api/reportes/resumen
```

#### Reporte por Brigada
```http
GET /api/reportes/brigada/:id
```

#### Estadísticas Generales
```http
GET /api/reportes/estadisticas?fecha_desde=2025-01-01&region=Norte
```

**Parámetros de Query:**
- `fecha_desde`: Fecha desde (formato ISO)
- `fecha_hasta`: Fecha hasta (formato ISO)
- `region`: Filtrar por región
- `estado`: Filtrar por estado

#### Exportar Reporte
```http
GET /api/reportes/exportar?tipo=completo&formato=csv
```

**Parámetros de Query:**
- `tipo`: Tipo de reporte (resumen, estadisticas, completo)
- `formato`: Formato de exportación (json, csv)

## 🔄 Flujo de Estados

### Estados Disponibles:
1. **pendiente** - Formulario enviado, esperando revisión
2. **en_revision** - Formulario siendo revisado por administración
3. **aprobado** - Formulario aprobado para procesamiento
4. **rechazado** - Formulario rechazado por administración
5. **en_proceso** - Formulario en proceso de cumplimiento
6. **completado** - Formulario completamente cumplido

### Transiciones Válidas:
- `pendiente` → `en_revision`, `rechazado`
- `en_revision` → `aprobado`, `rechazado`, `pendiente`
- `aprobado` → `en_proceso`, `rechazado`
- `rechazado` → `pendiente`
- `en_proceso` → `completado`, `rechazado`
- `completado` → (sin transiciones)

## 📊 Estructura de Datos

### Formulario de Necesidades
```json
{
  "id": "uuid",
  "brigada_id": "uuid",
  "fecha_creacion": "2025-01-15T00:00:00Z",
  "estado": "pendiente",
  "observaciones_admin": "",
  "fecha_aprobacion": null,
  "aprobado_por": null,
  
  "epp_ropa": {
    "camisaForestal": {
      "xs": 5, "s": 8, "m": 10, "l": 12, "xl": 8,
      "observaciones": "Prioridad alta"
    }
  },
  
  "epp_botas": {
    "37": 2, "38": 3, "39": 4, "40": 5, "41": 6, "42": 7, "43": 3
  },
  
  "epp_general": {
    "esclavina": { "cantidad": 25, "observaciones": "Una por bombero" }
  },
  
  "epp_guantes": {
    "xs": 4, "s": 6, "m": 8, "l": 10, "xl": 6, "xxl": 2
  },
  
  "herramientas": {
    "azadon": { "cantidad": 5, "observaciones": "Para limpieza" }
  },
  
  "logistica_vehiculos": {
    "gasolina": { "monto": 50000, "observaciones": "Combustible mensual" }
  },
  
  "alimentacion": {
    "agua": { "cantidad": 100, "observaciones": "Botellas de 500ml" }
  },
  
  "equipo_campo": {
    "colchoneta": { "cantidad": 25, "observaciones": "Para descanso" }
  },
  
  "limpieza_personal": {
    "shampoo": { "cantidad": 30, "observaciones": "Higiene personal" }
  },
  
  "limpieza_general": {
    "ace": { "cantidad": 10, "observaciones": "Limpieza de equipos" }
  },
  
  "medicamentos": {
    "paracetamol500": { "cantidad": 50, "observaciones": "Dolor y fiebre" }
  },
  
  "rescate_animal": {
    "alimentos_animales": { "cantidad": 20, "observaciones": "Para rescates" }
  },
  
  "created_at": "2025-01-15T00:00:00Z",
  "updated_at": "2025-01-15T00:00:00Z"
}
```

## 🚀 Ejemplos de Uso

### Crear una Brigada y su Formulario de Necesidades

```bash
# 1. Crear brigada
curl -X POST http://localhost:3000/api/brigadas \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Brigada Forestal Sur",
    "cantidad_bomberos_activos": 20,
    "region": "Sur",
    "contacto_comandante": "+56 9 1111 1111"
  }'

# 2. Crear formulario de necesidades
curl -X POST http://localhost:3000/api/formularios-necesidades \
  -H "Content-Type: application/json" \
  -d '{
    "brigada_id": "uuid-de-brigada-creada",
    "epp_ropa": {
      "camisaForestal": {
        "m": 15, "l": 5,
        "observaciones": "Necesario para temporada de incendios"
      }
    },
    "epp_general": {
      "cascoForestal": {
        "cantidad": 20,
        "observaciones": "Cascos certificados para protección"
      }
    }
  }'

# 3. Aprobar formulario
curl -X PATCH http://localhost:3000/api/formularios-necesidades/uuid-formulario/estado \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "aprobado",
    "comentario": "Formulario aprobado por administración",
    "usuario": "admin@bomberos.cl"
  }'
```

### Generar Reportes

```bash
# Resumen general
curl http://localhost:3000/api/reportes/resumen

# Estadísticas por región
curl "http://localhost:3000/api/reportes/estadisticas?region=Norte"

# Reporte de brigada específica
curl http://localhost:3000/api/reportes/brigada/uuid-brigada

# Exportar reporte completo en CSV
curl "http://localhost:3000/api/reportes/exportar?tipo=completo&formato=csv" \
  --output reporte_completo.csv
```

## ⚠️ Códigos de Error

### HTTP Status Codes
- `200` - OK - Operación exitosa
- `201` - Created - Recurso creado exitosamente
- `400` - Bad Request - Datos de entrada inválidos
- `404` - Not Found - Recurso no encontrado
- `409` - Conflict - Conflicto (ej: estado ya existe)
- `500` - Internal Server Error - Error interno del servidor

### Respuestas de Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": [
    {
      "field": "campo",
      "message": "Mensaje de validación"
    }
  ]
}
```

## 🔧 Configuración y Dependencias

### Dependencias Principales
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos
- **express-validator** - Validación de datos
- **cors** - Middleware CORS
- **helmet** - Seguridad HTTP
- **morgan** - Logging

### Variables de Entorno
```env
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=formulario
DB_USER=postgres
DB_PASSWORD=tu_password
NODE_ENV=development
PORT=3000
```

## 📈 Características Avanzadas

### Paginación
Todos los endpoints de listado soportan paginación con parámetros `page` y `limit`.

### Filtros Avanzados
- Filtrado por fecha, estado, brigada, región
- Ordenamiento personalizable
- Búsqueda por texto

### Validación de Datos
- Validación automática de tipos de datos
- Validación de formatos (UUID, fechas, etc.)
- Validación de reglas de negocio

### Historial de Cambios
- Seguimiento completo de cambios de estado
- Auditoría de modificaciones
- Comentarios y usuarios responsables

### Reportes en Tiempo Real
- Estadísticas actualizadas
- Métricas de performance
- Análisis de tendencias

## 🚀 Próximas Funcionalidades

- [ ] Autenticación JWT
- [ ] Autorización por roles
- [ ] Notificaciones en tiempo real
- [ ] API para móviles
- [ ] Integración con sistemas externos
- [ ] Dashboard administrativo
- [ ] Backup automático de datos
- [ ] Logs de auditoría avanzados

## 📞 Soporte

Para soporte técnico o consultas sobre la API, contactar al equipo de desarrollo.

---

**Versión:** 1.0.0  
**Última actualización:** Enero 2025  
**Mantenido por:** Equipo de Desarrollo de Bomberos Forestales
