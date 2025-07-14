const { pool } = require('../config/db');

class Documento {
  static async getAll(limit = 10, offset = 0) {
    try {
      const [rows] = await pool.query(`
        SELECT d.*, v.nombre_video
        FROM documentos d
        JOIN videos v ON d.video_id = v.id
        ORDER BY d.id DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async count() {
    try {
      const [result] = await pool.query(`SELECT COUNT(*) as total FROM documentos`);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }

  static async getById(id) {
    try {
      const [rows] = await pool.query(`
        SELECT d.*, v.nombre_video
        FROM documentos d
        JOIN videos v ON d.video_id = v.id
        WHERE d.id = ?
      `, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getByVideoId(videoId) {
    try {
      const [rows] = await pool.query(`
        SELECT * FROM documentos WHERE video_id = ?
      `, [videoId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async create(documentoData) {
    const { nombre_documento, ruta_documento, video_id } = documentoData;
    
    try {
      const [result] = await pool.query(
        'INSERT INTO documentos (nombre_documento, ruta_documento, video_id) VALUES (?, ?, ?)',
        [nombre_documento, ruta_documento, video_id]
      );
      
      return { 
        id: result.insertId, 
        nombre_documento, 
        ruta_documento, 
        video_id 
      };
    } catch (error) {
      throw error;
    }
  }

  static async update(id, documentoData) {
    const { nombre_documento, ruta_documento, video_id } = documentoData;
    
    try {
      const [result] = await pool.query(
        'UPDATE documentos SET nombre_documento = ?, ruta_documento = ?, video_id = ? WHERE id = ?',
        [nombre_documento, ruta_documento, video_id, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM documentos WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Documento; 