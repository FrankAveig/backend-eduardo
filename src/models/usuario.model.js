const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

class Usuario {
  static async getAll(limite = 10, offset = 0, filtros = {}) {
    try {
      let query = `
        SELECT u.*, r.nombre_rol 
        FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
      `;
      
      const params = [];
      
      // Aplicar filtros si existen
      if (Object.keys(filtros).length > 0) {
        const condiciones = [];
        
        if (filtros.nombre_completo) {
          condiciones.push('u.nombre_completo LIKE ?');
          params.push(`%${filtros.nombre_completo}%`);
        }
        
        if (filtros.correo) {
          condiciones.push('u.correo LIKE ?');
          params.push(`%${filtros.correo}%`);
        }
        
        if (filtros.rol_id) {
          condiciones.push('u.rol_id = ?');
          params.push(filtros.rol_id);
        }
        
        if (condiciones.length > 0) {
          query += ' WHERE ' + condiciones.join(' AND ');
        }
      }
      
      // Agregar límite y offset para paginación
      query += ' ORDER BY u.id DESC LIMIT ? OFFSET ?';
      params.push(limite, offset);
      
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async count(filtros = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM usuarios u';
      const params = [];
      
      // Aplicar filtros si existen
      if (Object.keys(filtros).length > 0) {
        const condiciones = [];
        
        if (filtros.nombre_completo) {
          condiciones.push('u.nombre_completo LIKE ?');
          params.push(`%${filtros.nombre_completo}%`);
        }
        
        if (filtros.correo) {
          condiciones.push('u.correo LIKE ?');
          params.push(`%${filtros.correo}%`);
        }
        
        if (filtros.rol_id) {
          condiciones.push('u.rol_id = ?');
          params.push(filtros.rol_id);
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
        SELECT u.*, r.nombre_rol 
        FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
        WHERE u.id = ?
      `, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getByEmail(correo) {
    try {
      const [rows] = await pool.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async create(userData) {
    const { nombre_completo, correo, contrasenia, rol_id } = userData;
    try {
      // Encriptar la contraseña
      const hashedPassword = await bcrypt.hash(contrasenia, 10);
      
      const [result] = await pool.query(
        'INSERT INTO usuarios (nombre_completo, correo, contrasenia, rol_id) VALUES (?, ?, ?, ?)',
        [nombre_completo, correo, hashedPassword, rol_id]
      );
      
      return { 
        id: result.insertId, 
        nombre_completo, 
        correo, 
        rol_id 
      };
    } catch (error) {
      throw error;
    }
  }

  static async update(id, userData) {
    const { nombre_completo, correo, contrasenia, rol_id } = userData;
    try {
      let query = 'UPDATE usuarios SET nombre_completo = ?, correo = ?, rol_id = ?';
      const params = [nombre_completo, correo, rol_id];

      // Si se proporciona una nueva contraseña, encriptarla y agregarla a la consulta
      if (contrasenia) {
        const hashedPassword = await bcrypt.hash(contrasenia, 10);
        query += ', contrasenia = ?';
        params.push(hashedPassword);
      }

      query += ' WHERE id = ?';
      params.push(id);

      const [result] = await pool.query(query, params);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = Usuario; 