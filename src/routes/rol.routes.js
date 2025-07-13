const express = require('express');
const router = express.Router();
const rolController = require('../controllers/rol.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Public routes
router.get('/', rolController.getAllRoles);
router.get('/:id', rolController.getRoleById);

// Protected routes (administrators only)
router.post('/', verifyToken, isAdmin, rolController.createRole);
router.put('/:id', verifyToken, isAdmin, rolController.updateRole);
router.delete('/:id', verifyToken, isAdmin, rolController.deleteRole);

module.exports = router; 