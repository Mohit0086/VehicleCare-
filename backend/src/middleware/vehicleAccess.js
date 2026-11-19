const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { ROLES } = require('../utils/constants');

module.exports = async function requireVehicleAccess(req, res, next) {
  const id = req.params.vehicleId || req.params.id;
  try {
    const [[vehicle]] = await pool.execute(
      'SELECT id, user_id, current_km FROM vehicles WHERE id = ?',
      [id]
    );
    if (!vehicle || (req.user.role !== ROLES.ADMIN && vehicle.user_id !== req.user.id)) {
      return next(new AppError('Vehicle not found.', 404));
    }
    req.vehicle = vehicle;
    return next();
  } catch (err) {
    return next(err);
  }
};
