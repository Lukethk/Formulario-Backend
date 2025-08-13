const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');

const router = express.Router();

// Validaciones para equipos por brigada
const equipoBrigadaValidation = [
  body('brigada_id').isInt({ min: 1 }).withMessage('La brigada es obligatoria y debe ser un ID válido'),
  body('equipo_id').isInt({ min: 1 }).withMessage('El equipo es obligatorio y debe ser un ID válido'),
  body('talla_id').optional().isInt({ min: 1 }).withMessage('La talla debe ser un ID válido'),
  body('cantidad').isInt({ min: 0 }).withMessage('La cantidad debe ser un número positivo'),
  body('observaciones').optional().isLength({ max: 1000 }).withMessage('Las observaciones no pueden exceder 1000 caracteres')
];

// GET - Obtener todos los equipos por brigada con información detallada
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        eb.id, eb.cantidad, eb.observaciones, eb.created_at, eb.updated_at,
        b.id as brigada_id, b.nombre as brigada_nombre,
        e.id as equipo_id, e.nombre as equipo_nombre,
        c.id as categoria_id, c.nombre as categoria_nombre,
        t.id as talla_id, t.nombre as talla_nombre, t.tipo as talla_tipo
      FROM equipos_brigada eb
      INNER JOIN brigadas b ON eb.brigada_id = b.id
      INNER JOIN equipos e ON eb.equipo_id = e.id
      INNER JOIN categorias_equipos c ON e.categoria_id = c.id
      LEFT JOIN tallas t ON eb.talla_id = t.id
      ORDER BY b.nombre, c.nombre, e.nombre, t.nombre
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener equipos por brigada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los equipos por brigada',
      error: error.message
    });
  }
});

// GET - Obtener un equipo por brigada por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        eb.id, eb.cantidad, eb.observaciones, eb.created_at, eb.updated_at,
        b.id as brigada_id, b.nombre as brigada_nombre,
        e.id as equipo_id, e.nombre as equipo_nombre,
        c.id as categoria_id, c.nombre as categoria_nombre,
        t.id as talla_id, t.nombre as talla_nombre, t.tipo as talla_tipo
      FROM equipos_brigada eb
      INNER JOIN brigadas b ON eb.brigada_id = b.id
      INNER JOIN equipos e ON eb.equipo_id = e.id
      INNER JOIN categorias_equipos c ON e.categoria_id = c.id
      LEFT JOIN tallas t ON eb.talla_id = t.id
      WHERE eb.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo por brigada no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener equipo por brigada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el equipo por brigada',
      error: error.message
    });
  }
});

// GET - Obtener equipos por brigada específica
router.get('/brigada/:brigadaId', async (req, res) => {
  try {
    const { brigadaId } = req.params;
    
    const result = await query(`
      SELECT 
        eb.id, eb.cantidad, eb.observaciones, eb.created_at, eb.updated_at,
        b.id as brigada_id, b.nombre as brigada_nombre,
        e.id as equipo_id, e.nombre as equipo_nombre,
        c.id as categoria_id, c.nombre as categoria_nombre,
        t.id as talla_id, t.nombre as talla_nombre, t.tipo as talla_tipo
      FROM equipos_brigada eb
      INNER JOIN brigadas b ON eb.brigada_id = b.id
      INNER JOIN equipos e ON eb.equipo_id = e.id
      INNER JOIN categorias_equipos c ON e.categoria_id = c.id
      LEFT JOIN tallas t ON eb.talla_id = t.id
      WHERE eb.brigada_id = $1
      ORDER BY c.nombre, e.nombre, t.nombre
    `, [brigadaId]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener equipos de la brigada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los equipos de la brigada',
      error: error.message
    });
  }
});

