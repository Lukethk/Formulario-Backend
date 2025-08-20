const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateToken } = require('../config/auth');
const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: errors.array()
    });
  }
  next();
};

// Validaciones para registro
const validateRegister = [
  body('nombre').trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('rol').isIn(['bombero', 'comandante', 'admin']).withMessage('Rol inválido'),
  body('brigada_id').isUUID().withMessage('ID de brigada debe ser un UUID válido'),
  body('numero_legajo').optional().isString().trim().isLength({ max: 50 }),
  body('telefono').optional().isString().trim().isLength({ max: 20 }),
  body('activo').optional().isBoolean()
];

// Validaciones para login
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida')
];

// REGISTRO DE USUARIO
router.post('/register', validateRegister, handleValidationErrors, async (req, res) => {
  try {
    const {
      nombre,
      email,
      password,
      rol,
      brigada_id,
      numero_legajo,
      telefono,
      activo = true
    } = req.body;

    // Verificar si el email ya existe
    const existingUser = await query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Verificar si la brigada existe
    const brigadaCheck = await query('SELECT id FROM brigadas WHERE id = $1', [brigada_id]);
    if (brigadaCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La brigada especificada no existe'
      });
    }

    // Encriptar contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const result = await query(`
      INSERT INTO usuarios (
        nombre, email, password_hash, rol, brigada_id, 
        numero_legajo, telefono, activo, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING id, nombre, email, rol, brigada_id, numero_legajo, telefono, activo, created_at
    `, [
      nombre, email, hashedPassword, rol, brigada_id, 
      numero_legajo, telefono, activo
    ]);

    const newUser = result.rows[0];

    // Generar token JWT
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: newUser.id,
          nombre: newUser.nombre,
          email: newUser.email,
          rol: newUser.rol,
          brigada_id: newUser.brigada_id,
          numero_legajo: newUser.numero_legajo,
          telefono: newUser.telefono,
          activo: newUser.activo
        },
        token
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// LOGIN DE USUARIO
router.post('/login', validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email
    const result = await query(`
      SELECT u.*, b.nombre as brigada_nombre 
      FROM usuarios u 
      LEFT JOIN brigadas b ON u.brigada_id = b.id 
      WHERE u.email = $1 AND u.activo = true
    `, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = result.rows[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = generateToken(user);

    // Actualizar último login
    await query('UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          brigada_id: user.brigada_id,
          brigada_nombre: user.brigada_nombre,
          numero_legajo: user.numero_legajo,
          telefono: user.telefono,
          activo: user.activo
        },
        token
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// VERIFICAR TOKEN (para validar sesión)
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.headers['x-access-token'];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token requerido'
      });
    }

    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../config/auth');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Obtener datos actualizados del usuario
    const result = await query(`
      SELECT u.*, b.nombre as brigada_nombre 
      FROM usuarios u 
      LEFT JOIN brigadas b ON u.brigada_id = b.id 
      WHERE u.id = $1 AND u.activo = true
    `, [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      message: 'Token válido',
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          brigada_id: user.brigada_id,
          brigada_nombre: user.brigada_nombre,
          numero_legajo: user.numero_legajo,
          telefono: user.telefono,
          activo: user.activo
        }
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
});

// CAMBIAR CONTRASEÑA
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
  body('newPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
], handleValidationErrors, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener usuario actual
    const userResult = await query('SELECT password_hash FROM usuarios WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = userResult.rows[0];

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Encriptar nueva contraseña
    const saltRounds = 12;
    const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await query('UPDATE usuarios SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', 
      [newHashedPassword, userId]);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
