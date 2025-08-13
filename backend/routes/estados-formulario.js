const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { query } = require('../config/database');
const router = express.Router();

// Middleware para validar errores de validación
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

// GET /api/estados-formulario - Listar estados disponibles
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, nombre, color, descripcion, created_at
      FROM estados_formulario
      ORDER BY 
        CASE 
          WHEN id = 'pendiente' THEN 1
          WHEN id = 'en_revision' THEN 2
          WHEN id = 'aprobado' THEN 3
          WHEN id = 'en_proceso' THEN 4
          WHEN id = 'completado' THEN 5
          WHEN id = 'rechazado' THEN 6
          ELSE 7
        END
    `);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error al listar estados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/estados-formulario/:id - Obtener estado específico
router.get('/:id', [
  param('id').isString().trim().isLength({ min: 1, max: 50 })
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT id, nombre, color, descripcion, created_at
      FROM estados_formulario
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estado no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/estados-formulario - Crear nuevo estado
router.post('/', [
  body('id').isString().trim().isLength({ min: 1, max: 50 }).matches(/^[a-z_]+$/).withMessage('ID debe contener solo letras minúsculas y guiones bajos'),
  body('nombre').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Nombre es requerido y máximo 100 caracteres'),
  body('color').isHexColor().withMessage('Color debe ser un código hexadecimal válido'),
  body('descripcion').optional().isString().trim().isLength({ max: 500 })
], handleValidationErrors, async (req, res) => {
  try {
    const { id, nombre, color, descripcion } = req.body;

    // Verificar que el ID no exista
    const existingState = await query('SELECT id FROM estados_formulario WHERE id = $1', [id]);
    if (existingState.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un estado con ese ID'
      });
    }

    // Crear el nuevo estado
    const result = await query(`
      INSERT INTO estados_formulario (id, nombre, color, descripcion)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, nombre, color, descripcion]);

    res.status(201).json({
      success: true,
      message: 'Estado de formulario creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/estados-formulario/:id - Actualizar estado
router.put('/:id', [
  param('id').isString().trim().isLength({ min: 1, max: 50 }),
  body('nombre').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('color').optional().isHexColor(),
  body('descripcion').optional().isString().trim().isLength({ max: 500 })
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar que el estado existe
    const existingState = await query('SELECT id FROM estados_formulario WHERE id = $1', [id]);
    if (existingState.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estado no encontrado'
      });
    }

    // Construir query de actualización dinámicamente
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && key !== 'created_at') {
        updateFields.push(`${key} = $${paramIndex++}`);
        updateValues.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    updateValues.push(id);
    const result = await query(`
      UPDATE estados_formulario 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, updateValues);

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/estados-formulario/:id - Eliminar estado
router.delete('/:id', [
  param('id').isString().trim().isLength({ min: 1, max: 50 })
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el estado existe
    const existingState = await query('SELECT id FROM estados_formulario WHERE id = $1', [id]);
    if (existingState.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estado no encontrado'
      });
    }

    // Verificar que no esté siendo usado en formularios
    const usedState = await query('SELECT COUNT(*) as count FROM formularios_necesidades WHERE estado = $1', [id]);
    if (parseInt(usedState.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el estado porque está siendo usado en formularios',
        formularios_activos: parseInt(usedState.rows[0].count)
      });
    }

    // Eliminar el estado
    await query('DELETE FROM estados_formulario WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Estado eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/estados-formulario/:id/estadisticas - Estadísticas del estado
router.get('/:id/estadisticas', [
  param('id').isString().trim().isLength({ min: 1, max: 50 })
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el estado existe
    const existingState = await query('SELECT id FROM estados_formulario WHERE id = $1', [id]);
    if (existingState.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estado no encontrado'
      });
    }

    // Obtener estadísticas del estado
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_formularios,
        COUNT(CASE WHEN fecha_creacion >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as ultimos_30_dias,
        COUNT(CASE WHEN fecha_creacion >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as ultimos_7_dias,
        COUNT(CASE WHEN fecha_creacion >= CURRENT_DATE THEN 1 END) as hoy,
        AVG(EXTRACT(EPOCH FROM (updated_at - fecha_creacion))/3600) as tiempo_promedio_horas
      FROM formularios_necesidades 
      WHERE estado = $1
    `, [id]);

    // Obtener distribución por brigada
    const brigadasResult = await query(`
      SELECT 
        b.nombre as brigada_nombre,
        b.region,
        COUNT(*) as cantidad_formularios
      FROM formularios_necesidades fn
      JOIN brigadas b ON fn.brigada_id = b.id
      WHERE fn.estado = $1
      GROUP BY b.id, b.nombre, b.region
      ORDER BY cantidad_formularios DESC
    `, [id]);

    // Obtener evolución temporal (últimos 12 meses)
    const evolucionResult = await query(`
      SELECT 
        DATE_TRUNC('month', fecha_creacion) as mes,
        COUNT(*) as cantidad
      FROM formularios_necesidades 
      WHERE estado = $1 
        AND fecha_creacion >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', fecha_creacion)
      ORDER BY mes
    `, [id]);

    const estadisticas = statsResult.rows[0];
    estadisticas.distribucion_brigadas = brigadasResult.rows;
    estadisticas.evolucion_temporal = evolucionResult.rows;

    res.json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
