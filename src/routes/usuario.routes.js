const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// All routes require authentication and administrator role
router.get('/', verifyToken, isAdmin, usuarioController.getAllUsers);
router.get('/:id', verifyToken, isAdmin, usuarioController.getUserById);
router.post('/', verifyToken, isAdmin, usuarioController.createUser);
router.put('/:id', verifyToken, isAdmin, usuarioController.updateUser);
router.delete('/:id', verifyToken, isAdmin, usuarioController.deleteUser);

module.exports = router; 