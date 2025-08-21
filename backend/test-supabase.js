// Script temporal para probar conexión con Supabase
require('dotenv').config();

// Configurar DATABASE_URL manualmente para la prueba
process.env.DATABASE_URL = 'postgresql://postgres.gopaihcwqudyzftdjpmx:9030@aws-1-us-east-2.pooler.supabase.com:5432/postgres';
process.env.NODE_ENV = 'development';

console.log('🧪 Probando conexión con Supabase...');
console.log('📊 DATABASE_URL:', process.env.DATABASE_URL);

const { connectDB, query } = require('./config/database');

async function testConnection() {
  try {
    console.log('🚦 Conectando a la base de datos...');
    
    // Probar conexión
    await connectDB();
    
    console.log('✅ Conexión exitosa!');
    
    // Probar consulta simple
    console.log('📊 Probando consulta SELECT NOW()...');
    const result = await query('SELECT NOW() AS now');
    console.log('✅ Consulta exitosa:', result.rows[0]);
    
    // Probar consulta a la tabla usuarios
    console.log('👥 Probando consulta a tabla usuarios...');
    const usuarios = await query('SELECT COUNT(*) as total FROM usuarios');
    console.log('✅ Total de usuarios:', usuarios.rows[0].total);
    
    // Probar consulta a la tabla brigadas
    console.log('🚒 Probando consulta a tabla brigadas...');
    const brigadas = await query('SELECT COUNT(*) as total FROM brigadas');
    console.log('✅ Total de brigadas:', brigadas.rows[0].total);
    
    console.log('🎉 ¡Todas las pruebas pasaron exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    console.error('📋 Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

testConnection();
