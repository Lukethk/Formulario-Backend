// Script de prueba para verificar CORS
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de CORS de prueba
app.use(cors({
  origin: 'https://formulariofrontend.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));

// Middleware para headers CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://formulariofrontend.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Ruta de prueba
app.get('/test', (req, res) => {
  res.json({
    message: 'CORS funcionando correctamente',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    method: req.method
  });
});

// Ruta de prueba para OPTIONS
app.options('/test', (req, res) => {
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🧪 Servidor de prueba CORS corriendo en puerto ${PORT}`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/test`);
});
