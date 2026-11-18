const express = require('express');
const router = express.Router({ mergeParams: true });
const predictionController = require('../controllers/prediction.controller');
const authenticateToken = require('../middleware/auth');

const requireRole = require('../middleware/role');

router.use(authenticateToken, requireRole('CUSTOMER', 'ADMIN'));

router.get('/:id/prediction', predictionController.getVehiclePrediction);

module.exports = router;
