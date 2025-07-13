const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Route for user login (admin/reviewer)
router.post('/login', authController.loginUser);

// Route for client login
router.post('/login/client', authController.loginClient);

module.exports = router; 