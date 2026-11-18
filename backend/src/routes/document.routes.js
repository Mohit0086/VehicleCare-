const express = require('express');
const router = express.Router({ mergeParams: true });
const documentController = require('../controllers/document.controller');
const authenticateToken = require('../middleware/auth');
const upload = require('../middleware/upload');

const requireRole = require('../middleware/role');

router.use(authenticateToken, requireRole('CUSTOMER', 'ADMIN'));

// Document collection routes (attached under /api/vehicles/:vehicleId/documents or /api/documents)
router.get('/', documentController.listDocuments);
router.post('/', upload.single('file'), documentController.uploadDocument);

module.exports = router;
