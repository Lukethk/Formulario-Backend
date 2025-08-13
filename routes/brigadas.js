const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');

const router = express.Router();

// Validaciones para brigadas
const brigadaValidation = [
    body('nombre').trim().isLength({ min: 2, max: 200 }).withMessage('El nombre debe tener entre 2 y 200 caracteres'),
    body('cantidad_bomberos_activos').optional().isInt({ min: 0 }).withMessage('La cantidad de bomberos debe ser un número positivo'),
    body('contacto_comandante').optional().isLength({ max: 50 }).withMessage('El contacto del comandante no puede exceder 50 caracteres'),
    body('encargado_logistica').optional().isLength({ max: 200 }).withMessage('El encargado de logística no puede exceder 200 caracteres'),
    body('contacto_logistica').optional().isLength({ max: 50 }).withMessage('El contacto de logística no puede exceder 50 caracteres'),
    body('numero_emergencia_publico').optional().isLength({ max: 50 }).withMessage('El número de emergencia público no puede exceder 50 caracteres'),
    body('region').optional().isLength({ max: 100 }).withMessage('La región no puede exceder 100 caracteres'),
    body('activa').optional().isBoolean().withMessage('El campo activa debe ser un valor booleano')
];

// GET - Obtener todas las brigadas
router.get('/', async (req, res) => {
    try {
        const result = await query(`
      SELECT 
        id, nombre, cantidad_bomberos_activos, contacto_comandante,
        encargado_logistica, contacto_logistica, numero_emergencia_publico,
        region, activa, created_at, updated_at
      FROM brigadas 
      ORDER BY nombre
    `);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error al obtener brigadas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las brigadas',
            error: error.message
        });
    }
});

// GET - Obtener una brigada por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
      SELECT 
        id, nombre, cantidad_bomberos_activos, contacto_comandante,
        encargado_logistica, contacto_logistica, numero_emergencia_publico,
        region, activa, created_at, updated_at
      FROM brigadas 
      WHERE id = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Brigada no encontrada'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error al obtener brigada:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la brigada',
            error: error.message
        });
    }
});

// POST - Crear una nueva brigada
router.post('/', brigadaValidation, async (req, res) => {
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

        const {
            nombre,
            cantidad_bomberos_activos,
            contacto_comandante,
            encargado_logistica,
            contacto_logistica,
            numero_emergencia_publico,
            region,
            activa = true
        } = req.body;

        const result = await query(`
      INSERT INTO brigadas (
        nombre, cantidad_bomberos_activos, contacto_comandante,
        encargado_logistica, contacto_logistica, numero_emergencia_publico, region, activa
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, nombre, created_at
    `, [nombre, cantidad_bomberos_activos, contacto_comandante, encargado_logistica, contacto_logistica, numero_emergencia_publico, region, activa]);

        res.status(201).json({
            success: true,
            message: 'Brigada creada exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error al crear brigada:', error);

        // Manejar error de duplicado
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una brigada con ese nombre'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear la brigada',
            error: error.message
        });
    }
});

// PUT - Actualizar una brigada
router.put('/:id', brigadaValidation, async (req, res) => {
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
        const {
            nombre,
            cantidad_bomberos_activos,
            contacto_comandante,
            encargado_logistica,
            contacto_logistica,
            numero_emergencia_publico,
            region,
            activa
        } = req.body;

        const result = await query(`
      UPDATE brigadas 
      SET 
        nombre = $1,
        cantidad_bomberos_activos = $2,
        contacto_comandante = $3,
        encargado_logistica = $4,
        contacto_logistica = $5,
        numero_emergencia_publico = $6,
        region = $7,
        activa = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id, nombre, updated_at
    `, [nombre, cantidad_bomberos_activos, contacto_comandante, encargado_logistica, contacto_logistica, numero_emergencia_publico, region, activa, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Brigada no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Brigada actualizada exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar brigada:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la brigada',
            error: error.message
        });
    }
});

// DELETE - Eliminar una brigada
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
      DELETE FROM brigadas 
      WHERE id = $1
      RETURNING id, nombre
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Brigada no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Brigada eliminada exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error al eliminar brigada:', error);

        // Manejar error de restricción de clave foránea
        if (error.code === '23503') {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar la brigada porque tiene equipos asociados'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al eliminar la brigada',
            error: error.message
        });
    }
});

// GET - Buscar brigadas por nombre
router.get('/search/:nombre', async (req, res) => {
    try {
        const { nombre } = req.params;

        const result = await query(`
      SELECT 
        id, nombre, cantidad_bomberos_activos, contacto_comandante,
        encargado_logistica, contacto_logistica, numero_emergencia_publico,
        region, activa, created_at, updated_at
      FROM brigadas 
      WHERE nombre ILIKE $1
      ORDER BY nombre
    `, [`%${nombre}%`]);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error al buscar brigadas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar brigadas',
            error: error.message
        });
    }
});

module.exports = router;
