# 🔧 Variables de Entorno para Render - OBLIGATORIAS

## ⚠️ **IMPORTANTE: Configura TODAS estas variables en Render Dashboard**

### **📋 Variables que DEBES configurar:**

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Entorno de producción |
| `PORT` | `10000` | Puerto del servidor |
| `DB_HOST` | `aws-1-us-east-2.pooler.supabase.com` | Host de Supabase |
| `DB_PORT` | `5432` | Puerto de la base de datos |
| `DB_DATABASE` | `postgres` | Nombre de la base de datos |
| `DB_USER` | `postgres.gopaihcwqudyzftdjpmx` | Usuario de Supabase |
| `DB_PASSWORD` | `9030` | Contraseña de Supabase |
| `JWT_SECRET` | `bomberos_formulario_2024_supabase_secreto_super_seguro_cambiar_en_produccion` | Secreto JWT |
| `JWT_EXPIRES_IN` | `7d` | Expiración del token |
| `CORS_ORIGIN` | `https://formulariofrontend.vercel.app` | Origen permitido |

## 🚨 **PASOS EN RENDER DASHBOARD:**

### **1. Ve a tu servicio:**
- Dashboard → Tu servicio → Environment

### **2. Agrega cada variable:**
- Haz clic en **"Add Environment Variable"**
- **Key**: `NODE_ENV`
- **Value**: `production`
- Repite para cada variable

### **3. Verifica que estén todas:**
- Debes ver 10 variables configuradas
- Todas deben tener valores (no vacías)

## 🔍 **Verificar en los logs:**

Una vez configuradas, deberías ver en los logs:
```
🚀 Iniciando API de Formulario de Bomberos...
📊 Variables de entorno:
- NODE_ENV: production
- PORT: 10000
- DB_HOST: ✅ Configurado
- DB_USER: ✅ Configurado
- DB_PASSWORD: ✅ Configurado
- JWT_SECRET: ✅ Configurado
✅ Todas las variables de entorno están configuradas
🔄 Iniciando servidor...
✅ Servidor iniciado correctamente
```

## ❌ **Si falta alguna variable:**
```
❌ Variables de entorno faltantes: DB_HOST, DB_USER
🔧 Asegúrate de configurar todas las variables en Render Dashboard
```

## 🚀 **Después de configurar:**
1. Guarda las variables
2. Render hará redeploy automáticamente
3. Revisa los logs para confirmar que funcione
