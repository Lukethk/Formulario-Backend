const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Configuración de axios
axios.defaults.baseURL = BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Función para imprimir resultados
function printResult(title, data, isError = false) {
    const color = isError ? colors.red : colors.green;
    console.log(`\n${colors.bright}${color}${title}${colors.reset}`);
    console.log(JSON.stringify(data, null, 2));
}

// Función para manejar errores
function handleError(error, operation) {
    printResult(`❌ Error en ${operation}:`, {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
        data: error.response?.data
    }, true);
}

// Función principal de pruebas
async function testAPI() {
    console.log(`${colors.bright}${colors.cyan}🚒 Iniciando pruebas de la API de Bomberos Forestales${colors.reset}\n`);

    try {
        // 1. Crear una brigada
        console.log(`${colors.yellow}1. Creando brigada...${colors.reset}`);
        const brigadaData = {
            nombre: "Brigada Forestal Norte",
            cantidad_bomberos_activos: 25,
            contacto_comandante: "+56 9 1234 5678",
            encargado_logistica: "Juan Pérez",
            contacto_logistica: "+56 9 8765 4321",
            numero_emergencia_publico: "+56 2 2345 6789",
            region: "Norte",
            activa: true
        };

        const brigadaResponse = await axios.post('/brigadas', brigadaData);
        const brigada = brigadaResponse.data.data;
        printResult('✅ Brigada creada exitosamente:', brigada);

        // 2. Crear formulario de necesidades
        console.log(`\n${colors.yellow}2. Creando formulario de necesidades...${colors.reset}`);
        const formularioData = {
            brigada_id: brigada.id,
            epp_ropa: {
                camisaForestal: {
                    xs: 5, s: 8, m: 10, l: 12, xl: 8,
                    observaciones: "Prioridad alta para temporada de incendios"
                },
                pantalonForestal: {
                    xs: 5, s: 8, m: 10, l: 12, xl: 8,
                    observaciones: "Necesario para operaciones forestales"
                }
            },
            epp_botas: {
                37: 2, 38: 3, 39: 4, 40: 5, 41: 6, 42: 7, 43: 3
            },
            epp_general: {
                esclavina: { cantidad: 25, observaciones: "Una por bombero" },
                linterna: { cantidad: 30, observaciones: "Incluir repuestos" },
                antiparra: { cantidad: 25, observaciones: "Protección ocular" },
                cascoForestal: { cantidad: 25, observaciones: "Cascos certificados" }
            },
            herramientas: {
                azadon: { cantidad: 10, observaciones: "Para limpieza de maleza" },
                palaFibra: { cantidad: 15, observaciones: "Herramientas de combate" },
                batefuego: { cantidad: 20, observaciones: "Equipo esencial" }
            },
            alimentacion: {
                agua: { cantidad: 100, observaciones: "Botellas de 500ml" },
                barrasEnergeticas: { cantidad: 50, observaciones: "Para operaciones largas" }
            }
        };

        const formularioResponse = await axios.post('/formularios-necesidades', formularioData);
        const formulario = formularioResponse.data.data;
        printResult('✅ Formulario de necesidades creado exitosamente:', formulario);

        // 3. Cambiar estado del formulario a "en_revision"
        console.log(`\n${colors.yellow}3. Cambiando estado del formulario...${colors.reset}`);
        const cambioEstadoData = {
            estado: "en_revision",
            comentario: "Formulario en revisión por administración",
            usuario: "admin@bomberos.cl"
        };

        const estadoResponse = await axios.patch(`/formularios-necesidades/${formulario.id}/estado`, cambioEstadoData);
        printResult('✅ Estado del formulario cambiado exitosamente:', estadoResponse.data.data);

        // 4. Aprobar el formulario
        console.log(`\n${colors.yellow}4. Aprobando formulario...${colors.reset}`);
        const aprobacionData = {
            estado: "aprobado",
            comentario: "Formulario aprobado por administración",
            usuario: "admin@bomberos.cl"
        };

        const aprobacionResponse = await axios.patch(`/formularios-necesidades/${formulario.id}/estado`, aprobacionData);
        printResult('✅ Formulario aprobado exitosamente:', aprobacionResponse.data.data);

        // 5. Transición de estado a "en_proceso"
        console.log(`\n${colors.yellow}5. Transición de estado a en_proceso...${colors.reset}`);
        const transicionData = {
            estado_destino: "en_proceso",
            comentario: "Iniciando proceso de cumplimiento",
            usuario: "logistica@bomberos.cl"
        };

        const transicionResponse = await axios.post(`/formularios-necesidades/${formulario.id}/transicion`, transicionData);
        printResult('✅ Transición de estado realizada exitosamente:', transicionResponse.data.data);

        // 6. Obtener formulario con historial
        console.log(`\n${colors.yellow}6. Obteniendo formulario con historial...${colors.reset}`);
        const formularioCompletoResponse = await axios.get(`/formularios-necesidades/${formulario.id}`);
        printResult('✅ Formulario completo obtenido:', {
            id: formularioCompletoResponse.data.data.id,
            estado: formularioCompletoResponse.data.data.estado,
            historial_estados: formularioCompletoResponse.data.data.historial_estados
        });

        // 7. Listar formularios con filtros
        console.log(`\n${colors.yellow}7. Listando formularios con filtros...${colors.reset}`);
        const formulariosResponse = await axios.get('/formularios-necesidades?estado=en_proceso&page=1&limit=5');
        printResult('✅ Formularios filtrados obtenidos:', {
            total: formulariosResponse.data.pagination.total,
            data: formulariosResponse.data.data.map(f => ({ id: f.id, estado: f.estado, brigada: f.brigada_nombre }))
        });

        // 8. Obtener estados disponibles
        console.log(`\n${colors.yellow}8. Obteniendo estados disponibles...${colors.reset}`);
        const estadosResponse = await axios.get('/estados-formulario');
        printResult('✅ Estados disponibles:', estadosResponse.data.data);

        // 9. Generar resumen del sistema
        console.log(`\n${colors.yellow}9. Generando resumen del sistema...${colors.reset}`);
        const resumenResponse = await axios.get('/reportes/resumen');
        printResult('✅ Resumen del sistema generado:', {
            brigadas_activas: resumenResponse.data.data.estadisticas_generales.brigadas_activas,
            total_formularios: resumenResponse.data.data.estadisticas_generales.total_formularios,
            formularios_pendientes: resumenResponse.data.data.estadisticas_generales.formularios_pendientes
        });

        // 10. Generar reporte de brigada
        console.log(`\n${colors.yellow}10. Generando reporte de brigada...${colors.reset}`);
        const reporteBrigadaResponse = await axios.get(`/reportes/brigada/${brigada.id}`);
        printResult('✅ Reporte de brigada generado:', {
            brigada: reporteBrigadaResponse.data.data.brigada,
            total_formularios: reporteBrigadaResponse.data.data.estadisticas_generales.total_formularios,
            formularios_por_mes: reporteBrigadaResponse.data.data.formularios_por_mes.length
        });

        // 11. Generar estadísticas generales
        console.log(`\n${colors.yellow}11. Generando estadísticas generales...${colors.reset}`);
        const estadisticasResponse = await axios.get('/reportes/estadisticas?region=Norte');
        printResult('✅ Estadísticas generales generadas:', {
            filtros_aplicados: estadisticasResponse.data.data.filtros_aplicados,
            total_formularios: estadisticasResponse.data.data.estadisticas_generales.total_formularios,
            distribucion_por_region: estadisticasResponse.data.data.distribucion_por_region
        });

        // 12. Exportar reporte
        console.log(`\n${colors.yellow}12. Exportando reporte...${colors.reset}`);
        const exportResponse = await axios.get('/reportes/exportar?tipo=resumen&formato=json');
        printResult('✅ Reporte exportado exitosamente:', {
            tipo_reporte: exportResponse.data.data.metadata.tipo_reporte,
            formato: exportResponse.data.data.metadata.formato,
            fecha_generacion: exportResponse.data.data.metadata.fecha_generacion
        });

        console.log(`\n${colors.bright}${colors.green}🎉 Todas las pruebas completadas exitosamente!${colors.reset}`);
        console.log(`${colors.cyan}La API está funcionando correctamente.${colors.reset}`);

    } catch (error) {
        handleError(error, 'prueba general');
    }
}

