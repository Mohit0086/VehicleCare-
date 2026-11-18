const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authenticateToken = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { ROLES } = require('../utils/constants');

// All admin routes restricted to ADMIN role (FR-4)
router.use(authenticateToken);
router.use(requireRole(ROLES.ADMIN));

router.get('/dashboard', adminController.getDashboardMetrics);
router.get('/users', adminController.listUsers);
router.patch('/users/:id', adminController.updateUser);

router.get('/centers', adminController.listCenters);
router.post('/centers', adminController.createCenter);
router.patch('/centers/:id', adminController.updateCenter);

router.get('/intervals', adminController.listIntervals);
router.patch('/intervals/:id', adminController.updateInterval);

module.exports = router;
