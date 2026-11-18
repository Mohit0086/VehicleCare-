/**
 * Prompt Notification & Reminder Service
 * Implements SRS FR-30, FR-31, FR-32, FR-33 and Guide's feedback:
 * "Prompt Notification generation features"
 */

const pool = require('../config/db');
const { calculateComponentStatus } = require('./statusService');
const { MAINTENANCE_STATUS, REMINDER_TYPES } = require('../utils/constants');

/**
 * Creates an immediate, prompt notification for a user.
 * Avoids duplicates within recent window.
 */
async function createPromptNotification({ userId, vehicleId = null, reminderType, message, dueDate = null }) {
  const storedType = ['BOOKING_UPDATE', 'INVOICE_GENERATED'].includes(reminderType) ? REMINDER_TYPES.GENERAL : reminderType;
  try {
    // Avoid duplicate UNREAD notification with same message for user
    const [existing] = await pool.execute(
      `SELECT id FROM reminders 
       WHERE user_id = ? AND reminder_type = ? AND status = 'UNREAD' AND message = ?`,
      [userId, storedType, message]
    );

    if (existing.length === 0) {
      await pool.execute(
        `INSERT INTO reminders (user_id, vehicle_id, reminder_type, message, status, due_date) 
         VALUES (?, ?, ?, ?, 'UNREAD', ?)`,
        [userId, vehicleId, storedType, message, dueDate]
      );
      return true;
    }
    return false;
  } catch (err) {
    console.error(`[Notification Error] Failed to create prompt notification: ${err.message}`);
    return false;
  }
}

/**
 * Sends a prompt notification to all active system administrators.
 */
async function notifyAdmins(message, vehicleId = null, reminderType = 'BOOKING_UPDATE') {
  try {
    const [admins] = await pool.execute(
      "SELECT id FROM users WHERE (role = 'ADMIN' OR role = 'MECHANIC') AND is_active = TRUE"
    );

    for (const admin of admins) {
      await createPromptNotification({
        userId: admin.id,
        vehicleId,
        reminderType,
        message,
      });
    }
  } catch (err) {
    console.error(`[Admin Notification Error] ${err.message}`);
  }
}

/**
 * Prompt Diagnostic Scan: Evaluates a customer's vehicles and immediately
 * generates prompt notifications for any components or documents needing attention.
 */
async function promptScanCustomerVehicles(userId) {
  const [vehicles] = await pool.execute(
    'SELECT id, reg_no, brand, model, current_km, insurance_expiry, puc_expiry FROM vehicles WHERE user_id = ?',
    [userId]
  );

  let newAlerts = 0;
  const today = new Date();

  for (const v of vehicles) {
    // 1. Evaluate maintenance components
    const [components] = await pool.execute(
      `SELECT vm.*, mt.name, mt.default_interval_km, mt.default_interval_months 
       FROM vehicle_maintenance vm 
       JOIN maintenance_types mt ON vm.maintenance_type_id = mt.id 
       WHERE vm.vehicle_id = ?`,
      [v.id]
    );

    for (const comp of components) {
      const evalResult = calculateComponentStatus(comp, v.current_km);

      if (evalResult.status === MAINTENANCE_STATUS.DUE) {
        const msg = `Urgent: ${comp.name} service is OVERDUE for ${v.reg_no} (${evalResult.remaining_km <= 0 ? `${Math.abs(evalResult.remaining_km)} km overdue` : 'Time limit reached'}).`;
        const created = await createPromptNotification({
          userId,
          vehicleId: v.id,
          reminderType: REMINDER_TYPES.MAINTENANCE_DUE,
          message: msg,
          dueDate: evalResult.next_due_date,
        });
        if (created) newAlerts++;
      } else if (evalResult.status === MAINTENANCE_STATUS.DUE_SOON) {
        const msg = `Notice: ${comp.name} service is DUE SOON for ${v.reg_no} (${evalResult.remaining_km} km remaining).`;
        const created = await createPromptNotification({
          userId,
          vehicleId: v.id,
          reminderType: REMINDER_TYPES.MAINTENANCE_DUE_SOON,
          message: msg,
          dueDate: evalResult.next_due_date,
        });
        if (created) newAlerts++;
      }
    }

    // 2. Check document expiries
    const docList = [
      { name: 'PUC Certificate', date: v.puc_expiry, type: REMINDER_TYPES.PUC_EXPIRY },
      { name: 'Insurance Policy', date: v.insurance_expiry, type: REMINDER_TYPES.INSURANCE_EXPIRY },
    ];

    for (const doc of docList) {
      if (!doc.date) continue;
      const expiry = new Date(doc.date);
      const days = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

      if (days <= 0) {
        const msg = `Expired: ${doc.name} for ${v.reg_no} expired on ${expiry.toISOString().split('T')[0]}.`;
        const created = await createPromptNotification({
          userId,
          vehicleId: v.id,
          reminderType: doc.type,
          message: msg,
          dueDate: expiry.toISOString().split('T')[0],
        });
        if (created) newAlerts++;
      } else if (days <= 30) {
        const msg = `Reminder: ${doc.name} for ${v.reg_no} expires in ${days} days (${expiry.toISOString().split('T')[0]}).`;
        const created = await createPromptNotification({
          userId,
          vehicleId: v.id,
          reminderType: doc.type,
          message: msg,
          dueDate: expiry.toISOString().split('T')[0],
        });
        if (created) newAlerts++;
      }
    }
  }

  return { scannedVehicles: vehicles.length, newAlerts };
}

/**
 * Scheduled daily scan across all vehicles.
 */
async function generateDailyReminders() {
  const [users] = await pool.execute("SELECT id FROM users WHERE is_active = TRUE AND role IN ('CUSTOMER', 'OWNER')");
  let totalAlerts = 0;

  for (const user of users) {
    const res = await promptScanCustomerVehicles(user.id);
    totalAlerts += res.newAlerts;
  }

  return { processedUsers: users.length, remindersCreated: totalAlerts };
}

module.exports = {
  createPromptNotification,
  notifyAdmins,
  promptScanCustomerVehicles,
  generateDailyReminders,
};
