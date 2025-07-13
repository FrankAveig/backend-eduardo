-- Script para insertar datos iniciales en la base de datos Fabrima

-- Insertar roles básicos
INSERT INTO roles (id, nombre_rol) VALUES (1, 'administrador');
INSERT INTO roles (id, nombre_rol) VALUES (2, 'revisor');

-- Nota: La contraseña debe estar hasheada con bcrypt para funcionar correctamente
-- Aquí insertamos un hash predefinido para 'admin123#'
-- Este hash es válido para bcrypt pero deberías cambiarlo en un entorno de producción
INSERT INTO usuarios (nombre_completo, correo, contrasenia, rol_id) 
VALUES (
    'Frank Aveiga', 
    'xfpad93@gmail.com', 
    '$2b$10$9gvMhGZk5ukoZK2ottvQPelhpMXFJPYqQj4S9xU6B/yqQh/kDBsX2', -- hash para 'admin123#'
    1 -- rol administrador
);

-- En caso de que prefieras insertar el usuario y luego cambiar la contraseña desde la aplicación,
-- puedes usar este comando alternativo sin el hash (no recomendado para producción):
-- INSERT INTO usuarios (nombre_completo, correo, contrasenia, rol_id) 
-- VALUES ('Frank Aveiga', 'xfpad93@gmail.com', 'admin123#', 1); 