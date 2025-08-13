const express = require('express');
const { param, query: queryValidator, validationResult } = require('express-validator');
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

// GET /api/reportes/resumen - Resumen general del sistema
router.get('/resumen', async (req, res) => {
    try {
        // Estadísticas generales
        const generalStats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM brigadas WHERE activa = true) as brigadas_activas,
        (SELECT COUNT(*) FROM brigadas WHERE activa = false) as brigadas_inactivas,
        (SELECT COUNT(*) FROM formularios_necesidades) as total_formularios,
        (SELECT COUNT(*) FROM formularios_necesidades WHERE estado = 'pendiente') as formularios_pendientes,
        (SELECT COUNT(*) FROM formularios_necesidades WHERE estado = 'en_revision') as formularios_en_revision,
        (SELECT COUNT(*) FROM formularios_necesidades WHERE estado = 'aprobado') as formularios_aprobados,
        (SELECT COUNT(*) FROM formularios_necesidades WHERE estado = 'en_proceso') as formularios_en_proceso,
        (SELECT COUNT(*) FROM formularios_necesidades WHERE estado = 'completado') as formularios_completados,
        (SELECT COUNT(*) FROM formularios_necesidades WHERE estado = 'rechazado') as formularios_rechazados
    `);

        // Formularios por región
        const formulariosPorRegion = await query(`
      SELECT 
        b.region,
        COUNT(*) as total_formularios,
        COUNT(CASE WHEN fn.estado = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN fn.estado = 'aprobado' THEN 1 END) as aprobados,
        COUNT(CASE WHEN fn.estado = 'completado' THEN 1 END) as completados
      FROM formularios_necesidades fn
      JOIN brigadas b ON fn.brigada_id = b.id
      GROUP BY b.region
      ORDER BY total_formularios DESC
    `);

        // Formularios por mes (últimos 12 meses)
        const formulariosPorMes = await query(`
      SELECT 
        DATE_TRUNC('month', fecha_creacion) as mes,
        COUNT(*) as total_formularios,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado = 'aprobado' THEN 1 END) as aprobados,
        COUNT(CASE WHEN estado = 'completado' THEN 1 END) as completados
      FROM formularios_necesidades 
      WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', fecha_creacion)
      ORDER BY mes
    `);

        // Tiempo promedio de procesamiento por estado
        const tiempoPromedio = await query(`
      SELECT 
        estado,
        AVG(EXTRACT(EPOCH FROM (updated_at - fecha_creacion))/3600) as tiempo_promedio_horas,
        MIN(EXTRACT(EPOCH FROM (updated_at - fecha_creacion))/3600) as tiempo_minimo_horas,
        MAX(EXTRACT(EPOCH FROM (updated_at - fecha_creacion))/3600) as tiempo_maximo_horas
      FROM formularios_necesidades 
      WHERE estado IN ('aprobado', 'rechazado', 'completado')
      GROUP BY estado
    `);

        // Top 5 brigadas con más formularios
        const topBrigadas = await query(`
      SELECT 
        b.nombre as brigada_nombre,
        b.region,
        COUNT(*) as total_formularios,
        COUNT(CASE WHEN fn.estado = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN fn.estado = 'aprobado' THEN 1 END) as aprobados
      FROM formularios_necesidades fn
      JOIN brigadas b ON fn.brigada_id = b.id
      GROUP BY b.id, b.nombre, b.region
      ORDER BY total_formularios DESC
      LIMIT 5
    `);

        const resumen = {
            estadisticas_generales: generalStats.rows[0],
            formularios_por_region: formulariosPorRegion.rows,
            formularios_por_mes: formulariosPorMes.rows,
            tiempo_promedio_procesamiento: tiempoPromedio.rows,
            top_brigadas: topBrigadas.rows,
            fecha_generacion: new Date().toISOString()
        };

        res.json({
            success: true,
            message: 'Resumen general del sistema generado exitosamente',
            data: resumen
        });
    } catch (error) {
        console.error('Error al generar resumen:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// GET /api/reportes/brigada/:id - Reporte por brigada específica
router.get('/brigada/:id', [
    param('id').isUUID().withMessage('ID de brigada debe ser un UUID válido')
], handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la brigada existe
        const brigadaCheck = await query('SELECT id, nombre, region FROM brigadas WHERE id = $1', [id]);
        if (brigadaCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Brigada no encontrada'
            });
        }

        const brigada = brigadaCheck.rows[0];

        // Estadísticas generales de la brigada
        const statsBrigada = await query(`
      SELECT 
        COUNT(*) as total_formularios,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado = 'en_revision' THEN 1 END) as en_revision,
        COUNT(CASE WHEN estado = 'aprobado' THEN 1 END) as aprobados,
        COUNT(CASE WHEN estado = 'en_proceso' THEN 1 END) as en_proceso,
        COUNT(CASE WHEN estado = 'completado' THEN 1 END) as completados,
        COUNT(CASE WHEN estado = 'rechazado' THEN 1 END) as rechazados,
        AVG(EXTRACT(EPOCH FROM (updated_at - fecha_creacion))/3600) as tiempo_promedio_horas
      FROM formularios_necesidades 
      WHERE brigada_id = $1
    `, [id]);

        // Formularios por mes (últimos 12 meses)
        const formulariosPorMes = await query(`
      SELECT 
        DATE_TRUNC('month', fecha_creacion) as mes,
        COUNT(*) as total_formularios,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado = 'aprobado' THEN 1 END) as aprobados,
        COUNT(CASE WHEN estado = 'completado' THEN 1 END) as completados
      FROM formularios_necesidades 
      WHERE brigada_id = $1 
        AND fecha_creacion >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', fecha_creacion)
      ORDER BY mes
    `);

        // Análisis de necesidades más solicitadas
        const necesidadesAnalisis = await query(`
      SELECT 
        'epp_ropa' as categoria,
        jsonb_object_keys(epp_ropa) as item,
        SUM((epp_ropa->>jsonb_object_keys(epp_ropa))::int) as total_solicitado
      FROM formularios_necesidades 
      WHERE brigada_id = $1 AND epp_ropa != '{}'
      GROUP BY jsonb_object_keys(epp_ropa)
      
      UNION ALL
      
      SELECT 
        'epp_general' as categoria,
        jsonb_object_keys(epp_general) as item,
        SUM((epp_general->>'cantidad')::int) as total_solicitado
      FROM formularios_necesidades 
      WHERE brigada_id = $1 AND epp_general != '{}'
      GROUP BY jsonb_object_keys(epp_general)
      
      UNION ALL
      
      SELECT 
        'herramientas' as categoria,
        jsonb_object_keys(herramientas) as item,
        SUM((herramientas->>'cantidad')::int) as total_solicitado
      FROM formularios_necesidades 
      WHERE brigada_id = $1 AND herramientas != '{}'
      GROUP BY jsonb_object_keys(herramientas)
      
      ORDER BY total_solicitado DESC
      LIMIT 20
    `, [id]);

        // Historial de cambios de estado
        const historialEstados = await query(`
      SELECT 
        fn.id as formulario_id,
        fn.fecha_creacion,
        fn.estado as estado_actual,
        COUNT(he.id) as cambios_estado,
        MAX(he.fecha_cambio) as ultimo_cambio
      FROM formularios_necesidades fn
      LEFT JOIN historial_estados he ON fn.id = he.formulario_id
      WHERE fn.brigada_id = $1
      GROUP BY fn.id, fn.fecha_creacion, fn.estado
      ORDER BY fn.fecha_creacion DESC
      LIMIT 10
    `, [id]);

        // Tendencias de aprobación
        const tendenciasAprobacion = await query(`
      SELECT 
        DATE_TRUNC('month', fecha_creacion) as mes,
        COUNT(*) as total_formularios,
        COUNT(CASE WHEN estado = 'aprobado' THEN 1 END) as aprobados,
        ROUND(
          (COUNT(CASE WHEN estado = 'aprobado' THEN 1 END)::float / COUNT(*)) * 100, 2
        ) as tasa_aprobacion
      FROM formularios_necesidades 
      WHERE brigada_id = $1 
        AND fecha_creacion >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', fecha_creacion)
      ORDER BY mes
    `, [id]);

        const reporteBrigada = {
            brigada: {
                id: brigada.id,
                nombre: brigada.nombre,
                region: brigada.region
            },
            estadisticas_generales: statsBrigada.rows[0],
            formularios_por_mes: formulariosPorMes.rows,
            necesidades_mas_solicitadas: necesidadesAnalisis.rows,
            historial_estados: historialEstados.rows,
            tendencias_aprobacion: tendenciasAprobacion.rows,
            fecha_generacion: new Date().toISOString()
        };

        res.json({
            success: true,
            message: `Reporte de brigada '${brigada.nombre}' generado exitosamente`,
            data: reporteBrigada
        });
    } catch (error) {
        console.error('Error al generar reporte de brigada:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// GET /api/reportes/estadisticas - Estadísticas generales detalladas
router.get('/estadisticas', [
    queryValidator('fecha_desde').optional().isISO8601().toDate(),
    queryValidator('fecha_hasta').optional().isISO8601().toDate(),
    queryValidator('region').optional().isString().trim(),
    queryValidator('estado').optional().isIn(['pendiente', 'en_revision', 'aprobado', 'rechazado', 'en_proceso', 'completado'])
], handleValidationErrors, async (req, res) => {
    try {
        const { fecha_desde, fecha_hasta, region, estado } = req.query;

        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        // Construir condiciones WHERE
        if (fecha_desde) {
            whereConditions.push(`fn.fecha_creacion >= $${paramIndex++}`);
            queryParams.push(fecha_desde);
        }

        if (fecha_hasta) {
            whereConditions.push(`fn.fecha_creacion <= $${paramIndex++}`);
            queryParams.push(fecha_hasta);
        }

        if (region) {
            whereConditions.push(`b.region = $${paramIndex++}`);
            queryParams.push(region);
        }

        if (estado) {
            whereConditions.push(`fn.estado = $${paramIndex++}`);
            queryParams.push(estado);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Estadísticas generales con filtros
        const statsGenerales = await query(`
      SELECT 
        COUNT(*) as total_formularios,
        COUNT(CASE WHEN fn.estado = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN fn.estado = 'en_revision' THEN 1 END) as en_revision,
        COUNT(CASE WHEN fn.estado = 'aprobado' THEN 1 END) as aprobados,
        COUNT(CASE WHEN fn.estado = 'en_proceso' THEN 1 END) as en_proceso,
        COUNT(CASE WHEN fn.estado = 'completado' THEN 1 END) as completados,
        COUNT(CASE WHEN fn.estado = 'rechazado' THEN 1 END) as rechazados,
        AVG(EXTRACT(EPOCH FROM (fn.updated_at - fn.fecha_creacion))/3600) as tiempo_promedio_horas,
        MIN(fn.fecha_creacion) as fecha_formulario_mas_antiguo,
        MAX(fn.fecha_creacion) as fecha_formulario_mas_reciente
      FROM formularios_necesidades fn
      JOIN brigadas b ON fn.brigada_id = b.id
      ${whereClause}
    `, queryParams);

        // Distribución por región
        const distribucionRegion = await query(`
      SELECT 
        b.region,
        COUNT(*) as total_formularios,
        COUNT(CASE WHEN fn.estado = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN fn.estado = 'aprobado' THEN 1 END) as aprobados,
        COUNT(CASE WHEN fn.estado = 'completado' THEN 1 END) as completados,
        ROUND(
          (COUNT(CASE WHEN fn.estado = 'aprobado' THEN 1 END)::float / COUNT(*)) * 100, 2
        ) as tasa_aprobacion
      FROM formularios_necesidades fn
      JOIN brigadas b ON fn.brigada_id = b.id
      ${whereClause}
      GROUP BY b.region
      ORDER BY total_formularios DESC
    `, queryParams);

        // Evolución temporal (últimos 24 meses)
        const evolucionTemporal = await query(`
      SELECT 
        DATE_TRUNC('month', fn.fecha_creacion) as mes,
        COUNT(*) as total_formularios,
        COUNT(CASE WHEN fn.estado = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN fn.estado = 'aprobado' THEN 1 END) as aprobados,
        COUNT(CASE WHEN fn.estado = 'completado' THEN 1 END) as completados,
        ROUND(
          (COUNT(CASE WHEN fn.estado = 'aprobado' THEN 1 END)::float / COUNT(*)) * 100, 2
        ) as tasa_aprobacion
      FROM formularios_necesidades fn
      JOIN brigadas b ON fn.brigada_id = b.id
      ${whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')} AND` : 'WHERE'} 
        fn.fecha_creacion >= CURRENT_DATE - INTERVAL '24 months'
      GROUP BY DATE_TRUNC('month', fn.fecha_creacion)
      ORDER BY mes
    `, queryParams);

        // Análisis de necesidades por categoría
        const necesidadesPorCategoria = await query(`
      SELECT 
        'epp_ropa' as categoria,
        COUNT(*) as formularios_con_necesidades,
        AVG(jsonb_array_length(jsonb_object_keys(epp_ropa))) as promedio_items_por_formulario
      FROM formularios_necesidades fn
      JOIN brigadas b ON fn.brigada_id = b.id
      ${whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')} AND` : 'WHERE'} 
        epp_ropa != '{}'
      
      UNION ALL
      
      SELECT 
        'epp_general' as categoria,
        COUNT(*) as formularios_con_necesidades,
        AVG(jsonb_array_length(jsonb_object_keys(epp_general))) as promedio_items_por_formulario
      FROM formularios_necesidades fn
      JOIN brigadas b ON fn.brigada_id = b.id
      ${whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')} AND` : 'WHERE'} 
        epp_general != '{}'
      
      UNION ALL
      
      SELECT 
        'herramientas' as categoria,
        COUNT(*) as formularios_con_necesidades,
        AVG(jsonb_array_length(jsonb_object_keys(herramientas))) as promedio_items_por_formulario
      FROM formularios_necesidades fn
      JOIN brigadas b ON fn.brigada_id = b.id
      ${whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')} AND` : 'WHERE'} 
        herramientas != '{}'
      
      UNION ALL
      
      SELECT 
        'medicamentos' as categoria,
        COUNT(*) as formularios_con_necesidades,
        AVG(jsonb_array_length(jsonb_object_keys(medicamentos))) as promedio_items_por_formulario
      FROM formularios_necesidades fn
      JOIN brigadas b ON fn.brigada_id = b.id
      ${whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')} AND` : 'WHERE'} 
        medicamentos != '{}'
      
      ORDER BY formularios_con_necesidades DESC
    `, queryParams);

        // Performance del sistema
        const performanceSistema = await query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (fn.updated_at - fn.fecha_creacion))/3600) as tiempo_promedio_procesamiento_horas,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (fn.updated_at - fn.fecha_creacion))/3600) as tiempo_mediano_horas,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (fn.updated_at - fn.fecha_creacion))/3600) as tiempo_95_percentil_horas,
        COUNT(CASE WHEN EXTRACT(EPOCH FROM (fn.updated_at - fn.fecha_creacion))/3600 <= 24 THEN 1 END) as formularios_procesados_24h,
        COUNT(CASE WHEN EXTRACT(EPOCH FROM (fn.updated_at - fn.fecha_creacion))/3600 <= 72 THEN 1 END) as formularios_procesados_72h
      FROM formularios_necesidades fn
      JOIN brigadas b ON fn.brigada_id = b.id
      ${whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')} AND` : 'WHERE'} 
        fn.estado IN ('aprobado', 'rechazado', 'completado')
    `, queryParams);

        const estadisticas = {
            filtros_aplicados: {
                fecha_desde,
                fecha_hasta,
                region,
                estado
            },
            estadisticas_generales: statsGenerales.rows[0],
            distribucion_por_region: distribucionRegion.rows,
            evolucion_temporal: evolucionTemporal.rows,
            necesidades_por_categoria: necesidadesPorCategoria.rows,
            performance_sistema: performanceSistema.rows[0],
            fecha_generacion: new Date().toISOString()
        };

        res.json({
            success: true,
            message: 'Estadísticas generales generadas exitosamente',
            data: estadisticas
        });
    } catch (error) {
        console.error('Error al generar estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// GET /api/reportes/exportar - Exportar reporte en formato JSON
router.get('/exportar', [
    queryValidator('tipo').isIn(['resumen', 'estadisticas', 'completo']).withMessage('Tipo de reporte debe ser resumen, estadisticas o completo'),
    queryValidator('formato').optional().isIn(['json', 'csv']).withMessage('Formato debe ser json o csv')
], handleValidationErrors, async (req, res) => {
    try {
        const { tipo, formato = 'json' } = req.query;

        let reporteData = {};

        if (tipo === 'resumen' || tipo === 'completo') {
            // Generar resumen
            const resumenResult = await query(`
        SELECT 
          (SELECT COUNT(*) FROM brigadas WHERE activa = true) as brigadas_activas,
          (SELECT COUNT(*) FROM brigadas WHERE activa = false) as brigadas_inactivas,
          (SELECT COUNT(*) FROM formularios_necesidades) as total_formularios,
          (SELECT COUNT(*) FROM formularios_necesidades WHERE estado = 'pendiente') as formularios_pendientes,
          (SELECT COUNT(*) FROM formularios_necesidades WHERE estado = 'aprobado') as formularios_aprobados,
          (SELECT COUNT(*) FROM formularios_necesidades WHERE estado = 'completado') as formularios_completados
      `);
            reporteData.resumen = resumenResult.rows[0];
        }

        if (tipo === 'estadisticas' || tipo === 'completo') {
            // Generar estadísticas
            const statsResult = await query(`
        SELECT 
          b.region,
          COUNT(*) as total_formularios,
          COUNT(CASE WHEN fn.estado = 'pendiente' THEN 1 END) as pendientes,
          COUNT(CASE WHEN fn.estado = 'aprobado' THEN 1 END) as aprobados,
          COUNT(CASE WHEN fn.estado = 'completado' THEN 1 END) as completados
        FROM formularios_necesidades fn
        JOIN brigadas b ON fn.brigada_id = b.id
        GROUP BY b.region
        ORDER BY total_formularios DESC
      `);
            reporteData.estadisticas = statsResult.rows;
        }

        if (tipo === 'completo') {
            // Datos completos para exportación
            const formulariosCompletos = await query(`
        SELECT 
          fn.*,
          b.nombre as brigada_nombre,
          b.region as brigada_region,
          ef.nombre as estado_nombre
        FROM formularios_necesidades fn
        JOIN brigadas b ON fn.brigada_id = b.id
        JOIN estados_formulario ef ON fn.estado = ef.id
        ORDER BY fn.fecha_creacion DESC
      `);
            reporteData.formularios_completos = formulariosCompletos.rows;
        }

        reporteData.metadata = {
            tipo_reporte: tipo,
            formato: formato,
            fecha_generacion: new Date().toISOString(),
            total_registros: Object.keys(reporteData).length
        };

        if (formato === 'csv') {
            // Configurar headers para descarga CSV
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=reporte_${tipo}_${new Date().toISOString().split('T')[0]}.csv`);

            // Convertir a CSV (implementación básica)
            let csvContent = '';
            if (reporteData.resumen) {
                csvContent += 'RESUMEN\n';
                Object.entries(reporteData.resumen).forEach(([key, value]) => {
                    csvContent += `${key},${value}\n`;
                });
                csvContent += '\n';
            }

            if (reporteData.estadisticas) {
                csvContent += 'ESTADISTICAS POR REGION\n';
                csvContent += 'region,total_formularios,pendientes,aprobados,completados\n';
                reporteData.estadisticas.forEach(row => {
                    csvContent += `${row.region},${row.total_formularios},${row.pendientes},${row.aprobados},${row.completados}\n`;
                });
            }

            res.send(csvContent);
        } else {
            res.json({
                success: true,
                message: `Reporte ${tipo} exportado exitosamente`,
                data: reporteData
            });
        }
    } catch (error) {
        console.error('Error al exportar reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;
