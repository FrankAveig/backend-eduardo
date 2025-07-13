-- Script para configurar la base de datos Fabrima desde cero

-- Creación de tablas
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasenia VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS empresas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    tipo VARCHAR(50) NOT NULL,
    activa BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasenia VARCHAR(255) NOT NULL,
    identificacion VARCHAR(20),
    tipo_identificacion VARCHAR(20),
    estatus ENUM('activo', 'inactivo') DEFAULT 'activo'
);

CREATE TABLE IF NOT EXISTS certificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_certificacion VARCHAR(100) NOT NULL,
    foto_certificacion VARCHAR(255),
    empresa_id INT NOT NULL,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_video VARCHAR(100) NOT NULL,
    ruta_video VARCHAR(255) NOT NULL,
    duracion VARCHAR(20),
    certificacion_id INT NOT NULL,
    FOREIGN KEY (certificacion_id) REFERENCES certificaciones(id)
);

CREATE TABLE IF NOT EXISTS documentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_documento VARCHAR(100) NOT NULL,
    ruta_documento VARCHAR(255) NOT NULL,
    video_id INT NOT NULL,
    FOREIGN KEY (video_id) REFERENCES videos(id)
);

CREATE TABLE IF NOT EXISTS clientes_empresas (
    cliente_id INT NOT NULL,
    empresa_id INT NOT NULL,
    PRIMARY KEY (cliente_id, empresa_id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE TABLE IF NOT EXISTS clientes_certificaciones (
    cliente_id INT NOT NULL,
    certificacion_id INT NOT NULL,
    PRIMARY KEY (cliente_id, certificacion_id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (certificacion_id) REFERENCES certificaciones(id)
);

-- Insertar datos iniciales

-- Insertar roles básicos
INSERT INTO roles (id, nombre_rol) VALUES (1, 'administrador');
INSERT INTO roles (id, nombre_rol) VALUES (2, 'revisor');

-- Insertar usuario administrador
-- Nota: La contraseña está hasheada con bcrypt
INSERT INTO usuarios (nombre_completo, correo, contrasenia, rol_id) 
VALUES (
    'Frank Aveiga', 
    'xfpad93@gmail.com', 
    '$2b$10$9gvMhGZk5ukoZK2ottvQPelhpMXFJPYqQj4S9xU6B/yqQh/kDBsX2', -- hash para 'admin123#'
    1 -- rol administrador
);

-- Insertar una empresa de ejemplo
INSERT INTO empresas (nombre, tipo, activa) 
VALUES ('Empresa Demo S.A.', 'Constructora', true);

-- Insertar una certificación de ejemplo
INSERT INTO certificaciones (nombre_certificacion, foto_certificacion, empresa_id)
VALUES ('Certificación ISO 9001', 'ruta/a/imagen/iso9001.jpg', 1);

-- Insertar un cliente de ejemplo
INSERT INTO clientes (nombre_completo, correo, contrasenia, identificacion, tipo_identificacion, estatus)
VALUES (
    'Cliente Ejemplo', 
    'cliente@ejemplo.com', 
    '$2b$10$V0T1IgdEEX5oSmTx5jXAa.7G.PQaLU1cgk39e5mKTHsSrFRkJCd4K', -- hash para 'cliente123'
    '1234567890', 
    'DNI', 
    'activo'
); 