const Certificacion = require('../models/certificacion.model');
const Empresa = require('../models/empresa.model');
const { uploadToFtp } = require('../middleware/upload.middleware');

// Obtener todas las certificaciones con paginación y filtros
const getAllCertificaciones = async (req, res) => {
  try {
    // Parámetros de paginación y filtrado
    const limite = parseInt(req.query.limite) || 10;
    const pagina = parseInt(req.query.pagina) || 1;
    const offset = (pagina - 1) * limite;
    const nombre = req.query.nombre;
    const empresa_id = req.query.empresa_id;
    const empresa_nombre = req.query.empresa_nombre;
    
    // Obtener el total de registros para calcular total de páginas
    const filtros = {};
    if (nombre) filtros.nombre = nombre;
    if (empresa_id) filtros.empresa_id = empresa_id;
    if (empresa_nombre) filtros.empresa_nombre = empresa_nombre;
    
    const totalRegistros = await Certificacion.count(filtros);
    const totalPaginas = Math.ceil(totalRegistros / limite);
    
    // Obtener los datos paginados y filtrados
    const certificaciones = await Certificacion.getAll(limite, offset, filtros);
    
    // Respuesta estructurada
    res.json({
      title: "Successful certifications query",
      statusCode: 200,
      data: {
        certifications: certificaciones,
        pagination: {
          total: totalRegistros,
          totalPages: totalPaginas,
          currentPage: pagina,
          limit: limite
        }
      }
    });
  } catch (error) {
    console.error('Error retrieving certifications:', error);
    res.status(500).json({ 
      title: "Error retrieving certifications",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Obtener una certificación por ID
const getCertificacionById = async (req, res) => {
  try {
    const id = req.params.id;
    const certificacion = await Certificacion.getById(id);
    
    if (!certificacion) {
      return res.status(404).json({ 
        title: "Certification not found",
        statusCode: 404,
        message: 'Certification not found' 
      });
    }
    
    res.json({
      title: "Successful certification query",
      statusCode: 200,
      data: certificacion
    });
  } catch (error) {
    console.error(`Error retrieving certification with id ${req.params.id}:`, error);
    res.status(500).json({ 
      title: "Error retrieving certification",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Obtener certificaciones por empresa ID
const getCertificacionesByEmpresaId = async (req, res) => {
  try {
    const empresaId = req.params.empresaId;
    
    // Verificar si la empresa existe
    const empresa = await Empresa.getById(empresaId);
    if (!empresa) {
      return res.status(404).json({ 
        title: "Company not found",
        statusCode: 404,
        message: 'Company not found' 
      });
    }
    
    const certificaciones = await Certificacion.getByEmpresaId(empresaId);
    
    res.json({
      title: "Successful certifications by company query",
      statusCode: 200,
      data: {
        company: {
          id: empresa.id,
          name: empresa.nombre
        },
        certifications: certificaciones,
        total: certificaciones.length
      }
    });
  } catch (error) {
    console.error(`Error retrieving certifications for company with id ${req.params.empresaId}:`, error);
    res.status(500).json({ 
      title: "Error retrieving certifications",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Crear una nueva certificación
const createCertificacion = async (req, res) => {
  try {
    let { nombre_certificacion, foto_certificacion, empresa_id } = req.body;
    let fotoRuta = foto_certificacion;
    if (req.file && req.file.buffer) {
      const uploadResult = await uploadToFtp(req.file.buffer, { certification_name: nombre_certificacion });
      console.log('Resultado de uploadToFtp:', uploadResult);
      if (uploadResult.success) {
        fotoRuta = uploadResult.url;
      }
    }
    console.log('Datos a guardar (create):', { nombre_certificacion, foto_certificacion: fotoRuta, empresa_id });
    if (!nombre_certificacion || !empresa_id) {
      return res.status(400).json({ 
        title: "Incomplete data",
        statusCode: 400,
        message: 'Required fields: nombre_certificacion, empresa_id' 
      });
    }
    const empresa = await Empresa.getById(empresa_id);
    if (!empresa) {
      return res.status(404).json({ 
        title: "Company not found",
        statusCode: 404,
        message: 'The specified company does not exist' 
      });
    }
    const nuevaCertificacion = await Certificacion.create({ 
      nombre_certificacion, 
      foto_certificacion: fotoRuta, 
      empresa_id 
    });
    const certificacionCompleta = await Certificacion.getById(nuevaCertificacion.id);
    // Mapear la respuesta para incluir certification_photo
    const responseData = {
      id: certificacionCompleta.id,
      certification_name: certificacionCompleta.nombre_certificacion,
      company_id: certificacionCompleta.empresa_id,
      company_name: certificacionCompleta.nombre_empresa,
      certification_photo: certificacionCompleta.foto_certificacion
    };
    res.status(201).json({
      title: "Certification created successfully",
      statusCode: 201,
      data: responseData
    });
  } catch (error) {
    console.error('Error creating certification:', error);
    
    // Verificar si es un error de clave foránea (la empresa no existe)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        title: "Reference error",
        statusCode: 400,
        message: 'The specified company does not exist' 
      });
    }
    
    res.status(500).json({ 
      title: "Error creating certification",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Actualizar una certificación existente
const updateCertificacion = async (req, res) => {
  try {
    const id = req.params.id;
    let { nombre_certificacion, foto_certificacion, empresa_id } = req.body;
    let fotoRuta = foto_certificacion;
    if (req.file && req.file.buffer) {
      const uploadResult = await uploadToFtp(req.file.buffer, { certification_name: nombre_certificacion, id });
      console.log('Resultado de uploadToFtp:', uploadResult);
      if (uploadResult.success) {
        fotoRuta = uploadResult.url;
      }
    }
    console.log('Datos a guardar (update):', { nombre_certificacion, foto_certificacion: fotoRuta, empresa_id });
    if (!nombre_certificacion || !empresa_id) {
      return res.status(400).json({ 
        title: "Incomplete data",
        statusCode: 400,
        message: 'Required fields: nombre_certificacion, empresa_id' 
      });
    }
    const certificacionExistente = await Certificacion.getById(id);
    if (!certificacionExistente) {
      return res.status(404).json({ 
        title: "Certification not found",
        statusCode: 404,
        message: 'Certification not found' 
      });
    }
    const empresa = await Empresa.getById(empresa_id);
    if (!empresa) {
      return res.status(404).json({ 
        title: "Company not found",
        statusCode: 404,
        message: 'The specified company does not exist' 
      });
    }
    const actualizado = await Certificacion.update(id, { 
      nombre_certificacion, 
      foto_certificacion: fotoRuta, 
      empresa_id 
    });
    if (actualizado) {
      const certificacionActualizada = await Certificacion.getById(id);
      const responseData = {
        id: certificacionActualizada.id,
        certification_name: certificacionActualizada.nombre_certificacion,
        company_id: certificacionActualizada.empresa_id,
        company_name: certificacionActualizada.nombre_empresa,
        certification_photo: certificacionActualizada.foto_certificacion
      };
      res.json({
        title: "Certification updated successfully",
        statusCode: 200,
        data: responseData
      });
    } else {
      res.status(400).json({ 
        title: "Update failed",
        statusCode: 400,
        message: 'Could not update certification' 
      });
    }
  } catch (error) {
    console.error(`Error updating certification with id ${req.params.id}:`, error);
    
    // Verificar si es un error de clave foránea (la empresa no existe)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        title: "Reference error",
        statusCode: 400,
        message: 'The specified company does not exist' 
      });
    }
    
    res.status(500).json({ 
      title: "Error updating certification",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Eliminar una certificación
const deleteCertificacion = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Verificar si la certificación existe
    const certificacionExistente = await Certificacion.getById(id);
    if (!certificacionExistente) {
      return res.status(404).json({ 
        title: "Certification not found",
        statusCode: 404,
        message: 'Certification not found' 
      });
    }
    
    const eliminado = await Certificacion.delete(id);
    
    if (eliminado) {
      res.json({ 
        title: "Certification deleted successfully",
        statusCode: 200,
        message: 'Certification deleted correctly',
        id 
      });
    } else {
      res.status(400).json({ 
        title: "Delete failed",
        statusCode: 400,
        message: 'Could not delete certification' 
      });
    }
  } catch (error) {
    console.error(`Error deleting certification with id ${req.params.id}:`, error);
    
    // Verificar si es un error porque la certificación tiene videos asociados
    if (error.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(400).json({ 
        title: "Certification in use",
        statusCode: 400,
        message: 'Cannot delete certification because it has associated videos' 
      });
    }
    
    res.status(500).json({ 
      title: "Error deleting certification",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Obtener clientes por ID de certificación
const getClientesByCertificacionId = async (req, res) => {
  try {
    const certificacionId = req.params.id;
    
    // Verificar si la certificación existe
    const certificacion = await Certificacion.getById(certificacionId);
    if (!certificacion) {
      return res.status(404).json({ 
        title: "Certification not found",
        statusCode: 404,
        message: 'Certification not found' 
      });
    }
    
    const clientes = await Certificacion.getClientesByCertificacionId(certificacionId);
    
    res.json({
      title: "Successful clients by certification query",
      statusCode: 200,
      data: {
        certification: {
          id: certificacion.id,
          name: certificacion.nombre_certificacion
        },
        clients: clientes,
        total: clientes.length
      }
    });
  } catch (error) {
    console.error(`Error retrieving clients for certification with id ${req.params.id}:`, error);
    res.status(500).json({ 
      title: "Error retrieving clients",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Obtener videos por ID de certificación
const getVideosByCertificacionId = async (req, res) => {
  try {
    const certificacionId = req.params.id;
    
    // Verificar si la certificación existe
    const certificacion = await Certificacion.getById(certificacionId);
    if (!certificacion) {
      return res.status(404).json({ 
        title: "Certification not found",
        statusCode: 404,
        message: 'Certification not found' 
      });
    }
    
    const videos = await Certificacion.getVideosByCertificacionId(certificacionId);
    
    res.json({
      title: "Successful videos by certification query",
      statusCode: 200,
      data: {
        certification: {
          id: certificacion.id,
          name: certificacion.nombre_certificacion
        },
        videos,
        total: videos.length
      }
    });
  } catch (error) {
    console.error(`Error retrieving videos for certification with id ${req.params.id}:`, error);
    res.status(500).json({ 
      title: "Error retrieving videos",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Agregar un cliente a una certificación
const addClienteToCertificacion = async (req, res) => {
  try {
    const certificacionId = req.params.id;
    const { cliente_id } = req.body;
    
    // Validar campos requeridos
    if (!cliente_id) {
      return res.status(400).json({ 
        title: "Incomplete data",
        statusCode: 400,
        message: 'Required field: cliente_id' 
      });
    }
    
    // Verificar si la certificación existe
    const certificacion = await Certificacion.getById(certificacionId);
    if (!certificacion) {
      return res.status(404).json({ 
        title: "Certification not found",
        statusCode: 404,
        message: 'Certification not found' 
      });
    }
    
    const resultado = await Certificacion.addClienteToCertificacion(certificacionId, cliente_id);
    
    if (resultado.success) {
      res.json({ 
        title: "Client assigned successfully",
        statusCode: 200,
        message: resultado.message || 'Client correctly assigned to certification',
        data: { certificationId: certificacionId, clientId: cliente_id }
      });
    } else {
      res.status(400).json({ 
        title: "Assignment failed",
        statusCode: 400,
        message: 'Could not assign client to certification' 
      });
    }
  } catch (error) {
    console.error(`Error assigning client to certification with id ${req.params.id}:`, error);
    res.status(500).json({ 
      title: "Error assigning client",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Eliminar un cliente de una certificación
const removeClienteFromCertificacion = async (req, res) => {
  try {
    const certificacionId = req.params.certificacionId;
    const clienteId = req.params.clienteId;
    
    // Verificar si la certificación existe
    const certificacion = await Certificacion.getById(certificacionId);
    if (!certificacion) {
      return res.status(404).json({ 
        title: "Certification not found",
        statusCode: 404,
        message: 'Certification not found' 
      });
    }
    
    const eliminado = await Certificacion.removeClienteFromCertificacion(certificacionId, clienteId);
    
    if (eliminado) {
      res.json({ 
        title: "Client removed successfully",
        statusCode: 200,
        message: 'Client correctly removed from certification',
        data: { certificationId: certificacionId, clientId: clienteId }
      });
    } else {
      res.status(400).json({ 
        title: "Removal failed",
        statusCode: 400,
        message: 'Could not remove client from certification' 
      });
    }
  } catch (error) {
    console.error(`Error removing client ${req.params.clienteId} from certification ${req.params.certificacionId}:`, error);
    res.status(500).json({ 
      title: "Error removing client",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Nuevo método para activar/desactivar certificación
const toggleCertificacionActive = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Verificar si la certificación existe
    const certificacionExistente = await Certificacion.getById(id);
    if (!certificacionExistente) {
      return res.status(404).json({ 
        title: "Certification not found",
        statusCode: 404,
        message: 'Certification not found' 
      });
    }
    
    const resultado = await Certificacion.toggleActive(id);
    
    if (resultado.success) {
      res.json({ 
        title: "Certification status updated successfully",
        statusCode: 200,
        message: resultado.message,
        data: {
          id: id,
          activa: resultado.activa
        }
      });
    } else {
      res.status(400).json({ 
        title: "Update failed",
        statusCode: 400,
        message: 'Could not update certification status' 
      });
    }
  } catch (error) {
    console.error(`Error updating certification status with id ${req.params.id}:`, error);
    res.status(500).json({ 
      title: "Error updating certification status",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Nuevo método para activar/desactivar relación cliente-certificación
const toggleClienteCertificacion = async (req, res) => {
  try {
    const certificacionId = req.params.id;
    const clienteId = req.params.clienteId;
    
    // Verificar si la certificación existe
    const certificacion = await Certificacion.getById(certificacionId);
    if (!certificacion) {
      return res.status(404).json({ 
        title: "Certification not found",
        statusCode: 404,
        message: 'Certification not found' 
      });
    }
    
    const resultado = await Certificacion.toggleClienteCertificacion(certificacionId, clienteId);
    
    if (resultado.success) {
      res.json({ 
        title: "Client-certification relationship updated successfully",
        statusCode: 200,
        message: resultado.message,
        data: {
          certificacionId: certificacionId,
          clienteId: clienteId,
          activa: resultado.activa
        }
      });
    } else {
      res.status(400).json({ 
        title: "Update failed",
        statusCode: 400,
        message: 'Could not update client-certification relationship' 
      });
    }
  } catch (error) {
    console.error(`Error updating client-certification relationship:`, error);
    res.status(500).json({ 
      title: "Error updating relationship",
      statusCode: 500,
      error: error.message 
    });
  }
};

module.exports = {
  getAllCertificaciones,
  getCertificacionById,
  getCertificacionesByEmpresaId,
  createCertificacion,
  updateCertificacion,
  deleteCertificacion,
  getClientesByCertificacionId,
  getVideosByCertificacionId,
  addClienteToCertificacion,
  removeClienteFromCertificacion,
  toggleCertificacionActive,
  toggleClienteCertificacion
}; 