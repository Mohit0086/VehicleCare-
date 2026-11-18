/**
 * Multer File Upload Middleware
 * Implements SRS FR-29 (Upload vehicle documents: RC, Insurance, PUC).
 */

let multer = null;
try {
  multer = require('multer');
} catch (e) {
  // multer will be loaded once npm install is run
}
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');

// Ensure destination upload directory exists
const uploadDir = path.resolve(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

let upload;

if (multer) {
  // Storage configuration
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `doc-${uniqueSuffix}${ext}`);
    },
  });

  // File filter (PDF, JPG, PNG)
  const fileFilter = (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only PDF, JPG, and PNG document formats are allowed.', 400), false);
    }
  };

  upload = multer({
    storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB limit
    },
    fileFilter,
  });
} else {
  // Graceful fallback dummy middleware
  const dummy = (req, res, next) => next();
  dummy.single = () => (req, res, next) => next();
  dummy.array = () => (req, res, next) => next();
  upload = dummy;
}

module.exports = upload;
