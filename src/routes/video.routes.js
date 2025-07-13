const express = require('express');
const router = express.Router();
const videoController = require('../controllers/video.controller');
const { verifyToken, isAdmin, isRevisorOrAdmin, isClient } = require('../middleware/auth.middleware');
const { videoUpload } = require('../middleware/upload.middleware');

// Routes that require any type of authentication
router.get('/', verifyToken, videoController.getAllVideos);
router.get('/:id', verifyToken, videoController.getVideoById);
router.get('/certification/:certificationId', verifyToken, videoController.getVideosByCertificationId);
router.get('/:id/documents', verifyToken, videoController.getDocumentsByVideoId);

// New route for clients - get videos from active certifications
router.get('/active-certification/:certificationId', verifyToken, isClient, videoController.getVideosByCertificacionActiva);

// Management routes - administrators and reviewers
router.post('/', verifyToken, isRevisorOrAdmin, videoUpload.single('video_file'), videoController.createVideo);
router.put('/:id', verifyToken, isRevisorOrAdmin, videoUpload.single('video_file'), videoController.updateVideo);
router.delete('/:id', verifyToken, isAdmin, videoController.deleteVideo);

// Test FTP Video upload
router.post('/test/upload', verifyToken, isRevisorOrAdmin, videoUpload.single('test_video'), videoController.testVideoUpload);

module.exports = router; 