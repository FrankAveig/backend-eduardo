const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

class Cliente {
  static async getAll(limite = 10, offset = 0, filtros = {}) {
    try {
      let query = 'SELECT * FROM clientes';
      const params = [];
      
      // Aplicar filtros si existen
      if (Object.keys(filtros).length > 0) {
        const condiciones = [];
        
        if (filtros.nombre) {
          condiciones.push('nombre_completo LIKE ?');
          params.push(`%${filtros.nombre}%`);
        }
        
        if (filtros.correo) {
          condiciones.push('correo LIKE ?');
          params.push(`%${filtros.correo}%`);
        }
        
        if (filtros.estatus) {
          condiciones.push('estatus = ?');
          params.push(filtros.estatus);
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
      let query = 'SELECT COUNT(*) as total FROM clientes';
      const params = [];
      
      // Aplicar filtros si existen
      if (Object.keys(filtros).length > 0) {
        const condiciones = [];
        
        if (filtros.nombre) {
          condiciones.push('nombre_completo LIKE ?');
          params.push(`%${filtros.nombre}%`);
        }
        
        if (filtros.correo) {
          condiciones.push('correo LIKE ?');
          params.push(`%${filtros.correo}%`);
        }
        
        if (filtros.estatus) {
          condiciones.push('estatus = ?');
          params.push(filtros.estatus);
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
      const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getByEmail(correo) {
    try {
      const [rows] = await pool.query('SELECT * FROM clientes WHERE correo = ?', [correo]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async create(clienteData) {
    const { 
      nombre_completo, 
      correo, 
      contrasenia, 
      identificacion, 
      tipo_identificacion, 
      estatus = 'activo' 
    } = clienteData;
    
    try {
      // Encriptar la contraseña
      const hashedPassword = await bcrypt.hash(contrasenia, 10);
      
      const [result] = await pool.query(
        `INSERT INTO clientes 
        (nombre_completo, correo, contrasenia, identificacion, tipo_identificacion, estatus) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [nombre_completo, correo, hashedPassword, identificacion, tipo_identificacion, estatus]
      );
      
      return { 
        id: result.insertId, 
        nombre_completo, 
        correo, 
        identificacion, 
        tipo_identificacion, 
        estatus 
      };
    } catch (error) {
      throw error;
    }
  }

  static async update(id, clienteData) {
    const { 
      nombre_completo, 
      correo, 
      contrasenia, 
      identificacion, 
      tipo_identificacion, 
      estatus 
    } = clienteData;
    
    try {
      let query = `UPDATE clientes SET 
                  nombre_completo = ?, 
                  correo = ?, 
                  identificacion = ?, 
                  tipo_identificacion = ?, 
                  estatus = ?`;
                  
      const params = [
        nombre_completo, 
        correo, 
        identificacion, 
        tipo_identificacion, 
        estatus
      ];

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
      // Primero verificamos el estatus actual del cliente
      const [clienteActual] = await pool.query('SELECT estatus FROM clientes WHERE id = ?', [id]);
      
      if (clienteActual.length === 0) {
        throw new Error('Cliente no encontrado');
      }
      
      // Determinar el nuevo estatus (alternar entre 'activo' e 'inactivo')
      const nuevoEstatus = clienteActual[0].estatus === 'activo' ? 'inactivo' : 'activo';
      
      // Actualizar el estatus en lugar de eliminar
      const [result] = await pool.query(
        'UPDATE clientes SET estatus = ? WHERE id = ?',
        [nuevoEstatus, id]
      );
      
      return {
        success: result.affectedRows > 0,
        estatus: nuevoEstatus,
        message: nuevoEstatus === 'activo' ? 'Cliente reactivado' : 'Cliente desactivado'
      };
    } catch (error) {
      throw error;
    }
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Métodos para gestionar relaciones

  static async getEmpresasByClienteId(clienteId) {
    try {
      const [rows] = await pool.query(`
        SELECT e.* 
        FROM empresas e
        JOIN clientes_empresas ce ON e.id = ce.empresa_id
        WHERE ce.cliente_id = ?
      `, [clienteId]);
      
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getCertificacionesByClienteId(clienteId) {
    try {
      const [rows] = await pool.query(`
        SELECT c.*, cc.fecha_asignacion, cc.activa as relacion_activa
        FROM certificaciones c
        JOIN clientes_certificaciones cc ON c.id = cc.certificacion_id
        WHERE cc.cliente_id = ?
        ORDER BY cc.fecha_asignacion DESC
      `, [clienteId]);
      
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Nuevo método para obtener solo certificaciones activas
  static async getCertificacionesActivasByClienteId(clienteId) {
    try {
      const [rows] = await pool.query(`
        SELECT c.*, cc.fecha_asignacion, cc.activa as relacion_activa
        FROM certificaciones c
        JOIN clientes_certificaciones cc ON c.id = cc.certificacion_id
        WHERE cc.cliente_id = ? AND c.activa = 1 AND cc.activa = 1
        ORDER BY cc.fecha_asignacion DESC
      `, [clienteId]);
      
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async addEmpresaToCliente(clienteId, empresaId) {
    try {
      // Verificar si la relación ya existe
      const [existingRows] = await pool.query(
        'SELECT * FROM clientes_empresas WHERE cliente_id = ? AND empresa_id = ?',
        [clienteId, empresaId]
      );
      
      if (existingRows.length > 0) {
        return { success: true, message: 'La relación ya existe' };
      }
      
      const [result] = await pool.query(
        'INSERT INTO clientes_empresas (cliente_id, empresa_id) VALUES (?, ?)',
        [clienteId, empresaId]
      );
      
      return { success: result.affectedRows > 0 };
    } catch (error) {
      throw error;
    }
  }

  static async removeEmpresaFromCliente(clienteId, empresaId) {
    try {
      const [result] = await pool.query(
        'DELETE FROM clientes_empresas WHERE cliente_id = ? AND empresa_id = ?',
        [clienteId, empresaId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async addCertificacionToCliente(clienteId, certificacionId) {
    try {
      // Verificar si la relación ya existe
      const [existingRows] = await pool.query(
        'SELECT * FROM clientes_certificaciones WHERE cliente_id = ? AND certificacion_id = ?',
        [clienteId, certificacionId]
      );
      
      if (existingRows.length > 0) {
        return { success: true, message: 'La relación ya existe' };
      }
      
      const [result] = await pool.query(
        'INSERT INTO clientes_certificaciones (cliente_id, certificacion_id) VALUES (?, ?)',
        [clienteId, certificacionId]
      );
      
      return { success: result.affectedRows > 0 };
    } catch (error) {
      throw error;
    }
  }

  static async removeCertificacionFromCliente(clienteId, certificacionId) {
    try {
      const [result] = await pool.query(
        'DELETE FROM clientes_certificaciones WHERE cliente_id = ? AND certificacion_id = ?',
        [clienteId, certificacionId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Cliente; 