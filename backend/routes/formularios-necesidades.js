const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { query } = require('../config/database');
const { verifyToken, requireRole } = require('../config/auth');
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

const validateFormulario = [
  body('brigada_id').isUUID().withMessage('ID de brigada debe ser un UUID válido'),
  body('estado').optional().isIn(['pendiente', 'en_revision', 'aprobado', 'rechazado', 'en_proceso', 'completado']),
  body('observaciones_admin').optional().isString().trim().isLength({ max: 1000 }),
  body('epp_ropa').optional().isObject(),
  body('epp_botas').optional().isObject(),
  body('epp_general').optional().isObject(),
  body('epp_guantes').optional().isObject(),
  body('herramientas').optional().isObject(),
  body('logistica_vehiculos').optional().isObject(),
  body('alimentacion').optional().isObject(),
  body('equipo_campo').optional().isObject(),
  body('limpieza_personal').optional().isObject(),
  body('limpieza_general').optional().isObject(),
  body('medicamentos').optional().isObject(),
  body('rescate_animal').optional().isObject()
];

router.post('/', verifyToken, validateFormulario, handleValidationErrors, async (req, res) => {
  try {
    const {
      brigada_id,
      epp_ropa = {},
      epp_botas = {},
      epp_general = {},
      epp_guantes = {},
      herramientas = {},
      logistica_vehiculos = {},
      alimentacion = {},
      equipo_campo = {},
      limpieza_personal = {},
      limpieza_general = {},
      medicamentos = {},
      rescate_animal = {}
    } = req.body;

    const brigadaCheck = await query('SELECT id FROM brigadas WHERE id = $1', [brigada_id]);
    if (brigadaCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Brigada no encontrada'
      });
    }

    const result = await query(`
      INSERT INTO formularios_necesidades (
        brigada_id, usuario_id, epp_ropa, epp_botas, epp_general, epp_guantes,
        herramientas, logistica_vehiculos, alimentacion, equipo_campo,
        limpieza_personal, limpieza_general, medicamentos, rescate_animal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      brigada_id, req.user.id, epp_ropa, epp_botas, epp_general, epp_guantes,
      herramientas, logistica_vehiculos, alimentacion, equipo_campo,
      limpieza_personal, limpieza_general, medicamentos, rescate_animal
    ]);

    await query(`
      INSERT INTO historial_estados (formulario_id, estado_anterior, estado_nuevo, comentario, usuario_id)
      VALUES ($1, NULL, $2, 'Formulario creado', $3)
    `, [result.rows[0].id, 'pendiente', req.user.id]);

    res.status(201).json({
      success: true,
      message: 'Formulario de necesidades creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear formulario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const {
      brigada_id,
      estado,
      fecha_desde,
      fecha_hasta,
      page = 1,
      limit = 10,
      sort_by = 'fecha_creacion',
      sort_order = 'DESC'
    } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Filtrar por brigada del usuario (si no es admin)
    if (req.user.rol !== 'admin') {
      whereConditions.push(`fn.brigada_id = $${paramIndex++}`);
      queryParams.push(req.user.brigada_id);
    } else if (brigada_id) {
      whereConditions.push(`fn.brigada_id = $${paramIndex++}`);
      queryParams.push(brigada_id);
    }

    if (estado) {
      whereConditions.push(`fn.estado = $${paramIndex++}`);
      queryParams.push(estado);
    }

    if (fecha_desde) {
      whereConditions.push(`fn.fecha_creacion >= $${paramIndex++}`);
      queryParams.push(fecha_desde);
    }

    if (fecha_hasta) {
      whereConditions.push(`fn.fecha_creacion <= $${paramIndex++}`);
      queryParams.push(fecha_hasta);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const allowedSortFields = ['fecha_creacion', 'estado', 'brigada_id'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'fecha_creacion';
    const sortOrder = allowedSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await query(`
      SELECT 
        fn.*,
        b.nombre as brigada_nombre,
        b.region as brigada_region,
        ef.nombre as estado_nombre,
        ef.color as estado_color
      FROM formularios_necesidades fn
      JOIN brigadas b ON fn.brigada_id = b.id
      JOIN estados_formulario ef ON fn.estado = ef.id
      ${whereClause}
      ORDER BY fn.${sortField} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...queryParams, parseInt(limit), offset]);

    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM formularios_necesidades fn
      ${whereClause}
    `, queryParams);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error al listar formularios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

router.get('/:id', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        fn.*,
        b.nombre as brigada_nombre,
        b.region as brigada_region,
        b.cantidad_bomberos_activos,
        ef.nombre as estado_nombre,
        ef.color as estado_color
      FROM formularios_necesidades fn
      JOIN brigadas b ON fn.brigada_id = b.id
      JOIN estados_formulario ef ON fn.estado = ef.id
      WHERE fn.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Formulario no encontrado'
      });
    }

    const historialResult = await query(`
      SELECT * FROM historial_estados 
      WHERE formulario_id = $1 
      ORDER BY fecha_cambio DESC
    `, [id]);

    const formulario = result.rows[0];
    formulario.historial_estados = historialResult.rows;

    res.json({
      success: true,
      data: formulario
    });
  } catch (error) {
    console.error('Error al obtener formulario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

router.put('/:id', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido'),
  ...validateFormulario
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingForm = await query('SELECT id, estado FROM formularios_necesidades WHERE id = $1', [id]);
    if (existingForm.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Formulario no encontrado'
      });
    }

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
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
      UPDATE formularios_necesidades 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `, updateValues);

    res.json({
      success: true,
      message: 'Formulario actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar formulario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

router.delete('/:id', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const existingForm = await query('SELECT id FROM formularios_necesidades WHERE id = $1', [id]);
    if (existingForm.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Formulario no encontrado'
      });
    }

    await query('DELETE FROM formularios_necesidades WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Formulario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar formulario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

router.patch('/:id/estado', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido'),
  body('estado').isIn(['pendiente', 'en_revision', 'aprobado', 'rechazado', 'en_proceso', 'completado']).withMessage('Estado inválido'),
  body('comentario').optional().isString().trim().isLength({ max: 500 }),
  body('usuario').optional().isString().trim().isLength({ max: 200 })
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, comentario, usuario } = req.body;

    const existingForm = await query('SELECT id, estado FROM formularios_necesidades WHERE id = $1', [id]);
    if (existingForm.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Formulario no encontrado'
      });
    }

    const estadoAnterior = existingForm.rows[0].estado;

    const updateData = { estado };
    if (estado === 'aprobado') {
      updateData.fecha_aprobacion = new Date();
      updateData.aprobado_por = usuario || 'sistema';
    }

    const result = await query(`
      UPDATE formularios_necesidades 
      SET estado = $1, 
          fecha_aprobacion = $2, 
          aprobado_por = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [estado, updateData.fecha_aprobacion, updateData.aprobado_por, id]);

    await query(`
      INSERT INTO historial_estados (formulario_id, estado_anterior, estado_nuevo, comentario, usuario)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, estadoAnterior, estado, comentario || 'Cambio de estado', usuario || 'sistema']);

    res.json({
      success: true,
      message: 'Estado del formulario actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

router.post('/:id/transicion', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido'),
  body('estado_destino').isIn(['pendiente', 'en_revision', 'aprobado', 'rechazado', 'en_proceso', 'completado']).withMessage('Estado destino inválido'),
  body('comentario').optional().isString().trim().isLength({ max: 500 }),
  body('usuario').optional().isString().trim().isLength({ max: 200 })
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_destino, comentario, usuario } = req.body;

    const existingForm = await query('SELECT id, estado FROM formularios_necesidades WHERE id = $1', [id]);
    if (existingForm.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Formulario no encontrado'
      });
    }

    const estadoAnterior = existingForm.rows[0].estado;

    const transicionesValidas = {
      'pendiente': ['en_revision', 'rechazado'],
      'en_revision': ['aprobado', 'rechazado', 'pendiente'],
      'aprobado': ['en_proceso', 'rechazado'],
      'rechazado': ['pendiente'],
      'en_proceso': ['completado', 'rechazado'],
      'completado': []
    };

    if (!transicionesValidas[estadoAnterior].includes(estado_destino)) {
      return res.status(400).json({
        success: false,
        message: `Transición de estado '${estadoAnterior}' a '${estado_destino}' no permitida`,
        transicionesPermitidas: transicionesValidas[estadoAnterior]
      });
    }

    const updateData = { estado: estado_destino };
    if (estado_destino === 'aprobado') {
      updateData.fecha_aprobacion = new Date();
      updateData.aprobado_por = usuario || 'sistema';
    }

    const result = await query(`
      UPDATE formularios_necesidades 
      SET estado = $1, 
          fecha_aprobacion = $2, 
          aprobado_por = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [estado_destino, updateData.fecha_aprobacion, updateData.aprobado_por, id]);

    await query(`
      INSERT INTO historial_estados (formulario_id, estado_anterior, estado_nuevo, comentario, usuario)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, estadoAnterior, estado_destino, comentario || 'Transición de estado', usuario || 'sistema']);

    res.json({
      success: true,
      message: 'Transición de estado realizada exitosamente',
      data: result.rows[0],
      transicion: {
        desde: estadoAnterior,
        hacia: estado_destino,
        comentario,
        usuario: usuario || 'sistema'
      }
    });
  } catch (error) {
    console.error('Error en transición de estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

router.post('/crear-completo', [
  body('nombreBrigada').isString().trim().isLength({ min: 1, max: 200 }).withMessage('Nombre de brigada es requerido'),
  body('cantidadBomberosActivos').isInt({ min: 1 }).withMessage('Cantidad de bomberos debe ser mínimo 1'),
  body('contactoComandante').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Contacto del comandante es requerido'),
  body('encargadoLogistica').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Encargado de logística es requerido'),
  body('contactoLogistica').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Contacto de logística es requerido'),
  body('numeroEmergenciaPublico').optional().isString().trim().isLength({ max: 100 }),
  
  body('epp_ropa').optional().isObject(),
  body('epp_botas').optional().isObject(),
  body('epp_general').optional().isObject(),
  body('epp_guantes').optional().isObject(),
  body('herramientas').optional().isObject(),
  body('logisticaVehiculos').optional().isObject(),
  body('alimentacion').optional().isObject(),
  body('equipoCampo').optional().isObject(),
  body('limpiezaPersonal').optional().isObject(),
  body('limpiezaGeneral').optional().isObject(),
  body('medicamentos').optional().isObject(),
  body('rescateAnimal').optional().isObject()
], handleValidationErrors, async (req, res) => {
  try {
    const {
      nombreBrigada,
      cantidadBomberosActivos,
      contactoComandante,
      encargadoLogistica,
      contactoLogistica,
      numeroEmergenciaPublico,
      epp_ropa = {},
      epp_botas = {},
      epp_general = {},
      epp_guantes = {},
      herramientas = {},
      logisticaVehiculos = {},
      alimentacion = {},
      equipoCampo = {},
      limpiezaPersonal = {},
      limpiezaGeneral = {},
      medicamentos = {},
      rescateAnimal = {}
    } = req.body;

    const brigadaResult = await query(`
      INSERT INTO brigadas (
        nombre, cantidad_bomberos_activos, contacto_comandante, 
        encargado_logistica, contacto_logistica, numero_emergencia_publico,
        region, activa
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, nombre, region
    `, [
      nombreBrigada,
      cantidadBomberosActivos,
      contactoComandante,
      encargadoLogistica,
      contactoLogistica,
      numeroEmergenciaPublico || null,
      'Por Definir',
      true
    ]);

    const brigada = brigadaResult.rows[0];

    const formularioResult = await query(`
      INSERT INTO formularios_necesidades (
        brigada_id, epp_ropa, epp_botas, epp_general, epp_guantes,
        herramientas, logistica_vehiculos, alimentacion, equipo_campo,
        limpieza_personal, limpieza_general, medicamentos, rescate_animal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, fecha_creacion, estado
    `, [
      brigada.id,
      epp_ropa,
      epp_botas,
      epp_general,
      epp_guantes,
      herramientas,
      logisticaVehiculos,
      alimentacion,
      equipoCampo,
      limpiezaPersonal,
      limpiezaGeneral,
      medicamentos,
      rescateAnimal
    ]);

    await query(`
      INSERT INTO historial_estados (formulario_id, estado_anterior, estado_nuevo, comentario, usuario)
      VALUES ($1, NULL, $2, 'Formulario creado junto con brigada', 'sistema')
    `, [formularioResult.rows[0].id, 'pendiente']);

    res.status(201).json({
      success: true,
      message: 'Brigada y formulario de necesidades creados exitosamente',
      data: {
        brigada: {
          id: brigada.id,
          nombre: brigada.nombre,
          region: brigada.region,
          cantidadBomberosActivos,
          contactoComandante,
          encargadoLogistica,
          contactoLogistica,
          numeroEmergenciaPublico
        },
        formulario: {
          id: formularioResult.rows[0].id,
          fechaCreacion: formularioResult.rows[0].fecha_creacion,
          estado: formularioResult.rows[0].estado,
          brigadaId: brigada.id
        }
      }
    });
  } catch (error) {
    console.error('Error al crear brigada y formulario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// OBTENER FORMULARIOS DEL USUARIO AUTENTICADO
router.get('/mis-formularios', verifyToken, async (req, res) => {
  try {
    const {
      estado,
      fecha_desde,
      fecha_hasta,
      page = 1,
      limit = 10
    } = req.query;

    let whereConditions = [`fn.usuario_id = $1`];
    let queryParams = [req.user.id];
    let paramIndex = 2;

    if (estado) {
      whereConditions.push(`fn.estado = $${paramIndex++}`);
      queryParams.push(estado);
    }

    if (fecha_desde) {
      whereConditions.push(`fn.fecha_creacion >= $${paramIndex++}`);
      queryParams.push(fecha_desde);
    }

    if (fecha_hasta) {
      whereConditions.push(`fn.fecha_creacion <= $${paramIndex++}`);
      queryParams.push(fecha_hasta);
    }

    const offset = (page - 1) * limit;

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const result = await query(`
      SELECT 
        fn.*,
        ef.nombre as estado_nombre,
        ef.color as estado_color,
        b.nombre as brigada_nombre
      FROM formularios_necesidades fn
      LEFT JOIN estados_formulario ef ON fn.estado = ef.id
      LEFT JOIN brigadas b ON fn.brigada_id = b.id
      ${whereClause}
      ORDER BY fn.fecha_creacion DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...queryParams, limit, offset]);

    // Contar total de formularios del usuario
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM formularios_necesidades fn
      ${whereClause}
    `, queryParams);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        formularios: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener formularios del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
