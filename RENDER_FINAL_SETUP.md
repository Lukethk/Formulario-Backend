# 🚨 CONFIGURACIÓN FINAL PARA RENDER - OBLIGATORIA

## ⚠️ **IMPORTANTE: Configura MANUALMENTE en Render Dashboard**

### **1. Build & Deploy:**
- **Build Command**: `npm install`
- **Start Command**: `bash render-start.sh` ← **ESTE ES CLAVE**

### **2. Environment Variables (OBLIGATORIAS):**
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

### **3. Configuración del Servicio:**
- **Name**: `formulario-bombero-api`
- **Environment**: `Node`
- **Region**: `Oregon (US West)`
- **Branch**: `backend`
- **Root Directory**: `backend`

## 🔧 **Archivos de Configuración Creados:**

- ✅ `backend/.node-version` - Fuerza Node.js 18.17.0
- ✅ `backend/render-start.sh` - Script de inicio personalizado
- ✅ `backend/start.js` - Script de inicio robusto
- ✅ `render.yaml` - Configuración automática

## 🚀 **DESPUÉS DE CONFIGURAR:**

### **1. Guarda la configuración**
### **2. Render hará redeploy automáticamente**
### **3. Verifica en los logs que use:**
```
==> Running build command 'npm install'...
==> Running 'bash render-start.sh'
🚀 Iniciando API con script personalizado...
📊 Variables de entorno:
✅ Todas las variables de entorno están configuradas
🔄 Iniciando servidor con start.js...
🚀 Iniciando API de Formulario de Bomberos...
✅ Servidor iniciado correctamente
```

## ⚠️ **IMPORTANTE:**
- **NO confíes** en el render.yaml del repositorio
- **Configura MANUALMENTE** en Render Dashboard
- **Start Command DEBE ser**: `bash render-start.sh`
- **Verifica** que todas las variables estén configuradas

## 🔍 **Si sigue fallando:**
1. Verifica que el Root Directory sea `backend`
2. Confirma que la rama sea `backend`
3. Asegúrate de que Start Command sea `bash render-start.sh`
4. Verifica que todas las variables de entorno estén configuradas
