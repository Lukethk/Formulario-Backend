CREATE DATABASE formulario;

\c formulario;

CREATE TABLE brigadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    cantidad_bomberos_activos INTEGER,
    contacto_comandante VARCHAR(50),
    encargado_logistica VARCHAR(200),
    contacto_logistica VARCHAR(50),
    numero_emergencia_publico VARCHAR(50),
    region VARCHAR(100),
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE estados_formulario (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE formularios_necesidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brigada_id UUID NOT NULL REFERENCES brigadas(id) ON DELETE CASCADE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente' REFERENCES estados_formulario(id),
    observaciones_admin TEXT,
    fecha_aprobacion TIMESTAMP,
    aprobado_por VARCHAR(200),
    
    epp_ropa JSONB DEFAULT '{}',
    
    epp_botas JSONB DEFAULT '{}',
    
    epp_general JSONB DEFAULT '{}',
    
    epp_guantes JSONB DEFAULT '{}',
    
    herramientas JSONB DEFAULT '{}',
    
    logistica_vehiculos JSONB DEFAULT '{}',
    
    alimentacion JSONB DEFAULT '{}',
    
    equipo_campo JSONB DEFAULT '{}',
    
    limpieza_personal JSONB DEFAULT '{}',
    
    limpieza_general JSONB DEFAULT '{}',
    
    medicamentos JSONB DEFAULT '{}',
    
    rescate_animal JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE historial_estados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    formulario_id UUID NOT NULL REFERENCES formularios_necesidades(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    comentario TEXT,
    usuario VARCHAR(200),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias_equipos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE equipos (
    id SERIAL PRIMARY KEY,
    categoria_id INTEGER NOT NULL REFERENCES categorias_equipos(id),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tallas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE,
    tipo VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE equipos_brigada (
    id SERIAL PRIMARY KEY,
    brigada_id UUID NOT NULL REFERENCES brigadas(id) ON DELETE CASCADE,
    equipo_id INTEGER NOT NULL REFERENCES equipos(id),
    talla_id INTEGER REFERENCES tallas(id),
    cantidad INTEGER NOT NULL DEFAULT 0,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_brigada_equipo_talla UNIQUE (brigada_id, equipo_id, talla_id)
);

INSERT INTO estados_formulario (id, nombre, color, descripcion) VALUES 
('pendiente', 'Pendiente', '#fbbf24', 'Formulario enviado, esperando revisión'),
('en_revision', 'En Revisión', '#3b82f6', 'Formulario siendo revisado por administración'),
('aprobado', 'Aprobado', '#10b981', 'Formulario aprobado para procesamiento'),
('rechazado', 'Rechazado', '#ef4444', 'Formulario rechazado por administración'),
('en_proceso', 'En Proceso', '#8b5cf6', 'Formulario en proceso de cumplimiento'),
('completado', 'Completado', '#059669', 'Formulario completamente cumplido');

INSERT INTO tallas (nombre, tipo) VALUES 
('XS', 'ropa'),
('S', 'ropa'),
('M', 'ropa'),
('L', 'ropa'),
('XL', 'ropa'),
('XXL', 'ropa'),
('37', 'calzado'),
('38', 'calzado'),
('39', 'calzado'),
('40', 'calzado'),
('41', 'calzado'),
('42', 'calzado'),
('43', 'calzado');

INSERT INTO categorias_equipos (nombre, descripcion) VALUES 
('Ropa', 'Camisas, pantalones, overoles, etc.'),
('Calzado', 'Botas y calzado especializado'),
('Protección Personal', 'Cascos, guantes, lentes'),
('Herramientas', 'Extintores, linternas, radios');

INSERT INTO equipos (categoria_id, nombre) VALUES 
(1, 'Camisa forestal'),
(1, 'Pantalón forestal'),
(1, 'Overol FR'),
(2, 'Botas forestales'),
(3, 'Casco forestal'),
(3, 'Guantes resistentes'),
(3, 'Antiparras'),
(3, 'Máscara de polvo'),
(3, 'Máscara media cara'),
(3, 'Esclavina'),
(4, 'Linterna'),
(4, 'Linterna de cabeza');

CREATE INDEX idx_formularios_brigada_id ON formularios_necesidades(brigada_id);
CREATE INDEX idx_formularios_estado ON formularios_necesidades(estado);
CREATE INDEX idx_formularios_fecha_creacion ON formularios_necesidades(fecha_creacion);
CREATE INDEX idx_historial_formulario_id ON historial_estados(formulario_id);
CREATE INDEX idx_brigadas_region ON brigadas(region);
CREATE INDEX idx_brigadas_activa ON brigadas(activa);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brigadas_updated_at BEFORE UPDATE ON brigadas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_formularios_necesidades_updated_at BEFORE UPDATE ON formularios_necesidades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipos_brigada_updated_at BEFORE UPDATE ON equipos_brigada
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
