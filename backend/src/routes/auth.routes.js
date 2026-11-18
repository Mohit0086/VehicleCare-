const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticateToken = require('../middleware/auth');

const requireRole = require('../middleware/role');

// Public routes
router.post('/register', authController.register);
router.post('/register-garage', authController.registerGarage);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.get('/garage', authenticateToken, requireRole('GARAGE'), authController.getGarage);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
