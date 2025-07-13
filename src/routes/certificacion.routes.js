const express = require('express');
const router = express.Router();
const certificacionController = require('../controllers/certificacion.controller');
const { verifyToken, isAdmin, isRevisorOrAdmin } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');

// Get all certifications
router.get('/', certificacionController.getAllCertificaciones);

// Get certification by ID
router.get('/:id', verifyToken, certificacionController.getCertificacionById);

// Get certifications by company
router.get('/company/:companyId', verifyToken, certificacionController.getCertificacionesByEmpresaId);

// Get videos of a certification
router.get('/:id/videos', verifyToken, isRevisorOrAdmin, certificacionController.getVideosByCertificacionId);

// Get clients of a certification
router.get('/:id/clients', verifyToken, isRevisorOrAdmin, certificacionController.getClientesByCertificacionId);

// Create a new certification
router.post('/', verifyToken, isAdmin, upload.single('certification_photo'), certificacionController.createCertificacion);

// Update a certification
router.put('/:id', verifyToken, isAdmin, upload.single('certification_photo'), certificacionController.updateCertificacion);

// Delete a certification
router.delete('/:id', verifyToken, isAdmin, certificacionController.deleteCertificacion);

// Toggle certification active status
router.patch('/:id/toggle-active', verifyToken, isAdmin, certificacionController.toggleCertificacionActive);

// Add client to certification
router.post('/:id/clients', verifyToken, isAdmin, certificacionController.addClienteToCertificacion);

// Remove client from certification
router.delete('/:id/clients/:clientId', verifyToken, isAdmin, certificacionController.removeClienteFromCertificacion);

// Toggle client-certification relationship active status
router.patch('/:id/clients/:clientId/toggle-active', verifyToken, isAdmin, certificacionController.toggleClienteCertificacion);

module.exports = router; 