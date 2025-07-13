-- Script de migración para actualizar la base de datos existente
-- Ejecutar después de crear la nueva estructura de base de datos

USE driedfru_bd_fabrimasa;

-- 1. Agregar campo activa a la tabla empresas si no existe
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS activa TINYINT(1) DEFAULT 1;

-- 2. Agregar campo activa a la tabla certificaciones si no existe
ALTER TABLE certificaciones 
ADD COLUMN IF NOT EXISTS activa TINYINT(1) DEFAULT 1;

-- 3. Agregar campos a la tabla clientes_certificaciones si no existen
ALTER TABLE clientes_certificaciones 
ADD COLUMN IF NOT EXISTS fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS activa TINYINT(1) DEFAULT 1;

-- 4. Cambiar el tipo de dato de duracion en videos de VARCHAR a INT
-- Primero, crear una tabla temporal para hacer la conversión
CREATE TEMPORARY TABLE temp_videos AS 
SELECT id, nombre_video, ruta_video, 
       CASE 
         WHEN duracion REGEXP '^[0-9]+$' THEN CAST(duracion AS UNSIGNED)
         ELSE 0 
       END AS duracion_int,
       certificacion_id
FROM videos;

-- Actualizar la tabla videos con la nueva estructura
ALTER TABLE videos MODIFY COLUMN duracion INT NOT NULL;

-- Actualizar los datos con los valores convertidos
UPDATE videos v 
JOIN temp_videos t ON v.id = t.id 
SET v.duracion = t.duracion_int;

-- Eliminar la tabla temporal
DROP TEMPORARY TABLE temp_videos;

-- 5. Actualizar todos los registros existentes para que estén activos por defecto
UPDATE empresas SET activa = 1 WHERE activa IS NULL;
UPDATE certificaciones SET activa = 1 WHERE activa IS NULL;
UPDATE clientes_certificaciones SET activa = 1 WHERE activa IS NULL;

-- 6. Verificar que todos los cambios se aplicaron correctamente
SELECT 'Empresas con campo activa:' as tabla, COUNT(*) as total FROM empresas;
SELECT 'Certificaciones con campo activa:' as tabla, COUNT(*) as total FROM certificaciones;
SELECT 'Relaciones cliente-certificación con campos nuevos:' as tabla, COUNT(*) as total FROM clientes_certificaciones;
SELECT 'Videos con duración como INT:' as tabla, COUNT(*) as total FROM videos;

-- 7. Mostrar algunos ejemplos de los datos actualizados
SELECT 'Ejemplo de empresas:' as info;
SELECT id, nombre, tipo, activa FROM empresas LIMIT 3;

SELECT 'Ejemplo de certificaciones:' as info;
SELECT id, nombre_certificacion, empresa_id, activa FROM certificaciones LIMIT 3;

SELECT 'Ejemplo de relaciones cliente-certificación:' as info;
SELECT cliente_id, certificacion_id, fecha_asignacion, activa FROM clientes_certificaciones LIMIT 3;

SELECT 'Ejemplo de videos:' as info;
SELECT id, nombre_video, duracion, certificacion_id FROM videos LIMIT 3; 