/**
 * Document Controller
 * Implements SRS FR-29, FR-31 (RC, Insurance, PUC document management).
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { ROLES } = require('../utils/constants');

// List documents for a vehicle
const listDocuments = async (req, res, next) => {
  const { vehicleId } = req.params;

  try {
    const [vehicles] = await pool.execute('SELECT user_id FROM vehicles WHERE id = ?', [vehicleId]);
    if (vehicles.length === 0) return next(new AppError('Vehicle not found.', 404));

    if (req.user.role === ROLES.OWNER && vehicles[0].user_id !== req.user.id) {
      return next(new AppError('Unauthorized.', 403));
    }

    const [documents] = await pool.execute(
      `SELECT id, vehicle_id, doc_type, original_filename, file_size, mime_type, expiry_date, uploaded_at 
       FROM documents 
       WHERE vehicle_id = ? 
       ORDER BY uploaded_at DESC`,
      [vehicleId]
    );

    const formatted = documents.map((d) => ({
      ...d,
      download_url: `/api/documents/${d.id}/download`,
    }));

    res.status(200).json({ documents: formatted });
  } catch (err) {
    next(err);
  }
};

// Upload document (FR-29)
const uploadDocument = async (req, res, next) => {
  const { vehicleId } = req.params;
  const { doc_type, expiry_date } = req.body;

  if (!req.file) {
    return next(new AppError('No file uploaded. Please attach a PDF, JPG, or PNG document.', 400));
  }

  const validTypes = ['RC', 'INSURANCE', 'PUC', 'OTHER'];
  const normalizedType = (doc_type || 'OTHER').toUpperCase();

  if (!validTypes.includes(normalizedType)) {
    return next(new AppError('Invalid document type. Must be RC, INSURANCE, PUC, or OTHER.', 400));
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [vehicles] = await connection.execute('SELECT user_id FROM vehicles WHERE id = ?', [vehicleId]);
    if (vehicles.length === 0) {
      await connection.rollback();
      return next(new AppError('Vehicle not found.', 404));
    }

    if (req.user.role === ROLES.OWNER && vehicles[0].user_id !== req.user.id) {
      await connection.rollback();
      return next(new AppError('Unauthorized.', 403));
    }

    // Insert document record
    const [result] = await connection.execute(
      `INSERT INTO documents (vehicle_id, doc_type, file_path, original_filename, file_size, mime_type, expiry_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        vehicleId,
        normalizedType,
        req.file.path,
        req.file.originalname,
        req.file.size,
        req.file.mimetype,
        expiry_date || null,
      ]
    );

    // If document is Insurance or PUC and expiry is provided, update vehicle table directly (FR-29)
    if (expiry_date) {
      if (normalizedType === 'INSURANCE') {
        await connection.execute('UPDATE vehicles SET insurance_expiry = ? WHERE id = ?', [expiry_date, vehicleId]);
      } else if (normalizedType === 'PUC') {
        await connection.execute('UPDATE vehicles SET puc_expiry = ? WHERE id = ?', [expiry_date, vehicleId]);
      }
    }

    await connection.commit();

    res.status(201).json({
      message: 'Document uploaded successfully.',
      document: {
        id: result.insertId,
        vehicle_id: vehicleId,
        doc_type: normalizedType,
        original_filename: req.file.originalname,
        file_size: req.file.size,
        expiry_date: expiry_date || null,
      },
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

// Download document file
const downloadDocument = async (req, res, next) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT d.*, v.user_id 
       FROM documents d 
       JOIN vehicles v ON d.vehicle_id = v.id 
       WHERE d.id = ?`,
      [id]
    );

    if (rows.length === 0) return next(new AppError('Document not found.', 404));
    const doc = rows[0];

    if (req.user.role === ROLES.OWNER && doc.user_id !== req.user.id) {
      return next(new AppError('Unauthorized.', 403));
    }

    if (!fs.existsSync(doc.file_path)) {
      return next(new AppError('The requested file is no longer available on disk.', 404));
    }

    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.original_filename}"`);
    fs.createReadStream(doc.file_path).pipe(res);
  } catch (err) {
    next(err);
  }
};

// Delete document
const deleteDocument = async (req, res, next) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT d.*, v.user_id 
       FROM documents d 
       JOIN vehicles v ON d.vehicle_id = v.id 
       WHERE d.id = ?`,
      [id]
    );

    if (rows.length === 0) return next(new AppError('Document not found.', 404));
    const doc = rows[0];

    if (req.user.role === ROLES.OWNER && doc.user_id !== req.user.id) {
      return next(new AppError('Unauthorized.', 403));
    }

    // Delete file from disk if present
    if (fs.existsSync(doc.file_path)) {
      try {
        fs.unlinkSync(doc.file_path);
      } catch (e) {
        console.warn(`[Document Delete] Could not unlink ${doc.file_path}: ${e.message}`);
      }
    }

    await pool.execute('DELETE FROM documents WHERE id = ?', [id]);
    res.status(200).json({ message: 'Document deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
};
