/**
 * Vehicle Controller
 * Implements SRS FR-6 to FR-10, FR-15, FR-26, FR-48.
 */

const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { calculateVehicleStatus, calculateComponentStatus } = require('../services/statusService');
const { createPromptNotification } = require('../services/reminderService');
const { ROLES, MAINTENANCE_STATUS, REMINDER_TYPES } = require('../utils/constants');

// List vehicles for current owner (or all if admin)
const listVehicles = async (req, res, next) => {
  try {
    let query = `
      SELECT v.*, u.name as owner_name 
      FROM vehicles v 
      JOIN users u ON v.user_id = u.id
    `;
    const params = [];

    if (req.user.role === ROLES.OWNER) {
      query += ' WHERE v.user_id = ? ORDER BY v.created_at DESC';
      params.push(req.user.id);
    } else {
      query += ' ORDER BY v.created_at DESC';
    }

    const [vehicles] = await pool.execute(query, params);

    // Compute overall maintenance status for each vehicle
    const vehiclesWithStatus = await Promise.all(
      vehicles.map(async (v) => {
        const [components] = await pool.execute(
          `SELECT vm.*, mt.name, mt.default_interval_km, mt.default_interval_months 
           FROM vehicle_maintenance vm 
           JOIN maintenance_types mt ON vm.maintenance_type_id = mt.id 
           WHERE vm.vehicle_id = ?`,
          [v.id]
        );
        const { overallStatus } = calculateVehicleStatus(components, v.current_km);
        return {
          ...v,
          overall_status: overallStatus,
          status: overallStatus,
        };
      })
    );

    res.status(200).json({ vehicles: vehiclesWithStatus });
  } catch (err) {
    next(err);
  }
};

