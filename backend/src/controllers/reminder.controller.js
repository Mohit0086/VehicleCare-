/**
 * Reminder & Prompt Notification Controller
 * Implements SRS FR-30 to FR-33 and Guide's requirement:
 * "Prompt Notification generation features"
 */

const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { generateDailyReminders, promptScanCustomerVehicles } = require('../services/reminderService');

// List reminders for the current user
const listReminders = async (req, res, next) => {
  try {
    const [reminders] = await pool.execute(
      `SELECT r.*, v.reg_no, v.brand, v.model 
       FROM reminders r 
       LEFT JOIN vehicles v ON r.vehicle_id = v.id 
       WHERE r.user_id = ? 
       ORDER BY (r.status = 'UNREAD') DESC, r.created_at DESC`,
      [req.user.id]
    );

    const unreadCount = reminders.filter((r) => r.status === 'UNREAD').length;

    res.status(200).json({ reminders, unread_count: unreadCount });
  } catch (err) {
    next(err);
  }
};

// Mark single reminder as READ (FR-33)
const markAsRead = async (req, res, next) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute('SELECT user_id FROM reminders WHERE id = ?', [id]);
    if (rows.length === 0) return next(new AppError('Reminder not found.', 404));

    if (rows[0].user_id !== req.user.id) {
      return next(new AppError('Unauthorized.', 403));
    }

    await pool.execute("UPDATE reminders SET status = 'READ' WHERE id = ?", [id]);
    res.status(200).json({ message: 'Reminder marked as read.' });
  } catch (err) {
    next(err);
  }
};

// Mark all reminders as READ for current user
const markAllAsRead = async (req, res, next) => {
  try {
    await pool.execute("UPDATE reminders SET status = 'READ' WHERE user_id = ? AND status = 'UNREAD'", [req.user.id]);
    res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
};

// Prompt Diagnostic Scan: Manually triggers instant evaluation and generates prompt notifications
const promptDiagnosticScan = async (req, res, next) => {
  try {
    const result = await promptScanCustomerVehicles(req.user.id);
    res.status(200).json({
      message: `Checked ${result.scannedVehicles} ${result.scannedVehicles === 1 ? 'vehicle' : 'vehicles'}. ${result.newAlerts} new ${result.newAlerts === 1 ? 'reminder' : 'reminders'}.`,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

// Trigger system-wide scan (Admin or cron)
const triggerScan = async (req, res, next) => {
  try {
    const result = await generateDailyReminders();
    res.status(200).json({ message: 'Reminders scan executed successfully.', ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listReminders,
  markAsRead,
  markAllAsRead,
  promptDiagnosticScan,
  triggerScan,
};
