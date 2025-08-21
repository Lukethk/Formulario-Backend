# 🚀 Despliegue en Render - API Formulario Bomberos

## 📋 **Configuración en Render Dashboard**

### **1. Crear nuevo Web Service:**
- **Name**: `formulario-bombero-api`
- **Environment**: `Node`
- **Region**: `Oregon (US West)`
- **Branch**: `backend`
- **Root Directory**: `backend`

### **2. Configurar Build & Deploy:**
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

### **3. Variables de Entorno (Environment Variables):**
```env
NODE_ENV=production
PORT=10000
DB_HOST=aws-1-us-east-2.pooler.supabase.com
DB_PORT=5432
DB_DATABASE=postgres
DB_USER=postgres.gopaihcwqudyzftdjpmx
DB_PASSWORD=9030
JWT_SECRET=bomberos_formulario_2024_supabase_secreto_super_seguro_cambiar_en_produccion
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://formulariofrontend.vercel.app
```

## 🔧 **Archivos de Configuración**

### **render.yaml** ✅
- Configuración automática del servicio
- Variables de entorno predefinidas

### **.nvmrc** ✅
- Especifica versión de Node.js (18.17.0)

### **package.json** ✅
- Scripts de inicio configurados
- Dependencias especificadas
- Versiones de Node.js y npm

## 🚨 **Solución de Problemas Comunes**

### **Error: "Application exited early"**
**Causa**: Variables de entorno faltantes
**Solución**: Verificar todas las variables en Render Dashboard

### **Error: "Cannot find module"**
**Causa**: Dependencias no instaladas
**Solución**: Verificar que `buildCommand` sea `npm install`

### **Error: "Port already in use"**
**Causa**: Puerto ocupado
**Solución**: Render asigna puerto automáticamente

## 📱 **Probar la API Desplegada**

Una vez desplegada, tu API estará disponible en:
```
https://formulario-bombero-api.onrender.com
```

### **Endpoints disponibles:**
- **Health Check**: `GET /`
- **Autenticación**: `POST /api/auth/login`
- **Brigadas**: `GET /api/brigadas`
- **Equipos**: `GET /api/equipos`
- **Formularios**: `GET /api/formularios-necesidades`

## 🔒 **Seguridad**

- **SSL**: Automáticamente habilitado por Render
- **CORS**: Configurado para tu frontend de Vercel
- **Variables de entorno**: Protegidas en Render Dashboard
- **JWT**: Configurado para producción

## 📞 **Soporte**

Si tienes problemas:
1. Revisar logs en Render Dashboard
2. Verificar variables de entorno
3. Confirmar que Supabase esté funcionando
4. Verificar que el repositorio esté sincronizado
