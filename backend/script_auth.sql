-- =====================================================
-- SCRIPT DE AUTENTICACIÓN PARA SISTEMA DE BOMBEROS
-- =====================================================

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('bombero', 'comandante', 'admin')),
    brigada_id UUID REFERENCES brigadas(id) ON DELETE CASCADE,
    numero_legajo VARCHAR(50),
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT true,
    ultimo_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_brigada_id ON usuarios(brigada_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- Agregar columna usuario_id a formularios_necesidades
ALTER TABLE formularios_necesidades 
ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;

-- Crear índice para usuario_id en formularios
CREATE INDEX IF NOT EXISTS idx_formularios_usuario_id ON formularios_necesidades(usuario_id);

-- Modificar tabla historial_estados para usar usuario_id en lugar de usuario (string)
ALTER TABLE historial_estados 
ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;

-- Crear índice para usuario_id en historial
CREATE INDEX IF NOT EXISTS idx_historial_usuario_id ON historial_estados(usuario_id);

-- Crear tabla de sesiones activas (opcional, para logout múltiple)
CREATE TABLE IF NOT EXISTS sesiones_activas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    dispositivo VARCHAR(100),
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- Crear índices para sesiones
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario_id ON sesiones_activas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_expires_at ON sesiones_activas(expires_at);

-- Crear tabla de intentos de login fallidos (para seguridad)
CREATE TABLE IF NOT EXISTS intentos_login (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(150) NOT NULL,
    ip_address INET,
    intentos INTEGER DEFAULT 1,
    bloqueado_hasta TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para intentos de login
CREATE INDEX IF NOT EXISTS idx_intentos_email ON intentos_login(email);
CREATE INDEX IF NOT EXISTS idx_intentos_bloqueado ON intentos_login(bloqueado_hasta);

-- Crear tabla de tokens de recuperación de contraseña
CREATE TABLE IF NOT EXISTS tokens_recuperacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    usado BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para tokens de recuperación
CREATE INDEX IF NOT EXISTS idx_tokens_recuperacion_usuario_id ON tokens_recuperacion(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tokens_recuperacion_expires_at ON tokens_recuperacion(expires_at);

-- Crear tabla de logs de auditoría
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(100),
    registro_id UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para logs de auditoría
CREATE INDEX IF NOT EXISTS idx_logs_usuario_id ON logs_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_accion ON logs_auditoria(accion);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs_auditoria(created_at);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar usuario administrador por defecto
-- CONTRASEÑA: admin123 (cambiar en producción)
INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES 
('Administrador del Sistema', 'admin@bomberos.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxq6Hy', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Insertar roles de usuario por defecto si no existen
INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES 
('Comandante Ejemplo', 'comandante@bomberos.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxq6Hy', 'comandante', true)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para usuarios
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para intentos de login
CREATE TRIGGER update_intentos_login_updated_at 
    BEFORE UPDATE ON intentos_login 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para limpiar sesiones expiradas
CREATE OR REPLACE FUNCTION limpiar_sesiones_expiradas()
RETURNS void AS $$
BEGIN
    DELETE FROM sesiones_activas WHERE expires_at < CURRENT_TIMESTAMP;
    DELETE FROM tokens_recuperacion WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ language 'plpgsql';

-- Función para limpiar logs antiguos (mantener solo últimos 6 meses)
CREATE OR REPLACE FUNCTION limpiar_logs_antiguos()
RETURNS void AS $$
BEGIN
    DELETE FROM logs_auditoria WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '6 months';
END;
$$ language 'plpgsql';

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de usuarios con información de brigada
CREATE OR REPLACE VIEW vista_usuarios_brigada AS
SELECT 
    u.id,
    u.nombre,
    u.email,
    u.rol,
    u.brigada_id,
    b.nombre as brigada_nombre,
    u.numero_legajo,
    u.telefono,
    u.activo,
    u.ultimo_login,
    u.created_at
FROM usuarios u
LEFT JOIN brigadas b ON u.brigada_id = b.id;

-- Vista de formularios con información de usuario y brigada
CREATE OR REPLACE VIEW vista_formularios_completa AS
SELECT 
    fn.*,
    u.nombre as usuario_nombre,
    u.email as usuario_email,
    u.rol as usuario_rol,
    b.nombre as brigada_nombre,
    ef.nombre as estado_nombre,
    ef.color as estado_color
FROM formularios_necesidades fn
LEFT JOIN usuarios u ON fn.usuario_id = u.id
LEFT JOIN brigadas b ON fn.brigada_id = b.id
LEFT JOIN estados_formulario ef ON fn.estado = ef.id;

-- =====================================================
-- PERMISOS Y ROLES
-- =====================================================

-- Crear roles de base de datos (ejecutar como superusuario)
-- CREATE ROLE bomberos_app WITH LOGIN PASSWORD 'password_seguro';
-- GRANT CONNECT ON DATABASE formulario TO bomberos_app;
-- GRANT USAGE ON SCHEMA public TO bomberos_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bomberos_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bomberos_app;

-- =====================================================
-- ÍNDICES ADICIONALES PARA RENDIMIENTO
-- =====================================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_formularios_brigada_estado ON formularios_necesidades(brigada_id, estado);
CREATE INDEX IF NOT EXISTS idx_formularios_usuario_fecha ON formularios_necesidades(usuario_id, fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_historial_formulario_fecha ON historial_estados(formulario_id, fecha_cambio);

-- Índices para búsquedas de texto
CREATE INDEX IF NOT EXISTS idx_usuarios_nombre_gin ON usuarios USING gin(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_brigadas_nombre_gin ON brigadas USING gin(to_tsvector('spanish', nombre));

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

-- Este script agrega:
-- 1. Sistema completo de autenticación con usuarios
-- 2. Vinculación de formularios con usuarios
-- 3. Sistema de roles y permisos
-- 4. Auditoría y logs de seguridad
-- 5. Gestión de sesiones
-- 6. Recuperación de contraseñas
-- 7. Protección contra ataques de fuerza bruta
-- 8. Optimizaciones de rendimiento con índices

-- IMPORTANTE: Cambiar las contraseñas por defecto en producción
-- IMPORTANTE: Configurar JWT_SECRET seguro en producción
-- IMPORTANTE: Revisar y ajustar permisos según necesidades de seguridad
