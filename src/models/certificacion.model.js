const { pool } = require('../config/db');

class Certificacion {
  static async getAll(limite = 10, offset = 0, filtros = {}) {
    try {
      let query = `
        SELECT c.*, e.nombre as nombre_empresa 
        FROM certificaciones c
        JOIN empresas e ON c.empresa_id = e.id
      `;
      const params = [];
      
      // Aplicar filtros si existen
      if (Object.keys(filtros).length > 0) {
        const condiciones = [];
        
        if (filtros.nombre) {
          condiciones.push('c.nombre_certificacion LIKE ?');
          params.push(`%${filtros.nombre}%`);
        }
        
        if (filtros.empresa_id) {
          condiciones.push('c.empresa_id = ?');
          params.push(filtros.empresa_id);
        }
        
        if (filtros.empresa_nombre) {
          condiciones.push('e.nombre LIKE ?');
          params.push(`%${filtros.empresa_nombre}%`);
        }

        // Filtrar por estado activo si se especifica
        if (filtros.activa !== undefined) {
          condiciones.push('c.activa = ?');
          params.push(filtros.activa);
        }
        
        if (condiciones.length > 0) {
          query += ' WHERE ' + condiciones.join(' AND ');
        }
      }

      // Ordenar los resultados
      query += ' ORDER BY c.id DESC';
      
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
        FROM certificaciones c
        JOIN empresas e ON c.empresa_id = e.id
      `;
      const params = [];
      
      // Aplicar filtros si existen
      if (Object.keys(filtros).length > 0) {
        const condiciones = [];
        
        if (filtros.nombre) {
          condiciones.push('c.nombre_certificacion LIKE ?');
          params.push(`%${filtros.nombre}%`);
        }
        
        if (filtros.empresa_id) {
          condiciones.push('c.empresa_id = ?');
          params.push(filtros.empresa_id);
        }
        
        if (filtros.empresa_nombre) {
          condiciones.push('e.nombre LIKE ?');
          params.push(`%${filtros.empresa_nombre}%`);
        }

        // Filtrar por estado activo si se especifica
        if (filtros.activa !== undefined) {
          condiciones.push('c.activa = ?');
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
      const [rows] = await pool.query(`
        SELECT c.*, e.nombre as nombre_empresa 
        FROM certificaciones c
        JOIN empresas e ON c.empresa_id = e.id
        WHERE c.id = ?
      `, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getByEmpresaId(empresaId) {
    try {
      const [rows] = await pool.query(`
        SELECT * FROM certificaciones WHERE empresa_id = ?
      `, [empresaId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async create(certData) {
    const { nombre_certificacion, foto_certificacion, empresa_id } = certData;
    
    try {
      const [result] = await pool.query(
        'INSERT INTO certificaciones (nombre_certificacion, foto_certificacion, empresa_id, activa) VALUES (?, ?, ?, 1)',
        [nombre_certificacion, foto_certificacion, empresa_id]
      );
      
      return { 
        id: result.insertId, 
        nombre_certificacion, 
        foto_certificacion, 
        empresa_id,
        activa: 1
      };
    } catch (error) {
      throw error;
    }
  }

  static async update(id, certData) {
    const { nombre_certificacion, foto_certificacion, empresa_id } = certData;
    
    try {
      const [result] = await pool.query(
        'UPDATE certificaciones SET nombre_certificacion = ?, foto_certificacion = ?, empresa_id = ? WHERE id = ?',
        [nombre_certificacion, foto_certificacion, empresa_id, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Nuevo método para activar/desactivar certificación
  static async toggleActive(id) {
    try {
      // Obtener el estado actual
      const [currentState] = await pool.query('SELECT activa FROM certificaciones WHERE id = ?', [id]);
      
      if (currentState.length === 0) {
        throw new Error('Certificación no encontrada');
      }
      
      const nuevoEstado = currentState[0].activa === 1 ? 0 : 1;
      
      const [result] = await pool.query(
        'UPDATE certificaciones SET activa = ? WHERE id = ?',
        [nuevoEstado, id]
      );
      
      return {
        success: result.affectedRows > 0,
        activa: nuevoEstado === 1,
        message: nuevoEstado === 1 ? 'Certificación activada' : 'Certificación desactivada'
      };
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Primero, verificar si hay videos relacionados
      const [videosRelacionados] = await pool.query('SELECT id FROM videos WHERE certificacion_id = ?', [id]);
      
      if (videosRelacionados.length > 0) {
        throw { code: 'ER_ROW_IS_REFERENCED', message: 'No se puede eliminar la certificación porque tiene videos asociados' };
      }
      
      // Eliminar relaciones con clientes
      await pool.query('DELETE FROM clientes_certificaciones WHERE certificacion_id = ?', [id]);
      
      // Eliminar la certificación
      const [result] = await pool.query('DELETE FROM certificaciones WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getClientesByCertificacionId(certificacionId) {
    try {
      const [rows] = await pool.query(`
        SELECT c.*, cc.activa as certificacion_activa, cc.fecha_asignacion
        FROM clientes c
        JOIN clientes_certificaciones cc ON c.id = cc.cliente_id
        WHERE cc.certificacion_id = ?
      `, [certificacionId]);
      
      return rows;
    } catch (error) {
      throw error;
    }
  }
  
  static async getVideosByCertificacionId(certificacionId) {
    try {
      // Obtener los videos
      const [videos] = await pool.query(`
        SELECT v.* 
        FROM videos v
        WHERE v.certificacion_id = ?
      `, [certificacionId]);

      // Para cada video, obtener sus documentos relacionados
      const videosWithDocuments = await Promise.all(videos.map(async (video) => {
        const [documents] = await pool.query(`
          SELECT id, nombre_documento as document_name, ruta_documento as document_path, video_id
          FROM documentos
          WHERE video_id = ?
        `, [video.id]);

        return {
          ...video,
          documents: documents || []
        };
      }));

      return videosWithDocuments;
    } catch (error) {
      throw error;
    }
  }
  
  static async addClienteToCertificacion(certificacionId, clienteId) {
    try {
      // Verificar si la relación ya existe
      const [existingRows] = await pool.query(
        'SELECT * FROM clientes_certificaciones WHERE certificacion_id = ? AND cliente_id = ?',
        [certificacionId, clienteId]
      );
      
      if (existingRows.length > 0) {
        return { success: true, message: 'La relación ya existe' };
      }
      
      const [result] = await pool.query(
        'INSERT INTO clientes_certificaciones (certificacion_id, cliente_id, activa) VALUES (?, ?, 1)',
        [certificacionId, clienteId]
      );
      
      return { success: result.affectedRows > 0 };
    } catch (error) {
      throw error;
    }
  }
  
  static async removeClienteFromCertificacion(certificacionId, clienteId) {
    try {
      const [result] = await pool.query(
        'DELETE FROM clientes_certificaciones WHERE certificacion_id = ? AND cliente_id = ?',
        [certificacionId, clienteId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Nuevo método para activar/desactivar relación cliente-certificación
  static async toggleClienteCertificacion(certificacionId, clienteId) {
    try {
      // Verificar si la relación existe
      const [existingRows] = await pool.query(
        'SELECT activa FROM clientes_certificaciones WHERE certificacion_id = ? AND cliente_id = ?',
        [certificacionId, clienteId]
      );
      
      if (existingRows.length === 0) {
        throw new Error('La relación cliente-certificación no existe');
      }
      
      const nuevoEstado = existingRows[0].activa === 1 ? 0 : 1;
      
      const [result] = await pool.query(
        'UPDATE clientes_certificaciones SET activa = ? WHERE certificacion_id = ? AND cliente_id = ?',
        [nuevoEstado, certificacionId, clienteId]
      );
      
      return {
        success: result.affectedRows > 0,
        activa: nuevoEstado === 1,
        message: nuevoEstado === 1 ? 'Relación activada' : 'Relación desactivada'
      };
    } catch (error) {
      throw error;
    }
  }

  // Método para obtener certificaciones activas de un cliente
  static async getCertificacionesActivasByClienteId(clienteId) {
    try {
      const [rows] = await pool.query(`
        SELECT c.*, cc.fecha_asignacion, cc.activa as relacion_activa
        FROM certificaciones c
        JOIN clientes_certificaciones cc ON c.id = cc.certificacion_id
        WHERE cc.cliente_id = ? AND c.activa = 1 AND cc.activa = 1
      `, [clienteId]);
      
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Método para obtener todas las certificaciones de un cliente (activas e inactivas)
  static async getAllCertificacionesByClienteId(clienteId) {
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
}

module.exports = Certificacion; 