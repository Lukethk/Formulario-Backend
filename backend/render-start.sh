#!/bin/bash
echo "🚀 Iniciando API con script personalizado..."
echo "📊 Variables de entorno:"
echo "- NODE_ENV: $NODE_ENV"
echo "- PORT: $PORT"
echo "- DB_HOST: $DB_HOST"
echo "- DB_USER: $DB_USER"
echo "- DB_PASSWORD: $DB_PASSWORD"
echo "- JWT_SECRET: $JWT_SECRET"

# Verificar variables críticas
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
    echo "❌ Variables de entorno faltantes"
    echo "🔧 Asegúrate de configurar todas las variables en Render Dashboard"
    exit 1
fi

echo "✅ Todas las variables de entorno están configuradas"
echo "🔄 Iniciando servidor con start.js..."

# Ejecutar start.js
exec node start.js
