# Configuración de Supabase para el Backend

## Pasos para conectar tu API a Supabase

### 1. Obtener credenciales de Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Settings** > **Database**
4. Copia la información de conexión:

```
Host: db.tu_proyecto.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [Tu contraseña del proyecto]
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `backend/` con:

```env
# Configuración de Supabase
DB_HOST=db.tu_proyecto.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USER=postgres
DB_PASSWORD=tu_password_supabase

# Configuración del servidor
PORT=3000
NODE_ENV=production

# JWT Secret (generar uno nuevo y seguro)
JWT_SECRET=tu_secreto_super_seguro_para_bomberos_2024

# CORS
CORS_ORIGIN=https://formulariofrontend.vercel.app
```

### 3. Habilitar SSL

El backend ya está configurado para usar SSL cuando `NODE_ENV=production`. Esto es necesario para Supabase.

### 4. Ejecutar scripts de base de datos

Si necesitas crear las tablas, ejecuta los scripts SQL en tu base de datos de Supabase:

1. Ve a **SQL Editor** en Supabase Dashboard
2. Copia y pega el contenido de `script_auth.sql`
3. Ejecuta el script

### 5. Probar la conexión

```bash
cd backend
npm start
```

Deberías ver: `✅ Conexión a PostgreSQL establecida correctamente`

## Notas importantes

- **SSL**: Siempre habilitado para Supabase
- **Pool de conexiones**: Configurado para máximo 20 conexiones simultáneas
- **Timeouts**: Configurados para evitar conexiones colgadas
- **Variables de entorno**: Nunca subir el archivo `.env` al repositorio

## Troubleshooting

### Error de SSL
```
Error: self signed certificate in certificate chain
```
**Solución**: Asegúrate de que `NODE_ENV=production`

### Error de conexión
```
Error: connect ECONNREFUSED
```
**Solución**: Verifica que el host y puerto sean correctos

### Error de autenticación
```
Error: password authentication failed
```
**Solución**: Verifica el usuario y contraseña en Supabase Dashboard
