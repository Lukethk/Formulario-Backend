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

// Configuración de CORS mejorada
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como aplicaciones móviles)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://formulariofrontend.vercel.app',
      'https://localhost:4200',
      'http://localhost:4200'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 Origen bloqueado por CORS:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware adicional para headers CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://formulariofrontend.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
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
