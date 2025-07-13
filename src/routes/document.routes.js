const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const { verifyToken, isAdmin, isRevisorOrAdmin } = require('../middleware/auth.middleware');
const { documentUpload } = require('../middleware/upload.middleware');

// Routes that require any type of authentication
router.get('/', verifyToken, documentController.getAllDocuments);
router.get('/:id', verifyToken, documentController.getDocumentById);
router.get('/video/:videoId', verifyToken, documentController.getDocumentsByVideoId);

// Management routes - administrators and reviewers
router.post('/', verifyToken, isRevisorOrAdmin, documentUpload.single('document'), documentController.createDocument);
router.put('/:id', verifyToken, isRevisorOrAdmin, documentUpload.single('document'), documentController.updateDocument);
router.delete('/:id', verifyToken, isAdmin, documentController.deleteDocument);

// Test route for document uploads (development purposes)
router.post('/test-upload', documentUpload.single('document'), documentController.testUploadDocument);

module.exports = router; 