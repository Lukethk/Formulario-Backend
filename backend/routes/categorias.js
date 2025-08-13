const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');

const router = express.Router();

// Validaciones para categorías
const categoriaValidation = [
  body('nombre').trim().isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres'),
  body('descripcion').optional().isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres')
];

// GET - Obtener todas las categorías
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, nombre, descripcion, created_at
      FROM categorias_equipos 
      ORDER BY nombre
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las categorías',
      error: error.message
    });
  }
});

// GET - Obtener una categoría por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT id, nombre, descripcion, created_at
      FROM categorias_equipos 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la categoría',
      error: error.message
    });
  }
});

// POST - Crear una nueva categoría
router.post('/', categoriaValidation, async (req, res) => {
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
    
    const { nombre, descripcion } = req.body;
    
    const result = await query(`
      INSERT INTO categorias_equipos (nombre, descripcion) 
      VALUES ($1, $2)
      RETURNING id, nombre, created_at
    `, [nombre, descripcion]);
    
    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    
    // Manejar error de duplicado
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear la categoría',
      error: error.message
    });
  }
});

// PUT - Actualizar una categoría
router.put('/:id', categoriaValidation, async (req, res) => {
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
    const { nombre, descripcion } = req.body;
    
    const result = await query(`
      UPDATE categorias_equipos 
      SET nombre = $1, descripcion = $2
      WHERE id = $3
      RETURNING id, nombre, descripcion
    `, [nombre, descripcion, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la categoría',
      error: error.message
    });
  }
});

// DELETE - Eliminar una categoría
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      DELETE FROM categorias_equipos 
      WHERE id = $1
      RETURNING id, nombre
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    
    // Manejar error de restricción de clave foránea
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la categoría porque tiene equipos asociados'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la categoría',
      error: error.message
    });
  }
});

// GET - Buscar categorías por nombre
router.get('/search/:nombre', async (req, res) => {
  try {
    const { nombre } = req.params;
    
    const result = await query(`
      SELECT id, nombre, descripcion, created_at
      FROM categorias_equipos 
      WHERE nombre ILIKE $1
      ORDER BY nombre
    `, [`%${nombre}%`]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error al buscar categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar categorías',
      error: error.message
    });
  }
});

// GET - Obtener equipos por categoría
router.get('/:id/equipos', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT e.id, e.nombre, e.descripcion, e.created_at
      FROM equipos e
      WHERE e.categoria_id = $1
      ORDER BY e.nombre
    `, [id]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener equipos de la categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los equipos de la categoría',
      error: error.message
    });
  }
});

module.exports = router;
