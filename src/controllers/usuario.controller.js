const Usuario = require('../models/usuario.model');

// Obtener todos los usuarios con paginación y filtros
const getAllUsers = async (req, res) => {
  try {
    // Parámetros de paginación y filtrado
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const nombre = req.query.nombre;
    const correo = req.query.correo;
    const rol_id = req.query.rol_id;
    
    // Obtener el total de registros para calcular total de páginas
    const filtros = {};
    if (nombre) filtros.nombre_completo = nombre;
    if (correo) filtros.correo = correo;
    if (rol_id) filtros.rol_id = rol_id;
    
    const total = await Usuario.count(filtros);
    const totalPages = Math.ceil(total / limit);
    
    // Obtener los datos paginados y filtrados
    const usuarios = await Usuario.getAll(limit, offset, filtros);
    
    // Ocultar contraseñas en la respuesta
    const usuariosSinPassword = usuarios.map(u => {
      const { contrasenia, ...usuarioSinPassword } = u;
      return usuarioSinPassword;
    });
    
    // Respuesta estructurada
    res.json({
      title: "Users retrieved successfully",
      statusCode: 200,
      data: {
        users: usuariosSinPassword,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ 
      title: "Error retrieving users",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Obtener un usuario por ID
const getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    const usuario = await Usuario.getById(id);
    
    if (!usuario) {
      return res.status(404).json({ 
        title: "User not found",
        statusCode: 404,
        message: 'The requested user was not found' 
      });
    }
    
    // Ocultar contraseña en la respuesta
    const { contrasenia, ...usuarioSinPassword } = usuario;
    
    res.json({
      title: "User retrieved successfully",
      statusCode: 200,
      data: usuarioSinPassword
    });
  } catch (error) {
    console.error(`Error al obtener usuario con id ${req.params.id}:`, error);
    res.status(500).json({ 
      title: "Error retrieving user",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Crear un nuevo usuario
const createUser = async (req, res) => {
  try {
    const { nombre_completo, correo, contrasenia, rol_id } = req.body;
    
    // Validar campos requeridos
    if (!nombre_completo || !correo || !contrasenia || !rol_id) {
      return res.status(400).json({ 
        title: "Incomplete data",
        statusCode: 400,
        message: 'All fields are required: nombre_completo, correo, contrasenia, rol_id' 
      });
    }
    
    // Verificar si el correo ya existe
    const usuarioExistente = await Usuario.getByEmail(correo);
    if (usuarioExistente) {
      return res.status(400).json({ 
        title: "Duplication error",
        statusCode: 400,
        message: 'The email is already registered' 
      });
    }
    
    const nuevoUsuario = await Usuario.create({ nombre_completo, correo, contrasenia, rol_id });
    
    res.status(201).json({
      title: "User created successfully",
      statusCode: 201,
      data: nuevoUsuario
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ 
      title: "Error creating user",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Actualizar un usuario existente
const updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre_completo, correo, contrasenia, rol_id } = req.body;
    
    // Validar campos requeridos
    if (!nombre_completo || !correo || !rol_id) {
      return res.status(400).json({ 
        title: "Incomplete data",
        statusCode: 400,
        message: 'Required fields: nombre_completo, correo, rol_id' 
      });
    }
    
    // Verificar si el usuario existe
    const usuarioExistente = await Usuario.getById(id);
    if (!usuarioExistente) {
      return res.status(404).json({ 
        title: "User not found",
        statusCode: 404,
        message: 'The user to update was not found' 
      });
    }
    
    // Verificar si el correo ya está en uso por otro usuario
    if (correo !== usuarioExistente.correo) {
      const correoExistente = await Usuario.getByEmail(correo);
      if (correoExistente) {
        return res.status(400).json({ 
          title: "Duplication error",
          statusCode: 400,
          message: 'The email is already registered by another user' 
        });
      }
    }
    
    const actualizado = await Usuario.update(id, { nombre_completo, correo, contrasenia, rol_id });
    
    if (actualizado) {
      res.json({ 
        title: "User updated successfully",
        statusCode: 200,
        data: { id, nombre_completo, correo, rol_id }
      });
    } else {
      res.status(400).json({ 
        title: "Update failed",
        statusCode: 400,
        message: 'Could not update the user' 
      });
    }
  } catch (error) {
    console.error(`Error al actualizar usuario con id ${req.params.id}:`, error);
    res.status(500).json({ 
      title: "Error updating user",
      statusCode: 500,
      error: error.message 
    });
  }
};

// Eliminar un usuario
const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Verificar si el usuario existe
    const usuarioExistente = await Usuario.getById(id);
    if (!usuarioExistente) {
      return res.status(404).json({ 
        title: "User not found",
        statusCode: 404,
        message: 'The user to delete was not found' 
      });
    }
    
    const eliminado = await Usuario.delete(id);
    
    if (eliminado) {
      res.json({ 
        title: "User deleted successfully",
        statusCode: 200,
        message: 'User has been successfully deleted',
        id 
      });
    } else {
      res.status(400).json({ 
        title: "Delete failed",
        statusCode: 400,
        message: 'Could not delete the user' 
      });
    }
  } catch (error) {
    console.error(`Error al eliminar usuario con id ${req.params.id}:`, error);
    res.status(500).json({ 
      title: "Error deleting user",
      statusCode: 500,
      error: error.message 
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
}; 