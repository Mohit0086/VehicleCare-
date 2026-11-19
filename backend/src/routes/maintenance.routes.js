const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenance.controller');
const authenticateToken = require('../middleware/auth');
const requireVehicleAccess = require('../middleware/vehicleAccess');

const requireRole = require('../middleware/role');

router.use(authenticateToken, requireRole('CUSTOMER', 'ADMIN'));

router.get('/types', maintenanceController.listTypes);
router.get('/vehicle/:vehicleId', requireVehicleAccess, maintenanceController.getMaintenanceByVehicle);

module.exports = router;
