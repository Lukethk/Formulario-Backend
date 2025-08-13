const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');

const router = express.Router();

// Validaciones para equipos
const equipoValidation = [
  body('categoria_id').isInt({ min: 1 }).withMessage('La categoría es obligatoria y debe ser un ID válido'),
  body('nombre').trim().isLength({ min: 2, max: 200 }).withMessage('El nombre debe tener entre 2 y 200 caracteres'),
  body('descripcion').optional().isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres')
];

// GET - Obtener todos los equipos con información de categoría
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        e.id, e.nombre, e.descripcion, e.created_at,
        c.id as categoria_id, c.nombre as categoria_nombre
      FROM equipos e
      INNER JOIN categorias_equipos c ON e.categoria_id = c.id
      ORDER BY c.nombre, e.nombre
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener equipos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los equipos',
      error: error.message
    });
  }
});

// GET - Obtener un equipo por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        e.id, e.nombre, e.descripcion, e.created_at,
        c.id as categoria_id, c.nombre as categoria_nombre
      FROM equipos e
      INNER JOIN categorias_equipos c ON e.categoria_id = c.id
      WHERE e.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener equipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el equipo',
      error: error.message
    });
  }
});

// POST - Crear un nuevo equipo
router.post('/', equipoValidation, async (req, res) => {
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
    
    const { categoria_id, nombre, descripcion } = req.body;
    
    // Verificar que la categoría existe
    const categoriaCheck = await query(`
      SELECT id, nombre FROM categorias_equipos WHERE id = $1
    `, [categoria_id]);
    
    if (categoriaCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La categoría especificada no existe'
      });
    }
    
    const result = await query(`
      INSERT INTO equipos (categoria_id, nombre, descripcion) 
      VALUES ($1, $2, $3)
      RETURNING id, nombre, categoria_id, created_at
    `, [categoria_id, nombre, descripcion]);
    
    res.status(201).json({
      success: true,
      message: 'Equipo creado exitosamente',
      data: {
        ...result.rows[0],
        categoria_nombre: categoriaCheck.rows[0].nombre
      }
    });
  } catch (error) {
    console.error('Error al crear equipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el equipo',
      error: error.message
    });
  }
});

// PUT - Actualizar un equipo
router.put('/:id', equipoValidation, async (req, res) => {
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
    const { categoria_id, nombre, descripcion } = req.body;
    
    // Verificar que la categoría existe
    const categoriaCheck = await query(`
      SELECT id, nombre FROM categorias_equipos WHERE id = $1
    `, [categoria_id]);
    
    if (categoriaCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La categoría especificada no existe'
      });
    }
    
    const result = await query(`
      UPDATE equipos 
      SET categoria_id = $1, nombre = $2, descripcion = $3
      WHERE id = $4
      RETURNING id, nombre, categoria_id, descripcion
    `, [categoria_id, nombre, descripcion, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Equipo actualizado exitosamente',
      data: {
        ...result.rows[0],
        categoria_nombre: categoriaCheck.rows[0].nombre
      }
    });
  } catch (error) {
    console.error('Error al actualizar equipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el equipo',
      error: error.message
    });
  }
});

// DELETE - Eliminar un equipo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      DELETE FROM equipos 
      WHERE id = $1
      RETURNING id, nombre
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Equipo eliminado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al eliminar equipo:', error);
    
    // Manejar error de restricción de clave foránea
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el equipo porque está asociado a brigadas'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el equipo',
      error: error.message
    });
  }
});

// GET - Buscar equipos por nombre
router.get('/search/:nombre', async (req, res) => {
  try {
    const { nombre } = req.params;
    
    const result = await query(`
      SELECT 
        e.id, e.nombre, e.descripcion, e.created_at,
        c.id as categoria_id, c.nombre as categoria_nombre
      FROM equipos e
      INNER JOIN categorias_equipos c ON e.categoria_id = c.id
      WHERE e.nombre ILIKE $1
      ORDER BY c.nombre, e.nombre
    `, [`%${nombre}%`]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error al buscar equipos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar equipos',
      error: error.message
    });
  }
});

// GET - Obtener equipos por categoría
router.get('/categoria/:categoriaId', async (req, res) => {
  try {
    const { categoriaId } = req.params;
    
    const result = await query(`
      SELECT 
        e.id, e.nombre, e.descripcion, e.created_at,
        c.id as categoria_id, c.nombre as categoria_nombre
      FROM equipos e
      INNER JOIN categorias_equipos c ON e.categoria_id = c.id
      WHERE e.categoria_id = $1
      ORDER BY e.nombre
    `, [categoriaId]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener equipos por categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los equipos por categoría',
      error: error.message
    });
  }
});

module.exports = router;
