const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresa.controller');
const { verifyToken, isAdmin, isRevisorOrAdmin, isClient } = require('../middleware/auth.middleware');

// Routes that require any type of authentication (client, reviewer or admin)
router.get('/', verifyToken, empresaController.getAllCompanies);
router.get('/:id', verifyToken, empresaController.getCompanyById);

// Protected routes - access for administrators and reviewers
router.get('/:id/clients', verifyToken, isRevisorOrAdmin, empresaController.getClientsByCompanyId);

// Protected routes - administrators only
router.post('/', verifyToken, isAdmin, empresaController.createCompany);
router.put('/:id', verifyToken, isAdmin, empresaController.updateCompany);
router.delete('/:id', verifyToken, isAdmin, empresaController.deleteCompany);
router.patch('/:id/toggle-active', verifyToken, isAdmin, empresaController.toggleCompanyActive);

module.exports = router; 