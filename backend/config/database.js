const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE || 'formulario',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '9030',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(dbConfig);

async function connectDB() {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    client.release();
    return pool;
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    throw error;
  }
}

async function closeDB() {
  try {
    await pool.end();
    console.log('🔌 Conexión a la base de datos cerrada');
  } catch (error) {
    console.error('❌ Error al cerrar la conexión:', error.message);
  }
}

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Consulta ejecutada en', duration, 'ms');
    return res;
  } catch (error) {
    console.error('❌ Error en la consulta:', error.message);
    throw error;
  }
}

module.exports = {
  connectDB,
  closeDB,
  query,
  pool
};
