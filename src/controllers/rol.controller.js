const Rol = require('../models/rol.model');

// Obtener todos los roles
const getAllRoles = async (req, res) => {
  try {
    const roles = await Rol.getAll();
    res.json(roles);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ mensaje: 'Error al obtener roles', error: error.message });
  }
};

// Obtener un rol por ID
const getRoleById = async (req, res) => {
  try {
    const id = req.params.id;
    const rol = await Rol.getById(id);
    
    if (!rol) {
      return res.status(404).json({ mensaje: 'Rol no encontrado' });
    }
    
    res.json(rol);
  } catch (error) {
    console.error(`Error al obtener rol con id ${req.params.id}:`, error);
    res.status(500).json({ mensaje: 'Error al obtener rol', error: error.message });
  }
};

// Crear un nuevo rol
const createRole = async (req, res) => {
  try {
    const { nombre_rol } = req.body;
    
    if (!nombre_rol) {
      return res.status(400).json({ mensaje: 'Se requiere el nombre del rol' });
    }
    
    const nuevoRol = await Rol.create(nombre_rol);
    res.status(201).json(nuevoRol);
  } catch (error) {
    console.error('Error al crear rol:', error);
    
    // Verificar si es un error de duplicación (nombre de rol ya existe)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ mensaje: 'El nombre del rol ya existe' });
    }
    
    res.status(500).json({ mensaje: 'Error al crear rol', error: error.message });
  }
};

// Actualizar un rol existente
const updateRole = async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre_rol } = req.body;
    
    if (!nombre_rol) {
      return res.status(400).json({ mensaje: 'Se requiere el nombre del rol' });
    }
    
    // Verificar si el rol existe
    const rolExistente = await Rol.getById(id);
    if (!rolExistente) {
      return res.status(404).json({ mensaje: 'Rol no encontrado' });
    }
    
    const actualizado = await Rol.update(id, nombre_rol);
    
    if (actualizado) {
      res.json({ mensaje: 'Rol actualizado correctamente', id, nombre_rol });
    } else {
      res.status(400).json({ mensaje: 'No se pudo actualizar el rol' });
    }
  } catch (error) {
    console.error(`Error al actualizar rol con id ${req.params.id}:`, error);
    
    // Verificar si es un error de duplicación (nombre de rol ya existe)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ mensaje: 'El nombre del rol ya existe' });
    }
    
    res.status(500).json({ mensaje: 'Error al actualizar rol', error: error.message });
  }
};

// Eliminar un rol
const deleteRole = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Verificar si el rol existe
    const rolExistente = await Rol.getById(id);
    if (!rolExistente) {
      return res.status(404).json({ mensaje: 'Rol no encontrado' });
    }
    
    const eliminado = await Rol.delete(id);
    
    if (eliminado) {
      res.json({ mensaje: 'Rol eliminado correctamente', id });
    } else {
      res.status(400).json({ mensaje: 'No se pudo eliminar el rol' });
    }
  } catch (error) {
    console.error(`Error al eliminar rol con id ${req.params.id}:`, error);
    
    // Verificar si es un error de clave externa (rol en uso)
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        mensaje: 'No se puede eliminar el rol porque está siendo utilizado por usuarios' 
      });
    }
    
    res.status(500).json({ mensaje: 'Error al eliminar rol', error: error.message });
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
}; 