// Función para probar endpoints específicos
async function testSpecificEndpoint(endpoint, method = 'GET', data = null) {
    try {
        console.log(`${colors.yellow}Probando ${method} ${endpoint}...${colors.reset}`);

        let response;
        switch (method.toUpperCase()) {
            case 'GET':
                response = await axios.get(endpoint);
                break;
            case 'POST':
                response = await axios.post(endpoint, data);
                break;
            case 'PUT':
                response = await axios.put(endpoint, data);
                break;
            case 'PATCH':
                response = await axios.patch(endpoint, data);
                break;
            case 'DELETE':
                response = await axios.delete(endpoint);
                break;
            default:
                throw new Error(`Método HTTP no soportado: ${method}`);
        }

        printResult(`✅ ${method} ${endpoint} exitoso:`, response.data);
        return response.data;
    } catch (error) {
        handleError(error, `${method} ${endpoint}`);
    }
}

// Función para mostrar menú de opciones
function showMenu() {
    console.log(`\n${colors.bright}${colors.cyan}🔧 Menú de Pruebas de la API${colors.reset}`);
    console.log(`${colors.yellow}1.${colors.reset} Ejecutar todas las pruebas`);
    console.log(`${colors.yellow}2.${colors.reset} Probar endpoint específico`);
    console.log(`${colors.yellow}3.${colors.reset} Salir`);
    console.log(`${colors.cyan}Selecciona una opción:${colors.reset}`);
}

// Función principal
async function main() {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (query) => new Promise((resolve) => rl.question(query, resolve));

    while (true) {
        showMenu();
        const option = await question('Opción: ');

        switch (option.trim()) {
            case '1':
                await testAPI();
                break;
            case '2':
                const endpoint = await question('Endpoint (ej: /brigadas): ');
                const method = await question('Método HTTP (GET, POST, PUT, PATCH, DELETE): ');
                let data = null;

                if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
                    const dataInput = await question('Datos JSON (opcional): ');
                    if (dataInput.trim()) {
                        try {
                            data = JSON.parse(dataInput);
                        } catch (e) {
                            console.log(`${colors.red}Error: JSON inválido${colors.reset}`);
                            continue;
                        }
                    }
                }

                await testSpecificEndpoint(endpoint, method, data);
                break;
            case '3':
                console.log(`${colors.green}¡Hasta luego!${colors.reset}`);
                rl.close();
                return;
            default:
                console.log(`${colors.red}Opción inválida${colors.reset}`);
        }

        await question('\nPresiona Enter para continuar...');
    }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    testAPI,
    testSpecificEndpoint
};