// POST - Crear un nuevo equipo por brigada
router.post('/', equipoBrigadaValidation, async (req, res) => {
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
    
    const { brigada_id, equipo_id, talla_id, cantidad, observaciones } = req.body;
    
    // Verificar que la brigada existe
    const brigadaCheck = await query(`
      SELECT id, nombre FROM brigadas WHERE id = $1
    `, [brigada_id]);
    
    if (brigadaCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La brigada especificada no existe'
      });
    }
    
    // Verificar que el equipo existe
    const equipoCheck = await query(`
      SELECT id, nombre FROM equipos WHERE id = $1
    `, [equipo_id]);
    
    if (equipoCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El equipo especificado no existe'
      });
    }
    
    // Verificar que la talla existe si se especifica
    if (talla_id) {
      const tallaCheck = await query(`
        SELECT id, nombre FROM tallas WHERE id = $1
      `, [talla_id]);
      
      if (tallaCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'La talla especificada no existe'
        });
      }
    }
    
    const result = await query(`
      INSERT INTO equipos_brigada (brigada_id, equipo_id, talla_id, cantidad, observaciones) 
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, brigada_id, equipo_id, talla_id, cantidad, created_at
    `, [brigada_id, equipo_id, talla_id, cantidad, observaciones]);
    
    res.status(201).json({
      success: true,
      message: 'Equipo por brigada creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear equipo por brigada:', error);
    
    // Manejar error de duplicado
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un registro con la misma brigada, equipo y talla'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear el equipo por brigada',
      error: error.message
    });
  }
});

// PUT - Actualizar un equipo por brigada
router.put('/:id', equipoBrigadaValidation, async (req, res) => {
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
    const { brigada_id, equipo_id, talla_id, cantidad, observaciones } = req.body;
    
    // Verificar que la brigada existe
    const brigadaCheck = await query(`
      SELECT id, nombre FROM brigadas WHERE id = $1
    `, [brigada_id]);
    
    if (brigadaCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La brigada especificada no existe'
      });
    }
    
    // Verificar que el equipo existe
    const equipoCheck = await query(`
      SELECT id, nombre FROM equipos WHERE id = $1
    `, [equipo_id]);
    
    if (equipoCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El equipo especificado no existe'
      });
    }
    
    // Verificar que la talla existe si se especifica
    if (talla_id) {
      const tallaCheck = await query(`
        SELECT id, nombre FROM tallas WHERE id = $1
      `, [talla_id]);
      
      if (tallaCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'La talla especificada no existe'
        });
      }
    }
    
    const result = await query(`
      UPDATE equipos_brigada 
      SET 
        brigada_id = $1,
        equipo_id = $2,
        talla_id = $3,
        cantidad = $4,
        observaciones = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, brigada_id, equipo_id, talla_id, cantidad, updated_at
    `, [brigada_id, equipo_id, talla_id, cantidad, observaciones, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo por brigada no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Equipo por brigada actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar equipo por brigada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el equipo por brigada',
      error: error.message
    });
  }
});

// DELETE - Eliminar un equipo por brigada
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      DELETE FROM equipos_brigada 
      WHERE id = $1
      RETURNING id, brigada_id, equipo_id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo por brigada no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Equipo por brigada eliminado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al eliminar equipo por brigada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el equipo por brigada',
      error: error.message
    });
  }
});

// GET - Resumen de equipos por brigada
router.get('/resumen/brigadas', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        b.id as brigada_id, b.nombre as brigada_nombre,
        COUNT(eb.id) as total_equipos,
        SUM(eb.cantidad) as total_cantidad
      FROM brigadas b
      LEFT JOIN equipos_brigada eb ON b.id = eb.brigada_id
      GROUP BY b.id, b.nombre
      ORDER BY b.nombre
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener resumen de equipos por brigada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen de equipos por brigada',
      error: error.message
    });
  }
});

// GET - Resumen de equipos por categoría
router.get('/resumen/categorias', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        c.id as categoria_id, c.nombre as categoria_nombre,
        COUNT(DISTINCT eb.brigada_id) as brigadas_con_equipo,
        SUM(eb.cantidad) as total_cantidad
      FROM categorias_equipos c
      LEFT JOIN equipos e ON c.id = e.categoria_id
      LEFT JOIN equipos_brigada eb ON e.id = eb.equipo_id
      GROUP BY c.id, c.nombre
      ORDER BY c.nombre
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener resumen de equipos por categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen de equipos por categoría',
      error: error.message
    });
  }
});

module.exports = router;
