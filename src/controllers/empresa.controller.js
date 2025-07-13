const Empresa = require('../models/empresa.model');

// Obtener todas las empresas con paginación y filtros
const getAllCompanies = async (req, res) => {
  try {
    // Parámetros de paginación y filtrado
    const limite = parseInt(req.query.limite) || 10;
    const pagina = parseInt(req.query.pagina) || 1;
    const offset = (pagina - 1) * limite;
    const tipo = req.query.tipo;
    const nombre = req.query.nombre;
    
    // Obtener el total de registros para calcular total de páginas
    const filtros = {};
    if (tipo) filtros.tipo = tipo;
    if (nombre) filtros.nombre = nombre;
    
    const totalRegistros = await Empresa.count(filtros);
    const totalPaginas = Math.ceil(totalRegistros / limite);
    
    // Obtener los datos paginados y filtrados
    const empresas = await Empresa.getAll(limite, offset, filtros);
    
    // Respuesta estructurada
    res.json({
      titulo: "Consulta de empresas exitosa",
      statusCode: 200,
      data: {
        empresas,
        paginacion: {
          total: totalRegistros,
          totalPaginas,
          paginaActual: pagina,
          limite
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    res.status(500).json({ 
      titulo: "Error al obtener empresas",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Obtener una empresa por ID
const getCompanyById = async (req, res) => {
  try {
    const id = req.params.id;
    const empresa = await Empresa.getById(id);
    
    if (!empresa) {
      return res.status(404).json({ 
        titulo: "Empresa no encontrada",
        statusCode: 404,
        mensaje: 'Empresa no encontrada' 
      });
    }
    
    res.json({
      titulo: "Consulta de empresa exitosa",
      statusCode: 200,
      data: empresa
    });
  } catch (error) {
    console.error(`Error al obtener empresa con id ${req.params.id}:`, error);
    res.status(500).json({ 
      titulo: "Error al obtener empresa",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Crear una nueva empresa
const createCompany = async (req, res) => {
  try {
    const { nombre, tipo } = req.body;
    
    // Establecer activa como true por defecto
    const activa = req.body.activa !== undefined ? req.body.activa : true;
    
    // Validar campos requeridos
    if (!nombre || !tipo) {
      return res.status(400).json({ 
        titulo: "Datos incompletos",
        statusCode: 400,
        mensaje: 'Se requieren los campos: nombre, tipo' 
      });
    }
    
    const nuevaEmpresa = await Empresa.create({ nombre, tipo, activa });
    
    res.status(201).json({
      titulo: "Empresa creada exitosamente",
      statusCode: 201,
      data: nuevaEmpresa
    });
  } catch (error) {
    console.error('Error al crear empresa:', error);
    
    // Verificar si es un error de duplicación (nombre ya existe)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        titulo: "Error de duplicación",
        statusCode: 400,
        mensaje: 'El nombre de empresa ya existe' 
      });
    }
    
    res.status(500).json({ 
      titulo: "Error al crear empresa",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Actualizar una empresa existente
const updateCompany = async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre, tipo } = req.body;
    
    // Establecer activa como true por defecto si no se proporciona
    const activa = req.body.activa !== undefined ? req.body.activa : true;
    
    // Validar campos requeridos
    if (!nombre || !tipo) {
      return res.status(400).json({ 
        titulo: "Datos incompletos",
        statusCode: 400,
        mensaje: 'Se requieren los campos: nombre, tipo' 
      });
    }
    
    // Verificar si la empresa existe
    const empresaExistente = await Empresa.getById(id);
    if (!empresaExistente) {
      return res.status(404).json({ 
        titulo: "Empresa no encontrada",
        statusCode: 404,
        mensaje: 'Empresa no encontrada' 
      });
    }
    
    const actualizado = await Empresa.update(id, { nombre, tipo, activa });
    
    if (actualizado) {
      res.json({ 
        titulo: "Empresa actualizada exitosamente",
        statusCode: 200,
        data: { id, nombre, tipo, activa }
      });
    } else {
      res.status(400).json({ 
        titulo: "No se pudo actualizar",
        statusCode: 400,
        mensaje: 'No se pudo actualizar la empresa' 
      });
    }
  } catch (error) {
    console.error(`Error al actualizar empresa con id ${req.params.id}:`, error);
    
    // Verificar si es un error de duplicación (nombre ya existe)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        titulo: "Error de duplicación",
        statusCode: 400,
        mensaje: 'El nombre de empresa ya existe' 
      });
    }
    
    res.status(500).json({ 
      titulo: "Error al actualizar empresa",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Cambiar estatus de una empresa (activa/inactiva)
const deleteCompany = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Verificar si la empresa existe
    const empresaExistente = await Empresa.getById(id);
    if (!empresaExistente) {
      return res.status(404).json({ 
        title: "Company not found",
        statusCode: 404,
        message: 'Company not found' 
      });
    }
    
    const resultado = await Empresa.delete(id);
    
    if (resultado.success) {
      res.json({ 
        title: resultado.activa ? "Company reactivated successfully" : "Company deactivated successfully",
        statusCode: 200,
        message: resultado.message,
        data: {
          id,
          activa: resultado.activa
        }
      });
    } else {
      res.status(400).json({ 
        title: "Status change failed",
        statusCode: 400,
        message: 'Could not change company status' 
      });
    }
  } catch (error) {
    console.error(`Error al cambiar estatus de la empresa con id ${req.params.id}:`, error);
    
    res.status(500).json({ 
      title: "Error changing company status",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Obtener clientes de una empresa
const getClientsByCompanyId = async (req, res) => {
  try {
    const empresaId = req.params.id;
    
    // Verificar si la empresa existe
    const empresa = await Empresa.getById(empresaId);
    if (!empresa) {
      return res.status(404).json({ 
        titulo: "Empresa no encontrada",
        statusCode: 404,
        mensaje: 'Empresa no encontrada' 
      });
    }
    
    const clientes = await Empresa.getClientesByEmpresaId(empresaId);
    
    res.json({
      titulo: "Consulta de clientes por empresa exitosa",
      statusCode: 200,
      data: {
        empresa,
        clientes
      }
    });
  } catch (error) {
    console.error(`Error al obtener clientes de la empresa con id ${req.params.id}:`, error);
    res.status(500).json({ 
      titulo: "Error al obtener clientes",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Nuevo método para activar/desactivar empresa
const toggleCompanyActive = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Verificar si la empresa existe
    const empresaExistente = await Empresa.getById(id);
    if (!empresaExistente) {
      return res.status(404).json({ 
        title: "Company not found",
        statusCode: 404,
        message: 'Company not found' 
      });
    }
    
    const resultado = await Empresa.toggleActive(id);
    
    if (resultado.success) {
      res.json({ 
        title: "Company status updated successfully",
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
        message: 'Could not update company status' 
      });
    }
  } catch (error) {
    console.error(`Error updating company status with id ${req.params.id}:`, error);
    res.status(500).json({ 
      title: "Error updating company status",
      statusCode: 500,
      error: error.message 
    });
  }
};

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getClientsByCompanyId,
  toggleCompanyActive
}; 