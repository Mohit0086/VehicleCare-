const express = require('express');
const router = express.Router();
const billController = require('../controllers/bill.controller');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', billController.listBills);
router.get('/:id', billController.getBill);
router.get('/:id/pdf', billController.downloadPdf);

module.exports = router;
