const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const authenticateToken = require('../middleware/auth');
const requireVehicleAccess = require('../middleware/vehicleAccess');
const requireRole = require('../middleware/role');
const { ROLES } = require('../utils/constants');

// All vehicle routes require authentication
router.use(authenticateToken, requireRole(ROLES.CUSTOMER, ROLES.ADMIN));

router.get('/', vehicleController.listVehicles);
router.post('/', requireRole(ROLES.OWNER), vehicleController.createVehicle);
router.get('/:id', vehicleController.getVehicle);
router.put('/:id', requireRole(ROLES.OWNER, ROLES.ADMIN), vehicleController.updateVehicle);
router.delete('/:id', requireRole(ROLES.OWNER, ROLES.ADMIN), vehicleController.deleteVehicle);

router.patch('/:id/odometer', requireRole(ROLES.OWNER, ROLES.ADMIN), vehicleController.updateOdometer);
router.get('/:id/maintenance', requireVehicleAccess, vehicleController.getVehicleMaintenance);
router.get('/:id/odometer-logs', requireVehicleAccess, vehicleController.getOdometerLogs);
router.get('/:id/service-history', requireVehicleAccess, vehicleController.getServiceHistory);

module.exports = router;
