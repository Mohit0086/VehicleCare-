const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminder.controller');
const authenticateToken = require('../middleware/auth');

const requireRole = require('../middleware/role');

router.use(authenticateToken);

router.get('/', reminderController.listReminders);
router.patch('/mark-all-read', reminderController.markAllAsRead);
router.patch('/:id/read', reminderController.markAsRead);
router.post('/prompt-scan', requireRole('CUSTOMER', 'ADMIN'), reminderController.promptDiagnosticScan);
router.post('/scan', requireRole('ADMIN'), reminderController.triggerScan);

module.exports = router;
