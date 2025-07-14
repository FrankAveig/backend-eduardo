const express = require('express');
const router = express.Router();
const certificationController = require('../controllers/certification.controller');
const { verifyToken, isAdmin, isRevisorOrAdmin } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');

// Ruta para probar la conexión FTP
router.get('/test-ftp', verifyToken, isAdmin, certificationController.testFtpConnection);

// Routes that require any type of authentication
router.get('/',  certificationController.getAllCertifications);
router.get('/:id', verifyToken, certificationController.getCertificationById);
router.get('/company/:companyId', verifyToken, certificationController.getCertificationsByCompanyId);

// Routes for videos and clients - access for administrators and reviewers
router.get('/:id/videos', verifyToken, isRevisorOrAdmin, certificationController.getVideosByCertificationId);
router.get('/:id/clients', verifyToken, isRevisorOrAdmin, certificationController.getClientsByCertificationId);

// Management routes - administrators only
router.post('/', verifyToken, isAdmin, upload.single('certification_photo'), certificationController.createCertification);
router.put('/:id', verifyToken, isAdmin, upload.single('certification_photo'), certificationController.updateCertification);
router.delete('/:id', verifyToken, isAdmin, certificationController.deleteCertification);

// Activar/desactivar certificación (solo admin)
router.patch('/:id/toggle-active', verifyToken, isAdmin, certificationController.toggleCertificationActive);

// Client-certification relationship management - administrators only
router.post('/:id/clients', verifyToken, isAdmin, certificationController.addClientToCertification);
router.delete('/:certificationId/clients/:clientId', verifyToken, isAdmin, certificationController.removeClientFromCertification);

module.exports = router; 