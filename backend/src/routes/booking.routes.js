const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const authenticateToken = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { ROLES } = require('../utils/constants');

router.use(authenticateToken);

router.get('/slots', bookingController.getSlots);
router.get('/', bookingController.listBookings);
router.get('/:id', bookingController.getBooking);
router.post('/', requireRole(ROLES.OWNER), bookingController.createBooking);
router.patch('/:id/status', bookingController.updateBookingStatus);

module.exports = router;
