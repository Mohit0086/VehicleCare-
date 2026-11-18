const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenance.controller');
const authenticateToken = require('../middleware/auth');

const requireRole = require('../middleware/role');

router.use(authenticateToken, requireRole('CUSTOMER', 'ADMIN'));

router.get('/types', maintenanceController.listTypes);
router.get('/vehicle/:vehicleId', maintenanceController.getMaintenanceByVehicle);

module.exports = router;
