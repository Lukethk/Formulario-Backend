#!/usr/bin/env node

// Script de inicio robusto para Render
console.log('🚀 Iniciando API de Formulario de Bomberos...');
console.log('📊 Variables de entorno:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- DB_HOST:', process.env.DB_HOST ? '✅ Configurado' : '❌ Faltante');
console.log('- DB_USER:', process.env.DB_USER ? '✅ Configurado' : '❌ Faltante');
console.log('- DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ Configurado' : '❌ Faltante');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurado' : '❌ Faltante');

// Verificar variables críticas
const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
  console.error('🔧 Asegúrate de configurar todas las variables en Render Dashboard');
  process.exit(1);
}

console.log('✅ Todas las variables de entorno están configuradas');
console.log('🔄 Iniciando servidor...');

// Importar y ejecutar el servidor
try {
  require('./server.js');
  console.log('✅ Servidor iniciado correctamente');
} catch (error) {
  console.error('❌ Error al iniciar el servidor:', error.message);
  console.error('📋 Stack trace:', error.stack);
  process.exit(1);
}
