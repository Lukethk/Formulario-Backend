const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');

const router = express.Router();

// Validaciones para tallas
const tallaValidation = [
  body('nombre').trim().isLength({ min: 1, max: 20 }).withMessage('El nombre debe tener entre 1 y 20 caracteres'),
  body('tipo').optional().isLength({ max: 50 }).withMessage('El tipo no puede exceder 50 caracteres')
];

// GET - Obtener todas las tallas
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, nombre, tipo, created_at
      FROM tallas 
      ORDER BY tipo, nombre
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener tallas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las tallas',
      error: error.message
    });
  }
});

// GET - Obtener una talla por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT id, nombre, tipo, created_at
      FROM tallas 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Talla no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener talla:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la talla',
      error: error.message
    });
  }
});

// POST - Crear una nueva talla
router.post('/', tallaValidation, async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }
    
    const { nombre, tipo } = req.body;
    
    const result = await query(`
      INSERT INTO tallas (nombre, tipo) 
      VALUES ($1, $2)
      RETURNING id, nombre, tipo, created_at
    `, [nombre, tipo]);
    
    res.status(201).json({
      success: true,
      message: 'Talla creada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear talla:', error);
    
    // Manejar error de duplicado
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una talla con ese nombre'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear la talla',
      error: error.message
    });
  }
});

// PUT - Actualizar una talla
router.put('/:id', tallaValidation, async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { nombre, tipo } = req.body;
    
    const result = await query(`
      UPDATE tallas 
      SET nombre = $1, tipo = $2
      WHERE id = $3
      RETURNING id, nombre, tipo
    `, [nombre, tipo, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Talla no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Talla actualizada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar talla:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la talla',
      error: error.message
    });
  }
});

// DELETE - Eliminar una talla
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      DELETE FROM tallas 
      WHERE id = $1
      RETURNING id, nombre
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Talla no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Talla eliminada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al eliminar talla:', error);
    
    // Manejar error de restricción de clave foránea
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la talla porque está asociada a equipos de brigadas'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la talla',
      error: error.message
    });
  }
});

// GET - Buscar tallas por nombre
router.get('/search/:nombre', async (req, res) => {
  try {
    const { nombre } = req.params;
    
    const result = await query(`
      SELECT id, nombre, tipo, created_at
      FROM tallas 
      WHERE nombre ILIKE $1
      ORDER BY tipo, nombre
    `, [`%${nombre}%`]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error al buscar tallas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar tallas',
      error: error.message
    });
  }
});

// GET - Obtener tallas por tipo
router.get('/tipo/:tipo', async (req, res) => {
  try {
    const { tipo } = req.params;
    
    const result = await query(`
      SELECT id, nombre, tipo, created_at
      FROM tallas 
      WHERE tipo = $1
      ORDER BY nombre
    `, [tipo]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener tallas por tipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las tallas por tipo',
      error: error.message
    });
  }
});

// GET - Obtener tipos de tallas disponibles
router.get('/tipos/disponibles', async (req, res) => {
  try {
    const result = await query(`
      SELECT DISTINCT tipo
      FROM tallas 
      ORDER BY tipo
    `);
    
    res.json({
      success: true,
      data: result.rows.map(row => row.tipo),
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener tipos de tallas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los tipos de tallas',
      error: error.message
    });
  }
});

module.exports = router;
