const Cliente = require('../models/cliente.model');

// Obtener todos los clientes con paginación y filtros (para admin y revisores)
const getAllClients = async (req, res) => {
  try {
    // Parámetros de paginación y filtrado
    const limite = parseInt(req.query.limite) || 10;
    const pagina = parseInt(req.query.pagina) || 1;
    const offset = (pagina - 1) * limite;
    const estatus = req.query.estatus;
    const nombre = req.query.nombre;
    const correo = req.query.correo;
    
    // Obtener el total de registros para calcular total de páginas
    const filtros = {};
    if (estatus) filtros.estatus = estatus;
    if (nombre) filtros.nombre = nombre;
    if (correo) filtros.correo = correo;
    
    const totalRegistros = await Cliente.count(filtros);
    const totalPaginas = Math.ceil(totalRegistros / limite);
    
    // Obtener los datos paginados y filtrados
    const clientes = await Cliente.getAll(limite, offset, filtros);
    
    // Ocultar contraseñas en la respuesta y obtener empresas para cada cliente
    const clientesConEmpresas = await Promise.all(clientes.map(async c => {
      const { contrasenia, ...clienteSinPassword } = c;
      
      // Obtener empresas asociadas al cliente
      const empresas = await Cliente.getEmpresasByClienteId(c.id);
      
      return {
        ...clienteSinPassword,
        empresas: empresas || []
      };
    }));
    
    // Respuesta estructurada
    res.json({
      title: "Clients retrieved successfully",
      statusCode: 200,
      data: {
        clients: clientesConEmpresas,
        pagination: {
          total: totalRegistros,
          totalPages: totalPaginas,
          currentPage: pagina,
          limit: limite
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ 
      title: "Error retrieving clients",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Obtener un cliente por ID (para admin y revisores)
const getClientById = async (req, res) => {
  try {
    const id = req.params.id;
    const cliente = await Cliente.getById(id);
    
    if (!cliente) {
      return res.status(404).json({ 
        title: "Client not found",
        statusCode: 404,
        message: 'Client not found' 
      });
    }
    
    // Ocultar contraseña en la respuesta
    const { contrasenia, ...clienteSinPassword } = cliente;
    
    // Obtener empresas asociadas al cliente
    const empresas = await Cliente.getEmpresasByClienteId(id);
    
    res.json({
      title: "Client retrieved successfully",
      statusCode: 200,
      data: {
        ...clienteSinPassword,
        empresas: empresas || []
      }
    });
  } catch (error) {
    console.error(`Error al obtener cliente con id ${req.params.id}:`, error);
    res.status(500).json({ 
      title: "Error retrieving client",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Crear un nuevo cliente (solo admin)
const createClient = async (req, res) => {
  try {
    const { 
      nombre_completo, 
      correo, 
      contrasenia, 
      identificacion, 
      tipo_identificacion
    } = req.body;
    
    // Establecer estatus como 'activo' por defecto
    const estatus = req.body.estatus || 'activo';
    
    // Validar campos requeridos
    if (!nombre_completo || !correo || !contrasenia) {
      return res.status(400).json({ 
        title: "Incomplete data",
        statusCode: 400,
        message: 'Required fields: nombre_completo, correo, contrasenia' 
      });
    }
    
    // Verificar si el correo ya existe
    const clienteExistente = await Cliente.getByEmail(correo);
    if (clienteExistente) {
      return res.status(400).json({ 
        title: "Duplication error",
        statusCode: 400,
        message: 'Email is already registered' 
      });
    }
    
    const nuevoCliente = await Cliente.create({ 
      nombre_completo, 
      correo, 
      contrasenia, 
      identificacion, 
      tipo_identificacion, 
      estatus 
    });
    
    res.status(201).json({
      title: "Client created successfully",
      statusCode: 201,
      data: nuevoCliente
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ 
      title: "Error creating client",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Actualizar un cliente existente (solo admin)
const updateClient = async (req, res) => {
  try {
    const id = req.params.id;
    const { 
      nombre_completo, 
      correo, 
      contrasenia, 
      identificacion, 
      tipo_identificacion
    } = req.body;
    
    // Establecer estatus como 'activo' por defecto si no se proporciona
    const estatus = req.body.estatus || 'activo';
    
    // Validar campos requeridos
    if (!nombre_completo || !correo) {
      return res.status(400).json({ 
        title: "Incomplete data",
        statusCode: 400,
        message: 'Required fields: nombre_completo, correo' 
      });
    }
    
    // Verificar si el cliente existe
    const clienteExistente = await Cliente.getById(id);
    if (!clienteExistente) {
      return res.status(404).json({ 
        title: "Client not found",
        statusCode: 404,
        message: 'Client not found' 
      });
    }
    
    // Verificar si el correo ya está en uso por otro cliente
    if (correo !== clienteExistente.correo) {
      const correoExistente = await Cliente.getByEmail(correo);
      if (correoExistente) {
        return res.status(400).json({ 
          title: "Duplication error",
          statusCode: 400,
          message: 'Email is already registered by another client' 
        });
      }
    }
    
    const actualizado = await Cliente.update(id, { 
      nombre_completo, 
      correo, 
      contrasenia, 
      identificacion, 
      tipo_identificacion, 
      estatus 
    });
    
    if (actualizado) {
      res.json({ 
        title: "Client updated successfully",
        statusCode: 200,
        data: { 
          id, 
          nombre_completo, 
          correo, 
          identificacion, 
          tipo_identificacion, 
          estatus 
        }
      });
    } else {
      res.status(400).json({ 
        title: "Update failed",
        statusCode: 400,
        message: 'Could not update client' 
      });
    }
  } catch (error) {
    console.error(`Error al actualizar cliente con id ${req.params.id}:`, error);
    res.status(500).json({ 
      title: "Error updating client",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Cambiar estatus de un cliente (activo/inactivo) (solo admin)
const deleteClient = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Verificar si el cliente existe
    const clienteExistente = await Cliente.getById(id);
    if (!clienteExistente) {
      return res.status(404).json({ 
        title: "Client not found",
        statusCode: 404,
        message: 'Client not found' 
      });
    }
    
    const resultado = await Cliente.delete(id);
    
    if (resultado.success) {
      res.json({ 
        title: resultado.estatus === 'activo' ? "Client reactivated successfully" : "Client deactivated successfully",
        statusCode: 200,
        message: resultado.message,
        data: {
          id,
          estatus: resultado.estatus
        }
      });
    } else {
      res.status(400).json({ 
        title: "Status change failed",
        statusCode: 400,
        message: 'Could not change client status' 
      });
    }
  } catch (error) {
    console.error(`Error al cambiar estatus del cliente con id ${req.params.id}:`, error);
    res.status(500).json({ 
      title: "Error changing client status",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Obtener empresas de un cliente
const getCompaniesByClientId = async (req, res) => {
  try {
    const clienteId = req.params.id;
    
    // Verificar si el cliente existe
    const cliente = await Cliente.getById(clienteId);
    if (!cliente) {
      return res.status(404).json({ 
        titulo: "Cliente no encontrado",
        statusCode: 404,
        mensaje: 'Cliente no encontrado' 
      });
    }
    
    const empresas = await Cliente.getEmpresasByClienteId(clienteId);
    
    res.json({
      titulo: "Consulta de empresas por cliente exitosa",
      statusCode: 200,
      data: {
        cliente: {
          id: cliente.id,
          nombre_completo: cliente.nombre_completo
        },
        empresas,
        total: empresas.length
      }
    });
  } catch (error) {
    console.error(`Error al obtener empresas del cliente con id ${req.params.id}:`, error);
    res.status(500).json({ 
      titulo: "Error al obtener empresas",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Obtener certificaciones de un cliente
const getCertificationsByClientId = async (req, res) => {
  try {
    const clienteId = req.params.id;
    
    // Verificar si el cliente existe
    const cliente = await Cliente.getById(clienteId);
    if (!cliente) {
      return res.status(404).json({ 
        titulo: "Cliente no encontrado",
        statusCode: 404,
        mensaje: 'Cliente no encontrado' 
      });
    }
    
    const certificaciones = await Cliente.getCertificacionesByClienteId(clienteId);
    
    res.json({
      titulo: "Consulta de certificaciones por cliente exitosa",
      statusCode: 200,
      data: {
        cliente: {
          id: cliente.id,
          nombre_completo: cliente.nombre_completo
        },
        certificaciones,
        total: certificaciones.length
      }
    });
  } catch (error) {
    console.error(`Error al obtener certificaciones del cliente con id ${req.params.id}:`, error);
    res.status(500).json({ 
      titulo: "Error al obtener certificaciones",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Agregar una empresa a un cliente
const addCompanyToClient = async (req, res) => {
  try {
    const clienteId = req.params.id;
    const { empresa_id } = req.body;
    
    if (!empresa_id) {
      return res.status(400).json({ 
        title: "Incomplete data",
        statusCode: 400,
        message: 'Company ID is required' 
      });
    }
    
    // Verificar si el cliente existe
    const cliente = await Cliente.getById(clienteId);
    if (!cliente) {
      return res.status(404).json({ 
        title: "Client not found",
        statusCode: 404,
        message: 'Client not found' 
      });
    }
    
    const resultado = await Cliente.addEmpresaToCliente(clienteId, empresa_id);
    
    if (resultado) {
      res.status(201).json({
        title: "Company added to client successfully",
        statusCode: 201,
        data: {
          cliente_id: clienteId,
          empresa_id
        }
      });
    } else {
      res.status(400).json({ 
        title: "Failed to add company",
        statusCode: 400,
        message: 'Could not add company to client' 
      });
    }
  } catch (error) {
    console.error(`Error al agregar empresa al cliente con id ${req.params.id}:`, error);
    
    // Verificar si es un error de duplicación (relación ya existe)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        title: "Duplication error",
        statusCode: 400,
        message: 'The company is already associated with this client' 
      });
    }
    
    // Verificar si es un error de clave externa (empresa no existe)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(404).json({ 
        title: "Company not found",
        statusCode: 404,
        message: 'The specified company does not exist' 
      });
    }
    
    res.status(500).json({ 
      title: "Error adding company",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Eliminar una empresa de un cliente
const removeCompanyFromClient = async (req, res) => {
  try {
    const clienteId = req.params.clientId;
    const empresaId = req.params.companyId;
    
    // Verificar si el cliente existe
    const cliente = await Cliente.getById(clienteId);
    if (!cliente) {
      return res.status(404).json({ 
        title: "Client not found",
        statusCode: 404,
        message: 'Client not found' 
      });
    }
    
    const resultado = await Cliente.removeEmpresaFromCliente(clienteId, empresaId);
    
    if (resultado) {
      res.json({
        title: "Company removed from client successfully",
        statusCode: 200,
        data: {
          cliente_id: clienteId,
          empresa_id: empresaId
        }
      });
    } else {
      res.status(400).json({ 
        title: "Failed to remove company",
        statusCode: 400,
        message: 'Could not remove company from client or the relationship did not exist' 
      });
    }
  } catch (error) {
    console.error(`Error al eliminar empresa ${req.params.companyId} del cliente ${req.params.clientId}:`, error);
    res.status(500).json({ 
      title: "Error removing company",
      statusCode: 500,
      error: error.message 
    });
  }
};

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getCompaniesByClientId,
  getCertificationsByClientId,
  addCompanyToClient,
  removeCompanyFromClient
}; 