const { Pool } = require('pg');

let pool;

async function connectDB() {
  if (pool) return pool;

  console.log('🚦 Intentando conectar a Supabase PostgreSQL...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no está definida');
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // requerido para Supabase desde Render/local
    max: 10, // conexiones en el pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

  // Ping para verificar conexión
  try {
    await pool.query('SELECT 1');
    console.log('✅ Conectado a Supabase PostgreSQL');
  } catch (error) {
    console.error('❌ Error al hacer ping a la base de datos:', error.message);
    throw error;
  }

  return pool;
}

async function closeDB() {
  if (pool) {
    await pool.end();
    console.log('🔌 Pool de DB cerrado');
  }
}

async function query(text, params) {
  if (!pool) await connectDB();
  return pool.query(text, params);
}

module.exports = { connectDB, closeDB, query };
