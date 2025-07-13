const express = require('express');
const router = express.Router();
const clienteAdminController = require('../controllers/clienteAdmin.controller');
const { verifyToken, isAdmin, isRevisorOrAdmin } = require('../middleware/auth.middleware');

// Routes that require reviewer or admin role
router.get('/', verifyToken, isRevisorOrAdmin, clienteAdminController.getAllClients);
router.get('/:id', verifyToken, isRevisorOrAdmin, clienteAdminController.getClientById);
router.get('/:id/companies', verifyToken, isRevisorOrAdmin, clienteAdminController.getCompaniesByClientId);
router.get('/:id/certifications', verifyToken, isRevisorOrAdmin, clienteAdminController.getCertificationsByClientId);

// Routes that require admin role
router.post('/', verifyToken, isAdmin, clienteAdminController.createClient);
router.put('/:id', verifyToken, isAdmin, clienteAdminController.updateClient);
router.delete('/:id', verifyToken, isAdmin, clienteAdminController.deleteClient);
router.post('/:id/companies', verifyToken, isAdmin, clienteAdminController.addCompanyToClient);
router.delete('/:clientId/companies/:companyId', verifyToken, isAdmin, clienteAdminController.removeCompanyFromClient);

module.exports = router; 