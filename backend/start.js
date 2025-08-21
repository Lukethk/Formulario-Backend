#!/usr/bin/env node

// Script de inicio robusto para Render
console.log('🚀 Iniciando API de Formulario de Bomberos...');
console.log('📊 Variables de entorno:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurado' : '❌ Faltante');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurado' : '❌ Faltante');

// Verificar variables críticas
const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
  console.error('🔧 Asegúrate de configurar DATABASE_URL y JWT_SECRET en Render Dashboard');
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
