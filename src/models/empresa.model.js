const { pool } = require('../config/db');

class Empresa {
  static async getAll(limite = 10, offset = 0, filtros = {}) {
    try {
      let query = 'SELECT * FROM empresas';
      const params = [];
      
      // Aplicar filtros si existen
      if (Object.keys(filtros).length > 0) {
        const condiciones = [];
        
        if (filtros.nombre) {
          condiciones.push('nombre LIKE ?');
          params.push(`%${filtros.nombre}%`);
        }
        
        if (filtros.tipo) {
          condiciones.push('tipo = ?');
          params.push(filtros.tipo);
        }

        // Filtrar por estado activo si se especifica
        if (filtros.activa !== undefined) {
          condiciones.push('activa = ?');
          params.push(filtros.activa);
        }
        
        if (condiciones.length > 0) {
          query += ' WHERE ' + condiciones.join(' AND ');
        }
      }
      
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
      let query = 'SELECT COUNT(*) as total FROM empresas';
      const params = [];
      
      // Aplicar filtros si existen
      if (Object.keys(filtros).length > 0) {
        const condiciones = [];
        
        if (filtros.nombre) {
          condiciones.push('nombre LIKE ?');
          params.push(`%${filtros.nombre}%`);
        }
        
        if (filtros.tipo) {
          condiciones.push('tipo = ?');
          params.push(filtros.tipo);
        }

        // Filtrar por estado activo si se especifica
        if (filtros.activa !== undefined) {
          condiciones.push('activa = ?');
          params.push(filtros.activa);
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
      const [rows] = await pool.query('SELECT * FROM empresas WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async create(empresaData) {
    const { nombre, tipo } = empresaData;
    const activa = empresaData.activa !== undefined ? empresaData.activa : true;
    
    try {
      const [result] = await pool.query(
        'INSERT INTO empresas (nombre, tipo, activa) VALUES (?, ?, ?)',
        [nombre, tipo, activa]
      );
      
      return { 
        id: result.insertId, 
        nombre, 
        tipo, 
        activa 
      };
    } catch (error) {
      throw error;
    }
  }

  static async update(id, empresaData) {
    const { nombre, tipo, activa } = empresaData;
    
    try {
      const [result] = await pool.query(
        'UPDATE empresas SET nombre = ?, tipo = ?, activa = ? WHERE id = ?',
        [nombre, tipo, activa, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Nuevo método para activar/desactivar empresa
  static async toggleActive(id) {
    try {
      // Obtener el estado actual
      const [currentState] = await pool.query('SELECT activa FROM empresas WHERE id = ?', [id]);
      
      if (currentState.length === 0) {
        throw new Error('Empresa no encontrada');
      }
      
      const nuevoEstado = currentState[0].activa === 1 ? 0 : 1;
      
      const [result] = await pool.query(
        'UPDATE empresas SET activa = ? WHERE id = ?',
        [nuevoEstado, id]
      );
      
      return {
        success: result.affectedRows > 0,
        activa: nuevoEstado === 1,
        message: nuevoEstado === 1 ? 'Empresa activada' : 'Empresa desactivada'
      };
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Primero verificamos el estado actual de la empresa
      const [empresaActual] = await pool.query('SELECT activa FROM empresas WHERE id = ?', [id]);
      
      if (empresaActual.length === 0) {
        throw new Error('Empresa no encontrada');
      }
      
      // Determinar el nuevo estado (alternar entre activa e inactiva)
      const nuevoEstado = empresaActual[0].activa ? false : true;
      
      // Actualizar el estado en lugar de eliminar
      const [result] = await pool.query(
        'UPDATE empresas SET activa = ? WHERE id = ?',
        [nuevoEstado, id]
      );
      
      return {
        success: result.affectedRows > 0,
        activa: nuevoEstado,
        message: nuevoEstado ? 'Empresa reactivada' : 'Empresa desactivada'
      };
    } catch (error) {
      throw error;
    }
  }

  static async getClientesByEmpresaId(empresaId) {
    try {
      const [rows] = await pool.query(`
        SELECT c.* 
        FROM clientes c
        JOIN clientes_empresas ce ON c.id = ce.cliente_id
        WHERE ce.empresa_id = ?
      `, [empresaId]);
      
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Empresa; 