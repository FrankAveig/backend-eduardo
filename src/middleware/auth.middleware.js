const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['x-access-token'] || req.headers['authorization'];
  
  if (!token) {
    return res.status(403).json({ message: 'A token is required for authentication' });
  }
  
  try {
    // Remove 'Bearer ' prefix if exists
    const tokenString = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
    
    const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to verify if the user is an administrator
const isAdmin = (req, res, next) => {
  console.log(req.usuario.role, 'administrator');
  if (req.usuario && req.usuario.role === 'administrator') {
    next();
  } else {
    return res.status(403).json({ message: 'Administrator role required' });
  }
};

// Middleware to verify if the user is a reviewer or administrator
const isRevisorOrAdmin = (req, res, next) => {
  if (req.usuario && (req.usuario.role === 'reviewer' || req.usuario.role === 'administrator')) {
    next();
  } else {
    return res.status(403).json({ message: 'Reviewer or administrator role required' });
  }
};

// Middleware to verify if it's a client
const isClient = (req, res, next) => {
  if (req.usuario && req.usuario.tipo === 'cliente') {
    next();
  } else {
    return res.status(403).json({ message: 'Access only for clients' });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  isRevisorOrAdmin,
  isClient
}; 