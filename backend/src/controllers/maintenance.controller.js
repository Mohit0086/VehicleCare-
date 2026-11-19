/**
 * Maintenance Types & Catalog Controller
 * Implements SRS FR-11 to FR-16.
 */

const pool = require('../config/db');
const { calculateVehicleStatus } = require('../services/statusService');

// Get standard component catalog
const listTypes = async (req, res, next) => {
  try {
    const [types] = await pool.execute(
      'SELECT id, name, description, default_interval_km, default_interval_months FROM maintenance_types WHERE is_active = TRUE ORDER BY id ASC'
    );
    res.status(200).json({ types });
  } catch (err) {
    next(err);
  }
};

// Get maintenance status for a vehicle
const getMaintenanceByVehicle = async (req, res, next) => {
  const vehicle = req.vehicle;

  try {
    const [components] = await pool.execute(
      `SELECT vm.*, mt.name, mt.description, mt.default_interval_km, mt.default_interval_months 
       FROM vehicle_maintenance vm 
       JOIN maintenance_types mt ON vm.maintenance_type_id = mt.id 
       WHERE vm.vehicle_id = ? 
       ORDER BY mt.id ASC`,
      [vehicle.id]
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

module.exports = {
  listTypes,
  getMaintenanceByVehicle,
};
