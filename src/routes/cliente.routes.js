const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/cliente.controller');
const { verifyToken, isClient } = require('../middleware/auth.middleware');

// Routes for authenticated clients
router.get('/my-companies', verifyToken, isClient, clienteController.getMyCompanies);
router.get('/my-certifications', verifyToken, isClient, clienteController.getMyCertifications);
router.get('/my-certification-history', verifyToken, isClient, clienteController.getAllMyCertifications);
router.get('/my-profile', verifyToken, isClient, clienteController.getMyProfile);
// Obtener videos y documentos de una certificación específica para el cliente autenticado
router.get('/my-certification/:certificationId/videos-documents', verifyToken, isClient, clienteController.getMyVideosAndDocumentsByCertification);

module.exports = router; 