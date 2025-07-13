const { pool } = require('../config/db');

class Rol {
  static async getAll() {
    try {
      const [rows] = await pool.query('SELECT * FROM roles');
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async create(nombre_rol) {
    try {
      const [result] = await pool.query(
        'INSERT INTO roles (nombre_rol) VALUES (?)',
        [nombre_rol]
      );
      return { id: result.insertId, nombre_rol };
    } catch (error) {
      throw error;
    }
  }

  static async update(id, nombre_rol) {
    try {
      const [result] = await pool.query(
        'UPDATE roles SET nombre_rol = ? WHERE id = ?',
        [nombre_rol, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM roles WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Rol; 