const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { connectDB } = require('./config/database');

const brigadasRoutes = require('./routes/brigadas');
const equiposRoutes = require('./routes/equipos');
const categoriasRoutes = require('./routes/categorias');
const tallasRoutes = require('./routes/tallas');
const equiposBrigadaRoutes = require('./routes/equiposBrigada');
const formulariosNecesidadesRoutes = require('./routes/formularios-necesidades');
const estadosFormularioRoutes = require('./routes/estados-formulario');
const reportesRoutes = require('./routes/reportes');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

// Configuración de CORS simplificada y robusta
app.use(cors({
  origin: 'https://formulariofrontend.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));

// Middleware para manejar preflight requests
app.options('*', cors());

// Middleware adicional para headers CORS (backup)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://formulariofrontend.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Log para debugging
  console.log(`🌐 Request: ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Preflight request OPTIONS manejado');
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(morgan('combined'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({
    message: '🚒 API de Formulario de Bomberos funcionando correctamente',
    version: '1.0.0',
    cors: '✅ CORS configurado para https://formulariofrontend.vercel.app',
    endpoints: {
      auth: '/api/auth',
      brigadas: '/api/brigadas',
      equipos: '/api/equipos',
      categorias: '/api/categorias',
      tallas: '/api/tallas',
      equiposBrigada: '/api/equipos-brigada',
      formulariosNecesidades: '/api/formularios-necesidades',
      estadosFormulario: '/api/estados-formulario',
      reportes: '/api/reportes'
    }
  });
});

// Ruta de prueba para CORS
app.get('/test-cors', (req, res) => {
  res.json({
    message: '🧪 Test CORS exitoso',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    method: req.method,
    cors: '✅ Funcionando correctamente'
  });
});

app.options('/test-cors', cors());

// Ruta de salud para probar la base de datos
const { query } = require('./config/database');

app.get('/health/db', async (req, res) => {
  try {
    const result = await query('SELECT NOW() AS now');
    res.json({ 
      ok: true, 
      now: result.rows[0].now,
      message: '✅ Base de datos funcionando correctamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ health/db error:', error);
    res.status(500).json({ 
      ok: false, 
      error: error.message,
      message: '❌ Error en la base de datos',
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/brigadas', brigadasRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/tallas', tallasRoutes);
app.use('/api/equipos-brigada', equiposBrigadaRoutes);
app.use('/api/formularios-necesidades', formulariosNecesidadesRoutes);
app.use('/api/estados-formulario', estadosFormularioRoutes);
app.use('/api/reportes', reportesRoutes);

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

async function startServer() {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📊 Modo: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API disponible en: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\n🛑 Recibida señal SIGINT, cerrando servidor...');
  const { closeDB } = require('./config/database');
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recibida señal SIGTERM, cerrando servidor...');
  const { closeDB } = require('./config/database');
  await closeDB();
  process.exit(0);
});

startServer();
