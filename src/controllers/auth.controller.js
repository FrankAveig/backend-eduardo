const Usuario = require('../models/usuario.model');
const Cliente = require('../models/cliente.model');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Login para usuarios (admin/revisor)
const loginUser = async (req, res) => {
  try {
    const { correo, contrasenia } = req.body;

    // Verificar si el usuario existe
    const usuario = await Usuario.getByEmail(correo);
    if (!usuario) {
      return res.status(401).json({
        title: "Authentication failed",
        statusCode: 401,
        message: 'Invalid username or password'
      });
    }

    // Verificar la contraseña
    const passwordValid = await Usuario.verifyPassword(contrasenia, usuario.contrasenia);
    if (!passwordValid) {
      return res.status(401).json({
        title: "Authentication failed",
        statusCode: 401,
        message: 'Invalid username or password'
      });
    }

    // Obtener el rol
    const role = usuario.nombre_rol || (usuario.rol_id === 1 ? 'administrator' : 'reviewer');
    // Generar el token
    const token = jwt.sign(
      { 
        id: usuario.id, 
        correo: usuario.correo, 
        role, 
        tipo: 'usuario'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      title: "Login successful",
      statusCode: 200,
      data: {
        id: usuario.id,
        nombre_completo: usuario.nombre_completo,
        correo: usuario.correo,
        role,
        token
      }
    });
  } catch (error) {
    console.error('Error al hacer login:', error);
    res.status(500).json({
      title: "Server error",
      statusCode: 500,
      error: error.message
    });
  }
};

// Login para clientes
const loginClient = async (req, res) => {
  try {
    const { correo, contrasenia } = req.body;

    // Verificar si el cliente existe
    const cliente = await Cliente.getByEmail(correo);
    if (!cliente) {
      return res.status(401).json({
        title: "Authentication failed",
        statusCode: 401,
        message: 'Invalid username or password'
      });
    }

    // Verificar si el cliente está activo
    if (cliente.estatus !== 'activo') {
      return res.status(401).json({
        title: "Account inactive",
        statusCode: 401,
        message: 'Your account is not active. Please contact the administrator.'
      });
    }

    // Verificar la contraseña
    const passwordValid = await Cliente.verifyPassword(contrasenia, cliente.contrasenia);
    if (!passwordValid) {
      return res.status(401).json({
        title: "Authentication failed",
        statusCode: 401,
        message: 'Invalid username or password'
      });
    }

    // Generar el token
    const token = jwt.sign(
      { 
        id: cliente.id, 
        correo: cliente.correo, 
        tipo: 'cliente'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      title: "Login successful",
      statusCode: 200,
      data: {
        id: cliente.id,
        nombre_completo: cliente.nombre_completo,
        correo: cliente.correo,
        tipo: 'cliente',
        token
      }
    });
  } catch (error) {
    console.error('Error al hacer login:', error);
    res.status(500).json({
      title: "Server error",
      statusCode: 500,
      error: error.message
    });
  }
};

module.exports = {
  loginUser,
  loginClient
}; 