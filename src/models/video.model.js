const { pool } = require('../config/db');

class Video {
  static async getAll(limite = 10, offset = 0, filtros = {}) {
    try {
      let query = `
        SELECT v.*, c.nombre_certificacion
        FROM videos v
        JOIN certificaciones c ON v.certificacion_id = c.id
      `;
      
      const params = [];
      
      // Aplicar filtros si existen
      if (Object.keys(filtros).length > 0) {
        const condiciones = [];
        
        if (filtros.nombre_video) {
          condiciones.push('v.nombre_video LIKE ?');
          params.push(`%${filtros.nombre_video}%`);
        }
        
        if (filtros.certificacion_id) {
          condiciones.push('v.certificacion_id = ?');
          params.push(filtros.certificacion_id);
        }
        
        if (condiciones.length > 0) {
          query += ' WHERE ' + condiciones.join(' AND ');
        }
      }
      
      // Ordenar por ID descendente (más recientes primero)
      query += ' ORDER BY v.id DESC';
      
      // Aplicar paginación
      query += ' LIMIT ? OFFSET ?';
      params.push(limite, offset);
      
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }
  
  static async count(filtros = {}) {
    try {
      let query = `
        SELECT COUNT(*) as total
        FROM videos v
        JOIN certificaciones c ON v.certificacion_id = c.id
      `;
      
      const params = [];
      
      // Aplicar filtros si existen
      if (Object.keys(filtros).length > 0) {
        const condiciones = [];
        
        if (filtros.nombre_video) {
          condiciones.push('v.nombre_video LIKE ?');
          params.push(`%${filtros.nombre_video}%`);
        }
        
        if (filtros.certificacion_id) {
          condiciones.push('v.certificacion_id = ?');
          params.push(filtros.certificacion_id);
        }
        
        if (condiciones.length > 0) {
          query += ' WHERE ' + condiciones.join(' AND ');
        }
      }
      
      const [result] = await pool.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }

  static async getById(id) {
    try {
      const [rows] = await pool.query(`
        SELECT v.*, c.nombre_certificacion
        FROM videos v
        JOIN certificaciones c ON v.certificacion_id = c.id
        WHERE v.id = ?
      `, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getByCertificacionId(certificacionId) {
    try {
      const [rows] = await pool.query(`
        SELECT * FROM videos WHERE certificacion_id = ?
      `, [certificacionId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Nuevo método para obtener videos de certificaciones activas
  static async getByCertificacionActivaId(certificacionId) {
    try {
      const [rows] = await pool.query(`
        SELECT v.* 
        FROM videos v
        JOIN certificaciones c ON v.certificacion_id = c.id
        WHERE v.certificacion_id = ? AND c.activa = 1
      `, [certificacionId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async create(videoData) {
    const { nombre_video, ruta_video, duracion, certificacion_id } = videoData;
    
    try {
      // Convertir duración a entero si es string
      const duracionInt = typeof duracion === 'string' ? parseInt(duracion) : duracion;
      
      const [result] = await pool.query(
        'INSERT INTO videos (nombre_video, ruta_video, duracion, certificacion_id) VALUES (?, ?, ?, ?)',
        [nombre_video, ruta_video, duracionInt, certificacion_id]
      );
      
      return { 
        id: result.insertId, 
        nombre_video, 
        ruta_video, 
        duracion: duracionInt, 
        certificacion_id 
      };
    } catch (error) {
      throw error;
    }
  }

  static async update(id, videoData) {
    const { nombre_video, ruta_video, duracion, certificacion_id } = videoData;
    
    try {
      // Convertir duración a entero si es string
      const duracionInt = typeof duracion === 'string' ? parseInt(duracion) : duracion;
      
      const [result] = await pool.query(
        'UPDATE videos SET nombre_video = ?, ruta_video = ?, duracion = ?, certificacion_id = ? WHERE id = ?',
        [nombre_video, ruta_video, duracionInt, certificacion_id, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Primero eliminamos los documentos relacionados
      await pool.query('DELETE FROM documentos WHERE video_id = ?', [id]);
      
      // Luego eliminamos el video
      const [result] = await pool.query('DELETE FROM videos WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getDocumentosByVideoId(videoId) {
    try {
      const [rows] = await pool.query(`
        SELECT * FROM documentos WHERE video_id = ?
      `, [videoId]);
      
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Video; 