// Get single vehicle details
const getVehicle = async (req, res, next) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT v.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone 
       FROM vehicles v 
       JOIN users u ON v.user_id = u.id 
       WHERE v.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return next(new AppError('Vehicle not found.', 404));
    }

    const vehicle = rows[0];

    // Authorization check
    if (req.user.role === ROLES.OWNER && vehicle.user_id !== req.user.id) {
      return next(new AppError('Access denied: You do not own this vehicle.', 403));
    }

    // Get component status
    const [components] = await pool.execute(
      `SELECT vm.*, mt.name, mt.description, mt.default_interval_km, mt.default_interval_months 
       FROM vehicle_maintenance vm 
       JOIN maintenance_types mt ON vm.maintenance_type_id = mt.id 
       WHERE vm.vehicle_id = ?`,
      [vehicle.id]
    );

    const { overallStatus, components: evaluatedComponents } = calculateVehicleStatus(components, vehicle.current_km);

    res.status(200).json({
      vehicle: {
        ...vehicle,
        overall_status: overallStatus,
        components: evaluatedComponents,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Create a new vehicle (FR-6, FR-8, FR-48)
const createVehicle = async (req, res, next) => {
  const { reg_no, brand, model, year, fuel_type, current_km = 0, insurance_expiry, puc_expiry } = req.body;

  if (!reg_no || !brand || !model || !year || !fuel_type) {
    return next(new AppError('Registration number, brand, model, year, and fuel type are required.', 400));
  }

  const cleanReg = reg_no.toUpperCase().replace(/\s+/g, '-').trim();
  const odo = parseInt(current_km, 10) || 0;

  if (odo < 0) {
    return next(new AppError('Odometer cannot be negative.', 400));
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Check duplicate registration (FR-8)
    const [existing] = await connection.execute('SELECT id FROM vehicles WHERE reg_no = ?', [cleanReg]);
    if (existing.length > 0) {
      await connection.rollback();
      return next(new AppError(`A vehicle with registration number ${cleanReg} is already registered.`, 409));
    }

    // Insert vehicle
    const [result] = await connection.execute(
      `INSERT INTO vehicles (user_id, reg_no, brand, model, year, fuel_type, current_km, insurance_expiry, puc_expiry) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        cleanReg,
        brand.trim(),
        model.trim(),
        parseInt(year, 10),
        fuel_type.toUpperCase(),
        odo,
        insurance_expiry || null,
        puc_expiry || null,
      ]
    );

    const vehicleId = result.insertId;

    // Log baseline odometer reading (FR-10)
    await connection.execute(
      `INSERT INTO odometer_logs (vehicle_id, reading_km, recorded_by_user_id, source, notes) 
       VALUES (?, ?, ?, 'OWNER_UPDATE', 'Baseline vehicle registration odometer')`,
      [vehicleId, odo, req.user.id]
    );

    // Baseline rule (FR-48): Initialize component maintenance rows for all active maintenance types
    const [types] = await connection.execute('SELECT id, default_interval_km, default_interval_months FROM maintenance_types WHERE is_active = TRUE');
    for (const t of types) {
      await connection.execute(
        `INSERT INTO vehicle_maintenance (vehicle_id, maintenance_type_id, last_done_km, last_done_date, interval_km, interval_months) 
         VALUES (?, ?, ?, CURDATE(), ?, ?)`,
        [vehicleId, t.id, odo, t.default_interval_km, t.default_interval_months]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Vehicle added successfully.',
      vehicle: {
        id: vehicleId,
        reg_no: cleanReg,
        brand,
        model,
        year,
        fuel_type,
        current_km: odo,
        insurance_expiry,
        puc_expiry,
      },
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

// Update vehicle (FR-7)
const updateVehicle = async (req, res, next) => {
  const { id } = req.params;
  const { brand, model, year, fuel_type, insurance_expiry, puc_expiry } = req.body;

  try {
    const [vehicles] = await pool.execute('SELECT user_id FROM vehicles WHERE id = ?', [id]);
    if (vehicles.length === 0) return next(new AppError('Vehicle not found.', 404));

    if (req.user.role === ROLES.OWNER && vehicles[0].user_id !== req.user.id) {
      return next(new AppError('Unauthorized to update this vehicle.', 403));
    }

    await pool.execute(
      `UPDATE vehicles 
       SET brand = COALESCE(?, brand),
           model = COALESCE(?, model),
           year = COALESCE(?, year),
           fuel_type = COALESCE(?, fuel_type),
           insurance_expiry = ?,
           puc_expiry = ? 
       WHERE id = ?`,
      [brand, model, year ? parseInt(year, 10) : null, fuel_type, insurance_expiry || null, puc_expiry || null, id]
    );

    res.status(200).json({ message: 'Vehicle updated successfully.' });
  } catch (err) {
    next(err);
  }
};

// Delete vehicle (FR-7)
const deleteVehicle = async (req, res, next) => {
  const { id } = req.params;

  try {
    const [vehicles] = await pool.execute('SELECT user_id FROM vehicles WHERE id = ?', [id]);
    if (vehicles.length === 0) return next(new AppError('Vehicle not found.', 404));

    if (req.user.role === ROLES.OWNER && vehicles[0].user_id !== req.user.id) {
      return next(new AppError('Unauthorized to delete this vehicle.', 403));
    }

    await pool.execute('DELETE FROM vehicles WHERE id = ?', [id]);
    res.status(200).json({ message: 'Vehicle deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// Update odometer with monotonic check (FR-9, FR-10, FR-15)
const updateOdometer = async (req, res, next) => {
  const { id } = req.params;
  const { current_km } = req.body;

  const newKm = parseInt(current_km, 10);
  if (isNaN(newKm) || newKm < 0) {
    return next(new AppError('Valid odometer reading in kilometres is required.', 400));
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute('SELECT id, user_id, current_km FROM vehicles WHERE id = ? FOR UPDATE', [id]);
    if (rows.length === 0) {
      await connection.rollback();
      return next(new AppError('Vehicle not found.', 404));
    }

    const vehicle = rows[0];

    if (req.user.role === ROLES.OWNER && vehicle.user_id !== req.user.id) {
      await connection.rollback();
      return next(new AppError('Unauthorized to update this vehicle.', 403));
    }

    // Monotonic constraint check (FR-9): new value shall not be lower than previous value
    if (newKm < vehicle.current_km) {
      await connection.rollback();
      return next(
        new AppError(
          `New odometer value (${newKm.toLocaleString('en-IN')} km) cannot be lower than the current reading (${vehicle.current_km.toLocaleString('en-IN')} km).`,
          400
        )
      );
    }

    // Update vehicle current_km
    await connection.execute('UPDATE vehicles SET current_km = ? WHERE id = ?', [newKm, id]);

    // Insert audit log (FR-10)
    await connection.execute(
      `INSERT INTO odometer_logs (vehicle_id, reading_km, recorded_by_user_id, source, notes) 
       VALUES (?, ?, ?, 'OWNER_UPDATE', 'Routine odometer update by owner')`,
      [id, newKm, req.user.id]
    );

    // Prompt Notification Feature: evaluate components and alert if DUE or DUE_SOON
    const [components] = await connection.execute(
      `SELECT vm.*, mt.name 
       FROM vehicle_maintenance vm 
       JOIN maintenance_types mt ON vm.maintenance_type_id = mt.id 
       WHERE vm.vehicle_id = ?`,
      [id]
    );

    for (const comp of components) {
      const evalRes = calculateComponentStatus(comp, newKm);
      if (evalRes.status === MAINTENANCE_STATUS.DUE) {
        await createPromptNotification({
          userId: vehicle.user_id,
          vehicleId: vehicle.id,
          reminderType: REMINDER_TYPES.MAINTENANCE_DUE,
          message: `Alert: ${comp.name} service has reached DUE status on your vehicle (${evalRes.remaining_km <= 0 ? `${Math.abs(evalRes.remaining_km)} km overdue` : 'Time elapsed'}).`,
        });
      } else if (evalRes.status === MAINTENANCE_STATUS.DUE_SOON) {
        await createPromptNotification({
          userId: vehicle.user_id,
          vehicleId: vehicle.id,
          reminderType: REMINDER_TYPES.MAINTENANCE_DUE_SOON,
          message: `Notice: ${comp.name} service is DUE SOON on your vehicle (${evalRes.remaining_km} km remaining).`,
        });
      }
    }

    await connection.commit();

    res.status(200).json({
      message: 'Odometer updated successfully.',
      current_km: newKm,
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

// Get maintenance status per component (FR-11 to FR-15)
const getVehicleMaintenance = async (req, res, next) => {
  const { id } = req.params;

  try {
    const [vehicles] = await pool.execute('SELECT id, user_id, current_km FROM vehicles WHERE id = ?', [id]);
    if (vehicles.length === 0) return next(new AppError('Vehicle not found.', 404));

    const vehicle = vehicles[0];

    const [components] = await pool.execute(
      `SELECT vm.*, mt.name, mt.description, mt.default_interval_km, mt.default_interval_months 
       FROM vehicle_maintenance vm 
       JOIN maintenance_types mt ON vm.maintenance_type_id = mt.id 
       WHERE vm.vehicle_id = ? 
       ORDER BY mt.id ASC`,
      [id]
    );

    const { overallStatus, components: evaluated } = calculateVehicleStatus(components, vehicle.current_km);

    res.status(200).json({
      overall_status: overallStatus,
      maintenance: evaluated,
      components: evaluated,
    });
  } catch (err) {
    next(err);
  }
};

// Get odometer audit logs (FR-10)
const getOdometerLogs = async (req, res, next) => {
  const { id } = req.params;

  try {
    const [logs] = await pool.execute(
      `SELECT ol.*, u.name as recorded_by_name 
       FROM odometer_logs ol 
       JOIN users u ON ol.recorded_by_user_id = u.id 
       WHERE ol.vehicle_id = ? 
       ORDER BY ol.recorded_at DESC`,
      [id]
    );

    res.status(200).json({ logs });
  } catch (err) {
    next(err);
  }
};

// Get service history (FR-26)
const getServiceHistory = async (req, res, next) => {
  const { id } = req.params;

  try {
    const [history] = await pool.execute(
      `SELECT b.id, b.booking_date, b.booking_date as service_date, b.odometer_at_service, 
              sc.name as center_name, sc.name as service_center,
              b.mechanic_notes as work_done,
              COALESCE(bill.total_amount, 0) as total_amount, bill.bill_no, bill.id as bill_id
       FROM bookings b 
       JOIN service_centers sc ON b.service_center_id = sc.id 
       LEFT JOIN bills bill ON b.id = bill.booking_id 
       WHERE b.vehicle_id = ? AND b.status = 'COMPLETED' 
       ORDER BY b.booking_date DESC, b.id DESC`,
      [id]
    );

    res.status(200).json({ history });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateOdometer,
  getVehicleMaintenance,
  getOdometerLogs,
  getServiceHistory,
};
